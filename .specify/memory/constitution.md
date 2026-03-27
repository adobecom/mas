# MAS (Merch at Scale) Constitution

## Project Identity

**Name**: MAS (Merch at Scale)
**Type**: Adobe Commerce Platform - Web Components & Studio
**Stack**: Lit, Spectrum Web Components, Adobe I/O Runtime, Playwright
**Language**: Vanilla JavaScript (ES Modules) - No TypeScript

---

## I. Architecture Principles

### 1. Monorepo Structure
The project is organized as an npm workspace monorepo with clear boundaries:

| Workspace | Purpose | Entry Point |
|-----------|---------|-------------|
| `web-components/` | Canonical MAS web components | `src/mas.js` |
| `studio/` | Content management UI | `src/index.html` |
| `io/` | Adobe I/O Runtime backend | `www/`, `studio/` |
| `nala/` | E2E test framework | `utils/nala.run.js` |

### 2. Web Component Patterns

**Lit Components**:
- Import from `'lit'` (e.g., `import { LitElement, html, css } from 'lit'`)
- Use static `properties` object for reactive properties
- Register with `customElements.define()` at file bottom

**Light DOM (Studio)**:
```javascript
createRenderRoot() {
    return this;
}
```

**Naming Conventions**:
- Web components: `merch-*` prefix (e.g., `merch-card`, `merch-icon`)
- Studio components: `mas-*` prefix (e.g., `mas-fragment`, `mas-toast`)
- Custom events: `EVENT_*` constants in `constants.js`

**Event Handling Standards**:

*Global Event Listeners (click-outside, dismiss patterns)*:
- Use `window` (not `document`) for global event listeners
- Bind handlers in constructor: `this.handleClickOutside = this.handleClickOutside.bind(this)`
- Register in `connectedCallback()`, remove in `disconnectedCallback()`
- Use `composedPath()` for click-outside detection (shadow DOM aware)
- Never use inline arrow functions for global listeners (can't be removed)

```javascript
// Standard click-outside pattern
constructor() {
    super();
    this.handleClickOutside = this.handleClickOutside.bind(this);
}

connectedCallback() {
    super.connectedCallback();
    window.addEventListener('mousedown', this.handleClickOutside);
}

disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('mousedown', this.handleClickOutside);
}

handleClickOutside(event) {
    const path = event.composedPath();
    if (!path.includes(this)) {
        this.close();
    }
}
```

*Custom Events*:
- Define event names as constants in `constants.js`
- Always include `bubbles: true` and `composed: true` for cross-shadow-DOM events
- Dispatch via `this.dispatchEvent(new CustomEvent(EVENT_NAME, { bubbles: true, composed: true }))`

### 3. State Management

**ReactiveStore Pattern** (`/studio/src/reactivity/`):
- `ReactiveStore` - Base class with `get()`, `set()`, `subscribe()`
- `StoreController` - Single store binding for Lit components
- `ReactiveController` - Multiple store monitoring
- `FragmentStore` - Wraps Fragment with reactive updates

**Global Store** (`/studio/src/store.js`):
- Nested reactive stores with validators
- Access via `Store.fragments.inEdit`, `Store.filters`, etc.

### 4. Fragment Model

**Core Pattern** (`/studio/src/aem/fragment.js`):
- `hasChanges` flag tracks modifications
- `getField()`, `getFieldValue()`, `updateField()` for field access
- `discardChanges()` resets to `initialValue`
- Unicode normalization (NFC) for special characters

**Variation Rules**:
- One variation per locale per fragment
- Use `localeDefaultFragment` (not `parentFragment`)
- Base `isVariation()` on `previewFragmentForEditor` data
- Access parent via `context.fragmentIds['default-locale-id']`

---

## II. Clean Code (Non-Negotiable)

Every change must leave code cleaner than before:

- Remove unused functions, variables, constants, imports
- No commented-out code (unless important TODOs)
- No console.logs (unless intentional)
- Always run linter on modified files
- Search all references before considering complete

---

## III. Generic Over Specific

Code must be generic and decoupled from specific field values or variant names:

```javascript
// BAD - Hardcoded variant fallback
if (!fieldsObject.variant) {
    fieldsObject.variant = 'catalog';
}

// GOOD - Generic handling
fieldsObject[field.name] = field.multiple ? field.values : field.values[0];
```

- Never hardcode variant-specific values in fallback logic
- Use configuration objects for default values
- Field handling must be generic
- Let consumers handle missing values

---

## IV. No Logic Duplication

Maintain a single source of truth:

- Do not duplicate variation logic from mas/io
- Use `previewFragmentForEditor` for variation detection
- Base `isVariation()` on data from editor stores
- Access parent info via `context.fragmentIds['default-locale-id']`
- Use `localeDefaultFragment` naming instead of `parentFragment`
- Return full context objects to support future needs

---

## V. Focused PRs

Pull requests must be small, focused, and easy to review:

- Keep PRs focused on specific changes
- Avoid unrelated file modifications
- Smaller PRs are easier to review and less prone to bugs
- Confirm with user before committing changes
- One logical change per PR when possible

---

## VI. Code Style Standards

### 1. Naming & Syntax
- No underscore prefix for variables (`_var` -> `var` or `#privateField`)
- Use getters instead of `querySelector()` for DOM access
- No inline styles in HTML tags
- No inline comments unless logic is complex
- No TypeScript - vanilla JavaScript only
- ESM modules preferred

### 2. CSS Patterns
**CSS-in-JS Files** (`.css.js`):
```javascript
import { css } from 'lit';
export const styles = css`
    :host {
        --my-custom-property: value;
    }
`;
```

**Design Tokens**:
- Use `--consonant-merch-*` for MAS tokens
- Use `--spectrum-*` for Spectrum tokens
- NEVER use `::part` selectors on Spectrum components
- Use CSS custom properties for theming

### 3. Spectrum Web Components
- Add imports to `/studio/src/swc.js` centralized registry
- NEVER import Spectrum components directly in files
- Use Context7 MCP to verify component APIs
- Use component attributes/properties for styling
- Use Spectrum's built-in theming system

---

## VII. Testing Standards

### 1. NALA E2E Tests (`/nala/`)
**Structure**:
```
feature/
├── tests/feature_*.test.js  # Playwright tests
├── specs/feature_*.spec.js  # Test data/features
└── feature.page.js          # Page object
```

**Required Ports**:
- 8080: AEM server (`aem up`)
- 3000: Proxy server (`npm run proxy`)
- 3030: MAS components (`?maslibs=local`)

### 2. Unit Tests (Web Test Runner)
**Location**: `studio/test/`, `web-components/test/`
**Libraries**: Chai assertions, Sinon mocks

**Coverage Thresholds** (web-components):
- Branches: 85%
- Functions: 65%
- Statements: 85%
- Lines: 85%

---

## VIII. Minimal Implementation (YAGNI)

Implement only what is explicitly required:

- If 3-line solution works, don't write 30 lines
- No helper functions for single-use operations (inline instead)
- No abstractions without 3+ concrete uses
- No "just in case" error handling for impossible scenarios
- No configurable parameters for values that never change
- Prefer deletion over addition when fixing bugs
- Question every new function: "Why can't this be inline?"

---

## IX. Root Cause First

Before fixing anything, investigate and understand the root cause:

- Read and understand code before proposing changes
- Ask "why does this happen?" at least 3 times to find root cause
- Document the root cause in your analysis before implementing
- Never add workarounds (setTimeout, retry loops) without understanding why
- If the fix feels like a band-aid, it probably is—investigate deeper
- Spend 70% of time understanding, 30% implementing

---

## X. Development Workflow

### 1. Local Development
```bash
npm run studio          # Start studio (ports 8080, 3000)
npm run libs            # Build components (port 3030)
npm run lint            # ESLint with auto-fix
npm run format          # Prettier formatting
```

### 2. URL Parameters
- `?maslibs=local` - Local MAS components
- `?maslibs=branch-name` - Branch MAS components
- `?milolibs=local` - Local Milo features (non-MAS only)

### 3. Git Workflow
- Branch naming: `MWPW-XXXXXX` (Jira ticket)
- Keep PRs small and focused
- Confirm before committing

### 4. PR Description Template (MANDATORY)

When creating PRs, ALWAYS use this format:

```
Resolves https://jira.corp.adobe.com/browse/{BRANCH_NAME}

{Short description of the ticket and changes}

## Test URLs:

- Before: https://main--{repo}--{org}.aem.live/
- After: https://{branch-name-lowercase}--{repo}--{org}.aem.live/

## Screenshots (if applicable):

{Add before/after screenshots for visual changes}

## Checklist:

- [ ] Code follows project conventions
- [ ] Tests pass locally
- [ ] Linter runs without errors
- [ ] Tested on Before/After URLs
```

**Rules:**
- Replace `{BRANCH_NAME}` with the actual Jira ticket (e.g., `MWPW-183848`)
- Replace `{branch-name-lowercase}` with lowercase branch name (e.g., `mwpw-183848`)
- Replace `{repo}` with repository name (e.g., `mas`, `milo`)
- Replace `{org}` with org name (e.g., `adobecom`)
- Include a concise description of what the PR accomplishes
- Always include both Before/After test URLs
- Add screenshots for any visual/UI changes

---

## XI. File Organization

### Key Files
| File | Purpose |
|------|---------|
| `web-components/src/mas.js` | Main entry, variant registration |
| `studio/src/swc.js` | Spectrum component registry |
| `studio/src/store.js` | Global state management |
| `studio/src/constants.js` | Event names, config values |

### Import Order
1. External libraries (`lit`, `@spectrum-web-components/*`)
2. Internal utilities (`./reactivity/*`, `./utils/*`)
3. Components (`./mas-*.js`, `./fields/*`)
4. Styles (`*.css.js`)
5. Constants (`./constants.js`)

---

## XII. Anti-Patterns (Never Do)

| Pattern | Why Bad | Do Instead |
|---------|---------|------------|
| `::part` selectors | Breaks encapsulation | CSS custom properties |
| `setTimeout` workarounds | Hides root cause | Fix timing issue |
| Underscore prefix | Convention violation | Private fields `#` |
| Direct Spectrum import | Breaks bundling | Import via `swc.js` |
| Hardcoded variant fallback | Couples to specific values | Generic field handling |
| TypeScript | Project standard | Vanilla JavaScript |
| Inline comments | Code should self-document | Clearer code |

---

## Governance

### Amendment Process
- Amendments require explicit user approval
- Version incremented per semantic versioning:
  - MAJOR: Principle removal/redefinition
  - MINOR: New principle or material expansion
  - PATCH: Clarifications, wording refinements

### Compliance
- All PRs must verify constitution compliance
- Code reviews check for principle violations
- Use pre-implementation checklist before coding
- Reference CLAUDE.md for runtime development guidance

---

**Version**: 2.1.0 | **Ratified**: 2025-01-05 | **Last Amended**: 2026-01-06
