# WCS/AOS Integration

## Overview

WCS (Web Content Service) and AOS (Adobe Offer Service) provide dynamic pricing data for merch cards. The fragment pipeline fetches and caches pricing information at runtime.

## OSI Codes

OSI (Offer Selection ID) codes identify specific products/offers:
- Format: Alphanumeric string (e.g., "ABM", "M2M", "PUF")
- Each OSI maps to a product/pricing combination
- Used in fragment \`prices\` field

## Fragment Pipeline Integration

### WCS Transformer
The pipeline's WCS transformer:
1. Extracts OSI codes from fragment fields
2. Fetches pricing from WCS CDN
3. Caches responses for performance
4. Injects resolved pricing into fragment

### Pricing Fields Affected
- \`prices\`: Resolved to actual price values
- \`strikethroughPrice\`: Original/list price
- \`ctaLink\`: Updated with checkout parameters

## WCS Endpoints

### CDN Endpoint (cached)
\`\`\`
GET https://www.adobe.com/web_commerce_artifact?offer_selector_ids={osi}&country={country}&language={language}
\`\`\`

### Origin Endpoint (fresh)
\`\`\`
GET https://commerce.adobe.com/web_commerce_artifact?...
\`\`\`

## Pricing Response Structure

\`\`\`json
{
  "offers": [{
    "offerId": "ABC123",
    "priceDetails": {
      "price": 9.99,
      "priceWithoutDiscount": 19.99,
      "priceWithoutTax": 9.99,
      "currency": "USD",
      "formatString": "\$9.99/mo"
    }
  }]
}
\`\`\`

## Locale/Currency Mapping

WCS uses locale to determine:
- Currency (USD, EUR, GBP, etc.)
- Price formatting
- Tax display rules
- Available offers

## Caching Strategy

### CDN Cache
- TTL: 5 minutes
- Invalidated on price updates
- Geographic edge caching

### Runtime Cache
- In-memory during request
- Prevents duplicate WCS calls
- Expires with request

## Troubleshooting

### Prices Not Showing
1. Check OSI code is valid
2. Verify locale is supported
3. Check WCS endpoint availability
4. Review pipeline logs

### Wrong Currency
- Check locale in fragment path
- Verify WCS request includes correct country param

### Price Mismatch
- CDN may have stale data
- Use origin endpoint for testing
- Wait for cache invalidation
