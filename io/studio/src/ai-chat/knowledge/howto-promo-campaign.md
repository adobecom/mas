---
topic: howto-promo-campaign
keywords: authoring, pricing, running a promo campaign
---
<!-- ported from the MASA knowledge corpus -->
# Running a promo campaign

## What a promotion project is

A promotion project is a content fragment under `/content/dam/mas/promotions/` declaring its `surfaces`, `geos`, `startDate`, `endDate` and tags (the project is addressed by a `mas:promotion/<name>` tag). A project is active only inside its date window and when the request's surface and geo match. A project with an `endDate` is seasonal; one without is evergreen.

## The three ways a promo reaches a card

A project only touches the fragments listed in its `fragments` field; every other card is left alone, whatever its offers. The list only picks targets: the project reads no promo codes from those fragments.

1. Project promo code: the project's `promoCode` field is its default code, applied to every offer on the fragments the project lists; an inline price or button that already carries its own promo code keeps it.
2. Offer overrides: the project's `offers` field carries text lines `<osis>|<promoCode>|<geos>` — comma-separated lists, empty meaning wildcard. The parser splits on `|`, so a line written with colons is dropped silently and its code never applies. A line whose geos (`locale/…` or `country/…` tags) match neither the request's country nor its region locale is skipped. A line naming OSIs sets the code for those OSIs and beats the project's default code; a line with an empty OSI list replaces the default code for every OSI. Lines starting with `substitute|<osi>|<newOsi>|<geos>` swap one offer for another in those geos instead of setting a code.
3. Promo variations: per-fragment variation copies (path-suffixed `-2`, `-3`, up to fifty per fragment) that change card content for the campaign, resolved per default locale and region locale and deep-merged onto the fragment. A fragment can also opt its OSI out of variation merging per geo.

## Priority when several projects match

Seasonal projects always beat evergreen ones. Within the group, a project with an explicit OSI mapping for the fragment's offer wins over one with only a wildcard, over one with neither; evergreen projects without any mapping do not apply at all. Multiple projects with disjoint per-country entries can coexist on the same fragment.

## How it is authored and published

Studio has a dedicated Promotions page (list, create, duplicate, edit) gated by the promotions edit permission. The editor manages the offer lines, geo scoping, dates and attached promo variations. Publishing the project activates it; expired published projects are unpublished automatically, and the publish flow warns when attached promo variations are still unpublished or when the project has already expired.

## How the code reaches the rendered card

The promotions step stages the selected project per fragment; the wcs step then applies the project's promo code and offer-mapping OSI substitutions to inline price and checkout elements (offer-mapping entries at `<surface>/offer-mapping/index` can also swap an OSI, per geo, with an optional promo code on either side). The card renders the discounted price from WCS with that code, and the checkout CTA carries it as `apc`. If the discount is not showing: confirm the project is active and matches the surface/geo, that the OSI mapping exists for that country, and that WCS itself accepts the code for that offer and visitor country — a code WCS rejects renders no discount even though the pipeline applied it.
