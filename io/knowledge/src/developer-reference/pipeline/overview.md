# Fragment Pipeline Overview

## What is the Fragment Pipeline?

The fragment pipeline processes AEM content fragments through a series of transformers to prepare them for display on consuming surfaces.

## Pipeline Flow

Fragments are processed through these transformers in order:

1. **Fetch Fragment** - Fetches the fragment content from Odin (AEM)
2. **Promotions** - Applies promotional offers and pricing overrides based on active campaigns
3. **Customize (Locale)** - Handles locale customization and translation lookups
4. **Settings** - Applies global and surface-specific settings to the fragment
5. **Replace** - Performs content replacements and placeholder substitutions in fragment fields
6. **WCS (Web Commerce Service)** - Integrates pricing data from Web Commerce Service
7. **Corrector** - Final corrections and validation

## How It Works

1. A request comes in with a fragment path and locale
2. Each transformer runs in sequence, modifying a shared context object
3. Transformers with `init()` functions pre-fetch data in parallel
4. The final context contains the processed fragment data
5. Response is compressed with Brotli and cached at edge

## Context Object

The context object flows through all transformers and accumulates data:

```javascript
{
  path: '/content/dam/mas/...',  // Fragment path
  locale: 'en_US',               // Requested locale
  body: { ... },                 // Fragment content
  fragmentsIds: { ... },         // Locale-specific IDs
  status: 200,                   // HTTP status
  resolvedOffers: { ... },       // WCS pricing data
}
```
