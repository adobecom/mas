---
description: "Run NALA tests with custom parameters (env, test, tags, browser, mode, etc.)"
argument-hint: "[fix] [@tag | file.test.js] [mode=<headless|headed|ui|debug>] [milolibs=<local|prod|branch>] [write <description>]"
---

## Route by intent

**If arguments start with `fix`:**
You are in FIX MODE. Remove the `fix` keyword from arguments and use the remaining arguments to identify the test.
1. Invoke the `nala-runner` skill
2. Follow its Phase 1-5 flow in fix mode
3. Run the test, diagnose the failure, apply fix, re-run

**If arguments start with `write`:**
You are in WRITE MODE.
1. Invoke the `nala-writer` skill
2. Follow its Phase 1-6 flow
3. Detect test category, ask for fragment ID, generate files, verify

**Otherwise (default — RUN MODE):**
Run NALA tests with the provided arguments:

```bash
npm run nala $ARGUMENTS
```

### Quick Reference

| Command | What it does |
|---------|-------------|
| `/nala local @tag` | Run tests matching tag locally |
| `/nala local file.test.js` | Run specific test file |
| `/nala local mode=ui` | Run in Playwright UI mode |
| `/nala fix @tag` | Run, diagnose, and fix failing test |
| `/nala write promoted-cards css test` | Create new test suite |
| `/nala local milolibs=local` | Run with local Milo libraries |
| `/nala {branch} @tag` | Run against feature branch |

### Environment Prerequisites

Tests require AEM server (port 8080) and proxy (port 3000). If not running, use `/start-mas`.

### Available Parameters

**Environment** (first positional arg, default: local):
- `local` — localhost:3000
- `libs` — localhost:6456
- `{branch-name}` — AEM live branch URL

**Test Selection:**
- `@tag` or `-g=@tag` — Filter by annotation tag
- `file.test.js` — Run specific test file

**Mode** (default: headless):
- `mode=headless` | `mode=headed` | `mode=ui` | `mode=debug`

**Other:**
- `browser=chromium|firefox|webkit`
- `milolibs=local|{branch}`
- `project={project-name}`
