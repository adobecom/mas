---
topic: playbook-milo-page-trouble
keywords: platform, milo, troubleshooting, mas content on a milo page
---
<!-- ported from the MASA knowledge corpus -->
# MAS content on a Milo page

## About MAS content on a Milo page

Start by pinning down the page: its exact URL and host, its locale prefix, and which MAS content is involved (card, collection, price or CTA). On a Milo page, the host decides which MAS code runs and whether drafts show, and the prefix decides the country.

## A card or collection is missing on a Milo page

Check in this order.
1. Open the same page on its `.aem.page` host. On `.aem.page` and localhost Milo shows a "Load Error" or "Not Found" box with the fragment id where a card or collection failed. On `www.adobe.com` a failed card just hides itself.
2. Run the Milo preflight "M@S Unpublished Fragments" check. It fails for any card whose fragment production MAS IO does not return, which is usually an unpublished card.
3. Check the authored link. It must be a `mas.adobe.com/studio.html` link on a trusted host, with the fragment id in the hash as `fragment=` or `query=`. A link with no fragment id renders nothing and stays a plain link. A collection link whose hash does not start with `content-type=merch-card-collection` is treated as a single card.
4. Check personalization. Add `?mep=off` to see the page without any MEP changes. If the card comes back, a manifest is replacing or hiding it.
5. Read the console for the MAS error message, such as "CTA has an invalid offer" or "Contains unresolved offers".

## It looks right on the preview page but wrong on production

This is expected when the card has unpublished changes. Milo turns MAS preview on for `*.aem.page` hosts and for `www.stage.adobe.com`. In preview, cards are built from the unpublished (authoring) content, so the preview page shows edits that production does not have yet. Publish the card in Studio, then allow a few minutes for the IO cache.

The two hosts also run different MAS code. Production loads the bundles released to `www.adobe.com/mas/libs/`, while every other host loads the latest MAS `main`. So a fix merged in MAS can appear on stage and preview before it reaches production.

## Prices are in the wrong country or currency on a Milo page

The country comes from the page's locale prefix, not from the visitor. See the Milo locale and country concept.
- Check the prefix mapping: `/ch_fr` is `fr_CH`, `/la` is `es_DO`, `/africa` is `en_MU`, `/pr` is priced as US, and a country-only prefix missing from Milo's table gets English (Greek `/el` becomes `en_EL`).
- `?country=` and the visitor's Adobe account country do not change MAS prices unless the page turns on `mas-geo-detection`.
- With geo detection on, check the market the page resolved. The MEP overlay's M@S panel shows the page market and where it came from.

## A trial CTA is missing on the Korean page

On `/kr` pages Milo removes trial checkout CTAs once they resolve. The exceptions are a link hash of `#_allow-kr-trial` and page metadata `allow-kr-free-trial=on`. Studio settings still decide what reaches the page; this rule is an extra filter that Milo applies on top. The code marks this rule for removal (MWPW-173470), so check that it is still present before relying on it.

## A Buy CTA opens a modal, Download or Upgrade instead of checkout

Milo decides this on the page, not MAS. For each CTA it tries a download (for a signed-in visitor who already owns the product and has `entitlement=true`), then an upgrade (with `upgrade` on the link and an upgrade offer on the page), then a modal. The first that applies replaces the plain checkout link.

The modal paths come from Milo's commerce `checkout-link.json` spreadsheet, which is content and not code. Its rows are keyed by product family and can differ by locale. The 3-in-1 modal is on unless the page has `<meta name="mas-ff-3in1" content="off">`. When it is off, Milo uses the link's `fallbackStep` instead. Upgrade CTAs go to `plan.adobe.com` and need an entitlement that allows a plan change.

## MAS content looks different only on some pages

Check whether the page runs a MEP experiment that loads forked block code. Milo's `libs/mep/<test-id>/` folders hold temporary block code for experiments, loaded through the `useblockcode` manifest action. Some of them fork MAS-related blocks: `emea1443/merch-card` is a copy of the legacy merch-card block, and the `ace1209` tabs and product-marquee-grid forks change how cards and MAS fields look. If only an experiment page looks wrong, suspect the fork before MAS. `?mep=off` confirms it.

## URL parameters that change MAS on a Milo page

- `?maslibs=<branch>` loads MAS from a branch. It is ignored on `www.adobe.com`. `local` means `http://localhost:3000`, and `main` means MAS main.
- `?mas.preview=off` turns off the automatic preview on `.aem.page` and stage.
- `?mas-geo-detection=on` lets the visitor's market decide the country. With it on, `?country=XX` or `?akamaiLocale=XX` sets that market.
- `?mas-ims-login=on` lets the signed-in account country count when geo detection is on.
- `?commerce.env=stage` and `?commerce.landscape=DRAFT` use stage pricing or draft offers. They only work on non-production Milo hosts.
- `?instant=<date>` pretends it is that date, for MEP promo schedules and for MAS promotions. MAS passes it to IO, which uses it to pick promotions.
- `?mep=off` turns off all personalization, and `?martech=off` turns off Target and other martech manifests.
- `?promo=` selects MEP promo manifests. It is not a MAS promo code. A MAS promo code comes from the authored OST link (`promo` or `promotionCode`), a `data-promotion-code` wrapper, or a page-wide `promotionCode`, which MAS reads from the URL, storage or a `promotion-code` meta tag. Checkout links use the page-wide code as their default.
- `?mepMasHighlight=true` turns on the MEP overlay's MAS highlighting (below).

MAS reads its settings from the URL first, then session or local storage, so a value from an earlier test can linger after the parameter is gone. Clear the site's storage when a setting will not reset.

## How to find MAS content on a Milo page with the MEP overlay

The MEP preview overlay can highlight all MAS content on a page. The preview is on by default outside production. On production it is on when the URL has `?mep` (even with no value) or `?mepButton`, and `?mepButton=off` hides it. The current overlay (mep-next) is the default. `?mepnext=off` loads the older one.

Turn on "Highlight M@S Content", or add `?mepMasHighlight=true`. Collections get an "Edit Collection in M@S Studio" badge. Cards inside a collection get Edit Card, View in OST and Copy Fragment ID. Standalone prices and CTAs get "View in OST", and the active sidenav filter gets "Edit Sub-collection". This is the fastest way to get from a page to the right card in Studio.

Each highlighted item carries a country chip. A chip that is flagged as a mismatch means that item resolved a different market from the page. The overlay's M@S panel shows whether geo detection is on, where the country came from, the page market, and how many collections, sub-collections, cards, inline fields and standalone offers the page has.
