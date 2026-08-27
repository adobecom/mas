# Grouped variation tag migration from locale to country, and umbrella expansion (MU/TM/DZ) for ACOM; only umbrella expansion (MU/TM/DZ) for ACOM-DC

Three scripts, run in order, migrate grouped-variation `pznTags` from per-locale
(`mas:locale/<xx_YY>`) to per-country (`mas:pzn/country/<cc>`) tags (type 1), and expand the MU/TM/DZ
umbrella markets into their constituent countries (type 2). A fourth file, `pzn-tag-mapping.mjs`, is a
shared library the other three import.

Two surfaces are in scope, selected with `--surface` (default `acom`). Every `/pzn/` card
fragment under the selected surface is processed — no filtering. Each surface has its own
set of transformation rules:

| Surface | Rules applied |
| --- | --- |
| `acom` (default) | **TYPE 1 + TYPE 2** |
| `acom-dc` | **TYPE 2 only** |

- **TYPE 1** — `applyLocaleToCountry`: the 40-market locale→country rewrite.
- **TYPE 2** — `applyUmbrellaExpansion`: geo expansion of the umbrella markets (MU→KE/TZ/GH,
  TM→AM/AZ/GE/MD/KZ/KG/TJ/UZ, DZ→OM/MA/LB/JO/IQ/BH).

TYPE 1 never runs on `acom-dc` — that surface only gets the umbrella expansion.

| File | Writes? | What it does |
| --- | --- | --- |
| 1. `pzn-tag-inventory.mjs` | no | Walks every locale folder for the selected surface, records current `pznTags` per grouped variation, flags cross-locale `TAG_DRIFT`, and checks which country tags already exist in the taxonomy. |
| 2. `pzn-tag-diff-report.mjs` | no | Pure computation over the inventory: current → target tags per variation, with collision / demotion / ambiguity flags, grouped by parent fragment and by market. |
| 3. `pzn-tag-applier.mjs` | **yes** | The only writer. Dry-run by default. Versions each fragment before every `If-Match` PUT, batches one market at a time, and supports `--revert`. |
| — `pzn-tag-mapping.mjs` | no (library, not run directly) | Market and umbrella tables plus `applyLocaleToCountry` / `applyUmbrellaExpansion`, imported by all three scripts above. Pure, no I/O. The localeToCountry table is derived from `getSurfaceLocales('acom')` — do not hand-maintain it. |

**Reports go to this folder's own `tmp/` directory, which is gitignored — never into the repo.**
They carry live content paths, fragment ids and etags. Both read-only scripts refuse an `--out` that resolves anywhere else inside the repository.

Inventory and diff-report outputs are **namespaced by surface** by default
(`mas-pzn-tag-inventory-<surface>.json`, `mas-pzn-tag-diff-report-<surface>.json`), so both
surfaces' artifacts coexist in `tmp/` without a manual `--out`. The diff-report reads the
surface from the inventory file it is given, so its output is namespaced automatically — no
`--surface` flag on the diff-report step.

//@TODO: replace author-p22655-e59471.adobeaemcloud.com with <host> when development is finished!

```sh
export MAS_IMS_TOKEN="your-ims-token"
export MAS_API_KEY="mas-studio"

# fetches and saves grouped variation data in scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-inventory-acom.json
node scripts/pzn-tags-locale-to-country/pzn-tag-inventory.mjs --author-host author-p22655-e59471.adobeaemcloud.com

# saves proposed changes in scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-diff-report-acom.json
node scripts/pzn-tags-locale-to-country/pzn-tag-diff-report.mjs \
    --inventory scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-inventory-acom.json

# human-review tmp/mas-pzn-tag-diff-report-acom.json, then apply changes, one market at a time:
node scripts/pzn-tags-locale-to-country/pzn-tag-applier.mjs --author-host  author-p22655-e59471.adobeaemcloud.com \
    --i-have-reviewed scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-diff-report-acom.json --markets EC

node scripts/pzn-tags-locale-to-country/pzn-tag-applier.mjs --author-host  author-p22655-e59471.adobeaemcloud.com \
    --i-have-reviewed scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-diff-report-acom.json --markets EC --live

# rollback if needed
node scripts/pzn-tags-locale-to-country/pzn-tag-applier.mjs --author-host  author-p22655-e59471.adobeaemcloud.com \
    --i-have-reviewed scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-diff-report-acom.json \
    --revert scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-diff-report-acom.json --markets EC --live
```

### acom-dc surface (TYPE 2 only)

Pass `--surface acom-dc` to the inventory step; the diff-report and applier pick the surface up
from the namespaced files, so no extra flag is needed downstream. Because `acom-dc` runs the
umbrella expansion only, the diff report covers the MU/TM/DZ markets and their expanded
children — there is no locale→country rewrite.

The applier batches by the country codes an umbrella row **adds**, not the umbrella parent
code. A row expanding `MU` adds `KE`/`TZ`/`GH`, so `--markets KE` (or `KE,TZ,GH`) selects that
row — `--markets MU` matches nothing, because `MU` is the pre-existing parent tag and is never
in the row's batch keys.

```sh
export MAS_IMS_TOKEN="your-ims-token"
export MAS_API_KEY="mas-studio"

# fetches and saves grouped variation data in scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-inventory-acom-dc.json
node scripts/pzn-tags-locale-to-country/pzn-tag-inventory.mjs --author-host author-p22655-e59471.adobeaemcloud.com \
    --surface acom-dc

# saves proposed changes in scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-diff-report-acom-dc.json
node scripts/pzn-tags-locale-to-country/pzn-tag-diff-report.mjs \
    --inventory scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-inventory-acom-dc.json

# human-review tmp/mas-pzn-tag-diff-report-acom-dc.json, then apply changes, one market at a time
# (batch key is an added child country code, e.g. KE for the MU umbrella — not MU itself):
node scripts/pzn-tags-locale-to-country/pzn-tag-applier.mjs --author-host  author-p22655-e59471.adobeaemcloud.com \
    --i-have-reviewed scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-diff-report-acom-dc.json --markets KE

node scripts/pzn-tags-locale-to-country/pzn-tag-applier.mjs --author-host  author-p22655-e59471.adobeaemcloud.com \
    --i-have-reviewed scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-diff-report-acom-dc.json --markets KE --live

# rollback if needed
node scripts/pzn-tags-locale-to-country/pzn-tag-applier.mjs --author-host  author-p22655-e59471.adobeaemcloud.com \
    --i-have-reviewed scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-diff-report-acom-dc.json \
    --revert scripts/pzn-tags-locale-to-country/tmp/mas-pzn-tag-diff-report-acom-dc.json --markets KE --live
```

Two things the scripts deliberately do not do: create taxonomy tags (a gated production write owned by the taxonomy owner — the inventory only reports which are missing), and publish. A tag change does not reach runtime until the parent fragment is republished with the `/pzn/` variation reference checked.
