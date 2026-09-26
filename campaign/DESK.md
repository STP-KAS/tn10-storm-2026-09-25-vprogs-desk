# Desk pass

25 Sep 2026. The seed the operator pasted is the desk wallet already on this machine. It is not copied into this repo.

Receive index 0 is `kaspatest:qzffl5xy9np46gkttyuftqnv2w04pr8g3wsp7c3vv8se3txtelx6q7c0v0ldx`. It has 279098 UTXOs and 264472 of them are mature enough to spend. That is the pile this key controls. The twelve funded miner addresses in the watch list, about 3.45 million tKAS, still do not match receive or change index 0 through 4999, so this mnemonic cannot sign them. Relqunch still has no local send port.

What was broadcast: 1 tKAS from receive index 0 to receive index 1, tx `2a0998cc82b8a2531fb1c62fc4e04e56cb4b7ad6c61b5900680e6d18bb3672ad`. Receive index 1 shows 100000000 sompi. Payload `desk-vprog-tn10`.

What was refused: a transaction with a zero-value output. The Kaspa SDK returns `Invalid transaction amount` and nothing is submitted. That closes the zero-output case for anything built through `createTransactions`. It does not by itself prove the node-side mass code in vprogs issue 125, which is a different builder.

What was not done: the private key was not typed into https://vprogs-tt.izio.fr/. A payment with no lane payload was not sent to the covenant deposit address. A wrong payload there would sit on an address this key does not spend.

The two-hour watch ended at sample 24. Last public reading: follower tip 527840, settlement `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45` at DAA 580229488, chain gap 34256, one open game, pay-from about 851578 tKAS.
