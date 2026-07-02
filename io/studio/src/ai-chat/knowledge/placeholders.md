---
topic: placeholders
keywords: placeholder, dictionary, key, value, rich text, locale string, translation string, token, substitution
---
# Placeholders in MAS Studio

## What are placeholders in MAS Studio?

Placeholders are reusable key/value text entries scoped to a surface and a locale. Each placeholder is stored as its own AEM content fragment (a dictionary entry) inside that surface and locale's dictionary folder, for example the dictionary folder under the surface's locale path. A placeholder fragment has a key, a plain text value, a rich text value, and a locReady flag. A special index fragment in the same dictionary folder keeps an entries list referencing every placeholder, and consumers resolve placeholders through that index. The Placeholders page in Studio shows the placeholders for the currently selected surface and locale in a searchable, sortable table with inline editing, publish, delete, and bulk delete.

## How do I create a placeholder?

Use the Create New Placeholder dialog on the Placeholders page. It asks for a Key, a Locale (a region picker that defaults to the current locale), an optional Rich Text toggle, and a Value. Key and Value are required, and the key is normalized as you type. On create, Studio creates the dictionary entry fragment under the surface and locale's dictionary path, tags it as draft, and registers it in the dictionary index fragment so it can be resolved; if updating the index fails, the creation is reported as failed. New placeholders start in draft status and must be published to go live. The AI assistant does not currently create or edit placeholders; use the Placeholders page.

## How do rich text placeholders work?

When the Rich Text toggle is enabled, the value is edited with a rich text editor that supports links and allows up to 500 characters, and the content is stored in the fragment's rich text value field instead of the plain value field. When a placeholder is resolved for a card, the plain value is used if present, otherwise the rich text value. Rich text lets a placeholder carry formatted content, such as a link inside card copy.

## How do I edit, publish, or delete a placeholder?

Rows on the Placeholders page can be edited inline: key, value, and rich text value. Saving an edit marks the placeholder as draft again, so it must be republished for the change to go live. The publish action publishes the placeholder fragment and then republishes the dictionary index fragment so consumers pick up the change; a placeholder that is already published is skipped. Delete asks for confirmation and warns the action cannot be undone; it removes the placeholder from the dictionary index first, then deletes the fragment. Bulk delete works on the current table selection.

## How are placeholders resolved on cards?

Card fields may contain tokens like {{key}}, where the key consists of letters, digits, hyphens and underscores. When the fragment pipeline serves a card, its replace step loads the dictionary for the request's surface and regional locale by fetching the dictionary index fragment and its references, builds a key-to-value map, and substitutes each token. Dictionaries can chain to a parent dictionary, and the child's entries take precedence over the parent's. A placeholder that exists with an empty value is treated as intentionally empty, which is different from a missing key.

## Why is my placeholder not showing up on a card?

Common causes verified in the implementation: the placeholder or the dictionary index was not published — publishing a placeholder must also republish the index, which Studio's publish action does automatically; the placeholder was created in a different surface or locale than the one the card is served for, since dictionaries are resolved per surface and per regional locale; the resolved dictionary is cached for about five minutes, so a just-published placeholder can take a short time to appear; or the token in the card copy does not exactly match the key — tokens only allow word characters, hyphens and underscores inside double curly braces.
