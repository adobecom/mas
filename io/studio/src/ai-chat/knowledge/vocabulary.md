---
topic: vocabulary
keywords: authoring, platform, studio words and where they live
---
<!-- ported from the MASA knowledge corpus -->
# Studio words and where they live

## What do author words map to in the system?

The Template picker in the card editor chooses a card's template, which the code and the fragment store as its `variant` (picker defined in `studio/src/editors/variant-picker.js`). Authors say template; variant is the older author term and remains the code name. The side navigation and its pages come from `studio/src/mas-side-nav.js`. A placeholder token in a field is resolved by `io/www/src/fragment/transformers/replace.js`. Card content lives in Odin under `/content/dam/mas/<surface>/<locale>/`, and settings under `/content/dam/mas/<surface>/settings/index`. Masks live under `<surface>/<locale>/masks/<name>`.

## What are the Studio side navigation pages?

Home, Fragments, Collections (disabled), Promotions, Offers (disabled), Placeholders, Translations, Support, and Advanced tools. Advanced tools links to Bulk publish, Global settings, Masks and Offer mapping. There is no Product Catalog page in current MAS Studio: product and offer lookup happens through the Offer Selector Tool.
