# Tasks: Hide Trial CTAs via Settings (MWPW-190803)

**Feature:** Hide Trial CTAs via Settings
**Spec:** specs/MWPW-190803/spec.md
**Plan:** specs/MWPW-190803/plan.md
**Contract:** specs/MWPW-190803/contracts/settings-transformer.md

---

## Summary

| Phase | Story | Tasks | Independent Test |
|-------|-------|-------|-----------------|
| 1 — Setup | — | 1 | IO workspace configured |
| 2 — Foundational | — | 5 | All unit tests pass; settings.js modified |
| 3 — US1 Admin configures | US1 | 3 | Setting creates, dual-CTA card hides trial CTA on stage |
| 4 — US2 End user experience | US2 | 1 | Trial CTA absent from rendered DOM in targeted locale |
| 5 — US3 Card-level override | US3 | 1 | Card with override retains trial CTA |
| 6 — US4 Admin reverts | US4 | 1 | Trial CTAs return after toggle-off |
| 7 — US5 QA validates | US5 | 1 | All T1 locales verified on stage |
| 8 — FR11 Agent validation | US1 | 2 | Agent reports affected locales, card count, edge cases |
| 9 — FR12 Monitor updates | — | 3 | Monitors skip CTA assertion when setting active |
| 10 — Polish | — | 1 | Linter clean, coverage ≥99% |

**Total tasks: 19**
**Parallel opportunities: T005/T006, T008/T009**

---

## Phase 1: Setup

- [ ] T001 Verify personal IO workspace credentials — confirm `.env` and `.aio` are populated in `io/www/` by running `aio app use` from `io/www/`

---

## Phase 2: Foundational — IO Pipeline Change

> Blocks all user stories. Must complete before Phase 3+.
> All changes land in one file: `io/www/src/fragment/transformers/settings.js`

- [x] T002 Add `{ name: 'hideTrialCTAs', valueType: 'boolean' }` to `SETTING_NAME_DEFINITIONS` array in `io/www/src/fragment/transformers/settings.js`
- [x] T003 Add `TRIAL_CTA_PATTERN` constant and `stripTrialCTAs(fragment)` helper before `applySettings` in `io/www/src/fragment/transformers/settings.js` — exact signature and pattern in `specs/MWPW-190803/contracts/settings-transformer.md`
- [x] T004 Add `if (fragment?.settings?.hideTrialCTAs) { stripTrialCTAs(fragment); }` at end of `applySettings()` after the settings loop in `io/www/src/fragment/transformers/settings.js`
- [x] T005 [P] Add 8 `stripTrialCTAs` unit tests to `io/www/test/fragment/settings.test.js` covering: dual-CTA strip, start-free-trial strip, single buy unchanged, single trial → empty string, no CTAs no-op, multiple buys unchanged, mixed buy+two trial types, card-level override=false preserves trial CTA
- [x] T006 [P] Add 4 `applySettings` with `hideTrialCTAs` tests to `io/www/test/fragment/settings.test.js` covering: surface setting true strips CTAs, surface setting false no change, surface true + card override false preserves CTAs, setting not set no change

**Independent test:** `cd io/www && npm test` — all existing and new tests pass, coverage ≥99%

---

## Phase 3: User Story 1 — Admin Configures Buy-Only Mode

> US1 (Scenario 1): Admin opens Studio Settings → creates `hideTrialCTAs: true` → scopes to T1 locales → previews on stage → validates via Agent

- [ ] T007 [US1] Deploy IO changes to personal workspace: `cd io/www && aio app test && aio app deploy -a fragment`
- [ ] T008 [P] [US1] In Studio sandbox Settings, create a `hideTrialCTAs: true` setting entry scoped to `locales: ['en_US']` — confirm entry is visible in Studio Settings list
- [x] T009 [P] [US1] Request IO payload for a dual-CTA card scoped to `en_US` from personal workspace — verify `fields.ctas` contains no `data-analytics-id="free-trial"` or `data-analytics-id="start-free-trial"` links

**Independent test:** IO payload for `en_US` dual-CTA card returns buy CTA only; Studio Settings list shows `hideTrialCTAs` as a creatable setting name

---

## Phase 4: User Story 2 — End User Sees Buy-Only Experience

> US2 (Scenario 2): User in targeted geo loads page; card renders with buy CTA only, no visual gap

- [ ] T010 [US2] Load www.stage.adobe.com page with a dual-CTA Photoshop/CC card in `en_US` locale — visually confirm buy CTA renders, trial CTA is absent, and no empty container or gap is visible in the card layout

**Independent test:** Screenshot shows single-CTA card; DevTools DOM contains no `data-analytics-id="free-trial"` element

---

## Phase 5: User Story 3 — Content Author Exempts a Specific Card

> US3 (Scenario 3): Author sets `hideTrialCTAs: false` on a card fragment field — card retains trial CTA despite global setting

- [ ] T011 [US3] In Studio, set `hideTrialCTAs: false` on a specific card fragment — request IO payload for that card and confirm `fields.ctas` still includes the trial CTA link while adjacent unoverridden cards in the same locale show buy CTA only

**Independent test:** Overridden card IO payload shows both CTAs; non-overridden card in same locale shows buy CTA only

---

## Phase 6: User Story 4 — Admin Reverts Configuration

> US4 (Scenario 4): Admin toggles `hideTrialCTAs` to `false` — trial CTAs return to IO payload

- [ ] T012 [US4] In Studio Settings, toggle `hideTrialCTAs` to `false` (or delete the setting entry) — request IO payload for a previously-affected card and confirm `fields.ctas` now includes the trial CTA link

**Independent test:** Previously-hidden trial CTAs appear in stage IO response after toggle-off

---

## Phase 7: User Story 5 — QA Validates on Stage

> US5 (Scenario 5): QA validates buy-only experience across all targeted T1 locales on stage

- [ ] T013 [US5] QA pass across T1 locales (`en_US`, `en_GB`, `fr_FR`, `de_DE`, `ja_JP`): load www.stage.adobe.com pages for each locale and verify (1) dual-CTA cards show buy CTA only, (2) cards with card-level `hideTrialCTAs: false` show both CTAs, (3) no visual gaps or empty containers appear

**Independent test:** All five locale checks pass; spec success criteria items 1–5 verified

---

## Phase 8: FR11 — MAS Agent Validation Tool

> FR11: MAS Agent reads `hideTrialCTAs` config and reports affected locales, card count, single-trial-only edge cases

- [ ] T014 [US1] Implement `validate_hide_trial_ctas` tool in the MAS MCP server (`io/mcp-server/`) — tool reads current `hideTrialCTAs` setting for a given surface via MAS IO settings endpoint, returns: targeted locales, count of dual-CTA cards affected, list of cards with only a single trial CTA (Phase 1 out-of-scope edge cases)
- [ ] T015 [US1] Register and deploy `validate_hide_trial_ctas` in MAS MCP server — confirm tool is callable as `mcp__mas__validate_hide_trial_ctas` and produces structured output matching FR11 requirements within a single prompt response

**Independent test:** Agent call "validate hideTrialCTAs for adobe.com" returns report with targeted locales, dual-CTA card count, and single-trial-only flag list

---

## Phase 9: FR12 — Monitor Updates

> FR12: CI monitors skip trial CTA assertion when `hideTrialCTAs` is active for the surface/locale under test

- [ ] T016 Identify all CI jobs that assert trial CTA DOM presence — search `.github/workflows/` and any CircleCI config for `data-analytics-id="free-trial"` or CTA presence assertions
- [ ] T017 Update identified GitHub Actions monitor jobs to query MAS IO settings endpoint for target surface/locale before asserting trial CTA presence — skip the trial CTA assertion when `hideTrialCTAs` resolves to `true`
- [ ] T018 Apply same conditional CTA assertion pattern to CircleCI and LANA monitor scripts — verify updated monitors do not fire false-positive failures when `hideTrialCTAs: true` is active on stage

**Independent test:** CI run with `hideTrialCTAs: true` active on stage reports no CTA-absent failures; monitors re-arm automatically after toggle-off

---

## Phase 10: Polish

- [ ] T019 Run full test suite, linter, and coverage check in `io/www/`: `npm run lint && npm test` — zero lint errors on modified files, coverage ≥99%

---

## Dependencies

```
T001
  └── T002 → T003 → T004
                └── T005 [P], T006 [P]
                       └── T007
                             ├── T008 [P], T009 [P]
                             │      ├── T010
                             │      ├── T011
                             │      ├── T012
                             │      └── T013
                             └── (T014 → T015 — independent MCP server project)
T016 → T017 → T018  (independent CI infrastructure — can start after T009)
T019  (final, after T005, T006, T018)
```

## Parallel Opportunities

- **T005 / T006** — unit tests can be written in parallel with T003/T004 (different describe blocks in same file, no merge conflicts)
- **T008 / T009** — Studio setting creation and IO payload verification are independent operations
- **Phase 8 (T014–T015)** — MCP server is a separate codebase; can proceed once T009 confirms the IO change is correct
- **Phase 9 (T016–T018)** — CI monitor updates are independent of agent tool work

---

## MVP Scope

**Phases 1–4** (T001–T010) are the minimum shippable increment: IO pipeline change, unit tests, manual stage validation that the setting works end-to-end for the primary buy-only flow.

Phases 5–7 verify the remaining user scenarios (override, revert, QA pass). Phases 8–9 are secondary deliverables (agent tool + monitor hardening) that can follow in a subsequent PR.
