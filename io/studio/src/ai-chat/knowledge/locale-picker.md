---
topic: locale-picker
keywords: authoring, platform, the locale picker in mas studio
---
<!-- ported from the MASA knowledge corpus -->
# The locale picker in MAS Studio

## What does the locale picker change?

The picker at the top right of MAS Studio sets the locale the whole session is scoped to, next to the surface picker. It lists the languages the current surface publishes, each shown with its country, and choosing one changes which fragments the Fragments page lists and which locale the other pages work in.

It is active on Home, on Fragments, on Placeholders and in the fragment editor. On the other pages it is shown but greyed out, and on the Promotions pages it is hidden altogether, because a promotion targets geos rather than one locale.

## Why do the Placeholders and Masks pages have a second picker?

Those two pages add their own picker, labelled Region, which lists the regional locales that belong to the language currently selected in the header. Placeholders and masks are stored per surface and per locale, so the region choice decides which set of entries the page lists and which one a new entry is written into.

The header picker and the region picker answer different questions: the header one chooses the language, the region one chooses the country inside that language. Other dialogs reuse the same picker component in different modes. A global settings override uses it in region mode with checkboxes, listing every language and regional locale of the surface so an override can apply to several locales at once. The copy fragment dialog uses it in its default language mode, where you choose a single language locale for the copy.

## How do locales and variations relate in the picker?

Each card has one fragment in its default locale and at most one variation per locale, as described in the glossary. When you open a card in the fragment editor, the picker lists the locales for that card and marks every locale with no variation as not translated. Choosing a locale that has a variation opens that variation; choosing one that has none shows the missing variation state instead.

The picker is how you move between existing variations, not how you make one. To create a variation, use Create Variation in the editor's side rail, which asks for a variation type and, for a regional variation, for the target locale in its own dialog. The picker is disabled while you are already inside a variation, so go back to the default locale fragment to switch again.
