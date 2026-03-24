# Research: Hide Trial CTAs via Settings (MWPW-190803)

## Decision 1: Implementation layer — where to filter trial CTAs

**Decision:** Strip trial CTAs in the MAS IO pipeline, inside the `settings` transformer, after settings are resolved for a fragment.

**Rationale:**
- The `settings` transformer already runs per-fragment during pipeline execution (`io/www/src/fragment/transformers/settings.js`)
- Settings are resolved before hydration — CTAs never reach the browser DOM, which is the correct outcome
- The `fields.ctas` HTML string is accessible in the transformer at the point settings are applied
- Filtering at IO level means no change to web-components, no hydration logic, no client-side conditionals
- Consistent with how other settings side-effects work (e.g., `secureLabel` uses settings to control what gets delivered)

**Alternatives considered:**
- **hydrate.js (web-components layer):** Would still deliver trial CTAs in the IO payload; filtering at the client is fragile and could be bypassed. Rejected.
- **Separate transformer step:** Possible but unnecessary — the settings transformer already has access to both `fragment.settings` and `fragment.fields`. Adding the strip logic inside `applySettings()` keeps it co-located with the setting that drives it.
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

## Decision 3: String manipulation strategy for stripping CTAs in Node.js IO pipeline

**Decision:** Use regex to remove trial `<a>` elements from the `fields.ctas` HTML string.

**Rationale:**
- The IO pipeline runs in Node.js (Adobe I/O Runtime); no DOM APIs are available
- The `fields.ctas` value is a well-formed HTML string with one or more `<a>` tags — no deeply nested structure
- A targeted regex matching `<a ... data-analytics-id="free-trial|start-free-trial" ...>...</a>` is safe for this constrained input
- The regex uses the dotall (`s`) flag to handle multi-line `<a>` content, supported in Node.js 10+

**Pattern:**
```
/<a\b[^>]*\bdata-analytics-id="(?:free-trial|start-free-trial)"[^>]*>.*?<\/a>/gis
```

**Alternatives considered:**
- **Parse5 / JSDOM:** Full HTML parsing would be more robust but adds a dependency and significant overhead for a simple attribute-based filter on a short string. Rejected for Phase 1.
- **Cheerio:** Same concern — dependency overhead not justified for this use case. Revisit if the pattern needs to handle nested HTML inside CTAs.

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

## Decision 6: Where in `applySettings()` to place the strip logic

**Decision:** Call `stripTrialCTAs(fragment)` at the end of `applySettings()`, after the settings loop, conditional on `fragment.settings.hideTrialCTAs === true`.

**Rationale:**
- `applySettings()` already has access to both `fragment.settings` and `fragment.fields`
- Placing the call at the end of `applySettings()` ensures the setting is fully resolved before it drives the CTA filtering
- Keeping the strip logic as a named helper function (`stripTrialCTAs`) follows MAS coding convention (named functions > inline logic)
- Collections: `applyCollectionSettings()` calls `applySettings()` per-child fragment, so the strip logic runs automatically for all items in a collection

---

## Technical Context Summary

| Area | File | Change needed |
|------|------|---------------|
| Setting definition | `io/www/src/fragment/transformers/settings.js` | Add `{ name: 'hideTrialCTAs', valueType: 'boolean' }` to `SETTING_NAME_DEFINITIONS` |
| Strip logic | `io/www/src/fragment/transformers/settings.js` | Add `stripTrialCTAs(fragment)` helper + call in `applySettings()` |
| UI | `studio/src/settings/` | No changes — existing Settings UI auto-discovers new setting names |
| Web components | `web-components/src/hydrate.js` | No changes |
| Constants | `studio/src/constants.js` | No changes — `ANALYTICS_LINK_IDS` already includes `free-trial`, `start-free-trial` |
| Tests | `io/www/test/` | New unit tests for `stripTrialCTAs` helper |
