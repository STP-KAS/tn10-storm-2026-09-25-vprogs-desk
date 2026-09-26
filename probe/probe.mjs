// Read-only look at the public tic-tac-toe data server.
// It does not send a key, a transaction, or a POST.

const base = process.env.VPROG_URL || "https://vprogs-tt.izio.fr";

async function get(path) {
  const res = await fetch(base + path);
  const text = await res.text();
  let body = text;
  if (text.startsWith("{") || text.startsWith("[")) body = JSON.parse(text);
  return { status: res.status, body };
}

function summarizeExits(payload) {
  const roots = payload.roots || [];
  let leaves = 0;
  let unspent = 0;
  const daa = [];
  for (const root of roots) {
    daa.push(root.daa_score);
    for (const leaf of root.leaves || []) {
      leaves += 1;
      if (!leaf.spent) unspent += 1;
    }
  }
  return {
    roots: roots.length,
    leaves,
    unspent,
    daaMin: daa.length ? Math.min(...daa) : null,
    daaMax: daa.length ? Math.max(...daa) : null,
  };
}

function summarizeGames(payload) {
  return (payload.games || []).map((game) => ({
    state: game.state_name,
    stake: game.stake,
    pot: game.pot,
    rounds: game.rounds_total,
    players: (game.players || []).filter(Boolean).length,
    lastMoveAt: game.last_move_at,
  }));
}

const first = await get("/api/state");
await new Promise((resolve) => setTimeout(resolve, 4000));
const second = await get("/api/state");
const games = await get("/api/games");
const exits = await get("/api/exits");
const post = await fetch(base + "/api/games", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: "{}",
});

const a = first.body;
const b = second.body;
const dt = 4;
const tipDelta = b.l2_tip - a.l2_tip;

const snapshot = {
  takenAt: new Date().toISOString(),
  url: base,
  http: {
    state: first.status,
    games: games.status,
    exits: exits.status,
    postGames: post.status,
  },
  covenantId: a.covenant_id,
  depositAddress: a.deposit_address,
  laneSubnet: a.lane_subnet,
  firstTip: a.l2_tip,
  secondTip: b.l2_tip,
  tipPerSecond: tipDelta / dt,
  settlementUnchanged: a.settled.txid === b.settled.txid,
  settled: {
    txid: a.settled.txid,
    daaScore: a.settled.daa_score,
    stateRoot: a.settled.state_root,
  },
  games: summarizeGames(games.body),
  exits: summarizeExits(exits.body),
};

process.stdout.write(JSON.stringify(snapshot, null, 2) + "\n");
