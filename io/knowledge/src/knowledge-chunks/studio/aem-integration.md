# AEM Integration

## Overview

MAS Studio manages content as AEM Content Fragments stored in Odin, Adobe's internal AEM Sites instance. All fragment operations go through the AEM Sites Content Fragment API, authenticated via IMS tokens. Studio abstracts this API behind its reactive stores and UI components, but understanding the underlying AEM integration is essential for troubleshooting and advanced workflows.

## Content Fragments in Odin

Every merch card, collection, dictionary entry, and translation project in MAS Studio is an AEM Content Fragment. Fragments are structured content objects with typed fields, metadata, tags, and versioning support.

### Fragment Path Structure

Fragments are organized by surface and locale:

```
/content/dam/mas/{surface}/{locale}/{fragmentName}
```

Examples:
- `/content/dam/mas/acom/en_US/photoshop-single-app`
- `/content/dam/mas/ccd/ja_JP/creative-cloud-all-apps`
- `/content/dam/mas/adobe-home/de_DE/acrobat-pro`

The path encodes three key pieces of information:
1. **Surface**: which product surface the card belongs to (acom, ccd, express, commerce, adobe-home)
2. **Locale**: the language and region combination (en_US, fr_FR, ja_JP, etc.)
3. **Fragment name**: a URL-safe slug identifying the card

## Fragment Model Types

Each fragment is based on a content fragment model that defines its schema:

| Model | Path | Purpose |
|-------|------|---------|
| merch-card | /conf/mas/settings/dam/cfm/models/merch-card | Product cards with pricing, CTAs, and descriptions |
| merch-card-collection | /conf/mas/settings/dam/cfm/models/merch-card-collection | Groupings of cards for display on a page |
| dictionary | /conf/mas/settings/dam/cfm/models/dictionary | Key-value pairs for localized strings |
| translation-project | /conf/mas/settings/dam/cfm/models/translation-project | Tracks translation workflow status |
| promotion | /conf/mas/settings/dam/cfm/models/promotion | Promotional content and offers |

The merch-card model is by far the most commonly used, containing fields for variant, title, body, prices, CTAs, badges, backgrounds, and more.

## CRUD Operations

### Create Fragment

```
POST /adobe/sites/cf/fragments
Content-Type: application/json
Authorization: Bearer {ims_token}

{
  "title": "Fragment Title",
  "model": "/conf/mas/settings/dam/cfm/models/merch-card",
  "parentPath": "/content/dam/mas/acom/en_US",
  "name": "fragment-name",
  "fields": [
    { "name": "variant", "value": "catalog" },
    { "name": "title", "value": "Photoshop" }
  ]
}
```

The `name` field becomes the URL slug. The `parentPath` determines surface and locale placement.

### Read Fragment

```
GET /adobe/sites/cf/fragments/{fragmentId}
Authorization: Bearer {ims_token}
```

Returns the complete fragment with all fields, metadata, tags, and the current ETag.

### Update Fragment

```
PUT /adobe/sites/cf/fragments/{fragmentId}
If-Match: {etag}
Content-Type: application/json
Authorization: Bearer {ims_token}

{
  "title": "Updated Title",
  "fields": [
    { "name": "title", "value": "Photoshop Single App" }
  ]
}
```

The `If-Match` header with the ETag is mandatory for updates (see optimistic locking below).

### Delete Fragment

```
DELETE /adobe/sites/cf/fragments/{fragmentId}
Authorization: Bearer {ims_token}
```

Deletion is permanent. Studio prompts for confirmation before executing deletes.

## ETag-Based Optimistic Locking

AEM uses ETags to prevent concurrent edit conflicts. This is critical in a multi-user environment like Studio.

### How It Works

1. When Studio fetches a fragment, the response includes an `ETag` header
2. Studio stores this ETag alongside the fragment data
3. When saving changes, Studio sends the ETag in the `If-Match` request header
4. AEM compares the sent ETag against the current fragment version
5. If they match, the update succeeds and a new ETag is returned
6. If they don't match (another user modified the fragment), AEM returns 409 or 412

### Conflict Resolution

When an ETag conflict occurs:
- Studio detects the 409/412 response
- The user is notified that the fragment was modified by someone else
- Studio fetches the latest version with the new ETag
- The user can review changes and retry their edit

## Fragment Status Values

Each fragment has a status reflecting its publication state:

| Status | Meaning |
|--------|---------|
| DRAFT | Fragment has been created or modified but not yet published |
| PUBLISHED | Fragment is live on the production CDN |
| MODIFIED | Fragment was published, then edited (published version still live, draft has changes) |

Studio displays status with color-coded indicators in both table and card views.

## Publishing

### Publish Fragment

```
POST /adobe/sites/cf/fragments/{fragmentId}/publish
Authorization: Bearer {ims_token}
```

Publishing does the following:
1. Sets fragment status to PUBLISHED
2. Pushes content to the production CDN
3. Makes the card available to consumer surfaces
4. Records the publish timestamp and user

### Unpublish Fragment

```
POST /adobe/sites/cf/fragments/{fragmentId}/unpublish
Authorization: Bearer {ims_token}
```

Removes the fragment from the production CDN. The fragment remains in Odin as a draft.

## Search and Pagination

### Cursor-Based Pagination

Fragment search uses cursor-based pagination rather than offset-based:

```
GET /adobe/sites/cf/fragments?path=/content/dam/mas/acom/en_US&limit=20
```

The response includes a `cursor` value for fetching the next page:

```
GET /adobe/sites/cf/fragments?path=/content/dam/mas/acom/en_US&limit=20&cursor={cursor}
```

### Async Generator Pattern

Studio's fragment store uses an async generator to handle paginated results:

```javascript
async function* searchFragments(params) {
    let cursor = null;
    do {
        const response = await fetchFragments({ ...params, cursor });
        yield response.items;
        cursor = response.cursor;
    } while (cursor);
}
```

This pattern enables progressive loading in the UI, showing results as pages arrive.

## Tags

Fragments use AEM tags for categorization and filtering. MAS defines several tag namespaces:

### Tag Namespaces

| Namespace | Pattern | Examples |
|-----------|---------|----------|
| Product code | `mas:product_code/{code}` | `mas:product_code/phsp`, `mas:product_code/ilst` |
| Variant | `mas:variant/{variant}` | `mas:variant/catalog`, `mas:variant/plans` |
| Status | `mas:status/{status}` | `mas:status/draft`, `mas:status/published` |
| Customer segment | `mas:customer_segment/{segment}` | `mas:customer_segment/individual`, `mas:customer_segment/team` |

Tags enable filtering in Studio's search interface and are used by consumer surfaces to query relevant cards.

## CSRF Tokens

Write operations (create, update, delete, publish) require a CSRF token to prevent cross-site request forgery.

### Token Lifecycle

1. Studio requests a CSRF token from AEM on initial authentication
2. The token is included in the `CSRF-Token` header for all write requests
3. If a write request returns 403, Studio automatically refreshes the CSRF token
4. The refreshed token is used for the retried request and subsequent operations

This auto-refresh mechanism is transparent to the user.

## Version History

AEM maintains version history for fragments:

### List Versions
```
GET /adobe/sites/cf/fragments/{fragmentId}/versions
```

### Create Version
```
POST /adobe/sites/cf/fragments/{fragmentId}/versions
{
  "label": "Before price update",
  "comment": "Saving state before Q4 pricing changes"
}
```

### Restore Version
```
POST /adobe/sites/cf/fragments/{fragmentId}/versions/{versionId}/restore
```

Studio exposes version history in the fragment editor, allowing users to view previous states and restore if needed.

## Environment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | https://author-p22655-e59433.adobeaemcloud.com | Live content authoring |
| Stage | https://author-p22655-e59471.adobeaemcloud.com | Pre-production testing |
| QA | https://author-p22655-e155390.adobeaemcloud.com | Quality assurance |

Studio connects to the production environment by default. Stage and QA environments are used for testing new features and validating changes before release.

## Troubleshooting

### Fragment Not Saving

- Check browser console for 409/412 errors (ETag conflict)
- Verify IMS token is still valid (401 means expired)
- Ensure CSRF token is current (403 may indicate stale CSRF)
- Confirm network connectivity to the AEM author instance

### Fragment Not Appearing After Publish

- Publishing propagates to CDN within minutes
- Check that the fragment status shows PUBLISHED in Studio
- Verify the fragment path matches what consumer surfaces expect
- CDN cache may take a few minutes to update

### Search Returns No Results

- Verify the search path is correct for the surface and locale
- Check that fragments exist in the specified location
- Ensure your IAM groups grant access to the searched surface
- Try broadening the search filters
