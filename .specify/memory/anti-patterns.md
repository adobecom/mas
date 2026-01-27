# MAS Anti-Patterns Guide

This document catalogs common mistakes and anti-patterns to avoid in the MAS project. Reference this before and during implementation.

---

## 1. Unnecessary Abstractions

Creating functions, classes, or utilities for operations that are only used once.

```javascript
// BAD: Helper for one-time use
function formatUserName(user) {
    return `${user.firstName} ${user.lastName}`;
}
const displayName = formatUserName(user);

// GOOD: Inline when used once
const displayName = `${user.firstName} ${user.lastName}`;
```

```javascript
// BAD: Utility class with single method
class StringUtils {
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
const title = StringUtils.capitalize(name);

// GOOD: Inline the logic
const title = name.charAt(0).toUpperCase() + name.slice(1);
```

**Rule**: Create an abstraction only when you have 3+ concrete uses.

---

## 2. Defensive Over-Handling

Adding null checks, try-catch blocks, or validation for scenarios that cannot occur.

```javascript
// BAD: Null checks for internal code with guaranteed inputs
function processFragment(fragment) {
    if (!fragment) return null;
    if (!fragment.fields) return null;
    if (!Array.isArray(fragment.fields)) return null;
    // Caller and schema already guarantee these
}

// GOOD: Trust internal contracts
function processFragment(fragment) {
    // Fragment guaranteed by caller, fields guaranteed by schema
    return fragment.fields.map(field => field.value);
}
```

```javascript
// BAD: Try-catch for code that can't throw
try {
    const value = object.property;
} catch (e) {
    return defaultValue;
}

// GOOD: Direct access
const value = object.property ?? defaultValue;
```

**Rule**: Validate at system boundaries (user input, external APIs). Trust internal code.

---

## 3. Hardcoded Variant Values

Using variant-specific values in fallback logic or field handling.

```javascript
// BAD: Hardcoded variant fallback
if (field.name === 'variant' && (!field.values || field.values.length === 0)) {
    fieldsObject.variant = 'catalog';
}

// BAD: Hardcoded fallback for missing variant
if (!fieldsObject.variant) {
    fieldsObject.variant = 'catalog';
}

// GOOD: Generic field handling
for (const field of fragment.fields) {
    if (!field.values || field.values.length === 0) {
        fieldsObject[field.name] = field.multiple ? [] : '';
    } else {
        fieldsObject[field.name] = field.multiple ? field.values : field.values[0];
    }
}

// GOOD: If defaults are truly needed, pull from configuration
const DEFAULT_FIELD_VALUES = getDefaultFieldValues();
fieldsObject[field.name] = DEFAULT_FIELD_VALUES[field.name] ?? '';
```

**Rule**: Fallback logic must be generic and not coupled to specific field values.

---

## 4. Root Cause Avoidance (Symptom Patching)

Adding workarounds instead of understanding and fixing the actual problem.

```javascript
// BAD: Patching a race condition with setTimeout
button.addEventListener('click', () => {
    setTimeout(() => {
        doThing();
    }, 100);
});

// GOOD: Fix the root cause (element not ready)
// Root cause: doThing() relies on element that isn't mounted yet
// Fix: ensure element is mounted before adding listener
connectedCallback() {
    this.button.addEventListener('click', () => doThing());
}
```

```javascript
// BAD: Retry loop hiding an actual bug
async function getData() {
    for (let i = 0; i < 3; i++) {
        try {
            return await fetch('/api/data');
        } catch {
            await sleep(1000);
        }
    }
}

// GOOD: Understand why it fails
// Root cause: endpoint returns 500 when cache is cold
// Fix: warm the cache, or fix the backend
async function getData() {
    return await fetch('/api/data');
}
```

**Rule**: If you're adding setTimeout, retry logic, or "safety" wrappers, investigate why you need them.

---

## 5. Wrong Spectrum Component Usage

Using `::part` selectors or importing Spectrum components incorrectly.

```css
/* BAD: Using ::part selectors */
sp-button::part(label) {
    color: red;
}

/* GOOD: Use CSS custom properties */
sp-button {
    --spectrum-button-primary-text-color: red;
}
```

```javascript
// BAD: Direct import in component file
import '@spectrum-web-components/button/sp-button.js';

// GOOD: Import in centralized swc.js registry
// In studio/src/swc.js:
import '@spectrum-web-components/button/sp-button.js';
```

**Rule**: Never use `::part` selectors. Always import Spectrum components via `swc.js`.

---

## 6. Underscore Prefix Variables

Using underscore prefix for private or internal variables.

```javascript
// BAD: Underscore prefix
class MyComponent extends LitElement {
    _subscribers = [];
    _handleClick() { }
}

// GOOD: Use private fields or no prefix
class MyComponent extends LitElement {
    #subscribers = [];
    handleClick() { }
}
```

**Rule**: Use `#` for truly private fields, or no prefix for internal methods.

---

## 7. querySelector Instead of Getters

Using `querySelector` directly instead of class getters.

```javascript
// BAD: Direct querySelector usage
saveFragment() {
    const repository = document.querySelector('mas-repository');
    repository.save(this.fragment);
}

// GOOD: Use a getter
get repository() {
    return document.querySelector('mas-repository');
}

saveFragment() {
    this.repository.save(this.fragment);
}
```

**Rule**: Encapsulate DOM queries in getters for better testability and readability.

---

## 8. Config Over Constants

Making values configurable when they never change in practice.

```javascript
// BAD: Configurable values that never vary
const config = {
    maxRetries: 3,
    timeout: 5000,
    baseUrl: '/api',
};
function fetchData() {
    return fetch(config.baseUrl, { timeout: config.timeout });
}

// GOOD: Constants for fixed values
const TIMEOUT_MS = 5000;
const API_BASE = '/api';
function fetchData() {
    return fetch(API_BASE, { timeout: TIMEOUT_MS });
}
```

**Rule**: Use constants. Only add configuration when you have a real use case for runtime changes.

---

## 9. Premature Generalization

Building for hypothetical future requirements that may never come.

```javascript
// BAD: Over-parameterized function
function fetchData(
    endpoint,
    options = {},
    transformFn = (x) => x,
    cacheDuration = 0,
    retryCount = 3,
    retryDelay = 1000
) {
    // In practice, only endpoint is ever used
}

// GOOD: Build for current needs
function fetchData(endpoint) {
    return fetch(endpoint).then((r) => r.json());
}
// Add parameters when actually needed
```

```javascript
// BAD: Abstract factory for one implementation
class ButtonFactory {
    static create(type) {
        switch (type) {
            case 'primary':
                return new PrimaryButton();
            default:
                throw new Error('Unknown type');
        }
    }
}

// GOOD: Direct instantiation
const button = new PrimaryButton();
```

**Rule**: YAGNI (You Aren't Gonna Need It). Add complexity when you need it, not before.

---

## 10. Backwards-Compatibility Theater

Adding shims, aliases, or compatibility layers when you could just change the code.

```javascript
// BAD: Keeping old name for "backwards compatibility"
function getUser() {
    return fetchCurrentUser();
}
// @deprecated Use fetchCurrentUser instead
function getCurrentUser() {
    return getUser();
}

// GOOD: Just rename and update call sites
function getUser() {
    return fetchCurrentUser();
}
// Update all callers directly
```

**Rule**: If you control all the code, just change it. Don't add indirection.

---

## 11. Comment-Driven Development

Using comments to explain what code does instead of writing clear code.

```javascript
// BAD: Comments explaining obvious code
// Get the user's name
const name = user.name;
// Check if the name is empty
if (name === '') {
    // Set default name
    name = 'Anonymous';
}

// GOOD: Self-explanatory code
const name = user.name || 'Anonymous';
```

**Rule**: If you need a comment to explain what code does, rewrite the code to be clearer.

---

## 12. Excessive Logging

Adding logs for every operation instead of strategic logging.

```javascript
// BAD: Log everything
function processOrder(order) {
    console.log('Processing order:', order.id);
    console.log('Order items:', order.items);
    console.log('Calculating total...');
    const total = calculateTotal(order);
    console.log('Total calculated:', total);
    console.log('Saving order...');
    saveOrder(order);
    console.log('Order saved successfully');
    return total;
}

// GOOD: Strategic logging (or no logging for internal operations)
function processOrder(order) {
    const total = calculateTotal(order);
    saveOrder(order);
    return total;
}
// Log at boundaries: API calls, errors, user actions
```

**Rule**: Log at system boundaries and error conditions. Don't log internal operations.

---

## 13. Duplicating Variation Logic

Implementing custom variation detection instead of using existing patterns.

```javascript
// BAD: Custom variation detection logic
function isVariation(fragment) {
    return fragment.path.includes('/variations/');
}

// GOOD: Use editor store data
function isVariation() {
    const context = previewFragmentForEditor.get();
    const defaultLocaleId = context?.fragmentIds?.['default-locale-id'];
    return defaultLocaleId && defaultLocaleId !== currentFragment.id;
}
```

**Rule**: Base variation logic on `previewFragmentForEditor` and editor context store data.

---

## 14. Modifying Shared Utilities for Component-Specific Behavior

Changing shared utilities (hydrate.js, merch-card.js, etc.) to fix issues that only affect one component.

```javascript
// BAD: Modifying shared hydrate.js for a component-specific badge issue
// In hydrate.js - affects ALL consumers
function processBadge(fields, merchCard) {
    const badgeContent = fields.badge?.trim();
    if (!badgeContent) {
        fields.badge = null;  // Over-engineered fix for one variant
    }
}

// GOOD: Reusable getter for the slot element in the component file
// In full-pricing-express.js or simplified-pricing-express.js
get badge() {
    return this.card.querySelector('[slot="badge"]');
}

// GOOD: Conditional rendering using the getter
// Note: Check element existence, not textContent (shadow DOM content not included in textContent)
renderLayout() {
    return html`
        ${this.badge
            ? html`<div class="badge-wrapper"><slot name="badge"></slot></div>`
            : html`<slot name="badge" hidden></slot>`}
    `;
}
```

```css
/* BAD: CSS :has() with :empty doesn't work when elements have child elements */
:host(:not(:has([slot='badge']:not(:empty)))) .badge-wrapper {
    display: none;  /* Won't work - badge has <merch-badge> child */
}

/* GOOD: Use JavaScript getter check instead of CSS */
/* Handle in renderLayout() with conditional rendering */
```

**Decision Tree**:
1. Can a getter/method in the component solve it? → Do that first
2. Can conditional rendering in the component solve it? → Do that
3. Can CSS in the component solve it? → Do that
4. Only if none work → Consider shared utility changes

**Files to NEVER modify for component-specific behavior**:
- `hydrate.js` - shared fragment hydration logic
- `merch-card.js` - base card implementation
- Any file in `src/` root imported by multiple components

**Rule**: Component-specific fixes belong in component files. Shared utilities should only change for truly shared behavior.

---

## 15. Event Listener Anti-Patterns

### Using `this.contains()` for click-outside detection

```javascript
// BAD: Not shadow DOM aware - fails when target is inside shadow DOM
handleDocumentInteraction(e) {
    if (!this.contains(e.target)) {
        this.close();
    }
}

// GOOD: Use composedPath() for shadow DOM awareness
handleClickOutside(event) {
    const path = event.composedPath();
    if (!path.includes(this)) {
        this.close();
    }
}
```

### Document listeners without cleanup

```javascript
// BAD: Memory leak - listener never removed, can't be removed with arrow function
connectedCallback() {
    document.addEventListener('click', (e) => this.handleClick(e));
}

// GOOD: Proper lifecycle management with bound handler
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
```

### Using `document` instead of `window` for global listeners

```javascript
// BAD: document may not capture all events in certain scenarios
document.addEventListener('click', this.handler);

// GOOD: window is the standard for global event capture
window.addEventListener('mousedown', this.handler);
```

**Rule**: Always use `composedPath()` for click-outside detection. Always cleanup listeners in `disconnectedCallback()`. Use `window` for global listeners.

---

## Quick Reference

| Pattern | Question to Ask | Better Approach |
|---------|-----------------|-----------------|
| New function | Used 3+ times? | Inline if <3 uses |
| Null check | Can this actually be null? | Remove if impossible |
| Try-catch | Can this actually throw? | Remove if impossible |
| Config object | Does this ever change? | Use constants |
| setTimeout | Why is timing an issue? | Fix the root cause |
| Retry logic | Why does it fail? | Fix the underlying issue |
| Parameters | Are all params used today? | Remove unused params |
| Comment | Is the code unclear? | Rewrite to be clearer |
| ::part selector | Need to style Spectrum? | CSS custom properties |
| Direct Spectrum import | Need a Spectrum component? | Import via swc.js |
| Shared utility change | Component-specific issue? | Getter in component file |
| `this.contains()` | Click-outside detection? | Use `composedPath()` |
| Document listener | Global event handling? | Use `window` + cleanup |
| Arrow function listener | Global listener? | Bind in constructor |

---

## References

- Constitution Principle III: Generic Over Specific
- Constitution Principle IV: No Logic Duplication
- Constitution Principle VIII: Minimal Implementation (YAGNI)
- Constitution Principle IX: Root Cause First

---

**Version**: 2.0.0 | **Created**: 2026-01-06
