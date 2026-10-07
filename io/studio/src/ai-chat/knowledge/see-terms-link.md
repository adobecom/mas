---
topic: see-terms-link
keywords: platform, authoring, the universal see terms link
---
<!-- ported from the MASA knowledge corpus -->
# The universal See Terms link

## How does the See Terms link choose the country and locale?

The universal See Terms link is the `upt-link` element in the MAS web components. It builds `https://www.adobe.com/offers/promo-terms.html` with `locale`, `country`, `offer_id` and, when set, `promotion_code`. The language and country come from the page's MAS locale and country settings, or from `data-language` and `data-country` on the element. The visitor's IMS country cookie does not change the link: `upt-link` copies it into `data-ims-country`, but the page's country is used first. The promo terms page itself belongs to adobe.com.

## Why does the See Terms link send Canadian visitors to the US terms page?

Because the link follows the page locale, not the visitor's country. A page served in English (US) links every visitor, including Canadian ones, to the US terms. This was reported for Canadian users of the try-and-buy widget on Adobe Home and is the intended behaviour of the element, so no MAS code change applies. A visitor sees Canadian terms only when the page is served in a Canadian locale. Hardcoding the terms URL in content removes the per-locale link altogether.
