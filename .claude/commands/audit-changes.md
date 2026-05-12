---
name: audit-changes
description: Audit current branch changes (committed + uncommitted) against main for file naming, dead code, and build artifacts. Runs linter. Use before creating a PR.
triggers:
  - "audit my changes"
  - "audit changes"
  - "pre-review check"
---

# Audit Changes

Pre-PR audit of ALL changes (committed AND uncommitted) on the current branch vs main.

## Step 1: Collect Changes

```bash
committed=$(git diff main...HEAD --name-only)
uncommitted=$(git status --porcelain | awk '{print $2}')
all_changes=$(echo "$committed $uncommitted" | tr ' ' '\n' | sort -u | grep -v '^$')
commit_count=$(git rev-list --count main..HEAD)
```

Print summary: branch name, commits ahead, files changed (committed vs uncommitted).

## Step 2: File Naming Check

For each changed file:

- **`studio/src/*.js`** — must be kebab-case with `mas-` prefix (e.g. `mas-dialog.js`). No PascalCase, snake_case, or camelCase.
- **`io/www/`, `io/studio/`** — kebab-case only.
- **Class names inside files** — must be PascalCase with `Mas` prefix (e.g. `class MasDialog`).
- **`nala/`** — snake_case OK (`component_name.test.js`).
- **`test/`, `studio/test/`** — kebab-case (`component-name.test.js`).

## Step 3: Build Artifacts Check

```bash
# swc.js modified but bundle not rebuilt?
if git diff main...HEAD --name-only | grep -q "studio/src/swc.js"; then
    git diff main...HEAD --name-only | grep -q "studio/libs/swc.js" \
        || echo "WARN: swc.js modified but bundle not rebuilt — run: cd studio && npm run build"
fi

# io/www modified but fragment-client.js not rebuilt?
if git diff main...HEAD --name-only | grep -q "io/www/src"; then
    git diff main...HEAD --name-only | grep -q "studio/libs/fragment-client.js" \
        || echo "WARN: io/www modified but fragment-client.js not rebuilt — run: cd io/www && npm run build:client"
fi
```

## Step 4: Run Linter

```bash
js_files=$(echo "$all_changes" | grep "\.js$" | tr '\n' ' ')
[ -n "$js_files" ] && npx eslint $js_files
```

## Step 5: Code Quality

Apply the same quality checks as `/review-pr` to the changed files — getter pattern, Spectrum imports, dead code, underscore variables, inline styles, separation of concerns.

## Step 6: Report

Summarize findings with file:line references. Group by: Critical (must fix) → Warnings → Clean files. End with a prioritized next-steps list.
