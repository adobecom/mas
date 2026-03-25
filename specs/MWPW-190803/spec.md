# Hide Trial CTAs via Settings

**Ticket:** MWPW-190803
**Status:** Draft
**Stakeholders:** Nick Lam (PM), Nicolas Peltier (Architect), Mariia Lukianets, Tomislav Reil

---

## Problem

Quarterly, Adobe's GTM team switches Adobe.com and partner surfaces to a "buy-only" journey for T1 geos. This requires identifying and suppressing all free trial CTAs across the top ~25 pages. Currently, this is done manually by Ted Pierson's team through Adobe Target: engineers write per-selector Target activities for each surface, run them for 1-2 weeks, then revert. The process is manual, slow to activate, hard to preview, and requires Target engineering involvement for every instance.

---

## Proposed Solution

Add a `hideTrialCTAs` boolean setting to the MAS Settings system. When enabled for a surface and locale, the MAS IO pipeline resolves the setting and includes it in the fragment payload's `settings` object. The web-components layer (`hydrate.js`) reads this setting during card hydration and filters out trial CTA links before rendering. No card fragments are modified. No new UI is needed — the existing Studio Settings page already supports creating, scoping, and previewing settings. Once the configuration is validated on stage, publishing to production is handled manually.

The MAS Agent provides read-only validation of the configured state — reporting which cards and locales are affected, and flagging any edge cases — before the admin hands off to the publish step.

---

## Actors

- **Studio Admin / Business Stakeholder** — Configures and validates buy-only mode per surface and geo
- **Content Author** — Optionally sets card-level overrides to exempt specific cards
- **End User** — Experiences a consistent buy CTA in targeted geos
- **QA Reviewer** — Validates the buy-only experience on stage before sign-off
- **MAS Agent** — Reports current configuration state; flags edge cases; does not publish

---

## User Scenarios

### Scenario 1 — Admin configures and validates buy-only mode for T1 geos

1. Admin opens Studio → Settings for the target surface (e.g., Adobe.com)
2. Admin creates or toggles the `hideTrialCTAs` setting to `true`
3. Admin scopes the setting to T1 locales (e.g., en_US, en_GB, fr_FR, de_DE, ja_JP)
4. Admin saves — change is visible on www.stage.adobe.com (not yet live)
5. Admin asks the MAS Agent to report affected cards and flag any issues
6. Agent responds with a summary: affected locales, count of dual-CTA cards, and any single-trial-only cards outside Phase 1 scope
7. Admin previews affected pages on stage to verify cards show buy CTA only
8. Admin signs off and hands configuration to the manual publish step

### Scenario 2 — End user in a targeted geo views a dual-CTA card

1. User in a T1 geo loads an Adobe.com page with a product card
2. Card normally shows two CTAs: "Buy now" and "Free trial"
3. Because `hideTrialCTAs` is active for this locale, `hydrate.js` filters the trial CTA during card rendering
4. Card renders with only the "Buy now" CTA — no empty gap, no hidden element

### Scenario 3 — Content Author exempts a specific card

1. Author identifies a card that should retain its trial CTA despite the global setting
2. Author opens the card in Studio and sets the card-level `hideTrialCTAs` field to `false`
3. This card-level override takes precedence — the card continues to show both CTAs

### Scenario 4 — Admin reverts configuration to normal state

1. Buy-only campaign window ends
2. Admin opens Studio → Settings and toggles `hideTrialCTAs` to `false`
3. Admin validates that trial CTAs reappear on stage, then hands off to manual publish

### Scenario 5 — QA validates on stage

1. QA Reviewer loads www.stage.adobe.com pages for all targeted locales
2. Reviewer confirms dual-CTA cards show buy CTA only and no visual gaps
3. Reviewer confirms excluded cards (card-level override) show both CTAs
4. QA sign-off is complete — ready for manual publish

---

## Functional Requirements

**FR1.** The system must support a new setting named `hideTrialCTAs` of type boolean.

**FR2.** When `hideTrialCTAs` resolves to `true` for a card, `hydrate.js` must filter out trial CTA `<a>` links during card hydration before the corresponding button elements are created. CCD surfaces that render host-managed CTAs independently of `fields.ctas` are out of scope for Phase 1.

**FR3.** Trial CTAs are identified by `data-analytics-id` matching `free-trial` or `start-free-trial`.

**FR4.** The setting must be scopeable per surface, locale, geo, and card variant using the existing settings scoping system.

**FR5.** Individual card fragments must be able to override the surface-level setting via a `hideTrialCTAs` field on the fragment — fragment-level value takes precedence.

**FR6.** When a trial CTA is removed from a dual-CTA card, the remaining buy CTA must be the only CTA delivered — no empty container, no placeholder.

**FR7.** When `hideTrialCTAs` is `false` or unset, card behavior must be identical to the current state.

**FR8.** The setting must be manageable through the existing Studio Settings UI without any new interface components.

**FR9.** Setting changes must be previewable on www.stage.adobe.com before go-live.

**FR10.** Activating the setting must not require any modifications to card fragments.

**FR11.** The MAS Agent must be able to report: which locales are targeted, how many dual-CTA cards are affected, and which cards have only a single trial CTA (outside Phase 1 scope).

**FR12.** Automated monitors that check for CTA presence in the DOM must skip the trial CTA assertion when `hideTrialCTAs` resolves to `true` for the monitored surface and locale.

---

## Edge Cases

- **Card with only a trial CTA (no buy sibling):** Out of scope for Phase 1. Single-CTA replacement remains with Adobe Target. The agent flags these cards in its validation report (FR11).
- **Trial-focused pages (e.g., `/free-trial`):** Excluded via locale/tag scoping — no automatic page exclusion in Phase 1.
- **Card with card-level override set to `false`:** The card retains both CTAs regardless of the surface-level setting.
- **Concurrent authoring:** Card fragments are not modified — ongoing authoring is unaffected.
- **Collections:** The setting resolves per-fragment within a collection.
- **CCD host-managed CTAs:** Some CCD surfaces render their own Try/Buy buttons independently of `fields.ctas` — out of scope for Phase 1.
- **CI monitors (CircleCI, GitHub Actions, LANA):** Must be updated to skip trial CTA assertions when `hideTrialCTAs` is active (see FR12).

---

## Success Criteria

1. All dual-CTA cards in targeted locales show only the buy CTA when `hideTrialCTAs` is `true` — verified on stage before any publish action.
2. Cards with a card-level `hideTrialCTAs: false` override continue to show both CTAs.
3. A Studio Admin can configure buy-only mode for all T1 locales and complete stage validation in under 5 minutes.
4. A configuration change is immediately visible on stage after saving.
5. The MAS Agent produces a validation report covering affected locales, card count, and edge-case flags.
6. No card fragment content is modified during configuration or revert.
7. All cards not in targeted geos are unaffected.

---

## Non-Goals (Phase 1)

- Publishing the setting via Studio UI — manual step handled after validation
- Replacing single trial CTAs with a buy or "Learn More" CTA
- Bidirectional toggle (trial-only mode)
- Automatic page exclusion engine
- A dedicated Admin dashboard
- Agent-based conversational configuration (agent is read-only in Phase 1)
- Bulk scheduled publish

---

## Future Phases

- **Phase 2** — Single-CTA replacement with a configurable fallback CTA
- **Phase 3** — Automatic page exclusion engine via URL pattern matching
- **Phase 4** — Bidirectional toggle (trial-only mode)
- **Phase 5** — Agent-based authoring interface for conversational configuration
- **Phase 6** — Proactive agent alerting for unhandled single-CTA fragments
- **Phase 7** — Bulk scheduled publish and revert
