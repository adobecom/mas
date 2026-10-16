---
id: CONT-0005
title: Layer merch content through product, template and market segment baselines
status: active
scope: project
related: ['CONT-0001', 'CONT-0006', 'adr:Adobe-acom/core/KNOW-0000', 'adr:Adobe-acom/core/KNOW-0001']
---

# CONT-0005. Layer merch content through product, template and market segment baselines

## Context

M@S renders merch cards and collections for about 1,800 product arrangements (PA) per locale in MCS, on several surfaces (`acom-cc`, `sandbox`, …), each with several templates (`plans`, `mini`, …). Most of a card's copy and assets are the same for every card of a PA, and most of a surface's card content is the same for every card of a PA and template. Copying that content into each card fragment multiplies authoring, translation and drift.

Offers of the same PA also differ by market segment (`COM`, `EDU`, `GOV`): for example, `ccsn_direct_individual` has COM and EDU offers that need different copy.

Decision drivers:

- Author each piece of content once, at the most generic level where it holds.
- Resolve the same content with or without a card fragment: `offer` + `template` + `surface` must be enough.
- Keep a deterministic, documented override order that authors, the fragment pipeline (`io/www`) and agents can rely on.
- Keep request cost bounded: no listing of folders of thousands of fragments per request.

## Decision

We will resolve merch content as a stack of layers, from the lowest to the highest priority. Paths are relative to `/content/dam/mas`, `{pa}` is the full product arrangement code (e.g. `ccsn_direct_individual`) and `{segment}` is the lower-cased market segment (e.g. `edu`):

1. **Product baseline**, at `offers/{locale}/baselines/{pa}/baseline` (offer model).
    - Holds product default content, independent of any offer, pre-filled from MCS / NPI.
    - Falls back to `en_US`.
    - The `offers` I/O action syncs it into I/O state every 15 minutes, because the folder is too big to list per request.
    - Only mapped fields reach a card: MCS `name` → `cardTitle`, the first (svg) of `icons` → `mnemonicIcon`, with `name` as its `mnemonicAlt`. Other offer model fields stay in the offers API.
    - It is the content shared across surfaces: placeholders holding product names move to it over time.
2. **Template baseline**, at `{surface}/{locale}/baselines/{template}/{pa}/baseline`.
    - Holds content common to every card of a PA on a surface and template.
3. **Market segment baseline**, at `{surface}/{locale}/baselines/{template}/{pa}/{segment}/baseline`.
    - Applies only to offers whose resolved WCS market segment (the first of `marketSegments`) is `{segment}`.
    - COM is the default: it has no segment folder.
4. **Fragment**: the card or collection's own fields.
5. **Variation**: at most one promotion, regional or PZN variation of the fragment (see [CONT-0006](./CONT-0006-select-one-fragment-variation.md)).

Resolution rules:

- An offer (OSI) is resolved through WCS to its PA and market segment. The PA and segment select the baselines.
- Each layer is partial and overrides only the fields it defines (field-level merge). Explicit empties are honored.
- A baseline's own variations and references are ignored: a baseline only provides defaults.
- Without a fragment, the most specific existing baseline is the main body, merged over the lower layers.
- Market segment overrides exist only at the template level. Other offer dimensions (consumer segment, plan type, …) are out of scope until a later ADR.
- Baselines have no PZN level. Audience-specific content goes into the card's PZN variations ([CONT-0006](./CONT-0006-select-one-fragment-variation.md)).
- Masks (badges, runtime promo values, add-ons) are not part of this stack. They are merged separately at render time.

## Rationale

- **Copying content into every card** was rejected: it multiplies authoring and translation, and copies drift from MCS.
- **Full replacement per market segment** was rejected: an EDU baseline would duplicate everything that matches COM. Partial layers keep only the differences.
- **Market segment overrides at the product level** were deferred: they would add a layer while no consumer needs them yet. Template-level overrides cover the known EDU cases. Product-level overrides can be added later as an additional layer below the template baseline.
- **Encoding dimensions in the path, not in fields or tags**: one paginated listing of a template folder returns every baseline of that surface and template, including segment overrides. Authors also see the structure in the DAM.
- **Merging product baseline fields by name** was rejected: MCS `description` is a product name and `short_description` a marketing blurb, while a card's `description` is its body copy and `shortDescription` often legal text. In published en_US `acom`, `acom-cc` and `acom-dc` cards (October 2026), 1 of 801 descriptions equals MCS's, and 86 cards without a description and 575 without a short description would have shown MCS copy.
- **Customer segment overrides** (e.g. `{pa}/team`) were not added: the customer segment is part of the PA (`*_direct_individual`, `*_direct_indirect_team`, …), so a template baseline already applies to one customer segment. In the same content, no PA spans customer segments, and only `ccsn_direct_individual` spans market segments (COM, EDU).
- **Product baselines in state rather than listed**: with ~1,800 PAs per locale, a listing per request is too slow. Reads by key (`offer-{locale}-{pa}`) are cheap and cached in container memory.

## Consequences

### Positive

- Content is authored once, at the most generic level where it holds. Cards only override what differs.
- A card can be rendered from `offer` + `template` + `surface` alone, with no card fragment.
- Every customized fragment exposes the ids of the baselines it was built from (`offerBaselineId`, `fragmentBaselineId`, `fragmentSegmentBaselineId`), so the result is traceable.

### Costs and risks

- Paths are a contract between authors, the `offers` action and the fragment pipeline. Moving a baseline changes its id and requires a migration (copy, publish, unpublish and delete the old one).
- Folder names must be full PA codes and lower-cased market segments. A typo silently means "no baseline".
- Template folders are listed recursively, so they must only hold baselines.
- Product baseline changes reach the pipeline only after the next `offers` sync (up to 15 minutes) plus the container cache TTL (about 5 minutes).
- Resolution depends on WCS: if an offer can't be resolved, no baseline applies for it.

## References

- Jira: [MWPW-186204](https://jira.corp.adobe.com/browse/MWPW-186204)
- Pull requests: [adobecom/mas#1444](https://github.com/adobecom/mas/pull/1444) (offers action), [adobecom/mas#1445](https://github.com/adobecom/mas/pull/1445) (fragment pipeline)
- Implementation: [`io/www/src/fragment/README.md`](../../../io/www/src/fragment/README.md#offer-baselines-mwpw-186204), `io/www/src/offers/index.js`, `io/www/src/fragment/transformers/offer.js`, `io/www/src/fragment/transformers/customize.js`
- Diagram: [M@S Content Structure](https://miro.com/app/board/uXjVHu0zLZA=/?moveToWidget=3458764683909791546)
- ADR practice: [KNOW-0000](https://github.com/Adobe-acom/core/blob/main/decisions/knowledge/KNOW-0000-record-decisions-as-adrs.md), [KNOW-0001](https://github.com/Adobe-acom/core/blob/main/decisions/knowledge/KNOW-0001-adr-repository-topology.md)
