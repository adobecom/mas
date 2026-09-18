# `pzn-` tag prefix rename for MAS Studio personalization tags (MWPW-208044)

Three scripts, run in order, migrate content already tagged with an old personalization leaf
name to its new `pzn-` prefixed name, so no personalization breaks when the tags are renamed. A
fourth file, `pzn-prefix-mapping.mjs`, is a shared library the other three import.

## What this does not do

**The Studio personalization tag dropdown is populated live from the AEM tag tree under
`/content/cq:tags/mas/pzn`, which is content outside this repository.** Creating the two new tag
nodes (`pzn-dc`, `pzn-cc-lapsed`) and the seven `pzn-` prefixed tag nodes under that path is a
gated production content operation owned by the taxonomy owner — these scripts only verify that
prerequisite (the inventory step reports which target tags are still missing) and never create,
rename, or publish a `cq:Tag` node themselves. Studio's own personalization detection
(`studio/src/common/utils/personalization-utils.js`) is already tag-name-agnostic — it recognizes
any `mas:pzn/...` id outside the `mas:pzn/country/...` subtree — so no Studio code change is
needed for the new/renamed tags to be recognized once they exist.

`general`, `site-pivot` and `logged-in` are deliberately excluded from the rename, and the whole
`mas:pzn/country/` subtree (2-letter geo codes) is never touched.

## The rename table

- `mas:pzn/cart-abandoner` → `mas:pzn/pzn-cart-abandoner`
- `mas:pzn/cpro` → `mas:pzn/pzn-cpro`
- `mas:pzn/edu` → `mas:pzn/pzn-edu`
- `mas:pzn/entry` → `mas:pzn/pzn-entry`
- `mas:pzn/smb` → `mas:pzn/pzn-smb`
- `mas:pzn/new-visitor` → `mas:pzn/pzn-new-visitor`
- `mas:pzn/return-visitor` → `mas:pzn/pzn-return-visitor`

Plus two new leaves with no rename source: `mas:pzn/pzn-dc`, `mas:pzn/pzn-cc-lapsed`.

## The scripts

1. **`pzn-prefix-inventory.mjs`** (read-only) — walks every locale folder's `/pzn/`
   grouped-variation card fragments for a surface, and for every fragment carrying an old-name
   tag, records which source it came from — fragment metadata `tags`, or the CF `pznTags`/`tags`
   field (the same sources Studio's personalization detection reads) — plus which target tags are
   still missing from the live taxonomy.
2. **`pzn-prefix-diff-report.mjs`** (read-only) — pure computation over the inventory: current →
   target tags per (fragment, source), with `TAG_MISSING`/`TAG_DRIFT` flags, grouped by parent
   fragment and by target tag.
3. **`pzn-prefix-applier.mjs`** (the only writer) — dry-run by default. Versions each fragment
   before every `If-Match` PUT, batches one target tag at a time via `--tags`, and supports
   `--revert`. A PUT that gets HTTP 500 is retried once; rows that still fail are written to a
   `tmp/mas-pzn-prefix-applier-failures-*.json` file with full row context. Pass that failures
   file back in as `--i-have-reviewed` to retry only the rows that failed.

A fourth file, **`pzn-prefix-mapping.mjs`**, is a library, not run directly — the rename table,
the added/preserved tag lists, and `applyPrefixRename` / `requiredTargetTags`, imported by all
three scripts above. Pure, no I/O.

**Reports go to this folder's own `tmp/` directory, which is gitignored — never into the repo.**
They carry live content paths, fragment ids and etags. Both read-only scripts refuse an `--out`
that resolves anywhere else inside the repository.

This migration is independent of `scripts/pzn-tags-locale-to-country` (the locale→country /
umbrella-expansion migration for grouped-variation geo tags) — separate tables, separate output
files, no cross-imports. The two can be run in either order without contending, since neither
migration's tag ids overlap with the other's.

Replace `<host>` with one of the endpoints:

- Prod: `author-p22655-e59433.adobeaemcloud.com`
- Stage: `author-p22655-e59471.adobeaemcloud.com`
- QA: `author-p22655-e155390.adobeaemcloud.com`

```sh
export MAS_IMS_TOKEN="your-ims-token"
export MAS_API_KEY="mas-studio"

# fetches and saves data in scripts/pzn-tag-prefix-rename/tmp/mas-pzn-prefix-inventory-acom.json
node scripts/pzn-tag-prefix-rename/pzn-prefix-inventory.mjs --author-host <host>

# saves the proposed changes in scripts/pzn-tag-prefix-rename/tmp/mas-pzn-prefix-diff-report-acom.json
node scripts/pzn-tag-prefix-rename/pzn-prefix-diff-report.mjs \
    --inventory scripts/pzn-tag-prefix-rename/tmp/mas-pzn-prefix-inventory-acom.json

# human-review tmp/mas-pzn-prefix-diff-report-acom.json, then apply changes, one target tag at a time:
node scripts/pzn-tag-prefix-rename/pzn-prefix-applier.mjs --author-host <host> \
    --i-have-reviewed scripts/pzn-tag-prefix-rename/tmp/mas-pzn-prefix-diff-report-acom.json --tags mas:pzn/pzn-edu

node scripts/pzn-tag-prefix-rename/pzn-prefix-applier.mjs --author-host <host> \
    --i-have-reviewed scripts/pzn-tag-prefix-rename/tmp/mas-pzn-prefix-diff-report-acom.json --tags mas:pzn/pzn-edu --live

# rollback if needed
node scripts/pzn-tag-prefix-rename/pzn-prefix-applier.mjs --author-host <host> \
    --i-have-reviewed scripts/pzn-tag-prefix-rename/tmp/mas-pzn-prefix-diff-report-acom.json \
    --revert scripts/pzn-tag-prefix-rename/tmp/mas-pzn-prefix-diff-report-acom.json --tags mas:pzn/pzn-edu --live

# if any rows still failed after the automatic 500-retry, retry just those rows:
node scripts/pzn-tag-prefix-rename/pzn-prefix-applier.mjs --author-host <host> \
    --i-have-reviewed scripts/pzn-tag-prefix-rename/tmp/mas-pzn-prefix-applier-failures-mas_pzn_pzn-edu-<timestamp>.json \
    --tags mas:pzn/pzn-edu --live
```

## Run order relative to the AEM taxonomy operation

1. The taxonomy owner creates the nine target tag nodes under `/content/cq:tags/mas/pzn` (do not
   rename the old nodes in place — create the new ones first, so old content keeps resolving until
   this migration retags it).
2. Run the inventory step and confirm `missingTargetTags` is empty before doing anything else.
3. Run the diff-report step and review it — it is also the rollback plan.
4. Run the applier, one target tag at a time, dry-run first.
5. Republish the parent fragments with the `/pzn/` variation reference checked. **No tag change
   reaches runtime until this happens.**
6. Once a re-run of the inventory step reports zero remaining rows for an old tag, retiring that
   old tag node is a separate decision for the taxonomy owner — this tooling does not do it.
