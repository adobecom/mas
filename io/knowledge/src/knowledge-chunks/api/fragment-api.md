# AEM Fragment API

## Overview

The AEM Content Fragment API provides CRUD operations for managing content fragments in MAS Studio. All requests require IMS authentication.

## Base URL

Production: \`https://author-p22655-e155390.adobeaemcloud.com\`
Stage: \`https://author-p22655-eXXXXX.adobeaemcloud.com\`

## Authentication

All requests require IMS token in Authorization header:
\`\`\`
Authorization: Bearer {ims_access_token}
\`\`\`

## Fragment Operations

### Get Fragment
\`\`\`
GET /adobe/sites/cf/fragments/{fragmentId}
\`\`\`
Returns fragment with all fields and metadata.

### Create Fragment
\`\`\`
POST /adobe/sites/cf/fragments
Content-Type: application/json

{
  "title": "Fragment Title",
  "model": "/conf/mas/settings/dam/cfm/models/merch-card",
  "parentPath": "/content/dam/mas/acom/en_US",
  "name": "fragment-name",
  "fields": [...]
}
\`\`\`

### Update Fragment
\`\`\`
PUT /adobe/sites/cf/fragments/{fragmentId}
If-Match: {etag}
Content-Type: application/json

{
  "title": "Updated Title",
  "fields": [...]
}
\`\`\`
Note: ETag header required for optimistic locking.

### Delete Fragment
\`\`\`
DELETE /adobe/sites/cf/fragments/{fragmentId}
\`\`\`

## Search Fragments

### Search by Path
\`\`\`
GET /adobe/sites/cf/fragments?path=/content/dam/mas/acom/en_US
\`\`\`

### Search with Filters
\`\`\`
GET /adobe/sites/cf/fragments?path=/content/dam/mas&model=/conf/mas/settings/dam/cfm/models/merch-card
\`\`\`

## Version Operations

### List Versions
\`\`\`
GET /adobe/sites/cf/fragments/{fragmentId}/versions
\`\`\`

### Create Version
\`\`\`
POST /adobe/sites/cf/fragments/{fragmentId}/versions
{
  "label": "Version Name",
  "comment": "Version description"
}
\`\`\`

### Restore Version
\`\`\`
POST /adobe/sites/cf/fragments/{fragmentId}/versions/{versionId}/restore
\`\`\`

## Publishing

### Publish Fragment
\`\`\`
POST /adobe/sites/cf/fragments/{fragmentId}/publish
\`\`\`

### Unpublish Fragment
\`\`\`
POST /adobe/sites/cf/fragments/{fragmentId}/unpublish
\`\`\`

## Common Response Codes

- **200**: Success
- **201**: Created
- **400**: Bad request (validation error)
- **401**: Unauthorized (invalid/expired token)
- **403**: Forbidden (insufficient permissions)
- **404**: Fragment not found
- **409**: Conflict (ETag mismatch)
- **412**: Precondition failed (ETag mismatch)

## Error Handling

### ETag Conflicts
If you receive 409/412, the fragment was modified by another user:
1. Fetch latest fragment
2. Get new ETag from response headers
3. Retry update with new ETag

### Token Refresh
IMS tokens expire. Implement refresh logic:
1. Catch 401 errors
2. Refresh IMS token
3. Retry request
