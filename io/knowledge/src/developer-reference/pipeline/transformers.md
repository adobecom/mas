# Pipeline Transformers

Detailed documentation for each transformer in the fragment pipeline.

## Fetch Fragment

**Source:** `fetchFragment.js`

Fetches the fragment content from Odin (AEM). Handles locale-based lookups and caching.

### Context Modifications

- Sets `body` with raw fragment data
- Sets `fragmentsIds` with locale-specific fragment IDs
- Sets `status` to indicate success or failure

## Promotions

**Source:** `promotions.js`

Applies promotional offers and pricing overrides based on active campaigns.

### Context Modifications

- May modify `body.fields` with promotional content
- Applies promo codes to pricing fields

## Customize (Locale)

**Source:** `customize.js`

Handles locale customization and translation lookups. Falls back to default locale if regional translation not found.

### Context Modifications

- May fetch translated fragment variation
- Updates `body` with localized content
- Sets `translatedStatus` for debugging

## Settings

**Source:** `settings.js`

Applies global and surface-specific settings to the fragment.

### Context Modifications

- Merges settings into context
- Applies display configurations

## Replace

**Source:** `replace.js`

Performs content replacements and placeholder substitutions in fragment fields.

### Context Modifications

- Replaces placeholder tokens in field values
- Applies text transformations

## WCS (Web Commerce Service)

**Source:** `wcs.js`

Integrates pricing data from Web Commerce Service. Resolves offer IDs to actual pricing.

### Context Modifications

- Resolves `osi` (Offer Selector IDs) to pricing
- Adds `resolvedOffers` with price data
- Prefills WCS cache for performance

## Corrector

**Source:** `corrector.js`

Final corrections and validation. Ensures output format is correct.

### Context Modifications

- Validates final output structure
- Applies any last-minute corrections
- Ensures required fields are present
