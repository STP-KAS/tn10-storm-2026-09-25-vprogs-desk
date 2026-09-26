import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(
  "C:/Users/<user>/grok-test-cascade-work/wasm-sdk/kaspa-wasm32-sdk/examples/nodejs/javascript/transactions/simple-transaction.js"
);
globalThis.WebSocket = require("websocket").w3cwebsocket;
const sdkPath =
  "C:/Users/<user>/grok-test-cascade-work/wasm-sdk/kaspa-wasm32-sdk/nodejs/kaspa/kaspa.js";
const kaspa = await import(pathToFileURL(sdkPath).href);
kaspa.initConsolePanicHook?.();

const net = new kaspa.NetworkId("testnet-10");
const rpc = new kaspa.RpcClient({
  resolver: new kaspa.Resolver(),
  networkId: net,
  encoding: kaspa.Encoding.Borsh,
});
const timer = setTimeout(() => {
  console.log(JSON.stringify({ ok: false, error: "timeout" }));
  process.exit(2);
}, 25000);
try {
  await rpc.connect();
  const info = await rpc.getServerInfo();
  console.log(
    JSON.stringify({
      ok: true,
      isSynced: info.isSynced,
      serverVersion: info.serverVersion ?? null,
      networkId: String(info.networkId ?? "testnet-10"),
    })
  );
} catch (err) {
  console.log(JSON.stringify({ ok: false, error: String(err.message || err) }));
  process.exit(1);
} finally {
  clearTimeout(timer);
  await rpc.disconnect().catch(() => undefined);
}
