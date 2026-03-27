# Creating Cards for Adobe Home

Adobe Home is the desktop application that serves as a hub for Adobe Creative Cloud users. Cards in Adobe Home appear as in-app prompts for trials, upgrades, and promotional offers.

## Available Variants

| Variant | Best For |
|---------|----------|
| **Try Buy Widget** | Compact prompts for trying or buying products |
| **Promoted Plans** | Featured subscription plans and upgrades |

## Content Guidelines

### Context Awareness
Adobe Home users are already Adobe customers. They're either:
- Using free/trial versions looking to upgrade
- Existing subscribers who might benefit from additional products
- Users exploring what Adobe has to offer

### Tone and Voice
- Conversational and helpful
- Focus on value they'll gain
- Avoid aggressive sales language
- Acknowledge their existing relationship with Adobe

### Try Buy Widget

**Purpose:** Quick, non-intrusive prompts to try or purchase

**Best practices:**
- Keep messaging extremely concise
- Focus on one clear action
- Use benefits-focused copy
- Don't overwhelm with features

**Example messages:**
- "Try Photoshop free for 7 days"
- "Upgrade to All Apps and save 20%"
- "Add Acrobat Pro to your plan"

### Promoted Plans

**Purpose:** Showcase featured plans for upselling

**Best practices:**
- Highlight what's included in the plan
- Show the value compared to individual purchases
- Include savings messaging when applicable
- Use clear CTAs

## Pricing Considerations

- Users may already have subscriptions - messaging should acknowledge this
- "Upgrade" CTAs work better than "Buy now" for existing customers
- Consider showing savings compared to their current plan

### CTAs for Adobe Home
- **Upgrade:** For existing customers moving to a higher tier
- **Upgrade now:** Creates urgency for time-limited offers
- **Free trial:** For products they don't have yet
- **Learn more:** When they need more context before deciding

## Publishing Workflow

1. **Create** your card in MAS Studio under the `adobe-home` surface
2. **Select the variant** (Try Buy Widget or Promoted Plans)
3. **Preview** the card appearance
4. **Save and publish** to make it live

## Common Issues

### Widget not appearing in Adobe Home
- Ensure the card is **published** to production
- Check that targeting rules are correctly configured
- Adobe Home has eligibility rules - the user must match the target segment

### Wrong offer showing
- Verify the **OSI (Offer Selector ID)** is correct
- Check that the offer is available in the user's region
- Confirm the WCS landscape matches the environment

### Pricing looks different than expected
- Adobe Home may show personalized pricing based on user status
- Existing subscribers see upgrade pricing, not new customer pricing

## Testing

Adobe Home cards require testing in the actual desktop app. Coordinate with your development team for:
- Stage environment testing
- Production verification
- Different user segments (new, trial, subscriber)

## Gallery
View example cards: [Adobe Home Card Gallery](https://main--milo--adobecom.aem.live/libs/features/mas/docs/adobe-home.html)
