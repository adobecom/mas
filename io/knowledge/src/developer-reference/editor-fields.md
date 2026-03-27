# MAS Studio Editor Fields

## Overview

The Merch Card Editor organizes fields into sections for easy navigation and editing.

## Field Sections

### Visuals

Visual elements that define the card appearance including icons, badges, and colors.

| Field | Description |
| --- | --- |
| mnemonics | Product icon/mnemonic display. Shows the Adobe product icon. |
| badge | Badge text displayed on the card (e.g., "Best Value", "New"). |
| trialBadge | Trial-specific badge for trial offers. |
| border-color | Card border color selection from allowed palette. |

### s included

| Field | Description |
| --- | --- |
| whatsIncluded | What's included list content. Rich text field for feature lists. |
| quantitySelect | Quantity selector configuration for license quantity selection. |

### Product details

Content fields describing the product including descriptions and callouts.

| Field | Description |
| --- | --- |
| description | Main product description. Rich text field with formatting support. |
| shortDescription | Short description shown in action menu or compact views. |
| callout | Callout text for highlighting special information. |

### Footer

Call-to-action buttons and links at the bottom of the card.

| Field | Description |
| --- | --- |
| ctas | Call-to-action buttons. Supports multiple CTAs with checkout links. |

### Options and settings

Additional configuration options for the card display.

| Field | Description |
| --- | --- |
| secureLabel | Secure transaction label toggle (shows lock icon and "Secure transaction" text). |
| planType | Plan type indicator (monthly, annual, etc.). |
| addon | Add-on product configuration. |

## All Available Fields

Complete reference of all editor fields:

| Field | Description |
| --- | --- |
| mnemonics | Product icon/mnemonic display. Shows the Adobe product icon. |
| badge | Badge text displayed on the card (e.g., "Best Value", "New"). |
| trialBadge | Trial-specific badge for trial offers. |
| border-color | Card border color selection from allowed palette. |
| whatsIncluded | What's included list content. Rich text field for feature lists. |
| quantitySelect | Quantity selector configuration for license quantity selection. |
| description | Main product description. Rich text field with formatting support. |
| shortDescription | Short description shown in action menu or compact views. |
| callout | Callout text for highlighting special information. |
| ctas | Call-to-action buttons. Supports multiple CTAs with checkout links. |
| secureLabel | Secure transaction label toggle (shows lock icon and "Secure transaction" text). |
| planType | Plan type indicator (monthly, annual, etc.). |
| addon | Add-on product configuration. |
| title | Card title. Main heading displayed prominently. |
| subtitle | Card subtitle. Secondary heading below the title. |
| prices | Pricing display. Shows price from WCS using inline-price component. |
| promoText | Promotional text displayed near price (e.g., "Save 40%"). |
| backgroundImage | Background image for card variants that support it. |
| size | Card size selection (default, wide, super-wide). |

## Variant-Specific Fields

Some fields only appear for certain card variants. The variant's fragment mapping defines which fields are available.

- Check the variant documentation for field availability
- Fields not in the mapping will be hidden in the editor
- Some variants have custom RTE marks for specialized formatting
