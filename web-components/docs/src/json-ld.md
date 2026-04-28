# JSON-LD Pricing Schema

Injects a [Schema.org Product](https://schema.org/Product) `<script type="application/ld+json">` block into the page `<head>`, making Adobe product pricing discoverable to agentic and AI-driven traffic.

## Import

```js
import { injectJsonLd } from '@adobecom/mas/web-components/src/json-ld.js';
// or via the commerce bundle
import { injectJsonLd } from '@adobecom/mas/web-components/src/commerce.js';
```

## API

```js
injectJsonLd(fields, offer, regularOffer, pageUrl)
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `fields` | `object` | Fragment fields object. Must include `cardTitle`. Optionally includes `description.value` (HTML string) and `mnemonicIcon` (array of SVG URLs). |
| `offer` | `object` | Resolved WCS offer. Must have `priceDetails.price` and `analytics` (JSON string with `currencyCode`). |
| `regularOffer` | `object\|null` | Resolved non-promotional offer used to derive `priceWithoutDiscount` when `offer` is a promo offer. Pass `null` if no promo is active. |
| `pageUrl` | `string` | The current page URL. Query parameters are stripped before use. |

### Return value

Returns the injected `<script>` element, or `null` if injection was skipped (see [Skip conditions](#skip-conditions)).

## Behavior

### Deduplication

Only one JSON-LD product block is injected per page URL. The script is keyed by `data-id="json-ld-product-{url}"`. Subsequent calls with the same page URL are no-ops and return `null`.

This is intentional — one signal link per product page.

### URL normalization

Query parameters are stripped from `pageUrl` before it is used in `@id` and `offer.url` fields.

```js
'https://www.adobe.com/products/photoshop?lang=en'
// → stored as
'https://www.adobe.com/products/photoshop'
```

### Pricing logic

| Scenario | `price` | `priceWithoutDiscount` |
|---|---|---|
| Standard (no promo) | `offer.priceDetails.price` | omitted |
| Promo with `priceWithoutDiscount` on offer | `offer.priceDetails.price` | `offer.priceDetails.priceWithoutDiscount` |
| Promo via `regularOffer` (lower price) | `offer.priceDetails.price` | `regularOffer.priceDetails.price` |
| Two BASE offers where offer > regularOffer | `regularOffer.priceDetails.price` | `offer.priceDetails.price` |
| `priceWithoutDiscount === price` | `offer.priceDetails.price` | omitted |

### Billing duration

| Condition | `billingDuration` |
|---|---|
| `offer.term === 'ANNUAL'` | `P1Y` |
| `offer.commitment === 'PERPETUAL'` | `P1Y` |
| All other cases | `P1M` |

### Images

`mnemonicIcon` SVG URLs are converted to raster by appending `?format=png&width=800&height=800` (Schema.org recommends raster images).

- Single icon → string
- Multiple icons → array of strings
- Empty or missing → `image` field omitted

## Skip conditions

`injectJsonLd` returns `null` and injects nothing when:

- `fields` is missing or has no `cardTitle`
- `offer` is `null` or `undefined`
- `offer.priceDetails.price` is `null` or `undefined`
- `offer.analytics` is missing or malformed (no `currencyCode`)
- A JSON-LD block for this page URL already exists in `<head>`

A console warning is emitted when the currency code is missing.

## Output schema

```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "@id": "https://www.adobe.com/products/photoshop#product",
  "name": "Adobe Photoshop",
  "brand": { "@type": "Brand", "name": "Adobe" },
  "description": "The industry-standard photo editing software.",
  "image": "https://cdn.adobe.com/icon.svg?format=png&width=800&height=800",
  "offers": [
    {
      "@type": "Offer",
      "@id": "https://www.adobe.com/products/photoshop#offer",
      "url": "https://www.adobe.com/products/photoshop",
      "priceCurrency": "USD",
      "price": "22.99",
      "availability": "https://schema.org/InStock",
      "category": "Subscription",
      "seller": { "@id": "https://www.adobe.com/#org" },
      "itemOffered": { "@id": "https://www.adobe.com/products/photoshop#product" },
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "22.99",
        "priceCurrency": "USD",
        "billingDuration": "P1M",
        "billingIncrement": 1
      }
    }
  ]
}
```

`description` and `image` are omitted if not present on the fragment. `priceWithoutDiscount` is included in `priceSpecification` only when a promotion is active.

## Usage example

```js
import { injectJsonLd } from './json-ld.js';

// Called after WCS offer resolution
const fields = {
    cardTitle: 'Adobe Photoshop',
    description: { value: '<p>The industry-standard photo editing software.</p>' },
    mnemonicIcon: ['https://cdn.adobe.com/ps-icon.svg'],
};

const offer = {
    priceDetails: { price: 22.99 },
    commitment: 'YEAR',
    term: 'MONTHLY',
    analytics: JSON.stringify({ currencyCode: 'USD' }),
};

injectJsonLd(fields, offer, null, window.location.href);
```
