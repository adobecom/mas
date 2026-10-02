# Nala run-owned fragment cleanup

Automatic cleanup deletes only data owned by the current `NALA_RUN_ID`, never everything recently created by the
automation account. Existing UI clone/create/save/delete flows are unchanged.

## Creation ledger

Global setup creates a durable ledger at `nala/.runs/<NALA_RUN_ID>/`, outside Playwright's cleared results directory.
Workers write independent JSON files, avoiding shared-file update races. Titles contain the run marker, test name,
worker index and retry attempt.

Before a clone, fragment/variation creation or translation-project creation, the helper records an unfinished intent.
Author responses can register run-owned IDs immediately; successful helpers also record the authoritative editor ID
and complete the intent. A failure between the write and ID registration therefore requests recovery.

## Automatic teardown

The Playwright teardown project and existing GitHub `if: always()` steps use `global.teardown.js`.

1. An empty/completed ledger skips browser startup entirely.
2. Otherwise, one authenticated Studio welcome page initializes the repository, using the same Nala browser identity
   and Chromium headers as the tests so IMS initializes consistently.
3. Each recorded ID is fetched live. Cleanup verifies the run marker and exact path, then deletes using the live ETag.
   A 404 means the test already deleted its fragment.
4. Only missing ledgers or unfinished intents trigger recovery searches. Searches filter by the current run marker
   in `nala/en_US`, `nala/fr_FR`, `nala/en_CA`, `nala/en_GB`, `nala/en_AU` and `nala/translations`;
   pagination is deduplicated. Recorded IDs are deleted regardless of their locale or folder.
5. Failures are reported with partial progress and fail teardown. Maintenance operations have a 90-second bound;
   the existing teardown project retains its overall six-minute budget.

Successful cleanup removes fragment/intent entries and retains a small `run.json` completion marker, so a subsequent
workflow cleanup step does not search again. Failed cleanup retains the ledger for recovery. The ledger directory is
gitignored; completion markers are local artifacts, not shared caches.

## Recovering a failed execution

Use its original run marker and the matching authoring environment; do not invent a new run ID:

```sh
NALA_RUN_ID=nala-run-<timestamp>-<suffix> \
LOCAL_TEST_LIVE_URL=https://main--mas--adobecom.aem.live \
node --input-type=module -e "import teardown from './nala/utils/global.teardown.js'; await teardown();"
```

Cleanup uses `nala/.auth/user.json`. `SKIP_AUTH=true` skips automatic cleanup; `PR_BRANCH_LIVE_URL` takes precedence
over `LOCAL_TEST_LIVE_URL`. GitHub setup persists the run ID through `GITHUB_ENV` for the existing follow-up step.
It also persists the resolved test URL, so that separate cleanup step restores authentication on the same origin.
GitHub cleanup remains in the separate `Cleanup cloned cards` workflow step; local cleanup runs in the teardown project.

Cleanup logs its start, run ID, repository initialization, recovery searches, deletion batches, each fragment outcome,
and the original colored summary with per-path found/deleted/failed counts. Recovery logs each path being searched.
Browser script errors, failed requests and HTTP errors are reported during initialization rather
than leaving an unexplained wait.

The separate `cleanup-cloned-cards.js` maintenance utility still supports account/date-based manual cleanup and
dry runs. It is **not** the automatic run-owned cleanup path and can affect other executions using that account:

```sh
node nala/utils/cleanup-cloned-cards.js --dry-run --verbose
node nala/utils/cleanup-cloned-cards.js --help
```
