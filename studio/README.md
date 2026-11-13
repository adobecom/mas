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

## Optional features

MASA and Offers are enabled in `studio.html`. Disable either independently by setting its metadata content to `false`; set it to `true` to re-enable:

- `mas-assistant-enabled`: MASA page and drawer.
- `mas-offers-enabled`: Offers catalog and product details.

Reload after changing the configuration. Missing flags default to disabled. These are rollout flags, not authorization controls. Disabled features do not import their implementations, load their styles, or initialize their storage. Enabled features load on navigation; the drawer loads only when opened. Storage failures fall back to in-memory chat sessions.

## MASA dashboard

MAS administrators can open **Advanced tools → MASA dashboard** to review usage,
response times, tokens, outcomes and tool performance over 24 hours, 7 days or
30 days. The page uses the existing Studio sign-in and the configured I/O workspace.
Snapshots arrive every five minutes; the last update time and stale-data state are
shown explicitly. Refresh checks for the most recently received snapshot.

The dashboard is separate from the MASA assistant rollout flag. Both navigation and
the Runtime read action require the MAS admin group. See the [Runtime setup](../io/studio/README.md#masa-dashboard)
for deployment and the shared push-secret configuration.
