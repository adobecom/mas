# MASA API adapter (`masa-api`)

`MerchAtScaleStudio/masa-api` connects Studio Chat to the shared read-only MASA backend using short JSON
controls. It creates/renews/ends sessions, submits/polls/cancels MASA questions (the `investigation.*`
operations) and obtains upload/download grants. It is disabled unless `MASA_API_ENABLED=true`, and normal
`core`/`assistant` deployments exclude it. Where it is not configured, Studio answers from its built-in
knowledge and labels the answer. Studio keeps every write; Slack uses its own gateway.

## Identity and configuration

The Runtime action remotely validates the IMS access token on **every control request**, then checks the
verified token's `type=access_token`, `client_id` and `user_id`. Only an explicitly admitted pilot subject
can reach MASA. It signs `user_id`, not `sub`, display name or email, in a short-lived Ed25519 assertion.
The assertion binds the configured issuer/audience, conversation, shared internal read surfaces, exact
HTTP method/path/body hash, idempotency key and a fresh nonce. MASA independently validates ownership
and current admission. Cancellation first reads the job and checks its session binding.

Controls reach MASA through the iPaaS API Gateway API `masa_studio_api`, which admits only IMS service
tokens. The adapter exchanges the gateway client's permanent authorization code for a service token, reuses
it within a warm container until five minutes before it expires, and sends it in `Authorization`, without a
`Bearer` prefix, with the consumer key in `api_key`. The user's IMS token never leaves the action. MASA's
service token goes in `Target-Authorization`, which the gateway moves into MASA's `Authorization`. The
gateway must also pass `X-Masa-User-Assertion`, `Idempotency-Key` and `Content-Type` through unchanged,
strip its route prefix so MASA receives `/v1/...`, and keep the body byte-for-byte, or the assertion fails.

The pilot shares MASA's internal read policy; Studio editing permissions do not become a fragment-level
read ACL.

Provision the following **action inputs** through protected deployment configuration. Values are never
accepted from browser JSON, query parameters or identity assertions supplied by the browser. Secret
inputs use Runtime's encrypted default parameters with `final: true`; raw HTTP mode keeps the body
separate from those defaults. The action performs its own IMS verification (`require-adobe-auth: false`).
[Adobe action parameters](https://developer.adobe.com/app-builder/docs/guides/runtime_guides/creating-actions)
and [OpenWhisk raw web actions](https://github.com/apache/openwhisk/blob/master/docs/webactions.md).

| Input                                  | Required value when enabled                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `MASA_API_ENABLED`                     | Exactly `true`; missing/empty/false leaves the endpoint disabled                                                               |
| `MASA_API_BASE_URL`                    | HTTPS origin of the MASA control ingress, plus the gateway's route prefix if any; no trailing slash                            |
| `MASA_MEDIA_BASE_URL`                  | Exact HTTPS origin of the browser-reachable media ingress                                                                      |
| `MASA_API_SERVICE_TOKEN`               | MASA's `STUDIO_API_SERVICE_TOKEN`; 43–256 URL-safe characters                                                                  |
| `MASA_IDENTITY_PRIVATE_KEY_B64`        | Base64 of a PEM Ed25519 private key; MASA loads its public half from `STUDIO_API_IDENTITY_PUBLIC_KEY_PATH`                     |
| `MASA_API_ISSUER`, `MASA_API_AUDIENCE` | Match MASA's `STUDIO_API_ISSUER` and `STUDIO_API_AUDIENCE`                                                                     |
| `MASA_PILOT_USERS`                     | Comma-separated verified IMS `user_id` values, 1–100; match the admitted MASA pilot cohort                                     |
| `MASA_READ_SURFACES`                   | Comma-separated shared internal surfaces, e.g. `acom,ccd`; must be admitted by `STUDIO_API_SURFACES`                           |
| `MASA_STUDIO_ORIGINS`                  | Exact browser origins, 1–8, also admitted by `STUDIO_API_MEDIA_ORIGINS`; HTTPS except HTTP localhost/127.0.0.1 for development |
| `MASA_IMS_ENVIRONMENT`                 | `prod` or `stage`; match `STUDIO_API_MEDIA_IMS_ENVIRONMENT`                                                                    |
| `MASA_IMS_CLIENT_ID`                   | Exact Studio IMS client; match `STUDIO_API_MEDIA_IMS_CLIENT_ID`                                                                |
| `MASA_GATEWAY_IMS_ENVIRONMENT`         | `prod` or `stage`: the IMS that issues the gateway service token, independent of `MASA_IMS_ENVIRONMENT`                        |
| `MASA_GATEWAY_CLIENT_ID`               | IMS service client on the gateway's client ID allowlist; its tokens must carry the `system` scope                              |
| `MASA_GATEWAY_CLIENT_SECRET`           | That service client's secret                                                                                                   |
| `MASA_GATEWAY_AUTH_CODE`               | That service client's permanent authorization code                                                                             |
| `MASA_GATEWAY_API_KEY`                 | iPaaS consumer API key for the gateway environment                                                                             |

Use separate stage and production credentials. The GitHub Apps' private keys are unrelated to this
Ed25519 identity key. Never place the service token/private key in browser code, chat history, screenshots
or command-line arguments. The adapter logs only generated request IDs, operation, status and duration.
Backend failure text is replaced with fixed public messages; successful responses containing transport
credentials are rejected.

## Browser contract

POST normal JSON to the deployed web action's `.http` URL, with `Authorization: Bearer <IMS access token>`
and `Content-Type: application/json`. The browser supplies its `Origin`; it must exactly match the
configured list. Do not use the `.json` response extension, which bypasses the HTTP response envelope.
Runtime supplies the action's raw `__ow_body` as base64; the browser must **not** base64-wrap its JSON.
No query parameters or extra URL suffixes are supported. The custom preflight handler permits only POST
with `authorization` and `content-type`. All responses use `Cache-Control: no-store`.

Every control has `formatVersion: 1`, an `operation` and a stable `conversationId` (1–200 non-whitespace
characters). A conversation ID is a namespace within the verified user's ownership, not an authorization
credential. Store the returned opaque session/investigation IDs separately from display names.

```json
{
    "formatVersion": 1,
    "operation": "session.create",
    "conversationId": "studio-conversation-123",
    "idempotencyKey": "a-new-uuid-for-this-intent"
}
```

| Operation                                     | Additional JSON fields                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| `session.create`                              | `idempotencyKey`                                                               |
| `session.get`, `session.renew`, `session.end` | `sessionId`                                                                    |
| `investigation.submit`                        | `sessionId`, `idempotencyKey`, `question`; optional `context`, `attachmentIds` |
| `investigation.get`, `investigation.cancel`   | `sessionId`, `investigationId`                                                 |
| `transfer.upload`                             | `sessionId`, `idempotencyKey`, `mimetype`, `bytes`, `sha256`                   |
| `transfer.download`                           | `sessionId`, `idempotencyKey`, `investigationId`, `artifactId`                 |

Other fields are rejected. Questions/context are each at most 6,000 characters, subject to the combined
16-KiB upstream body limit. Attachments are at most three distinct owned `att_…` IDs. Upload descriptors
allow PNG/JPEG/GIF/WebP, 1–5,000,000 bytes and the lower-case SHA-256 of the exact bytes to upload.
An idempotency key is 16–128 URL-safe characters. Reuse the same key and exact input after an ambiguous
network failure; use a new key for a new intent. Runtime does not automatically retry an upstream call.
Each caller retry gets a fresh signed nonce. Honour `Retry-After` on busy/pending responses.

Successes retain the backend HTTP status (200/201/202) and return
`{ formatVersion: 1, requestId, result }`. Errors return
`{ formatVersion: 1, requestId, error: { code, message } }`. Common responses are 401 for invalid IMS,
403 for admission/origin denial, 409 for conflicting keys/scope, 410 for ended/expired media sessions,
429 for capacity, and 503 for disabled/unavailable services. A 502/504 submission result may be ambiguous:
retry the same input/key, never interpret it as an empty answer or a new question.

Session results retain server expiry/work/activity fields. Question results retain findings, evidence,
lists, progress, usage and artifact metadata. Direct `statusUrl`/artifact `downloadUrl` values are omitted;
poll with `investigation.get` and request `transfer.download`. Session-less legacy jobs are excluded.

Grant results include `url`, `method`, `grant`, `expiresAt`, `sessionId`, `status` and, for uploads, the
expected type/bytes/hash. Send the binary request **directly to `url`**, with the current IMS bearer token,
`X-Masa-Transfer-Grant: <grant>` and the upload MIME type where applicable. Never put the grant in a URL.
The gateway revalidates identity and origin. Uploads return the owned attachment ID; downloads return
bytes. A consumed/expired download needs a fresh grant and a new key. Session end/expiry prevents new
transfers regardless of a grant's printed expiry.

Studio sends binary transfers only to the origin in `studio.html`'s `masa-media-origin` meta, which must
exactly match `MASA_MEDIA_BASE_URL` without a trailing slash; any other destination is rejected before IMS
credentials are sent. Controls use the existing `io-base-url` environment and `/masa-api.http`.

## Limits

Controls accept at most 20,480 incoming JSON bytes, sign at most 16,384 upstream bytes and allow at most
512,000 response bytes, including the Runtime response wrapper. IMS validation has a five-second limit;
the complete upstream sequence has a 45-second limit, including response body reads. The action is
configured for 60 seconds. Oversized findings return `masa-response-too-large`; they are never silently
truncated. [Runtime system limits](https://developer.adobe.com/app-builder/docs/guides/runtime_guides/system-settings).

There is no synchronous card-search route: Studio's own search handles cards.

## Validation and deployment

From the repository root:

```bash
npm ci
npx mocha io/studio/test/masa-api/index.test.js
node --test scripts/test/studio-deployment-isolation.test.mjs
npm test --workspace=MerchAtScaleStudio
```

From `io/studio`, building this action needs no production credentials:

```bash
npx aio app build --no-telemetry --action MerchAtScaleStudio/masa-api
```

To deploy, select the Runtime workspace using the existing [workspace setup](README.md), provision the
inputs above, and deploy only this action:

```bash
node scripts/deploy-actions.mjs masa
```

Never use an unfiltered deployment to activate this integration. The `core` and `assistant` CI groups
exclude it even when MASA secrets exist in the workspace configuration. To disable a deployed adapter,
set `MASA_API_ENABLED=false` and redeploy the `masa` group.
