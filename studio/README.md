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

All projects must be created before the promotion publish request and automatic Bulk Publish requests begin. A creation failure stops publishing; there is no direct variation-publish fallback or automatic rollback. Created projects remain available for inspection.

The result dialog provides project links in the current Studio environment. Clicking a project link opens it in a new tab, keeping the promotion view open; tabs do not open automatically. **Request accepted** does not mean AEM/Odin publishing has completed; use the existing Bulk Publish project to inspect results and perform follow-up actions. Errors also appear at the top of the promotion view.

After confirming Publish, keyboard focus moves into the progress area so Escape cannot dismiss the dialog while requests are in progress.

Scheduled promotions create and start these projects immediately when Publish is confirmed. Clearing the checkbox publishes only the promotion. Existing promotion permissions and Bulk Publish access rules are unchanged.

## Optional features

MASA and Offers are enabled in `studio.html`. Disable either independently by setting its metadata content to `false`; set it to `true` to re-enable:

- `mas-assistant-enabled`: MASA page and drawer.
- `mas-offers-enabled`: Offers catalog and product details.

Reload after changing the configuration. Missing flags default to disabled. These are rollout flags, not authorization controls. Disabled features do not import their implementations, load their styles, or initialize their storage. Enabled features load on navigation; the drawer loads only when opened. Storage failures fall back to in-memory chat sessions.
