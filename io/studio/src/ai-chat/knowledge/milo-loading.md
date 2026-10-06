---
topic: milo-loading
keywords: platform, milo, deploy, how a milo page loads and starts mas
---
<!-- ported from the MASA knowledge corpus -->
# How a Milo page loads and starts MAS

## Where a Milo page gets the MAS bundles

Milo does not carry its own copy of MAS. There is no MAS folder under Milo's `libs/deps`; every MAS file (`commerce.js`, `mas.js`, `merch-card.js`, `mas-field.js` and the rest) is loaded at runtime from outside Milo.

Which URL it loads from depends only on the page's hostname. On exactly `www.adobe.com` the files come from `https://www.adobe.com/mas/libs/<name>.js`. On every other host — `www.stage.adobe.com`, any `*.aem.page` or `*.aem.live` preview, localhost — they come from MAS `main` on Edge Delivery: `https://main--mas--adobecom.aem.live/web-components/dist/<name>.js`. A stage page therefore runs the latest merged MAS code, not a separately released stage build.

## Who builds and deploys the MAS bundles

The MAS team builds and ships them from the `adobecom/mas` repository; the Milo team takes no action for a MAS release. `web-components/build.mjs` writes the bundles to `web-components/dist`, the built files are committed, and the web-components PR workflow fails a PR whose committed `dist` does not match a fresh build. Merging to MAS `main` publishes them on `main--mas--adobecom.aem.live`, which is what every non-production Milo host loads. How `www.adobe.com/mas/libs/` is mapped to that content is not in either repository (it is CDN configuration), so confirm a production rollout by loading the file on `www.adobe.com`, not by reading code.

Older MAS docs describe a `mas-ff-mas-deps` flag with a fallback to Milo's `../../deps/mas/`. Neither exists in today's Milo: if a MAS file fails to load, Milo caches the failure and rethrows it; there is no fallback copy.

## What maslibs does on a Milo page

`?maslibs=` on a Milo page swaps where the MAS bundles load from, so a MAS branch can be tested on a real page. Milo validates the value itself:
- `local` → `http://localhost:3000` (serve the built `web-components/dist` there yourself).
- `main` → `https://main--mas--adobecom.aem.live`.
- A bare branch name → `https://<branch>--mas--adobecom.aem.live`; `branch--repo` and `branch--repo--owner` are also accepted, for a fork.
- The value is lowercased and limited to 100 characters, and Milo always uses `.aem.live`, never `.aem.page`. Anything else is ignored.
- `stage` has no special meaning: it is treated as a branch called `stage`.

The bundles then load from `<base>/web-components/dist/`, and Milo also imports that branch's `studio/libs/fragment-client.js` when the service starts.

**`maslibs` is ignored on `www.adobe.com`.** A branch can be tested on stage, `.aem.page` and `.aem.live` Milo pages, never on production. MAS CI tests each web-components PR this way, on Milo `main` with `?maslibs=<branch>--mas--<owner>`.

## Which authored link becomes which MAS block

Milo turns links into blocks by a plain substring match on the link's URL, and the first pattern that matches wins, so the order matters:
1. `/tools/ost?` or `/miniplans` → the `merch` block (an inline price or a checkout link).
2. `mas.adobe.com/studio.html#content-type=mas-compare-chart` → a compare chart.
3. `mas.adobe.com/studio.html#content-type=merch-card-collection` → a card collection.
4. Any other `mas.adobe.com/studio.html` link → a single card. A Studio link whose hash contains `field=` is the exception: it renders just that one field (`mas-field`), not a card.

The link's host must be trusted or it stays a plain link: the page's own host, `adobe.com` or any `*.adobe.com`, or any `*.hlx.page`, `*.hlx.live`, `*.aem.page` or `*.aem.live` host. A link that already carries `data-wcs-osi` is left alone.

## What the Studio link's hash controls

A card or collection is configured only by the hash of its Studio link; the query string is ignored. The recognised hash keys are:
- `fragment` or `query` — the fragment id (the two are aliases). Without one, nothing renders and the authored link stays on the page.
- `mask`, `pzn`, `field` — passed through to the card.
- `sidenav` — `true` turns on a collection's side navigation.
- `jsonld` — `on` injects the card's structured data (JSON-LD) into the page and renders no visible card.

## What an OST link's parameters control

A `/tools/ost?` link becomes a checkout link when `type=checkoutUrl`, and an inline price for any other `type`. `osi` is required; without it nothing renders.
- Price links read `term`, `seat`, `tax`, `planType`, `exclusive`, `alt` and `quantity`; `type` picks the template (`price`, `optical`, `discount`, `strikethrough`, `promo-strikethrough`, `annual`, `legal`, and the older `priceOptical` style names). `old` only matters when a promo is present, and `annual` only when the page turns on `mas-ff-annual-price`.
- Checkout links read `workflowStep`, `marketSegment`, `entitlement`, `upgrade`, `modal`, `fallbackStep` and `target=_blank`; allow-listed checkout keys such as `cli`, `ctx`, `apc`, `ms`, `cs`, `q`, `promoid`, `rf` and `pcid` are passed to checkout. A `#_tcl` hash makes a text link instead of a button.
- The promo code is the link's `promo` or `promotionCode` parameter, or the nearest ancestor with `data-promotion-code`. `perp=true` marks a perpetual offer.

## How Milo creates the commerce service

Milo's merch code loads `commerce.js` and appends one `<mas-commerce-service>` to the page `<head>`. It sets `locale`, `language` and, when known, `country` (see the Milo locale and country concept), then copies every key of the site's Milo `commerce` config onto it as attributes.

On any non-production Milo environment Milo also adds `allow-override`. Only then do the `commerce.env` and `commerce.landscape` settings take effect; on production they are ignored. Milo counts `*.aem.page`, `*.aem.live`, and stage, corp, graybox and `aem.reviews` hosts as non-production, and `?env=` can force it.

MAS defaults to production pricing (WCS) whatever the Milo environment is. On a non-production page, `commerce.env=stage` switches to stage WCS and stage MAS IO, and `commerce.landscape` takes `DRAFT` or `PUBLISHED`. These are read from the page URL or from session or local storage; `commerce.env` is not read from page metadata.

Service settings are looked up in the page URL first, then session or local storage, then a page `<meta>` tag. That covers `checkoutClientId` (default `adobe_com`), `checkoutWorkflowStep` (default `email`), `displayOldPrice`, `displayRecurrence`, `displayTax`, `displayPlanType`, `entitlement`, `modal`, `forceTaxExclusive`, `promotionCode`, `quantity` and `wcsApiKey`. A value left in session storage from an earlier test can therefore still apply after the URL parameter is gone.

## Which Milo pages show unpublished drafts

Milo turns MAS preview on automatically on any `*.aem.page` host and on exactly `www.stage.adobe.com`. In preview, cards are built in the browser from the Odin preview (authoring) tier instead of MAS IO, so these pages show unpublished card edits, need the corporate network, and keep a failing card visible instead of hiding it. `?mas.preview=off` (or `false`) turns preview off. A `.aem.live` page and `www.adobe.com` are not in preview and show only published content.

That is the usual answer to "it looks right on the preview page but not on production": the preview page shows the draft, and production shows what was last published.

## What the Milo preflight checks for MAS

Milo's preflight tool has two MAS checks.
- **M@S Unpublished Fragments** (critical) runs three seconds after load. It requests every card's fragment from production MAS IO with the page's locale, and fails on any response that is not 200. It is the quickest way to find a card that was never published.
- The **Merch** panel lists every offer on the page and flags "Offer unavailable" when a price or CTA failed to resolve. It follows each checkout link and fails it if the final URL contains an error or the product changed. It checks each promotion code as valid, expired or not found, and warns when one section or block uses more than one MAS fragment id.
