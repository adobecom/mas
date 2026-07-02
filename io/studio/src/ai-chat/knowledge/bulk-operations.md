---
topic: bulk-operations
keywords: bulk, bulk update, bulk publish, bulk unpublish, publish multiple, batch, mass update, find and replace, preview
---
# Bulk Operations in MAS Studio

## How do I update many cards at once with the AI assistant?

Search first, then ask for the change. For example: "find cards with '20+ apps'", then "change 20+ apps to 30+ apps". The assistant applies the change to the cards from your last search using the bulk_update_cards operation. A bulk update can carry common field updates applied to every card, text find-and-replace operations, or both. The assistant always generates a preview first and waits for your approval before anything is modified. Outside of chat, Studio's table view also supports bulk actions: select cards with the checkboxes and use the bulk actions menu.

## How does the preview and approval workflow for bulk operations work?

Every bulk update and bulk publish is a mandatory two-step process. First the assistant runs a read-only preview (preview_bulk_update or preview_bulk_publish) and shows you exactly which cards would be affected and what would change. Nothing is modified at this stage. Only after you approve — saying "yes", "approve", or "proceed" — does the assistant execute the real operation (bulk_update_cards or bulk_publish_cards) with the same parameters as the preview. If you say "no" or "cancel", the operation is cancelled and the cards are left untouched. Execution is additionally guarded by an explicit confirmation, such as "Apply update to N cards?" or "Publish N cards to production?", because bulk operations are state-changing.

## Where do the card IDs for a bulk operation come from?

Bulk operations act on fragment IDs from your conversation context: either the results of a previous search or operation (the last operation's fragment IDs) or the working set of cards shown after a tool result. Fragment IDs are AEM UUIDs and cannot be derived from card titles, so the assistant will never invent or guess them. If you ask for a bulk change before searching, the assistant asks you to find the cards first, for example "find cards titled X in sandbox", and then apply the change. When it does run a bulk operation, the complete ID list from the search is used — the set is never truncated or sampled, so if your search returned 26 cards, all 26 are included.

## How do find-and-replace text updates work in bulk updates?

Each text replacement specifies the text to find, the text to replace it with, and optionally a field name. If a field is given (for example title), only that field is searched and updated on each card. If the field is omitted, every field of each card is searched automatically and the text is replaced wherever it appears. Matching is against the literal string you provide. Several replacements can be combined in one bulk update, and replacements can be mixed with common field updates that set the same value on all selected cards. The preview step shows the resulting changes per card before you approve.

## How do I bulk publish or unpublish cards?

After a search, ask the assistant to "publish these cards", "publish all", or "unpublish those cards". The bulk_publish_cards operation takes the card IDs from your search context plus an action of publish or unpublish. As with updates, the assistant first shows a preview via preview_bulk_publish listing the cards that would be published or unpublished, and executes only after you approve, with a final confirmation like "Publish N cards to production?". In Studio itself you can also select cards in the table view with checkboxes and choose "Publish selected" from the bulk actions menu.

## Can I bulk delete cards?

No. Bulk deletion is not supported by the AI assistant, and it will not emit a bulk delete operation under any circumstances. If you ask to delete multiple cards, the assistant declines and directs you to MAS Studio, where fragments can be deleted individually through the UI with a confirmation dialog. Single-card deletion is likewise not performed by the assistant. This is a deliberate safety restriction, since deletion is destructive and cannot be previewed and approved the way bulk updates and publishes can.

## What is the Bulk Publishing page in Studio?

Separate from the chat-based bulk tools, Studio has a bulk publishing feature built around bulk publish projects: a saved project holds a list of fragment paths and target locales. Publishing a project dispatches an asynchronous backend worker (the request is accepted immediately and runs in the background) that resolves every path in every selected locale, takes a snapshot of the current published state, and then publishes the resolved fragments. The project ends in one of three statuses: Published, Partially published, or Failed. Fragments that do not exist in a target locale are reported as not localized rather than failing silently. Because a snapshot is taken before publishing, a bulk publish can be reverted, and Studio checks whether entries were modified after the snapshot before allowing a revert.

## How do I see the cards from my last bulk operation?

Ask the assistant "show me the cards we updated", "list the cards from our last search", or "show me those cards again". The list_context_cards operation renders the cards referenced by the previous operation, using the fragment IDs stored in the conversation context, and works after searches, updates, and publishes alike. If there is no previous operation in the conversation, the assistant tells you that no prior card set exists instead of guessing. This is useful for verifying the outcome of a bulk update or publish without running a new search.
