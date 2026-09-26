# Five-hour vprogs test

Experimental. Not Kaspa core. Not an audit. Not advice.

Opened 2026-09-25 23:51 Europe/Brussels. The run is meant to keep going until 2026-09-26 04:55 Europe/Brussels. Keys stayed on this machine. This file has no seed and no private key.

## Why

Maksim Biriukov asked developers to play the tic-tac-toe guest, read the code, and build their own vprog. The post is https://x.com/Max143672/status/2103466359246270526. The two links in that post are the framework branch https://github.com/kaspanet/vprogs/tree/release-candidate and the guest https://github.com/biryukovmaxim/vprog-tictactoe. The page that is live is https://vprogs-tt.izio.fr/.

This desk is answering that invitation on testnet-10 only. The check is against the commit the guest lock names, against `kaspanet/vprogs` master, and against the rusty-kaspa release the node is actually running. Nothing here is a pull request and nothing was posted on GitHub or X.

## What was started

The Windows TN10 node had been stopped since 2026-09-22 15:30 UTC. It is back, on the same data directory it already had:

`C:\Users\<user>\AppData\Local\rusty-kaspa\kaspa-testnet-10\datadir`

The binary is rusty-kaspa **v2.1.0** (`01b532e8`), from the Windows zip on the GitHub release. The copy that was on disk before this restart was **2.0.1**. Master of rusty-kaspa is that same v2.1.0 commit. There is no newer release.

The v2.1.0 zip contains `kaspad`, `kaspa-wallet`, `rothschild`, and `stratum-bridge`. It does not contain `kaspa-miner`. The CPU miner that will run after the node reaches the tip is the existing `kaspa-miner` 0.2.6, eight threads, gRPC to `127.0.0.1:16210`. It is not started during IBD. A first attempt passed `--appdir` as the network folder itself, and kaspad nested a second empty store under it. That process was stopped and the 0.4 MB nest was removed. The real store was not touched. `scripts/start-node.ps1` now points at the v2.1.0 binary and at the parent appdir, so the next start does not nest.

The wallet check used the desk file, derived receive index 0 with an empty BIP39 passphrase, and compared it to the address and the private key already stored beside the mnemonic. Address match, key match, `kaspatest` prefix. Public balance read: **19,710,250,596,266 sompi** (about 197,103 tKAS). That is the wallet this machine can sign. The miner will pay that same receive index once the node is at the tip, so new coinbase is spendable here. The separate miner-address pile from earlier weeks is still not spendable by this mnemonic.

At 23:57 the node (pid 54068) was past the pruning-point proof and had downloaded 212,399 headers. It was not at the tip yet. The miner was still off.

## What the pins actually are

| Object | Commit | Note |
| --- | --- | --- |
| `kaspanet/vprogs` master | `f9b84a8` (28 Jul 2026) | Runner and the account-model example. Not the tic-tac-toe host. |
| `kaspanet/vprogs` `release-candidate` | `3a61c0ba608b` (24 Sep 2026) | Same commit as draft pull 164. |
| `fix/reorg-boundary-duplicate-bundles` | `3a61c0ba608b` | The branch the guest lock names. It has not moved past release-candidate. |
| `biryukovmaxim/vprog-tictactoe` master | `ba05d924` (24 Sep 2026) | Lock source is that branch at `#3a61c0ba608b`. |
| rusty-kaspa inside both locks | `eb0a856d` | Three commits behind the v2.1.0 tag. |
| rusty-kaspa v2.1.0 | `01b532e8` | The node that is running. |

Those three commits after `eb0a856d` are #1096 (txscript error counts), #1138 (arithmetic safety), and #1139 (version bump). The guest and the framework were not rebuilt on the release tag. The node under test is newer than the node the guest's Cargo.toml describes.

`kaspanet/vprogs` master does not contain this guest stack. Open drafts still sit between master and the demo pin. The stack read tonight, base first, includes 127 through 134, 136, 138 through 140, 142, 144 through 147, 149, 152 through 154, 156 through 158, 160, 161, 163, and 164. 164 is draft, titled as the settler skip of state-neutral duplicates, and its head is the release-candidate commit. Master is not a substitute for that pin. Testing master answers a different tree.

Local checkouts used for this run, without moving the older working trees:

- `Documents\kaspa\vprogs-lab\vprogs-rc` at `3a61c0b`
- `Documents\kaspa\vprogs-lab\vprog-tictactoe` at `ba05d924`
- `kaspa-train-2026-09-20\vprogs` left at master `f9b84a8`
- `C:\Users\<user>\vprog-tictactoe` left at `93b7590`

## How this pass is run

1. Start kaspad v2.1.0 on the existing TN10 store. Do not mine until a ten-second sample shows blocks and headers moving together (at least 20 of each, within 40 of each other). That is the same shape the log had when the node was previously at the tip. Eight threads. No unsynced mining.
2. Derive the desk receive key locally and read the public balance. Do not type the key into https://vprogs-tt.izio.fr/.
3. `cargo test` the release-candidate crates that do not need `libclang`, then the crates that do, with `LIBCLANG_PATH` set to the Visual Studio 2022 x64 `libclang.dll` directory. The first attempt failed because `clang-sys` could not see that DLL. RocksDB's bindgen is why the SMT and scheduler tests need it.
4. `cargo test` in the tic-tac-toe `guest/` crate at `ba05d924`. That crate is outside the host workspace. It pins the same vprogs branch and pulls `risc0-zkvm` 3.0.
5. Read `GET /api/state`, `GET /api/games`, and `https://api-tn10.kaspa.org/info/blockdag`.
6. Run the local Node models: `model/rules.test.mjs` and `campaign/own/commit-duel.mjs`.

The heavy crate tests and the guest tests were still compiling at the time this note was written. Their logs are `campaign/five-hour/cargo-rc-heavy.log` and `campaign/five-hour/cargo-guest.log`. They are not committed.

## Tests that already finished

`cargo test` of `vprogs-core-codec`, `vprogs-core-hashing`, `vprogs-core-merkle-tree`, and `vprogs-core-types` at `3a61c0b` finished in 7.32s. The merkle crate ran 4 tests, all passed (`required_depth_clamps`, three-leaf root, five-leaf root, empty-hash recurrence). The other three crates have no unit tests and no doc tests. A green line there does not exercise the scheduler, the bridge, or the guest.

`node --test model/rules.test.mjs campaign/own/commit-duel.mjs` : **13 passed, 0 failed**.

## The hosted runner, read again

2026-09-25 23:57 Europe/Brussels:

| Reading | Value |
| --- | --- |
| `state.l2_tip` | 566858 |
| Settled tx | `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45` |
| Settled DAA | 580229488 |
| TN10 virtual DAA | 580416079 |
| Gap | 186591 scores |
| Games sample | still `Open`, one seat, empty board, `last_move_at` 0 |

At 22:07 the same tip field and the same settlement receipt were already frozen, and the gap was 121182. The chain has moved. The follower tip has not. Earlier the same day the tip field was climbing (about 483k at 15:17, then 566858). It is no longer climbing. A settler that skips duplicate bundles can explain a frozen receipt. It does not explain a follower tip that also stopped. The process that was ingesting has stopped advancing, or it is up and not writing this field.

`/api/games?limit=3` is still a waiting room: state `Open`, pot 200000000 sompi, stake 100000000, one player, no moves. The finished match from this desk is still only visible by id, not in that list. That split was already written in `TESTING.md`.

## Flaws and inconsistencies

These are reads of `3a61c0b` and `ba05d924` on this desk. They are not a review comment.

1. **The README names the wrong branch.** `vprog-tictactoe` README still says to check out `fix/g2-access-read-enforcement` because the committed ELFs live there. `Cargo.toml` and `Cargo.lock` pin `fix/reorg-boundary-duplicate-bundles` at `3a61c0ba608b`. That branch is also `release-candidate`. Someone following the README builds against a different tree than the lock.

2. **The guest comment is stale in the same way.** `guest/Cargo.toml` still says guest-hardening carries the runtime processor. The git pins on that file are the reorg-boundary branch.

3. **The framework pins an older rusty-kaspa than the release.** Both locks use `eb0a856d`. v2.1.0 is three commits later. #1138 is in the node and not in the pin. A guest bug that depends on the arithmetic-safety fix will not show up in the locked tests, and a node bug that #1138 introduced will not show up in the guest's CI.

4. **`handle_reorg` still rolls onto a parent that may not be in the sink.** At `l1/bridge/src/worker.rs` the unknown fork *child* returns `ReorgBelowRoot`. The next line takes that child's `parent_id` and calls `rollback` on it. There is no check that a non-zero parent still has metadata. `patches/reorg-below-floor.diff` is that check. It is not in the commit. `campaign/own/commit-duel.mjs` locks both behaviors: the code as written returns a rollback target, the guard returns `ReorgBelowRoot`. Genesis parent 0 stays legal in the guard.

5. **`signed_carrier_transaction` panics on a short funding output.** `l1/wallet/src/build/carrier.rs` `assert!`s when the input cannot cover the extra outputs, and `assert!`s again when it cannot cover those outputs plus `min_fee`. A library used by a long-running issuer should return the insufficient-funds error the other builders already use. An assert takes the process down.

6. **`write_game` and `apply_create_game` disagree about zero rounds.** `apply_create_game` rejects `rounds == 0`. `write_game` stores whatever `u8` it is given, including 0. The action path is safe if every birth goes through it. A second caller of `write_game` is not.

7. **A stake of zero is accepted.** The balance check is `checked_sub(stake)`. Subtracting zero succeeds. Create and join will open a free match and still consume a game id. The duel model in this folder rejects a non-positive stake on purpose, so the difference is visible in a test.

8. **`match_outcome` turns broken counters into a finished match.** `remaining` is `saturating_sub`. If draws plus wins are already above `rounds_total`, remaining is 0 and the function returns First, Second, or Draw. `guestMatchOutcome(1, [0, 0], 5)` is `Draw`. The action path increments one counter per closed round and stops when the total is reached, so a normal game does not get there. `strictOutcome` in the duel model returns an error instead. That is the behavior worth having if a restored or hand-edited resource can carry a bad counter.

9. **Windows cannot build the RISC0 settler without a Unix `std::os` and C++20.** That failure was recorded earlier today and is not re-litigated here. The guest crate test now in progress is the next measurement. `vprogs-core-smt` tests depend on `vprogs-storage-rocksdb-store`, which is why `libclang` showed up. The DLL is on this machine under Visual Studio 2022. The heavy test was restarted with `LIBCLANG_PATH` set.

10. **Master is not the demo.** Treating `f9b84a8` as the tic-tac-toe framework will not reproduce the page. The demo is the draft stack, unreleased, and tonight it is not advancing its own tip field.

## Our own vprog

`campaign/own/commit-duel.mjs` is a small second program: two seats lock a positive stake, commit a hash, reveal rock-paper-scissors, and play a best-of with the same early-clinch rule as tic-tac-toe. A bad reveal does not change state. A finished game rejects another commit. A draw returns the whole pot, and an odd pot does not mint a sompi (the extra sompi stays with the second seat). It also locks the reorg-floor decision and the saturating-counter hole.

It is a Node model. It does not produce an ELF, it does not submit a transaction, and it is not a kaspanet crate. The point of this pass is to have something we can break on purpose while the guest crate itself is still compiling.

## Conclusion so far

The node restart is real: v2.1.0, the old TN10 store, a wallet this machine can sign, miner waiting for the tip. The guest's lock and `release-candidate` are the same commit, and that commit is not master. The README still points at a different branch. The hosted runner's tip field and its settlement receipt are both stuck where they were at 22:07, while TN10 has moved on by 186591 DAA scores. The reorg parent hole and the carrier `assert!` are still in the pinned bridge and wallet code.

The merkle unit tests passed. The scheduler, SMT, and guest suites were still compiling. This note will be extended as those finish, as the node reaches the tip, and as the miner starts. The end of the run is 04:55 Europe/Brussels on 26 Sep 2026.

## 00:02 Europe/Brussels, same night

The tic-tac-toe guest crate at `ba05d924` compiled on this Windows desk and its tests passed: **127 passed, 0 failed**, in 0.01s after a 42.90s build. That build included `risc0-zkvm` 3.0.6 and `vprogs-zk-backend-risc0-runtime-processor` from `3a61c0ba`. The guest unit tests are host-side checks of the rules, the wire encoding, and the lock codec. They do not prove a receipt and they do not run the settler. The earlier settler failure stands as a separate crate.

The scheduler and SMT test did not get that far. `librocksdb-sys` 0.17.3's build script exits `0xc0000135` (`STATUS_DLL_NOT_FOUND`). `dumpbin /dependents` shows that script imports `libclang.dll` directly, so `LIBCLANG_PATH` is not enough: the Windows loader has to find the DLL on `PATH`. The DLL is the Visual Studio 2022 x64 LLVM. A retry is running with that directory on `PATH`. `cmake.exe` from the same Visual Studio install is on `PATH` for that retry as well.

The node is still in header IBD. At 00:02 it had processed about 26% of the header chain, last header timestamp 2026-09-24 21:42, and 0 blocks in the same 10 seconds. The miner is still off, which is what we want until blocks and headers move together.

## 00:05 Europe/Brussels

The retry with `libclang.dll` and `cmake.exe` on `PATH` finished in 1m 04s. **86 passed, 0 failed.**

| Crate | Tests | Result |
| --- | --- | --- |
| `vprogs-core-smt` | 31 (delete-with-promotion 6, e2e 20, non-inclusion shortcut 5) | passed |
| `vprogs-l1-utils` | 2 (`tx_id` v1 matches upstream, empty payload and with payload) | passed |
| `vprogs-scheduling-scheduler` | 53 (e2e 43, indexer 8, reorg id gap 1, restored stale read 1) | passed |

The linker printed `LNK4098` (`LIBCMT` mixed with another runtime) while linking the SMT and scheduler test binaries. The tests still ran.

One of those 43 scheduler tests is there to show that another check is empty. `test_restore_smt_root_idempotence_assertion_is_vacuous` in `scheduling/scheduler/tests/e2e.rs` commits block 1 with payload 100, then restores the same block id with payload 999. The state root does not move. The comment in the test says `store.update` never runs on the restore path, so the root stays put for a reason that is not "the SMT is deterministic." A restored block can carry a different payload and the committed root will still match. That is the restore contract as written: the payload is not folded in again. A test that only compares the root before and after restore does not prove the payload was the one originally committed.

At 00:04 the node was about 41% through header IBD. The newest header timestamp was 2026-09-25 02:54. Still 0 blocks in the ten-second sample. The miner is still off.

## Node check, 00:32 Europe/Brussels

Checked before any thousand-game launch. kaspad v2.1.0 pid 54068 is alive (started 23:51, about 5.9 GB resident). It is listening on 16211, and on 127.0.0.1 for 16210, 17210, and 18210.

| When | What the log says |
| --- | --- |
| 23:51 | process start, v2.1.0, existing TN10 store |
| 23:57 | finished 212399 headers from the pruning-point chain |
| 00:13 | downloading the pruning-point UTXO set |
| 00:17 | warning: sync rate 0.39, under the 0.5 threshold |
| 00:32 | still receiving that set, 155826 chunks, 155826000 UTXOs, and the count was still rising |

No "Accepted blocks" line since this start. The miner has not been started. The error log's last new line is that sync-rate warning. Older handshake mismatches in that file are from 22 Sep, before this process. A thousand vprog submissions wait until this node is accepting blocks.

## 00:21 Europe/Brussels

Header IBD finished at 00:12:04: 1,273,694 headers, logged as 100%. The node then resynced `utxoindex`, imported the pruning-point SMT (4 lanes, pruning point `ac81e8ffeb7fe6ff4c335f494f44351ba99e55d2814cbb206e84167e0c744bf2`), and started the pruning-point UTXO download. At 00:21 that download was still running, about 64.9 million UTXOs received, and a peer line warned that sync rate 0.39 was under the 0.5 threshold. The node is not at the tip. No `kaspa-miner` process is running. The watcher `watch_tn10_v210.ps1` is still alive, so the 8-thread miner stays off until a 10-second sample has blocks and headers moving together.

The guest log and the heavy log have not grown since 00:05. Those results stay **127 passed** and **86 passed**. Nothing failed that needs a relaunch.

`l2_tip` is still 566858 and the settled DAA is still 580229488. The public virtual DAA moved, but the gap grew by less than 10000 since the 23:57 table, so that table is not rewritten.

`cargo test -p vprogs-core-merkle-tree` on master `f9b84a8` (`kaspa-train-2026-09-20\vprogs`) finished in 6.12s. **4 passed, 0 failed**, the same four tests as the pin: `required_depth_clamps`, `finalize_three_leaves_matches_manual_padded_root`, `finalize_five_leaves_matches_manual_padded_root`, `compute_empty_hashes_recurrence`. `core/merkle-tree` has no diff against the release-candidate tree. Master and the demo pin do not differ in this crate. The guest stack is still only on the pin.

The runner does not check the deposit-address derivation at start. In `runner/src/start.rs`, `start_exec` binds `deposit_spk_hash: _` and drops it, so an execution-only node never looks at it. The comment above `start_runner` says a wrong derivation stays invisible until prove mode, and that `[0u8; 32]` is the no-deposit sentinel rather than a default. `assert_declared_deposit_hash` in `zk/abi/src/batch_processor/verifier.rs` returns immediately when the batch carry is still all zeros, so a prover whose declared pin is the zero hash accepts every batch that does not credit a deposit. The first depositing batch makes the carry non-zero, the assert fires (`batch deposit_spk_hash does not match the declared pin`), and the comment in that file calls the result a proving failure rather than a rejected start. A covenant configured against the zero pin looks healthy until somebody deposits.

## 00:32 Europe/Brussels

The node is still not at the tip. The pruning-point UTXO download had passed about 150.1 million UTXOs at 00:32. No miner process. The same watcher is still the one that will start eight threads once blocks and headers move together. The guest and heavy logs are unchanged since 00:05 (127 and 86 passed). Master merkle was already compared at 00:21.

The hosted follower did not move. The chain did, and the gap from the 23:57 table grew by 18515, which is past the 10000 bar.

| Reading | 23:57 | 00:32 |
| --- | --- | --- |
| `state.l2_tip` | 566858 | 566858 |
| Settled DAA | 580229488 | 580229488 |
| TN10 virtual DAA | 580416079 | 580434594 |
| Gap | 186591 | 205106 |

Settled tx is still `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45`.

## Desk pass after 00:38

The node was still on the pruning-point UTXO set: 206019 chunks, 206019000 UTXOs, and the count was still rising. No accepted blocks. The miner was off. A thousand live creates were not submitted. The follower tip is still frozen, and a create locks its stake in the covenant until that follower applies it. Sending one thousand of those into a follower that has not moved since 22:07 would park the stake. That launch stays waiting.

A second local program is `campaign/own/relay-race.mjs`. Two seats commit a time and reveal it. The shorter time takes the checkpoint. The early-clinch rule matches the tic-tac-toe guest. Zero stake is refused. A bad reveal leaves the pot where it was. One thousand races, plus fifty refused reveals, were run in this process. `node --test` on the relay and the earlier commit-duel reported 9 passed, 0 failed. The thousand races minted 0 sompi.

Startup adoption in the settler is narrower than the loop's reconcile. `reconcile` in `zk/backend/risc0/settler/src/worker.rs` adopts a watch that differs in state root or in lane tip. The one-time filter just above the loop adopts only when `new_state != cov.state`. A state-neutral settlement (same root, new lane tip) fails that filter. If `start_from` is unset, the worker then hard-confirms the bootstrap outpoint, and `confirm_outpoint` in `zk/backend/risc0/settler/src/confirm.rs` panics when that outpoint does not appear before the timeout. The test directly under `reconcile` says a state-neutral lane-tip advance must be adopted or later bundles fail the lane-tip chain forever. The startup filter does not apply that condition. This is the settler, not the bridge `handle_reorg`.

## 00:47 Europe/Brussels

kaspad pid 54068 is still in the pruning-point UTXO download: about 268.9 million UTXOs at 00:47, and the count was still rising. No accepted blocks in this sample. No miner process. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed). Master merkle was already compared.

The follower tip and the settled receipt did not move. The public virtual DAA did, and the gap from the 00:32 table grew by 11957.

| Reading | 00:32 | 00:47 |
| --- | --- | --- |
| `state.l2_tip` | 566858 | 566858 |
| Settled DAA | 580229488 | 580229488 |
| TN10 virtual DAA | 580434594 | 580446551 |
| Gap | 205106 | 217063 |

Settled tx is still `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45`.

The runner's identity file panics the process on a torn write. `PersistedState::load` in `runner/src/persistence.rs` returns defaults when the file is missing, but a file that exists and does not parse hits `expect("corrupt vprun-state.json")`. `save` writes that JSON in place with `std::fs::write`, not to a temp file and rename. A restart that lands on a half-written `vprun-state.json` does not resume and does not start fresh. It aborts before the node is built. The same `expect` is on the stored covenant id, the bootstrap tx id, and the bootstrap block hash when those strings are not hex.

## 01:02 Europe/Brussels

The UTXO download finished at 00:53:37. The log says 321,919,720 UTXOs, then `Importing the UTXO set` for pruning point `ac81e8ffeb7fe6ff4c335f494f44351ba99e55d2814cbb206e84167e0c744bf2`. At 01:02 that import had not logged completion. kaspad pid 54068 was still alive and still burning CPU. The only later lines are peer connect and disconnect. No accepted-block line. The miner is still not running. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

`l2_tip` and the settled DAA are unchanged. The public virtual DAA moved, but the gap from the 00:47 table grew by less than 10000, so that table is not rewritten.

A pre-commit cannot name a cell that already has a mark, even though the queue is supposed to survive the round reset. `commit_explicit` in `guest/src/program/action/game.rs` returns `turn: cell is occupied` before it decides whether this seat is the one to move. A future ply is rejected for a marked cell. `clear_pending` in `guest/src/program/resources/game.rs` says the queues are cleared at match end only, because entries persist across rounds. `drain_pending` says a head that names a taken cell is stale and is dropped, which only happens if the cell was empty when it was queued and taken later. Once a round is mostly full, the cells you would want for the next round are exactly the ones this check refuses. The cascade across a round boundary is narrower than the comment.

## 01:17 Europe/Brussels

The UTXO import that started at 00:53:37 reached `Resyncing the utxoindex` at 01:15:54. There is still no accepted-block line. kaspad pid 54068 is alive. The miner is not running. The watcher is still up. At 00:53:04 the log said sync rate 0.00 recovered to 0.5 by entering IBD. The guest and heavy logs are unchanged (127 and 86 passed).

The follower tip and the settled receipt did not move. The gap from the 00:47 table grew by 18006.

| Reading | 00:47 | 01:17 |
| --- | --- | --- |
| `state.l2_tip` | 566858 | 566858 |
| Settled DAA | 580229488 | 580229488 |
| TN10 virtual DAA | 580446551 | 580464557 |
| Gap | 217063 | 235069 |

Settled tx is still `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45`.

The exit indexer parks a bundle under its state root and replaces whatever was already there. `run_exit_indexer` in `runner/src/exit_index.rs` does `parked_bundles.insert(bundle.new_state, bundle)` with no check for a different bundle already stored at that key. `handle_settlement` then removes that one key and pairs whatever remains. A state-neutral bundle keeps the previous state root, so its `new_state` is the key of the bundle that just committed that root. The displaced bundle's exits never get a permission root, and the settlement can be paired with the wrong leaves. The same-root overwrite a few lines later is only described for a re-derived settlement, not for this insert.

## 01:32 Europe/Brussels

kaspad pid 54068 is still alive. The last sync line is still `Resyncing the utxoindex` at 01:15:54. Sixteen minutes later the log only shows peers connecting and dropping. CPU is still climbing. There is no accepted-block line. The node is not at the tip. The miner is not running. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

`l2_tip` and the settled DAA are unchanged. The public virtual DAA moved, but the gap from the 01:17 table grew by less than 10000, so that table is not rewritten.

Turn TTL is a live config field, not a value frozen on the game, and the update path accepts zero. `apply_update` in `guest/src/program/action/config.rs` checks the lock and that `covenant_id` did not change, then writes `new_turn_ttl` with no lower bound. `MatchRaw` in `guest/src/program/resources/game.rs` stores `last_move_at` and does not store a TTL. `apply_timeout` reads the config named in the action and passes that number into `forfeit_round`. A config holder who sets `turn_ttl` to 0 makes `last_move_at + 0` the deadline, so the next mergeset can forfeit every match already in progress. The clock on a game that has already started moves when the config moves.

## 01:47 Europe/Brussels

Block IBD has started. At 01:46 the log said 318483 blocks, 25%, last block timestamp 2026-09-24 21:23. The same ten-second samples show thousands of blocks and 0 headers. kaspad pid 54068 is alive. The node is not at the tip. The miner is not running. The watcher is still up, and it should stay idle while those samples have no headers. The guest and heavy logs are unchanged (127 and 86 passed).

The follower tip and the settled receipt did not move. The gap from the 01:17 table grew by 19291.

| Reading | 01:17 | 01:47 |
| --- | --- | --- |
| `state.l2_tip` | 566858 | 566858 |
| Settled DAA | 580229488 | 580229488 |
| TN10 virtual DAA | 580464557 | 580483848 |
| Gap | 235069 | 254360 |

Settled tx is still `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45`.

`GET /api/games` with no status is the open bucket only. `get_games` in `node/src/da.rs` maps a missing status, and the string `open`, to `GameStatus::Open`. A finished game is not in that response unless the caller passes `status=finished`. A body that fails `GameBody::from_bytes` is dropped by `ok()?` in the same handler, so the list can also omit an id the status index still holds. The waiting-room sample is what this handler returns by default, not a second copy of the chain.

## 02:02 Europe/Brussels

Block IBD was at 94% at 02:01:33: 1,197,306 blocks, last block timestamp 2026-09-25 21:39. The ten-second samples still show blocks and 0 headers. kaspad pid 54068 is alive. The node is not at the tip. The miner is not running. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

`l2_tip` and the settled DAA are unchanged. The public virtual DAA moved, but the gap from the 01:47 table grew by less than 10000, so that table is not rewritten.

The unlocked lock is an empty-bucket pass. `LockEnum::unlock` in `guest/src/runtime/lock.rs` calls `Unlocked` with `&[]`, and `UnlockedLockView::try_unlock` in `zk/backend/risc0/runtime-processor/src/lock_variants.rs` returns `true` without reading a signature. `apply_update_user_lock` writes whatever lock variant the decoder accepted, and the config update does the same. After that write, withdraw, transfer, turn, and a further lock change all succeed for anyone. The next caller can put their own key on the resource. The comment calls this variant shared data. Nothing in the user or config update refuses it.

## 02:17 Europe/Brussels

The first block-body pass reached 100% at 02:16:10 (1,273,688 blocks). A header catch-up reached 100% at 02:17:17 (88,391 headers). The node then started another body pass. At 02:17:51 that pass was at 13%, last block timestamp 2026-09-26 00:15. kaspad pid 54068 is alive. It is not at the tip. One ten-second sample in that window had 2574 blocks and 1550 headers, which is not within 40 of each other, so the watcher correctly left the miner off. Later samples were blocks and 0 headers. No miner process. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

The follower tip and the settled receipt did not move. The gap from the 01:47 table grew by 18320.

| Reading | 01:47 | 02:17 |
| --- | --- | --- |
| `state.l2_tip` | 566858 | 566858 |
| Settled DAA | 580229488 | 580229488 |
| TN10 virtual DAA | 580483848 | 580502168 |
| Gap | 254360 | 272680 |

Settled tx is still `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45`. The public `blockCount` field jumped from about 1.35 million at 02:02 to 6,980,698 now, while virtual DAA moved by about 9k in that same interval. That field is not the local IBD counter.

`apply_transfer` in `guest/src/program/action/user.rs` debits the source before it credits the destination. The comment says an insufficient balance fails before the destination is touched. A destination that is not writable, or whose credit overflows, returns only after `modify_user` has already reduced the source in the resource slice. `process_transaction` puts resources into the journal effects only when the handler returns `Ok`, so a rejected transaction should not commit the debit. The slice the handler is holding on `Err` is still dirty.

## Tip, 02:24 Europe/Brussels

The second body pass finished. kaspad v2.1.0 pid 54068 reports `isSynced: true` on the local Borsh port, server version 2.1.0. At 02:24 it accepted blocks both via relay and via submit, and one ten-second sample was 137 blocks and 137 headers. That is the tip.

The 8-thread miner is pid 52048, pointed at the desk receive index, with no unsynced-mining flag. Its blocks are the "via submit block" lines.

The hosted follower did not move with the node. `l2_tip` is still 566858 and the settled DAA is still 580229488. The desk account for receive index 0 answers HTTP 200 with `games_started` 0 and an L2 balance of 0. A create debits that L2 balance, so a thousand creates need deposits into the covenant first. The follower that would credit those deposits has been frozen since 22:07. The thousand live creates stay unsent.

## 02:32 Europe/Brussels

The node is still at the tip. At 02:31:47 it processed 146 blocks and 147 headers in ten seconds, and it is accepting blocks via relay and via submit. kaspad pid 54068 is alive. The miner is still pid 52048. The process name is `kaspa-miner-v0.2.7-win64-amd64.exe`, which is the binary the watcher launches, not a process named `kaspa-miner.exe`. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

The follower tip and the settled receipt did not move. The gap from the 02:17 table grew by 11297.

| Reading | 02:17 | 02:32 |
| --- | --- | --- |
| `state.l2_tip` | 566858 | 566858 |
| Settled DAA | 580229488 | 580229488 |
| TN10 virtual DAA | 580502168 | 580513465 |
| Gap | 272680 | 283977 |

Settled tx is still `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45`.

A withdrawal of zero is legal when the config minimum is zero. `apply_withdraw` in `guest/src/program/action/withdraw.rs` rejects only `amount < min`. It then debits and emits that amount, including 0. `apply_update` stores `new_min_withdrawal_amount` with no lower bound, the same path that stores a zero turn TTL. `checked_sub(0)` succeeds, and `ExitSink::emit` appends the amount without refusing zero. An authorized user can add an empty exit once the config holder has set the minimum to 0.

## 02:47 Europe/Brussels

The node is still at the tip. At 02:46:57 it processed 110 blocks and 110 headers in ten seconds, and it is accepting blocks via relay and via submit. kaspad pid 54068 is alive. The miner is still pid 52048. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

The follower tip and the settled receipt did not move. The gap from the 02:32 table grew by 11542. The public `blockCount` is 1,385,469 again, equal to `headerCount`. The 6,980,698 reading from 02:17 did not stick.

| Reading | 02:32 | 02:47 |
| --- | --- | --- |
| `state.l2_tip` | 566858 | 566858 |
| Settled DAA | 580229488 | 580229488 |
| TN10 virtual DAA | 580513465 | 580525007 |
| Gap | 283977 | 295519 |

Settled tx is still `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45`.

A revert hides whichever exit family happens to share the leaf list, not the family the reverted bundle anchored. `on_exits_reverted` in `node/src/exit_index.rs` (the search at line 185) ignores the settlement it is given and picks the first in-memory record whose `leaves` compare equal. The comment on that search says identical leaf sets hide an arbitrary one, and that a txid-root key is future work. `HashMap` iteration order is not the commit order, so two bundles with the same exits (same destination, same amount, including a zero-amount exit) make the revert delete one family and leave the other served. The fallback root is used only when no record matches. A match on the wrong family never reaches it.

## 03:02 Europe/Brussels

The node is still at the tip. At 03:01:58 it processed 110 blocks and 110 headers in ten seconds, and it is accepting blocks via relay and via submit. kaspad pid 54068 is alive. The miner is still pid 52048. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

`l2_tip` is still 566858 and the settled DAA is still 580229488. The public virtual DAA is 580534466. The gap from the 02:47 table grew by 9459, which is under 10000, so that table is not rewritten.

A finalized canonical bucket answers "yes" for every id in it, including ids a reorg orphaned. `is_canonical` in `storage/canonical-chain/src/snapshot.rs` at line 73 returns `true` when the bucket is absent. The comment above that function says this is sound only if the caller stays above the finalization threshold. `finalize` drops those buckets, and `finalize_makes_pruned_gaps_read_canonical` shows an orphaned id reading canonical afterwards. `scan_player_events` in `node/src/indexer.rs` at line 326, and the game-status scan at line 373, call `is_canonical` on the stored version with no threshold check. Once finalization passes a reorg gap, an orphaned player event or game row is served as if it were on the canonical chain.

## 03:17 Europe/Brussels

The node is still at the tip. At 03:16:58 it processed 104 blocks and 104 headers in ten seconds, and it is accepting blocks via relay and via submit. kaspad pid 54068 is alive. The miner is still pid 52048. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

The follower tip and the settled receipt did not move. The gap from the 02:47 table grew by 18701.

| Reading | 02:47 | 03:17 |
| --- | --- | --- |
| `state.l2_tip` | 566858 | 566858 |
| Settled DAA | 580229488 | 580229488 |
| TN10 virtual DAA | 580525007 | 580543708 |
| Gap | 295519 | 314220 |

Settled tx is still `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45`.

A create with stake 0 still burns a game id and can later increment `games_won`. `init_game` in `guest/src/program/resources/ext.rs` at line 164 writes the stake it is given, and `write_game` stores that `u64` with no lower bound. `apply_create_game` rejects `rounds == 0` and does not reject `stake == 0`. `checked_sub(0)` succeeds, then `games_started` advances, so the next game derives a new id. A join locks 0 as well. A finish still bumps `games_finished` and, for a winner, `games_won`. The user-birth path refuses a balance under 1000. A free game is still a counted win.

## 03:32 Europe/Brussels

The node is still at the tip. At 03:31:58 it processed 92 blocks and 92 headers in ten seconds, and it is accepting blocks via relay and via submit. kaspad pid 54068 is alive. The miner is still pid 52048. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

`l2_tip` is still 566858 and the settled DAA is still 580229488. The public virtual DAA is 580552781. The gap from the 03:17 table grew by 9073, which is under 10000, so that table is not rewritten.

A deposit of zero is legal once the user already exists. `apply_deposit` in `guest/src/program/action/deposit.rs` reads `out.value` at line 50 and, on the live-user arm at line 89, only checks `checked_add`. It does not require the value to be above zero. The create arm does: `validate_user_create` applies `min_create_balance`, which this program sets to 1000. A zero-value output that pays the deposit script still passes the script check, credits the same balance, and reaches `cx.deposit.set` at line 104, so the batch records a deposit commitment for no sompi. The wallet builder notes that `PayToAddressTx` accepts a zero-value output. This is the same hole as a zero withdrawal, on the way in.

## 03:47 Europe/Brussels

The node is still at the tip. At 03:46:59 it processed 98 blocks and 98 headers in ten seconds, and it is accepting blocks via relay and via submit. kaspad pid 54068 is alive. The miner is still pid 52048. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

The follower tip and the settled receipt did not move. The gap from the 03:17 table grew by 18066. The public `headerCount` is 1,422,238 and `blockCount` is 1,422,236, two headers ahead. The local ten-second sample is still even.

| Reading | 03:17 | 03:47 |
| --- | --- | --- |
| `state.l2_tip` | 566858 | 566858 |
| Settled DAA | 580229488 | 580229488 |
| TN10 virtual DAA | 580543708 | 580561774 |
| Gap | 314220 | 332286 |

Settled tx is still `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45`.

A partial exit claim is legal on the covenant and fatal in the tic-tac-toe index. `emit_validate_amounts` in `zk/backend/risc0/api/src/permission_script.rs` checks `deduct > 0` and `amount >= deduct`. `emit_compute_new_unclaimed` at line 395 subtracts one from the unclaimed count only when the residual amount is zero. Otherwise the leaf stays in the tree as the hash of the script and the residual amount. `permission_watch.rs` accepts that same range at line 213, and its own `new_unclaimed` at line 239 drops only when `amount == deduct`. `on_permission_spent` does not look at either fact. It always appends the leaf to `emptied` and drops `unclaimed` by one. `exit_views` then hashes every emptied slot as the empty leaf. A partial claim is served as a deleted leaf, and the next proof is built against the wrong root. The demo encoder always deducts the whole leaf. The script does not.

## 04:02 Europe/Brussels

The node is still at the tip. At 04:02:09 it processed 103 blocks and 103 headers in ten seconds, and it is accepting blocks via relay and via submit. kaspad pid 54068 is alive. The miner is still pid 52048. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

`l2_tip` is still 566858 and the settled DAA is still 580229488. The public virtual DAA is 580570816. The gap from the 03:47 table grew by 9042, which is under 10000, so that table is not rewritten. The public `blockCount` is 7,049,346 again, equal to `headerCount`, while virtual DAA moved by about 9k. The same field read 6,980,698 at 02:17 and 1,422,236 at 03:47. It is not the local block counter.

A rebuilt guest ELF aborts the settler instead of returning the error the worker already knows how to log. `build_settlement` in `zk/backend/risc0/settler/src/covenant/build.rs` checks that the artifact chains from the live covenant, and those checks can still pass after the guests are rebuilt. The assert at line 160 then compares the rebuilt redeem's P2SH to the covenant UTXO. The comment says the node would reject that settlement at the P2SH check, and that this assert fails first so the drift is named. The function's own comment says it panics if the artifact does not chain. A panic in the settlement task stops settling. It does not come back as the rejected-settlement path the worker already has. The carrier `assert!` is a different builder. This one is the settler, and the trigger is an ELF image id that no longer matches the covenant that was bootstrapped.

## 04:17 Europe/Brussels

The node is still at the tip. At 04:17:10 it processed 98 blocks and 98 headers in ten seconds, and it is accepting blocks via relay and via submit. kaspad pid 54068 is alive. The miner is still pid 52048. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

The follower tip and the settled receipt did not move. The gap from the 03:47 table grew by 17638. The public `blockCount` is 1,439,874 again, equal to `headerCount`. The 7,049,346 reading from 04:02 did not stick.

| Reading | 03:47 | 04:17 |
| --- | --- | --- |
| `state.l2_tip` | 566858 | 566858 |
| Settled DAA | 580229488 | 580229488 |
| TN10 virtual DAA | 580561774 | 580579412 |
| Gap | 332286 | 349924 |

Settled tx is still `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45`.

The catch-up log declares success against a DAA that was already stale when the line was printed. `spawn_sync_reporter` in `runner/src/report.rs` returns at line 28 when the bridge tip is at least `target_daa`. That target is one snapshot. The caller captures `virtual_daa_score` before bootstrap and never refreshes it. The bridge publishes its replay cursor, not the live virtual tip. Once the cursor reaches the old snapshot the task logs `caught up to bootstrap` and exits, while the chain has kept moving. The comment on the function says the target is the virtual DAA just after the bootstrap tx. The capture is before that tx. A catch-up that lasts longer than a few minutes, which this node's own IBD did, reports 100% and goes silent while the bridge is still behind the live tip.

## 04:33 Europe/Brussels

The node is still at the tip. At 04:33:50 it processed 105 blocks and 105 headers in ten seconds, and it is accepting blocks via relay and via submit. kaspad pid 54068 is alive. The miner is still pid 52048. The watcher is still up. The guest and heavy logs are unchanged (127 and 86 passed).

The follower tip and the settled receipt did not move. The gap from the 04:17 table grew by 10405. The public `blockCount` is 7,068,347 again, equal to `headerCount`, while virtual DAA moved by about 10k. The same jump showed up at 02:17 and 04:02 and then fell back. It is still not the local block counter.

| Reading | 04:17 | 04:33 |
| --- | --- | --- |
| `state.l2_tip` | 566858 | 566858 |
| Settled DAA | 580229488 | 580229488 |
| TN10 virtual DAA | 580579412 | 580589817 |
| Gap | 349924 | 360329 |

Settled tx is still `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45`.

A settlement that keeps the state root is invisible to the watch `settle_one` calls the confirmation signal. The filter at `zk/backend/risc0/settler/src/settle/settler.rs` line 185 accepts a watch value only when `new_state != cov.state` and the DAA is at least the covenant's. `target_state` is `cov.state`, the root before this bundle. A state-neutral bundle, the same shape the startup filter already drops, never passes that test. The 30-second chain probe can still see the continuation outpoint and land the bundle. Until that tick the settler holds it, and a `Dropped` probe resubmits. The comment above the wait says a change past the covenant is exactly the confirmation signal. A lane-tip-only settlement is not a change of state, so the watch the comment describes does not fire.

## 04:48 Europe/Brussels

The node is still at the tip. At 04:47:41 it processed 90 blocks and 91 headers in ten seconds, and it is accepting blocks. kaspad pid 54068 is alive. The miner is still pid 52048. The watcher is still up. The one-header lead is inside the watcher's window, so the miner staying on is correct. The guest and heavy logs are unchanged (127 and 86 passed).

`l2_tip` is still 566858 and the settled DAA is still 580229488. The public virtual DAA is 580598067. The gap from the 04:33 table grew by 8250, which is under 10000, so that table is not rewritten. The public `blockCount` is 1,458,529 again, equal to `headerCount`. The 7,068,347 reading from 04:33 did not stick.

The journal compaction picks the last matching entry, not the higher end. `settled_entry_end` in `zk/aggregate-prover/src/worker.rs` at line 1142 uses `rfind` on `block_prove_to` and returns that entry's `end_index`. The comment, and the test `boundary_ending_two_entries_resolves_to_the_higher`, say two entries for the same block resolve to the higher end. `entries()` in `state/settlement-journal/src/lib.rs` walks the store in start-index order. The last match is the greatest start, not the greatest `end_index`. A later start with a shorter range hides an earlier entry that ends higher. `compact_journal` then deletes only through the shorter end, and the longer settled range stays in the journal to be re-fed.

## Close, 05:02 Europe/Brussels

The window ended at 04:55. This sample is a few minutes later. kaspad v2.1.0 pid 54068 is alive and at the tip: at 05:02:31 it processed 97 blocks and 97 headers in ten seconds, relay and submit both in the log. The miner is still pid 52048, eight threads, the v0.2.7 binary the watcher launched at 02:24. It is left running. The guest log is still 127 passed, 0 failed. The heavy log is still 86 passed, 0 failed. Neither file has grown since those suites finished. Master `f9b84a8` and the pin ran the same four merkle tests. That crate does not differ.

### Why

Maksim asked developers to play the guest, read the code, and build their own vprog. This desk answered on testnet-10 only, against the commit the guest lock names (`3a61c0ba608b`, which is also `release-candidate`), against `kaspanet/vprogs` master `f9b84a8`, and against the rusty-kaspa v2.1.0 node that is actually running (`01b532e8`). The guest lock still names rusty-kaspa `eb0a856d`, three commits earlier. Nothing in this file was posted on GitHub or on X. It is not an audit.

### What

The local node had been down since 22 Sep. It spent the first part of the night in pruning-point UTXO IBD, then block IBD, and reached the tip at 02:24. It was still at the tip at the close. The hosted follower did not move once during the window. `l2_tip` is still 566858. The settled DAA is still 580229488. The settled tx is still `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45`. Those three were already frozen at 22:07. The public virtual DAA at the close is 580606899. The gap is 377411, up from 186591 at 23:57 and from 121182 at 22:07. The public `blockCount` field is not a counter this desk can trust: it read about 1.4 million, then about 7 million, then 1.4 million again, while virtual DAA moved smoothly and the local log stayed even. No live game creates were sent. A create debits an L2 balance, the desk account's L2 balance was 0, and the follower that would credit a deposit has been frozen since 22:07. Stake locked into that covenant would sit there.

### How

The pin was read, not master. The tests this Windows desk can run were run: the light crates, then SMT, scheduler, and l1-utils with `LIBCLANG_PATH` set, then the guest crate. The RISC0 settler was already known to fail here for a Unix `std::os` and C++20, and that was not re-litigated. Each wake sampled `/api/state` and the public blockdag. Each wake read one more source file and added a flaw only where a file and a line would carry it. The local programs are Node models in this repo. They do not produce an ELF and they do not submit.

### Conclusion

The part that moved is the local node. It finished IBD and mined. The part that had to move for a live game is the hosted follower, and it did not. The pin is not master, and the README still names a different branch. The holes that matter for a long-running runner are the ones that drop or mis-pair exits, serve a pruned orphan as canonical, panic the settler or the identity load, and accept a zero deposit, a zero withdrawal, and a zero stake. A partial claim is legal in the covenant script and fatal in the tic-tac-toe index. This note stops here. kaspad and the miner stay up. The schedule for this window stops with it.
