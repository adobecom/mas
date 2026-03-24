# Research: Hide Trial CTAs via Settings (MWPW-190803)

## Decision 1: Implementation layer — where to filter trial CTAs

**Decision:** Filter trial CTAs in `hydrate.js` (web-components layer), inside `processCTAs()`, reading `settings.hideTrialCTAs` from the fragment payload.

**Rationale:**

- The `settings` object is already delivered in the IO fragment payload and assigned to `merchCard.settings` and destructured into `hydrate()` at render time
- `processCTAs()` already queries all `<a>` elements from the CTA HTML — adding a `.filter()` step is minimal and colocated with the CTA processing logic
- Filtering at the DOM level (before `transformLinkToButton`) means the button is never created, not just hidden
- This approach is consistent with how other settings (e.g., `displayAnnual`, `displayPlanType`) are consumed by the web-components layer

**Alternatives considered:**

- **IO pipeline (`settings` transformer):** Originally implemented here. Moved to hydrate.js to keep the IO pipeline as a pure data transformer — settings resolution and delivery, not content manipulation. The IO layer still resolves the `hideTrialCTAs` value onto `fragment.settings`; it no longer acts on it.
- **corrector transformer:** Runs last in the pipeline; would work but is semantically wrong (corrector is for data normalization, not feature logic). Rejected.

---

## Decision 2: How to identify trial CTAs

**Decision:** Match `<a>` elements whose `data-analytics-id` attribute is `free-trial` or `start-free-trial`.

**Rationale:**

- These are the only two analytics IDs in the MAS constant definitions that represent trial CTAs (`studio/src/constants.js` lines 1–16)
- `data-analytics-id` is set at authoring time via the OST integration and persists in the fragment's `ctas` field HTML
- The attribute is explicitly set on every CTA link; it is not inferred from other attributes
- Using `data-modal="twp"` as an alternative would work for 3-in-1 modal cards, but not all trial CTAs use modals — `data-analytics-id` is universal

**Alternatives considered:**

- **`data-modal="twp"`:** Only covers 3-in-1 modal trial CTAs. Many trial CTAs link directly to a checkout URL without a modal. Rejected as sole identifier.
- **CSS class (`primary-outline`):** Convention only, not enforced. Authors can use any class for any CTA type. Rejected.
- **Combination of `data-analytics-id` + `data-modal`:** More complete but adds complexity. The `data-analytics-id` alone covers all authored trial CTAs per the constants definition. Will revisit if edge cases emerge.

---

## Decision 3: How to filter CTAs in hydrate.js

**Decision:** In `processCTAs()`, use a `.filter()` on the queried `<a>` elements, checking `cta.dataset.analyticsId` against the trial CTA identifiers before passing to `transformLinkToButton()`.

**Rationale:**

- `hydrate.js` runs in the browser with full DOM access — no need for regex on raw HTML strings
- The existing `[...footer.querySelectorAll('a')]` pattern already selects all CTA links; adding a `.filter()` is the minimal, idiomatic extension
- `cta.dataset.analyticsId` is a direct property read — no string parsing required
- The filter runs before `transformLinkToButton()`, so the button element is never created (not just hidden)

**Alternatives considered:**

- **Regex on `fields.ctas` string in hydrate.js:** Would work but is fragile and unnecessary when DOM APIs are available. Rejected.
- **Removing rendered buttons after creation:** Creates and immediately discards DOM nodes. Less efficient and less clear than filtering before creation. Rejected.

---

## Decision 4: Card-level override mechanism

**Decision:** Use the existing `extractValue()` card-level override pattern — if a fragment has a field named `hideTrialCTAs`, that value takes precedence over the surface-level setting.

**Rationale:**

- This is exactly how all existing settings work: `extractValue()` in `settings.js` checks `fragment.fields?.[propertyName]` before applying the setting value (line 87)
- No new code needed for the override mechanism — it is inherited for free by adding `hideTrialCTAs` to `SETTING_NAME_DEFINITIONS`
- Authors can set the field on individual fragments in Studio without any new UI

**How it works:**

- Setting definition: `{ name: 'hideTrialCTAs', valueType: 'boolean' }`
- Since no `propertyName` is specified, `extractValue()` checks `fragment.fields?.hideTrialCTAs`
- If that field exists on the fragment, it overrides the global setting

**Alternatives considered:**

- A separate "exclude list" fragment: Would require a new data structure and lookup. Rejected — the existing per-field override is simpler and already built.

---

## Decision 5: Single-CTA cards — leave to Adobe Target

**Decision:** When `hideTrialCTAs` is true and a card has only a trial CTA (no buy sibling), Phase 1 takes no action on that card. Adobe Target continues to handle single-CTA replacement.

**Rationale:**

- Confirmed via FluffyJaws: Target currently handles single-CTA replacement on a per-surface, per-selector basis
- There is no universal rule for what the replacement should be — it's page/surface specific
- Nick Lam (PM) confirmed this is acceptable: "there's an expectation that there has to be some sort of human judgment happening throughout this process"
- Attempting to auto-generate a buy CTA without knowing the correct offer/URL/analytics attributes would produce incorrect results

**Risk:** A card with only a trial CTA in a targeted geo will show that trial CTA despite the setting. This is a known, accepted gap for Phase 1 — documented in the spec as an edge case and in Future Phases as Phase 2.

---

## Decision 6: Where in `processCTAs()` to apply the filter

**Decision:** Apply the filter as a `.filter()` step on the queried `<a>` elements, before the `.map()` that calls `transformLinkToButton()`.

**Rationale:**

- Colocated with the existing CTA processing logic — no separate helper needed
- The filter runs before button creation, so no button element is ever instantiated for filtered CTAs
- Collections: each card in a collection has its own fragment with resolved settings; `processCTAs()` is called per-card during hydration, so the filter runs automatically per-card

---

## Technical Context Summary

| Area                   | File                                           | Change needed                                                                       |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| Setting definition     | `io/www/src/fragment/transformers/settings.js` | Add `{ name: 'hideTrialCTAs', valueType: 'boolean' }` to `SETTING_NAME_DEFINITIONS` |
| CTA filter logic       | `web-components/src/hydrate.js`                | Add `.filter()` in `processCTAs()` based on `settings.hideTrialCTAs`                |
| UI                     | `studio/src/settings/`                         | No changes — existing Settings UI auto-discovers new setting names                  |
| Constants              | `studio/src/constants.js`                      | No changes — `ANALYTICS_LINK_IDS` already includes `free-trial`, `start-free-trial` |
| Tests (web-components) | `web-components/test/`                         | Unit tests for `processCTAs` with `hideTrialCTAs` setting                           |
| Tests (IO)             | `io/www/test/`                                 | Tests for `hideTrialCTAs` setting resolution only (no strip behavior tests)         |
