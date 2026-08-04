# migrate-mnemonic-text

Migrates `mnemonic-text` attribute to text content in AEM content fragments.

**Background**: GLaaS translates text nodes inside custom elements but NOT custom HTML attributes.
This script converts the old format:

```html
<mas-mnemonic mnemonic-text="Adobe Acrobat" ...></mas-mnemonic>
```

to the new format:

```html
<mas-mnemonic ...>Adobe Acrobat</mas-mnemonic>
```

> **Prerequisites**: PR #931 must be deployed before running with `--apply`.

## Usage

```bash
node scripts/migrate-mnemonic-text/migrate-mnemonic-text.mjs --host <url> --token <bearer> [options]
```

### Options

| Flag                    | Description                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--host <url>`          | AEM author base URL (required)                                                                                                                    |
| `--token <token>`       | Bearer token (required)                                                                                                                           |
| `--apply`               | Actually save changes (default: dry-run)                                                                                                          |
| `--surface <surfaces>`  | Comma-separated surface names (e.g. `catalog,cc`). Run one surface at a time to limit blast radius. Path: `/content/dam/mas/<surface>[/<locale>]` |
| `--locale <locales>`    | Comma-separated locale codes, or `all` (default: English only)                                                                                    |
| `--fragment <id\|path>` | Process a single fragment only (for testing)                                                                                                      |
| `--debug`               | Print raw field names and types for each fragment                                                                                                 |
| `--help`                | Show usage message                                                                                                                                |

### Examples

```bash
# Dry-run (no changes, report only)
node scripts/migrate-mnemonic-text/migrate-mnemonic-text.mjs --host https://author-xxx.adobeaemcloud.com --token $TOKEN

# Dry-run a single surface (recommended starting point)
node scripts/migrate-mnemonic-text/migrate-mnemonic-text.mjs --host ... --token ... --surface catalog

# Apply to a single surface (English only)
node scripts/migrate-mnemonic-text/migrate-mnemonic-text.mjs --host ... --token ... --apply --surface catalog

# Apply to a specific surface + locale (run once per surface to limit blast radius)
node scripts/migrate-mnemonic-text/migrate-mnemonic-text.mjs --host ... --token ... --apply --surface catalog --locale de,fr,ja

# Apply to a surface across all locales
node scripts/migrate-mnemonic-text/migrate-mnemonic-text.mjs --host ... --token ... --apply --surface catalog --locale all

# Apply to multiple surfaces (separate runs recommended for easier rollback)
node scripts/migrate-mnemonic-text/migrate-mnemonic-text.mjs --host ... --token ... --apply --surface catalog,cc

# Test on a single fragment (dry-run by default)
node scripts/migrate-mnemonic-text/migrate-mnemonic-text.mjs --host ... --token ... --fragment <id-or-aem-path>
node scripts/migrate-mnemonic-text/migrate-mnemonic-text.mjs --host ... --token ... --fragment <id-or-aem-path> --apply

# Debug: print raw field names/types to diagnose unexpected results
node scripts/migrate-mnemonic-text/migrate-mnemonic-text.mjs --host ... --token ... --fragment <id-or-aem-path> --debug
```

## Output Log

In `--apply` bulk mode a timestamped log file is automatically written to the current directory (e.g. `mnemonic-migration-catalog-de-2026-06-13T12-00-00.log`).

To capture dry-run output manually:

```bash
node ... 2>&1 | tee run.log
```
