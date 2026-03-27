# MAS MCP Server - Usage Examples

Practical examples of using the MAS MCP server with AI assistants.

## Table of Contents

- [Card Creation Workflows](#card-creation-workflows)
- [Offer Discovery](#offer-discovery)
- [Card-Offer Linking](#card-offer-linking)
- [Bulk Operations](#bulk-operations)
- [Content Management](#content-management)

---

## Card Creation Workflows

### Example 1: Create a Basic Merch Card

**User Request:**
```
Create a merch card for Photoshop Individual plan in /content/dam/mas/photoshop
```

**MCP Response:**
```json
{
  "card": {
    "id": "L2NvbnRlbnQvZGFtL21hcy9waG90b3Nob3AvcGhvdG9zaG9wLWluZGl2aWR1YWw",
    "path": "/content/dam/mas/photoshop/photoshop-individual",
    "title": "Photoshop Individual",
    "variant": "plans",
    "size": "wide",
    "fields": {
      "variant": { "value": "plans" },
      "size": { "value": "wide" }
    },
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

**Follow-up:**
```
Great! Now link it to the Photoshop ABM offer
```

---

### Example 2: Create Card with Custom Fields

**User Request:**
```
Create a special offers card for Creative Cloud All Apps with:
- Title: "Creative Cloud All Apps - Student Discount"
- Variant: special-offers
- Tags: mas:plan_type/abm, mas:market_segments/edu
- Custom fields:
  - badge: "60% OFF"
  - actionText: "Buy Now"
```

**MCP automatically translates this to:**
```json
{
  "title": "Creative Cloud All Apps - Student Discount",
  "parentPath": "/content/dam/mas/creative-cloud",
  "variant": "special-offers",
  "tags": [
    "mas:studio/content-type/merch-card",
    "mas:plan_type/abm",
    "mas:market_segments/edu"
  ],
  "fields": {
    "badge": { "value": "60% OFF" },
    "actionText": { "value": "Buy Now" }
  }
}
```

---

## Offer Discovery

### Example 3: Find Offers for a Product

**User Request:**
```
Show me all Individual offers for Photoshop
```

**MCP Process:**
1. Searches product catalog for "Photoshop"
2. Finds product code: `phsp`
3. Queries AOS for all Individual offers
4. Returns offers grouped by plan type

**Response:**
```json
{
  "offers": [
    {
      "offer_id": "ABC123",
      "planType": "ABM",
      "commitment": "YEAR",
      "term": "MONTHLY",
      "price_point": "base"
    },
    {
      "offer_id": "DEF456",
      "planType": "PUF",
      "commitment": "YEAR",
      "term": "ANNUAL",
      "price_point": "base"
    },
    {
      "offer_id": "GHI789",
      "planType": "M2M",
      "commitment": "MONTH",
      "term": "MONTHLY",
      "price_point": "base"
    }
  ],
  "studioLinks": {
    "viewCardsInStudio": "https://mas.adobe.com/studio.html#page=content&tags=mas:product_code/phsp,mas:customer_segment/individual"
  }
}
```

---

### Example 4: Get Specific Offer Details

**User Request:**
```
Give me the details of offer ID: 65304B6FCE2E6CB9475B2EDE3BDFBBBE
```

**Response:**
```json
{
  "offer": {
    "offer_id": "65304B6FCE2E6CB9475B2EDE3BDFBBBE",
    "product_arrangement_code": "phsp",
    "product_name": "Photoshop",
    "commitment": "YEAR",
    "term": "MONTHLY",
    "planType": "ABM",
    "customer_segment": "INDIVIDUAL",
    "market_segment": "COM",
    "offer_type": "BASE",
    "price_point": "base",
    "currency": "USD"
  },
  "studioLinks": {
    "viewCards": "https://mas.adobe.com/studio.html#page=content&tags=mas:plan_type/abm,mas:product_code/phsp",
    "createWithAI": "https://mas.adobe.com/studio.html#page=chat"
  }
}
```

---

### Example 5: Compare Offers

**User Request:**
```
Compare all plan types for Illustrator Individual
```

**Response:**
```json
{
  "offers": [...],
  "comparison": {
    "byPlanType": {
      "ABM": [
        { "offer_id": "ABC123", "price_point": "base" },
        { "offer_id": "ABC124", "price_point": "promo" }
      ],
      "PUF": [
        { "offer_id": "DEF456", "price_point": "base" }
      ],
      "M2M": [
        { "offer_id": "GHI789", "price_point": "base" }
      ]
    },
    "byOfferType": {
      "BASE": [ ... ],
      "TRIAL": [ ... ]
    }
  },
  "studioLinks": { ... }
}
```

---

## Card-Offer Linking

### Example 6: Link Card to Offer and Sync Pricing

**User Request:**
```
Link card abc-123 to the Photoshop ABM offer and update its pricing
```

**MCP Process:**
1. Searches for Photoshop ABM offers
2. Creates offer selector ID
3. Links card to offer selector
4. Fetches formatted prices
5. Updates card fields

**Follow-up Conversation:**
```
User: Now validate that the card has the correct tags

MCP: Running validation...
```

**Validation Response:**
```json
{
  "card": { ... },
  "offer": { ... },
  "isConsistent": false,
  "issues": [
    "Card missing plan_type tag: mas:plan_type/abm",
    "Card missing customer_segment tag: mas:customer_segment/individual"
  ],
  "studioLinks": {
    "viewInStudio": "..."
  }
}
```

**User:**
```
Fix those tag issues
```

**MCP automatically:**
1. Reads the offer details
2. Adds missing tags
3. Updates the card
4. Re-validates

---

### Example 7: Find All Cards Using an Offer

**User Request:**
```
Which cards are using offer selector XYZ123ABC456?
```

**Response:**
```json
{
  "cards": [
    {
      "id": "card-1",
      "title": "Photoshop Individual ABM",
      "path": "/content/dam/mas/photoshop/individual-abm"
    },
    {
      "id": "card-2",
      "title": "Photoshop Promo Card",
      "path": "/content/dam/mas/promotions/photoshop-promo"
    }
  ],
  "offer": {
    "offer_id": "65304B6FCE2E6CB9475B2EDE3BDFBBBE",
    "planType": "ABM",
    "product_arrangement_code": "phsp"
  },
  "studioLinks": {
    "viewInStudio": "..."
  }
}
```

---

## Bulk Operations

### Example 8: Create Multiple Cards for a Product

**User Request:**
```
Create cards for all Photoshop Individual plan types (ABM, PUF, M2M) in /content/dam/mas/photoshop
```

**MCP Process:**
1. Searches for Photoshop Individual offers
2. Groups by plan type
3. Creates offer selectors for each plan type
4. Creates a card for each plan type
5. Links cards to their respective offer selectors

**Result:**
- 3 cards created (ABM, PUF, M2M)
- Each linked to correct offer selector
- All tagged appropriately
- Studio link provided to view all cards

---

### Example 9: Bulk Update Card Tags

**User Request:**
```
Update all Photoshop cards to include the tag "mas:status/reviewed"
```

**MCP Process:**
1. Searches for cards with `mas:product_code/phsp`
2. Updates each card's tags
3. Returns count of updated cards

---

## Content Management

### Example 10: Create a Collection

**User Request:**
```
Create a collection called "Photoshop Plans Bundle" with all Photoshop Individual cards
```

**MCP Process:**
1. Searches for Photoshop Individual cards
2. Collects their paths
3. Creates collection with those card paths

**Response:**
```json
{
  "collection": {
    "id": "collection-123",
    "title": "Photoshop Plans Bundle",
    "cardPaths": [
      "/content/dam/mas/photoshop/individual-abm",
      "/content/dam/mas/photoshop/individual-puf",
      "/content/dam/mas/photoshop/individual-m2m"
    ]
  },
  "studioLinks": {
    "viewInStudio": "..."
  }
}
```

---

### Example 11: Duplicate and Modify a Card

**User Request:**
```
Duplicate the Photoshop Individual ABM card and change it to a Team plan
```

**MCP Process:**
1. Gets the original card
2. Duplicates it with new title
3. Searches for Photoshop Team ABM offer
4. Creates offer selector
5. Links new card to Team offer selector
6. Updates tags to reflect Team segment

---

## Advanced Workflows

### Example 12: Multi-Locale Card Creation

**User Request:**
```
Create cards for Photoshop ABM in US, UK, and Germany
```

**MCP Process:**
1. For each locale:
   - Searches for offers in that country
   - Creates offer selector with country parameter
   - Creates card with locale tag
   - Links card to locale-specific offer selector

**Result:**
- 3 cards created (US, UK, DE)
- Each with appropriate locale tags
- Each linked to country-specific offer selector
- Studio links for each locale

---

### Example 13: Promotional Card Creation

**User Request:**
```
Create a special offers card for Creative Cloud All Apps with:
- 20% discount badge
- Promotional pricing
- Trial offer type
- Ends March 31, 2024
```

**MCP Process:**
1. Searches for CCALL promotional offers
2. Creates offer selector with promo price point
3. Creates card with special-offers variant
4. Sets badge, promotional fields, expiry date
5. Tags with offer_type/promotion

---

### Example 14: Card Validation and Cleanup

**User Request:**
```
Find all cards that are missing offer selectors
```

**MCP Process:**
1. Searches all merch cards
2. Checks each for mnemonicIcon field
3. Returns list of cards without offer selectors

**Follow-up:**
```
User: For each card missing an offer selector, find the appropriate offer based on its tags and link it

MCP:
1. Analyzes card tags (plan_type, customer_segment, product_code)
2. Searches for matching offers
3. Creates offer selector
4. Links card to offer selector
5. Validates consistency
```

---

### Example 15: Content Audit

**User Request:**
```
Show me all cards that haven't been published in the last 30 days
```

**MCP Process:**
1. Searches all merch cards
2. Filters by published date
3. Groups by product/variant
4. Returns audit report with Studio links

---

## Error Handling Examples

### Example 16: Invalid Offer ID

**User Request:**
```
Get details for offer INVALID123
```

**Response:**
```json
{
  "error": "Offer INVALID123 not found",
  "tool": "get_offer_by_id"
}
```

---

### Example 17: Authentication Error

**User Request:**
```
Create a card...
```

**Response (if token expired):**
```json
{
  "error": "No access token available. Please set MAS_ACCESS_TOKEN or IMS_ACCESS_TOKEN environment variable.",
  "tool": "create_card"
}
```

---

## Tips for Using the MCP

### Natural Language

The MCP understands natural language requests:

✅ **Good:**
- "Create a Photoshop card with ABM pricing"
- "Find all Individual trial offers"
- "Link this card to the cheapest Photoshop offer"

❌ **Avoid:**
- Exact JSON tool invocations (let the AI translate)
- Unnecessary technical jargon

### Chained Operations

The MCP excels at multi-step workflows:

```
Create a Photoshop Individual ABM card, link it to the base offer,
sync the pricing, validate the tags, then add it to the
"Featured Plans" collection
```

### Context Awareness

The AI remembers context:

```
User: Create a card for Photoshop Individual ABM
AI: [creates card abc-123]
User: Now link it to the offer
AI: [knows "it" = card abc-123, searches for Photoshop Individual ABM offer]
User: Validate it
AI: [validates card abc-123]
```

### Studio Links

Always use the provided Studio links to view/edit content in the actual UI:

- Click `viewInStudio` to see the card/collection
- Click `createWithAI` to open AI chat for further edits
- Share Studio links with team members

---

## Common Patterns

### Pattern: Product Launch

1. Search for product offers
2. Create cards for each plan type
3. Create collection with all cards
4. Validate all cards
5. Publish collection

### Pattern: Promotional Campaign

1. Search for promotional offers
2. Create special-offers cards
3. Set promotional badges and dates
4. Link to promo offer selectors
5. Add to promotional collection

### Pattern: Content Maintenance

1. Search for cards without offer selectors
2. For each card:
   - Analyze tags
   - Find matching offer
   - Create selector
   - Link and validate

### Pattern: Cross-Surface Sync

1. Get card details
2. Extract offer selector
3. Resolve offer to get pricing
4. Update card pricing fields
5. Validate consistency