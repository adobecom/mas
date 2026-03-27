# Tasks: Express Cards Design QA

**Input**: Design documents from `/specs/MWPW-183848/`
**Prerequisites**: plan.md, spec.md, research.md
**Jira**: [MWPW-183848](https://jira.corp.adobe.com/browse/MWPW-183848)

**Tests**: CSS-focused changes - manual and E2E testing via NALA/Playwright after implementation.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- All paths relative to `web-components/src/`

---

## Phase 1: Setup

**Purpose**: Verify environment and understand current state

- [x] T001 Verify local development environment (aem up, npm run proxy)
- [x] T002 Review current CSS implementations in `web-components/src/variants/`
- [x] T003 Open Figma reference and test pages for visual comparison

**Checkpoint**: Environment ready, design specs understood

---

## Phase 2: Foundational

**Purpose**: No foundational tasks needed - all changes are isolated CSS modifications

**Checkpoint**: Ready to proceed directly to user stories

---

## Phase 3: User Story 1 - Tablet Layout Displays Correctly (Priority: P1) MVP

**Goal**: Cards display at proper tablet width (8/12 columns for simplified, appropriate size for full)

**Independent Test**: Resize viewport to 768px-1024px, verify card widths match Figma specs

### Implementation for User Story 1

- [x] T004 [P] [US1] Update tablet media query in `variants/simplified-pricing-express.css.js`:
  - Change fixed width to `max-width: 66.67%` (8/12 columns)
  - Update `merch-card-collection.simplified-pricing-express` to center with margin: 0 auto
  - Remove `min-width` variable dependency

- [x] T005 [P] [US1] Update tablet media query in `variants/full-pricing-express.css.js`:
  - Add proper tablet breakpoint (768px-1199px)
  - Set `grid-template-columns: repeat(2, 1fr)` for 2-column layout
  - Add appropriate max-width and padding

- [x] T006 [US1] Run linter on modified CSS files

**Checkpoint**: Both card types display correctly at tablet breakpoint (768px-1199px)

---

## Phase 4: User Story 2 - Icon Tooltips Behave Correctly (Priority: P1)

**Goal**: Tooltips dismiss properly when hovering different icons, no overlap

**Independent Test**: Hover over icons sequentially, verify previous tooltip disappears before new one appears

### Implementation for User Story 2

- [x] T007 [US2] Add static tooltip manager to `mas-mnemonic.js`:
  - Add `static activeTooltip = null` class property
  - Modify `showTooltip()` to dismiss existing tooltip first
  - Update `hideTooltip()` to clear active reference

- [x] T008 [US2] Unify tooltip transition timing in `mas-mnemonic.js`:
  - Update CSS for `.css-tooltip[data-tooltip]::before` and `::after`
  - Set unified `transition: opacity 0.3s ease, visibility 0.3s ease`
  - Ensure arrow and content animate together

- [x] T009 [US2] Add touch event handling for mobile tooltip dismiss in `mas-mnemonic.js`

- [x] T010 [US2] Run linter on mas-mnemonic.js

- [x] T010b [US2] **FIX: Device-aware tooltip behavior** in `mas-mnemonic.js`:
  - **Bug**: Reviewer reported tooltips overlap on hover, click keeps tooltip open on desktop, arrow lingers
  - **Root Cause 1**: Dual show/hide mechanisms (CSS `:hover` vs JS `tooltip-visible` class) conflicted
  - **Root Cause 2**: Mobile `pointerleave` fires immediately on touch end, causing tooltip to flash then disappear
  - **Root Cause 3**: Spectrum path bypassed dismiss logic entirely
  - **Fix**:
    1. Added `supportsHover` state property using `window.matchMedia('(hover: hover)')`
    2. Removed CSS `@media (hover: hover)` rules - JS state is single source of truth
    3. Desktop (hover: hover): `pointerenter`/`pointerleave` handlers for hover behavior
    4. Mobile (hover: none): `click` handler with `handleTap()` method for tap-to-toggle
    5. Added `closeOverlay()` method to programmatically close Spectrum overlay-trigger
    6. Updated `showTooltip()` to call `closeOverlay()` on previous active tooltip
    7. Added `@sp-opened` handler to Spectrum path for singleton dismiss logic

- [x] T010c [US2] **FIX: Desktop tooltip overlap when clicking then hovering** in `mas-mnemonic.js`:
  - **Bug**: On desktop, hovering and clicking an icon, then hovering another icon shows overlapping tooltips
  - **Root Cause**: CSS `:focus` selector shows tooltips independently of JS `.tooltip-visible` class. Clicking an icon gives it focus (via `tabindex="0"`), and even after mouseout, the `:focus` CSS keeps tooltip visible while hovering another icon shows its tooltip via `.tooltip-visible`
  - **Fix**: Change `:focus` to `:focus-visible` in CSS (lines 87-93). `:focus-visible` only matches keyboard navigation focus, not mouse click focus
  - **Impact**: Preserves keyboard accessibility while preventing click-induced focus from keeping tooltips open

**Checkpoint**: Tooltips dismiss correctly, no overlap, unified animation timing

---

## Phase 5: User Story 3 - Mobile Card Interaction (Priority: P1)

**Goal**: Smooth card expansion, tap anywhere to toggle, responsive width with margins

**Independent Test**: On mobile viewport, tap card body to expand/collapse, verify smooth animation

### Implementation for User Story 3

- [x] T011 [P] [US3] Add card body click handler in `variants/simplified-pricing-express.js`:
  - Implement `handleCardClick(e)` method
  - Check viewport width < 1200px before toggling
  - Call `toggleExpanded()` on click

- [x] T012 [P] [US3] Add smooth expand/collapse animation in `variants/simplified-pricing-express.css.js`:
  - Add `transition: max-height 0.3s ease-out, padding 0.3s ease-out`
  - Set `overflow: hidden` for animation containment
  - Replace `display: none/block` with height/opacity transitions

- [x] T013 [US3] Update mobile width to responsive in `variants/simplified-pricing-express.css.js`:
  - Change from fixed 311px to `width: calc(100% - 32px)`
  - Add `margin: 0 16px` for consistent spacing
  - Remove `max-width: 311px` constraint

- [x] T014 [US3] Fix leftmost tooltip cutoff in `variants/simplified-pricing-express.css.js`:
  - Add rule for `mas-mnemonic:first-child .css-tooltip.left`
  - Set `left: 0` and `transform: none` to prevent cutoff

- [x] T014b [US3] Fix collapsed card `max-height: 50px` applied to desktop in `variants/simplified-pricing-express.js`:
  - **Bug**: The `max-height: 50px` rule for non-gradient-border collapsed cards (lines 343-351) was outside any media query, applying to all breakpoints including desktop
  - **Fix**: Moved the rule inside the `@media (max-width: 767px)` block alongside the gradient-border collapsed state rule
  - Ensures collapsed card styling only applies on mobile, not tablet/desktop

- [x] T015 [US3] Run linter on modified files

**Checkpoint**: Mobile cards are responsive, animations smooth, tooltips visible

---

## Phase 6: User Story 4 - Express Card Badge Cap Auto-Hide (Priority: P2)

**Goal**: Badge-wrapper (cap) automatically hides when there is no badge text

**Scope**: Limited to `simplified-pricing-express` and `full-pricing-express` variants only (not generic merch-card)

**Independent Test**: Configure card without badge text, verify badge-wrapper (cap) is hidden

### Implementation for User Story 4

- [x] T016 [P] [US4] Add badge-wrapper auto-hide CSS in variant JS files:
  - Add `:host([variant='full-pricing-express']:not(:has([slot='badge']:not(:empty)))) .badge-wrapper { display: none }` in `full-pricing-express.js`
  - Verify `simplified-pricing-express.js` already has this CSS (lines 304-311)
  - Uses CSS `:has()` selector to detect empty badge slot

- [x] T017 [US4] Run linter on modified variant files

**Checkpoint**: Express cards automatically hide badge cap when no badge content

---

## Phase 7: User Story 5 - Premium Icon and CTA Styling (Priority: P2)

**Goal**: Correct icon sizes, CTA height (48px), and hyperlink underlines

**Independent Test**: Visual comparison with Figma - check crown icon (14x14px), seat icons (consistent), CTAs (48px), links (underlined)

### Implementation for User Story 5

- [x] T018 [P] [US5] Fix premium crown icon size in `variants/full-pricing-express.css.js`:
  - Add tablet/mobile media query for crown icon in heading-xs
  - **Key insight**: Must use `--mod-img-width` / `--mod-img-height` (not `--img-width`) because shadow DOM `:host([size])` rules have higher specificity
  - `merch-icon` uses: `width: var(--mod-img-width, var(--img-width))` - mod properties take precedence
  - Desktop: 20x20px, Mobile/Tablet: 14x14px
  - Added `align-items: center` for proper vertical alignment with text

- [x] T019 [P] [US5] Fix icons slot to allow flexible width icons in `variants/full-pricing-express.css.js`:
  - **Bug found**: Original selector `[slot="icons"] merch-icon` was wrong - looks for descendant
  - **Fix**: Changed to `merch-icon[slot="icons"]` - the element itself has the slot attribute
  - Set `--mod-img-width: auto` and `--mod-img-height: 21px` for flexible width with fixed height
  - This allows wide icons (like seat indicators) to display at proper aspect ratio

- [x] T020 [US5] Fix CTA button height in `variants/full-pricing-express.css.js`:
  - **Initial approach (ineffective)**: `height: 48px` was overridden by Spectrum's `min-block-size`
  - **Fix**: Use `--mod-button-height: 40px` to properly override Spectrum's internal sizing
  - Spectrum buttons use `min-block-size: var(--mod-button-height, var(--spectrum-button-height))`
  - The `--mod-*` properties are designed for external customization
  - Removed ineffective `height` and `max-height` properties
  - Selector already covers both `sp-button` and native `button.spectrum-Button` elements
  - **Text centering fix**: Added `--mod-button-top-to-text: 9px` and `--mod-button-bottom-to-text: 9px` for symmetric padding to center button text vertically within the 40px height

- [x] T020b [US5] Fix mas-mnemonic alignment in heading-xs in `variants/full-pricing-express.css.js`:
  - **Bug**: Crown icon in heading-xs slot not vertically aligned with text
  - **Root Cause**: `mas-mnemonic` uses `display: contents` on host, and existing CSS lacked `vertical-align`
  - **Fix**: Added `vertical-align: middle` and `padding-bottom: 3px` to the existing `[slot="heading-xs"] mas-mnemonic` rule (line 67-75)
  - The `vertical-align: middle` aligns the inline-flex icon with the text
  - The `padding-bottom: 3px` provides fine-tuned optical alignment with the font baseline

- [x] T021 [US5] Add hyperlink underline styling in `variants/full-pricing-express.css.js`:
  - Target `[slot="body-s"] a` and `[slot="body-xs"] a`
  - Set `text-decoration: underline`
  - Set `color: var(--spectrum-blue-900)`

- [x] T022 [US5] Run linter on full-pricing-express.css.js

**Checkpoint**: All visual elements match Figma specifications

---

## Phase 8: User Story 6 - Icon Alignment Across Cards (Priority: P1)

**Goal**: Icons align horizontally across cards regardless of text height

**Independent Test**: View 3+ cards with different description lengths side by side on desktop, verify icon rows are horizontally aligned.

### Implementation for User Story 6

- [x] T023 [US6] Update `syncHeights()` in `variants/simplified-pricing-express.js`:
  - Query `[slot="body-xs"] p:has(mas-mnemonic)` for each card in collection
  - Calculate max icon paragraph height across all cards
  - Set `--consonant-merch-card-simplified-pricing-express-icons-height` CSS variable on container

- [x] T024 [US6] Update CSS in `variants/simplified-pricing-express.css.js`:
  - Add `min-height: var(--consonant-merch-card-simplified-pricing-express-icons-height)` to `p:has(mas-mnemonic)` selector
  - Ensure rule only applies on desktop (within `@media ${DESKTOP_UP}`)

- [x] T025 [US6] Run linter on modified files

- [x] T026 [US6] Run `npm run build` to compile and test

- [x] T026b [US6] **CRITICAL BUG FIX**: Fix viewport check in `postCardUpdateHook()`:
  - **Bug**: Line 102 used `isDesktop()` which only returns true for 1200px-1599px viewports
  - **Root Cause**: `isDesktop()` in media.js is defined as `(min-width: 1200px) and (not (min-width: 1600px))`
  - **Fix**: Changed to `Media.isDesktopOrUp` which returns true for >= 1200px (including large desktops)
  - **Impact**: CSS variables for height sync were not being set on large desktop viewports (>= 1600px)
  - Added `import Media` to simplified-pricing-express.js

- [x] T026c [US6] **RACE CONDITION FIX**: Remove `hasExistingVars` optimization in `postCardUpdateHook()`:
  - **Bug**: CSS variables not being set on container at runtime
  - **Root Cause**: Race condition between initial render and fragment hydration:
    1. Card renders → `postCardUpdateHook()` runs → elements empty → vars set to "0px"
    2. Fragment hydrates → `postCardUpdateHook()` runs again
    3. `hasExistingVars` check sees "0px" (truthy) → only syncs THIS card, not all cards
    4. Result: Not all cards re-synced, vars may be wrong/absent
  - **Fix**: Remove the `hasExistingVars` conditional (lines 111-131), always sync all cards:
    ```javascript
    requestAnimationFrame(() => {
        const cards = container.querySelectorAll(
            `merch-card[variant="${this.card.variant}"]`,
        );
        cards.forEach((card) => card.variantLayout?.syncHeights?.());
    });
    ```
  - **Impact**: Ensures height sync runs correctly after fragment hydration

- [x] T026d [US6] Run `npm run build` to verify tests pass after race condition fix

- [x] T026e [US6] **HYDRATION TIMING FIX**: Update `checkReady()` in `merch-card.js`:
  - **Bug**: CSS variables still not being set after T026c fix
  - **Root Cause 1**: `intersectionObserver` only triggers `requestUpdate()` when cards enter viewport - cards below fold never get synced on initial load
  - **Root Cause 2**: `VARIANTS_WITH_HEIGHT_SYNC.includes(this.variantLayout)` compared variantLayout OBJECT to array of STRINGS - condition always false
  - **Fix 1**: Added `this.requestUpdate()` after `intersectionObserver.observe(this)` in `checkReady()` to trigger immediate height sync after hydration
  - **Fix 2**: Changed condition from `this.variantLayout` to `this.variant` (string comparison)
  - **Impact**: Cards now properly trigger height sync immediately after fragment hydration completes, regardless of viewport position

- [x] T026f [US6] Run `npm run build` to verify tests pass after hydration timing fix

**Checkpoint**: All icon rows align horizontally across cards with varying description lengths

**Note**: Icon alignment works correctly for cards of the same type (all non-gradient or all gradient-border). However, when mixing gradient-border and non-gradient cards in the same collection, there's a ~3px vertical offset due to different internal padding in gradient-border cards. This is a known limitation and could be addressed in a follow-up ticket if needed.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T032 [US3] Update animation duration from 300ms to 500ms in `variants/simplified-pricing-express.css.js`:
  - Change `transition: max-height 0.3s ease-out` to `0.5s`
  - Change `transition: opacity 0.3s ease-out, max-height 0.3s ease-out` to `0.5s`
  - Update chevron rotation transition in `simplified-pricing-express.js` from `0.3s` to `0.5s`

- [ ] T027 Visual regression testing against Figma at all breakpoints (375px, 768px, 1200px)
- [ ] T028 Touch device testing for tooltip dismiss behavior
- [ ] T029 Animation smoothness verification (500ms duration)
- [ ] T030 Cross-browser testing (Chrome, Safari, Firefox)
- [ ] T031 Dead code cleanup - remove any unused CSS rules or variables

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: N/A for this feature
- **User Stories (Phase 3-7)**: Can start after Setup
  - P1 stories (US1, US2, US3) should complete before P2 stories (US4, US5)
  - Within P1: US1 and US2 can run in parallel (different files)
  - US3 depends on some US2 work (both touch simplified cards)
- **Polish (Phase 8)**: After all user stories complete

### User Story Dependencies

- **US1 (Tablet Layout)**: Independent - modifies CSS only
- **US2 (Tooltips)**: Independent - modifies mas-mnemonic.js only
- **US3 (Mobile Interaction)**: Partially depends on US2 (tooltip positioning)
- **US4 (Badge Cap Auto-Hide)**: Independent - modifies variant JS files (full-pricing-express.js, simplified-pricing-express.js already has it)
- **US5 (Styling)**: Independent - modifies full-pricing-express.css.js only

### Parallel Opportunities

```text
After Setup complete:
├── [Parallel] US1: T004, T005 (different CSS files)
├── [Parallel] US2: T007-T009 (mas-mnemonic.js - sequential within)
└── After US1+US2:
    └── US3: T011-T014 (simplified card files)

After P1 complete:
├── [Parallel] US4: T016 (variant JS files - badge-wrapper auto-hide)
└── [Parallel] US5: T018-T021 (full-pricing-express.css.js - some parallel)
```

---

## Parallel Example: User Story 1

```bash
# Launch tablet layout tasks in parallel (different files):
Task: "T004 - Update simplified-pricing-express.css.js tablet media query"
Task: "T005 - Update full-pricing-express.css.js tablet media query"
```

---

## Implementation Strategy

### MVP First (P1 User Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 3: US1 - Tablet Layout
3. Complete Phase 4: US2 - Tooltips
4. Complete Phase 5: US3 - Mobile Interaction
5. **STOP and VALIDATE**: Test all P1 changes on test pages
6. Deploy/demo P1 fixes

### Incremental Delivery

1. Setup → Foundation ready
2. US1 (Tablet) → Test independently → Commit
3. US2 (Tooltips) → Test independently → Commit
4. US3 (Mobile) → Test independently → Commit
5. US4 (Border) → Test independently → Commit
6. US5 (Styling) → Test independently → Commit
7. Polish → Final validation → PR ready

---

## Files Modified Summary

| File | User Stories | Changes |
|------|--------------|---------|
| `variants/simplified-pricing-express.css.js` | US1, US3, US6 | Tablet width, mobile margins, animation, **US6: icon row min-height CSS variable** |
| `variants/simplified-pricing-express.js` | US3, US4, US6 | Click handler for card body, badge-wrapper auto-hide (already implemented), **T014b: moved max-height:50px rule to mobile-only media query**, **US6: syncHeights() update for icon row alignment**, **T026b: Fixed `isDesktop()` → `Media.isDesktopOrUp` in postCardUpdateHook (line 102)**, **T026c: Removed hasExistingVars optimization - always sync all cards** |
| `variants/full-pricing-express.css.js` | US1, US5 | Tablet layout, CTA height, link styling, **T018: heading-xs icon sizing with `--mod-img-*` properties (20px desktop, 14px mobile), center alignment**, **T019: icons slot selector fix (`merch-icon[slot="icons"]`) with flexible width**, **T020: CTA button height 40px with `--mod-button-height` + text centering with `--mod-button-top-to-text: 9px` and `--mod-button-bottom-to-text: 9px`**, **T020b: mas-mnemonic vertical alignment with `vertical-align: middle`** |
| `variants/full-pricing-express.js` | US4 | Badge-wrapper auto-hide CSS, **reverted icons slot CSS to default 20x20px** |
| `mas-mnemonic.js` | US2 | Tooltip dismiss logic, unified transitions, **T010b: Device-aware tooltip behavior - added `supportsHover` state, removed CSS :hover rules, added `handleTap()` for mobile, added `closeOverlay()` for Spectrum, updated event handlers for desktop hover vs mobile tap**, **T010c: Changed `:focus` to `:focus-visible` to prevent click-induced focus from keeping tooltips open** |
| `merch-card.js` | US6 | **T026e: Hydration timing fix - added `this.requestUpdate()` after hydration, fixed `this.variantLayout` → `this.variant` comparison** |

## Key Technical Learnings

1. **CSS Custom Property Cascade in Shadow DOM**: `merch-icon` uses `var(--mod-img-width, var(--img-width))` - the `--mod-*` modifier properties take precedence and are designed for external overrides. Regular `--img-*` properties are set internally by `:host([size])` rules and cannot be overridden from outside.

2. **Selector Specificity for Slotted Elements**: When targeting an element that **has** a slot attribute (e.g., `<merch-icon slot="icons">`), use `element[slot="name"]` not `[slot="name"] element`. The latter incorrectly targets descendants.

3. **Viewport Check Functions**: `isDesktop()` in media.js only returns true for 1200px-1599px viewports (excludes large desktops). Use `Media.isDesktopOrUp` for >= 1200px. This caused CSS variables to not be set on screens >= 1600px.

4. **Shadow DOM Boundaries**: CSS custom properties inherit through shadow DOM boundaries, making them the proper mechanism for external styling of web component internals.

5. **Hydration Timing and Type Comparison**: When checking variant types, use `this.variant` (string) not `this.variantLayout` (object). The `Array.includes()` method compares by reference for objects, so comparing an object to an array of strings will always be false. Also, intersection observers don't trigger `requestUpdate()` on their own - you must call it explicitly after hydration completes to trigger lifecycle hooks.

6. **Device-Aware Tooltip Behavior**: When implementing tooltips that need different behavior on desktop (hover) vs mobile (tap):
   - Use `window.matchMedia('(hover: hover)').matches` to detect hover capability
   - Desktop: Use `pointerenter`/`pointerleave` events for hover behavior
   - Mobile: Use `click` event with toggle logic (pointerleave fires immediately on touch end, making it unsuitable for touch)
   - Remove CSS `:hover` rules to avoid conflicts with JS state management
   - For Spectrum Web Components overlay-trigger, use `@sp-opened` event to integrate with singleton dismiss logic
   - Call `requestUpdate()` after setting reactive properties on other instances to trigger re-render

7. **Spectrum Button Height Override**: When customizing Spectrum button height:
   - `height` and `max-height` CSS properties are ineffective because Spectrum uses `min-block-size`
   - Use `--mod-button-height: Xpx` to override the internal sizing
   - Spectrum's internal CSS: `min-block-size: var(--mod-button-height, var(--spectrum-button-height))`
   - Works for both `sp-button` web component and native `<button class="spectrum-Button">` elements
   - Size mapping (compact scale): S=32px, M=40px, L=40px, XL=48px
   - For text centering: Use `--mod-button-top-to-text` and `--mod-button-bottom-to-text` with equal values for symmetric padding

8. **Inline-Flex Vertical Alignment**: When aligning inline-flex elements (like icons) with text:
   - `display: inline-flex` + `align-items: center` centers content INSIDE the element
   - To align the element itself with surrounding text, add `vertical-align: middle`
   - This is especially important when the element has `display: contents` on its host (like `mas-mnemonic`), as the inner span becomes the layout participant

9. **Focus vs Focus-Visible for Interactive Elements**: When implementing hover-based interactions with `tabindex="0"` for accessibility:
   - `:focus` matches BOTH keyboard navigation AND mouse click focus
   - `:focus-visible` only matches when focus should be visually indicated (typically keyboard navigation)
   - Use `:focus-visible` when hover is the primary interaction and you want to avoid CSS focus styles persisting after mouse clicks
   - This prevents conflicts where clicking an element gives it focus, and CSS `:focus` rules override JS-managed state

---

## Notes

- All tasks are CSS/JS modifications - no new files needed
- Run linter after each file modification
- **IMPORTANT: Run `npm run build` after modifying any files in `web-components/` folder** - this runs unit tests AND compiles Lit components. Ensure all tests pass before proceeding.
- Test on both test pages after each user story completion:
  - Simplified: https://main--da-express-milo--adobecom.aem.page/express/pre-launch/mas/homepage-poc?tab=3
  - Full Size: https://main--da-express-milo--adobecom.aem.page/express/pre-launch/mas/pricing-poc-2?tab=2
- Animation timing: 300ms matches existing chevron animation
- Design tokens preferred over hardcoded values
