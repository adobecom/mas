# Implementation Plan: Express Cards Design QA

**Branch**: `MWPW-183848` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Jira**: [MWPW-183848](https://jira.corp.adobe.com/browse/MWPW-183848)

## Summary

Fix CSS/styling issues in Simplified and Full Size Express merch-cards to match Figma design specs. Primary changes involve tablet breakpoint behavior, tooltip dismiss logic, mobile card interactions, border/cap separation, and icon/CTA sizing corrections.

## Technical Context

**Language/Version**: Vanilla JavaScript (ES Modules)
**Primary Dependencies**: Lit, Spectrum Web Components
**Storage**: N/A (CSS-only changes)
**Testing**: Playwright (NALA), Web Test Runner
**Target Platform**: Web (all modern browsers)
**Project Type**: Web Components monorepo
**Performance Goals**: Animations 200-400ms, no layout shift
**Constraints**: No TypeScript, no `::part` selectors, use CSS custom properties
**Scale/Scope**: 2 card variants, ~5 CSS files

## Constitution Check

*GATE: All checks pass*

| Principle | Status | Notes |
|-----------|--------|-------|
| II. Clean Code | ✅ Pass | Will run linter, remove unused code |
| III. Generic Over Specific | ✅ Pass | CSS changes use design tokens, no hardcoded values |
| VI. Code Style | ✅ Pass | CSS-in-JS pattern, design tokens |
| VIII. YAGNI | ✅ Pass | Only implementing requested fixes |
| IX. Root Cause First | ✅ Pass | Research identified specific CSS rules to modify |
| XII. Anti-Patterns | ✅ Pass | No `::part` selectors, using CSS custom properties |

## Project Structure

### Documentation (this feature)

```text
specs/MWPW-183848/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # CSS findings (below)
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (files to modify)

```text
web-components/src/
├── variants/
│   ├── simplified-pricing-express.css.js  # P1: Tablet width, mobile animations, tooltips, border/cap
│   ├── simplified-pricing-express.js      # P1: Click handler for card body expansion
│   ├── full-pricing-express.css.js        # P2: Tablet layout, border/cap, icon sizing, CTA styling
│   └── product.css.js                     # Reference: full size card styling
├── mas-mnemonic.js                        # P1: Tooltip dismiss logic
└── media.js                               # Reference: breakpoint definitions
```

---

## Research Findings

### Current State Analysis

| Issue | Current Implementation | Required Fix |
|-------|----------------------|--------------|
| **Tablet width (Simplified)** | Fixed 311px width on tablet | 8/12 columns (~66% of container) |
| **Tablet width (Full Size)** | Displays as mobile | Proper tablet layout (2 cols) |
| **Tooltip overlap** | No dismiss on new hover | Add `hideAllTooltips()` before show |
| **Tooltip arrow timing** | Separate transitions | Unified 0.3s transition on parent |
| **Mobile expand tap target** | Only chevron clickable | Entire card header clickable |
| **Mobile animation speed** | Instant (display: none/block) | CSS transition 300ms |
| **Mobile card width** | Fixed 311px | Responsive with 16px margins |
| **Desktop collapsed max-height** | `max-height: 50px` applied to all breakpoints | Move rule inside mobile media query only |
| **Mobile tooltip cutoff** | Fixed left position | Dynamic positioning based on bounds |
| **Badge cap auto-hide** | Always displayed | Hide badge-wrapper when badge slot empty |
| **Premium icon size** | Variable | 14x14px on mobile/tablet |
| **Seat icons inconsistent** | 2+ smaller than 100+ | Normalize to same size |
| **CTA height** | Variable | 48px (size-large) |
| **Hyperlink underline** | Missing in feature list | Add `text-decoration: underline` |

### Breakpoint Reference

```javascript
// From media.js
MOBILE_LANDSCAPE = '(max-width: 767px)'    // Mobile
TABLET_UP = '(min-width: 768px)'           // Tablet start
TABLET_DOWN = '(max-width: 1199px)'        // Tablet end
DESKTOP_UP = '(min-width: 1200px)'         // Desktop
```

### Key CSS Variables

```css
--consonant-merch-card-product-width: 300px (mobile), 378px (desktop)
--merch-card-simplified-pricing-express-width: 311px
--merch-card-full-pricing-express-width: 378px
--consonant-merch-spacing-xs: 16px (margins, border-radius)
```

---

## Implementation Tasks

### P1: Critical Fixes (3 tasks)

#### Task 1: Simplified Cards - Tablet Width
**File**: `web-components/src/variants/simplified-pricing-express.css.js`

```css
/* BEFORE: Fixed width on tablet */
@media screen and (min-width: 768px) and (max-width: 1199px) {
    merch-card[variant="simplified-pricing-express"] {
        min-width: var(--merch-card-simplified-pricing-express-tablet-width);
    }
}

/* AFTER: 8/12 column responsive width */
@media screen and (min-width: 768px) and (max-width: 1199px) {
    merch-card-collection.simplified-pricing-express {
        max-width: 66.67%; /* 8/12 columns */
        margin: 0 auto;
    }

    merch-card[variant="simplified-pricing-express"] {
        width: 100%;
        min-width: unset;
    }
}
```

#### Task 2: Tooltip Dismiss & Animation Fix
**File**: `web-components/src/mas-mnemonic.js`

Changes needed:
1. Add global tooltip manager to dismiss all tooltips before showing new one
2. Unify arrow and content transition timing
3. Handle touch events for mobile dismiss

```javascript
// Add to mas-mnemonic.js
static activeTooltip = null;

showTooltip() {
    // Dismiss any existing tooltip first
    if (MasMnemonic.activeTooltip && MasMnemonic.activeTooltip !== this) {
        MasMnemonic.activeTooltip.hideTooltip();
    }
    MasMnemonic.activeTooltip = this;
    // ... existing show logic
}

hideTooltip() {
    if (MasMnemonic.activeTooltip === this) {
        MasMnemonic.activeTooltip = null;
    }
    // ... existing hide logic
}
```

```css
/* Unified transition for tooltip + arrow */
.css-tooltip[data-tooltip]::before,
.css-tooltip[data-tooltip]::after {
    transition: opacity 0.3s ease, visibility 0.3s ease;
}
```

#### Task 3: Mobile Card Interaction Improvements
**File**: `web-components/src/variants/simplified-pricing-express.js`

Changes needed:
1. Make entire card header clickable (not just chevron)
2. Add smooth CSS transition for expand/collapse
3. Responsive width with 16px margins
4. Fix leftmost tooltip positioning

```css
/* Smooth expand/collapse animation */
merch-card[variant="simplified-pricing-express"] {
    transition: max-height 0.3s ease-out, padding 0.3s ease-out;
    overflow: hidden;
}

/* Responsive mobile width */
@media screen and (max-width: 767px) {
    merch-card[variant="simplified-pricing-express"] {
        width: calc(100% - 32px); /* 16px margins each side */
        max-width: none;
        margin: 0 16px;
    }
}

/* Fix leftmost tooltip cutoff */
merch-card[variant="simplified-pricing-express"] mas-mnemonic:first-child .css-tooltip.left[data-tooltip]::before {
    left: 0;
    transform: none;
}
```

```javascript
// In simplified-pricing-express.js - make header clickable
handleCardClick(e) {
    // Only on mobile/tablet
    if (window.innerWidth < 1200) {
        this.toggleExpanded();
    }
}
```

#### Task 3b: Fix Desktop Collapsed Max-Height Bug (COMPLETED)
**File**: `web-components/src/variants/simplified-pricing-express.js`

**Bug**: The `max-height: 50px` rule for non-gradient-border collapsed cards was outside any media query (lines 343-351), causing it to apply on desktop when it should only apply on mobile.

**Fix**: Moved the rule inside the `@media (max-width: 767px)` block:

```css
/* BEFORE: Outside media query - applies to all breakpoints */
:host([variant='simplified-pricing-express']:not([gradient-border='true'])[data-expanded='false'])
    .card-content {
    max-height: 50px;
    overflow: hidden;
}

/* AFTER: Inside mobile media query - applies only to mobile */
@media (max-width: 767px) {
    /* Non-gradient border collapsed state - limit card-content height */
    :host([variant='simplified-pricing-express']:not([gradient-border='true'])[data-expanded='false'])
        .card-content {
        max-height: 50px;
        overflow: hidden;
    }
}
```

### P2: Styling Fixes (4 tasks)

#### Task 4: Full Size Cards - Tablet Layout
**File**: `web-components/src/variants/full-pricing-express.css.js`

```css
/* Fix: Display as tablet, not mobile */
@media screen and (min-width: 768px) and (max-width: 1024px) {
    merch-card-collection.full-pricing-express {
        grid-template-columns: repeat(2, 1fr);
        max-width: calc(2 * 378px + 16px);
        padding: 0 32px;
    }
}
```

#### Task 5: Badge Cap Auto-Hide
**Files**:
- `web-components/src/variants/full-pricing-express.js`
- `web-components/src/variants/simplified-pricing-express.js`

**Note**: Limited to Express card variants only, not generic merch-card. The badge-wrapper (cap) should automatically hide when the badge slot has no content.

```css
/* Full Size Express: Hide badge-wrapper when no badge content */
:host([variant='full-pricing-express']:not(:has([slot='badge']:not(:empty))))
    .badge-wrapper {
    display: none;
}

/* Simplified Express: Hide badge-wrapper when no badge content */
:host([variant='simplified-pricing-express']:not(:has([slot='badge']:not(:empty))))
    .badge-wrapper {
    display: none;
}
```

**Implementation**: Uses CSS `:has()` selector to detect when the badge slot is empty and hides the badge-wrapper element accordingly. This is implemented in the variant `.js` files within the `variantStyle` template literal.

#### Task 6: Icon Sizing Normalization
**File**: `web-components/src/variants/full-pricing-express.css.js`

**Note**: Use generic selectors targeting slots and element types, not specific icon src/alt values (icon names can vary).

```css
/* All icons in heading (premium/crown) - 14x14 on mobile/tablet */
@media screen and (max-width: 1199px) {
    merch-card[variant="full-pricing-express"] [slot="heading-xs"] merch-icon,
    merch-card[variant="full-pricing-express"] [slot="heading-xs"] mas-mnemonic merch-icon {
        --img-width: 14px;
        --img-height: 14px;
    }
}

/* All icons in icons slot - consistent 20x20 size */
merch-card[variant="full-pricing-express"] [slot="icons"] merch-icon {
    --img-width: 20px;
    --img-height: 20px;
}
```

#### Task 7: CTA and Link Styling
**File**: `web-components/src/variants/full-pricing-express.css.js`

```css
/* CTA buttons - 48px height (size-large) */
merch-card[variant="full-pricing-express"] [slot="cta"] sp-button,
merch-card[variant="full-pricing-express"] [slot="cta"] a.button {
    height: 48px;
    min-height: 48px;
    line-height: 48px;
    padding: 0 24px;
}

/* Feature list hyperlinks - underlined */
merch-card[variant="full-pricing-express"] [slot="body-s"] a,
merch-card[variant="full-pricing-express"] [slot="body-xs"] a {
    text-decoration: underline;
    color: var(--spectrum-blue-900);
}
```

---

## Build Process

**IMPORTANT**: After any changes to files in `web-components/` folder, run:
```bash
npm run build
```
This command:
1. Runs all unit tests (must pass before compilation)
2. Compiles the Lit web components

**Ensure all tests pass before proceeding.** If tests fail, fix them before continuing with implementation.

## Testing Strategy

### Unit Tests (Web Test Runner)
- Tooltip dismiss behavior
- Card expansion state management
- Responsive breakpoint detection

### E2E Tests (NALA/Playwright)
- Tablet viewport: verify card widths
- Mobile: tap card body to expand/collapse
- Tooltip: hover sequence without overlap
- Visual regression: icon sizes, CTA heights

### Manual Testing
- Figma comparison on test pages
- Touch device testing for tooltips
- Animation smoothness verification

---

## Dependencies

- No new dependencies required
- Uses existing Spectrum design tokens
- Compatible with current Milo integration

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing card layouts | Visual regression tests, staged rollout |
| Tooltip changes affecting other components | Scoped to `mas-mnemonic` only |
| Animation performance on low-end devices | Use CSS transitions (GPU accelerated) |

---

## Next Steps

Run `/speckit.tasks` to generate actionable task list with time estimates.
