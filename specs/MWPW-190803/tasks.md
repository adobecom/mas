# Tasks: Hide Trial CTAs via Settings (MWPW-190803)

**Spec:** specs/MWPW-190803/spec.md | **Plan:** specs/MWPW-190803/plan.md

---

## Phase 1: IO Pipeline

- [x] T001 Add `{ name: 'hideTrialCTAs', valueType: 'boolean' }` to `SETTING_NAME_DEFINITIONS` — `io/www/src/fragment/transformers/settings.js`

---

## Phase 2: web-components

- [x] T002 Modify `processCTAs()` to accept `settings` parameter; add `.filter()` that skips `<a>` elements with `data-analytics-id="free-trial"` or `"start-free-trial"` when `settings.hideTrialCTAs` is true — `web-components/src/hydrate.js`
- [x] T003 Update `processCTAs()` call site to pass `settings` — `web-components/src/hydrate.js`
- [x] T004 Add 3 unit tests for `processCTAs` with `hideTrialCTAs` enabled/disabled — `web-components/test/hydrate.test.js`
- [x] T005 Run `npm run build` in `web-components/` — verify 1187 tests pass

---

## Phase 3: NALA Tests

- [x] T006 Add NALA page object, spec, and test for `hideTrialCTAs` — `nala/studio/settings/`
    - `@MAS-Settings-hideTrialCTAs-enabled` — card `9202ca7f`, verify trial CTA absent, buy CTA present
    - `@MAS-Settings-hideTrialCTAs-enabled-promo` — card `0c7d3b94`, verify trial CTA absent
    - `@MAS-Settings-hideTrialCTAs-disabled` — route intercept sets `settings.hideTrialCTAs=false`, verify trial CTA present

---

## Phase 4: Stage Validation

- [ ] T007 Deploy IO change to personal workspace and validate end-to-end on stage: create `hideTrialCTAs: true` setting in Studio sandbox scoped to `en_US`, verify dual-CTA card shows buy CTA only

---

## Future / Out of Scope for Phase 1

- **Agent validation tool (FR11):** Implement `validate_hide_trial_ctas` tool in MAS MCP server — reads current config and reports targeted locales, affected card count, and single-trial-only edge cases
- **Monitor updates (FR12):** Update CircleCI, GitHub Actions, and LANA monitors to skip trial CTA assertions when `hideTrialCTAs` is active for the monitored surface/locale
- **QA pass across all T1 locales:** Full validation across en_US, en_GB, fr_FR, de_DE, ja_JP on www.stage.adobe.com
