---
name: card-variant-registry
description: Reference for all merch-card variants, their field schemas, CSS classes, and slot mappings. Use when adding new variants, debugging variant rendering, or understanding variant differences. Activates on "card variant", "variant fields", "variant schema", "add variant", "variant slots", "variant rendering".
---

# Card Variant Registry

## Purpose
Comprehensive registry of all merch-card variants including field schemas, CSS classes, slot mappings, and rendering requirements. Essential reference when adding new variants or debugging variant-specific issues.

## When to Activate
### Automatic Triggers
- Adding new merch-card variant
- Debugging variant rendering issues
- Understanding variant field differences
- Mapping slots to editor fields

### Explicit Activation
- "list all card variants"
- "what fields does this variant have"
- "add new variant"
- "variant slot mapping"
- "compare variant schemas"

## Critical Files
- `/Users/andreitanasa/Desktop/mas/web-components/src/merch-card.js` - Main component
- `/Users/andreitanasa/Desktop/mas/web-components/src/variants/*.js` - Variant implementations
- `/Users/andreitanasa/Desktop/mas/web-components/src/variants/variants.js` - Core variant registry
- `/Users/andreitanasa/Desktop/mas/web-components/src/mas.js` - Additional variants (ccd-suggested, ccd-slice, ah-try-buy-widget, etc.)
- `/Users/andreitanasa/Desktop/mas/studio/src/editors/merch-card-editor.js` - Editor field definitions
- `/Users/andreitanasa/Desktop/mas/studio/src/constants.js` - Variant constants

## Testing Variants
Use `?maslibs=local` URL parameter to test local variant changes:
- **Local**: `?maslibs=local` → loads from localhost:3030 (requires MAS dev server running)
- **Branch**: `?maslibs=BRANCH-NAME` → loads from branch deployment (e.g., `?maslibs=MWPW-12345`)
- **Example**: `https://www.adobe.com/creativecloud/plans.html?maslibs=local`
- See [maslibs-parameter-guide skill](../maslibs-parameter-guide/skill.md) for full testing documentation

## SURFACES Reference

The SURFACES constant is centralized in `studio/src/constants.js` and uses an object structure:

```javascript
// Import pattern
import { SURFACES } from '../constants.js';

// SURFACES structure
export const SURFACES = {
    ACOM: { label: 'Adobe.com', name: 'acom' },
    ADOBE_HOME: { label: 'Adobe Home', name: 'adobe-home' },
    CCD: { label: 'CCD', name: 'ccd' },
    COMMERCE: { label: 'Commerce', name: 'commerce' },
    EXPRESS: { label: 'Express', name: 'express' },
    NALA: { label: 'Nala', name: 'nala' },
    SANDBOX: { label: 'Sandbox', name: 'sandbox' },
};

// Usage in variant definitions
{ label: 'Catalog', value: 'catalog', surface: SURFACES.ACOM.name }  // ✓ Correct
{ label: 'Catalog', value: 'catalog', surface: 'acom' }              // ✗ Avoid hardcoded strings
```

## Variant Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VARIANT SYSTEM                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   merch-card[variant="catalog"]                                      │
│   │                                                                  │
│   ├── CSS: .spectrum-heading-m, .spectrum-body-s                    │
│   ├── Slots: heading-m, body-s, footer                              │
│   └── Fields: title, body, osi, ctas, badge, iconField              │
│                                                                      │
│   Registration:                                                      │
│   ├── web-components/src/variants/catalog.js                        │
│   ├── web-components/src/variants/catalog.css.js                    │
│   └── web-components/src/variants.js (registry)                     │
│                                                                      │
│   Studio Editor:                                                     │
│   └── studio/src/editors/fields-by-variant.js                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Complete Variant Registry

### 1. Catalog Card
**Use Case:** Product catalog pages, general pricing cards

```javascript
const CATALOG_VARIANT = {
    name: 'catalog',
    surfaces: [SURFACES.ACOM.name, SURFACES.COMMERCE.name],

    slots: {
        'heading-m': { field: 'title', render: 'text' },
        'heading-xs': { field: 'subtitle', render: 'text' },
        'body-s': { field: 'body', render: 'richtext' },
        'body-xs': { field: 'shortDescription', render: 'richtext' },
        'footer': { field: 'ctas', render: 'cta-group' }
    },

    fields: [
        { name: 'variant', type: 'picker', required: true },
        { name: 'title', type: 'text' },
        { name: 'subtitle', type: 'text' },
        { name: 'body', type: 'richtext', marks: ['bold', 'italic', 'link'] },
        { name: 'shortDescription', type: 'richtext' },
        { name: 'osi', type: 'osi-picker' },
        { name: 'ctas', type: 'multifield', itemType: 'cta' },
        { name: 'size', type: 'picker', options: ['', 'wide', 'super-wide'] },
        { name: 'badge', type: 'text' },
        { name: 'iconField', type: 'mnemonic' },
        { name: 'backgroundImage', type: 'asset' }
    ],

    cssClasses: [
        'catalog',
        'spectrum-heading-m',
        'spectrum-body-s'
    ],

    customProperties: [
        '--merch-card-background',
        '--merch-card-border-color'
    ]
};
```

### 2. CCD Slice
**Use Case:** Creative Cloud product cards, compact format

```javascript
const CCD_SLICE_VARIANT = {
    name: 'ccd-slice',
    surfaces: [SURFACES.CCD.name],

    slots: {
        'image': { field: 'backgroundImage', render: 'image' },
        'body-s': { field: 'body', render: 'richtext' },
        'footer': { field: 'ctas', render: 'cta-group' }
    },

    fields: [
        { name: 'variant', type: 'picker', required: true },
        { name: 'title', type: 'text' },
        { name: 'body', type: 'richtext' },
        { name: 'osi', type: 'osi-picker' },
        { name: 'ctas', type: 'multifield', itemType: 'cta' },
        { name: 'badge', type: 'text' },
        { name: 'iconField', type: 'mnemonic' },
        { name: 'backgroundImage', type: 'asset' }
    ],

    cssClasses: [
        'ccd-slice',
        'spectrum-body-s'
    ]
};
```

### 3. CCD Suggested
**Use Case:** Suggested products in CCD, recommendation cards

```javascript
const CCD_SUGGESTED_VARIANT = {
    name: 'ccd-suggested',
    surfaces: ['ccd'],

    slots: {
        'heading-xs': { field: 'title', render: 'text' },
        'body-xs': { field: 'body', render: 'richtext' },
        'price': { field: 'osi', render: 'price' },
        'cta': { field: 'ctas', render: 'cta' }
    },

    fields: [
        { name: 'variant', type: 'picker', required: true },
        { name: 'title', type: 'text' },
        { name: 'body', type: 'richtext' },
        { name: 'shortDescription', type: 'text' },
        { name: 'osi', type: 'osi-picker' },
        { name: 'ctas', type: 'multifield', itemType: 'cta' },
        { name: 'badge', type: 'text' },
        { name: 'iconField', type: 'mnemonic' }
    ],

    cssClasses: [
        'ccd-suggested',
        'spectrum-heading-xs',
        'spectrum-body-xs'
    ]
};
```

### 4. Plans (Individuals)
**Use Case:** Individual pricing plans, subscription options

```javascript
const PLANS_VARIANT = {
    name: 'plans',
    surfaces: ['acom'],

    slots: {
        'icons': { field: 'iconField', render: 'mnemonic-list' },
        'heading-m': { field: 'title', render: 'text' },
        'heading-xs': { field: 'subtitle', render: 'text' },
        'body-m': { field: 'body', render: 'richtext' },
        'body-s': { field: 'description', render: 'richtext' },
        'body-xs': { field: 'shortDescription', render: 'richtext' },
        'price': { field: 'osi', render: 'price' },
        'footer': { field: 'ctas', render: 'cta-group' },
        'legal': { field: 'legalText', render: 'richtext' }
    },

    fields: [
        { name: 'variant', type: 'picker', required: true },
        { name: 'title', type: 'text' },
        { name: 'subtitle', type: 'text' },
        { name: 'body', type: 'richtext' },
        { name: 'description', type: 'richtext' },
        { name: 'shortDescription', type: 'richtext' },
        { name: 'osi', type: 'osi-picker' },
        { name: 'ctas', type: 'multifield', itemType: 'cta' },
        { name: 'size', type: 'picker', options: ['', 'wide', 'super-wide'] },
        { name: 'badge', type: 'text' },
        { name: 'iconField', type: 'mnemonic' },
        { name: 'legalText', type: 'richtext' }
    ],

    cssClasses: [
        'plans',
        'spectrum-heading-m',
        'spectrum-body-m',
        'spectrum-body-s'
    ]
};
```

### 5. Try-Buy Widget
**Use Case:** Adobe Home try/buy CTAs

```javascript
const TRY_BUY_WIDGET_VARIANT = {
    name: 'ah-try-buy-widget',
    surfaces: ['adobe-home'],

    slots: {
        'heading-xxs': { field: 'title', render: 'text' },
        'cta': { field: null, render: 'dynamic-cta' }
    },

    fields: [
        { name: 'variant', type: 'picker', required: true },
        { name: 'title', type: 'text' },
        { name: 'osi', type: 'osi-picker', required: true },
        { name: 'analyticsId', type: 'text' },
        { name: 'ctaLabel', type: 'text' }
    ],

    cssClasses: [
        'ah-try-buy-widget',
        'spectrum-heading-xxs'
    ]
};
```

### 6. Promoted Plans
**Use Case:** Adobe Home promoted subscription plans

```javascript
const PROMOTED_PLANS_VARIANT = {
    name: 'ah-promoted-plans',
    surfaces: ['adobe-home'],

    slots: {
        'icons': { field: 'iconField', render: 'mnemonic-list' },
        'heading-m': { field: 'title', render: 'text' },
        'body-s': { field: 'body', render: 'richtext' },
        'price': { field: 'osi', render: 'price' },
        'footer': { field: 'ctas', render: 'cta-group' }
    },

    fields: [
        { name: 'variant', type: 'picker', required: true },
        { name: 'title', type: 'text' },
        { name: 'body', type: 'richtext' },
        { name: 'osi', type: 'osi-picker' },
        { name: 'ctas', type: 'multifield', itemType: 'cta' },
        { name: 'badge', type: 'text' },
        { name: 'iconField', type: 'mnemonic' },
        { name: 'gradientBorder', type: 'checkbox' }
    ],

    cssClasses: [
        'ah-promoted-plans'
    ]
};
```

### 7. Fries
**Use Case:** Commerce/Cart integration cards

```javascript
const FRIES_VARIANT = {
    name: 'fries',
    surfaces: ['commerce'],

    slots: {
        'heading-xs': { field: 'title', render: 'text' },
        'body-xs': { field: 'body', render: 'richtext' },
        'footer': { field: 'ctas', render: 'cta-group' }
    },

    fields: [
        { name: 'variant', type: 'picker', required: true },
        { name: 'title', type: 'text' },
        { name: 'body', type: 'richtext' },
        { name: 'osi', type: 'osi-picker' },
        { name: 'ctas', type: 'multifield', itemType: 'cta' },
        { name: 'badge', type: 'text' },
        { name: 'iconField', type: 'mnemonic' }
    ],

    cssClasses: [
        'fries',
        'spectrum-heading-xs',
        'spectrum-body-xs'
    ]
};
```

### 8. Full Pricing Express
**Use Case:** Express pricing pages with full details

```javascript
const FULL_PRICING_EXPRESS_VARIANT = {
    name: 'acom-full-pricing-express',
    surfaces: ['acom'],

    slots: {
        'icons': { field: 'iconField', render: 'mnemonic-list' },
        'heading-m': { field: 'title', render: 'text' },
        'heading-xs': { field: 'subtitle', render: 'text' },
        'body-m': { field: 'body', render: 'richtext' },
        'body-s': { field: 'description', render: 'richtext' },
        'price': { field: 'osi', render: 'price' },
        'footer': { field: 'ctas', render: 'cta-group' }
    },

    fields: [
        { name: 'variant', type: 'picker', required: true },
        { name: 'title', type: 'text' },
        { name: 'subtitle', type: 'text' },
        { name: 'body', type: 'richtext' },
        { name: 'description', type: 'richtext' },
        { name: 'shortDescription', type: 'richtext' },
        { name: 'osi', type: 'osi-picker' },
        { name: 'ctas', type: 'multifield', itemType: 'cta' },
        { name: 'size', type: 'picker', options: ['', 'wide', 'super-wide'] },
        { name: 'badge', type: 'text' },
        { name: 'iconField', type: 'mnemonic' },
        { name: 'divider', type: 'checkbox' }
    ],

    cssClasses: [
        'acom-full-pricing-express'
    ]
};
```

## Variant-Field Matrix

| Field | catalog | ccd-slice | ccd-suggested | plans | try-buy | fries | full-pricing |
|-------|---------|-----------|---------------|-------|---------|-------|--------------|
| variant | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| title | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| subtitle | ✓ | - | - | ✓ | - | - | ✓ |
| body | ✓ | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| description | - | - | - | ✓ | - | - | ✓ |
| shortDescription | ✓ | - | ✓ | ✓ | - | - | ✓ |
| osi | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ctas | ✓ | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| size | ✓ | - | - | ✓ | - | - | ✓ |
| badge | ✓ | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| iconField | ✓ | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| backgroundImage | ✓ | ✓ | - | - | - | - | - |
| legalText | - | - | - | ✓ | - | - | - |
| analyticsId | - | - | - | - | ✓ | - | - |

## Adding a New Variant

### Step 1: Create Variant Files

```javascript
// web-components/src/variants/my-variant.js
import { html } from 'lit';

export class MyVariant {
    getContainer() {
        return html`
            <div class="my-variant-container">
                <slot name="heading-m"></slot>
                <slot name="body-s"></slot>
                <div class="footer">
                    <slot name="footer"></slot>
                </div>
            </div>
        `;
    }
}

// web-components/src/variants/my-variant.css.js
import { css } from 'lit';

export const styles = css`
    :host([variant="my-variant"]) {
        --merch-card-background: var(--spectrum-gray-50);
    }

    .my-variant-container {
        padding: var(--spacing-m);
    }
`;
```

### Step 2: Register Variant

```javascript
// web-components/src/variants.js
import { MyVariant } from './variants/my-variant.js';
import { styles as myVariantStyles } from './variants/my-variant.css.js';

export const VARIANTS = {
    // ... existing variants
    'my-variant': {
        class: MyVariant,
        styles: myVariantStyles
    }
};
```

### Step 3: Add Editor Fields

```javascript
// studio/src/editors/fields-by-variant.js
export const FIELDS_BY_VARIANT = {
    // ... existing variants
    'my-variant': [
        { name: 'variant', type: 'picker', required: true },
        { name: 'title', type: 'text' },
        { name: 'body', type: 'richtext' },
        { name: 'ctas', type: 'multifield', itemType: 'cta' }
    ]
};
```

### Step 4: Add to Variant Picker

```javascript
// studio/src/editors/variant-picker.js
export const VARIANT_OPTIONS = [
    // ... existing options
    { value: 'my-variant', label: 'My Variant', surface: 'acom' }
];
```

## Deleting a Default Card (Cascade Delete)

Deleting a default (non-variation) card — from either the content-list quick editor panel (`editor-panel.js`) or the full-screen fragment editor (`mas-fragment-editor.js`) — calls `MasRepository.deleteFragmentWithVariations()` (`studio/src/mas-repository.js`), not a plain `deleteFragment()`. This cascades the delete to all of the card's variations in one flow:

- **Locale variations** and **grouped variations** — discovered via `fragment.getVariations()`
- **Promo variations** — discovered separately via `getPromoVariationPaths()`, since they aren't stored in the card's `variations` field

Deleting a *variation* directly (not the default card) does not cascade — it only removes that one variation and unlinks it from its parent (`removeFromParentVariations`).

## Debugging Workflows

### 1. Check Variant Rendering

```javascript
// Debug variant slot rendering
(function debugVariantSlots() {
    const card = document.querySelector('merch-card');
    if (!card) return;

    const variant = card.getAttribute('variant');
    console.log(`Variant: ${variant}`);

    const slots = card.shadowRoot.querySelectorAll('slot');
    console.group('Slot assignments');

    slots.forEach(slot => {
        const name = slot.name || '(default)';
        const assigned = slot.assignedNodes();
        console.log(`${name}: ${assigned.length} nodes`);
        assigned.forEach(node => {
            console.log(`  - ${node.tagName || node.textContent?.slice(0, 30)}`);
        });
    });

    console.groupEnd();
})();
```

### 2. Compare Variants

```javascript
// Compare field schemas between variants
function compareVariants(variant1, variant2) {
    const fields1 = FIELDS_BY_VARIANT[variant1] || [];
    const fields2 = FIELDS_BY_VARIANT[variant2] || [];

    const allFields = new Set([
        ...fields1.map(f => f.name),
        ...fields2.map(f => f.name)
    ]);

    const comparison = [];
    allFields.forEach(fieldName => {
        const f1 = fields1.find(f => f.name === fieldName);
        const f2 = fields2.find(f => f.name === fieldName);

        comparison.push({
            field: fieldName,
            [variant1]: f1 ? '✓' : '-',
            [variant2]: f2 ? '✓' : '-',
            typeDiff: f1?.type !== f2?.type ? `${f1?.type || '-'} vs ${f2?.type || '-'}` : '-'
        });
    });

    console.table(comparison);
}

// Usage
compareVariants('catalog', 'plans');
```

### 3. Validate Variant CSS

```javascript
// Check CSS custom properties for variant
(function validateVariantCSS() {
    const card = document.querySelector('merch-card');
    if (!card) return;

    const style = getComputedStyle(card);
    const variant = card.getAttribute('variant');

    const properties = [
        '--merch-card-background',
        '--merch-card-border-color',
        '--merch-card-padding',
        '--merch-card-border-radius'
    ];

    console.group(`CSS for variant: ${variant}`);
    properties.forEach(prop => {
        const value = style.getPropertyValue(prop);
        console.log(`${prop}: ${value || '(not set)'}`);
    });
    console.groupEnd();
})();
```

## Quick Reference

```javascript
// Get all registered variants
const variants = Object.keys(VARIANTS);
console.log('Available variants:', variants);

// Get fields for variant
const fields = FIELDS_BY_VARIANT['catalog'];
console.log('Catalog fields:', fields.map(f => f.name));

// Check if variant supports field
function variantHasField(variant, fieldName) {
    const fields = FIELDS_BY_VARIANT[variant] || [];
    return fields.some(f => f.name === fieldName);
}
```

## Success Criteria
- [ ] All variants documented with fields
- [ ] Slot mappings verified
- [ ] CSS classes documented
- [ ] New variant follows registration pattern
- [ ] Editor fields configured
- [ ] Variant picker updated
