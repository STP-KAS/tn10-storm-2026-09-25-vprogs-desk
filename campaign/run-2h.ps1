# Two-hour read-only watch. Samples go to campaign/samples.jsonl.
# A private git push happens every third sample. No keys. No posts.
$ErrorActionPreference = "Continue"
$repo = "C:\Users\<user>\Documents\kaspa\vprogs"
$log = Join-Path $repo "campaign\samples.jsonl"
$trace = Join-Path $repo "campaign\run-2h.log"
$end = (Get-Date).AddHours(2)
$n = 0
function Trace([string]$line) {
  Add-Content -Path $trace -Value ("{0} {1}" -f (Get-Date).ToUniversalTime().ToString("o"), $line)
}
function Sample {
  $state = Invoke-RestMethod "https://vprogs-tt.izio.fr/api/state"
  Start-Sleep -Seconds 4
  $state2 = Invoke-RestMethod "https://vprogs-tt.izio.fr/api/state"
  $dag = Invoke-RestMethod "https://api-tn10.kaspa.org/info/blockdag"
  $games = Invoke-RestMethod "https://vprogs-tt.izio.fr/api/games"
  $pay = Invoke-RestMethod "https://api-tn10.kaspa.org/addresses/kaspatest:qzffl5xy9np46gkttyuftqnv2w04pr8g3wsp7c3vv8se3txtelx6q7c0v0ldx/balance"
  $daa = [int64]$dag.virtualDaaScore
  $settled = [int64]$state.settled.daa_score
  [ordered]@{
    at = (Get-Date).ToUniversalTime().ToString("o")
    l2Tip = [int64]$state2.l2_tip
    tipDelta4s = ([int64]$state2.l2_tip - [int64]$state.l2_tip)
    settledTx = [string]$state.settled.txid
    settledDaa = $settled
    virtualDaa = $daa
    gapDaa = ($daa - $settled)
    games = @($games.games).Count
    payFromSompi = [string]$pay.balance
  }
}
Set-Location $repo
Trace "start until $($end.ToUniversalTime().ToString('o'))"
while ((Get-Date) -lt $end) {
  $n++
  try {
    $row = Sample
    ($row | ConvertTo-Json -Compress) | Add-Content -Path $log
    Trace "sample $n tip=$($row.l2Tip) gap=$($row.gapDaa) games=$($row.games)"
  } catch {
    Trace "sample $n error $($_.Exception.Message)"
  }
  if ($n % 3 -eq 0) {
    git add campaign/samples.jsonl campaign/run-2h.log
    git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) {
      $msg = "campaign sample $n"
      git commit -m $msg | Out-Null
      git push origin main | Out-Null
      if ($LASTEXITCODE -eq 0) { Trace "pushed sample $n" } else { Trace "push failed sample $n" }
    }
  }
  if ((Get-Date) -ge $end) { break }
  Start-Sleep -Seconds 300
}
git add campaign/samples.jsonl campaign/run-2h.log
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m "campaign complete" | Out-Null
  git push origin main | Out-Null
}
if ($n -lt 1) { Write-Output "FAILED: no samples"; exit 1 }
Write-Output "DONE: samples=$n"
