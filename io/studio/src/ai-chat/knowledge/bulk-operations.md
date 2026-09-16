---
topic: bulk-operations
keywords: bulk, bulk update, bulk publish, bulk unpublish, publish multiple, batch, mass update, find and replace, preview
---
# Bulk Operations in MAS Studio

## Can the AI assistant update or publish many cards at once?

No. The assistant does not run bulk updates or bulk publishes, and it has no
operation for either. Bulk work happens in Studio itself, which has a purpose
built UI for it with preview, snapshot and revert. If you ask the assistant to
change or publish a set of cards, it points you here rather than attempting it.

For a handful of cards, ask for them one at a time: a single card update or
publish is still something the assistant does, each with its own confirmation.

## How do I update many cards at once in Studio?

Use the Select button in the Fragments toolbar to multi-select cards, then apply
the change to the selection. For large batches, use a bulk publish project under
Advanced tools.

## What is the Bulk Publishing page in Studio?

Studio has a bulk publishing feature built around bulk publish projects, reached
from Advanced tools in the side navigation. A saved project holds a list of
fragment paths and target locales; its items are picked with an items selector
spanning cards, collections, and placeholders, and items already in the project
are skipped with a warning. Publishing a project dispatches an asynchronous
backend worker (the request is accepted immediately and runs in the background)
that resolves every path in every selected locale, takes a snapshot of the
current published state, and then publishes the resolved fragments. The project
ends in one of three statuses: Published, Partially published, or Failed.
Fragments that do not exist in a target locale are reported as not localized
rather than failing silently. Because a snapshot is taken before publishing, a
bulk publish can be reverted, and Studio checks whether entries were modified
after the snapshot before allowing a revert.

## Can I bulk delete cards?

No. Deletion is not performed by the assistant at all, in bulk or one at a time.
If you ask to delete cards, the assistant declines and directs you to MAS Studio,
where fragments are deleted individually through the UI with a confirmation
dialog. This is a deliberate safety restriction: deletion is destructive and
cannot be previewed and approved the way an edit can.

## How do I see the cards from my last search?

Ask the assistant "show me those cards again" or "list the cards from our last
search". It renders the cards referenced by the previous operation, using the
fragment IDs stored in the conversation context. If there is no previous
operation in the conversation, it tells you so rather than guessing. Fragment IDs
are AEM UUIDs and cannot be derived from card titles, so the assistant never
invents them.
