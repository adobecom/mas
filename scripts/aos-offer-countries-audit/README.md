# AOS Offer Countries Audit

Audits Adobe Offer Service (AOS) offer responses to validate that returned countries include **US** and include **all supported countries** (as defined in `web-components/src/constants.js`).

## Endpoint

```
https://aos.adobe.io/offers/{offerId}?service_providers=PRICING&locale=en_us&country=US&api_key=...
```

## Usage

From the repo root:

```bash
# Default API key (literal "aos" in URL)
node scripts/aos-offer-countries-audit/aos-offer-countries-audit.mjs

# Custom API key via env
AOS_API_KEY=your_key node scripts/aos-offer-countries-audit/aos-offer-countries-audit.mjs
```

## What it checks

For each offer ID:

1. **Has US** – At least one offer in the response includes `US` in its `countries` array.
2. **All supported countries** – The union of all `countries` across offers includes every code in `SUPPORTED_COUNTRIES`.

An offer **passes** only when both conditions are true.

## Configuring offer IDs

Edit the `OFFER_IDS` array at the top of `aos-offer-countries-audit.mjs` to change which offers are audited.

## Dependencies

- Node.js (with `node-fetch` available; the main repo may install it at the root or in `scripts/`).
