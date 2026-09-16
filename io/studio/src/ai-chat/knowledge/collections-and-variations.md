---
topic: collections-and-variations
keywords: collection, merch card collection, variation, locale variation, grouped variation, pzn, personalization, locale default, parent fragment, translation
---
# Collections and Variations in MAS Studio

## What is a card collection?

A collection is an AEM content fragment that groups merch cards. It uses the dedicated collection fragment model and is tagged mas:studio/content-type/merch-card-collection. The collection stores references to its member cards in a multi-value field along with a display label. Collections live in the same surface and locale folder structure as cards, and they can be attached to promotions alongside individual cards. Grouped (personalization) variations can also be created for collections, not only for cards. In the collection editor, member cards are added by pasting Studio card links into the cards list — pasted links are de-duplicated against the existing members — and removed line by line; there is no drag-and-drop reordering.

## Can the AI assistant create collections or add cards to them?

No. Collections are created and edited in Studio, not through chat. The assistant
has no collection operations: it cannot create one, add cards to one, or search
for one. Ask it to find cards and it will; collecting them is done in Studio.

Open the collection editor in Studio to create a collection or change its
members. Member cards are added by pasting Studio card links into the cards list
— pasted links are de-duplicated against the existing members — and removed line
by line.

## How can I find cards?

The assistant searches cards with search_cards, which supports free text or title
search plus surface, locale, tags, and OSI filters. Collections are browsed in
Studio, and a collection can be attached to a promotion in the Promotions editor.

## What is a locale variation and what are the rules?

A locale variation is a per-locale copy of a card whose parent is the locale default fragment, identified in the editor context by the default-locale-id. The rules enforced in Studio: there is exactly one variation per locale per fragment, so in the variation dialog any locale that already has a variation is disabled; a variation cannot be created from another variation — the error reads "Cannot create a variation from another variation. Please use the default locale fragment."; and if the backend reports that a variation already exists at a path, Studio links the existing fragment to the parent instead of creating a duplicate. In preview, fields left empty on a variation inherit the parent's value, while fields with a value override the parent for that field.

## What is a grouped (pzn) variation?

A grouped variation is a personalization variation created under a parent fragment and driven by pzn tags rather than by locale. In the variation dialog it is only offered when the source fragment is the en_US fragment or a collection, and at least one pzn tag must be selected before it can be created. For cards, creating a grouped variation first resolves the fragment's OSI to its offer data; collections use a dedicated product arrangement code instead. Grouped variations are stored under a personalization (pzn) folder in the fragment path and appear in the fragment editor's variations panel next to locale variations and promo variations.

## Which variation operations can the AI assistant perform?

Read-only: get_variations returns the variation graph for a fragment. State-changing, and always requiring confirmation: create_locale_variation creates a new locale variation given the parent card's UUID and a target locale, with an optional title; create_grouped_variation creates a grouped (pzn) variation under a parent, with optional title and tags.

The narrower lookups that used to sit alongside get_variations — a card plus its full tree, the locales a card has variations for, and a variation's parent — were removed. The assistant offered them but nothing could execute them, so picking one ended the turn with no answer. Use get_variations, or the fragment editor's variations panel in Studio.
