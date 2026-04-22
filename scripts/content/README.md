# gen-locales.mjs

## Description

The `gen-locales.mjs` script is used to generate locale content tree for a MAS sub tenant in Odin.

## Usage

### Prerequisites

- Node.js installed on your machine

- Required environment variables:

    - `accessToken`: The IMS access token of a user, copy it from your IMS session in MAS Studio, typically using `copy(adobeid.authorize())` in the console.
    - `apiKey`: The API key for authentication, api key used in MAS Studio.

- Required parameters:
    - `bucket`: The AEM bucket name, e.g: author-p22655-e155390 for Odin QA
    - `consumer`: The consumer identifier, e.g: ccd

### Running the Script

3. Run the script:

    ```sh
    export MAS_ACCESS_TOKEN="your-access-token"
    export MAS_API_KEY="mas-studio"

    node gen-locales.mjs author-p22655-e155390 drafts
    ```

# gen-dictionaries.mjs

## Description

The `gen-dictionaries.mjs` script creates dictionary index fragments for all locale folders under a given surface in Odin. For each locale subfolder it checks whether an `index` content fragment exists and creates one if not, then publishes it.

- Required parameters:

    - `bucket`: The AEM bucket name, e.g: `author-p22655-e155390` for Odin QA
    - `surface`: The surface name, e.g: `sandbox`
    - `modelId`: The content fragment model ID for the dictionary index

- Optional flags:
    - `--dry-run`: Lists locale folders and logs what would be created without making any POST requests.

### Running the Script

```sh

node gen-dictionaries.mjs author-*-* sandbox L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25hcnk
```

### Dry run

Use `--dry-run` to preview what the script would do without creating or publishing any fragments:

```sh
node gen-dictionaries.mjs author-*-* sandbox L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25hcnk --dry-run
```

# repair-dictionary-entry.mjs

Checks that all dictionary entry fragments in each locale's `dictionary` folder are referenced in the index's `entries` field. Logs and repairs missing entries. Use `--publish` to publish the index after repair.

```sh
export MAS_ACCESS_TOKEN="your-access-token"
export MAS_API_KEY="mas-studio"

node repair-dictionary-entry.mjs author-*-* sandbox
```

To run for a specific locale, in dry run - no edits, no publish:

```sh
node repair-dictionary-entry.mjs author-*-* sandbox de_DE --dry-run
```

To repair and publish:

```sh
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
