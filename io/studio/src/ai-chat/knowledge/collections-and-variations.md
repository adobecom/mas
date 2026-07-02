---
topic: collections-and-variations
keywords: collection, merch card collection, variation, locale variation, grouped variation, pzn, personalization, locale default, parent fragment, translation
---
# Collections and Variations in MAS Studio

## What is a card collection?

A collection is an AEM content fragment that groups merch cards. It uses the dedicated collection fragment model and is tagged mas:studio/content-type/merch-card-collection. The collection stores references to its member cards in a multi-value field along with a display label. Collections live in the same surface and locale folder structure as cards, and they can be attached to promotions alongside individual cards. Grouped (personalization) variations can also be created for collections, not only for cards.

## How do I create a collection with the AI assistant?

The assistant supports a create_collection action. It needs a title and a parent path (the folder the collection is created in), and optionally tags; because it is a state-changing operation, the assistant asks for confirmation before executing it. In the chat UI, when cards have been found or selected, the assistant can show a collection preview that renders each card, lets you edit the collection title (with an AI-suggested title prefilled when available), and creates the collection with those cards once you confirm. Collections created from chat land in the currently selected folder and locale, defaulting to en_US.

## How do I add cards to an existing collection?

The AI assistant supports add_cards_to_collection: given the collection's UUID and a list of card paths, it appends the new paths to the collection's existing card list, de-duplicating so a card is never added twice, and asks for confirmation before executing. The backing action fetches the collection, merges the paths, and updates the fragment using its etag so concurrent edits are detected safely. The response includes a Studio deep link to view the updated collection.

## How can I find collections and cards?

The AI assistant supports search_collections, a read-only lookup that accepts an optional folder path, a text query, and limit and offset for paging. Cards are found with search_cards, which supports free text or title search plus surface, locale, tags, and OSI filters. A collection found through search can then be used as the target of add_cards_to_collection, or attached to a promotion in the Promotions editor.

## What is a locale variation and what are the rules?

A locale variation is a per-locale copy of a card whose parent is the locale default fragment, identified in the editor context by the default-locale-id. The rules enforced in Studio: there is exactly one variation per locale per fragment, so in the variation dialog any locale that already has a variation is disabled; a variation cannot be created from another variation — the error reads "Cannot create a variation from another variation. Please use the default locale fragment."; and if the backend reports that a variation already exists at a path, Studio links the existing fragment to the parent instead of creating a duplicate. In preview, fields left empty on a variation inherit the parent's value, while fields with a value override the parent for that field.

## What is a grouped (pzn) variation?

A grouped variation is a personalization variation created under a parent fragment and driven by pzn tags rather than by locale. In the variation dialog it is only offered when the source fragment is the en_US fragment or a collection, and at least one pzn tag must be selected before it can be created. For cards, creating a grouped variation first resolves the fragment's OSI to its offer data; collections use a dedicated product arrangement code instead. Grouped variations are stored under a personalization (pzn) folder in the fragment path and appear in the fragment editor's variations panel next to locale variations and promo variations.

## Which variation operations can the AI assistant perform?

Read-only operations: get_variations returns the variation graph for a fragment; get_card_with_variations returns a card plus its full variation tree; list_variation_locales lists the locales for which a card has variations; get_variation_parent returns the parent fragment of a variation; and find_untranslated_cards finds cards missing a variation in a target locale, optionally filtered by surface. State-changing operations, which always require confirmation: create_locale_variation creates a new locale variation given the parent card's UUID and a target locale, with an optional title; create_grouped_variation creates a grouped (pzn) variation under a parent, with optional title and tags.
