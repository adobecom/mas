---
topic: howto-bulk-publish
keywords: authoring, bulk publishing across locales
---
<!-- ported from the MASA knowledge corpus -->
# Bulk publishing across locales

## Does MAS have a bulk publisher for several locales?

Yes. Open https://mas.adobe.com/studio.html#page=bulkPublish&path=<surface> to reach the bulk publish tool, which publishes a card across locales. The `path` parameter must match the surface, for example `path=express` for Express. The page is also linked from Advanced tools.

## What is a bulk publish project?

A bulk publish project holds a list of fragment paths and target locales, and is reached from Advanced tools. Publishing a project runs as an asynchronous backend job and ends in a status such as Published, Partially published or Failed. The current statuses also include Draft, Publishing, Locked, Reverting and Reverted, because a bulk publish can be reverted from its snapshot. A card must exist in a locale before it can be bulk-published there.

## How do I set up a bulk publish project?

On the bulk publish page, use Create project, give the project a title, then fill its item list. Items are added either by pasting Studio fragment links into the list or with Add by search, and the list validates each entry and flags the invalid ones. Then open the locales section, choose the target locales, and save.

Publish from the project's action bar, which also offers save, duplicate, copy, revert, lock and delete. The confirmation dialog states how many items will be published and how many are skipped, and the project then shows a banner with who published it and when. A project that ended as Published or Partially published can also be reverted from the row menu on the project list, where duplicating and deleting a project live too.
