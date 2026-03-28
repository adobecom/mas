# Store and State Management

## Overview

MAS Studio uses a reactive state management system built on custom stores that integrate with Lit web components. The central `Store` object holds all application state, and `StoreController` instances connect individual components to the store for automatic re-rendering when state changes.

## ReactiveStore

ReactiveStore is the foundation class for all state management in Studio. It provides:

- Observable properties that notify subscribers on change
- Immutable update patterns using spread operators
- Integration points for Lit's reactive update lifecycle
- Support for computed/derived values

When a store property changes, all components subscribed to that property automatically re-render. This eliminates manual DOM updates and keeps the UI in sync with data.

## The Store Object

The central `Store` object is the single source of truth for Studio's application state. It organizes state into logical groups.

### Core State Keys

| Key | Type | Purpose |
|-----|------|---------|
| `Store.page` | Object | Current page/view information |
| `Store.filters` | Object | Active filter selections (variant, status, tags) |
| `Store.search` | String | Current search query text |
| `Store.sort` | Object | Active sort column and direction |
| `Store.selecting` | Boolean | Whether multi-select mode is active |
| `Store.selection` | Array | Currently selected fragment IDs |

### Fragment State

| Key | Type | Purpose |
|-----|------|---------|
| `Store.fragments.list` | Array | Fragment results for the current view |
| `Store.fragments.inEdit` | Object | The fragment currently open in the editor |
| `Store.fragments.loading` | Boolean | Whether fragments are being fetched |

### View State

| Key | Type | Purpose |
|-----|------|---------|
| `Store.renderMode` | String | Current view mode: `'render'` or `'table'` |
| `Store.landscape` | String | Current landscape: `'DRAFT'` or `'PUBLISHED'` |

## StoreController

StoreController is a Lit reactive controller that bridges stores with Lit components. When a component declares a StoreController, it automatically subscribes to store changes and triggers component updates.

### How It Works

1. A Lit component creates a StoreController in its constructor
2. The controller subscribes to specified store keys
3. When any subscribed key changes, the controller requests a component update
4. The component re-renders with the new state
5. Cleanup happens automatically when the component disconnects

### Usage Pattern

```javascript
class MyComponent extends LitElement {
    storeController = new StoreController(this, [
        Store.fragments,
        Store.filters,
    ]);

    render() {
        const fragments = Store.fragments.list;
        return html`...`;
    }
}
```

The component reads directly from the Store in its render method. The StoreController ensures render is called whenever the subscribed stores change.

## Surface and Locale

### Surface

`Store.surface()` returns the current surface path, corresponding to the folder selected in the navigation panel. Possible values:

- `acom` - Adobe.com
- `ccd` - Creative Cloud Desktop
- `express` - Adobe Express
- `commerce` - Unified Checkout
- `adobe-home` - Adobe Home

The surface determines which content path is used for fragment operations and which IAM group is checked for permissions.

### Locale

`Store.localeOrRegion()` returns the current locale context, such as `en_US`, `fr_FR`, or `ja_JP`. This value:

- Scopes fragment search to the locale folder
- Determines pricing display currency and format
- Affects which variations are shown for a fragment
- Is set when the user navigates to a locale folder in the tree

## Fragment Editing

### Opening a Fragment for Editing

When a user clicks on a card or row to edit:

1. The fragment data is fetched from AEM (including the latest ETag)
2. `Store.fragments.inEdit` is set to the fetched fragment object
3. The editor panel opens, populated with fragment field values
4. Changes are tracked locally until the user saves or discards

### Save Flow

1. User clicks save
2. Studio sends a PUT request with the modified fields and the stored ETag
3. On success, `Store.fragments.inEdit` is updated with the response (including new ETag)
4. The fragment list is refreshed to reflect the changes
5. On ETag conflict (409/412), the user is notified and the latest version is fetched

### Discard Flow

1. User clicks discard
2. `Store.fragments.inEdit` is reset to null or the original fetched state
3. The editor panel closes or reverts to the unmodified state

## Selection Mode

Studio supports multi-select for bulk operations like publishing, deleting, or exporting.

### Activating Selection Mode

When `Store.selecting` is set to `true`:
- Checkboxes appear on each card or table row
- The bulk action toolbar becomes visible
- Individual card click behavior changes from "edit" to "select/deselect"

### Managing Selections

`Store.selection` holds an array of selected fragment IDs:

- Selecting a card adds its ID to the array
- Deselecting removes it
- "Select all" adds all visible fragment IDs
- "Deselect all" clears the array

### Bulk Operations

With fragments selected, users can:
- Publish all selected fragments
- Delete all selected fragments
- Export selected fragments
- Apply tags to selected fragments

## Landscape Toggle

The landscape toggle switches between DRAFT and PUBLISHED views:

### DRAFT Landscape

- Shows the latest saved version of each fragment
- Includes unpublished changes
- This is the default editing landscape
- Fragments may have status DRAFT, PUBLISHED, or MODIFIED

### PUBLISHED Landscape

- Shows the last published version of each fragment
- Only includes fragments that have been published at least once
- Read-only; editing is not available in this view
- Useful for reviewing what is currently live on production

Toggle between landscapes using the landscape selector in the Studio toolbar.

## Sort State

`Store.sort` controls the ordering of fragments in the table view:

### Sort Properties

| Property | Values | Default |
|----------|--------|---------|
| `column` | name, variant, status, modified, modifiedBy | modified |
| `direction` | asc, desc | desc |

Clicking a column header in table view updates `Store.sort`, which triggers a re-fetch or re-sort of the fragment list.

## Render Mode

`Store.renderMode` switches between two display modes:

### Render Mode (`'render'`)

- Displays fragments as visual card previews
- Cards render with actual styling, images, and pricing
- Useful for reviewing visual appearance
- More resource-intensive (each card loads commerce data)

### Table Mode (`'table'`)

- Displays fragments in a data table
- Columns show metadata: name, variant, status, modified date, modified by
- Faster loading and better for managing large numbers of fragments
- Supports sorting by any column
- Preferred for bulk operations

## Filters

`Store.filters` holds the active filter criteria:

### Available Filters

| Filter | Type | Values |
|--------|------|--------|
| variant | Multi-select | catalog, plans, ccd-slice, ccd-suggested, etc. |
| status | Multi-select | DRAFT, PUBLISHED, MODIFIED |
| tags | Multi-select | Product codes, customer segments |

Filters are applied on the server side when possible (via AEM search parameters) and client-side for additional refinement. Clearing all filters shows all fragments in the current surface and locale.

## Search

`Store.search` holds the current text search query. Search applies to:

- Fragment name/title
- Fragment content fields
- Tag values

Search combines with active filters; results must match both the search text and all active filters.

## State Persistence

Some state values persist across sessions:

- **Render mode**: Stored in localStorage, remembered on next visit
- **Surface selection**: Encoded in the URL hash for bookmarkability
- **Locale**: Part of the navigation path, preserved in URL
- **Filters and search**: Reset on navigation; not persisted

## Debugging State

To inspect current store state during development:

1. Open browser DevTools console
2. Access store values directly (e.g., `Store.fragments.list`)
3. Watch for store change events in the console
4. Use the Lit DevTools extension to inspect component properties tied to store values
