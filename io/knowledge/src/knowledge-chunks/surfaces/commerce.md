# Creating Cards for Commerce

Commerce cards appear during checkout and purchase flows. The primary variant is "Fries" - named after the classic "would you like fries with that?" upsell technique.

## Available Variants

| Variant | Best For |
|---------|----------|
| **Fries** | Checkout add-ons and upsells |

## Content Guidelines

### Context
Commerce cards appear when users are:
- In the middle of a purchase
- Already committed to buying something
- Open to relevant add-ons
- Making quick decisions

### Tone and Voice
- Quick and clear
- Value-focused
- Non-disruptive
- Complimentary to their purchase

### Fries Cards

**Purpose:** Add-on suggestions during checkout

**Why "Fries"?**
Like asking "would you like fries with that?" - offering relevant additions at the point of purchase.

**Best practices:**
- Show how it complements their purchase
- Keep messaging extremely brief
- Highlight the value/savings
- Make it easy to add with one click

**Example scenarios:**
- Buying Photoshop? Suggest Lightroom
- Getting single app? Offer All Apps upgrade
- Annual plan? Show multi-year savings

## Key Fields

### Title
- Product name only
- Or brief value prop: "Add Lightroom"

### Description
- One sentence maximum
- Focus on complementary value
- "Edit photos on any device"

### Pricing
- Show add-on price clearly
- Bundle savings if applicable
- Monthly vs. annual difference

### CTA
- **Add to cart:** Clear add action
- **Select:** Generic selection
- **Upgrade:** For plan upgrades

## Messaging Strategy

### The Upsell Moment
Users at checkout have highest purchase intent. Leverage this by:

1. **Relevance:** Only show products that make sense with their cart
2. **Value:** Explain why this adds value to their purchase
3. **Simplicity:** One-click add, no complicated decisions
4. **Savings:** If there's a bundle discount, show it prominently

### Don't Do
- Don't overwhelm with multiple options
- Don't use long descriptions
- Don't distract from completing the purchase
- Don't show irrelevant products

## Pricing Considerations

Commerce pricing is critical:
- Must be accurate to the cent
- Must reflect any bundle discounts
- Must show correct tax treatment
- Use OST - never manual entry

### Bundle Pricing
If adding a product creates a bundle discount:
- Show the original price struck through
- Show the bundle price
- Highlight the savings percentage

## Publishing Workflow

1. **Create** your Fries card in MAS Studio
2. **Configure product OSI** carefully - wrong product = wrong checkout
3. **Test in checkout flow** - not just in preview
4. **Coordinate with Commerce team** for integration
5. **Publish** when integration is ready

## Common Issues

### Card showing wrong product
- Double-check the OSI
- Verify the offer is still active
- Check regional availability

### Pricing mismatch with checkout
- OST prices must match checkout system
- Confirm WCS environment alignment
- Check for promo code conflicts

### Card not appearing during checkout
- Commerce integration must be configured
- Check targeting rules in the checkout system
- Verify publish status

## Testing

Commerce cards require end-to-end testing:
1. **Stage checkout flow** - test the full purchase journey
2. **Multiple cart scenarios** - different starting products
3. **Regional testing** - pricing varies by region
4. **Payment completion** - ensure the add works

## Coordination

Commerce cards require close collaboration:
- **Commerce team:** Integration and targeting
- **Pricing team:** Offer configuration
- **Legal:** Pricing display compliance
- **Analytics:** Conversion tracking

## Gallery
View example cards: [Commerce Card Gallery](https://main--milo--adobecom.aem.live/libs/features/mas/docs/commerce.html)
