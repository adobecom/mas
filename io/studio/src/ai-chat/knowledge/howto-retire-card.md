---
topic: howto-retire-card
keywords: authoring, retiring a card
---
<!-- ported from the MASA knowledge corpus -->
# Retiring a card

## What do I use to take a card down?

Studio's quick actions include Save, Duplicate, Publish, Unpublish, Cancel, Copy, Lock, Discard, Delete, Loc, Validate, Link, Revert and Check modifications. Unpublish is the action meant to take a card off the live site and Delete removes it entirely, but see below: Studio does not currently let authors unpublish a card; Discard is an editor-level action, not a lifecycle one, and Revert belongs to bulk publish projects, not to single cards.

## What does Unpublish do?

Unpublish removes the fragment from the published tier; the authored draft stays in the authoring tier and can be published again later. On consumers, the published fragment no longer resolves, the IO fetch fails, and the card element fails and hides itself (outside preview the element sets `display: none`), so the slot simply goes empty. Unpublish a card that other fragments reference and those references start failing too — check the referencing cards and collections first.

Studio does not currently offer Unpublish for cards. The card editor side nav shows an Unpublish item but it is hard-coded disabled, the editor panel toolbar's Unpublish button is disabled the same way, and the content table's selection bar is not given an unpublish handler, so its Unpublish button stays disabled. An author who needs a card off the live site today cannot do it from Studio and should raise it with the MAS team. (Settings, promotions and offer mappings do have a working Unpublish.)

## What does Delete do?

Delete removes the fragment (and, when used with variations, its variations) from Odin. It is the irreversible option; force delete removes it by path. Use it only after Unpublish has confirmed the card is safely off, or when the card was never meaningful to keep.

## What are Discard and Revert?

Discard throws away unsaved edits and puts the card back to its last saved state; nothing is sent to Odin. In the card editor it comes up as a confirmation ("Are you sure you want to discard changes?") when the author leaves or duplicates a card with unsaved edits; the collection editor also has a Discard button in its toolbar. There is no Revert for a single card: the Revert quick action only appears in a bulk publish project, where it rolls every item in the project back to the snapshot taken before publishing. To take one card back to an earlier saved version, open History in the card editor and restore that version, which saves it as the card's current content. Neither Discard nor a restore changes what is live: a restored version on a published card is a saved edit, so it only goes live when the card is published again.

## What stays behind after a card is gone

The card's OSI does not disappear with it: commerce offers keep existing, so checkout URLs built from the old OSI can still work. Collections that listed the card show one fewer entry once the reference fails or is removed. Any page hardcoding the fragment id (for example a hand-authored `aem-fragment` on a non-Milo page) will show nothing. Before retiring, remove the card from collections and note down the fragment id and OSI for the audit trail.
