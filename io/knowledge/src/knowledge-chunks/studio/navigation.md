# Studio Navigation

## Interface Layout

MAS Studio uses a three-zone layout:

1. **Top Navigation Bar**: Surface picker, locale picker, landscape toggle, and user profile.
2. **Left Side Navigation**: Page links for navigating between Studio sections.
3. **Main Content Area**: The active page content (fragments table, editor, catalog, etc.).

## Side Navigation

The left side navigation is a vertical icon bar that provides access to all Studio sections. Each item is an icon with a tooltip label.

### Navigation Items

From top to bottom, the side navigation includes:

| Item | Page | Description |
|------|------|-------------|
| Home | Welcome | Studio landing page and dashboard |
| Fragments | Content | Browse and manage cards and collections |
| Collections | Content | Browse collections (same page, filtered) |
| Promotions | Promotions | Manage promotional campaigns |
| Product Catalog | Product Catalog | Browse Adobe products and create release cards |
| Placeholders | Placeholders | Manage key-value translation tokens |
| Translations | Translations | Create and manage translation projects |
| AI Assistant | AI Assistant | Open the AI-powered chat interface |
| Support | (external) | Link to support resources |
| Settings | Settings | Global configuration (power users only) |

Settings appears near the bottom of the navigation, separated from the main items. It is only visible to users with power user permissions.

## Surface Picker

The surface picker in the top navigation determines which surface's content you are working with. Available surfaces:

| Surface | Label | Description |
|---------|-------|-------------|
| acom | Adobe.com | Product and pricing pages on adobe.com |
| adobe-home | Adobe Home | The Adobe Home desktop application |
| ccd | CCD | Creative Cloud Desktop app |
| commerce | Commerce | Checkout and purchase flows |
| express | Express | Adobe Express pricing pages |
| nala | Nala | Test automation surface |
| sandbox | Sandbox | Development and experimentation surface |

Changing the surface reloads the content for that surface's folder structure. Your surface access is controlled by IAM group membership (e.g., GRP-ODIN-MAS-ACOM-EDITORS for ACOM).

## Locale Picker

The locale picker sets the content locale for browsing and editing. The default locale is `en_US` (English, United States).

Changing the locale:
1. Click the locale picker in the top navigation.
2. Select the target locale from the dropdown.
3. The content reloads filtered to fragments in that locale.

The locale picker is also available as a region picker on some pages (e.g., Placeholders) for switching between regional content.

## Draft/Published Landscape Toggle

The landscape toggle switches between viewing Draft and Published content:

- **Draft**: Shows content as it exists in the authoring environment (including unpublished changes).
- **Published**: Shows content as it appears on the live site.

This is useful for comparing what is currently live versus what is pending publication.

## Fragment Table

The main content page displays fragments in a table view with the following features:

### Columns
- Fragment name and title
- Variant type (plans, fries, mini, etc.)
- Status badge (Draft, Published, Modified)
- Last modified date
- Modified by (author name)

### Status Badges

| Status | Meaning |
|--------|---------|
| DRAFT | Fragment has never been published |
| PUBLISHED | Fragment is live and unchanged since last publish |
| MODIFIED | Fragment was published but has unpublished changes |

### Views
- **Table View**: Default list view with sortable columns and bulk selection.
- **Card Grid View**: Visual preview of fragments as rendered cards.

Toggle between views using the view mode controls.

## Search and Filters

### Search Bar

Type in the search bar to filter fragments by name or content. The search operates on the current surface and locale.

### Filter Panel

The filter panel provides structured filtering options:

| Filter | Description |
|--------|-------------|
| Template | Filter by card variant (plans, fries, mini, catalog, etc.) |
| Market Segment | Filter by target market (COM, EDU, GOV) |
| Customer Segment | Filter by customer type (individual, team, enterprise) |
| Product Code | Filter by product code |
| Status | Filter by fragment status (Draft, Published, Modified) |
| Content Type | Filter by content type (cards, collections) |
| Created by | Filter by author |

Filters can be combined. Active filters are displayed as pills that can be individually removed.

## Quick Actions Toolbar

When a fragment is selected or open in the editor, the quick actions toolbar appears with context-sensitive operations:

| Action | Shortcut | Description |
|--------|----------|-------------|
| Save | - | Save current changes as draft |
| Publish | - | Publish the fragment to make it live |
| Unpublish | - | Revert a published fragment to draft |
| Delete | - | Remove the fragment permanently |
| Duplicate | - | Create a copy of the fragment |
| Discard | - | Revert all unsaved changes |
| Copy | - | Copy fragment data to clipboard |
| LOC | - | Send to localization (translation projects only) |

Some actions may be disabled depending on the current context (e.g., you cannot publish an already-published fragment with no changes).

## Chat FAB (Floating Action Button)

On pages other than the AI Assistant page, a floating chat button appears in the bottom corner of the screen. Clicking it opens a chat drawer overlay where you can interact with the AI assistant without navigating away from your current page.

The chat overlay slides in from the right and can be dismissed by clicking outside it or using the close button.

## URL Routing

MAS Studio uses hash-based URL routing for navigation. The URL structure is:

```
https://studio.mas.adobe.com/studio.html#page=content&path=acom/en_US
```

Key URL parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| page | Current page name | content, placeholders, settings, fragment-editor |
| path | Surface and locale path | acom/en_US, ccd/en_GB |
| id | Fragment ID (for editor pages) | fragment UUID |
| region | Regional locale filter | en_GB, fr_CA |

URLs are bookmarkable and shareable. Navigating to a URL with parameters will restore the correct page, surface, locale, and selected fragment.

## Breadcrumb Navigation

The fragment editor includes breadcrumb navigation at the top:

```
[Surface] > [Locale] > [Fragment Name]
```

Click any breadcrumb segment to navigate back to that level. Clicking the surface breadcrumb returns to the fragment table for that surface.

## Keyboard Navigation

Studio supports standard keyboard navigation:
- **Tab/Shift+Tab**: Move between interactive elements.
- **Enter/Space**: Activate buttons and links.
- **Escape**: Close dialogs and modals, cancel edit mode.
- **Arrow keys**: Navigate within dropdown menus and pickers.

## Troubleshooting

**Side navigation not showing all items:**
Some navigation items are permission-gated. Settings requires power user permissions. Verify your IAM group membership.

**Surface picker shows limited surfaces:**
You only see surfaces your account has access to. Request access through IAM for additional surfaces.

**Content not loading after locale change:**
Wait for the content to reload. If the table remains empty, verify that content exists for the selected surface and locale combination.

**URL not restoring the correct state:**
Ensure the URL hash parameters are correct. Clear the browser cache if routing behaves unexpectedly. The router syncs URL hash with the global store on page load.

**Chat FAB not appearing:**
The floating chat button is hidden on the AI Assistant page itself (since you are already on the chat page). It appears on all other pages.
