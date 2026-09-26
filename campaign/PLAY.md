# A game on the live lane

25 Sep 2026. Played the tic-tac-toe vprog Max pointed at, from this desk. The key was not typed into https://vprogs-tt.izio.fr/. The encoder wasm from `biryukovmaxim/vprog-tictactoe` (`vprog-tictactoe-encoder-wasm` 0.1.6) built the carrier, and a public TN10 node accepted it.

The wallet used is receive address `kaspatest:qrw0tuxnjukkrk7lm5v7chx4qpu8f8q0janp7jdk80z4tc8anu62gmvkwdwrt`. The seed is not in this repo.

| Field | Value |
| --- | --- |
| Carrier tx | `f9020e2dfde931eb9b7b0651feb38d9c974a3ddabda6d4eb7be38af52e1c67e2` |
| User resource | `fa8f1399a787e957a1225f3a931d4d2190bd7c807fc77613e0c950649ab5203a` |
| Game | `339bfef598e18806dc9eb07fa5ec2ce348c5f92a686694ee3b4a831e880c26f3` |
| State | Open, one player, no moves |
| Stake | 100000000 sompi |
| Pot | 200000000 sompi |
| Rounds | 1 |
| Account | exists, `games_started` 1, balance 0 |

The lane read the carrier. The account was created and the game is waiting for a second player. Config id passed to the encoder was SHA-256 of the single domain byte `4`, which is what `config_resource_id` hashes.
