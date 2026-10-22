---
topic: surface-settings
keywords: platform, authoring, surface settings
---
<!-- ported from the MASA knowledge corpus -->
# Surface settings

## Where settings live

Each surface has one settings fragment at `/content/dam/mas/<surface>/settings/index` holding many setting entries. An entry has a `name`, a default value, and optional overrides scoped by `locales`, `geos`, `tags` (fragment tags) and `templates` (card templates, matched against each card's `variant`). The IO pipeline caches the whole settings fragment per surface for five minutes, so a settings edit takes a few minutes to reach the live fleet on top of the CDN cache.

## The setting list

The pipeline recognizes exactly these names: `addon` (optional text, addon editor), `secureLabel` (optional text, reads the `showSecureLabel` fragment field), `displayAnnual` (boolean), `displayPlanType` (boolean, reads `showPlanType`), `quantitySelect` (optional text, quantity-select editor), `hideTrialCTAs` (boolean), `hideEduDisclaimer` (boolean), `additionalModalTriggers` (boolean), and `placeholderRemap` (text). Resolved values are written onto each fragment's `settings` object in the IO response, which is what the client reads. `placeholderRemap` is special: it is not written to `settings` but rewrites `{{old}}` tokens in the fragment fields to `{{new}}` before the replace step, one `from: to` pair per line.

## How an entry resolves

When the settings fragment is loaded, each entry is filed either as an override or as the default for its name. Only an entry that declares locales, geos or tags becomes an override; an entry scoped only by templates is filed as the default (and if a name has more than one unscoped or template-only entry, the last one read becomes the default). To resolve a surface setting for a given fragment and region locale: if the default entry has template scoping and the fragment's template (its `variant`) is not in it, the fragment's own field value (if present) wins instead, and with no field value the setting is left unset. Otherwise the candidate overrides are filtered and scored. An override qualifies when every scope it declares matches: locales and geos against the request's region locale and country, tags against the fragment's tags, and, if the override also lists templates, the fragment's template — so a tag-only override is fully live, while templates on an override only narrow it. Candidates are then scored — geo match weight times ten plus one per matching tag — and the best-scoring override is merged over the default. Boolean values normalize from the strings `true`/`false`; an optional text whose boolean scope is false resolves to an empty string.

## Common questions

Why does a setting behave differently per region: the entry has `geos` or `locales` overrides and the request's region locale matched one of them; trace the entry for the exact locale and country rather than assuming the default. Why does a card-level checkbox win over a setting: some settings (secureLabel, displayPlanType) are designed to fall back to the fragment's own field when no template-scoped entry applies. Why did an edit not take effect: the five-minute settings cache plus the CDN max-age, both in minutes.
