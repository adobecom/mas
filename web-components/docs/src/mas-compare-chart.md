# mas-compare-chart custom element

## Introduction

`mas-compare-chart` renders a multi-column feature-comparison table built from a
set of `merch-card` columns and authored feature groups/rows. It can be driven
two ways:

- **Static light DOM** — author the card columns and feature groups directly as
  children.
- **AEM hydration** — place a single `aem-fragment` child whose fragment carries
  a `compareChart` HTML field and a `cards` reference field. The element parses
  the markup, creates one `merch-card` per referenced card, waits for them to
  resolve, then builds the table.

Child `merch-cards` are kept as real, slot-projected light-DOM children (each
with its own `aem-fragment`/hydration/`mas:ready` lifecycle); the shadow root
only renders the table grid that reads from them.

A maximum of **4** card columns is rendered; extra cards/references are ignored.

## Hydration

When a direct `aem-fragment` child fires `aem:load`, the element:

1. Parses the fragment's `compareChart` field as HTML, copies every attribute
   on the parsed root (`expanded-groups`, the `*-text` localization attributes,
   etc.) onto the host, and clones all `div[name]` feature groups into the light
   DOM (marked `data-compare-chart-generated`).
2. Resolves the ordered `cards` references (field order first, then
   `referencesTree`, then any fragment-bearing reference), creating a
   `merch-card[slot="cards"]` + nested `aem-fragment[loading="cache"]` per card.
3. Awaits every card's `checkReady()` then performs a final rebuild.

Rebuilds are re-entrancy-guarded and coalesced: card-level `aem:load` /
`mas:ready` events schedule a single `requestAnimationFrame`-batched rebuild
rather than one rebuild per card.

`checkReady()` resolves `true` once hydration completes, or `false` after a
30s timeout / on `aem:error`. Returns `true` immediately when there is no direct
`aem-fragment` child (static authoring).

## Content structure (light DOM)

**Feature groups / rows** are authored as:

```
<div name="<group-key>">
  <h4>Group heading</h4>
  <p name="<feature-key>">Row label</p>
  ...
</div>
```

**Card cells** live inside each `merch-card`, keyed `group-key@feature-key`:

```
<merch-card slot="cards" cell-color="default">
  ...card header slots...
  <p name="<group-key>@<feature-key>">Cell content</p>
</merch-card>
```

Cells may also be sourced from a `[slot="features"]` container inside the card.
Table-style groups (authored as HTML `<table>`s) are additionally parsed by
`compare-chart-table-parser.js` and appended after the `div[name]` groups.

The card's header region is extracted from these source slots and re-rendered as
table header rows: `icons`, `header`, `badge`, `price`, `description`, `detail`,
`cta`. Inline `style` attributes are stripped from extracted header content.

### Cell glyph semantics

Cell text is normalized to a chip + caption layout. Recognized glyph tokens:

| Meaning | Tokens | aria-label source |
| --- | --- | --- |
| Included | `✓ ✔ ✅` | `included-text` |
| Excluded | `✗ ✘ ✖ ×` | `not-included-text` |
| Not applicable | `—`, `-`, `--…`, empty | `not-applicable-text` |

- `✅` (or a cell `<p primary>`) renders a green "primary" check.
- A cell `<p item>` renders as plain item-cell text (no chip border).
- An empty cell renders a visible `—` plus screen-reader-only text from the
  `sr-only-not-applicable` placeholder (falling back to `not-applicable`).
- Columns whose card omits a feature get a synthetic "not applicable" cell so
  every row spans the full grid.

### Tooltips

A per-row or per-cell tooltip is sourced from a `title` attribute on the
authored `<p>`, or from a `<a class="secondary-link" title="…">`. The native
`title` is stripped at capture so the browser hover-box never fires; a custom
popover is rendered instead. Position is set via `data-tooltip-position`
(default `top-center`).

## Attributes / properties

| Attribute | Property | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `expanded-groups` | `expandedGroups` | `string` | first group | Which accordion groups are open. `all`, `none`, or a comma list of 1-based group indices (e.g. `1,3`). Reflected. |
| `collapsed` | `collapsed` | `boolean` | `false` | Renders nothing (collapses the whole chart). Reflected. |
| `consonant` | `consonant` | `boolean` | `false` | Propagated to child cards for Consonant CTA styles. |
| `spectrum` | `spectrum` | `string` | — | Propagated to child cards (`css` / `swc`). |
| `sticky-offset` | `stickyOffset` | `string` | `64` | Viewport offset (px or any CSS length) for the sticky header pin line (desktop). |
| `mobile-sticky-offset` | `mobileStickyOffset` | `string` | `40` | Viewport offset for the sticky header pin line in mobile layout (below the breakpoint). |
| `sticky-top` | `stickyTop` | `string` | — | **Deprecated** — use `sticky-offset`. |
| `non-sticky` | `nonSticky` | `boolean` | `false` | Disables the sticky-header behavior (used by the Studio editor preview). |
| `*-text` | — | `string` | English | Locale-aware aria/SR strings; see Localization. |

### Reflected/host data attributes

Set by the element on itself for styling/state hooks:

- `data-child-count` — number of card columns.
- `data-mobile` — present below the mobile breakpoint.
- `data-sticky-header` — present while the header is pinned.

## Localization (text attributes)

Five aria/screen-reader strings are read directly from `*-text` attributes on
the host (each with an English fallback). During AEM hydration every attribute
on the parsed `compareChart` root markup — including these — is copied onto the
host, so Studio-authored values flow through automatically.

| Attribute | Fallback | Usage |
| --- | --- | --- |
| `included-text` | `Included` | cell aria-label for ✓ |
| `not-included-text` | `Not included` | cell aria-label for ✗ |
| `not-applicable-text` | `Not applicable` | cell aria-label for —/empty |
| `sr-only-not-applicable-text` | value of `not-applicable-text` | SR-only text injected into empty cells |
| `choose-table-column-text` | `Choose column` | mobile column-picker `<select>` aria-label |

The Studio editor stamps these onto the stored `compareChart` markup as `{{key}}`
dictionary tokens (e.g. `included-text="{{included}}"`), which the live page's
dictionary resolves to localized strings before render.

## Responsive behavior

Below a host inline-size of **900px** (`data-mobile`), the grid collapses to a
2-column layout. With 3+ card columns each visible column gets a `<select>`
column picker so the user can choose which two columns to compare; selecting a
column that is already shown swaps the two sides.

## Sticky header

The header band pins while scrolling through the chart body. Two
`IntersectionObserver`s (top/bottom sentinels) toggle the pinned state; layout
reads (pin line, header height) happen once when observers are (re)created,
never on the scroll path. Sticky is skipped when `non-sticky`, `collapsed`, or
disconnected.

The pin line offset comes from `sticky-offset` on desktop and
`mobile-sticky-offset` (default `40px`) in mobile layout. A page may additionally
set the `--compare-chart-sticky-top` CSS variable on the host to add a global-nav
offset (ignored in mobile).

## Events

| Event | Direction | Detail | When |
| --- | --- | --- | --- |
| `expanded-groups-change` | dispatched | `{ value }` | a group is toggled (bubbles, composed) |
| `mas-compare-chart:rehydrate` | listened | — | dispatch on the host to force a full rebuild (e.g. Studio after save) |

## Methods

| Method | Returns | Description |
| --- | --- | --- |
| `checkReady()` | `Promise<boolean>` | Resolves when hydration completes (or `true` for static authoring); `false` on timeout/error. |

## Accessibility

The host exposes `role="table"` via `ElementInternals`; groups are
`rowgroup`s, rows are `row`s with a `rowheader`, and cells are `cell`s. A
visually-hidden header row exposes the column headers (`columnheader`). Glyph
spans are `aria-hidden`; meaning is conveyed through the localized cell
aria-labels above.
