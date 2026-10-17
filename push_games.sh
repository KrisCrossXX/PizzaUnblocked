#!/bin/bash
# push_games.sh — commit+push catalog game dirs in ~600MB batches
set -e
cd "$(dirname "$0")"
i=0
for batch in \
  "scoutdigo coop pizzamassacre" \
  "pizzatower frenzyworlds ptgba" \
  "jwvl demo3 weeniecop" \
  "fnap ptmeta locotower" \
  "ptn2 cheesedupold virdesert" \
  "stuffedcrust septastic smashbash superbonoise" \
  "finalround april2021 ptlapmod" \
  "toobigtofail mininoise sugaryspire sage19plus killnoise ptwv onafpeppino pepperman towerpasta swabs randolap internship ptn patpeppino demo1 popte patpeppinox flappypeppino noisecrusher partytower"
do
  i=$((i+1))
  paths=""
  for d in $batch; do paths="$paths games/$d"; done
  echo "=== batch $i: $batch"
  git add $paths
  git commit -m "Add games batch $i" --quiet
  git push origin main --progress 2>&1 | tail -3
  echo "=== batch $i pushed"
done
echo "ALL DONE"
