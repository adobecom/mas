# AOS Fragment Countries Audit

Audits Adobe Offer Service (AOS) fragment responses to validate that returned countries include **US** and include **all supported countries** (as defined in `web-components/src/constants.js`).

## Endpoint

```
https://aos.adobe.io/offers/{fragmentId}?service_providers=PRICING&locale=en_us&country=US&api_key=...
```

## Usage

From the repo root:

```bash
# Default API key (literal "aos" in URL)
node scripts/aos-fragment-countries-audit/aos-fragment-countries-audit.mjs

# Custom API key via env
AOS_API_KEY=your_key node scripts/aos-fragment-countries-audit/aos-fragment-countries-audit.mjs
```

## What it checks

For each fragment ID:

1. **Has US** – At least one offer in the response includes `US` in its `countries` array.
2. **All supported countries** – The union of all `countries` across offers includes every code in `SUPPORTED_COUNTRIES`.

A fragment **passes** only when both conditions are true.

## Configuring fragment IDs

Edit the `FRAGMENT_IDS` array at the top of `aos-fragment-countries-audit.mjs` to change which fragments are audited.

## Dependencies

- Node.js (with `node-fetch` available; the main repo may install it at the root or in `scripts/`).
