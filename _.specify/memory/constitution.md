# MAS Project Constitution

Coding principles for the MAS monorepo. Applies to `studio/`, `io/`, and `web-components/`.

For area-specific patterns, see: `studio/AGENTS.md`, `io/CLAUDE.md`, `.claude/rules/`.

---

## P1: Delete Over Add

**The best code is code that doesn't exist.**

1. **DELETE** code → 2. **MODIFY** existing code → 3. **ADD** new code (last resort)

- Explain the root cause in one sentence before changing anything
- Changes over 30 lines need justification or should be split
- Delete dead code; do not comment it out
- Do not add code for hypothetical future use

## P2: Modern JavaScript, Minimal Defensiveness

**Defend at system boundaries, not within trusted internal code.**

- `const`/`let`, arrow functions, optional chaining, destructuring, template literals
- `async`/`await` over `.then()` chains. Early returns over nesting. Named exports.
- No TypeScript. No inline styles. No inline comments unless asked.

Type checks and `try/catch` are justified at API boundaries (AEM, WCS, Odin responses), user input, `JSON.parse`, and browser/Node compatibility guards. Within internal code:

- No redundant type checks on values already validated upstream
- Use `callback?.()` instead of `callback && callback()`
- No empty `catch` blocks without a comment explaining why

## P3: Narrowest Scope First

**Solve problems at the component level before reaching for shared code.**

1. Getter/method in the component → 2. Conditional rendering → 3. CSS → 4. Shared utility (last resort)

STOP before modifying shared files:

- `hydrate.js` → Can a component getter solve this?
- `merch-card.js` → Can conditional rendering solve this?
- Any root `/src/*.js` → Is this truly shared, not component-specific?

## P4: Data Over Code

**Repetition is a signal to reach for data structures.**

- Same pattern 2+ times → array/object + iteration
- Queried 2+ times → extract to a getter
- 4+ intermediate variables → extract to a helper
- Prefer `Map`/`Set` when keys are dynamic. Avoid intermediate arrays when a single pass will do.

## P5: Trust Your Helpers

**Do not duplicate validation that callees already perform.**

- If a function handles null internally, do not null-check before calling it
- If a framework provides a guarantee, do not re-verify it
- IO: let unexpected errors propagate — the pipeline catches at the top level
- Studio/Web Components: catch at UI boundaries to prevent page crashes, but always log the error

## P6: Test Behavior, Not Implementation

**Tests verify what the code does, not how it's built.**

- Test meaningful behavior and user-visible states, not internal wiring
- Cover: default, loading, error, empty, populated, disabled, interactive
- Comment "why" not "what" — JSDoc on exports, no inline noise

Coverage thresholds:

- **IO Runtime**: 99% lines/functions/branches/statements
- **Web Components**: 85% lines/statements/branches, 65% functions
- **Studio**: coverage tracked, not gated

---

## Governance

Amendments require senior engineer review. Code reviews may reference principle numbers (e.g., "P1: can we delete instead?").
