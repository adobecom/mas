# Delete locale folder fragments

Lists or deletes Content Fragments under `/content/dam/mas/{surface}/{LOCALE_FOLDER}/`

## Usage

From the repo root:

```bash
export AEM_BASE_URL=https://author-xxxx.adobeaemcloud.com
export AEM_TOKEN='<bearer-token>'
export LOCALE_FOLDER='<locale>'
```

Dry run (list only, no deletions):

```bash
node scripts/delete-locale-fragments/delete-locale-fragments.js
```

Live delete:

```bash
DRY_RUN=false node scripts/delete-locale-fragments/delete-locale-fragments.js
```
