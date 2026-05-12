---
name: review-pr
description: Comprehensive PR code review for MAS repository. Enforces coding conventions (getter pattern, Spectrum imports, dead code cleanup), validates tests, checks IO Runtime patterns, and provides actionable feedback with file references.
triggers:
  - "review pr"
  - "review this pr"
  - "review my pr"
  - "check my pr"
  - "code review"
  - "review pull request"
argument-hint: [PR number]
---

# MAS PR Code Review

## Purpose
Perform comprehensive, expert-level code review for MAS pull requests, enforcing all coding conventions, architecture patterns, and quality standards.

## Step 0: Load Reviewer Context (Automatic)
Before reviewing, check if the changed files overlap with the MAS architect's ownership areas
(io/www/, io/studio/, studio/src/, web-components/src/).

If ANY changed files are in those areas, spawn an Explore subagent:
> Read `.claude/commands/mental-model/mas-architect/expertise.yaml`.
> For these changed files: [list from gh pr diff --name-only],
> return the architect's top 3 relevant red_flags, ownership depth for these areas,
> and any domain_opinions that apply. Keep under 10 lines.

Use the returned context to prioritize review findings — issues that match the architect's
red_flags should be flagged as higher severity. Cost: ~300 tokens.

## Usage
```bash
/review-pr <PR_NUMBER>
```

## What This Reviews

### 1. Frontend/Studio Code Quality (CRITICAL)

#### A. Getter Pattern for Templates ⭐ MOST IMPORTANT
**The #1 coding violation to catch:**

✅ **CORRECT**:
```javascript
get searchControls() {
    return html`<div>...</div>`;
}
```

❌ **INCORRECT** (Flag this immediately!):
```javascript
renderSearchControls() {  // NEVER use render* methods!
    return html`<div>...</div>`;
}
```

**Why**: 40+ files in codebase use getter pattern. This is the established MAS Studio convention.

**Check**:
- All methods returning `html` template literals MUST be getters
- Element references (querySelector) MUST be getters
- No instance variables storing DOM references

#### B. Spectrum Web Component Imports

✅ **CORRECT**:
```javascript
// In studio/src/swc.js ONLY:
import '@spectrum-web-components/button/sp-button.js';
```

❌ **INCORRECT**:
```javascript
// In component files - NEVER!
import '@spectrum-web-components/button/sp-button.js';
```

**Check**:
- All Spectrum imports in `studio/src/swc.js`
- If swc.js modified → verify `studio/libs/swc.js` rebuilt
- Imports alphabetically ordered

#### C. LitElement Component Patterns

**Light DOM** (most components):
```javascript
createRenderRoot() {
    return this; // No shadow DOM
}
```

**Shadow DOM exceptions**:
- mas-toolbar
- mas-copy-dialog, mas-confirm-dialog
- mas-toast
- rte-field
- aem-tag-picker-field
- src/fields/* components

**Check**:
- Proper component structure
- Static properties defined correctly
- Static styles using css tagged template
- Lifecycle methods (connectedCallback, disconnectedCallback)

#### D. Reactive State Patterns

```javascript
// StoreController for reactive stores
filters = new StoreController(this, Store.filters);

// ReactiveController for manual subscriptions
reactiveController = new ReactiveController(this, [Store.search]);
```

**Check**:
- Proper store integration
- Access via .value property
- No direct Store mutations

#### E. Naming & Style Conventions

❌ **VIOLATIONS** (Must fix):
- Underscore-prefixed variables: `this._var` → use `this.#privateVar`
- Inline comments unless complex logic or user requested
- Inline styles in HTML tags
- TypeScript syntax
- String event literals: `'change'` → use `EVENT_CHANGE`

✅ **REQUIRED**:
- Event constants from constants.js or events.js
- Bind handlers in constructor
- Component names: `mas-` prefix (kebab-case)
- Class names: `Mas` prefix (PascalCase)

#### F. CSS-in-JS Patterns

```javascript
// In *.css.js files
export const styles = css`
    :host {
        --spectrum-button-background: var(--mod-button-background);
    }
`;
```

**Check**:
- CSS in separate .css.js files
- Spectrum CSS variables used
- No inline styles

#### G. Separation of Concerns ⭐ CRITICAL

**Files to Review**: Common infrastructure files (`studio/src/`)
- `*-store.js`, `*-repository.js`, `*-router.js`
- `studio/src/reactivity/*`
- `studio/src/mas-*.js` core components

**Violations to Flag**:
- ❌ Hardcoded variant names in stores/repositories: `'catalog'`, `'slice'`, `'fries'`, `'suggested'`
- ❌ Business logic mixed with data access
- ❌ Variant-specific file names in common directories
- ❌ Variant-specific imports in infrastructure files
- ❌ Conditional logic on variant field in stores/repositories

**Examples**:
```javascript
// ❌ WRONG: Hardcoded variant in store
if (!fieldsObject.variant) {
    fieldsObject.variant = 'catalog'; // Blocks PR!
}

// ❌ WRONG: Business logic in repository
if (fragment.variant === 'slice') {
    fragment.fields = transformSliceFields(fragment.fields);
}
```

**Correct Approach**:
- Keep stores/repositories generic and variant-agnostic
- Move variant-specific logic to `editors/*-editor.js` files
- Use configuration for defaults instead of hardcoded values

**Impact**: Prevents technical debt, maintains scalability, keeps layers clean

### 2. Architectural Correctness (ROOT CAUSE) ⭐ CRITICAL

#### A. Fix Location — Source vs Consumer
When reviewing a bug fix:
1. Identify what data/state the fix modifies or works around
2. Trace the data to its source (Store, repository, or API)
3. If the fix patches a consumer (template, component render method) instead of the source:
   - Flag: "Fix is at the consumer level — check if the source (Store/repository) should be fixed instead"
   - Check: Would fixing the source automatically fix this consumer AND others?

**Pattern to catch:**
```javascript
// Template-level workaround (fixing consumer)
locale=${this.computedLocale || Store.localeOrRegion()}

// Store-level fix (fixing source)
// Fix Store.localeOrRegion() to return correct value for all 13+ consumers
```

#### B. Parallel Code Path Consistency
When a method is modified:
1. Search for sibling methods with similar names or purposes
2. Check: do all paths handle the same edge cases?

**Check:**
```bash
# Find methods with similar prefixes
grep -n "#initializeFrom" studio/src/mas-fragment-editor.js
# If one handles variations, ALL should handle variations
```

**Real example**: `#initializeFromCachedStore` lacked variation region sync that `#initializeFromRepository` had — caught by reviewer, not by automated checks.

#### C. Store Consumer Blast Radius
When a fix involves reactive state:
1. Grep for ALL consumers of the affected store method
2. Verify: does fixing at this layer benefit all consumers?
3. If only one consumer is patched while others remain broken, the fix is at the wrong layer

```bash
# Example: find all consumers
grep -rn "Store.localeOrRegion()" studio/src/
# If 13 consumers and fix only helps 1, fix the store instead
```

#### D. Data Flow Direction
Fixes should flow **upstream** (closer to the source/store) rather than **downstream** (at each consumer):
- Flag: multiple consumers being patched for the same underlying issue
- Flag: template overriding or working around a Store value instead of fixing the Store

### 3. IO Runtime Code Quality

#### A. www/ (Fragment Pipeline)

**Pipeline Order** (MUST be this sequence):
```javascript
const PIPELINE = [fetchFragment, translate, settings, replace, wcs, corrector];
```

**Test Coverage** (99% REQUIRED):
```bash
c8 --check-coverage --lines=99 --functions=99 --branches=99 --statements=99
```

**Patterns to Check**:
- Context object flow through transformers
- Timing marks: `mark(context, 'label')`
- Timing measurements: `measureTiming(context, 'name', 'start')`
- Logging: `log()`, `logDebug()`, `logError()` with context
- Timeouts: 2s fetch, 15s main
- Compression: Brotli encoding
- Headers: CORS, Content-Type, Content-Encoding

**Common Issues**:
- Missing error handling
- Incorrect status codes (401, 504, 503)
- Missing timing marks
- Context not passed through
- Forgot to reset cache in tests

#### B. studio/ (Backend Actions)

**IMS Authentication**:
```javascript
const authorize = async (__ow_headers) => {
    const authHeader = __ow_headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const imsValidation = await new Ims('prod').validateToken(token);
        return imsValidation.valid;
    }
    return false;
};
```

**State Management**:
```javascript
const state = await stateLib.init();
const data = await state.get('key');
await state.put('key', value, { ttl: 31536000 });
```

**app.config.yaml**:
```yaml
my-action:
  function: src/my-action/index.js
  web: 'yes'
  runtime: nodejs:22  # Must be 22
  inputs:
    API_KEY: $API_KEY
  annotations:
    require-adobe-auth: true/false
```

**Check**:
- runtime: nodejs:22 (not older versions)
- Proper IMS auth if annotations.require-adobe-auth: true
- State TTL set appropriately
- Error responses with correct status codes

### 4. Dead Code Cleanup (CRITICAL)

**From ~/.claude/CLAUDE.md requirements:**

MUST verify and remove:
- ✅ Unused functions (0 references in codebase)
- ✅ Unused variables and constants
- ✅ Unused imports/requires
- ✅ Commented-out code blocks (except TODOs)
- ✅ Empty event listeners
- ✅ Orphaned helper functions
- ✅ Unreachable conditional branches
- ✅ Console.log debugging statements

**Verification Process**:
```bash
# For each function/variable that was removed or modified:
grep -r "functionName" /Users/mirafedas/Desktop/mas

# If 0 results and not in diff → potential dead code in other files
# If 0 results and IS in diff → properly removed ✅
```

**Check**:
- Search for references to any removed functions
- Verify imports are still needed
- Check for commented code blocks
- Look for console.log/console.error (unless intentional logging)

### 5. PR Checklist Validation

**From .github/pull_request_template.md:**

- ✅ **C1**: Unit tests for new features
- ✅ **C2**: NALA test added (or confirmed not needed with #fishbags)
- ✅ **C3**: All GitHub checks green
- ✅ **C4**: Working test page link in PR description
- ✅ **C5**: Demo-ready from test page
- ✅ **C6**: JIRA AC validation completed

**JIRA Link Format**:
```
Resolves https://jira.corp.adobe.com/browse/MWPW-NUMBER
```

**Test URLs Format**:
```
- Before: https://main--mas--adobecom.aem.live/
- After: https://mwpw-NUMBER--mas--adobecom.aem.live/
```

### 6. Build Artifacts & Infrastructure

**Spectrum Bundle**:
If `studio/src/swc.js` modified:
```bash
# Verify rebuilt
stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" studio/libs/swc.js
grep "sp-icon-name" studio/libs/swc.js
```

**Fragment Client**:
If `io/www/src/` modified:
```bash
# Should be rebuilt
ls -lh studio/libs/fragment-client.js
```

**Linter**:
```bash
npm run lint
```
- 4 spaces (not tabs)
- 128 char width
- Single quotes
- Prettier config: see .prettierrc

**NALA Requirements**:
- Port 8080: AEM server
- Port 3000: Studio proxy
- Check with: `lsof -i :8080 -i :3000`

**milolibs Parameter**:
- Format: `milolibs=local` (NOT `&milolibs=local`)
- For PR branches: `milolibs=mwpw-NUMBER--milo--adobecom`

### Test Coverage Analysis

**For New Studio Features:**
```bash
# Check if new UI functionality has NALA tests
find nala/studio -name "*.test.js" -type f -exec grep -l "feature-name" {} \;

# Check for new test specs
find nala/studio -name "*.spec.js" -type f -newer $(git merge-base HEAD main)

# For web-components, check unit tests
find test -name "*.test.{js,html}" -type f -newer $(git merge-base HEAD main)
```

**Test Requirements:**
- ✅ **Studio UI changes** → Require NALA test
- ✅ **New editor functionality** → Require NALA test
- ✅ **New drag/click interactions** → Require NALA test
- ✅ **Fragment editing features** → Require both edit AND save tests
- ✅ **Web-components changes** → Require unit tests (99% coverage for io/)
- ✅ **Bug fixes** → Require regression test

**When Tests Are NOT Required:**
- Internal refactoring with no behavior change
- CSS-only changes (unless new interactive styles)
- Documentation updates
- Configuration changes

**Test File Structure:**
```
nala/studio/
├── {surface}/
│   ├── {component}/
│   │   ├── specs/
│   │   │   └── {component}_{test-type}.spec.js
│   │   └── tests/
│   │       └── {component}_{test-type}.test.js
│   └── editor.page.js (shared page object)
```

**Test Types:**
- `_css.test.js` - Visual/styling tests
- `_edit.test.js` - Edit functionality tests
- `_save.test.js` - Save functionality tests
- `_edit_and_discard.test.js` - Edit + discard workflow
- Custom suffixes for specific features (e.g., `_drag_resize.test.js`)

**Common Test Violations:**
- ❌ New UI feature without NALA test
- ❌ Edit test exists but no save test
- ❌ Feature modified but no test updated
- ❌ Interaction added but not tested

## Review Workflow

### Step 1: Fetch PR Data

```bash
# Get PR metadata
gh pr view <PR_NUMBER> --json files,additions,deletions,url,title,body,author

# Get full diff
gh pr diff <PR_NUMBER>
```

### Step 2: Analyze Changed Files

For each file in the diff:

1. **Identify file category**:
   - `studio/src/*.js` → Frontend component
   - `io/www/src/*.js` → Fragment pipeline
   - `io/studio/src/*.js` �� Backend action
   - `nala/**/*.test.js` → NALA tests
   - `test/**/*.test.js` → Unit tests

2. **Apply relevant checks**:
   - Studio files → Getter pattern, Spectrum imports, Lit patterns
   - IO files → Pipeline order, test coverage, error handling
   - All files → Dead code, naming conventions, linter

3. **Check for patterns**:
```bash
# Getter violations
grep -n "render[A-Z].*() {" file.js

# Spectrum imports in components
grep -n "import.*@spectrum-web-components" studio/src/!(swc).js

# Underscore variables
grep -n "this\._[a-zA-Z]" file.js

# String event literals
grep -n "addEventListener(['\"]" file.js

# Inline comments (unless complex logic)
grep -n "\/\/ " file.js | wc -l
```

### Step 3: Verify Build Artifacts

```bash
# If swc.js changed
if git diff --name-only HEAD | grep -q "studio/src/swc.js"; then
    # Check libs/swc.js also changed
    git diff --name-only HEAD | grep -q "studio/libs/swc.js" || echo "⚠️ Bundle not rebuilt"

    # Check timestamp
    stat -f "%Sm" studio/libs/swc.js
fi

# If io/www changed
if git diff --name-only HEAD | grep -q "io/www/src"; then
    git diff --name-only HEAD | grep -q "studio/libs/fragment-client.js" || echo "⚠️ Fragment client not rebuilt"
fi
```

### Step 4: Check Tests

```bash
# Unit tests
npm test

# NALA tests (if added)
find nala/ -name "*.test.js" -newer $(git merge-base HEAD main) -type f
```

### Step 5: Dead Code Analysis

```bash
# For each removed function/variable
grep -r "functionName" /Users/mirafedas/Desktop/mas --exclude-dir=node_modules

# Check imports still needed
grep -r "import.*from.*'removed-module'" --exclude-dir=node_modules
```

### Step 6: Generate Report

Use this exact format with clickable file references:

## Output Format

```markdown
# PR Review: [PR Title]
**Author**: @username
**PR**: #NUMBER
**JIRA**: MWPW-NUMBER

---

## ✅ Strengths

- Follows getter pattern for all template methods
- Test coverage at 99% (io/www)
- All Spectrum imports in swc.js
- Build artifacts properly updated
- Clean code with no dead code

---

## ⚠️ Warnings

### Minor Issue: Potential Simplification
**File**: [studio/src/component.js:150](studio/src/component.js#L150)

Could simplify this logic:
\`\`\`javascript
// Current (works but verbose)
const value = condition ? getValue() : getDefaultValue();
\`\`\`

💡 **Suggestion**: Consider `const value = getValue() ?? getDefaultValue()`

---

## ❌ Critical Issues

### 1. Getter Pattern Violation (MUST FIX) ⭐

**File**: [studio/src/mas-toolbar.js:85](studio/src/mas-toolbar.js#L85)

❌ **Current**:
\`\`\`javascript
renderSearchControls() {
    return html\`<div id="search">...</div>\`;
}
\`\`\`

✅ **Required**:
\`\`\`javascript
get searchControls() {
    return html\`<div id="search">...</div>\`;
}
\`\`\`

**Why**: This is the established MAS Studio pattern. 40+ files use getters for templates.

---

### 2. Spectrum Import in Component (MUST FIX)

**File**: [studio/src/mas-dialog.js:1](studio/src/mas-dialog.js#L1)

❌ **Remove from component**:
\`\`\`javascript
import '@spectrum-web-components/button/sp-button.js';
import '@spectrum-web-components/dialog/sp-dialog.js';
\`\`\`

✅ **Add to** [studio/src/swc.js](studio/src/swc.js) (alphabetically):
\`\`\`javascript
import '@spectrum-web-components/button/sp-button.js';
import '@spectrum-web-components/dialog/sp-dialog.js';
\`\`\`

Then rebuild bundle:
\`\`\`bash
cd studio && npm run build
git add src/swc.js libs/swc.js
\`\`\`

---

### 3. Dead Code Detected (MUST REMOVE)

**File**: [studio/src/utils.js:120-135](studio/src/utils.js#L120-L135)

Function `formatOldDate` has **0 references**:
\`\`\`bash
$ grep -r "formatOldDate" studio/ --exclude-dir=node_modules
# No results
\`\`\`

✅ **Action**: Remove lines 120-135

---

### 4. Underscore Variable (MUST FIX)

**File**: [studio/src/component.js:45](studio/src/component.js#L45)

❌ **Current**:
\`\`\`javascript
this._cachedValue = value;
\`\`\`

✅ **Use private field**:
\`\`\`javascript
#cachedValue = null;  // At class level

// Then:
this.#cachedValue = value;
\`\`\`

---

### 5. Test Coverage Below 99% (MUST FIX)

**File**: io/www/src/fragment/new-transformer.js

\`\`\`bash
$ npm test
ERROR: Coverage for lines (97.5%) does not meet threshold (99%)
\`\`\`

✅ **Action**: Add tests for:
- Error case when API returns 404 (line 42)
- Edge case with empty fragment (line 67)

---

### 6. Missing NALA Test (VERIFY WITH #fishbags)

**Feature**: New mnemonic icon picker

✅ **Check**: Does this need a NALA test?
- New UI feature → Likely YES
- Bug fix → Maybe NO
- Internal refactor → NO

Ask in #fishbags Slack channel.

---

## 💡 Suggestions

### 1. Consider StoreController
**File**: [studio/src/component.js:30](studio/src/component.js#L30)

Current manual subscription:
\`\`\`javascript
connectedCallback() {
    Store.filters.subscribe(this.handleFilterChange);
}
\`\`\`

Could use StoreController:
\`\`\`javascript
filters = new StoreController(this, Store.filters);

render() {
    return html\`\${this.filters.value.tags}\`;
}
\`\`\`

### 2. Extract Complex Logic
**File**: [io/www/src/fragment/replace.js:200-250](io/www/src/fragment/replace.js#L200-L250)

This 50-line function could be split into smaller helpers for better testability.

---

## 📋 Checklist Status

- ✅ **C1**: Unit tests added for new transformer
- ❌ **C2**: NALA test needed (check with #fishbags)
- ⚠️ **C3**: Checks failing (linter errors)
- ❌ **C4**: Test URL missing from PR description
- ✅ **C5**: Demo script looks good
- ⚠️ **C6**: JIRA link format incorrect

### PR Description Issues

❌ **Missing**:
\`\`\`markdown
Test URLs:

- Before: https://main--mas--adobecom.aem.live/
- After: https://mwpw-NUMBER--mas--adobecom.aem.live/
\`\`\`

⚠️ **JIRA Format**:
Current: `MWPW-12345`
Required: `Resolves https://jira.corp.adobe.com/browse/MWPW-12345`

---

## 🔧 Build Artifacts

### Spectrum Bundle
✅ `studio/libs/swc.js` rebuilt (timestamp: 2025-10-23 14:30:00)
✅ Import added alphabetically in `studio/src/swc.js`

### Fragment Client
⚠️ `io/www/src/` modified but `studio/libs/fragment-client.js` not updated
\`\`\`bash
cd io/www && npm run build:client
\`\`\`

### Linter
❌ **3 errors found**:
\`\`\`
studio/src/component.js:45 - Unexpected underscore prefix
studio/src/component.js:120 - Prefer template literals
io/www/src/new-file.js:15 - Missing semicolon
\`\`\`

Fix with:
\`\`\`bash
npm run lint
\`\`\`

---

## 🎯 Next Steps (Priority Order)

1. ⭐ **Fix getter pattern** in [mas-toolbar.js:85](studio/src/mas-toolbar.js#L85)
2. ⭐ **Move Spectrum imports** to swc.js and rebuild
3. ⭐ **Remove dead code** in [utils.js:120-135](studio/src/utils.js#L120-L135)
4. ⭐ **Fix underscore variable** in [component.js:45](studio/src/component.js#L45)
5. ⭐ **Add tests** to reach 99% coverage
6. ✅ **Run linter**: `npm run lint`
7. ✅ **Add test URLs** to PR description
8. ✅ **Fix JIRA link** format
9. ✅ **Check with #fishbags** about NALA test
10. ✅ **Rebuild fragment client**: `cd io/www && npm run build:client`

---

## 📚 References

- [MAS Coding Conventions](.claude/skills/mas-coding-conventions/SKILL.md)
- [Spectrum Import Helper](.skills/spectrum-import-helper.md)
- [IO Runtime Mastery](.skills/io-runtime-master.md)
- [PR Template](.github/pull_request_template.md)

---

**Review completed**: 2025-10-23
**Reviewed by**: Claude Code (review-pr skill)
```

## Tips for Effective Reviews

### 1. Be Specific with Line Numbers
Always use `[file:line](file#Lline)` format for clickable references.

### 2. Prioritize Issues
- ⭐ Critical (blocking): Getter pattern, dead code, coverage
- ⚠️ Warnings: Missing tests, style issues
- 💡 Suggestions: Optimizations, improvements

### 3. Provide Code Examples
Show both ❌ wrong and ✅ correct code.

### 4. Explain Why
Don't just say "fix this" - explain the pattern and reasoning.

### 5. Check Everything Systematically
- Frontend patterns
- IO Runtime patterns
- Dead code
- Tests
- Build artifacts
- PR checklist
- Linter

## Common False Positives to Avoid

### 1. Getters in render()
✅ **OK** - Direct getter access:
```javascript
render() {
    return html`${this.searchControls}`;  // Getter - OK!
}
```

❌ **NOT OK** - Method call:
```javascript
render() {
    return html`${this.renderSearchControls()}`;  // Method - WRONG!
}
```

### 2. Private Fields
✅ **OK** - ES2022 private field:
```javascript
#privateVar = null;
```

❌ **NOT OK** - Underscore prefix:
```javascript
this._privateVar = null;
```

### 3. Comments in Tests
✅ **OK** - Test descriptions:
```javascript
// Test that fragment is fetched correctly
it('fetches fragment', ...);
```

❌ **NOT OK** - Inline comments in production code:
```javascript
const value = getValue(); // Gets the value
```

## Final Checklist Before Submitting Review

- [ ] Checked getter pattern in ALL template methods
- [ ] Verified Spectrum imports location and bundle rebuild
- [ ] Searched for dead code (0 references)
- [ ] Validated test coverage (99% for io/www)
- [ ] Confirmed PR checklist items
- [ ] Verified build artifacts updated
- [ ] Ran linter check
- [ ] Provided clickable file:line references
- [ ] Showed code examples for all issues
- [ ] Prioritized issues (⭐ ⚠️ 💡)
- [ ] Listed next steps in priority order
