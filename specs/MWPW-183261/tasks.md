# Tasks: Form Field Status Indicators

**Input**: Design documents from `/specs/MWPW-183261/`
**Prerequisites**: plan.md, spec.md, research.md
**Updated**: 2026-01-13 (Added Phase 7-8: CSS selector fix, per-item mnemonics override)

**Tests**: No tests explicitly requested in specification. Tests are optional for this UI enhancement.

**Organization**: Tasks are grouped by phase. Phase 0 reverts previous work, then Phases 1-3 implement the new approach.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

**Primary file**: `studio/src/editors/merch-card-editor.js`
**Files to delete**: `studio/src/fields/mas-textfield.js`
**Files to revert**: `studio/src/swc.js` (remove mas-textfield import)

---

## Phase 0: Revert Previous Work

**Purpose**: Remove custom `mas-textfield` component and restore `sp-textfield` usage

- [x] T001 DELETE file: `studio/src/fields/mas-textfield.js`
- [x] T002 REVERT: Remove `mas-textfield` import from `studio/src/swc.js`
- [x] T003 REVERT: Replace all `<mas-textfield>` with `<sp-textfield>` in `studio/src/editors/merch-card-editor.js`
- [x] T004 Verify no other files import `mas-textfield` (grep search)

**Checkpoint**: mas-textfield component fully removed, sp-textfield restored

---

## Phase 1: Setup & Verification

**Purpose**: Verify prerequisites before implementing new approach

- [x] T005 Verify `sp-icon-unlink` is imported in studio/src/swc.js
- [x] T006 Verify `getFieldState()` method exists in studio/src/aem/fragment.js
- [x] T007 Identify all field types needing override styling: sp-textfield, sp-picker, sp-switch, sp-tag

**Checkpoint**: Prerequisites confirmed - implementation can begin

---

## Phase 2: CSS Styling with `--mod-*` Tokens (Priority: P1) 🎯 MVP

**Goal**: Add CSS styles using Spectrum's official `--mod-*` tokens for override indicators

**Color Values**:
- Border: `--spectrum-blue-400`
- Background: `--spectrum-blue-100`
- Switch track: `--spectrum-blue-500`

### CSS Implementation

- [x] T008 [US1] Add `--mod-textfield-*` styles for sp-textfield override state in merch-card-editor.js
- [x] T009 [US1] Add `--mod-picker-*` styles for sp-picker override state in merch-card-editor.js
- [x] T010 [US1] Add `--mod-switch-*` styles for sp-switch override state in merch-card-editor.js
- [x] T011 [US1] Add `--mod-tag-*` styles for sp-tag override state in merch-card-editor.js
- [x] T012 [US1] Add `.field-status-indicator` class styles (link with icon) in merch-card-editor.js

**Checkpoint**: CSS styles added for all four component types

---

## Phase 3: Template Updates (Priority: P1)

**Goal**: Add data-field-state attributes and update override indicator method

### Method & Template Changes

- [x] T013 [US1+US2] Update `renderOverrideIndicator()` to `renderFieldStatusIndicator()` with sp-icon-unlink in merch-card-editor.js
- [x] T014 [US1] Add data-field-state attribute to General Info section field groups in merch-card-editor.js
- [x] T015 [US1] Add data-field-state attribute to Prices section field groups in merch-card-editor.js
- [x] T016 [US1] Add data-field-state attribute to Content section field groups in merch-card-editor.js
- [x] T017 [US1] Add data-field-state attribute to Footer section field groups in merch-card-editor.js
- [x] T018 [US1] Add data-field-state attribute to remaining field groups (mnemonics, tags, etc.) in merch-card-editor.js
- [x] T019 [US1+US2] Update all `renderOverrideIndicator()` calls to `renderFieldStatusIndicator()` in merch-card-editor.js
- [x] T020 [US1] Remove old `.field-reset-link` CSS and unused code in merch-card-editor.js

**Checkpoint**: At this point, overridden fields should display styled indicators with restore link

---

## Phase 4: User Story 3 - Inherited Fields (Priority: P2)

**Goal**: Verify inherited fields show normal appearance (no visual indicators)

### Verification (no code changes)

- [x] T021 [US3] Verify getFieldState() returns 'inherited' or 'same-as-parent' for non-overridden fields
- [x] T022 [US3] Verify CSS only applies to fields with data-field-state="overridden"

**Checkpoint**: Inherited fields have normal appearance

---

## Phase 5: Polish & Verification

**Purpose**: Final validation and cleanup

- [x] T023 Run linter: `npm run lint` from /Users/axelcurenobasurto/Web/mas/
- [x] T024 Run studio build and tests: `cd studio && npm run build && npm run test`
- [x] T025 Manual verification: Start MAS Studio (`npm run studio`) and test with a variation fragment
- [x] T026 Verify edge case: multifield components display indicator correctly
- [x] T027 Verify edge case: RTE fields display indicator correctly
- [x] T028 Verify edge case: Tags display blue styling when overridden

---

## Phase 6: Tags Variation Field State Fix

**Purpose**: Fix tags field not showing overridden state in variations

### Root Cause
Tags have dual storage pattern:
- `fragment.tags` - Original loaded state (objects with id+title)
- `fragment.newTags` - Pending changes (IDs only)
- `getTagsFieldState()` was reading from `fragment.tags` (never updated) instead of `fragment.newTags`

### Tasks

- [x] T029 [BUG] Update `getTagsFieldState()` to check `newTags` first in `studio/src/editors/merch-card-editor.js`
- [x] T030 [BUG] Update tag picker value binding to use `newTags` if available in `studio/src/editors/merch-card-editor.js`
- [x] T031 [BUG] Update `resetTagsToParent()` to clear `newTags` when restoring in `studio/src/editors/merch-card-editor.js`
- [x] T032 [STYLE] Add `:host([data-field-state='overridden'])` CSS to `studio/src/aem/aem-tag-picker-field.js` for sp-tag styling

**Checkpoint**: Tags field shows overridden indicator and blue styling in variations

---

## Phase 7: CSS Selector Fix

**Purpose**: Fix CSS selectors to target components directly instead of parent field groups

### Root Cause
CSS selectors expected `data-field-state` on parent `sp-field-group` but templates placed it directly on child components. The parent-based selectors weren't matching.

### Tasks

- [x] T033 [BUG] Change sp-textfield CSS selector from `sp-field-group[data-field-state='overridden'] sp-textfield` to `sp-textfield[data-field-state='overridden']`
- [x] T034 [BUG] Change sp-picker CSS selector from parent-based to direct: `sp-picker[data-field-state='overridden']`
- [x] T035 [BUG] Change sp-switch CSS selector from parent-based to direct: `sp-switch[data-field-state='overridden'][checked]`
- [x] T036 [CLEANUP] Remove unused fallback CSS block for rte-field, aem-tag-picker-field, mas-multifield, etc.

**Checkpoint**: Override styling now applies correctly to all Spectrum Web Components

---

## Phase 8: Per-Item Override Detection for Mnemonics (Multifields)

**Purpose**: Highlight only the specific mnemonic(s) that differ from parent, not all mnemonics

### Root Cause
1. Initial issue: `getFieldState('mnemonics')` checked for non-existent field. Mnemonics are stored as parallel arrays: `mnemonicIcon`, `mnemonicAlt`, `mnemonicLink`, etc.
2. After fix: Using `getFieldState('mnemonicIcon')` highlighted ALL mnemonics when any one differed because the single field state was propagated to all children.

### Solution
Calculate per-item override state in the editor and pass `fieldState: 'overridden'` through each mnemonic's value object.

### Tasks

- [x] T037 [BUG] Fix `getFieldState('mnemonics')` to use actual field name `'mnemonicIcon'`
- [x] T038 [FEATURE] Update `get mnemonics()` in merch-card-editor.js to add per-item `fieldState: 'overridden'` when mnemonic differs from parent
- [x] T039 [FEATURE] Update `renderField()` in multifield.js to use item's `fieldState` property if present (skip setting as HTML attribute)
- [x] T040 [CLEANUP] Remove parent-level `data-field-state` from mas-multifield element for mnemonics

**Checkpoint**: Only specific overridden mnemonic(s) show blue styling, not all mnemonics

---

## Phase 9: Unified Per-Item Override Detection with Shared Utility

**Purpose**: Create reusable utility for per-item override detection (tags, mnemonics, future fields)

### Root Cause
1. Tags CSS `:host([data-field-state='overridden']) sp-tag` styled ALL tags when any differed from parent
2. Mnemonics had inline logic that could be extracted and reused
3. Need a consistent pattern across all array-based fields

### Solution
Create shared `getItemFieldState()` utility that both components can use.

### Tasks

- [x] T041 [FEATURE] Create `studio/src/utils/field-state.js` with `getItemFieldState()` utility
- [x] T042 [FEATURE] Add `parentTags` property to `studio/src/aem/aem-tag-picker-field.js`
- [x] T043 [FEATURE] Update `get tags()` in aem-tag-picker-field.js to use shared utility and set per-tag `data-field-state`
- [x] T044 [STYLE] Update CSS from `:host([data-field-state='overridden']) sp-tag` to `sp-tag[data-field-state='overridden']`
- [x] T045 [FEATURE] Pass `.parentTags` from merch-card-editor.js template

**Checkpoint**: Only specific overridden tag(s) show blue styling, shared utility is reusable

---

## Phase 10: Tag Picker Styling Refinements

**Purpose**: Enhance override styling in aem-tag-picker-field.js

### Tasks

- [x] T046 [BUG] Fix format mismatch in `get tags()` - convert parentTags from attribute format to path format using `fromAttribute()`
- [x] T047 [STYLE] Increase sp-tag override border width to 2px
- [x] T048 [STYLE] Add sp-action-button override styles (border color, background, 2px border) when host has `data-field-state='overridden'`

**Checkpoint**: Tag picker shows 2px blue borders on overridden tags and action button trigger

---

## Phase 11: sp-picker Styling in merch-card-editor.js

**Purpose**: Fix sp-picker override styling and add default base styles

### Tasks

- [x] T049 [BUG] Add missing `data-field-state="${this.getFieldState('style')}"` to style sp-picker
- [x] T050 [STYLE] Add default sp-picker base styles: white background, 2px solid gray-300 border

**Checkpoint**: sp-pickers show default gray border and blue override styling when overridden

---

## Phase 12: Remaining Override Styling Issues

**Purpose**: Fix remaining field types that need override styling

### Tasks

- [x] T051 [BUG] Remove sp-action-button override CSS from `aem-tag-picker-field.js` (only individual tags should be styled)
- [x] T052 [FEATURE] Add `getQuantityComponentState(component)` method for quantity sub-fields (title, min, step)
- [x] T053 [FEATURE] Add `renderQuantityComponentOverrideIndicator()` method
- [x] T054 [BUG] Update quantity textfields to use `getQuantityComponentState()` instead of `getFieldState()`
- [x] T055 [STYLE] Add override CSS to `secure-text-field.js` for sp-switch and sp-checkbox
- [x] T056 [STYLE] Add override CSS to `plan-type-field.js` for sp-switch and sp-checkbox
- [x] T057 [STYLE] Add override CSS to `addon-field.js` for sp-switch and sp-combobox
- [x] T058 [BUG] Add override CSS to `included-field.js` targeting `.included-preview` (was missing, unlike mnemonic-field.js)
- [x] T059 [STYLE] Style default sp-tags: transparent border, gray-100 background
- [x] T060 [BUG] Add override CSS, data-field-state, and default styles to variant-picker (Template field)
- [x] T061 [BUG] Add missing `renderFieldStatusIndicator('style')` for Style sp-picker
- [x] T062 [CLEANUP] Standardize variation check to use `effectiveIsVariation` in getQuantityComponentState and getBadgeComponentState
- [x] T063 [CLEANUP] Remove redundant `if (!ownValue && !parentValue)` conditionals

**Checkpoint**: All remaining field types show override styling correctly

---

## Phase 13: Consolidate Composite Field State Methods

**Purpose**: Reduce code duplication by creating a generic helper for composite field state detection

### Background

Quantity and badge fields are "composite fields" - they store multiple values in a single HTML element:
- **Quantity**: `<merch-quantity-select title="..." min="..." step="...">` → 3 components in 1 field
- **Badge**: `<merch-badge background-color="..." border-color="...">Text</merch-badge>` → 3 components in 1 field

The methods `getQuantityComponentState()` and `getBadgeComponentState()` follow identical patterns:
1. Check `effectiveIsVariation`
2. Get own HTML and parent HTML
3. Parse both with component-specific parser
4. Extract and compare specific component
5. Return 'no-parent', 'inherited', or 'overridden'

### Solution

Create a private generic helper that both methods can use:

```javascript
#getCompositeComponentState(fieldName, parser, component) {
    if (!this.effectiveIsVariation) return 'no-parent';
    const ownHtml = this.fragment?.getFieldValue(fieldName, 0) || '';
    const parentHtml = this.localeDefaultFragment?.getFieldValue(fieldName, 0) || '';
    const ownParsed = parser(ownHtml);
    const parentParsed = parser(parentHtml);
    const ownValue = ownParsed[component];
    const parentValue = parentParsed[component];
    if (!ownValue) return 'inherited';
    return ownValue === parentValue ? 'inherited' : 'overridden';
}
```

### Tasks

- [x] T064 [REFACTOR] Add `#getCompositeComponentState(fieldName, parser, component, getOwnHtml)` private helper method
- [x] T065 [REFACTOR] Simplify `getQuantityComponentState(component)` to use helper
- [x] T066 [REFACTOR] Simplify `getBadgeComponentState(fieldName, component)` to use helper
- [x] T067 [VERIFY] Run linter and tests to ensure no regressions

**Checkpoint**: Composite field state methods consolidated, ~10 lines saved, code is DRY ✅ DONE

---

## Phase 14: Code Consolidation - Override Indicator Rendering ✅ DONE

**Purpose**: Consolidate duplicate HTML template across 5 render methods

### Problem

5 methods rendered identical HTML with only the callback differing:
- `renderTagsStatusIndicator()`
- `renderFieldStatusIndicator(fieldName)`
- `renderSectionStatusIndicator(fieldNames)`
- `renderQuantityComponentOverrideIndicator(component)`
- `renderBadgeComponentOverrideIndicator(fieldName, component)`

### Solution (Implemented)

Created `#renderOverrideIndicatorLink(resetCallback)` private helper that all methods now use.

### Tasks

- [x] T068 [REFACTOR] Add `#renderOverrideIndicatorLink(resetCallback)` private helper
- [x] T069 [REFACTOR] Simplify `renderFieldStatusIndicator()` to use helper
- [x] T070 [REFACTOR] Simplify `renderTagsStatusIndicator()` to use helper
- [x] T071 [REFACTOR] Simplify `renderSectionStatusIndicator()` to use helper
- [x] T072 [REFACTOR] Simplify `renderQuantityComponentOverrideIndicator()` to use helper
- [x] T073 [REFACTOR] Simplify `renderBadgeComponentOverrideIndicator()` to use helper

**Checkpoint**: ~50 lines saved, single source of truth for indicator HTML

---

## Phase 15: Mnemonics Field State Utility ✅ DONE

**Purpose**: Extract index-based field state comparison to shared utility

### Solution (Implemented)

Added `getItemFieldStateByIndex()` to `studio/src/utils/field-state.js` for index-based comparisons (mnemonics).
Complements existing `getItemFieldState()` for set-based comparisons (tags).

### Tasks

- [x] T074 [REFACTOR] Add `getItemFieldStateByIndex(currentValue, parentValues, index)` to field-state.js
- [x] T075 [REFACTOR] Update `get mnemonics()` in merch-card-editor.js to use shared utility

**Checkpoint**: Shared utilities for both set-based (tags) and index-based (mnemonics) comparisons

---

## Phase 16: Fix Variant Picker Value Binding

**Purpose**: Fix variant-picker value not updating when changed in variations

### Root Cause

The variant-picker uses **attribute binding** (`value="${...}"`) instead of **property binding** (`.value="${...}"`).

In Lit, attribute binding doesn't reliably update custom element properties during re-renders. All other custom Lit components in MAS Studio (rte-field, addon-field, multifield) correctly use property binding.

**Code locations:**
- `merch-card-editor.js:623`: `value="${form.variant.values[0]}"` (attribute binding)
- `variant-picker.js:118`: `value=${this.value ?? this.defaultValue}` (attribute binding to sp-picker)

### Solution

Change attribute bindings to property bindings (`.value=`) for:
1. The parent binding in merch-card-editor.js
2. The internal binding in variant-picker.js
3. The style picker (same issue)

### Tasks

- [x] T076 [BUG] Add property binding `.value="${form.variant.values[0]}"` in `studio/src/editors/merch-card-editor.js:623`
- [x] T077 [BUG] Add property binding `.value="${form.style?.values[0] || 'default'}"` in `studio/src/editors/merch-card-editor.js:634`
- [x] T078 [BUG] Add BOTH attribute AND property binding in `studio/src/editors/variant-picker.js:118`
- [x] T079 [BUG] Add `reflect: true` to value property in `studio/src/editors/variant-picker.js:102`
- [x] T082 [BUG] Add `#handleChange` method and `@change` handler to sync sp-picker value to variant-picker.value
- [x] T080 [VERIFY] Run linter on modified files
- [ ] T081 [VERIFY] Manual test: change template in variation, verify value attribute updates

**Checkpoint**: Variant picker properly updates value when changed in variations

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 0 (Revert) ─> Phase 1 (Setup) ─> Phase 2 (CSS) ─> Phase 3 (Templates) ─> Phase 4 (Verify US3) ─> Phase 5 (Polish) ─> Phase 6 (Tags Fix) ─> Phase 7 (CSS Selector Fix) ─> Phase 8 (Mnemonics Per-Item) ─> Phase 9 (Tags Per-Item) ─> Phase 10 (Tag Picker Styling) ─> Phase 11 (sp-picker Styling) ─> Phase 12 (Remaining Styling)
```

### Parallel Opportunities

**Phase 0 (can run in parallel)**:
- T001, T002, T003 (different files)

**Phase 2 CSS (can run in parallel)**:
- T008, T009, T010, T011, T012 (all add CSS, same file but different sections)

**Phase 3 Field Groups (can run in parallel after T013)**:
- T014, T015, T016, T017, T018 (different sections of template)

---

## Implementation Strategy

### Execution Order

1. **Phase 0**: Revert mas-textfield (MUST complete first)
2. **Phase 1**: Verify prerequisites
3. **Phase 2**: Add CSS with `--mod-*` tokens
4. **Phase 3**: Update templates and method
5. **CHECKPOINT**: Test in MAS Studio
6. **Phase 4**: Verify inherited fields (US3)
7. **Phase 5**: Polish and final verification

### Key Files

| File | Action |
|------|--------|
| `studio/src/fields/mas-textfield.js` | DELETE |
| `studio/src/swc.js` | REVERT (remove mas-textfield import) |
| `studio/src/editors/merch-card-editor.js` | MODIFY (main implementation) |
| `studio/src/fields/multifield.js` | MODIFY (per-item fieldState support) |
| `studio/src/aem/aem-tag-picker-field.js` | MODIFY (override CSS styling, per-tag field state) |
| `studio/src/utils/field-state.js` | CREATE (shared utility for per-item override detection) |
| `studio/src/fields/secure-text-field.js` | MODIFY (override CSS for shadow DOM) |
| `studio/src/fields/plan-type-field.js` | MODIFY (override CSS for shadow DOM) |
| `studio/src/fields/addon-field.js` | MODIFY (override CSS for shadow DOM) |
| `studio/src/fields/included-field.js` | MODIFY (override CSS for .included-preview) |
| `studio/src/editors/variant-picker.js` | MODIFY (override CSS for Template picker) |

### CSS `--mod-*` Tokens Used

| Component | Token | Value |
|-----------|-------|-------|
| sp-textfield | `--mod-textfield-border-color` | `var(--spectrum-blue-400)` |
| sp-textfield | `--mod-textfield-background-color` | `var(--spectrum-blue-100)` |
| sp-picker | `--mod-picker-border-color-default` | `var(--spectrum-blue-400)` |
| sp-picker | `--mod-picker-background-color-default` | `var(--spectrum-blue-100)` |
| sp-switch | `--mod-switch-background-color-selected-default` | `var(--spectrum-blue-500)` |
| sp-tag | `--mod-tag-border-color` | `var(--spectrum-blue-400)` |
| sp-tag | `--mod-tag-background-color` | `var(--spectrum-blue-100)` |

---

## Notes

- **Approach Change**: Using `--mod-*` CSS custom properties instead of custom components
- Existing `getFieldState()` logic handles all field state detection
- Existing `resetFieldToParent()` method handles restore action
- `sp-icon-unlink` is already imported in swc.js
- Run linter after all changes
- Commit after Phase 3 completes for MVP delivery
