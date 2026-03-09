## Overview

Collections in MAS Studio are groups of merch cards organized hierarchically. A collection can contain multiple cards, nested sub-collections (categories), and a designated default card. Collections support browse/category interfaces for organizing products.

## Collection Model Fields

| Field | Type | Description |
|-------|------|-------------|
| label | text | Display label for the collection |
| queryLabel | text | Query/search label |
| navigationLabel | text | Navigation menu label |
| icon | asset | Default icon (dark theme) |
| iconLight | asset | Selected/light icon |
| cards | content-fragment (multiple) | Card references in the collection |
| collections | content-fragment (multiple) | Nested sub-collection references |
| defaultchild | text | ID of the default/featured card |
| searchText | text | Search placeholder text |
| tagFiltersTitle | text | Title for tag filters section |
| tagFilters | text (multiple) | Tag filter values |
| linksTitle | text | Title for links section |
| link | text | Link URL |
| linkIcon | asset | Link icon |
| linkText | text | Link text |

## Creating a Collection

Collections can be created through the AI assistant or manually in the content editor:

1. Select cards to include in the collection
2. Provide a collection title
3. The collection is saved as a Content Fragment at the current surface/locale path

## Managing Collections in the Editor

The collection editor supports:

- **Drag and drop**: Reorder cards and sub-collections within the collection
- **Add items**: Drag cards or collections from other views onto the collection
- **Remove items**: Remove individual cards or sub-collections
- **Default card**: Set a featured/default card for the collection (supported for specific variants like simplified-pricing-express)
- **Preview**: Hover over cards to see a live preview

## Collection Model Path

Collections use the model path: `/conf/mas/settings/dam/cfm/models/collection`

The field-to-model mapping connects card and collection references:
- Cards field maps to: `/conf/mas/settings/dam/cfm/models/card`
- Collections field maps to: `/conf/mas/settings/dam/cfm/models/collection`

## Nested Collections (Categories)

Collections support hierarchical organization through nested collections. A parent collection can contain child collections, enabling category-based browsing structures. In the editor, nested collections are labeled as "Categories."
