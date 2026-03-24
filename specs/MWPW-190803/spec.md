# Hide Trial CTAs via Settings

**Ticket:** MWPW-190803
**Status:** Draft
**Stakeholders:** Nick Lam (PM), Nicolas Peltier (Architect), Mariia Lukianets, Tomislav Reil

---

## Clarifications

### Session 2026-03-23

- Q: Is the new `hideTrialCTAs` setting stored as part of the `entries` collection in the settings index? → A: Yes. When created through Studio Settings, it is stored as an AEM content fragment (setting entry) referenced by the settings index's `entries` field — identical to all other settings. The `SETTING_NAME_DEFINITIONS` array in the IO code is only the schema declaration (allowlist + editor type); the live setting data lives in AEM.
- Q: Should trial CTAs be identified via `ot=TRIAL` in the checkout URL rather than `data-analytics-id`? Is Adobe Target involved? → A: No. `ot=TRIAL` is not a universal or reliable identifier — it is absent from business/enterprise trial flows and 3-in-1 modal CTAs, and has been applied to non-trial CTAs by mistake (confirmed via FluffyJaws). Adobe Target is not involved in building this feature; it operates at the DOM level downstream of MAS IO. `data-analytics-id` (`free-trial`, `start-free-trial`) is the canonical semantic identifier for trial CTAs in MAS, designed for this taxonomy and set at authoring time via OST.
- Q: Should "publishing" the setting be part of the user scenarios? → A: No. Publishing is descoped from user scenarios — it will be handled manually after validation. The admin's workflow ends at stage validation. All scenario steps and success criteria reflect the pre-publish validation scope only.
- Q: Should "Agent validation of changes" remain a future phase or move into Phase 1? → A: Move to Phase 1. The agent provides read-only validation of the setting configuration — scoping will be defined in a follow-up clarification.
- Q: FR2 filters `<a>` tags in `fields.ctas` at IO level — will this prevent `sp-button`/`<button>` elements from rendering? → A: Yes, confirmed via code and FluffyJaws. All CTA buttons in standard MAS merch cards are derived exclusively from `<a>` tags in `fields.ctas` during hydration (`processCTAs` in `hydrate.js`). Stripping the `<a>` at IO level means hydration never receives it and never creates the button. Exception: CCD mini/app cards that use host-managed CTAs (not sourced from `fields.ctas`) are unaffected by this filter — documented as an edge case.
- Q: Do existing automated monitors (CircleCI, GitHub Actions, LANA) that check for CTA presence in the DOM need to be updated? → A: Yes. Monitors must query the MAS IO settings endpoint to check whether `hideTrialCTAs` is active for the target surface and locale before asserting CTA presence. If the setting is active, monitors skip the trial CTA assertion. This ensures monitors re-arm automatically when the setting is toggled off, with no manual coordination required.
- Q: What access controls are already implemented in MAS Studio, and is the `hideTrialCTAs` setting already restricted to the right roles? → A: Yes, fully covered by existing implementation. The Studio Settings page is already restricted to Power Users (members of `GRP-ODIN-MAS-POWERUSERS` or `GRP-ODIN-MAS-ADMINS`) via three enforced layers: router redirect, component render guard, and side nav visibility. Since `hideTrialCTAs` is a setting, it inherits all three layers — no new access control code required.

---

## Problem

Quarterly, Adobe's GTM team switches Adobe.com and partner surfaces to a "buy-only" journey for T1 geos. This requires identifying and suppressing all free trial CTAs across the top ~25 pages. Currently, this is done manually by Ted Pierson's team through Adobe Target: engineers write per-selector Target activities for each surface, run them for 1-2 weeks, then revert. The process is manual, slow to activate, hard to preview, and requires Target engineering involvement for every instance.

---

## Proposed Solution

Add a `hideTrialCTAs` boolean setting to the MAS Settings system. When enabled for a surface and locale, the MAS IO pipeline strips trial CTA links from card payloads before they are delivered to the page. No card fragments are modified. No new UI is needed — the existing Studio Settings page already supports creating, scoping, and previewing settings. Once the configuration is validated on stage, publishing to production is handled manually.

The MAS Agent provides read-only validation of the configured state — reporting which cards and locales are affected, and flagging any edge cases — before the admin hands off to the publish step.

---

## Actors

- **Studio Admin / Business Stakeholder** — Configures and validates buy-only mode per surface and geo; hands off to manual publish once satisfied
- **Content Author** — Optionally sets card-level overrides to exempt specific cards from the global setting
- **End User** — Experiences a consistent buy CTA in targeted geos, with no trace of hidden trial CTAs
- **QA Reviewer** — Validates the buy-only experience on stage before sign-off
- **MAS Agent** — Reads and reports the current configuration state; surfaces affected cards and flags edge cases; does not publish

---

## User Scenarios

### Scenario 1 — Admin configures and validates buy-only mode for T1 geos

1. Admin opens Studio → Settings for the target surface (e.g., Adobe.com)
2. Admin creates or toggles the `hideTrialCTAs` setting to `true`
3. Admin scopes the setting to T1 locales (e.g., en_US, en_GB, fr_FR, de_DE, ja_JP)
4. Admin saves — change is visible on www.stage.adobe.com (not yet live)
5. Admin asks the MAS Agent to report affected cards and flag any issues
6. Agent responds with a summary: affected locales, count of dual-CTA cards that will hide trial CTAs, and any single-trial-only cards that fall outside Phase 1 scope
7. Admin previews affected pages on stage to verify cards show buy CTA only
8. Admin signs off and hands configuration to the manual publish step

### Scenario 2 — End user in a targeted geo views a dual-CTA card

1. User in a T1 geo loads an Adobe.com page with a product card
2. Card normally shows two CTAs: "Buy now" and "Free trial"
3. Because `hideTrialCTAs` is active for this locale, the IO pipeline strips the trial CTA from the payload
4. Card renders with only the "Buy now" CTA — no empty gap, no hidden element

### Scenario 3 — Content Author exempts a specific card

1. Author identifies a card that should retain its trial CTA despite the global setting
2. Author opens the card in Studio and sets the card-level `hideTrialCTAs` field to `false`
3. This card-level override takes precedence over the surface-level setting
4. The card continues to show both CTAs regardless of global mode

### Scenario 4 — Admin reverts configuration to normal state

1. New quarter begins; buy-only campaign window ends
2. Admin opens Studio → Settings and toggles `hideTrialCTAs` to `false`
3. Admin saves — the configuration change is staged and visible on stage
4. Admin validates that trial CTAs reappear on stage, then hands off to manual publish

### Scenario 5 — QA validates on stage

1. Admin saves `hideTrialCTAs: true` setting (not yet published)
2. QA Reviewer loads www.stage.adobe.com pages for all targeted locales
3. Reviewer confirms dual-CTA cards show buy CTA only and no visual gaps
4. Reviewer confirms excluded cards (card-level override) show both CTAs
5. QA sign-off is complete — ready for manual publish

---

## Functional Requirements

**FR1.** The system must support a new setting named `hideTrialCTAs` of type boolean.

**FR2.** When `hideTrialCTAs` resolves to `true` for a card, the IO pipeline must remove all trial CTA `<a>` links from that card's `fields.ctas` payload before delivery. Stripping the `<a>` at IO level is sufficient to prevent the corresponding `sp-button`/`checkout-button` from rendering, because all CTA buttons in standard MAS merch cards are derived exclusively from `<a>` tags in `fields.ctas` during hydration. CCD surfaces that render host-managed CTAs independently of `fields.ctas` are out of scope for Phase 1.

**FR3.** Trial CTAs are identified by their `data-analytics-id` attribute matching either `free-trial` or `start-free-trial`. This attribute is the canonical semantic identifier for trial CTAs in MAS — set at authoring time via OST and consistent across all CTA types including 3-in-1 modals, direct checkout links, and business trial flows. The `ot=TRIAL` URL parameter is explicitly not used as the identifier, as it is absent from some trial flows and has been incorrectly applied to non-trial CTAs.

**FR4.** The setting must be scopeable per surface, locale, geo, and card variant using the existing settings scoping system (locale targeting, tag matching, template filtering).

**FR5.** Individual card fragments must be able to override the surface-level setting by having a corresponding `hideTrialCTAs` field on the fragment — fragment-level value takes precedence.

**FR6.** When a trial CTA is removed from a dual-CTA card, the remaining buy CTA must be the only CTA delivered — no empty container, no placeholder.

**FR7.** When `hideTrialCTAs` is `false` or unset, card behavior must be identical to the current state — no change to CTA delivery.

**FR8.** The setting must be manageable through the existing Studio Settings UI without any new interface components.

**FR9.** Setting changes must be previewable on www.stage.adobe.com before go-live.

**FR10.** Activating the setting must not require any modifications to card fragments.

**FR11.** The MAS Agent must be able to read the current `hideTrialCTAs` configuration and report: which locales are targeted, how many dual-CTA cards will be affected, and which cards (if any) have only a single trial CTA and fall outside Phase 1 scope.

**FR12.** Automated monitors (CircleCI, GitHub Actions, LANA) that check for CTA presence in the DOM must be updated to query the MAS IO settings endpoint before asserting trial CTA presence. If `hideTrialCTAs` resolves to `true` for the monitored surface and locale, the monitor must skip the trial CTA assertion. Monitors re-arm automatically when the setting is toggled off — no manual intervention required.

---

## Integration Dependencies

The following external systems must be updated before this feature can safely go live:

- **CircleCI monitors:** Any CI jobs that assert expected CTA elements are present in the DOM must be updated to conditionally skip or adjust CTA presence checks when `hideTrialCTAs` is active for the target surface and locale.
- **GitHub Actions monitors:** Same requirement — DOM CTA checks must not fire as failures when suppression is intentionally enabled.
- **LANA (likely):** Real-user monitoring or synthetic monitoring scripts that track CTA visibility or click events should be verified and updated to avoid false alerts during active suppression windows.

Monitors query the MAS IO settings endpoint for the target surface and locale before each CTA assertion. If `hideTrialCTAs` is active, the trial CTA check is skipped. Monitors re-arm automatically when the setting is toggled off — no manual coordination required per campaign.

---

## Edge Cases

- **Card with only a trial CTA (no buy sibling):** This card is out of scope for Phase 1. Single-CTA replacement remains with Adobe Target. FR6 does not apply — if a card has only a trial CTA and `hideTrialCTAs` is true, behavior is to be defined in Phase 2. The agent flags these cards in its validation report (FR11).
- **Trial-focused pages (e.g., `/free-trial`):** Excluded from the setting by scoping the setting to specific locales/tags that do not include those pages, or by using card-level overrides. No automatic page exclusion engine in Phase 1.
- **Card with card-level override set to `false`:** The card retains both CTAs regardless of the surface-level setting.
- **Concurrent authoring:** Because card fragments are not modified, ongoing GWP authoring activity is unaffected. The setting operates independently.
- **Collections:** The setting resolves per-fragment within a collection, consistent with how other settings propagate to collection items.
- **CCD host-managed CTAs:** Some CCD surfaces (e.g., mini/app cards) render their own Try/Buy buttons independently of `fields.ctas`. Stripping `<a>` tags from the MAS IO payload does not suppress these host-managed buttons. CCD surfaces with host-managed CTAs are out of scope for Phase 1.

---

## Success Criteria

1. On www.stage.adobe.com, all dual-CTA cards in targeted locales show only the buy CTA when `hideTrialCTAs` is saved as `true` — verified before any publish action.
2. Trial CTAs are absent from the IO payload for affected cards — no trial CTA HTML reaches the browser on stage.
3. Cards with a card-level `hideTrialCTAs: false` override continue to show both CTAs in all geos on stage.
4. A Studio Admin can configure buy-only mode for all T1 locales and complete stage validation in under 5 minutes.
5. A configuration change (toggle on or off) is immediately visible on stage after saving — no delay for the preview step.
6. The MAS Agent produces a validation report covering affected locales, card count, and edge-case flags within a single prompt response.
7. No card fragment content is modified during configuration or revert.
8. All existing cards not in targeted geos are unaffected — no change in behavior on stage or production.

---

## Assumptions

- Only dual-CTA cards (cards with both a buy and a trial CTA) are in scope for Phase 1.
- Single-CTA cards with only a trial CTA continue to be handled by Adobe Target for now.
- Trial-focused pages are excluded from the setting by careful locale/tag scoping — no automated exclusion engine is needed for Phase 1.
- The existing Studio Settings UI is sufficient for Admin use — no new dashboard or admin panel is required.
- Geo targeting is achieved through locale-level scoping (e.g., targeting `en_US`, `en_GB`, `fr_FR` covers T1 markets).
- The IO pipeline is the correct layer for CTA filtering — settings are resolved there before hydration, ensuring trial CTAs never reach the browser DOM.
- Publishing the setting to production is a manual step outside the feature scope, performed after QA sign-off.
- Access to the `hideTrialCTAs` setting is restricted by the existing Studio power user access control (`GRP-ODIN-MAS-POWERUSERS`, `GRP-ODIN-MAS-ADMINS`) — no new authorization code is required.

---

## Non-Goals (Phase 1)

- Publishing the setting via Studio UI — this is a manual step handled after validation
- Replacing single trial CTAs with a buy or "Learn More" CTA
- Bidirectional toggle (trial-only mode)
- Automatic page exclusion engine based on URL patterns or CTA composition scanning
- A dedicated Admin dashboard for global mode management
- Agent-based conversational interface for configuring the setting (agent is read-only in Phase 1)
- Bulk scheduled publish
- Analytics instrumentation for swap events

---

## Future Phases

**Phase 2 — Single-CTA replacement**
When a card has only a trial CTA and `hideTrialCTAs` is active, replace it with a configurable fallback CTA (e.g., "Learn More" link to plans page). Destination URL must be configurable per surface or card.

**Phase 3 — Page exclusion engine**
Automatic detection of trial-focused pages (via URL pattern matching) and a manual exclusion list managed in Studio. Prevents the setting from affecting trial-only landing pages without requiring manual scoping.

**Phase 4 — Bidirectional toggle**
Support "trial-only mode" symmetrically: hide buy CTAs and promote trial CTAs. Enables the reverse of buy-only campaigns.

**Phase 5 — Agent-based authoring interface**
Conversational interface in Studio where a PM or admin can instruct the system to configure buy-only/trial-only mode for specific tiers and geos. Agent drafts configuration changes for human review before any publish action.

**Phase 6 — Proactive agent alerting**
Agent monitors continuously and proactively surfaces issues in-chat: new fragments published in a locale where `hideTrialCTAs` is active but the fragment has an unhandled single trial CTA; high-traffic pages not yet previewed before go-live.

**Phase 7 — Bulk scheduled publish**
Schedule setting publication and revert for specific dates/times, enabling GTM teams to pre-configure buy-only campaigns to go live automatically at campaign start and revert at campaign end.
