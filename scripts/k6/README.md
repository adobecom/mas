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