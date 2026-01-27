# Feature Specification: Form Field Status Indicators in Fragment Editor

**Feature Branch**: `MWPW-183261`
**Created**: 2026-01-08
**Status**: Draft
**Jira**: [MWPW-183261](https://jira.corp.adobe.com/browse/MWPW-183261)
**Input**: Add form field status indicators to M@S Studio fragment editor so users clearly understand field states (changed/overridden/inherited)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Identify Overridden Fields at a Glance (Priority: P1)

As a content author editing a locale variation in MAS Studio, I need to quickly see which fields I have overridden from the parent fragment, so that I understand what content is unique to this locale versus what is inherited.

**Why this priority**: This is the core feature request - understanding field state is essential for managing locale variations without confusion.

**Independent Test**: Can be tested by opening a variation fragment, modifying a field, and verifying the visual indicator appears.

**Acceptance Scenarios**:

1. **Given** a content author is editing a locale variation fragment, **When** they modify a field value different from the parent, **Then** that field displays a blue left border indicating it is overridden
2. **Given** a field is marked as overridden, **When** the author views the field, **Then** they see an "Overridden. Click to restore." link with an undo icon below the field
3. **Given** multiple fields are overridden, **When** the author scans the form, **Then** all overridden fields are visually distinguishable from inherited fields

---

### User Story 2 - Restore Field to Parent Value (Priority: P1)

As a content author who has overridden a field in a variation, I need to easily restore that field to the parent value, so that I can undo changes without manually looking up and copying the parent value.

**Why this priority**: Restoring fields is the primary action users take when they see an overridden indicator - the indicator without a restore action provides incomplete value.

**Independent Test**: Can be tested by clicking the restore link on an overridden field and verifying the field reverts to parent value.

**Acceptance Scenarios**:

1. **Given** a field is marked as overridden, **When** the author clicks "Overridden. Click to restore.", **Then** the field value is reset to match the parent fragment
2. **Given** a field has been restored, **When** the restore action completes, **Then** the blue override indicator disappears
3. **Given** a field has been restored, **When** the author views the field, **Then** it displays the inherited parent value

---

### User Story 3 - Inherited Fields Show Normal Appearance (Priority: P2)

As a content author viewing a locale variation, I need inherited fields (fields using parent values) to appear with normal styling, so that I can focus on the fields that need attention rather than being distracted by unnecessary visual elements.

**Why this priority**: Normal appearance for inherited fields is the default state that complements the overridden state - less critical since it requires no special handling.

**Independent Test**: Can be tested by opening a variation fragment with no local changes and verifying all fields appear without override indicators.

**Acceptance Scenarios**:

1. **Given** a content author is editing a variation fragment, **When** a field has no local value (uses parent value), **Then** the field displays with normal appearance and no override indicator
2. **Given** a field value matches the parent value exactly, **When** the author views the field, **Then** no override indicator is shown

---

### Edge Cases

- What happens when the parent value is empty and the variation also has no value? → **Treated as inherited** (no override indicator shown)
- How does the indicator behave for multifield components (arrays of values)? → **Per-item detection**: Each item is compared individually with parent at same index. Only items that differ show override styling. New items (index beyond parent array) are marked overridden.
- What happens when a field is overridden but the variation value happens to match the parent value (explicitly set to same value)? → **Shows as same-as-parent** (no override indicator) - values are compared, not whether field was "touched"
- How do rich text fields (RTE) display the override indicator given their more complex structure? → **RTE uses mnemonic-field pattern**: The `mnemonic-field.js` component has its own `:host([data-field-state='overridden'])` CSS styling for the preview area

## Requirements *(mandatory)*

### Functional Requirements

**Visual Override Indicator**
- **FR-001**: System MUST display a blue left border (spectrum-blue-400) and blue background tint (spectrum-blue-100) on form field groups that have overridden values (different from parent)
- **FR-002**: System MUST display an unlink icon (sp-icon-unlink) and "Overridden. Click to restore." link below overridden fields
- **FR-003**: System MUST NOT display override indicators on fields that are inherited (using parent value)
- **FR-004**: System MUST apply override styling consistently across all field types (text inputs, dropdowns, rich text editors, tags, toggles, multifields)

**Restore Functionality**
- **FR-005**: System MUST restore field to parent value when user clicks the restore link
- **FR-006**: System MUST remove override indicator immediately after field is restored
- **FR-007**: System MUST show a confirmation toast message when field is successfully restored

**Field State Detection**
- **FR-008**: System MUST detect when a field value differs from the parent fragment value
- **FR-009**: System MUST treat empty child field values as "inherited" (not overridden)
- **FR-010**: System MUST handle rich text content comparison correctly (accounting for formatting normalization)

### Key Entities

- **Fragment**: Content unit with fields that can be edited; variations inherit from parent fragments
- **Field State**: The relationship between a variation's field value and its parent (inherited, overridden, same-as-parent)
- **Parent Fragment (Locale Default)**: The base fragment from which variations inherit default values

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Content authors can identify all overridden fields in a variation within 5 seconds of opening the editor
- **SC-002**: 100% of field types (text, picker, RTE, tags, toggles, multifields) support visual override indicators
- **SC-003**: Content authors can restore a field to parent value with a single click
- **SC-004**: Zero false positives - inherited fields never show override indicators
- **SC-005**: Zero false negatives - all overridden fields display override indicators

## References

- **Figma Design**: https://www.figma.com/design/GDDRLo3S7fz0SMRefpJOpx/M-Studio?node-id=7961-29902
- **Form Field States Image**: Attached to Jira ticket MWPW-183261

## Clarifications

### Session 2026-01-08

- Q: Which icon to use for the override indicator? → A: Use `sp-icon-unlink` (already imported in swc.js line 100)
- Q: Is the override indicator only for variations? → A: Yes, only shows on overridden fields in locale variations (not base fragments)
- Q: What visual styling for overridden fields? → A: Blue left border (spectrum-blue-400) + blue background tint (spectrum-blue-100). Applies to all field types including mnemonics/visuals, tags, and toggles.
- Q: How should tags override detection work? → A: Tags are overridden if the current fragment's tags differ from the parent's tags in any way (compare tag IDs).

### Session 2026-01-12

- Q: Implementation approach for override styling? → A: Use Spectrum Web Components `--mod-*` CSS custom properties (the official styling API) instead of creating custom wrapper components. This is the correct, supported way to restyle SWC components.
- Q: Which components need override styling? → A: sp-textfield, sp-picker, sp-switch, sp-tag (all four shown in Figma design)
- Q: Exact color tokens for override styling? → A: Use `--spectrum-blue-400` for borders, `--spectrum-blue-100` for backgrounds (matches existing codebase patterns in style.css:856-857)

### Session 2026-01-13

- Q: CSS selectors not matching components? → A: Changed from parent-based selectors (`sp-field-group[data-field-state='overridden'] sp-textfield`) to direct component selectors (`sp-textfield[data-field-state='overridden']`). The `data-field-state` attribute is placed directly on components, not parent field groups.
- Q: Mnemonics highlighting ALL items when any differs? → A: Mnemonics are stored as parallel arrays (`mnemonicIcon`, `mnemonicAlt`, etc.). Implemented per-item override detection by calculating `fieldState: 'overridden'` for each mnemonic individually in `get mnemonics()` getter, comparing each item's icon with parent at same index.
- Q: How to pass per-item fieldState to multifield children? → A: Add `fieldState` property to each mnemonic object in the value array. Updated `multifield.js` to use item's `fieldState` if present (skip setting as HTML attribute, handled separately).

### Session 2026-01-13 (Composite Fields)

- Q: Why are `getQuantityComponentState()` and `getBadgeComponentState()` needed separately from `getFieldState()`?
  → A: Quantity and badge are "composite fields" - they store multiple values in a single HTML element:
    - Quantity: `<merch-quantity-select title="..." min="..." step="...">` has 3 editable components
    - Badge: `<merch-badge background-color="..." border-color="...">Text</merch-badge>` has 3 editable components
  → Per-component state detection allows users to override just one component (e.g., badge text) while keeping others inherited (e.g., badge color)

- Q: Why are some methods private (#) and others public?
  → A: Private methods (`#parseQuantityHtml`, `#parseBadgeHtml`, `#getCompositeComponentState`, `#renderOverrideIndicatorLink`) are internal helpers.
  → Public methods are called from templates: `getQuantityComponentState()`, `getBadgeComponentState()`, `renderQuantityComponentOverrideIndicator()`, etc.

- Q: Can composite field methods be consolidated?
  → A: Yes, a generic `#getCompositeComponentState(fieldName, parser, component)` can handle both quantity and badge. Simplifies `getQuantityComponentState()` and `getBadgeComponentState()` to one-liners.

### Session 2026-01-20

- Q: Variant picker value not updating when changed in variation? → A: Root cause is **decoupled state** between `variant-picker.value` property and `sp-picker`'s internal state. When user changes sp-picker, the change event fires but `variant-picker.value` still has the old value. Fix: add `@change` handler in variant-picker that syncs the value: `#handleChange(e) { this.value = e.target.value; }`. Also need `reflect: true` for the attribute to update.

## Assumptions

- Override indicators only apply when editing a locale variation (not the base/parent fragment)
- The existing field state detection logic (`getFieldState()` in fragment.js) correctly identifies inherited vs overridden fields
- The `sp-icon-unlink` Spectrum icon is used for the override indicator (already imported in swc.js line 100)
- Override styling uses Spectrum tokens: border (--spectrum-blue-400), background (--spectrum-blue-100)
- Disabled/non-editable field state is out of scope for this ticket (no fields currently need this state)
- Composite fields (quantity, badge) require per-component state detection because multiple values are stored in a single HTML element
