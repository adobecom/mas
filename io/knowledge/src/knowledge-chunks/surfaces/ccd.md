# Creating Cards for Creative Cloud Desktop (CCD)

Creative Cloud Desktop is the application hub where users manage their Adobe apps. Cards in CCD appear as recommendations, upsells, and product suggestions within the app interface.

## Available Variants

| Variant | Best For |
|---------|----------|
| **Slice** | Horizontal upsell cards with compact layout |
| **Suggested** | Recommended products based on user context |
| **Mini** | Minimal cards for tight spaces |

## Content Guidelines

### User Context
CCD users are actively using Adobe products. They're:
- Managing their installed applications
- Looking for updates and resources
- Open to discovering related products
- Often in a "work mode" mindset

### Tone and Voice
- Helpful and relevant
- Focus on how the product complements what they already use
- Keep messaging brief - users are task-focused
- Avoid interrupting their workflow

### Slice Cards

**Purpose:** Horizontal format for in-app upselling

**Characteristics:**
- Slim, horizontal layout
- Appears alongside app listings
- Minimal distraction from primary task

**Best practices:**
- One clear message
- Single, obvious CTA
- Relevant to the apps they have installed
- Brief copy - no room for paragraphs

**Example:**
> "Add Acrobat Pro to sign and edit PDFs directly"
> [Learn more]

### Suggested Cards

**Purpose:** Contextual product recommendations

**Characteristics:**
- Appears in the "For You" or recommendations sections
- Personalized based on usage patterns
- Shows products they might need

**Best practices:**
- Explain why this product is suggested
- Connect to their existing workflow
- Highlight integration benefits
- Use "Try" or "Learn more" CTAs

### Mini Cards

**Purpose:** Minimal footprint, essential info only

**Characteristics:**
- Smallest card format
- Icon, title, and CTA only
- For very constrained spaces

**Best practices:**
- Icon must be recognizable
- Title should be the product name
- CTA should be action-oriented
- No room for description - title does the work

## Pricing Considerations

- CCD users are often existing subscribers
- Show upgrade/add-on pricing when relevant
- "Free with your plan" messaging works well for included products
- Avoid showing prices when the product is already included in their plan

### Recommended CTAs
- **Get started:** Low-commitment exploration
- **Learn more:** When benefits need explanation
- **Upgrade:** For moving to a higher tier
- **Free trial:** For products not in their current plan

## Publishing Workflow

1. **Create** your card in MAS Studio under the `ccd` surface
2. **Select the variant** (Slice, Suggested, or Mini)
3. **Keep content minimal** - CCD space is limited
4. **Preview and publish**

## Common Issues

### Card not showing in CCD
- CCD has complex eligibility rules based on user subscriptions
- The card must be published to the correct environment
- Targeting must match the user segment

### Card looks too crowded
- Reduce description length
- Use shorter title
- Consider using Mini variant instead

### Wrong product association
- Verify the OSI is for the correct product
- Check that icons match the product being promoted

## Testing

CCD testing requires the desktop application:
1. Use a test account with the target subscription type
2. Clear CCD cache to force content refresh
3. Test across Windows and macOS

## Gallery
View example cards: [CCD Card Gallery](https://main--milo--adobecom.aem.live/libs/features/mas/docs/ccd.html)
