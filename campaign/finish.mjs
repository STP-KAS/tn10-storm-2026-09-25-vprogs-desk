// Join the open game as the desk wallet and play it to a finish.
// Player 1's mnemonic is WALLET_MNEMONIC. Player 2 is the desk wallet file.
// Neither secret is printed.
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  initSync,
  my_ids,
  network_params,
  join_game_tx,
  turn_tx,
  UtxoCandidate,
} from "file:///C:/Users/<user>/AppData/Local/Temp/enc-wasm/package/vprog_tictactoe_encoder_wasm.js";

const require = createRequire(
  "C:/Users/<user>/grok-test-cascade-work/wasm-sdk/kaspa-wasm32-sdk/examples/nodejs/javascript/transactions/simple-transaction.js"
);
globalThis.WebSocket = require("websocket").w3cwebsocket;
const kaspa = await import(
  pathToFileURL(
    "C:/Users/<user>/grok-test-cascade-work/wasm-sdk/kaspa-wasm32-sdk/nodejs/kaspa/kaspa.js"
  ).href
);

const GAME = "339bfef598e18806dc9eb07fa5ec2ce348c5f92a686694ee3b4a831e880c26f3";
const phrase1 = process.env.WALLET_MNEMONIC;
if (!phrase1) {
  console.log(JSON.stringify({ ok: false, error: "missing_player1" }));
  process.exit(2);
}
const desk = readFileSync(
  "C:/Users/<user>/Documents/kaspa/groks-wallet/secrets/wallet.txt",
  "utf8"
);
const phrase2 = desk
  .split(/\r?\n/)
  .find((l) => l.startsWith("mnemonic:"))
  .slice("mnemonic:".length)
  .trim();

initSync(
  readFileSync(
    "C:/Users/<user>/AppData/Local/Temp/enc-wasm/package/vprog_tictactoe_encoder_wasm_bg.wasm"
  )
);

const netId = new kaspa.NetworkId("testnet-10");
const params = network_params("testnet-10");
const configId = createHash("sha256").update(Buffer.from([4])).digest("hex");
const used = new Set();

function identity(phrase) {
  const key = new kaspa.PrivateKeyGenerator(
    new kaspa.XPrv(new kaspa.Mnemonic(phrase).toSeed("")),
    false,
    0n
  ).receiveKey(0);
  const address = key.toKeypair().toAddress(netId).toString();
  const priv = key.toString();
  const ids = my_ids(priv);
  return { priv, address, userId: ids.user_id_hex };
}

const p1 = identity(phrase1);
const p2 = identity(phrase2);

function hex(b) {
  return Buffer.from(b).toString("hex");
}
class Reader {
  constructor(b) {
    this.b = b;
    this.pos = 0;
  }
  u8() {
    return this.b[this.pos++];
  }
  u16() {
    const v = this.b[this.pos] | (this.b[this.pos + 1] << 8);
    this.pos += 2;
    return v;
  }
  u32() {
    const v =
      (this.b[this.pos] |
        (this.b[this.pos + 1] << 8) |
        (this.b[this.pos + 2] << 16) |
        (this.b[this.pos + 3] << 24)) >>>
      0;
    this.pos += 4;
    return v;
  }
  u64() {
    return BigInt(this.u32()) + 0x1_0000_0000n * BigInt(this.u32());
  }
  bytes(n) {
    const v = this.b.subarray(this.pos, this.pos + n);
    this.pos += n;
    return v;
  }
  vec() {
    return this.bytes(this.u32());
  }
}
function txFromBorsh(bytes) {
  const r = new Reader(bytes);
  const version = r.u16();
  const inputs = Array.from({ length: r.u32() }, () => {
    const transactionId = hex(r.bytes(32));
    const index = r.u32();
    const signatureScript = hex(r.vec());
    const sequence = r.u64();
    const input = {
      previousOutpoint: { transactionId, index },
      signatureScript,
      sequence,
      sigOpCount: 0,
    };
    if (r.u8() === 0) input.sigOpCount = r.u8();
    else input.computeBudget = r.u16();
    return input;
  });
  const outputs = Array.from({ length: r.u32() }, () => {
    const value = r.u64();
    const scriptPublicKey = { version: r.u16(), script: hex(r.vec()) };
    let covenant;
    if (r.u8() === 1) covenant = { authorizingInput: r.u16(), covenantId: hex(r.bytes(32)) };
    return { value, scriptPublicKey, covenant };
  });
  return {
    version,
    inputs,
    outputs,
    lockTime: r.u64(),
    subnetworkId: hex(r.bytes(20)),
    gas: r.u64(),
    payload: hex(r.vec()),
    storageMass: r.u64(),
    id: hex(r.bytes(32)),
  };
}

async function pick(address, min) {
  const dag = await (await fetch("https://api-tn10.kaspa.org/info/blockdag")).json();
  const tip = BigInt(dag.virtualDaaScore);
  const utxos = await (
    await fetch(`https://api-tn10.kaspa.org/addresses/${address}/utxos`)
  ).json();
  const rows = (Array.isArray(utxos) ? utxos : []).filter((u) => {
    const id = `${u.outpoint.transactionId}:${u.outpoint.index}`;
    const amt = BigInt(u.utxoEntry.amount);
    const born = BigInt(u.utxoEntry.blockDaaScore);
    const mature = !u.utxoEntry.isCoinbase || tip > born + 1000n;
    return !used.has(id) && amt >= min && mature;
  });
  rows.sort((a, b) => (BigInt(a.utxoEntry.amount) < BigInt(b.utxoEntry.amount) ? -1 : 1));
  if (!rows.length) throw new Error(`no utxo for ${min}`);
  const raw = rows[0];
  used.add(`${raw.outpoint.transactionId}:${raw.outpoint.index}`);
  return new UtxoCandidate(
    raw.outpoint.transactionId,
    raw.outpoint.index,
    BigInt(raw.utxoEntry.amount),
    raw.utxoEntry.scriptPublicKey.scriptPublicKey,
    0
  );
}

async function submit(bytes) {
  const tx = new kaspa.Transaction(txFromBorsh(bytes));
  const submitted = await rpc.submitTransaction({ transaction: tx, allowOrphan: false });
  return String(submitted.transactionId ?? tx.id);
}

async function game() {
  const res = await fetch(`https://vprogs-tt.izio.fr/api/games/${GAME}`);
  if (!res.ok) throw new Error(`game ${res.status}`);
  return res.json();
}

async function waitUntil(pred, label) {
  for (let i = 0; i < 20; i++) {
    const g = await game();
    if (pred(g)) return g;
    await new Promise((r) => setTimeout(r, 2000));
  }
  const last = await game();
  throw new Error(`${label} stuck at ${last.state_name} board=${last.board}`);
}

const rpc = new kaspa.RpcClient({
  resolver: new kaspa.Resolver(),
  networkId: netId,
  encoding: kaspa.Encoding.Borsh,
});
await rpc.connect();
const txids = [];
try {
  const state = await (await fetch("https://vprogs-tt.izio.fr/api/state")).json();
  const current = await game();
  const stake = BigInt(current.stake);
  const joinUtxo = await pick(p2.address, stake + 50_000_000n);
  const joinBytes = join_game_tx(
    p2.priv,
    params,
    joinUtxo,
    p2.address,
    state.lane_subnet,
    configId,
    GAME,
    stake,
    state.covenant_id
  );
  txids.push(await submit(joinBytes));
  let g = await waitUntil((row) => row.state_name !== "Open", "join");

  const plan = [
    [p1, 0],
    [p2, 3],
    [p1, 4],
    [p2, 6],
    [p1, 8],
  ];
  for (const [who, cell] of plan) {
    if (g.state_name !== "Playing") break;
    const opponent = who === p1 ? p2.userId : p1.userId;
    const utxo = await pick(who.address, 30_000_000n);
    const bytes = turn_tx(
      who.priv,
      params,
      utxo,
      who.address,
      state.lane_subnet,
      GAME,
      who.userId,
      opponent,
      cell
    );
    txids.push(await submit(bytes));
    const before = g.board.join("");
    g = await waitUntil(
      (row) => row.state_name !== "Playing" || row.board.join("") !== before,
      `turn ${cell}`
    );
  }
  console.log(
    JSON.stringify({
      ok: true,
      state: g.state_name,
      board: g.board,
      wins: g.round_wins,
      txids,
      p2: p2.userId,
    })
  );
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err.message || err), txids, p2: p2.userId }));
  process.exit(1);
} finally {
  await rpc.disconnect().catch(() => undefined);
}
