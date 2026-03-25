# Implementation Plan: Hide Trial CTAs via Settings (MWPW-190803)

## Technical Context

**Implementation layer:** `web-components/src/hydrate.js` — CTA filtering at render time
**IO pipeline change:** Single line — adds `hideTrialCTAs` to `SETTING_NAME_DEFINITIONS`

**Pipeline position (IO — unchanged except setting definition):**

```
fetchFragment → promotions → customize → [settings ← resolves hideTrialCTAs] → replace → wcs → corrector
```

**Render flow (web-components):**

```
hydrate() → processCTAs(fields, merchCard, mapping, variant, settings)
              ↓
            querySelectorAll('a') → .filter(by hideTrialCTAs) → .map(transformLinkToButton)
```

---

## Constitution Check

| Principle             | Assessment                                                                    |
| --------------------- | ----------------------------------------------------------------------------- |
| Delete > Modify > Add | 1 array entry in IO, 1 parameter + filter in `processCTAs()`. No new files.   |
| Shared utility check  | `settings.js` is the correct place for the definition; `hydrate.js` for logic |
| Smallest possible fix | ~10 lines of new code total                                                   |
| Trust your helpers    | `extractValue()` handles card-level override automatically                    |

---

## Implementation

### IO — Add setting definition

**File:** `io/www/src/fragment/transformers/settings.js`

```js
{ name: 'hideTrialCTAs', valueType: 'boolean' }
```

Added to `SETTING_NAME_DEFINITIONS`. No other IO changes. The pipeline resolves the value onto `fragment.settings.hideTrialCTAs` and delivers it in the payload.

---

### web-components — Filter in `processCTAs()`

**File:** `web-components/src/hydrate.js`

```js
export function processCTAs(fields, merchCard, aemFragmentMapping, variant, settings) {
    if (fields.ctas) {
        fields.ctas = processMnemonicElements(fields.ctas);
        const { slot } = aemFragmentMapping.ctas;
        const footer = createTag('div', { slot }, fields.ctas);
        const ctas = [...footer.querySelectorAll('a')]
            .filter((cta) => {
                if (!settings?.hideTrialCTAs) return true;
                const id = cta.dataset.analyticsId;
                return id !== 'free-trial' && id !== 'start-free-trial';
            })
            .map((cta) => transformLinkToButton(cta, merchCard, aemFragmentMapping));
        footer.innerHTML = '';
        footer.append(...ctas);
        merchCard.append(footer);
    }
}
```

Call site updated: `processCTAs(fields, merchCard, mapping, variant, settings)`

---

## Files Changed

| File                                                | Change                                                |
| --------------------------------------------------- | ----------------------------------------------------- |
| `io/www/src/fragment/transformers/settings.js`      | Add `hideTrialCTAs` to `SETTING_NAME_DEFINITIONS`     |
| `web-components/src/hydrate.js`                     | `processCTAs()` accepts `settings`; filter trial CTAs |
| `web-components/test/hydrate.test.js`               | 3 unit tests for `processCTAs` with `hideTrialCTAs`   |
| `nala/studio/settings/settings.{page,spec,test}.js` | NALA E2E tests for enabled/disabled scenarios         |

---

## Verification

```bash
# Unit tests
cd web-components && npm run build
# → 1187 passed, 0 failed

# NALA tests
LOCAL_TEST_LIVE_URL=http://localhost:3000 npx playwright test nala/studio/settings/settings.test.js
# → 8 passed (3 feature tests × 2 browsers + auth + teardown)
```
