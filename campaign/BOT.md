# Relqunch and the miner addresses

25 Sep 2026, desk session.

Relqunch is Grok Bot agent `922e865b-7039-4a2d-98df-91f4cca8b913`. Its latest line in the app was about a private template waiting for review, not a miner receipt. This session cannot type into that chat. The packaged Grok Bot app does not open a local send port. The sand-dev edge that has `broadcastToAgents` is only started for an unpackaged app.

The saved miner list at `groks-wallet/logs/tn10-watch-addresses.txt` has 47 addresses. Twelve of them have a public balance. Together those twelve hold 345453255771867 sompi, about 3,454,532 tKAS. None of the 47 matches receive or change index 0 through 4999 of the local mnemonic. This desk cannot sign those twelve. Their keys are on the sandbox with the miners.

The desk address, the faucet pay-from, is one this wallet can sign. During the watch its public balance rose from about 707,754 tKAS to about 840,294 tKAS. That is miners paying in. It is still under the 1,000,000 tKAS top-up line, so this pass did not spend it.

The demo settlement did move during the watch. By sample 22 the settled transaction was `0d9719c4d5dce33232966f80a8060e25abfa4198294f3d73315776c26ba88a45` at DAA 580229488. The chain was at 580258098, gap 28,610, and the gap was widening again (20,129 then 22,898 then 25,756 then 28,610). One game was open. The follower tip was 525127.
