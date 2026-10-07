---
topic: milo-locale-country
keywords: platform, milo, pricing, locale and country for mas content on milo pages
---
<!-- ported from the MASA knowledge corpus -->
# Locale and country for MAS content on Milo pages

## How the Milo page prefix becomes the MAS locale and country

Milo, not MAS, decides the locale and country that cards request. Milo's merch code reads only the page's locale prefix (the `/fr` or `/ch_fr` in the URL), not its `ietf` value, and maps it to a MAS locale of the form `language_COUNTRY`:
- A prefix listed in Milo's `GeoMap` table uses that entry: `/ch_fr` becomes `fr_CH`, `/la` becomes `es_DO` and `/africa` becomes `en_MU`.
- Any other `country_language` prefix is split in two: `/ca_fr` becomes `fr_CA` and `/ae_ar` becomes `ar_AE`.
- No prefix (the global English site) is `en_US`.
- `/langstore/<lang>` pages use a language-to-country table instead: `/langstore/el` becomes `el_GR`.
- Puerto Rico is special: `/pr` requests the `es_PR` locale, but MAS prices Puerto Rico as `US`, because commerce has no Puerto Rico prices.

The mapping assumes English when a prefix is only a country and is not in `GeoMap`. `/in` becomes `en_IN`, and Greek `/el` becomes `en_EL`, with country `EL`. `EL` is not a country MAS prices, so pricing falls back to US, and IO may not recognise `en_EL` as a locale. That follows from reading the code and is untested. When a Greek or other unusual market page shows English or US prices, check this mapping first.

Sites that put the language first in the URL (such as `/es/mx`) are not handled by this mapping. Unless the page turns on geo detection, it can produce an invalid locale. That also comes from reading the code and should be confirmed with the Milo team.

## Why the visitor's Adobe account country does not change prices on a Milo page

On a Milo page, the page's market sets the country for MAS content, not the visitor. MAS only uses the signed-in visitor's `ims_country_code` cookie when the page gives no country. It treats a locale with a country part (`fr_FR`, `en_US`) as an explicit country. Milo always passes such a locale, so `aem-fragment` never reads the cookie on a Milo page. A UK account on the US page sees US prices. That is intended, not a bug.

The IO request only carries `&country=` when the country differs from the locale's own country, for example `locale=en_GB&country=AU`.

## Why ?country= does not change the prices on a Milo page

By default a Milo page ignores `?country=` and the visitor's location for MAS. The country comes only from the URL prefix. `?country=`, `?akamaiLocale=` and the visitor's detected location only matter for MAS when the page turns on geo detection. To see another market's prices, open that market's localized page (`/fr/...`), or add `?mas-geo-detection=on&country=FR` to the page URL.

## What mas-geo-detection changes

`mas-geo-detection`, set to `on` or `true` as a URL parameter or as page metadata, lets the visitor's market decide the country. Milo then picks the first of these that gives a country: `?country=`, then `?akamaiLocale=`, then the Akamai value in session storage, then a lookup on `geo2.adobe.com`. The `country` cookie also counts, and so does the `ims_country_code` cookie when the page also sets `mas-ims-login=on`. The result is checked against the markets the page's language supports, and a market that is not supported becomes the language's default market.

With geo detection on, the global English page gives visitors from Australia, India and the United Kingdom the `en_GB` locale, so they see the UK English card copy. `/au`, `/in` and `/uk` keep their own locales. Milo also puts the validated market on checkout links (`data-ims-country`). If MAS later sets an unsupported account country on them, Milo changes it back.

Personalization (MEP) works out its own visitor country for `countryip(...)` audiences, whether or not `mas-geo-detection` is on. So a Target activity can target by location while MAS prices follow the page prefix.

## Why the market selector does not update prices until the page reloads

The market selector sets `country` on the page's commerce service and stores the chosen market in the `country` cookie. But the commerce service reads `locale`, `country` and `language` only once, when it starts, so changing the attribute afterwards changes nothing on the running page. That is also from reading the code. The selector then reloads or redirects with `?country=<market>`, and that parameter only affects MAS when geo detection is on. Choosing a language whose markets do not include the stored market resets the cookie to that language's default market.
