## Overview

Promotions in MAS Studio are campaign management entities for time-based promotional campaigns. They use AEM Content Fragments to represent campaigns with defined lifecycles (scheduled, active, or expired).

## Key Concepts

- **Tag-based linking**: Promotions are associated with cards via AEM tags using the `mas:promotion/` prefix
- **Promotion variations**: Cards can have promotion-specific content variations
- **Lifecycle states**: Campaigns have scheduled, active, expired, or unknown states based on dates
- **Surface-aware**: Promotions can be scoped to specific surfaces

## Promotion Model Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | text | Yes | Campaign name |
| promoCode | text | No | Discount or promo code |
| startDate | date-time | Yes | Campaign start time (UTC) |
| endDate | date-time | Yes | Campaign end time (UTC) |
| tags | tag (multiple) | No | AEM tags for categorization |
| surfaces | long-text | No | Target surface names |

## Promotion Lifecycle States

| State | Condition |
|-------|-----------|
| scheduled | Start date is in the future |
| active | Current time is between start and end dates |
| expired | End date has passed |
| unknown | Missing or invalid dates |

## Creating a Promotion

1. Navigate to the Promotions page
2. Click "Create project"
3. Fill in campaign details:
   - Title (required)
   - Promo code (optional)
   - Start date (required)
   - End date (required)
   - Tags (optional)
   - Surfaces (optional)
4. Click Save to create the promotion in AEM

## Applying Promotions to Cards

Promotions connect to cards through AEM tags:

1. Create a promotion in the Promotions page
2. In the card editor, add the promotion tag (`mas:promotion/{promotionName}`)
3. Create a promotion-specific variation of the card with modified content
4. The promotion variation displays different content during the campaign period

## Promotion Variations

Cards can have three types of variations:
- **Locale variations** - Different content per locale
- **Grouped variations** - Grouped content variants
- **Promotion variations** - Campaign-specific content linked via promotion tags

## Filtering Promotions

The promotions list supports filtering by status:
- All promotions
- Active (currently running)
- Scheduled (upcoming)
- Expired (past campaigns)
- Archived

## Storage Location

Promotions are stored at: `/content/dam/mas/promotions/`
