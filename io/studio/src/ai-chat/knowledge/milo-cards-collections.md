---
topic: milo-cards-collections
keywords: platform, milo, authoring, mas cards and collections on milo pages
---
<!-- ported from the MASA knowledge corpus -->
# MAS cards and collections on Milo pages

## What Milo builds for a MAS card link

For a Studio card link, Milo builds `<merch-card consonant><aem-fragment fragment="<id>"></aem-fragment></merch-card>`, adding `mask` and `pzn` to `aem-fragment` when the link's hash has them. If the link is alone in its paragraph, the whole paragraph is replaced. When the same fragment, `pzn` and `mask` combination appears again on the page, the repeat gets `loading="cache"` and reuses the first request.

`aem-fragment` then fetches the card from MAS IO, and the card resolves its prices and CTAs. After the card is ready Milo decorates it: it wires up modals, localizes links, adds CTA aria labels and analytics ids, and, when the page metadata sets `mas-heading-level` (`h1` to `h6`), changes the card's heading levels.

## Why a broken card is invisible on production

A MAS card that fails hides itself (`display: none`) unless the page is in preview mode, and dispatches `mas:error`. So on `www.adobe.com` a broken card is simply missing, with no message. The reason is in the browser console. Typical messages are "AEM fragment cannot be loaded", "CTA has an invalid offer", "Contains unresolved offers", and a "not resolved within 20000 timeout".

On `localhost` and `*.aem.page` pages only, Milo also puts a visible box above a failed card, labelled "Load Error" or "Not Found" and followed by "Card:" and the fragment id. A failed collection gets the same box labelled "Collection:". To see why a production card is missing, open the same page on its `.aem.page` host, or run the Milo preflight "M@S Unpublished Fragments" check.

## Do MAS cards slow down the rest of a Milo page

They can, for a few seconds. Milo loads a page one section at a time and waits for every block in a section before moving to the next. A card waits for the commerce service and for its own readiness, each capped at five seconds, so a slow card can hold back the sections below it for about five seconds before Milo moves on. The card itself keeps trying for up to 20 seconds. A collection waits up to ten seconds for its files, and up to 30 seconds for its cards.

If a section below a card appears late, check the card in the Network tab: a slow MAS IO or pricing request, or a card that never finishes, is the usual cause.

## How to link to a collection with a filter already selected

Collection state lives in the page URL's hash, not its query string. A collection reads `filter` (or `category`), `types`, `sort`, `search`, `single_app` and `page` from the hash, and writes them back as the visitor filters, sorts or presses Show more; picking a new filter resets `page`. So a deep link looks like `…/plans.html#filter=photography`.

The side navigation writes `category` for a collection whose `variant` is `catalog` and `filter` for every other collection. It is on by default; `#sidenav=false` on the Studio link turns it off. It is only built when the collection has categories (child collections).

A `?filter=` or `?single_app=` in the query string only works on a collection with a side navigation: when the side navigation starts, it moves those two values from the query string into the hash. Milo also maps some `single_app` values to a filter in that case: `illustrator` to `illustration`, `indesign` and `incopy` to `design`, `animate`, `premiere`, `aftereffects` and `audition` to `video-audio`, and `lightroom_1tb` to `photography`. On a collection without a side navigation, a query-string filter does nothing.

## Why a collection shows only 27 cards

A collection shows 27 cards per page, and Show more adds the next 27. A collection with no categories is fixed to `filtered="all"`, and a `filtered` collection starts on page one and never renders the Show more footer. Reading the code, a collection with no categories and more than 27 cards shows only its first 27 with no way to see the rest. This has not been confirmed on a live page. If it happens, the fix is to give the collection categories, or to split the cards across collections.

## How a collection chooses its column layout

The collection's column classes come from the template of its first card only (its `variant` value). Plans collections with two or three non-wide cards, segment and product collections with two or three cards, and mini compare charts with at most two cards get a two or three column layout. A collection whose first card has a different template from the rest will lay out for that first card.

Milo adds one styling rule of its own: a `plans` collection inside tabs, on one of about 45 listed locale prefixes such as `de`, `fr`, `uk`, `jp` and `au`, gets the `red-strikethrough-price` class, so its strikethrough prices are red.

## The legacy Milo merch-card block versus a MAS card

Milo still has an older `merch-card` block that builds a card from a table authored in the page document. It creates the same `<merch-card>` element but has no `aem-fragment`, so nothing comes from Odin or MAS IO. Its prices and CTAs come from OST links inside the table.

Nothing authored in MAS Studio applies to a legacy card: settings, placeholders, masks, variations, promotions, translations and publish status are all MAS features. Its supported types are `segment`, `special-offers`, `plans`, `catalog`, `product`, `inline-heading`, `image`, `mini-compare-chart` and `twp`, defaulting to `product`. Multi-offer legacy cards use `merch-offer-select`. The code does not mark the block as deprecated.

To tell the two apart on a page, look for `aem-fragment` inside the `merch-card`. A card with one is a MAS card: debug it in Studio and MAS IO. A card without one is a legacy block: debug the page document.

## Milo blocks that host MAS cards

Milo's generic `tabs` block does nothing special for cards: it doesn't equalize heights or wait for cards to load. It deep-links a tab with `?<tabs-id>=<deeplink>` (for example `?plans=edu`) or `?tab=<id>-<n>`. For cards inside tabs, Milo changes the analytics ids so that tab clicks are reported as user actions.

Card height alignment is done by MAS, per card template, not by Milo. Milo's `table` block does its own height alignment when MAS reports prices as resolved (`mas:resolved`). The c2 `product-marquee-grid` block does not create a `merch-card` at all: it builds its own layout and pulls single fields (such as `field=prices` and `field=description`) through `mas-field`.

## MAS events a Milo page listens for

Milo listens for `aem:load`, `aem:error`, `mas:ready`, `mas:resolved`, and the collection events for sort, show more, sidenav select, search change and quantity change. MAS also emits `mas:error`, `mas:failed` and `wcms:commerce:ready`, the last of which `aem-fragment` waits for when no commerce service exists yet. A page script that needs to act after a card is ready should listen for `mas:ready` on the card instead of polling.
