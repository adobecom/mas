---
topic: limitations
keywords: platform, authoring, known gaps
---
<!-- ported from the MASA knowledge corpus -->
# Known gaps

## Can I see which pages use a card?

Not today. MAS Studio has no built-in "where used" lookup for cards. If several pages reuse the same fragment id, editing that shared fragment affects every page that renders it, and there is no report that lists them.

## Is there an AOS API that turns an offer id into an OSI?

No documented AOS API converts an offer id directly into an OSI. The documented flow is to create an offer selector with `POST /offer_selectors` and then query it with `GET /offers:search.selector`. `GET /offers/{ids}` only returns offer details.

## Can the offer selector tool list countries alphabetically?

Not today. The country dropdown order belongs to the offer selector tool itself rather than to MAS authoring configuration, so it cannot be changed from MAS Studio settings. As a workaround, click the dropdown and type the country abbreviation, then press Enter to jump to it.

## Can a promotion leave a personalization segment alone?

Not today. A promotion that targets a card also reaches visitors who get a grouped variation of it, either through a promo variation or through the promo code, and no project setting excludes a segment. Adding the grouped variation to the project does not protect it. The request is tracked in MWPW-208439. As a workaround, an MEP manifest row can swap individual card fields to the grouped variation's own id, which served those fields without the promotion on the adobe.com homepage; fields that are not swapped still show the promotion.

## Is there an audit log for a deleted fragment?

No. There is no audit log today showing who deleted a card fragment, and no built-in recovery. The editor's delete dialog states that the action cannot be undone, and when the fragment has variations it warns that they will be deleted too, with a count by type such as "2 locale, 1 promo variation(s)", but does not name them.

## Can I subscribe to fragment create, modify and delete events?

No activity or audit-log API exists for fragment events today. MAS runs on Odin, a managed AEM environment, so event-subscription requests go to the Odin team.

## Can this assistant create or change an offer, or change its price?

No. MAS never stores a price itself; a card only holds an offer's ID, and the price always comes from Adobe's separate commerce catalog systems, WCS and AOS, at render time. This assistant has no way to create an offer, change an offer's price, or adjust pricing policy.
