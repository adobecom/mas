# Dead Code Cleanup

After ANY file modification, check for and remove:
- Unused functions, variables, constants, imports
- Commented-out code blocks (unless important TODOs)
- Orphaned helpers that lost their callers
- Unreachable conditional branches
- Console.logs or debugging code (unless intentional)
- If you add or remove an import in `studio/src/swc.js`, update `studio/design-system/components.md` in the same PR

## Verification

1. Search for all function/variable references to ensure they're still used
2. Check if any imports are no longer needed
3. Remove code that became obsolete due to your changes
4. Run linter to catch missed unused variables
