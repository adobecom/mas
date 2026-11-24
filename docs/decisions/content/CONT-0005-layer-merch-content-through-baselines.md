---
id: CONT-0005
title: Layer merch content through product, template and market segment baselines
status: active
scope: project
related: ['CONT-0001', 'CONT-0006', 'adr:Adobe-acom/core/KNOW-0000', 'adr:Adobe-acom/core/KNOW-0001']
---

# CONT-0005. Layer merch content through product, template and market segment baselines

## Context

M@S renders merch cards and collections for about 1,800 product arrangements (PA) per locale in MCS, on several surfaces (`acom`, `acom-cc`, `ccd`, …), each with several templates (`plans`, `mini`, …). Most of a card's copy and assets are the same for every card of a PA, and most of a surface's card content is the same for every card of a PA and template. Copying that content into each card fragment multiplies authoring, translation and drift.

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
    - The `offers` I/O action syncs it into I/O state every 15 minutes, because the folder is too big to list per request. The pipeline fetches all product baselines of a locale at once from the `offers` action, behind the CDN.
    - Only mapped fields reach a card: MCS `name` → `cardTitle`, the first (svg) of `icons` → `mnemonicIcon`, with `name` as its `mnemonicAlt`; both are dropped when a higher layer sets its own icons. Other offer model fields stay in the offers API.
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
- **Merging product baseline fields by name** was rejected: MCS `description` is a product name and `short_description` a marketing blurb, while a card's `description` is its body copy and `shortDescription` often legal text. Merged by name, they would have shown on 86 en_US `acom` cards without a description and 575 without a short description (see [Evidence](#evidence)).
- **Customer segment overrides** (e.g. `{pa}/team`) were not added: the customer segment is part of the PA (`*_direct_individual`, `*_direct_indirect_team`, …), so a template baseline already applies to one customer segment. They save nothing in the [projection](#evidence).
- **Product baselines in state rather than listed**: with ~1,800 PAs per locale, a listing per request is too slow. A whole locale is fetched from the `offers` action through the CDN and cached in container memory: one request per locale and container, instead of one state read per PA.

## Evidence

Analysis of published en_US cards on `acom`, `acom-cc` and `acom-dc` (October 2026). Offers are resolved through WCS (PA, customer and market segment), and MCS merchandising data comes from AOS. Promotion and PZN variations are excluded.

| Finding                                                        | Value                                                                 |
| -------------------------------------------------------------- | --------------------------------------------------------------------- |
| PAs shared between customer segments (individual, team)        | 0: the customer segment is part of the PA                             |
| PAs shared between market segments                             | 1: `ccsn_direct_individual` (COM, EDU)                                |
| Values shared by TEAM and INDIVIDUAL cards (template, product) | 20% (icons, add-on, badge, subtitle; no prices or CTAs)               |
| Values shared by EDU and COM cards                             | 13% (mostly icons)                                                    |
| PA and market segments used by several templates               | 53 of 75 (863 cards); 38% of their values are shared across templates |
| Most shared across templates                                   | icon link 81%, icon 75%, add-on 68%, title 62%, CTA labels 61%        |
| Template-specific                                              | description 7–8%, subtitle 4%, badge and callout 0%                   |
| Card titles equal to (containing) the MCS name                 | 307 (546) of 848                                                      |
| Card descriptions equal to the MCS short description           | 1 of 801                                                              |
| Card icons equal to the PA's most common icon                  | 83%, on `adobe.com` URLs rather than MCS's                            |

Projected authoring effort of each structure, on the 890 cards with a PA, a template and MCS data (placeholders resolved to their text). "Authored" counts the values held by baselines and the values cards still hold, including explicit empties where a template renders the field. MCS-synced values cost nothing.

| Structure                                                       | Authored values | Saved | Explicit empties |
| --------------------------------------------------------------- | --------------- | ----- | ---------------- |
| No baselines (today)                                            | 7,213           | –     | 0                |
| Template baseline per surface                                   | 4,894           | 32%   | 106              |
| Template baseline + market segment override                     | 4,803           | 33%   | 132              |
| … + customer segment override                                   | 4,803           | 33%   | 132              |
| Template baselines shared by surfaces + market segment override | 4,881           | 32%   | 134              |
| Authored product baseline only                                  | 5,873           | 19%   | 467              |
| Authored product baseline < template + market segment           | 4,623           | 36%   | 523              |
| **MCS product baseline < template + market segment (decision)** | **4,877**       | 32%   | 362              |
| … with `acom` icons aligned on MCS icons                        | 4,718           | 35%   | 362              |

Cards keep about 3,800 values whatever the structure (descriptions, CTAs, prices), so about a third is the ceiling for baselines holding exact values. The product baseline adds little on `acom` alone: it pays off across surfaces (Unified Checkout, CCD) and as the home of product names now held in placeholders.

## Consequences

### Positive

- Content is authored once, at the most generic level where it holds. Cards only override what differs.
- A card can be rendered from `offer` + `template` + `surface` alone, with no card fragment.
- Every customized fragment exposes the ids of the baselines it was built from (`offerBaselineId`, `fragmentBaselineId`, `fragmentSegmentBaselineId`), so the result is traceable.

### Costs and risks

- Paths are a contract between authors, the `offers` action and the fragment pipeline. Moving a baseline changes its id and requires a migration (copy, publish, unpublish and delete the old one).
- Folder names must be full PA codes and lower-cased market segments. A typo silently means "no baseline".
- Template folders are listed recursively, so they must only hold baselines.
- Product baseline changes reach the pipeline only after the next `offers` sync (up to 15 minutes) plus the CDN and container cache TTLs (about 5 minutes each).
- Resolution depends on WCS: if an offer can't be resolved, no baseline applies for it.
- Cards without a title or icon inherit the product baseline's: 41 and 166 en_US `acom` cards today (mostly `headless`, `mini-compare-chart`, `marquee` and `product`). They need an explicit empty or a template baseline before the product baselines are synced.

## References

- Jira: [MWPW-186204](https://jira.corp.adobe.com/browse/MWPW-186204)
- Pull requests: [adobecom/mas#1444](https://github.com/adobecom/mas/pull/1444) (offers action), [adobecom/mas#1445](https://github.com/adobecom/mas/pull/1445) (fragment pipeline)
- Implementation: [`io/www/src/fragment/README.md`](../../../io/www/src/fragment/README.md#offer-baselines), `io/www/src/offers/index.js`, `io/www/src/fragment/transformers/offer.js`, `io/www/src/fragment/transformers/customize.js`
- Diagram: [M@S Content Structure](https://miro.com/app/board/uXjVHu0zLZA=/?moveToWidget=3458764683909791546)
- ADR practice: [KNOW-0000](https://github.com/Adobe-acom/core/blob/main/decisions/knowledge/KNOW-0000-record-decisions-as-adrs.md), [KNOW-0001](https://github.com/Adobe-acom/core/blob/main/decisions/knowledge/KNOW-0001-adr-repository-topology.md)
