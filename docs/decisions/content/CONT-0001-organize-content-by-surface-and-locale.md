---
id: CONT-0001
title: Organize merch content by surface and locale under /content/dam/mas
status: active
scope: project
related:
    ['adr:adobecom/mas/CONT-0002', 'adr:adobecom/mas/CONT-0003', 'adr:adobecom/mas/CONT-0004', 'adr:Adobe-acom/core/KNOW-0000']
---

# CONT-0001. Organize merch content by surface and locale under /content/dam/mas

## Context

M@S content (cards, collections, placeholders, settings, promotions, offers) is authored in AEM (Odin) through M@S Studio and delivered by the fragment pipeline (`io/www`) to many consumer sites. Studio, `io/www`, `io/studio` (translation, bulk publish), scripts and agents all derive meaning from content paths: which surface a fragment belongs to, which locale it is in, and where its translations, variations and companions live. Without one shared layout, every tool would encode its own rules and drift.

## Decision

We will store all M@S content under `/content/dam/mas`, organized as follows:

```
/content/dam/mas
├── {surface}/                     one folder per consuming surface
│   ├── {locale}/                  one folder per locale, {lang}_{COUNTRY}
│   │   ├── {fragmentPath}         cards, collections, … (free sub-folders)
│   │   │   └── pzn/{name}         PZN variations of that fragment (CONT-0006)
│   │   ├── dictionary/            placeholders (CONT-0002)
│   │   ├── promotions/{project}/  promotion variations (CONT-0003)
│   │   ├── masks/                 masks
│   │   └── baselines/{template}/  template baselines (CONT-0005)
│   ├── settings/                  surface settings, locale-free (CONT-0004)
│   ├── offer-mapping/             OSI substitutions, locale-free (CONT-0004)
│   └── translations/              translation projects
├── promotions/                    promotion projects, cross-surface (CONT-0003)
└── offers/{locale}/baselines/     product baselines (CONT-0005)
```

1. **Surfaces.**
    - A surface is a consumer of M@S content: `acom`, `acom-cc`, `acom-dc`, `adobe-home`, `brand-concierge`, `ccd`, `commerce` and `express` are production surfaces. `sandbox` and `nala` are test surfaces.
    - The surface folder name is its identifier: an api key, a delivery request and a fragment path must agree on it.
    - Fragments never reference content across surfaces. The only shared content is the `acom` placeholders baseline (CONT-0002) and the global `promotions` and `offers` folders.
2. **Locales.**
    - A locale folder is named `{lang}_{COUNTRY}` (e.g. `fr_FR`).
    - Each surface declares its locales in `io/www/src/fragment/locales.js` (`DEFAULT_LOCALES`), the single source shared by Studio and `io/studio`. A **default locale** carries authored and translated content. Its **region locales** (e.g. `fr_BE`, `fr_LU` for `fr_FR`) only hold regional variations.
    - `en_US` is the source locale: content is authored there and translated into the other default locales.
3. **Fragment paths.**
    - A fragment is identified by `/content/dam/mas/{surface}/{locale}/{fragmentPath}`. `fragmentPath` is free (sub-folders allowed) but **identical across locales**: a translation or regional variation keeps the `fragmentPath` and only swaps the locale segment.
    - The folder names `dictionary`, `promotions`, `masks`, `baselines`, `pzn`, `settings`, `offer-mapping` and `translations` are reserved for the uses above and must not be used as content folders.
4. **Models.** Content fragment models live under `/conf/mas/settings/dam/cfm/models` and are versioned in `cfmodels/`. A folder holds the models documented for it (e.g. `dictionary` holds dictionary index and entries).
5. **Delivery.**
    - A request asks for a fragment by `id` (or by `offer` + `template` + `surface`, CONT-0005), with a `locale` and optional `country`.
    - The pipeline resolves the request `locale` to the surface's default locale (same language, else any locale of the language), reads the fragment at the same `fragmentPath` in that locale, and derives the region locale from `country`.
    - Companion content (placeholders, settings, masks, promotions, baselines) is then read by path, using the conventions of the other content ADRs.

## Rationale

- **Paths as the contract**: every tool can parse a path with one regex (`PATH_TOKENS`, `/content/dam/mas/{surface}/{locale}/{fragmentPath}`) without extra lookups, and authors see the same structure in Studio and in the DAM.
- **Surface first, then locale**: surfaces have different locale lists, permissions and settings. Grouping by surface keeps each consumer's content isolated.
- **Same `fragmentPath` across locales**: translation, default-language fallback and regional variations need no mapping table, only a locale swap.
- **One locale list in code**: Studio, `io/www` and translation stay consistent.
- **Regions as variations rather than full copies**: a region inherits its default locale and only stores differences.

## Consequences

### Positive

- Any path tells its surface, locale and role. New tools and agents can follow the layout without reading the code.
- Translation, fallback and regional variations are path operations.

### Costs and risks

- Renaming or moving a fragment changes its path in every locale, and its id. Moves need a migration.
- Adding a surface or locale is a code change in `locales.js`, plus folders and permissions in Odin.
- Reserved folder names are a convention, not enforced by AEM.
- `io/studio` still keeps its own copy of `DEFAULT_LOCALES`, which must be kept in sync.

## References

- Implementation: `studio/src/constants.js` (`ROOT_PATH`, `SURFACES`, `PATH_TOKENS`), `io/www/src/fragment/utils/paths.js`, `io/www/src/fragment/locales.js`, `io/www/src/fragment/transformers/defaultLanguage.js`, `io/studio/src/common.js` (`getTargetPath`)
- Models: [`cfmodels/README.md`](../../../cfmodels/README.md)
- Diagram: [M@S Content Structure](https://miro.com/app/board/uXjVHu0zLZA=/?moveToWidget=3458764683909791546)
