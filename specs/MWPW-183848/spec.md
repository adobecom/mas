# Feature Specification: Express Cards Design QA

**Feature Branch**: `MWPW-183848`
**Created**: 2026-01-06
**Status**: Draft
**Jira**: [MWPW-183848](https://jira.corp.adobe.com/browse/MWPW-183848)
**Input**: Design QA fixes for Simplified & Full Size merch-cards in Express/Milo

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tablet Layout Displays Correctly (Priority: P1)

As a user viewing Express pricing cards on a tablet device, I expect cards to display at the proper tablet width (8/12 columns) rather than mobile width, so that I can see more content and have a better browsing experience.

**Why this priority**: Tablet display affects all users on iPad and similar devices - a fundamental layout issue impacting readability and usability.

**Independent Test**: Can be tested by resizing viewport to tablet breakpoint (768px-1024px) and verifying card width matches 8/12 column grid.

**Acceptance Scenarios**:

1. **Given** a user views Simplified Cards on tablet viewport (768px-1024px), **When** the page loads, **Then** cards display at 8/12 column width of the grid system
2. **Given** a user views Full Size Cards on tablet viewport, **When** the page loads, **Then** cards display at tablet-appropriate size, not mobile size

---

### User Story 2 - Icon Tooltips Behave Correctly (Priority: P1)

As a user hovering over product icons on Simplified Cards, I expect tooltips to appear on hover and dismiss properly when I move to another icon, so that I can read icon descriptions without visual overlap.

**Why this priority**: Tooltip overlap is a P0 bug that makes content unreadable and creates accessibility issues.

**Independent Test**: Can be tested by hovering over icons sequentially and verifying each tooltip dismisses before the next appears.

**Acceptance Scenarios**:

1. **Given** a user hovers over an icon, **When** they move cursor to a different icon, **Then** the previous tooltip disappears completely before the new one appears
2. **Given** a user clicks/taps an icon on touch device, **When** they tap another icon, **Then** the previous tooltip dismisses immediately
3. **Given** a tooltip is visible, **When** user moves cursor away, **Then** the tooltip arrow and content disappear simultaneously (not separately)

---

### User Story 3 - Mobile Card Interaction (Priority: P1)

As a mobile user viewing Simplified Cards, I expect smooth card expansion/collapse animations and the ability to tap anywhere on the card to toggle it, so that I have an intuitive mobile experience.

**Why this priority**: Mobile usability is critical as majority of Express traffic comes from mobile devices.

**Independent Test**: Can be tested on mobile viewport by tapping cards and observing animation smoothness and tap targets.

**Acceptance Scenarios**:

1. **Given** a collapsed card on mobile, **When** user taps anywhere on the card body, **Then** the card expands (not just caret tap)
2. **Given** an expanded card on mobile, **When** user taps anywhere on the card body, **Then** the card collapses smoothly
3. **Given** a card is expanding or collapsing, **When** the animation plays, **Then** it completes with a smooth, slower transition (not instant)
4. **Given** mobile viewport, **When** page loads, **Then** card width is responsive with 16px margins on each side (not fixed width)
5. **Given** leftmost icon on mobile, **When** user triggers tooltip, **Then** tooltip is fully visible within card bounds (not cut off)

---

### User Story 4 - Express Card Badge Cap Auto-Hide (Priority: P2)

As a content author configuring Simplified or Full Size Express Cards, I need the badge cap (badge-wrapper) to automatically hide when there is no badge text, so that cards display cleanly without an empty colored header when no badge is needed.

**Why this priority**: This is a design improvement that ensures visual consistency when badges are not configured.

**Scope**: Limited to `simplified-pricing-express` and `full-pricing-express` card variants only (not generic merch-card).

**Independent Test**: Can be tested by configuring a card without badge text and verifying the cap/badge-wrapper is hidden.

**Acceptance Scenarios**:

1. **Given** a Full Size or Simplified Card with no badge text, **When** the card renders, **Then** the badge-wrapper (cap) is automatically hidden
2. **Given** a Full Size or Simplified Card with badge text configured, **When** the card renders, **Then** the badge-wrapper displays correctly with the badge content

---

### User Story 5 - Premium Icon and CTA Styling (Priority: P2)

As a user viewing Full Size Cards, I expect visual elements like the premium crown icon, seat number badges, and CTAs to display with correct sizing and styling per Figma specs.

**Why this priority**: Visual consistency is important for brand presentation but doesn't break functionality.

**Independent Test**: Can be tested by visual comparison against Figma specs for each element.

**Acceptance Scenarios**:

1. **Given** a card with premium badge, **When** viewed on mobile/tablet, **Then** crown icon displays at 14x14px with correct gradient color
2. **Given** cards with seat number icons (2+ and 100+), **When** displayed, **Then** both icons are the same size (matching 100+ icon size)
3. **Given** Full Size Card CTAs, **When** displayed, **Then** buttons use size-large (48px height)
4. **Given** feature list with hyperlinked text, **When** displayed, **Then** links appear with underline styling

---

### User Story 6 - Icon Alignment Across Cards (Priority: P1)

As a user viewing multiple Express cards side by side on desktop, I expect the product icons (mnemonics) to be aligned at the same vertical position across all cards, regardless of how much text is in each card's description.

**Why this priority**: Visual consistency is critical for professional presentation. Misaligned icons create a disjointed appearance when cards have varying description lengths.

**Independent Test**: Can be tested by viewing 3+ cards with different description lengths side by side and verifying icon rows are horizontally aligned.

**Acceptance Scenarios**:

1. **Given** multiple Simplified Cards with varying description lengths (1 line vs 4 lines), **When** displayed side by side on desktop, **Then** all icon rows align horizontally at the same vertical position
2. **Given** cards with different numbers of icons (2 icons vs 5 icons), **When** displayed, **Then** icon rows still align (taller row determines min-height for all)
3. **Given** a card with no icons, **When** displayed alongside cards with icons, **Then** the space where icons would be is preserved for alignment

---

### Edge Cases

- What happens when tooltip is triggered near card edge on very narrow mobile viewports?
- How does card expand/collapse behave if user rapidly taps multiple times?
- What happens when border-color is set but no color value is provided?
- What happens when one card has many icons that wrap to multiple lines?

## Requirements *(mandatory)*

### Functional Requirements

**Simplified Cards - Tablet Layout**
- **FR-001**: System MUST display Simplified Cards at 8/12 column width on tablet viewports (768px-1024px)

**Simplified Cards - Tooltips**
- **FR-002**: System MUST dismiss active tooltip when a different icon receives hover/focus/tap
- **FR-003**: System MUST animate tooltip arrow and content as a single unit (simultaneous dismiss)
- **FR-004**: System MUST prevent tooltip overlap scenarios

**Simplified Cards - Mobile**
- **FR-005**: System MUST allow card expansion/collapse by tapping anywhere on the card body
- **FR-006**: System MUST animate card expansion/collapse with a smooth, perceptible transition
- **FR-007**: System MUST display cards with responsive width and 16px horizontal margins on mobile
- **FR-008**: System MUST ensure leftmost icon tooltip remains within visible card bounds

**Full Size Cards - Layout**
- **FR-009**: System MUST display Full Size Cards at tablet-appropriate size on tablet viewports

**Express Cards - Badge Cap Auto-Hide**
- **FR-010**: System MUST automatically hide badge-wrapper (cap) when badge slot has no content (limited to simplified-pricing-express and full-pricing-express variants only)

**Full Size Cards - Styling**
- **FR-011**: System MUST display premium crown icon at 14x14px on mobile/tablet with correct gradient
- **FR-012**: System MUST display all icons in the icons slot at consistent size using generic selectors (not dependent on specific icon src/alt values)
- **FR-013**: System MUST display CTAs using button size-large (48px height)
- **FR-014**: System MUST display hyperlinked text with underline styling

**Simplified Cards - Icon Alignment**
- **FR-015**: System MUST synchronize icon row heights across all cards in a collection on desktop
- **FR-016**: System MUST align icon rows horizontally regardless of description text length

### Key Entities

- **merch-card**: Web component that renders pricing cards with various variants (simplified, full-size)
- **Tooltip**: Overlay element triggered by icon hover/tap showing product descriptions
- **Card Variant**: Configuration determining card layout (simplified vs full-size)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All cards display at correct column width on tablet viewports (8/12 for simplified, appropriate for full-size)
- **SC-002**: Zero tooltip overlap occurrences during sequential icon interactions
- **SC-003**: 100% of mobile tap interactions on card body trigger expand/collapse
- **SC-004**: Card animations complete in 500ms (slower, deliberate transition)
- **SC-005**: All mobile card layouts maintain 16px margins at any viewport width
- **SC-006**: Premium icons display at exactly 14x14px on mobile/tablet
- **SC-007**: CTA buttons display at exactly 48px height
- **SC-008**: 100% of feature list hyperlinks display with underline styling

## References

- **Figma**: https://www.figma.com/design/rHeuOYAwNriEkl6Nr5HIQ5/Firefly-Pro-Pricing-Updates?node-id=2795-232057
- **Simplified Cards Test Page**: https://main--da-express-milo--adobecom.aem.page/express/pre-launch/mas/homepage-poc?tab=3
- **Full Size Cards Test Page**: https://main--da-express-milo--adobecom.aem.page/express/pre-launch/mas/pricing-poc-2?tab=2

## Assumptions

- Tablet breakpoint is defined as 768px-1024px viewport width
- "8/12 columns" refers to the standard 12-column grid system used in Milo
- "Smooth animation" means CSS transitions at 500ms (clarified: slower, more deliberate feel)
- Premium crown gradient colors are defined in the Figma spec
- Button size-large corresponds to 48px height per Spectrum design system

## Clarifications

### Session 2026-01-08

- Q: What animation duration should the card expand/collapse use? → A: 500ms (slower, more deliberate feel - increased from current 300ms)
