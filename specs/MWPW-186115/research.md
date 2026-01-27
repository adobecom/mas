# Research: Regional Customizations in M@S Loc MVP

**Feature**: MWPW-186115
**Date**: 2026-01-20
**Type**: Due Diligence / Research

---

## Executive Summary

This document investigates how to sustainably manage regional variations in M@S Studio for the localization MVP. The key challenge is scalable management of regional customizations (e.g., intro pricing differences between fr_FR, fr_CH, fr_BE) while integrating with the Odin loc 2.0 workflow.

---

## Current Architecture Analysis

### Variation System Overview

| Component | Current State | Location |
|-----------|--------------|----------|
| Variation Detection | Via `default-locale-id` from API or path-based fallback | `editor-context-store.js` |
| Field Inheritance | 3 states: `inherited`, `same-as-parent`, `overridden` | `fragment.js:136-194` |
| Variation Creation | One variation per locale per fragment | `mas-variation-dialog.js` |
| Odin Integration | `sendToLocalisationAsync` endpoint for batch translation | `io/studio/src/translation/project-start.js` |

### Inheritance Architecture

```
en_US (source)
  ↓ translation (Odin)
fr_FR (default French) ←─────────────────┐
  ↓ variation (M@S Studio)               │ inherits
fr_CH, fr_BE, fr_LU (regional variations)┘
```

### Field State Detection (`fragment.js`)

```javascript
getFieldState(fieldName, parentFragment, isVariation) {
    // Returns: 'inherited' | 'same-as-parent' | 'overridden' | 'no-parent'
}
```

- **inherited**: Variation field is empty, uses parent value
- **same-as-parent**: Variation has explicit value matching parent
- **overridden**: Variation has different value than parent

---

## Use Cases Analysis

### Use Case 1: EN Card → Multiple Geos with Overrides

**Scenario**: EN normal card rolled out to multiple geos with certain items overridden (badge, copy)

**Current Support**: ✅ FULL

**Workflow**:
1. Author creates card in en_US
2. Sends to translation via Translation Project
3. Odin creates localized versions (fr_FR, de_DE, etc.)
4. Each localized version can have regional variations created in M@S Studio
5. Regional variations inherit all fields, can override specific fields

**Gap**: None for basic workflow

---

### Use Case 2: Card Exists ONLY in French

**Scenario**: Card starts from EN but only French version is published/used

**Current Support**: ⚠️ PARTIAL

**Analysis**:
- Translation workflow currently assumes EN as source
- No mechanism to mark a locale as "primary" independent of EN
- Odin creates all target locales equally

**Options**:
| Approach | Pros | Cons |
|----------|------|------|
| A. Keep EN as source, publish only FR | Simple, no changes needed | EN fragment exists but unused |
| B. Allow creating directly in FR | More intuitive for authors | Breaks translation workflow assumptions |
| C. "Hide" source locale | Maintains translation pipeline | Requires new metadata field |

**Recommendation**: Option A (Keep EN as source, publish only FR)
- Simplest approach, no architecture changes
- EN source can be marked as "internal only" or unpublished
- Translation workflow remains consistent

---

### Use Case 3: French Card → Swiss French Modification

**Scenario**: Card exists in French only, need to modify copy for Swiss French (fr_CH)

**Current Support**: ✅ FULL

**Workflow**:
1. fr_FR is created (via translation from EN or directly)
2. Author creates regional variation for fr_CH from fr_FR
3. fr_CH inherits all fields from fr_FR
4. Author overrides specific fields (badge, copy, etc.)

**Gap**: None for single regional variation

---

## The Scale Challenge

### Problem Statement

Current architecture handles **individual** regional variations well, but struggles with **bulk** regional customizations.

**Real-World Example from Ticket**:

| Language | Default | Regional Variations | Customization Pattern |
|----------|---------|---------------------|----------------------|
| French | fr_FR (intro pricing, wide card) | lu_fr, be_fr (NO intro pricing) / ch_fr (HAS intro pricing) | 2 groups with different rules |
| German | de_DE (intro pricing, VAT copy) | lu_de (NO intro pricing) / ch_de (HAS intro pricing, VAT copy) | 3 different configurations |
| Portuguese | pt_BR (intro pricing, bold savings) | pt_PT (intro pricing, different styling) | 2 distinct versions |

**Core Issue**: When `fr_BE` and `lu_fr` share the SAME customization (no intro pricing), there's no way to:
1. Define this as a shared rule/template
2. Bulk update both variations when the rule changes
3. Express the relationship "these locales share this override"

---

## Approach Analysis

### Approach 1: Bulk Field Editing

**Concept**: UI to update the same field across multiple regional variations at once

**Implementation**:
```javascript
async bulkUpdateField(parentId, targetLocales, fieldName, value) {
    const variations = await getVariationsForLocales(parentId, targetLocales);
    await Promise.all(variations.map(v => v.updateField(fieldName, value)));
}
```

**Pros**:
- Simple to implement
- Extends existing `bulkPublishFragments` pattern
- No new data models needed

**Cons**:
- No way to express "why" these locales share this value
- Manual selection each time
- No automatic sync when rule changes

**Effort**: Low (2-3 days)

---

### Approach 2: Variation Templates / Profiles

**Concept**: Create named templates that define field overrides, assign locales to templates

**Data Model**:
```javascript
{
    name: "BENELUX No Intro Pricing",
    overrides: {
        "badge": null,
        "intro-pricing": "false"
    },
    locales: ["fr_BE", "fr_LU", "nl_BE", "nl_LU", "de_LU"]
}
```

**Pros**:
- Expresses the business logic ("BENELUX rule")
- Update template → all assigned locales update
- Self-documenting

**Cons**:
- New data model (Template fragments)
- Complex UI for template management
- Conflict resolution when locale in multiple templates

**Effort**: High (2-3 weeks)

---

### Approach 3: Inheritance Chains (Multi-Level)

**Concept**: Allow regional variations to inherit from other regional variations

**Structure**:
```
fr_FR (default)
  ├─ fr_CH (inherits from fr_FR)
  └─ fr_BE (inherits from fr_FR)
       └─ fr_LU (inherits from fr_BE, not fr_FR)
```

**Pros**:
- Leverages existing inheritance system
- Natural for geographic hierarchy (EU region → country)
- No new data models

**Cons**:
- Complex to visualize/manage
- Current system explicitly prevents variation-from-variation
- Merge conflicts in deep chains
- Makes troubleshooting harder

**Effort**: Medium-High (1-2 weeks)

---

### Approach 4: Feature Flags / Metadata Fields

**Concept**: Add metadata fields to fragments that control behavior (e.g., `intro-pricing: true/false`)

**Implementation**:
```javascript
// In fragment model
{
    "introPricing": { "type": "boolean", "default": true },
    "regionGroup": { "type": "enum", "values": ["default", "benelux", "dach"] }
}
```

**Pros**:
- Explicit control per fragment
- Can drive conditional rendering
- Queryable for reporting

**Cons**:
- Requires schema changes
- Still manual per-fragment setup
- Doesn't solve bulk update problem

**Effort**: Low-Medium (3-5 days)

---

### Approach 5: Locale Groups with Shared Settings

**Concept**: Define locale groups at the surface/configuration level that share certain settings

**Data Model**:
```javascript
// In surface configuration
{
    localeGroups: {
        "benelux": ["fr_BE", "nl_BE", "de_LU", "fr_LU", "nl_LU"],
        "dach": ["de_DE", "de_AT", "de_CH"]
    },
    groupSettings: {
        "benelux": { "introPricing": false },
        "dach": { "vatCopy": true }
    }
}
```

**Pros**:
- Centralized configuration
- Easy to update rules for entire group
- Works with existing fragment system

**Cons**:
- Settings at configuration level, not content level
- Limited flexibility for per-card exceptions
- Requires config deployment for changes

**Effort**: Medium (1 week)

---

### Approach 6: Leverage Locale Sync API (NEW - Based on Loc v2 Research)

**Concept**: Use the existing Locale Sync API to create regional variations with automatic non-translatable field sync

**How It Works**:
```
fr_FR (parent)
  ↓ localeSync API call
fr_CH, fr_BE (MSM Live Copies)
  ↓ inheritance broken only for translatable fields
Non-translatable fields (pricing, badges) auto-sync from parent
```

**Implementation**:
```javascript
// Create regional variations via Locale Sync
async createRegionalVariations(parentPath, targetLocales) {
    await fetch('/bin/localeSync', {
        method: 'POST',
        body: JSON.stringify({
            contentPath: parentPath,
            targetLocales: targetLocales  // ["fr-CH", "fr-BE", "fr-LU"]
        })
    });
}
```

**Pros**:
- Uses existing AEM infrastructure (MSM Live Copies)
- Non-translatable fields sync AUTOMATICALLY
- No custom bulk update logic needed
- Consistent with Odin translation workflow
- Field-level control via CF model (translatable vs non-translatable)

**Cons**:
- Requires understanding of MSM Live Copy behavior
- CF model changes needed to mark fields correctly
- Regional-specific overrides still need manual handling
- Live Copy rollout behavior may need tuning

**Effort**: Low-Medium (1 week to integrate into M@S Studio)

**Key Insight**: This approach delegates bulk sync to AEM's native MSM system, which is already battle-tested and scales well.

---

## Odin Loc 2.0 Integration (Official Documentation)

### Background: Why Loc 2.0?

The old localization script (aem-i18n) had several limitations:
- Depended on `locReady` flag at CF Model level
- Ran at least once per project daily, processing ALL `locReady` CFs
- Generated high volume of AEM calls
- Authors had no control over timing or locale selection

Loc 2.0 addresses these by giving authors more control and reducing unnecessary processing.

### UI Entry Points

The **Localization dropdown** appears in two locations:
- **Admin View**: Header menu
- **Editor View**: Action bar

**Visibility conditions** (both must be true):
1. Selected CF is in the **English locale folder**
2. Tenant folder is enabled for Loc 2.0 flow

### Two Actions Available

| Action | Purpose |
|--------|---------|
| **Send to localization** | Sends CFs to GLaaS for human/machine translation |
| **Sync** | Synchronizes non-translatable fields from EN to target locales |

---

### Send to Localization Flow

#### Step 1: Select Content Fragments
- Select one or more CFs in English locale
- Open Localization dropdown → Click "Send to localization"

#### Step 2: Modal Dialog
The modal contains:

**a) Selected Content Fragments**
- Lists titles of all selected CFs

**b) Translation Method**
| Method | Description | Speed |
|--------|-------------|-------|
| **Human Translation** | Professional linguists | 2-3 business days |
| **Machine Translation** | Automated MT | Fast |

**c) Available Locales**
- Shows all locales configured for the localization project
- User selects one or more target locales
- Validation: CFs must belong to same project

#### Step 3: Nested CF Handling
If selected CFs contain nested CFs, additional modal appears:
- Informs which CFs have nested fragments
- Option to open in editor for review
- Choose: **Send only parent** OR **Include all nested CFs**

#### Step 4: Processing
- CFs uploaded to GLaaS
- New localization task created per CF/locale combination
- User receives **Slack notification** on success/failure

#### Step 5: Background Sync (Automatic)
When Send to localization starts, **Sync also runs automatically**:

| Scenario | Behavior |
|----------|----------|
| CF doesn't exist in target locale | New CF created using English content |
| CF already exists | Non-translatable fields synced, translatable fields untouched |
| Assets in EN folder | Same folder structure created in target locale |
| Hierarchical folder structure | Hierarchy replicated in target locale |

---

### Sync Flow (Standalone)

#### Triggering Sync
- Select CF(s) in English locale
- Localization dropdown → **Sync**
- Modal shows all available locales
- Select locales → Click **Sync** button
- User receives **Slack notification** on completion

#### How Sync Works

**Case 1: CF Does NOT Exist in Target Locale**
| Action | Result |
|--------|--------|
| Create copy | **MSM Live Copy** created from English content |
| Translatable fields | **Unlocked** (ready for GLaaS content) |
| Non-translatable fields | **Locked** (auto-sync from EN on future syncs) |
| Folder hierarchy | Replicated from EN |
| Referenced assets | Copied to target locale folder |

**Case 2: CF Already Exists (Translated)**
| Action | Result |
|--------|--------|
| Non-translatable fields | **Synchronized** with English content |
| Translatable fields | **Unchanged** (preserved until next localization) |

---

### Critical Insight: Field Classification

| Field Type | MSM Inheritance | Sync Behavior |
|------------|-----------------|---------------|
| **Translatable** (copy, descriptions, CTA labels) | Broken | GLaaS handles translation |
| **Non-translatable** (osi, variant, pricing flags) | Preserved | Auto-synced from EN |

**Important**: This classification must be configured in the **CF Model** in AEM.

---

### Implications for Regional Variations

| Aspect | Loc 2.0 Design | Regional Variation Need |
|--------|----------------|------------------------|
| **Source locale** | Always English | Could be fr_FR → fr_CH |
| **UI availability** | Only for EN folder CFs | Need for locale-to-locale |
| **Field handling** | Translatable vs non-translatable | All fields are "regional" |

**GAP IDENTIFIED**: Loc 2.0 Sync is designed for **EN → locale** only.
- The Sync UI **only appears** when CF is in English folder
- Cannot use for **locale → regional variant** (e.g., fr_FR → fr_CH)
- Regional variations in M@S Studio are created as **empty shells**, not MSM Live Copies

---

### API Constraints

| Constraint | Description |
|------------|-------------|
| EN-only source | Localization dropdown only visible for EN folder CFs |
| Async processing | Both actions process in background |
| Slack notifications | User notified on completion (no webhook) |
| Project validation | Selected CFs must belong to same localization project |

---

## Recommendation

### Final Recommendation (Post Code Exploration)

**IMPORTANT UPDATE**: Code exploration revealed that the Locale Sync API approach is **NOT viable for MVP**:

| Blocker | Impact |
|---------|--------|
| `localeSync` is internal Odin operation | Cannot be called directly from M@S Studio |
| No translatable field metadata exists | CF model doesn't classify fields |
| Browser cannot call AEM bin endpoints | CORS + authentication barriers |
| Variations are created as empty shells | No automatic field inheritance at creation |

### Revised Phased Approach

**Phase 1 (MVP - Recommended)**: Bulk Field Editing
- Extend existing bulk operations pattern (`bulkPublishFragments`)
- Multi-select regional variations in variation list
- Bulk "Update Field" and "Reset to Parent" actions
- Immediate value, no external dependencies

**Phase 2 (Enhancement)**: Locale Groups for Faster Selection
- Pre-configure groups: BENELUX, DACH, Nordics, etc.
- Quick-select all locales in a group
- Stored in `locales.js` configuration

**Phase 3 (Future - Requires Odin Team Collaboration)**: Locale Sync Integration
- Requires Odin team to expose `localeSync` as callable API
- Requires CF model updates for translatable field classification
- Would provide automatic non-translatable field sync

### Recommended Solution for Loc MVP

**Bulk Field Editing (Primary Approach)**

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

**Why This Works**:
1. **No external dependencies**: Uses existing AEM Fragment API
2. **Extends proven patterns**: Similar to `bulkPublishFragments`
3. **Immediate implementation**: 2-3 days of development
4. **Works with existing variations**: Handles already-created variations
5. **No CF model changes required**: Works with current architecture

### Implementation Details

**Entry Point**: Extend `mas-variation-dialog.js` or create new bulk action panel

**Core Method** (in `mas-repository.js`):
```javascript
async bulkUpdateField(fragmentIds, fieldName, value) {
    const results = await Promise.all(
        fragmentIds.map(async (id) => {
            const fragment = await this.aem.sites.cf.fragments.getWithEtag(id);
            fragment.updateField(fieldName, value);
            return this.aem.sites.cf.fragments.save(fragment);
        })
    );
    return results;
}

async bulkResetToParent(fragmentIds, fieldName) {
    // Similar pattern, but removes field from variation
}
```

**UI Components Needed**:
1. Multi-select checkboxes in variation list
2. Bulk action dropdown menu
3. Field selector for "Update Field" action
4. Confirmation dialog with affected count

### Locale Sync API - Future Consideration

The Locale Sync API remains a **valuable long-term option** IF:
1. Odin team exposes it as a callable endpoint
2. CF model is updated with translatable field metadata
3. I/O Runtime action wrapper is created for browser access

**Collaboration needed with**: Odin/Localization team to evaluate feasibility

### Comparison Summary

| Criteria | Bulk Field Editing | Locale Sync API |
|----------|-------------------|-----------------|
| **MVP feasibility** | ✅ YES | ❌ NO (blockers) |
| **External dependencies** | None | Odin team, CF model |
| **Implementation effort** | Low (2-3 days) | High (weeks + coordination) |
| **Automatic sync** | No (manual) | Yes (via MSM) |
| **Handles existing variations** | Yes | Unknown |

---

## File References

| Purpose | File Path |
|---------|-----------|
| Variation Detection | `studio/src/reactivity/editor-context-store.js` |
| Field Inheritance | `studio/src/aem/fragment.js:136-194` |
| Bulk Publish Pattern | `studio/src/mas-repository.js:1013-1062` |
| Variation Dialog | `studio/src/mas-variation-dialog.js` |
| Translation Project | `io/studio/src/translation/project-start.js` |
| Locale Configuration | `studio/src/locales.js` |
| Fragment Pipeline | `io/www/src/fragment/pipeline.js` |

---

## Code Exploration Findings (Critical Updates)

### Finding 1: Current Variation Creation Architecture

**Location**: `mas-variation-dialog.js` → `mas-repository.js:createVariation()`

| Aspect | Implementation |
|--------|----------------|
| What it creates | **Empty fragment** in target locale folder |
| Field inheritance | None at creation - fields are empty |
| Parent linkage | Updates parent's `variations` field with new path |
| Constraint | **Cannot create variation from variation** (explicitly blocked) |
| Locale source | Static `LOCALES` array (81+ locales, surface-filtered) |

**Code path**:
```
mas-variation-dialog.handleSubmit()
  → repository.createVariation(fragmentId, locale, isVariation)
    → createEmptyVariation() - creates blank fragment
    → updateParentVariations() - links to parent
```

### Finding 2: Locale Sync API Reality Check

**CRITICAL DISCOVERY**: `localeSync` is NOT a publicly callable API.

| Discovery | Evidence |
|-----------|----------|
| No `localeSync` calls in codebase | Grep found zero references |
| Triggered internally by Odin | After `sendToLocalisationAsync` completes |
| Called from I/O Runtime only | `io/studio/src/translation/project-start.js` |
| Browser cannot call AEM bin endpoints | CORS + authentication barriers |

**Translation flow (current)**:
```
M@S Studio (browser)
  → I/O Runtime action (project-start.js)
    → POST /bin/sendToLocalisationAsync
      → Odin backend
        → localeSync (internal, automatic)
```

### Finding 3: No Translatable Field Metadata

**CRITICAL DISCOVERY**: The CF model does NOT classify fields as translatable/non-translatable.

| Question | Answer |
|----------|--------|
| Field type definitions in code? | NO - stored in AEM CF Models |
| Translatable field markers? | **NO metadata exists** |
| How translations work? | Entire fragment sent as unit |
| Field-level inheritance? | Generic (not translation-aware) |

**Existing translation marker**: Only `locReady` boolean field exists (marks fragment for translation).

### Finding 4: Variation vs Translation Separation

Current architecture keeps these **completely separate**:

| Flow | Purpose | Entry Point |
|------|---------|-------------|
| **Variation** | Create regional variant | `mas-variation-dialog.js` |
| **Translation** | Send to GLaaS | `mas-translation-editor.js` |

No automatic integration between them.

---

## Revised Open Questions

### Now Answered

1. ~~Can `localeSync` be called from browser?~~ → **NO** - internal Odin operation only
2. ~~What fields are translatable?~~ → **No classification exists** - entire fragments are units
3. ~~Does Locale Sync work for regional variations?~~ → **Unknown** - API not accessible

### Still Open

### Bulk Editing Questions (Secondary)

5. **Q**: Should bulk operations show "simulated" preview before applying?
   - **Context**: Prevents accidental mass updates

6. **Q**: How should conflicts be handled when bulk updating a field that's already overridden?
   - **Options**: Skip, overwrite, prompt per-item

7. **Q**: Should locale groups be defined in code (locales.js) or configurable per surface?
   - **Context**: Affects who can modify groups (developer vs author)

---

## Management Challenge: Scaling Regional Customizations

### The Core Question

> "If one set of geos has a certain copy customization - how do we scalably manage this and translate?"

### Real-World Scale

From the Jira ticket examples:
- **fr_BE** and **lu_fr** both need "no intro pricing"
- This same customization applies across multiple cards (All Apps, Photoshop, etc.)

**Scale calculation:**
- 2 locales × 10 cards = 20 variations to manage
- If the customization changes → 20 manual updates today

### Current Workflow (One by One)

```
For each card:
  1. Open "All Apps" card
  2. Create fr_BE variation → override badge/copy
  3. Create lu_fr variation → override badge/copy (same values)
  4. Open "Photoshop" card
  5. Repeat...

When customization changes:
  1. Open each card
  2. Update fr_BE
  3. Update lu_fr
  4. Repeat for all cards...
```

**Pain point**: No concept of "these locales share a rule"

---

## Management Options (Proposals)

### Option 1: Locale Group + Per-Fragment Bulk Edit

**Setup**: Define locale groups (BENELUX = fr_BE, lu_fr, nl_BE, etc.)

**Workflow**:
```
For "All Apps" card:
  1. Open variations panel
  2. Click "Select Group" → BENELUX
  3. All BENELUX locales selected
  4. Bulk update badge field

Repeat for each card (but faster selection within each card)
```

| Pros | Cons |
|------|------|
| Simple to implement | Still per-fragment |
| Extends existing UI | Must repeat for each card |
| No new data models | No cross-card visibility |

---

### Option 2: Cross-Fragment Variation Dashboard

**New UI**: Surface-level view of all variations

```
┌─────────────────────────────────────────────────────────────┐
│ Regional Variations Dashboard                                │
├─────────────────────────────────────────────────────────────┤
│ Filter: Locale Group [BENELUX ▼]  Field [badge ▼]           │
├─────────────────────────────────────────────────────────────┤
│ ☑ All Apps / fr_BE      badge: "SALE" (overridden)         │
│ ☑ All Apps / lu_fr      badge: "SALE" (overridden)         │
│ ☑ Photoshop / fr_BE     badge: (inherited)                 │
│ ☑ Photoshop / lu_fr     badge: (inherited)                 │
│ ☑ Illustrator / fr_BE   badge: "SALE" (overridden)         │
│ ...                                                         │
├─────────────────────────────────────────────────────────────┤
│ 12 selected   [Update badge...] [Reset to parent]           │
└─────────────────────────────────────────────────────────────┘
```

**Workflow**:
```
1. Open dashboard
2. Filter: BENELUX + badge field
3. Select all
4. Update badge to new value
5. Done - all 12 variations updated at once
```

| Pros | Cons |
|------|------|
| Cross-fragment operations | New UI surface needed |
| Single operation for entire geo set | More complex implementation |
| Full visibility of all variations | Query performance at scale |

---

### Option 3: Variation Rules/Templates

**New concept**: Named rules that define overrides

```
Rule: "BENELUX No Intro"
  - badge: null
  - promo-text: null
  - Applied to: BENELUX locales

When creating variation:
  - Select "Apply rule" → BENELUX No Intro
  - Variation pre-populated with rule's overrides

When rule changes:
  - Update rule definition
  - All variations using rule get updated
```

| Pros | Cons |
|------|------|
| Single source of truth | New data model needed |
| Automatic cascade on rule change | Rule conflict resolution |
| Self-documenting (rule names) | Higher implementation complexity |

---

## Translation of Regional Customizations

### Customization Types and Translation Needs

| Customization Type | Translation Need | Current Support |
|-------------------|------------------|-----------------|
| Remove field (clear badge) | None - just empty | ✅ Works |
| Same value as another locale | Copy, no translation | ✅ Works (manual) |
| Different copy in same language | Author writes directly | ✅ Works |
| Different copy needs translation | **Gap** - no current path | ❌ Gap |

### Scenario Analysis

**If BENELUX needs custom copy in French:**
- Author writes French directly in fr_BE
- Copies to lu_fr (same language)
- No Odin involvement needed

**If BENELUX needs custom copy that originates in English:**
- Current model doesn't support this
- Would need en_BE → fr_BE translation path
- Or: Author writes in en_US comment field, manually translates?

### Open Question

> **Do regional customizations need an English source for translation, or do authors write directly in the target language?**

This determines whether we need:
- **Direct authoring model**: Authors write regional copy in target language (no translation workflow)
- **EN source model**: Regional customizations start in English, go through translation (requires new variation-aware translation flow)

---

## Summary: Management vs Translation

| Aspect | Challenge | Proposed Solution |
|--------|-----------|-------------------|
| **Bulk editing** | Update same field across variations | Bulk Field Editing (per-fragment) |
| **Geo set management** | Manage BENELUX/DACH as a group | Options 1-3 above |
| **Cross-fragment updates** | Update all cards for a locale set | Dashboard (Option 2) or Rules (Option 3) |
| **Translation of regional copy** | EN source for regional customizations | **Open question** - needs stakeholder input |

---

---

## New Finding: GWP Requirements (Jan 2026)

### Context from Geri (GWP Partner)

From the Plans/Catalog M@S migration planning meeting, new requirements emerged regarding Intro pricing geos.

**Scale for Creative Cloud Pro CCI alone:**
- **54 geos** with Intro or RPP pricing
- Multiple offer durations: 1 year, 3 month, 6 month
- Different flex codes per region group

| Duration | Geos | Count |
|----------|------|-------|
| 1 year (EU) | bg, cz, ee, gr_el, gr_en, hu, lt, lv, pl, pt, ro, sk, si | 13 |
| 1 year (non-EU) | hk_en, hk_zh, ng, ph_en, ph_fil, th_en, th_th, tw, vn_en, vn_vi | 10 |
| 3 month | at, dk, no, au, ca, ca_fr, ch_de, ch_fr, ch_it, de, fi, fr, jp, nl, nz, se, uk | 17 |
| 6 month | it, br | 2 |
| RPP | africa, in, in_hi, mx, pe, ua, za, co, id_en, id_id, my_en, my_ms | 12 |

**Note**: This is just CCI - there are also offers for CCT, Acrobat, and Express.

### Key Insight: Two Different Use Cases

**What GWP actually needs:**
1. Create a **new card from en_US** (always en_US)
2. **Select a list of geos** (e.g., 13 EU geos)
3. Card is **shown INSTEAD OF** the default translated card

**This is NOT regional variations:**

| Aspect | Regional Variations | Personalization Variations |
|--------|--------------------|-----------------------------|
| Source | Translated locale (fr_FR) | Always en_US |
| Relationship | Inherits from parent | Replaces default |
| Targeting | Single locale | List of geos |
| Use case | Regional copy tweaks | Intro pricing campaigns |

### Recommendation: Two Separate Features

1. **Regional Variations** (inheritance model)
   - Existing variation system
   - Add bulk editing for management
   - Use case: Regional copy customizations

2. **Personalization Variations** (targeting model)
   - New feature to be designed
   - Create promo card from en_US
   - Target to list of geos
   - Use case: Intro pricing, campaigns

---

## Next Steps

### Completed Research

1. ~~Test Locale Sync API~~ → **Not viable** (internal Odin operation)
2. ~~Review CF Model field classifications~~ → **No metadata exists**
3. ~~Verify API Access from browser context~~ → **CORS + auth barriers**

### Next Actions

4. **Clarify scope**: Are regional variations and personalization variations separate features?
5. **Define Personalization Variations**: How will it work in M@S Studio?
6. **Coordinate**: Align with Personalization feature planning
7. **Create follow-up tickets**: Separate tickets for each feature if needed
