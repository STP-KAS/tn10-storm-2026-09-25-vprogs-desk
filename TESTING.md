# Tic-tac-toe, and the tests run from this desk

Experimental. Not Kaspa core. Not an audit. Not advice.

25 Sep 2026, written at 22:07 Europe/Brussels. Keys stayed on this machine. Nothing in this file is a seed or a private key.

Two records sit behind this note (both were private when it was written). The match that finished is in this repo (`campaign/PLAY.md`, `campaign/FINISH.md`). The earlier wallet flood and the carriers the lane never applied are in [`STP-KAS/tn10-storm-2026-09-25-build`](https://github.com/STP-KAS/tn10-storm-2026-09-25-build), now public.

## The match the lane finished

The encoder was `vprog-tictactoe-encoder-wasm` 0.1.6 from `biryukovmaxim/vprog-tictactoe`. Carriers were submitted to a public TN10 node. The key was not typed into https://vprogs-tt.izio.fr/.

Game `339bfef598e18806dc9eb07fa5ec2ce348c5f92a686694ee3b4a831e880c26f3` was opened at 1 tKAS (100000000 sompi), pot 2 tKAS. The creator's mark was X. The cells played were 0, 3, 4, 6, 8. X took the diagonal.

A direct read of that game at 22:07 still says `First`, round wins 1-0, `last_move_at` 580314720, both seats filled, pot 200000000 sompi. The board array is empty, which is how a finished round is stored. The carrier transaction ids are in `campaign/FINISH.md`.

The list endpoint does not show this game. `GET /api/games` returned 31 games, every one `Open`, one seat filled, `last_move_at` 0.

## The match the lane still ignores

An earlier pass, recorded in `STP-KAS/tn10-storm-2026-09-25-build` as `results/tictactoe_join.json`, built the same kind of carriers for game `f8f4dcd43a7c54a532a0fa15c03d09dd7dd0fc951be45c592ae3af11dcec23ac`: a join, cells 0, 3, 1, 4, 2, then a withdraw. Those transactions were included on L1.

At 22:07 that game is still `Open`, one player, empty board, `last_move_at` 0. The lane has the bytes on Kaspa and has not turned them into a seat, a move, or a win.

A second game from that pass, `fe3206cdf574933bdbdb4f0503fc555ed168073ecd748487a4db745620b27cce`, had a center-cell carrier included after `last_move_at + turn_ttl` (10000 DAA). The published encoder has no timeout builder, so a forfeit could not be sent. The guest is expected to reject that turn as late.

Version-1 inputs have to be submitted with `sigOpCount` 0 and `computeBudget` set. `sigOpCount` 1 is rejected as inconsistent with transaction version 1.

A later attempt from the Node scripts in the local `tn10-storm-2026-09-25-build` folder did not open a game. The node refused it: the output was already spent by another transaction in the mempool. `metrics/game.json` and `logs/play-one.out.log` hold that refusal. It is a double-spend of a coin the splitter was already using, not a guest error.

## What the page is doing

Read at 2026-09-25T20:07:59Z:

| Reading | Value |
| --- | --- |
| `state.l2_tip` | 566858 |
| Settled tx | `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45` |
| Settled DAA | 580229488 |
| TN10 virtual DAA | 580350670 |
| Gap | 121182 scores |
| Games on the list | 31, all `Open` |

The follower tip field and the settlement receipt are the same numbers as the earlier wallet pass. The chain has moved on. One finished game is readable by id. The settlement checkpoint has not caught that game: its `last_move_at` (580314720) is already above the settled DAA (580229488).

The page is still the Vite development server named in the README. It is a demo on an open draft pin (`3a61c0ba608b`, tic-tac-toe `ba05d924`). `kaspanet/vprogs` master is still `f9b84a8`.

## Tests run from this desk

These used the public TN10 resolver and rusty-kaspa 2.1.0 parameters. The halted local node was not started.

**Minimum payment.** A 1-input 1-output sweep measures compute mass 1624. The node rejects a fee under 162400 sompi. Storage mass on that shape is 65. The standard fee is 100 sompi per gram of compute mass. The SDK mass call often returns the storage figure, and pricing the fee from that figure overpays.

**Small output next to large change.** A 0.5 tKAS payment measures storage mass 20000 and compute mass 2036. The minimum fee is 203600 sompi. The block storage limit is what cuts the packing rate, to about 250 of those transactions a second. The fee does not rise with storage mass.

**What the node refuses.** A zero-value output is rejected (`transaction output 0 has zero value`). The Kaspa SDK refuses the same shape earlier, with `Invalid transaction amount`, and submits nothing. A signature script that leaves a false stack entry is rejected. A fee of 1 sompi on a 1624-mass sweep is rejected. Those three refusals are in `metrics/probe.json` on the local Node run, and the zero-output SDK case is in `campaign/DESK.md`.

**How much one wallet could offer.** The Python pass in `tn10-storm-2026-09-25-build` accepted 320 then 340 minimum sweeps, peak offered about 1162 tx/s for a fraction of a second, all included. Signing on that host was about 13200 a second. The protocol ceiling for that shape is about 3079 tx/s (10 blocks a second, 500000 compute mass, 1624 each). The wallet ran out of confirmed inputs before it reached that ceiling. A quiet TN10 sample in the same pass was about 37 accepted tx/s. A 20 second window around the second wave showed about 2064 accepted tx/s on the selected chain, mostly other traffic.

The Node follow-up on this desk, `scripts/blast.mjs`, is not in that repo yet. Its summary: 23574 accepted, 427 rejected, 0 sign failures, peak offered 751.5 tx/s, mean confirm about 37 seconds, mempool 13005 at the end, 24001 outputs prepared. 426 of the rejects were an output already spent in the mempool. `scripts/scale.mjs` was still splitting confirmed coins when this note was written (round 33, 800 inputs, 0 failures). That run is preparation for a longer lane. It had not started the timed spend.

**SilverScript, on the other path.** Tag v1.0.0 (`3ed9733`) stamps `compiler_version` 0.1.0. `pragma silverscript ^0.1.0` compiles `l1-floor.sil`. `pragma silverscript ^1.0.0` is rejected, because that range would cover a future major. The contract was not broadcast.

**The prover.** `vprogs-zk-backend-risc0-settler` at `3a61c0ba608b` does not build on this Windows desk. `risc0-zkvm` 3.0.5 imports Unix sockets, and the circuit kernels need C++20 while the build script passes C++17. The settler was not run here. The local model tests (`model/rules.test.mjs`) encode the settler decision and the reorg-floor guard. They do not load the RISC Zero crate.

## What these runs show

A carrier can be included on TN10 and still never become a move. Another carrier set, built the same way, became a finished game the API will return by id, with the pot credited in that record, while the settlement receipt stays on an older DAA and the follower tip field stays on 566858. The list of games is a waiting room of half-started boards.

The L1 limits measured here are ordinary Kaspa mass rules. Compute mass sets the minimum fee. Storage mass sets how many small outputs fit in a block. A public resolver and a few hundred confirmed inputs cannot fill the 3079 tx/s packing ceiling. Signing can.

## Where the detail is

| Fact | File |
| --- | --- |
| Open, then the win | `campaign/PLAY.md`, `campaign/FINISH.md` |
| 1 tKAS desk send, zero-output SDK refusal | `campaign/SEND.md`, `campaign/DESK.md` |
| Two-hour public samples | `campaign/samples.jsonl` |
| SilverScript pragma | `campaign/pragma-check.txt` |
| Wallet flood, mass, the ignored match | [`STP-KAS/tn10-storm-2026-09-25-build`](https://github.com/STP-KAS/tn10-storm-2026-09-25-build) (public now; private when written) |
| Node blast and the mempool reject | local `tn10-storm-2026-09-25-build/metrics/`, not pushed |
