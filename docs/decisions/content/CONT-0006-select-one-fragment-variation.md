---
id: CONT-0006
title: Select one promotion, regional or PZN variation per fragment
status: active
scope: project
related: ['CONT-0001', 'CONT-0003', 'CONT-0005', 'adr:Adobe-acom/core/KNOW-0000']
---

# CONT-0006. Select one promotion, regional or PZN variation per fragment

## Context

A card or collection fragment is authored once in its default locale (e.g. `fr_FR`), but must adapt to:

- regional markets sharing a language (e.g. `fr_LU`, `fr_BE`);
- personalization (PZN) audiences (e.g. EDU-targeted visitors, trial users, a given country);
- time-boxed promotion campaigns, possibly geo-targeted, possibly per audience.

Duplicating the card for each case would break translation and the link to the parent card. The request carries the inputs: `locale`, `country`, and a comma-separated `pzn` parameter.

The baseline layers below the fragment are defined in [CONT-0005](./CONT-0005-layer-merch-content-through-baselines.md). This ADR defines the top layer.

## Decision

We will model these adaptations as **variations**: partial fragments of the same model, merged over the parent at field level. Regional and PZN variations are referenced by the parent's `variations` field; promotion variations are found by path ([CONT-0003](./CONT-0003-model-promotions-as-projects-and-variations.md)). Exactly one variation is merged, picked in this order. Paths are relative to `/content/dam/mas` and `{fragmentPath}` is the parent's path below its locale folder:

1. **Promotion variation**, at `{surface}/{locale}/promotions/{campaign}/{fragmentPath}`.
    - Applies while its promotion project is active for the request ([CONT-0003](./CONT-0003-model-promotions-as-projects-and-variations.md)).
    - Several geo-targeted promotions of the same fragment use the suffixes `-2`, `-3` and so on, up to 50.
    - A promotion can also target a PZN variation, at `promotions/{campaign}/{fragmentPath}/pzn/{name}`.
2. **Regional variation**, at `{surface}/{regionLocale}/{fragmentPath}`, e.g. `fr_LU` for `fr_FR` + `country=LU`.
    - Applies only when the request resolves to a region locale.
3. **PZN variation**, at `{surface}/{defaultLocale}/{fragmentPath}/pzn/{name}`.
    - Lives next to its parent fragment, in the default locale only. Translation copies it with its parent.
    - Its `pznTags` field targets the variation: `mas:pzn/{segment}` tags match the `pzn` request tokens, and `mas:pzn/country/{xx}` / locale tags match the request geo.
    - Scoring: each matched `pzn` token is worth 100 and a geo match 10. The highest non-zero score wins, and a score of zero applies nothing.
    - `{name}` describes the audience, e.g. `edu`, `trial`, `pzn-kw`. It is not interpreted: only `pznTags` select the variation.

A PZN segment (request `pzn` parameter, chosen by the page) is not a WCS market segment (resolved from the offer, [CONT-0005](./CONT-0005-layer-merch-content-through-baselines.md)). An EDU offer gets the EDU baseline everywhere. An `edu` PZN variation only applies to EDU-targeted visitors, whatever the card's offer.

## Rationale

- **One variation, not a stack of variations**: promotions, regions and audiences rarely combine, and merging several would make the result hard to predict. A promotion that needs an audience targets the PZN variation path instead.
- **PZN variations as child folders with tags**: the `pzn` folder keeps a card and its personalizations together for authoring, translation and promotions. Tags let one variation target several audiences and countries without encoding them in its name.
- **Scored tag matching rather than exact lookup**: a request can carry several `pzn` tokens and a country. The score prefers the most specific audience match and uses geo as a tie-breaker.

## Consequences

### Positive

- Authors edit one card and its few overrides. Translation, promotions and Studio keep the parent link.
- The merged result names its source (`variationId`, `promoVariationProject`), so it is traceable.

### Costs and risks

- A promotion replaces the regional or PZN variation for its fragments; it does not stack on them. A campaign targeting an audience needs its own PZN promotion variation.
- PZN variations exist only in the default locale. In a region locale, a regional variation wins over PZN, so regional and PZN content never combine.
- Tag hygiene matters: an untagged PZN variation never applies, and two equally scored variations resolve to the first one.
- The 50-suffix limit for geo promotions is a convention shared by `io/www` and Studio, without shared code.

## References

- Implementation: `io/www/src/fragment/transformers/customize.js` (`mergeVariations`, `findPersonalizationVariation`, `findPromoVariation`), `io/www/src/fragment/utils/common.js` (`PZN_FOLDER`, `matchesGeo`), `studio/src/promotions/promotion-variations.js`
- Diagram: [M@S Content Structure](https://miro.com/app/board/uXjVHu0zLZA=/?moveToWidget=3458764683909791546)
