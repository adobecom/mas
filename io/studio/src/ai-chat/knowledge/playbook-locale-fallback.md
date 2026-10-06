---
topic: playbook-locale-fallback
keywords: platform, authoring, locale and variation fallback
---
<!-- ported from the MASA knowledge corpus -->
# Locale and variation fallback

## How the region locale is computed

IO takes `locale` and `country` request parameters. First it resolves the default locale for that locale on the surface: the surface's default-locale table is matched by language, then by country or the language's region list, falling back to a language-only match. If the default locale differs from the fragment's own path locale, IO fetches the default-locale fragment and uses that as the body. Then `computeRegionLocale` runs: when the request country differs from the default locale's own country and is a known region for that language on the surface, the region locale becomes that region (for example `locale=fr_FR&country=CA` resolves to `fr_CA`). Settings, dictionaries and regional variations all key off the region locale, not the raw `locale` parameter. An unknown locale is rejected with 400 before any Odin call, and a territory locale like `es_PR` keeps PR content but is priced as US.

## Why the same locale differs across surfaces

Each surface has its own default-locale table (acom, ccd, express, adobe-home, commerce, sandbox). English is the clearest case, and it differs per surface: on acom, `en_GB` is a default locale whose regions are Australia and India; on express, `en_GB` is a default locale with no regions, and India is a region of `en_US` instead; on ccd there is no `en_GB` entry at all, so an `en_GB` request falls back to the `en_US` fragment. The same `en_GB` request therefore gets the `en_GB` fragment on acom and express but the `en_US` fragment on ccd. The same logic applies per language and per surface: a card that "works in fr_FR but not fr_CA" usually means the fr_CA regional variation simply was not authored, and a card that behaves differently on CC than on adobe.com usually means the two surfaces resolve the locale to different defaults.

## When a regional variation applies

In the customize step, variations merge in this order: a promo variation (when a promotion project targets the fragment), otherwise the regional variation, otherwise a personalization variation. The regional variation is found only when the region locale differs from the default locale, by matching the variation's Odin path against `/content/dam/mas/<surface>/<regionLocale>/`. So a variation applies when three things hold: it is listed in the fragment's variations references, its path uses the exact surface and region locale, and no promo variation is in front of it. The merge is a deep merge where the variation wins field by field, except `id` and `path`.

## Why a placeholder falls back to English

Placeholder dictionaries resolve in three layers, lowest to highest: the global baseline, which is always the acom dictionary for the request's own default locale; the requested surface's dictionary for that same base locale; and the region overlay, the requested surface's dictionary for the region locale. A key missing from the region overlay but present in the base renders the base (typically English) value. Note the region locale used for placeholders can differ from the one used for fragments: an `en_US` acom page with `country=IN` overlays `en_IN` (a region of en_GB on acom) onto its `en_US` base, without moving the shared region locale. A 404 on a region dictionary is a stable "nothing authored" case, while a 404 on a base dictionary is treated as a transient publish race.

## Troubleshooting a locale bug

Work in this order: 1) confirm what the request actually is (locale, country, surface) on the consuming page. 2) Compute the expected default locale and region locale from the surface's table for that locale and country, and say them out loud. 4) If the content is wrong, verify in Odin that the expected regional variation exists for that surface and region locale and is listed in the parent fragment's variations. 5) If a string is in the wrong language, trace the placeholder through the three dictionary layers and find the layer that supplies the key. The most common root causes, in order: variation never authored for that region locale, the surface resolves the locale to a different default than expected, and a dictionary key missing at the region layer.
