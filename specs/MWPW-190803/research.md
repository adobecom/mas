# Research: Hide Trial CTAs via Settings (MWPW-190803)

## Decision 1: Implementation layer — hydrate.js (not IO pipeline)

Filter trial CTAs in `hydrate.js` (`processCTAs()`), reading `settings.hideTrialCTAs` from the fragment payload.

- `settings` is already delivered in the IO payload and available at render time
- `processCTAs()` already queries all `<a>` elements — adding a `.filter()` is minimal and colocated
- Filtering before `transformLinkToButton()` means the button is never created, not just hidden
- Consistent with how other settings (`displayAnnual`, `displayPlanType`) are consumed

The IO layer still resolves the `hideTrialCTAs` value onto `fragment.settings` but does not act on it.

---

## Decision 2: Trial CTA identifier — `data-analytics-id`

Match `<a>` elements with `data-analytics-id="free-trial"` or `data-analytics-id="start-free-trial"`.

- These are the only two analytics IDs in MAS constants that represent trial CTAs
- Set at authoring time via OST; present on all trial CTA types (direct checkout, 3-in-1 modals, business flows)
- `ot=TRIAL` in the URL is not used — it is absent from some trial flows and has been incorrectly applied to non-trial CTAs

---

## Decision 3: Filter placement in `processCTAs()`

Apply a `.filter()` on the queried `<a>` elements before the `.map()` that calls `transformLinkToButton()`.

- Idiomatic extension of the existing `[...footer.querySelectorAll('a')]` pattern
- Filter runs before button creation — no DOM nodes are created for filtered CTAs
- Collections: `processCTAs()` is called per-card, so the filter runs automatically per-card

---

## Decision 4: Card-level override — existing `extractValue()` pattern

If a fragment has a field named `hideTrialCTAs`, that value takes precedence over the surface-level setting.

- Inherited for free from the existing settings mechanism — no new code needed
- `extractValue()` in `settings.js` already checks `fragment.fields?.[propertyName]` before applying the setting value

---

## Decision 5: Single-CTA cards — leave to Adobe Target

When `hideTrialCTAs` is true and a card has only a trial CTA, Phase 1 takes no action. Adobe Target continues to handle single-CTA replacement on a per-surface, per-selector basis. Confirmed acceptable by Nick Lam (PM).

---

## Technical Context Summary

| Area               | File                                           | Change                                                                              |
| ------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| Setting definition | `io/www/src/fragment/transformers/settings.js` | Add `{ name: 'hideTrialCTAs', valueType: 'boolean' }` to `SETTING_NAME_DEFINITIONS` |
| CTA filter logic   | `web-components/src/hydrate.js`                | Add `.filter()` in `processCTAs()` based on `settings.hideTrialCTAs`                |
| UI                 | `studio/src/settings/`                         | No changes — existing Settings UI auto-discovers new setting names                  |
| Constants          | `studio/src/constants.js`                      | No changes — `ANALYTICS_LINK_IDS` already includes `free-trial`, `start-free-trial` |
| Tests              | `web-components/test/hydrate.test.js`          | 3 unit tests for `processCTAs` with `hideTrialCTAs` setting                         |
| NALA tests         | `nala/studio/settings/`                        | 3 E2E tests: enabled (×2 cards) + disabled (route interception)                     |
