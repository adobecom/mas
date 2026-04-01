# MWPW-191059: Switch MAS Studio Preview to Freyja v2

**Status:** Draft
**Author:** Axel Cureno Basurto
**Date:** 2026-03-31
**Priority:** Critical
**Related:** ODIN-900 (Enable Freyja v2 preview for MAS)

## Problem

MAS Studio uses Odin Preview (`odinpreview.corp.adobe.com`) to resolve content fragment previews. This has high latency due to large payload sizes, impacting Content QA workflows. Freyja v2 (`preview-p22655-e59433.adobeaemcloud.com`) is a faster preview service already in test by the Odin team (ODIN-900).

## Goal

Replace Odin Preview with Freyja v2 as the preview backend for MAS Studio. Provide a temporary fallback to Odin during the cutover period. Remove the fallback once Freyja is validated.

## Constraints

- Freyja v2 requires VPN + bearer token (Odin Preview requires neither)
- Freyja uses a different URL path: `/adobe/contentFragments/` vs Odin's `/adobe/sites/cf/fragments/`
- The IMS bearer token must come from `window.adobeIMS.getAccessToken().token`, not `sessionStorage.masAccessToken` (which is a manually-pasted workaround token)
- Seven fetch call sites across four transformers (`fetchFragment`, `replace`, `settings`, `customize`) all route through `rootURL()` in `paths.js` — all must switch to Freyja
- `mas-repository.js` has two hardcoded Odin URLs outside the pipeline that must also be updated
- The `io/www` pipeline is transport-agnostic — fallback logic in `common.js` must be generic (keyed on context properties, not browser APIs)

## Architecture

### Current Flow

```
Studio JS  -->  fetch(odinpreview.corp.adobe.com/...)  -->  Odin Preview (no auth)
                 ^-- 7 call sites across 4 transformers + 2 in mas-repository.js
                 ^-- all route through rootURL(preview) in paths.js
```

### Target Flow

```
Studio JS  -->  fetch(preview-p22655-e59433.adobeaemcloud.com/...)  -->  Freyja v2 (bearer token)
                 ^-- same 7 + 2 call sites, URL changed via preview.url on context
                 ^-- auth header injected via context.authToken in internalFetch
                 ^-- fallback to Odin on failure (temporary)
```

### URL Routing

All preview URLs are built through `rootURL(preview)` in `io/www/src/fragment/utils/paths.js:8`. The `preview.url` property on the pipeline context is the sole URL override mechanism. No new routing mechanism is needed — change the URL, and all 7 transformer call sites switch automatically.

### Auth Header Injection

The pipeline's `internalFetch` in `io/www/src/fragment/utils/common.js` currently sends no auth headers client-side. A new optional `context.authToken` property is added. When present, `internalFetch` includes `Authorization: Bearer ${context.authToken}` in the request headers. This is transport-agnostic — server-side callers can also use it.

### Fallback Strategy

During the cutover period, `internalFetch` in `common.js` accepts an optional `context.fallbackUrl` property. When a preview fetch to Freyja fails (network error, 5xx, timeout on the first attempt only — no retries for the primary attempt), `internalFetch` retries once against the Odin URL constructed from `context.fallbackUrl`. The fallback attempt uses the existing retry logic (up to 3 retries).

Console logging: `[preview] Freyja OK` or `[preview] Freyja failed (${reason}), falling back to Odin`. Silent to the user.

When Freyja is validated stable, remove `fallbackUrl` from all context objects. The fallback code path in `internalFetch` becomes dead code and is removed.

### Timeout Budget

To prevent fallback from blowing the `mainTimeout` budget:
- Primary Freyja attempt: single fetch, no retries, respects `fetchTimeout`
- On failure: fall back to Odin with standard retry logic (up to 3 retries)
- Worst case: 1x `fetchTimeout` (Freyja) + 3x `fetchTimeout` (Odin retries) must fit within `mainTimeout`
- Current budgets: `mainTimeout: 20s`, `fetchTimeout: 15s` — these need adjustment. Recommended: `fetchTimeout: 4s` for Freyja (it should be fast), standard 10s for Odin fallback retries.

## Changes

### `io/www/src/fragment/utils/paths.js`

- Add `FREYJA_PREVIEW_URL` constant: `https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments`
- Add `ODIN_PREVIEW_URL` constant: `https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments`
- Export both as named exports
- `rootURL()` unchanged — it already uses `preview.url`

### `io/www/src/fragment/utils/common.js`

- In `internalFetch`/`fetchAttempt`: read `context.authToken` and include as `Authorization: Bearer` header when present
- Add fallback logic: when `context.fallbackUrl` is set and the primary fetch fails on first attempt, replace the Freyja base URL in the request path with `context.fallbackUrl` (e.g., swap `preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments` for `odinpreview.corp.adobe.com/adobe/sites/cf/fragments`) and retry with standard retry logic, omitting the `Authorization` header
- Console log the outcome when `context.preview` is set

### `studio/libs/fragment-client.js`

- Change `DEFAULT_CONTEXT.preview.url` from `https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments` to the Freyja URL (imported from `paths.js`)
- Add `authToken` to context, sourced from `window.adobeIMS.getAccessToken().token`
- Add `fallbackUrl` set to `ODIN_PREVIEW_URL` (temporary)

### `studio/src/mas-repository.js`

- Lines 574, 602: replace hardcoded Odin preview URLs with `FREYJA_PREVIEW_URL` imported from `paths.js`
- Pass `authToken` from `window.adobeIMS.getAccessToken().token` in both preview context objects
- Add `fallbackUrl: ODIN_PREVIEW_URL` to both contexts (temporary)

### `studio/src/constants.js`

- `ODIN_PREVIEW_ORIGIN` (line 252): keep as-is during cutover, remove when Odin is sunsetted

## Test Changes

### Updated Tests

- `io/www/test/client/fragment-client.test.js` — update mock preview URLs
- `io/www/test/fragment/pipeline.test.js` — update mock preview URLs
- `io/www/test/fragment/replace.test.js` — update mock preview URLs
- `nala/studio/regional-variations/specs/variations.spec.js` — update mock preview URLs

### New Tests

- `io/www/test/fragment/utils/common.test.js` (or extend existing):
  - `authToken` present: `Authorization` header included in fetch
  - `authToken` absent: no `Authorization` header
  - `fallbackUrl` present + primary fails: retries with fallback URL
  - `fallbackUrl` present + primary succeeds: no fallback attempted
  - Timeout budget: fallback completes within `mainTimeout`
  - Both fail: error propagated

## Discovery Step

Before implementation, manually verify Freyja returns a valid response for a known fragment:

```bash
curl -H "Authorization: Bearer <IMS_TOKEN>" \
  "https://preview-p22655-e59433.adobeaemcloud.com/adobe/contentFragments/f17d9a60-6205-49f5-8aa4-4f8e662268ed?references=all-hydrated"
```

Compare response shape with Odin. If incompatible, add a response normalizer in `common.js` before the response is returned to the transformer.

## Removal Plan

When Freyja is validated stable:
1. Remove `fallbackUrl` from context objects in `fragment-client.js` and `mas-repository.js`
2. Remove fallback logic from `internalFetch` in `common.js`
3. Remove `ODIN_PREVIEW_URL` from `paths.js`
4. Remove `ODIN_PREVIEW_ORIGIN` from `constants.js`
5. Remove fallback tests

## Files Changed

| File | Action |
|------|--------|
| `io/www/src/fragment/utils/paths.js` | Modified — add URL constants |
| `io/www/src/fragment/utils/common.js` | Modified — auth header + fallback |
| `studio/libs/fragment-client.js` | Modified — update preview URL + add auth/fallback context |
| `studio/src/mas-repository.js` | Modified — update 2 preview URLs + add auth/fallback context |
| `io/www/test/client/fragment-client.test.js` | Modified — update mock URLs |
| `io/www/test/fragment/pipeline.test.js` | Modified — update mock URLs |
| `io/www/test/fragment/replace.test.js` | Modified — update mock URLs |
| `nala/studio/regional-variations/specs/variations.spec.js` | Modified — update mock URLs |
| `io/www/test/fragment/utils/common.test.js` | Modified — add fallback + auth tests |

**Total: 0 new files, 9 modified files.**
