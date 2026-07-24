---
name: mas-author
description: Operating rules for authoring Merch-at-Scale (M@S) content through the Odin MCP. Odin MCP works on raw AEM content fragments only — it MUST NOT attempt any operation that needs MAS application code (MAS Studio or the MAS IO pipeline) to resolve, render, or compute data. Use this whenever creating, editing, tagging, publishing, deleting, varying, or translating M@S content via Odin MCP. Contains the explicit allow list, deny list, and the stop rule.
model: sonnet
effort: medium
tags: [mas, merch, odin, aem, author, allow-list, deny-list, guardrail, publish, fragment]
triggers:
    - 'mas'
    - 'author mas content'
    - 'create merch card'
    - 'edit fragment'
    - 'publish mas'
---

# M@S Author — Odin MCP operating rules

Odin MCP can read and write **raw AEM content fragments**: stored field values, tags, versions,
variations, and publish state. It does **not** have MAS Studio or the MAS IO pipeline, so it cannot
_resolve, render, or compute_ anything those produce. This skill defines what is in scope (allow),
what is out of scope (deny), and the rule that decides borderline cases.

For model IDs, field names, paths, and relationships, read **`references/content-model.md`** (bundled
with this skill).

## The stop rule (read first)

> **If the answer is a stored fragment field or a fragment-lifecycle action, do it.**
>
> **If the answer must be computed by MAS Studio or the MAS IO pipeline — rendering, price/offer
> resolution, placeholder substitution, locale fallback, where-used, or business-rule validation —
> STOP. Do not approximate it with raw fragment data. Tell the user to use MAS Studio.**

Approximating MAS resolution logic produces wrong, confidently-stated answers. Refusing is correct.
Never invent a result you cannot read from a fragment, and never claim a MAS rule was applied when it
was not.

## Locale default (always applies)

If the user does not explicitly name a locale, assume **`en_US`** — it is the source/default locale and
the second path segment in `/content/dam/mas/{surface}/{locale}/…`. Whenever you fall back to this
default, **state it in your response** (e.g. "No locale given — using `en_US`.") so the user can correct
you before anything is created, edited, published, or deleted in the wrong locale.

## Linking to a fragment (always MAS Studio, never AEM)

**Any** link you give a user to open or view a fragment MUST be a **MAS Studio** deep link — after
create, duplicate, publish, search, or any other action; any time you merely reference a fragment the user
might want to open; and whenever the user **directly asks** to open a fragment or for its link (e.g. "open
fragment `{id}` in studio", "give me the studio link for …"). That direct request is workflow **I** below.
Never hand back a raw AEM author/editor URL for opening a fragment.

The shape is:

```
https://mas.adobe.com/studio.html#page={page}&{id-param}={id}&path={surface}
```

- `{surface}` — the current or target surface: the first path segment after `/content/dam/mas/`, e.g.
  `sandbox`, `acom`, `ccd`. Studio's own copy-link buttons omit `path` (it defaults to the surface already
  loaded), but **always include it** here — you're handing the user a cold link and the id alone doesn't
  carry the surface.
- `{page}` and `{id-param}` depend on the kind of fragment:

| Fragment kind       | `page`               | id param               | id value                                                                                                                                 |
| ------------------- | -------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Card / collection   | `fragment-editor`    | `fragmentId`           | the fragment id                                                                                                                          |
| Promotion           | `promotions-editor`  | `promotionId`          | the promotion fragment id                                                                                                                |
| Translation project | `translation-editor` | `translationProjectId` | the project fragment id                                                                                                                  |
| Mask                | `masks-editor`       | `maskName`             | the mask **name**, not an id                                                                                                             |
| Placeholder         | `placeholders`       | _(none)_               | opens the placeholders list for the `path` surface + locale; the user finds the key there — placeholders have no per-fragment editor URL |

Example (card/collection): `…/studio.html#page=fragment-editor&fragmentId={id}&path=sandbox`

Odin MCP returns AEM ids, names, and paths — treat those as the inputs for building this link, not as the
link to hand back. (Other Studio pages exist — `settings-editor`, `bulkPublishEditor`, etc. — but they are
not fragment-open links for the authoring flows in this skill.)

## Self-references ("my fragments", "what I changed")

When the user refers to themselves — "my fragments", "cards I created", "what did I publish/modify" —
resolve "me / my / mine" to the **current signed-in user**. Odin MCP already knows who that is from the
session; **do not ask for a user id.** Filter `search-aem-content-fragments` by the matching author field:
`createdBy` for created, `modifiedBy` for edited/changed, `publishedBy` for published.

## ✅ Allow list — operations Odin MCP may perform

These act on raw fragments and need no MAS code. (Tool names shown without the server prefix; in a real
harness they appear as `mcp__odin-prod__<tool>`.)

| Category                                                                                                     | Allowed operations                                                                                                                                                                                                                                                                                                                                                           | Odin MCP tools                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discover / read**                                                                                          | Search & read fragments by model id, path, surface, locale, tags, status; read raw field values; list/read versions; resolve a path; search tags/folders; read publish queue & ACLs. (To read a fragment's variations, read its `variations` field and `get-aem-fragment` each referenced fragment — see the note below on why the native `*-variation` tools don't apply.)  | `search-aem-content-fragments`, `get-aem-fragment`, `resolve-aem-fragment-path`, `list-aem-fragment-versions`, `get-aem-fragment-version`, `search-aem-tags`, `search-aem-folders`, `check-aem-folder-exists`, `get-aem-publish-queue`, `get-aem-acls-for-path` |
| **Author / write**                                                                                           | Create a fragment with the correct model id + raw field values; patch stored fields; copy a fragment; create a folder; create/update a content model; import an asset (image) referenced by a card field                                                                                                                                                                     | `create-aem-fragment`, `patch-aem-fragment`, `copy-aem-fragment`, `create-aem-folder`, `create-aem-content-model`, `update-aem-content-model`, `import-aem-asset`                                                                                               |
| **Locale / PZN variations**                                                                                  | In MAS a variation is a **separate fragment** at the target locale/PZN path, linked from the parent's `variations` reference field — **not** an AEM-native content-fragment variation. Create it with `create-aem-fragment`, edit its fields with `patch-aem-fragment`, and link (or unlink) it by patching the **parent's** `variations` field. Deleting one is workflow C. | `create-aem-fragment`, `patch-aem-fragment` (on the variation and on the parent)                                                                                                                                                                                |
| **Tags**                                                                                                     | Read / add / replace / delete tags on a fragment or a content model. A variation is itself a fragment, so its tags are **fragment** tags — use the fragment-tag tools on it.                                                                                                                                                                                                 | `get-aem-fragment-tags`, `add-aem-fragment-tags`, `replace-aem-fragment-tags`, `delete-aem-fragment-tags`, `get-aem-model-tags`, `add-aem-model-tags`, `replace-aem-model-tags`, `delete-aem-model-tags`                                                        |
| **Lifecycle**                                                                                                | Publish / unpublish fragments; create / restore a version; soft-purge CDN cache. `publish-aem-fragments` and `unpublish-aem-fragments` natively take **multiple** ids/paths — a single multi-fragment publish is a normal one-shot call                                                                                                                                      | `publish-aem-fragments`, `unpublish-aem-fragments`, `create-aem-fragment-version`, `restore-aem-fragment-version`, `softpurge-aem-paths`                                                                                                                        |
| **Batch publish**                                                                                            | Publishing many fragments at once via the native multi-id/path array on `publish-aem-fragments`. This is the **only** allowed bulk write — batch **patch** and batch **delete** are denied (see deny list)                                                                                                                                                                   | `publish-aem-fragments`                                                                                                                                                                                                                                         |
| **Destructive** _(confirm first — see workflow C; may be role-gated; one fragment at a time, not via batch)_ | Delete a fragment (a variation is just a fragment, deleted the same way). **Deleting a published one, or deleting more than one, requires an explicit list-and-confirm first.** Folder and content-model deletion are **denied** — see deny list                                                                                                                             | `delete-aem-fragment`                                                                                                                                                                                                                                           |
| **Multi-fragment patterns**                                                                                  | Cascades expressed purely as sequences of the above — e.g. publish a placeholder **and** its index together; append a path to an index's `entries` then publish; publish a variation together with its `en_US` parent                                                                                                                                                        | (compositions of the tools above)                                                                                                                                                                                                                               |

## ⛔ Deny list — STOP and send the user to MAS Studio

Each of these needs MAS code to resolve data. Do **not** attempt it with raw fragments.

| Request                                                                                                                                                                                                                                                                                               | Why Odin MCP can't                                                                                                                                                                                       | Where it belongs                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| "Show the card as it will appear" / render / preview the variant layout                                                                                                                                                                                                                               | Card rendering & variant layout live in MAS web components                                                                                                                                               | MAS Studio preview / consumer page                                                            |
| Resolve placeholders (`{{key}}` → value) or compute placeholder locale fallback                                                                                                                                                                                                                       | Placeholder substitution is the MAS IO pipeline                                                                                                                                                          | MAS IO / Studio                                                                               |
| Resolve or display a price / offer (OSI/OST/commerce value)                                                                                                                                                                                                                                           | Price resolution is MAS + commerce code                                                                                                                                                                  | MAS Studio / OST                                                                              |
| Compute which locale would actually serve (locale fallback chain)                                                                                                                                                                                                                                     | Fallback logic is the MAS IO pipeline                                                                                                                                                                    | MAS IO                                                                                        |
| "Where is this fragment used" / referenced-by / impact — when raw AEM references don't answer it                                                                                                                                                                                                      | MAS computes this in Studio; Odin search has no referenced-by                                                                                                                                            | MAS Studio                                                                                    |
| Validate against MAS business rules (required fields per variant, one-variation-per-locale, mask resolution, default-card logic beyond the raw `defaultchild` field)                                                                                                                                  | These rules live in MAS Studio; there is no raw-fragment equivalent you can reproduce                                                                                                                    | MAS Studio                                                                                    |
| Run the MAS bulk-publish **project** workflow: publish/revert a project, or "check for modifications" against a saved selection                                                                                                                                                                       | That pipeline runs in MAS IO, driven by a `bulk-publish-project` fragment — not a sequence of plain fragment ops                                                                                         | MAS Studio bulk feature                                                                       |
| "Send to Localization" / start a translation job                                                                                                                                                                                                                                                      | Kicks off an external translation pipeline through MAS — it is not a fragment write                                                                                                                      | MAS Studio translation feature                                                                |
| Produce translated field **values** (actual translation of text)                                                                                                                                                                                                                                      | Translation is a MAS/translation-pipeline concern                                                                                                                                                        | MAS translation feature                                                                       |
| **Delete a folder** (`delete-aem-folder`)                                                                                                                                                                                                                                                             | Too broad and irreversible — recursively removes every fragment beneath it; not an authoring action                                                                                                      | An AEM admin, out of band                                                                     |
| **Delete a content model** (`delete-aem-content-model`)                                                                                                                                                                                                                                               | Affects every fragment of that type across all surfaces/locales; not an authoring action                                                                                                                 | An AEM admin, out of band                                                                     |
| Create / edit / delete an AEM-native content-fragment **variation** (`create-aem-fragment-variation`, `patch-aem-fragment-variation`, `delete-aem-fragment-variation`, `get-aem-fragment-variation`, `list-aem-fragment-variations`, and the `get`/`add`/`replace`/`delete-aem-variation-tags` tools) | MAS does **not** use native CF variations — a MAS "variation" is a separate fragment linked from the parent's `variations` field. Native variations create content MAS Studio and the pipeline can't see | Use the locale/PZN variation flow (workflow E): a separate fragment via `create-aem-fragment` |
| **Batch patch** — mass-edit fields across many fragments via `aem_create_batch`                                                                                                                                                                                                                       | Bypasses per-fragment review and the ordered reference/index cleanup the workflows require; a single bad patch silently hits every fragment in the batch                                                 | Patch fragments one at a time, per the relevant workflow                                      |
| **Batch delete** — mass-delete via `aem_create_batch`                                                                                                                                                                                                                                                 | Bypasses the per-fragment confirm gates, published-content check, and kind-specific reference cleanup in workflow C                                                                                      | Delete one fragment/variation at a time, per workflow C                                       |

> Creating an empty locale variation fragment is **allowed** (it's a raw op). Filling it with _translated
> values_ is **denied** — don't fabricate translations.

## Guardrail workflows — step by step

Odin MCP performs none of these cascades on its own — each is a sequence of allow-list operations.
Run the matching workflow whenever its action is requested. Model ids, field names, and the
locale path segment are in `references/content-model.md`. When a step below touches **2 or more**
fragments: **publishing** many is one native call (`publish-aem-fragments` with an array of ids/paths);
**patching or deleting** many is **not** batched — do each as its own reviewed call so the confirm gates
and reference/index cleanup can't be skipped. Never use `aem_create_batch` for patch or delete.
(`aem_create_batch` is the real Odin tool name — underscored, unlike the hyphenated `*-aem-*` tools; not a typo.)

### A. Publish safely

1. **Read** the fragment; from its model/path/`variant` decide what kind it is.
2. **Offer a version first** — `create-aem-fragment-version` (Odin MCP does not auto-version). Skip only
   if the user declines.
3. **Cascade by kind.** Only the placeholder→index cascade is something MAS Studio itself always does; the
   variation and collection cascades below are this skill's recommendation, not something MAS enforces —
   say so if asked.
    - **Placeholder (dictionary entry) — always cascade.** The index is **not** found by search — it lives
      at a fixed path: the placeholder's own parent dictionary folder, in a fragment named `index`. Publish
      the placeholder, `get-aem-fragment` at `{parentPath}/index`, publish that too. If no index exists at
      that path, stop and tell the user — an unindexed placeholder can't resolve, and this workflow does not
      create one implicitly.
    - **Locale variation — recommendation, not enforced.** Publishing a variation on its own leaves the
      parent untouched; if the `en_US` parent is still a draft, a translation can go live while the parent
      stays unpublished. Recommend also publishing the `en_US` parent (the fragment that lists this one in
      `variations`) and let the user decide; don't claim MAS requires it.
    - **Collection — recommendation, not enforced.** Publishing a collection on its own does not publish its
      members. Member-aware publishing is a separate, deliberate feature — the **bulk-publish project**
      workflow (deny list). For a single collection here, read members from `cards` (and nested
      `collections`), list any unpublished ones, and offer to include them — but tell the user this is a
      courtesy check, not something MAS does automatically.
    - **Plain card:** publish it. Ask before `includeReferences=true`.
4. **Report** exactly what published and what did **not** (e.g. an index you couldn't resolve). Never
   claim the index/parent/members were published if they weren't, and never imply MAS auto-cascades
   variation or collection publishing when it doesn't.

### B. Create a placeholder

1. **Verify** the target dictionary folder exists (`check-aem-folder-exists`).
2. **Create** the entry fragment with the dictionary-entry model id and fields `key`, `value`,
   `richTextValue`, `locReady` (`create-aem-fragment`).
3. **Index it:** read the dictionary **index** fragment, append the new entry's path to `entries`,
   `patch-aem-fragment`. If no index exists, create it first and tell the user. An unindexed placeholder
   does not resolve.
4. Publishing is workflow **A**.

### C. Delete safely

1. **Read** the fragment.
2. **Find usages from raw references only:** the dictionary index `entries`, any collection `cards` /
   `collections`, a parent's `variations`, a promotion's `fragments`, and/or
   `aem-fragment-operation-with-references`.
3. **If usages can't be fully determined from raw data → STOP** (deny rule): tell the user to confirm
   where-used in MAS Studio before deleting. Do not guess.
4. **Confirm — deletes are permanent. Two mandatory gates, both may apply:**
    - **Published fragment.** Read status first. If the fragment (or any variation that will be deleted
      with it, per the parent cascade below) is **published**, name it as published and get explicit
      confirmation before deleting — deleting a published fragment takes live content down.
    - **More than one fragment.** If the delete removes 2+ fragments (an explicit multi-select, or a
      parent whose variation cascade pulls in others), **list every fragment that will be deleted — path
      and published/draft status each — and get one explicit confirmation covering the whole list.** Never
      delete a set the user hasn't seen enumerated.
    - Folder and content-model deletion are on the deny list — never offer them here.
5. **Clean references BEFORE deleting, in this order** — the order matters and is kind-specific (it mirrors
   how MAS Studio deletes each kind):
    - **Placeholder:** `patch-aem-fragment` the index to drop the entry from `entries` and publish the
      updated index, **then** delete the placeholder. Never delete an indexed placeholder while it's still
      listed.
    - **Locale-default (parent, non-variation) fragment:** deleting it is **not** a single-fragment
      operation. It clears the parent's `variations` field, then deletes **every** locale variation it
      listed, then deletes the parent itself — the whole set goes, under one confirmation. Tell the user up
      front how many variations will be deleted with it; do it in that order: clear `variations` on the
      parent → delete each variation → delete the parent.
    - **Locale variation (not the parent):** the parent is left alone. Remove the variation's path from the
      parent's `variations` field first, **then** delete the variation fragment. Do not touch the parent's
      other fields.
    - **Collection member / promotion reference:** remove the path from the collection's `cards`/
      `collections` or the promotion's `fragments`, `patch-aem-fragment`, offer to publish that update. The
      only rule here: don't leave a dangling reference.
6. **Delete** with `delete-aem-fragment` (a variation is a fragment — same tool), following the per-kind
   order above. Report what was cleaned, what was deleted, and what may remain.

### D. Edit variation tags (en_US guard)

A variation is a fragment, so its tags are fragment tags — use the fragment-tag tools on the variation.

1. **Resolve** the variation's path (`resolve-aem-fragment-path`); read the locale (second path segment).
2. **Locale is `en_US`** → proceed with the tag op (`add-aem-fragment-tags`, `replace-aem-fragment-tags`,
   or `delete-aem-fragment-tags`).
3. **Otherwise → REFUSE.** Explain tags belong on the `en_US` default and are inherited; offer to apply
   the edit on the `en_US` variation instead. Reads are always fine.

### E. Create a locale variation (same-language only)

Users must **not** be able to create arbitrary locale variations. A locale variation stays in the
parent's **own language** and only changes the country/region — cross-language content is a Translation,
not a locale variation.

1. **Identify the parent and its language.** The parent is the **same-language default locale** (e.g. the
   parent of `de_CH` is `de_DE`; for English it's `en_US`) — _not_ `en_US` for every language.
2. **Validate the target against the allowed list.** Look up the surface + parent language in the
   "Language ↔ locale mapping" tables (`references/content-model.md` §9). The target locale MUST be one of
   that parent's listed **regional variation locales**.
    - Target is a **different language** → this is a **Translation** (deny list) → direct the user to MAS
      translation; do not create it here.
    - The language shows **"— (default only)"**, or the target isn't in its regional list → **STOP.** No
      locale variation is allowed there; do not invent one.
3. **Check none exists** for that locale: read the parent's `variations` field; if a referenced fragment
   already sits at the target locale path → **STOP** (one *locale* variation per locale — never
   auto-rename; this bounds locale variations only, not geo-scoped promo variants, which can share a
   locale — §5).
4. Otherwise **create the variation as a new fragment** at `/content/dam/mas/{surface}/{targetLocale}/…`
   (`create-aem-fragment`) and link it by adding its path to the parent's `variations` field
   (`patch-aem-fragment` on the parent).
5. **Do not fill translated values** — that's on the deny list. Create the shell; leave translation to MAS.

> **Grouped / PZN variations are a different flow.** They are always authored in **`en_US`** (under a
> `pzn/` folder), and their targeting input is a set of locale **tags** (§5), not a locale path. Never
> create a PZN variation at a regional locale path, and never treat a regional-locale request as a PZN
> variation.

### F. Duplicate a card or collection

Duplicating is `copy-aem-fragment` plus, only if needed, one `patch-aem-fragment` — never a
field-by-field rebuild.

1. **Copy** the fragment (`copy-aem-fragment`).
2. **Card only — OSI is required.** A card with no `osi` value can't be duplicated unless it carries an
   `offerless` tag. Ask for a target OSI (or confirm the offerless tag) before copying if the source
   doesn't already have one you can reuse.
3. **If the title, OSI, or tags should differ from the source**, `patch-aem-fragment` those fields on the
   copy (OSI is patched by value, not by search) and update tags via the tag tools. Otherwise the copy is
   done after step 1 — do not touch any other field.
4. Publishing the copy is workflow **A**; it starts a fresh fragment, so it is never itself a variation.

### G. Create a plain card or collection

1. **Model id** is deterministic — use the Merch Card / Collection row in `references/content-model.md`
   §2, never search for it.
2. **Create** with `create-aem-fragment`. Card: `osi` is required unless you're also adding an `offerless`
   tag. Collection: needs at least a `label` field.
3. **On a name/path collision (409):** retry with a random suffix appended to the fragment **name** (a few
   attempts) — safe for a **brand-new** card or collection. **Never** apply this retry-with-suffix pattern
   to a _locale variation_ — that case is workflow **E**, and one-variation-per-locale means a collision
   there must STOP, not retry.
4. **No content-type tag needed.** `mas:studio/content-type/merch-card` and `…/merch-card-collection` are
   not real tags ever written to a fragment — a fragment's kind is determined by its model id alone. Don't
   invent a tag-write step here.

### H. Unpublish safely

Unpublish always acts on live content, so the same confirmation gates as delete (workflow C step 4)
apply — an unpublish is never silent.

1. **Read status.** Only published fragments can be unpublished; if it isn't published, say so and stop.
2. **Confirm before unpublishing** — this takes content off live pages. Name the fragment and get
   explicit confirmation.
3. **More than one → list and confirm.** For a multi-select, list every fragment (path + status) and get
   one confirmation covering the whole list. Never unpublish a set the user hasn't seen enumerated.
4. **Warn on referenced content.** `unpublish-aem-fragments` takes fragment UUIDs, not paths, and can
   break live pages that still reference the content. Surface any references you can see from raw fields
   before proceeding.

### I. Open a fragment in Studio (produce its link)

This is the response to **"open fragment `{id}` in studio"**, "give me the studio link for …", "link to
this fragment", and the like. The deliverable is a **MAS Studio deep link** — building it _is_ the whole
task; do not treat it as impossible or hand back an AEM URL.

1. **Get what the link needs.** To fill the link you need the fragment's **kind** (→ `page` + id param)
   and its **surface** (→ `path`). If you were given only an id or path, `get-aem-fragment` first and read
   its **model** and **path** (surface = the first segment after `/content/dam/mas/`). Kind comes from the
   model id (card/collection → `fragment-editor`, promotion → `promotions-editor`, translation-project →
   `translation-editor`, dictionary-entry → the `placeholders` page), **except** a card-model fragment
   whose path is under a `masks/` folder → that's a **mask** (`masks-editor`, keyed by `maskName`). If you
   already know the kind and surface (e.g. you just created it), skip the read.
2. **Build the link** using the "Linking to a fragment" table above — match the kind to the right `page`
   and id param.
3. **Return the link.** If the id doesn't resolve to a fragment, say so; don't guess a link.

## Quick decision test

Ask: _"Can I answer this by reading or writing a stored fragment field, or by a publish/version/tag
action?"_

- **Yes** → it's on the allow list; do it (applying the authoring rules above).
- **No — it needs something rendered, priced, substituted, fallen-back, where-used, or validated by MAS**
  → it's on the deny list; **stop and direct the user to MAS Studio.**
