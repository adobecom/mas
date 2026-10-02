---
topic: studio-pages
keywords: fragment editor, advanced tools, masks, mask, global settings, locale picker, region picker, rollout, roll out, rollout project, preview, preview on page, render view, table view, permission, gated, access, side rail, breadcrumb
---
# Studio pages and editors

## What does the fragment editor do?

The fragment editor is the full-page editor for one card, collection or compare chart, with a live preview of the card beside the form. It opens from the Fragments list and shows the fields for the card's template, a side rail, and an action toolbar. From it you can save, publish, duplicate, delete, and set a variation type, and its dialogs include Confirm Deletion (which warns when the card has locale variations), Confirm Discard, and Confirm Cloning, which asks for a new title, an OSI search and tags. The side rail includes the Copy Field button, which produces a link for using a single field of the card on a page. Breadcrumbs show where you are, for example Fragments then Editor.

## What is the Advanced tools page?

Advanced tools is a hub page whose cards link to Bulk publish, Global settings and Masks. It is the entry point for the operations that are not part of everyday card authoring. The Global settings and Masks cards are permission gated, so which cards you see depends on your access for the current surface.

## What are masks in MAS Studio?

A mask is a reusable card overlay applied at delivery time, rather than something baked into each card. The Masks list has a region picker and a Create mask action, with columns for Name, Description, Last updated by, Last published by and Status, and a row menu offering Edit, Publish and Delete. The mask editor has a Title, Name, Description, a template picker and a Placeholders multifield where you add variables. Masks are reached from Advanced tools.

## Who can see Masks and Global settings?

Both are gated behind the same permission check. Access requires membership of the MAS admins group or of the current surface's power-user group, so access is per surface: a user may see settings on one surface and not another. The commerce, sandbox and nala surfaces are admin only. If you are not permitted, the Masks page says you do not have access to masks for this surface, and navigating directly to the settings page redirects you to Home rather than showing an error.

## What is the locale picker for?

The locale picker, also called the region picker, selects which locale you are working in. Studio scopes what you see to the currently selected surface and locale, so the Fragments list, the Placeholders page and the Masks list all follow it. It also appears inside dialogs, notably when setting a variation type, where a regional locale picker chooses the target locale for a new locale variation. It is enabled in more editor states than it once was, including on grouped variations, and language switching also works for promo variations.

## How do I roll out a card to other locales (rollout project)?

To roll out a card to other locales without translating it, use a rollout project. A rollout project is a translation project whose type is set to Rollout instead of Translation. Rather than sending content out for translation, it copies the selected content into the target locales as-is. Use it when you need locale copies of a card without changing the text, for example when the content is language neutral or will be edited by hand per locale. You choose Translation or Rollout with the Project Type control when creating the project in the translation project editor, and both kinds go through the same submission pipeline and show the same statuses on the Translations page.

## What is the difference between Render view and Table view?

The Fragments list can show content either as rendered cards or as a table. The toolbar carries the Filter button with a count badge, a Search box, a Create menu offering Merch Card, Merch Card Collection and Compare chart, a Select action for multi-select mode, and the Render view / Table view switch. Render view is for recognising cards visually; Table view is for scanning many rows and for multi-select work.

## How do I preview a card on a real page?

Use the Preview action, available from the fragment editor's action bar and from a row in the Fragments table. It opens the card on a Milo preview page in a new tab, passing the fragment id, whether it is a card or a collection, and the locale taken from the fragment's path. Which host it opens depends on the card's status: a published card previews on the production Milo host, and an unpublished one previews on the Milo branch host so you can see draft content. This is different from the live preview beside the form in the fragment editor, which shows the card on its own rather than on a page.
