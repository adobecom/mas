# mas-text

The `mas-text` component renders text content from a Card fragment, designed for use cases where text with pricing/CTAs needs to be displayed outside of a full merch-card context.

## Use Cases

- FAQ answers with regional pricing
- Text blocks with dynamic pricing
- Promo bars with localized content
- Any text content that needs regional variation support

## Features

- Uses existing **Card fragment model** - no new AEM model required
- Supports **regional variations** via MAS I/O customize.js pipeline
- Renders **inline-price** elements for geo-aware pricing
- Shares **fragment cache** with aem-fragment for efficiency
- Inherits page styles (no Shadow DOM)
- Lightweight (~3KB)

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `fragment` | string | required | The fragment ID to load |
| `field` | string | `'description'` | Which field to render: `description`, `shortDescription`, `promoText`, `callout` |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `aem:load` | `{ id, fields, field }` | Fired when fragment loads successfully |
| `aem:error` | `{ message, fragment }` | Fired when fragment fails to load |

## CSS Classes

| Class | Description |
|-------|-------------|
| `.error` | Added when fragment fails to load |

## Basic Usage

```html
<mas-text fragment="faq-photoshop-pricing"></mas-text>
```

## With Specific Field

```html
<mas-text fragment="promo-content" field="promoText"></mas-text>
```

## Usage in Milo FAQ/Accordion

### Authoring (in Google Docs/Word)

```
| FAQ (accordion, seo) |
| -------------------- |
| What does Photoshop cost? |
| <mas-text fragment="faq-photoshop-pricing"></mas-text> |
```

Or inline with other content:

```
| FAQ (accordion, seo) |
| -------------------- |
| How much is the Photography plan? |
| The Photography plan includes Photoshop and Lightroom. Pricing starts at <mas-text fragment="photography-plan-price"></mas-text> per month. See our [pricing page](/pricing) for details. |
```

### Fragment Content (in MAS Studio)

Create a Card fragment with the `description` field containing:

```html
<span is="inline-price" data-wcs-osi="abc123" data-template="price"></span>/month.
Offer valid for new subscribers only. <a href="/terms">See terms</a>.
```

### Regional Variations

The fragment will automatically resolve to the correct regional variation:

1. User visits `/fr` page from Luxembourg
2. MAS I/O receives request with `locale=fr_FR&country=LU`
3. customize.js finds `fr_LU` variation of the fragment
4. Returns merged content with Luxembourg-specific pricing

### Rendered Output (for Luxembourg user on /fr)

```html
<mas-text fragment="faq-photoshop-pricing">
  <span is="inline-price" data-wcs-osi="abc123">12,99 EUR</span>/mois.
  Offre valable uniquement pour les nouveaux abonnes. <a href="/terms">Voir les conditions</a>.
</mas-text>
```

## Integration with mas-commerce-service

The component requires `mas-commerce-service` to be present in the DOM (typically in `<head>`). This service provides:

- Locale/country settings for regional variation resolution
- WCS API key for pricing
- MAS I/O URL

Milo's `initService()` in `merch.js` handles this automatically.

## JavaScript API

```javascript
const masText = document.querySelector('mas-text');

// Access loaded data
console.log(masText.data); // { id, fields, ... }

// Refresh content (e.g., after locale change)
await masText.refresh();

// Listen for load
masText.addEventListener('aem:load', (e) => {
  console.log('Loaded:', e.detail);
});

// Check for errors
masText.addEventListener('aem:error', (e) => {
  console.error('Error:', e.detail.message);
});
```

## Caching

The component shares its cache with `aem-fragment`, meaning:

- If a fragment is loaded by `aem-fragment` first, `mas-text` will use the cached version
- If `mas-text` loads a fragment first, `aem-fragment` will benefit from the cache
- Use `masText.refresh()` to clear cache and reload

```javascript
// Access the shared cache
const cache = customElements.get('mas-text').cache;
cache.has('fragment-id');  // Check if cached
cache.clear();             // Clear all cached fragments
```

## Styling

The component renders without Shadow DOM, so content inherits page styles. You can style it like any block element:

```css
mas-text {
  display: block;
}

mas-text a {
  color: var(--link-color);
}

mas-text.error {
  color: red;
  border: 1px solid red;
}
```

## Comparison with merch-card

| Aspect | mas-text | merch-card |
|--------|----------|------------|
| **Purpose** | Text content with pricing | Full product card UI |
| **Styling** | Inherits page styles | Card-specific styling |
| **Shadow DOM** | No | Yes |
| **Fragment fields** | Single field (description) | Multiple fields (title, price, ctas, etc.) |
| **Use case** | Inline text, FAQ answers | Product showcases, pricing tables |
| **Cache** | Shared with aem-fragment | Shared with aem-fragment |
