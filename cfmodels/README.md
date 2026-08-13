# cfmodels

Simplified field summaries of AEM Content Fragment Models used by M@S, generated from the live
model definition rather than hand-maintained. Each `<technicalName>.model.json` maps a field name to:

```json
{
    "fieldName": {
        "fieldLabel": "Display label",
        "type": "string | string[] | number | boolean | datetime | tag | tag[] | long-text | long-text[] | content-fragment | content-fragment[] | content-reference | enum",
        "options": [{ "label": "...", "value": "..." }]
    }
}
```

_you need to execute this before publishing any change to your model_
_publish only if the PR is approved_

`options` is only present for `enum` fields.

## Generating one

```sh
export MAS_ACCESS_TOKEN="your-access-token"   # copy(adobeid.authorize()) in MAS Studio devtools console
export MAS_API_KEY="your-api-key"             # api key used by MAS Studio

node cfmodels/fetch-model.mjs <bucket> <modelPath> [--raw]
```

- `bucket`: the AEM author host prefix, e.g. `author-p22655-e59433` for `https://author-p22655-e59433.adobeaemcloud.com`.
- `modelPath`: the CF model's repository path, e.g. `/conf/mas/settings/dam/cfm/models/promotion`.
- `--raw`: also writes `<technicalName>.model.raw.json` with the untouched AEM response, useful when a
  field's dataType/shape isn't recognized by the simplifier yet.

Example:

```sh
node cfmodels/fetch-model.mjs author-p... /conf/mas/settings/dam/cfm/models/promotion
```

Writes `cfmodels/promotion.model.json`.

## Known model paths

| Model                | Path                                                     |
| -------------------- | -------------------------------------------------------- |
| card                 | `/conf/mas/settings/dam/cfm/models/card`                 |
| collection           | `/conf/mas/settings/dam/cfm/models/collection`           |
| promotion            | `/conf/mas/settings/dam/cfm/models/promotion`            |
| dictionary           | `/conf/mas/settings/dam/cfm/models/dictionary`           |
| translation-project  | `/conf/mas/settings/dam/cfm/models/translation-project`  |
| bulk-publish-project | `/conf/mas/settings/dam/cfm/models/bulk-publish-project` |

## Notes

- The fetcher calls the AEM CFM model exporter (`<modelPath>.model.json`) directly against the author
  instance — no Odin/IO Runtime involved.
- Field records from AEM use varying key spellings across versions (`fieldLabel`/`label`,
  `dataType`/`type`, `multiValued`/`multiple`, `values`/`options`). `fetch-model.mjs` normalizes these
  before simplifying; if a new model surfaces a shape the normalizer doesn't recognize, re-run with
  `--raw` and extend `normalizeField`/`simplifyField`.
