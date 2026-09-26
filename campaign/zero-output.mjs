// Ask TN10 to accept a zero-value output. Expect a refusal.
// Prints the refusal only. No key material.
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
const net = new kaspa.NetworkId("testnet-10");
const fromKey = new kaspa.PrivateKeyGenerator(
  new kaspa.XPrv(new kaspa.Mnemonic(phrase).toSeed("")),
  false,
  0n
).receiveKey(0);
const fromAddr = fromKey.toKeypair().toAddress(net).toString();
const utxos = await (
  await fetch(`https://api-tn10.kaspa.org/addresses/${fromAddr}/utxos`)
).json();
const dag = await (await fetch("https://api-tn10.kaspa.org/info/blockdag")).json();
const virtualDaa = BigInt(dag.virtualDaaScore);
const mature = utxos.filter((u) => {
  const born = BigInt(u.utxoEntry.blockDaaScore);
  const amt = BigInt(u.utxoEntry.amount);
  return virtualDaa > born + 1000n && amt >= 200000000n && amt <= 500000000n;
});
if (!mature.length) {
  console.log(JSON.stringify({ ok: false, error: "no_small_mature_utxo" }));
  process.exit(4);
}
const raw = mature[0];
const entry = {
  address: raw.address,
  outpoint: raw.outpoint,
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
const rpc = new kaspa.RpcClient({
  resolver: new kaspa.Resolver(),
  networkId: net,
  encoding: kaspa.Encoding.Borsh,
});
await rpc.connect();
try {
  const { transactions } = await kaspa.createTransactions({
    entries: [entry],
    outputs: [{ address: fromAddr, amount: 0n }],
    priorityFee: 20000n,
    changeAddress: fromAddr,
    networkId: net,
    payload: Array.from(new TextEncoder().encode("desk-zero-output")),
  });
  const signer = new kaspa.PrivateKey(fromKey.toString());
  const txids = [];
  for (const pending of transactions) {
    await pending.sign([signer]);
    txids.push(String(await pending.submit(rpc)));
  }
  console.log(JSON.stringify({ ok: true, accepted: true, txids }));
} catch (err) {
  console.log(JSON.stringify({ ok: true, accepted: false, error: String(err.message || err) }));
} finally {
  await rpc.disconnect().catch(() => undefined);
}
