# Nala E2E tests

Nala runs Playwright coverage for M@S Studio and Docs. Commands and code paths below are relative to the repository root.
For run-owned fragment deletion and recovery commands, see the [cleanup guide](utils/README-cleanup.md).
For new and updated tests, see the [test-authoring guide](README-test-authoring.md).

## Running tests

Install dependencies and browsers, then configure an `@adobetest.com` test account:

```sh
npm install
npx playwright install
export IMS_EMAIL=<val>
export IMS_PASS=<val>
```

Ask colleagues in Slack for test-account credentials; a personal account may not work.

```sh
npm run nala local
npm run nala MWPW-160756
npm run nala MWPW-160756 mode=ui
```

These commands run `node nala/utils/nala.run.js`, not the GitHub action script.
To reproduce the GitHub script, run `sh nala/utils/gh.run.sh`.

GitHub runs use the PR head branch (`prBranch`, then `GITHUB_HEAD_REF` or the workflow's `branch` value).
Review-triggered runs can have an empty `GITHUB_HEAD_REF`; the PR number in `refs/pull/<number>/merge` is never used
as an EDS branch. Missing branch metadata or an unavailable branch URL fails setup rather than testing main.

## Execution and caching

### Studio setup

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
It also waits for observed author reads, source-store loading and the native fragment-loaded signal before edits.
These guards cannot prevent an application-side initialization race from starting another refresh after readiness.
New fragments wait for editor initialization before template selection;
their preview is checked after a template exists.
Each test retains its own commerce assertions. Save completion uses the live response and refreshed editor state,
not the lifetime of a transient toast. Cached routes finish before their owning page/context closes.
Clone/save/delete helpers perform one UI operation and verify its live response; they do not retry writes internally.
Discard waits for unsaved fragment state before navigating. Spectrum pickers wait for a completed overlay transition
and use keyboard selection; only opening the menu can be retried, never the edit.
Rich-text badge deletion verifies the editor selection and stored field, not just transient DOM text.
Different fragment IDs, locales and URL overrides have separate snapshots. Writer and dedicated navigation/editor
coverage stays cold; no writable fragment or loaded editor tab is shared across tests or executions.
Successful author fragment writes invalidate that fragment's snapshots, including locale/URL variants, so reopening it
does not replay an old body or ETag. Writes to a private clone do not invalidate its unchanged source's bootstrap.
All Studio test pages observe these writes, even when bootstrap replay is disabled for the writing test.

### Docs pages

Docs files run in default mode (independent retries, not serial dependencies), reusing named pages within each file.
Pages load lazily, so unrequested locales/themes do not generate traffic. Shared helpers wait for actual UI/preview
state rather than fixed stabilization delays; viewport/accordion mutations are restored even on failure.

All live Docs suites import `nala/libs/docs-test.js`. Suites using named worker pages retain that lifecycle;
`masdocs.test.js` and Masks request its test-scoped page fixture and keep their own fresh Playwright context/page.
The page fixture is lazy, so named-page suites do not create extra contexts or pages. Both paths share static-request
reporting. API responses, event logs and mask state are not shared or replayed. Benchmark and foreground-timeout tests
retain their original fixtures and timing behavior.

### Run-owned HAR and static cache

Each Playwright invocation records fresh public JS/CSS into run-owned HAR files under `nala/.runs/<run-id>/static/`.
Global setup allocates the run directory; the Docs setup project and authentication setup seed their respective
assets before dependent workers start. Studio recording covers the editor and both OST modes on separate seed pages,
waiting for lazy imports to finish before publishing the archive.
Each Studio seed installs editor readiness observation before navigation and closes its own page before the next seed starts.
Editor setup requires the native `fragment-loaded` notification as well as ready store/preview state; an uninstalled
observer fails explicitly instead of timing out waiting for an event that could never have been recorded.
Workers replay only those current-run assets. HAR files are never committed, reused by another invocation/PR, or restored
from a CI cache, and global setup's teardown removes them after the run (interrupted runs can leave unused files).
Unrecorded assets fall back to the network and the bounded worker-local static cache; fonts and images also use that cache.
Documents, authenticated/cookie-bearing requests, API responses, errors and private/no-store responses are not cached.
At test completion Nala cancels that page's queued reads and closes only its owned page, without draining irrelevant
background reads. Native author mutations and creation-ledger response payloads settle before closure within a 30-second
teardown budget; failed mutations remain failures. In-flight static loads belong to their page, while completed public
responses can be shared within the worker, so closing one page cannot poison another page's load.
Read-only author `search` and `referencedBy` POSTs are cancellable reads, not writes, and are never automatically retried.
`referencedBy` stays live even during editor bootstrap. Aborted application reads release their queued work immediately,
including during navigation and search, rather than remaining scheduled until test teardown.
Mutation transport errors include the method, origin/path and browser failure reason.
Worker-scoped Docs pages also drain handlers between tests so background requests remain attributed to the owning test.
Missing (HTTP 404) seed assets are reported and excluded from HAR; their test requests stay live, so caching does not
block unrelated tests or conceal missing dependencies. Seed navigation, readiness, rate-limit and transport failures still fail setup.

## Request scheduling and rate limits

### Cooldowns and Odin scheduling

Nala logs observed HTTP 429s with the method, origin/path and `Retry-After`. `Retry-After` seconds or HTTP dates take priority;
missing or invalid values use 10 seconds. Only EDS/Odin responses impose Nala cooldowns; unrelated third parties are logging-only.
Nala-applied cooldowns above 60 seconds fail explicitly instead of parking the shared budget
past test deadlines or retrying earlier than the server permits.
Response-reporting failures are confined to the owning page and surfaced during requests or teardown; they do not poison
later tests in the worker. Settled reports are removed on both success and failure. Backend cooldowns remain shared.
A fresh loopback coordinator shares origin cooldowns across this invocation's workers;
it stops at teardown and is never reused between runs or PRs. Subsequent requests to the same origin wait for the cooldown,
for EDS/Odin traffic on test and HAR seed pages; IMS and unrelated third-party services remain logging-only.
After an origin returns 429, recovery requests are released at least 100ms apart across workers for the remainder of the run.
This recovery spacing is not an assumption about the service's published limit; unrelated origins remain independent.
Intercepted test Odin author and preview traffic share an invocation budget from the first request, derived from the shared
20 request-starts/second default and any configured fleet allocation.
Buffered Odin GET reads additionally share three in-flight permits across the invocation's workers;
cached assets use neither budget. Read-only POSTs remain browser-managed and start-paced, not buffered.
`NALA_ODIN_PREVIEW_MAX_RPS` and `NALA_ODIN_PREVIEW_MAX_IN_FLIGHT` tune these positive, run-wide budgets, not per-worker limits.
These are benchmark starting points, not published Odin limits. One 429 burst halves the shared rate once;
repeated responses extend the shared cooldown without repeatedly halving it. Adaptive spacing is bounded at 1 second
(or the configured spacing if already slower). After at least 20 non-throttled responses (including expected 404s) and
10 seconds of recovery, the rate increases by 1 RPS, never above its configured maximum.
Queued page owners receive round-robin grants; cancelling one owner's reads does not cancel another owner's requests.
Within an owner's queue, writes, CSRF/model requests and active-editor Odin requests
take priority over inventory reads. UUID searches and active repository mutation operations also prioritize their Odin dependencies
(including dictionaries/settings). Read-only observation of native search input distinguishes these searches from
background configuration lookups; subscribing to the public repository operation store identifies mutation work
until that operation completes. Background fragment lookups alone do not receive foreground priority.
No application events or requests are synthesized. A new document resets these phases.
After three foreground grants, an available background request receives a grant,
preventing starvation. Occupied read permits do not block native writes that need only a paced start.
Priority changes neither the request-start budget nor the in-flight limit. Pressure reports include foreground starts
and their maximum queue wait; per-test attachments distinguish application cancellations from teardown cancellations.
Other origins retain their existing recovery spacing.
Permits cover the upstream fetch only: they are released on success or transport failure and before retry waiting.
Intercepted preview fetches are bounded at 60 seconds and author fetches at 30 seconds; other hosts keep their existing fetch timeout.
Abandoned permits expire with a logged warning after 90 seconds. A known expired permit's late release is logged and ignored;
unknown permits still fail explicitly.
Native documents, writes and streaming/range requests remain browser-managed and are start-paced rather than buffered
to enforce the read-concurrency limit. Writes are never automatically retried.

### Authentication, retries and live reads

The existing user agent is unchanged. A possible UA-based upstream bucket is respected, not bypassed by rotating identities;
separate CI runs using the same bucket can still affect one another.
The authentication page logs native IMS 429s without adding cooldowns, leaving IMS's login request timing unchanged.
Odin traffic on that page still uses its shard's pacing, read permits and cooldowns. After storage state is captured,
owned route teardown closes the authentication page before HAR recording, so welcome-page previews cannot keep loading in the background.
Its public static asset requests still honor cooldowns and the existing EDS pacing.
Authentication submits each form once and waits within the existing 180-second setup budget, including cooldowns.
Public static GETs and eligible EDS/Odin fetch/XHR GETs retry a 429 once after cooldown, including live Odin reads.
Eligible GETs also retry a recognized transient connection reset once, within the same two-attempt limit.
Cancelled requests and timeouts are not retried. Native EDS/Odin HTTP 503/529 responses with `Retry-After` coordinate subsequent
cooldowns but still reach the application unchanged; overload responses are not converted into successes.
Outside the explicitly opted-in immutable seed bootstrap, completed API responses are never cached;
persistent 429s reach the browser unchanged.
Concurrent Odin preview `settings/index` lookups with identical full URLs and request headers share only their
in-flight read within one owned page. Completed responses, including missing settings and errors, are not retained:
the next lookup is live. Native mutations advance the page's read generation, preventing read-after-write requests
from joining earlier reads. Cancelling one consumer does not cancel another; cancelling every consumer releases queued work.
No sharing occurs across pages, workers, shards or PRs, and ordinary fragment/commerce reads remain independent.
Per-test attachments and request summaries report coalesced settings reads separately from cached setup reads.
Transport failures on intercepted API reads are logged and returned as failed browser requests, not successful responses.
Network diagnostics also count browser HTTP 4xx/5xx outcomes, transport failures and aborted reads. Non-404 HTTP errors
and unexpected transport failures log only the method and origin/path, never query strings or response bodies.
Cookie-setting responses are neither retried nor cached. Authentication endpoints, streaming/range reads, documents and writes
are not retried automatically. Pacing can be disabled without disabling 429 diagnostics.

### Worker and fleet budgets

Both aggregate request budgets have one source of defaults in `nala/libs/request-budgets.js`: EDS 180 RPS and Odin 20 RPS.
Every Playwright invocation resolves its actual worker count during global setup, including `--workers` and percentage
overrides, and passes the allocation to its test workers, authentication and HAR seed pages. A local run receives the
whole invocation budget: EDS divides 180 by the resolved workers; Odin shares 20 across the invocation's coordinator.
For example, `--workers=8` gives EDS 22.5 RPS per worker, not eight copies of a fixed 45-RPS cap. Increasing workers does not
increase either aggregate default. Fractional EDS caps are supported; site requests include `.aem.page` previews.
CI defines infrastructure in `.github/workflows/run-nala.yml`: `NALA_TOTAL_WORKERS=12`, with Studio allocations of 4, 4 and 3
on three pinned runners and one Docs worker. EDS divides its budget by total fleet workers (15 RPS per worker).
Odin partitions its budget by `NALA_WORKER_COUNT / NALA_TOTAL_WORKERS`; each shard's independent cleanup retains its
allocation. Both fleet counts must be supplied together, and startup fails if Playwright asks for more workers than
the job's allocation. Fewer actual workers remain within the reserved budget.
`NALA_EDS_TOTAL_MAX_RPS` and `NALA_ODIN_MAX_RPS` override aggregate defaults in either local or CI runs.
Change defaults in the shared module, not individual jobs; workflows need only define their infrastructure.
`NALA_EDS_MAX_RPS` remains a legacy per-worker override; `NALA_ODIN_PREVIEW_MAX_RPS` overrides an invocation's Odin
allocation. These overrides bypass fleet-derived caps and are intentionally unset by the PR workflow.
Startup prints the actual/allocated workers, total budgets and effective EDS-per-worker/Odin-per-invocation caps.
Explicit per-worker/per-invocation overrides or disabling EDS pacing produce a warning because they can exceed the allocation.
Separate simultaneous invocations/machines still do not share a dynamic coordinator; use explicit allocations if they overlap.

## Studio CI sharding

Studio selection is complete and disjoint: `mixed-1`, `mixed-2` and `mixed-3` mix saves, editor checks and navigation
using measured successful-test durations, balanced against their 4/4/3 worker capacities. San Jose owns Individuals
edit/discard and saves; Oregon anchors regional variations; Noida receives the smaller Pro and Suggested suites instead
of Individuals saves. Save suites and OST coverage are still spread across the pool.
Whole files stay together to preserve worker-local bootstrap reuse. Selection is defined by suite-family policies, not a list
of current files: new tests in an existing file and new files under a known suite are included automatically, even in nested
directories. Workload overrides recognize `save`, `css` and `edit` filename/path words. Fries gradient and OST authoring/bundle
coverage have their own feature-group overrides. The rules live together in `nala/utils/studio-shards.js`.
New suite families use the following domain defaults; known-family overrides take precedence:

| New suite domain      | Saves   | Edit/discard | CSS     | Other workflows |
| --------------------- | ------- | ------------ | ------- | --------------- |
| `acom`                | mixed-3 | mixed-1      | mixed-2 | mixed-2         |
| `ahome`               | mixed-2 | mixed-1      | mixed-3 | mixed-2         |
| `ccd`                 | mixed-1 | mixed-3      | mixed-2 | mixed-2         |
| `commerce`            | mixed-3 | mixed-1      | mixed-2 | mixed-2         |
| Other new directories | mixed-2 | mixed-3      | mixed-1 | mixed-2         |

Root-level Studio specs stay with the main navigation tests in mixed-3. Renaming a file within the same suite/workload does
not arbitrarily move it to another shard. New coverage cannot be omitted by a stale manifest and each file belongs to exactly
one shard. This guarantees discovery, not duration balance for unknown future workloads; review suite-level policies when
coverage or timings change substantially. No writer semaphore or serial test mode is added.
Existing tags and `nopr` exclusions still apply.

| Shard     | Runner   | Workers | Main workload                  | Complementary coverage                                                     |
| --------- | -------- | ------- | ------------------------------ | -------------------------------------------------------------------------- |
| `mixed-1` | San Jose | 4       | Individuals edit/discard/saves | OST authoring/bundle, placeholders                                         |
| `mixed-2` | Oregon   | 4       | Regional variations            | Try-buy, Slice and gradient saves, core OST, translation/version workflows |
| `mixed-3` | Noida    | 3       | Smaller Pro/Suggested suites   | Ordinary Fries saves, Slice editors, navigation/settings                   |

Individuals suite defaults keep new save/editor files on San Jose, including files without workload words in their names;
its CSS override remains on Oregon. Preserve these suite policies and their runner mapping when changing the workflow
matrix or selector.

Each shard authenticates independently and records its own fresh HAR; neither HAR nor authentication state is shared
between shards or PRs. Concurrent PR suites are not globally serialized.

## Interaction readiness

Studio rich-text edits use native field input and wait for the editor model to commit, not only the editable DOM.
Clears verify that native select-all covers the document's editable bounds before sending one delete, without requiring
a particular ProseMirror selection type. Shared picker selection recovers opening/actionability failures only before native
pointer input begins, selects the visible, enabled option once and waits for its public change event, value and closed state.
It does not rely on global keyboard focus or select intermediate options. No selection or mutation is retried.
These checks preserve live saves and mandatory discard confirmations; they do not retry writes or force clicks.
New-fragment preview failures include source, preview and rendered variants plus preview/card failure state;
they do not trigger reloads or repeat saves.
Private clone-source tag writes consume their response body before navigating away. Receiving successful headers alone
does not mean the browser transport has finished; navigating earlier can cancel that write response and falsely fail teardown.
Accessibility scans wait for finite animations in the tested section to finish, so accordion fades are not
mistaken for permanent contrast failures. Infinite animations do not block scans; accessibility thresholds are unchanged.
Translation search uses the ordinary product search term defined in its spec and waits for the committed query and results.
Filter checks verify both pending and committed picker selections, rather than treating a closed popover as success.
Inventory updates that reset selections still fail these checks; application behavior is not changed or retried.
Variation tests follow Studio's grouped-only creation rules while retaining non-US rejection and legacy override/restore coverage.
Each feature defines its own fixture data. Locale selection checks visibility, actionability, popover closure and committed tags;
new variations still use one creation action and the ownership ledger.

## Concurrency boundaries

The coordinator is local to one invocation: separate machines do not share dynamic cooldowns.
Static CI allocations bound participating jobs because each pinned runner executes one job at a time, including when
different PR shards overlap. This is not a deployed distributed coordinator: legacy workflows, external/local runs and
additional runner instances are outside that bound and require adoption or a revised allocation.

## PR approvals, retries and the required gate

`Check Label and Approvals` reads the current PR label and write-access approvals without waiting for Nala.
Both E2E jobs use the live PR head branch, owner, repository and SHA; review events never use a PR number as an EDS branch.
A workflow for an older PR commit does not run tests against the newer head.

Reviews and unrelated label changes do not restart tests that are already running or have a result for the same commit.
New commits, deliberately re-adding `run nala`, and manual workflow retries request execution explicitly.
Label/review events skip superseded-run cancellation without blocking E2E launch. Both E2E jobs require successful
direct prerequisites and a non-cancelled workflow; Docs also requires successful identity resolution.
On a new commit, `Cancel Superseded Nala Runs` requests cancellation of older active Nala workflows for that PR before
the label/approval check. This does not depend on approvals or the new E2E jobs being eligible to start.
It does not cancel other PRs or newer workflows, and an already superseded push cannot cancel the current head's runs.
The cancellation job executes no PR checkout and is the only job in this workflow with Actions write permission.
The API acknowledges the cancellation request; previous cleanup may still be running.
The job passes superseded workflow identities to the resolver, which excludes their checks immediately, even for the same SHA.
The gate waits only for relevant current-commit checks. A cancellation API failure blocks launch and fails the gate explicitly.
Concurrency is scoped to the heavy jobs, separately for each Studio shard and Docs: incidental reviews do not cancel an active suite.
The fixed 4/4/3 Studio and 1 Docs allocation and invocation-owned HARs remain unchanged.

`Nala Gate` resolves the latest result for each of the three Studio shards and Docs.
Missing, failed or started-and-cancelled tests cannot pass; an in-flight retry takes precedence over an earlier failure.
Retrying a failed shard can reuse the other shards' and Docs' passing results for the same commit.
The label/approval check never waits for tests. A duplicate review/label gate whose own E2E jobs skipped also returns
immediately with the current verdict; completion refresh or a manual gate-only retry resolves it after the tests finish.
Launch deduplication excludes this workflow's own checks by suite and workflow-run URL.
When both E2E jobs were skipped, the gate also excludes those own check records instead of waiting on jobs that never executed.
Resolver logs identify each selected check's status and job URL, including checks from another workflow.
If a recheck skips E2E jobs because another run is queued or running, follow those URLs to inspect the owning run.
The gate reports waiting progress every minute and prints updated per-check results when they change.
Fork PRs cannot launch Nala or cancel runs because authentication secrets are unavailable; nontrivial fork PRs receive
an explicit gate error rather than a misleading cancellation failure.

`Refresh Nala Gate` reconciles completed Nala workflows with the latest Studio shard and Docs results for the current head.
It refreshes the latest stale failed gate separately for `pull_request` and `pull_request_review`, so a newer push gate
does not hide a review gate that reported tests still running. Missing or in-flight E2E results defer refresh.
Only gates that started before the final E2E result are stale; gate-only retries evaluate after that result and do not loop.
This uses execution timestamps, not per-job attempt numbers, which GitHub can change for carried-forward results.
It only retries terminal gates, never an older preflight gate with downstream tests, and leaves queued/running workflow
attempts untouched. Completion of a late-finishing review gate also reconciles results, covering completion-event ordering.
Automatic refresh stops when the target workflow reaches attempt 3, independently of per-job attempt metadata.
Further gate retries must be requested manually.
Closed PRs and runs for an older head are ignored. The refresh workflow executes no PR-authored code.
The scheduled/manual `Nala Daily Run` workflow is deprecated and removed; it no longer competes for the PR shard runners.

**Deployment:** GitHub only runs the completion-triggered refresh after its workflow file is on the default branch.
Before that, a gate from a separate review-triggered workflow may need a manual gate-only retry after Nala passes.
The main ruleset must require `Nala Gate`, not the old individual Studio/Docs check names.

## Reporting and cleanup

Per-test attachments report static hits (including HAR), cold/reused editor loads and replayed Odin reads;
the request summary includes AEM author and Odin preview separately, with retries included in upstream totals.
A separate per-origin rate-limit summary reports every observed 429, GET retries and summed request pacing/cooldown waits
(not wall-clock time). Native authentication 429s remain visible in the console.
An Odin pressure summary and `test-results/odin-pressure.json` also record the entire run, including setup:
the coordinator's wall-clock observation window, scheduled upstream reads, peak scheduled starts/second,
peak read concurrency, mean/max fetch latency, summed and mean/max queue waiting, queued/cancelled acquisitions,
sanitized endpoint counts and observed user agents. No query strings, credentials or response bodies are retained.
Per-test attachments include cancelled reads, outstanding route handlers and owned teardown time.
Retried timeout attempts do not inflate the final failed-test count.
The PR Nala workflow does not upload test artifacts: screenshots and error-context files are not assumed credential-free,
especially when authentication fails. Failure screenshots remain enabled both locally and in CI; CI traces remain disabled,
and local retry traces retain their existing behavior. Auth state, HARs, run ledgers and generated reports are not published as CI artifacts.
Studio CI prints the styled Nala summary and test-only request/pressure totals immediately after the test suite.
The independent cleanup step prints its own outcomes and maintenance-only request/pressure totals.
CI cleanup uses its own fresh coordinator and records `test-results/odin-pressure-cleanup.json`; pressure measurements
are labelled by phase, so the completed test snapshot is not presented as cleanup traffic.
Cleanup errors remain visible and retain the run ledger within the current checkout, but cannot fail an otherwise passing CI job.
Accepted asynchronous deletions are reported as pending and retain their ownership records; cleanup adds no polling or
extra requests, and a later cleanup with those records checks for absence without resubmitting an already accepted deletion.
CI does not persist or restore these records across jobs: a subsequent clean checkout removes them.
Recovery is manual while the original ledger remains available; a run-marker search cannot reconstruct lost pending-deletion state.
Docs and local runs keep their existing end-of-test reporting.

## Clone isolation and editor readiness

To make a suite's editor setup always live, leave `reuseEditor` unset. Cleanup uses exact run-owned IDs and live ETags;
see the [cleanup guide](utils/README-cleanup.md).
All eight clone/save suites now opt into the same worker-local seed-bootstrap snapshots as editor/discard suites.
Most save routes already opened the editor directly; the French legal-disclaimer route now does so too, preserving its locale.
Contexts, pages and fragment stores remain fresh per test. Only successful initial source reads are replayed;
each clone, its initialization, subsequent edits, saves, reads and deletions stay live. Grid/search/navigation tests keep
their existing routes and coverage; mutated clones are never shared between tests.
Editor readiness waits for all outstanding page-owned author reads, including promotion searches and reference resolution,
then rechecks the editor/store state. A completed fragment GET alone does not mean related hydration has finished.
UI clone tests provision an immutable source with an explicitly unique name for each run, worker and source fixture.
Only its ID is reused within that worker; each test still creates and edits its own clone through the live UI.
This isolates AEM's automatic copy-name allocation across workers and machines without rewriting clone requests or retrying writes.
Source fixtures preserve the model, content and tags, omit variations as normal copies do, and join the run-owned cleanup ledger.
Attachments include source creation/reuse counts. This is test isolation, not a fix for the application's concurrent-copy behavior;
separate machines still need an explicit aggregate Odin/EDS traffic budget.

Version tests wait for loaded history, hydrated previews, rendered search results and completed breadcrumb navigation;
these waits add no polling HTTP requests. Live edits, commerce reads and mutations remain uncached.
Fragment creation waits for its successful live POST, closed dialog and run-owned editor identity, not a transient toast.
Locale-only URL changes do not invalidate an already loaded source editor when Studio does not initialize it again.
Placeholder reads wait for hydrated table cells rather than snapshotting an empty row host. Variation expansion preserves
automatically expanded rows and waits for reference loading instead of toggling them closed or using fixed delays.
Checkout-parameter assertions wait for the live checkout link to resolve its URL; they do not trigger new commerce requests.
Save actionability is checked before the final dirty-state boundary; the actual save is still one native click and one live write.

## CI dependency preparation

PR jobs use `.github/actions/setup-nala` to cache installed root Nala dependencies and Chromium binaries separately.
Nala does not need the I/O backend or application workspace installations: cold preparation uses
`npm ci --workspaces=false --include=dev` against the existing root lockfile. Application build/test commands are unchanged.
Installed dependency keys include the root lockfile, manifest and project npm configuration, plus actual runner OS release,
kernel, architecture, glibc, Node version/ABI, npm version and runner-image metadata. Exact cache hits validate the installed tree
and execute the Playwright, accessibility and native esbuild dependencies offline; invalid cached installations are logged
and replaced using `npm ci`. Root installation hooks, if added, require a fresh install rather than reusing code-dependent effects.
Chromium keys use the same runner fingerprint and installed Playwright version, not branch names or test configuration.
Only Chromium is installed in a job-local browser directory, so unrelated browsers or old revisions on self-hosted runners
cannot inflate the cache. Installation verifies its required revisions even on a cache hit. A real browser launch/render
probe checks system libraries on every job; apt runs only for recognized missing dependencies and a second probe must succeed.
System directories and apt state are not cached. Package-manager lock waits and repair attempts are bounded and never kill
runner updates. Cache downloads have a two-minute segment timeout, npm fetches have bounded retries/timeouts, and preparation
has a ten-minute step budget. Cache service failures remain visible and fall back to ordinary installation.
Dependencies are saved before the tests, so a failing suite does not prevent reuse on a later run. GitHub cache branch-access
rules still apply; a new PR may need a cold install if no compatible base-branch cache is available.
Authentication, run-owned fragments, HARs and results are never part of these dependency caches.
