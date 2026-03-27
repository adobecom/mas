# MAS MCP Server - Quick Start Guide

Get up and running with the MAS MCP Server in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- Access to Merch at Scale Studio
- Adobe IMS credentials
- AOS API key

## Quick Setup

### 1. Get Your Credentials

**Get Access Token:**
```bash
./get-token.sh
```

This will open Studio in your browser. Then:
1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Type: `sessionStorage.masAccessToken`
4. Copy the token (without quotes)

**Get AOS API Key:**
- Check with your team lead or internal docs

### 2. Choose Your Editor

- **[Claude Desktop Setup →](./SETUP-CLAUDE-DESKTOP.md)**
- **[Cursor Setup →](./SETUP-CURSOR.md)**

## Testing

Once configured, try these commands:

### In Claude Desktop:
```
List all products
```

### In Cursor:
```
@mas List all products
```

You should see a list of Adobe products!

## Example Workflows

### Create a Merch Card
```
Create a merch card for Photoshop Individual plan in /content/dam/mas/photoshop
```

Response includes:
- ✅ Card details (ID, path, fields)
- 🔗 Link to view in Studio
- 🔗 Link to view folder

### Search for Offers
```
Find all ABM offers for Photoshop Individual customers
```

Response includes:
- ✅ List of matching offers
- 📊 Offer details (commitment, term, pricing)
- 🔗 Link to view related cards in Studio
- 🔗 Link to create cards with AI

### Link Card to Offer
```
Link card abc-123 to offer selector XYZ456 and sync pricing
```

Response includes:
- ✅ Updated card with offer selector
- 💰 All pricing formats (price, optical, annual, strikethrough)
- 🔗 Link to view in Studio

### Validate Card
```
Validate that card abc-123 has correct tags for its linked offer
```

Response includes:
- ✅ Validation status
- ⚠️ List of any issues found
- 💡 Suggested fixes
- 🔗 Link to view in Studio

## Available Tools (18 total)

### Card Management (7 tools)
- `create_card` - Create new merch cards
- `get_card` - Get card by ID
- `update_card` - Update card fields/tags
- `delete_card` - Delete a card
- `search_cards` - Search with filters
- `duplicate_card` - Clone a card
- `publish_card` - Publish to production

### Collection Management (3 tools)
- `create_collection` - Create card collections
- `get_collection` - Get collection by ID
- `add_cards_to_collection` - Add cards to collection

### Offer Discovery (4 tools)
- `search_offers` - Search AOS offers
- `get_offer_by_id` - Get specific offer
- `list_products` - List Adobe products
- `compare_offers` - Compare product offers

### Offer Selectors (2 tools)
- `create_offer_selector` - Create OSI
- `resolve_offer_selector` - Get offers from OSI

### Card-Offer Linking (2 tools)
- `link_card_to_offer` - Link card to OSI
- `validate_card_offer` - Check consistency

## Deep Linking to Studio

Every response includes Studio links with filters pre-applied!

Example response:
```json
{
  "cards": [...],
  "studioLinks": {
    "viewInStudio": "https://mas.adobe.com/studio.html#page=content&tags=mas:plan_type/abm"
  }
}
```

Click the link to jump directly to Studio with the ABM filter applied!

## Common Use Cases

### 1. Product Launch
```
Create cards for all Photoshop Individual plan types (ABM, PUF, M2M)
in /content/dam/mas/photoshop, link them to their offers, and create
a collection called "Photoshop Individual Plans"
```

### 2. Offer Analysis
```
Compare all offers for Creative Cloud All Apps and show me which
plan types are available for Individual customers
```

### 3. Content Audit
```
Find all merch cards in /content/dam/mas/photoshop that are missing
offer selectors
```

### 4. Bulk Update
```
For all Photoshop cards, validate that their tags match their linked
offers and fix any inconsistencies
```

## Troubleshooting

### Token Expired
Access tokens expire. Run `./get-token.sh` again to get a fresh one.

### MCP Not Found
1. Check the path in your config points to `dist/index.js`
2. Make sure you ran `npm run build`
3. Check Node version: `node --version` (need 18+)

### Authentication Errors
1. Make sure you copied the entire token
2. Check for extra quotes or spaces
3. Verify the token is still valid (not expired)

### Connection Errors
1. Check you can access https://mas.adobe.com/studio.html
2. Verify AOS API key is correct
3. Check network connectivity

## Documentation

- **[Full API Reference](./API.md)** - All 18 tools with parameters
- **[Usage Examples](./EXAMPLES.md)** - 17 practical examples
- **[README](./README.md)** - Complete documentation

## Getting Help

1. Check the setup guides for your editor
2. Review the troubleshooting sections
3. Check the example workflows
4. Contact the Merch at Scale team

## Next Steps

1. ✅ Set up your credentials
2. ✅ Configure Claude Desktop or Cursor
3. ✅ Test with "List all products"
4. 📖 Review [EXAMPLES.md](./EXAMPLES.md) for more ideas
5. 🚀 Start creating cards and managing offers!

---

**Remember**: Every response includes clickable Studio links - use them to view and edit content in the actual Merch at Scale Studio UI!
