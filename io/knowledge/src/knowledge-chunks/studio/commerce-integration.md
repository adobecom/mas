# Commerce Integration

## Overview

MAS Studio connects to Adobe's commerce services to resolve product pricing, generate checkout links, and display real-time offer data on merch cards. This integration involves several services and components working together to deliver accurate, locale-aware pricing to end users.

## Key Services

### WCS (Web Commerce Service)

WCS provides pricing, tax, and currency data for Adobe products. It resolves offer identifiers into formatted prices based on locale, currency, and customer segment.

- **CDN Endpoint (cached)**: `https://www.adobe.com/web_commerce_artifact`
- **Origin Endpoint (fresh)**: `https://commerce.adobe.com/web_commerce_artifact`
- CDN cache TTL is approximately 5 minutes
- Origin endpoint bypasses cache for testing and debugging

### AOS (Available Offer Service)

AOS resolves offer selectors into actual offers with full pricing details. It handles:
- Offer availability by country and language
- Customer segment filtering (individual, team, enterprise)
- Promotional pricing and discounts
- Offer bundling and dependencies

### OSI (Offer Selector ID)

An OSI is a short alphanumeric code that identifies a specific product offer:
- Format: short string like "ABM", "M2M", "PUF", "ccsn_direct_individual"
- Each OSI maps to a product, term, and pricing combination
- Cards store OSIs in their `prices` field
- Multiple OSIs can be comma-separated for soft bundles

Examples:
- `ABM` - Acrobat Pro monthly
- `M2M` - Creative Cloud All Apps monthly
- `PUF` - Photoshop annual paid upfront

## OST (Offer Selector Tool)

OST is Studio's built-in offer picker component that helps authors select the correct OSI for their cards.

### What OST Does

1. Displays a searchable catalog of available offers
2. Filters by product, commitment, term, and customer segment
3. Shows resolved pricing for each offer in the current locale
4. Lets authors pick an offer and inserts the OSI into the card's price field
5. Provides a preview of how the price will render

### How to Use OST

1. Open a card for editing in Studio
2. Click the price field or the OST button
3. Browse or search for the desired product offer
4. Select the offer to insert its OSI
5. The card preview updates with the resolved price

## mas-commerce-service Element

The `mas-commerce-service` custom element configures the commerce connection for all pricing components on the page.

### Configuration Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `wcs-api-key` | API key for WCS authentication | `wcms-commerce-ims-ro-user-milo` |
| `locale` | Language code | `en_US`, `fr_FR`, `ja_JP` |
| `country` | ISO country code | `US`, `FR`, `JP` |
| `env` | Environment (production or stage) | `PRODUCTION`, `STAGE` |

### Example

```html
<mas-commerce-service
  wcs-api-key="wcms-commerce-ims-ro-user-milo"
  locale="en_US"
  country="US"
  env="PRODUCTION">
</mas-commerce-service>
```

This element must be present on the page before any pricing components can resolve.

## Price Resolution Flow

The full flow from card authoring to rendered price:

1. **Author selects OSI**: Using OST, the author picks an offer and the OSI is saved to the card's `prices` field
2. **Card renders**: When a consumer surface loads the card, the `merch-card` component reads the OSI
3. **WCS request**: The `inline-price` element inside the card sends the OSI to WCS with locale and country parameters
4. **Price resolution**: WCS returns the resolved price, formatted for the locale
5. **Display**: The `inline-price` element renders the formatted price string (e.g., "$22.99/mo")

### For Multiple Prices

Cards can display multiple price points:
- Regular price and strikethrough price
- Monthly and annual pricing
- Individual and team pricing

Each price point uses its own OSI and `inline-price` element.

## Pricing Events

Commerce components dispatch events during the price resolution lifecycle:

| Event | When | Payload |
|-------|------|---------|
| `mas:ready` | Card fully loaded with resolved prices | Card element reference |
| `mas:error` | Card failed to load or resolve | Error details |
| `mas:pending` | Price resolution started | OSI being resolved |
| `mas:resolved` | Price successfully resolved | Resolved price data |
| `mas:failed` | Price resolution failed | Error details, OSI |

### Listening for Events

```javascript
document.addEventListener('mas:resolved', (event) => {
    console.log('Price resolved:', event.detail);
});

document.addEventListener('mas:failed', (event) => {
    console.error('Price failed:', event.detail);
});
```

These events are useful for debugging pricing issues and for consumer surfaces that need to track card loading state.

## Checkout Links

The `checkout-link` custom element generates UCv3 (Unified Checkout v3) checkout URLs.

### How Checkout Links Work

1. The card's CTA button uses a `checkout-link` element
2. The element reads the associated OSI and locale
3. It generates a UCv3 URL with the correct parameters:
   - Offer ID
   - Country and language
   - Client ID
   - Promotional codes (if applicable)
4. Clicking the CTA opens the checkout flow with the product pre-selected

### Checkout URL Structure

```
https://commerce.adobe.com/store/{country}?items[0][id]={offerId}&cli={clientId}&lang={language}
```

Parameters are encoded and may include additional context like promotional codes, co-term settings, and return URLs.

## Soft Bundles

Soft bundles combine multiple products into a single pricing display using comma-separated OSIs.

### How to Create a Soft Bundle

In the card's prices field, enter multiple OSIs separated by commas:

```
ABM,PUF,ILST
```

### How Soft Bundles Resolve

1. WCS receives all OSIs in a single request
2. Individual prices are resolved for each product
3. The total bundle price is calculated
4. The inline-price element displays the combined price
5. The checkout link includes all products in the cart

Soft bundles are commonly used for "Get Photoshop + Lightroom" style offers.

## Price Template Variants

The `inline-price` element supports several display variants:

| Variant | Display | Use Case |
|---------|---------|----------|
| `price` | $22.99/mo | Standard price display |
| `discount` | $22.99/mo (was $34.99/mo) | Shows discount with original |
| `optical` | $22.99/mo per license | Per-seat pricing for teams |
| `annual` | $263.88/yr | Annual total instead of monthly |
| `strikethrough` | ~~$34.99/mo~~ | Crossed-out original price |

### Setting a Price Variant

```html
<span is="inline-price"
      data-wcs-osi="ABM"
      data-template="discount">
</span>
```

The variant is set via the `data-template` attribute on the inline-price element.

## Troubleshooting

### Prices Not Displaying

1. Verify `mas-commerce-service` element is present on the page
2. Check that the OSI code is valid and active
3. Confirm the locale and country are supported for the offer
4. Look for `mas:failed` events in the browser console
5. Test with the WCS origin endpoint to bypass CDN cache

### Wrong Currency or Format

- Currency is determined by the `country` attribute on `mas-commerce-service`
- Formatting follows the `locale` attribute
- Ensure these match the fragment's locale path

### Checkout Link Not Working

- Verify the offer ID resolves correctly in WCS
- Check that the UCv3 environment matches (PRODUCTION vs STAGE)
- Confirm the client ID is authorized for the checkout flow
- Look for console errors when clicking the CTA

### Stale Prices

- CDN cache refreshes every 5 minutes
- For immediate updates, test against the origin endpoint
- Price changes in the commerce system may take time to propagate
- Clear browser cache to eliminate local caching
