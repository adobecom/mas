# Freyja v2 Preview Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch MAS Studio's content fragment preview from Odin Preview to Freyja v2, with a temporary fallback to Odin during cutover.

**Architecture:** All preview URLs route through `rootURL(preview)` in `paths.js` — changing `preview.url` on the context switches all 7 transformer call sites automatically. Auth headers and fallback logic are added to `internalFetch` in `common.js`, keyed on optional context properties (`authToken`, `fallbackUrl`). Two hardcoded Odin URLs in `mas-repository.js` are updated separately.

**Tech Stack:** Vanilla JS (ES modules), Mocha/Chai/Sinon for tests, c8 for coverage (99% threshold).

**Working directory:** `/Users/axelcurenobasurto/Web/adobe/worktrees/MWPW-191059`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `io/www/src/fragment/utils/paths.js` | Modify | Add `FREYJA_PREVIEW_URL` and `ODIN_PREVIEW_URL` constants |
| `io/www/src/fragment/utils/common.js` | Modify | Auth header injection + fallback logic in `internalFetch` |
| `studio/libs/fragment-client.js` | Modify | Switch `DEFAULT_CONTEXT.preview.url` to Freyja, add `authToken` + `fallbackUrl` |
| `studio/src/mas-repository.js` | Modify | Replace 2 hardcoded Odin URLs, add `authToken` + `fallbackUrl` |
| `io/www/test/fragment/paths.test.js` | Modify | Add tests for new URL constants |
| `io/www/test/fragment/common.test.js` | Create | Tests for auth header injection and fallback logic |
| `io/www/test/fragment/pipeline.test.js` | Modify | Update mock preview URLs from Odin to Freyja |
| `io/www/test/fragment/replace.test.js` | Modify | Update mock preview URLs from Odin to Freyja |
| `io/www/test/client/fragment-client.test.js` | Modify | Update `baseUrl` constant from Odin to Freyja |
| `nala/studio/regional-variations/specs/variations.spec.js` | Modify | Update `referencesBaseUrl` from Odin to Freyja |

---

## Task 1: Add URL Constants to `paths.js`

**Files:**
- Modify: `io/www/src/fragment/utils/paths.js`
- Modify: `io/www/test/fragment/paths.test.js`

- [ ] **Step 1: Write failing tests for new constants**

In `io/www/test/fragment/paths.test.js`, add imports and test cases:

```javascript
import { expect } from 'chai';
import { PATH_TOKENS, odinReferences, FRAGMENT_URL_PREFIX, FREYJA_PREVIEW_URL, ODIN_PREVIEW_URL } from '../../src/fragment/utils/paths.js';

// ... existing tests ...

describe('FREYJA_PREVIEW_URL', () => {
    it('should point to Freyja v2 contentFragments endpoint', () => {
        expect(FREYJA_PREVIEW_URL).to.equal(
            'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments',
        );
    });
});

describe('ODIN_PREVIEW_URL', () => {
    it('should point to Odin preview fragments endpoint', () => {
        expect(ODIN_PREVIEW_URL).to.equal(
            'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd io/www && npx mocha ./test/fragment/paths.test.js`
Expected: FAIL — `FREYJA_PREVIEW_URL is not exported`

- [ ] **Step 3: Add constants to `paths.js`**

In `io/www/src/fragment/utils/paths.js`, add after line 3 (`const FRAGMENT_URL_PREFIX = ...`):

```javascript
const FREYJA_PREVIEW_URL =
    'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments';

const ODIN_PREVIEW_URL =
    'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments';
```

Update the export statement at line 46:

```javascript
export { PATH_TOKENS, FRAGMENT_URL_PREFIX, FREYJA_PREVIEW_URL, ODIN_PREVIEW_URL, MAS_ROOT, odinUrl, odinId, odinReferences };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd io/www && npx mocha ./test/fragment/paths.test.js`
Expected: PASS — all tests green

- [ ] **Step 5: Run full test suite to confirm no regressions**

Run: `cd io/www && npm test`
Expected: PASS — 99%+ coverage maintained

- [ ] **Step 6: Commit**

```bash
git add io/www/src/fragment/utils/paths.js io/www/test/fragment/paths.test.js
git commit -m "feat(MWPW-191059): add Freyja and Odin preview URL constants to paths.js"
```

---

## Task 2: Add Auth Header Injection to `internalFetch`

**Files:**
- Modify: `io/www/src/fragment/utils/common.js`
- Create: `io/www/test/fragment/common.test.js`

- [ ] **Step 1: Write failing tests for auth header injection**

Create `io/www/test/fragment/common.test.js`:

```javascript
import { expect } from 'chai';
import sinon from 'sinon';
import { fetch as internalFetch } from '../../src/fragment/utils/common.js';

describe('internalFetch', () => {
    let fetchStub;

    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(() => {
        fetchStub.restore();
    });

    describe('auth header injection', () => {
        it('should include Authorization header when authToken is set', async () => {
            fetchStub.resolves(new Response(JSON.stringify({ id: '123' }), { status: 200 }));

            const context = {
                authToken: 'test-ims-token',
                DEFAULT_HEADERS: { Accept: 'application/json' },
                networkConfig: { retries: 1, fetchTimeout: 5000 },
            };

            await internalFetch('https://example.com/fragment/123', context, 'test');

            const callArgs = fetchStub.firstCall.args;
            expect(callArgs[1].headers).to.have.property('Authorization', 'Bearer test-ims-token');
            expect(callArgs[1].headers).to.have.property('Accept', 'application/json');
        });

        it('should not include Authorization header when authToken is absent', async () => {
            fetchStub.resolves(new Response(JSON.stringify({ id: '123' }), { status: 200 }));

            const context = {
                DEFAULT_HEADERS: { Accept: 'application/json' },
                networkConfig: { retries: 1, fetchTimeout: 5000 },
            };

            await internalFetch('https://example.com/fragment/123', context, 'test');

            const callArgs = fetchStub.firstCall.args;
            expect(callArgs[1].headers).to.not.have.property('Authorization');
        });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd io/www && npx mocha ./test/fragment/common.test.js`
Expected: FAIL — Authorization header not present

- [ ] **Step 3: Implement auth header injection in `fetchAttempt`**

In `io/www/src/fragment/utils/common.js`, modify `fetchAttempt` (line 49-95). Replace lines 52-54:

```javascript
async function fetchAttempt(path, context, timeout, marker) {
    try {
        mark(context, marker);
        const headers = { ...context.DEFAULT_HEADERS };
        if (context.authToken) {
            headers['Authorization'] = `Bearer ${context.authToken}`;
        }
        const responsePromise = fetch(path, { headers });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd io/www && npx mocha ./test/fragment/common.test.js`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `cd io/www && npm test`
Expected: PASS — 99%+ coverage

- [ ] **Step 6: Commit**

```bash
git add io/www/src/fragment/utils/common.js io/www/test/fragment/common.test.js
git commit -m "feat(MWPW-191059): inject Authorization header when authToken is on context"
```

---

## Task 3: Add Fallback Logic to `internalFetch`

**Files:**
- Modify: `io/www/src/fragment/utils/common.js`
- Modify: `io/www/test/fragment/common.test.js`

- [ ] **Step 1: Write failing tests for fallback behavior**

Add to `io/www/test/fragment/common.test.js`:

```javascript
describe('fallback logic', () => {
    it('should fall back to fallbackUrl when primary fetch fails with 5xx', async () => {
        const freyjaUrl = 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments/abc?references=all-hydrated';
        const expectedOdinUrl = 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments/abc?references=all-hydrated';

        // Freyja fails
        fetchStub.withArgs(freyjaUrl, sinon.match.any).resolves(
            new Response('Server Error', { status: 500 }),
        );
        // Odin succeeds
        fetchStub.withArgs(expectedOdinUrl, sinon.match.any).resolves(
            new Response(JSON.stringify({ id: 'abc' }), { status: 200 }),
        );

        const context = {
            authToken: 'test-token',
            preview: { url: 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments' },
            fallbackUrl: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
            networkConfig: { retries: 1, fetchTimeout: 5000 },
        };

        const result = await internalFetch(freyjaUrl, context, 'test');
        expect(result.status).to.equal(200);
        // Verify Odin call was made without Authorization header
        const odinCall = fetchStub.getCalls().find(c => c.args[0] === expectedOdinUrl);
        expect(odinCall).to.not.be.undefined;
        expect(odinCall.args[1].headers).to.not.have.property('Authorization');
    });

    it('should not fall back when primary fetch succeeds', async () => {
        const freyjaUrl = 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments/abc';

        fetchStub.resolves(new Response(JSON.stringify({ id: 'abc' }), { status: 200 }));

        const context = {
            authToken: 'test-token',
            preview: { url: 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments' },
            fallbackUrl: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
            networkConfig: { retries: 1, fetchTimeout: 5000 },
        };

        const result = await internalFetch(freyjaUrl, context, 'test');
        expect(result.status).to.equal(200);
        expect(fetchStub.callCount).to.equal(1);
    });

    it('should propagate error when both primary and fallback fail', async () => {
        const freyjaUrl = 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments/abc';
        const odinUrl = 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments/abc';

        fetchStub.withArgs(freyjaUrl, sinon.match.any).resolves(
            new Response('Server Error', { status: 500 }),
        );
        fetchStub.withArgs(odinUrl, sinon.match.any).resolves(
            new Response('Server Error', { status: 500 }),
        );

        const context = {
            authToken: 'test-token',
            preview: { url: 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments' },
            fallbackUrl: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
            networkConfig: { retries: 1, fetchTimeout: 5000 },
        };

        const result = await internalFetch(freyjaUrl, context, 'test');
        expect(result.status).to.equal(500);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd io/www && npx mocha ./test/fragment/common.test.js`
Expected: FAIL — fallback URL not attempted

- [ ] **Step 3: Implement fallback logic in `internalFetch`**

In `io/www/src/fragment/utils/common.js`, replace the `internalFetch` function (lines 104-125):

```javascript
async function internalFetch(path, context, marker) {
    mark(context, `${marker}`);
    const { retries = 3, fetchTimeout = 2000, retryDelay = 100 } = context.networkConfig || {};

    // Primary attempt (single try when fallbackUrl is set, full retries otherwise)
    const primaryRetries = context.fallbackUrl ? 1 : retries;
    let response = await fetchWithRetries(path, context, fetchTimeout, primaryRetries, retryDelay, marker);

    // Fallback: if primary failed and fallbackUrl is configured, try Odin
    if (context.fallbackUrl && response.status !== 200) {
        const fallbackPath = path.replace(context.preview?.url, context.fallbackUrl);
        log(`[preview] Freyja failed (${response.status}), falling back to Odin`, context);
        const fallbackContext = { ...context, authToken: undefined, fallbackUrl: undefined };
        response = await fetchWithRetries(fallbackPath, fallbackContext, fetchTimeout, retries, retryDelay, `${marker}-fallback`);
        if (response.status === 200) {
            log('[preview] Odin fallback OK', context);
        }
    } else if (context.fallbackUrl && response.status === 200) {
        log('[preview] Freyja OK', context);
    }

    measureTiming(context, `main-fetch-${marker}`, marker);
    return response;
}

async function fetchWithRetries(path, context, fetchTimeout, retries, retryDelay, marker) {
    let delay = retryDelay;
    let response;
    for (let attempt = 0; attempt < retries; attempt++) {
        response = await fetchAttempt(path, context, fetchTimeout, `fetch-${marker}-${attempt}`);
        if ([503, 504].includes(response.status)) {
            log(
                `fetch ${path} (attempt #${attempt}) failed with status ${response.status}, retrying in ${delay}ms...`,
                context,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
        } else {
            break;
        }
    }
    return response;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd io/www && npx mocha ./test/fragment/common.test.js`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `cd io/www && npm test`
Expected: PASS — 99%+ coverage

- [ ] **Step 6: Commit**

```bash
git add io/www/src/fragment/utils/common.js io/www/test/fragment/common.test.js
git commit -m "feat(MWPW-191059): add Freyja-first fallback to Odin in internalFetch"
```

---

## Task 4: Switch `fragment-client.js` to Freyja

**Files:**
- Modify: `studio/libs/fragment-client.js`
- Modify: `io/www/test/client/fragment-client.test.js`

- [ ] **Step 1: Update `DEFAULT_CONTEXT` in `fragment-client.js`**

In `studio/libs/fragment-client.js`, add import at top (after line 8):

```javascript
import { FREYJA_PREVIEW_URL, ODIN_PREVIEW_URL } from '../../io/www/src/fragment/utils/paths.js';
```

Replace `DEFAULT_CONTEXT` (lines 37-50):

```javascript
const DEFAULT_CONTEXT = {
    status: 200,
    preview:{
        url: FREYJA_PREVIEW_URL,
    },
    fallbackUrl: ODIN_PREVIEW_URL,
    get authToken() {
        return window.adobeIMS?.getAccessToken()?.token;
    },
    requestId: 'preview',
    state: new LocaleStorageState(),
    networkConfig: {
        mainTimeout: 20000,
        fetchTimeout: 4000,
        retries: 3,
    },
    locale: 'en_US',
};
```

Note: `authToken` is a getter so it reads the fresh token on every pipeline invocation. `fetchTimeout` reduced from 15s to 4s since Freyja should be fast.

- [ ] **Step 2: Update test mock URL**

In `io/www/test/client/fragment-client.test.js`, change line 32:

```javascript
const baseUrl = 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments';
```

Update all `fetchStub.withArgs` calls that construct URLs from `baseUrl` — these build paths like `${baseUrl}/${id}?references=all-hydrated` which will now use the Freyja URL pattern. Also stub `window.adobeIMS`:

After the `globalThis.window` stub (around line 44), add:

```javascript
globalThis.window.adobeIMS = { getAccessToken: () => ({ token: 'test-ims-token' }) };
```

- [ ] **Step 3: Run fragment-client tests**

Run: `cd io/www && npx mocha ./test/client/fragment-client.test.js`
Expected: PASS

- [ ] **Step 4: Run full test suite**

Run: `cd io/www && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add studio/libs/fragment-client.js io/www/test/client/fragment-client.test.js
git commit -m "feat(MWPW-191059): switch fragment-client preview to Freyja v2 with Odin fallback"
```

---

## Task 5: Switch `mas-repository.js` to Freyja

**Files:**
- Modify: `studio/src/mas-repository.js`

- [ ] **Step 1: Add import**

At the top of `studio/src/mas-repository.js`, add:

```javascript
import { FREYJA_PREVIEW_URL, ODIN_PREVIEW_URL } from '../../io/www/src/fragment/utils/paths.js';
```

- [ ] **Step 2: Update `loadPreviewPlaceholders` fallback context (line 572-575)**

Replace:

```javascript
                    const fallbackContext = {
                        preview: {
                            url: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
                        },
```

With:

```javascript
                    const fallbackContext = {
                        preview: {
                            url: FREYJA_PREVIEW_URL,
                        },
                        fallbackUrl: ODIN_PREVIEW_URL,
                        authToken: window.adobeIMS?.getAccessToken()?.token,
```

- [ ] **Step 3: Update `fetchDictionary` context (lines 600-611)**

Replace:

```javascript
        const context = {
            preview: {
                url: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
            },
            locale: this.filters.value.locale,
            surface: this.search.value.path,
            networkConfig: {
                mainTimeout: 15000,
                fetchTimeout: 10000,
                retries: 3,
            },
        };
```

With:

```javascript
        const context = {
            preview: {
                url: FREYJA_PREVIEW_URL,
            },
            fallbackUrl: ODIN_PREVIEW_URL,
            authToken: window.adobeIMS?.getAccessToken()?.token,
            locale: this.filters.value.locale,
            surface: this.search.value.path,
            networkConfig: {
                mainTimeout: 15000,
                fetchTimeout: 4000,
                retries: 3,
            },
        };
```

Note: `fetchTimeout` reduced from 10s to 4s for the primary Freyja attempt.

- [ ] **Step 4: Verify lint passes**

Run: `npx eslint studio/src/mas-repository.js`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add studio/src/mas-repository.js
git commit -m "feat(MWPW-191059): switch mas-repository preview URLs to Freyja v2"
```

---

## Task 6: Update Pipeline and Replace Test Mocks

**Files:**
- Modify: `io/www/test/fragment/pipeline.test.js`
- Modify: `io/www/test/fragment/replace.test.js`

- [ ] **Step 1: Update `pipeline.test.js` mock URLs**

In `io/www/test/fragment/pipeline.test.js`, update the preview URL constants (around lines 43-48):

Replace:

```javascript
const SETTINGS_INDEX_URL_PREVIEW =
    'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments?path=/content/dam/mas/sandbox/settings/index';
```

With:

```javascript
const SETTINGS_INDEX_URL_PREVIEW =
    'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments?path=/content/dam/mas/sandbox/settings/index';
```

Replace:

```javascript
const SETTINGS_CONTENT_URL_PREVIEW = (settingsId) =>
    `https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments/${settingsId}?references=all-hydrated`;
```

With:

```javascript
const SETTINGS_CONTENT_URL_PREVIEW = (settingsId) =>
    `https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments/${settingsId}?references=all-hydrated`;
```

Update `setupFragmentMocks` (line 63-64):

Replace:

```javascript
    const odinDomain = `https://${preview ? 'odinpreview.corp' : 'odin'}.adobe.com`;
    const odinUriRoot = preview ? '/adobe/sites/cf/fragments' : '/adobe/sites/fragments';
```

With:

```javascript
    const odinDomain = preview
        ? 'https://preview-p22655-e59433.adobeaemcloud.com'
        : 'https://odin.adobe.com';
    const odinUriRoot = preview ? '/adobe/contentFragments' : '/adobe/sites/fragments';
```

Update the preview context in the test (around line 178-180):

Replace:

```javascript
            preview: {
                url: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
            },
```

With:

```javascript
            preview: {
                url: 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments',
            },
```

- [ ] **Step 2: Update `replace.test.js` mock URLs**

In `io/www/test/fragment/replace.test.js`, update `mockDictionaryBySurfaceLocale` (around line 43-44):

Replace:

```javascript
    const odinDomain = `https://${preview ? 'odinpreview.corp' : 'odin'}.adobe.com`;
    const odinUriRoot = preview ? '/adobe/sites/cf/fragments' : '/adobe/sites/fragments';
```

With:

```javascript
    const odinDomain = preview
        ? 'https://preview-p22655-e59433.adobeaemcloud.com'
        : 'https://odin.adobe.com';
    const odinUriRoot = preview ? '/adobe/contentFragments' : '/adobe/sites/fragments';
```

- [ ] **Step 3: Run updated tests**

Run: `cd io/www && npx mocha ./test/fragment/pipeline.test.js && npx mocha ./test/fragment/replace.test.js`
Expected: PASS

- [ ] **Step 4: Run full test suite**

Run: `cd io/www && npm test`
Expected: PASS — 99%+ coverage

- [ ] **Step 5: Commit**

```bash
git add io/www/test/fragment/pipeline.test.js io/www/test/fragment/replace.test.js
git commit -m "test(MWPW-191059): update pipeline and replace test mocks for Freyja URLs"
```

---

## Task 7: Update Nala Spec

**Files:**
- Modify: `nala/studio/regional-variations/specs/variations.spec.js`

- [ ] **Step 1: Update `referencesBaseUrl`**

In `nala/studio/regional-variations/specs/variations.spec.js`, replace line 160:

```javascript
                referencesBaseUrl: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
```

With:

```javascript
                referencesBaseUrl: 'https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments',
```

- [ ] **Step 2: Verify no other odinpreview references remain**

Run: `grep -r "odinpreview" io/www/src/ studio/libs/ studio/src/`
Expected: Only `studio/src/constants.js:252` (`ODIN_PREVIEW_ORIGIN`) should remain — this is intentionally kept for the cutover period.

- [ ] **Step 3: Commit**

```bash
git add nala/studio/regional-variations/specs/variations.spec.js
git commit -m "test(MWPW-191059): update Nala variation spec for Freyja preview URLs"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Run full io/www test suite**

Run: `cd io/www && npm test`
Expected: PASS — 99%+ coverage, zero failures

- [ ] **Step 2: Run ESLint on all modified files**

Run:
```bash
npx eslint io/www/src/fragment/utils/paths.js io/www/src/fragment/utils/common.js studio/libs/fragment-client.js studio/src/mas-repository.js
```
Expected: No errors

- [ ] **Step 3: Grep for stale odinpreview references**

Run: `grep -rn "odinpreview" io/www/ studio/ nala/ --include="*.js" --include="*.mjs" | grep -v node_modules | grep -v constants.js`
Expected: Zero matches (only `constants.js:252` should have it, excluded by the grep filter)

- [ ] **Step 4: Discovery — test Freyja endpoint manually**

Run (requires VPN):
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $(node -e "/* get IMS token from adobeIMS */")" \
  "https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments/f17d9a60-6205-49f5-8aa4-4f8e662268ed?references=all-hydrated"
```
Expected: HTTP 200. If not, investigate before pushing.

- [ ] **Step 5: Commit any remaining fixes and verify git log**

Run: `git log --oneline -8`
Expected: 7 commits for this ticket, each prefixed with `feat(MWPW-191059)` or `test(MWPW-191059)`
