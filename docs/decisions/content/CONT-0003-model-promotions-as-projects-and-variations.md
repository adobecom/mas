---
id: CONT-0003
title: Model promotions as cross-surface projects with per-locale variations
status: active
scope: project
related: ['CONT-0001', 'CONT-0006']
---

# CONT-0003. Model promotions as cross-surface projects with per-locale variations

## Context

Campaigns (Black Friday, back to school, …) change prices, promo codes and copy of many cards for a time window, sometimes only in some countries or for some audiences. They often span several surfaces, they must go live and end without a deployment, and the regular card must come back untouched afterwards.

## Decision

We will model a promotion as a **project** plus **promotion variations**:

1. **Project**, a `promotion` fragment in the global `/content/dam/mas/promotions` folder.
    - Fields: `title`, `startDate` / `endDate` (no end means evergreen), countdown dates `cdtStart` / `cdtEnd`, `surfaces`, `geos`, `tags`, `promoCode`, `offers` and `fragments`.
    - It is identified by a `mas:promotion/{name}` tag. `{name}` is also its variation folder name.
    - `fragments` lists the cards and collections the project changes.
    - `offers` lines set promo codes per OSI and geo (`osis|promoCode|geos`), OSI substitutions (`substitute|baseOsi|substituteOsi|geos`) and opt-outs (`ignore-variations|osi|geos`).
    - Its status (draft, scheduled, active, expired) is derived from its dates and publication, not stored.
2. **Promotion variations**, at `{surface}/{locale}/promotions/{name}/{fragmentPath}`.
    - Partial copies of the fragment with the campaign's changes, tagged with the project tag.
    - Several geo-targeted variations of the same fragment use suffixes `-2` to `-50`, and target their geo in `pznTags`.
    - A promotion of a PZN variation lives at `promotions/{name}/{fragmentPath}/pzn/{pznName}`.
    - They are found by path, not referenced from the parent fragment.
3. **Activation at delivery.**
    - A project applies when it lists the request surface, its `geos` match the request (or are empty), and the request instant is within its dates. Seasonal projects win over evergreen ones, and newer over older.
    - For a fragment, the first project that maps one of its OSIs, has a wildcard code, or (for seasonal projects) lists it, is selected. Its variation is merged over the fragment (CONT-0006) and its codes and substitutions are applied to the offers.
    - A project's OSI substitutions win over the surface offer mapping (CONT-0004).

## Rationale

- **Global projects** rather than per surface: one campaign spans surfaces and is scheduled once.
- **Variations in the surface locale folders**: they are translated and permissioned like the content they change, and the regular fragment is never edited.
- **Lookup by path rather than references**: creating a campaign doesn't modify, republish or lock the regular fragments.
- **Dates checked at read time**: going live and ending need no job, no deployment and no unpublication.

## Consequences

### Positive

- Campaigns start and end on their own, and the regular card is untouched.
- One project drives promo codes, substitutions, copy and countdowns.

### Costs and risks

- Expired projects and their variations stay in the DAM. Deleting a project orphans its variations; cleanup is manual.
- A promotion replaces the regional or PZN variation of a fragment (CONT-0006).
- The 50-variation limit is duplicated in Studio and `io/www`.
- Activation depends on the pipeline cache (about 5 minutes published, 60 seconds in preview).

## References

- Model: [`cfmodels/promotion.model.json`](../../../cfmodels/promotion.model.json)
- Implementation: `studio/src/aem/promotion.js`, `studio/src/promotions/`, `io/www/src/fragment/transformers/promotions.js`, `io/www/src/fragment/transformers/customize.js`, `io/www/src/fragment/transformers/wcs.js`
