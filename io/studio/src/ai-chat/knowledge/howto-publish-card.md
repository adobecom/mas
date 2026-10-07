---
topic: howto-publish-card
keywords: authoring, publishing a card
---
<!-- ported from the MASA knowledge corpus -->
# Publishing a card

## How do I publish a card?

Open the card in the editor, clear any validation errors, then use the Publish action and confirm if asked. The status changes from Draft, or from Modified, to Published, and the fragment becomes available to consuming pages through the delivery API. Publishing one card does not publish its references on its own. If the card has variations, or is a collection with cards or sub-collections, a Publish fragment dialog lists them with checkboxes, all unchecked, and only the ones the author checks (or Select all) are published with it. If any of them, or the card itself, is marked staged, Studio asks for a second confirmation. Publishing several cards selected together in the content table is different: it also publishes their referenced fragments that are still Draft or Unpublished. To publish many cards at once, use a bulk publish project under Advanced tools.

## What happens when I edit a card that is already published?

Studio shows five statuses, which it reads from AEM: Published, Draft, New, Modified and Unpublished. Editing and saving a card that was already published changes its status to Modified, which means it has unpublished changes. Publish it again for the live version to pick up the edits. The status column in the content table shows where each card stands, and the status filter offers all five.
