# Contract: hideTrialCTAs Implementation (MWPW-190803)

## `SETTING_NAME_DEFINITIONS` — Entry (IO pipeline)

**File:** `io/www/src/fragment/transformers/settings.js`

```js
// Already in SETTING_NAME_DEFINITIONS array:
{ name: 'hideTrialCTAs', valueType: 'boolean' }
```

**Behavior:**

- Registers `hideTrialCTAs` as a known setting name
- Setting is discoverable by the Studio Settings UI automatically
- Accepts `booleanValue` in the AEM content fragment
- Card-level override: if a fragment has a field named `hideTrialCTAs`, that value takes precedence
- The IO pipeline resolves the value onto `fragment.settings.hideTrialCTAs` but does NOT strip CTAs from `fields.ctas`

---

## `processCTAs()` — Modified (web-components)

**File:** `web-components/src/hydrate.js`

**Signature:**

```js
export function processCTAs(fields, merchCard, aemFragmentMapping, variant, settings)
```

**New parameter:** `settings` — the fragment's resolved settings object (from `fragment.settings`)

**Behavior:**

- If `settings?.hideTrialCTAs` is falsy, all CTAs are processed as before (no-op)
- If `settings?.hideTrialCTAs` is true, `<a>` elements with `data-analytics-id="free-trial"` or `"start-free-trial"` are filtered out before `transformLinkToButton()` is called
- Filter runs before button creation — the button element is never created for filtered CTAs

**Filter logic:**

```js
.filter((cta) => {
    if (!settings?.hideTrialCTAs) return true;
    const id = cta.dataset.analyticsId;
    return id !== 'free-trial' && id !== 'start-free-trial';
})
```

---

## `fragment.settings` — Shape

```ts
interface FragmentSettings {
    secureLabel?: string;
    displayAnnual?: boolean;
    displayPlanType?: boolean;
    quantitySelect?: string;
    addon?: string;
    hideTrialCTAs?: boolean;
}
```

The `hideTrialCTAs` boolean is delivered in `fragment.settings` from the IO pipeline. `hydrate.js` reads it in `processCTAs()` to filter CTAs during card rendering.

---

## Unit Test Contract

**IO tests** (`io/www/test/fragment/settings.test.js`):

Tests for `hideTrialCTAs` setting **resolution only** (not strip behavior):

| Test case                         | Setting value | Card field | Expected `fragment.settings` |
| --------------------------------- | ------------- | ---------- | ---------------------------- |
| Surface setting true              | true          | not set    | `{ hideTrialCTAs: true }`    |
| Surface setting false             | false         | not set    | `{ hideTrialCTAs: false }`   |
| Surface true, card override false | true          | false      | `{ hideTrialCTAs: false }`   |
| Surface setting not set           | undefined     | not set    | `hideTrialCTAs` not set      |

**Web-components tests** (`web-components/test/`):

Tests for `processCTAs` with `hideTrialCTAs` setting:

| Test case                          | `settings.hideTrialCTAs` | Input CTAs                 | Expected rendered CTAs |
| ---------------------------------- | ------------------------ | -------------------------- | ---------------------- |
| Setting enabled — dual CTA         | true                     | buy-now + free-trial       | buy-now only           |
| Setting enabled — start-free-trial | true                     | buy-now + start-free-trial | buy-now only           |
| Setting disabled                   | false                    | buy-now + free-trial       | both CTAs              |
| Setting not set                    | undefined                | buy-now + free-trial       | both CTAs              |
| Single trial CTA only              | true                     | free-trial                 | no CTAs rendered       |
