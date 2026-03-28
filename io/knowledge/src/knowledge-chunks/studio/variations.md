# Variations

## What Are Variations

Variations are child fragments that extend a parent fragment with locale-specific or audience-specific overrides. They allow authors to maintain a single base card and create targeted versions without duplicating the entire fragment.

MAS Studio supports two variation types: **Regional (Locale)** and **Grouped**.

## Variation Types

### Regional (Locale) Variations

Regional variations create a locale-specific version of a parent fragment. They are used for per-country or per-region content customization.

Key characteristics:
- One variation per locale per parent fragment (no duplicates).
- Inherits all fields from the parent by default.
- Authors override only the fields that differ regionally.
- Available for any locale that shares the same language as the parent.

Example: An `en_US` parent card can have regional variations for `en_GB`, `en_CA`, `en_AU`, and `en_NZ`. It cannot have variations for `fr_FR` or `de_DE` because those are different languages.

### Grouped Variations

Grouped variations create audience-targeted versions of a parent fragment using personalization (PZN) tags. They are used for A/B testing and audience segmentation.

Key characteristics:
- Can only be created from `en_US` fragments.
- Map to PZN tags that determine which audience sees the variation.
- Shared across multiple geos (not locale-specific).
- Cannot be duplicated yet (planned feature MWPW-188623).

Example: A Photoshop card might have a grouped variation targeting "students" with different pricing and messaging, controlled by PZN tags.

## Parent-Child Relationship

The parent fragment is the locale default (e.g., the fragment in `/content/dam/mas/acom/en_US/`). All variations are children of this parent.

When a variation is created:
1. A new fragment is created in the target locale folder (for regional) or the same folder (for grouped).
2. The fragment starts with empty fields, inheriting everything from the parent.
3. The parent's `variations` field is updated to include the new variation's path.

## Field Inheritance

Inheritance is the core mechanism that makes variations efficient. Each field in a variation exists in one of four states:

### Inherited
The variation field is empty. The value is pulled from the parent fragment at runtime. This is the default state for all fields in a newly created variation.

### Same as Parent
The variation has an explicit value that matches the parent exactly. The field has been touched but not changed. Considered localized but not different.

### Overridden
The variation has a different value than the parent. The field shows an "Overridden" indicator with a blue left border in the editor. Can be reset to inherit from the parent.

### No Parent
The fragment is not a variation, or the parent fragment is not available. The field value is used directly with no inheritance logic.

**Rule of thumb:** Empty arrays and empty values mean "inherit from parent." Any explicit value, even if identical to the parent, counts as an override.

## Creating a Regional Variation

1. Open the parent fragment in the fragment editor.
2. Look for the "Create Variation" button in the variations panel.
3. Click it to open the variation dialog.
4. The "Variation type" picker defaults to "Regional."
5. Select a target locale from the dropdown:
   - Only same-language locales appear.
   - Locales that already have a variation are shown as disabled with "(exists)" label.
6. Click "Create variation."
7. A toast notification confirms creation.
8. The new empty variation is created with all fields inherited from the parent.
9. The locale picker automatically switches to the new locale.

After creation, you can edit the variation to override specific fields.

## Creating a Grouped Variation

Grouped variations are only available when the parent fragment is in `en_US`:

1. Open the parent fragment in the fragment editor.
2. Click "Create Variation" to open the variation dialog.
3. Select "Grouped" from the variation type picker.
   - This option only appears for en_US fragments.
4. Use the tag picker to select one or more PZN locale tags.
   - Tags are from the `/content/cq:tags/mas` namespace.
   - At least one tag is required to proceed.
5. Click "Create variation."
6. The system resolves the offer data from the fragment's OSI field.
7. A grouped variation is created with the selected PZN tags.

## Viewing Variations

The variations panel in the fragment editor shows all variations organized in tabs:

| Tab | Content |
|-----|---------|
| **Locale** | Regional variations listed by locale |
| **Promotion** | Promotion-related variations (future feature) |
| **Grouped** | Grouped variations with PZN tag details |

Each variation row shows the fragment as a nested table entry. Double-click a variation row to navigate to that variation's editor.

### Expanding Grouped Variations

Grouped variation rows have an expand/collapse toggle. When expanded, additional details appear:
- **Promo code**: The promotional code associated with the variation.
- **Grouped variation tags**: The PZN tags displayed as read-only tag pills.

## Editing Variations

### Opening a Variation for Editing

1. In the variations panel, double-click the variation row.
2. The editor navigates to the variation's fragment editor.
3. The editor shows all fields with their inheritance state.

### Overriding a Field

1. Find the field you want to customize.
2. Edit the field value.
3. The field border changes to blue, indicating an override.
4. Save the variation to persist the override.

### Resetting a Field to Inherited

1. Find the field with the blue "Overridden" indicator.
2. Click the reset link ("Click to restore" or the reset icon).
3. The field value is cleared, returning to inherited state.
4. Save the variation to persist the reset.

When a field is inherited, changes to the parent's value automatically propagate to the variation.

## Visual Indicators

The editor uses visual cues to communicate field inheritance state:

| Indicator | Meaning |
|-----------|---------|
| Blue left border on field | Field is overridden (has a different value than parent) |
| Gray/neutral field appearance | Field is inherited (using parent's value) |
| "Overridden" label | Explicit label showing the field has been customized |
| "Inherited from base fragment" | Section label for fields using parent values |
| "Overridden in this variation" | Section label for fields with custom values |

## Regional Variation Scope

Regional variations follow a language-hierarchy model:

- The language default fragment (e.g., `en_US` for English, `fr_FR` for French) is the parent.
- Regional variations start from the language default, not from other regions.
- Example: `fr_CH` (Swiss French) inherits from `fr_FR`, not from `en_US`.

This ensures that regional content always makes linguistic sense and inherits from the correct language base.

## Constraints and Limitations

**One variation per locale per fragment:**
You cannot create two regional variations for the same locale on the same parent fragment. If a variation already exists, the locale appears disabled in the creation dialog.

**Grouped variations require en_US:**
The "Grouped" option in the variation type picker only appears when the source fragment is in the `en_US` locale. Other locales only see the "Regional" option.

**No grouped variation duplication:**
Grouped variations cannot be duplicated yet. This is a known limitation tracked in MWPW-188623.

**Variations cannot create their own variations:**
A regional variation cannot spawn sub-variations. The hierarchy is always one level deep: parent to variation.

## Troubleshooting

**"A variation already exists" error:**
Each locale can only have one variation per fragment. Check the variations panel to see if one already exists for your target locale.

**Field not inheriting from parent:**
Check if the field has an explicit value (even an empty string counts as an override). Use the reset action to clear the override and restore inheritance.

**Parent changes not appearing in variation:**
Only inherited (empty) fields pick up parent changes automatically. Overridden fields retain their custom value regardless of parent updates. If you want a field to track the parent again, reset it.

**Variation not appearing in the list:**
Verify the parent's `variations` field contains the variation's path. Check that the variation fragment exists in the correct locale folder.

**Cannot create grouped variation:**
Ensure the fragment is in the en_US locale. Grouped variations are restricted to en_US only.

**Grouped variation tags not saving:**
At least one PZN tag must be selected. If the tag picker shows no tags, verify the `/content/cq:tags/mas` namespace is accessible.
