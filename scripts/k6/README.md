# Load / Stress tests for ODIN / WCS APIs

## Using for the first time

you need to install k6 on your computer

for macOS (or other OS documented there https://grafana.com/docs/k6/latest/set-up/install-k6/#install-k6)

```
brew install k6
```

## to execute

first make sure you have `TEST_FRAG_URL` and `TEST_WCS_URL` set on your environment (or added to below execution lines)

each ODIN/Scenario takes either one fragment/os id, fetches it, and then sleeps for a given time

- USERS are the number of concurrent users the simulation will ramp up to
- SLEEP is the amount in second slept per user scenario
- DURATION is a cycle length, it will take 4 times that duration overall (1 duration ramp up, 2 durations peak, 1 duration ramp down)

`K6_WEB_DASHBOARD=true k6 --env USERS=10 --env SLEEP=0.1 --env DURATION=2m run ./wcs-fetches.js`
`K6_WEB_DASHBOARD=true k6 --env USERS=10 --env SLEEP=0.1 --env DURATION=2m run ./fragment-fetches.js`

if you ran with K6_WEB_DASHBOARD variable, you'll have live data of your simulation nicely output in localhost:5665

## promotions herd test (MWPW-202263)

`promotions-herd.js` validates the per-surface stale-while-revalidate + single-flight promotions
cache. Unlike the ramp/step scripts it uses **constant-vus** (steady concurrency) and must run long
enough to cross the ~5-min TTL twice. Hit the action **origin directly** (not the CDN) and point
`TEST_FRAG_URL` at the namespace under test:

```
k6 --env USERS=10 --env DURATION=15m --env RUN=main-baseline run ./promotions-herd.js
# redeploy the change, then re-run identically:
k6 --env USERS=10 --env DURATION=15m --env RUN=branch-202263 run ./promotions-herd.js
```

Each request is stamped `x-request-id=<RUN>-<surface>-<vu>-<iter>`, propagated to Odin as
`X-Correlation-ID`. Count promo-list fetches in Splunk by matching `fetch` +
`path=/content/dam/mas/promotions&limit=50`, split on the `<RUN>`/`<surface>` prefix.

## dictionary/placeholder herd test (MWPW-202675)

`dictionary-herd.js` validates the per-layer stale-while-revalidate + single-flight + jittered-TTL
dictionary cache (`createSwrCache`). The worst key is the **global baseline** `acom/<baseLocale>` —
read by every placeholder-bearing request on every surface. The `FRAGMENTS` table is already
populated from a real 5-minute prod window (~5.7k requests): ~30 rows are `en_US` across 6 surfaces
(all reading the shared `acom/en_US` layer, mirroring prod where en_US is ~49% of traffic), 2-3
distinct ids per surface prove the surface baseline is fetched once (not per fragment), and en_US +
country rows (AU/IN/GB/JP/DE/FR/CH/HK) exercise the region overlay. Each row carries its own
validated `apiKey`; `--env APIKEY=...` forces a single key.

RPS is **pinned** (`constant-arrival-rate`) so this stays a "does it work + minimal dictionary
fetches" check, not a stress test — default `RPS=10` (~half the ~19 rps prod baseline in the
excerpt). The branch's dictionary→Odin fetches are decoupled from RPS (single-flight + jittered
TTL), so raising RPS does not raise dictionary traffic on the branch. Run past the ~5-min TTL at
least once and hit the action **origin directly**:

```
# quick smoke (bounded, crosses ~1 expiry):
k6 --env RPS=5 --env DURATION=6m --env RUN=branch-smoke run ./dictionary-herd.js
# before/after comparison (default RPS=10, DURATION=12m ≈ two expiries):
k6 --env DURATION=12m --env RUN=main-baseline run ./dictionary-herd.js
# redeploy the change, then re-run identically:
k6 --env DURATION=12m --env RUN=branch-202675 run ./dictionary-herd.js
```

Each request is stamped `x-request-id=<RUN>-<surface>-<locale>[-<country>]-<vu>-<iter>`, propagated
to Odin as `X-Correlation-ID`. Count dictionary fetches in Splunk by matching `fetch` +
`dictionary/index` (all layers), or `fetch` + `path=/content/dam/mas/acom/en_US/dictionary/index`
for the shared global baseline alone; split on the `<RUN>`/`<surface>`/`<locale>` prefix.
