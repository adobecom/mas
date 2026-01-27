# Implementation Plan: Form Field Status Indicators

**Branch**: `MWPW-183261` | **Date**: 2026-01-08 | **Updated**: 2026-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/MWPW-183261/spec.md`

## Summary

Add visual form field status indicators to the MAS Studio fragment editor to help content authors identify overridden fields when editing locale variations. The implementation uses CSS data attributes on existing `sp-field-group` elements to apply visual styling (blue left border) and enhances the existing override indicator with a Spectrum icon.

## Technical Context

**Language/Version**: Vanilla JavaScript (ES Modules) - Lit web components
**Primary Dependencies**: Lit, Spectrum Web Components (sp-icon-unlink already imported)
**Storage**: N/A (UI-only change, uses existing Fragment/FragmentStore)
**Testing**: Web Test Runner (studio/test/), Playwright NALA (nala/)
**Target Platform**: Web browser (MAS Studio application)
**Project Type**: Web application - Studio UI component
**Performance Goals**: No measurable performance impact (CSS-only visual changes)
**Constraints**: Must work with existing field state detection logic
**Scale/Scope**: Single component modification (merch-card-editor.js)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Architecture Principles | PASS | Using existing Lit patterns, light DOM, Spectrum `--mod-*` tokens |
| II. Clean Code | PASS | Deleting unused `mas-textfield` component, no new dead code |
| III. Generic Over Specific | PASS | Field state handling is generic, no hardcoded values |
| IV. No Logic Duplication | PASS | Using existing `getFieldState()` from fragment.js |
| V. Focused PRs | PASS | Single-purpose: add visual indicators |
| VI. Code Style Standards | PASS | CSS custom properties, Spectrum tokens, no `::part` selectors |
| VII. Testing Standards | PASS | Manual verification steps defined; unit tests optional for UI |
| VIII. Minimal Implementation (YAGNI) | PASS | Minimal CSS + method update, removing unnecessary abstraction |
| IX. Root Cause First | PASS | Using official `--mod-*` API instead of custom workarounds |

### Post-Design Re-Check (2026-01-12)

All principles verified PASS. The new `--mod-*` approach:
- Follows Spectrum WC best practices (Principle VI)
- Removes unnecessary custom component (Principle VIII)
- Uses official styling API instead of workarounds (Principle IX)

## Project Structure

### Documentation (this feature)

```text
specs/MWPW-183261/
├── plan.md              # This file
├── research.md          # Technical findings from codebase exploration
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md  # Quality validation checklist
```

### Source Code (repository root)

```text
studio/src/
├── editors/
│   └── merch-card-editor.js  # PRIMARY: Add data-field-state attributes, update indicator
├── aem/
│   └── fragment.js           # REFERENCE: Existing getFieldState() logic
└── swc.js                    # REFERENCE: sp-icon-unlink already imported
```

**Structure Decision**: This is a UI enhancement to an existing component. All changes are contained within `merch-card-editor.js` - no new files needed.

## Implementation Approach

### Phase 0: Revert Previous Work

Remove the custom `mas-textfield` component created in the previous approach:

1. **Delete file**: `studio/src/fields/mas-textfield.js`
2. **Revert swc.js**: Remove `mas-textfield` import from `studio/src/swc.js`
3. **Revert merch-card-editor.js**: Replace all `<mas-textfield>` back to `<sp-textfield>`

### Phase 1: CSS Styling using `--mod-*` tokens

Use Spectrum's official `--mod-*` CSS custom properties to override component styling. Add styles in merch-card-editor.js:

```css
/* Overridden state - using Spectrum's --mod-* tokens */

/* sp-textfield override styling */
sp-field-group[data-field-state="overridden"] sp-textfield {
    --mod-textfield-border-color: var(--spectrum-blue-400);
    --mod-textfield-background-color: var(--spectrum-blue-100);
}

/* sp-picker override styling */
sp-field-group[data-field-state="overridden"] sp-picker {
    --mod-picker-border-color-default: var(--spectrum-blue-400);
    --mod-picker-background-color-default: var(--spectrum-blue-100);
}

/* sp-switch override styling (when checked/on) */
sp-field-group[data-field-state="overridden"] sp-switch[checked] {
    --mod-switch-background-color-selected-default: var(--spectrum-blue-500);
    --mod-switch-handle-border-color-selected-default: var(--spectrum-blue-500);
}

/* sp-tag override styling */
sp-field-group[data-field-state="overridden"] sp-tag {
    --mod-tag-border-color: var(--spectrum-blue-400);
    --mod-tag-background-color: var(--spectrum-blue-100);
}

/* Status indicator styling */
.field-status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: 12px;
    color: var(--spectrum-blue-700);
}

.field-status-indicator a {
    color: var(--spectrum-blue-700);
    text-decoration: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.field-status-indicator a:hover {
    text-decoration: underline;
}
```

### Phase 2: Update renderOverrideIndicator() Method

Replace the existing method (lines 108-129) with enhanced version:

```javascript
renderFieldStatusIndicator(fieldName) {
    if (this.isVariation && !this.localeDefaultFragment) {
        return nothing;
    }
    const state = this.getFieldState(fieldName);
    if (state !== 'overridden') {
        return nothing;
    }
    return html`
        <div class="field-status-indicator">
            <a href="javascript:void(0)"
               @click=${(e) => {
                   e.preventDefault();
                   this.resetFieldToParent(fieldName);
               }}>
                <sp-icon-unlink></sp-icon-unlink>
                Overridden. Click to restore.
            </a>
        </div>
    `;
}
```

### Phase 3: Add data-field-state Attributes

Update all `sp-field-group` elements in the template to include the state attribute:

```javascript
// Before:
<sp-field-group id="cardName">

// After:
<sp-field-group id="cardName" data-field-state="${this.getFieldState('cardName')}">
```

### Phase 4: CSS Selector Fix (2026-01-13)

Fixed CSS selectors to target components directly instead of using parent-based selectors:

```css
/* Before (didn't work - attribute was on component, not parent) */
sp-field-group[data-field-state="overridden"] sp-textfield { ... }

/* After (works - targets component directly) */
sp-textfield[data-field-state="overridden"] {
    --mod-textfield-border-color: var(--spectrum-blue-400);
    --mod-textfield-background-color: var(--spectrum-blue-100);
}

sp-picker[data-field-state="overridden"] {
    --mod-picker-border-color-default: var(--spectrum-blue-400);
    --mod-picker-background-color-default: var(--spectrum-blue-100);
}

sp-switch[data-field-state="overridden"][checked] {
    --mod-switch-background-color-selected-default: var(--spectrum-blue-500);
    --mod-switch-handle-border-color-selected-default: var(--spectrum-blue-500);
}
```

### Phase 5: Per-Item Override Detection for Mnemonics (2026-01-13)

Mnemonics (visuals) are stored as parallel arrays in AEM fragments:
- `mnemonicIcon`, `mnemonicAlt`, `mnemonicLink`, `mnemonicTooltipText`, `mnemonicTooltipPlacement`

Problem: Using `getFieldState('mnemonicIcon')` highlighted ALL mnemonics when any one differed.

Solution: Calculate per-item override state in the `get mnemonics()` getter:

```javascript
get mnemonics() {
    // ... get effective values ...

    const ownIcons = this.fragment.getField('mnemonicIcon')?.values || [];
    const parentIcons = this.localeDefaultFragment?.getField('mnemonicIcon')?.values || [];

    return mnemonicIcon?.map((icon, index) => {
        const mnemonic = {
            icon,
            alt: mnemonicAlt[index] ?? '',
            link: mnemonicLink[index] ?? '',
            mnemonicText: mnemonicTooltipText[index] ?? '',
            mnemonicPlacement: mnemonicTooltipPlacement[index] ?? 'top',
        };

        // Only add fieldState if overridden
        if (this.effectiveIsVariation && this.localeDefaultFragment) {
            const ownIcon = ownIcons[index];
            const parentIcon = parentIcons[index];
            if (ownIcon !== undefined && ownIcon !== '' &&
                (index >= parentIcons.length || ownIcon !== parentIcon)) {
                mnemonic.fieldState = 'overridden';
            }
        }

        return mnemonic;
    }) ?? [];
}
```

Then in `multifield.js`, use the item's `fieldState` if present:

```javascript
renderField(field, index) {
    // ... clone template ...
    Object.keys(field).forEach((key) => {
        if (key !== 'fieldState') {
            fieldEl.setAttribute(key, field[key]);
        }
    });
    const fieldState = field.fieldState || this.getAttribute('data-field-state');
    if (fieldState) {
        fieldEl.setAttribute('data-field-state', fieldState);
    }
    // ...
}
```

### Phase 6: Code Consolidation (2026-01-13)

#### A. Override Indicator Rendering Consolidation ✅ DONE

5 methods rendered identical HTML. Created `#renderOverrideIndicatorLink(resetCallback)`:

```javascript
#renderOverrideIndicatorLink(resetCallback) {
    return html`
        <div class="field-status-indicator">
            <a href="javascript:void(0)" @click=${(e) => { e.preventDefault(); resetCallback(); }}>
                <sp-icon-unlink></sp-icon-unlink>
                Overridden. Click to restore.
            </a>
        </div>
    `;
}

// All 5 methods now use the helper:
renderFieldStatusIndicator(fieldName) {
    if (!this.effectiveIsVariation) return nothing;
    if (this.getFieldState(fieldName) !== 'overridden') return nothing;
    return this.#renderOverrideIndicatorLink(() => this.resetFieldToParent(fieldName));
}
```

#### B. Mnemonics Field State Utility ✅ DONE

Added `getItemFieldStateByIndex()` to `studio/src/utils/field-state.js`:

```javascript
export function getItemFieldStateByIndex(currentValue, parentValues = [], index) {
    if (!parentValues || parentValues.length === 0) return '';
    if (!currentValue) return '';
    if (index >= parentValues.length) return 'overridden';
    return currentValue === parentValues[index] ? '' : 'overridden';
}
```

#### C. Composite Field State Consolidation ✅ DONE

`getQuantityComponentState()` and `getBadgeComponentState()` consolidated into shared helper:

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

getQuantityComponentState(component) {
    return this.#getCompositeComponentState(QUANTITY_MODEL, this.#parseQuantityHtml.bind(this), component);
}

getBadgeComponentState(fieldName, component) {
    return this.#getCompositeComponentState(fieldName, this.#parseBadgeHtml.bind(this), component);
}
```

### Phase 7: Fix Variant Picker Value Binding (2026-01-20)

The variant-picker `value` attribute wasn't updating when changed in variations.

**Root Cause**: The `variant-picker.value` reactive property was decoupled from `sp-picker`'s internal state. When user changes sp-picker, the change event fires but `variant-picker.value` still had the old value because nothing synced it.

**Solution**: Add `@change` handler in variant-picker that syncs the value when sp-picker changes.

**Fixes applied**:
```javascript
// variant-picker.js - add change handler to sync value
#handleChange(e) {
    this.value = e.target.value;
}

render() {
    return html`<sp-picker
        ...
        @change=${this.#handleChange}
    >
        ${this.variants}
    </sp-picker>`;
}

// variant-picker.js:102 - reflect: true for attribute to update
static properties = {
    value: { type: String, reflect: true },
    ...
};

// merch-card-editor.js:623 - property binding
.value="${form.variant.values[0]}"

// merch-card-editor.js:634 - property binding
.value="${form.style?.values[0] || 'default'}"
```

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `studio/src/fields/mas-textfield.js` | DELETE | Remove custom textfield component |
| `studio/src/swc.js` | REVERT | Remove `mas-textfield` import |
| `studio/src/editors/merch-card-editor.js` | MODIFY | 1) Replace `<mas-textfield>` with `<sp-textfield>`, 2) Add CSS `--mod-*` styles for override state, 3) Update `renderOverrideIndicator()` to `renderFieldStatusIndicator()`, 4) Add `data-field-state` to all field groups, 5) Per-item fieldState in `get mnemonics()`, 6) `#renderOverrideIndicatorLink()` consolidation, 7) `#getCompositeComponentState()` consolidation |
| `studio/src/fields/multifield.js` | MODIFY | Use item's `fieldState` property if present |
| `studio/src/aem/aem-tag-picker-field.js` | MODIFY | Add `:host([data-field-state='overridden'])` CSS for tag styling |
| `studio/src/utils/field-state.js` | CREATE | Shared utilities: `getItemFieldState()`, `getItemFieldStateByIndex()` |
| `studio/src/editors/variant-picker.js` | MODIFY | Change attribute binding to property binding for sp-picker value |

## Complexity Tracking

No constitution violations. This is a minimal implementation:
- Reuses existing `getFieldState()` logic
- Updates one existing method
- Uses Spectrum's official `--mod-*` CSS custom properties (supported API)
- Removes unnecessary custom component (`mas-textfield`)
- No new files or abstractions needed

### Approach Change (2026-01-12)
- **Previous**: Created custom `mas-textfield` component with custom CSS
- **New**: Use Spectrum `--mod-*` tokens on native SWC components
- **Reason**: `--mod-*` is the official, supported API for restyling Spectrum Web Components

## Build Process (MAS-specific)

After changes to `studio/src/editors/merch-card-editor.js`:

```bash
cd studio && npm run build && npm run test
cd .. && npm run lint
```

## Verification Steps

1. Start MAS Studio locally (`npm run studio`)
2. Open a locale variation fragment in the editor
3. Verify inherited fields show normal appearance
4. Modify a field value to be different from parent
5. Verify blue left border appears on the field group
6. Verify "Overridden. Click to restore." link appears with undo icon
7. Click restore link and verify field reverts to parent value
8. Verify override indicator disappears after restore
