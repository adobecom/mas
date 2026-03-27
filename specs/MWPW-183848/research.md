# Research: Express Cards Design QA

**Feature**: MWPW-183848
**Date**: 2026-01-06

## Decision Summary

| Area | Decision | Rationale |
|------|----------|-----------|
| Tablet breakpoint | 768px-1199px | Matches existing `media.js` definitions |
| 8/12 column width | `max-width: 66.67%` | Standard 12-column grid calculation |
| Tooltip management | Static class property | Simplest singleton pattern for active tooltip tracking |
| Animation duration | 300ms | Matches existing chevron animation, feels smooth |
| Border-only attribute | `border-color` without `show-cap` | Additive approach, backwards compatible |

---

## File Inventory

### Files to Modify

| File | Purpose | Changes |
|------|---------|---------|
| `simplified-pricing-express.css.js` | Simplified card styles | Tablet width, mobile margins, animation |
| `simplified-pricing-express.js` | Simplified card logic | Click handler for card body |
| `full-pricing-express.css.js` | Full size card styles | Tablet layout, CTA height, link styling |
| `mas-mnemonic.js` | Tooltip component | Dismiss logic, unified transitions |
| `merch-card.css.js` | Base card styles | Border without cap support |

### Reference Files (read-only)

| File | Information |
|------|-------------|
| `media.js` | Breakpoint constants |
| `global.css.js` | Design token values |
| `merch-icon.js` | Icon size definitions |

---

## Current CSS Analysis

### Simplified Pricing Express

**Location**: `web-components/src/variants/simplified-pricing-express.css.js`

#### Current Tablet Behavior (PROBLEM)
```css
@media screen and (min-width: 768px) and (max-width: 1199px) {
    merch-card-collection.simplified-pricing-express {
        padding: var(--spacing-m) 32px;
        grid-template-columns: 1fr;
        gap: 24px;
        width: var(--merch-card-simplified-pricing-express-tablet-width);
        margin: 0 auto;
    }
}
```
**Issue**: Fixed width variable, should be 8/12 columns (66.67%)

#### Current Mobile Expansion (PROBLEM)
```css
merch-card[variant="simplified-pricing-express"]:not([data-expanded="true"]) [slot="body-xs"] {
    display: none;
    visibility: hidden;
    height: 0;
}
```
**Issue**: Instant show/hide, no animation. Should use CSS transitions.

#### Current Mobile Width (PROBLEM)
```css
@media screen and (max-width: 767px) {
    merch-card[variant="simplified-pricing-express"] {
        width: 311px;
        max-width: 311px;
    }
}
```
**Issue**: Fixed width, should be responsive with 16px margins.

### Tooltip (mas-mnemonic)

**Location**: `web-components/src/mas-mnemonic.js`

#### Current Implementation (PROBLEM)
```css
.css-tooltip[data-tooltip]::before {
    transition: opacity 0.3s;
}

.css-tooltip[data-tooltip]::after {
    transition: opacity 0.3s;
}
```
**Issues**:
1. No global dismiss - tooltips overlap
2. Arrow (::after) and content (::before) animate separately
3. No touch event handling for mobile

### Full Pricing Express

**Location**: `web-components/src/variants/full-pricing-express.css.js`

#### Current Tablet Behavior (PROBLEM)
```css
@media (max-width: 1024px) {
    merch-card[variant="full-pricing-express"] {
        max-width: 365px;
    }
}
```
**Issue**: Displays as mobile on tablet (768-1024px range missing proper handling)

#### Current CTA Styling (PROBLEM)
```css
merch-card[variant="full-pricing-express"] [slot="cta"] a.button {
    padding: 12px 24px 13px 24px;
    border-radius: 26px;
}
```
**Issue**: No explicit height, should be 48px for size-large

#### Current Link Styling (PROBLEM)
```css
/* No specific rule for hyperlinks in feature list */
```
**Issue**: Missing `text-decoration: underline`

---

## Breakpoint Strategy

Based on `web-components/src/media.js`:

```javascript
export const MOBILE_LANDSCAPE = '(max-width: 767px)';
export const TABLET_UP = '(min-width: 768px)';
export const TABLET_DOWN = '(max-width: 1199px)';
export const DESKTOP_UP = '(min-width: 1200px)';
```

### Recommended Media Query Structure

```css
/* Mobile: 0-767px */
@media screen and (max-width: 767px) { }

/* Tablet: 768px-1199px */
@media screen and (min-width: 768px) and (max-width: 1199px) { }

/* Desktop: 1200px+ */
@media screen and (min-width: 1200px) { }
```

---

## Alternatives Considered

### Tooltip Dismiss Mechanism

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Static class property | Simple, no external deps | Couples instances | **Selected** |
| Event bus | Decoupled | Over-engineered for 1 use case | Rejected |
| Document click listener | Works globally | Performance overhead | Rejected |

### Animation Approach

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| CSS transitions | GPU accelerated, simple | Limited to animatable properties | **Selected** |
| Web Animations API | More control | Overkill for simple transitions | Rejected |
| JavaScript animation | Full control | Performance, complexity | Rejected |

### Border-Only Implementation

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| New `border-only` attribute | Explicit | Another attribute to document | Rejected |
| Absence of `show-cap` attribute | Backwards compatible | Implicit behavior | **Selected** |
| CSS variable toggle | Flexible | Complex for authors | Rejected |

---

## Test Page Verification

### Simplified Cards
- URL: https://main--da-express-milo--adobecom.aem.page/express/pre-launch/mas/homepage-poc?tab=3
- Viewport tests: 375px (mobile), 768px (tablet), 1200px (desktop)

### Full Size Cards
- URL: https://main--da-express-milo--adobecom.aem.page/express/pre-launch/mas/pricing-poc-2?tab=2
- Viewport tests: 375px (mobile), 768px (tablet), 1200px (desktop)

---

## Figma Reference

**Design File**: https://www.figma.com/design/rHeuOYAwNriEkl6Nr5HIQ5/Firefly-Pro-Pricing-Updates?node-id=2795-232057

### Key Measurements from Figma

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Card width (Simplified) | 100% - 32px | 8/12 cols | 311px fixed |
| Card width (Full) | 365px | 378px | 378px |
| CTA height | 48px | 48px | 48px |
| Premium icon | 14x14px | 14x14px | 20x20px |
| Card margins | 16px | 32px | auto |
| Animation duration | 300ms | - | - |
