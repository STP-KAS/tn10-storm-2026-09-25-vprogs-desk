// Desk model of a second vprog: a best-of commit-reveal duel.
// It is not a RISC0 guest and it is not on kaspanet/vprogs.
// The early-clinch rule matches vprog-tictactoe guest/src/program/rules.rs at ba05d924.
// The reorg guard matches the unapplied patch against l1/bridge/src/worker.rs at 3a61c0b.

import { createHash } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";

export function guestMatchOutcome(roundsTotal, wins, draws) {
  const completed = wins[0] + wins[1] + draws;
  const remaining = Math.max(0, roundsTotal - completed);
  if (wins[0] > wins[1] + remaining) return "First";
  if (wins[1] > wins[0] + remaining) return "Second";
  if (remaining === 0) {
    if (wins[0] > wins[1]) return "First";
    if (wins[1] > wins[0]) return "Second";
    return "Draw";
  }
  return null;
}

export function strictOutcome(roundsTotal, wins, draws) {
  const completed = wins[0] + wins[1] + draws;
  if (!Number.isInteger(roundsTotal) || roundsTotal < 1) return { error: "rounds" };
  if (completed > roundsTotal) return { error: "counters exceed rounds" };
  const state = guestMatchOutcome(roundsTotal, wins, draws);
  return { state };
}

export function bridgeReorgAsWritten(childKnown, parentId, parentHasMeta) {
  if (!childKnown) return { error: "ReorgBelowRoot" };
  return { rollsTo: parentId, parentWasPresent: parentHasMeta };
}

export function bridgeReorgGuarded(childKnown, parentId, parentHasMeta) {
  if (!childKnown) return { error: "ReorgBelowRoot" };
  if (parentId !== 0 && !parentHasMeta) return { error: "ReorgBelowRoot" };
  return { rollsTo: parentId };
}

const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };

export function commitOf(nonce, move) {
  return createHash("sha256").update(`${nonce}:${move}`).digest("hex");
}

export function createDuel(stake, rounds) {
  if (!Number.isInteger(stake) || stake <= 0) return { error: "stake must be positive" };
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 255) return { error: "rounds" };
  return {
    stake,
    rounds,
    state: "Open",
    wins: [0, 0],
    draws: 0,
    commits: [null, null],
    pot: 0,
    seats: [null, null],
  };
}

function roundIndex(g) {
  return g.wins[0] + g.wins[1] + g.draws;
}

function finishIfDecided(g) {
  const state = guestMatchOutcome(g.rounds, g.wins, g.draws);
  if (state) {
    g.state = state;
    g.commits = [null, null];
  }
}

export function join(g, seat, name) {
  if (g.state !== "Open") return { error: "not open" };
  if (seat !== 0 && seat !== 1) return { error: "seat" };
  if (g.seats[seat]) return { error: "taken" };
  g.seats[seat] = name;
  g.pot += g.stake;
  if (g.seats[0] && g.seats[1]) g.state = "Commit";
  return { ok: true };
}

export function commit(g, seat, hash) {
  if (g.state !== "Commit") return { error: "not commit phase" };
  if (g.commits[seat]) return { error: "already committed" };
  if (typeof hash !== "string" || hash.length !== 64) return { error: "hash" };
  g.commits[seat] = hash;
  if (g.commits[0] && g.commits[1]) g.state = "Reveal";
  return { ok: true };
}

export function reveal(g, seat, nonce, move) {
  if (g.state !== "Reveal") return { error: "not reveal phase" };
  if (!BEATS[move]) return { error: "move" };
  if (commitOf(nonce, move) !== g.commits[seat]) return { error: "reveal mismatch" };
  g.reveals = g.reveals || [null, null];
  if (g.reveals[seat]) return { error: "already revealed" };
  g.reveals[seat] = move;
  if (!(g.reveals[0] && g.reveals[1])) return { ok: true };
  const a = g.reveals[0];
  const b = g.reveals[1];
  if (a === b) g.draws += 1;
  else if (BEATS[a] === b) g.wins[0] += 1;
  else g.wins[1] += 1;
  g.reveals = [null, null];
  g.commits = [null, null];
  finishIfDecided(g);
  if (g.state === "Reveal" || g.state === "Commit") g.state = "Commit";
  return { ok: true, state: g.state };
}

export function payout(g) {
  if (g.state === "First") return [g.pot, 0];
  if (g.state === "Second") return [0, g.pot];
  if (g.state === "Draw") {
    const half = Math.floor(g.pot / 2);
    return [half, g.pot - half];
  }
  return null;
}

test("guest early clinch matches the tic-tac-toe examples", () => {
  assert.equal(guestMatchOutcome(5, [3, 0], 0), "First");
  assert.equal(guestMatchOutcome(5, [0, 3], 0), "Second");
  assert.equal(guestMatchOutcome(5, [2, 1], 0), null);
  assert.equal(guestMatchOutcome(5, [2, 2], 1), "Draw");
  assert.equal(guestMatchOutcome(1, [1, 0], 0), "First");
});

test("saturating counters invent a finished match", () => {
  assert.equal(guestMatchOutcome(1, [0, 0], 5), "Draw");
  assert.deepEqual(strictOutcome(1, [0, 0], 5), { error: "counters exceed rounds" });
});

test("the written reorg rolls to a missing parent and the guard refuses it", () => {
  assert.deepEqual(bridgeReorgAsWritten(true, 4, false), { rollsTo: 4, parentWasPresent: false });
  assert.deepEqual(bridgeReorgGuarded(true, 4, false), { error: "ReorgBelowRoot" });
  assert.deepEqual(bridgeReorgGuarded(true, 0, false), { rollsTo: 0 });
  assert.deepEqual(bridgeReorgGuarded(false, 0, false), { error: "ReorgBelowRoot" });
});

test("a duel rejects zero stake, a bad reveal, and pays the early winner", () => {
  assert.equal(createDuel(0, 3).error, "stake must be positive");
  const g = createDuel(100, 3);
  assert.equal(join(g, 0, "a").ok, true);
  assert.equal(join(g, 1, "b").ok, true);
  assert.equal(g.pot, 200);
  const ha = commitOf("na", "rock");
  const hb = commitOf("nb", "scissors");
  assert.equal(commit(g, 0, ha).ok, true);
  assert.equal(commit(g, 1, hb).ok, true);
  assert.equal(reveal(g, 0, "na", "paper").error, "reveal mismatch");
  assert.equal(g.state, "Reveal");
  assert.equal(reveal(g, 0, "na", "rock").ok, true);
  assert.equal(reveal(g, 1, "nb", "scissors").ok, true);
  assert.deepEqual(g.wins, [1, 0]);
  assert.equal(g.state, "Commit");
  commit(g, 0, commitOf("n2", "paper"));
  commit(g, 1, commitOf("m2", "rock"));
  reveal(g, 0, "n2", "paper");
  reveal(g, 1, "m2", "rock");
  assert.equal(g.state, "First");
  assert.deepEqual(payout(g), [200, 0]);
  assert.equal(commit(g, 0, ha).error, "not commit phase");
});

test("a draw returns every sompi and an odd pot does not mint one", () => {
  const g = createDuel(1, 1);
  join(g, 0, "a");
  join(g, 1, "b");
  commit(g, 0, commitOf("x", "rock"));
  commit(g, 1, commitOf("y", "rock"));
  reveal(g, 0, "x", "rock");
  reveal(g, 1, "y", "rock");
  assert.equal(g.state, "Draw");
  assert.deepEqual(payout(g), [1, 1]);
  g.pot = 3;
  const odd = payout(g);
  assert.equal(odd[0] + odd[1], 3);
  assert.deepEqual(odd, [1, 2]);
});
