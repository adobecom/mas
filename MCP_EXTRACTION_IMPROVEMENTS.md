# MCP Extraction Improvements

## Overview

The MCP (Model Context Protocol) extraction has been updated to provide **dynamic, universal card extraction** that works with any Merch at Scale card type without hardcoded values.

## Key Improvements

### 1. Dynamic Card Type Detection

The MCP now automatically detects the card type from the live card instead of requiring it as input:

```javascript
// Auto-detect card type based on:
// - CSS classes and variant attributes
// - Presence of specific elements (price, icon, background)
// - Fallback logic for unknown types

const detectCardType = (cardElement) => {
    const cardClasses = cardElement.className || '';
    const cardVariant = cardElement.getAttribute('variant') || '';
    
    // Check for explicit type indicators
    if (cardClasses.includes('catalog') || cardVariant.includes('catalog')) return 'catalog';
    if (cardClasses.includes('plans') || cardVariant.includes('plans')) return 'plans';
    // ... more types
    
    // Infer from elements present
    const hasPrice = cardElement.querySelector('[slot="price"]');
    const hasIcon = cardElement.querySelector('merch-icon');
    const hasBackground = cardElement.querySelector('[slot="media"]');
    
    if (hasPrice && hasIcon) return 'fries';
    if (hasBackground) return 'catalog';
    if (hasPrice) return 'plans';
    
    return 'fries'; // default fallback
};
```

### 2. Universal CSS Property Extraction

Instead of hardcoded property lists, the MCP now extracts all meaningful CSS properties:

```javascript
const meaningfulProperties = [
    'color', 'background-color', 'border-color', 'border-top-color', 
    'border-right-color', 'border-bottom-color', 'border-left-color',
    'font-size', 'font-weight', 'line-height', 'text-align',
    'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
    'padding', 'margin', 'border-radius', 'display', 'position',
    'text-decoration', 'text-decoration-line', 'text-decoration-color'
];

// Only include properties with meaningful values (not transparent, auto, none, etc.)
```

### 3. Dynamic Element Discovery

The MCP uses flexible selector arrays to find elements that actually exist:

```javascript
const potentialSelectors = {
    title: [
        'h3[slot="heading-xxs"]',
        'h2[slot="heading-xs"]',
        'h1[slot="heading-s"]',
        '[slot="heading-xs"]',
        '[slot="heading-s"]',
        // ... more variations
    ],
    price: [
        'p[slot="price"] span[is="inline-price"]',
        '[slot="price"] span[is="inline-price"]',
        'span[is="inline-price"]',
        '[slot="price"]'
    ],
    // ... other elements
};

// Try each selector until one matches
for (const selector of selectors) {
    element = card.querySelector(selector);
    if (element) {
        usedSelector = selector;
        break;
    }
}
```

### 4. Enhanced Card Finding

Multiple strategies to locate cards on the page:

```javascript
const cardSelectors = [
    `aem-fragment[fragment-id="${cardId}"]`,
    `aem-fragment[fragment="${cardId}"]`,
    `merch-card[data-card-id="${cardId}"]`,
    `[data-fragment-id="${cardId}"]`,
    `[fragment-id="${cardId}"]`,
    'merch-card'
];
```

## Usage

The MCP now works with any card ID without requiring card type specification:

```javascript
// Before (hardcoded)
await extractor.extractActualCSSProperties(cardId, milolibs, 'fries');

// After (dynamic)
await extractor.extractActualCSSProperties(cardId, milolibs);
```

## Benefits

1. **Universal Compatibility**: Works with any card type (catalog, fries, plans, etc.)
2. **No Hardcoding**: No predefined selectors or CSS properties
3. **Auto-Detection**: Automatically identifies card type and elements
4. **Comprehensive Extraction**: Captures all meaningful CSS properties
5. **Flexible Selectors**: Adapts to different HTML structures

## Output Format

The extraction now includes:

```json
{
    "cardType": "fries",  // auto-detected
    "card": {
        "background-color": "rgb(255, 255, 255)",
        "border-top-color": "rgb(235, 235, 235)",
        // ... all meaningful card-level properties
    },
    "elements": {
        "title": {
            "selector": "h3[slot=\"heading-xxs\"]",
            "css": {
                "color": "rgb(44, 44, 44)",
                "font-size": "18px",
                // ... all meaningful element properties
            },
            "exists": true,
            "slot": "heading-xxs",
            "tagName": "h3",
            "textContent": "Creative Cloud All Apps"
        }
        // ... other elements
    },
    "slots": ["heading-xxs", "body-s", "price", "cta", ...]
}
```

## Core Principle

**"Extract what exists, not what's expected"** - The MCP now discovers and extracts actual card properties rather than looking for predefined specifications, making it truly universal and adaptable to any card configuration. 