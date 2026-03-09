## Overview

Bulk operations allow users to update, publish, or delete multiple cards simultaneously. All bulk operations follow a preview-confirm-execute workflow to prevent accidental changes.

## Available Bulk Operations

| Operation | Description |
|-----------|-------------|
| Bulk Update | Update field values across multiple cards at once |
| Bulk Publish | Publish multiple cards to production simultaneously |
| Bulk Delete | Delete multiple cards at once |

## Preview-Confirm-Execute Workflow

Every bulk operation follows three steps:

### Step 1: Preview

A non-destructive preview shows what would change without executing:
- **Bulk Update Preview**: Shows which cards will be updated, what fields change, and which cards have no changes
- **Bulk Publish Preview**: Shows which cards will be published/unpublished and which are already in the target state
- **Bulk Delete Preview**: Shows which cards will be deleted and which were not found

### Step 2: Confirm

The preview results are displayed in the UI with a summary:
- Number of items that will be affected
- Number of items with no changes
- Number of errors
- Detailed list of changes per card (first 10 shown)

The user can approve or cancel the operation.

### Step 3: Execute

After approval, the operation runs asynchronously:
- A job is created with a unique ID
- Progress is tracked via polling (every 1.5 seconds)
- The UI shows real-time progress with completed/total counts
- Results include successful, failed, and skipped items

## Preview Summary Formats

### Bulk Update Preview
```
{ willUpdate: number, noChanges: number, errors: number }
```

### Bulk Publish Preview
```
{ willChange: number, alreadyInState: number, errors: number }
```

### Bulk Delete Preview
```
{ willDelete: number, notFound: number, errors: number }
```

## Job Tracking

Bulk operations create asynchronous jobs tracked by the system:

| Field | Description |
|-------|-------------|
| jobId | Unique identifier (format: `{type}-{timestamp}-{random}`) |
| status | processing, completed, or failed |
| total | Total items to process |
| completed | Items processed so far |
| successful | Array of successfully processed items |
| failed | Array of failed items with error details |
| skipped | Array of skipped items |

## Using Bulk Operations via AI Assistant

The AI assistant supports bulk operations through natural language:

1. **Search for cards**: "Find all catalog cards in acom"
2. **Preview changes**: The AI generates a preview operation
3. **Review**: The preview results are shown in the chat
4. **Approve**: Click "Approve" to execute, or "Cancel" to abort
5. **Track progress**: Real-time progress updates appear in the chat

## Parameters

### Bulk Update
- `fragmentIds`: Array of fragment IDs to update
- `updates`: Object with field name → new value mappings
- `textReplacements`: Optional text replacement rules

### Bulk Publish
- `fragmentIds`: Array of fragment IDs
- `action`: "publish" or "unpublish"

### Bulk Delete
- `fragmentIds`: Array of fragment IDs to delete
