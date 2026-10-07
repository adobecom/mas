---
topic: pricing-systems
keywords: platform, pricing, wcs, aos and mcs
---
<!-- ported from the MASA knowledge corpus -->
# WCS, AOS and MCS

## What is WCS?

WCS, the Web Commerce Service, is the API that takes an offer selector ID plus context like country, locale and promo code, and returns a ready-to-show price, tax and terms for a web page. It exists so that pages only ever handle an opaque offer ID and a few context values, never raw pricing logic themselves.

## What is AOS?

AOS, the Available Offers Service, is the catalog and search service behind WCS. It looks up an offer selector ID, or a direct query, and resolves it into one or more concrete offers, each with its own price, terms and business details such as commitment and term.

## What is MCS?

MCS, the Merchandising Content Service (its own service descriptor also just calls it the Merchandising Service), is the system of record for an offer's marketing content, things like its product name, description, icons and links. It is a separate concern from pricing: AOS can pull that content in when asked, but MCS itself never touches price.

## Which of these does MAS actually call when a card renders?

Only WCS. A MAS card's browser code makes exactly one pricing network call, straight to WCS, and never calls AOS or MCS directly. WCS itself calls AOS behind the scenes to resolve the offer selector ID into real offers, but MAS never sees that step happen. The one unrelated exception is MAS Studio's offer selector tool, which refreshes its own product search cache by querying AOS directly; that has nothing to do with how a live card gets its price.

**Who owns WCS?.** 
