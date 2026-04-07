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
