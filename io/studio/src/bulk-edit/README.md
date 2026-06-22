# Bulk Find & Replace

Search MAS fragments across a surface, export matches, edit replacements in CSV, and apply changes to Odin — all as async jobs on Adobe I/O Runtime.

Base path: `{host}/api/v1/web/MerchAtScaleStudio/`

**Web actions**

| URL path | Role |
|----------|------|
| `bulk-edit-find` | Start find jobs, poll progress, upload edited CSV, download find exports |
| `bulk-edit-replace` | Start replace jobs (dry run or live), poll progress, download replace exports |

Both web actions share one Runtime function (`bulk-edit.js`). Find vs replace is selected via the action's `bulkEditMode` input (`find` or `replace`).

Example requests live in [`io/studio/requests.http`](../../requests.http).

---

## End-to-end workflow

```
Find (bulk-edit-find)
  1. POST  /bulk-edit-find              → start search (202 + jobId)
  2. GET   /bulk-edit-find?jobId={id}    → poll until done=true, exportReady=true
  3. GET   /bulk-edit-find?jobId={id}.csv → get downloadUrl, fetch file (no auth on file URL)
  4. Edit CSV locally                     → fill in the `replace` column
  5. POST  /bulk-edit-find?jobId={id}    → upload edited CSV (filters exports)
  5b.DELETE /bulk-edit-find?jobId={id}   → optional: remove upload, restore full exports

Replace (bulk-edit-replace)
  6. POST  /bulk-edit-replace             → dryRun:true first, then live (202 + replaceJobId)
  7. GET   /bulk-edit-replace?jobId={id}  → poll replace progress
  8. GET   /bulk-edit-replace?jobId={id}.csv → get downloadUrl, fetch file (no auth on file URL)
```

```mermaid
sequenceDiagram
    participant Client
    participant Find as bulk-edit-find
    participant Replace as bulk-edit-replace
    participant FindWorker as find-worker
    participant ReplaceWorker as replace-worker
    participant Odin

    Client->>Find: POST start search
    Find->>FindWorker: invoke async
    loop while searching
        FindWorker->>Odin: paginate fragments
        Client->>Find: GET jobId
        Find-->>Client: progress envelope
    end
    Client->>Find: GET jobId.csv
    Find-->>Client: downloadUrl
    Client->>Find: POST upload CSV
    Client->>Replace: POST dryRun replace
    Replace->>ReplaceWorker: invoke async
    ReplaceWorker->>Odin: GET/PUT fragments
    Client->>Replace: GET replaceJobId.csv
```

Use the find endpoints for find jobs and the replace endpoints for replace jobs. Using the wrong endpoint for a `jobId` returns `400`.

---

## HTTP API

All requests require a valid `Authorization: Bearer <IMS token>`.

### Find — `POST /bulk-edit-find`

Start a search.

```json
{
  "surface": "sandbox",
  "find": "firefly",
  "searchIn": "*",
  "matchCase": false,
  "locale": ["en_US"],
  "tags": ["mas:plan_type/abc"],
  "status": "PUBLISHED",
  "forceRefresh": false
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `surface` | yes | e.g. `sandbox`, `acom` |
| `find` | yes | Text to search for |
| `searchIn` | no | Field scope or `"*"` (default) |
| `matchCase` | no | Default `false` |
| `locale` | no | String or array; omit for all locales |
| `tags` | no | Filter by fragment tags |
| `status` | no | e.g. `PUBLISHED`, `DRAFT` |
| `forceRefresh` | no | Re-run even if a cached job exists |

Response: `202 { jobId, reused }`

### Find — poll / download / upload

| Method | URL | Purpose |
|--------|-----|---------|
| `GET` | `/bulk-edit-find?jobId={id}` | Progress envelope |
| `GET` | `/bulk-edit-find?jobId={id}.json` | `{ downloadUrl, expiresIn, format }` |
| `GET` | `/bulk-edit-find?jobId={id}.csv` | `{ downloadUrl, expiresIn, format }` |
| `POST` | `/bulk-edit-find?jobId={findJobId}` | Upload edited CSV (filters exports) |
| `DELETE` | `/bulk-edit-find?jobId={findJobId}` | Remove uploaded CSV (restore full exports) |

Progress response (result rows are not included — use the download endpoints):

```json
{
  "jobId": "abc…",
  "type": "find",
  "status": "RUNNING",
  "done": false,
  "total": 42,
  "report": { "total": 42, "byLocale": { "en_US": 30, "fr_FR": 12 } },
  "filteredByUpload": false,
  "exportReady": true
}
```

Download endpoints return **200** with a temporary `downloadUrl`. Fetch that URL **without** an `Authorization` header (the link is self-contained). Request a new download if the link has expired.

```json
{
  "jobId": "abc…",
  "format": "json",
  "downloadUrl": "https://…",
  "expiresIn": 86400
}
```

Allowed when `status` is `DONE` or `CANCELLED`.

After a find completes, the full result set is retained internally. **Download JSON/CSV** (`results.json` / `results.csv`) reflects the current view:

- **No upload** — all matches from the search
- **After CSV upload** — only rows present in the uploaded CSV (with `replace` values merged into the CSV export); upload response includes filtered `total` and `report`
- **After CSV delete** — restored to the full unfiltered result set

CSV upload: `Content-Type: text/csv` or `multipart/form-data` with a file part. Find job must be complete. Each row must match a `(fragment_id, field, find)` triple from the **full** find results (not only the currently filtered export). Rows in the upload define the filter — omitted find rows are excluded from exports until the upload is removed.

Upload response:

```json
{
  "jobId": "abc…",
  "rowsAccepted": 3,
  "filteredByUpload": true,
  "total": 3,
  "report": { "total": 3, "byLocale": { "en_US": 3 } },
  "exportReady": true
}
```

Remove upload — `DELETE /bulk-edit-find?jobId={findJobId}`:

```json
{
  "jobId": "abc…",
  "filteredByUpload": false,
  "total": 42,
  "report": { "total": 42, "byLocale": { "en_US": 30, "fr_FR": 12 } },
  "exportReady": true
}
```

### Replace — `POST /bulk-edit-replace`

Apply uploaded replacements. Requires a completed find job and an uploaded CSV on that find job.

**Dry run** (preview, no Odin writes):

```json
{
  "findJobId": "abc…",
  "dryRun": true
}
```

**Live run:**

```json
{
  "findJobId": "abc…"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `findJobId` | yes | Completed find job with uploaded CSV |
| `dryRun` | no | `true` / `"true"` — preview only |

Response: `202 { jobId, reused, dryRun }`

### Replace — poll / download

| Method | URL | Purpose |
|--------|-----|---------|
| `GET` | `/bulk-edit-replace?jobId={replaceJobId}` | Progress envelope |
| `GET` | `/bulk-edit-replace?jobId={replaceJobId}.json` | `{ downloadUrl, expiresIn, format }` |
| `GET` | `/bulk-edit-replace?jobId={replaceJobId}.csv` | `{ downloadUrl, expiresIn, format }` |

Progress response:

```json
{
  "jobId": "replace.abc….live.def…",
  "type": "replace",
  "status": "RUNNING",
  "done": false,
  "dryRun": false,
  "total": 10,
  "processed": 4,
  "succeeded": 3,
  "skipped": 1,
  "failed": 0,
  "conflicts": 0,
  "report": null
}
```

Poll until `done: true` and `exportReady: true`. Download allowed when `status` is `DONE`.

---

## CSV format

Fixed header (order matters):

```
fragment_id,path,locale,field,find,replace,etag,status
```

- One row per **match** (a fragment with two field hits → two rows)
- Leave `replace` empty on export; fill it in before upload
- **Tags** can appear in find results but are never rewritten on replace (rows come back `SKIPPED`)

Row identity for validation: `fragment_id|field|find`.

---

## Job IDs and caching

**Find jobs** — derived from the normalized search parameters. Identical searches reuse the same `jobId` and return `{ reused: true }` while the job is still active or cached.

**Replace jobs** — a separate id tied to the find job, dry/live mode, and uploaded CSV content. Changing the CSV or toggling dry/live produces a new id.

**Force refresh** — `forceRefresh: true` on find clears prior uploads and exports, then re-runs the search.

---

## Replace behavior

1. Uploaded CSV rows are grouped by fragment; multiple field replacements on one fragment are applied in a single Odin PUT.
2. Rows with empty `replace`, unchanged text, or tag fields are **skipped**.
3. **Dry run** — no Odin writes; export status column shows `WOULD_REPLACE` / `SKIPPED`.
4. **Live run** — statuses are `REPLACED`, `SKIPPED`, `FAILED`, or `CONFLICT` (fragment changed since find).
5. Large replace jobs may run across multiple worker activations until complete.

`matchCase` for replace is inherited from the original find job.

---

## Known limitations

Product and UX edge cases to plan for in clients (e.g. MAS Studio). Not an exhaustive API contract.

| Situation | Expected client behavior |
|-----------|-------------------------|
| Download link expired | Call the download endpoint again while the job is still available. |
| Job no longer found (`404`) | Re-run find with the same search parameters; re-upload CSV if needed. |
| Stale find results | Use `forceRefresh: true` before replace if content may have changed in Odin. |
| Incomplete find (`CANCELLED`) | Download partial results or refresh the search. |
| Fragment edited after find | Replace may report `CONFLICT` or `SKIPPED` — refresh find and update CSV. |
| Partial replace outcome | Review export statuses; adjust CSV and start a new replace run as needed. |
| Re-upload CSV | Overwrites prior upload; exports re-filter; start a new replace job (dry run, then live). |
| Remove uploaded CSV | `DELETE /bulk-edit-find?jobId=…` restores full find exports and `filteredByUpload: false`. |
| Subset CSV upload | Upload defines the filter — exports include only uploaded rows; extra rows in the file are rejected. |
| Tag matches in export | Informational only — replace always skips tag fields. |
| Fetching `downloadUrl` | Do not send the IMS `Authorization` header to `downloadUrl` — use auth only on the bulk-edit API call. |

---

## Tests

```bash
cd io/studio
npm test -- --grep bulk-edit
```

Tests live under [`io/studio/test/bulk-edit/`](../../test/bulk-edit/).
