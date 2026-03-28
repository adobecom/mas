# Fragment Editor

## Overview

The Fragment Editor is the primary editing interface for cards and collections in MAS Studio. It uses a two-column layout with form fields on the left and a live preview on the right, allowing authors to see changes reflected in real time as they edit.

## Opening the Fragment Editor

There are several ways to open the editor:

1. **Double-click** a fragment row in the content table.
2. **Click "Edit"** from a fragment's action menu.
3. **Click "Create"** to start a new fragment (opens the editor with empty fields).
4. **Navigate directly** via URL: `#page=fragment-editor&id={fragment-id}`

The editor loads the fragment data from AEM and populates all fields.

## Two-Column Layout

### Left Column: Form Fields

The left column contains the editable form organized into collapsible sections. Each section groups related fields.

### Right Column: Live Preview

The right column shows a live rendering of the card using the `aem-fragment` web component. As you edit fields on the left, the preview updates in real time.

The preview is wrapped in a container with:
- A header showing "Preview" with a link to open the card in a new window.
- A card rendering area with proper shadows and spacing.
- CTA error messages if checkout links fail to resolve.

On desktop, the preview column is sticky (follows scroll). On screens narrower than 1200px, the layout stacks vertically with the form on top and preview below.

## Card Editor Sections

When editing a merch card, the form is organized into the following sections:

### Visuals

Fields that control the card's visual presentation:
- **Mnemonics**: Product icons displayed at the top of the card.
- **Badge**: Promotional badge text and background color.
- **Background image**: Card background image URL.

### What's Included

Product feature list fields:
- **What's Included Items**: A multifield (repeating) list of feature bullet points.
- Each item can be added, removed, or reordered.

### Product Details

Core product information:
- **Title**: The card headline.
- **Description**: Card body text, often with rich text formatting.
- **Callout**: Highlighted promotional text.

### Footer Rows

Additional content rows that appear between the description and CTAs:
- **Footer Row Items**: Multifield list of footer content items.
- Used for legal disclaimers, pricing details, or supplementary information.

### Footer (CTAs)

Call-to-action buttons:
- **CTA Label**: Button text (e.g., "Buy now", "Free trial").
- **CTA Link/Offer**: OSI (Offer Selector ID) for commerce links, or a URL for standard links.
- Multiple CTAs can be added, each with its own label and link configuration.

### Options & Settings

Card configuration parameters:
- **Variant/Template**: The card type (plans, fries, mini, etc.).
- **Style**: Light or dark theme.
- **Plan Type**: Subscription plan classification.
- **Offer Type**: Type of offer (e.g., base, trial, promotion).
- **Product Code**: AOS product code for commerce integration.
- **OSI**: Offer Selector ID linking the card to dynamic pricing.

## Field Types

The editor uses several field component types:

| Type | Description | Behavior |
|------|-------------|----------|
| **Text** | Single-line text input | Standard text editing |
| **Multifield** | Repeating field group | Add/remove/reorder items |
| **Icon Picker** | Product icon selector | Browse and select mnemonic icons |
| **RTE (Rich Text)** | ProseMirror-based editor | Bold, italic, links, lists, strikethrough |
| **Secure Text** | Protected text display | Read-only or restricted editing |
| **Plan Type Picker** | Plan type selector | Dropdown with plan type options |
| **Tag Picker** | AEM tag selector | Browse tag taxonomies |
| **OSI Field** | Offer Selector integration | Opens OST dialog for offer selection |

## Live Preview

The preview panel renders the actual web component (`merch-card` or `merch-card-collection`) using the current field values. Key behaviors:

- Updates in real time as fields change.
- Uses `aem-fragment` element to render with proper fragment data.
- Resolves commerce prices via WCS when an OSI is present.
- Shows CTA error messages if a checkout link fails to resolve.

The preview header includes a "Preview" label and may include an icon to open the card in a separate window for full-size viewing.

## Variation Editing

When editing a variation (regional or grouped), the editor adds inheritance indicators to each field:

### Overridden Fields
- Displayed with a blue left border.
- Grouped under an "Overridden in this variation" section label.
- A reset link appears to restore inheritance from the parent.

### Inherited Fields
- Displayed with neutral styling.
- Grouped under an "Inherited from base fragment" section label.
- Show the parent's value in a read-only or inherited state.
- Editing an inherited field converts it to an overridden field.

### Resetting an Override
1. Find the field with the blue override indicator.
2. Click the reset link.
3. The field returns to inherited state, pulling its value from the parent fragment.
4. Save to persist the change.

## Quick Actions

The editor's quick actions toolbar provides immediate access to fragment operations:

| Action | Description |
|--------|-------------|
| Save | Save all changes as a draft |
| Discard | Revert all unsaved changes to the last saved state |
| Publish | Publish the fragment to the live site |
| Unpublish | Revert from published to draft status |
| Delete | Permanently remove the fragment |
| Duplicate | Create a copy of the fragment |
| Copy | Copy fragment data or code snippet to clipboard |

Actions are context-sensitive. For example, "Publish" is disabled if there are no changes since the last publish.

## Breadcrumb Navigation

At the top of the editor, breadcrumbs show the path back to the content table:

```
[Surface] > [Locale] > [Fragment Name]
```

Click any segment to navigate back. This provides a quick way to return to the fragment list without using the side navigation.

## Creating a New Fragment

1. Click "Create" from the content page.
2. Select the content type: Merch Card or Collection.
3. Choose a variant from the variant picker:
   - Variants are organized by surface compatibility.
   - Each variant shows a label and optional preview.
4. Fill in the required fields for the selected variant.
5. Click "Save" to create the fragment as a draft.

Required fields vary by variant. At minimum, most variants need a title and at least one CTA.

## Collection Editor

Collections use a specialized editor (`merch-card-collection-editor`) with fields specific to card groupings:

- **Collection title**: Name of the collection.
- **Cards**: References to individual card fragments included in the collection.
- **Filter configuration**: Tag-based filter options for the collection.
- **Layout**: Grid and display settings.

The collection preview shows the full collection rendering with all referenced cards.

## Responsive Behavior

The editor adapts to different screen sizes:

| Width | Behavior |
|-------|----------|
| Above 1200px | Two-column side-by-side layout with sticky preview |
| Below 1200px | Single-column stacked layout, form above preview |

On narrower screens, the preview loses its sticky positioning and scrolls with the form content.

## Missing Variation Panel

If you navigate to a fragment editor for a locale that does not have a variation yet, a special empty state panel appears:

- Shows a translation icon.
- Displays a message indicating no variation exists for this locale.
- Provides action buttons to either create a variation or navigate to the translation project editor.

This guides authors toward the correct workflow when regional content is missing.

## Troubleshooting

**Preview not updating:**
Check that the fragment data is valid. Invalid field values or missing required fields may prevent the preview from rendering. Look for error messages in the preview area.

**CTA showing error in preview:**
If a checkout link CTA shows an error, the OSI may be invalid or the offer may not be available for the current locale. Verify the OSI using the Offer Selector Tool.

**Fields not saving:**
Ensure you click "Save" after making changes. The editor tracks unsaved changes and will warn you if you try to navigate away without saving.

**Editor shows loading spinner indefinitely:**
The fragment may not exist or may have been deleted. Check the fragment ID in the URL. If the fragment was recently deleted, navigate back to the content table.

**Variant change warning:**
If you change the variant/template of an existing fragment, a yellow warning banner appears. Changing the variant may cause fields to be lost if the new variant does not support them. Proceed with caution.

**Cannot edit inherited fields:**
Inherited fields in a variation appear read-only until you click to edit them. Editing converts the field to an override. Use the reset action to restore inheritance.
