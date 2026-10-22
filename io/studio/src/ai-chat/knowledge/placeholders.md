---
topic: placeholders
keywords: platform, authoring, placeholders, placeholder, dictionary, key, value, rich text, locale string, translation string, token, substitution
---
<!-- ported from the MASA knowledge corpus -->
# Placeholders

## What is a placeholder?

A placeholder is a reusable key and value text entry scoped to a surface and a locale, stored as its own AEM content fragment in that surface and locale's dictionary folder. Card fields reference a placeholder with a `{{key}}` token, and keys allow only word characters, hyphens and underscores. The Placeholders page in Studio manages the placeholders for the currently selected surface and locale.

## Where the dictionary index lives

Each surface and locale pair has one dictionary index fragment, holding references to every placeholder authored for that pair, on the Odin author tier at `/content/dam/mas/<surface>/<locale>/dictionary/index`. Reading the index directly is the fastest way to confirm whether a placeholder exists for a given surface and locale before looking further downstream.

## Why does a card show English text on a non-English page?

Two different fallbacks look the same on the page. A card with no locale variation renders its locale-default parent fragment, which is usually the English content. Placeholder text is resolved separately, from three dictionary layers merged lowest to highest priority: the `acom` dictionary for the page's default locale, the card's own surface dictionary for that same default locale, and the region overlay (for example `fr_BE`). A key missing from the region overlay falls back to the default-locale value, `fr_FR` for a `fr_BE` page, not to English. English placeholder text on a French page therefore means the French dictionary entry itself holds English text, or the key is missing everywhere and is showing as its bare key name. Prices and checkout links are resolved by the commerce backend from the offer and are never translated, so they are not evidence of a localization problem.

## What a page shows when a placeholder key does not resolve

A well-formed key that no dictionary layer holds is replaced by the key itself, with the braces removed: `{{buy-now}}` renders as `buy-now`. A word that looks like a key sitting in the card text therefore means the key is missing for that surface and locale. The same happens when spaces pad the key inside the braces, as in `{{ buy-now }}`, because the spaces become part of the key that is looked up.

A literal token with its braces, such as `{{buy now}}` inside a heading or on a button, means IO did not replace it. There are two causes. The key is malformed: keys allow only word characters, hyphens and underscores, so a token containing a space or a dot never matches the placeholder pattern and is left untouched. Authors hit this when they type a label the way it reads, `{{buy now}}`, instead of the authored key, `{{buy-now}}`. Or no dictionary loaded at all: when every layer comes back empty or fails to load, IO skips replacement and every token stays as written.

Confirm by reading the dictionary index for the surface and locale and checking the key exists exactly as the token spells it, including hyphens. If the key is there and tokens still show with braces, the dictionaries did not load for that request.
