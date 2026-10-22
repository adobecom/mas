---
topic: glossary
keywords: platform, mas glossary
---
<!-- ported from the MASA knowledge corpus -->
# MAS glossary

## Odin and content fragments

Odin is the headless AEM instance that stores MAS content as content fragments under `/content/dam/mas/<surface>/<locale>/`. Cards, collections, settings, and dictionaries are all fragments. The published tier is what production serves (`https://odin.adobe.com/adobe/contentFragments/…`); the author tier holds unpublished draft edits.

## Surface

A surface is a MAS tenant folder such as `acom`, `ccd`, `express`, `acom-cc`, or `sandbox`. In MAS Studio the surface is chosen with the dropdown at the top left of the header (`mas-nav-folder-picker`), which shows it in upper case, for example SANDBOX, ACOM or CCD, and changes which surface's cards Studio lists. Words later in a fragment's path or its tags are not the surface: in "merch-card: SANDBOX / Plans / Individual / com / Creative Cloud Individual" the surface is SANDBOX, not `com`. Settings live at `/content/dam/mas/<surface>/settings/index` and dictionaries at `/content/dam/mas/<surface>/<locale>/dictionary/index`.

## Fragment, variation, and locale default

Every card has a default-locale fragment, for example `en_US`. A variation is a regional copy of that fragment for one locale, for example `en_KR`; there is at most one variation per locale per fragment. The default-locale fragment (`localeDefaultFragment`) is the parent a variation derives from. IO reads the default-language fragment first and then applies the region locale.

## MAS IO fragment pipeline

MAS IO (`https://www.adobe.com/mas/io/fragment?id=<uuid>&locale=<locale>&country=<CC>`) is the Adobe I/O Runtime action that turns an Odin fragment into what cards render. It fetches the fragment, resolves the default-language fragment, computes the region locale, applies settings, replaces `{{placeholder}}` tokens from dictionaries, and returns JSON with `fields`, `settings`, and `references`. Stage IO is `https://www.stage.adobe.com/mas/io` and only answers on the corp network.

## Region locale

IO computes a region locale from `locale` and `country` with `computeRegionLocale`. When the country differs from the default locale's own country and the surface defines a region for that country, the request is treated as that region: `locale=en_US&country=KR` resolves region locale `en_KR`. Settings overrides and dictionaries match the region locale, not the raw `locale` parameter.

## Settings

Settings are per-surface switches stored as entries under `/content/dam/mas/<surface>/settings/index`: `hideTrialCTAs`, `displayPlanType`, `secureLabel`, `displayAnnual`, `quantitySelect`, `addon`, `hideEduDisclaimer`, `additionalModalTriggers`, and `placeholderRemap`. Each setting has one default entry and optional override entries scoped by `geos`, `locales`, `tags`, or `templates`. IO returns the resolved values in the `settings` object of the fragment response.

## Placeholders and dictionaries

IO replaces `{{key}}` tokens in every fragment field from dictionary fragments, layered as the `acom` baseline, then the surface baseline, then the region overlay. A well-formed key missing from every layer renders as the bare key, braces removed. A literal `{{...}}` still visible on a page means the key is malformed, for example it contains a space, or no dictionary loaded for that request.

## maslibs and mas-io-url

`?maslibs=` is a Milo consumer-page parameter that selects where the MAS web-components bundle loads from: `local` (`http://localhost:3000`), `main`, or a branch name (`stage` is just a branch name). Milo ignores it on `www.adobe.com`. `?mas-io-url=` points web components at another IO runtime base, such as a PR author namespace. MAS Studio (`mas.adobe.com/studio.html`) ignores both.

## Web components and the IMS country cookie

Cards render with the MAS web-components bundle (`merch-card`, `aem-fragment`, `inline-price`, `checkout-link`). `aem-fragment` builds the IO request. When the page gives the commerce service no explicit country, its `country` is the `ims_country_code` cookie if that cookie exists, and otherwise the page's configured country. A locale with a country part (`fr_FR`) counts as explicit, and Milo pages always pass one, so on Milo pages the cookie is never used and the page's market sets the country. No `country` parameter is sent when the country equals the locale's own country.

## NALA

NALA is the MAS Playwright end-to-end suite in `nala/`, run on pull requests by `.github/workflows/run-nala.yml`. The agent reads existing NALA results only; it never runs tests.

## EDS preview and live

Branches deploy to Edge Delivery at `https://<branch>--mas--adobecom.aem.page` (preview) and `.aem.live` (live). Branch `.aem.live` hosts throttle automation bursts with HTTP 429, so probes use `.aem.page`.

## RPP, WCS, AOS and MCS

RPP, short for Regional Pricing, is a permanent, country-specific lower price, not a promotion. WCS, the Web Commerce Service, is the API that resolves an offer selector ID plus country, locale and promo code into the price, tax and terms a card renders, and it is the only pricing service MAS calls directly. AOS, the Available Offers Service, is the catalog service that WCS calls behind the scenes to resolve an offer selector ID into one or more priced offers. MCS, the Merchandising Content Service (also called just the Merchandising Service), is the system of record for an offer's marketing content, separate from pricing.

## Intro pricing and price point

Intro pricing, or IP, is a discount that behaves like an open-ended promotion, with its own strikethrough price and badge, unlike RPP's plain permanent reprice. A price point is a named pricing tier of the same offer, used to run different prices for different customer segments or pricing tests.

## Term, commitment and billing frequency

Term is the billing period category on a resolved offer, such as monthly or annual. Commitment is the length a customer is contractually locked into, such as one year, which can be billed on a different schedule than the term suggests. Billing frequency is how often the customer is actually charged, which can differ from both term and commitment, for example a one-year commitment billed monthly.

## Tax inclusive and tax exclusive

Tax inclusive means the price shown already has local tax, such as VAT or GST, added in. Tax exclusive means tax is shown, or added, separately from the listed price.
