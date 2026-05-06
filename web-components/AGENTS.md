# AGENTS.md

Rules for AI agents working in this codebase.

## Code Style

- Write modern JavaScript only. No TypeScript.
- Use `const`/`let`, arrow functions, optional chaining, nullish coalescing, destructuring, and template literals.
- Do NOT write defensive code: no runtime type checks, no `typeof` guards, no `method && method()` patterns.
- Do NOT check if a method or property exists before calling it.
- Do NOT add `try/catch` blocks unless the operation has a known, recoverable failure mode.
- Prefer `async/await` over `.then()` chains.
- Prefer `for...of` over `.forEach()`.
- Prefer early returns over deeply nested conditionals.

## Web Components

- Use [Lit](https://lit.dev/) for all custom elements.
- Follow Lit best practices:
    - Use reactive properties (`static properties`) with appropriate defaults.
    - Use `render()` for declarative templates; avoid imperative DOM manipulation.
    - Keep components small and composable.
    - Use CSS custom properties and `static styles` for styling; avoid inline styles in templates.
    - When dynamic styles are necessary, use Lit directives like `styleMap` or `classMap` instead of template literal interpolation.
    - Dispatch custom events for child-to-parent communication.
    - Use **getters** (e.g., `get headerTemplate()`) for rendering HTML sections, not `renderXyz()` methods.
    - Only use per-item render functions when iterating over a list (e.g., `renderItem(item)`).
    - Use slots for content projection where appropriate.

## Performance

- Write performant code by default. Avoid unnecessary allocations, copies, and iterations.
- Prefer `Map`/`Set` over plain objects when keys are dynamic or frequent lookups are needed.
- Avoid creating intermediate arrays when a single pass will do.
- Lazy-initialize expensive resources.
- In Lit components, avoid unnecessary re-renders. Use `willUpdate()` for derived state instead of computing in `render()`.

## Documentation

- Add a JSDoc comment to every top-level export (functions, classes, constants).
- Do NOT add inline comments that restate what the code does. Comment **why**, not **what**.
- Do NOT add comments like `// handle error` or `// return result`.
- Document non-obvious business logic, edge cases, and workarounds.

## Structure

- Keep functions short and single-purpose.
- Co-locate related code. Avoid scattering logic across many tiny utility files.
- Prefer named exports over default exports.
- Barrel files (`index.js`) should only re-export; no logic.

## Testing

- Unit tests live in `.html` and `.js` files under `/test`.
- Test meaningful behavior and visual states, not implementation details.
- Cover key states: default, loading, error, empty, populated, disabled, interactive.

### Browser Unit Test Runner

- Browser unit tests must be inspected only through the existing Web Test Runner instance on `http://localhost:2023`.
- Open the specific test URL directly. Do not preflight-check the base URL first.
- Do NOT start the test runner.
- Do NOT add or modify `package.json` scripts.
- Do NOT run `npm test`, `npm run test`, `yarn test`, `pnpm test`, `web-test-runner`, or any inferred fallback command.
- Do NOT create temporary test scripts, config files, alternate runners, or Playwright fallbacks.
- Do NOT change test infrastructure unless the user explicitly asks for that.
- For any specific test file `<file>` under `/test`, open `http://localhost:2023/?wtr-test-file=<encoded-test-path>`, where `<encoded-test-path>` is the URL-encoded form of `/test/<file>?wtr-manual-session=true`.
- If opening the test URL fails because nothing is reachable on port `2023`, stop and report exactly: `The unit test runner is not reachable at http://localhost:2023. Please start it, then tell me to continue.`

## Error Handling

- Let unexpected errors propagate; do not swallow them.
- Use typed/custom errors for known failure modes that callers need to handle.
- Never `catch` an error just to log and rethrow it.

## Git

- Write concise, imperative commit messages (e.g., "Add user auth flow").
- One logical change per commit.

## General

- Do NOT add code "just in case." Only write code that is needed now.
- Do NOT add backwards-compatible shims unless explicitly asked.
- When modifying existing code, match the surrounding style.
- Prefer deleting dead code over commenting it out.
