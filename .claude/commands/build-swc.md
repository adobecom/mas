---
name: build-swc
description: Rebuild the Spectrum Web Components bundle for MAS Studio
triggers:
  - "build swc"
  - "rebuild swc"
  - "build the bundle"
  - "rebuild bundle"
  - "build spectrum"
---

# Build Spectrum Web Components Bundle

You are a specialist in building the Spectrum Web Components bundle for MAS Studio.

## Purpose

This command rebuilds the bundled Spectrum Web Components after changes to `studio/src/swc.js`. The build process uses esbuild to create an optimized, minified bundle at `studio/libs/swc.js`.

## When to Use

Run this command when:
- New Spectrum Web Component imports are added to `studio/src/swc.js`
- SWC imports are removed or reorganized
- Testing SWC changes in the browser
- Verifying bundle size after changes
- Troubleshooting missing components

## Build Process Overview

The build script (`studio/build.mjs`) uses esbuild to bundle:
1. **SWC Bundle**: `src/swc.js` → `libs/swc.js` (Spectrum Web Components)
2. **RTE Bundle**: `src/rte/prosemirror.js` → `libs/prosemirror.js` (ProseMirror editor)
3. **CSS Bundle**: `src/spectrum.css.js` → `libs/spectrum.js` (Spectrum CSS)

Build configuration:
- Format: ESM (ES Modules)
- Target: ES2020
- Minification: Enabled
- Sourcemaps: Generated
- Platform: Browser

## Your Workflow

### 1. Check Current State
```bash
ls -lh studio/libs/swc.js
```

Show current bundle size before building.

### 2. Run Build Command
```bash
cd studio && npm run build
```

### 3. Monitor Build Output

Watch for:
- ✅ Successful compilation messages
- ⚠️ Warnings about large dependencies
- ❌ Build errors (missing imports, syntax errors)
- 📊 Bundle size information

### 4. Verify Build Results

After successful build:
```bash
ls -lh studio/libs/swc.js studio/libs/swc.js.map
```

Check:
- File exists and was updated (recent timestamp)
- Bundle size is reasonable (track growth over time)
- Sourcemap was generated

### 5. Show Bundle Analysis

Display bundle size comparison:
```bash
du -h studio/libs/swc.js
```

### 6. Validate Changes

If imports were added/removed:
```bash
grep -c "import" studio/src/swc.js
```

Show count of imports in source file.

### 7. Clean Up Build Cache (if needed)

If build issues occur:
```bash
rm -rf studio/libs/swc.js studio/libs/swc.js.map
cd studio && npm run build
```

## Expected Output Format

```
🔨 Building Spectrum Web Components Bundle
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Current bundle: 1.2 MB (before build)

🔧 Running build...
   ✓ studio/src/swc.js → studio/libs/swc.js
   ✓ Bundle size: 1.3 MB (↑ 100 KB)
   ✓ Sourcemap: swc.js.map (350 KB)
   ✓ Build time: 1.2s

✅ Build successful!

📊 Bundle Analysis:
   - Total imports in src/swc.js: 45
   - Bundle size: 1.3 MB (minified)
   - Sourcemap: 350 KB
   - Size change: +100 KB (+8.3%)

💡 The bundled SWC is now available at studio/libs/swc.js
   Refresh your browser to load the updated components.
```

## Common Issues & Solutions

### Issue: Build fails with "Cannot find module"
**Solution**: Check that the component package exists in root `package.json` dependencies

### Issue: Bundle size suddenly increased significantly
**Solution**:
- Review recent imports - some SWC packages are large
- Consider lazy loading heavy components
- Check for duplicate imports

### Issue: Component not available after build
**Solution**:
- Verify import syntax: `import '@spectrum-web-components/<pkg>/sp-<name>.js';`
- Clear browser cache
- Check browser console for errors
- Ensure component is properly exported by the package

### Issue: Build is very slow
**Solution**:
- This is normal for first build or after major changes
- Subsequent builds use esbuild's cache
- Large SWC packages (like table, icons) increase build time

## Performance Tips

1. **Group imports logically** in swc.js for easier maintenance
2. **Remove unused imports** to reduce bundle size
3. **Monitor bundle growth** - track size over time
4. **Test in production mode** - build is minified unlike dev server

## Important Notes

- Build runs from studio directory but outputs to `studio/libs/`
- The bundle is referenced in `studio.html` as `<script src="./libs/swc.js">`
- Sourcemaps help debug bundled code in browser DevTools
- Build is required before testing SWC changes in browser
- esbuild is fast - typical builds complete in 1-3 seconds

## Related Commands

- Use `/mas-swc-add` to add new Spectrum Web Component imports
- Use `/mas-lint-fix` to fix code style issues
- Use `/mas-validate` to check overall project health
