# MCS Surface Integration -- Solution Design

## 1. Context

**MCS (Merchandising Content Service)** is the source of truth for product arrangement merchandising (names, descriptions, icons, links, T&Cs). MCS content is authored in AEM Content Fragments and served via AOS. M@S Studio currently has no awareness of MCS data.

This design introduces two complementary mechanisms:

1. **MCS Surface** -- a new surface in Studio where PA merchandising data is synced from AOS, stored as M@S card-model fragments, and edited in a structured (non-card) editor with upstream sync/diff capabilities.
2. **MCS Placeholders** -- a `{{mcs.*}}` placeholder system (per [MCS.md](https://github.com/yesil/mas/blob/MCS/mcs/MCS.md)) that lets cards on any surface reference MCS values. These are resolved at delivery and preview time via AOS, piggy-backing on the existing `replace` transformer pattern.

---

## 2. Data Model

### 2.1 Fragment Model

Reuse the existing card model: `/conf/mas/settings/dam/cfm/models/card` (`studio/src/constants.js` line 136).

MCS fragments live under a new surface path:

```
/content/dam/mas/mcs/{locale}/{productArrangementCode}
```

Example: `/content/dam/mas/mcs/en_US/creative-cloud-all-apps`

### 2.2 Surface Registration

Add `MCS` to `SURFACES` in `studio/src/constants.js`:

```javascript
MCS: {
    label: 'MCS',
    name: 'mcs',
},
```

### 2.3 Fragment Tagging

- `mas:source/mcs` -- marks fragment as MCS-sourced (distinguishes from hand-authored cards)
- `mas:mcs/pa:{productArrangementCode}` -- links to the upstream PA code
- `mas:mcs/synced-at:{ISO-timestamp}` -- last sync timestamp

### 2.4 Field Mapping (AOS to Card Fields)

When syncing from AOS, the merchandising response maps to card fields:

- `merchandising.copy.name` -> `cardTitle`
- `merchandising.copy.description` -> `description`
- `merchandising.copy.short_description` -> `shortDescription`
- `merchandising.assets.icons.svg` -> `mnemonics[0].icon`
- `merchandising.links.getting_started[0]` -> `ctas` (getting started link)
- `product_arrangement_code` -> stored as tag `mas:mcs/pa:{code}`

This mapping is defined in a new module `io/studio/src/mcs-sync/field-mapping.js`.

---

## 3. MCS Placeholder System

### 3.1 Placeholder Format

Per [MCS.md](https://github.com/yesil/mas/blob/MCS/mcs/MCS.md), MCS values are referenced via `{{mcs.*}}` placeholders inside card field content:

**Copy placeholders:**

- `{{mcs.copy.name}}` -- Product name
- `{{mcs.copy.short_name}}` -- Short product name
- `{{mcs.copy.description}}` -- Full description
- `{{mcs.copy.short_description}}` -- Short description

**Asset placeholders:**

- `{{mcs.assets.icons.svg}}` -- SVG icon
- `{{mcs.assets.icons.48}}` -- 48px icon
- `{{mcs.assets.background_images.1}}` -- Background image (standard)
- `{{mcs.assets.background_images.2}}` -- Background image (high-res)

**Link placeholders:**

- `{{mcs.links.getting_started.text}}` / `{{mcs.links.getting_started.href}}`
- `{{mcs.links.getting_started_template.text}}` / `{{mcs.links.getting_started_template.href}}`

**Fulfillable items:**

- `{{mcs.fulfillable_items.<item_code>.copy.name}}`
- `{{mcs.fulfillable_items.<item_code>.assets.icons.svg}}`

### 3.2 How Placeholders Are Resolved

MCS placeholders follow the same `{{key}}` pattern as existing M@S dictionary placeholders (see `PH_REGEXP` in `io/www/src/fragment/transformers/replace.js` line 6). The resolution flow:

1. The `replace` transformer detects `{{mcs.*}}` patterns in the serialized fragment body
2. If any `mcs.*` keys are present, a new **MCS resolve** step fetches the AOS merchandising data for the fragment's OSI (offer selector ID)
3. The AOS response is flattened into a dictionary keyed by MCS placeholder paths (e.g., `mcs.copy.name` -> `"Adobe Express"`)
4. The existing `replaceValues()` function substitutes them alongside regular dictionary placeholders

### 3.3 Placeholder Resolution in the Pipeline

Extend the `replace` transformer (or add an `mcs` transformer that runs just before `replace`) in `io/www/src/fragment/pipeline.js`:

```
Pipeline order: fetchFragment -> promotions -> customize -> settings -> [mcs] -> replace -> wcs -> corrector
```

The `mcs` transformer:

- **init**: If the fragment body contains any `{{mcs.*}}` pattern, pre-fetch AOS merchandising data for the fragment's OSI (parallelize with dictionary fetch)
- **process**: Flatten the AOS response into `context.dictionary` entries keyed by `mcs.*` paths. The subsequent `replace` step handles the actual substitution.

```javascript
// Flatten AOS merchandising into dictionary entries
function flattenMerchandising(merchandising, prefix = 'mcs') {
    const entries = {};
    if (merchandising.copy) {
        for (const [key, value] of Object.entries(merchandising.copy)) {
            entries[`${prefix}.copy.${key}`] = value;
        }
    }
    if (merchandising.assets?.icons) {
        for (const [key, value] of Object.entries(merchandising.assets.icons)) {
            entries[`${prefix}.assets.icons.${key}`] = value;
        }
    }
    // ... links, fulfillable_items, etc.
    return entries;
}
```

### 3.4 Preview Resolution in Studio

Extend `previewStudioFragment()` in `studio/libs/fragment-client.js`:

- Before the `replace` step, if the fragment body contains `{{mcs.*}}`, call AOS via the IO action `mcs-resolve` to get merchandising data for the OSI
- Merge the flattened MCS dictionary into the preview context dictionary
- The existing replace logic handles the rest

**Caching**: MCS data for a given OSI + locale is cached with a short TTL (minutes, not hours) per the MCS doc's guidance on eventual consistency. The known scalability concern (MCS rate-limiting) is mitigated by resolving via AOS, not MCS directly.

### 3.5 PH_REGEXP Update

The current placeholder regex in `replace.js`:

```javascript
const PH_REGEXP = /{{(\s*([\w\-\_]+)\s*)}}/gi;
```

Does **not** match dotted keys like `mcs.copy.name`. It must be extended to:

```javascript
const PH_REGEXP = /{{(\s*([\w\-\_\.]+)\s*)}}/gi;
```

This adds `.` to the character class, enabling `{{mcs.copy.name}}` to match. Existing placeholders (which use only `[\w\-\_]`) are unaffected.

---

## 4. MCS Sync Service (IO Runtime Actions)

New IO Runtime actions at `io/studio/src/mcs-sync/`, following the same pattern as `io/studio/src/ost-products/write.js`.

### 4.1 `mcs-sync-pull` (POST)

1. Fetch paginated offers from AOS: `GET /offers?service_providers=MERCHANDISING,PRODUCT_ARRANGEMENT_V2&locale={locale}`
2. For each PA, check if a fragment exists under `/content/dam/mas/mcs/{locale}/{paCode}`
3. Compute diff:
    - **New PA**: No existing fragment -- mark as "new"
    - **Changed PA**: Field-by-field comparison using the field mapping -- mark changed fields
    - **Unchanged PA**: Skip
4. Return diff summary (JSON) and store in IO Runtime state (Brotli-compressed, keyed by locale)

### 4.2 `mcs-sync-preview` (GET)

Returns the stored diff summary without applying it. Used by the sync dialog to display changes.

### 4.3 `mcs-sync-apply` (POST)

Accepts a list of PA codes and selected fields. For each:

- **New PA**: Create a card fragment via AEM API with mapped field values and MCS tags
- **Changed PA**: Update the specified fields on the existing fragment

Protected by IMS Bearer token (same as `ost-products-read`).

### 4.4 `mcs-resolve` (GET)

Standalone action that resolves MCS placeholder values for a given OSI + locale:

1. Call AOS with `service_providers=MERCHANDISING,INLINE_MERCHANDISING`
2. Flatten the response into `mcs.*` keyed entries
3. Return the dictionary

Used by both the delivery pipeline and the Studio preview. Cached with short TTL.

---

## 5. MCS Editor (Studio UI)

### 5.1 Page & Routing

Add to `studio/src/constants.js`:

```javascript
// In PAGE_NAMES
MCS_EDITOR: 'mcs-editor',
```

The router delegates to `mas-mcs-editor` when opening a fragment on the MCS surface, based on `Store.search.path` starting with `/content/dam/mas/mcs/`.

### 5.2 Editor Layout

Unlike the card editor's two-column visual layout (`studio/src/mas-fragment-editor.js`), the MCS editor uses a **single-column structured form** organized by MCS data categories:

```
+-------------------------------------------------------+
| Breadcrumbs: MCS > en_US > creative-cloud-all-apps    |
+-------------------------------------------------------+
| SYNC STATUS BAR                                       |
|   Last synced: 2026-03-01 14:30 UTC                   |
|   Upstream changes: 2 fields differ                   |
|   [Pull Changes]  [View Diff]  [Publish]              |
+-------------------------------------------------------+
| PRODUCT IDENTITY                                      |
|   PA Code: creative-cloud-all-apps  (read-only tag)   |
|   Name: [cardTitle]                                   |
|   Icons: [mnemonics]                                  |
+-------------------------------------------------------+
| COPY                                                  |
|   Description: [description - RTE]                    |
|   Short Description: [shortDescription - RTE]         |
+-------------------------------------------------------+
| LINKS                                                 |
|   Getting Started: [link text + href]                 |
|   Getting Started Template: [link text + href]        |
+-------------------------------------------------------+
| PLACEHOLDER REFERENCE                                 |
|   Available placeholders for this PA:                 |
|   {{mcs.copy.name}} = "Adobe Express"                 |
|   {{mcs.copy.description}} = "Adobe Express..."       |
|   {{mcs.assets.icons.svg}} = [icon preview]           |
|   (click to copy placeholder key)                     |
+-------------------------------------------------------+
| CONSUMERS                                             |
|   Cards using {{mcs.*}} with this PA's OSI:           |
|   - acom/en_US/plans/individuals/photoshop            |
|   - ccd/en_US/suggested/photoshop                     |
+-------------------------------------------------------+
```

### 5.3 Component: `mas-mcs-editor`

New file: `studio/src/editors/mas-mcs-editor.js`

- Extends `LitElement` with Shadow DOM
- Reuses existing field components: `rte-field`, `mnemonic-field`, `aem-tag-picker-field`
- **Sync Status Bar**: Shows last sync timestamp (from `mas:mcs/synced-at:*` tag), upstream diff count, and action buttons
- **Placeholder Reference**: Read-only section showing all `{{mcs.*}}` keys with their currently resolved values for this PA (fetched from `mcs-resolve` action)
- **Consumers**: Queries AEM for cards whose content contains `{{mcs.*}}` placeholders matching this PA's OSI

### 5.4 Content List for MCS Surface

When navigating to MCS surface, default to **table view** in `mas-content`, showing:

- PA Code, Product Name, Family, Locale, Sync Status, Last Modified

---

## 6. Upstream Sync Dialog

### 6.1 Component: `mas-mcs-sync-dialog`

New file: `studio/src/mas-mcs-sync-dialog.js`

Triggered from MCS editor "Pull Changes" or MCS content list toolbar "Sync All".

### 6.2 Single PA Sync Flow

1. Call `mcs-sync-pull` for the selected PA + locale
2. Show field-by-field diff:

```
+-------------------------------------------+
| Sync Preview: creative-cloud-all-apps     |
+-------------------------------------------+
| FIELD           CURRENT        UPSTREAM    |
| cardTitle       "CC All Apps"  "Creative   |
|                                 Cloud"     |
| description     (no change)               |
| shortDesc       "All apps..." "Get all."  |
| icons.svg       (no change)               |
+-------------------------------------------+
| [x] Select all changed fields            |
| [x] cardTitle                             |
| [x] shortDescription                      |
+-------------------------------------------+
| [Cancel]  [Apply Selected]                |
+-------------------------------------------+
```

3. User selects fields to accept -> calls `mcs-sync-apply`
4. Fragment saved via `MasRepository.saveFragment()`

### 6.3 New PA Detection

PAs found in AOS with no corresponding MCS fragment appear as a separate "New Product Arrangements" section in the sync dialog. Users select which to create as new fragments.

### 6.4 Bulk Sync

From the MCS content list toolbar, "Sync All" triggers sync for all PAs in the current locale. The dialog groups diffs by PA with expand/collapse.

---

## 7. MCS Placeholder Picker (Card Editor)

### 7.1 Picker Button in Card Editor

In `studio/src/editors/merch-card-editor.js`, add a small "MCS" button next to fields that support MCS placeholders (description, shortDescription, cardTitle, ctas). Clicking it opens the picker dialog.

### 7.2 Picker Dialog: `mas-mcs-placeholder-picker`

New file: `studio/src/editors/mas-mcs-placeholder-picker.js`

- Shows available `{{mcs.*}}` placeholder keys grouped by category (Copy, Assets, Links, Fulfillable Items)
- For each key, shows the **resolved value** for the card's current OSI (fetched via `mcs-resolve` action)
- Asset placeholders show image thumbnails; link placeholders render as Spectrum links (per MCS.md)
- Clicking a key inserts/pastes it into the active form field
- The picker is contextual to the card's offer -- if the card has an OSI, the picker resolves values for that specific offer

### 7.3 Visual Indicators

When a card field contains `{{mcs.*}}` placeholders:

- Show a small "MCS" badge next to the field label
- In the preview, the placeholder is resolved to show the actual value
- In the editor, the raw `{{mcs.copy.name}}` is shown (editable) with a tooltip showing the resolved value

---

## 8. Store Changes

Extend `studio/src/store.js`:

```javascript
mcs: {
    syncStatus: new ReactiveStore(null),   // { lastSynced, diffCount, ... }
    pendingDiffs: new ReactiveStore([]),    // Array of PA diff objects
    resolvedValues: new ReactiveStore({}), // OSI -> flattened mcs.* dictionary
},
```

---

## 9. Security Considerations

- AOS API calls from IO Runtime use server-side API key + IMS token, never exposed to client
- `mcs-sync-*` and `mcs-resolve` actions are protected by IMS Bearer token authorization
- No user input flows directly into AEM paths -- PA codes are validated against `/^[\w-]+$/` before path construction
- Fragment creation uses existing `MasRepository` which validates paths server-side
- `{{mcs.*}}` placeholders are resolved server-side in the pipeline; unresolved placeholders are left as-is (not stripped) to avoid silent data loss
- MCS data is fetched via AOS (not MCS directly) per MCS integration guidance, aligning with recommended security posture

---

## 10. Known Concerns (from MCS.md)

1. **MCS Preview Scalability**: MCS direct APIs don't scale for preview; resolved by going through AOS with caching
2. **Asset Optimization**: MCS-hosted assets (e.g., 178KB SVG icons) are not web-optimized. Consider proxying through an image optimization layer or documenting this as a known limitation.

---

## 11. Key Files to Create / Modify

**New files:**

- `io/studio/src/mcs-sync/pull.js` -- Sync pull action (AOS fetch + diff)
- `io/studio/src/mcs-sync/preview.js` -- Return stored diff
- `io/studio/src/mcs-sync/apply.js` -- Apply selected diffs to AEM
- `io/studio/src/mcs-sync/field-mapping.js` -- AOS merchandising to card field mapping
- `io/studio/src/mcs-resolve/index.js` -- Resolve `{{mcs.*}}` placeholders for an OSI
- `io/www/src/fragment/transformers/mcs.js` -- Pipeline transformer for MCS placeholder resolution
- `studio/src/editors/mas-mcs-editor.js` -- MCS structured editor
- `studio/src/editors/mas-mcs-placeholder-picker.js` -- Placeholder picker dialog
- `studio/src/mas-mcs-sync-dialog.js` -- Sync diff/preview dialog

**Modified files:**

- `studio/src/constants.js` -- MCS surface, MCS_EDITOR page, MCS placeholder constants, tag prefixes
- `studio/src/store.js` -- `mcs` store section
- `studio/src/router.js` -- MCS editor page routing
- `studio/src/mas-side-nav.js` -- MCS surface nav entry
- `studio/src/mas-fragment-editor.js` -- Delegate to MCS editor when surface is mcs
- `studio/src/editors/merch-card-editor.js` -- MCS placeholder picker button on relevant fields
- `io/www/src/fragment/pipeline.js` -- Add `mcs` transformer before `replace`
- `io/www/src/fragment/transformers/replace.js` -- Ensure `PH_REGEXP` handles dotted `mcs.*` keys (currently `[\w\-\_]+` needs to include `.`)
- `studio/libs/fragment-client.js` -- MCS placeholder resolution in preview pipeline
