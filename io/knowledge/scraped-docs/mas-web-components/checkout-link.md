# checkout-link

> Source: https://mas.adobe.com/web-components/docs/checkout-link.html

---

## Overview

The `checkout-link` element generates checkout URLs for Adobe commerce. It is a customized built-in element extending `<a>`, resolving its `href` from WCS offer data.

```html
<a is="checkout-link" data-wcs-osi="offer-selector-id">Buy now</a>
```

## Core Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-wcs-osi` | string | (required) | Offer Selector ID for the product |
| `data-checkout-workflow` | string | `UCv3` | Checkout workflow type: `UCv3`, `UCv2`, `V3` |
| `data-checkout-workflow-step` | string | `email` | Entry step: `email`, `segmentation`, `change-plan-team-plans`, `change-plan-team-payment`, `recommendation` |
| `data-extra-options` | string | (none) | JSON-encoded additional checkout parameters |
| `data-ims-country` | string | (none) | Override country from IMS profile |
| `data-perpetual` | boolean | `false` | Perpetual (one-time purchase) license |
| `data-promotion-code` | string | (none) | Promotion code to apply |
| `data-quantity` | number | `1` | Number of licenses |
| `data-entitlement` | boolean | `false` | Enable entitlement checking (hides link if user already owns) |
| `data-upgrade` | boolean | `false` | Enable upgrade flow |
| `data-modal` | boolean | `false` | Open checkout in modal instead of navigating |
| `data-analytics-id` | string | (none) | Analytics tracking identifier |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `isCheckoutLink` | boolean | Always `true`, identifies the element |
| `onceSettled` | Promise | Resolves when the link href is fully resolved or fails |
| `options` | Object | Resolved offer and checkout options |
| `value` | string | The resolved checkout URL |

## Methods

### requestUpdate(force)

Triggers re-resolution of the checkout URL. When `force` is `true`, bypasses cache.

```javascript
document.querySelector('[is="checkout-link"]').requestUpdate(true);
```

## Events

| Event | Description |
|-------|-------------|
| `mas:pending` | Link resolution started |
| `mas:resolved` | Link successfully resolved with valid href |
| `mas:failed` | Link resolution failed |

## Usage Examples

### Basic Checkout Link

```html
<a is="checkout-link" data-wcs-osi="photoshop-osi">Buy now</a>
```

### Checkout with Promotion

```html
<a is="checkout-link"
  data-wcs-osi="photoshop-osi"
  data-promotion-code="SAVE20"
  data-checkout-workflow="UCv3"
  data-checkout-workflow-step="email"
>Buy now - Save 20%</a>
```

### Modal Checkout

```html
<a is="checkout-link"
  data-wcs-osi="photoshop-osi"
  data-modal="true"
>Buy now</a>
```

### Multi-seat License

```html
<a is="checkout-link"
  data-wcs-osi="photoshop-team-osi"
  data-quantity="5"
>Buy 5 licenses</a>
```

### With Entitlement Check

```html
<a is="checkout-link"
  data-wcs-osi="photoshop-osi"
  data-entitlement="true"
>Buy now</a>
```

When `data-entitlement` is enabled, the link checks the user's IMS profile. If the user already owns the product, the link is hidden or replaced with an appropriate action.
