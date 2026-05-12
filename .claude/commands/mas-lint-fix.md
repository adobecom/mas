---
name: mas-lint-fix
description: Run linter and fix code quality issues in MAS project
triggers:
  - "fix lint"
  - "run linter"
  - "lint fix"
  - "fix lint errors"
  - "run eslint"
---

# MAS Linter and Code Quality Fixer

You are an automated linting and code quality specialist for the MAS project.

## Critical Requirements from CLAUDE.md

**You MUST run the linter on EVERY change made to the codebase.**

## Your Workflow

1. **Determine Scope**: What files to lint
   - If file path provided: Lint that file
   - If no path: Lint all changed files (use `git diff --name-only`)
   - If `--all` flag: Lint entire project

2. **Run ESLint**: Execute with auto-fix
   ```bash
   npm run lint
   ```
   This runs: `eslint . --fix --max-warnings=0` across all workspaces

3. **Parse Results**: Analyze linting output
   - Count errors and warnings
   - Identify error patterns
   - Group related issues

4. **Check for Dead Code** (Critical from CLAUDE.md):
   - Unused functions (search for function definitions and their calls)
   - Unused variables and constants
   - Unused imports/requires
   - Commented-out code blocks (preserve TODOs)
   - Empty or unnecessary event listeners
   - Orphaned helper functions
   - Unreachable conditional branches
   - Console.logs or debugging code (unless intentional)

5. **Verify Naming Conventions**:
   - ❌ NO variables starting with underscore (per CLAUDE.md)
   - ✅ Proper camelCase for variables
   - ✅ PascalCase for classes/components
   - ✅ UPPER_CASE for constants

6. **Check Project-Specific Rules**:
   - ❌ No TypeScript files (`.ts`, `.tsx`)
   - ❌ No inline styles in HTML tags
   - ❌ No inline comments unless logic is complex
   - ✅ Spectrum components only in `swc.js`
   - ✅ All imports use `.js` extension

7. **Fix Auto-Fixable Issues**: Apply ESLint fixes automatically

8. **Report Manual Fixes Needed**: Show issues requiring human intervention

9. **Run Prettier** (if needed):
   ```bash
   npm run format
   ```

## Dead Code Detection Strategy

### Find Unused Functions:
```bash
# List all function declarations
grep -r "function \|const .* = .*=>" --include="*.js" studio/src/

# For each function, search for usage
grep -r "<function-name>" --include="*.js" studio/
```

### Find Unused Imports:
```bash
# Check each import is used in the file
# ESLint rule: no-unused-vars catches most
```

### Find Commented Code:
```bash
# Search for commented blocks
grep -r "^[[:space:]]*\/\/" --include="*.js" studio/src/
grep -r "^[[:space:]]*\/\*" --include="*.js" studio/src/
```

### Preserve TODOs:
- Keep comments with `TODO`, `FIXME`, `HACK`, `NOTE`
- Remove all other commented code

## Output Format

1. **Scope**: Show what's being linted
   ```
   🔍 Linting: studio/src/editors/merch-card-editor.js
   ```

2. **Results Summary**:
   ```
   ✅ No errors found
   ⚠️  3 warnings found
   ❌ 5 errors found
   ```

3. **Issues Breakdown**:
   ```
   Errors:
   • studio/src/editors/merch-card-editor.js:42
     'updateCard' is defined but never used (no-unused-vars)

   • studio/src/editors/merch-card-editor.js:128
     Variable name '_private' starts with underscore (naming-convention)
   ```

4. **Dead Code Found**:
   ```
   🧹 Dead code detected:
   • studio/src/editors/merch-card-editor.js:156-168
     Function 'calculatePrice' is never called

   • studio/src/editors/merch-card-editor.js:15
     Import 'Fragment' is unused

   • studio/src/editors/merch-card-editor.js:201-205
     Commented code block (no TODO)
   ```

5. **Actions Taken**:
   ```
   ✅ Auto-fixed 8 issues
   🔧 Fixed naming: _private → private
   🗑️  Removed unused function: calculatePrice
   🗑️  Removed unused import: Fragment
   🗑️  Removed commented code (lines 201-205)
   ```

6. **Manual Fixes Needed**:
   ```
   ⚠️  Manual review required:
   • studio/src/editors/merch-card-editor.js:89
     Complex logic may need comment (currently no comment)
   ```

## Verification Checklist

After linting, verify:
- [ ] All auto-fixes applied successfully
- [ ] No unused imports remain
- [ ] No unused functions remain
- [ ] No variables starting with underscore
- [ ] No commented code (except TODOs)
- [ ] No console.logs (unless intentional)
- [ ] All warnings addressed or documented
- [ ] Code follows project conventions

## Integration with Workflow

**Run this command automatically:**
- After creating/modifying any file
- Before committing changes
- After fixing test failures
- After refactoring

## Common Fixes

### Unused Imports:
```javascript
// Before
import { Fragment } from './fragment.js';
import { Store } from './store.js';

// After (Fragment removed)
import { Store } from './store.js';
```

### Underscore Variables:
```javascript
// Before
const _privateVar = 'secret';

// After
const privateVar = 'secret';
```

### Commented Code:
```javascript
// Before
// const oldFunction = () => {
//   return 'deprecated';
// };

// After
// (removed entirely)
```

### Unused Functions:
```javascript
// Before
function helperFunc() { return 'unused'; }
function usedFunc() { return 'used'; }

// After (helperFunc removed)
function usedFunc() { return 'used'; }
```

## Error Handling

If linting fails:
1. Check for syntax errors first
2. Verify ESLint config is valid
3. Check for circular dependencies
4. Ensure all dependencies installed
5. Try running on individual files to isolate issue

## Performance Notes

- Linting entire project may take 10-30 seconds
- Linting single file is instant
- Use `--max-warnings=0` to enforce zero warnings policy
- Git-staged files can be linted with: `eslint $(git diff --cached --name-only --diff-filter=ACM | grep '\.js$')`
