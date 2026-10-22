---
topic: playbook-price-trouble
keywords: platform, pricing, price trouble
---
<!-- ported from the MASA knowledge corpus -->
# Price trouble

## Symptom

Reports look like "price mismatch between acom and the checkout page", "price is not showing up", "price shows up but the tax is wrong", or "the price literal text is wrong". This playbook traces the number from the card element down through WCS to AOS. For MAS's own two-layer caching (browser and IO server prefetch) and how country, locale and tax normally resolve, see the concept on where a card's price comes from; this playbook is for when the problem looks like it sits downstream of MAS, in WCS or AOS.

## Step 1: get the OSI

Inspect the price element — it is a `<span is="inline-price">` — and copy its `data-wcs-osi` attribute value. Every later step needs this offer selector ID.

## Step 2: check WCS

A rendered card's own browser code calls WCS directly, but MAS IO's `wcs` transformer already prefills prices and rewrites promo codes into the `/mas/io` fragment payload server-side, so what the browser shows can come from that prefill rather than a fresh WCS round trip — the browser's own WCS call may not reflect what actually changed.

A price shows the first offer after the browser sorts the list: offers in the preferred language (MULT, or EN in GB) come first, then offers without a term. WCS returns the offers in the same order every time. When two offers tie on both keys, the browser's sort does not keep that order (see more than one offer returned for one OSI, below).

A price change staged in the catalog often shows up as an offer whose start date has passed on DRAFT but is a far-off placeholder such as 2049 on PUBLISHED. A future start date does not hide the offer. WCS still returns it on PUBLISHED, and neither the MAS web components nor MAS IO filter offers by start date. So if the staged offer shares an OSI with the live one, the card can show either price on production today. When PUBLISHED returns more than one offer for the OSI, follow more than one offer returned for one OSI (below). Do not treat it as a price that production does not show yet.

Both tiers cache for 15 minutes and update on their own; WCS cache staleness has not historically been the cause of a reported issue, so do not spend time purging first.

## Step 3: classify the WCS response

**Offers returned but the payload looks wrong:** check the field that matches the symptom.
- Tax label wrong (shows "tax included" when it should say "tax excluded", or vice versa): check the `taxDisplay` and `taxTerm` fields.
- Price text/literal wrong: check the `formatString` field.
- Promo not applying or applying when it shouldn't: check the `promotion` object and whether it has expired.

**More than one offer returned for one OSI:** a card shows two different prices for the same OSI, for example the price in the rich text editor (RTE) in Studio differs from the price in the card preview, or the price changes after a refresh. Compare the `offerId` values, not just the prices: different offer ids are different offers, not one offer in two states. An OSI should resolve to a single offer per country (a GB `EN` plus `MULT` language pair is the normal exception). When several offers match on segment, commitment, term, language and tax, the browser cannot tell them apart and its pick is not stable. `selectOffers` sorts the offer list in place. Price elements that share the OSI share that list, and a tie makes the sort swap the two offers. So each price element that renders can flip the order for the next one. One card can show both prices at once, and any re-render (such as a reload or Studio's draft landscape toggle) can swap which price shows where. The second offer on the OSI is a catalog problem, but the flipping is MAS behavior, so the layer is `client`, not only commerce.

## Step 3: classify the WCS response (part 2)

**Suspecting the draft landscape:** Studio's "Draft landscape offer" toggle (`commerce.landscape=DRAFT`) is not proof that a price difference comes from draft vs published pricing. Flipping the toggle on an open Studio page re-renders every price, but it does not change the landscape the price requests ask for. Studio copies its landscape into the commerce service only when it renders that service: when the page loads, and again when the locale, region or folder changes. So right after a flip, the requests keep asking for the landscape the page had before, usually `landscape=PUBLISHED`, and a price that changes at that moment comes from the same offers picked again, which points to more than one offer returned for the OSI. A page opened with the draft landscape already on (`commerce.landscape=DRAFT` in the URL), or one where the locale changed after the flip, does ask WCS for `landscape=DRAFT`. To check whether landscape matters at all, run the same WCS query twice, once with `landscape=DRAFT` and once with `landscape=PUBLISHED`. Landscape explains the difference only if the two responses return different offers or prices. A different start date on the same offer does not change which price shows.
