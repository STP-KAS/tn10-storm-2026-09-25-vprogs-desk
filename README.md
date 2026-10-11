> **Experimental only. Not a product.**
>
> Do not use wallet integrations on this GitHub. STP remains a clown. [DISCLAIMER.md](DISCLAIMER.md)
>
> **Part of [tn-master](https://github.com/STP-KAS/tn-master)**, the map of every TN10 storm. Renamed on 11 Oct 2026 from `vprogs-tn-desk-public`; old links redirect here.
>
> ← previous storm: [tn10-storm-2026-09-25-r2](https://github.com/STP-KAS/tn10-storm-2026-09-25-r2) | next storm: [tn10-storm-2026-09-26-bot-opinion](https://github.com/STP-KAS/tn10-storm-2026-09-26-bot-opinion) →

# SilverScript v1 and the vprogs testnet demo

> Clean public copy (history squashed) of a private working repo.
>
> **Copy of private repo `STP-KAS/tn10-storm-2026-09-25-vprogs-desk-private` (history squashed for privacy).** Originally created **25 Sep 2026 17:18 CEST**, last updated **26 Sep 2026 05:03 CEST**. The desk note records one pass on **25 Sep 2026** (API snapshot 17:17 CEST), plus the Windows desk campaign opened **25 Sep 2026 23:51 CEST** and planned to run until **26 Sep 2026 04:55 CEST**. The single commit here is dated 26 Sep 2026 only because history was squashed. Local user paths were replaced with `<user>` and email addresses were removed.

Experimental desk note. Not Kaspa core. Not an audit. Not advice.

This folder is the record of one pass on 25 Sep 2026. It explains the two programmability changes that are actually in front of us, what was run, and what broke or stayed open.

## Why these two are different

Kaspa's programmability work split into two paths.

The first path is a contract on the L1 itself. You write it in SilverScript. The compiler turns it into Kaspa script. The covenant runs inside the node, on the UTXO it guards. There is no separate prover and no second chain. SilverScript v1.0.0 is the tagged compiler for that path. The tag is real. A merged Active KIP is still the rule for what the chain accepts. The compiler is the tool, not a new consensus release.

The second path is a verifiable program that follows Kaspa's order and later settles back with a proof. That is the vprogs work. The tic-tac-toe page is a hosted demo of one guest on that path. The framework it pins is an open draft branch. It is not a GitHub release, and it is not on `kaspanet/vprogs` master.

Sutton's 3 Apr 2026 essay named these as the two pillars, and said synchronous vprogs were not what Toccata shipped. Toccata is live. SilverScript v1.0.0 is tagged. The vprogs demo is the second pillar running as a proof of concept, with the review stack still open.

## What changed

### SilverScript

- Release [v1.0.0](https://github.com/kaspanet/silverscript/releases/tag/v1.0.0), commit `3ed9733`, 9 Sep 2026. The local checkout is that tag.
- Ori's announcement is the release. The same day he said the KCC-20 standard is not finished and that `kcc20.sil` in the repo is a proof of concept. The README at the tag still does not say that.
- This pass compiled `l1-floor.sil` with that compiler. The contract is `DeskFloor`. Its one entry, `check`, refuses an integer under the constructor floor. The artifact is `l1-floor.json`.
- The artifact's own `compiler_version` is `0.1.0`. That string is `COMPILER_VERSION` in `silverscript-lang/src/compiler/mod.rs`. The pragma check refuses a requirement the compiler version does not satisfy. `^0.1.0` means at least 0.1.0 and below 0.2.0. Setting the constant to `1.0.0` would reject every contract that still says `pragma silverscript ^0.1.0`, including the examples and `l1-floor.sil`. The GitHub tag v1.0.0 and the language version are two different numbers. Leave the constant at `0.1.0` until the language itself breaks. Say that in the release notes, or add a separate release field. Do not overwrite the stamp.
- Nothing from this contract was broadcast. KCC-20 on `kaspanet/kccs` main is still Draft.

### The vprogs testnet demo

- `kaspanet/vprogs` master is still `f9b84a8` (28 Jul 2026). No release tag.
- Branch `release-candidate` is still `3a61c0ba608b`, the same commit as draft pull 164. Rechecked 25 Sep 2026 during this pass.
- `biryukovmaxim/vprog-tictactoe` master is still `ba05d924`. Its lock pins that same commit. The README in that repo still tells you to check out the older branch `fix/g2-access-read-enforcement`.
- The page https://vprogs-tt.izio.fr/ is up. It is a Vite development server. The data API is on the same host.

A read at 2026-09-25T15:17:16Z, saved in `snapshot.json`:

| Reading | Value |
| --- | --- |
| L2 tip, then 4 seconds later | 483655, then 483679 (about 6 a second) |
| Last settlement | tx `4bf9b325b448316f78a77ce5e22545eabb8a75090e549d01f3e4886a0557e017`, DAA 580137056 |
| Settlement during those 4 seconds | unchanged |
| Covenant | `85165a6f453dbbd1e968c238966e297046b8f1d22c00fee1bc208de00c3fb097` |
| Deposit address | `kaspatest:prq3aw079nzygqz9uj9jhjfwrps0k7x0fwr6s09wemtxqytvxn4960smyz5v8` |
| Games | 2, both `Open`, one player each, `last_move_at` 0 |
| Stakes | 500000000 and 50000000 sompi |
| Pots | 1000000000 and 100000000 sompi |
| Exit roots | 11, from DAA 579220923 through 580137056 |
| Exit leaves | 13, of which 11 are unspent |
| `POST /api/games` with `{}` | HTTP 405 |

The execution tip is moving. The last settlement is not. Eleven of the thirteen recorded exits have not been claimed. Both games are waiting for a second player and have never had a move.

## How this pass was run

1. The public data API was read with `probe/probe.mjs`. The script sends GET requests and one empty POST so the status code can be recorded. It does not send a key or a transaction.
2. The desk key was not typed into that page. A third-party development server that asks for a private key is not a place for this wallet.
3. The halted local TN10 node was not started.
4. `model/rules.test.mjs` was run with Node. Seven tests passed. They encode the settler decision and the reorg-floor behavior read from commit `3a61c0ba608b`. They do not load the RISC Zero crate.
5. `silverc` from the v1.0.0 checkout compiled `l1-floor.sil`. The SilverScript repo was left clean.
6. Building `vprogs-zk-backend-risc0-settler` on this Windows desk failed earlier the same day. `risc0-zkvm` 3.0.5 asks for Unix sockets, and the circuit kernels want C++20 while the build script passes C++17. That result stands. The green test lines in the pulls are the author's.

Run the two local checks again from this folder:

```
node --test model/rules.test.mjs
node probe/probe.mjs
```

## Flaws, and what would address them

The settlement receipt is the live problem. TN10's virtual DAA was moving at about 8.4 a second (`api-tn10.kaspa.org`, a 10 second sample). The demo's last settlement stayed on transaction `4bf9b325b448316f78a77ce5e22545eabb8a75090e549d01f3e4886a0557e017` at DAA 580137056. By 15:23Z the chain was at 580183263, 46207 scores ahead, and the settlement transaction had still not changed. The follower tip was at 485527 and still climbing, so the process is ingesting. The exit roots before this stall were 10 minutes apart and then 2.6 minutes apart. An hour and a half of silence is not that cadence. Draft 164 skips a bundle that does not chain after the watch is adopted, and the pull says a reorg can still rebuild bundles over a range that already settled. If those duplicates are all the prover emits, the skip loop runs and the receipt never moves while the chain runs away. The repair is on the prover side: the next bundle has to start at the unsealed suffix. A run of skips while the chain DAA advances should be a loud failure, not a quiet continue. `probe/settle-lag.mjs` prints the gap.

Issue 126 is still in the pinned commit. `ChainSink` has no `base()` method. `handle_reorg` takes the fork child's parent and calls `rollback` even when `metadata(parent)` is empty. A parent of 0 is the genesis case and stays legal. Any other missing parent is under the floor: the roll fabricates a checkpoint and the next tip read panics. `patches/reorg-below-floor.diff` is the guard, written against `l1/bridge/src/worker.rs` at `3a61c0ba608b`. It returns `ReorgBelowRoot` before the blue-score update and before `rollback`. It is not applied upstream. The eight local tests cover that decision. This pass did not execute it inside the bridge crate. The Windows desk still cannot build the RISC Zero settler.

The page is a Vite development server, and the key field is a password box on that host. Their own `docs/ops/deploy-web.md` describes a static bundle and a reverse proxy. Serving that bundle, and keeping keys off a third-party page, closes the exposure this pass refused to take.

These stay open on the pinned commit, from the issue text and a source read, without a new pull naming them: a malformed reply from a resolver-chosen peer stops the bridge for the life of the process; the receipt-cache key omits the pins inside the proved statement; `signed_carrier_transaction` still asserts when the funding output cannot pay the extra outputs and the minimum fee; a caller-supplied output of value zero still reaches the storage-mass division; an in-flight GPU proof is not aborted when the chain rolls back.

The SilverScript stamp is the version trap above. v1.0.0 is the release tag. The language constant stays `0.1.0` because that is what the pragma checker compares. Overwriting it to `1.0.0` would make `^0.1.0` fail to compile.

## What was made

- `l1-floor.sil` and `l1-floor.json`: one L1 covenant, compiled, not submitted.
- `probe/probe.mjs` and `snapshot.json`: a read of the live vprogs demo.
- `model/rules.mjs` and `model/rules.test.mjs`: the settler decision and the reorg-floor guard. Eight tests passed.
- `patches/reorg-below-floor.diff`: the bridge guard, not applied upstream.
- `probe/settle-lag.mjs`: the chain DAA minus the demo's last settlement.
- `TESTING.md`: the finished tic-tac-toe match, the carriers the lane still ignores, and the TN10 measurements from this desk.
- `campaign/five-hour/REPORT.md`: the 25 Sep night run. TN10 kaspad is v2.1.0 on the old store, the desk key matches receive index 0, and the hosted tip field is frozen. `campaign/own/commit-duel.mjs` is the local second program (13 Node tests with the settler model).

## Against the master file

Rechecked while writing this note. `release-candidate` is still `3a61c0ba608b`. vprogs master is still `f9b84a8`. Tic-tac-toe is still `ba05d924`. SilverScript is still `3ed9733`. That matches the board. The live tip rate, the frozen settlement, the two open games, and the unspent exits are measurements from this pass. They belong here.
