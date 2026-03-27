# Version History

## Overview

Version History allows authors to view, restore, and manage different versions of content fragments in M@S Studio. Every save creates a version checkpoint that can be accessed later.

## Accessing Version History

1. Open a fragment in the editor
2. Click the History icon (clock) in the side navigation panel
3. Version History panel opens on the right side (292px width)

## Version Panel Features

### Version List
- Displays all versions sorted by creation date (newest first)
- Shows "Latest version" badge for the most recent version
- Each version shows:
  - Version title or "Version X" if untitled
  - Creation date and time
  - Author who created the version
  - Optional comment/description

### Visual Indicators
- Latest version: Green border with "Latest version" badge
- Selected version: Blue left border with light blue background
- Hover: Subtle shadow effect

## Version Operations

### Restore a Version
1. Click on any version in the list, OR
2. Click the three-dot menu (⋮) → "Restore this version"
3. The selected version's content loads into the editor
4. Review the restored content
5. Click "Save" to apply the restored version

**Important**: Restoring a version does NOT automatically save. It loads the historical content into the editor where you can review and then save.

### Edit Version Metadata
1. Click the three-dot menu (⋮) on any version
2. Select "Edit name/comment"
3. Update the title and/or comment
4. Click "Save"

This helps organize versions with meaningful names like "Q4 Campaign Launch" or "Price Update December 2024".

### Copy Version Link
1. Click the three-dot menu (⋮) on any version
2. Select "Copy link"
3. Link is copied to clipboard for sharing

## AEM API Endpoints

### List Versions
\`\`\`
GET /adobe/sites/cf/fragments/{fragmentId}/versions
Query params: limit, offset, sort (e.g., 'created:desc')
\`\`\`

### Get Specific Version
\`\`\`
GET /adobe/sites/cf/fragments/{fragmentId}/versions/{versionId}
\`\`\`

### Create Version
\`\`\`
POST /adobe/sites/cf/fragments/{fragmentId}/versions
Body: { "label": "...", "comment": "..." }
\`\`\`

### Update Version Metadata
\`\`\`
PUT /adobe/sites/cf/fragments/{fragmentId}/versions/{versionId}
Body: { "title": "...", "comment": "..." }
\`\`\`

## Common Workflows

### Rollback to Previous Version
1. Open fragment → Version History
2. Find the desired version
3. Click to restore
4. Review changes in preview
5. Save to commit the rollback

### Compare Versions
1. Note the current state
2. Restore an older version (loads in editor)
3. Compare visually with preview
4. Either save the old version OR close without saving to keep current

### Version Before Major Changes
Before making significant changes:
1. Save current state (creates a version)
2. Make your changes
3. If needed, easily restore the pre-change version

## Best Practices

1. **Name important versions** - Use descriptive titles for milestone versions
2. **Add comments** - Explain what changed and why
3. **Review before saving restored versions** - Always check the preview
4. **Don't rely solely on versions** - Major changes may warrant a new fragment
