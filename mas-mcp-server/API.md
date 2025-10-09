# MAS MCP Server API Reference

Complete reference for all available MCP tools.

## Table of Contents

- [Card Management Tools](#card-management-tools)
- [Collection Management Tools](#collection-management-tools)
- [Offer Discovery Tools](#offer-discovery-tools)
- [Offer Selector Tools](#offer-selector-tools)
- [Card-Offer Linking Tools](#card-offer-linking-tools)

---

## Card Management Tools

### create_card

Create a new merch card in AEM.

**Parameters:**
- `title` (string, required) - Card title
- `parentPath` (string, required) - Parent folder path in AEM (e.g., `/content/dam/mas/photoshop`)
- `variant` (string, optional) - Card variant: `plans`, `segment`, `special-offers`, `mini-compare-chart`, etc.
- `size` (string, optional) - Card size: `wide`, `super-wide`
- `fields` (object, optional) - Additional card fields as key-value pairs
- `tags` (array, optional) - AEM tags to apply to the card

**Returns:**
```json
{
  "card": {
    "id": "fragment-id",
    "path": "/content/dam/mas/photoshop/individual-plan",
    "title": "Photoshop Individual Plan",
    "variant": "plans",
    "size": "wide",
    "fields": { ... },
    "tags": ["mas:studio/content-type/merch-card"],
    "modified": "2024-01-15T10:30:00Z",
    "published": false
  },
  "studioLinks": {
    "viewInStudio": "https://mas.adobe.com/studio.html#page=content&path=/content/dam/mas/photoshop",
    "viewFolder": "https://mas.adobe.com/studio.html#page=content&path=/content/dam/mas/photoshop"
  }
}
```

**Example:**
```
Create a merch card titled "Photoshop Individual Plan" in /content/dam/mas/photoshop with variant "plans"
```

---

### get_card

Get a merch card by ID.

**Parameters:**
- `id` (string, required) - Card fragment ID

**Returns:**
```json
{
  "card": { ... },
  "studioLinks": { ... }
}
```

**Example:**
```
Get card with ID abc-123-def-456
```

---

### update_card

Update a merch card's fields, title, or tags.

**Parameters:**
- `id` (string, required) - Card fragment ID
- `fields` (object, optional) - Fields to update
- `title` (string, optional) - New title
- `tags` (array, optional) - New tags (replaces existing)
- `etag` (string, optional) - ETag for optimistic locking

**Returns:**
```json
{
  "card": { ... },
  "studioLinks": { ... }
}
```

**Example:**
```
Update card abc-123 to add tag "mas:plan_type/abm"
```

---

### delete_card

Delete a merch card.

**Parameters:**
- `id` (string, required) - Card fragment ID

**Returns:**
```json
{
  "success": true,
  "message": "Card abc-123 deleted successfully"
}
```

**Example:**
```
Delete card abc-123
```

---

### search_cards

Search for merch cards with filters.

**Parameters:**
- `path` (string, optional) - Search within this path (default: `/content/dam/mas`)
- `query` (string, optional) - Full-text search query
- `tags` (object, optional) - Tag filters with structure:
  ```json
  {
    "variant": ["plans", "segment"],
    "offerType": ["BASE", "TRIAL"],
    "planType": ["ABM", "M2M"],
    "marketSegments": ["COM"],
    "customerSegment": ["INDIVIDUAL"],
    "productCode": ["phsp"],
    "status": ["DRAFT", "PUBLISHED"]
  }
  ```
- `limit` (number, optional) - Maximum results (default: 50)
- `offset` (number, optional) - Result offset for pagination (default: 0)

**Returns:**
```json
{
  "cards": [ ... ],
  "studioLinks": {
    "viewInStudio": "https://mas.adobe.com/studio.html#page=content&tags=mas:plan_type/abm"
  },
  "total": 25
}
```

**Example:**
```
Search for all Photoshop cards with ABM plan type
```

---

### duplicate_card

Duplicate an existing merch card.

**Parameters:**
- `id` (string, required) - Card ID to duplicate
- `newTitle` (string, optional) - Title for the new card (default: "[Original Title] (Copy)")
- `parentPath` (string, optional) - Parent path for the new card (default: same as original)

**Returns:**
```json
{
  "card": { ... },
  "studioLinks": { ... }
}
```

**Example:**
```
Duplicate card abc-123 with title "Photoshop Plan Copy"
```

---

### publish_card

Publish a merch card to production.

**Parameters:**
- `id` (string, required) - Card fragment ID

**Returns:**
```json
{
  "success": true,
  "message": "Card abc-123 published successfully"
}
```

**Example:**
```
Publish card abc-123
```

---

## Collection Management Tools

### create_collection

Create a new merch card collection.

**Parameters:**
- `title` (string, required) - Collection title
- `parentPath` (string, required) - Parent folder path in AEM
- `cardPaths` (array, optional) - Array of card paths to include
- `fields` (object, optional) - Additional fields
- `tags` (array, optional) - AEM tags

**Returns:**
```json
{
  "collection": {
    "id": "collection-id",
    "path": "/content/dam/mas/collections/photoshop-plans",
    "title": "Photoshop Plans Collection",
    "cardPaths": [
      "/content/dam/mas/photoshop/plan-1",
      "/content/dam/mas/photoshop/plan-2"
    ],
    "fields": { ... },
    "tags": ["mas:studio/content-type/merch-card-collection"],
    "modified": "2024-01-15T10:30:00Z",
    "published": false
  },
  "studioLinks": {
    "viewInStudio": "https://mas.adobe.com/studio.html#page=content&tags=mas:studio/content-type/merch-card-collection"
  }
}
```

**Example:**
```
Create a collection titled "Photoshop Plans" in /content/dam/mas/collections
```

---

### get_collection

Get a collection by ID.

**Parameters:**
- `id` (string, required) - Collection fragment ID

**Returns:**
```json
{
  "collection": { ... },
  "studioLinks": { ... }
}
```

---

### add_cards_to_collection

Add cards to an existing collection.

**Parameters:**
- `id` (string, required) - Collection fragment ID
- `cardPaths` (array, required) - Array of card paths to add
- `etag` (string, optional) - ETag for optimistic locking

**Returns:**
```json
{
  "collection": { ... },
  "studioLinks": { ... }
}
```

**Example:**
```
Add cards /content/dam/mas/photoshop/plan-3 and /content/dam/mas/photoshop/plan-4 to collection abc-123
```

---

## Offer Discovery Tools

### search_offers

Search for offers from Adobe Offer System (AOS).

**Parameters:**
- `arrangementCode` (string, optional) - Product arrangement code (e.g., `phsp`)
- `commitment` (string, optional) - Commitment type: `YEAR`, `MONTH`, `PERPETUAL`, `TERM_LICENSE`
- `term` (string, optional) - Term type: `MONTHLY`, `ANNUAL`, `P3Y`
- `customerSegment` (string, optional) - Customer segment: `INDIVIDUAL`, `TEAM`, `ENTERPRISE`
- `marketSegment` (string, optional) - Market segment: `COM`, `EDU`, `GOV`
- `offerType` (string, optional) - Offer type: `BASE`, `TRIAL`, `PROMOTION`
- `country` (string, optional) - Country code (default: `US`)
- `language` (string, optional) - Language code (default: `en`)
- `pricePoint` (string, optional) - Price point identifier

**Returns:**
```json
{
  "offers": [
    {
      "offer_id": "ABC123DEF456",
      "product_arrangement_code": "phsp",
      "commitment": "YEAR",
      "term": "MONTHLY",
      "planType": "ABM",
      "customer_segment": "INDIVIDUAL",
      "market_segment": "COM",
      "offer_type": "BASE",
      "price_point": "base",
      "currency": "USD",
      ...
    }
  ],
  "studioLinks": {
    "viewCardsInStudio": "https://mas.adobe.com/studio.html#page=content&tags=mas:plan_type/abm,mas:customer_segment/individual",
    "createWithAI": "https://mas.adobe.com/studio.html#page=chat"
  }
}
```

**Example:**
```
Search for all Photoshop Individual ABM offers
```

---

### get_offer_by_id

Get detailed offer information by offer ID.

**Parameters:**
- `offerId` (string, required) - Offer ID
- `country` (string, optional) - Country code (default: `US`)

**Returns:**
```json
{
  "offer": { ... },
  "studioLinks": {
    "viewCards": "...",
    "createWithAI": "..."
  }
}
```

**Example:**
```
Give me the details of offer ID ABC123DEF456
```

---

### list_products

List Adobe products from the product catalog.

**Parameters:**
- `searchText` (string, optional) - Search by product name or code
- `customerSegment` (string, optional) - Filter by customer segment
- `marketSegment` (string, optional) - Filter by market segment
- `limit` (number, optional) - Maximum results

**Returns:**
```json
{
  "products": [
    {
      "code": "phsp",
      "name": "Photoshop",
      "icon": "photoshop-icon-url",
      "customerSegments": {
        "INDIVIDUAL": true,
        "TEAM": true
      },
      "marketSegments": {
        "COM": true,
        "EDU": true
      },
      "arrangement_code": "phsp"
    }
  ],
  "total": 50
}
```

**Example:**
```
List all products for Individual customers
```

---

### compare_offers

Compare all offers for a specific product.

**Parameters:**
- `arrangementCode` (string, required) - Product arrangement code
- `customerSegment` (string, optional) - Filter by customer segment
- `marketSegment` (string, optional) - Filter by market segment
- `country` (string, optional) - Country code

**Returns:**
```json
{
  "offers": [ ... ],
  "comparison": {
    "byPlanType": {
      "ABM": [ ... ],
      "PUF": [ ... ],
      "M2M": [ ... ]
    },
    "byOfferType": {
      "BASE": [ ... ],
      "TRIAL": [ ... ]
    },
    "byPricePoint": {
      "base": [ ... ],
      "promo": [ ... ]
    }
  },
  "studioLinks": { ... }
}
```

**Example:**
```
Compare all Photoshop Individual offers
```

---

## Offer Selector Tools

### create_offer_selector

Create or retrieve an offer selector ID (OSI).

**Parameters:**
- `productArrangementCode` (string, required) - Product arrangement code
- `commitment` (string, optional) - Commitment type
- `term` (string, optional) - Term type
- `customerSegment` (string, required) - Customer segment
- `marketSegment` (string, required) - Market segment
- `offerType` (string, required) - Offer type
- `pricePoint` (string, optional) - Price point
- `buyingProgram` (string, optional) - Buying program
- `merchant` (string, optional) - Merchant identifier
- `salesChannel` (string, optional) - Sales channel

**Returns:**
```json
{
  "offerSelectorId": "XYZ123ABC456...",
  "checkoutUrl": "https://commerce.adobe.com/checkout?osi=XYZ123ABC456...",
  "studioLinks": { ... }
}
```

**Example:**
```
Create an offer selector for Photoshop Individual ABM base offer
```

---

### resolve_offer_selector

Get offer details from an offer selector ID.

**Parameters:**
- `offerSelectorId` (string, required) - Offer selector ID
- `country` (string, optional) - Country code

**Returns:**
```json
{
  "offers": [ ... ],
  "selector": {
    "product_arrangement_code": "phsp",
    "customer_segment": "INDIVIDUAL",
    "offer_type": "BASE",
    ...
  },
  "checkoutUrl": "https://commerce.adobe.com/checkout?osi=...",
  "studioLinks": { ... }
}
```

**Example:**
```
What offers does this OSI resolve to: XYZ123ABC456...
```

---

## Card-Offer Linking Tools

### link_card_to_offer

Link a merch card to an offer selector.

**Parameters:**
- `cardId` (string, required) - Card fragment ID
- `offerSelectorId` (string, required) - Offer selector ID
- `etag` (string, optional) - ETag for optimistic locking

**Returns:**
```json
{
  "card": { ... },
  "offer": { ... },
  "studioLinks": { ... }
}
```

**Example:**
```
Link card abc-123 to offer selector XYZ456
```

---

### validate_card_offer

Validate that a card's tags match its linked offer.

**Parameters:**
- `cardId` (string, required) - Card fragment ID

**Returns:**
```json
{
  "card": { ... },
  "offer": { ... },
  "isConsistent": false,
  "issues": [
    "Card missing plan_type tag: mas:plan_type/abm",
    "Card missing customer_segment tag: mas:customer_segment/individual"
  ],
  "studioLinks": { ... }
}
```

**Example:**
```
Validate card abc-123 has correct tags for its linked offer
```

---

## Response Format

All tools return responses in JSON format with:

1. **Primary Data**: The main result (card, collection, offer, etc.)
2. **Studio Links**: Deep links to Merch at Scale Studio with pre-applied filters
3. **Metadata**: Additional context like totals, timestamps, etc.

### Studio Links

Every response includes relevant Studio links:

- `viewInStudio` - Direct link to view the item in Studio
- `viewFolder` - Link to view the parent folder
- `viewCardsInStudio` - Link to filtered card view
- `createWithAI` - Link to AI chat for creating content

These links use hash-based routing with pre-applied filters, making it easy to jump from AI conversation to the Studio UI.

### Error Responses

When a tool fails, the response includes:

```json
{
  "error": "Error message describing what went wrong",
  "tool": "tool_name"
}
```

## Plan Type Mapping

The MCP server automatically calculates plan types from commitment and term:

| Commitment | Term | Plan Type |
|------------|------|-----------|
| YEAR | MONTHLY | ABM (Annual Billed Monthly) |
| YEAR | ANNUAL | PUF (Prepaid Up Front) |
| MONTH | MONTHLY | M2M (Month to Month) |
| PERPETUAL | - | PERPETUAL |
| TERM_LICENSE | P3Y | P3Y (3-Year Term License) |

## Tag Structure

Tags follow the format `mas:{namespace}/{value}`:

- `mas:studio/content-type/merch-card` - Content type tags
- `mas:plan_type/abm` - Plan type tags
- `mas:offer_type/base` - Offer type tags
- `mas:customer_segment/individual` - Customer segment tags
- `mas:market_segments/com` - Market segment tags
- `mas:product_code/phsp` - Product code tags
- `mas:variant/plans` - Variant tags
- `mas:status/draft` - Status tags
