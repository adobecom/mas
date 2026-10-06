---
topic: checkout
keywords: platform, pricing, checkout and buy flow
---
<!-- ported from the MASA knowledge corpus -->
# Checkout and buy flow

## How a CTA resolves its offer

A checkout element (checkout link or checkout button) does not carry a URL in authored content. On render it collects its options from its observed attributes — `data-wcs-osi`, `data-quantity`, `data-promotion-code`, `data-extra-options`, `data-modal`, `data-entitlement`, `data-upgrade`, `data-perpetual`, `data-ims-country`, `data-checkout-workflow`, `data-checkout-workflow-step`, `data-template` — and resolves the offer from WCS by OSI, country (the visitor's IMS country when known) and locale. Market and customer segment are not card attributes: the element takes them from its `ms`/`cs` options or, failing that, from the resolved offer (`marketSegments` and `customerSegment`), mapping `e` and `t` to `EDU` and `TEAM`. The country the request uses is the IMS country of the logged-in visitor or the page's country, which is why the same CTA can point at different offers for different visitors. If no offer resolves for the OSI, the element marks itself failed and its URL collapses to `#`.

## The checkout URL

When an offer resolves, the client builds a Unified Checkout v3 URL: `https://commerce.adobe.com/store/<workflowStep>` in production, `https://commerce-stg.adobe.com` in stage. Items are encoded as `items[0][pa]` (product arrangement code) plus per-item parameters such as `co` (country), `ms` (market segment), `q` (quantity) and `apc` (checkout promo code). Top-level parameters include `cli` (client id), `ctx` (context), `lang` and `co`. The page's own URL contributes only an allow-listed set of tracking parameters (`gid`, `gtoken`, `sdid`, `mv`, `mv2`, and a few others). A checkout whose `data-modal` is `true` renders `#` and opens the modal instead of navigating. A CTA with a 3-in-1 modal type keeps the real checkout URL, because the 3-in-1 modal builds its iframe from that link.

## Promo codes into checkout

A promo code reaches checkout as `apc`. If the resolved offer's promotion is not active for the visitor's country and quantity, an authored promo code is dropped rather than sent. The special value `cancel-context` means "no promotion" for that element and must never reach WCS or checkout as a real code. Pages under the `/tw/` or `/hk_zh/` paths force `lang=zh-Hant` on the checkout URL.

## 3-in-1 modal

When a CTA uses a 3-in-1 modal type (crm, twp, d2p) and the page has not turned 3-in-1 off with `<meta name="mas-ff-3in1" content="off">` (it is on by default), the checkout context becomes `ctx=if`, and on the segmentation workflow step the checkout URL also gets `rtc=t`, `lo=sl`, iframe `af` flags, and a client id of `creative` or `mini_plans` (a `doc_cloud` client id is kept), which renders the unified 3-in-1 paywall instead of a plain checkout.

## Where it breaks

Typical failure: the CTA points to `#` and nothing happens on click. Check in order: the OSI on the element (does an offer exist for it?), the country the visitor resolved to (WCS returns no offer for that country/landscape), and the promotion state when a promo code is involved. On stage, the offer landscape is always `ALL`, which can mask missing prod landscape offers.
