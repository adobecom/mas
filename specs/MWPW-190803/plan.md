# Implementation Plan: Hide Trial CTAs via Settings (MWPW-190803)

## Technical Context

**Platform:** Adobe I/O Runtime (Node.js), MAS Studio (Lit + Spectrum WC), AEM content fragments

**Implementation layer:** MAS IO pipeline — `settings` transformer (4th in pipeline)
**Files changed:** 1 file (`io/www/src/fragment/transformers/settings.js`)
**Files unchanged:** Studio UI, web-components, hydrate.js, card fragments

**Pipeline position:**
```
fetchFragment → promotions → customize → [settings ← HERE] → replace → wcs → corrector
```

**Settings resolution flow (existing, unchanged):**
1. `SETTING_NAME_DEFINITIONS` array declares known settings
2. `resolveSettingEntry()` resolves per-fragment by locale → tag score → template filter
3. `extractValue()` checks fragment field override first, then resolved entry value
4. `applySettings()` runs all definitions and writes to `fragment.settings`

**New behavior:** After step 4, if `fragment.settings.hideTrialCTAs === true`, strip trial `<a>` tags from `fragment.fields.ctas`.

---

## Constitution Check

| Principle | Assessment |
|-----------|-----------|
| Delete > Modify > Add | The change is minimal — 1 array entry + 1 helper function + 1 conditional call. No new files. |
| Getters over querySelector | N/A — IO pipeline, not web-components |
| Shared utility check | `settings.js` is the correct shared utility for this change — CTA filtering is driven by a setting |
| Component-level solutions first | Filtering at IO level is correct — no web-component change needed |
| Smallest possible fix | The entire feature is ~15 lines of new code |
| Trust your helpers | `extractValue()` already handles card-level override — we don't need to re-implement it |

---

## Phase 0: Research ✅

See `research.md` — all decisions resolved:
- Implementation layer: IO settings transformer ✅
- Trial CTA identification: `data-analytics-id` (`free-trial`, `start-free-trial`) ✅
- String manipulation: regex with dotall flag ✅
- Card-level override: existing `extractValue()` pattern ✅
- Single-CTA edge case: out of scope, Adobe Target handles ✅

---

## Phase 1: Implementation

### Task 1 — Add `hideTrialCTAs` to setting definitions

**File:** `io/www/src/fragment/transformers/settings.js`

Add to `SETTING_NAME_DEFINITIONS`:
```js
{ name: 'hideTrialCTAs', valueType: 'boolean' }
```

**Acceptance:** Studio Settings UI shows `hideTrialCTAs` as a creatable setting name.

---

### Task 2 — Implement `stripTrialCTAs` helper

**File:** `io/www/src/fragment/transformers/settings.js`

Add before `applySettings`:
```js
const TRIAL_CTA_PATTERN = /<a\b[^>]*\bdata-analytics-id="(?:free-trial|start-free-trial)"[^>]*>.*?<\/a>/gis;

function stripTrialCTAs(fragment) {
    if (!fragment.fields?.ctas) return;
    fragment.fields.ctas = fragment.fields.ctas.replace(TRIAL_CTA_PATTERN, '').trim();
}
```

**Acceptance:** Unit tests pass for all cases in `contracts/settings-transformer.md`.

---

### Task 3 — Call `stripTrialCTAs` in `applySettings`

**File:** `io/www/src/fragment/transformers/settings.js`

At the end of `applySettings()`, after the settings loop:
```js
if (fragment.settings.hideTrialCTAs) {
    stripTrialCTAs(fragment);
}
```

**Acceptance:** When a fragment has `settings.hideTrialCTAs = true`, the response `fields.ctas` contains no trial CTA links.

---

### Task 4 — Unit tests

**File:** `io/www/test/fragment/transformers/settings.test.js` (or equivalent)

Add tests per `contracts/settings-transformer.md`:
- `stripTrialCTAs`: 8 test cases covering dual/single/empty/override scenarios
- `applySettings` with `hideTrialCTAs`: 4 test cases

---

### Task 5 — Deploy to personal IO workspace and validate end-to-end

1. Deploy IO changes to personal workspace (requires IO secrets in GitHub)
2. Load a page on Adobe.com with a dual-CTA card
3. Create `hideTrialCTAs = true` setting scoped to `en_US` in Studio (sandbox)
4. Preview on stage — confirm trial CTA absent from rendered card
5. Confirm buy CTA renders correctly with no visual gap
6. Toggle setting off — confirm trial CTA returns

---

## Verification

### Unit tests (offline)
```bash
cd io/www
npm test -- --grep "hideTrialCTAs|stripTrialCTAs"
```

### End-to-end (personal IO workspace)
1. Deploy: `aio app deploy` from personal IO workspace branch
2. Studio Settings: create `hideTrialCTAs: true` for `en_US` locale on sandbox surface
3. Save without publish → load www.stage.adobe.com page with dual-CTA card → verify trial CTA absent
4. Publish → load www.adobe.com → verify trial CTA absent in production
5. Set `hideTrialCTAs: false` → publish → verify trial CTA returns

### Regression
- All existing settings (secureLabel, displayAnnual, displayPlanType, quantitySelect, addon) must behave identically
- Cards in non-targeted locales must show both CTAs unchanged
- Collections must strip per-fragment (not collection-wide unless setting scopes match)

---

## Files Modified

| File | Change |
|------|--------|
| `io/www/src/fragment/transformers/settings.js` | Add `hideTrialCTAs` to `SETTING_NAME_DEFINITIONS`, add `TRIAL_CTA_PATTERN` constant + `stripTrialCTAs()` helper, call in `applySettings()` |
| `io/www/test/fragment/transformers/settings.test.js` | Add unit tests for new logic |

**No other files changed.**
