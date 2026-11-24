# Writing Nala tests

Use these conventions for new or updated Studio and Docs tests. For execution, caching and CI behavior, see the
[Nala guide](README-nala.md); for ownership and recovery, see the [cleanup guide](utils/README-cleanup.md).

## Fixtures and test data

Studio tests belong under `nala/studio/<feature>/tests/` and import `test`, `expect` and page objects from
`nala/libs/mas-test.js`. Live Docs tests belong under `nala/docs/` and import `test` and `expect` from
`nala/libs/docs-test.js`. Do not bypass these fixtures with a direct Playwright `test` import: they install request
pacing, static caching, reporting and owned teardown. Benchmark/timing tests retain their dedicated fixtures.

Keep test inputs in the feature's spec: fragment IDs, OSIs, locales, search terms and expected content.
Define each feature's data explicitly; reuse shared constants such as `PRICE_PATTERN`, not a mutable shared data object.
Include the existing `@mas-studio` or `@mas-docs` tag and a specific scenario tag.

## Studio setup and isolation

Call `setTestPage(testPage)` for failure reporting and `await studio.openPage(testPage)` for the starting route.
The Studio fixture creates fresh page objects and a fresh context for each test. Do not share a writable fragment,
page, context or editor store between tests, or rely on another test having run first.

Leave `reuseEditor` unset for navigation, initialization, refresh and other scenarios whose setup reads are themselves
under test. For repeated editor or clone/save setups against an immutable source, a suite can opt into
`test.use({ reuseEditor: true })`. This reuses only successful initial source reads; edits, commerce assertions,
refreshes, saves and deletes must remain live. Do not add test-specific HAR files or broader API mocks to make an E2E pass.

Persisted changes must use a test-owned clone or newly created fragment, not a shared baseline.
Use `studio.cloneCard()`, `studio.createFragment()` and `studio.createVariation()` for their supported flows.
These helpers register creation intent and ownership; use their returned IDs to locate the result:

```js
const clonedId = await studio.cloneCard(data.cardid);
await editor.fillRteField(editor.title, data.title);
await studio.saveCard();
await expect(await studio.getCard(clonedId)).toBeVisible();
```

Do not find a clone by selecting any fragment different from the source ID or by matching a generic name.
Unsaved edit/discard scenarios can use baseline fixtures, but must use `studio.discardEditorChanges(editor)` and verify
that the original content is unchanged. Keep a real UI delete action when deletion is the behavior under test.

If a new creation flow cannot use an existing helper, integrate `beginFragmentCreation()` before the single creation
action and `completeFragmentCreation()` after successful creation. Follow existing helpers rather than adding separate
cleanup searches. New recovery folders must also be covered by the cleanup guide and recovery path configuration.
Cleanup deletes exact run-owned IDs; a unique name alone does not replace registration. Never delete everything created
by the automation account, another worker or another run.

## Readiness and native interactions

| Action                   | Required approach                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Rich-text edit or clear  | Use `editor.fillRteField()` or `editor.clearRteField()`; they verify the editor model, not just DOM text.    |
| Spectrum picker          | Use the shared picker helper where applicable; verify visibility, enabled state, selected value and closure. |
| Grouped locale selection | Use `studio.createVariation(id, locales)`; it checks actionability and committed tags before creation.       |
| Save                     | Use `studio.saveCard()`; a transient toast is not proof that the write completed.                            |
| Search or filtering      | Wait for the committed query/selection, finished loading and expected results.                               |
| Table content            | Resolve fields by their headers and wait for hydrated cells, not fixed column counts or empty row hosts.     |
| Price or checkout        | Assert the resolved live value/link; editor visibility alone is insufficient.                                |

Use locator assertions and existing readiness helpers instead of `waitForTimeout()` or `networkidle`.
For a new operation without a helper, register its response/event wait before the action, then verify the successful
response and authoritative UI state. Perform each mutation once: do not put clones, saves, deletes or selections
inside retry loops or retrying assertions.

Do not dispatch synthetic application events, set component state or suppress errors to make the test pass.
Do not introduce blanket force-clicks. Existing bounded opening/actionability recovery is allowed before the actual
selection or write; a genuine application failure must remain a failure.

Required assertions must be unconditional. Do not skip validation because a widget or field is missing, catch an
assertion error, remove commerce/accessibility checks or increase global timeouts to hide instability.

## Docs lifecycle

For a simple Docs scenario, use the page fixture from `docs-test.js`. For existing named-page suites, follow
`createWorkerPageSetup()` and its setup, `beginTest()`, `finishTest()` and cleanup hooks.
Await `getPage(name)` only when that locale/theme is needed; do not eagerly load every configured page.
Do not add an unused page fixture to a named-page test.

Named Docs pages are reused, so restore viewport, accordion, theme and other UI mutations even after a failure.
Keep tests independently retryable; do not introduce serial dependencies or share API/event state.

## Discovery, parallel execution and review

Name executable files `*.test.js`. Studio shard selection is automatic through `utils/studio-shards.js`;
keep whole files together and use the existing suite/workload naming conventions.
New files are included automatically, but review shard balance when adding a large workload or changing a suite's behavior.
Do not raise workers or override EDS/Odin caps in a test. Dependency caches are separate from run-only HARs, auth and data.

Before submitting, check discovery and run the affected scenario against the intended branch:

```sh
npx playwright test --list --project=mas-studio-chromium
npx playwright test --list --project=mas-docs-chromium

# Example: substitute your branch, scenario tag and project.
npm run nala MWPW-209637-2 @studio-create-grouped-variation-editor project=mas-studio-chromium
```

Use the credentials/setup described in the Nala guide. For a fork deployment, pass the matching `owner=<owner>`.
When changing fixtures, caching, readiness or teardown, also exercise affected tests together with the configured parallel
allocation; a single passing test or discovery-only run does not demonstrate parallel stability.
Report the exact command, branch and outcome in the PR, and explicitly identify anything not run.
Preserve useful failure/request reporting without logging credentials, response bodies or implementation-only debug output.
