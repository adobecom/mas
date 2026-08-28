#!/usr/bin/env bash
set -euo pipefail

URLS=(
  "/adobe/contentFragments/byPath?path=/content/dam/mas/acom/settings/index"
  "/adobe/contentFragments/byPath?path=/content/dam/mas/acom/en_US/dictionary/index"
  "/adobe/contentFragments/?path=/content/dam/mas/promotions&limit=50"
  "/adobe/contentFragments/eee876da-9445-4b51-b470-4e80b560f67b?references=all-hydrated"
  "/adobe/contentFragments/e4e8020e-b105-4d6a-9312-8391ac197956?references=all-hydrated"
  "/adobe/contentFragments/d7ec6588-c0b1-4e76-a779-8c6d7016e932?references=all-hydrated"
)
HOSTS=(odinpreview.corp.adobe.com preview.mas.corp.adobe.com)
REPEATS=30     # per URL, per host — keep this small, it's still real Freyja load
CONCURRENCY=3  # mimics a page's overlapping requests, not a stress test

for HOST in "${HOSTS[@]}"; do
  OUT="/tmp/latency_reuse_${HOST}.tsv"
  ALL_URLS=()
  for URL in "${URLS[@]}"; do
    FULL="https://${HOST}${URL}"
    for i in $(seq 1 "$REPEATS"); do ALL_URLS+=("$FULL"); done
  done
  curl -s --http2 -o /dev/null --compressed \
    -H "Origin: https://www.stage.adobe.com" -H "Referer: https://www.stage.adobe.com/" \
    -w "%{http_code}\t%{time_total}\t%{url}\n" \
    "${ALL_URLS[@]}" > "$OUT"
  echo "=== $HOST (persistent connection) ==="
  N=$(wc -l < "$OUT" | tr -d ' ')
  sort -t$'\t' -k2 -n "$OUT" | awk -F'\t' -v n="$N" '
    {a[NR]=$2} END{
      printf "n=%d  p50=%.3fs  p90=%.3fs  p99=%.3fs  max=%.3fs\n",
        n, a[int(n*0.5)], a[int(n*0.9)], a[int(n*0.99)], a[n]
    }'
done
