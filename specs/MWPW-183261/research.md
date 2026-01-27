# Research: Form Field Status Indicators

**Feature**: MWPW-183261
**Date**: 2026-01-08
**Status**: Complete

## Summary

This document captures the technical research findings for implementing form field status indicators in the MAS Studio fragment editor.

---

## 1. Existing Field State Detection

### Decision: Use existing `getFieldState()` from fragment.js

**Location**: `/studio/src/aem/fragment.js` (lines 184-227)

**Rationale**: The codebase already has comprehensive field state detection that correctly identifies:
- `inherited` - Field is empty, uses parent value
- `same-as-parent` - Field explicitly set to same value as parent
- `overridden` - Field explicitly set to different value than parent
- `no-parent` - Not a variation or parent doesn't exist

**Alternatives Considered**:
- Creating new detection logic → Rejected: Would duplicate existing functionality (violates Constitution IV)
- Modifying fragment.js → Rejected: No changes needed, existing logic is correct

**Key Code**:
```javascript
// fragment.js - getFieldState()
getFieldState(fieldName, parentFragment, isVariation) {
    if (!isVariation || !parentFragment) return 'no-parent';

    const ownField = this.getField(fieldName);
    const parentField = parentFragment.getField(fieldName);

    // Empty own field = inherited
    if (!ownField?.values?.length) return 'inherited';

    // Compare normalized values
    const ownNormalized = normalizeValues(ownField.values);
    const parentNormalized = normalizeValues(parentField?.values || []);

    return arraysEqual(ownNormalized, parentNormalized)
        ? 'same-as-parent'
        : 'overridden';
}
```

---

## 2. Current Override Indicator Implementation

### Decision: Enhance existing `renderOverrideIndicator()` method

**Location**: `/studio/src/editors/merch-card-editor.js` (lines 108-129)

**Current Implementation**:
```javascript
renderOverrideIndicator(fieldName) {
    if (this.isVariation && !this.localeDefaultFragment) {
        return nothing;
    }
    const state = this.getFieldState(fieldName);
    const isOverridden = state === 'overridden';
    return html`
        <div class="field-reset-link">
            ${isOverridden
                ? html`<a href="javascript:void(0)" @click=${...}>
                      ↩ Overridden. Click to restore.
                  </a>`
                : nothing}
        </div>
    `;
}
```

**Rationale**: The method structure is correct but needs:
1. Icon addition (`sp-icon-unlink`)
2. Enhanced styling
3. Better CSS class naming

**Alternatives Considered**:
- Creating a new component → Rejected: Over-engineering for simple HTML (violates Constitution VIII)
- Moving to separate file → Rejected: Indicator is tightly coupled to editor

---

## 3. Visual Indicator Strategy

### Decision: Use CSS data attributes on `sp-field-group` elements

**Rationale**:
- All form fields in the editor are already wrapped in `sp-field-group`
- Data attributes provide semantic meaning and are DevTools-friendly
- CSS attribute selectors work reliably without shadow DOM complications
- No DOM restructuring needed (minimal change)

**Implementation Pattern**:
```javascript
<sp-field-group data-field-state="${this.getFieldState('fieldName')}">
    ...field content...
</sp-field-group>
```

**Styling**:
```css
sp-field-group[data-field-state="overridden"] {
    border-left: 3px solid var(--spectrum-blue-400);
    background-color: var(--spectrum-blue-100);
    padding-left: 12px;
    margin-left: -15px;
    border-radius: 4px;
}
```

**Alternatives Considered**:
- CSS classes → Acceptable but less semantic than data attributes
- New wrapper component → Rejected: Would require restructuring entire template
- Inline styles → Rejected: Violates Constitution VI (no inline styles)

---

## 4. Spectrum Icon Usage

### Decision: Use `sp-icon-unlink` for restore action

**Location**: Already imported in `/studio/src/swc.js` (line 99)

**Rationale**:
- Icon is already available in the bundle
- Semantic meaning matches action (undo/restore)
- Figma design shows an undo-style icon

**Usage**:
```javascript
html`<sp-icon-unlink></sp-icon-unlink>`
```

**Alternatives Considered**:
- `sp-icon-refresh` → Less semantic for "restore" action
- Custom SVG → Unnecessary, standard icon available
- Text-only → Less visually clear per Figma design

---

## 5. Field Types Analysis

### Decision: Apply indicators to all field types uniformly

**Field Types in Editor**:

| Type | Component | Field Group ID |
|------|-----------|----------------|
| Text | `sp-textfield` | cardName, etc. |
| Picker | `sp-picker` | variant, style, badgeBackgroundColor |
| RTE | `rte-field` | cardTitle, description, footer |
| Tags | `aem-tag-picker-field` | tags |
| Toggle | `sp-switch` | various |
| Multifield | `mas-multifield` | mnemonics, includedItems |

**Rationale**: The `data-field-state` attribute approach works uniformly across all field types because:
- All fields are wrapped in `sp-field-group`
- CSS selector applies regardless of child content
- `getFieldState()` works for any field name

---

## 6. Edge Cases Resolution

### Empty Parent and Child Values
- **Behavior**: Both empty = `inherited` state (no indicator)
- **Rationale**: Existing `getFieldState()` handles this correctly

### Same Value Explicitly Set
- **Behavior**: Returns `same-as-parent` (no indicator shown)
- **Rationale**: Visually same as inherited - user doesn't need to see override since values match

### Multifield Arrays
- **Behavior**: Compares arrays element-by-element after normalization
- **Rationale**: Existing logic handles array comparison correctly

### RTE Content
- **Behavior**: Normalizes HTML (removes role/aria attributes, NFC normalization)
- **Rationale**: Prevents false positives from formatting differences

---

## 7. Performance Considerations

### Decision: No performance concerns

**Analysis**:
- `getFieldState()` is called per field during render (already happening)
- CSS attribute selectors are fast (browser-optimized)
- No additional DOM queries or observers needed
- Change is purely additive to existing render cycle

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| `fragment.js` getFieldState() | Existing | No changes needed |
| `sp-icon-unlink` | Existing | Already imported in swc.js |
| Spectrum tokens | Existing | --spectrum-blue-600, --spectrum-blue-700 |
| `resetFieldToParent()` | Existing | Already implemented (lines 93-106) |

---

## Unresolved Questions

None. All technical decisions are resolved.

---

## 8. Spectrum Web Components `--mod-*` Tokens (Updated 2026-01-12)

### Decision: Use official `--mod-*` CSS custom properties instead of custom components

**Previous Approach (Rejected)**: Created a custom `mas-textfield` component to wrap native `<input>` with custom styling. This approach bypassed Spectrum's styling system and required maintaining a separate component.

**New Approach (Approved)**: Use Spectrum's official `--mod-*` CSS custom properties to override component styling. This is the supported API for customizing SWC components.

### Available `--mod-*` Tokens by Component

**Color Values Used (consistent with existing codebase patterns):**
- **Border color**: `--spectrum-blue-400` (rgb: 18, 45, 154 in dark theme)
- **Background color**: `--spectrum-blue-100` (rgb: 14, 23, 63 in dark theme)
- **Track color (switch)**: `--spectrum-blue-500` (rgb: 26, 58, 195 in dark theme)

**sp-textfield:**
```css
--mod-textfield-border-color: var(--spectrum-blue-400);
--mod-textfield-background-color: var(--spectrum-blue-100);
```

**sp-picker:**
```css
--mod-picker-border-color-default: var(--spectrum-blue-400);
--mod-picker-background-color-default: var(--spectrum-blue-100);
```

**sp-switch:**
```css
--mod-switch-background-color-selected-default: var(--spectrum-blue-500);
--mod-switch-handle-border-color-selected-default: var(--spectrum-blue-500);
```

**sp-tag:**
```css
--mod-tag-border-color: var(--spectrum-blue-400);
--mod-tag-background-color: var(--spectrum-blue-100);
```

### Implementation Strategy

Apply `--mod-*` properties via CSS classes on wrapper elements or directly on component hosts:

```css
/* Overridden field state styling */
.field-overridden sp-textfield {
    --mod-textfield-border-color: var(--spectrum-blue-400);
    --mod-textfield-background-color: var(--spectrum-blue-100);
}

.field-overridden sp-picker {
    --mod-picker-border-color-default: var(--spectrum-blue-400);
    --mod-picker-background-color-default: var(--spectrum-blue-100);
}

.field-overridden sp-switch[checked] {
    --mod-switch-background-color-selected-default: var(--spectrum-blue-500);
}

.field-overridden sp-tag {
    --mod-tag-border-color: var(--spectrum-blue-400);
    --mod-tag-background-color: var(--spectrum-blue-100);
}
```

### Work to Revert

The following files created during the previous approach should be removed or reverted:

1. **Delete**: `studio/src/fields/mas-textfield.js` - Custom textfield component no longer needed
2. **Revert**: `studio/src/swc.js` - Remove `mas-textfield` import
3. **Revert**: `studio/src/editors/merch-card-editor.js` - Replace `<mas-textfield>` with `<sp-textfield>` and apply CSS classes

### References

- Spectrum CSS Modifiable Properties: Each SWC component uses `var(--mod-*, var(--spectrum-*))` pattern
- Source files inspected:
  - `node_modules/@spectrum-web-components/textfield/src/spectrum-textfield.css.dev.js`
  - `node_modules/@spectrum-web-components/switch/src/spectrum-switch.css.dev.js`
  - `node_modules/@spectrum-web-components/tags/src/spectrum-tag.css.dev.js`
  - `node_modules/@spectrum-web-components/picker/src/spectrum-picker.css.dev.js`
