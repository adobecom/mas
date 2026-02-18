# MAS Settings Table PRD

## Goal

Implement a new settings table experience using Spectrum Web Components:

- `mas-settings-table` as the table container (`src/settings/mas-settings-table.js`)
- `mas-setting-item` as the row unit (`src/settings/mas-setting-item.js`)
- settings-specific orchestration in `src/settings/settings-store.js`
- generic single-setting model in `src/settings/setting-store.js`

Design source:

- Main nested table: Figma node `16550:52114`
- Toggle feedback toast: Figma node `16848:275118`
- Publish success toast: Figma node `16848:265487`
- Action popover: Figma node `16766:190733`

## Key Decisions (locked)

- Keep using `sp-table` for top-level table layout.
- Expanded/nested area is custom layout (not pure nested `sp-table` mechanics).
- `SettingStore` is generic and keyed by `name`; setting payload is opaque record data.
- Use multiple reactive stores for overall settings UI.
- Do not use manual subscriptions in components; use `src/reactivity/reactive-controller.js`.
- No custom event bus for now; interactions should flow through store/orchestrator methods.
- Action popover has two actions: `Edit setting`, `Delete`.
- `Edit setting` behavior is deferred (placeholder/no-op for now).
- Template source starts from `src/editors/variant-picker.js` via new `getTemplates()` function.
- Settings source is `settings/index` for the current surface: `/content/dam/mas/<surface>/settings/index`.
- `mas-settings-table` consumes a shared settings-store singleton and does not receive `aem`/`surface` props.
- Hierarchy rule: top-level rows must have empty `locales`; nested rows must have non-empty `locales`.
- Nesting rule: nested rows are attached by `fieldName`; fallback grouping uses `name` for `entries`.

## UX Rules

### Template column summary

Given `selectedTemplates` and `availableTemplates`:

1. If nothing selected OR all selected: show `All templates selected`
2. If selected templates belong to one category: show `<Category> (<count> selected)`  
   Example: `Merch card (8 selected)`
3. Else show `<count> templates selected`  
   Example: `5 templates selected`

### Setting definitions (examples, generic support required)

- `Show Addon`
- `Show secure transaction`
- `Show Plan type`

These are data-driven records created by users; UI must not hardcode behavior to only these names.

### Feedback messages

- Toggle applied toast (neutral subdued style):  
  `'<Setting Label>' is now [On|Off]. The change has been applied to the <Template Summary> template for all locales.`
- Publish success toast (positive style):  
  `Setting has been successfully published.`

### Row actions popover

- `Edit setting` (implemented later)
- `Delete` (must be implemented with clear data mutation semantics)

## Technical Architecture

### 1) Single setting model

`src/settings/setting-store.js`

- `class SettingStore extends ReactiveStore`
- Value is a generic setting record object.
- Required properties in record (minimum):
    - `id` (stable row id, MUST be Fragment `id`)
    - `name` (setting key/name)
    - `label` (display name)
    - `data` (generic payload)
    - `overrides` (array)
- High-level methods (initial):
    - `patchData(patch)`
    - `setOverrides(overrides)`
    - `addOverride(override)`
    - `removeOverride(overrideId)`
    - `dispose()`

### 2) Settings orchestrator

`src/settings/settings-store.js`

- Singleton orchestrator as the only mutator of UI-level stores.
- Suggested stores:
    - `rows: ReactiveStore<SettingStore[]>`
    - `loading: ReactiveStore<boolean>`
    - `error: ReactiveStore<string | null>`
    - `expandedRowIds: ReactiveStore<string[]>`
    - `activeTabByRowId: ReactiveStore<Record<string, string>>`
    - `toast: ReactiveStore<{ variant: 'neutral'|'positive', message: string } | null>`
- Required orchestrator responsibilities:
    - Build/reuse `SettingStore` instances by stable row id
    - Dispose removed row stores
    - Load index by surface (`loadSurface(surface)`) from `/content/dam/mas/<surface>/settings/index`
    - Parse `settings-entry` records (`templates`, `locales`, `booleanValue`/`textValue`/`richTextValue`)
    - Map index references into hierarchy:
        - top-level row: `locales` empty
        - nested override: `locales` non-empty
    - Template summary formatting
    - Toast message formatting for toggle/publish

### 3) UI components

`src/settings/mas-settings-table.js`

- Owns top-level `sp-table` structure
- Uses `ReactiveController` for all store-driven refresh
- Composes row components using `SettingStore` instances from the singleton settings store

`src/settings/mas-setting-item.js`

- Encapsulates one row (collapsed + expanded visuals)
- Uses `ReactiveController` for its own row store
- Dispatches row interaction events consumed by `mas-settings-table`

### 4) Template source adapter

`src/editors/variant-picker.js`

- Add `getTemplates()` exported helper that returns normalized template metadata from `VARIANTS`
- `src/settings/settings-store.js` consumes `getTemplates()` (future source can be swapped)

## File Plan

- `src/settings/setting-store.js` (new)
- `src/settings/settings-store.js` (new)
- `src/settings/mas-setting-item.js` (new)
- `src/settings/mas-settings-table.js` (new)
- `src/settings/mas-settings-table.css.js` (new)
- `src/editors/variant-picker.js` (update: export `getTemplates()`)
- `src/mas-fragment.js` (integrate expanded settings table path)
- `test/settings/mas-settings-table.test.html` (new visual test)
- `test/settings/mas-settings-table.test.js` (new behavior tests)

## Task Breakdown

### Phase A: Data/Store foundation

- [x] Create `SettingStore` generic class in `src/settings/setting-store.js`
- [x] Create settings orchestrator in `src/settings/settings-store.js`
- [x] Implement row-store reuse map and disposal logic
- [x] Implement template summary formatter rules
- [x] Implement toast message formatters
- [x] Add `loadSurface(surface)` index loading in orchestrator
- [x] Add settings-entry normalization support for `locales`, `templates`, and typed values
- [x] Implement hierarchy mapping (top-level rows + nested locale overrides)

### Phase B: UI implementation

- [x] Implement `mas-setting-item` row component
- [x] Implement `mas-settings-table` container component
- [x] Implement table + nested styles in `mas-settings-table.css.js`
- [x] Wire actions popover with `Edit setting` + `Delete`
- [x] Wire toggle interaction to orchestrator + toast updates
- [x] Implement table sort interaction for label column (`sp-table-head-cell` `sortable`)

### Phase C: Integration

- [x] Replace current expanded settings section path in `src/mas-fragment.js` with `mas-settings-table`
- [x] Ensure existing fragment load/refresh flow still works
- [x] Move settings fetch responsibility to settings orchestrator
- [x] Initialize settings load from `mas-settings` (`setAem` + `loadSurface`)
- [x] Make `mas-settings-table` consume singleton store only
- [ ] Finish export/import naming cleanup so all callsites use `SettingsStore` symbol directly (no alias namespace pattern)

### Phase D: Tests

- [x] Add visual fixture `test/settings/mas-settings-table.test.html` (Figma-like static data)
- [x] Add behavior tests for store/orchestrator + row interactions
- [x] Add template-summary edge case tests
- [x] Add dispose/reuse tests for row stores
- [x] Add label sort behavior test in `test/settings/mas-settings-table.test.js`
- [x] Add toggle feedback toast visibility assertion in visual fixture
- [x] Consolidate visual fixture checks into a single test case
- [x] Render visual fixture table as static HTML markup (no programmatic table creation)
- [x] Add hierarchy tests for locale nesting behavior (`fieldName` + `name` grouping)
- [x] Update tests to initialize/load shared settings-store singleton

## Acceptance Criteria

- Table visuals align with Figma for header/rows/nested group/actions within reasonable token fidelity.
- Template summary logic matches all 3 required output cases.
- Toggle action updates row state and shows neutral feedback toast copy.
- Publish success path shows positive feedback toast copy.
- No manual subscriptions in Lit components; `ReactiveController` only.
- Row stores are disposed when removed; no stale references retained.

## Open Items

- [x] Confirm source path for settings authoring set (`/content/dam/mas/<surface>/settings/index`).
- [x] Confirm hierarchy constraints for locale nesting (top-level locales empty; nested locales required).
- [x] Confirm nesting strategy (`fieldName` primary, `name` fallback for `entries`).
- [ ] Define delete semantics: remove override vs remove full setting record.
- [ ] Define publish trigger entry point (which action updates publish toast).
- [ ] Confirm final copy placeholders for template/locale wording in toggle toast.
- [ ] Align PRD `neutral` toast variant naming with existing app toast variants (`info`/`positive`/`negative`).
- [ ] Align module exports/imports so singleton usage is named consistently as `SettingsStore` across app + tests.
- [x] Confirm row id strategy (`id` source) for stable store reuse.  
       Decision: use setting Fragment `id`.
- [x] Add `getTemplates()` source adapter in `src/editors/variant-picker.js` (can be swapped later).

## Risks / Mitigations

- Risk: Row store identity churn across refreshes.  
  Mitigation: Reuse by stable `id` in orchestrator map.
- Risk: UI state drift across multiple stores.  
  Mitigation: Single orchestrator mutator policy.
- Risk: Memory leaks from removed rows.  
  Mitigation: Mandatory `dispose()` on row removal.
- Risk: Visual regression from token mismatch.  
  Mitigation: dedicated visual test fixture + iterative parity pass.

## Change Log

- 2026-02-18: Initial PRD created.
- 2026-02-18: Marked sorting, fragment integration validation, and visual toast/static-fixture test tasks as completed.
- 2026-02-23: Switched settings source to surface-level `settings/index`, added hierarchy mapping rules for locale overrides, and moved table consumption to a shared settings-store singleton. Remaining work: export/import naming cleanup and open semantic decisions.
