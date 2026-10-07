---
topic: variations
keywords: platform, authoring, creating and managing variations, collection, merch card collection, variation, locale variation, grouped variation, pzn, personalization, locale default, parent fragment, translation
---
<!-- ported from the MASA knowledge corpus -->
# Creating and managing variations

## What is a variation, from an authoring point of view

A variation is a copy of a card or collection that an author creates from its default locale fragment to serve one region or one personalization group differently. This page covers the Studio side of making and editing a variation. How IO decides which variation a live page actually gets, based on the requested locale and country, is a separate topic, see the locale and variation fallback page.

## The two kinds of variation you can create

Studio's "Set a variation type" dialog offers two choices. A regional variation targets one locale, and the picker only lists locales that are valid regions of the source fragment's own locale, for example a card authored in fr_FR can only get regional variations for fr_FR's own region list. A grouped variation is targeted by a set of locale or personalization tags instead of a single locale, and it can only be created from an en_US source fragment, or from any collection regardless of locale.

## Why you can only make one variation per locale

The locale picker disables any locale that already has a variation, so an author cannot start creating a second one. The creation step in Studio double checks this on save: if a variation already exists at the target path, Studio does not error out, it quietly reuses the existing variation and repairs the parent's list of variations if it was out of sync. Trying to create a variation from another variation is also blocked outright, an author has to start from the default locale fragment.

## What a variation field shows as inherited, overridden, or the same as parent

Every field on a variation has one of these states relative to its parent: inherited means the field has no value of its own and is showing the parent's value, same as parent means the author entered a value but it happens to match the parent exactly, and overridden means the value genuinely differs. Studio shows an "Overridden, click to restore" link for the second and third states, and a "Click to override" link for the first, so an author can always tell, and reset, what a field is actually doing. When a variation is saved, any field that is inherited or exactly matches its parent is cleared back to empty rather than stored as a duplicate value, which keeps the variation holding only its real differences.

## Common questions

Why can't I pick a locale in the variation dialog: it is either already taken by an existing variation, or it is not a valid region of the source fragment's own locale. Why did my new variation dialog silently open an existing fragment instead of creating one: a variation for that locale already existed, Studio found it and reused it instead of failing. Why does a field look empty on a variation but still shows a value on the live page: it is inherited from the parent, not missing.
