---
id: CONT-0004
title: Scope settings and offer mappings per surface with targeted overrides
status: active
scope: project
related: ['CONT-0001', 'CONT-0003']
---

# CONT-0004. Scope settings and offer mappings per surface with targeted overrides

## Context

Some card behaviors are business rules rather than copy: show the secure transaction label, display plan type or annual price, hide trial CTAs, add an add-on, remap placeholders. They usually apply to a whole surface, sometimes only for a template, a country or tagged cards. Similarly, some offers must be substituted by others in some countries. Setting these on each card would be error-prone and not translatable.

## Decision

We will store surface-wide rules in locale-free folders, each as an index plus entries:

1. **Settings**, at `/content/dam/mas/{surface}/settings`.
    - A `settings` index references `settings-entry` fragments.
    - An entry has a `name` from a fixed list (`addon`, `secureLabel`, `displayAnnual`, `displayPlanType`, `quantitySelect`, `hideTrialCTAs`, `hideEduDisclaimer`, `additionalModalTriggers`, `placeholderRemap`), a `valuetype` (`boolean`, `text`, `optional-text`, `richText`) and its value.
    - An entry without targeting is the **default** of its name: one per name.
    - An entry with `templates`, `locales`, `geos` or `tags` is an **override** of the same name. It applies when all its criteria match the card and the request. The most specific override wins (geo match first, then number of matching tags) and is merged over the default.
    - A default limited to some `templates` doesn't apply to other templates.
    - A card field mapped to a setting (e.g. `showSecureLabel`) wins over the resolved setting.
    - Settings are delivered in the card's `settings` object, except `placeholderRemap`, which rewrites the card's placeholders.
2. **Offer mapping**, at `/content/dam/mas/{surface}/offer-mapping`.
    - An `offer-mapping-index` references `offer-mapping-entry` fragments with `sourceoffer`, `targetoffer` and `geos`.
    - An entry substitutes the source OSI (optionally with a promo code) by the target OSI in the matching geos. An entry without geos never applies.
    - Promotion substitutions win over offer mappings (CONT-0003).

## Rationale

- **Locale-free folders**: rules are business decisions, not copy. Locale targeting is an override criterion, so one rule covers all locales.
- **Entries plus index**: like placeholders (CONT-0002), entries are edited and published independently, and one read returns them all.
- **Fixed setting names**: the pipeline and web components know each setting's semantics. Free-form settings would not be interpreted.
- **Scored overrides**: the same rule can be refined for a template, a country or a tag without duplicating the default.

## Consequences

### Positive

- A rule changes for a whole surface in one place, without touching cards.
- Studio previews use the same resolver as delivery, so authors see the effective value.

### Costs and risks

- New setting names need code in `io/www` and the web components.
- Two overrides with the same score resolve to the first one found.
- Settings and mappings are cached about 5 minutes in the pipeline.

## References

- Models: [`cfmodels/settings-entry.model.json`](../../../cfmodels/settings-entry.model.json)
- Implementation: `studio/src/settings/settings-store.js`, `studio/src/offer-mapping/offer-mapping-store.js`, `io/www/src/fragment/transformers/settings.js`, `io/www/src/fragment/transformers/wcs.js`, `web-components/src/hydrate.js`
