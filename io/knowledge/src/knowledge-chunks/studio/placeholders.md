# Placeholders

## What Are Placeholders

Placeholders are a key-value translation system for reusable content tokens in MAS. They allow authors to define shared text snippets that can be referenced across multiple cards and collections using double-brace syntax like `{{annual_billed_monthly}}` or `{{device}}`.

Placeholders live as dictionary fragments in Odin (Adobe's content management backend) and are managed through Studio's Placeholders page. Each placeholder is scoped to a specific surface and locale, ensuring the correct value is resolved at runtime depending on where and for whom the content is being served.

Common placeholders include:
- `{{annual_billed_monthly}}` - pricing cadence text
- `{{device}}` - device-specific label
- `{{free_trial_days}}` - trial period length
- `{{see_terms}}` - legal link text

## How Placeholders Work at Runtime

When a card renders on a page, the fragment pipeline processes placeholder tokens in two steps:

1. The pipeline fetches the dictionary fragment for the current surface and locale.
2. Any `{{key}}` tokens in card fields are replaced with the corresponding placeholder value.

This means a single card fragment can display different text per locale without needing separate field values for each region.

## Navigating to Placeholders

1. Open MAS Studio.
2. Select the target surface from the surface picker (e.g., ACOM, CCD).
3. Click "Placeholders" in the left side navigation.
4. The Placeholders page loads with a table of all placeholders for the current surface and locale.

## Browsing Placeholders

The Placeholders page displays a table with the following columns:

| Column | Description |
|--------|-------------|
| Key | The placeholder token name (e.g., `annual_billed_monthly`) |
| Value | The resolved text content (plain text or rich text) |
| Status | Draft or Published |
| Locale | The locale this placeholder belongs to |
| Updated by | The last person who modified the placeholder |
| Date & Time | When the placeholder was last modified |
| Action | Context menu for publish, edit, and delete |

You can sort by any sortable column by clicking the column header. Clicking again toggles between ascending and descending order.

## Searching and Filtering

Use the search bar at the top of the Placeholders page to filter by key or value. The search matches against both the placeholder key and its value content, filtering the table in real time.

Use the Region picker to switch between locales. This reloads the placeholder list for the selected locale.

## Creating a Placeholder

1. Click the "Create New Placeholder" button at the top right of the page.
2. A creation modal opens with the following fields:
   - **Key**: The placeholder token name. Keys are automatically normalized (lowercased, spaces replaced with underscores).
   - **Locale**: The locale for this placeholder (defaults to current locale).
   - **Value**: The text content of the placeholder.
   - **Rich Text toggle**: Switch between plain text and rich text (HTML) editing.
3. Fill in all required fields.
4. Click "Create" to save the new placeholder as a draft.

After creation, the placeholder appears in the table with Draft status.

## Editing a Placeholder

Placeholders support inline editing directly in the table:

1. Find the placeholder you want to edit.
2. Click the edit action (pencil icon) in the row's action menu, or double-click the row.
3. The row switches to edit mode, allowing you to modify the key and value directly.
4. For rich text placeholders, a rich text editor (RTE) appears with formatting controls.
5. Changes are saved when you confirm the edit.

Only one placeholder can be in edit mode at a time. Clicking outside the editing row or pressing Escape cancels the edit.

## Publishing a Placeholder

Publishing makes a placeholder's value available on the live site:

1. Find the placeholder in the table.
2. Click the action menu (three-dot icon) on the placeholder's row.
3. Select "Publish" from the dropdown.
4. The status changes from Draft to Published.

Published placeholders are resolved at runtime when cards render on consumer pages.

## Deleting a Placeholder

1. Find the placeholder in the table.
2. Click the action menu on the placeholder's row.
3. Select "Delete" from the dropdown.
4. A confirmation dialog appears: "Are you sure you want to delete this placeholder? This action cannot be undone."
5. Click "Delete" to confirm.

The placeholder is removed from the dictionary fragment and from the table.

## Bulk Operations

You can select multiple placeholders for bulk actions:

1. Use the checkboxes on the left side of each table row to select placeholders.
2. A selection panel appears at the bottom of the page showing the count of selected items.
3. Available bulk action: **Delete** - removes all selected placeholders after confirmation.

The confirmation dialog shows: "Are you sure you want to delete N placeholder(s)? This action cannot be undone."

During bulk operations, all table checkboxes are temporarily disabled to prevent race conditions.

## Plain Text vs Rich Text

Each placeholder can store either plain text or rich text (HTML):

- **Plain text**: Simple string values. Best for short tokens like pricing labels or product names.
- **Rich text**: HTML content with formatting. Useful for placeholders that include links, bold text, or other markup.

The type is set when creating the placeholder and can be toggled during editing. Rich text placeholders use a ProseMirror-based editor with formatting toolbar.

## Placeholder Usage in Cards

To use a placeholder in a card field, wrap the key in double braces:

```
Starting at {{price}} {{per_month}}
```

At runtime, the fragment pipeline replaces these tokens with the values from the dictionary fragment matching the current surface and locale.

Placeholders can appear in any text field: titles, descriptions, legal text, badge labels, and CTA labels.

## Localization

The `en_US` dictionary is the source of truth for placeholder keys and values. Localized versions of placeholders are created through the GlaaS translation pipeline:

1. Authors create and maintain placeholders in the `en_US` locale.
2. Translation projects bundle placeholders alongside cards and collections for translation.
3. The GlaaS pipeline sends content to translation vendors.
4. Translated values are written back to locale-specific dictionary fragments.

Fallback behavior: if a placeholder key is not found in the current locale's dictionary, the system falls back to the language default (e.g., `en_AU` falls back to `en_US`, `fr_CA` falls back to `fr_FR`).

## Catalog-Specific Placeholders

Some placeholders are used specifically for collection tag filters on catalog pages:

| Placeholder Key | Purpose |
|-----------------|---------|
| `coll-tag-filter-desktop` | Label for the Desktop filter tab in catalog collections |
| `coll-tag-filter-web` | Label for the Web filter tab in catalog collections |
| `coll-tag-filter-mobile` | Label for the Mobile filter tab in catalog collections |

These placeholders control the visible labels on filter pills that users see when browsing product catalogs.

## Troubleshooting

**Placeholder not resolving on the page:**
- Verify the placeholder is published (not just saved as draft).
- Check that the key in the card field matches the dictionary key exactly (case-sensitive).
- Confirm the dictionary fragment exists for the correct surface and locale.
- Check the fragment pipeline response in browser DevTools for replacement errors.

**Placeholder showing `{{key}}` literally:**
- The key does not exist in the dictionary for the current locale.
- The dictionary fragment may not be published.
- There may be a typo in the key name.

**Cannot find a placeholder in the table:**
- Switch to the correct locale using the Region picker.
- Clear the search field to remove any active filters.
- Verify you are on the correct surface.

**Bulk delete not working:**
- Ensure no other operation is in progress (check for loading indicators).
- The system disables checkboxes during pending operations to prevent conflicts.
