# mas-text: Inline Fragment Content for Milo Pages

## Problem Statement

Adobe's merchandising content (pricing, descriptions, CTAs) lives in AEM Content Fragments managed through MAS Studio. Previously, the only way to render fragment content on a Milo page was through `merch-card`, which renders a full card UI (image, title, price, CTA button, etc.).

There was no way to extract a **single field** from a fragment and render it inline within existing page content — for example, inserting a live price into an FAQ answer, a promobar, or a text block.

### Before mas-text

Authors who wanted to show "plans starting at US$69.99/mo" in an FAQ answer had two options:

1. **Hardcode the price** — Breaks when pricing changes, doesn't support regional variations, no localization.
2. **Embed a full merch-card** — Renders an entire card UI inside the text, which is visually wrong and semantically incorrect.

There was no mechanism to say: "Give me just the `prices` field from fragment X and render it inline."

## Solution

`mas-text` is a lightweight web component that loads a Card fragment via `aem-fragment` and renders a single specified field as inline HTML. It reuses the existing Card fragment model — no new AEM model is required.

### After mas-text

Authors place a link in SharePoint with a specific URL format. During page decoration, the link is replaced with a `<mas-text>` element that fetches the fragment and renders the requested field inline.

**Example authored in SharePoint:**
```
...with plans starting at just https://mas.adobe.com/studio.html#mas-text&id=e41640a8-4b58-4af1-95bf-076cf01412cf&field=prices. Every Adobe Creative Cloud plan includes...
```

**Rendered output:**
```
...with plans starting at just US$69.99/mo excl. tax. Every Adobe Creative Cloud plan includes...
```

The price is live, localized, and updates automatically when pricing changes in the fragment.

---

## Architecture

### Data Flow

```
SharePoint document
    │
    ▼
Link: mas.adobe.com/studio.html#mas-text&id=FRAG_ID&field=prices
    │
    ▼ (Milo block decoration)
processMasText() in accordion block
    │
    ▼ (replaces link with web component)
<mas-text fragment="FRAG_ID" field="prices">
    │
    ▼ (internally creates)
    <aem-fragment fragment="FRAG_ID" style="display:none">
    │
    ▼ (fetches from MAS I/O)
    /fragment?id=FRAG_ID&locale=en_US
    │
    ▼ (on aem:load event)
    Extracts field → unwraps <p> → renders inline
    │
    ▼
<span>US$69.99/mo excl. tax</span>
```

### Component Responsibilities

| Component | Location | Role |
|-----------|----------|------|
| `processMasText()` | `milo/libs/utils/mas-text.js` | Finds mas-text links in DOM, replaces with `<mas-text>` elements |
| `<mas-text>` | `mas/web-components/src/mas-text.js` | Web component that loads a fragment field and renders it inline |
| `<aem-fragment>` | `mas/web-components/src/aem-fragment.js` | Handles fragment fetching, caching, and data transformation |
| Accordion block | `milo/libs/blocks/accordion/accordion.js` | Calls `processMasText()` during block decoration |

---

## Files Changed

### New Files

#### `mas/web-components/src/mas-text.js`
The web component itself. Key design decisions:

- **Extends LitElement** — Consistent with other MAS components.
- **Disables Shadow DOM** (`createRenderRoot` returns `this`) — Content inherits page styles, critical for inline text rendering.
- **Delegates to `aem-fragment`** — Reuses existing fragment loading, caching, and error handling. No duplicate fetch logic.
- **Listens in capture phase** — Intercepts `aem:load` and `aem:error` from child `aem-fragment`, adds context (field name), then re-dispatches.
- **Unwraps single `<p>` tags** — AEM rich text fields wrap content in `<p>` tags. For inline use, a single paragraph wrapper creates unwanted margins. The component strips it automatically. Multi-paragraph content is preserved.
- **Double-registration guard** — `if (!customElements.get(TAG_NAME))` prevents errors when MAS bundles are loaded multiple times (common with `maslibs=local` during development).

#### `milo/libs/utils/mas-text.js`
Milo-side utility that bridges SharePoint authoring with the web component. Key design decisions:

- **URL pattern uses `id=` not `fragment=`** — This is critical. Milo's `merch-card-autoblock` runs during the autoblock phase (before block decoration) and matches links containing a `fragment` parameter. Using `id` instead means mas-text links naturally bypass `merch-card-autoblock` without requiring any guard or modification to that critical file.
- **Handles URL encoding** — SharePoint may encode `#` as `%23` in href attributes. The selector matches both `#mas-text` and `%23mas-text`.
- **Handles `&amp;` encoding** — SharePoint sometimes encodes `&` as `&amp;` in URLs. The parser normalizes this.
- **Initializes MAS service** — Ensures the commerce service is available before creating `<mas-text>` elements. Wrapped in try/catch since the service may already be initialized.

#### `mas/web-components/test/mas-text.test.html` and `mas-text.test.html.js`
Comprehensive test suite covering:
- Default field rendering (description)
- Specific field rendering (promoText, shortDescription, prices)
- Internal `aem-fragment` element creation
- Fragment data exposure via `data` getter
- Error handling for missing fragment attribute
- Error handling for fetch failures
- Refresh delegation to `aem-fragment`
- Clean disconnection (event listener removal)

#### `mas/web-components/test/mocks/sites/fragments/fragment-text-faq.json`
Mock fragment data for tests. Contains multiple fields (description, shortDescription, promoText, callout, prices) to test field selection.

### Modified Files

#### `mas/web-components/src/mas.js`
Added `import './mas-text.js';` — Registers the component as part of the MAS bundle.

#### `mas/web-components/src/aem-fragment.js`
Added double-registration guard:
```javascript
if (!customElements.get(AEM_FRAGMENT_TAG_NAME)) {
    customElements.define(AEM_FRAGMENT_TAG_NAME, AemFragment);
}
```
**Why:** The MAS build bundles `aem-fragment` into multiple dist files (`commerce.js`, `merch-card.js`, `mas.js`). When multiple bundles load (especially with `maslibs=local`), the same component tries to register twice, causing a fatal `NotSupportedError`. The guard is a standard web component pattern used by Lit, Spectrum, and other libraries.

#### `milo/libs/blocks/accordion/accordion.js`
Added:
```javascript
import processMasText from '../../utils/mas-text.js';
// ... later in the init function:
await processMasText(accordion);
```
This is called after the accordion DOM is assembled but before editorial features are applied.

### Files NOT Modified

#### `milo/libs/blocks/merch-card-autoblock/merch-card-autoblock.js`
No changes. The `id=` parameter strategy means mas-text links never match `merch-card-autoblock`'s `getOptions()` call, which looks for `fragment=`. The autoblock naturally skips mas-text links via its existing `if (!fragment) return;` check.

---

## Author URL Format

### Syntax
```
https://mas.adobe.com/studio.html#mas-text&id=FRAGMENT_ID&field=FIELD_NAME
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `id` | Yes | The AEM Content Fragment UUID |
| `field` | No | The fragment field to render. Default: `description` |

### Available Fields (Card Model)

| Field | Content Type | Example Use |
|-------|-------------|-------------|
| `description` | Rich text | Full product description |
| `shortDescription` | Rich text | Condensed description |
| `prices` | Rich text with inline-price | Live pricing |
| `cardTitle` | Plain text | Product name |
| `callout` | Rich text | Promotional callout |
| `promoText` | Rich text | Promotional messaging |
| `ctas` | Rich text with checkout links | Action buttons |
| `addon` | Rich text | Add-on content |

### Why `id` Instead of `fragment`

Milo's autoblock system processes links during `decorateArea()`, which runs **before** individual block decoration. The `merch-card-autoblock` matches links on `mas.adobe.com/studio.html` and extracts a `fragment` parameter via `getOptions()`. If mas-text links used `fragment=`, the autoblock would intercept them and render full merch-cards instead.

By using `id=`, mas-text links have no `fragment` parameter. The autoblock's existing `if (!fragment) return;` check naturally skips them. This avoids modifying `merch-card-autoblock` (a critical, widely-used file) and eliminates ordering dependencies between the autoblock phase and block decoration.

**Execution order:**
```
1. decorateArea() → autoblocks run
2. merch-card-autoblock sees mas-text link → getOptions() finds no 'fragment' → returns early
3. Block decoration → accordion init() → processMasText() → replaces link with <mas-text>
```

---

## Paragraph Unwrapping

AEM rich text fields typically wrap content in `<p>` tags:
```html
<p><span is="inline-price" data-wcs-osi="..."></span></p>
```

When rendered inline (e.g., mid-sentence in an FAQ answer), the `<p>` tag creates unwanted margins and line breaks. The `#unwrapSingleParagraph` method strips the outer `<p>` when:

1. The entire content starts with `<p>` and ends with `</p>`
2. There are no nested `<p>` tags (single paragraph only)

Multi-paragraph content is preserved as-is.

**Before unwrapping:**
```
...plans starting at just
                              ← extra margin from <p>
US$69.99/mo excl. tax
                              ← extra margin from </p>
. Every Adobe Creative Cloud plan...
```

**After unwrapping:**
```
...plans starting at just US$69.99/mo excl. tax. Every Adobe Creative Cloud plan...
```

---

## Regional Variations

`mas-text` inherits full regional variation support from `aem-fragment`. When the page locale is `fr_FR` or a regional variant like `fr_LU`, the fragment API automatically:

1. Finds the base fragment for the default locale
2. Looks for a regional variation matching the requested locale
3. Deep-merges the variation over the default
4. Returns the merged result

No special handling is needed in `mas-text` — this is transparent via the `aem-fragment` → MAS I/O pipeline.

---

## Local Development

### Testing locally

Run both Milo and MAS locally:

```bash
# Terminal 1: Milo
cd milo && npm run libs    # Serves at localhost:6456

# Terminal 2: MAS
cd mas/web-components && npm run build && npm run dev  # Serves at localhost:3030
```

Visit any page with:
```
?milolibs=local&maslibs=local
```

### Double-registration guards

When using `maslibs=local`, the MAS bundle may be loaded alongside Milo's bundled copy of MAS components. Both `aem-fragment.js` and `mas-text.js` include `if (!customElements.get(TAG_NAME))` guards to prevent `NotSupportedError` from `customElements.define()` being called twice.

This is a standard pattern — the same approach is used by Lit, Spectrum Web Components, and other web component libraries.

---

## Benefits

1. **Dynamic inline pricing** — Live prices in any text context (FAQ, promobar, text block), automatically localized and updated.
2. **No new AEM model** — Reuses existing Card fragments. Authors manage content in the same MAS Studio workflow.
3. **Regional variation support** — Inherited from the existing `aem-fragment` → MAS I/O pipeline. No additional work needed.
4. **Minimal footprint** — No changes to critical shared files (`merch-card-autoblock`, `merch.js`, etc.). The `id=` parameter strategy avoids conflicts by design.
5. **Extensible** — Works with any Card fragment field. Authors choose what to render via the `field` parameter.
6. **Consistent error handling** — Uses the same `aem:load`/`aem:error` event pattern as other MAS components.
