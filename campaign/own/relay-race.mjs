// A second desk vprog: a checkpoint relay.
// Two seats lock a positive stake, commit a time, then reveal it.
// The lower time takes the checkpoint. A tie scores a draw.
// Early clinch is the same rule as tic-tac-toe at ba05d924.
// This file does not submit a transaction and does not hold a key.

import { createHash } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";

export function clinch(checkpoints, wins, draws) {
  const done = wins[0] + wins[1] + draws;
  if (done > checkpoints) return { error: "counters exceed checkpoints" };
  const left = checkpoints - done;
  if (wins[0] > wins[1] + left) return { state: "First" };
  if (wins[1] > wins[0] + left) return { state: "Second" };
  if (left === 0) {
    if (wins[0] > wins[1]) return { state: "First" };
    if (wins[1] > wins[0]) return { state: "Second" };
    return { state: "Draw" };
  }
  return { state: null };
}

export function commitOf(nonce, hours) {
  return createHash("sha256").update(`${nonce}:${hours}`).digest("hex");
}

export function createRace(stake, checkpoints) {
  if (!Number.isInteger(stake) || stake <= 0) return { error: "stake must be positive" };
  if (!Number.isInteger(checkpoints) || checkpoints < 1 || checkpoints > 16) {
    return { error: "checkpoints" };
  }
  return {
    stake,
    checkpoints,
    state: "Open",
    wins: [0, 0],
    draws: 0,
    pot: 0,
    seats: [null, null],
    commits: [null, null],
    reveals: [null, null],
  };
}

function finish(g) {
  const out = clinch(g.checkpoints, g.wins, g.draws);
  if (out.error) {
    g.state = "Broken";
    g.error = out.error;
    return;
  }
  if (out.state) {
    g.state = out.state;
    g.commits = [null, null];
    g.reveals = [null, null];
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

export function reveal(g, seat, nonce, hours) {
  if (g.state !== "Reveal") return { error: "not reveal phase" };
  if (!Number.isInteger(hours) || hours < 0 || hours > 1000) return { error: "hours" };
  if (commitOf(nonce, hours) !== g.commits[seat]) return { error: "reveal mismatch" };
  if (g.reveals[seat] !== null) return { error: "already revealed" };
  g.reveals[seat] = hours;
  if (g.reveals[0] === null || g.reveals[1] === null) return { ok: true };
  const a = g.reveals[0];
  const b = g.reveals[1];
  if (a === b) g.draws += 1;
  else if (a < b) g.wins[0] += 1;
  else g.wins[1] += 1;
  g.commits = [null, null];
  g.reveals = [null, null];
  finish(g);
  if (g.state === "Reveal") g.state = "Commit";
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

function playPair(g, nonceA, hoursA, nonceB, hoursB) {
  const step = commit(g, 0, commitOf(nonceA, hoursA));
  if (step.error) return step;
  const stepB = commit(g, 1, commitOf(nonceB, hoursB));
  if (stepB.error) return stepB;
  const revA = reveal(g, 0, nonceA, hoursA);
  if (revA.error) return revA;
  return reveal(g, 1, nonceB, hoursB);
}

test("a shorter time takes the checkpoint and an early lead ends the race", () => {
  const g = createRace(5, 3);
  assert.equal(join(g, 0, "a").ok, true);
  assert.equal(join(g, 1, "b").ok, true);
  assert.equal(g.pot, 10);
  playPair(g, "a1", 4, "b1", 9);
  assert.deepEqual(g.wins, [1, 0]);
  playPair(g, "a2", 3, "b2", 8);
  assert.equal(g.state, "First");
  assert.deepEqual(payout(g), [10, 0]);
  assert.equal(commit(g, 0, commitOf("z", 1)).error, "not commit phase");
});

test("zero stake, a bad reveal, and a tied race are refused or split", () => {
  assert.equal(createRace(0, 3).error, "stake must be positive");
  const g = createRace(2, 1);
  join(g, 0, "a");
  join(g, 1, "b");
  commit(g, 0, commitOf("n", 5));
  commit(g, 1, commitOf("m", 5));
  assert.equal(reveal(g, 0, "n", 6).error, "reveal mismatch");
  assert.equal(g.state, "Reveal");
  reveal(g, 0, "n", 5);
  reveal(g, 1, "m", 5);
  assert.equal(g.state, "Draw");
  const paid = payout(g);
  assert.equal(paid[0] + paid[1], g.pot);
});

test("one thousand races conserve every sompi", () => {
  let minted = 0;
  let finished = 0;
  let first = 0;
  let second = 0;
  let draws = 0;
  for (let i = 0; i < 1000; i++) {
    const stake = 1 + (i % 7);
    const checkpoints = 1 + (i % 5);
    const g = createRace(stake, checkpoints);
    join(g, 0, "a");
    join(g, 1, "b");
    let guard = 0;
    while (g.state === "Commit" || g.state === "Reveal") {
      const ha = (i + guard) % 11;
      const hb = (i * 3 + guard) % 11;
      const step = playPair(g, `a${i}-${guard}`, ha, `b${i}-${guard}`, hb);
      assert.equal(step.error, undefined);
      guard += 1;
      assert.ok(guard <= checkpoints);
    }
    const paid = payout(g);
    assert.ok(paid);
    minted += paid[0] + paid[1] - g.pot;
    finished += 1;
    if (g.state === "First") first += 1;
    else if (g.state === "Second") second += 1;
    else if (g.state === "Draw") draws += 1;
    else assert.fail(g.state);
  }
  assert.equal(minted, 0);
  assert.equal(finished, 1000);
  assert.equal(first + second + draws, 1000);
  assert.ok(first > 0 && second > 0);
});

test("a bad reveal inside the fleet does not move the pot", () => {
  let refused = 0;
  for (let i = 0; i < 50; i++) {
    const g = createRace(3, 2);
    join(g, 0, "a");
    join(g, 1, "b");
    const pot = g.pot;
    commit(g, 0, commitOf("n", 4));
    commit(g, 1, commitOf("m", 6));
    const bad = reveal(g, 0, "n", 5);
    if (bad.error === "reveal mismatch") refused += 1;
    assert.equal(g.pot, pot);
    assert.equal(g.state, "Reveal");
  }
  assert.equal(refused, 50);
});
