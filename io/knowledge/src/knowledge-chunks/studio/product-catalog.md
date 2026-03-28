# Product Catalog

## What Is the Product Catalog

The Product Catalog is a browsable directory of Adobe products sourced from AOS (Adobe Offer System) via the MCS (Merch Content Service) integration. It provides a searchable index of products with their arrangement codes, product families, market segments, and plan types.

The catalog serves two primary purposes:
1. **Product discovery**: Browse and search Adobe's product inventory to find arrangement codes and product details.
2. **Fragment creation**: Select a product and bulk-create card fragments for multiple variants in a single operation.

## Navigating to the Product Catalog

1. Open MAS Studio.
2. Click "Product Catalog" in the left side navigation.
3. The catalog loads and displays the full product list.

The product list is fetched from the MCS API when the page loads. A loading indicator appears while data is being retrieved.

## Browsing Products

The Product Catalog displays a searchable table with the following columns:

| Column | Description |
|--------|-------------|
| Icon | Product icon (SVG) loaded from product assets |
| Product | Marketing name of the product |
| Code | Product code identifier |
| Arrangement | Arrangement code (unique product-offer identifier) |
| Family | Product family grouping |
| Segment | Customer segment (individual, team, enterprise) |
| Markets | Market segments the product is available in |
| Plan Types | Available plan types for the product |
| Action | "Create Fragment" button |

Each column header is visible for easy scanning. The arrangement code column includes a copy-to-clipboard button for quick access.

## Searching Products

Use the search bar at the top of the catalog to filter products by:
- Product name (marketing name)
- Product code
- Arrangement code
- Product family

The search filters in real time as you type. The product count updates to reflect the filtered results (e.g., "47 products" out of the full catalog).

Use the refresh button next to the search bar to reload the product data from MCS.

## Pagination

The catalog uses incremental loading for performance:
- Products are displayed 50 per page.
- A pagination bar at the bottom shows "Showing X of Y products."
- Click "Load more" to load the next batch of 50 products.
- The table also supports scroll-based loading: scrolling near the bottom automatically triggers loading the next page.

## Product Details

Double-click a product row to navigate to the product detail page. The detail view provides:

- **Marketing copy**: Product name and description from AOS.
- **Product details**: Product code, product family, customer segment, market segments.
- **Links**: Related URLs and resources.
- **Fulfillable items**: Items included in the product offering.
- **Tags**: Associated product tags and metadata.

Use the back navigation to return to the catalog list.

## Creating Release Cards

The "Create Fragment" button on each product row opens a dialog for bulk-creating card fragments:

### Step 1: Open the Creation Dialog

1. Find the product in the catalog.
2. Click the "Create Fragment" button on the product row.
3. A dialog opens showing the product name, code, and arrangement code.

### Step 2: Configure Surface

1. Use the Surface picker to select where the cards will live (ACOM, CCD, Express, etc.).
   - Only surfaces you have access to appear in the picker.
2. The dialog loads available variant templates for the selected surface.

### Step 3: Select Variant Templates

The dialog displays a grid of available card variant templates with live previews:

| Variant | Description |
|---------|-------------|
| plans | Standard subscription plan card |
| plans-education | Education-specific plan card |
| fries | Compact product card with icon |
| mini | Minimal card with title and CTA |
| catalog | Full catalog listing card |
| ccd-slice | CCD banner-style card |
| ccd-suggested | CCD recommendation card |
| ah-try-buy-widget | Adobe Home try/buy widget |
| ah-promoted-plans | Adobe Home promoted plans card |
| simplified-pricing-express | Express simplified pricing card |
| full-pricing-express | Express full pricing card |
| special-offers | Promotional special offer card |
| mini-compare-chart | Comparison chart (mini) |
| mini-compare-chart-mweb | Comparison chart (mobile web) |

Click template cards to select or deselect them. Selected templates are highlighted with a visual indicator.

Template previews are loaded from cached AEM fragments. A loading spinner appears while previews are being fetched.

### Step 4: Create Fragments

1. Review your selections: product, surface, and variant templates.
2. Click "Create N Fragment(s)" (the button shows the count of selected variants).
3. The system calls the MCS API to create fragments for each selected variant.
4. A toast notification reports success with the count of created fragments.

Created fragments are placed in the path `/content/dam/mas/{surface}/{locale}/` and can be found in the Fragments page.

## MCS Integration

The Product Catalog is powered by the MCS (Merch Content Service) integration:

- Product data is cached daily by an I/O Runtime action (`ost-products-write`).
- The catalog reads from this cache via the `list_products` MCP tool.
- Product arrangement codes map to offers in WCS/AOS for dynamic pricing.
- The product data includes icons, marketing copy, and classification metadata from AOS.

## Troubleshooting

**Products not loading:**
Check your network connection and authentication status. The catalog requires a valid IMS token. Try clicking the refresh button to reload.

**"Failed to load products" error:**
The MCS API may be temporarily unavailable. The error message is displayed with a "Retry" button. If the issue persists, check the I/O Runtime action health.

**Search returns no results:**
Verify your search term. The search matches against product name, code, arrangement code, and family. Try a shorter or broader search term.

**Template previews not loading:**
Template previews are fetched from Odin. If previews show placeholder text instead of live cards, check that your authentication token has not expired. The system will show a loading spinner while fetching and gracefully degrade to text labels if fetching fails.

**Fragment creation failed:**
Check the error message in the toast notification. Common causes:
- Insufficient permissions for the target surface.
- Invalid arrangement code (product may have been deprecated).
- Network timeout during the creation API call.

**Cannot see the Create Fragment button:**
Verify you have editor permissions for at least one surface. The surface picker only shows surfaces you have access to.

**Product icons not displaying:**
Some products may not have SVG icons in their asset data. The icon column will be empty for those products.
