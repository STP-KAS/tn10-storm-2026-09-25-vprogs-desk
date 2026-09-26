// Play one game on the live TN10 tic-tac-toe lane.
// The mnemonic arrives in WALLET_MNEMONIC. This file does not contain it.
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  initSync,
  my_ids,
  network_params,
  create_game_tx,
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
kaspa.initConsolePanicHook?.();

const EXPECTED =
  "kaspatest:qrw0tuxnjukkrk7lm5v7chx4qpu8f8q0janp7jdk80z4tc8anu62gmvkwdwrt";
const STAKE = 100_000_000n;
const phrase = process.env.WALLET_MNEMONIC;
if (!phrase) {
  console.log(JSON.stringify({ ok: false, error: "missing_mnemonic" }));
  process.exit(2);
}

initSync(
  readFileSync(
    "C:/Users/<user>/AppData/Local/Temp/enc-wasm/package/vprog_tictactoe_encoder_wasm_bg.wasm"
  )
);

const net = new kaspa.NetworkId("testnet-10");
const key = new kaspa.PrivateKeyGenerator(
  new kaspa.XPrv(new kaspa.Mnemonic(phrase).toSeed("")),
  false,
  0n
).receiveKey(0);
const address = key.toKeypair().toAddress(net).toString();
if (address !== EXPECTED) {
  console.log(JSON.stringify({ ok: false, error: "address_mismatch" }));
  process.exit(3);
}
const privHex = key.toString();
const ids = my_ids(privHex);
const configId = createHash("sha256").update(Buffer.from([4])).digest("hex");

const state = await (await fetch("https://vprogs-tt.izio.fr/api/state")).json();
const accountRes = await fetch(
  `https://vprogs-tt.izio.fr/api/accounts/${ids.user_id_hex}`
);
const gamesStarted =
  accountRes.status === 200 ? BigInt((await accountRes.json()).games_started ?? 0) : 0n;

const dag = await (await fetch("https://api-tn10.kaspa.org/info/blockdag")).json();
const virtualDaa = BigInt(dag.virtualDaaScore);
const utxos = await (
  await fetch(`https://api-tn10.kaspa.org/addresses/${address}/utxos`)
).json();
const list = Array.isArray(utxos) ? utxos : [];
const need = STAKE + 50_000_000n;
const mature = list.filter((u) => {
  const amt = BigInt(u.utxoEntry.amount);
  const born = BigInt(u.utxoEntry.blockDaaScore);
  return amt >= need && virtualDaa > born + 1000n;
});
mature.sort((a, b) =>
  BigInt(a.utxoEntry.amount) < BigInt(b.utxoEntry.amount) ? -1 : 1
);

const report = {
  address,
  userId: ids.user_id_hex,
  gamesStarted: gamesStarted.toString(),
  utxos: list.length,
  mature: mature.length,
  configId,
  lane: state.lane_subnet,
  covenant: state.covenant_id,
};

if (!mature.length) {
  const bal = await (
    await fetch(`https://api-tn10.kaspa.org/addresses/${address}/balance`)
  ).json();
  console.log(
    JSON.stringify({ ok: false, error: "unfunded", balance: String(bal.balance ?? 0), ...report })
  );
  process.exit(4);
}

const raw = mature[0];
const params = network_params("testnet-10");
const utxo = new UtxoCandidate(
  raw.outpoint.transactionId,
  raw.outpoint.index,
  BigInt(raw.utxoEntry.amount),
  raw.utxoEntry.scriptPublicKey.scriptPublicKey,
  0
);
const bytes = create_game_tx(
  privHex,
  params,
  utxo,
  address,
  state.lane_subnet,
  configId,
  gamesStarted,
  STAKE,
  1,
  1,
  STAKE,
  state.covenant_id
);

function hex(bytes) {
  return Buffer.from(bytes).toString("hex");
}
class Reader {
  pos = 0;
  constructor(b) {
    this.b = b;
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
const txObj = {
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

const rpc = new kaspa.RpcClient({
  resolver: new kaspa.Resolver(),
  networkId: net,
  encoding: kaspa.Encoding.Borsh,
});
await rpc.connect();
try {
  const tx = new kaspa.Transaction(txObj);
  const submitted = await rpc.submitTransaction({ transaction: tx, allowOrphan: false });
  const txid = String(submitted.transactionId ?? tx.id);
  await new Promise((resolve) => setTimeout(resolve, 8000));
  const after = await fetch(`https://vprogs-tt.izio.fr/api/accounts/${ids.user_id_hex}`);
  const games = await (await fetch("https://vprogs-tt.izio.fr/api/games")).json();
  const mine = (games.games || []).filter((g) =>
    JSON.stringify(g).includes(ids.user_id_hex)
  );
  console.log(
    JSON.stringify({
      ok: true,
      txid,
      userId: ids.user_id_hex,
      accountStatus: after.status,
      gamesSeen: mine.length,
      stake: STAKE.toString(),
    })
  );
} catch (err) {
  console.log(
    JSON.stringify({
      ok: false,
      error: String(err.message || err),
      userId: ids.user_id_hex,
      outputs: outputs.length,
    })
  );
  process.exit(1);
} finally {
  await rpc.disconnect().catch(() => undefined);
}
