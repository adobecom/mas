---
name: check-imports
description: Verify Spectrum imports in swc.js
triggers:
  - "check imports"
  - "verify imports"
  - "missing imports"
---

# /check-imports

Check if all Spectrum Web Components used in a file are imported in swc.js.

## Usage
```
/check-imports <file-path>
```

## Arguments
- `file-path` (required): Path to component file to check

## What This Command Does

1. **Scans target file** for Spectrum element usage:
   - `sp-*` elements
   - `sp-icon-*` icons
   - `overlay-trigger`

2. **Checks swc.js** for corresponding imports

3. **Reports:**
   - ✅ Components already imported
   - ❌ Missing imports (with correct paths)
   - ⚠️ Potentially unused imports

## Examples

### Check single file
```
/check-imports studio/src/mas-toolbar.js
```

### Check new component
```
/check-imports studio/src/mas-new-feature.js
```

## Sample Output

```
Spectrum Import Check: mas-new-feature.js
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Found in swc.js:
   • sp-button
   • sp-textfield
   • sp-action-button

❌ Missing from swc.js:
   • sp-icon-settings
   • sp-tooltip

Add to studio/src/swc.js:
┌────────────────────────────────────────────────────────────────────────────┐
│ import '@spectrum-web-components/icons-workflow/icons/sp-icon-settings.js';│
│ import '@spectrum-web-components/tooltip/sp-tooltip.js';                    │
└────────────────────────────────────────────────────────────────────────────┘
```

## Auto-Fix

If missing imports found, this command will:
1. Show the import statements needed
2. Ask if you want to add them automatically
3. Insert imports alphabetically in swc.js
4. Run linter on swc.js

## Related Skills
- `component-import-checker` - Full import analysis
- `spectrum-import-helper` - Auto-add imports
