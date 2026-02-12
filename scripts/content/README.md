# Content Scripts

Scripts for managing AEM content and tags.

## gen-locale-tags.js

Creates locale tags in AEM under `/content/cq:tags/mas/locale/`.

### Tag Structure

- **Single-locale countries**: `/locale/{lang}_{country}` (e.g., `/locale/tr_TR`)
- **Multi-locale countries**: `/locale/{country}/{lang}_{country}` (e.g., `/locale/CH/de_CH`)

### Usage

```sh
# Create missing locale tags in AEM
export MAS_ACCESS_TOKEN="Bearer eyJ..."
node scripts/content/gen-locale-tags.js \
  --host=https://author-pxxx-yyyy.adobeaemcloud.com

# Export tag definitions as JSON
node scripts/content/gen-locale-tags.js --format=json > locale-tags.json

# Export tag definitions as CSV
node scripts/content/gen-locale-tags.js --format=csv > locale-tags.csv
```

### Environment Variables

| Variable           | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `MAS_ACCESS_TOKEN` | Authorization token, e.g., "Bearer eyJ..." (required for tag creation) |

### Options

| Option          | Description                                        |
| --------------- | -------------------------------------------------- |
| `--host=<URL>`  | AEM host URL (required for tag creation)           |
| `--format=json` | Output JSON array of tag definitions (no creation) |
| `--format=csv`  | Output CSV for documentation/review (no creation)  |

### How It Works

1. Fetches existing tags from AEM using the querybuilder API
2. Generates required locale tags from `io/www/src/fragment/locales.js`
3. Creates only the missing tags

---

## gen-locales.mjs

Generates locale content tree for a MAS sub tenant in Odin.

### Prerequisites

- Node.js installed on your machine

- Required environment variables:

    - `MAS_ACCESS_TOKEN`: The IMS access token of a user, copy it from your IMS session in MAS Studio, typically using `copy(adobeid.authorize())` in the console.
    - `MAS_API_KEY`: The API key for authentication, api key used in MAS Studio.

- Required parameters:
    - `bucket`: The AEM bucket name, e.g: author-p22655-e155390 for Odin QA
    - `consumer`: The consumer identifier, e.g: ccd

### Usage

```sh
export MAS_ACCESS_TOKEN="your-access-token"
export MAS_API_KEY="mas-studio"

node gen-locales.mjs author-p22655-e155390 drafts
```
