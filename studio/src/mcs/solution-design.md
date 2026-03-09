# MCS Surface Integration -- Solution Design

## 1. Context

**MCS (Merchandising Content Service)** is the source of truth for product arrangement merchandising (names, descriptions, icons, links, T&Cs, promo terms). MCS content is authored as AEM Content Fragments and served via **AOS (Adobe Offer Service)** — the recommended integration path. Clients should always go through AOS (not call MCS directly), passing `locale` explicitly and requesting `MERCHANDISING_CONTENT` or `INLINE_MERCHANDISING` as needed.

M@S Studio currently has no awareness of MCS data.

This design introduces two complementary mechanisms:

1. **MCS Surface** -- a new surface in Studio where PA merchandising data is synced from AOS, stored as M@S card-model fragments, and edited in a structured (non-card) editor with upstream sync/diff capabilities.
2. **MCS Placeholders** -- a `{{mcs.*}}` placeholder system that lets cards on any surface reference MCS values. These are resolved at delivery and preview time by reading the MCS fragments stored in MAS, using the existing pipeline transformer pattern.

---

## 2. Data Model

### 2.1 Fragment Model

MCS data is sourced from AOS and stored in MAS using the existing **card fragment model**. No new fragment model is needed.

MCS fragments are identified by path: `/content/dam/mas/mcs/{locale}/{productArrangementCode}`

Example: `/content/dam/mas/mcs/en_US/creative-cloud-all-apps`

### 2.2 Surface Registration

Add `MCS` to `SURFACES` and `MCS_EDITOR` to `PAGE_NAMES` in `studio/src/constants.js`.

The router in `studio/src/router.js` handles two MCS-related states:
- **MCS content list**: shown when the MCS surface is active and no fragment is selected. Displays MCS fragments in **table view only** (no card/render view) with columns: PA Code, Product Name, Locale, Sync Status, Last Synced.
- **MCS editor**: shown when a fragment under `/content/dam/mas/mcs/` is opened. `mas-fragment-editor.js` delegates rendering to `mas-mcs-editor` instead of the standard card editor.

### 2.3 Card Tagging

MAS cards are tagged with the product arrangement code to associate them with an MCS PA. The tag namespace is TBD.

This tag is the source of truth for which PA's MCS data should be used when resolving `{{mcs.*}}` placeholders on a given card.

---

## 3. MCS Placeholder System

### 3.1 Placeholder Format

MCS values are referenced via `{{mcs.*}}` placeholders inside card field content:

**Copy placeholders:**

- `{{mcs.copy.name}}` -- Product name
- `{{mcs.copy.short_name}}` -- Short product name
- `{{mcs.copy.headline}}` -- Headline
- `{{mcs.copy.description}}` -- Full description
- `{{mcs.copy.short_description}}` -- Short description
- `{{mcs.copy.terms_and_conditions}}` -- Terms and conditions
- `{{mcs.copy.promo_terms}}` -- Promotional terms (HTML)

**Asset placeholders:**

- `{{mcs.assets.icons.svg}}` -- SVG icon
- `{{mcs.assets.icons.48}}` -- 48px icon
- `{{mcs.assets.background_images.1}}` -- Background image (standard)
- `{{mcs.assets.background_images.2}}` -- Background image (high-res)

**Link placeholders:**

- `{{mcs.links.getting_started.text}}` / `{{mcs.links.getting_started.href}}`
- `{{mcs.links.getting_started_template.text}}` / `{{mcs.links.getting_started_template.href}}`
- `{{mcs.links.provisioned_user.text}}` / `{{mcs.links.provisioned_user.href}}`

**Composite placeholders:**

- `{{mcs.mnemonics}}` -- Full mnemonic element (see Section 6.3).

**Fulfillable items:**

- `{{mcs.fulfillable_items.<item_code>.copy.name}}`
- `{{mcs.fulfillable_items.<item_code>.assets.icons.svg}}`

### 3.2 How Placeholders Are Resolved

MCS placeholders follow the same `{{key}}` pattern as existing M@S dictionary placeholders. Resolution is handled by a new `mcs` transformer that slots into the existing pipeline — no new mechanism is introduced. The `mcs` transformer populates `context.dictionary` with `mcs.*` entries before the `replace` transformer runs, so substitution is handled entirely by the existing `replaceValues()` logic.

For copy and link fields, `mcs.*` values are plain strings (text or URLs). The `replace.js` substitution handles them transparently. For mnemonic inheritance via `{{mcs.mnemonics}}`, see Section 6.3.

### 3.3 Placeholder Resolution in the Delivery Pipeline

A new `mcs` transformer is added to `PIPELINE` in `io/www/src/fragment/pipeline.js`, positioned between `settings` and `replace`:

```
[fetchFragment, promotions, customize, settings, mcs, replace, wcs, corrector]
```

The transformer follows the same `{ name, init, process }` contract as all existing transformers:

- **`init`**: Inspects the fragment body for any `{{mcs.*}}` pattern. If found, reads the card's PA code tag and kicks off a parallel fetch via `getMcsDictionary()` (same parallelism model as the `replace` transformer's dictionary fetch via `context.promises`).
- **`process`**: Awaits `context.promises.mcs`, then:
  - For **text and link placeholders**: merges the flattened `mcs.*` entries into `context.dictionary`. The subsequent `replace` transformer handles substitution.
  - For **`{{mcs.mnemonics}}`**: generates and injects `<mas-mnemonic>` markup directly into `context.body`, bypassing `replace.js` (see Section 6.3).

### 3.4 Preview Resolution in Studio

Studio follows the same transformer pattern on the client side. The same `mcs` step is added to the preview pipeline in `studio/libs/fragment-client.js`, mirroring the server-side transformer:

- **`init`**: Detects `{{mcs.*}}` patterns and calls `getMcsDictionary()` (via `MasRepository`) in parallel.
- **`process`**: Merges text/link keys into the dictionary for `replace` to handle; injects `<mas-mnemonic>` markup for `{{mcs.mnemonics}}` directly (see Section 6.3).

**Caching**: `mcs.js` follows the exact same caching pattern as `replace.js` — no separate mechanism:
- **Server-side**: module-level in-memory cache keyed by `mcs-{paCode}-{locale}`, with the same `CONFIG_CACHE_TTL` (5 minutes).
- **Client-side (preview)**: `localStorage` keyed identically, read/written in the same way as the dictionary cache in `replace.js`.

### 3.5 PH_REGEXP Update

`PH_REGEXP` in `replace.js` currently matches `[\w\-\_]+` which excludes dots. It must be extended to `[\w\-\_\.]+` to match dotted keys like `mcs.copy.name`. Existing placeholders are unaffected.

### 3.6 MCS Resolution Utility (`getMcsDictionary`)

A shared function exported from `io/www/src/fragment/transformers/mcs.js`, co-located with `replace.js`. It is a plain async function — not an IO action — following the same pattern as `getDictionary()` in `replace.js`:

- Fetches the MCS fragment for a given PA code + locale and flattens its fields into a `mcs.*`-keyed dictionary.
- Caches results using the same pattern as `replace.js`: in-memory on the server side, `localStorage` on the client side, both keyed by `mcs-{paCode}-{locale}` with `CONFIG_CACHE_TTL`.
- Used server-side by the `mcs` transformer's `init` step, and loaded directly by Studio for the preview pipeline and the placeholder picker.

---

## 4. MCS Sync Service (IO Runtime Actions)

New IO Runtime actions at `io/studio/src/mcs/`, providing the data layer for MCS synchronization.

### 4.1 `mcs-pull` (POST)

Fetches and compares product arrangement (PA) data from AOS against existing MAS fragments for a given locale.

1. **Fetch**: Retrieves paginated offers from AOS. Uses `MERCHANDISING_CONTENT` (not `MERCHANDISING`) to get inline copy alongside the merchandising node. `locale` is mandatory — AOS omits the merchandising block entirely without it. For PA+FI coverage in one request, `INLINE_MERCHANDISING` can be used.
2. **Diff**: Reads existing MCS fragments from MAS via the AEM Content Fragments API (same authentication pattern as other IO studio actions), keyed by path `/content/dam/mas/mcs/{locale}/{paCode}`. Compares each fragment's fields against the AOS payload:
    - Identifies **New** PAs (no fragment found in MAS).
    - Identifies **Changed** fields for existing PAs.
3. **State**: Returns the diff summary and persists it in IO Runtime state (compressed) for the current sync session.

### 4.2 `mcs-apply` (POST)

Persists selected changes from AOS to MAS fragments and optionally creates card variants.

- **Create/Update MCS**: Generates or patches MCS fragments in AEM.
- **Create Variants**: For new PAs, creates corresponding card fragments on selected surfaces (e.g., CC_ALL_APPS, PHOTOGRAPHY) that reference the new MCS fragment via placeholders.
- **Tagging**: Updates sync metadata (e.g., `mas:mcs/synced-at`) and associates new cards with the PA code.

---

## 5. MCS Editor & Sync UI (Studio)

The MCS Editor is a specialized interface for managing merchandising data and orchestrating the sync process.

### 5.1 Structured Editor (`mas-mcs-editor`)

A non-visual, form-based editor optimized for MCS data categories (Identity, Copy, Assets, Links).

- **Sync Status**: Displays the last sync timestamp and pending upstream changes.
- **Data Categories**: Organized sections for editing and reviewing MCS-mapped fields.
- **Placeholder Reference**: A read-only panel showing all available `{{mcs.*}}` keys and their current values.
- **Consumer Tracking**: Lists all MAS cards currently referencing this specific PA's data.

### 5.2 Sync Wizard (`mas-mcs-sync-wizard`)

New file: `studio/src/mcs/mas-mcs-sync-wizard.js`

A full-page multi-step wizard that manages the sync process. It can be launched for a single PA from the editor or for all PAs in a locale from the content list.

1. **Discovery**: Calls `mcs-pull` for the target scope. Groups results into "New", "Modified", and "Up-to-date".
2. **Reconciliation**: Side-by-side diff for each modified PA with "Accept All" / "Reject All" / field-level checkboxes. For new PAs, lists applicable surfaces with checkboxes to create card variants pre-populated with `{{mcs.*}}` placeholders.
3. **Review**: Summary of all pending actions — "Create N MCS fragments", "Update M MCS fragments", "Create X card variants".
4. **Apply**: Calls `mcs-apply` with the finalized payload. Reports progress, errors, and provides a "View Updated Fragments" link on completion.

---

## 6. MCS Placeholder Picker (Card Editor)

### 6.1 Picker Button in Fragment Editor

A single "MCS" button in `studio/src/mas-fragment-editor.js` opens the `mas-mcs-placeholder-picker` dialog. No per-field buttons or RTE plugin are needed — the picker is a single entry point at the fragment editor level.

### 6.2 Picker Dialog: `mas-mcs-placeholder-picker`

New file: `studio/src/editors/mas-mcs-placeholder-picker.js`

- Shows available `{{mcs.*}}` placeholder keys grouped by category (Copy, Assets, Links, Fulfillable Items).
- For each key, shows the **resolved value** for the card's current PA (via `getMcsDictionary()` from `io/www/src/fragment/transformers/mcs.js`).
- Asset placeholders show image thumbnails; link placeholders render as Spectrum links.
- Clicking a key copies it to the clipboard for the user to paste into the desired field.

### 6.3 Mnemonic Field: "Inherit from MCS"

The mnemonic field (`mas-mnemonic-field`) has a special integration with MCS via the composite placeholder `{{mcs.mnemonics}}`.

**Authoring (Studio — `mnemonic-field.js`, `mas-mnemonic-modal.js`)**:

- The field exposes an **"Inherit from MCS"** checkbox. Its checked state is derived purely from whether the current field value equals `{{mcs.mnemonics}}` — no additional flag or field is stored.
- **Checking** the box saves the current mnemonic value in memory and writes `{{mcs.mnemonics}}` as the field value.
- **Unchecking** the box restores the previously saved value. The raw placeholder is never shown in the UI; the modal displays "Inherited from MCS" as a visual indicator instead.

**Resolution (delivery pipeline and Studio preview — `mcs.js`)**:

- When `mcs.js` encounters `{{mcs.mnemonics}}` in the fragment body, it builds the full `<mas-mnemonic>` element (icon, alt text, link) from the resolved MCS asset and copy values and substitutes it directly in `context.body`.
- This bypasses `replace.js` because the resolved value is HTML markup, not a plain string.

---

## 7. State Management

### 7.1 MCSStore

`MCSStore` is the single source of truth for all MCS-related state in Studio. It is a dedicated store module at `studio/src/mcs/mcs-store.js`, composed of `ReactiveStore` instances following the same home-made reactivity pattern used throughout `studio/src/store.js`.

All components and operations read from and write to `MCSStore` — nothing holds MCS state locally.

### 7.2 State Shape

Each property is a `ReactiveStore` instance with `.get()`, `.set()`, and `.subscribe()`:

| Property         | Initial value | Description                                                      |
| ---------------- | ------------- | ---------------------------------------------------------------- |
| `syncStatus`     | `'idle'`      | `'idle' \| 'pulling' \| 'applying' \| 'error'`                   |
| `lastSyncedAt`   | `null`        | Timestamp of the last successful `mcs-apply`                     |
| `pendingDiffs`   | `[]`          | Diff result from `mcs-pull`, array of PA diff objects            |
| `resolvedValues` | `{}`          | Last resolved `mcs.*` dictionary for the current PA, populated by `mcs.js` (the cache lives in `mcs.js`, not the store) |
| `wizardStep`     | `null`        | `'discovery' \| 'reconciliation' \| 'review' \| 'apply' \| null` |

### 7.3 Operations

Each operation is a method on `MCSStore` that drives the corresponding IO action and updates state:

- **`pull(scope)`**: Sets `syncStatus = 'pulling'`, calls `mcs-pull`, stores results in `pendingDiffs`.
- **`apply(selections)`**: Sets `syncStatus = 'applying'`, calls `mcs-apply` with the user's selected changes, clears `pendingDiffs`, updates `lastSyncedAt` on success.
- **`resolve(paCode, locale)`**: Calls `getMcsDictionary()` from `mcs.js` (which owns the cache) and writes the result into `resolvedValues` for display by the placeholder picker.
- **`reset()`**: Clears `pendingDiffs`, `wizardStep`, and `syncStatus` back to idle.

---

## 8. Security Considerations

- AOS API calls from IO Runtime use server-side API key + IMS token, never exposed to client
- All `mcs-*` actions are protected by IMS Bearer token authorization
- PA codes read from card tags are validated against `/^[\w-]+$/` before being used in AOS or MAS requests
- `{{mcs.*}}` placeholders are resolved server-side in the delivery pipeline for published fragments, and client-side in Studio for preview using the same transformer pattern; unresolved MCS placeholders are **stripped** (replaced with empty string) to avoid exposing raw placeholder text in rendered output

---

## 9. Key Files to Create / Modify

**New files:**

- `io/studio/src/mcs/pull.js` -- Sync pull action (AOS fetch + diff)
- `io/studio/src/mcs/apply.js` -- Apply selected diffs to AEM
- `io/www/src/fragment/transformers/mcs.js` -- MCS transformer (`{ name, init, process }`) and shared `getMcsDictionary()` utility; used server-side by the pipeline and loaded directly by Studio for preview and the placeholder picker
- `studio/src/editors/mas-mcs-editor.js` -- MCS structured editor
- `studio/src/editors/mas-mcs-placeholder-picker.js` -- Placeholder picker dialog
- `studio/src/mcs/mas-mcs-sync-wizard.js` -- Multi-step sync wizard
- `studio/src/mcs/mcs-store.js` -- MCSStore: source of truth for all MCS state and operations

**Modified files:**

- `studio/src/constants.js` -- MCS surface, MCS_EDITOR page, MCS placeholder constants, tag prefixes
- `studio/src/store.js` -- Register MCSStore
- `studio/src/router.js` -- MCS editor page routing
- `studio/src/mas-side-nav.js` -- MCS surface nav entry
- `studio/src/mas-fragment-editor.js` -- Delegate to MCS editor when surface is mcs; add MCS picker button as single entry point
- `studio/src/fields/mnemonic-field.js` -- Add "Inherit from MCS" checkbox; save/restore previous value
- `studio/src/mas-mnemonic-modal.js` -- Hide `{{mcs.mnemonics}}` from display; show "Inherited from MCS" indicator
- `io/www/src/fragment/pipeline.js` -- Add `mcs` transformer before `replace`
- `io/www/src/fragment/transformers/replace.js` -- Extend `PH_REGEXP` to match dotted `mcs.*` keys (`[\w\-\_\.]+`)
- `studio/libs/fragment-client.js` -- Add client-side `mcs` step to preview pipeline
