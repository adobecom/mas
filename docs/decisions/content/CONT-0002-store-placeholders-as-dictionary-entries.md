---
id: CONT-0002
title: Store placeholders as indexed dictionary entries layered from acom
status: active
scope: project
related: ['adr:adobecom/mas/CONT-0001', 'adr:adobecom/mas/CONT-0004']
---

# CONT-0002. Store placeholders as indexed dictionary entries layered from acom

## Context

Cards share many short strings (CTA labels, legal mentions, plan types, EDU disclaimers) that must be translated once and reused everywhere. Most strings are the same on all surfaces, a few differ per surface or region. Cards reference them with `{{key}}` so that copy changes don't require editing every card.

## Decision

We will store placeholders as one fragment per key in `/content/dam/mas/{surface}/{locale}/dictionary`, listed by an index:

1. **Entries.**
    - One `dictionary entry` fragment per placeholder (model path `…/models/dictionnary`, historical spelling), named after its `key`.
    - Fields: `key`, either `value` or `richTextValue`, and `locReady`.
2. **Index.**
    - One `dictionary/index` fragment (model `…/models/dictionary`) per folder, whose `entries` field references the entries. Only entries in the index are delivered.
    - Studio adds or removes the entry from the index on create and delete, and republishes the index on publish.
3. **Resolution**, from the lowest to the highest priority:
    1. `acom/{defaultLocale}/dictionary`, the shared baseline of every surface;
    2. `{surface}/{defaultLocale}/dictionary`;
    3. `{surface}/{regionLocale}/dictionary`, when the request resolves to a region locale;
    4. values injected by the request context (masks' variables, collection settings).
    - `{{key}}` is replaced in all fragment fields, recursively. An unknown key renders as the bare key.
    - System placeholders (e.g. `plan-type-text`) are computed by the pipeline and cannot be overridden.
4. **Translation.** Entries are authored in `en_US`. A translation project lists them in `placeholders` and syncs each target locale's `dictionary/index`.

## Rationale

- **One fragment per key** rather than one big table: entries are translated, published and versioned independently, and Studio can edit one without locking the others.
- **An index** rather than a folder listing: one hydrated read returns every published entry, and unpublished or orphan entries stay out.
- **`acom` as the baseline**: most strings are common to all surfaces, so other surfaces only store their differences.
- **Fixed layers in the pipeline** rather than following the index's `parent` field: the order is predictable and needs no chain traversal.

## Consequences

### Positive

- A string is translated once and reused by every card, on every surface that doesn't override it.
- Surfaces and regions only store their differences.

### Costs and risks

- An entry missing from the index is silently not delivered.
- The index `parent` field is still maintained by Studio but ignored by delivery. It could be removed, or delivery aligned with it, in a later decision.
- The entry model path keeps the `dictionnary` misspelling, because renaming a model breaks existing fragments.
- Dictionary changes reach cards after the pipeline cache TTL (about 5 minutes).

## References

- Implementation: `studio/src/placeholders/mas-placeholders-repository.js`, `io/www/src/fragment/transformers/replace.js`, `io/www/src/fragment/locales.js` (`PLACEHOLDERS_BASELINE_SURFACE`, `getPlaceholdersRegionLocale`), `io/studio/src/translation/project-start-service.js`
