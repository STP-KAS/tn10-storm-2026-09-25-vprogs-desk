// Sign one TN10 transaction from receive/0 to receive/1.
// Prints the txid and amounts only.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const require = createRequire(
  "C:/Users/<user>/grok-test-cascade-work/wasm-sdk/kaspa-wasm32-sdk/examples/nodejs/javascript/transactions/simple-transaction.js"
);
globalThis.WebSocket = require("websocket").w3cwebsocket;
const sdkPath =
  "C:/Users/<user>/grok-test-cascade-work/wasm-sdk/kaspa-wasm32-sdk/nodejs/kaspa/kaspa.js";
const kaspa = await import(pathToFileURL(sdkPath).href);
kaspa.initConsolePanicHook?.();

const secret = readFileSync(
  "C:/Users/<user>/Documents/kaspa/groks-wallet/secrets/wallet.txt",
  "utf8"
);
const phrase = secret
  .split(/\r?\n/)
  .find((l) => l.startsWith("mnemonic:"))
  .slice("mnemonic:".length)
  .trim();
const seed = new kaspa.Mnemonic(phrase).toSeed("");
const xprv = new kaspa.XPrv(seed);
const gen = new kaspa.PrivateKeyGenerator(xprv, false, 0n);
const net = new kaspa.NetworkId("testnet-10");
const fromKey = gen.receiveKey(0);
const fromAddr = fromKey.toKeypair().toAddress(net).toString();
const toAddr = gen.receiveKey(1).toKeypair().toAddress(net).toString();

const utxoRes = await fetch(
  `https://api-tn10.kaspa.org/addresses/${fromAddr}/utxos`
);
if (!utxoRes.ok) {
  console.log(JSON.stringify({ ok: false, error: `utxo_http_${utxoRes.status}` }));
  process.exit(1);
}
const utxos = await utxoRes.json();
const dag = await (await fetch("https://api-tn10.kaspa.org/info/blockdag")).json();
const virtualDaa = BigInt(dag.virtualDaaScore);
const mature = utxos.filter((u) => {
  const born = BigInt(u.utxoEntry.blockDaaScore);
  return virtualDaa > born + 1000n && BigInt(u.utxoEntry.amount) >= 200000000n;
});
if (!mature.length) {
  console.log(JSON.stringify({ ok: false, error: "no_mature_utxo", utxos: utxos.length }));
  process.exit(4);
}
mature.sort((a, b) => (BigInt(a.utxoEntry.amount) < BigInt(b.utxoEntry.amount) ? -1 : 1));
const raw = mature[0];
const entry = {
  address: raw.address,
  outpoint: {
    transactionId: raw.outpoint.transactionId,
    index: raw.outpoint.index,
  },
  utxoEntry: {
    amount: BigInt(raw.utxoEntry.amount),
    scriptPublicKey: new kaspa.ScriptPublicKey(
      0,
      raw.utxoEntry.scriptPublicKey.scriptPublicKey
    ),
    blockDaaScore: BigInt(raw.utxoEntry.blockDaaScore),
    isCoinbase: Boolean(raw.utxoEntry.isCoinbase),
  },
};
const send = 100000000n;

const rpc = new kaspa.RpcClient({
  resolver: new kaspa.Resolver(),
  networkId: net,
  encoding: kaspa.Encoding.Borsh,
});
await rpc.connect();
try {
  const info = await rpc.getServerInfo();
  if (!info.isSynced) {
    console.log(JSON.stringify({ ok: false, error: "node_not_synced" }));
    process.exit(3);
  }
  const { transactions } = await kaspa.createTransactions({
    entries: [entry],
    outputs: [{ address: toAddr, amount: send }],
    priorityFee: 20000n,
    changeAddress: fromAddr,
    networkId: net,
    payload: Array.from(new TextEncoder().encode("desk-vprog-tn10")),
  });
  const keyHex = fromKey.toString();
  const signer =
    keyHex.length === 64 ? new kaspa.PrivateKey(keyHex) : fromKey;
  const txids = [];
  for (const pending of transactions) {
    await pending.sign([signer]);
    txids.push(String(await pending.submit(rpc)));
  }
  console.log(
    JSON.stringify({
      ok: true,
      fromIndex: 0,
      toIndex: 1,
      sompi: send.toString(),
      inputSompi: entry.utxoEntry.amount.toString(),
      keyLen: keyHex.length,
      txids,
      utxosOnFrom: utxos.length,
      matureCandidates: mature.length,
    })
  );
} catch (err) {
  console.log(
    JSON.stringify({
      ok: false,
      error: String(err.message || err),
      keyLen: fromKey.toString().length,
    })
  );
  process.exit(1);
} finally {
  await rpc.disconnect().catch(() => undefined);
}
