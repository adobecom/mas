# M@S Studio — Lit/SWC Patterns for Claude Design

These rules are non-negotiable. Every UI generated for M@S Studio must follow them exactly.

## Theming

- Always wrap generated UI in `<sp-theme system="spectrum-two" color="light" scale="medium">`
- Never omit `sp-theme` — SWC components render unstyled without it
- The `system="spectrum-two"` attribute is required; `system="spectrum"` loads the wrong token set

## Component Registration

- All SWC component imports go in `studio/src/swc.js` — never inline in component files
- Custom Lit elements use `customElements.define('mas-name', ClassName)` — never decorators
- Only components listed in `components.md` are available in M@S Studio

## Naming

- Custom Lit elements: `mas-` prefix (e.g. `mas-create-dialog`, `mas-toolbar`)
- SWC primitives: `sp-` prefix (e.g. `sp-button`, `sp-textfield`)
- Never mix ownership: `mas-` components wrap `sp-` components, not the reverse

## Styling

- Component-level overrides use CSS custom properties only
- Never use `::part` selectors — use CSS custom properties instead
- Use `static styles = css\`...\`` in Lit components — never inline styles
- No inline `style=""` attributes on elements

## Lit Conventions

- Use `nothing` (imported from `lit`) for conditional removal — never empty string `''`
- Use `repeat()` for keyed lists
- Lifecycle order: `willUpdate` → `render` (pure, no side effects) → `firstUpdated` (runs once) → `updated` (runs each render)
- Use `@property()` + templates, not manual DOM updates via `querySelector`
- Immutable state updates: use spread operators to create new references

## Form Fields

- `sp-textfield`, `sp-number-field`, and `sp-picker` must always be paired with:
  - `<sp-field-label>` above the field
  - `<sp-help-text slot="help-text">` below the field (even if empty — omit only if truly unnecessary)
- Never use native `<input>`, `<select>`, or `<textarea>` in Studio UI
- Always set `id` on the field and `for` on the label

## Dialogs

- Use `sp-dialog-wrapper` for modal dialogs — not `sp-dialog` alone
- Footer actions: `<sp-button variant="secondary">Cancel</sp-button>` then `<sp-button variant="accent">Confirm</sp-button>`
- Always wire `@close` on `sp-dialog-wrapper` to dismiss handler

## Icons

- Use `<sp-icon-{name} slot="icon">` inside action buttons, menu items, and nav items
- Available icon names are listed in `components.md` under the `sp-icon-*` section
- Never use `<img>` or raw SVG for workflow icons — use SWC icon elements

## Tables

- Use `sp-table` + `sp-table-head` + `sp-table-body` + `sp-table-row` + `sp-table-cell`
- Row actions go in an `sp-action-menu` inside the last `sp-table-cell`
- Use `sp-table-checkbox-cell` for selectable rows (not `sp-checkbox` inside a cell)
