---
topic: collections
keywords: platform, authoring, collections, collection, merch card collection, variation, locale variation, grouped variation, pzn, personalization, locale default, parent fragment, translation
---
<!-- ported from the MASA knowledge corpus -->
# Collections

## What a collection is

A collection is a content fragment (its own model, distinct from the card model) that groups cards. Its `cards` field references card fragments and its `collections` field can reference other collections, so a collection can nest. It also carries its own label, navigation label, icons, a default child, tag filters, and its own variations like any fragment. In Studio a collection is edited like a card but with a different model. A collection can be added to a promotion (Studio saves it into the promotion's `fragments` list alongside cards), but Studio offers no way to create a promo variation for a collection and does not look for one. On delivery a promotion is matched per fragment by its own path, so attaching a collection does not by itself put its cards in the promotion; each card is in the promotion only if it is attached itself.

## What IO adds for a collection

The settings transformer treats a collection body specially: it applies the surface settings to every referenced card in the collection, then injects a fixed set of collection placeholders (`coll-search-text`, `coll-filters-text`, `coll-sort-text`, `coll-no-results-text`, sidenav titles and more) plus collection-specific dictionary entries (`coll-filter`, `coll-result-count`, `coll-search-term`) that the client resolves as live filter, result-count and search-term text. The collection's card and sub-collection order in the reference tree is re-adapted after variations merge, so a variation that reorders `cards` reorders what renders.

## What the client renders

The `merch-card-collection` web component renders the collection's cards as a grid (column count from the card template and screen size) with client-side search over card titles, tag-based filters (`filter` attribute, `filtered` to freeze), sorting — exactly two orders exist, `authored` (the default) and `alphabetical`; the sort menu's "popularity" label is just the display text for the authored option, driven by the `popularityText` placeholder — and pagination (`limit` and `page`). State is exposed through the URL via the deeplink helper, so a filtered or sorted collection can be shared. Card templates define `collectionOptions` (per variant in code) that control sidenav behavior — header visibility, results text, wide-card resize — for plans- and product-style collections; some templates (Pro) render without a sidenav. A collection that fails to load dispatches the same `mas:error` event as a card.

## Common questions

Why is a card missing from a live collection: the card is not in the collection's `cards` references, or a merged variation removed it. Why does the collection show a different order than Studio: sorting is client-side and defaults to the authored `order` in each card's tag filters, not the fragment reference order. Why is search or filter text in the wrong language: it comes from the collection placeholders in the dictionary for the region locale, not from a field on the card.
