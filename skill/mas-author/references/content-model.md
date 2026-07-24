# M@S Content Model Reference (for Odin MCP)

> Reference material for the `mas-author` skill. Load this when you need model IDs, field names, paths,
> relationships, or variation rules. It describes Adobe **Merch at Scale (M@S)** content entirely in
> terms of what you can see and do through the **Odin MCP** — no codebase knowledge required.

## 1. Mental model

M@S content is **AEM content fragments** under one DAM root, partitioned by **surface** then **locale**.
A small set of content-fragment **models** (card, collection, dictionary, promotion, translation-project,
bulk-publish-project) describes everything. Fragments link to each other through a few **content-fragment
reference fields** rather than special link types — learn the models and those fields and you can
traverse the whole graph through Odin MCP.

## 2. Content-fragment models

**Copy the exact model ID from the table below verbatim** — do not derive or reconstruct it; the trailing
`=` padding varies by model. One spelling trap when matching by path: the placeholder *entry* model path
ends in `dictionnary` (double-n), while the *index* model path ends in `dictionary` (single-n).

| Model | Model path | Model ID | Purpose |
|---|---|---|---|
| **Merch Card** | `/conf/mas/settings/dam/cfm/models/card` | `L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ` | A single merch card (the price/CTA unit) |
| **Collection** | `/conf/mas/settings/dam/cfm/models/collection` | `L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24` | An ordered group of cards (and nested collections) |
| **Dictionary Entry (placeholder)** | `/conf/mas/settings/dam/cfm/models/dictionnary` | `L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25uYXJ5` | One placeholder: `key`, `value`, `richTextValue`, `locReady` |
| **Dictionary Index** | `/conf/mas/settings/dam/cfm/models/dictionary` | `L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25hcnk` | Index of placeholders for a surface/locale (field `entries`) |
| **Promotion** | `/conf/mas/settings/dam/cfm/models/promotion` | `L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL3Byb21vdGlvbg==` | A promo grouping offers + referenced fragments |
| **Translation Project** | `/conf/mas/settings/dam/cfm/models/translation-project` | `L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL3RyYW5zbGF0aW9uLXByb2plY3Q=` | A translation batch |
| **Bulk Publish Project** | `/conf/mas/settings/dam/cfm/models/bulk-publish-project` | `L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2J1bGstcHVibGlzaC1wcm9qZWN0` | A saved bulk-publish selection |

Only **card** and **collection** are the user-authored card types. A card carries a `variant` field that
selects its layout (see §8).

## 3. The reference fields (the graph)

These fields are how fragments point at each other. All are content-fragment references, multi-valued,
holding fragment paths or ids:

| Field | Lives on | Points to |
|---|---|---|
| `cards` | collection | the collection's member cards |
| `collections` | collection / promotion | nested collections |
| `variations` | a parent fragment | its locale variations (translations) |
| `entries` | dictionary **index** | the placeholder entry fragments it indexes |
| `defaultchild` | collection | the collection's default card (by id) |
| `offers` | promotion | offer ids (plain text, multi-valued) |
| `fragments` | promotion | the cards/collections the promo applies to |

> Practical impact: publishing or deleting one fragment usually means touching its neighbours through
> these fields. The `mas-author` workflows encode those cascades.

## 4. Path & locale grammar

- **Root**: every M@S fragment lives under `/content/dam/mas`.
- **Shape**: `/content/dam/mas/{surface}/{locale}/{rest-of-path}`. The first segment after the root is the
  surface; the second is the locale.
- **Source/default locale**: `en_US` is the translation *source* (other-language content is translated
  from it) and the default locale of the English family. Grouped (PZN) variations are authored under the
  `en_US` tree. A regional locale is a variation of its **same-language default locale** (see §5) — e.g.
  `de_CH` varies `de_DE`, not `en_US`.
- **Special folders inside `{surface}/{locale}/`**:
  - `pzn/` — personalized (grouped) variations
  - `promotions/` — promotion content
  - `masks/` — card masks
  - `dictionary` (with its `index`) — placeholders

### Surfaces
`acom` (Adobe.com), `acom-cc`, `acom-dc`, `adobe-home`, `ccd`, `commerce`, `express`, `nala`, `sandbox`.

## 5. Variation types & how to tell them apart

A variation's **type is derived from its path and tags**, not from a stored field. Three kinds, resolved
in priority order **grouped → promo → locale**:

| Kind | How to recognize it |
|---|---|
| **Grouped (PZN)** | the path contains a `/pzn/` segment |
| **Promo** | the path is under `promotions/`, or the fragment carries a `mas:promotion/{name}` tag |
| **Locale** | same surface and same fragment sub-path as the parent, but a different `{locale}` segment |

Grouped variations are authored under `{surface}/en_US/{product-arrangement-code}/pzn/`. For collection
grouped variations the product-arrangement-code is `merch-card-collection`.

**Grouped (PZN) vs locale variations — different inputs entirely:**

- A **grouped (PZN) variation is always created in the `en_US` locale** (under the `pzn/` folder above),
  never in a regional locale. Its authoring input is a set of **locale tags** (e.g. `fr_FR`, `fr_CH`,
  `fr_BE`) that decide which audiences the grouped variation targets — *not* a locale path segment. The
  fragment itself stays at `en_US`; the tags do the routing at render time (§5 scoring).
- A **locale variation**, by contrast, takes a **target locale** and is created at that locale's path in
  the same-language family (see the next subsection). No tags are involved in targeting it.

**Promo variations** live under `{surface}/{locale}/promotions/{promo-name}/…`. Two things to expect when
reading them through Odin MCP:

- The `{locale}` may be `en_US` **or a regional locale** — promo content can be language-switched, so a
  promo variation is not always at `en_US`.
- One promo fragment can carry several **geo-specific** variants as sibling fragments whose **leaf segment
  is suffixed** `-2`, `-3`, … (e.g. `…/promotions/cyber-monday/card`, `card-2`, `card-3`). Each variant is
  distinguished by its **`pznTags`** field (the geos it targets); a variant with no `pznTags` is the
  default/fallback. These suffixed siblings are intentional — do **not** treat them as duplicates to clean
  up. **Which variant actually serves** is resolved by the MAS IO pipeline (deny list) — don't compute it
  from the raw `pznTags`. Because they are geo-scoped, **several of these can share the same locale** under
  one promo project — the one-variation-per-locale rule constrains **locale** variations only, never
  `pznTags`-scoped promo variants.

### Locale variations are same-language only

A **locale variation can only target a country in the parent's own language family** — it keeps the
parent's language and changes only the country/region segment. Each surface has a fixed default-locale
table: every language has one parent country plus a set of allowed regional countries. A locale variation
may only be created for one of that language's regional countries.

- Example (acom, German `de` → parent country `DE`, regions `AT, CH, LU`): parent `de_DE` may have
  variations `de_AT`, `de_CH`, `de_LU` — and nothing else.
- `de_DE` can **not** have an `fr_FR`, `en_GB`, or `it_IT` variation. Producing content in a *different*
  language is a **Translation** (a `translation-project` batch), **not** a locale variation.
- The parent of any regional locale is the same-language default locale (e.g. `de_CH` → `de_DE`), never
  `en_US`. Cross-language content lives in sibling default-locale trees, tied together by translation
  projects rather than the `variations` field.

Practical impact through Odin MCP: before creating a locale variation at
`/content/dam/mas/{surface}/{regionLocale}/…`, confirm `regionLocale` shares the parent fragment's
language. A cross-language target is invalid — Studio's variation picker never offers it, and the
runtime resolves regional variations only within the parent's language family.

## 6. Tag namespaces

- `mas:promotion/{name}` — marks a fragment as belonging to a promotion.
- `mas:masks/…` — card masks. `mas:product_code/…` — product code. `mas:status/draft` — lifecycle status.
- `mas:studio/content-type/merch-card` and `…/merch-card-collection` are **not** real tags written on
  fragments — they're internal UI filter tokens only. "Is this a card or a collection" is always derived
  from the model id, never from a tag. Don't write this tag on create or duplicate.

## 7. Feature map (what the content looks like)

| Feature | What it is, in fragment terms |
|---|---|
| **Cards** | `card`-model fragments. The `variant` field picks layout + which fields apply (§8). |
| **Collections** | `collection`-model fragments. Members are listed in `cards`; nested collections in `collections`; the default card in `defaultchild`. |
| **Placeholders** | Per surface/locale dictionary. Each placeholder is a dictionary-**entry** fragment (`key`/`value`/`richTextValue`/`locReady`); the dictionary-**index** fragment lists them all in `entries`. A placeholder is only resolvable once it's in the index. |
| **Promotions** | `promotion`-model fragments referencing `offers` (offer ids), `fragments` (the cards/collections), and tagged `mas:promotion/{name}`. Promo variations live under `promotions/`; geo-specific variants of one fragment appear as suffixed siblings (`card-2`, `card-3`, …) keyed by `pznTags` — see §5. |
| **Translations** | Two distinct things. A **locale variation** is a same-language regional variant (e.g. `de_CH` of parent `de_DE`), listed in the parent's `variations` (see §5). A **translation** produces a *different-language* fragment (e.g. `de_DE` from `en_US` source) and is tracked by `translation-project` fragments — not created through the locale-variation flow. |
| **Bulk** | A `bulk-publish-project` fragment stores a saved selection of fragments; bulk operations (publish / unpublish / edit / tag) run over that selection. |

## 8. Card variants

A card's `variant` field selects its layout and which fields are meaningful. The values in use include:
`catalog`, `plans`, `plans-v2`, `plans-students`, `plans-education`, `bizpro`, `product`, `segment`,
`media`, `special-offers`, `ccd-slice`, `ccd-suggested`, `ah-try-buy-widget`, `ah-promoted-plans`,
`headless`, `mini`, `image`, `mini-compare-chart`, `mini-compare-chart-mweb`,
`simplified-pricing-express`, `full-pricing-express`, `compare-chart-column`, `fries`, `inline-heading`.

## 9. Language ↔ locale mapping (locale-variation targets)

The **default locale** column is the parent fragment's locale. The **regional variation locales** column
lists the *only* locales for which a locale variation may be created from that parent (same language,
different country — see §5). `— (default only)` means the language has no regional variants, so **no
locale variation can be created** for it. A few languages have **two independent default locales** in some
surfaces (e.g. `en_US` and `en_GB`); each is its own parent family with its own regional variants.

> These tables reflect each surface's configured locales; if MAS adds or changes supported locales they
> may drift, so treat an unlisted target as invalid rather than assuming. Grouped (PZN) variations do
> **not** use this table: they always live at `en_US` and target audiences via locale **tags** (§5), not a
> locale path.

**Surface → locale config.** Several surfaces share one config: `acom`, `acom-cc`, `acom-dc`, `nala`, and
`sandbox` all use the `acom` table below. `ccd`, `express`, `adobe-home`, and `commerce` each have their own.

### acom, acom-cc, acom-dc, nala, sandbox
| Language | Default locale | Regional variation locales |
|---|---|---|
| Arabic (`ar`) | `ar_SA` | `ar_DZ`, `ar_EG`, `ar_KW`, `ar_QA`, `ar_AE` |
| Bulgarian (`bg`) | `bg_BG` | — (default only) |
| Czech (`cs`) | `cs_CZ` | — (default only) |
| Danish (`da`) | `da_DK` | — (default only) |
| German (`de`) | `de_DE` | `de_AT`, `de_LU`, `de_CH` |
| Greek (`el`) | `el_GR` | — (default only) |
| English (`en`) | `en_US` | `en_DZ`, `en_BE`, `en_CA`, `en_EG`, `en_GR`, `en_HK`, `en_ID`, `en_IE`, `en_IL`, `en_KW`, `en_LU`, `en_MY`, `en_MU`, `en_NZ`, `en_NG`, `en_PH`, `en_QA`, `en_SA`, `en_SG`, `en_ZA`, `en_TH`, `en_TM`, `en_AE`, `en_VN` |
| English (`en`) | `en_GB` | `en_AU`, `en_IN` |
| Estonian (`et`) | `et_EE` | — (default only) |
| Finnish (`fi`) | `fi_FI` | — (default only) |
| Filipino (`fil`) | `fil_PH` | — (default only) |
| French (`fr`) | `fr_FR` | `fr_BE`, `fr_CA`, `fr_LU`, `fr_CH` |
| Hebrew (`he`) | `he_IL` | — (default only) |
| Hindi (`hi`) | `hi_IN` | — (default only) |
| Hungarian (`hu`) | `hu_HU` | — (default only) |
| Indonesian (`id`) | `id_ID` | — (default only) |
| Italian (`it`) | `it_IT` | `it_CH` |
| Japanese (`ja`) | `ja_JP` | — (default only) |
| Korean (`ko`) | `ko_KR` | — (default only) |
| Lithuanian (`lt`) | `lt_LT` | — (default only) |
| Latvian (`lv`) | `lv_LV` | — (default only) |
| Malay (`ms`) | `ms_MY` | — (default only) |
| Norwegian Bokmål (`nb`) | `nb_NO` | — (default only) |
| Dutch (`nl`) | `nl_NL` | `nl_BE` |
| Polish (`pl`) | `pl_PL` | — (default only) |
| Portuguese (`pt`) | `pt_BR` | — (default only) |
| Portuguese (`pt`) | `pt_PT` | — (default only) |
| Romanian (`ro`) | `ro_RO` | — (default only) |
| Russian (`ru`) | `ru_RU` | `ru_TM` |
| Slovak (`sk`) | `sk_SK` | — (default only) |
| Slovenian (`sl`) | `sl_SI` | — (default only) |
| Spanish (`es`) | `es_ES` | `es_AR`, `es_CL`, `es_CO`, `es_CR`, `es_DO`, `es_EC`, `es_GT`, `es_MX`, `es_PE`, `es_PR` |
| Swedish (`sv`) | `sv_SE` | — (default only) |
| Thai (`th`) | `th_TH` | — (default only) |
| Turkish (`tr`) | `tr_TR` | — (default only) |
| Ukrainian (`uk`) | `uk_UA` | — (default only) |
| Vietnamese (`vi`) | `vi_VN` | — (default only) |
| Chinese (`zh`) | `zh_CN` | — (default only) |
| Chinese (`zh`) | `zh_TW` | `zh_HK` |

### ccd
| Language | Default locale | Regional variation locales |
|---|---|---|
| Czech (`cs`) | `cs_CZ` | — (default only) |
| Danish (`da`) | `da_DK` | — (default only) |
| German (`de`) | `de_DE` | `de_AT`, `de_LU`, `de_CH` |
| English (`en`) | `en_US` | `en_AU`, `en_BE`, `en_CA`, `en_EG`, `en_GR`, `en_HK`, `en_IN`, `en_ID`, `en_IE`, `en_IL`, `en_KW`, `en_LU`, `en_MY`, `en_NZ`, `en_NG`, `en_PH`, `en_QA`, `en_SA`, `en_SG`, `en_ZA`, `en_TH`, `en_AE`, `en_VN` |
| Finnish (`fi`) | `fi_FI` | — (default only) |
| French (`fr`) | `fr_FR` | `fr_BE`, `fr_CA`, `fr_LU`, `fr_CH` |
| Hindi (`hi`) | `hi_IN` | — (default only) |
| Hungarian (`hu`) | `hu_HU` | — (default only) |
| Indonesian (`id`) | `id_ID` | — (default only) |
| Italian (`it`) | `it_IT` | `it_CH` |
| Japanese (`ja`) | `ja_JP` | — (default only) |
| Korean (`ko`) | `ko_KR` | — (default only) |
| Norwegian Bokmål (`nb`) | `nb_NO` | — (default only) |
| Dutch (`nl`) | `nl_NL` | `nl_BE` |
| Polish (`pl`) | `pl_PL` | — (default only) |
| Portuguese (`pt`) | `pt_BR` | — (default only) |
| Russian (`ru`) | `ru_RU` | — (default only) |
| Spanish (`es`) | `es_ES` | `es_AR`, `es_CL`, `es_CO`, `es_CR`, `es_EC`, `es_GT`, `es_MX`, `es_PE`, `es_PR` |
| Swedish (`sv`) | `sv_SE` | — (default only) |
| Thai (`th`) | `th_TH` | — (default only) |
| Turkish (`tr`) | `tr_TR` | — (default only) |
| Ukrainian (`uk`) | `uk_UA` | — (default only) |
| Vietnamese (`vi`) | `vi_VN` | — (default only) |
| Chinese (`zh`) | `zh_CN` | — (default only) |
| Chinese (`zh`) | `zh_TW` | — (default only) |

### express
| Language | Default locale | Regional variation locales |
|---|---|---|
| Danish (`da`) | `da_DK` | — (default only) |
| German (`de`) | `de_DE` | `de_AT`, `de_LU`, `de_CH` |
| English (`en`) | `en_GB` | — (default only) |
| English (`en`) | `en_US` | `en_BE`, `en_CA`, `en_EG`, `en_GR`, `en_HK`, `en_IN`, `en_ID`, `en_IE`, `en_IL`, `en_KE`, `en_KW`, `en_LU`, `en_MY`, `en_MU`, `en_NZ`, `en_NG`, `en_PH`, `en_QA`, `en_SA`, `en_SG`, `en_ZA`, `en_TH`, `en_AE`, `en_VN` |
| Finnish (`fi`) | `fi_FI` | — (default only) |
| French (`fr`) | `fr_FR` | `fr_BE`, `fr_CA`, `fr_LU`, `fr_CH` |
| Indonesian (`id`) | `id_ID` | — (default only) |
| Italian (`it`) | `it_IT` | `it_CH` |
| Japanese (`ja`) | `ja_JP` | — (default only) |
| Korean (`ko`) | `ko_KR` | — (default only) |
| Norwegian Bokmål (`nb`) | `nb_NO` | — (default only) |
| Dutch (`nl`) | `nl_NL` | `nl_BE` |
| Portuguese (`pt`) | `pt_BR` | — (default only) |
| Spanish (`es`) | `es_ES` | `es_AR`, `es_CL`, `es_CO`, `es_CR`, `es_EC`, `es_GT`, `es_MX`, `es_PE`, `es_PR` |
| Swedish (`sv`) | `sv_SE` | — (default only) |
| Chinese (`zh`) | `zh_CN` | — (default only) |
| Chinese (`zh`) | `zh_TW` | — (default only) |

### adobe-home
| Language | Default locale | Regional variation locales |
|---|---|---|
| Czech (`cs`) | `cs_CZ` | — (default only) |
| Danish (`da`) | `da_DK` | — (default only) |
| German (`de`) | `de_DE` | `de_AT`, `de_LU`, `de_CH` |
| English (`en`) | `en_US` | `en_AU`, `en_BE`, `en_CA`, `en_EG`, `en_GR`, `en_HK`, `en_IN`, `en_ID`, `en_IE`, `en_IL`, `en_KW`, `en_LU`, `en_MY`, `en_NZ`, `en_NG`, `en_PH`, `en_QA`, `en_SA`, `en_SG`, `en_ZA`, `en_TH`, `en_AE`, `en_VN` |
| Finnish (`fi`) | `fi_FI` | — (default only) |
| French (`fr`) | `fr_FR` | `fr_BE`, `fr_CA`, `fr_LU`, `fr_CH` |
| Hungarian (`hu`) | `hu_HU` | — (default only) |
| Indonesian (`id`) | `id_ID` | — (default only) |
| Italian (`it`) | `it_IT` | `it_CH` |
| Japanese (`ja`) | `ja_JP` | — (default only) |
| Korean (`ko`) | `ko_KR` | — (default only) |
| Norwegian Bokmål (`nb`) | `nb_NO` | — (default only) |
| Dutch (`nl`) | `nl_NL` | `nl_BE` |
| Polish (`pl`) | `pl_PL` | — (default only) |
| Portuguese (`pt`) | `pt_BR` | — (default only) |
| Russian (`ru`) | `ru_RU` | — (default only) |
| Spanish (`es`) | `es_ES` | `es_AR`, `es_CL`, `es_CO`, `es_CR`, `es_EC`, `es_GT`, `es_MX`, `es_PE`, `es_PR` |
| Swedish (`sv`) | `sv_SE` | — (default only) |
| Thai (`th`) | `th_TH` | — (default only) |
| Turkish (`tr`) | `tr_TR` | — (default only) |
| Ukrainian (`uk`) | `uk_UA` | — (default only) |
| Vietnamese (`vi`) | `vi_VN` | — (default only) |
| Chinese (`zh`) | `zh_CN` | — (default only) |
| Chinese (`zh`) | `zh_TW` | — (default only) |

### commerce
| Language | Default locale | Regional variation locales |
|---|---|---|
| Czech (`cs`) | `cs_CZ` | — (default only) |
| Danish (`da`) | `da_DK` | — (default only) |
| German (`de`) | `de_DE` | `de_AT`, `de_LU`, `de_CH` |
| English (`en`) | `en_US` | `en_AU`, `en_BE`, `en_CA`, `en_EG`, `en_GR`, `en_HK`, `en_IN`, `en_ID`, `en_IE`, `en_IL`, `en_KW`, `en_LU`, `en_MY`, `en_NZ`, `en_NG`, `en_PH`, `en_QA`, `en_SA`, `en_SG`, `en_ZA`, `en_TH`, `en_AE`, `en_VN` |
| Finnish (`fi`) | `fi_FI` | — (default only) |
| French (`fr`) | `fr_FR` | `fr_BE`, `fr_CA`, `fr_LU`, `fr_CH` |
| Hungarian (`hu`) | `hu_HU` | — (default only) |
| Indonesian (`id`) | `id_ID` | — (default only) |
| Italian (`it`) | `it_IT` | `it_CH` |
| Japanese (`ja`) | `ja_JP` | — (default only) |
| Korean (`ko`) | `ko_KR` | — (default only) |
| Norwegian Bokmål (`nb`) | `nb_NO` | — (default only) |
| Dutch (`nl`) | `nl_NL` | `nl_BE` |
| Polish (`pl`) | `pl_PL` | — (default only) |
| Russian (`ru`) | `ru_RU` | — (default only) |
| Spanish (`es`) | `es_ES` | `es_AR`, `es_CL`, `es_CO`, `es_CR`, `es_EC`, `es_GT`, `es_MX`, `es_PE`, `es_PR` |
| Swedish (`sv`) | `sv_SE` | — (default only) |
| Thai (`th`) | `th_TH` | — (default only) |
| Turkish (`tr`) | `tr_TR` | — (default only) |
| Ukrainian (`uk`) | `uk_UA` | — (default only) |
| Vietnamese (`vi`) | `vi_VN` | — (default only) |
| Chinese (`zh`) | `zh_CN` | — (default only) |
| Chinese (`zh`) | `zh_TW` | — (default only) |
