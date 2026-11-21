# M@S Studio

## AEM(Odin) Proxy

Due to CORS limitations, `proxy-server.mjs` provides the local AEM proxy used by Studio.

MAS Studio can be developed with the following markup using the proxy.

```html
<mas-studio base-url="http://localhost:8080"></mas-studio>
```

### running the proxy

```
npm run proxy
```

The proxy points to the Odin PROD bucket (`author-p22655-e59433`) and it can be changed in `package.json`.

### running studio from a worktree

From the repo root:

```
npm run studio
```

This starts the proxy and `aem up`. Use `npm run studio:qa` or `npm run studio:stage` for the corresponding author environment.

## Publishing promotions

Publishing a promotion keeps the **Publish promo variations** checkbox. When selected, Studio creates one existing Bulk Publish project per surface containing all attached unpublished promo variations, including modified variations. Known content validation errors are warnings, not reasons to omit a variation.

Studio first confirms acceptance of the promotion publish request, then creates and starts each surface's Bulk Publish project independently. A creation, variation-preparation or start failure does not undo the promotion request or prevent other surfaces from proceeding. Promotion validation, permission and revision errors still stop the flow before any Bulk Publish projects are created. There is no direct variation-publish fallback, automatic retry or rollback of published content.

Newly created, unused drafts are deleted when preparation fails before dispatch or dispatch is explicitly rejected. Cleanup checks that the project is still the same unchanged Draft revision and uses its ETag when deleting. Accepted requests, unknown acceptance (including lost responses), and changed projects are retained for inspection. Creation responses that cannot identify the project are not guessed or blindly deleted; check the project list before retrying. Cleanup failures are reported with the retained project link, while successfully deleted projects have no result link.

Promotion-driven requests publish only the promotion and planned variations, not their referenced default cards or collections. This requires the `publishReferences: false` contract in both the `bulk-publish` dispatcher and worker; deploy both actions to Studio's configured `io-base-url` before relying on this behavior. Manually started Bulk Publish projects retain their existing reference-publication policy.

Bulk Publish item metadata uses `resolved` (**Fragment found**) for successful target lookup, not content validation. Existing `valid` metadata remains readable. The IO items-only project fallback accepts both statuses; deploy the updated worker when using newly serialized items-only projects. Content validation warnings do not exclude these targets.

Staged flags are cleared from freshly fetched variation content using its matching ETag before its surface's dispatch. Promotion publishing retains the confirmed revision, or the revision produced by its own staged-tag save. Concurrent changes stop the affected request instead of overwriting newer content. Staged saves are not transactional: flags already cleared before a later preparation or dispatch failure are not restored automatically.

Post-save checks use the same field serialization as AEM saves and the requested native tag IDs, so normal reference normalization and staged-tag removal are not mistaken for concurrent changes. Native tag reads and writes must succeed with a confirmed tag revision. A different fragment, missing saved revision or changed content still stops publishing.

The result dialog provides retained project links in the current Studio environment. Clicking a project link opens it in a new tab, keeping the promotion view open; tabs do not open automatically. **Request accepted** does not mean AEM/Odin publishing has completed; use the existing Bulk Publish project to inspect results and perform follow-up actions. Per-surface creation, preparation, start and cleanup errors also appear at the top of the promotion view. The promotion and each Bulk Publish project keep their own actual publishing status; a failure is never presented as completed publishing.

After confirming Publish, keyboard focus moves into the progress area so Escape cannot dismiss the dialog while requests are in progress.

Cancel and Escape are available during read-only target lookup. Cancelling immediately closes the dialog and invalidates that request; late lookup responses cannot overwrite a reopened dialog or start publishing. Once submission starts, cancellation remains disabled. View errors and publish errors are independent, so a successful publish does not erase an unrelated view error.

The post-result refresh does not replace newer edits, a different promotion, or an editor that has been disconnected.

Background Bulk Publish tracking and duplicate-request protection continue after navigation. Tracking warnings and errors are shown only while the originating page and project remain active; leaving and returning does not restore notifications from the old request. Navigation does not cancel backend publishing.

Scheduled promotions create and start these projects immediately when Publish is confirmed. Clearing the checkbox publishes only the promotion. Existing promotion permissions and Bulk Publish access rules are unchanged.

## Optional features

MASA and Offers are enabled in `studio.html`. Disable either independently by setting its metadata content to `false`; set it to `true` to re-enable:

- `mas-assistant-enabled`: MASA page and drawer.
- `mas-offers-enabled`: Offers catalog and product details.

Reload after changing the configuration. Missing flags default to disabled. These are rollout flags, not authorization controls. Disabled features do not import their implementations, load their styles, or initialize their storage. Enabled features load on navigation; the drawer loads only when opened. Storage failures fall back to in-memory chat sessions.
