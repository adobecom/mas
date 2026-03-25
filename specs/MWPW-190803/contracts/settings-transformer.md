# Contract: hideTrialCTAs Implementation (MWPW-190803)

## `SETTING_NAME_DEFINITIONS` — Entry (IO pipeline)

**File:** `io/www/src/fragment/transformers/settings.js`

```js
{ name: 'hideTrialCTAs', valueType: 'boolean' }
```

- Registers `hideTrialCTAs` as a known setting name — auto-discoverable by Studio Settings UI
- IO pipeline resolves the value onto `fragment.settings.hideTrialCTAs`; does **not** strip CTAs from `fields.ctas`
- Card-level override: if a fragment has a field named `hideTrialCTAs`, that value takes precedence

---

## `processCTAs()` — Modified (web-components)

**File:** `web-components/src/hydrate.js`

```js
export function processCTAs(fields, merchCard, aemFragmentMapping, variant, settings)
```

- If `settings?.hideTrialCTAs` is falsy → all CTAs processed as before (no-op)
- If `settings?.hideTrialCTAs` is true → `<a>` elements with `data-analytics-id="free-trial"` or `"start-free-trial"` are filtered out before `transformLinkToButton()` is called

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

---

## Unit Test Contract

**IO tests** (`io/www/test/fragment/settings.test.js`) — setting resolution only:

| Test case                         | Setting value | Card field | Expected `fragment.settings`    |
| --------------------------------- | ------------- | ---------- | ------------------------------- |
| Surface setting true              | true          | not set    | `{ hideTrialCTAs: true }`       |
| Surface setting false             | false         | not set    | `{ hideTrialCTAs: false }`      |
| Surface true, card override false | true          | false      | `{ hideTrialCTAs: false }`      |
| Surface setting not set           | undefined     | not set    | `hideTrialCTAs` not in settings |

**Web-components tests** (`web-components/test/hydrate.test.js`):

| Test case                          | `settings.hideTrialCTAs` | Input CTAs                 | Expected rendered CTAs |
| ---------------------------------- | ------------------------ | -------------------------- | ---------------------- |
| Setting enabled — free-trial       | true                     | buy-now + free-trial       | buy-now only           |
| Setting enabled — start-free-trial | true                     | buy-now + start-free-trial | buy-now only           |
| Setting disabled                   | false                    | buy-now + free-trial       | both CTAs              |
