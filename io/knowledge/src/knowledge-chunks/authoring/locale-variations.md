# Regional/Locale Variations

## Overview

Regional variations allow creating localized versions of content fragments for different locales. A parent fragment (locale default, e.g., en_US) can have multiple child variations (e.g., en_GB, en_CA) that inherit content while allowing regional overrides.

## Key Concepts

### Parent vs. Variation
- **Parent Fragment**: The locale default fragment (e.g., in \`/content/dam/mas/acom/en_US/\`)
- **Variation Fragment**: Regional copy that inherits from parent (e.g., in \`/content/dam/mas/acom/en_GB/\`)
- One variation per locale per fragment (no duplicates allowed)

### Same-Language Variations Only
Variations can only be created for locales with the same language:
- \`en_US\` can have variations: \`en_GB\`, \`en_CA\`, \`en_AU\`
- \`en_US\` CANNOT have variations: \`fr_FR\`, \`de_DE\`, \`ja_JP\`

This ensures content makes linguistic sense across variations.

## Field Inheritance States

Each field in a variation has one of four states:

### 1. inherited
- Variation field is empty/blank
- Value comes from parent fragment at runtime
- UI shows parent's value but indicates it's inherited

### 2. same-as-parent
- Variation has explicit value
- Value matches parent exactly
- Considered localized but not different

### 3. overridden
- Variation has different value than parent
- Shows "Overridden" indicator in UI
- Can be reset to inherit from parent

### 4. no-parent
- Fragment is not a variation
- Or parent fragment not available
- Field value is direct (no inheritance)

## Creating a Variation

### Via UI
1. Open the parent fragment in editor
2. Click "Create Variation" in the variations panel
3. Select target locale from dropdown
   - Only same-language locales shown
   - Already-existing variations are disabled
4. Click "Create variation"
5. Empty variation is created (all fields inherited)
6. Edit specific fields as needed for regional content

### What Happens Technically
1. New fragment created in target locale folder (same name)
2. Fragment starts with no content fields (empty)
3. At runtime, empty fields inherit from parent
4. Parent's \`variations\` field updated with new variation path

## Editing Variations

### Override a Field
1. Open variation in editor
2. Edit the field you want to localize
3. Field state changes to "overridden"
4. Save to persist the override

### Reset to Parent (Remove Override)
1. Find the field with "↩ Overridden" indicator
2. Click the reset icon
3. Field is removed from variation (returns to inherited)
4. Save to persist

## Common Use Cases

### Regional Pricing/CTAs
- Parent (US): "Buy now for \$9.99/mo"
- UK Variation: Override price field → "Buy now for £7.99/mo"
- Other fields inherit (title, description, etc.)

### Regional Legal Text
- Parent: Standard US disclaimer
- Variation: Override footer with region-specific legal text

## Best Practices

1. **Keep parent complete** - Parent should have all content
2. **Override sparingly** - Only override what truly differs regionally
3. **Reset when possible** - If override becomes same as parent, reset it
4. **Check inheritance** - Before editing, understand if value is inherited

## Troubleshooting

**"A variation already exists"**
- Each locale can only have one variation per fragment
- Cannot create duplicate variations

**Field not inheriting**
- Check if field has an explicit value (even empty string)
- Use reset to clear override

**Parent changes not reflected in variation**
- Overridden fields don't update
- Only inherited (empty) fields pick up parent changes

**Variation not showing in list**
- Check parent's \`variations\` field contains variation path
- Verify variation exists in correct locale folder
