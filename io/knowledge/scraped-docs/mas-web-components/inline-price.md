# inline-price

> Source: https://mas.adobe.com/web-components/docs/inline-price.html

---

## Overview

The `inline-price` element renders pricing information from WCS (Web Commerce Service) using an Offer Selector ID. It is a customized built-in element extending `<span>`.

```html
<span is="inline-price" data-wcs-osi="offer-selector-id"></span>
```

## Core Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-wcs-osi` | string | (required) | Offer Selector ID. Supports comma-separated values for soft bundles |
| `data-display-old-price` | boolean | `true` | Show strikethrough old price when promotion active |
| `data-display-per-unit` | boolean | `false` | Show per-unit pricing label |
| `data-display-recurrence` | boolean | `true` | Show recurrence label (e.g., "/mo") |
| `data-display-tax` | boolean | `false` | Show tax information |
| `data-perpetual` | boolean | `false` | Display as perpetual (one-time) license price |
| `data-promotion-code` | string | (none) | Promotion code to apply to pricing |
| `data-force-tax-exclusive` | boolean | `false` | Force tax-exclusive display regardless of locale |
| `data-template` | string | `price` | Display template variant |
| `data-quantity` | number | (none) | Quantity for per-unit pricing |

## Template Variants

| Template | Description |
|----------|-------------|
| `price` | Standard price display (default) |
| `discount` | Shows discount amount/percentage |
| `optical` | Optical (monthly equivalent) price for annual plans |
| `annual` | Full annual price |
| `strikethrough` | Strikethrough price only |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `isInlinePrice` | boolean | Always `true`, identifies the element |
| `onceSettled` | Promise | Resolves when price is fully resolved or fails |
| `value` | string | The resolved price display text |
| `options` | Object | Resolved offer options |

## Methods

### requestUpdate(force)

Triggers a re-render of the price. When `force` is `true`, bypasses the WCS cache and fetches fresh data.

```javascript
document.querySelector('[is="inline-price"]').requestUpdate(true);
```

## Events

| Event | Description |
|-------|-------------|
| `mas:pending` | Price resolution started |
| `mas:resolved` | Price successfully resolved and rendered |
| `mas:failed` | Price resolution failed |

## Soft Bundle Support

Multiple Offer Selector IDs can be combined using comma separation. The resulting price is the sum of all resolved offers:

```html
<span is="inline-price" data-wcs-osi="osi-1,osi-2,osi-3"></span>
```

This renders the combined price of all three offers as a single displayed value.

## Usage Examples

### Basic Price

```html
<span is="inline-price" data-wcs-osi="photoshop-osi"></span>
```

### Promotional Price with Old Price

```html
<span is="inline-price"
  data-wcs-osi="photoshop-osi"
  data-promotion-code="SAVE20"
  data-display-old-price="true"
></span>
```

### Optical Monthly Price

```html
<span is="inline-price"
  data-wcs-osi="photoshop-annual-osi"
  data-template="optical"
></span>
```

### Annual Price with Tax

```html
<span is="inline-price"
  data-wcs-osi="photoshop-annual-osi"
  data-template="annual"
  data-display-tax="true"
></span>
```
