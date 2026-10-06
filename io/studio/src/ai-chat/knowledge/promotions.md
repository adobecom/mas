---
topic: promotions
keywords: platform, authoring, promotions, promotion, promo, promo code, campaign, project, discount, offer substitution, promo variation, schedule, publish promotion
---
<!-- ported from the MASA knowledge corpus -->
# Promotions

## What is a promotion in MAS?

A promotion, called a promotion project in MAS Studio, is a content fragment that describes one campaign: when it runs, where it runs, which promo code it carries, and which offers, cards and collections take part. Authors work with promotions on the Promotions page in the side navigation, which lists every project with its timeline, status and creator.

A promotion is not a place where you change a price. It carries a promo code that the commerce service applies to an offer at render time, so the discounted price still comes from the catalog. See the offers and pricing pages for how an offer resolves into a price.

## What does an author set on a promotion?

The project form has a title, an optional promo code, a start date and an end date in UTC, with an evergreen switch for a campaign that has no end. It also takes one or more geos, chosen as locale and personalization tags, and one or more surfaces, chosen from a surface list. Studio assigns the promotion tag itself, and the field is read only.

Below the form, the author attaches the items the campaign touches, on an Offers tab and a Fragments tab that also holds collections. A separate Manage promo codes and offers view lets the author override the promo code per country for a given offer selector, so one project can run different codes in different countries.

## How does a promotion reach a card?

The fragment pipeline reads the promotions folder for the requested surface, keeps the projects whose promotion tag, geo and date window match the request, and then applies them to the card being rendered. A matching project can change the card in two ways: it applies its promo code to the card's offer, and it merges the card's promo variation over the authored card when one exists.

A promo variation is a promotion specific copy of a card, stored in a promotions folder inside the same surface and locale, under the promotion's own name. An author creates it from the project's fragments list with Create promo variation, optionally scoped to particular geos, and Studio opens the copy in the fragment editor. Editing that copy changes only what the campaign shows, never the default card.

## What does a promotion do to a personalized card?

This applies when a card is requested with a `pzn` value and a promotion project also targets it. The pipeline looks for promo copies before it looks at personalization, and picks the first of these that applies:

1. The project holds a promo variation made from the visitor's grouped variation. That promo variation renders.
2. The default card has a promo variation in the project. It renders instead of the visitor's grouped variation, whether or not that grouped variation was added to the project.
3. The project lists grouped variations and the visitor's is one of them. The grouped variation renders with the promo code.
4. The project lists grouped variations but not the visitor's. The default card renders with the promo code, and the visitor's grouped variation is dropped.
5. The project lists no grouped variations. The visitor's grouped variation renders with the promo code.

The promo code applies in every case. Adding a grouped variation to a project brings it into the promotion rather than protecting it.

There is no setting that keeps a promotion away from a personalization segment. The project model has a `variationStrategy` field, but nothing reads it. The per offer "ignore variations" option is not a segment switch either: it applies to every visitor of that offer in that geo, skips only the promo variation, and still applies the promo code. The request to leave chosen segments untouched is tracked in MWPW-208439.

A card field that an MEP manifest row swaps to the grouped variation's own id is a different path. On the adobe.com homepage on 2026-09-23 that request came back with no promotion applied, so a field swap can keep segment content while the rest of the card shows the promotion.

## Which countries and dates is a promo code set up for?

A promo code has two separate lives, and a question about "where and when it is valid" can mean either.

In MAS, a code is attached by promotion projects, either as the project's promo code (for all the project's geos) or on an offer line of the form `<OSIs>|<code>|<geos>`, where an empty geo list means all the project's geos. So the MAS answer is: which published projects use the code, their start and end dates (no end date means evergreen), their surfaces, and the countries each line maps the code to. A project without a `mas:promotion/` tag is never applied by the fragment pipeline, whatever it says.

In commerce, the code is defined in the promotions system with its own validity window and eligible countries. That window is not visible to MAS or to this assistant. What can be checked is the effect today: pricing an OSI through WCS with the code shows the discounted price next to the price before the discount when the code applies, and the regular price when it does not. The start and end dates in a WCS response belong to the offer, not to the promo code.

This assistant can do both: it finds every published project using a code and prices each OSI and country pair it maps through WCS with the code.

## What do the promotion statuses mean?

Studio computes the status from the dates and from the publish state rather than storing it. A project that is not published yet is draft; a published project is scheduled before its start date and active between its dates; a project whose end date has passed is expired; a project that was published and then edited again is modified. A project without a usable start date shows as unknown.

Studio also separates production from test projects: a project that targets only the sandbox or nala surfaces counts as a test project, and any other surface makes it a production one.

## Who can create or edit a promotion?

Creating, editing and duplicating promotion projects is limited to a promotions editors group, with MAS administrators always allowed. Everyone else sees the Promotions page and can open a project in a view only mode, without the create button. The access page explains how group membership is requested.
