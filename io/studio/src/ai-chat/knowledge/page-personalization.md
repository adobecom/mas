---
topic: page-personalization
keywords: platform, authoring, how a personalized card reaches a consumer page
---
<!-- ported from the MASA knowledge corpus -->
# How a personalized card reaches a consumer page

## The two routes a grouped variation can take to a page

A grouped variation is selected by personalization tags, but the tags alone do not put it on a page. Something on the page has to ask for it, and there are two different ways that happens.

The first route is whole card. The authored link for the card carries a `pzn` value, the card sends it to the IO fragment endpoint, and IO scores the value against each variation's personalization tags and merges the winner over the default card. Every field of the card changes together.

The second route is per field. A Target activity, delivered as an MEP manifest, rewrites which fragment one single field reads from. Only the fields named in the manifest change.

These are independent. A page can use one, the other, or neither. Before debugging why a grouped variation is not showing, establish which route the page uses, because the checks are completely different.

## Where the pzn value comes from

`pzn` is the value a card sends to IO to select a variation by personalization tag, and it is authored rather than dynamic. The merch block reads it from the hash of the authored link that creates the card, alongside `mask` and `field`, and copies it into the card's options. The value is therefore fixed in the page content at authoring time.

Target and MEP cannot set it. MEP's in-block handling runs before the card element is created, so there is no card yet to set an attribute on, and the only thing a manifest row replaces on that path is the fragment id. A page that was not authored with a `pzn` value will never request one, whatever the Target activity does.

So whole card personalization has to be arranged in the page source, not in the activity.

## How a manifest row targets one card field

An MEP manifest row that personalizes MAS content uses an `in-block:mas` selector, and both the selector and the replacement are Studio links carrying a fragment id in `query=` and an optional `field=`.

MEP parses the selector's hash into a fragment id plus a field name, and stores the row in a two level map, keyed first by the fragment id and then by the field name, with an empty string standing for a row with no `field=`. The replacement link is reduced to just its fragment id, so any `field=` written on the replacement side is discarded and has no effect.

When the merch block builds a card it looks the row up by that same pair, the authored fragment id and the field it is rendering. The field names are compared as exact strings. `ctas` and `ctas[2u25ddjvjn]` are two different keys, and a row written for one will not apply to the other.

## Why a manifest row swaps the fragment rather than selecting a variation

When a row matches, the merch block returns the card options with the fragment id replaced by the manifest's replacement id. The page then renders the variation fragment directly for that field, rather than asking IO to merge the variation over its parent.

That distinction matters because a variation only stores the fields that differ from its parent. Rendering a variation directly means there is no parent underneath it, so a field the variation does not define resolves to nothing rather than falling back to the parent's value. A manifest row pointing a field at a variation that does not define that field renders empty, silently.

It also means personalization scales per field. Each field to be personalized needs its own manifest row, and each row has to name the field exactly as the page names it.

## Why a variation id in a manifest row never matches

A manifest row is only ever found by the fragment id that the page author wrote into the link. The lookup happens while the card's options are being prepared, before the card element exists and before anything has been fetched from IO, so no variation id is known at that point.

A row whose selector names a variation id therefore registers in the map but can never be matched, because no card on the page is authored against that id. It is inert: no error, no log line, and it still reads as meaningful in the manifest.

When reviewing a manifest, check each selector's `query=` id against the fragment ids authored on the page. An id that appears only in the manifest is dead weight, and it confuses readers because it still shows up in the manifest and in the page's MEP config.

## Can MEP personalize a card collection

Yes, in two ways. To swap the whole collection, write an `in-block:mas` row whose selector is the collection's own authored fragment id. The collection block looks the row up the same way the card block does, and swaps the fragment when the row's action is `replace`. Compare charts work the same way. Rows with any other action are ignored for cards, fields, collections and compare charts.

To swap a card or a sub-collection inside a collection, write an `in-block:mas` row with no `field=` whose selector is that child's fragment id. The collection block turns every such row on the page into an `overrides` list on the collection (source id to replacement id). The collection then uses the replacement wherever the source id appears among its cards, its sub-collections, or its default child. It takes every no-field row on the page, not only rows for this collection, and it does not check the action.

Two limits follow. A row with `field=` does nothing to a card inside a collection, because only no-field rows reach the collection. And a swapped child card keeps the filter tags of the card it replaced, so it stays in the same categories.

## Why a personalized sub-collection disappears

For every `in-block:mas` row, MEP adds a hidden `aem-fragment` for the replacement fragment at the end of the page, inside a `div.mas-overrides`, so the replacement starts loading early. A collection swapping a sub-collection reads the replacement's data from that hidden element. If the data has not arrived when the parent collection builds its categories, the collection logs `Override fragment <id> not found or invalid` and leaves that sub-collection out. Nothing appears on the page.

That comes from reading the code: it is a timing race, so it can come and go between page loads. If a personalized category is sometimes empty, look for that console message, and check that the replacement id is a published collection and not a card or a variation.

## How MEP can redirect a merch modal

A row with the selector `in-block:merch <modal path>` makes any merch CTA whose modal URL has that path open the row's replacement URL instead. The replacement must be a full URL. Anything else is logged as an error and the original modal opens. This is how a promotion can point an existing Buy CTA's modal at a different offer page without editing the card.
