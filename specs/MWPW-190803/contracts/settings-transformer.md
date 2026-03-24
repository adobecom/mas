# Contract: Settings Transformer Changes (MWPW-190803)

## `SETTING_NAME_DEFINITIONS` — New Entry

**File:** `io/www/src/fragment/transformers/settings.js`

```js
// Add to SETTING_NAME_DEFINITIONS array:
{ name: 'hideTrialCTAs', valueType: 'boolean' }
```

**Behavior:**
- Registers `hideTrialCTAs` as a known setting name
- Setting is discoverable by the Studio Settings UI automatically
- Accepts `booleanValue` in the AEM content fragment
- Card-level override: if a fragment has a field named `hideTrialCTAs`, that value takes precedence

---

## `stripTrialCTAs(fragment)` — New Helper Function

**File:** `io/www/src/fragment/transformers/settings.js`

**Signature:**
```js
function stripTrialCTAs(fragment)
```

**Input:**
- `fragment.fields.ctas` — HTML string containing one or more `<a>` elements

**Behavior:**
- If `fragment.fields?.ctas` is falsy, no-op
- Removes all `<a>` elements whose `data-analytics-id` attribute is `free-trial` or `start-free-trial`
- Trims whitespace from the resulting string
- Modifies `fragment.fields.ctas` in place

**Output:**
- `fragment.fields.ctas` with trial CTA links removed

**Pattern used:**
```js
const TRIAL_CTA_PATTERN = /<a\b[^>]*\bdata-analytics-id="(?:free-trial|start-free-trial)"[^>]*>.*?<\/a>/gis;
```

**Example:**

Input `fragment.fields.ctas`:
```html
<a href="https://..." data-analytics-id="buy-now" class="accent">Buy now</a>
<a href="https://..." data-analytics-id="free-trial" class="primary-outline">Free trial</a>
```

Output `fragment.fields.ctas`:
```html
<a href="https://..." data-analytics-id="buy-now" class="accent">Buy now</a>
```

---

## `applySettings(fragment, settings, locale)` — Modified

**File:** `io/www/src/fragment/transformers/settings.js`

**Change:** Add a call to `stripTrialCTAs(fragment)` at the end of the function body, after the settings loop.

```js
export function applySettings(fragment, settings, locale) {
    for (const definition of SETTING_NAME_DEFINITIONS) {
        const entry = resolveSettingEntry(fragment, settings, definition, locale);
        if (entry === null) continue;
        const value = extractValue(fragment, definition, entry);
        fragment.settings[definition.name] = value;
    }
    // NEW: strip trial CTAs if setting is active for this fragment
    if (fragment.settings.hideTrialCTAs) {
        stripTrialCTAs(fragment);
    }
}
```

**Invariants:**
- If `fragment.settings.hideTrialCTAs` is falsy (false, undefined, null), `stripTrialCTAs` is NOT called — no change to existing behavior
- `stripTrialCTAs` is called after all settings are resolved, so card-level overrides are already factored in
- Collections: `applyCollectionSettings()` calls `applySettings()` per child fragment — the strip logic runs per-fragment automatically

---

## `fragment.settings` — Shape After Change

```ts
interface FragmentSettings {
  secureLabel?: string;
  displayAnnual?: boolean;
  displayPlanType?: boolean;
  quantitySelect?: string;
  addon?: string;
  hideTrialCTAs?: boolean;  // NEW
}
```

The `hideTrialCTAs` boolean is available on `fragment.settings` in the IO response, but consumers (hydrate.js, web-components) do not need to read it — the CTAs are already stripped from `fields.ctas` before delivery.

---

## Unit Test Contract

**File:** `io/www/test/fragment/transformers/settings.test.js` (or equivalent test path)

Tests to add for `stripTrialCTAs`:

| Test case | Input `fields.ctas` | Expected output |
|-----------|---------------------|-----------------|
| Dual CTA — strip trial | buy-now + free-trial links | buy-now link only |
| Dual CTA — strip start-free-trial | buy-now + start-free-trial links | buy-now link only |
| Single buy CTA only | buy-now link | buy-now link (unchanged) |
| Single trial CTA only | free-trial link | empty string (Phase 1 edge case — no replacement) |
| No CTAs | empty string / undefined | no-op |
| Multiple buy CTAs | two buy-now links | both buy-now links (unchanged) |
| Mixed: buy + two trial types | buy-now + free-trial + start-free-trial | buy-now only |
| Card-level override false | free-trial link + `fragment.fields.hideTrialCTAs = false` | free-trial link preserved |

Tests to add for `applySettings` with `hideTrialCTAs`:

| Test case | Setting value | Card field | Expected |
|-----------|--------------|------------|----------|
| Surface setting true | true | not set | trial CTAs stripped |
| Surface setting false | false | not set | no change |
| Surface setting true, card override false | true | false | trial CTAs preserved (override wins) |
| Surface setting not set | undefined | not set | no change |
