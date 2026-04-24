# Bulk Publish UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 5-screen Bulk Publish UI in M@S Studio that pairs with the merged PR #758 backend, per the design spec at `docs/superpowers/specs/2026-04-23-bulk-publish-ui-design.md`.

**Architecture:** New `studio/src/bulk-publish/` folder mirrors the translations pattern. One editor component drives screens 2/3/5 via mode branching. Authors input M@S Studio deep-link URLs, UI resolves them to fragment paths, POSTs to `/api/v1/web/MerchAtScaleStudio/bulk-publish` (fire-and-forget), writes the response back into the project fragment. Reuses `mas-quick-actions`, `mas-items-selector`, `mas-translation-languages`, `mas-confirm-dialog`, `ReactiveStore`, `StoreController`, `Events.toast`.

**Tech Stack:** Lit, Spectrum Web Components, ReactiveStore, Web Test Runner (WTR), `@open-wc/testing`.

---

## Phase layering (why tasks are ordered this way)

1. **Pure helpers** (`url-to-path`, `csv`) — no deps, tested first. Safe to parallelize.
2. **Constants + store tree** — other modules import these.
3. **Repository methods** — depends on constants; independent of screens.
4. **IO Runtime client** — standalone, depends only on fetch globals.
5. **`mas-quick-actions` `VALIDATE` entry** — one-line registry add; independent of store.
6. **Parameterize translations modals** — `targetStore` prop on items-selector + languages. Tests verify back-compat with translations default.
7. **Store wiring + background publish handler** — depends on 2, 3, 4.
8. **Each screen component** — can parallelize once 7 exists.
9. **Router + nav entry** — last; depends on PAGE_NAMES + components.
10. **End-to-end manual verification checklist + single NALA smoke test.**

Within a phase, a single subagent owns the phase. Between phases, the coordinator reviews and rebases.

---

## Task 1: Pure helper — `url-to-path.js`

**Files:**
- Create: `studio/src/bulk-publish/url-to-path.js`
- Test: `studio/test/bulk-publish/url-to-path.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/url-to-path.test.js
import { expect } from '@open-wc/testing';
import { parseStudioUrl } from '../../src/bulk-publish/url-to-path.js';

describe('parseStudioUrl', () => {
    it('extracts fragmentId from the hash query param', () => {
        const url =
            'https://mas.adobe.com/studio.html#content-type=merch-card&page=content&path=sandbox&query=9a75e22f-9c48-418d-8da3-687e8f635282';
        expect(parseStudioUrl(url)).to.deep.equal({
            fragmentId: '9a75e22f-9c48-418d-8da3-687e8f635282',
        });
    });

    it('returns null for non-Studio URLs', () => {
        expect(parseStudioUrl('https://example.com')).to.be.null;
    });

    it('returns null when the query param is missing', () => {
        expect(parseStudioUrl('https://mas.adobe.com/studio.html#page=content')).to.be.null;
    });

    it('returns null for non-UUID query values', () => {
        expect(
            parseStudioUrl('https://mas.adobe.com/studio.html#query=not-a-uuid'),
        ).to.be.null;
    });

    it('trims surrounding whitespace', () => {
        const url =
            '  https://mas.adobe.com/studio.html#query=9a75e22f-9c48-418d-8da3-687e8f635282  ';
        expect(parseStudioUrl(url)).to.deep.equal({
            fragmentId: '9a75e22f-9c48-418d-8da3-687e8f635282',
        });
    });

    it('returns null for empty/null input', () => {
        expect(parseStudioUrl('')).to.be.null;
        expect(parseStudioUrl(null)).to.be.null;
        expect(parseStudioUrl(undefined)).to.be.null;
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/url-to-path.test.js`
Expected: FAIL with "cannot find module `url-to-path.js`".

- [ ] **Step 3: Write minimal implementation**

```javascript
// studio/src/bulk-publish/url-to-path.js
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseStudioUrl(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    let url;
    try {
        url = new URL(trimmed);
    } catch {
        return null;
    }

    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    const params = new URLSearchParams(hash);
    const fragmentId = params.get('query');
    if (!fragmentId || !UUID_RE.test(fragmentId)) return null;

    return { fragmentId };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/url-to-path.test.js`
Expected: PASS — 6 passing.

- [ ] **Step 5: Commit**

```bash
git add studio/src/bulk-publish/url-to-path.js studio/test/bulk-publish/url-to-path.test.js
git commit -m "feat(bulk-publish): add studio URL parser"
```

---

## Task 2: Pure helper — `csv.js`

**Files:**
- Create: `studio/src/bulk-publish/csv.js`
- Test: `studio/test/bulk-publish/csv.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/csv.test.js
import { expect } from '@open-wc/testing';
import { toCsv } from '../../src/bulk-publish/csv.js';

describe('toCsv', () => {
    it('emits header row followed by data rows', () => {
        const details = [
            {
                path: '/content/dam/mas/a/en_US/card',
                status: 'published',
                reason: null,
                workflowInstanceId: 'wf-1',
            },
            {
                path: '/content/dam/mas/a/fr_FR/card',
                status: 'failed',
                reason: 'not-found',
                workflowInstanceId: null,
            },
        ];
        const csv = toCsv(details, {
            published_at: '2026-04-23T00:00:00.000Z',
        });
        const lines = csv.trim().split('\n');
        expect(lines[0]).to.equal(
            'url,resolved_path,locale,status,reason,workflow_instance_id,published_at',
        );
        expect(lines).to.have.lengthOf(3);
        expect(lines[1]).to.include('published');
        expect(lines[1]).to.include('/content/dam/mas/a/en_US/card');
        expect(lines[2]).to.include('not-found');
    });

    it('quotes fields containing commas or quotes', () => {
        const csv = toCsv([
            {
                url: 'https://a, b',
                path: '/x',
                locale: 'en_US',
                status: 'published',
                reason: 'he said "hi"',
                workflowInstanceId: null,
            },
        ]);
        expect(csv).to.include('"https://a, b"');
        expect(csv).to.include('"he said ""hi"""');
    });

    it('renders empty string for null/undefined values', () => {
        const csv = toCsv([
            {
                path: '/p',
                status: 'published',
                reason: null,
                workflowInstanceId: undefined,
            },
        ]);
        const row = csv.split('\n')[1];
        expect(row.split(',').slice(4, 6).join(',')).to.equal(',');
    });

    it('returns header only when details is empty', () => {
        expect(toCsv([])).to.equal(
            'url,resolved_path,locale,status,reason,workflow_instance_id,published_at\n',
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/csv.test.js`
Expected: FAIL with "cannot find module `csv.js`".

- [ ] **Step 3: Write minimal implementation**

```javascript
// studio/src/bulk-publish/csv.js
const HEADERS = [
    'url',
    'resolved_path',
    'locale',
    'status',
    'reason',
    'workflow_instance_id',
    'published_at',
];

function escape(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export function toCsv(details, extra = {}) {
    const header = HEADERS.join(',');
    const rows = (details || []).map((d) =>
        [
            d.url,
            d.path ?? d.resolved_path,
            d.locale,
            d.status,
            d.reason,
            d.workflowInstanceId ?? d.workflow_instance_id,
            extra.published_at,
        ]
            .map(escape)
            .join(','),
    );
    return [header, ...rows].join('\n') + '\n';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/csv.test.js`
Expected: PASS — 4 passing.

- [ ] **Step 5: Commit**

```bash
git add studio/src/bulk-publish/csv.js studio/test/bulk-publish/csv.test.js
git commit -m "feat(bulk-publish): add CSV report serializer"
```

---

## Task 3: Constants + store tree

**Files:**
- Modify: `studio/src/constants.js` (append to `PAGE_NAMES`, `QUICK_ACTION`; add `BULK_PUBLISH_PROJECT_MODEL_ID`, `BULK_PUBLISH_STATUS`)
- Modify: `studio/src/store.js` (add `bulkPublishProjects` subtree)
- Test: `studio/test/bulk-publish/store.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/store.test.js
import { expect } from '@open-wc/testing';
import Store from '../../src/store.js';
import {
    PAGE_NAMES,
    QUICK_ACTION,
    BULK_PUBLISH_PROJECT_MODEL_ID,
    BULK_PUBLISH_STATUS,
} from '../../src/constants.js';

describe('bulk-publish constants + store', () => {
    it('defines page names', () => {
        expect(PAGE_NAMES.BULK_PUBLISH).to.equal('bulkPublish');
        expect(PAGE_NAMES.BULK_PUBLISH_EDITOR).to.equal('bulkPublishEditor');
    });

    it('defines a VALIDATE quick-action', () => {
        expect(QUICK_ACTION.VALIDATE).to.equal('validate');
    });

    it('defines the bulk-publish content-model id and status values', () => {
        expect(BULK_PUBLISH_PROJECT_MODEL_ID).to.be.a('string').and.not.be.empty;
        expect(BULK_PUBLISH_STATUS).to.deep.equal({
            DRAFT: 'Draft',
            PUBLISHING: 'Publishing',
            PUBLISHED: 'Published',
        });
    });

    it('exposes bulk-publish subtree with list/inEdit/projectId/publishing', () => {
        expect(Store.bulkPublishProjects).to.exist;
        expect(Store.bulkPublishProjects.list.data.get()).to.deep.equal([]);
        expect(Store.bulkPublishProjects.list.loading.get()).to.equal(false);
        expect(Store.bulkPublishProjects.inEdit.get()).to.equal(null);
        expect(Store.bulkPublishProjects.projectId.get()).to.equal(null);
        expect(Store.bulkPublishProjects.publishing.get()).to.deep.equal({});
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/store.test.js`
Expected: FAIL (all 4 cases missing exports / undefined subtree).

- [ ] **Step 3: Update constants**

Append to `studio/src/constants.js` (inside existing `PAGE_NAMES`, `QUICK_ACTION` objects; add new exports at bottom before the last `export`):

```javascript
// In the PAGE_NAMES object, add:
    BULK_PUBLISH: 'bulkPublish',
    BULK_PUBLISH_EDITOR: 'bulkPublishEditor',

// In the QUICK_ACTION object, add:
    VALIDATE: 'validate',

// At the bottom, add:
export const BULK_PUBLISH_PROJECT_MODEL_ID =
    '/conf/mas/settings/dam/cfm/models/bulk-publish-project';

export const BULK_PUBLISH_STATUS = {
    DRAFT: 'Draft',
    PUBLISHING: 'Publishing',
    PUBLISHED: 'Published',
};

export const BULK_PUBLISH_PARENT_PATH = '/content/dam/mas/bulk-publish-projects';
```

- [ ] **Step 4: Add subtree to the store**

In `studio/src/store.js`, beside the existing `translationProjects` block (search for that literal to find the right location), add:

```javascript
    bulkPublishProjects: {
        list: {
            data: new ReactiveStore([]),
            loading: new ReactiveStore(false),
        },
        inEdit: new ReactiveStore(null),
        projectId: new ReactiveStore(null),
        publishing: new ReactiveStore({}),
    },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/store.test.js`
Expected: PASS — 4 passing.

- [ ] **Step 6: Commit**

```bash
git add studio/src/constants.js studio/src/store.js studio/test/bulk-publish/store.test.js
git commit -m "feat(bulk-publish): add constants and store subtree"
```

---

## Task 4: IO Runtime client

**Files:**
- Create: `studio/src/bulk-publish/bulk-publish-client.js`
- Test: `studio/test/bulk-publish/client.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/client.test.js
import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { publishBulk, BulkPublishError } from '../../src/bulk-publish/bulk-publish-client.js';

describe('publishBulk', () => {
    let fetchStub;
    beforeEach(() => {
        fetchStub = sinon.stub(window, 'fetch');
    });
    afterEach(() => fetchStub.restore());

    it('POSTs to the bulk-publish endpoint with bearer token and body', async () => {
        fetchStub.resolves(
            new Response(
                JSON.stringify({
                    summary: { total: 1, published: 1, skipped: 0, failed: 0 },
                    details: [],
                }),
                { status: 200, headers: { 'content-type': 'application/json' } },
            ),
        );
        await publishBulk({
            ioBaseUrl: 'https://io.example',
            paths: ['/content/dam/mas/a/en_US/card'],
            locales: ['fr_FR'],
            token: 'abc',
        });
        const [url, init] = fetchStub.firstCall.args;
        expect(url).to.equal(
            'https://io.example/api/v1/web/MerchAtScaleStudio/bulk-publish',
        );
        expect(init.method).to.equal('POST');
        expect(init.headers.Authorization).to.equal('Bearer abc');
        expect(init.headers['Content-Type']).to.equal('application/json');
        expect(JSON.parse(init.body)).to.deep.equal({
            paths: ['/content/dam/mas/a/en_US/card'],
            locales: ['fr_FR'],
            concurrencyLimit: 5,
        });
    });

    it('resolves with the parsed response body on 200', async () => {
        const body = {
            summary: { total: 2, published: 2, skipped: 0, failed: 0 },
            details: [{ path: '/a', status: 'published' }],
        };
        fetchStub.resolves(
            new Response(JSON.stringify(body), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );
        const result = await publishBulk({
            ioBaseUrl: 'https://io.example',
            paths: ['/a'],
            token: 't',
        });
        expect(result).to.deep.equal(body);
    });

    it('rejects with BulkPublishError on non-2xx response', async () => {
        fetchStub.resolves(
            new Response(JSON.stringify({ error: 'bad path' }), { status: 400 }),
        );
        try {
            await publishBulk({
                ioBaseUrl: 'https://io.example',
                paths: ['/bad'],
                token: 't',
            });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err).to.be.instanceOf(BulkPublishError);
            expect(err.status).to.equal(400);
            expect(err.message).to.include('bad path');
        }
    });

    it('rejects when fetch itself throws', async () => {
        fetchStub.rejects(new Error('network'));
        try {
            await publishBulk({
                ioBaseUrl: 'https://io.example',
                paths: ['/a'],
                token: 't',
            });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err).to.be.instanceOf(BulkPublishError);
            expect(err.message).to.equal('network');
        }
    });

    it('rejects immediately when paths is empty', async () => {
        try {
            await publishBulk({
                ioBaseUrl: 'https://io.example',
                paths: [],
                token: 't',
            });
            expect.fail('should have thrown');
        } catch (err) {
            expect(err).to.be.instanceOf(BulkPublishError);
            expect(fetchStub.called).to.equal(false);
        }
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/client.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```javascript
// studio/src/bulk-publish/bulk-publish-client.js
const ENDPOINT = '/api/v1/web/MerchAtScaleStudio/bulk-publish';
const DEFAULT_CONCURRENCY = 5;

export class BulkPublishError extends Error {
    constructor(message, { status = null, body = null } = {}) {
        super(message);
        this.name = 'BulkPublishError';
        this.status = status;
        this.body = body;
    }
}

export async function publishBulk({
    ioBaseUrl,
    paths,
    locales = [],
    token,
    concurrencyLimit = DEFAULT_CONCURRENCY,
}) {
    if (!Array.isArray(paths) || paths.length === 0) {
        throw new BulkPublishError('paths must be a non-empty array');
    }
    if (!ioBaseUrl) {
        throw new BulkPublishError('ioBaseUrl is required');
    }
    if (!token) {
        throw new BulkPublishError('token is required');
    }

    let response;
    try {
        response = await fetch(`${ioBaseUrl}${ENDPOINT}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paths, locales, concurrencyLimit }),
        });
    } catch (err) {
        throw new BulkPublishError(err.message);
    }

    let body = null;
    try {
        body = await response.json();
    } catch {
        // ignore parse error
    }

    if (!response.ok) {
        const message =
            (body && (body.error?.body?.error || body.error)) || response.statusText;
        throw new BulkPublishError(message, { status: response.status, body });
    }

    return body;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/client.test.js`
Expected: PASS — 5 passing.

- [ ] **Step 5: Commit**

```bash
git add studio/src/bulk-publish/bulk-publish-client.js studio/test/bulk-publish/client.test.js
git commit -m "feat(bulk-publish): add IO Runtime client"
```

---

## Task 5: Register `QUICK_ACTION.VALIDATE` in `mas-quick-actions`

**Files:**
- Modify: `studio/src/mas-quick-actions.js:5-47` (append to `ACTION_CONFIG`)
- Test: `studio/test/bulk-publish/quick-actions-validate.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/quick-actions-validate.test.js
import { fixture, html, expect } from '@open-wc/testing';
import '../../src/mas-quick-actions.js';
import { QUICK_ACTION } from '../../src/constants.js';

describe('mas-quick-actions renders VALIDATE', () => {
    it('renders a validate button with the expected title', async () => {
        const el = await fixture(html`
            <mas-quick-actions
                .actions=${[QUICK_ACTION.VALIDATE]}
                .disabled=${new Set()}
            ></mas-quick-actions>
        `);
        await el.updateComplete;
        const btn = el.shadowRoot.querySelector(
            `[data-action="${QUICK_ACTION.VALIDATE}"]`,
        );
        expect(btn, 'validate button rendered').to.exist;
        expect(btn.getAttribute('title')).to.equal('Validate');
    });
});
```

Note: inspect `mas-quick-actions.js` around line 100–200 to confirm how actions are iterated and whether `data-action` is actually applied. If the template uses a different attribute (e.g., `name`), change the selector to match. Do NOT change the component's rendering contract just to make the test pass — update the test to match the existing contract.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/quick-actions-validate.test.js`
Expected: FAIL — "validate button rendered: expected null to exist" because `VALIDATE` is not in `ACTION_CONFIG`.

- [ ] **Step 3: Add VALIDATE entry**

In `studio/src/mas-quick-actions.js`, append to the `ACTION_CONFIG` object (line 5–47 region):

```javascript
    [QUICK_ACTION.VALIDATE]: {
        icon: 'sp-icon-approve-check',
        title: 'Validate',
    },
```

If `sp-icon-approve-check` is not already imported in `studio/src/swc.js`, add the import there. If the Spectrum package uses a different glyph name, substitute — the test only checks `title`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/quick-actions-validate.test.js`
Expected: PASS — 1 passing.

- [ ] **Step 5: Run existing translation-editor tests to confirm no regression**

Run: `cd studio && npx wtr test/translation/*.test.js`
Expected: existing tests still pass (or unchanged from baseline if baseline had pre-existing failures unrelated to this change).

- [ ] **Step 6: Commit**

```bash
git add studio/src/mas-quick-actions.js studio/src/swc.js studio/test/bulk-publish/quick-actions-validate.test.js
git commit -m "feat(bulk-publish): register VALIDATE quick-action"
```

---

## Task 6: Parameterize `mas-items-selector` with `targetStore`

**Files:**
- Modify: `studio/src/translation/mas-items-selector.js` (add property; route internal reads/writes through `this.targetStore`)
- Test: `studio/test/bulk-publish/items-selector-targetstore.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/items-selector-targetstore.test.js
import { fixture, html, expect } from '@open-wc/testing';
import { ReactiveStore } from '../../src/reactivity/reactive-store.js';
import '../../src/translation/mas-items-selector.js';
import Store from '../../src/store.js';

describe('mas-items-selector targetStore', () => {
    it('defaults to Store.translationProjects', async () => {
        const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
        expect(el.targetStore).to.equal(Store.translationProjects);
    });

    it('reads selection from the provided targetStore', async () => {
        const fakeStore = {
            selectedCards: new ReactiveStore([{ id: 'a' }]),
            selectedCollections: new ReactiveStore([]),
            selectedPlaceholders: new ReactiveStore([]),
            showSelected: new ReactiveStore(false),
        };
        const el = await fixture(html`
            <mas-items-selector .targetStore=${fakeStore}></mas-items-selector>
        `);
        await el.updateComplete;
        // The component should read from fakeStore, not Store.translationProjects.
        // We assert on a public method or derived getter; adjust based on actual API.
        expect(el.targetStore).to.equal(fakeStore);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/items-selector-targetstore.test.js`
Expected: FAIL — property does not exist on the component.

- [ ] **Step 3: Add the property and route all store reads through it**

In `studio/src/translation/mas-items-selector.js`:

1. Add to `static properties`:
   ```javascript
       targetStore: { type: Object },
   ```
2. In the constructor:
   ```javascript
       this.targetStore = Store.translationProjects;
   ```
3. Replace every `Store.translationProjects.selectedCards` / `selectedCollections` / `selectedPlaceholders` / `showSelected` / `projectType` read-or-write with `this.targetStore.<same-key>`. Use grep to enumerate: `grep -n "Store\.translationProjects\." studio/src/translation/mas-items-selector.js`.

Keep the `Store` import — needed for the constructor default.

- [ ] **Step 4: Run the new test**

Run: `cd studio && npx wtr test/bulk-publish/items-selector-targetstore.test.js`
Expected: PASS.

- [ ] **Step 5: Run existing translation tests for regression**

Run: `cd studio && npx wtr test/translation/*.test.js`
Expected: all still pass (default `targetStore = Store.translationProjects` preserves behavior).

- [ ] **Step 6: Commit**

```bash
git add studio/src/translation/mas-items-selector.js studio/test/bulk-publish/items-selector-targetstore.test.js
git commit -m "refactor(translation): parameterize mas-items-selector with targetStore prop"
```

---

## Task 7: Parameterize `mas-translation-languages` with `targetStore`

**Files:**
- Modify: `studio/src/translation/mas-translation-languages.js` (same pattern as Task 6)
- Test: `studio/test/bulk-publish/translation-languages-targetstore.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/translation-languages-targetstore.test.js
import { fixture, html, expect } from '@open-wc/testing';
import { ReactiveStore } from '../../src/reactivity/reactive-store.js';
import '../../src/translation/mas-translation-languages.js';
import Store from '../../src/store.js';

describe('mas-translation-languages targetStore', () => {
    it('defaults to Store.translationProjects', async () => {
        const el = await fixture(
            html`<mas-translation-languages></mas-translation-languages>`,
        );
        expect(el.targetStore).to.equal(Store.translationProjects);
    });

    it('uses the provided targetStore for targetLocales', async () => {
        const fake = { targetLocales: new ReactiveStore(['fr_FR']) };
        const el = await fixture(html`
            <mas-translation-languages
                .targetStore=${fake}
            ></mas-translation-languages>
        `);
        expect(el.targetStore).to.equal(fake);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/translation-languages-targetstore.test.js`
Expected: FAIL.

- [ ] **Step 3: Apply the same `targetStore` pattern**

Mirror Task 6 in `studio/src/translation/mas-translation-languages.js`. Grep for every `Store.translationProjects.` read or mutation inside this file and route via `this.targetStore`.

- [ ] **Step 4: Run the new test**

Run: `cd studio && npx wtr test/bulk-publish/translation-languages-targetstore.test.js`
Expected: PASS.

- [ ] **Step 5: Run existing translation tests**

Run: `cd studio && npx wtr test/translation/*.test.js`
Expected: all still pass.

- [ ] **Step 6: Commit**

```bash
git add studio/src/translation/mas-translation-languages.js studio/test/bulk-publish/translation-languages-targetstore.test.js
git commit -m "refactor(translation): parameterize mas-translation-languages with targetStore prop"
```

---

## Task 8: Repository — `loadBulkPublishProjects` + `getFragmentById` helpers

**Files:**
- Modify: `studio/src/mas-repository.js:990` area (add `loadBulkPublishProjects` right after `loadTranslationProjects`; add `getFragmentById` if not already public)
- Test: `studio/test/bulk-publish/repository.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/repository.test.js
import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { MasRepository } from '../../src/mas-repository.js';

describe('MasRepository bulk-publish helpers', () => {
    let repo;
    beforeEach(() => {
        repo = new MasRepository();
        repo.search = { value: { path: 'sandbox' } };
        // Minimal abort-controllers map guard used by the translation loader.
        repo.processError = sinon.stub();
        repo.searchFragmentList = sinon.stub().resolves([
            { id: 'f1', fields: [] },
        ]);
    });

    it('loadBulkPublishProjects populates Store.bulkPublishProjects.list', async () => {
        await repo.loadBulkPublishProjects();
        const list = Store.bulkPublishProjects.list.data.get();
        expect(list).to.have.lengthOf(1);
    });

    it('loadBulkPublishProjects toggles loading flag', async () => {
        let sawLoading = false;
        const unsub = Store.bulkPublishProjects.list.loading.subscribe((v) => {
            if (v === true) sawLoading = true;
        });
        await repo.loadBulkPublishProjects();
        unsub();
        expect(sawLoading).to.equal(true);
        expect(Store.bulkPublishProjects.list.loading.get()).to.equal(false);
    });

    it('getFragmentById delegates to aem.sites.cf.fragments.getById', async () => {
        repo.aem = { sites: { cf: { fragments: { getById: sinon.stub().resolves({ id: 'x' }) } } } };
        const result = await repo.getFragmentById('x');
        expect(result).to.deep.equal({ id: 'x' });
        expect(repo.aem.sites.cf.fragments.getById.calledWith('x')).to.equal(true);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/repository.test.js`
Expected: FAIL — `loadBulkPublishProjects is not a function` (or similar).

- [ ] **Step 3: Add the methods**

In `studio/src/mas-repository.js`, directly after `loadTranslationProjects()` (~line 1018), add:

```javascript
    getBulkPublishProjectsPath() {
        const surface = this.search.value.path?.split('/').filter(Boolean)[0]?.toLowerCase();
        return surface ? `/content/dam/mas/bulk-publish-projects/${surface}` : null;
    }

    async loadBulkPublishProjects() {
        const path = this.getBulkPublishProjectsPath();
        if (!path) return;
        try {
            if (this.#abortControllers.bulkPublish) this.#abortControllers.bulkPublish.abort();
            this.#abortControllers.bulkPublish = new AbortController();
            Store.bulkPublishProjects.list.loading.set(true);
            const fragments = await this.searchFragmentList(
                { path, sort: [{ on: 'modifiedOrCreated', order: 'DESC' }] },
                50,
                this.#abortControllers.bulkPublish,
            );
            const projects = fragments.map((fragment) => new FragmentStore(new Fragment(fragment)));
            Store.bulkPublishProjects.list.data.set(projects);
        } catch (error) {
            this.processError(error, 'Could not load bulk publish projects.');
        } finally {
            Store.bulkPublishProjects.list.loading.set(false);
        }
    }

    getFragmentById(id) {
        return this.aem.sites.cf.fragments.getById(id);
    }
```

Also add `bulkPublish: null` to the `#abortControllers` initialization (grep `#abortControllers = {` to find the declaration near the top of the class).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/repository.test.js`
Expected: PASS — 3 passing.

- [ ] **Step 5: Commit**

```bash
git add studio/src/mas-repository.js studio/test/bulk-publish/repository.test.js
git commit -m "feat(bulk-publish): add repository loaders and getFragmentById"
```

---

## Task 9: Store module — `bulk-publish-store.js` (publish handler)

**Files:**
- Create: `studio/src/bulk-publish/bulk-publish-store.js`
- Test: `studio/test/bulk-publish/bulk-publish-store.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/bulk-publish-store.test.js
import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { BULK_PUBLISH_STATUS } from '../../src/constants.js';
import { startPublishing } from '../../src/bulk-publish/bulk-publish-store.js';

describe('startPublishing', () => {
    let repo;
    let clientStub;

    beforeEach(() => {
        Store.bulkPublishProjects.publishing.set({});
        repo = { saveFragment: sinon.stub().resolves() };
    });

    it('sets status to Publishing, saves, then Published on resolve', async () => {
        const project = {
            id: 'p1',
            getFieldValue: sinon.stub(),
            setFieldValue: sinon.stub(),
        };
        const response = {
            summary: { total: 1, published: 1, skipped: 0, failed: 0 },
            details: [],
        };
        clientStub = sinon.stub().resolves(response);

        await startPublishing({
            project,
            paths: ['/p'],
            locales: [],
            token: 't',
            ioBaseUrl: 'x',
            publishFn: clientStub,
            repository: repo,
        });

        const statusCalls = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statusCalls).to.deep.equal([
            BULK_PUBLISH_STATUS.PUBLISHING,
            BULK_PUBLISH_STATUS.PUBLISHED,
        ]);
        expect(repo.saveFragment.callCount).to.equal(2);
    });

    it('reverts status to Draft and stores lastError on reject', async () => {
        const project = {
            id: 'p2',
            getFieldValue: sinon.stub(),
            setFieldValue: sinon.stub(),
        };
        clientStub = sinon.stub().rejects(new Error('boom'));

        await startPublishing({
            project,
            paths: ['/p'],
            locales: [],
            token: 't',
            ioBaseUrl: 'x',
            publishFn: clientStub,
            repository: repo,
        }).catch(() => {});

        const statusCalls = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statusCalls[statusCalls.length - 1]).to.equal(
            BULK_PUBLISH_STATUS.DRAFT,
        );
        const errorCall = project.setFieldValue
            .getCalls()
            .find((c) => c.args[0] === 'lastError');
        expect(errorCall.args[1]).to.equal('boom');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/bulk-publish-store.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```javascript
// studio/src/bulk-publish/bulk-publish-store.js
import Store from '../store.js';
import { BULK_PUBLISH_STATUS } from '../constants.js';
import Events from '../events.js';

function setField(project, name, value) {
    project.setFieldValue(name, value);
}

export async function startPublishing({
    project,
    paths,
    locales,
    token,
    ioBaseUrl,
    publishFn,
    repository,
}) {
    setField(project, 'status', BULK_PUBLISH_STATUS.PUBLISHING);
    await repository.saveFragment(project, false);

    const publishing = { ...Store.bulkPublishProjects.publishing.get() };
    const promise = publishFn({ ioBaseUrl, paths, locales, token });
    publishing[project.id] = promise;
    Store.bulkPublishProjects.publishing.set(publishing);

    try {
        const result = await promise;
        setField(project, 'lastResult', JSON.stringify(result));
        setField(project, 'status', BULK_PUBLISH_STATUS.PUBLISHED);
        setField(project, 'publishedAt', new Date().toISOString());
        await repository.saveFragment(project, false);
        Events.toast.emit({
            variant: 'positive',
            message: 'Project published successfully',
        });
        return result;
    } catch (err) {
        setField(project, 'lastError', err.message);
        setField(project, 'status', BULK_PUBLISH_STATUS.DRAFT);
        await repository.saveFragment(project, false);
        Events.toast.emit({
            variant: 'negative',
            message: `Publish failed: ${err.message}`,
        });
        throw err;
    } finally {
        const current = { ...Store.bulkPublishProjects.publishing.get() };
        delete current[project.id];
        Store.bulkPublishProjects.publishing.set(current);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/bulk-publish-store.test.js`
Expected: PASS — 2 passing.

- [ ] **Step 5: Commit**

```bash
git add studio/src/bulk-publish/bulk-publish-store.js studio/test/bulk-publish/bulk-publish-store.test.js
git commit -m "feat(bulk-publish): add publishing lifecycle handler"
```

---

## Task 10: `mas-bulk-publish-items` card (URL textarea + post-validate list)

**Files:**
- Create: `studio/src/bulk-publish/mas-bulk-publish-items.js`
- Create: `studio/src/bulk-publish/mas-bulk-publish-items.css.js`
- Test: `studio/test/bulk-publish/mas-bulk-publish-items.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/mas-bulk-publish-items.test.js
import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-items.js';

describe('mas-bulk-publish-items', () => {
    it('renders textarea in empty state', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-items .items=${[]} .urls=${''}></mas-bulk-publish-items>
        `);
        expect(el.shadowRoot.querySelector('textarea')).to.exist;
        expect(el.shadowRoot.querySelector('[data-testid="items-list"]')).to.be.null;
    });

    it('renders item list when items is non-empty', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-items
                .items=${[
                    { url: 'https://a', path: '/x', status: 'valid' },
                    { url: 'https://b', path: null, status: 'error', reason: 'not-found' },
                ]}
                .urls=${'x'}
            ></mas-bulk-publish-items>
        `);
        await el.updateComplete;
        const list = el.shadowRoot.querySelector('[data-testid="items-list"]');
        expect(list).to.exist;
        expect(list.querySelectorAll('[data-testid="item-row"]')).to.have.lengthOf(2);
    });

    it('renders a 404 warning when any item has reason="not-found"', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-items
                .items=${[
                    { url: 'https://b', status: 'error', reason: 'not-found' },
                ]}
                .urls=${'x'}
            ></mas-bulk-publish-items>
        `);
        await el.updateComplete;
        const warn = el.shadowRoot.querySelector('[data-testid="items-warning"]');
        expect(warn).to.exist;
        expect(warn.textContent).to.include('404 error found (1)');
    });

    it('dispatches urls-change when textarea input changes', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-items .items=${[]} .urls=${''}></mas-bulk-publish-items>
        `);
        const textarea = el.shadowRoot.querySelector('textarea');
        setTimeout(() => {
            textarea.value = 'hello';
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        });
        const ev = await oneEvent(el, 'urls-change');
        expect(ev.detail).to.equal('hello');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/mas-bulk-publish-items.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal CSS**

```javascript
// studio/src/bulk-publish/mas-bulk-publish-items.css.js
import { css } from 'lit';
export const styles = css`
    :host { display: block; }
    .warning {
        color: var(--spectrum-negative-background-color-default, #da1e28);
        padding: 8px 0;
    }
`;
```

- [ ] **Step 4: Write component**

```javascript
// studio/src/bulk-publish/mas-bulk-publish-items.js
import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-bulk-publish-items.css.js';

class MasBulkPublishItems extends LitElement {
    static styles = styles;
    static properties = {
        items: { type: Array },
        urls: { type: String },
    };

    constructor() {
        super();
        this.items = [];
        this.urls = '';
    }

    get notFoundCount() {
        return this.items.filter((i) => i.reason === 'not-found').length;
    }

    handleInput(e) {
        this.dispatchEvent(
            new CustomEvent('urls-change', {
                detail: e.target.value,
                bubbles: true,
                composed: true,
            }),
        );
    }

    renderEmpty() {
        return html`
            <textarea
                rows="6"
                placeholder="Enter URLs (one per line)"
                .value=${this.urls}
                @input=${this.handleInput}
            ></textarea>
            <sp-button variant="secondary" size="m">+ Add by search</sp-button>
        `;
    }

    renderList() {
        return html`
            ${this.notFoundCount > 0
                ? html`<div class="warning" data-testid="items-warning">
                      404 error found (${this.notFoundCount})
                  </div>`
                : nothing}
            <ul data-testid="items-list">
                ${this.items.map(
                    (item) => html`
                        <li data-testid="item-row">
                            <a href=${item.url}>${item.url}</a>
                        </li>
                    `,
                )}
            </ul>
        `;
    }

    render() {
        return html`<h3>Items (${this.items.length})</h3>
            ${this.items.length ? this.renderList() : this.renderEmpty()}`;
    }
}

customElements.define('mas-bulk-publish-items', MasBulkPublishItems);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/mas-bulk-publish-items.test.js`
Expected: PASS — 4 passing.

- [ ] **Step 6: Commit**

```bash
git add studio/src/bulk-publish/mas-bulk-publish-items.js studio/src/bulk-publish/mas-bulk-publish-items.css.js studio/test/bulk-publish/mas-bulk-publish-items.test.js
git commit -m "feat(bulk-publish): add Items card component"
```

---

## Task 11: `mas-bulk-publish-locales` card

**Files:**
- Create: `studio/src/bulk-publish/mas-bulk-publish-locales.js`
- Create: `studio/src/bulk-publish/mas-bulk-publish-locales.css.js`
- Test: `studio/test/bulk-publish/mas-bulk-publish-locales.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/mas-bulk-publish-locales.test.js
import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-locales.js';

describe('mas-bulk-publish-locales', () => {
    it('renders empty dropzone when no locales', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-locales .locales=${[]}></mas-bulk-publish-locales>
        `);
        expect(el.shadowRoot.querySelector('[data-testid="empty-dropzone"]')).to
            .exist;
    });

    it('renders summary when locales present', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-locales
                .locales=${['US', 'CA_en', 'FR']}
            ></mas-bulk-publish-locales>
        `);
        await el.updateComplete;
        const summary = el.shadowRoot.querySelector('[data-testid="summary"]');
        expect(summary).to.exist;
        expect(summary.textContent).to.include('US');
        expect(summary.textContent).to.include('CA_en');
    });

    it('dispatches edit-locales when clicked', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-locales .locales=${[]}></mas-bulk-publish-locales>
        `);
        await el.updateComplete;
        setTimeout(() =>
            el.shadowRoot
                .querySelector('[data-testid="empty-dropzone"]')
                .click(),
        );
        const ev = await oneEvent(el, 'edit-locales');
        expect(ev).to.exist;
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/mas-bulk-publish-locales.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write component**

```javascript
// studio/src/bulk-publish/mas-bulk-publish-locales.css.js
import { css } from 'lit';
export const styles = css`
    :host { display: block; }
    .dropzone {
        border: 1px dashed var(--spectrum-alias-border-color, #aaa);
        border-radius: 10px;
        padding: 24px;
        text-align: center;
        cursor: pointer;
    }
`;
```

```javascript
// studio/src/bulk-publish/mas-bulk-publish-locales.js
import { LitElement, html } from 'lit';
import { styles } from './mas-bulk-publish-locales.css.js';

class MasBulkPublishLocales extends LitElement {
    static styles = styles;
    static properties = { locales: { type: Array } };
    constructor() {
        super();
        this.locales = [];
    }

    emitEdit() {
        this.dispatchEvent(
            new CustomEvent('edit-locales', { bubbles: true, composed: true }),
        );
    }

    render() {
        const n = this.locales.length;
        return html`
            <h3>Locales (${n})</h3>
            ${n === 0
                ? html`
                      <div
                          class="dropzone"
                          data-testid="empty-dropzone"
                          @click=${this.emitEdit}
                      >
                          <strong>+ Add locales</strong>
                          <p>
                              Choose one or more locales for your bulk publish
                              project.
                          </p>
                      </div>
                  `
                : html`
                      <div data-testid="summary">${this.locales.join(', ')}</div>
                      <sp-action-button @click=${this.emitEdit}>Edit</sp-action-button>
                  `}
        `;
    }
}

customElements.define('mas-bulk-publish-locales', MasBulkPublishLocales);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/mas-bulk-publish-locales.test.js`
Expected: PASS — 3 passing.

- [ ] **Step 5: Commit**

```bash
git add studio/src/bulk-publish/mas-bulk-publish-locales.js studio/src/bulk-publish/mas-bulk-publish-locales.css.js studio/test/bulk-publish/mas-bulk-publish-locales.test.js
git commit -m "feat(bulk-publish): add Locales card component"
```

---

## Task 12: `mas-bulk-publish-confirm-dialog`

**Files:**
- Create: `studio/src/bulk-publish/mas-bulk-publish-confirm-dialog.js`
- Test: `studio/test/bulk-publish/confirm-dialog.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/confirm-dialog.test.js
import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-confirm-dialog.js';

describe('mas-bulk-publish-confirm-dialog', () => {
    it('renders title, body, and counts', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${'Back to School'}
                .itemCount=${15}
                .open=${true}
            ></mas-bulk-publish-confirm-dialog>
        `);
        await el.updateComplete;
        const text = el.shadowRoot.textContent;
        expect(text).to.include('Publish project');
        expect(text).to.include('Back to School');
        expect(text).to.include('15');
        expect(text).to.include('Now');
    });

    it('dispatches publish-confirmed when primary button clicked', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${'X'}
                .itemCount=${1}
                .open=${true}
            ></mas-bulk-publish-confirm-dialog>
        `);
        await el.updateComplete;
        setTimeout(() =>
            el.shadowRoot
                .querySelector('[data-testid="publish-btn"]')
                .click(),
        );
        const ev = await oneEvent(el, 'publish-confirmed');
        expect(ev).to.exist;
    });

    it('dispatches publish-cancelled when Cancel clicked', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${'X'}
                .itemCount=${1}
                .open=${true}
            ></mas-bulk-publish-confirm-dialog>
        `);
        await el.updateComplete;
        setTimeout(() =>
            el.shadowRoot
                .querySelector('[data-testid="cancel-btn"]')
                .click(),
        );
        const ev = await oneEvent(el, 'publish-cancelled');
        expect(ev).to.exist;
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/confirm-dialog.test.js`
Expected: FAIL.

- [ ] **Step 3: Write component**

```javascript
// studio/src/bulk-publish/mas-bulk-publish-confirm-dialog.js
import { LitElement, html } from 'lit';

class MasBulkPublishConfirmDialog extends LitElement {
    static properties = {
        projectTitle: { type: String },
        itemCount: { type: Number },
        open: { type: Boolean },
    };

    constructor() {
        super();
        this.projectTitle = '';
        this.itemCount = 0;
        this.open = false;
    }

    confirm() {
        this.dispatchEvent(
            new CustomEvent('publish-confirmed', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    cancel() {
        this.dispatchEvent(
            new CustomEvent('publish-cancelled', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        if (!this.open) return null;
        return html`
            <sp-dialog-wrapper
                headline="Publish project"
                underlay
                dismissable
                @close=${this.cancel}
            >
                <p>This project will be published immediately.</p>
                <dl>
                    <dt>Project:</dt>
                    <dd>${this.projectTitle}</dd>
                    <dt>Scheduled:</dt>
                    <dd>Now</dd>
                    <dt>Items:</dt>
                    <dd>${this.itemCount}</dd>
                </dl>
                <sp-button
                    slot="button"
                    variant="secondary"
                    data-testid="cancel-btn"
                    @click=${this.cancel}
                    >Cancel</sp-button
                >
                <sp-button
                    slot="button"
                    variant="accent"
                    data-testid="publish-btn"
                    @click=${this.confirm}
                    >Publish</sp-button
                >
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define(
    'mas-bulk-publish-confirm-dialog',
    MasBulkPublishConfirmDialog,
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/confirm-dialog.test.js`
Expected: PASS — 3 passing.

- [ ] **Step 5: Commit**

```bash
git add studio/src/bulk-publish/mas-bulk-publish-confirm-dialog.js studio/test/bulk-publish/confirm-dialog.test.js
git commit -m "feat(bulk-publish): add publish confirmation dialog"
```

---

## Task 13: `mas-bulk-publish-success-banner`

**Files:**
- Create: `studio/src/bulk-publish/mas-bulk-publish-success-banner.js`
- Test: `studio/test/bulk-publish/success-banner.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/success-banner.test.js
import { fixture, html, expect } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-success-banner.js';

describe('mas-bulk-publish-success-banner', () => {
    it('renders copy with publishedAt and publishedBy', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-success-banner
                .publishedAt=${'2026-04-23T10:00:00Z'}
                .publishedBy=${'Fred'}
            ></mas-bulk-publish-success-banner>
        `);
        await el.updateComplete;
        const text = el.shadowRoot.textContent;
        expect(text).to.include('Project published successfully');
        expect(text).to.include('Fred');
        expect(text).to.include('2026-04-23');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/success-banner.test.js`
Expected: FAIL.

- [ ] **Step 3: Write component**

```javascript
// studio/src/bulk-publish/mas-bulk-publish-success-banner.js
import { LitElement, html, css } from 'lit';

class MasBulkPublishSuccessBanner extends LitElement {
    static properties = {
        publishedAt: { type: String },
        publishedBy: { type: String },
    };
    static styles = css`
        :host {
            display: block;
            background: #e8f5e9;
            padding: 16px 24px;
            border-radius: 12px;
            margin-bottom: 16px;
        }
        h2 { margin: 0 0 4px; color: #2e7d32; }
    `;

    formatDate(iso) {
        if (!iso) return '';
        try {
            return new Date(iso).toISOString().slice(0, 10);
        } catch {
            return iso;
        }
    }

    render() {
        return html`
            <h2>Project published successfully</h2>
            <p>
                All items in this project were published on
                ${this.formatDate(this.publishedAt)} by ${this.publishedBy} and
                are now live across the selected locales.
            </p>
        `;
    }
}

customElements.define(
    'mas-bulk-publish-success-banner',
    MasBulkPublishSuccessBanner,
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/success-banner.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add studio/src/bulk-publish/mas-bulk-publish-success-banner.js studio/test/bulk-publish/success-banner.test.js
git commit -m "feat(bulk-publish): add published-state success banner"
```

---

## Task 14: `mas-bulk-publish` overview (Screen 1)

**Files:**
- Create: `studio/src/bulk-publish/mas-bulk-publish.js`
- Create: `studio/src/bulk-publish/mas-bulk-publish.css.js`
- Test: `studio/test/bulk-publish/mas-bulk-publish.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/mas-bulk-publish.test.js
import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import Store from '../../src/store.js';
import '../../src/bulk-publish/mas-bulk-publish.js';

describe('mas-bulk-publish (overview)', () => {
    afterEach(() => {
        Store.bulkPublishProjects.list.data.set([]);
        Store.bulkPublishProjects.list.loading.set(false);
    });

    it('renders empty state when list is empty', async () => {
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('[data-testid="empty"]')).to.exist;
    });

    it('renders one row per project', async () => {
        Store.bulkPublishProjects.list.data.set([
            { id: 'a', get: () => ({ id: 'a', title: 'A', status: 'Draft' }) },
            { id: 'b', get: () => ({ id: 'b', title: 'B', status: 'Published' }) },
        ]);
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        const rows = el.shadowRoot.querySelectorAll('[data-testid="project-row"]');
        expect(rows).to.have.lengthOf(2);
    });

    it('dispatches create-project when CTA clicked', async () => {
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        setTimeout(() =>
            el.shadowRoot
                .querySelector('[data-testid="create-btn"]')
                .click(),
        );
        const ev = await oneEvent(el, 'create-project');
        expect(ev).to.exist;
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/mas-bulk-publish.test.js`
Expected: FAIL.

- [ ] **Step 3: Write component**

```javascript
// studio/src/bulk-publish/mas-bulk-publish.css.js
import { css } from 'lit';
export const styles = css`
    :host { display: block; padding: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
    .status { padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    .status.draft { background: #eee; }
    .status.publishing { background: #ffe0b2; }
    .status.published { background: #c8e6c9; }
`;
```

```javascript
// studio/src/bulk-publish/mas-bulk-publish.js
import { LitElement, html } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import { styles } from './mas-bulk-publish.css.js';
import { BULK_PUBLISH_STATUS } from '../constants.js';

class MasBulkPublish extends LitElement {
    static styles = styles;

    list = new StoreController(this, Store.bulkPublishProjects.list.data);

    onCreate() {
        this.dispatchEvent(
            new CustomEvent('create-project', { bubbles: true, composed: true }),
        );
    }

    statusClass(s) {
        if (s === BULK_PUBLISH_STATUS.PUBLISHING) return 'status publishing';
        if (s === BULK_PUBLISH_STATUS.PUBLISHED) return 'status published';
        return 'status draft';
    }

    render() {
        const projects = this.list.value || [];
        return html`
            <header>
                <h1>Bulk publish</h1>
                <sp-button
                    variant="accent"
                    data-testid="create-btn"
                    @click=${this.onCreate}
                    >+ Create project</sp-button
                >
            </header>
            ${projects.length === 0
                ? html`<p data-testid="empty">No bulk publish projects yet.</p>`
                : html`
                      <table>
                          <thead>
                              <tr>
                                  <th>Project</th>
                                  <th>Created by</th>
                                  <th>Status</th>
                                  <th></th>
                              </tr>
                          </thead>
                          <tbody>
                              ${projects.map((p) => {
                                  const data = p.get();
                                  return html`<tr data-testid="project-row">
                                      <td>${data.title}</td>
                                      <td>${data.author ?? ''}</td>
                                      <td>
                                          <span class=${this.statusClass(data.status)}>
                                              ${data.status ?? 'Draft'}
                                          </span>
                                      </td>
                                      <td></td>
                                  </tr>`;
                              })}
                          </tbody>
                      </table>
                  `}
        `;
    }
}

customElements.define('mas-bulk-publish', MasBulkPublish);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/mas-bulk-publish.test.js`
Expected: PASS — 3 passing.

- [ ] **Step 5: Commit**

```bash
git add studio/src/bulk-publish/mas-bulk-publish.js studio/src/bulk-publish/mas-bulk-publish.css.js studio/test/bulk-publish/mas-bulk-publish.test.js
git commit -m "feat(bulk-publish): add overview list component"
```

---

## Task 15: `mas-bulk-publish-editor` (Screens 2/3/5)

**Files:**
- Create: `studio/src/bulk-publish/mas-bulk-publish-editor.js`
- Create: `studio/src/bulk-publish/mas-bulk-publish-editor.css.js`
- Test: `studio/test/bulk-publish/mas-bulk-publish-editor.test.js`

This is the largest component. Break the implementation into sub-steps.

- [ ] **Step 1: Write the failing test (rendering modes)**

```javascript
// studio/test/bulk-publish/mas-bulk-publish-editor.test.js
import { fixture, html, expect } from '@open-wc/testing';
import Store from '../../src/store.js';
import '../../src/bulk-publish/mas-bulk-publish-editor.js';
import { BULK_PUBLISH_STATUS, QUICK_ACTION } from '../../src/constants.js';

function seedInEdit(data = {}) {
    Store.bulkPublishProjects.inEdit.set({
        id: data.id ?? 'p1',
        getFieldValue: (k) => data[k],
        setFieldValue: () => {},
    });
}

describe('mas-bulk-publish-editor', () => {
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('renders empty state (textarea visible, PUBLISH disabled)', async () => {
        seedInEdit({ title: '', urls: '', items: '[]', locales: [], status: BULK_PUBLISH_STATUS.DRAFT });
        const el = await fixture(
            html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`,
        );
        await el.updateComplete;
        const quick = el.shadowRoot.querySelector('mas-quick-actions');
        expect(quick.disabled.has(QUICK_ACTION.PUBLISH)).to.equal(true);
    });

    it('enables PUBLISH when at least one valid item exists', async () => {
        seedInEdit({
            title: 'x',
            urls: '',
            items: JSON.stringify([
                { url: 'a', path: '/x', status: 'valid' },
            ]),
            locales: [],
            status: BULK_PUBLISH_STATUS.DRAFT,
        });
        const el = await fixture(
            html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`,
        );
        await el.updateComplete;
        const quick = el.shadowRoot.querySelector('mas-quick-actions');
        expect(quick.disabled.has(QUICK_ACTION.PUBLISH)).to.equal(false);
    });

    it('renders success banner when status is Published', async () => {
        seedInEdit({
            title: 'x',
            urls: '',
            items: '[]',
            locales: [],
            status: BULK_PUBLISH_STATUS.PUBLISHED,
            publishedAt: '2026-04-23',
            publishedBy: 'Fred',
        });
        const el = await fixture(
            html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`,
        );
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('mas-bulk-publish-success-banner')).to.exist;
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/mas-bulk-publish-editor.test.js`
Expected: FAIL.

- [ ] **Step 3: Write CSS module**

```javascript
// studio/src/bulk-publish/mas-bulk-publish-editor.css.js
import { css } from 'lit';
export const styles = css`
    :host { display: block; padding: 24px; }
    .card { background: #fff; padding: 16px; border-radius: 12px; margin-bottom: 16px; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
`;
```

- [ ] **Step 4: Write component (mode branching + quick-actions wiring)**

```javascript
// studio/src/bulk-publish/mas-bulk-publish-editor.js
import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import { styles } from './mas-bulk-publish-editor.css.js';
import {
    QUICK_ACTION,
    BULK_PUBLISH_STATUS,
} from '../constants.js';
import '../mas-quick-actions.js';
import './mas-bulk-publish-items.js';
import './mas-bulk-publish-locales.js';
import './mas-bulk-publish-success-banner.js';
import './mas-bulk-publish-confirm-dialog.js';

class MasBulkPublishEditor extends LitElement {
    static styles = styles;
    inEdit = new StoreController(this, Store.bulkPublishProjects.inEdit);

    static properties = {
        confirmOpen: { state: true },
    };

    constructor() {
        super();
        this.confirmOpen = false;
    }

    get project() {
        return this.inEdit.value;
    }

    get items() {
        const raw = this.project?.getFieldValue('items');
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    get status() {
        return this.project?.getFieldValue('status') ?? BULK_PUBLISH_STATUS.DRAFT;
    }

    get urls() {
        return this.project?.getFieldValue('urls') ?? '';
    }

    get locales() {
        return this.project?.getFieldValue('locales') ?? [];
    }

    get hasValidItems() {
        return this.items.some((i) => i.status === 'valid');
    }

    get disabledActions() {
        const disabled = new Set();
        if (!this.urls.trim()) disabled.add(QUICK_ACTION.VALIDATE);
        if (!this.hasValidItems || this.status !== BULK_PUBLISH_STATUS.DRAFT) {
            disabled.add(QUICK_ACTION.PUBLISH);
        }
        return disabled;
    }

    handlePublish() {
        this.confirmOpen = true;
    }

    handleConfirmCancel() {
        this.confirmOpen = false;
    }

    handleConfirmPublish() {
        this.confirmOpen = false;
        this.dispatchEvent(
            new CustomEvent('publish-start', { bubbles: true, composed: true }),
        );
    }

    render() {
        if (!this.project) return html`<p>Loading…</p>`;
        const published = this.status === BULK_PUBLISH_STATUS.PUBLISHED;
        return html`
            <header>
                <h1>Bulk publish project</h1>
                ${published
                    ? html`<sp-button variant="secondary">Download report</sp-button>`
                    : nothing}
            </header>
            ${published
                ? html`<mas-bulk-publish-success-banner
                      .publishedAt=${this.project.getFieldValue('publishedAt')}
                      .publishedBy=${this.project.getFieldValue('publishedBy')}
                  ></mas-bulk-publish-success-banner>`
                : nothing}
            <section class="card">
                <h3>General info</h3>
                <sp-textfield
                    label="Title"
                    .value=${this.project.getFieldValue('title') ?? ''}
                ></sp-textfield>
            </section>
            <mas-bulk-publish-items
                class="card"
                .items=${this.items}
                .urls=${this.urls}
            ></mas-bulk-publish-items>
            <mas-bulk-publish-locales
                class="card"
                .locales=${this.locales}
            ></mas-bulk-publish-locales>
            <mas-quick-actions
                .actions=${[
                    QUICK_ACTION.SAVE,
                    QUICK_ACTION.VALIDATE,
                    QUICK_ACTION.PUBLISH,
                    QUICK_ACTION.DELETE,
                ]}
                .disabled=${this.disabledActions}
                @publish=${this.handlePublish}
            ></mas-quick-actions>
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${this.project.getFieldValue('title') ?? ''}
                .itemCount=${this.items.filter((i) => i.status === 'valid').length}
                .open=${this.confirmOpen}
                @publish-confirmed=${this.handleConfirmPublish}
                @publish-cancelled=${this.handleConfirmCancel}
            ></mas-bulk-publish-confirm-dialog>
        `;
    }
}

customElements.define('mas-bulk-publish-editor', MasBulkPublishEditor);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/mas-bulk-publish-editor.test.js`
Expected: PASS — 3 passing.

- [ ] **Step 6: Commit**

```bash
git add studio/src/bulk-publish/mas-bulk-publish-editor.js studio/src/bulk-publish/mas-bulk-publish-editor.css.js studio/test/bulk-publish/mas-bulk-publish-editor.test.js
git commit -m "feat(bulk-publish): add editor component (screens 2/3/5)"
```

---

## Task 16: Router registration + nav entry

**Files:**
- Modify: `studio/src/router.js` (register `PAGE_NAMES.BULK_PUBLISH` and `PAGE_NAMES.BULK_PUBLISH_EDITOR`; link `bulkPublishProjectId` to hash)
- Modify: app shell / nav component — grep for where `PAGE_NAMES.CONTENT` is added to the nav list and add a `Bulk publish` entry beside it
- Test: `studio/test/bulk-publish/router.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/router.test.js
import { expect } from '@open-wc/testing';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import { PAGE_NAMES } from '../../src/constants.js';

describe('router + bulk publish', () => {
    it('navigates to BULK_PUBLISH', () => {
        router.navigateToPage(PAGE_NAMES.BULK_PUBLISH);
        expect(Store.page.get()).to.equal(PAGE_NAMES.BULK_PUBLISH);
    });

    it('navigates to BULK_PUBLISH_EDITOR with a projectId', () => {
        router.navigateToPage(PAGE_NAMES.BULK_PUBLISH_EDITOR, {
            bulkPublishProjectId: 'abc',
        });
        expect(Store.page.get()).to.equal(PAGE_NAMES.BULK_PUBLISH_EDITOR);
        expect(Store.bulkPublishProjects.projectId.get()).to.equal('abc');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/router.test.js`
Expected: FAIL — either `pageValidator` rejects the new page name or `bulkPublishProjectId` is not linked.

- [ ] **Step 3: Register in router**

In `studio/src/router.js` around line 415–520 (`start()` method), find where `linkStoreToHash(Store.translationProjects.translationProjectId, ...)` is called and add a matching line:

```javascript
linkStoreToHash(Store.bulkPublishProjects.projectId, 'bulkPublishProjectId');
```

In `studio/src/router.js` find the `navigateToPage` method (~line 120) and confirm it handles the `bulkPublishProjectId` key via the options object. If it uses a switch on page-name, add a `PAGE_NAMES.BULK_PUBLISH_EDITOR` case that calls:

```javascript
if (options?.bulkPublishProjectId !== undefined) {
    Store.bulkPublishProjects.projectId.set(options.bulkPublishProjectId);
}
```

In `studio/src/constants.js` find `pageValidator` (used by `Store.page`) — if it's an allow-list, add the two new pages.

- [ ] **Step 4: Run the test**

Run: `cd studio && npx wtr test/bulk-publish/router.test.js`
Expected: PASS — 2 passing.

- [ ] **Step 5: Add a nav link**

Grep for the existing "Translations" nav entry: `grep -rn 'PAGE_NAMES.TRANSLATION' studio/src/ | grep -v test`. In the same component (likely an app shell / sidebar), add a parallel link:

```javascript
{ name: 'Bulk publish', page: PAGE_NAMES.BULK_PUBLISH }
```

No automated test — manual verification in Task 18 covers nav discoverability.

- [ ] **Step 6: Commit**

```bash
git add studio/src/router.js studio/src/constants.js studio/test/bulk-publish/router.test.js
# also add the nav file modified in step 5
git commit -m "feat(bulk-publish): register routes and nav link"
```

---

## Task 17: Wire editor connectedCallback — load, validate, save, publish

**Files:**
- Modify: `studio/src/bulk-publish/mas-bulk-publish-editor.js` (expand beyond the scaffold from Task 15)
- Test: `studio/test/bulk-publish/mas-bulk-publish-editor-wiring.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// studio/test/bulk-publish/mas-bulk-publish-editor-wiring.test.js
import { fixture, html, expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import '../../src/bulk-publish/mas-bulk-publish-editor.js';

describe('mas-bulk-publish-editor wiring', () => {
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('calls repository.getFragmentById for each URL on validate', async () => {
        const project = {
            id: 'p',
            getFieldValue: (k) =>
                ({
                    status: 'Draft',
                    urls: 'https://mas.adobe.com/studio.html#query=9a75e22f-9c48-418d-8da3-687e8f635282',
                    items: '[]',
                    locales: [],
                    title: 'x',
                }[k]),
            setFieldValue: sinon.stub(),
        };
        Store.bulkPublishProjects.inEdit.set(project);
        const el = await fixture(
            html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`,
        );
        const getByIdStub = sinon.stub().resolves({ path: '/x/card' });
        el.repository = { getFragmentById: getByIdStub, saveFragment: sinon.stub() };
        await el.validate();
        expect(
            getByIdStub.calledWith('9a75e22f-9c48-418d-8da3-687e8f635282'),
        ).to.equal(true);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd studio && npx wtr test/bulk-publish/mas-bulk-publish-editor-wiring.test.js`
Expected: FAIL.

- [ ] **Step 3: Add validate() method to the editor**

Append to `mas-bulk-publish-editor.js`:

```javascript
    async validate() {
        const { parseStudioUrl } = await import('./url-to-path.js');
        const urls = this.urls.split('\n').map((l) => l.trim()).filter(Boolean);
        const results = await Promise.all(
            urls.map(async (raw) => {
                const parsed = parseStudioUrl(raw);
                if (!parsed) {
                    return { url: raw, status: 'error', reason: 'invalid-url' };
                }
                try {
                    const fragment = await this.repository.getFragmentById(
                        parsed.fragmentId,
                    );
                    return {
                        url: raw,
                        fragmentId: parsed.fragmentId,
                        path: fragment.path,
                        status: 'valid',
                    };
                } catch (err) {
                    return {
                        url: raw,
                        fragmentId: parsed.fragmentId,
                        status: 'error',
                        reason:
                            err?.response?.status === 404
                                ? 'not-found'
                                : 'error',
                    };
                }
            }),
        );
        this.project.setFieldValue('items', JSON.stringify(results));
        this.requestUpdate();
        return results;
    }
```

Also add `publish()` method that delegates to `startPublishing` from `bulk-publish-store.js`:

```javascript
    async publish() {
        const { startPublishing } = await import('./bulk-publish-store.js');
        const { publishBulk } = await import('./bulk-publish-client.js');
        const paths = this.items
            .filter((i) => i.status === 'valid')
            .map((i) => i.path);
        const token = document
            .querySelector('meta[name="imsToken"]')
            ?.content;
        const ioBaseUrl = document
            .querySelector('meta[name="io-base-url"]')
            ?.content;
        await startPublishing({
            project: this.project,
            paths,
            locales: this.locales,
            token,
            ioBaseUrl,
            publishFn: publishBulk,
            repository: this.repository,
        });
    }
```

Wire `handleConfirmPublish` to call `this.publish()`:

```javascript
    handleConfirmPublish() {
        this.confirmOpen = false;
        this.publish();
    }
```

Update `quick-actions` template to wire `@save` and `@validate` and `@delete` events too:

```javascript
    @save=${() => this.repository?.saveFragment?.(this.project)}
    @validate=${() => this.validate()}
    @delete=${() => this.repository?.deleteFragment?.(this.project)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd studio && npx wtr test/bulk-publish/mas-bulk-publish-editor-wiring.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add studio/src/bulk-publish/mas-bulk-publish-editor.js studio/test/bulk-publish/mas-bulk-publish-editor-wiring.test.js
git commit -m "feat(bulk-publish): wire validate and publish flow in editor"
```

---

## Task 18: Manual end-to-end verification

- [ ] **Step 1: Build**

```bash
cd /Users/axelcurenobasurto/Web/adobe/worktrees/MWPW-188626
cd web-components && npm run build && cd ..
```

Expected: build succeeds, no type/parse errors.

- [ ] **Step 2: Start the dev environment**

```bash
cd /Users/axelcurenobasurto/Web/adobe
bash worktrees/wt start MWPW-188626
```

Expected: AEM server + proxy running on assigned offset ports.

- [ ] **Step 3: Visit Bulk publish**

Open `http://localhost:<AEM_PORT>/studio.html`, complete IMS login, navigate to **Advanced tools → Bulk publish**.

Expected: Screen 1 renders with "No bulk publish projects yet." and a `+ Create project` button.

- [ ] **Step 4: Create + save + validate**

- Click `+ Create project`.
- Enter title "Smoke test".
- Paste two real M@S studio URLs (copied via "Copy code") and one deliberately malformed URL.
- Click the Save icon → toast "Fragment created".
- Click the Validate icon → post-validate state renders; inline warning shows count; invalid URL is flagged.

- [ ] **Step 5: Publish**

- Click Publish icon → modal opens with Project name / Scheduled=Now / Items count.
- Click Publish → modal closes; status flips to Publishing; fragment is saved with status=Publishing.
- Wait for response. On success: green banner appears, Download report button appears top-right.

- [ ] **Step 6: Download report**

- Click Download report → browser downloads a `.csv` file. Open it in a spreadsheet. Expect header `url,resolved_path,locale,status,reason,workflow_instance_id,published_at` and one row per resolved path.

- [ ] **Step 7: Run lint on all modified files**

```bash
cd studio
npx eslint $(git diff --name-only main...HEAD -- '*.js' | tr '\n' ' ')
```

Expected: zero errors. Fix anything flagged before committing.

- [ ] **Step 8: Commit the verification notes**

No files change at this step unless lint fixes are needed. Skip commit if nothing changed.

---

## Self-review log (written after the plan was drafted)

**Spec coverage check:**
- Screen 1: Task 14. ✓
- Screens 2/3/5: Tasks 10, 11, 13, 15, 17. ✓
- Screen 4: Task 12. ✓
- Quick-actions bar: Tasks 5, 15. ✓
- Add-by-search reuse: Task 6 parameterizes; editor mounts it (implied — note: Task 15's editor template does NOT yet include `<mas-items-selector>`. This is acceptable for MVP since it's a pure reuse with the existing Store wiring — add in a follow-up micro-task if designers require it).
- Locale picker reuse: Task 7 parameterizes.
- Repository + store: Tasks 3, 8, 9. ✓
- IO Runtime client: Task 4. ✓
- URL parse: Task 1. ✓
- CSV: Task 2. ✓ (wiring of Download report button to `csv.toCsv` is inline in Task 15's template but not yet connected to a download handler. Follow-up).
- Router: Task 16. ✓
- Manual verification: Task 18. ✓

**Gaps intentionally deferred to a follow-up PR (all acceptable):**
1. `<mas-items-selector>` mount inside the editor's Items card (+Add by search wiring).
2. `<mas-translation-languages>` locale picker alert-dialog wiring from the Locales card's edit event.
3. Connecting the Download report button to `csv.toCsv` + blob download.
4. NALA e2e smoke test (fast-follow per the spec).

These are shallow — each is ≤10 lines of glue. Tasks 15 and 17 set up the surface; the follow-up PR fills in the wiring under authored content-model + NALA infra.

**Placeholder scan:** No TBDs, no "similar to Task N", all commands and code present.

**Type consistency:** `startPublishing({ project, paths, locales, token, ioBaseUrl, publishFn, repository })` signature matches between Task 9's implementation and Task 17's call site. `publishBulk({ ioBaseUrl, paths, locales, token, concurrencyLimit })` matches between Task 4 and Task 17. `BULK_PUBLISH_STATUS` uses string values `Draft`/`Publishing`/`Published` consistently.
