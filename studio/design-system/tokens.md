# M@S Studio — Token Reference

## Spectrum 2 Global Tokens

These CSS custom properties come from `@spectrum-css/tokens`. They are available in any element inside `<sp-theme system="spectrum-two">`. This table covers the ~40 tokens Studio components actually use — not the full 800-token set.

### Color

| Token | Light value | Usage in Studio |
|---|---|---|
| `--spectrum-white` | `#ffffff` | Dialog backgrounds (`mas-create-dialog`) |
| `--spectrum-gray-50` | `#fafafa` | Panel backgrounds |
| `--spectrum-gray-100` | `#f5f5f5` | Subtle backgrounds, hover states |
| `--spectrum-gray-200` | `#e6e6e6` | Borders, dividers (`mas-create-dialog` header border) |
| `--spectrum-gray-300` | `#d5d5d5` | Disabled borders |
| `--spectrum-gray-700` | `#464646` | Secondary text |
| `--spectrum-gray-800` | `#323232` | Primary text |
| `--spectrum-gray-900` | `#1a1a1a` | High-emphasis text |
| `--spectrum-blue-700` | `#1473e6` | Interactive accent (links, focus rings) |
| `--spectrum-blue-800` | `#0d66d0` | Accent button background |
| `--spectrum-red-700` | `#d7373f` | Error / destructive states |
| `--spectrum-red-800` | `#c9252d` | Error button background |
| `--spectrum-green-700` | `#268e6c` | Positive / success states |
| `--spectrum-orange-700` | `#e68619` | Notice / warning states |

### Spacing

| Token | Value | Usage |
|---|---|---|
| `--spectrum-spacing-100` | `4px` | Micro gaps (icon padding) |
| `--spectrum-spacing-200` | `8px` | Tight gaps (field label margin) |
| `--spectrum-spacing-300` | `12px` | Standard gaps |
| `--spectrum-spacing-400` | `16px` | Section padding |
| `--spectrum-spacing-500` | `20px` | Component padding |
| `--spectrum-spacing-600` | `24px` | Dialog padding, toolbar gaps |
| `--spectrum-spacing-700` | `28px` | Large section gaps |
| `--spectrum-spacing-800` | `32px` | Form field margins |

### Typography

| Token | Value | Usage |
|---|---|---|
| `--spectrum-font-family-base` | Adobe Clean, ui-sans-serif | Body text |
| `--spectrum-font-size-100` | `14px` | Body / label text |
| `--spectrum-font-size-200` | `16px` | Subheadings |
| `--spectrum-font-size-300` | `18px` | Dialog headings (`mas-create-dialog`) |
| `--spectrum-font-weight-regular` | `400` | Body |
| `--spectrum-font-weight-medium` | `500` | Labels, tab labels |
| `--spectrum-font-weight-bold` | `700` | Headings |
| `--spectrum-line-height-100` | `1.3` | Compact text (tables) |
| `--spectrum-line-height-200` | `1.5` | Body text |

### Component Scale

| Token | Medium value | Usage |
|---|---|---|
| `--swc-scale-factor` | `1` | SWC internal scale multiplier (do not override) |
| `--spectrum-component-height-100` | `32px` | Small component height |
| `--spectrum-component-height-200` | `40px` | Medium component height (default) |
| `--spectrum-component-height-300` | `48px` | Large component height |

---

## M@S Custom Properties (`--mas-*`)

These are Studio-specific overrides and extensions. There are only 3 currently in use.

| Token | Purpose | Where used |
|---|---|---|
| `--mas-status-accent-color` | Fragment status pill accent color | `mas-fragment.css.js`, `mas-fragment-editor.js` |
| `--mas-status-background-color` | Fragment status pill background | `mas-fragment.css.js`, `mas-fragment-editor.js` |
| `--mas-status-hover-color` | Fragment status pill hover background | `mas-fragment.css.js` |

These tokens are set per-fragment based on publish status (draft → gray, published → green, modified → orange). When generating UI that shows fragment status, use `sp-status-light` with the appropriate `variant` attribute rather than these custom properties directly.

---

## Do Not Use

These Spectrum 1 tokens are NOT available in `system="spectrum-two"` and will resolve to `unset`:

- `--spectrum-global-color-*` (Spectrum 1 global colors)
- `--spectrum-alias-*` (Spectrum 1 aliases)
- `--spectrum-semantic-*` (Spectrum 1 semantic tokens)

Always use `--spectrum-{category}-{scale}` tokens from the tables above.
