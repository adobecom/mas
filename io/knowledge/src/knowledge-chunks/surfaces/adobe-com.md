# Creating Cards for Adobe.com

Adobe.com is the primary surface for product marketing and commerce. Cards on adobe.com appear on pricing pages, product pages, and promotional landing pages.

## Available Variants

| Variant | Best For |
|---------|----------|
| **Catalog** | Standard product display with pricing and features |
| **Plans** | Subscription plan comparisons |
| **Plans v2** | Enhanced subscription plans with richer content |
| **Plans Students** | Student-specific pricing and offers |
| **Plans Education** | K-12 and higher education institutions |
| **Special Offers** | Promotional campaigns, sales events |

## Content Guidelines

### Tone and Voice
- Professional but approachable
- Focus on value and benefits, not just features
- Use action-oriented language
- Keep messaging consistent with Adobe brand voice

### Title Field
- **Character limit:** 50 characters recommended
- **Best practice:** Lead with the product name or key benefit
- **Examples:** "Creative Cloud All Apps", "Save 40% on Photoshop"

### Description Field
- **Character limit:** 150 characters recommended
- **Best practice:** Highlight the main value proposition
- **Avoid:** Technical jargon, feature lists (save for "What's Included")

### Badge Field
- **When to use:** Promotional campaigns, highlighting featured offers
- **Examples:** "Best Value", "Most Popular", "Save 40%"
- **Character limit:** 20 characters

### Pricing
- **Never type prices manually** - always use OST (Offer Selector Tool)
- Dynamic pricing ensures correct regional pricing and promotions
- Strikethrough pricing appears automatically during sales

### CTAs (Call-to-Action)
- **Buy now:** User ready to purchase
- **Free trial:** Trial-focused campaigns
- **Start free trial:** Emphasized trial messaging
- **Learn more:** Educational content, pre-decision stage

## Publishing Workflow

1. **Create or edit** your card in MAS Studio
2. **Preview** the card to verify appearance
3. **Save** to create a draft
4. **Publish** to make the card live on adobe.com

### Preview URLs
- Stage: `https://www.stage.adobe.com/...`
- Production: `https://www.adobe.com/...`

## Common Issues

### Card not appearing on page
- Verify the card is **published** (not just saved)
- Check that the correct **locale** is selected
- Confirm the **fragment path** matches the page configuration

### Pricing shows wrong amount
- Ensure you used **OST** to set pricing (not manual text)
- Check the **promo code** is correct for the campaign
- Verify the **WCS landscape** (PUBLISHED vs DRAFT)

### Badge not showing
- Badge field might be empty or have only whitespace
- Some variants don't support badges - check variant documentation

## Gallery
View example cards: [Adobe.com Card Gallery](https://main--milo--adobecom.aem.live/libs/features/mas/docs/plans.html)
