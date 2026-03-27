# Inline Price Component

## Overview

The `inline-price` custom element displays dynamic pricing information retrieved from WCS (Web Commerce Service) using an Offer Selector ID (OSI). It automatically resolves offers and formats prices based on the page locale.

In MAS Studio, prices are added via the **Offer Selector Tool (OST)** which inserts inline-price components - authors never type prices directly.

## Usage

```html
<span is="inline-price" data-wcs-osi="A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M"></span>
```

With display options:
```html
<span
    is="inline-price"
    data-wcs-osi="ABC123..."
    data-display-per-unit="true"
    data-display-tax="true"
    data-display-recurrence="true"
></span>
```

## Required Attribute

| Attribute | Description |
| --- | --- |
| `data-wcs-osi` | **Required.** The Offer Selector ID that identifies the pricing offer in WCS. |

## Display Attributes

| Attribute | Description | Default |
| --- | --- | --- |
| `data-display-old-price` | Show original price for promotional offers (strikethrough) | true |
| `data-display-per-unit` | Show per-unit pricing (e.g., "per license") | false |
| `data-display-recurrence` | Show billing frequency ("/mo" or "/yr") | true |
| `data-display-tax` | Include tax information in display | false |
| `data-display-plan-type` | Show plan type indicator | - |
| `data-display-annual` | Show annual pricing equivalent | - |

## Offer Attributes

| Attribute | Description |
| --- | --- |
| `data-perpetual` | Mark as perpetual (non-subscription) offer |
| `data-promotion-code` | Apply a flex promotion code |
| `data-quantity` | Set quantity for volume pricing (default: 1) |
| `data-force-tax-exclusive` | Override automatic tax calculation mode |

## Template Options

The `data-template` attribute controls how the price renders:

| Template | Description |
| --- | --- |
| `price` | Default offer pricing display |
| `discount` | Show discount percentage (e.g., "19%") |
| `optical` | Monthly equivalent for paid-upfront annual offers |
| `annual` | Yearly equivalent for monthly-billed annual offers |
| `strikethrough` | Crossed-out price formatting |

## Properties

| Property | Description |
| --- | --- |
| `isInlinePrice` | Returns true for inline-price elements |
| `onceSettled` | Promise that resolves when pricing loads or fails |
| `value` | Resolved price data object from WCS |
| `options` | Configuration properties used for resolution |

## Methods

| Method | Description |
| --- | --- |
| `requestUpdate(force)` | Triggers re-render. Pass `true` to bypass cache. |

## Events

The component dispatches events during its lifecycle:

| Event | CSS Class | Description |
| --- | --- | --- |
| `mas:pending` | `placeholder-pending` | Price is loading |
| `mas:resolved` | `placeholder-resolved` | Price loaded successfully |
| `mas:failed` | `placeholder-failed` | Price failed to load |

## How Prices Are Added in MAS Studio

Authors do not type prices directly. Instead:

1. In the RTE editor, click the **shopping cart icon** (OST button)
2. The Offer Selector Tool opens showing available offers
3. Search and select an offer from WCS
4. Configure display options (recurrence, tax, etc.)
5. Click Insert - OST adds the inline-price component with the OSI

The component then fetches the current price from WCS at render time.

## Locale and Currency

- Currency is determined by the page/fragment locale
- The component automatically fetches the correct localized price
- Regional offers may not be valid for all locales
- Cannot manually override currency - it follows the page locale

## Troubleshooting

### Price Not Showing
- Verify `data-wcs-osi` contains a valid offer ID
- Check if offer is valid for the current locale
- Look for WCS errors in browser console
- Ensure offer is within market start/end dates

### Price Shows Wrong Value
- Offer may have different pricing per region
- Check if a promo code is applied
- Verify quantity setting
