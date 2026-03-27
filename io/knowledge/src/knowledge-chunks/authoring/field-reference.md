# Field Reference Guide

This guide explains every field available in the MAS Studio card editor. Use it to understand what each field does and how to fill it effectively.

---

## General Info Section

### Template (Card Variant)
- **Purpose:** Determines the card type and available fields
- **How to set:** Select from dropdown
- **Important:** Changing variant may reset some field values
- **See:** [Variant Guide](variant-guide.md) for choosing the right variant

### Style
- **Purpose:** Visual theme of the card
- **Options:** Default (light), Dark
- **When to use Dark:** Cards on dark backgrounds, night mode contexts

### Card Name
- **Purpose:** Internal identifier for the card
- **Character limit:** 100 characters
- **Best practice:** Use descriptive names like "Photoshop-US-BlackFriday-2024"
- **Note:** Not visible to end users

### Fragment Title
- **Purpose:** AEM fragment title for content management
- **Character limit:** 150 characters
- **Best practice:** Match or relate to Card Name

### Fragment Description
- **Purpose:** Internal notes about the card's purpose
- **Best practice:** Document the campaign, target audience, or special notes

---

## Visuals Section

### Mnemonic Icon
- **Purpose:** Product icon displayed on the card
- **How to set:** Click the icon picker, search for the product
- **Supported:** All Adobe product icons (Photoshop, Illustrator, etc.)
- **Note:** Icon automatically inherits from product if OSI is set

### Badge
- **Purpose:** Eye-catching label above the card
- **Character limit:** 20 characters recommended
- **Examples:** "Best Value", "Most Popular", "Save 40%", "New"
- **When to use:** Promotional campaigns, highlighting featured offers
- **Note:** Leave empty if no badge needed

### Trial Badge
- **Purpose:** Secondary badge for trial-specific messaging
- **Character limit:** 20 characters
- **Examples:** "7-day trial", "Try free"
- **When to use:** When you need both a promo badge and trial indicator

### Border Color
- **Purpose:** Card border color for visual emphasis
- **How to set:** Color picker or hex value
- **Best practice:** Use sparingly, mainly for promotions
- **Default:** None (no border)

### Background Color
- **Purpose:** Card background color
- **How to set:** Color picker or hex value
- **Best practice:** Usually leave default; use for special campaigns
- **Note:** Ensure text remains readable on chosen background

---

## What's Included Section

### What's Included (Application List)
- **Purpose:** List of products/features included in the offer
- **How to add:** Click "Add application" button
- **Display:** Shows product icons with names
- **Best practice:** List 3-5 most important items
- **When to use:** Plans and bundles that include multiple products

---

## Quantity Selection Section

### Show Quantity Selector
- **Purpose:** Enable quantity selection for the offer
- **Type:** Checkbox (on/off)
- **When to use:** Volume licensing, multi-seat purchases

### Quantity Selector Title
- **Purpose:** Label for the quantity picker
- **Example:** "Number of licenses", "Seats"
- **Only shown:** When quantity selector is enabled

### Start Quantity
- **Purpose:** Default starting quantity
- **Type:** Number
- **Example:** 1, 5, 10
- **Note:** Must be numeric values only

### Step
- **Purpose:** Quantity increment value
- **Type:** Number
- **Example:** 1 (count by ones), 5 (count by fives)
- **Note:** Must be numeric values only

---

## Price and Promo Section

### Product Price
- **Purpose:** Dynamic pricing display
- **Type:** Rich Text (RTE)
- **How to set:** Use OST button - never type prices manually
- **Includes:** Price, currency, billing frequency, strikethrough for sales
- **Important:** Always use OST for accurate, localized pricing

### OSI Search (Offer Selector Tool)
- **Purpose:** Connect card to WCS pricing data
- **How to use:**
  1. Click "OSI Search" button
  2. Search by product name or OSI code
  3. Select the correct offer
  4. Pricing automatically populates
- **Critical:** This is the only way to ensure accurate pricing

### Promo Code
- **Purpose:** Apply promotional pricing
- **Character limit:** 50 characters
- **Example:** "BFCM2024", "BACK2SCHOOL"
- **Note:** Must match active promo codes in WCS

### Promo Text
- **Purpose:** Promotional messaging near the price
- **Character limit:** 100 characters
- **Examples:** "Limited time offer", "Save 40% - ends soon"
- **Best practice:** Create urgency without being pushy

### Per Unit Label
- **Purpose:** Pricing unit label
- **Examples:** "/mo", "/yr", "/user/mo"
- **Note:** Usually auto-populated from OST

---

## Product Details Section

### Product Description
- **Purpose:** Main description of the product/offer
- **Type:** Rich Text (RTE)
- **Character limit:** 500 characters recommended
- **Best practice:** Focus on benefits, not just features
- **Supports:** Bold, italic, links, icons

### Short Description
- **Purpose:** Brief tagline or summary
- **Type:** Rich Text (RTE)
- **Character limit:** 150 characters recommended
- **Examples:** "The complete creative suite", "Photo editing made simple"
- **When to use:** Above the fold, quick value proposition

### Callout Text
- **Purpose:** Highlighted message or call-out
- **Type:** Rich Text (RTE)
- **Supports:** Links, icons
- **Examples:** "Includes 100GB cloud storage", "Works on all devices"
- **When to use:** Key differentiator or bonus feature

---

## Footer Section

### Footer (CTAs)
- **Purpose:** Call-to-action buttons
- **How to add:** Add CTA links with text and URL
- **CTA options:** Buy now, Free trial, Learn more, Upgrade, etc.
- **Best practice:** 1-2 CTAs maximum; primary action should be obvious
- **See:** [CTA Guide](cta-guide.md) for choosing the right CTA text

---

## Options and Settings Section

### Secure Transaction Label
- **Purpose:** Show security badge/message
- **Type:** Toggle (on/off)
- **When to use:** Checkout-related cards, building trust
- **Display:** Usually shows lock icon or "Secure checkout"

### Plan Type Text
- **Purpose:** Display plan type label
- **Type:** Toggle (on/off)
- **Examples:** "Annual plan", "Monthly plan"
- **When to use:** When plan type needs emphasis

### Addon
- **Purpose:** Mark card as an add-on product
- **Type:** Dropdown
- **When to use:** Products that complement a main purchase
- **Example:** Adding Acrobat Pro to Creative Cloud

### Send to Translation?
- **Purpose:** Flag card for translation workflow
- **Type:** Toggle (on/off)
- **When to use:** Cards that need localization
- **Note:** Works with Adobe's translation management system

---

## Rich Text Editor (RTE) Tips

Fields marked as "Rich Text (RTE)" support formatting:

### Available Formatting
- **Bold:** Highlight important words
- **Italic:** Emphasis
- **Links:** Checkout links, learn more links
- **Icons:** Mnemonic icons inline with text

### Best Practices
- Keep formatting minimal - too much bold loses impact
- Use links sparingly - one or two per field
- Icons should be relevant to the text

### Common Mistakes
- Typing prices manually (use OST instead)
- Over-formatting with bold everywhere
- Adding too many links

---

## Field Validation

### Required Fields (vary by variant)
- Title
- Product Price (via OST)
- At least one CTA

### Character Limits
Most fields have soft limits (recommendations) not hard limits. However:
- Badge: Keep under 20 characters
- Short Description: Keep under 150 characters
- Long Description: Keep under 500 characters

### Validation Errors
If you see an error:
1. Check for empty required fields
2. Verify OST was used for pricing
3. Check for unsupported characters
4. Ensure numeric fields contain only numbers
