# env vars

- `MAS_ACCESS_TOKEN`: The IMS access token of a user, copy it from your IMS session in MAS Studio, typically using `copy(adobeid.authorize())` in the console.
- `MAS_API_KEY`: The API key for authentication, api key used in MAS Studio.

```sh
export MAS_ACCESS_TOKEN="your-access-token"
export MAS_API_KEY="your-api-key"
```

# gen-locales.mjs

Creates locale folder tree for a given surface in Odin. Locales are sourced from `locales.js` for the given surface. Existing folders are skipped; missing ones are created in batches of 5.

```sh
node gen-locales.mjs author-*-* acom-cc --dry-run
```

# gen-dictionaries.mjs

The `gen-dictionaries.mjs` script creates dictionary index fragments for all locale folders under a given surface in Odin. For each locale subfolder it checks whether an `index` content fragment exists and creates one if not, then publishes it.
Each index fragment's `parent` field is set based on the locale's position in the hierarchy:

- A **regional locale** points to its surface default. For example, `sandbox/fr_CA` gets parent `sandbox/fr_FR` index.
- A **surface default locale** points to the corresponding `acom` locale. For example, `sandbox/fr_FR` gets parent `acom/fr_FR` index.
- An **`acom` locale** has no parent (`null`).
  Newly created indexes are published, but existing ones that had their parent field fixed will not be published.

```sh
node gen-dictionaries.mjs author-*-* express L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25hcnk --dry-run
```

# validate-dictionary-parent.mjs

Read-only validation that each locale's dictionary index fragment has the correct `parent` reference for a given surface. Logs `OK`, `MISMATCH`, or `MISSING` per locale and prints a summary at the end. Makes no changes.

```sh
# validate author fragments
node validate-dictionary-parent.mjs author-*-* sandbox

# validate published fragments on odin.adobe.com
node validate-dictionary-parent.mjs author-*-* sandbox --live
```

# repair-dictionary-entry.mjs

Checks that all dictionary entry fragments in each locale's `dictionary` folder are referenced in the index's `entries` field. Logs and repairs missing entries. Use `--live` to publish the index after repair.

```sh
# validate published fragments on odin.adobe.com
node repair-dictionary-entry.mjs author-*-* sandbox --dry-run

# run for a specific locale
node repair-dictionary-entry.mjs author-*-* sandbox de_DE --dry-run

# repair and publish
node repair-dictionary-entry.mjs author-*-* sandbox de_DE --publish
```

# bulk-publish.mjs

Invokes the deployed `bulk-publish` IO Runtime action to publish many content fragments in one go. The action chunks paths per locale (≤ 50 per request — Odin silently drops anything past 50), retries transient failures, and returns a summary plus per-path details.

### Prerequisites

- `MAS_IMS_TOKEN`: an MAS Studio IMS access token. Copy it via `copy(adobeid.authorize())` in the browser devtools console while signed into MAS Studio. The action validates the token against the `mas-studio` allowedClientId.
- The action must be deployed to a reachable I/O Runtime workspace.

### Required flags

- `--paths-file <file>`: newline-separated list of paths (lines starting with `#` and blanks are ignored).
- `--odin-endpoint <url>`: the AEM author URL for the target environment.
- One of:
    - `--namespace <ns>`: I/O Runtime namespace (derives the action URL).
    - `--action-url <url>`: full action URL if non-standard.

### Optional flags

- `--locales fr_FR,de_DE`: comma-separated locales to expand each path into (in addition to the source path).
- `--concurrency <n>`: parallel chunk POSTs (default 5, max 20).
- `--dry-run`: print the payload without calling the action.

### Running the Script

```sh
export MAS_IMS_TOKEN="your-ims-token"

node bulk-publish.mjs \
    --paths-file paths.txt \
    --namespace <your-io-runtime-namespace> \
    --odin-endpoint https://<aem-author-host> \
    --locales fr_FR,de_DE
```

Exit codes: `0` on full success, `1` on HTTP error or bad usage, `2` if any paths failed (summary still printed).

# fix-extra-options-quotes.mjs

Repairs card fragments whose `data-extra-options` attribute has unescaped inner
quotes (pre-GLAAS-11333 CATS-i corruption), escaping them to `&quot;`. Scans
one surface/locale folder, writes changed fragments in parallel (unless
`--dry-run`), and emits a `.txt` of Studio deep-links for building a
bulk-publish project. Does not publish.

Before each update it saves the fragment's original payload to
`fragments/<last-folder-token>/<fragment-id>.json` (e.g. `--folder
/content/dam/mas/adobe-home` → `fragments/adobe-home/<id>.json`) so a bad run
can be rolled back. Backups are skipped in `--dry-run`.

Flags:

- `--folder <path>`: surface/locale folder to scan (required).
- `--dry-run`: report affected fragments without writing.
- `--limit <n>`: stop after `n` affected fragments (`--limit 1` = first only).
- `--concurrency <n>`: number of fragments written in parallel (default 10).
  This bounds the burst of author-tier writes — lower it to be gentler.

Invalid `--limit` / `--concurrency` values (non-integer or negative) fail fast
with exit `1` rather than silently disabling the flag.

Assumes flat (non-nested) `data-extra-options` JSON, which is all the Studio UI
can author; a nested `{…{…}…}` value would not be matched.

Exit codes: `0` all good; `1` bad usage; `2` one or more PUTs failed (the
failed fragment ids/paths are printed and excluded from the report).

```sh
export MAS_IMS_TOKEN="your-ims-token"
export MAS_API_KEY="mas-studio"

# preview only the first affected fragment
node fix-extra-options-quotes.mjs --author-host <aem-author-host> \
    --folder /content/dam/mas/ccd/de_DE --limit 1 --dry-run

# repair the whole folder, 10 parallel writers (default)
node fix-extra-options-quotes.mjs --author-host <aem-author-host> \
    --folder /content/dam/mas/ccd/de_DE

# repair with 20 parallel writers
node fix-extra-options-quotes.mjs --author-host <aem-author-host> \
    --folder /content/dam/mas/ccd/de_DE --concurrency 20
```
