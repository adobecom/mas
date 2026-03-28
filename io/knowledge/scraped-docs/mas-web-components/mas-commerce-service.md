# mas-commerce-service (mas.js)

> Source: https://mas.adobe.com/web-components/docs/mas.js.html

---

## Overview

mas.js is a JavaScript library that enables M@S commerce functionality on any page. It registers and loads the following web components:

- `inline-price` - Renders pricing information
- `checkout-link` - Generates checkout URLs
- `checkout-button` - Renders checkout buttons (Spectrum styled)
- `merch-card` - Displays merchandise cards

When loaded, mas.js creates an invisible `mas-commerce-service` custom element on the page that coordinates all commerce operations.

## Script Tag

```html
<script src="https://www.adobe.com/mas/commerce/mas.js" type="module"></script>
```

For Safari compatibility, a polyfill for constructable stylesheets is required:

```html
<script src="https://www.adobe.com/mas/commerce/polyfills.js" type="module"></script>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `wcs-api-key` | string | `wcms-commerce-ims-ro-user-milo` | API key for Web Commerce Service |
| `locale` | string | `en_US` | Locale code (e.g., `en_US`, `fr_FR`, `ja_JP`) |
| `language` | string | `en` | Language for pricing display |
| `country` | string | `US` | Country code for geo-specific pricing |
| `env` | string | `production` | Environment: `production` or `stage` |
| `force-tax-exclusive` | boolean | `false` | Force tax-exclusive pricing display |
| `checkout-client-id` | string | `creative` | Client ID for checkout flows |
| `preview` | boolean | `false` | Enable preview mode for unpublished content |
| `allow-override` | string | (none) | Comma-separated list of attributes that can be overridden via URL parameters |

## Methods

### registerCheckoutAction(action)

Registers a custom checkout action handler. Called when a checkout link/button is clicked.

```javascript
document.querySelector('mas-commerce-service')
  .registerCheckoutAction((offers, options, element) => {
    // Custom checkout logic
  });
```

### flushWcsCache()

Clears the cached WCS (Web Commerce Service) responses, forcing fresh fetches on next request.

### refreshOffers()

Re-fetches all offers on the page, updating pricing and checkout links with latest data.

### refreshFragments()

Re-fetches all AEM fragment-backed components (e.g., merch-card) on the page.

## Configuration Example

```html
<mas-commerce-service
  wcs-api-key="my-api-key"
  locale="en_US"
  language="en"
  country="US"
  env="production"
  checkout-client-id="creative"
></mas-commerce-service>
```

## URL Parameter Overrides

When `allow-override` is set, certain attributes can be overridden via URL parameters:

- `?env=stage` - Switch to stage environment
- `?locale=fr_FR` - Override locale
- `?promo=PROMO_CODE` - Apply a promotion code globally
