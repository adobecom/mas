# Repository instructions for GitHub Copilot

This repository is a monorepo managed with npm workspaces. Follow the conventions below when making changes.

## Commands

```sh
npm i                   # Install all workspaces
npm run build           # Build all workspaces
npm run lint            # ESLint with auto-fix
npm run format          # Prettier formatting
npm test                # Unit tests across all workspaces
npm run studio          # Local dev server with AEM proxy
```

### Per-workspace tests

```sh
# web-components
cd web-components && npm test         # Unit tests (Web Test Runner)
cd web-components && npm run test:ci  # CI mode

# studio
cd studio && npm run test             # Watch mode
cd studio && npm run test:ci          # One-shot CI mode

# io/studio (Node.js >=22 required)
cd io/studio && npm test
cd io/studio && npm run test:coverage
```

### E2E tests (Nala / Playwright)

```sh
npx playwright install              # One-time setup
export IMS_EMAIL=<val>
export IMS_PASS=<val>               # Use @adobetest.com credentials from colleagues
npm run nala local                  # Run locally
npm run nala MWPW-160756            # Run on branch
npm run nala MWPW-160756 mode=ui    # UI mode
```

## Repository structure

The npm workspaces are:

- `web-components/` — Core Lit-based merchandising component library (`@adobecom/mas`). Built with esbuild into `dist/mas.js`. Components include merch-card, catalog, checkout-link, price, and commerce service integrations.
- `studio/` — M@S Studio authoring tool (`@adobecom/mas-studio`). Lit web component for creating/editing merch fragments in Adobe Experience Manager. Has its own AEM proxy server for local dev.
- `io/studio/` — Adobe I/O Runtime serverless backend. Node.js >=22 required. Integrates with OST (Offer Service Tier) and WCS (Web Commerce Services). Tested with Mocha.
- `ost/` — Offer Service Tier integration.
- `scripts/content/` — Content-related automation scripts.

Other top-level areas include `io/www/` (a Node.js >=22 service), `nala/` (Playwright E2E tests), and `da/` (Document API content).

### Studio internal structure (`/studio`)

| Folder          | Purpose                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| `common/`       | Main views, top bar, constants, fields, repository interaction, store, utils |
| `fragments/`    | Views and models for fragments view                                          |
| `placeholders/` | Views and models for placeholders view                                       |
| `promotions/`   | Views and models for promotions view                                         |
| `translation/`  | Views and models for translation view                                        |

## Code style

- Modern JavaScript only — no TypeScript.
- Use `const`/`let`, arrow functions, optional chaining (`?.`), nullish coalescing (`??`), destructuring, template literals.
- `async/await` over `.then()` chains; `for...of` over `.forEach()`; early returns over nested conditionals.
- No defensive code: no runtime type checks, no `typeof` guards, no `method && method()` patterns, no `try/catch` unless there is a known recoverable failure mode.
- Prefer named exports over default exports. Barrel `index.js` files re-export only — no logic.
- Co-locate related code; avoid scattering logic across many tiny utility files.
- Always follow Prettier rules — single quotes, 4-space indent, 128-char line width (root); single quotes, 4-space indent (web-components). Write code that passes `npm run format` without changes.

## Web Components (Lit + Adobe Spectrum)

- Use Lit for all custom elements with reactive properties (`static properties`).
- Use `render()` for declarative templates — no imperative DOM manipulation.
- Use getters (for example `get headerTemplate()`) for rendering HTML sections, not `renderXyz()` methods.
- Only use per-item render functions when iterating over a list.
- Use Adobe Spectrum Web Components (`@spectrum-web-components/*`) for UI primitives. Do not reinvent what Spectrum provides.
- CSS via `static styles` and CSS custom properties — avoid inline styles. Use `styleMap`/`classMap` for dynamic styles.
- Dispatch custom events (not callbacks) for child-to-parent communication.
- In Lit components, use `willUpdate()` for derived state — avoid computing in `render()`.

## Testing

Web component unit tests primarily live in `*.test.js` files and run with Web Test Runner; `studio` tests use `*.test.html` pages. The I/O workspaces use Mocha. Test meaningful behavior and visual states — not implementation details.

Coverage thresholds enforced: 85% branches/statements/lines, 65% functions (web-components); similar thresholds in studio.

## Branch naming

Feature branches must follow the format `MWPW-XXXXXX` (Jira ticket number). IMS client regex check will fail and sign-in will break otherwise.

## Environments

- Preview: https://main--mas--adobecom.aem.page/
- Live: https://main--mas--adobecom.aem.live/

## Node version

- Node 20 for most development (`.nvmrc`).
- Node >=22 for `io/studio` and `io/www`.
