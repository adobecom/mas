var je=Object.defineProperty;var fe=d=>{throw TypeError(d)};var Ke=(d,m,e)=>m in d?je(d,m,{enumerable:!0,configurable:!0,writable:!0,value:e}):d[m]=e;var ee=(d,m,e)=>Ke(d,typeof m!="symbol"?m+"":m,e),te=(d,m,e)=>m.has(d)||fe("Cannot "+e);var i=(d,m,e)=>(te(d,m,"read from private field"),e?e.call(d):m.get(d)),g=(d,m,e)=>m.has(d)?fe("Cannot add the same private member more than once"):m instanceof WeakSet?m.add(d):m.set(d,e),p=(d,m,e,t)=>(te(d,m,"write to private field"),t?t.call(d,e):m.set(d,e),e),s=(d,m,e)=>(te(d,m,"access private method"),e);import{html as v,LitElement as Je,nothing as w}from"./lit-all.min.js";import{unsafeHTML as Ee}from"./lit-all.min.js";var ct=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),lt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var We='span[is="inline-price"][data-wcs-osi]',Xe='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Ze='a[is="upt-link"]',dt=`${We},${Xe},${Ze}`;var re="aem:load",oe="aem:error",ae="mas:ready";var pt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var ht=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});import{css as Qe}from"./lit-all.min.js";var xe=Qe`
    :host {
        --compare-chart-row-border-color: #e9e9e9;
        --compare-chart-desktop-max-width: 1200px;
        --compare-chart-spacing: 12px;
        --hover-border-color: #357beb;
        --primary-cell-path-color: #05834e;
        --color-text: #2c2c2c;
        --color-text-secondary: #6e6e6e;
        --compare-chart-cols: 3;
        --compare-chart-leading-col: minmax(192px, 1fr);
        --compare-chart-data-cols: repeat(
            var(--compare-chart-cols),
            minmax(100px, 1fr)
        );

        /* Typography tokens (Figma: Heading XS, Body bold S/XS/XXS, Body XS, Body XXXS) */
        --type-heading-xs: 700 18px/22px 'Adobe Clean', sans-serif;
        --type-body-bold-s: 700 16px/24px 'Adobe Clean', sans-serif;
        --type-body-bold-xs: 700 14px/20px 'Adobe Clean', sans-serif;
        --type-body-bold-xxs: 700 12px/16px 'Adobe Clean', sans-serif;
        --type-body-xs: 400 14px/20px 'Adobe Clean', sans-serif;
        --type-body-italic-xxs: italic 400 12px/16px 'Adobe Clean', sans-serif;
        --type-body-xxxs: 400 11px/14px 'Adobe Clean', sans-serif;
        --compare-chart-header-title-font: 700 16px/24px 'Adobe Clean',
            sans-serif;
        --compare-chart-header-price-font: 700 16px/20px 'Adobe Clean',
            sans-serif;
        --compare-chart-header-detail-font: italic 400 12px/18px 'Adobe Clean',
            sans-serif;
        --compare-chart-header-cta-font: 700 15px/19px 'Adobe Clean',
            sans-serif;

        /* Icons — inlined SVG for shadow DOM (no network <img> src). */
        --compare-chart-toggle-icon-plus: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none"><path d="M12.5195 22.5352C6.72929 22.5352 2.01953 17.8254 2.01953 12.0352C2.01953 6.24492 6.72929 1.53516 12.5195 1.53516C18.3098 1.53516 23.0195 6.24492 23.0195 12.0352C23.0195 17.8254 18.3098 22.5352 12.5195 22.5352ZM12.5195 3.33516C7.72187 3.33516 3.81953 7.2375 3.81953 12.0352C3.81953 16.8328 7.72187 20.7352 12.5195 20.7352C17.3172 20.7352 21.2195 16.8328 21.2195 12.0352C21.2195 7.2375 17.3172 3.33516 12.5195 3.33516Z" fill="%23292929"/><path d="M16.4197 11.1002H13.4197V8.1002C13.4197 7.60332 13.0166 7.2002 12.5197 7.2002C12.0229 7.2002 11.6197 7.60332 11.6197 8.1002V11.1002H8.61973C8.12285 11.1002 7.71973 11.5033 7.71973 12.0002C7.71973 12.4971 8.12285 12.9002 8.61973 12.9002H11.6197V15.9002C11.6197 16.3971 12.0229 16.8002 12.5197 16.8002C13.0166 16.8002 13.4197 16.3971 13.4197 15.9002V12.9002H16.4197C16.9166 12.9002 17.3197 12.4971 17.3197 12.0002C17.3197 11.5033 16.9166 11.1002 16.4197 11.1002Z" fill="%23292929"/></svg>');
        --compare-chart-toggle-icon-minus: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" fill="%23292929"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M9 14L19 14" stroke="%23F8F8F8" stroke-width="2" stroke-linecap="round"/></svg>');

        display: block;
        container-type: inline-size;
        container-name: compare-chart;
        max-width: 100%;
        margin: 0 auto;
        box-sizing: border-box;
        font-family: var(--body-font-family, 'Adobe Clean', sans-serif);
        color: var(--color-text);
    }

    /* Dark mode — only Table Section supports it per Figma. Subcomponent
       chips remain light. */
    :host-context(.dark),
    :host([data-dark]) {
        --color-text: #f5f5f5;
        --color-text-secondary: #b0b0b0;
        --compare-chart-row-border-color: #444;
        --compare-chart-row-bg: #1e1e1e;
        --compare-chart-row-bg-alt: #2c2c2c;
        background: #1e1e1e;
    }

    /* ---------- header band (sticky) ---------- */
    .sticky-header-spacer {
        display: none;
        height: 0;
        pointer-events: none;
    }
    :host([data-sticky-header]) .sticky-header-spacer {
        display: block;
        height: var(--compare-chart-sticky-header-spacer-height, 0px);
    }
    .header-content {
        position: sticky;
        top: calc(
            var(--compare-chart-sticky-top, 0px) +
                var(--compare-chart-sticky-gap, 0px)
        );
        z-index: 9;
        background: transparent;
        box-shadow: none;
        box-sizing: border-box;
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        margin-bottom: var(--compare-chart-spacing);
    }
    .sticky-header-wrapper {
        box-sizing: border-box;
        display: grid;
        grid-template-columns: var(--compare-chart-leading-col) var(
                --compare-chart-data-cols
            );
        gap: var(--compare-chart-spacing);
        padding: var(--compare-chart-spacing) 20px;
        align-items: end;
        transition:
            transform var(--transition-smooth, 0.3s ease),
            opacity var(--transition-fade, 0.2s ease);
    }
    .sticky-header.is-stuck {
        position: fixed;
        left: 0;
        right: 0;
        z-index: 9;
        background: #fff;
        box-shadow: 0 var(--border-width-2, 2px) 4px rgba(0, 0, 0, 0.1);
        top: var(
            --spacing-50,
            calc(
                var(--compare-chart-sticky-top, 0px) +
                    var(--compare-chart-sticky-gap, 0px)
            )
        );
        transform: translateY(0) translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        opacity: 1;
    }
    .sticky-header.is-stuck .sticky-header-wrapper {
        padding-top: var(--compare-chart-spacing);
        padding-bottom: var(--compare-chart-spacing);
    }
    slot[name='cards'] {
        display: none;
    }
    slot[name='column'] {
        display: contents;
    }
    .header-leading,
    .header-card-segment {
        box-sizing: border-box;
        min-width: 0;
    }
    .header-leading {
        grid-column: 1;
        display: flex;
        align-items: center;
        font: var(--type-body-bold-s);
        color: var(--color-text);
        white-space: nowrap;
    }
    .header-leading-header {
        grid-row: 1;
    }
    .header-leading-price {
        grid-row: 2;
    }
    .header-leading-description {
        grid-row: 3;
    }
    .header-leading-detail {
        grid-row: 4;
    }
    .header-leading-cta {
        grid-row: 5;
    }
    .header-card-segment {
        grid-column: calc(var(--col) + 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: var(--color-text);
        text-align: center;
    }
    .header-card-segment slot {
        display: block;
        max-width: 100%;
    }
    .header-segment,
    .price-segment {
        border: 1px solid var(--spectrum-gray-300, #d3d3d3);
        border-radius: 4px;
        padding: 12px;
        background: #fff;
    }
    .header-segment[data-cell-color='grey'],
    .price-segment[data-cell-color='grey'] {
        background: var(--color-gray-100, #f8f8f8);
    }
    .header-segment {
        grid-row: 1;
        position: relative;
        min-height: 104px;
    }
    .price-segment {
        grid-row: 2;
        align-self: stretch;
        min-height: 48px;
    }
    .description-segment {
        grid-row: 3;
        padding: 0 12px;
    }
    .detail-segment {
        grid-row: 4;
        padding: 0 12px;
    }
    .cta-segment {
        grid-row: 5;
        gap: 8px;
    }
    .cta-segment slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }
    .mobile-filter-select {
        display: none;
        width: 100%;
        height: 32px;
        margin: 8px -12px -12px;
        padding: 0;
        border: none;
        border-top: 1px solid var(--spectrum-gray-300, #d3d3d3);
        border-radius: 0 0 4px 4px;
        color: transparent;
        cursor: pointer;
        appearance: none;
        background:
            var(
                    --compare-chart-column-picker-chevron,
                    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path d="M4 7.01a1 1 0 0 1 1.706-.706L8.993 9.59l3.29-3.285A1 1 0 0 1 13.72 7.69l-.024.025L9.7 11.707a1 1 0 0 1-1.413 0L4.293 7.716A.995.995 0 0 1 4 7.01z" fill="%23292929"/></svg>')
                )
                center / 18px 18px no-repeat,
            var(--color-gray-100, #f8f8f8);
    }
    .mobile-filter-select option {
        color: var(--color-text);
    }
    .sticky-header.is-stuck .header-segment,
    .sticky-header.is-stuck .price-segment {
        border: none;
        background: transparent;
        min-height: 0;
    }
    .sticky-header.is-stuck .mobile-filter-select {
        display: none;
    }
    ::slotted(h1),
    ::slotted(h2),
    ::slotted(h3),
    ::slotted(h4),
    ::slotted(h5),
    ::slotted(h6) {
        margin: 0;
        text-align: center;
        font:
            700 18px/24px 'Adobe Clean',
            sans-serif;
        color: var(--color-text);
    }
    ::slotted(p) {
        margin: 0;
        text-align: center;
    }
    ::slotted([slot^='card-']) {
        max-width: 100%;
    }
    ::slotted([slot='compare-features']) {
        font: var(--compare-chart-header-title-font);
        letter-spacing: 0;
    }
    ::slotted([slot$='-header']) {
        display: flex;
        flex: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        align-self: stretch;
        width: 100%;
        height: 24px;
        padding: 0;
        box-sizing: border-box;
        font: var(--compare-chart-header-title-font);
        letter-spacing: 0;
        text-align: center;
    }
    ::slotted([slot$='-price']) {
        display: flex;
        flex: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        align-self: stretch;
        width: 100%;
        height: 66px;
        padding: 8px;
        box-sizing: border-box;
        font: var(--compare-chart-header-price-font);
        letter-spacing: 0;
        text-align: center;
    }
    ::slotted([slot$='-description']),
    ::slotted([slot$='-detail']) {
        display: flex;
        flex: none;
        flex-direction: column;
        align-items: center;
        align-self: stretch;
        flex-grow: 1;
        width: 100%;
        height: 52px;
        padding: 8px;
        box-sizing: border-box;
        background: rgba(255, 255, 255, 0.001);
        font: var(--compare-chart-header-detail-font);
        letter-spacing: 0;
        text-align: center;
        color: #2c2c2c;
    }
    ::slotted([slot$='-cta']) {
        font: var(--compare-chart-header-cta-font);
        letter-spacing: 0;
        text-align: center;
    }

    .accessibility-header-row {
        position: absolute;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        width: 1px;
        height: 1px;
        overflow: hidden;
        white-space: nowrap;
    }

    /* ---------- per-group container ---------- */
    .table-container {
        border: 1px solid var(--compare-chart-row-border-color);
        overflow: hidden;
        margin-bottom: var(--compare-chart-spacing);
    }

    .table-column-header {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        box-sizing: border-box;
        padding: 16px 20px;
        background: var(--color-gray-100, #f8f8f8);
        font-size: var(--type-heading-s-size, 18px);
        font-weight: 700;
        line-height: 1.25;
        min-height: 72px;
        cursor: pointer;
    }
    .table-column-header:focus-visible {
        outline: 2px solid var(--hover-border-color);
        outline-offset: -2px;
    }

    /* Toggle icon — background from --compare-chart-toggle-icon-* in :host. */
    .toggle-icon {
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        display: block;
        background: var(--compare-chart-toggle-icon-plus) center / contain
            no-repeat;
    }
    .toggle-icon.is-expanded {
        background-image: var(--compare-chart-toggle-icon-minus);
    }

    .table-body {
        display: block;
    }
    .table-body.hide {
        display: none;
    }

    /* ---------- rows ---------- */
    .table-row {
        display: grid;
        grid-template-columns: var(--compare-chart-leading-col) var(
                --compare-chart-data-cols
            );
        gap: var(--compare-chart-spacing);
        /* Top-align so chips line up across columns regardless of whether
           sibling cells have a <small> caption below their chip. */
        align-items: start;
        padding: var(--compare-chart-spacing) 20px;
        border-top: 1px solid var(--compare-chart-row-border-color);
    }
    .table-row:first-child {
        border-top: none;
    }

    .row-header {
        font: var(--type-body-bold-xs);
        color: var(--color-text);
        display: flex;
        gap: 6px;
        align-items: center;
        position: relative;
    }
    .row-label {
        flex: 1 1 auto;
    }

    /* Description rows (Figma: Description Row + Table item cell) — borderless,
       smaller typography. */
    .description-row {
        padding-top: 6px;
        padding-bottom: 6px;
        border-top: none;
    }
    .description-row .row-header {
        font: var(--type-body-xxxs);
        font-weight: 400;
        color: var(--color-text-secondary);
    }

    /* ---------- cells (rendered in shadow from captured data) ----------
       The cell <p> is a borderless flex column. The bordered "chip" lives
       inside as <span class="compare-chart-chip"> (created by the WC at capture
       time). Captions live as <small> siblings BELOW the chip. */
    .table-row p[role='cell'] {
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        text-align: center;
        font: var(--type-body-xs);
        color: var(--color-text);
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 4px;
        grid-column: calc(var(--col, 1) + 1);
        position: relative;
    }
    .compare-chart-chip {
        align-items: center;
        background: #fff;
        border: 1px solid var(--spectrum-gray-300, #d3d3d3);
        border-radius: 4px;
        box-sizing: border-box;
        display: flex;
        gap: 6px;
        justify-content: center;
        min-height: 18px;
        padding: 8px 10px;
        width: 100%;
    }

    .table-row p[role='cell'] > small {
        color: var(--color-text, #2c2c2c);
        display: block;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.3;
        margin-top: 6px;
        text-align: center;
    }

    .table-row p.primary-cell > small {
        color: var(--primary-cell-path-color, #05834e);
    }

    .table-row p.emoji-primary-cell .compare-chart-chip,
    .table-row p.emoji-primary-cell > small {
        color: var(--primary-cell-path-color, #05834e);
    }

    .compare-chart-glyph.excluded {
        color: var(--color-text, #2c2c2c);
    }

    /* Cell-level primary glyph tint (per Figma: ✅ primary feature). */
    .compare-chart-glyph.included.primary {
        color: var(--primary-cell-path-color, #05834e);
        font-weight: 700;
    }

    /* Item-cell rows: no chip border, plain text. */
    .table-row p.item-cell {
        color: var(--color-text-secondary, #6e6e6e);
        display: block;
        font-size: 11px;
        font-weight: 400;
        gap: 0;
        line-height: 1.4;
        text-align: center;
    }

    .table-row p.item-cell.primary-cell {
        color: var(--primary-cell-path-color, #05834e);
    }

    /* ---------- tooltip (Figma: Table tool tip, 7 positions) ---------- */
    .tooltip-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        margin-left: 4px;
    }
    .tooltip-trigger {
        all: unset;
        width: 12px;
        height: 12px;
        cursor: help;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-secondary, #6e6e6e);
        font:
            italic 700 9px/1 'Adobe Clean',
            serif;
        border: 1px solid currentColor;
        border-radius: 50%;
        line-height: 1;
        flex: 0 0 auto;
    }
    .tooltip-trigger:hover,
    .tooltip-trigger:focus-visible {
        color: var(--hover-border-color);
        outline: none;
    }
    .tooltip-popover {
        position: absolute;
        background: #2c2c2c;
        color: #fff;
        border-radius: 4px;
        padding: 8px 12px;
        font: var(--type-body-xs);
        font-weight: 400;
        line-height: 1.4;
        max-width: 240px;
        min-width: 120px;
        text-align: center;
        white-space: normal;
        z-index: 20;
        visibility: hidden;
        opacity: 0;
        transition:
            opacity 0.12s ease,
            visibility 0s linear 0.12s;
        pointer-events: none;
    }
    .tooltip-trigger:hover ~ .tooltip-popover,
    .tooltip-trigger:focus-visible ~ .tooltip-popover,
    .tooltip-popover:hover {
        visibility: visible;
        opacity: 1;
        transition-delay: 0s;
        pointer-events: auto;
    }
    /* Tail (small triangle) */
    .tooltip-popover::after {
        content: '';
        position: absolute;
        width: 8px;
        height: 8px;
        background: #2c2c2c;
        transform: rotate(45deg);
    }

    /* Position variants — top * (popover above trigger) */
    .tooltip-wrapper[data-tooltip-position^='top-'] .tooltip-popover {
        bottom: calc(100% + 8px);
    }
    .tooltip-wrapper[data-tooltip-position^='top-'] .tooltip-popover::after {
        top: 100%;
        margin-top: -4px;
    }
    /* Position variants — bottom * (popover below trigger) */
    .tooltip-wrapper[data-tooltip-position^='bottom-'] .tooltip-popover {
        top: calc(100% + 8px);
    }
    .tooltip-wrapper[data-tooltip-position^='bottom-'] .tooltip-popover::after {
        bottom: 100%;
        margin-bottom: -4px;
    }
    /* Horizontal alignment */
    .tooltip-wrapper[data-tooltip-position$='-center'] .tooltip-popover {
        left: 50%;
        transform: translateX(-50%);
    }
    .tooltip-wrapper[data-tooltip-position$='-center'] .tooltip-popover::after {
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
    }
    .tooltip-wrapper[data-tooltip-position$='-left'] .tooltip-popover {
        right: -6px;
    }
    .tooltip-wrapper[data-tooltip-position$='-left'] .tooltip-popover::after {
        right: 8px;
    }
    .tooltip-wrapper[data-tooltip-position$='-right'] .tooltip-popover {
        left: -6px;
    }
    .tooltip-wrapper[data-tooltip-position$='-right'] .tooltip-popover::after {
        left: 8px;
    }

    .empty-cell-sr {
        position: absolute;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        width: 1px;
        height: 1px;
        overflow: hidden;
        white-space: nowrap;
    }

    /* ---------- breakpoints (container-driven) ---------- */
    @container compare-chart (max-width: 599px) {
        :host {
            --compare-chart-leading-col: 0px;
            padding: 0 12px;
        }
        .sticky-header-wrapper {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding: 0 var(--spacing-200, 20px);
        }
        .header-leading {
            display: none;
        }
        .header-leading-cta {
            display: flex;
            grid-column: 1 / -1;
            grid-row: 1;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: var(--spacing-200, 20px) 0 0;
        }
        .header-card-segment {
            grid-column: var(--col);
        }
        .header-segment {
            grid-row: 2;
        }
        .price-segment {
            grid-row: 3;
        }
        .description-segment {
            grid-row: 4;
        }
        .detail-segment {
            grid-row: 5;
        }
        .cta-segment {
            grid-row: 6;
        }
        .mobile-filter-select {
            display: block;
        }
        .table-row {
            grid-template-columns: 1fr 1fr;
        }
        .row-header {
            grid-column: 1 / -1;
            margin-bottom: 4px;
            font-weight: 600;
            justify-content: center;
            text-align: center;
        }
        /* Auto-place the 2 visible cells (overrides desktop --col placement). */
        .table-row p[role='cell'] {
            grid-column: auto;
        }
        .tooltip-wrapper[data-tooltip-position] .tooltip-popover {
            left: auto;
            right: -6px;
            transform: none;
            max-width: min(240px, calc(100vw - 64px));
            text-align: left;
        }
        .tooltip-wrapper[data-tooltip-position] .tooltip-popover::after {
            left: auto;
            right: 8px;
            transform: rotate(45deg);
        }
    }

    @container compare-chart (min-width: 600px) and (max-width: 899px) {
        :host {
            --compare-chart-leading-col: 0px;
            padding: 0 25px;
        }
        .sticky-header-wrapper {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .header-leading {
            display: none;
        }
        .header-leading-cta {
            display: flex;
            grid-column: 1 / -1;
            grid-row: 1;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding-top: var(--spacing-200, 20px);
        }
        .header-card-segment {
            grid-column: var(--col);
        }
        .header-segment {
            grid-row: 2;
        }
        .price-segment {
            grid-row: 3;
        }
        .description-segment {
            grid-row: 4;
        }
        .detail-segment {
            grid-row: 5;
        }
        .cta-segment {
            grid-row: 6;
        }
        .mobile-filter-select {
            display: block;
        }
        .table-row {
            grid-template-columns: 1fr 1fr;
        }
        .row-header {
            grid-column: 1 / -1;
            margin-bottom: 4px;
            font-weight: 600;
            justify-content: center;
            text-align: center;
        }
        /* Tablet shows 2 selected cards from 3+ — auto-place rather than
           honor the source --col, which can exceed the grid. */
        .table-row p[role='cell'] {
            grid-column: auto;
        }
    }

    @container compare-chart (min-width: 900px) {
        :host {
            padding: 0 25px;
        }
    }

    @container compare-chart (min-width: 1200px) {
        :host {
            max-width: var(--compare-chart-desktop-max-width);
            padding: 0;
        }
        :host([data-child-count='3']) {
            --compare-chart-leading-col: minmax(268px, 1fr);
        }
        :host(:not([data-child-count='3'])) {
            --compare-chart-leading-col: minmax(268px, 1.15fr);
        }
    }

    /* Dark mode override for the sticky band background (host-level dark
       block above handles all other tokens via custom properties). */
    :host-context(.dark) .header-content.is-stuck,
    :host([data-dark]) .header-content.is-stuck {
        background: #2c2c2c;
    }
`;var be="mas-compare-chart",et=3e4,X=4,tt=900,rt=["icons","header","badge","price","description","detail","cta"],N={included:["\u2713","\u2714","\u2705"],excluded:["\u2717","\u2718","\u2716","\xD7"],notApplicable:["\u2014","-"]},ot=d=>N.included.includes(d),at=d=>N.excluded.includes(d),it=d=>!d||N.notApplicable.includes(d)||/^-+$/.test(d),D=(d,m,e)=>d.placeholders?.[m]??e,G,E,_,L,k,T,B,b,Y,H,y,A,V,M,P,q,R,$,z,j,K,r,ie,se,ye,Ae,ve,we,Ce,O,_e,Te,Re,Z,Se,ne,Ne,Le,ce,ke,Me,Q,le,st,J,de,pe,Pe,Ie,Oe,He,he,me,$e,ge,De,Ue,Ge,Be,S,U,Ye,Ve,Fe,qe,ze,ue,F=class extends Je{constructor(){super();g(this,r);g(this,G);g(this,E,[]);g(this,_,[]);g(this,L,new Map);g(this,k,new Map);g(this,T,[]);g(this,B,new Map);g(this,b,new Set);g(this,Y);g(this,H,!1);g(this,y,0);g(this,A,1);g(this,V,!1);g(this,M,null);g(this,P,null);g(this,q,!1);g(this,R,0);g(this,$,()=>s(this,r,me).call(this));g(this,z,e=>{let t=e.target;if(t?.parentElement===this){s(this,r,Ce).call(this,e.detail,t);return}t?.closest?.("merch-card")?.parentElement===this&&s(this,r,O).call(this)});g(this,j,e=>{var t;e.target?.parentElement===this&&(p(this,T,[]),p(this,_,[]),p(this,E,[]),i(this,L).clear(),i(this,k).clear(),this.requestUpdate(),(t=i(this,P))==null||t.call(this,!1),p(this,M,null),p(this,P,null))});g(this,K,e=>{e.target?.parentElement===this&&s(this,r,O).call(this)});p(this,G,this.attachInternals?.()),i(this,G)&&(i(this,G).role="table")}connectedCallback(){super.connectedCallback(),this.addEventListener("mas-compare-chart:rehydrate",()=>s(this,r,O).call(this)),this.addEventListener(re,i(this,z)),this.addEventListener(oe,i(this,j)),this.addEventListener(ae,i(this,K)),p(this,Y,new ResizeObserver(()=>s(this,r,le).call(this))),i(this,Y).observe(this)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(re,i(this,z)),this.removeEventListener(oe,i(this,j)),this.removeEventListener(ae,i(this,K)),i(this,Y)?.disconnect(),s(this,r,he).call(this)}firstUpdated(){s(this,r,O).call(this),s(this,r,He).call(this)}updated(e){e.has("expandedGroups")&&s(this,r,ne).call(this),(e.has("consonant")||e.has("spectrum"))&&s(this,r,se).call(this)}checkReady(){if(!this.querySelector(":scope > aem-fragment"))return Promise.resolve(!0);s(this,r,ie).call(this);let t=new Promise(o=>setTimeout(()=>o(!1),et));return Promise.race([i(this,M),t])}render(){return this.collapsed?w:v`
            <div class="sticky-header-spacer" aria-hidden="true"></div>
            <div class="header-content sticky-header">
                <div class="sticky-header-wrapper">
                    ${s(this,r,Ge).call(this)}
                </div>
            </div>
            <slot name="cards" hidden></slot>
            <div
                class="accessibility-header-row"
                aria-hidden="false"
                role="row"
            >
                ${s(this,r,de).call(this).map(e=>v`<span role="columnheader">${e.title}</span>`)}
            </div>
            ${i(this,T).map(e=>s(this,r,Ve).call(this,e))}
        `}};G=new WeakMap,E=new WeakMap,_=new WeakMap,L=new WeakMap,k=new WeakMap,T=new WeakMap,B=new WeakMap,b=new WeakMap,Y=new WeakMap,H=new WeakMap,y=new WeakMap,A=new WeakMap,V=new WeakMap,M=new WeakMap,P=new WeakMap,q=new WeakMap,R=new WeakMap,$=new WeakMap,z=new WeakMap,j=new WeakMap,K=new WeakMap,r=new WeakSet,ie=function(){i(this,M)||p(this,M,new Promise(e=>{p(this,P,e)}))},se=function(e=i(this,E)){e.forEach(t=>{t.consonant=this.consonant,t.toggleAttribute("consonant",!!this.consonant),this.spectrum?(t.spectrum=this.spectrum,t.setAttribute("spectrum",this.spectrum)):t.removeAttribute("spectrum")})},ye=function(e,t){let o=e?.fields||{};if(Array.isArray(o)){let n=o.find(c=>c.name===t);return n?.multiple?n.values||[]:n?.values?.[0]||""}let a=o[t];return Array.isArray(a)?a[0]||"":a?.value??a??""},Ae=function(e,t){let o=e?.fields||{};if(Array.isArray(o))return o.find(n=>n.name===t)?.values||[];let a=o[t];return Array.isArray(a)?a:a==null||a===""?[]:[a?.value??a]},ve=function(e){let t=e?.references||{};return Array.isArray(t)?t.map(o=>({identifier:o.identifier||o.id||o.path,value:o.value||o})).filter(o=>o.value):Object.entries(t).map(([o,a])=>({identifier:o,value:a?.value||a})).filter(o=>o.value)},we=function(e){let t=s(this,r,ve).call(this,e),o=c=>t.find(({identifier:l,value:h})=>l===c||h.id===c||h.path===c)?.value,a=s(this,r,Ae).call(this,e,"cards").map(o).filter(Boolean);if(a.length)return a.slice(0,X);let n=(e.referencesTree||[]).filter(c=>c.fieldName==="cards").map(c=>o(c.identifier)).filter(Boolean);return n.length?n.slice(0,X):t.map(({value:c})=>c).filter(c=>c?.fields).slice(0,X)},Ce=async function(e,t){var I;if(!e)return;s(this,r,ie).call(this),this.querySelectorAll("[data-compare-chart-generated]").forEach(u=>u.remove());let o=new DOMParser,a=s(this,r,ye).call(this,e,"compareChart"),n=o.parseFromString(a||"","text/html"),c=n.body.querySelector("mas-compare-chart")||n.body;c.hasAttribute?.("expanded-groups")&&(this.expandedGroups=c.getAttribute("expanded-groups"));let l=c.querySelector(':scope > [slot="compare-features"]');if(l){let u=l.cloneNode(!0);u.dataset.compareChartGenerated="true",this.append(u)}c.querySelectorAll(":scope > div[name]").forEach(u=>{let C=u.cloneNode(!0);C.dataset.compareChartGenerated="true",this.append(C)});let h=t?.hasAttribute("author"),f=s(this,r,we).call(this,e),x=[];f.forEach(u=>{t?.cache?.add(u);let C=document.createElement("merch-card");C.setAttribute("slot","cards"),C.dataset.compareChartGenerated="true",s(this,r,se).call(this,[C]);let W=document.createElement("aem-fragment");W.setAttribute("fragment",u.id),h&&W.setAttribute("author",""),W.setAttribute("loading","cache"),C.append(W),this.append(C),x.push(C)}),s(this,r,O).call(this),await Promise.all(x.map(u=>u.checkReady?.().catch(()=>!1))),s(this,r,O).call(this),(I=i(this,P))==null||I.call(this,!0),p(this,M,null),p(this,P,null)},O=function(){if(!i(this,V)){p(this,V,!0);try{s(this,r,_e).call(this),s(this,r,Se).call(this),s(this,r,ne).call(this),s(this,r,Le).call(this),s(this,r,le).call(this),this.requestUpdate()}finally{p(this,V,!1)}}},_e=function(){let e=Array.from(this.querySelectorAll(':scope > merch-card[slot="cards"]')).slice(0,X);this.querySelectorAll(":scope > [data-compare-chart-slot]").forEach(o=>o.remove());let t=[];e.forEach((o,a)=>{let n=`card-${a+1}`;o.dataset.cardId=n,o.dataset.columnIndex=String(a+1),o.style.setProperty("--col",a+1);let c=o.getAttribute("cell-color")??((a+1)%2===0?"grey":"default");t.push(s(this,r,Te).call(this,o,n,a,c))}),p(this,E,e),p(this,_,t),this.setAttribute("data-child-count",String(e.length)),this.style.setProperty("--compare-chart-cols",e.length)},Te=function(e,t,o,a){let n={},c=new Set;for(let h of rt){let f=`${t}-${h}`;if(n[h]=f,!e)continue;let x=Array.from(e.querySelectorAll(`:scope > [slot="${h}"]`));x.length&&c.add(h);for(let I of x){if(h==="cta"){s(this,r,Re).call(this,I,f);continue}let u=I.cloneNode(!0);u.setAttribute("slot",f),u.dataset.compareChartSlot=f,s(this,r,Z).call(this,u),this.appendChild(u)}}e&&(e.hidden=!0,e.setAttribute("aria-hidden","true"),e.dataset.cardId=t,e.dataset.columnIndex=String(o+1),e.dataset.cellColor=a);let l=Array.from(this.querySelectorAll(`:scope > [slot="${n.header}"]`)).map(h=>h.textContent.trim()).filter(Boolean).join(" ");return{cardId:t,col:o+1,cellColor:a,slots:n,presentSlots:c,title:l||`Card ${o+1}`}},Re=function(e,t){let o=e.matches("a,button")?[e]:Array.from(e.querySelectorAll("a,button"));if(!o.length){let a=e.cloneNode(!0);a.setAttribute("slot",t),a.dataset.compareChartSlot=t,s(this,r,Z).call(this,a),this.appendChild(a);return}for(let a of o){let n=a.cloneNode(!0);n.setAttribute("slot",t),n.dataset.compareChartSlot=t,s(this,r,Z).call(this,n),this.appendChild(n)}},Z=function(e){e.removeAttribute("style"),e.querySelectorAll("[style]").forEach(t=>t.removeAttribute("style"))},Se=function(){p(this,T,[]),i(this,B).clear();let e=1;Array.from(this.querySelectorAll(":scope > div[name]")).forEach((t,o)=>{let a=t.getAttribute("name"),n=t.querySelector(":scope > h4")?.textContent.trim()??"",c=o+1,l={heading:n,groupIndex:c,groupKey:a,rows:[]};i(this,T).push(l),t.querySelectorAll(":scope > p[name]").forEach(h=>{let f=h.getAttribute("name"),x=`${a}@${f}`;e++,l.rows.push({slot:x,rowIndex:e}),i(this,B).set(x,{rowIndex:e,groupIndex:c})})})},ne=function(){let e=(this.expandedGroups??"").trim(),t=i(this,T).length;if(p(this,b,new Set),!e)t>0&&i(this,b).add(1);else if(e==="all")for(let o=1;o<=t;o+=1)i(this,b).add(o);else{if(e==="none")return;e.split(",").map(o=>parseInt(o.trim(),10)).filter(o=>!isNaN(o)&&o>=1&&o<=t).forEach(o=>i(this,b).add(o))}},Ne=function(){let e=i(this,T).length;return i(this,b).size?e&&i(this,b).size===e?"all":[...i(this,b)].sort((t,o)=>t-o).join(","):"none"},Le=function(){i(this,k).clear(),i(this,L).clear(),Array.from(this.querySelectorAll(":scope > div[name]")).forEach(e=>{let t=e.getAttribute("name");e.querySelectorAll(":scope > p[name]").forEach(o=>{let a=`${t}@${o.getAttribute("name")}`,n=o.cloneNode(!0),c=s(this,r,ce).call(this,n);i(this,k).set(a,{labelHTML:n.innerHTML,title:c,tooltipPosition:o.getAttribute("data-tooltip-position")??"top-center",isItemRow:o.hasAttribute("item")})})}),Array.from(this.querySelectorAll(':scope > merch-card[slot="cards"]')).forEach(e=>{let t=e.dataset.cardId,o=parseInt(e.dataset.columnIndex,10),a=new Map;e.querySelectorAll(':scope > p[name], :scope > [slot="features"] p[name]').forEach(n=>{let c=n.getAttribute("name");!c||!c.includes("@")||a.set(c,n)});for(let[n,c]of a){if(!i(this,B).has(n))continue;let l=c.cloneNode(!0),h=l.textContent.includes("\u2705"),f=l.hasAttribute("primary");f&&l.classList.add("primary-cell"),h&&l.classList.add("emoji-primary-cell");let x=l.hasAttribute("item");x&&l.classList.add("item-cell");let I=s(this,r,ce).call(this,l);s(this,r,ke).call(this,l);let u=i(this,L).get(n)??[];u.push({cardId:t,col:o,isCellPrimary:f,isEmojiPrimary:h,isItem:x,title:I,tooltipPosition:l.getAttribute("data-tooltip-position")??"top-center",html:l.innerHTML,ariaLabel:l.getAttribute("aria-label")}),i(this,L).set(n,u)}})},ce=function(e){let t=e.querySelector(":scope > a.secondary-link[title]"),o=t?.getAttribute("title")||e.getAttribute("title")||void 0;return t?.remove(),o&&e.removeAttribute("title"),o},ke=function(e){let t=e.querySelector(":scope > .compare-chart-chip");if(t){for(;t.firstChild;)e.insertBefore(t.firstChild,t);t.remove()}let o=e.textContent.trim();if(ot(o))e.setAttribute("aria-label",D(this,"included","Included")),s(this,r,Q).call(this,e);else if(at(o))e.setAttribute("aria-label",D(this,"not-included","Not included")),s(this,r,Q).call(this,e);else if(it(o)){if(e.setAttribute("aria-label",D(this,"not-applicable","Not applicable")),!o){let a=document.createElement("span");a.className="empty-cell-sr",a.textContent=D(this,"empty-table-cell","Not applicable"),e.textContent="\u2014";let n=document.createElement("span");n.setAttribute("aria-hidden","true"),n.textContent="\u2014",e.replaceChildren(n,a)}}else e.removeAttribute("aria-label"),s(this,r,Q).call(this,e);s(this,r,Me).call(this,e)},Me=function(e){if(e.classList.contains("item-cell"))return;let t=document.createElement("span");t.className="compare-chart-chip";let o=Array.from(e.childNodes);for(let a of o){if(a.nodeType===Node.ELEMENT_NODE&&a.tagName==="SMALL")break;t.appendChild(a)}e.insertBefore(t,e.firstChild)},Q=function(e){let t=[...N.included,...N.excluded,...N.notApplicable],o=e.classList.contains("primary-cell");Array.from(e.childNodes).forEach(a=>{if(a.nodeType!==Node.TEXT_NODE)return;let n=a.textContent;if(!t.some(l=>n.includes(l)))return;let c=document.createDocumentFragment();for(let l of n)if(t.includes(l)){let h=document.createElement("span");h.setAttribute("aria-hidden","true"),h.classList.add("compare-chart-glyph"),h.textContent=l==="\u2705"?"\u2713":l,N.included.includes(l)&&h.classList.add("included"),N.excluded.includes(l)&&h.classList.add("excluded"),(o||l==="\u2705")&&h.classList.add("primary"),c.appendChild(h)}else c.appendChild(document.createTextNode(l));a.replaceWith(c)})},le=function(){let e=this.getBoundingClientRect().width||this.offsetWidth||window.innerWidth,t=e>0&&e<tt,o=t!==i(this,H);p(this,H,t),this.toggleAttribute("data-mobile",t),t?s(this,r,pe).call(this):s(this,r,Ie).call(this),o&&this.requestUpdate()},st=function(){return new Set(s(this,r,J).call(this))},J=function(){return!i(this,H)||i(this,E).length<=2?i(this,E).map(e=>e.dataset.cardId):[i(this,E)[i(this,y)],i(this,E)[i(this,A)]].filter(Boolean).map(e=>e.dataset.cardId)},de=function(){return s(this,r,J).call(this).map(e=>i(this,_).find(t=>t.cardId===e)).filter(Boolean)},pe=function(){this.style.setProperty("--compare-chart-cols",2),!(i(this,E).length<=2)&&s(this,r,Pe).call(this)},Pe=function(){let e=i(this,E).length;e<=2||(i(this,y)>=e&&p(this,y,0),i(this,A)>=e&&p(this,A,Math.min(1,e-1)),i(this,y)===i(this,A)&&p(this,A,(i(this,y)+1)%e))},Ie=function(){this.style.setProperty("--compare-chart-cols",i(this,E).length)},Oe=function(e,t){e==="A"?(t===i(this,A)&&p(this,A,i(this,y)),p(this,y,t)):(t===i(this,y)&&p(this,y,i(this,A)),p(this,A,t)),s(this,r,pe).call(this),this.requestUpdate()},He=function(){s(this,r,he).call(this);let e=document.querySelector("header"),t=document.querySelector(".feds-localnav"),o=(e?.getBoundingClientRect().height||0)+(t?.getBoundingClientRect().height||0);this.style.setProperty("--compare-chart-sticky-top",`${o}px`);let a=this.getAttribute("sticky-top");if(a){let n=/^\d+$/.test(a.trim())?`${a}px`:a;this.style.setProperty("--compare-chart-sticky-gap",n)}window.addEventListener("scroll",i(this,$),!0),window.addEventListener("resize",i(this,$)),s(this,r,me).call(this)},he=function(){window.removeEventListener("scroll",i(this,$),!0),window.removeEventListener("resize",i(this,$)),i(this,R)&&(cancelAnimationFrame(i(this,R)),p(this,R,0))},me=function(){i(this,R)||p(this,R,requestAnimationFrame(()=>{p(this,R,0),s(this,r,$e).call(this)}))},$e=function(){let e=this.shadowRoot?.querySelector(".header-content");if(this.collapsed||!e){s(this,r,ge).call(this,!1);return}let t=parseFloat(getComputedStyle(e).top)||0,o=e.getBoundingClientRect(),a=this.getBoundingClientRect();s(this,r,ge).call(this,a.top<t&&a.bottom>t+o.height&&o.top<=t+1)},ge=function(e){let t=this.shadowRoot?.querySelector(".header-content");if(e!==i(this,q)){if(e){let o=t?.getBoundingClientRect().height||0;this.style.setProperty("--compare-chart-sticky-header-spacer-height",`${o}px`)}else this.style.removeProperty("--compare-chart-sticky-header-spacer-height");p(this,q,e),this.toggleAttribute("data-sticky-header",e),t?.classList.toggle("sticky",e),t?.classList.toggle("is-stuck",e)}},De=function(e){let t=!1;i(this,b).has(e)?i(this,b).delete(e):(i(this,b).add(e),t=!0),this.expandedGroups=s(this,r,Ne).call(this),this.dispatchEvent(new CustomEvent("expanded-groups-change",{detail:{value:this.expandedGroups},bubbles:!0,composed:!0})),this.requestUpdate(),t&&this.updateComplete.then(()=>s(this,r,Ue).call(this,e))},Ue=function(e){if(this.collapsed)return;let t=this.shadowRoot?.querySelector(`.table-container[data-group-index="${String(e)}"]`);if(!t)return;let o=this.shadowRoot?.querySelector(".header-content"),a=getComputedStyle(this),n=parseFloat(a.getPropertyValue("--compare-chart-sticky-top"))||0,c=a.getPropertyValue("--compare-chart-sticky-gap").trim(),l=c&&parseFloat(c)||0,h=o?.getBoundingClientRect().height??0,f=n+l+h,x=t.style.scrollMarginTop;t.style.scrollMarginTop=`${f}px`,t.scrollIntoView({block:"start",behavior:"smooth"}),requestAnimationFrame(()=>{t.style.scrollMarginTop=x})},Ge=function(){let e=s(this,r,de).call(this),t=s(this,r,Be).call(this,e);return v`
            <div class="header-leading header-leading-header"></div>
            ${e.map((o,a)=>s(this,r,U).call(this,o,"header",a+1,a,t))}
            <div class="header-leading header-leading-price"></div>
            ${e.map((o,a)=>s(this,r,U).call(this,o,"price",a+1,a,t))}
            <div class="header-leading header-leading-description"></div>
            ${e.map((o,a)=>s(this,r,U).call(this,o,"description",a+1,a,t))}
            <div class="header-leading header-leading-detail"></div>
            ${e.map((o,a)=>s(this,r,U).call(this,o,"detail",a+1,a,t))}
            <div class="header-leading header-leading-cta">
                <slot name="compare-features"></slot>
            </div>
            ${e.map((o,a)=>s(this,r,U).call(this,o,"cta",a+1,a,t))}
        `},Be=function(e){let t=new Set;for(let o of e)for(let a of o.presentSlots)t.add(a);return t},S=function(e,t,o){return o.has(t)?v`<slot name=${e.slots[t]}></slot>`:w},U=function(e,t,o,a,n){let c=["header-card-segment",`${t}-segment`],l=e.cellColor;return v`<div
            class=${c.join(" ")}
            data-card-id=${e.cardId}
            data-card-index=${e.col-1}
            data-cell-color=${l}
            style="--col: ${o};"
        >
            ${t==="header"?v`
                      ${s(this,r,S).call(this,e,"icons",n)}
                      ${s(this,r,S).call(this,e,"header",n)}
                      ${s(this,r,S).call(this,e,"badge",n)}
                      ${s(this,r,Ye).call(this,e,a)}
                  `:w}
            ${t==="price"?s(this,r,S).call(this,e,"price",n):w}
            ${t==="description"?s(this,r,S).call(this,e,"description",n):w}
            ${t==="detail"?s(this,r,S).call(this,e,"detail",n):w}
            ${t==="cta"?s(this,r,S).call(this,e,"cta",n):w}
        </div>`},Ye=function(e,t){if(!i(this,H)||i(this,_).length<=2)return w;let o=i(this,_).findIndex(c=>c.cardId===e.cardId),a=t===0?"A":"B",n=a==="A"?i(this,A):i(this,y);return v`<select
            class="mobile-filter-select"
            name="column-filter"
            aria-label=${D(this,"choose-table-column","Choose column")}
            .value=${String(o)}
            @change=${c=>s(this,r,Oe).call(this,a,parseInt(c.target.value,10))}
        >
            ${i(this,_).map((c,l)=>l===n?w:v`<option
                    value=${l}
                    ?selected=${l===o}
                >
                    ${c.title}
                </option>`)}
        </select>`},Ve=function(e){let t=i(this,b).has(e.groupIndex);return v`
            <div class="table-container" data-group-index=${e.groupIndex}>
                <button
                    class="table-column-header"
                    aria-expanded=${t}
                    aria-controls="g-${e.groupIndex}"
                    @click=${()=>s(this,r,De).call(this,e.groupIndex)}
                >
                    <span class="group-title">${e.heading}</span>
                    <span
                        class="toggle-icon ${t?"is-expanded":""}"
                        aria-hidden="true"
                    ></span>
                </button>
                <div
                    id="g-${e.groupIndex}"
                    class="table-body ${t?"":"hide"}"
                    role="rowgroup"
                    aria-label=${e.heading}
                >
                    ${e.rows.map(o=>s(this,r,qe).call(this,o))}
                </div>
            </div>
        `},Fe=function(e,t){return{cardId:e,col:t,isCellPrimary:!1,isEmojiPrimary:!1,isItem:!1,title:void 0,tooltipPosition:"top-center",html:'<span class="compare-chart-chip"><span class="compare-chart-glyph" aria-hidden="true">\u2014</span></span>',ariaLabel:D(this,"not-applicable","Not applicable")}},qe=function(e){let t=i(this,k).get(e.slot)??{},o=new Map((i(this,L).get(e.slot)??[]).map(l=>[l.cardId,l])),a=s(this,r,J).call(this),n=a.map(l=>o.get(l)).filter(Boolean);!n.length&&a.length>0&&i(this,k).has(e.slot)&&(n=a.map(l=>{let h=i(this,E).find(x=>x.dataset.cardId===l),f=parseInt(h?.dataset.columnIndex??"1",10);return s(this,r,Fe).call(this,l,f)}));let c=["table-row"];return t.isItemRow&&c.push("description-row"),v`
            <div class=${c.join(" ")} role="row">
                <div class="row-header" role="rowheader">
                    <span class="row-label"
                        >${Ee(t.labelHTML??"")}</span
                    >
                    ${s(this,r,ue).call(this,t.title,t.tooltipPosition)}
                </div>
                ${n.map(l=>s(this,r,ze).call(this,l))}
            </div>
        `},ze=function(e){let t=["cell"];return e.isCellPrimary&&t.push("primary-cell"),e.isEmojiPrimary&&t.push("emoji-primary-cell"),e.isItem&&t.push("item-cell"),v`<p
            role="cell"
            class=${t.join(" ")}
            data-card-id=${e.cardId}
            style="--col: ${e.col};"
            aria-label=${e.ariaLabel??w}
        >
            ${Ee(e.html)}${s(this,r,ue).call(this,e.title,e.tooltipPosition)}
        </p>`},ue=function(e,t){return e?v`<span class="tooltip-wrapper" data-tooltip-position=${t||"top-center"}>
            <button class="tooltip-trigger" aria-label="More info" tabindex="0">
                <span aria-hidden="true">i</span>
            </button>
            <span class="tooltip-popover" role="tooltip">${e}</span>
        </span>`:w},ee(F,"properties",{expandedGroups:{type:String,attribute:"expanded-groups",reflect:!0},collapsed:{type:Boolean,attribute:"collapsed",reflect:!0},consonant:{type:Boolean,attribute:"consonant"},spectrum:{type:String,attribute:"spectrum"},placeholders:{type:Object}}),ee(F,"styles",xe);customElements.get(be)||customElements.define(be,F);export{F as MasCompareChart};
