// Sum public TN10 balances for the saved miner list and see which
// ones this wallet can derive. Never prints a key or a mnemonic.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const sdkPath =
  "C:/Users/<user>/grok-test-cascade-work/wasm-sdk/kaspa-wasm32-sdk/nodejs/kaspa/kaspa.js";
const kaspa = await import(pathToFileURL(sdkPath).href);
kaspa.initConsolePanicHook?.();

const secret = readFileSync(
  "C:/Users/<user>/Documents/kaspa/groks-wallet/secrets/wallet.txt",
  "utf8"
);
const mnemonicLine = secret.split(/\r?\n/).find((l) => l.startsWith("mnemonic:"));
const phrase = mnemonicLine.slice("mnemonic:".length).trim();
const seed = new kaspa.Mnemonic(phrase).toSeed("");
const xprv = new kaspa.XPrv(seed);
const gen = new kaspa.PrivateKeyGenerator(xprv, false, 0n);
const net = new kaspa.NetworkId("testnet-10");

const watch = readFileSync(
  "C:/Users/<user>/Documents/kaspa/groks-wallet/logs/tn10-watch-addresses.txt",
  "utf8"
)
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l.startsWith("kaspatest:"));
const wanted = new Set(watch);

const derived = new Map();
for (let i = 0; i < 5000; i++) {
  const recv = gen.receiveKey(i).toKeypair().toAddress(net).toString();
  if (wanted.has(recv)) derived.set(recv, `receive/${i}`);
  const change = gen.changeKey(i).toKeypair().toAddress(net).toString();
  if (wanted.has(change)) derived.set(change, `change/${i}`);
}

async function balance(address) {
  const res = await fetch(
    `https://api-tn10.kaspa.org/addresses/${address}/balance`
  );
  if (!res.ok) return { address, error: res.status };
  const body = await res.json();
  return { address, sompi: String(body.balance ?? "0"), path: derived.get(address) || null };
}

const rows = [];
for (const address of watch) {
  rows.push(await balance(address));
}
let total = 0n;
let funded = 0;
let derivable = 0;
for (const row of rows) {
  if (!row.sompi) continue;
  const n = BigInt(row.sompi);
  if (n > 0n) funded++;
  total += n;
  if (row.path) derivable++;
}
console.log(
  JSON.stringify(
    {
      watch: watch.length,
      derivedMatches: derived.size,
      funded,
      derivableFunded: rows.filter((r) => r.path && r.sompi && BigInt(r.sompi) > 0n).length,
      totalSompi: total.toString(),
      totalTkas: (Number(total) / 1e8).toFixed(4),
    },
    null,
    2
  )
);
