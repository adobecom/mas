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
Editor setup waits for the selected fragment and preview markup, not successful live price/checkout resolution;
each test retains its own commerce assertions. Save completion uses the live response and refreshed editor state,
not the lifetime of a transient toast. Cached routes finish before their owning page/context closes.
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
Missing (HTTP 404) seed assets are reported and excluded from HAR; their test requests stay live, so caching does not
block unrelated tests or conceal missing dependencies. Seed navigation, readiness, rate-limit and transport failures still fail setup.
Remaining EDS requests are paced at 45 RPS per worker locally and in CI, including `.aem.page` previews.
Worker counts are unchanged; concurrent jobs/runs still multiply the pacing budget.
Per-test attachments report static hits (including HAR), cold/reused editor loads and replayed Odin reads;
the request summary distinguishes browser requests from upstream authoring traffic.

Use `NALA_STATIC_CACHE_DISABLED=1` or `NALA_EDITOR_BOOTSTRAP_DISABLED=1` for uncached comparisons.
To make a suite's editor setup always live, leave `reuseEditor` unset. Cleanup uses exact run-owned IDs and live ETags;
see [Nala cleanup](nala/utils/README-cleanup.md).

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
