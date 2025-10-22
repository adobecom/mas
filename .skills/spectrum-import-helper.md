---
name: spectrum-import-helper
description: Automatically add Spectrum Web Components imports to MAS Studio. Detects missing imports, adds them to studio/src/swc.js in alphabetical order, rebuilds the bundle with esbuild, and commits the changes. Use when adding new Spectrum icons or components, or when seeing 'sp-icon-*' or 'sp-*' elements that don't render properly.
tags: [spectrum, import, swc, build, icons, components]
triggers:
  - "add spectrum icon"
  - "add spectrum import"
  - "import sp-icon-"
  - "import spectrum"
  - "spectrum component missing"
  - "icon not showing"
  - "missing icon"
  - "rebuild swc"
---

# Spectrum Web Components Import Helper

## Purpose
This skill automates the process of adding Spectrum Web Components (SWC) imports to MAS Studio, including the critical rebuild step that is often forgotten.

## When to Use This Skill

### Automatic Triggers
- User mentions adding a Spectrum icon or component
- Code review reveals `<sp-*>` elements without corresponding imports
- Icon or component doesn't render in the browser
- User asks to "rebuild swc" or "build spectrum components"

### Common Scenarios
1. **Adding new icons to editor toolbars** - e.g., `<sp-icon-move>`, `<sp-icon-save>`
2. **Adding new UI components** - e.g., `<sp-button>`, `<sp-dialog>`
3. **Fixing invisible icons** - when icons show as empty boxes in browser
4. **After code changes** - when new Spectrum elements are added to any component

## The MAS Studio Import Architecture

### Key Files
```
studio/
├── src/
│   └── swc.js          # SOURCE: Import definitions (what you edit)
├── libs/
│   └── swc.js          # BUILT BUNDLE: What browser loads (generated)
├── build.mjs           # Build script using esbuild
└── package.json        # Contains "build": "node build.mjs"
```

### Critical Understanding
⚠️ **The browser loads `studio/libs/swc.js`, NOT `studio/src/swc.js`**

This means:
- ✅ Editing `src/swc.js` adds the import to source
- ❌ But browser won't see it until you rebuild
- ✅ Running `npm run build` bundles src → libs
- ✅ Only then will the icon/component render

## Step-by-Step Workflow

### 1. Detect Component Name
Extract the component name from the code or user request.

**Examples:**
- `<sp-icon-move>` → import name: `sp-icon-move`
- `<sp-button>` → import path: `@spectrum-web-components/button/sp-button.js`
- User says "add move icon" → search for `sp-icon-move`

### 2. Determine Import Path Pattern

**For Icons (most common):**
```javascript
import '@spectrum-web-components/icons-workflow/icons/sp-icon-{name}.js';
```

**For UI Components:**
```javascript
import '@spectrum-web-components/button/sp-button.js';
import '@spectrum-web-components/dialog/sp-dialog.js';
```

### 3. Check if Already Imported
```bash
grep -q "sp-icon-move" studio/src/swc.js
```

If found, inform user it's already imported but may need rebuild.

### 4. Verify Component Exists
```bash
ls node_modules/@spectrum-web-components/icons-workflow/icons/sp-icon-move.js
# or
ls node_modules/@spectrum-web-components/button/sp-button.js
```

If not found, list alternatives:
```bash
ls node_modules/@spectrum-web-components/icons-workflow/icons/ | grep -i "move\|drag"
```

### 5. Add Import in Alphabetical Order

**Find the correct insertion point:**
```bash
# For sp-icon-move, it goes between sp-icon-more and sp-icon-new-item
# Check surrounding imports:
grep -B 2 -A 2 "sp-icon-more\|sp-icon-new-item" studio/src/swc.js
```

**Edit the file:**
- Use the Edit tool to add the import
- Maintain strict alphabetical order
- Follow the existing formatting pattern

**Example Edit:**
```javascript
import '@spectrum-web-components/icons-workflow/icons/sp-icon-more.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-move.js';  // NEW
import '@spectrum-web-components/icons-workflow/icons/sp-icon-new-item.js';
```

### 6. Run Linter
```bash
npm run lint studio/src/swc.js
```

Fix any linting errors before proceeding.

### 7. Build the Bundle (CRITICAL STEP)
```bash
cd studio && npm run build
```

**What this does:**
- Runs esbuild via `build.mjs`
- Bundles `src/swc.js` → `libs/swc.js`
- Minifies and creates sourcemaps
- Takes 5-15 seconds typically

**Verify build succeeded:**
```bash
# Check timestamp updated
stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" studio/libs/swc.js

# Confirm import is in bundle (will be minified)
grep -c "sp-icon-move" studio/libs/swc.js
```

### 8. Commit Changes
```bash
git add studio/src/swc.js studio/libs/swc.js
git commit -m "Add sp-icon-{name} import to Spectrum bundle

- Added import to studio/src/swc.js in alphabetical order
- Rebuilt studio/libs/swc.js bundle with esbuild
- Icon now renders correctly in browser

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 9. Report to User
Provide clear summary:
```
✅ Added sp-icon-move import to studio/src/swc.js
✅ Rebuilt bundle: studio/libs/swc.js (now X.X MB)
✅ Committed both files to git
✅ Icon should now be visible in browser

Next: Refresh your browser to see the icon appear!
```

## Common Pitfalls to Avoid

### ❌ Forgetting to Rebuild
**Problem:** Adding import to src/swc.js but not running build
**Symptom:** Icon still invisible in browser
**Fix:** Always run `cd studio && npm run build`

### ❌ Wrong Import Path
**Problem:** Using incorrect package path for component
**Symptom:** Build fails or component doesn't load
**Fix:** Verify path in node_modules before importing

### ❌ Not Alphabetical
**Problem:** Adding import out of alphabetical order
**Symptom:** Messy code, harder to find imports later
**Fix:** Check surrounding imports and insert correctly

### ❌ Committing Only Source
**Problem:** Committing src/swc.js but forgetting libs/swc.js
**Symptom:** Works locally but breaks for others
**Fix:** Always commit both files together

## Finding Available Icons

### Search in Node Modules
```bash
# Find all available icons
ls node_modules/@spectrum-web-components/icons-workflow/icons/*.js | \
  grep -v ".map" | grep -v ".d.ts" | sed 's/.*sp-icon-//' | sed 's/.js$//'

# Search for specific icon
ls node_modules/@spectrum-web-components/icons-workflow/icons/ | grep -i "search-term"
```

### Common Icon Categories
- **Actions:** add, delete, edit, remove, save, close, refresh
- **Navigation:** arrow-*, chevron-*, move-*, drag-*
- **Status:** checkmark, info, help, cancel, alert
- **Content:** image, file, folder, document, code
- **UI:** settings, more, filter, search, view-*

### Icon Naming Patterns
- `sp-icon-{action}` - Simple actions (add, edit, save)
- `sp-icon-{action}-{modifier}` - Modified actions (arrow-up, text-bold)
- `sp-icon-{noun}` - Objects (folder, image, user)
- `sp-icon-{noun}-{modifier}` - Modified objects (folder-open, close-circle)

## Troubleshooting

### Icon Still Not Showing After Build
1. **Check browser console** - Look for 404 errors or import failures
2. **Hard refresh** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Verify bundle** - `grep "sp-icon-name" studio/libs/swc.js`
4. **Check element usage** - Ensure `<sp-icon-name>` matches import exactly

### Build Fails
1. **Check syntax** - Run linter: `npm run lint studio/src/swc.js`
2. **Verify path** - Ensure component exists in node_modules
3. **Check esbuild** - Look at error message from build.mjs
4. **Clean and rebuild** - Delete `studio/libs/swc.js` and rebuild

### Wrong Icon Displays
1. **Check slot usage** - Icons need `slot="icon"` in most contexts
2. **Verify import name** - `sp-icon-move` vs `sp-icon-move-to` are different
3. **Check Spectrum docs** - Some components have specific requirements

## Pro Tips

### Batch Adding Multiple Icons
If adding multiple icons at once:
```javascript
// Add all imports together
import '@spectrum-web-components/icons-workflow/icons/sp-icon-move.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-position.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-resize.js';
```
Then run build once at the end.

### Testing Before Committing
```bash
# Build and check bundle size
cd studio && npm run build
ls -lh libs/swc.js

# Quick test in browser
# Open http://localhost:3000 and check DevTools console
```

### Spectrum Component Imports Go to swc.js
Remember: According to CLAUDE.md, all Spectrum Web Component imports should go to `studio/src/swc.js` (not in individual component files). This is the centralized registry that gets bundled globally.

## Quick Reference Commands

```bash
# Add import and rebuild (complete workflow)
# 1. Edit studio/src/swc.js to add import
# 2. Run linter
npm run lint studio/src/swc.js

# 3. Build bundle
cd studio && npm run build

# 4. Verify
stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" studio/libs/swc.js
grep "sp-icon-name" studio/libs/swc.js

# 5. Commit
git add studio/src/swc.js studio/libs/swc.js
git commit -m "Add sp-icon-{name} to Spectrum bundle"
```

## Success Criteria

✅ Import added to `studio/src/swc.js` in alphabetical order
✅ Linter passes with no errors
✅ Build completes successfully
✅ `studio/libs/swc.js` timestamp is updated
✅ Import appears in built bundle (grep verification)
✅ Both source and built files committed
✅ Icon renders correctly in browser

## Notes

- **Build time:** Typically 5-15 seconds for full rebuild
- **Bundle size:** libs/swc.js is ~1.3-1.4 MB minified
- **Browser cache:** May need hard refresh to see changes
- **Development:** Server restart usually not needed, just browser refresh
