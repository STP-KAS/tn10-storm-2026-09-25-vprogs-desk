// Compare the public demo's last settlement with TN10's virtual DAA.
// Read-only. No key, no transaction.

const demo = process.env.VPROG_URL || "https://vprogs-tt.izio.fr";
const dagUrl = process.env.TN10_DAG || "https://api-tn10.kaspa.org/info/blockdag";

const state = await (await fetch(demo + "/api/state")).json();
const before = Number((await (await fetch(dagUrl)).json()).virtualDaaScore);
await new Promise((resolve) => setTimeout(resolve, 8000));
const after = Number((await (await fetch(dagUrl)).json()).virtualDaaScore);
const again = await (await fetch(demo + "/api/state")).json();

const rate = (after - before) / 8;
const gap = after - state.settled.daa_score;
const report = {
  takenAt: new Date().toISOString(),
  l2Tip: again.l2_tip,
  tipMoved: again.l2_tip - state.l2_tip,
  settledTx: state.settled.txid,
  settlementMoved: state.settled.txid !== again.settled.txid,
  settledDaa: state.settled.daa_score,
  virtualDaa: after,
  daaPerSecond: Math.round(rate * 100) / 100,
  gapDaa: gap,
  lagMinutes: Math.round((gap / rate / 60) * 10) / 10,
};

process.stdout.write(JSON.stringify(report, null, 2) + "\n");
