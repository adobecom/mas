# M@S Studio — SWC Component Inventory

Every component in this file is registered in `studio/src/swc.js`. Claude Design must only use components listed here.

---

## sp-action-bar
- Attributes: open, flexible
- Real usage: bulk selection toolbar revealed when fragments are selected
- Notes: appears at bottom of viewport; wrap in `sp-underlay` when open

## sp-action-button
- Attributes: quiet, toggles, selected, disabled, size (s/m/l/xl)
- Real usage: `mas-toolbar.js` — `<sp-action-button toggles label="Filter">`
- Notes: use `quiet` variant inside toolbars; icons go in `slot="icon"`

## sp-action-group
- Attributes: quiet, compact, emphasized, selects (single/multiple)
- Real usage: `mas-toolbar.js` — groups filter + search controls
- Notes: wrap related `sp-action-button` elements; use `selects="single"` for view mode toggles

## sp-action-menu
- Attributes: quiet, placement, size
- Real usage: `mas-fragment-table.js` — `<sp-action-menu placement="bottom-end" quiet>`
- Notes: always contains `sp-menu-item` children; `<sp-icon-more slot="icon">` is the standard trigger icon

## sp-badge
- Attributes: variant (positive/negative/neutral/informative/notice), size
- Real usage: status indicators on fragments
- Notes: inline element; do not use as a button

## sp-breadcrumb-item
- Attributes: href
- Real usage: navigation path inside `sp-breadcrumbs`

## sp-breadcrumbs
- Real usage: folder path display in navigation

## sp-button
- Attributes: variant (accent/primary/secondary/negative/cta), size, quiet, disabled, pending
- Real usage: `mas-create-dialog.js:297` — `<sp-button variant="accent" @click=${this.handleSubmit}>Create</sp-button>`
- Notes: never use `<button>` directly in Studio UI; use `variant="secondary"` for cancel actions

## sp-button-group
- Real usage: groups `sp-button` elements in dialog footers
- Notes: renders buttons with correct Spectrum gap

## sp-checkbox
- Attributes: checked, indeterminate, disabled, size
- Real usage: multi-select lists and filter panels

## sp-combobox
- Attributes: value, disabled, pending, size
- Real usage: autocomplete inputs in filter panels

## sp-dialog
- Real usage: inner content container; prefer `sp-dialog-wrapper` for full modal dialogs

## sp-dialog-wrapper
- Attributes: headline, dismissable, underlay, open
- Real usage: `mas-copy-dialog.js` — full modal with headline + footer buttons
- Notes: always set `underlay`; wire `@close` to dismiss handler; footer buttons go in `slot="button"`

## sp-divider
- Attributes: size (s/m/l), vertical
- Real usage: separates sections in panels and menus

## sp-field-group
- Real usage: groups related fields with consistent spacing

## sp-field-label
- Attributes: for, required, size
- Real usage: `mas-create-dialog.js:279` — `<sp-field-label for="fragment-title" required>Internal title</sp-field-label>`
- Notes: always pair with `sp-textfield`, `sp-number-field`, or `sp-picker`

## sp-help-text
- Attributes: slot (help-text/negative-help-text), size
- Real usage: `<sp-help-text slot="help-text">Enter the fragment title</sp-help-text>` inside field wrappers

## sp-icon
- Attributes: src, size
- Real usage: wraps custom SVG icons; prefer `sp-icon-*` workflow icons

## sp-illustrated-message
- Attributes: heading
- Real usage: empty-state screens (no fragments found)
- Notes: use `slot="heading"` and `slot="description"` for content

## sp-link
- Attributes: href, quiet, variant (primary/secondary/over-background)
- Real usage: inline text links in help text and descriptions

## sp-menu
- Real usage: container for `sp-menu-item` inside `sp-action-menu`, `sp-popover`, `overlay-trigger`

## sp-menu-divider
- Real usage: horizontal separator between menu item groups

## sp-menu-group
- Attributes: label
- Real usage: labeled group of `sp-menu-item` elements

## sp-menu-item
- Attributes: value, disabled, selected
- Real usage: `mas-toolbar.js` — `<sp-menu-item @click=${() => this.selectContentType(value)}>`
- Notes: icons go in `slot="icon"`; use `slot="value"` for trailing metadata

## sp-number-field
- Attributes: value, min, max, step, disabled, size
- Real usage: numeric input fields in fragment editors
- Notes: always pair with `sp-field-label` and `sp-help-text`

## overlay-trigger
- Attributes: placement, offset
- Real usage: `mas-toolbar.js` — `<overlay-trigger id="trigger" placement="bottom" offset="6">`
- Notes: trigger element goes in `slot="trigger"`; content goes in `slot="click-content"`

## sp-overlay
- Real usage: programmatic overlay container; use `overlay-trigger` for declarative overlays

## sp-picker
- Attributes: value, disabled, pending, size, label
- Real usage: dropdown selects in filter panels and editors
- Notes: always pair with `sp-field-label`; `sp-menu-item` children define options

## sp-popover
- Attributes: open, placement, tip
- Real usage: `mas-toolbar.js` — `<sp-popover slot="click-content" direction="bottom" tip>`

## sp-progress-circle
- Attributes: indeterminate, size (s/m/l), label
- Real usage: `mas-create-dialog.js:253` — `<sp-progress-circle indeterminate size="l">`

## sp-radio
- Attributes: value, checked, disabled
- Real usage: inside `sp-radio-group` for mutually exclusive options

## sp-radio-group
- Attributes: selected, label
- Real usage: content type selectors

## sp-search
- Attributes: value, placeholder, label, disabled, size
- Real usage: `mas-toolbar.js` — `<sp-search label="Search" placeholder="Search" @submit="${this.handleSearchSubmit}">`

## sp-sidenav
- Real usage: primary navigation container
- Notes: use `mas-side-nav-item` (custom) instead of `sp-sidenav-item` in Studio

## sp-sidenav-heading
- Attributes: label
- Real usage: section headers inside `sp-sidenav`

## sp-sidenav-item
- Attributes: label, href, selected, disabled
- Real usage: navigation leaves inside `sp-sidenav`
- Notes: in Studio's edit mode, `mas-side-nav-item` is used instead

## sp-status-light
- Attributes: variant (positive/negative/neutral/notice/informative), size
- Real usage: fragment publish status indicators

## sp-switch
- Attributes: checked, disabled, size
- Real usage: boolean toggles in settings panels

## sp-tab
- Attributes: value, label, disabled
- Real usage: `mas-fragment-variations.js:455` — `<sp-tab value="locale" label="Locale">Locale</sp-tab>`
- Notes: must be direct child of `sp-tabs`; value must match `sp-tab-panel` value

## sp-tab-panel
- Attributes: value
- Real usage: `mas-fragment-variations.js:458` — `<sp-tab-panel value="locale">${this.localeVariationsTemplate}</sp-tab-panel>`
- Notes: must be direct child of `sp-tabs`; value must match `sp-tab` value

## sp-tabs
- Attributes: selected, quiet, direction (horizontal/vertical)
- Real usage: `mas-fragment-variations.js:454` — `<sp-tabs selected="locale" quiet>`

## sp-tag
- Attributes: deletable, disabled
- Real usage: taxonomy tag display inside `sp-tags`

## sp-tags
- Real usage: wraps multiple `sp-tag` elements for taxonomy display

## sp-textfield
- Attributes: value, placeholder, required, disabled, multiline, rows, size, type
- Real usage: `mas-create-dialog.js:281` — `<sp-textfield id="fragment-title" placeholder="Enter internal fragment title" value=${this.title}>`
- Notes: always pair with `sp-field-label` and `sp-help-text`; never use `<input>`

## sp-theme
- Attributes: system (spectrum-two), color (light/dark), scale (medium/large)
- Real usage: `studio.html` — `<sp-theme system="spectrum-two" color="light" scale="medium">`
- Notes: wraps the entire Studio app; every prototype must include this wrapper

## sp-toast
- Attributes: variant (positive/negative/neutral/info/warning), open, timeout
- Real usage: `mas-toast.js` — success/error notifications

## sp-tooltip
- Attributes: placement, open
- Real usage: hover labels on icon-only buttons; wrap trigger in `overlay-trigger`

## sp-top-nav
- Real usage: top application navigation bar

## sp-top-nav-item
- Attributes: href, selected
- Real usage: navigation items inside `sp-top-nav`

## sp-underlay
- Attributes: open
- Real usage: modal backdrop; used with `sp-dialog-wrapper`

## sp-table
- Attributes: selects (single/multiple), selected
- Real usage: `mas-fragment-table.js` — fragment list view
- Notes: always contains `sp-table-head` + `sp-table-body`

## sp-table-body
- Real usage: contains `sp-table-row` elements

## sp-table-cell
- Real usage: data cell inside `sp-table-row`

## sp-table-checkbox-cell
- Real usage: selectable row checkbox; use instead of `sp-checkbox` inside a cell

## sp-table-head
- Real usage: contains `sp-table-head-cell` elements

## sp-table-head-cell
- Attributes: sortable, sort-direction (asc/desc)
- Real usage: column header cells

## sp-table-row
- Attributes: value, selected
- Real usage: `mas-fragment-table.js:220` — `<sp-table-row value="${data.id}">`

---

## sp-icon-* (Workflow Icons)

All icons below are registered in `swc.js`. Use as `<sp-icon-{name} slot="icon">`.

`sp-icon-add`, `sp-icon-alert`, `sp-icon-apps`, `sp-icon-archive`, `sp-icon-aspect-ratio`,
`sp-icon-bell`, `sp-icon-bookmark`, `sp-icon-briefcase`, `sp-icon-brush`, `sp-icon-calendar`,
`sp-icon-camera`, `sp-icon-campaign`, `sp-icon-cancel`, `sp-icon-cclibrary`,
`sp-icon-checkmark-circle`, `sp-icon-checkmark`, `sp-icon-chevron-down`, `sp-icon-chevron-left`,
`sp-icon-chevron-right`, `sp-icon-chevron-up`, `sp-icon-close-circle`, `sp-icon-close`,
`sp-icon-cloud`, `sp-icon-code`, `sp-icon-collection`, `sp-icon-copy`, `sp-icon-cover-image`,
`sp-icon-data-correlated`, `sp-icon-delete`, `sp-icon-deselect`, `sp-icon-divide`,
`sp-icon-download`, `sp-icon-duplicate`, `sp-icon-edit`, `sp-icon-export`, `sp-icon-file-txt`,
`sp-icon-filter`, `sp-icon-folder-add`, `sp-icon-folder-open`, `sp-icon-globe-grid`,
`sp-icon-graph-bar-vertical`, `sp-icon-graphic`, `sp-icon-help-outline`, `sp-icon-help`,
`sp-icon-history`, `sp-icon-home`, `sp-icon-image`, `sp-icon-info-outline`, `sp-icon-info`,
`sp-icon-label`, `sp-icon-learn`, `sp-icon-link-check`, `sp-icon-link-out-light`,
`sp-icon-link-page`, `sp-icon-link`, `sp-icon-lock-closed`, `sp-icon-lock-open`,
`sp-icon-market`, `sp-icon-money`, `sp-icon-more`, `sp-icon-move`, `sp-icon-new-item`,
`sp-icon-offer`, `sp-icon-open-in`, `sp-icon-order`, `sp-icon-page-rule`, `sp-icon-pause`,
`sp-icon-preview`, `sp-icon-promote`, `sp-icon-publish-remove`, `sp-icon-publish`,
`sp-icon-refresh`, `sp-icon-remove`, `sp-icon-review-link`, `sp-icon-ribbon`,
`sp-icon-save-floppy`, `sp-icon-select-multi`, `sp-icon-select-no`, `sp-icon-select-rectangle`,
`sp-icon-settings`, `sp-icon-shopping-cart`, `sp-icon-social-network`, `sp-icon-star`,
`sp-icon-stroke-solid`, `sp-icon-table`, `sp-icon-tag-bold`, `sp-icon-tag-italic`,
`sp-icon-text-bold`, `sp-icon-text-bulleted`, `sp-icon-text-italic`, `sp-icon-text-strikethrough`,
`sp-icon-translate`, `sp-icon-underline`, `sp-icon-undo`, `sp-icon-unlink`,
`sp-icon-upload-to-cloud-outline`, `sp-icon-upload-to-cloud`, `sp-icon-user`, `sp-icon-video-filled`,
`sp-icon-view-card`, `sp-icon-view-grid-fluid`, `sp-icon-view-grid`
