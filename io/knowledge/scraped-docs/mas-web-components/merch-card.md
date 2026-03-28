# merch-card

> Source: https://mas.adobe.com/web-components/docs/merch-card.html

---

## Overview

The `merch-card` web component renders merchandise cards implementing design variants from ACOM and CCD Figma specifications. Cards can be backed by AEM fragments or authored statically with inline content.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | string | `catalog` | Card layout variant (see Active Variants) |
| `consonant` | boolean | `false` | Use Consonant design system styles |
| `spectrum` | boolean | `false` | Use Spectrum Web Components mode |
| `size` | string | (none) | Card size: `wide`, `super-wide` |
| `badge-color` | string | (none) | Badge text color (CSS color value) |
| `badge-background-color` | string | (none) | Badge background color (CSS color value) |
| `badge-text` | string | (none) | Badge label text |
| `daa-lh` | string | (none) | Analytics tracking identifier |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Card title text |
| `prices` | Array | All resolved inline-price elements |
| `promoPrice` | Element | The promotional price element |
| `promotionCode` | string | Active promotion code |
| `regularPrice` | Element | The regular (non-promo) price element |
| `annualPrice` | Element | Annual price element |
| `planTypeText` | string | Plan type label (e.g., "Annual") |
| `promoText` | string | Promotional text content |
| `taxText` | string | Tax information text |
| `recurrenceText` | string | Billing recurrence label (e.g., "/mo") |
| `unitText` | string | Per-unit label |
| `seeTermsInfo` | string | Terms and conditions text |
| `renewalText` | string | Renewal information text |
| `ctas` | Array | All call-to-action elements |
| `primaryCta` | Element | Primary CTA button/link |
| `secondaryCta` | Element | Secondary CTA button/link |
| `failed` | boolean | Whether the card failed to resolve |

## Slots

| Slot | Description |
|------|-------------|
| `icons` | Product/app icons |
| `heading-xs` | Extra-small heading |
| `heading-m` | Medium heading |
| `body-xxs` | Extra-extra-small body text |
| `body-xs` | Extra-small body text |
| `footer` | Footer content (CTAs, links) |
| (default) | Default slot for main content |

## Events

| Event | Description |
|-------|-------------|
| `mas:ready` | Card fully resolved and rendered |
| `mas:error` | Non-fatal error during resolution |
| `mas:failed` | Card failed to resolve (fatal) |
| `aem:error` | AEM fragment fetch error |

## Active Variants

| Variant | Description |
|---------|-------------|
| `catalog` | Standard product catalog card |
| `image` | Image-prominent card |
| `inline-heading` | Card with inline heading layout |
| `mini-compare-chart` | Comparison chart card |
| `plans` | Plan selection card |
| `product` | Product detail card |
| `segment` | Audience segment card |
| `special-offers` | Promotional/special offer card |
| `ccd-slice` | CCD slice layout |
| `ccd-suggested` | CCD suggested product card |
| `ah-try-buy-widget` | Try/buy widget for Adobe Home |
| `mini` | Minimal compact card |

## Usage Examples

### AEM Fragment-backed Card

```html
<merch-card
  variant="catalog"
  consonant
>
  <aem-fragment fragment="your-fragment-id"></aem-fragment>
</merch-card>
```

### Static Card with Pricing

```html
<merch-card variant="catalog">
  <h3 slot="heading-xs">Photoshop</h3>
  <div slot="body-xs">
    <p>Edit and composite photos with the industry standard.</p>
    <p><span is="inline-price" data-wcs-osi="photoshop-osi"></span></p>
  </div>
  <div slot="footer">
    <a is="checkout-link" data-wcs-osi="photoshop-osi">Buy now</a>
  </div>
</merch-card>
```

### Spectrum SWC Mode

```html
<merch-card variant="catalog" spectrum>
  <aem-fragment fragment="your-fragment-id"></aem-fragment>
</merch-card>
```

## Error Types and Flow

1. **Fragment fetch fails** (`aem:error`) - Card cannot load its AEM fragment data
2. **Offer resolution fails** (`mas:error`) - Pricing/offer data unavailable but card still renders
3. **Complete failure** (`mas:failed`) - Card cannot render at all, `failed` property set to `true`

Error flow: The card attempts graceful degradation. If the fragment loads but offers fail, the card renders with placeholder content. Only if the fragment itself fails does the card enter a fully failed state.
