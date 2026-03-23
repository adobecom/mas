# Compare Chart Authoring PRD

## Status

- Baseline extracted from the historical compare-chart authoring flow implemented in commit `6c75e66a`.
- This document describes the old Studio authoring experience that needs to be preserved while the storage model changes.

## Objective

Port the old compare-chart authoring experience into [src/editors/compare-chart-editor.js](/Users/ilyas/git/mas/studio/src/editors/compare-chart-editor.js) without reintroducing the old `compare-*` fragment model architecture.

The new implementation may store data differently, but authors should retain the same core editing capabilities and interaction model.

## Users

- Merch authors building comparison tables for a set of merch cards.
- Editors who need fast in-context editing of table structure, column card assignment, and feature values.

## Goals

- Preserve the dedicated compare-chart editor experience.
- Preserve the live compare-chart preview as the primary editing surface.
- Preserve in-context editing for columns, sections, rows, and cells.
- Preserve advanced column configuration, including card assignment and display field management.
- Preserve author feedback patterns: loading states, validation, and toast feedback.

## Non-Goals

- Reintroducing `compare-chart`, `compare-fragment`, `compare-section`, `compare-row`, or `compare-value` content fragment models.
- Defining the final HTML serialization shape for `compareChart`.
- Specifying `io/*` runtime behavior.

## Product Principles

- The preview is the editor, not just an output sample.
- Most edits should happen in context with minimal navigation.
- Column configuration is a deeper workflow and merits a focused modal.
- Card assignment must be scoped, validated, and previewable before the author leaves the editor.

## Functional Requirements

### 1. Dedicated Compare Chart Workspace

The editor must render as a dedicated compare-chart workspace with:

- A top toolbar/header labeled `Compare Chart`.
- Count summaries for total columns and total sections.
- Primary actions to add a column and add a section.
- A busy/loading indicator while structural mutations are in progress.
- A block configuration row for compare-chart-level settings.

### 2. Compare-Chart-Level Configuration

The editor must support top-level chart configuration:

- Block picker with at least:
  - `Comparison Table`
  - `Table`
- Variant selection checkboxes when block type is `Table`.
- Supported legacy variants:
  - `merch`
  - `highlight`
  - `sticky`
  - `collapse`
  - `m-heading-icon`
  - `pricing-bottom`
  - `header-left`

### 3. Live Preview as Primary Editing Surface

The editor must render a live compare-chart preview panel that authors interact with directly.

The preview must:

- Render columns and sections from editor state.
- Show selected column, section, row, and cell state.
- Support clicking:
  - a column header
  - a section header
  - a row title
  - an individual cell
- Emit add-row actions from the preview.
- Support inline section title changes.
- Support inline row title changes.

### 4. Column Authoring

Authors must be able to manage columns directly from the compare chart.

Required capabilities:

- Add a new column from the toolbar.
- Select a column from the preview.
- Open a contextual column popover.
- Edit the column badge from the popover.
- Open a deeper `Configure Column` modal from the popover.
- Delete a column.

Column deletion must also update row/cell data so the deleted column’s positional values are removed from every row.

### 5. Column Configuration Modal

The column modal is a major part of the old workflow and must be preserved.

#### 5.1 Display Fields

Authors must be able to control which card fields appear in the column header.

Required capabilities:

- Show selectable display fields.
- Legacy field options:
  - `mnemonicIcon`
  - `cardTitle`
  - `prices`
  - `description`
  - `ctas`
- Preserve grouped ordering behavior across field groups.
- Allow selecting and unselecting display fields.
- Allow drag-and-drop reordering for selected fields.
- Restrict drag-and-drop reordering to items within the same group.
- Preserve stable display order, including for unselected fields.

#### 5.2 Badge

Authors must be able to edit the column badge in the modal as well as the popover.

#### 5.3 Card Assignment

Authors must be able to assign or replace the card linked to a column.

Required capabilities:

- Show current card chip with:
  - title
  - ID
  - open action
  - change action
- Show an empty state when no card is assigned.
- Open a card picker panel from the modal.
- Close the picker without dismissing the modal.
- Search cards within the same surface and locale as the compare chart.
- Restrict search results to card fragments only.
- Debounce card search.
- Limit search results.
- Show recent cards when the query is empty.
- Persist recent cards per surface/locale.
- Allow manual fragment ID entry as an alternative to browse/search.

#### 5.4 Card Validation Rules

Card assignment must enforce the legacy validation rules:

- Reject fragments outside the compare chart’s current surface/locale scope.
- Reject non-card fragments.
- Resolve card references by path and canonical ID when needed.

#### 5.5 Card Change Compatibility

When a card changes, the editor must check whether the currently selected display fields still exist on the new card.

Required behavior:

- Automatically remove incompatible display fields.
- Preserve compatible display fields.
- Inform the author that unavailable fields were removed.

#### 5.6 Card Preview

The column modal must contain a live card preview disclosure.

Required capabilities:

- Disclosure is open by default.
- Preview updates when the selected card changes.
- Preview shows loading state.
- Preview shows error state.
- Preview resolves by canonical card ID, even when the selected reference started from a stale path/ID pairing.

#### 5.7 Open Card in Editor

Authors must be able to open the selected card in Studio from the column modal.

Required behavior:

- Open the selected card in a new tab when allowed.
- Use the current Studio host.
- Navigate directly to the fragment editor route.
- Remove irrelevant query parameters.
- Fall back to same-tab navigation if opening a new tab is blocked.

### 6. Section Authoring

Authors must be able to manage sections.

Required capabilities:

- Add a section from the toolbar.
- Select a section from the preview.
- Edit section title from a contextual popover.
- Delete a section.

### 7. Row Authoring

Authors must be able to manage rows within sections.

Required capabilities:

- Add a row inside a section from the preview.
- Select a row from the preview.
- Edit row title from a contextual popover.
- Delete a row.

When a row is added, the old flow created one cell value per existing column. The ported experience must preserve the user outcome: a newly added row immediately has editable values across all current columns.

### 8. Cell Authoring

Authors must be able to edit individual cells from the preview.

Required capabilities:

- Select a cell from the preview.
- Open a contextual cell popover anchored to that cell.
- Show column and row context in the popover.
- Choose cell value type:
  - `No value`
  - `Boolean`
  - `Text`

#### 8.1 Empty Values

- Empty values render as a dash-like placeholder in the chart.
- Authors can switch an empty placeholder cell to boolean or text.
- If underlying value data is missing, the editor must create the missing cell data on first edit.

#### 8.2 Boolean Values

- Boolean values must be editable via checkbox/toggle behavior.
- `true` and `false` must be persisted distinctly.
- `false` must render as a cross-style negative mark in the preview.

#### 8.3 Text Values

- Text values must be editable inline through a text input.
- Switching from empty to text must show the text input immediately.

### 9. Contextual Editing Model

The old authoring flow used a layered editing model that must be preserved:

- Preview interaction selects the target object.
- Lightweight edits happen in contextual popovers.
- Deeper column edits happen in a focused modal.

Required behaviors:

- Popovers must anchor to the clicked preview item.
- Popovers must reposition with scroll.
- Clicking outside a popover dismisses it.
- Clicking within the preview should not immediately dismiss the selection workflow.
- `Escape` closes the current popover or modal.

### 10. Feedback and Responsiveness

The editor must provide responsive author feedback.

Required capabilities:

- Busy/loading state during structural mutations.
- Toast feedback for:
  - add success
  - delete success
  - assignment success
  - validation failures
  - compatibility cleanup info
  - save failures
- Inline empty states and help text where appropriate.

### 11. Data Hydration Requirements

The old flow supported deep reference hydration and partial data recovery. The new implementation does not need the same storage model, but it does need equivalent resilience.

Required outcomes:

- Build the preview/editor state from persisted compare-chart data plus referenced cards.
- Recover from partially hydrated nested data without collapsing the editor.
- Lazily resolve missing data needed for editing and preview.
- Keep local editor state synchronized after edits without requiring a full page reload.

## Authoring Flows

### Flow A: Build a Chart Structure

1. Author opens the compare-chart editor.
2. Author adds columns.
3. Author adds sections.
4. Author adds rows to sections.
5. Preview immediately reflects the current structure.

### Flow B: Configure a Column

1. Author clicks a column in the preview.
2. Author uses the popover for quick badge edits.
3. Author opens `Configure Column`.
4. Author picks display fields, adjusts order, edits badge, and assigns a card.
5. Author reviews the live card preview.
6. Author opens the card in Studio if deeper card edits are needed.

### Flow C: Edit Feature Values

1. Author clicks a cell in the preview.
2. Author chooses whether the value is empty, boolean, or text.
3. Author edits the value inline.
4. Preview reflects the change immediately.

### Flow D: Maintain Cards Safely

1. Author changes a column’s card.
2. Editor validates scope and model type.
3. Editor removes incompatible display fields if necessary.
4. Editor stores the new card in recents.
5. Preview updates to the new card.

## Acceptance Criteria

The port is complete when all of the following are true:

- Authors can add/remove columns, sections, and rows.
- Authors can click the preview to edit columns, sections, rows, and cells in context.
- Column configuration supports card search, recents, manual ID entry, preview, and open-in-editor.
- Card assignment is restricted to in-scope card fragments.
- Column display fields are selectable and reorderable.
- Changing the assigned card automatically removes unsupported display fields.
- Section and row titles can be updated from the compare chart UI.
- Cells support empty, boolean, and text modes.
- Newly needed cell data can be created during editing.
- The compare-chart preview remains live throughout the editing session.

## Porting Notes

The port should preserve the author-facing experience above while replacing the old persistence layer with the new collection-backed model:

- Card references now belong in `cards`.
- Compare feature/table content now belongs in `compareChart`.
- The old child-fragment CRUD model should be treated as implementation history, not as a requirement.

The UX target is the old workflow. The storage target is the new model.

## Clear Authoring Requirements

With [src/editors/merch-card-editor.js](/Users/ilyas/git/mas/studio/src/editors/merch-card-editor.js) as the Studio baseline, the historical compare-chart capability set should be translated into the following authoring requirements.

### A. Editor Shell

- `compare-chart-editor` must behave like a first-class full-page fragment editor, not a special embedded tool.
- The form authoring surface must live in the editor column.
- The live compare preview must live in the preview column managed by `mas-fragment-editor`.
- The editor must use the same general structure as `merch-card-editor`:
  - sectioned form layout
  - Spectrum field groups and inputs
  - immediate persistence on edit
  - no separate save step

### B. Primary Interaction Model

- The primary editing path must be persistent form controls, not floating popovers.
- Preview selection may be used to focus or reveal the relevant authoring section, but authors must not depend on ephemeral popovers for routine work.
- Deeper workflows that genuinely need isolation may use a modal, but that should be the exception, not the base editing model.

### C. Top-Level Compare Chart Settings

- Authors must be able to edit top-level compare-chart settings from a dedicated section near the top of the form.
- Required settings:
  - block type
  - selected variants
- Variant editing should follow the same mental model as card template/variant editing in `merch-card-editor`: explicit, visible, and always available from the form.

### D. Column Management

- Authors must be able to manage the compared cards from a dedicated `Columns` section in the form.
- Required capabilities:
  - list all columns in order
  - add a column
  - remove a column
  - reorder columns
  - select a column for detailed editing
- Each column must expose editable properties in a stable inspector-style UI:
  - assigned card
  - badge
  - display fields

### E. Card Assignment UX

- Card assignment must remain a rich workflow, but it should feel like a Studio field editor rather than a temporary popover flow.
- Required capabilities:
  - browse/search cards
  - show recent cards
  - allow manual fragment ID entry when needed
  - validate surface/locale scope
  - validate that the selected fragment is a card
  - open the selected card in Studio
  - show a live preview of the selected card state
- Card assignment UI may use a modal or expandable panel, but the selected card state must remain visible in the form after assignment.

### F. Column Display Fields

- Column display fields must be edited in a persistent form section, not hidden behind transient UI.
- Authors must be able to:
  - toggle supported display fields on/off
  - reorder selected fields
  - understand unavailable fields after card changes
- When a card change makes some display fields invalid, the editor must:
  - remove unsupported fields automatically
  - preserve supported fields
  - communicate the cleanup clearly

### G. Section and Row Management

- Authors must be able to manage sections and rows from the form in a hierarchical way.
- Required capabilities:
  - add section
  - edit section title
  - remove section
  - add row within a section
  - edit row title
  - remove row
- The UI should follow the same readability standard as `merch-card-editor`:
  - stable section headers
  - grouped controls
  - minimal hidden state

### H. Cell Editing

- Cell editing must support the same data capabilities as the old flow:
  - empty
  - boolean
  - text
- Cell editing should be exposed through a persistent editor pattern that fits the Studio form model.
- Acceptable patterns:
  - selecting a row and editing its cell values in an inline matrix editor
  - selecting a row and rendering per-column field groups below it
  - selecting a preview cell and focusing the corresponding persistent form controls
- The author must always be able to see where the active cell value is being edited.

### I. Preview Requirements

- The live preview remains essential and must stay author-facing throughout editing.
- The preview must:
  - reflect column, section, row, and cell changes immediately
  - reflect card assignment changes immediately
  - reflect block and variant changes immediately
  - support selecting authoring targets
- The preview should be treated like the merch-card preview:
  - always available beside the form
  - not the only place where editing controls exist

### J. Persistence Model

- The editor must preserve the new storage contract:
  - `cards` is the source of truth for card references and order
  - `compareChart` stores the feature matrix content
- Authoring interactions must write through the same immediate-update model used by `merch-card-editor`.
- The editor must normalize persisted output so that reopening the editor yields the same structure and ordering the author saw before saving.

### K. Empty and Loading States

- The editor must provide clear empty states rather than dead-end screens.
- Minimum states:
  - no cards assigned yet
  - no sections yet
  - no rows in a section yet
  - preview unavailable
  - loading/hydrating state
- Empty states must direct the author toward the next valid action.

### L. Variation and Field-State Affordances

- Where collection variation/inheritance is supported, compare-chart authoring should adopt the same affordances used by `merch-card-editor`.
- That includes, where applicable:
  - inherited vs overridden field state styling
  - restore-to-parent actions
  - top-level field state awareness for compare-chart-owned fields

### M. Spectrum-First Implementation

- Adobe Spectrum Web Components must be the default UI layer.
- Preferred primitives:
  - `sp-field-group`
  - `sp-textfield`
  - `sp-picker`
  - `sp-checkbox`
  - `sp-switch`
  - `sp-action-button`
  - `sp-button`
  - `sp-action-group`
  - `sp-divider`
- Custom UI should be reserved for the compare-specific matrix and preview interactions that Spectrum does not provide directly.

## Summary Decision

The old compare-chart feature set should be preserved, but its interaction model should be translated into the Studio editor pattern established by `merch-card-editor`.

That means:

- keep the live preview
- keep the rich compare-chart capabilities
- replace popover-heavy editing with persistent form-based authoring
- keep advanced column/card workflows where they add real value
- align persistence and visual structure with the rest of Studio
