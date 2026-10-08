# Merch At Scale

This project is a library of web components providing merchandising content to various surfaces.

## Environments

- Preview: https://main--mas--adobecom.aem.page/
- Live: https://main--mas--adobecom.aem.live/

## Feature branch name

Feature branches need to have the name in format `MWPW-XXXXXX` where `XXXXXX` is the ticket number in Jira, otherwise IMS client regex check will fail and user will not be able to sign in.

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

```
npm run build
npm run studio
```

to test gallery:

1. shut down npm run studio if you were running it.
2.

```
npm run gallery
```

Refer to the corresponding README.md under any of the packages:

- studio - M@S Studio for creating, updating and publishing merch fragments
- ost-audit - crawls EDS pages HTML for OST links and generates a CSV report

## Nala E2E tests

for initial setup:

```sh
npm install
npx playwright install
export IMS_EMAIL=<val>
export IMS_PASS=<val>
```

Ask colleagues/slack for IMS_EMAIL and IMS_PASS values, your user might not work as expected because it's not '@adobetest.com' account.

`npm run nala local` - to run on local
`npm run nala MWPW-160756` - to run on branch
`npm run nala MWPW-160756 mode=ui` - ui mode

Beware that 'npm run nala' runs `node nala/utils/nala.run.js`, it's not the script that GH action does.
If you want to debug GH action script run sh `nala/utils/gh.run.sh`

GitHub runs use the PR head branch (`prBranch`, then `GITHUB_HEAD_REF` or the workflow's `branch` value).
Review-triggered runs can have an empty `GITHUB_HEAD_REF`; the PR number in `refs/pull/<number>/merge` is never used
as an EDS branch. Missing branch metadata or an unavailable branch URL fails setup rather than testing main.

### Request-efficient setup

Studio tests keep fresh browser contexts. Repeated edit/discard, OST, discount and field-editor setups opt into
`test.use({ reuseEditor: true })` and call `studio.openPage(testPage)`. The first successful editor load per full URL
and worker records authoring read responses; subsequent setups replay those bytes into a new context:

```text
Cold seed load -> worker-local bootstrap snapshot
                            |
Next test -> fresh context -> replay setup -> editor/preview ready -> LIVE test actions
```

Replay ends before assertions/actions: discard, refresh, navigation, searches, saves and deletes remain live.
Editor setup waits for the selected fragment and preview markup, not successful live price/checkout resolution.
It also waits for source-fragment refreshes to finish before edits, including overlapping reads for that ID,
so refreshed data cannot overwrite test input. New fragments wait for editor initialization before template selection;
their preview is checked after a template exists.
Each test retains its own commerce assertions. Save completion uses the live response and refreshed editor state,
not the lifetime of a transient toast. Cached routes finish before their owning page/context closes.
Clone/save/delete helpers perform one UI operation and verify its live response; they do not retry writes internally.
Discard waits for unsaved fragment state before navigating. Spectrum pickers wait for a completed overlay transition
and use keyboard selection; only opening the menu can be retried, never the edit.
Rich-text badge deletion verifies the editor selection and stored field, not just transient DOM text.
Different fragment IDs, locales and URL overrides have separate snapshots. Writer and dedicated navigation/editor
coverage stays cold; no writable fragment or loaded editor tab is shared across tests or executions.

Docs files run in default mode (independent retries, not serial dependencies), reusing named pages within each file.
Pages load lazily, so unrequested locales/themes do not generate traffic. Shared helpers wait for actual UI/preview
state rather than fixed stabilization delays; viewport/accordion mutations are restored even on failure.

`masdocs.test.js` and Masks use `nala/libs/docs-test.js`: each test keeps its own fresh Playwright context/page,
with public static-asset caching and per-test request metrics only. API responses, event logs and mask state are not
shared or replayed. Benchmark and foreground-timeout tests retain their original fixtures and timing behavior.

Each Playwright invocation records fresh public JS/CSS into run-owned HAR files under `nala/.runs/<run-id>/static/`.
Global setup allocates the run directory; the Docs setup project and authentication setup seed their respective
assets before dependent workers start. Studio recording covers the editor and both OST modes on separate seed pages,
waiting for lazy imports to finish before publishing the archive.
Workers replay only those current-run assets. HAR files are never committed, reused by another invocation/PR, or restored
from a CI cache, and global setup's teardown removes them after the run (interrupted runs can leave unused files).
Unrecorded assets fall back to the network and the bounded worker-local static cache; fonts and images also use that cache.
Documents, authenticated/cookie-bearing requests, API responses, errors and private/no-store responses are not cached.
Nala drains its active static/API route handlers before removing interception or closing pages.
Worker-scoped Docs pages also drain handlers between tests so background requests remain attributed to the owning test.
Missing (HTTP 404) seed assets are reported and excluded from HAR; their test requests stay live, so caching does not
block unrelated tests or conceal missing dependencies. Seed navigation, readiness, rate-limit and transport failures still fail setup.

Nala logs observed HTTP 429s with the method, origin/path and `Retry-After`. `Retry-After` seconds or HTTP dates take priority;
missing or invalid values use 10 seconds. A fresh loopback coordinator shares origin cooldowns across this invocation's workers;
it stops at teardown and is never reused between runs or PRs. Subsequent requests to the same origin wait for the cooldown,
including IMS, Odin and third-party services on test and HAR seed pages; no hosts are excluded.
After an origin returns 429, recovery requests are released at least 100ms apart across workers for the remainder of the run.
This recovery spacing is not an assumption about the service's published limit; unrelated origins remain independent.
Odin preview is paced from the first upstream request across the entire run, initially at 10 request starts/second.
Intercepted preview reads additionally share three in-flight permits across workers; cached assets use neither budget.
`NALA_ODIN_PREVIEW_MAX_RPS` and `NALA_ODIN_PREVIEW_MAX_IN_FLIGHT` tune these positive, run-wide budgets, not per-worker limits.
These are benchmark starting points, not published Odin limits. One 429 burst halves the preview rate once;
repeated responses extend the shared cooldown without repeatedly halving it. Adaptive spacing is bounded at 1 second
(or the configured spacing if already slower). After at least 20 successful reads and 10 seconds of recovery,
the rate increases gradually, never above its configured maximum. Other origins retain their existing recovery spacing.
Permits cover the upstream fetch only: they are released on success or transport failure and before retry waiting.
Intercepted preview fetches are bounded at 60 seconds; other hosts keep their existing fetch timeout.
Abandoned permits expire with a logged warning after 90 seconds.
Native documents, writes and streaming/range requests remain browser-managed and are start-paced rather than buffered
to enforce the read-concurrency limit. Writes are never automatically retried.
The existing user agent is unchanged. A possible UA-based upstream bucket is respected, not bypassed by rotating identities;
separate CI runs using the same bucket can still affect one another.
The authentication page logs native 429s without adding cooldowns, leaving IMS's login request timing unchanged.
Its public static asset requests still honor cooldowns and the existing EDS pacing.
Authentication submits each form once and waits within the existing 180-second setup budget, including cooldowns.
Public static GETs and eligible fetch/XHR GETs retry a 429 once after cooldown, including live Odin reads.
API responses are never cached; persistent 429s reach the browser unchanged.
Transport failures on intercepted API reads are logged and returned as failed browser requests, not successful responses.
Cookie-setting responses are neither retried nor cached. Authentication endpoints, streaming/range reads, documents and writes
are not retried automatically. Pacing can be disabled without disabling 429 diagnostics.
Remaining EDS requests are paced at 45 RPS per worker locally and in CI, including `.aem.page` previews.
Worker counts are unchanged; concurrent jobs/runs still multiply the pacing budget.
Studio rich-text edits use native field input and wait for the editor model to commit, not only the editable DOM.
Clears verify that native select-all covers the document's editable bounds before sending one delete, without requiring
a particular ProseMirror selection type. Shared picker selection recovers opening/actionability failures only before native
pointer input begins, selects the visible, enabled option once and waits for its public change event, value and closed state.
It does not rely on global keyboard focus or select intermediate options. No selection or mutation is retried.
These checks preserve live saves and mandatory discard confirmations; they do not retry writes or force clicks.
New-fragment preview failures include source, preview and rendered variants plus preview/card failure state;
they do not trigger reloads or repeat saves.
Accessibility scans wait for finite animations in the tested section to finish, so accordion fades are not
mistaken for permanent contrast failures. Infinite animations do not block scans; accessibility thresholds are unchanged.
Translation search uses an already-loaded baseline card or this run's immutable source, never another run's temporary cards.
Filter checks verify both pending and committed picker selections, rather than treating a closed popover as success.
Inventory updates that reset selections still fail these checks; application behavior is not changed or retried.
The coordinator is local to one invocation: separate machines do not share service budgets or cooldowns.
Per-test attachments report static hits (including HAR), cold/reused editor loads and replayed Odin reads;
the request summary includes AEM author and Odin preview separately, with retries included in upstream totals.
A separate per-origin rate-limit summary reports every observed 429, GET retries and summed request pacing/cooldown waits
(not wall-clock time). Native authentication 429s remain visible in the console.
An Odin pressure summary and `test-results/odin-pressure.json` also record the entire run, including setup:
the coordinator's wall-clock observation window, scheduled upstream reads, peak scheduled starts/second,
peak read concurrency, mean/max fetch latency, summed queue waiting,
sanitized endpoint counts and observed user agents. No query strings, credentials or response bodies are retained.
Studio CI prints the styled Nala summary and test-only request/pressure totals immediately after the test suite.
The independent cleanup step prints its own outcomes and maintenance-only request/pressure totals.
CI cleanup uses its own fresh coordinator and records `test-results/odin-pressure-cleanup.json`; pressure measurements
are labelled by phase, so the completed test snapshot is not presented as cleanup traffic.
Cleanup errors remain visible and retain the run ledger for recovery, but cannot fail an otherwise passing CI job.
Docs and local runs keep their existing end-of-test reporting.

Use `NALA_STATIC_CACHE_DISABLED=1` or `NALA_EDITOR_BOOTSTRAP_DISABLED=1` for uncached comparisons.
To make a suite's editor setup always live, leave `reuseEditor` unset. Cleanup uses exact run-owned IDs and live ETags;
see [Nala cleanup](nala/utils/README-cleanup.md).
All eight clone/save suites now opt into the same worker-local seed-bootstrap snapshots as editor/discard suites.
Most save routes already opened the editor directly; the French legal-disclaimer route now does so too, preserving its locale.
Contexts, pages and fragment stores remain fresh per test. Only successful initial source reads are replayed;
each clone, its initialization, subsequent edits, saves, reads and deletions stay live. Grid/search/navigation tests keep
their existing routes and coverage; mutated clones are never shared between tests.
UI clone tests provision an immutable source with an explicitly unique name for each run, worker and source fixture.
Only its ID is reused within that worker; each test still creates and edits its own clone through the live UI.
This isolates AEM's automatic copy-name allocation across workers and machines without rewriting clone requests or retrying writes.
Source fixtures preserve the model, content and tags, omit variations as normal copies do, and join the run-owned cleanup ledger.
Attachments include source creation/reuse counts. This is test isolation, not a fix for the application's concurrent-copy behavior;
separate machines still need an explicit aggregate Odin/EDS traffic budget.

Version tests wait for loaded history, hydrated previews, rendered search results and completed breadcrumb navigation;
these waits add no polling HTTP requests. Live edits, commerce reads and mutations remain uncached.

Offline setup regression checks (no IMS, Odin or EDS requests):

```sh
node --test nala/tests/setup-cache.unit.js
npx playwright test --config=nala/tests/setup-cache.config.js --workers=3
```

# CI/CD

documented in .github/README.md

#### Troubleshooting

Please reach out to us in `#merch-at-scale` for any questions.

Getting issues commiting changes in /io/www?
Make sure to install node >22.16 and set it as default. Husky precommit hook will try to run tests and build:client script. Be careful if you have 22 node lower then 22.16 - it will not work.

```sh
nvm install 22
nvm alias default 22
nvm uninstall 22.2.0
```

restart IDE.
