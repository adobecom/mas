# Bulk Find & Replace

Search MAS **card and collection** fragments across a surface, export matches, optionally filter via CSV upload, and apply changes to Odin — all as async jobs on Adobe I/O Runtime. Dictionary entries are not searched or updated.

Base path: `{host}/api/v1/web/MerchAtScaleStudio/`

**Web actions**

| URL path            | Role                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| `bulk-edit-find`    | Start find jobs, poll progress, upload CSV subset, download find exports      |
| `bulk-edit-replace` | Start replace jobs (dry run or live), poll progress, download replace exports |

Both web actions share one Runtime function (`bulk-edit.js`). Find vs replace is selected via the action's `bulkEditMode` input (`find` or `replace`).

Example requests live in [`io/studio/requests.http`](../../requests.http).

---

## End-to-end workflow

```
Find (bulk-edit-find)
  1. POST  /bulk-edit-find              → start search with find + replace (202 + jobId)
  2. GET   /bulk-edit-find?jobId={id}    → poll until done=true, exportReady=true (exports.csv lists matches)
  3. Edit CSV locally                     → optional: delete rows to limit replace scope
  4. POST  /bulk-edit-find?jobId={id}    → optional: upload CSV to limit replace scope to those rows
  4b.DELETE /bulk-edit-find?jobId={id}   → optional: remove upload, restore full exports

Replace (bulk-edit-replace)
  5. POST  /bulk-edit-replace             → { findJobId, dryRun? } — dry run first, then live
  6. GET   /bulk-edit-replace?jobId={id}  → poll until done=true, exportReady=true (response includes exports.json)
```

Use the find endpoints for find jobs and the replace endpoints for replace jobs. Using the wrong endpoint for a `jobId` returns `400`.

---

## HTTP API

All requests require a valid `Authorization: Bearer <IMS token>`.

### Find — `POST /bulk-edit-find`

Start a search. **`replace` is required** — it defines the replacement text applied to each match at replace time (not stored in the CSV).

```json
{
    "surface": "sandbox",
    "find": "firefly",
    "replace": "Firefly Pro",
    "searchIn": "*",
    "matchCase": false,
    "locale": ["en_US"],
    "tags": ["mas:plan_type/abc"],
    "status": "PUBLISHED",
    "forceRefresh": false
}
```

| Field          | Required | Notes                                                                                                                                                                                                              |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `surface`      | yes      | e.g. `sandbox`, `acom`                                                                                                                                                                                             |
| `find`         | yes      | Text to search for                                                                                                                                                                                                 |
| `replace`      | yes      | Replacement text applied within each match at replace time                                                                                                                                                         |
| `searchIn`     | no       | Field scope or `"*"` for all scopes in `SCOPE_FIELDS` (`prices`, `ctas`, `calloutText`, `productDescription`, `promoText`, `subtitle`, `fragmentDescription`, `fragmentTitle`, `tags`) — not arbitrary Odin fields |
| `matchCase`    | no       | Default `false`                                                                                                                                                                                                    |
| `locale`       | no       | String or array; omit for all locales                                                                                                                                                                              |
| `tags`         | no       | Filter by fragment tags                                                                                                                                                                                            |
| `status`       | no       | e.g. `PUBLISHED`, `DRAFT`                                                                                                                                                                                          |
| `forceRefresh` | no       | Re-run even if a cached job exists                                                                                                                                                                                 |

Response: `202 { jobId, reused }`

### Find — poll / upload

| Method   | URL                                 | Purpose                                                                                         |
| -------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `GET`    | `/bulk-edit-find?jobId={id}`        | Progress envelope; when `exportReady`, includes `exports.json` and `exports.csv` presigned URLs |
| `POST`   | `/bulk-edit-find?jobId={findJobId}` | Upload CSV subset (filters exports and replace scope)                                           |
| `DELETE` | `/bulk-edit-find?jobId={findJobId}` | Remove uploaded CSV (restore full exports)                                                      |

Progress response (result rows are not included — download via `exports` URLs when ready):

```json
{
    "jobId": "abc…",
    "type": "find",
    "status": "DONE",
    "done": true,
    "total": 42,
    "report": { "total": 42, "byLocale": { "en_US": 30, "fr_FR": 12 } },
    "filteredByUpload": false,
    "exportReady": true,
    "exports": {
        "json": "https://…presigned…",
        "csv": "https://…presigned…"
    }
}
```

Export URLs are presigned Adobe I/O Files links (valid 24 hours). Follow them without the IMS `Authorization` header. If the Files copy is missing or expired, the poll GET regenerates exports from cached state results (7-day window) before returning fresh URLs.

Allowed when `status` is `DONE` or `CANCELLED`.

After a find completes, the full result set is retained internally. **Download JSON/CSV** (`results.json` / `results.csv`) reflects the current view:

- **No upload** — all matches from the search
- **After CSV upload** — only rows present in the uploaded CSV; upload response includes filtered `total` and `report`
- **After CSV delete** — restored to the full unfiltered result set

CSV upload: `Content-Type: text/csv` or `multipart/form-data` with a file part. Find job must be complete. Each row must match a `(fragment_id, field, find)` triple from the **full** find results (not only the currently filtered export). **The upload defines replace scope:** rows present in the file are eligible for replace; rows omitted from the file are excluded from exports and from replace (they are not processed and do not appear in the replace report). Extra rows not in the original find results are rejected.

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

Apply replacements for a completed find job. Replace values are computed from the find job's `find` and `replace` params; the CSV (generated or uploaded) defines which rows are in scope.

- **No CSV uploaded** — all find matches where the computed replacement differs from `find` are processed.
- **CSV uploaded on the find job** — only rows in that upload are processed. Other matches from the search are left unchanged and are not listed in the replace export.

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

| Field       | Required | Notes                            |
| ----------- | -------- | -------------------------------- |
| `findJobId` | yes      | Completed find job (`DONE`)      |
| `dryRun`    | no       | `true` / `"true"` — preview only |

Response: `202 { jobId, reused, dryRun }`

### Replace — poll

| Method | URL                                       | Purpose                                                                      |
| ------ | ----------------------------------------- | ---------------------------------------------------------------------------- |
| `GET`  | `/bulk-edit-replace?jobId={replaceJobId}` | Progress envelope; when `exportReady`, includes `exports.json` presigned URL |

Suffix `.json` / `.csv` on `jobId` is not supported (`400`). Replace jobs export JSON only.

Progress response:

```json
{
    "jobId": "replace.abc….live.def…",
    "type": "replace",
    "status": "DONE",
    "done": true,
    "dryRun": false,
    "total": 10,
    "processed": 10,
    "succeeded": 8,
    "skipped": 2,
    "failed": 0,
    "conflicts": 0,
    "exportReady": true,
    "exports": {
        "json": "https://…presigned…"
    },
    "report": { "totalFragments": 10, "succeeded": 8 }
}
```

Poll until `done: true` and `exportReady: true`. Export URLs appear when `status` is `DONE`.

---

## CSV format

Fixed header (order matters):

```
fragment_id,path,locale,field,find,etag,status
06171e68-…,/content/dam/mas/sandbox/en_US/foo,en_US,subtitle,school offer,"""abc123""",PUBLISHED
```

- One row per **match** (a fragment with two field hits → two rows)
- `field` is the Odin field name (e.g. `cardTitle`, `subtitle`, `callout`); legacy scope labels (e.g. `productDescription`) are still accepted on CSV upload
- `find` — matched value at find time
- `etag` — fragment etag at find time; replace skips the write when the server etag differs (`SKIPPED`, `reason: etag_mismatch`)
- **Tags** can appear in find results but are never rewritten on replace (present rows come back `SKIPPED`)
- Legacy CSV headers that include a `replace` column are **rejected**

Row identity for validation: `fragment_id|field|find`.

---

## Job IDs and caching

**Find jobs** — derived from the normalized search parameters (including `replace`). Identical find+replace intents reuse the same `jobId` and return `{ reused: true }` while the job is still active or cached.

**Replace jobs** — a separate id tied to the find job, find run (`runId`), dry/live mode, and the actionable CSV rows (fragment, field, find, etag). Replace values come from the find job params, not the CSV. Refreshing a find job (new `runId`) produces a new replace id. Changing CSV rows or toggling dry/live also produces a new id. Once a replace job is `RUNNING` or `DONE`, an identical POST returns `{ reused: true }` and does not restart the worker.

**Force refresh** — `forceRefresh: true` on find clears prior uploads and exports, then re-runs the search.

**Retention** — completed find/replace jobs, search results, uploaded CSV, and reports are kept in state for **7 days**. Each poll or download GET on a terminal job refreshes that window. RUNNING jobs use a 30-minute TTL refreshed by worker progress.

**Export regeneration** — export files in Adobe I/O Files may expire independently of state. A poll GET regenerates missing exports from cached state results, then returns fresh presigned URLs in `exports`.

---

## Replace behavior

1. Replace reads CSV rows for scope — generated from find results or from an uploaded CSV subset.
2. Rows are grouped by fragment; multiple field updates on one fragment are applied in a single Odin PATCH.
3. Replace computes the write value from the find job's `find` and `replace` params when the current field value still matches `find`.
4. **Etag guard** — before writing, the worker compares the CSV `etag` to the live server etag. If they differ, the fragment is **skipped** with `reason: etag_mismatch` (no write, no retry).
5. **Partial PATCH** — only changed fields/properties are patched, not the full fragment.
6. **Omitted vs skipped** — a row removed from the uploaded CSV is never processed. A row that is processed but unchanged (e.g. tag field, find no longer matches, etag mismatch) gets status `SKIPPED` in the replace export.
7. **Dry run** — fetches each fragment from Odin, applies changes in memory (no PATCH), and exports JSON with modified fragment payloads (`WOULD_REPLACE`).
8. **Live run** — statuses are `REPLACED`, `SKIPPED`, or `FAILED`.
9. **429 rate limits** — PATCH retries with exponential backoff (after `fetchOdin`'s per-request retries). Persistent 429 marks the fragment `FAILED`; other fragments continue.
10. Large replace jobs may run across multiple worker activations until complete.
11. **Immutability** — a started dry or live replace job cannot be stopped or restarted for the same find run and CSV rows. Re-POST with the same inputs returns `{ reused: true }` while the job is `RUNNING` or `DONE`. Refresh the find job (`forceRefresh`) first to start a new replace.

`matchCase` for replace is inherited from the original find job.

---

## Known limitations

Product and UX edge cases to plan for in clients (e.g. MAS Studio). Not an exhaustive API contract.

| Situation                      | Expected client behavior                                                                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Presigned URL expired          | Poll again for fresh `exports` URLs (job must be within the 7-day cache window).                                                                               |
| Export file missing or expired | Poll GET regenerates exports from cached state results, then returns new presigned URLs.                                                                       |
| Job no longer found (`404`)    | Cache expired after 7 days — re-run find with the same search parameters; re-upload CSV if needed.                                                             |
| Stale find results             | Use `forceRefresh: true` on find before replace if content may have changed in Odin. A refreshed find gets a new `runId` and a new replace job id.             |
| Incomplete find (`CANCELLED`)  | Download partial results or refresh the search.                                                                                                                |
| Fragment edited after find     | Replace reports `SKIPPED` with `reason: etag_mismatch` — refresh find (re-upload CSV subset if used).                                                          |
| Partial replace outcome        | Review export statuses; adjust CSV and start a new replace run as needed.                                                                                      |
| Re-upload CSV                  | Overwrites prior upload; exports re-filter; start a new replace job (dry run, then live).                                                                      |
| Remove uploaded CSV            | `DELETE /bulk-edit-find?jobId=…` restores full find exports and `filteredByUpload: false`.                                                                     |
| Subset CSV upload              | Upload defines replace scope — only uploaded rows are processed; omitted find rows are excluded from exports and replace. Extra rows in the file are rejected. |
| Row omitted from uploaded CSV  | Field is not touched; row does not appear in replace export (not the same as `SKIPPED`).                                                                       |
| Tag matches in export          | Informational only — replace always skips tag fields (`SKIPPED` when the row is present).                                                                      |
| Following the redirect         | Do not send the IMS `Authorization` header to presigned `exports` URLs — use auth only on the bulk-edit API poll call.                                         |

---

## Logging & Splunk

All three actions log via `@adobe/aio-sdk`'s `Core.Logger`, one JSON-stringified event per line:

| Logger name                | File                |
| -------------------------- | ------------------- |
| `bulk-edit`                | `bulk-edit.js`      |
| `bulk-edit-find-worker`    | `find-worker.js`    |
| `bulk-edit-replace-worker` | `replace-worker.js` |

### Events

| `event`                            | Level | Fields                                                                                 | Emitted when                                                                                                             |
| ---------------------------------- | ----- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `bulk-edit-error`                  | error | `mode`, `error`                                                                        | Any uncaught exception in a web action's `find`/`replace` handler                                                        |
| `bulk-edit-find-worker-error`      | error | `jobId`, `error`                                                                       | Find worker invocation throws                                                                                            |
| `bulk-edit-replace-worker-start`   | info  | `jobId`, `total`, `dryRun`, `cursor`                                                   | Replace worker invocation begins/resumes                                                                                 |
| `bulk-edit-replace-progress`       | info  | `jobId`, `cursor`, `total`, `processed`, `succeeded`, `skipped`, `failed`, `conflicts` | After each processed batch                                                                                               |
| `bulk-edit-replace-429-cooldown`   | warn  | `cooldownUntil`, `error`                                                               | Odin returns 429 on a GET or PATCH; the worker-wide rate-limit gate trips (see [Replace behavior](#replace-behavior) #9) |
| `bulk-edit-replace-fragment-error` | error | `fragmentId`, `error`                                                                  | A single fragment's replace fails; other fragments continue                                                              |
| `bulk-edit-replace-continued`      | info  | `jobId`, `cursor`                                                                      | Soft time budget hit; worker re-invokes itself and returns                                                               |
| `bulk-edit-replace-worker-done`    | info  | `jobId`, `processed`, `succeeded`, `skipped`, `failed`, `conflicts`                    | Worker finishes this invocation's items (job may still be `RUNNING` if continued)                                        |
| `bulk-edit-replace-worker-error`   | error | `jobId`, `error`                                                                       | Replace worker invocation throws (surfaces as a `500` from `main`)                                                       |

### Finding these logs in Splunk

The `logger.*` calls above land in `splunk-us.corp.adobe.com`, index `adobeio_events_processing_nonprod` (or `_prod`). Example:

```spl
index="adobeio_events_processing_nonprod" action="/14257-masstudio-yesil/MerchAtScaleStudio/bulk-edit-replace-worker"
```

Add `"*<jobId>*"` or `"*bulk-edit-replace-429-cooldown*"` to narrow to a specific job or event.

---

## Tests

```bash
cd io/studio
npm test -- --grep bulk-edit
```

Tests live under [`io/studio/test/bulk-edit/`](../../test/bulk-edit/).
