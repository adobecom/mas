---
topic: card-price
keywords: platform, pricing, where a card's price comes from
---
<!-- ported from the MASA knowledge corpus -->
# Where a card's price comes from

## Where does the number on a card come from?

An author never types in a price. In Studio, an author picks an offer with the Offer Selector Tool, which stores that offer's ID on the card. When the card renders in a browser, that ID is used to ask Adobe's Web Commerce Service for the current price, and the number that comes back is what gets shown. Because the price is fetched live every time the card renders, a catalog price change reaches every card automatically, without anyone re-editing content.

## How are country and locale figured out for a price?

Two separate things can point at different countries. The page's locale, such as French for France, decides which language content is fetched. The country used to price the offer normally comes from the country part of that locale, but an explicit country setting overrides it, so a French-language page can still show a price in a different country's currency. That is expected behavior, not a bug. The visitor's own country is only a fallback, not an override: MAS reads the signed-in visitor's country cookie only when the page gives no country at all, neither as a setting nor as part of the locale. Milo pages always pass a full locale such as `fr_FR` from the page's URL prefix, so there the visitor's location changes prices only when the page turns on `mas-geo-detection`.

## When does a price include tax and when does it not?

Whether a price shows tax included, shows tax added separately, or shows no tax label at all is normally computed automatically from the buyer's country, language and customer segment, not set by hand on each card. Business and university offers default to showing the price without tax; individual and student offers default to showing the price with tax included, and a handful of countries override this default outright. An author can still force a specific tax display on one price, which skips the automatic calculation.

## How does a card pick which promo code to use?

A promo code can reach a card's price in three ways, and the most specific one wins. A code set directly on one price or button beats a code set once for the whole card, and the card-wide code only applies when nothing more specific is set. A server-side promotion can also rewrite offers and inject a promo code into a fragment before it ever reaches the browser. There is also a special value, cancel-context, that an author can set on one element to mean "no promo here"; it is not a real promo code and is never sent to the pricing service.

## Why can a price look wrong or out of date right after a change?

Prices are cached in two places that do not automatically know about each other: the browser keeps its own short-lived cache of recent prices, and the server that builds the card also keeps a cache it fills in ahead of time. A promo or offer change has to work through both before every viewer sees it. Refreshing the browser's cache does not guarantee a fresh price either, because a failed refresh falls back to the old cached value rather than showing nothing.
