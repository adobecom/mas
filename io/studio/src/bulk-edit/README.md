# Bulk Find

Search MAS **card and collection** fragments across a surface, export matches, and optionally upload a CSV subset — all as async jobs on Adobe I/O Runtime. Dictionary entries are not searched.

Base path: `{host}/api/v1/web/MerchAtScaleStudio/bulk-edit-find`

Example requests live in [`io/studio/requests.http`](../../requests.http).

---

## End-to-end workflow

```
1. POST  /bulk-edit-find              → start search with find + replace (202 + jobId)
2. GET   /bulk-edit-find?jobId={id}   → poll until done=true, exportReady=true
3. Edit CSV locally                   → optional: delete rows to limit downstream replace scope
4. POST  /bulk-edit-find?jobId={id}   → optional: upload CSV subset to filter exports
4b.DELETE /bulk-edit-find?jobId={id}  → optional: remove upload, restore full exports
```

---

## HTTP API

All requests require a valid `Authorization: Bearer <IMS token>`.

### Start search — `POST /bulk-edit-find`

Start a search. **`replace` is required** — it is stored on the find job for use by the replace pipeline (MWPW-199042); it is not written to the exported CSV.

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

| Field | Required | Notes |
|-------|----------|-------|
| `surface` | yes | e.g. `sandbox`, `acom` |
| `find` | yes | Text to search for |
| `replace` | yes | Replacement text paired with this find job (used at replace time, not in CSV) |
| `searchIn` | no | Field scope or `"*"` for all scopes in `SCOPE_FIELDS` (`prices`, `ctas`, `calloutText`, `productDescription`, `promoText`, `subtitle`, `fragmentDescription`, `fragmentTitle`, `tags`) |
| `matchCase` | no | Default `false` |
| `locale` | no | String or array; omit for all locales |
| `tags` | no | Filter by fragment tags |
| `status` | no | e.g. `PUBLISHED`, `DRAFT` |
| `forceRefresh` | no | Re-run even if a cached job exists |

Response: `202 { jobId, reused }`

### Poll / upload / delete

| Method | URL | Purpose |
|--------|-----|---------|
| `GET` | `/bulk-edit-find?jobId={id}` | Progress envelope; when `exportReady`, includes `exports.json` and `exports.csv` presigned URLs |
| `POST` | `/bulk-edit-find?jobId={findJobId}` | Upload CSV subset (filters exports) |
| `DELETE` | `/bulk-edit-find?jobId={findJobId}` | Remove uploaded CSV (restore full exports) |

Progress response (download result rows via `exports` URLs when ready):

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

**Exports reflect the current view:**

- **No upload** — all matches from the search
- **After CSV upload** — only rows present in the uploaded CSV; upload response includes filtered `total` and `report`
- **After CSV delete** — restored to the full unfiltered result set

CSV upload: `Content-Type: text/csv` or `multipart/form-data` with a file part. Find job must be complete. Each row must match a `(fragment_id, field, find)` triple from the **full** find results. Rows omitted from the upload are excluded from exports until the upload is removed. Extra rows not in the original find results are rejected. Legacy CSV headers that include a `replace` column are **rejected**.

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
- `etag` — fragment etag at find time
- **Tags** can appear in find results

Row identity for validation: `fragment_id|field|find`.

---

## Job IDs and caching

**Find jobs** — derived from the normalized search parameters (including `replace`). Identical find+replace intents reuse the same `jobId` and return `{ reused: true }` while the job is still active or cached.

**Force refresh** — `forceRefresh: true` clears prior uploads and exports, then re-runs the search.

**Retention** — completed jobs, search results, uploaded CSV, and reports are kept in state for **7 days**. Each poll GET on a terminal job refreshes that window. RUNNING jobs use a 30-minute TTL refreshed by worker progress.

---

## Tests

```bash
cd io/studio
npm test -- --grep bulk-edit
```

Tests live under [`io/studio/test/bulk-edit/`](../../test/bulk-edit/).
