# MAS MCP Server

Model Context Protocol (MCP) server for Merch at Scale Studio operations. This server enables AI assistants (like Claude Desktop or Cursor) to perform operations on Adobe Experience Manager (AEM) content fragments, search Adobe Offer System (AOS) offers, and generate deep links to Merch at Scale Studio.

## Features

### Card Management
- Create, read, update, and delete merch cards
- Search and filter cards by tags, path, and content
- Duplicate cards
- Publish cards to production

### Collection Management
- Create and manage merch card collections
- Add/remove cards from collections
- Search collections

### Offer Discovery
- Search Adobe offers from AOS
- Get offer details by ID
- List Adobe products
- Compare offers for a product
- Find offers by product name

### Offer Selectors
- Create offer selector IDs
- Resolve offers from selectors
- Bulk create selectors
- Get checkout URLs

### Card-Offer Linking
- Link cards to offer selectors
- Sync card pricing with offers
- Validate card-offer consistency
- Find cards linked to offers
- Bulk update card tags

### Studio Deep Linking
All tool responses include deep links to Merch at Scale Studio with pre-applied filters and context, making it easy to jump from AI conversation to the Studio UI.

## Quick Start

**Get started in 5 minutes**: See **[QUICKSTART.md](./QUICKSTART.md)**

**Detailed Setup Guides:**
- **[Claude Desktop Setup →](./SETUP-CLAUDE-DESKTOP.md)**
- **[Cursor Setup →](./SETUP-CURSOR.md)**

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Get your access token:
```bash
./get-token.sh
```

4. Configure your editor (see setup guides above)

## Usage Examples

### Creating a Merch Card

```
Create a new merch card titled "Photoshop Individual Plan" in /content/dam/mas/photoshop with variant "plans" and size "wide"
```

The MCP will:
1. Create the card in AEM
2. Return the card details
3. Provide a Studio link to view the card

### Searching for Offers

```
Find all offers for Photoshop Individual plans with ABM plan type
```

The MCP will:
1. Search the product catalog for "Photoshop"
2. Query AOS for offers
3. Filter by plan type
4. Return offers with Studio links

### Linking Cards to Offers

```
Link card ID abc-123 to offer selector XYZ789 and sync pricing
```

The MCP will:
1. Update the card's mnemonicIcon field
2. Fetch formatted prices from WCS
3. Update card pricing fields
4. Return updated card with Studio link

### Getting Offer Details

```
Give me the details of offer ID: ABCDEF123456
```

The MCP will:
1. Query AOS for the offer
2. Return full offer details including pricing, commitment, term
3. Provide Studio links to view related cards

## Available Tools

### Card Tools
- `create_card` - Create a new merch card
- `get_card` - Get card by ID
- `update_card` - Update card fields
- `delete_card` - Delete a card
- `search_cards` - Search with filters
- `duplicate_card` - Duplicate a card
- `publish_card` - Publish to production

### Collection Tools
- `create_collection` - Create a collection
- `get_collection` - Get collection by ID
- `add_cards_to_collection` - Add cards to collection

### Offer Tools
- `search_offers` - Search AOS offers
- `get_offer_by_id` - Get offer details
- `list_products` - List Adobe products
- `compare_offers` - Compare offers for a product

### Offer Selector Tools
- `create_offer_selector` - Create offer selector ID
- `resolve_offer_selector` - Get offers from selector

### Card-Offer Tools
- `link_card_to_offer` - Link card to offer selector
- `validate_card_offer` - Validate consistency

## Architecture

```
src/
├── index.ts                    # MCP server entry point
├── types/                      # TypeScript type definitions
│   └── index.ts
├── config/                     # Configuration and constants
│   └── constants.ts
├── services/                   # Core service layer
│   ├── auth-manager.ts        # Adobe IMS authentication
│   ├── aem-client.ts          # AEM Content Fragment API
│   ├── aos-client.ts          # Adobe Offer System API
│   └── product-catalog.ts     # Product listing service
├── utils/                      # Utility functions
│   └── studio-url-builder.ts # Studio deep link generator
└── tools/                      # MCP tool implementations
    ├── card-tools.ts          # Card CRUD operations
    ├── collection-tools.ts    # Collection operations
    ├── offer-tools.ts         # Offer discovery
    ├── offer-selector-tools.ts # Offer selector operations
    ├── pricing-tools.ts       # Pricing and checkout
    └── card-offer-tools.ts    # Card-offer linking
```

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Troubleshooting

### Authentication Errors

If you get authentication errors:
1. Verify your `MAS_ACCESS_TOKEN` or `IMS_ACCESS_TOKEN` is valid
2. Check that the token hasn't expired
3. Ensure you have proper permissions for AEM and AOS

### Connection Errors

If the MCP server can't connect:
1. Check that the AEM base URL is correct
2. Verify network connectivity to AEM and AOS
3. Check that the AOS API key is valid

### Tool Errors

If specific tools fail:
1. Check the error message in the MCP response
2. Verify required parameters are provided
3. Check that fragments/offers exist before updating

## License

Adobe Internal Use Only

## Support

For issues or questions, contact the Merch at Scale team.
