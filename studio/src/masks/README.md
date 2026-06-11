# Masks

A **mask** is a card fragment stored under `<surface>/<locale>/masks/<name>` that is overlaid on top of card fragments at render time. The pipeline deep-merges the mask's fields onto any card fragment when the `mask` query parameter matches.

## Content model

Masks use the same card content model (`/conf/mas/settings/dam/cfm/models/card`). Only fields present in the mask override the base fragment; absent fields are left untouched.

A mask may also declare a `variables` field (array of `key:value` strings). The `mask` transformer injects those pairs into the pipeline's replacement dictionary, making them available to the `replace` transformer.

## AEM folder structure

```
/content/dam/<surface>/<locale>/masks/<mask-name>   ← card fragment
```

Masks are tagged in the `mas:masks/<surface>/<mask-name>` namespace so the pipeline can resolve them by name.

## Studio UI

**`mas-masks` (`mas-masks.js`)** — list view, reached from Advanced Tools. Shows all mask fragments for the selected surface/locale in a table (name, description, last updated/published, status). Access is gated by `canAccessMasks(surface)`.

**`mas-mask-editor` (`mas-mask-editor.js`)** — edit view for a single mask. Left panel: General info (name is immutable after creation, title is editable) plus the plans-card field sections (Content, Price and promo, Footer, Badge & colors, Placeholders). Right panel: a live blurred preview of a plans-card template that unblurs each part as the matching field gains content.

**`MasksStore` (`masks-store.js`)** — reactive state store. Manages the mask list, loading flag, and the currently edited fragment. Key methods:

| Method | Description |
|---|---|
| `ensureLoaded(surface, locale)` | Loads masks for the given surface/locale (no-op if already loaded). |
| `createMask({ name, title, description, fields })` | Creates the `masks/` folder if needed, creates the card fragment, and assigns its identifying tag. |
| `saveMask(fragment)` | Persists field edits. Bypasses the main repository (masks have no OSI). |
| `loadMaskByName(name, surface, locale)` | Resolves a mask by node name (used for deep-linking the editor). |
| `publishMask(id)` | Publishes the mask fragment. |
| `deleteMask(id)` | Deletes the mask fragment and refreshes the list. |

## Pipeline integration

The `mask` transformer in `io/www/src/fragment/transformers/mask.js` runs after `promotions` and before `customize`:

1. Reads the `mask` request parameter (set by `<aem-fragment mask="...">` or a URL query param).
2. Fetches the mask card fragment, trying the regional locale first then falling back to the surface default locale.
3. Strips references from the mask (it is only used as an overlay).
4. Injects `variables` entries into `context.dictionary` for use by the `replace` transformer.
5. Exposes `context.maskFragment`; the `customize` transformer deep-merges it onto the card fragment.

The `mask` value is included in the response cache key (`m_<mask>`) so masked and unmasked responses are cached independently.
