# MASA investigations in Studio

`MerchAtScaleStudio/masa-api` connects Studio to the shared read-only MASA backend using short JSON
controls. It creates/renews/ends sessions, submits/polls/cancels investigations and obtains upload/download
grants. It is disabled unless `MASA_API_ENABLED=true`, and normal `core`/`assistant` deployments exclude it.
The same Studio PR answers Studio Chat questions with MASA. Until a workspace configures the adapter, those questions get Studio's labelled built-in answer.

The rollout plan is [mas-agent #127](https://github.com/adobecom/mas-agent/pull/127). The matching session
and binary-transfer contracts shipped in [#139](https://github.com/adobecom/mas-agent/pull/139) and
[#140](https://github.com/adobecom/mas-agent/pull/140). The knowledge cutover, Runtime adapter and investigation UI are combined in
[Studio #1414](https://github.com/adobecom/mas/pull/1414), which incorporates the former #1465 adapter branch. Studio continues to own release creation,
editing, publishing and every other write. Slack uses its existing gateway.

## Identity and configuration

The Runtime action remotely validates the IMS access token on **every control request**, then checks the
verified token's `type=access_token`, `client_id` and `user_id`. Only an explicitly admitted pilot subject
can reach MASA. It signs `user_id`, not `sub`, display name or email, in a short-lived Ed25519 assertion.
The assertion binds the configured issuer/audience, conversation, shared internal read surfaces, exact
HTTP method/path/body hash, idempotency key and a fresh nonce. MASA independently validates ownership
and current admission. Cancellation first reads the job and checks its session binding.

Controls reach MASA through the iPaaS API Gateway API `masa_studio_api` ([IPAASOPS-5173](https://jira.corp.adobe.com/browse/IPAASOPS-5173)),
which admits only IMS service tokens. The adapter exchanges the gateway client's permanent authorization code for
a service token, reuses it within a warm container until five minutes before it expires, and sends it in
`Authorization`, without a `Bearer` prefix, with the consumer key in `api_key`. The user's IMS token never leaves the action. MASA's
service token goes in `Target-Authorization`, which the gateway moves into MASA's `Authorization`. The gateway must also pass `X-Masa-User-Assertion`, `Idempotency-Key` and
`Content-Type` through unchanged, strip its route prefix so MASA receives `/v1/...`, and keep the body
byte-for-byte, or the assertion fails.

The current pilot shares MASA's internal read policy. Studio editing permissions do not become a new
fragment-level read ACL. Opening access to every eligible Studio user requires the entitlement increment
in #127; a maintained pilot allowlist is not the final all-user access model.

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
retry the same input/key, never interpret it as an empty answer or a new investigation.

Session results retain server expiry/work/activity fields. Investigations retain findings, evidence,
lists, progress, usage and artifact metadata. Direct `statusUrl`/artifact `downloadUrl` values are omitted;
poll with `investigation.get` and request `transfer.download`. Session-less legacy jobs are excluded.

Grant results include `url`, `method`, `grant`, `expiresAt`, `sessionId`, `status` and, for uploads, the
expected type/bytes/hash. Send the binary request **directly to `url`**, with the current IMS bearer token,
`X-Masa-Transfer-Grant: <grant>` and the upload MIME type where applicable. Never put the grant in a URL.
The gateway revalidates identity and origin. Uploads return the owned attachment ID; downloads return
bytes. Upload retry uses the same descriptor and bytes. A consumed/expired download needs a fresh grant
and a new key. Session end/expiry prevents new transfers regardless of a grant's printed expiry.

The UI keeps grants, bytes and object URLs in memory only. Saved conversations contain findings, original
questions, filenames and opaque lifecycle IDs. An unconfirmed submission also saves its exact textual
input, opaque attachment IDs and idempotency key so an explicit retry after reload checks the same intent.
Session creation keys survive ambiguous responses, including sessions created by an upload before any job.
Saved state contains no IMS tokens, transfer grants, binary files or blob/download URLs.

## Studio experience and local verification

Studio Chat is one conversation; there is no separate Investigate view. Every message still goes to `ai-chat`
first, after the deterministic card-search router. While MASA is available for the page, the request carries
`masa: true` and `ai-chat` may return a question as the `ASK_MASA` intent instead of answering it. Studio then
submits it as a read-only MASA investigation for that conversation and shows "MASA is working on it", with
cancellation, in the thread; the finding, evidence, card links, CSV downloads and PNG previews replace it.
Card search never goes to MASA, and MASA's own card search is not used. Release creation, guided flows,
confirmations and search keep their fast path: the message box stays enabled while MASA works. A second MASA
question in the same conversation is not sent while one is running; the thread says "MASA is still answering
the previous question." and offers "Cancel it". MASA owns findings and evidence. Studio renders results and
opens matching card IDs through its existing editor route. It never interprets a finding as an authoring command.

When MASA cannot answer, Studio asks `ai-chat` again with `masa: false` and shows that answer under "Answered
from Studio's built-in knowledge, MASA unavailable", with "Ask MASA again". A network failure,
`caller-not-allowed`, `surface-not-allowed`, `investigations-disabled`, `masa-disabled`, `masa-not-configured`
or `studio-origin-denied` is remembered for the page session, so later questions are not offered to MASA
and every plain built-in answer carries the same label (clarifying questions, missing-detail prompts,
searches and other Studio action results do not); "Ask MASA again" clears that memory and asks the question again. Busy,
rate-limited and timed-out answers are not remembered. Invalid or oversized questions are shown as an error on the question and do not fall back. A
cancelled question stays cancelled.

Each question carries the Studio path, locale and fragment ID, the most recent conversation turns that fit,
and up to three complete recent findings when they fit the 6,000-character context and control-body budget.
The UI discloses omitted context; it does not truncate displayed findings. Downloads verify byte count and
SHA-256 before exposing a blob.

While an answer is pending, Studio polls it no faster than ten seconds. While the conversation holds an active
lease, Studio renews an idle session at most once per minute and, above the message box, warns within two
minutes of expiry with an explicit renewal action. It honors longer server Retry-After intervals. Hiding the
tab pauses polling and renewal. Closing the drawer stops renewal, but a question that is still being answered
keeps polling until its answer lands. Neither cancels accepted backend work, and an answer that lands after a
switch or a reopened drawer is shown in its own conversation. Reload resumes
pending jobs; a question whose answer a reload cut off offers "Ask MASA again". Previously
loaded files are not restored from browser storage; their names remain as unavailable placeholders. Backend
expiry still controls transfer access.

Ending a session clears file memory and revokes object URLs. Deleting a conversation or explicitly
signing out first ends its known server sessions; a failed end keeps the conversation/credentials so the
user can retry. A session MASA never confirmed creating (for example where `masa-api` is not deployed) is not
created again just to end it, so it never blocks sign-out or deletion. Closing the browser or external IMS
expiry cannot send a guaranteed end request; the server lease timeout provides cleanup. Findings remain available as saved text after file expiry.

To test the UI without credentials or deployments, run from `studio`:

```bash
npx web-test-runner --config web-test-runner.config.mjs --files 'test/mas-chat/investigation.test.html' --watch
```

The HTML test page contains labelled, inspectable running/completed/expired/fallback scenarios.
Append `?demo` when opening it through a local server with npm module resolution to inspect the fixtures
without starting assertions. It uses simulated responses and sends no live MASA or Slack traffic.

For file transfers, set the media origin in `studio.html`:

```html
<meta name="masa-media-origin" content="https://YOUR-EXACT-MEDIA-ORIGIN" />
```

The media origin must exactly match `MASA_MEDIA_BASE_URL`, without a trailing slash. Controls use the
existing `io-base-url` environment and `/masa-api.http`. A mismatched media destination is rejected
before IMS credentials are sent. Leave it empty until the stage deployment gate below.

## Limits and remaining rollout gates

Controls accept at most 20,480 incoming JSON bytes, sign at most 16,384 upstream bytes and allow at most
512,000 response bytes, including the Runtime response wrapper. IMS validation has a five-second limit;
the complete upstream sequence has a 45-second limit, including response body reads. The action is
configured for 60 seconds. Oversized findings return `masa-response-too-large`; they are never silently
truncated. Result paging is needed before exposing findings above this limit.
[Runtime system limits](https://developer.adobe.com/app-builder/docs/guides/runtime_guides/system-settings).

This action intentionally has no synchronous fresh-card-search route: MASA's current search can take
95 seconds. The asynchronous search increment remains a prerequisite for that UI cutover. The API's
current one-investigation worker, shared request allowance and pilot admission also remain unchanged.
The 100-user / 5–10 simultaneous-user target is not qualified by these contract tests.

## Validation and separate deployment

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

For a later approved stage deployment, select the intended Runtime workspace using the existing
[workspace setup](README.md), provision the inputs above and verify that the independently deployed
MASA API/media ingress uses matching identity policy. Then deploy only this action:

```bash
node scripts/deploy-actions.mjs masa
```

Never use an unfiltered deployment to activate this integration. The `core` and `assistant` CI groups
exclude it even when MASA secrets exist in the workspace configuration. To disable a deployed adapter,
set `MASA_API_ENABLED=false` and redeploy the `masa` group.

Before enabling the UI, verify the deployed action's `raw-http`, `final` and `web-custom-options`
annotations, actual IMS admission, preflight, signed session lifecycle, idempotent retries, origin/user
denials, 5-MB direct transfers, expiry/revocation and long-running polling in a real browser. Follow with
entitlement, asynchronous search, response-size and mixed-load capacity gates from #127. Local fixture
tests and a successful action build do not establish those deployed guarantees.
