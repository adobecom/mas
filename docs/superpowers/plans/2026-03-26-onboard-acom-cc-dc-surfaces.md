# Onboard ACOM CC and ACOM DC Surfaces — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register two new surfaces (acom-cc, acom-dc) in MAS Studio with locale config, template assignments, translation support, and LDAP tenant registration.

**Architecture:** Configuration-driven changes across Studio constants, IO Runtime locales, variant picker template filtering, translation mapping, and LDAP script. No new files created — all modifications to existing files.

**Tech Stack:** Lit web components (Studio), Node.js (IO Runtime, LDAP script), YAML config

**Spec:** `docs/superpowers/specs/2026-03-26-onboard-acom-cc-dc-surfaces-design.md`

---

### Task 1: Register surfaces in constants.js

**Files:**
- Modify: `studio/src/constants.js:183-212` (SURFACES object)
- Modify: `studio/src/constants.js:246` (TRANSLATIONS_ALLOWED_SURFACES)

- [ ] **Step 1: Add ACOM_CC and ACOM_DC to SURFACES**

In `studio/src/constants.js`, add after the `ACOM` entry (maintaining alphabetical order):

```javascript
ACOM_CC: {
    label: 'ACOM CC',
    name: 'acom-cc',
},
ACOM_DC: {
    label: 'ACOM DC',
    name: 'acom-dc',
},
```

- [ ] **Step 2: Add new surfaces to TRANSLATIONS_ALLOWED_SURFACES**

In the same file, update `TRANSLATIONS_ALLOWED_SURFACES`:

```javascript
export const TRANSLATIONS_ALLOWED_SURFACES = ['acom', 'acom-cc', 'acom-dc', 'express', 'sandbox', 'nala'];
```

- [ ] **Step 3: Commit**

```bash
git add studio/src/constants.js
git commit -m "MWPW-190146: register ACOM CC and ACOM DC surfaces"
```

---

### Task 2: Configure locale mapping

**Files:**
- Modify: `io/www/src/fragment/locales.js:348-356` (DEFAULT_LOCALES)
- Test: `io/www/test/fragment/locales.test.js`

- [ ] **Step 1: Write failing tests for new surface locale resolution**

In `io/www/test/fragment/locales.test.js`, add inside the `getDefaultLocales` describe block:

```javascript
it('should return ACOM locales for acom-cc surface', function () {
    const acomResult = getDefaultLocales('acom');
    const acomCcResult = getDefaultLocales('acom-cc');
    expect(acomCcResult).to.deep.equal(acomResult);
});

it('should return ACOM locales for acom-dc surface', function () {
    const acomResult = getDefaultLocales('acom');
    const acomDcResult = getDefaultLocales('acom-dc');
    expect(acomDcResult).to.deep.equal(acomResult);
});
```

Add inside the `getDefaultLocaleCode` describe block:

```javascript
it('should resolve locale codes for acom-cc like acom', function () {
    expect(getDefaultLocaleCode('acom-cc', 'fr_CA')).to.equal('fr_FR');
    expect(getDefaultLocaleCode('acom-cc', 'en_AU')).to.equal('en_GB');
    expect(getDefaultLocaleCode('acom-cc', 'en_US')).to.equal('en_US');
});

it('should resolve locale codes for acom-dc like acom', function () {
    expect(getDefaultLocaleCode('acom-dc', 'fr_CA')).to.equal('fr_FR');
    expect(getDefaultLocaleCode('acom-dc', 'en_AU')).to.equal('en_GB');
    expect(getDefaultLocaleCode('acom-dc', 'en_US')).to.equal('en_US');
});
```

Add inside the `getSurfaceLocales` describe block:

```javascript
it('should return same locales for acom-cc as acom', function () {
    const acomLocales = getSurfaceLocales('acom');
    const acomCcLocales = getSurfaceLocales('acom-cc');
    expect(acomCcLocales.length).to.equal(acomLocales.length);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd io/www && npm test -- --grep "acom-cc"`
Expected: FAIL — `getDefaultLocales('acom-cc')` returns empty array

- [ ] **Step 3: Add locale entries**

In `io/www/src/fragment/locales.js`, add to `DEFAULT_LOCALES` (after `acom`, before `nala`):

```javascript
const DEFAULT_LOCALES = {
    acom: ACOM,
    'acom-cc': ACOM,
    'acom-dc': ACOM,
    nala: ACOM,
    sandbox: ACOM,
    ccd: CCD,
    express: EXPRESS,
    'adobe-home': ADOBE_HOME,
    commerce: COMMERCE,
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd io/www && npm test`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add io/www/src/fragment/locales.js io/www/test/fragment/locales.test.js
git commit -m "MWPW-190146: add locale mapping for acom-cc and acom-dc"
```

---

### Task 3: Reassign templates in variant picker

**Files:**
- Modify: `studio/src/editors/variant-picker.js:30-125`
- Test: `studio/test/editors/variant-picker.test.js`

- [ ] **Step 1: Write failing tests for template filtering**

In `studio/test/editors/variant-picker.test.js`, add import for `getVariantTreeData`:

```javascript
import { VARIANTS, VARIANT_NAMES, getVariantTreeData } from '../../src/editors/variant-picker.js';
```

Add a new `describe('getVariantTreeData')` block after the existing `describe('VARIANTS')`:

```javascript
describe('getVariantTreeData', () => {
    it('should return only CC templates for acom-cc surface', () => {
        const result = getVariantTreeData('acom-cc');
        const names = result.map((v) => v.name);
        expect(names).to.include('product');
        expect(names).to.include('segment');
        expect(names).to.include('mini-compare-chart');
        expect(names).to.include('image');
        expect(names).to.include('special-offers');
        expect(names).to.not.include('plans');
        expect(names).to.not.include('catalog');
        expect(names).to.not.include('ccd-slice');
        expect(names.length).to.equal(5);
    });

    it('should return only DC templates for acom-dc surface', () => {
        const result = getVariantTreeData('acom-dc');
        const names = result.map((v) => v.name);
        expect(names).to.include('product');
        expect(names).to.include('segment');
        expect(names).to.include('mini-compare-chart');
        expect(names).to.include('image');
        expect(names).to.not.include('special-offers');
        expect(names).to.not.include('plans');
        expect(names.length).to.equal(4);
    });

    it('should return only plans/catalog templates for acom surface', () => {
        const result = getVariantTreeData('acom');
        const names = result.map((v) => v.name);
        expect(names).to.include('plans');
        expect(names).to.include('plans-v2');
        expect(names).to.include('plans-students');
        expect(names).to.include('plans-education');
        expect(names).to.include('catalog');
        expect(names).to.include('media');
        expect(names).to.include('mini-compare-chart-mweb');
        expect(names).to.not.include('product');
        expect(names).to.not.include('segment');
        expect(names).to.not.include('image');
        expect(names).to.not.include('special-offers');
    });

    it('should return all variants for sandbox surface', () => {
        const result = getVariantTreeData('sandbox');
        const names = result.map((v) => v.name);
        expect(names).to.include('product');
        expect(names).to.include('plans');
        expect(names).to.include('ccd-slice');
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd studio && npm run test:ci -- --grep "getVariantTreeData"`
Expected: FAIL — acom-cc returns empty, acom still includes product

- [ ] **Step 3: Add allowlist sets and update filter logic**

In `studio/src/editors/variant-picker.js`, add after the `VARIANTS` array (before `getVariantTreeData`):

```javascript
const ACOM_CC_TEMPLATES = new Set([
    VARIANT_NAMES.PRODUCT,
    VARIANT_NAMES.SEGMENT,
    VARIANT_NAMES.MINI_COMPARE_CHART,
    VARIANT_NAMES.IMAGE,
    VARIANT_NAMES.SPECIAL_OFFERS,
]);

const ACOM_DC_TEMPLATES = new Set([
    VARIANT_NAMES.PRODUCT,
    VARIANT_NAMES.SEGMENT,
    VARIANT_NAMES.MINI_COMPARE_CHART,
    VARIANT_NAMES.IMAGE,
]);
```

Reassign surfaces in the `VARIANTS` array — change these entries from `surface: SURFACES.ACOM.name` to `surface: SURFACES.ACOM_CC.name`:
- `VARIANT_NAMES.PRODUCT` (line 49-52)
- `VARIANT_NAMES.SEGMENT` (line 54)
- `VARIANT_NAMES.IMAGE` (line 88-91)
- `VARIANT_NAMES.SPECIAL_OFFERS` (line 57-60)
- `VARIANT_NAMES.MINI_COMPARE_CHART` (line 103-107)

These templates no longer belong to ACOM directly — they're accessed via the allowlist sets.

Update `getVariantTreeData`:

```javascript
/** Flat tree-picker-compatible list of allowed variants, optionally filtered by surface. */
export const getVariantTreeData = (surface) =>
    VARIANTS.filter((v) => {
        if (v.value === VARIANT_NAMES.ALL) return false;
        if (!surface) return true;
        if ([SURFACES.SANDBOX.name, SURFACES.NALA.name].includes(surface)) return true;
        if (surface === SURFACES.ACOM_CC.name) return ACOM_CC_TEMPLATES.has(v.value);
        if (surface === SURFACES.ACOM_DC.name) return ACOM_DC_TEMPLATES.has(v.value);
        return v.surface === surface;
    }).map((v) => ({
        name: v.value,
        label: v.label,
    }));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd studio && npm run test:ci`
Expected: All tests PASS

- [ ] **Step 5: Run linter on modified files**

Run: `npx eslint studio/src/editors/variant-picker.js studio/test/editors/variant-picker.test.js`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add studio/src/editors/variant-picker.js studio/test/editors/variant-picker.test.js
git commit -m "MWPW-190146: reassign templates to ACOM CC and ACOM DC surfaces"
```

---

### Task 4: Update side nav translation check

**Files:**
- Modify: `studio/src/mas-side-nav.js:279-282`

- [ ] **Step 1: Add new surfaces to isTranslationEnabled**

In `studio/src/mas-side-nav.js`, update the `isTranslationEnabled` getter:

```javascript
get isTranslationEnabled() {
    const surface = Store.search.value?.path?.split('/').filter(Boolean)[0]?.toLowerCase();
    return [
        SURFACES.ACOM.name,
        SURFACES.ACOM_CC.name,
        SURFACES.ACOM_DC.name,
        SURFACES.EXPRESS.name,
        SURFACES.SANDBOX.name,
        SURFACES.NALA.name,
    ].includes(surface);
}
```

- [ ] **Step 2: Run linter**

Run: `npx eslint studio/src/mas-side-nav.js`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add studio/src/mas-side-nav.js
git commit -m "MWPW-190146: enable translations for ACOM CC and ACOM DC"
```

---

### Task 5: Add translation flow mapping

**Files:**
- Modify: `io/studio/app.config.yaml:47-50`

- [ ] **Step 1: Add acom-cc and acom-dc to translationMapping**

In `io/studio/app.config.yaml`, update the `translationMapping` block:

```yaml
                            translationMapping:
                                acom: transcreation
                                acom-cc: transcreation
                                acom-dc: transcreation
                                express: transcreation
                                sandbox: machineTranslation
```

- [ ] **Step 2: Commit**

```bash
git add io/studio/app.config.yaml
git commit -m "MWPW-190146: add translation flow mapping for ACOM CC and ACOM DC"
```

---

### Task 6: Add LDAP tenants

**Files:**
- Modify: `scripts/app/refreshUsers.mjs:57`

- [ ] **Step 1: Add ACOM-CC and ACOM-DC to tenants array**

In `scripts/app/refreshUsers.mjs`, update the tenants array:

```javascript
const tenants = ['CCD', 'ACOM', 'ACOM-CC', 'ACOM-DC', 'COMMERCE', 'AH', 'SANDBOX', 'NALA'];
```

- [ ] **Step 2: Run linter**

Run: `npx eslint scripts/app/refreshUsers.mjs`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add scripts/app/refreshUsers.mjs
git commit -m "MWPW-190146: add ACOM CC and ACOM DC LDAP tenants"
```

---

### Task 7: Build and verify

**Files:**
- Build output: `studio/libs/fragment-client.js` (auto-generated)

- [ ] **Step 1: Build IO fragment client**

Run: `cd io/www && npm run build:client`
Expected: Generates updated `studio/libs/fragment-client.js` with new locale entries

- [ ] **Step 2: Run IO www tests**

Run: `cd io/www && npm test`
Expected: All tests pass including new locale tests

- [ ] **Step 3: Run Studio tests**

Run: `cd studio && npm run test:ci`
Expected: All tests pass including new variant picker tests

- [ ] **Step 4: Build Studio**

Run: `cd studio && npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit built artifacts**

```bash
git add studio/libs/fragment-client.js
git commit -m "MWPW-190146: rebuild fragment client with new surface locales"
```
