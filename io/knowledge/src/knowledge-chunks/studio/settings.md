# Settings

## What Are Settings

Settings are global configuration fragments that control surface-wide and locale-wide behavior in MAS. Unlike cards and collections which represent individual content pieces, settings define shared parameters that affect how content is rendered, filtered, and displayed across an entire surface.

Settings are stored as content fragments in Odin, scoped by surface and locale. They are managed through Studio's Settings page, which is available to power users.

## Navigating to Settings

1. Open MAS Studio.
2. Select the target surface from the surface picker.
3. Click "Settings" in the left side navigation (appears near the bottom of the nav).
4. The Settings page loads with a table of all settings for the current surface.

The Settings page is only visible to users with power user permissions.

## Settings Table

The Settings table displays all configuration fragments for the current surface. Each row represents a setting with its key, value, status, and metadata.

The table supports:
- Sorting by column headers.
- Viewing setting values inline.
- Action menus for each row.

## Field Types

Settings support multiple field types depending on the configuration parameter:

| Field Type | Description | Example Usage |
|------------|-------------|---------------|
| **Text** | Simple text input | Labels, titles, custom strings |
| **Picker** | Dropdown selection from predefined options | Theme selection, display mode |
| **Tag Picker** | AEM tag selector with namespace browsing | Category tags, filter tags |
| **Tree Picker** | Hierarchical tree selection | Taxonomy navigation, nested categories |
| **Quantity Select** | Numeric input with increment/decrement | Item counts, display limits |

## Creating a Setting

1. Click the "Create" button on the Settings page.
2. A creation dialog opens.
3. Select the surface and locale for the setting.
4. Fill in the required fields based on the setting definition.
5. Click "Save" to create the setting as a draft.

Settings are defined by setting name definitions that specify which fields are available and what type each field uses. The available settings depend on the surface.

## Editing a Setting

1. Double-click a setting row in the table, or select "Edit" from the row's action menu.
2. The settings editor opens with the current values loaded.
3. Modify fields as needed.
4. Click "Save" to persist changes.

### Field Overrides

When editing a setting that inherits from a parent (e.g., a regional setting inheriting from the language default):

- **Overridden fields** are highlighted with a blue left border.
- A "Click to restore" link appears on overridden fields.
- Clicking restore resets the field to the parent's value.

This allows regional settings to customize only what differs while inheriting the rest.

## Publishing a Setting

1. Select the setting in the table.
2. Click the action menu on the setting row.
3. Select "Publish."
4. The setting status changes from Draft to Published.

Published settings take effect immediately for all content rendered on the associated surface and locale.

## Deleting a Setting

1. Select the setting in the table.
2. Click the action menu on the setting row.
3. Select "Delete."
4. Confirm the deletion in the dialog.

Some settings have delete-blocked statuses that prevent deletion. If the delete option is disabled, check the setting's status to understand why.

## Version History

Settings track version history like other fragments in AEM. Each save creates a new version that can be reviewed. The version history shows:
- Who made the change.
- When the change was made.
- What fields were modified.

## Quick Actions

The settings editor provides a quick actions toolbar with the following operations:

| Action | Description |
|--------|-------------|
| Save | Persist current changes as a draft |
| Publish | Make the setting live |
| Unpublish | Revert to draft status |
| Delete | Remove the setting |
| Duplicate | Create a copy of the setting |
| Discard | Revert unsaved changes |

## Setting Name Definitions

Each setting has a name definition that determines:
- The human-readable display label.
- The field type (text, picker, tag picker, etc.).
- The default value.
- Validation rules.

These definitions are shared between Studio and the I/O Runtime pipeline, ensuring consistency between what authors configure and what the rendering engine applies.

## Common Settings

Settings vary by surface, but common configuration parameters include:

- **Display preferences**: How cards render (grid density, sort order).
- **Filter configuration**: Which filter options appear on catalog pages.
- **Locale overrides**: Regional display customizations.
- **Feature flags**: Enable or disable surface-specific features.

## Troubleshooting

**Setting not appearing on the live site:**
Verify the setting is published. Draft settings are not applied to the rendering pipeline.

**Cannot delete a setting:**
Some statuses block deletion. Check the setting's status and resolve any blocking conditions before attempting to delete.

**Setting values not taking effect:**
Ensure the setting is for the correct surface and locale combination. Settings are scoped and only apply to content matching their surface/locale path.

**Field type not editable:**
Some fields may be read-only depending on the setting definition. Verify you have the correct permissions and that the field type supports editing.

**Settings page not visible:**
The Settings page requires power user permissions. Contact your admin to verify your IAM group membership includes the appropriate power user role.
