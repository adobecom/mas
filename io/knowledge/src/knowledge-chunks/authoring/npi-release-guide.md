# NPI Release Card Generation Guide

## Overview

NPI (New Product Introduction) is the process of launching merchandising cards for a new Adobe product release. When a PM needs to kickstart cards for a new product, the AI assistant guides them through gathering product details, selecting the right card variants, and batch-creating all required cards in AEM.

The goal is to ensure consistent, complete card coverage across segments and offering types for every new product launch.

---

## Conversation Flow

When you detect that a PM wants to create cards for a new product release, follow these steps in order:

1. **Ask for the product name or product code** - The PM may say something like "kickstart cards for Photoshop" or provide a product code directly.

2. **Look up the product in MCS** - Use the `list_products` MCP tool to find the product and retrieve its metadata (name, description, icon, arrangement code, product code, customer segments, plan types).

3. **Ask for the target segment** - Which customer segments should receive cards?
   - Individuals
   - Students
   - Teams
   - All of the above

4. **Ask for the offering type** - How will the product be offered?
   - **D2P** (Direct to Paid) - direct purchase, no trial
   - **TWP** (Try with Payment) - trial that captures payment upfront and auto-converts
   - Both

5. **Ask if there is a promotional offer** - If yes, ask for the promo details (promo name, discount percentage, or promo code). This determines whether a Special Offers card is needed.

6. **Ask for the locale** - Default to `en_US` if the PM does not specify. This determines the AEM parent path for card creation.

7. **Show the creation plan** - List all the cards that will be created, including variant, title, and segment. Ask the PM to confirm before proceeding.

8. **Create the cards** - Execute the `create_release_cards` MCP tool with the full cards array.

---

## Segment and Offering Type Matrix

Use this matrix to determine which card variants to create for each combination of segment and offering type.

| Segment | Offering Type | Card Variants to Create |
|---------|---------------|------------------------|
| Individuals | D2P | `plans`, `catalog` |
| Individuals | TWP | `plans`, `catalog`, `segment` |
| Students | D2P | `plans`, `catalog` |
| Students | TWP | `plans`, `catalog`, `segment` |
| Teams | D2P | `plans`, `catalog` |
| Teams | TWP | `plans`, `catalog`, `segment` |

**Additional rules:**
- All segments always get `plans` and `catalog` at minimum.
- TWP adds a `segment` variant for each segment (the segment card highlights the trial experience).
- When a promo is provided, add a `special-offers` variant for each segment that has cards.
- When the PM selects "All" segments, create the full set for Individuals, Students, and Teams.

---

## MCS Product Fields to Card Fields Mapping

When populating card fields from MCS product metadata, use this mapping:

### Content Fields (ONLY from MCS — never AI-generated)

**STRICT: Only use exact values from MCS. If a field is missing in MCS, leave it empty. Never generate text.**

| MCS Field | Card Field | How to populate |
|-----------|------------|-----------------|
| `product.name` | `cardTitle` | EXACT MCS name. Also used as AEM fragment title prefix |
| `product.description` or `product.short_description` | `description` | Use `description` first, fall back to `short_description`. If NEITHER exists, OMIT — do NOT generate one |
| `product.icon` | `mnemonics` | EXACT MCS icon URL as mnemonic entry. NEVER substitute with a different URL |
| `product.background_image` | `backgroundImage` | Use if available, for variants that support background images |

### AEM Tags (add as tags on the card fragment)

| MCS Field | Tag Format | Example |
|-----------|------------|---------|
| `product.product_code` | `mas:product_code/{value}` | `mas:product_code/PHSP` |
| `product.arrangement_code` | `mas:pa/{value}` | `mas:pa/phsp_direct_individual` |
| `product.product_family` | `mas:product_family/{value}` | `mas:product_family/PHOTOSHOP` |
| `product.planTypes` (each key) | `mas:plan_type/{value}` | `mas:plan_type/ABM`, `mas:plan_type/PUF` |
| `product.customerSegments` (each key) | `mas:customer_segment/{value}` | `mas:customer_segment/INDIVIDUAL` |
| `product.marketSegments` (each key) | `mas:market_segments/{value}` | `mas:market_segments/COM` |

Always include these standard tags on every NPI card:
- `mas:studio/content-type/merch-card`
- `mas:studio/surface/{surface}` (e.g., `mas:studio/surface/acom`)

---

## Card Title Naming Convention

Each card's AEM title follows this pattern:

```
{ProductName} - {Variant}
```

Examples:
- "Photoshop - Plans"
- "Photoshop - Catalog"
- "Photoshop - Segment"
- "Photoshop - Special Offers"

When creating cards for multiple segments, include the segment in the title to distinguish them:
- "Photoshop - Plans (Teams)"
- "Photoshop - Catalog (Students)"

---

## AEM Parent Path

Cards are created under the following path structure:

```
/content/dam/mas/{surface}/{locale}
```

- Default surface: `acom`
- Default locale: `en_US`
- Example: `/content/dam/mas/acom/en_US`

If the PM specifies a different locale or surface, adjust the path accordingly.

---

## Tags

Apply these tags to every card created during an NPI release:

- `mas:studio/surface/acom` - Adjust the surface value based on context (e.g., `ccd`, `cc`, `dc`)
- `mas:studio/content-type/merch-card`

---

## Adobe Internal Terminology Reference

### Product Codes (common name → internal code)

| Product | Code | Common Arrangement Code (Individual / Teams) |
|---------|------|----------------------------------------------|
| Creative Cloud All Apps | `CCSN` (Ind), `CCLE` (Teams), `CCSV` (Ent) | `ccsn_direct_individual` / `ccle_direct_indirect_team` |
| Photoshop | `PHSP` | `phsp_direct_individual` / `phsp_direct_indirect_team` |
| Illustrator | `ILST` | `ilst_direct_individual` |
| InDesign | `IDSN` | `idsn_direct_individual` |
| Premiere Pro | `PPRO` | `ppro_direct_individual` |
| After Effects | `AEFT` | `aeft_direct_individual` |
| Audition | `AUDT` | `audt_direct_individual` |
| Acrobat Pro | `APCC` | `apcc_direct_individual` / `apcc_direct_indirect_team` |
| Adobe Express / Spark | `ASPK` / `CCEX` | — |

Arrangement code pattern: `{product_code_lowercase}_direct_{channel}_{segment_lowercase}`

### Segment Codes

| Code | Meaning |
|------|---------|
| `INDIVIDUAL` | Retail / direct consumer (Individuals) |
| `TEAM` | Teams / SMB / VIP |
| `ENTERPRISE` | Enterprise / ETLA |

### Market Segment Codes

| Code | Meaning |
|------|---------|
| `COM` | Commercial (default for retail/teams/enterprise) |
| `EDU` | Education (Student & Teacher, K-12, higher ed) |
| `GOV` | Government |

### Offering Types

- **D2P — Direct to Paid (Direct to Purchase):** Customer goes directly to a paid checkout with no trial. Commerce URL has no `ot=TRIAL`.
- **TwP / TWP — Trial with Payment (Try with Purchase):** 7-day trial that captures payment upfront, auto-converts to paid if not canceled. Commerce URL includes `ot=TRIAL`.

Both types typically share the same PA code but differ by price point and the `ot=TRIAL` parameter.

When resolving a user's natural language product reference (e.g., "Photoshop", "CC All Apps", "Acrobat") to an MCS product, match against product names and codes using `list_products` with a `searchText` filter.

---

## Example: Full NPI for Photoshop

**PM says:** "Kickstart cards for Photoshop, all segments, both D2P and TWP, with a Back to School promo."

**Cards to create (12 total):**

| Card Title | Variant | Segment |
|-----------|---------|---------|
| Photoshop - Plans (Individuals) | `plans` | Individuals |
| Photoshop - Catalog (Individuals) | `catalog` | Individuals |
| Photoshop - Segment (Individuals) | `segment` | Individuals |
| Photoshop - Special Offers (Individuals) | `special-offers` | Individuals |
| Photoshop - Plans (Students) | `plans` | Students |
| Photoshop - Catalog (Students) | `catalog` | Students |
| Photoshop - Segment (Students) | `segment` | Students |
| Photoshop - Special Offers (Students) | `special-offers` | Students |
| Photoshop - Plans (Teams) | `plans` | Teams |
| Photoshop - Catalog (Teams) | `catalog` | Teams |
| Photoshop - Segment (Teams) | `segment` | Teams |
| Photoshop - Special Offers (Teams) | `special-offers` | Teams |

Each card is pre-populated with:
- **Title:** Product name from MCS
- **Body:** Product description from MCS wrapped in `<p>` tags
- **Mnemonic:** Product icon URL from MCS
- **OSI:** Left empty for PM to select via OST
- **Tags:** `mas:studio/surface/acom`, `mas:studio/content-type/merch-card`
- **Parent path:** `/content/dam/mas/acom/en_US`
