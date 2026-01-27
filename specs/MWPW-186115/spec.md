# Due Diligence: Regional Customizations in M@S Loc MVP

**Feature Branch**: `MWPW-186115`
**Created**: 2026-01-20
**Status**: Draft (Research Complete - Scope Clarified)
**Jira**: [MWPW-186115](https://jira.corp.adobe.com/browse/MWPW-186115)
**Type**: Due Diligence / Research Ticket

---

## Scope Clarification

**This ticket is about Personalization Variations**, not the inheritance-based regional variation system.

| Term | Meaning | This Ticket? |
|------|---------|--------------|
| Regional Variations (inheritance) | fr_FR → fr_CH, inherits fields | ❌ Different feature |
| **Regional Customizations** (this ticket) | Intro pricing geo targeting | ✅ This ticket |
| **Personalization Variations** | The feature that covers this | ✅ This ticket |

---

## Summary

This due diligence ticket investigates how to handle regional customizations (specifically Intro Pricing) in M@S Studio. The key finding is that this use case requires **Personalization Variations** - a new feature where promo cards target specific geo lists and replace the default translated cards.

---

## Use Cases Addressed

### Use Case 1: EN Card → Multiple Geos with Overrides

**Scenario**: EN normal card rolled out to multiple geos, certain items overridden (badge, copy)

| Assessment | Notes |
|------------|-------|
| **Current Support** | ✅ FULL |
| **Workflow** | EN → Odin translation → Regional variations in M@S Studio |
| **Gap** | None |

---

### Use Case 2: Card Exists ONLY in French

**Scenario**: Card starts from EN but only French version exists/is published

| Assessment | Notes |
|------------|-------|
| **Current Support** | ⚠️ PARTIAL |
| **Recommendation** | Keep EN as source, publish only FR |
| **Gap** | None with recommended approach |

**Rationale**: Creating EN source and only publishing FR is the simplest approach. EN can remain as "internal only" or unpublished. No architecture changes needed.

---

### Use Case 3: French Card → Swiss French Modification

**Scenario**: Card exists in French, need Swiss French (fr_CH) with modified copy

| Assessment | Notes |
|------------|-------|
| **Current Support** | ✅ FULL |
| **Workflow** | fr_FR exists → Create fr_CH variation → Override specific fields |
| **Gap** | None |

---

## Scale Challenge: Regional Customizations

### Problem

When multiple regional variations share the same customization (e.g., `fr_BE` and `fr_LU` both have "no intro pricing"), there's no efficient way to:
1. Bulk update the shared override
2. Express the business relationship ("BENELUX locales share this rule")
3. Keep variations in sync when the rule changes

### Real-World Examples

| Language | Customization Pattern |
|----------|----------------------|
| **French** | FR has intro pricing; BE/LU don't; CH has intro pricing |
| **German** | DE has intro pricing + VAT copy; LU no intro pricing; CH has intro + VAT |
| **Portuguese** | BR has intro pricing + bold savings; PT has intro pricing only |

---

## Recommended Solution (Final - Post Code Exploration)

### Key Discovery: Locale Sync API NOT Viable for MVP

Code exploration revealed critical blockers for the Locale Sync API approach:

| Blocker | Impact |
|---------|--------|
| `localeSync` is internal Odin operation | Cannot call from M@S Studio browser |
| No translatable field metadata in CF model | Field-level sync won't work |
| Browser cannot call AEM bin endpoints | CORS + authentication barriers |
| Variations created as empty shells | No automatic field copying |

### Phase 1: Bulk Field Editing (Recommended for MVP)

**Description**: Add bulk operations to update the same field across multiple regional variations

**UI Concept**:
```
┌─────────────────────────────────────────┐
│  Regional Variations for "All Apps"     │
├─────────────────────────────────────────┤
│ ☑ fr_BE - French (Belgium)    Override  │
│ ☑ fr_LU - French (Luxembourg) Override  │
│ ☐ fr_CH - French (Switzerland) Inherit  │
├─────────────────────────────────────────┤
│ [Bulk Actions ▼]                        │
│   • Update Field...                     │
│   • Reset to Parent                     │
│   • Publish Selected                    │
└─────────────────────────────────────────┘
```

**Why This Approach**:
- **No external dependencies**: Uses existing AEM Fragment API
- **Extends proven patterns**: Similar to `bulkPublishFragments` in `mas-repository.js`
- **Immediate implementation**: 2-3 days of development
- **Works with existing variations**: Handles already-created variations
- **No CF model changes required**: Works with current architecture

**Implementation Entry Points**:
- `mas-repository.js` - Add `bulkUpdateField()` and `bulkResetToParent()` methods
- `mas-variation-dialog.js` or new component - Add multi-select UI

### Phase 2: Locale Groups (Enhancement)

**Description**: Pre-defined locale groups for faster selection

**Groups to configure** (in `locales.js`):
- BENELUX: `fr_BE`, `nl_BE`, `de_LU`, `fr_LU`, `nl_LU`
- DACH: `de_DE`, `de_AT`, `de_CH`
- Nordics: `sv_SE`, `da_DK`, `nb_NO`, `fi_FI`

### Phase 3: Locale Sync Integration (Future - Requires Collaboration)

**Prerequisites** (not in M@S control):
- Odin team exposes `localeSync` as callable API
- CF model updated with translatable field metadata
- I/O Runtime wrapper created for browser access

**Recommendation**: Open discussion with Odin team for future roadmap

---

## Odin Loc 2.0 Integration (Official Documentation)

### Overview

Loc 2.0 replaces the old localization script (aem-i18n) with author-controlled localization. Key improvements:
- Authors control when and which locales to translate
- Reduced unnecessary AEM processing
- Choice between human and machine translation

### UI Entry Points

The **Localization dropdown** appears in:
- Admin View (header menu)
- Editor View (action bar)

**Visibility**: Only when CF is in **English locale folder** AND tenant is enabled for Loc 2.0.

### Two Actions

| Action | Purpose |
|--------|---------|
| **Send to localization** | Sends CFs to GLaaS (human or machine translation) |
| **Sync** | Synchronizes non-translatable fields from EN to target locales |

### Send to Localization Flow

1. Select CF(s) in English locale
2. Choose translation method: **Human** (2-3 days) or **Machine** (fast)
3. Select target locales from configured project locales
4. Handle nested CFs (include or exclude)
5. CFs uploaded to GLaaS, tasks created per CF/locale
6. **Sync runs automatically in background**

### Sync Behavior

**Case 1: CF Does NOT Exist in Target Locale**
- Creates **MSM Live Copy** from English content
- **Translatable fields**: unlocked (ready for GLaaS)
- **Non-translatable fields**: locked (auto-sync from EN)
- Folder hierarchy and assets replicated

**Case 2: CF Already Exists**
- **Non-translatable fields**: synchronized with EN
- **Translatable fields**: unchanged (preserved)

### Critical Gap for Regional Variations

| Aspect | Loc 2.0 Design | Regional Need |
|--------|----------------|---------------|
| Source | Always English | fr_FR → fr_CH |
| UI visibility | EN folder CFs only | Locale → locale |
| Variations | MSM Live Copies | Empty shells in M@S |

**Conclusion**: Loc 2.0 Sync is **EN → locale only**. Cannot use for regional variations (fr_FR → fr_CH) because the UI only appears for English folder CFs.

---

## Acceptance Criteria Evaluation

| AC | Status | Notes |
|----|--------|-------|
| **AC1**: Find sustainable solution for regional variations | ✅ Complete | Recommend Bulk Field Editing for MVP |
| **AC2**: Investigate Odin loc 2.0 interaction | ✅ Complete | Locale Sync API NOT viable (internal Odin operation) |
| **AC3**: Recommend solution for authors | ✅ Complete | Phased approach with Bulk Editing as primary |

---

## Alternatives Considered

| Approach | Effort | Decision | Rationale |
|----------|--------|----------|-----------|
| **Bulk Field Editing** | Low | **Recommended (MVP)** | No dependencies, extends existing patterns |
| Locale Groups | Low | Phase 2 | Good for preset selections |
| Locale Sync API | High | Phase 3 (future) | Blocked: internal Odin operation, CF model changes needed |
| Inheritance Chains | Medium-High | Rejected | Current system prevents variation-from-variation |
| Variation Templates | High | Rejected | Over-engineered for current needs |
| Feature Flags | Low-Medium | Rejected | Doesn't solve bulk update problem |

---

## Open Questions (Resolved via Code Exploration)

### Answered

| Question | Answer |
|----------|--------|
| Can `localeSync` be called from browser? | **NO** - internal Odin operation only |
| What fields are translatable? | **No classification exists** - entire fragments are units |
| How are variations created? | **Empty shells** - no automatic field copying |
| Can we use Locale Sync for MVP? | **NO** - multiple blockers identified |

### Still Open

1. **Bulk Update Preview**: Should authors see a "preview" of changes before applying?
2. **Conflict Handling**: When bulk updating a field already overridden, skip or overwrite?
3. **Locale Groups**: Which groups to pre-configure (BENELUX, DACH, Nordics)?
4. **Translation Source**: Do regional customizations need an English source, or do authors write directly in the target language?

---

## Management Challenge: Geo Set Customizations

### The Core Question

> "If one set of geos has a certain copy customization - how do we scalably manage this and translate?"

### Scale Example

- **fr_BE** and **lu_fr** both need "no intro pricing"
- 2 locales × 10 cards = 20 variations to manage
- If customization changes → 20 manual updates today

### Management Options (Proposals)

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **1. Locale Groups + Per-Fragment Bulk** | Define groups (BENELUX), quick-select in variation panel | Simple, extends existing UI | Still per-fragment |
| **2. Cross-Fragment Dashboard** | Surface-level view of ALL variations, filter & bulk update | Single operation for geo set | New UI surface needed |
| **3. Variation Rules/Templates** | Named rules with overrides, assign to variations | Single source of truth | New data model, higher complexity |

### Translation of Regional Copy

| Customization Type | Translation Need | Support |
|-------------------|------------------|---------|
| Remove field (clear badge) | None | ✅ Works |
| Same value as another locale | Copy, no translation | ✅ Works |
| Different copy in same language | Author writes directly | ✅ Works |
| Different copy needs translation | EN source needed | ❌ Gap |

**Open Question**: Do regional customizations need an English source for translation, or do authors write directly in the target language?

---

## Files Relevant for Implementation

| Purpose | File |
|---------|------|
| Bulk Publish Pattern (extend this) | `studio/src/mas-repository.js:1013-1062` |
| Variation Dialog | `studio/src/mas-variation-dialog.js` |
| Variation Creation Logic | `studio/src/mas-repository.js:1179-1335` |
| Field Inheritance Logic | `studio/src/aem/fragment.js:136-194` |
| Locale Registry | `studio/src/locales.js` |
| Selection Panel | `studio/src/mas-selection-panel.js` |

---

## Research Artifacts

- **Full Research Document**: `specs/MWPW-186115/research.md`
- **Loc v2 API Documentation**: Confluence page (Content Fragment Loc v2 API)
- **Approach Comparison**: See research.md "Approach Analysis" section (6 approaches)
- **Code Exploration Findings**: See research.md "Code Exploration Findings" section

---

## Recommendation Summary

For the **Loc MVP**, implement **Bulk Field Editing** (Phase 1):

| Benefit | Description |
|---------|-------------|
| **No Dependencies** | Uses existing AEM Fragment API, no Odin team coordination |
| **Proven Pattern** | Extends `bulkPublishFragments` architecture |
| **Fast Implementation** | 2-3 days development effort |
| **Works Now** | Handles existing variations without migration |

**Implementation Entry Points**:
1. `mas-repository.js` - Add `bulkUpdateField()` method
2. `mas-variation-dialog.js` or new component - Add multi-select UI
3. `locales.js` - Add locale group definitions (Phase 2)

**Future Consideration**: Open discussion with Odin team about exposing `localeSync` API for long-term automatic sync capability.
