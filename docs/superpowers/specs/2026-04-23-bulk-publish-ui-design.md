# Bulk Publish UI — Design

**Ticket:** MWPW-188626
**Branch:** MWPW-188626
**PRD:** https://wiki.corp.adobe.com/spaces/adobedotcom/pages/3848027584/M+S+Studio+%E2%80%94+Bulk+Publishing+PRD
**Figma:** https://www.figma.com/design/GDDRLo3S7fz0SMRefpJOpx/M-Studio?node-id=19702-80599
**Backend (merged from PR #758):** `io/studio/src/bulk-publish/`

## Context

Authors in M@S currently publish cards one at a time. For launch-critical ROW workflows (e.g., Plans), that doesn't scale. The merged backend (PR #758, MWPW-192311) exposes a synchronous IO Runtime action that publishes a batch of fragment paths across locales. This design covers the **UI** that authors use to build a batch, validate it, and trigger a bulk publish — the matching work for MWPW-188626.

**Intended outcome:** authors can create a named "bulk publish project" from a list of M@S Studio deep-link URLs, validate that each URL resolves to a fragment, publish all valid fragments in one action, and review a per-URL result report. Projects persist as content fragments in AEM so history and audit are free byproducts of AEM's fragment versioning.

## Scope

**In scope (MVP):** 5 screens per Figma — Overview list, Create/Edit editor (empty + post-validation + post-publish), Publish confirmation modal, Published state with green banner.

**Out of scope:** scheduling UI (no date/time fields, no Schedule button, no `Scheduled` status pill), `In review` status, bulk edit, bulk restore/versioning UI (Phase 3), any changes to `io/studio/src/bulk-publish/`, any changes to `io/www/`.

## Architecture

### New folder `studio/src/bulk-publish/`

| File | Role |
|---|---|
| `mas-bulk-publish.js` | Screen 1 — overview `sp-table` of projects; `+ Create project` CTA; row Edit/Delete actions. |
| `mas-bulk-publish-editor.js` | Screens 2 + 3 + 5 — single editor component that re-renders based on `Store.bulkPublish.inEdit.status`. Mounts `mas-quick-actions` as its sole action bar. |
| `mas-bulk-publish-items.js` | "Items ({n})" card. Empty state: URL textarea + `+ Add by search`. Post-validate state: URL list + inline `404 error found ({n})` warning. |
| `mas-bulk-publish-locales.js` | "Locales ({n})" card. Empty dropzone ↔ region summary. Edit pencil re-opens locale picker. |
| `mas-bulk-publish-confirm-dialog.js` | Screen 4 — Alert dialog. Title "Publish project", 3-line body (Project, Scheduled=Now, Items=N), Cancel + Publish. |
| `mas-bulk-publish-success-banner.js` | Screen 5 banner. Rendered above General info when `status === 'Published'`. |
| `bulk-publish-store.js` | ReactiveStore subtree `Store.bulkPublish`. |
| `bulk-publish-client.js` | `publishBulk({paths, locales, token})` — `fetch` wrapper around the IO Runtime action. |
| `url-to-path.js` | Parse M@S Studio URL hash → fragmentId; resolve path via injected repository. |
| `csv.js` | `toCsv(details)` — pure function, client-side CSV generation. |

### Existing-file changes (minimal)

- `studio/src/constants.js` — add `PAGE_NAMES.BULK_PUBLISH`, `PAGE_NAMES.BULK_PUBLISH_EDITOR`, `BULK_PUBLISH_PROJECT_MODEL` path, and `QUICK_ACTION.VALIDATE: 'validate'` enum entry (`mas-quick-actions.js` already reads `QUICK_ACTION`; just add a new icon entry to `ACTION_CONFIG` there — `sp-icon-approve-check` or similar).
- `studio/src/store.js` — add `bulkPublishProjects` subtree (`list`, `inEdit`, `projectId`, `publishing` map) beside `translationProjects`.
- `studio/src/router.js` — register `PAGE_NAMES.BULK_PUBLISH` and `PAGE_NAMES.BULK_PUBLISH_EDITOR`, link `bulkPublishProjectId` to hash, wire unsaved-change check.
- `studio/src/mas-repository.js` — add `loadBulkPublishProjects()` beside `loadTranslationProjects()` (line 996); expose `getFragmentById(id)` as a public helper if not already.
- `studio/src/mas-quick-actions.js` — **add `VALIDATE` to `ACTION_CONFIG`** (icon + title). No structural changes; component already consumes `.actions[]` + `.disabled` as a Set.
- `studio/src/translation/mas-items-selector.js` + `mas-translation-languages.js` — accept `targetStore` property, default to `Store.translationProjects` for back-compat. Replace direct `Store.translationProjects.*` reads with `this.targetStore.*`.
- `studio/src/swc.js` — any Spectrum components not already imported (expect none new; `sp-table`, `sp-dialog-wrapper`, `sp-picker`, `sp-toast`, `sp-textfield` all present).
- App-shell nav entry — add `Advanced tools → Bulk publish` link pointing at `PAGE_NAMES.BULK_PUBLISH`.

### Reused components

- `studio/src/mas-quick-actions.js` — the bottom floating action bar. Bulk-publish passes `.actions=[SAVE, VALIDATE, PUBLISH, DELETE]`. The remaining icons the Figma shows (Duplicate, Tag, Lock) are intentionally omitted for MVP because the backend has no semantics for them here. The only repo change required is adding a `VALIDATE` entry to `ACTION_CONFIG` (icon + title), which the existing translation/settings callers don't touch.
- `studio/src/translation/mas-items-selector.js` — the "Add by search" modal.
- `studio/src/translation/mas-translation-languages.js` — the locale picker.
- `studio/src/mas-confirm-dialog.js` — delete confirmation reuse.
- `studio/src/reactivity/store-controller.js` — store subscription in all new Lit components.
- `studio/src/events.js` `Events.toast` — all toasts per `.claude/rules/event-driven-communication.md`.

## Data contracts

### Project fragment (stored in AEM at `/content/dam/mas/bulk-publish-projects/`)

Content-model fields (content model authored in AEM — see Open Questions):

| Field | Type | Notes |
|---|---|---|
| `title` | string | required |
| `author` | string | IMS userId at create-time |
| `createdAt` | ISO date | set on first save |
| `publishedAt` | ISO date or null | set when status transitions to Published |
| `publishedBy` | string or null | IMS userId of publisher |
| `status` | enum | `Draft` \| `Publishing` \| `Published` |
| `urls` | text | raw newline-separated author input (preserved for re-edit) |
| `items` | JSON (text) | `[{url, fragmentId, path, locale, status, reason}]` |
| `locales` | string[] | target locale codes |
| `lastResult` | JSON (text) | backend response body `{summary, details}` |
| `lastError` | string or null | set on publish failure |

`items` and `lastResult` stored as JSON-in-text for MVP simplicity — matches translations' approach for similar nested state.

### IO Runtime call

```
POST {IO_BASE}/api/v1/web/MerchAtScaleStudio/bulk-publish
Headers:
  Authorization: Bearer <imsToken>
  Content-Type: application/json
Body:
  {
    "paths":            string[],   // fragment paths, max 500
    "locales":          string[],   // optional, max 50
    "concurrencyLimit": 5
  }
```

`IO_BASE` resolves via `<meta name="io-base-url">` in `studio.html` (same mechanism as `aem-base-url`). IMS token via existing IMS lib instance. Fire-and-forget: UI does not `await` the Promise to unblock the page.

### CSV report columns (Figma blank — defined here)

```
url, resolved_path, locale, status, reason, workflow_instance_id, published_at
```

## Screen-by-screen behavior

### Screen 1 — Bulk Publish Overview (`mas-bulk-publish.js`)

- Breadcrumb: `Advanced tools > Bulk publish`.
- Title: "Bulk publish".
- Top-right CTA: `+ Create project` → `router.navigateToPage(BULK_PUBLISH_EDITOR, {projectId: null})`.
- `sp-table` with columns: Project, Fragment count, Collection count, Placeholder count, Created by, Status, Actions. (Scheduled publish date column from Figma omitted — out of scope.)
- Status pills: Draft (grey), Publishing (orange/amber), Published (green). Only these three ship in MVP.
- Row action overflow (`…`): Edit (→ editor), Delete (→ `mas-confirm-dialog` → `repository.deleteFragment`).
- Data source: `Store.bulkPublishProjects.list`, loaded via `repository.loadBulkPublishProjects()` on `connectedCallback`.

### Screen 2 — Create project, empty state (`mas-bulk-publish-editor.js`, mode = "draft, no items")

- Breadcrumb: `Advanced tools > Bulk publish > Create bulk publish project`.
- Title: "Create bulk publish project" (or project title once saved).
- Three stacked cards: General info (Title required), Items (URL textarea + `+ Add by search`), Locales (dashed dropzone).
- `mas-quick-actions` at the bottom with `.actions=[SAVE, VALIDATE, PUBLISH, DELETE]`. Disabled rules:
  - `VALIDATE` disabled until `urls.trim()` is non-empty.
  - `PUBLISH` disabled until `items.some(i => i.status === 'valid')` **and** `status === 'Draft'`.
  - `SAVE` and `DELETE` always enabled when the editor is mounted; the create-fragment call surfaces any required-field errors (Title) as toasts rather than through bar-disabling.

### Screen 3 — Post-validation (`mas-bulk-publish-editor.js`, mode = "items[] populated")

- Items card replaces textarea with URL list; inline warning row `⚠ 404 error found ({n})` (orange) appears if any `items[i].reason === 'not-found'`.
- Locales card shows region-summary line (e.g., `LATAM/Americas: CA_en, US`) + Edit pencil + collapse chevron.
- `PUBLISH` icon now enabled (assuming at least one valid item).

### Screen 4 — Publish confirmation modal (`mas-bulk-publish-confirm-dialog.js`)

- Alert dialog. Title: "Publish project". Body: "This project will be published immediately." followed by three labeled lines:
  - **Project:** `{title}`
  - **Scheduled:** Now
  - **Items:** `{items.filter(valid).length}`
- Footer: Cancel (secondary) + Publish (primary accent).
- On Publish:
  1. `Store.bulkPublish.inEdit.status = 'Publishing'`
  2. `repository.saveFragment(project)` to persist Publishing status
  3. `bulkPublishClient.publishBulk({paths, locales, token})` — fire-and-forget, Promise stored in `Store.bulkPublish.publishing[projectId]`
  4. Modal closes; editor stays mounted; banner does not swap yet
  5. `PUBLISH` and `SAVE` quick-actions now disabled
- Background handler in `bulk-publish-store.js` awaits the Promise:
  - on resolve: write `lastResult`, set `status: 'Published'`, `publishedAt`, `publishedBy`, `saveFragment`, `Events.toast.emit({variant: 'positive', message: 'Project published successfully'})`.
  - on reject: revert `status: 'Draft'`, set `lastError`, `saveFragment`, `Events.toast.emit({variant: 'negative', ...})`.

### Screen 5 — Published state (`mas-bulk-publish-editor.js`, mode = "status === Published")

- Green success banner rendered above General info. Copy: `Project published successfully — All items in this project were published on {publishedAt} by {publishedBy} and are now live across the selected locales.`
- All three cards rendered read-only. Each card header still exposes Edit (pencil) — clicking any Edit transitions status back to `Draft` on next Save, allowing re-publish.
- Page header gains `Download report` secondary button (top-right). On click: `csv.toCsv(lastResult.details)` → `Blob` → `URL.createObjectURL` → `<a download>` programmatic click.
- Quick-actions bar still rendered: SAVE (enabled if edits made), VALIDATE, PUBLISH, DELETE. Publish re-enables only after an edit that invalidates the current published state.

## Edge cases

- **Tab close during Publishing**: backend still runs (queue holds it). On reopen, editor sees `status === 'Publishing'` without `lastResult` and renders a passive "Publishing…" state. A Refresh button triggers `repository.loadBulkPublishProjects()` to re-read from AEM in case another tab finished the save. No automatic polling in MVP.
- **Validate with invalid URLs (not Studio deep-links)**: `url-to-path.parseStudioUrl` returns null; item row is pushed with `status: 'error', reason: 'invalid-url'`. Count is rolled into the 404 banner only if the backend returns 404 — parse errors use a separate warning line `⚠ {n} unrecognized URL{s}`.
- **Backend 500 or timeout**: Promise rejects, status reverts to Draft, `lastError` stored, toast shown.
- **Mixed valid + invalid items**: Publish sends only `items.filter(i => i.status === 'valid').map(i => i.path)` — invalid ones skipped. Modal body count reflects the valid count only.
- **Empty locales**: backend treats as "no expansion" — paths publish as-is. UI allows this.

## Verification

1. **Unit tests** (WTR) for `url-to-path.js`, `csv.js`, `bulk-publish-store.js` — pure logic, no DOM.
2. **Component tests** (WTR) for each new `mas-bulk-publish-*.js`: empty render, populated render, disabled/enabled quick-actions per status, confirm-dialog button wiring.
3. **Manual end-to-end in local dev:**
   - `npm run build` in `web-components/` and `studio/`.
   - `bash worktrees/wt start MWPW-188626` to run AEM + proxy.
   - Navigate to studio (`?maslibs=local`), enter IMS, go to `Advanced tools → Bulk publish`.
   - Create project → paste 2 valid studio URLs + 1 deliberately-broken one (fragmentId that doesn't exist) → Save → Validate → confirm inline 404 warning → Publish → confirm modal counts match → confirm Published banner + Download report returns a valid CSV.
4. **NALA e2e** (fast-follow, not blocker for this PR): one happy-path test (create + validate + publish + published) and one 404 branch.

## Decisions recorded

- **`Download report` placement:** Figma shows it on Screen 5 only; PRD mentions Screen 3 too. We follow Figma. Trivial to add on Screen 3 later if needed.
- **Validation warning style:** inline orange warning inside the Items card (`404 error found ({n})`), not a top-of-page banner — matches Figma exactly.
- **Icon for `QUICK_ACTION.VALIDATE`:** implementation-time choice from the Spectrum icon set; preferred candidate is the Spectrum `badge-verified` glyph to match the Figma's magenta accent.

## Open questions

1. **Content model authoring in AEM.** The `bulk-publish-project` content model needs to be authored in AEM (outside this repo) before the UI can create fragments of it. Confirm either that the model exists in sandbox or that a partner author will create it matching the field list in this doc.
