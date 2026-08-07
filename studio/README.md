# M@S Studio

## AEM(Odin) Proxy

Due to CORS limitations, `proxy-server.mjs` is used as a shared local AEM proxy. Worktrees can run Studio on different local ports while reusing the same proxy.

By default:

- the shared proxy runs on `localhost:8080`
- the IMS relay runs on `localhost:3000`
- each worktree gets its own available `aem up` port at runtime

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

This command:

- starts the shared proxy if it is not already running
- finds an available local port for `aem up`
- prints the worktree Studio URL, including `proxy.port` / `relay.port` params when non-default ports are used
