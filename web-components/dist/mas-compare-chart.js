var me=Object.defineProperty;var Ct=p=>{throw TypeError(p)};var ue=(p,d,t)=>d in p?me(p,d,{enumerable:!0,configurable:!0,writable:!0,value:t}):p[d]=t;var st=(p,d,t)=>ue(p,typeof d!="symbol"?d+"":d,t),nt=(p,d,t)=>d.has(p)||Ct("Cannot "+t);var a=(p,d,t)=>(nt(p,d,"read from private field"),t?t.call(p):d.get(p)),u=(p,d,t)=>d.has(p)?Ct("Cannot add the same private member more than once"):d instanceof WeakSet?d.add(p):d.set(p,t),h=(p,d,t,e)=>(nt(p,d,"write to private field"),e?e.call(p,t):d.set(p,t),t),s=(p,d,t)=>(nt(p,d,"access private method"),t);import{html as A,LitElement as Te,nothing as b}from"./lit-all.min.js";import{repeat as mt}from"./lit-all.min.js";import{unsafeHTML as It}from"./lit-all.min.js";var Ie=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),$e=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var ge='span[is="inline-price"][data-wcs-osi]',fe='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var xe='a[is="upt-link"]',He=`${ge},${fe},${xe}`;var ct="aem:load",lt="aem:error",pt="mas:ready";var dt="mas-compare-chart:rehydrate",Rt="expanded-groups-change";var De=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Ue=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var ye=p=>String(p||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[/&]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-+|-+$/g,"")||"item",Lt=p=>Array.from(p.childNodes).map(d=>d.nodeType===Node.TEXT_NODE?d.textContent:d.nodeType===Node.ELEMENT_NODE?d.outerHTML:"").join("").replace(/\s+/g," ").trim(),be=p=>{let d=p.querySelector("[aria-label]")?.getAttribute("aria-label")?.trim().toLowerCase();return d==="yes"?"\u2713":d==="no"?"\u2717":p.querySelector(".icon-checkmark-no-fill, .icon-checkmark")?"\u2713":p.querySelector(".icon-crossmark")?"\u2717":Lt(p)},kt=p=>Lt(p).replace(/\s+/g," ").trim(),Ee=p=>(p.querySelector(".ctv2-th-header")?.textContent||p.textContent||"").replace(/:$/,"").replace(/\s+/g," ").trim(),Nt=(p,d)=>{let t=ye(p),e=t,o=2;for(;d.has(e);)e=`${t}-${o}`,o+=1;return d.add(e),e},Mt=p=>{let d=new Set;return Array.from(p.querySelectorAll(":scope > table")).map(t=>{let e=Array.from(t.querySelectorAll(":scope > thead > tr:first-child > th")),o=e[0],i=(o?.textContent||"").replace(/\s+/g," ").trim(),c=e.slice(1).map(m=>m.textContent.replace(/\s+/g," ").trim()),n=new Set,l=Array.from(t.querySelectorAll(":scope > tbody > tr")).map(m=>{let g=Array.from(m.children),x=g.find(f=>f.matches('th[scope="row"], th'))||g[0],y=Ee(x);return{name:Nt(y,n),html:kt(x),cells:g.slice(g.indexOf(x)+1).map(be)}});return{name:Nt(i,d),label:i,labelHtml:o?kt(o):i,columns:c,rows:l}})};import{css as ve}from"./lit-all.min.js";var Ot=ve`
    :host {
        --comparison-border-radius: 8px;
        --comparison-desktop-max-width: 1200px;
        --comparison-tablet-spacing: var(--spectrum-spacing-800, 48px);
        --comparison-table-spacing: var(--spectrum-spacing-300, 12px);
        --compare-chart-row-border-color: var(
            --spectrum-gray-200,
            var(--color-gray-200, #e8e8e8)
        );
        --compare-chart-desktop-max-width: var(--comparison-desktop-max-width);
        --compare-chart-spacing: var(--comparison-table-spacing);
        --compare-chart-color-white: var(
            --spectrum-gray-50,
            var(--color-white, #fff)
        );
        --compare-chart-color-gray-100: var(
            --spectrum-gray-100,
            var(--color-gray-100, #f8f8f8)
        );
        --compare-chart-color-gray-300: var(
            --spectrum-gray-300,
            var(--color-gray-300, #d4d4d4)
        );
        --compare-chart-text-color: var(
            --spectrum-gray-800,
            var(--text-color, #2c2c2c)
        );
        --compare-chart-text-secondary-color: var(
            --spectrum-gray-600,
            var(--color-gray-600, #686868)
        );
        --compare-chart-hover-color: var(
            --spectrum-accent-color-default,
            var(--color-accent, #357beb)
        );
        --compare-chart-primary-color: var(
            --spectrum-positive-color-default,
            var(--merch-color-green-promo, #05834e)
        );
        --compare-chart-tooltip-bg: var(
            --spectrum-gray-800,
            var(--text-color, #2c2c2c)
        );
        --compare-chart-tooltip-color: var(
            --spectrum-gray-50,
            var(--color-white, #fff)
        );
        --compare-chart-cols: 3;
        --compare-chart-leading-col: minmax(192px, 1fr);
        --compare-chart-data-cols: repeat(
            var(--compare-chart-cols),
            minmax(100px, 1fr)
        );
        --compare-chart-sticky-inline-inset: 0px;
        --compare-chart-sticky-offset: 64px;

        /* Local fallbacks for Milo/Spectrum typography tokens. */
        --compare-chart-header-title-font: 700 16px/24px 'Adobe Clean',
            sans-serif;
        --compare-chart-header-price-font: 700 16px/20px 'Adobe Clean',
            sans-serif;
        --compare-chart-header-detail-font: italic 400 12px/150% 'Adobe Clean',
            sans-serif;
        --compare-chart-header-cta-font: 700 15px/19px 'Adobe Clean', sans-serif;

        /* Icons — inlined SVG for shadow DOM (no network <img> src). */
        --compare-chart-toggle-icon-plus: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none"><path d="M12.5195 22.5352C6.72929 22.5352 2.01953 17.8254 2.01953 12.0352C2.01953 6.24492 6.72929 1.53516 12.5195 1.53516C18.3098 1.53516 23.0195 6.24492 23.0195 12.0352C23.0195 17.8254 18.3098 22.5352 12.5195 22.5352ZM12.5195 3.33516C7.72187 3.33516 3.81953 7.2375 3.81953 12.0352C3.81953 16.8328 7.72187 20.7352 12.5195 20.7352C17.3172 20.7352 21.2195 16.8328 21.2195 12.0352C21.2195 7.2375 17.3172 3.33516 12.5195 3.33516Z" fill="%23292929"/><path d="M16.4197 11.1002H13.4197V8.1002C13.4197 7.60332 13.0166 7.2002 12.5197 7.2002C12.0229 7.2002 11.6197 7.60332 11.6197 8.1002V11.1002H8.61973C8.12285 11.1002 7.71973 11.5033 7.71973 12.0002C7.71973 12.4971 8.12285 12.9002 8.61973 12.9002H11.6197V15.9002C11.6197 16.3971 12.0229 16.8002 12.5197 16.8002C13.0166 16.8002 13.4197 16.3971 13.4197 15.9002V12.9002H16.4197C16.9166 12.9002 17.3197 12.4971 17.3197 12.0002C17.3197 11.5033 16.9166 11.1002 16.4197 11.1002Z" fill="%23292929"/></svg>');
        --compare-chart-toggle-icon-minus: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" fill="%23292929"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M9 14L19 14" stroke="%23F8F8F8" stroke-width="2" stroke-linecap="round"/></svg>');

        display: block;
        max-width: 100%;
        box-sizing: border-box;
        font-family: var(--body-font-family, 'Adobe Clean', sans-serif);
        color: var(--compare-chart-text-color);
    }

    :host-context(.dark),
    :host([data-dark]) {
        --compare-chart-text-color: #f5f5f5;
        --compare-chart-text-secondary-color: #b0b0b0;
        --compare-chart-row-border-color: var(--color-gray-700, #444);
        background: #1e1e1e;
    }

    .sticky-sentinel {
        height: 0;
        margin: 0;
        padding: 0;
        pointer-events: none;
        visibility: hidden;
    }
    :host([non-sticky]) .header-content {
        position: static;
    }
    .sticky-header-spacer {
        display: none;
        height: 0;
        pointer-events: none;
    }
    :host([data-sticky-header]) .sticky-header-spacer {
        display: none;
        height: 0;
    }
    .header-content {
        position: sticky;
        top: calc(
            var(--compare-chart-sticky-top, 0px) +
                var(--compare-chart-sticky-offset, 64px)
        );
        z-index: 9;
        background: var(--spectrum-gray-50, #fff);
        box-shadow: none;
        box-sizing: border-box;
        padding-bottom: var(--spectrum-spacing-500, 24px);
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        overflow-anchor: none;
    }
    .sticky-header-wrapper {
        box-sizing: border-box;
        display: grid;
        grid-template-columns: var(--compare-chart-leading-col) var(
                --compare-chart-data-cols
            );
        gap: var(--comparison-table-spacing);
        max-width: calc(100% - 60px);
        margin: 0 auto;
        align-items: end;
        transition:
            transform var(--transition-smooth, 0.3s ease),
            opacity var(--transition-fade, 0.2s ease),
            gap var(--transition-smooth, 0.3s ease);
    }
    .sticky-header {
        transition:
            background var(--transition-smooth, 0.3s ease),
            box-shadow var(--transition-smooth, 0.3s ease);
    }
    .sticky-header.is-stuck {
        width: 100vw;
        margin-inline: calc(50% - 50vw);
        z-index: 9;
        background: var(--compare-chart-color-white);
        box-shadow: 0 1px 6px 0 rgb(0 0 0 / 12%);
        transform: translateY(0) translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        opacity: 1;
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
        align-items: stretch;
        font: var(--type-body-bold-s);
        color: var(--compare-chart-text-color);
        white-space: nowrap;
    }
    .header-leading-header {
        grid-row: var(--row);
    }
    .header-leading-price {
        grid-row: var(--row);
    }
    .header-leading-description {
        grid-row: var(--row);
    }
    .header-leading-detail {
        grid-row: var(--row);
    }
    .header-leading-cta {
        grid-row: var(--row);
        font: var(--compare-chart-header-title-font);
        letter-spacing: 0;
    }
    .header-card-segment {
        grid-column: calc(var(--col) + 1);
        grid-row: var(--row);
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: center;
        gap: 4px;
        color: var(--compare-chart-text-color);
        text-align: center;
        align-self: stretch;
    }
    .header-card-segment slot {
        display: block;
        max-width: 100%;
    }
    .header-segment,
    .price-segment {
        border: 1px solid var(--compare-chart-color-gray-300);
        border-radius: var(--comparison-border-radius);
        padding: var(--spectrum-spacing-200, 8px);
        background: var(--compare-chart-color-white);
        transition:
            border-color var(--transition-smooth, 0.3s ease),
            background var(--transition-smooth, 0.3s ease),
            padding var(--transition-smooth, 0.3s ease);
    }
    .header-segment[data-card-index='1'],
    .header-segment[data-card-index='3'],
    .price-segment[data-card-index='1'],
    .price-segment[data-card-index='3'],
    .header-segment[data-cell-color='grey'],
    .price-segment[data-cell-color='grey'] {
        background: var(--compare-chart-color-gray-100);
    }
    .header-segment {
        position: relative;
        justify-content: flex-start;
    }
    .price-segment {
        align-self: stretch;
    }
    .description-segment {
        padding: 0 var(--comparison-table-spacing);
    }
    .detail-segment {
        padding: 0 var(--comparison-table-spacing);
    }
    .cta-segment {
        gap: 8px;
        padding: 0;
    }
    .cta-segment slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        align-self: stretch;
        width: 100%;
        gap: var(--spectrum-spacing-200, 8px);
    }
    .cta-segment ::slotted(a),
    .cta-segment ::slotted(button) {
        margin: 0 !important;
        padding: 5px 8px !important;
        white-space: nowrap;
    }
    .mobile-filter-select {
        display: none;
        width: auto;
        height: 22px;
        padding: 0;
        position: absolute;
        inset-inline: -1px;
        bottom: -1px;
        box-sizing: border-box;
        border: none;
        border-top: 1px solid var(--compare-chart-color-gray-300);
        border-radius: 0 0 var(--comparison-border-radius)
            var(--comparison-border-radius);
        color: transparent;
        cursor: pointer;
        appearance: none;
        background:
            var(
                    --compare-chart-column-picker-chevron,
                    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path d="M4 7.01a1 1 0 0 1 1.706-.706L8.993 9.59l3.29-3.285A1 1 0 0 1 13.72 7.69l-.024.025L9.7 11.707a1 1 0 0 1-1.413 0L4.293 7.716A.995.995 0 0 1 4 7.01z" fill="%23292929"/></svg>')
                )
                center / 18px 18px no-repeat,
            #ebeeff;
    }
    .mobile-filter-select option {
        background: var(--compare-chart-color-white);
        color: var(--compare-chart-text-color);
    }
    .sticky-header.is-stuck .header-segment,
    .sticky-header.is-stuck .price-segment {
        border-color: transparent;
        background: transparent;
        min-height: 0;
    }
    .sticky-header.is-stuck .mobile-filter-select {
        display: none;
    }
    ::slotted(p),
    ::slotted(h1),
    ::slotted(h2),
    ::slotted(h3),
    ::slotted(h4),
    ::slotted(h5),
    ::slotted(h6) {
        margin: 0 !important;
        margin-block: 0 !important;
        padding: 0 !important;
    }
    ::slotted(h1),
    ::slotted(h2),
    ::slotted(h3),
    ::slotted(h4),
    ::slotted(h5),
    ::slotted(h6) {
        text-align: center;
        font:
            700 var(--type-heading-s-size, 18px) / 1.25 'Adobe Clean',
            sans-serif;
        color: var(--compare-chart-text-color);
    }
    ::slotted(p) {
        text-align: center;
    }
    ::slotted([slot^='card-']) {
        max-width: 100%;
    }
    ::slotted(p[slot^='card-']),
    ::slotted(a[slot^='card-']) {
        margin: 0;
    }
    ::slotted([slot$='-header']) {
        display: flex;
        flex: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        align-self: stretch;
        width: 100%;
        padding: 0;
        box-sizing: border-box;
        font:
            normal var(--type-heading-all-weight, 700)
                var(--type-heading-xs-size, 18px) / 1.5 'Adobe Clean',
            sans-serif !important;
        -webkit-hyphens: manual;
        hyphens: manual;
        letter-spacing: 0;
        margin: 0;
        margin-block: 0;
        text-align: center;
    }
    ::slotted([slot$='-icons']) {
        --mod-img-height: var(--icon-size-xs, 24px);
        --mod-img-width: var(--icon-size-xs, 24px);
        align-self: center;
        margin-inline: auto;
    }
    ::slotted([slot$='-price']) {
        display: flex;
        flex: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        align-self: stretch;
        width: 100%;
        padding: var(--spectrum-spacing-200, 8px);
        box-sizing: border-box;
        font:
            normal var(--type-detail-all-weight, 700)
                var(--type-body-s-size, 16px) / 1.25 'Adobe Clean',
            sans-serif !important;
        letter-spacing: 0;
        margin: 0;
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
        padding: var(--spectrum-spacing-200, 8px);
        box-sizing: border-box;
        background: rgba(255, 255, 255, 0.001);
        font:
            italic 400 var(--type-body-xxs-size, 12px) / 150% 'Adobe Clean',
            sans-serif !important;
        letter-spacing: 0;
        margin: 0;
        text-align: center;
        color: var(--compare-chart-text-color);
    }
    ::slotted([slot$='-cta']) {
        display: flex;
        justify-content: center;
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
        display: block;
        max-width: calc(100% - 60px);
        margin: var(--spectrum-spacing-400, 16px) auto 0;
        padding: 0;
        box-sizing: border-box;
        color: var(--compare-chart-text-color);
        font-family: var(--body-font-family, 'Adobe Clean', sans-serif);
        font-size: var(--ax-body-xs-size, var(--type-body-xs-size, 14px));
        font-style: normal;
        font-weight: var(--ax-body-weight-bold, 700);
        line-height: var(--heading-line-height, 130%);
        text-align: left;
    }
    .accessibility-header-row + .table-container {
        margin-top: 0;
    }
    :host(.compchart-preview-chart[data-sticky-header]) .sticky-header-spacer {
        display: none;
        height: 0;
    }
    :host(.compchart-preview-chart) .header-content,
    :host(.compchart-preview-chart) .sticky-header.is-stuck {
        position: static;
        inset-inline: auto;
        width: auto;
        margin-inline: 0;
        top: auto;
        padding-top: var(--spectrum-spacing-500, 24px);
        box-shadow: none;
        transform: none;
    }
    :host(.compchart-preview-chart)
        .accessibility-header-row
        + .table-container {
        margin-top: var(--spectrum-spacing-400, 16px);
    }

    .table-column-header {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        width: 100%;
        box-sizing: border-box;
        padding: var(--spectrum-spacing-500, 24px);
        background: var(--compare-chart-color-gray-100);
        border: 1px solid var(--compare-chart-color-gray-300);
        font-size: var(--type-heading-s-size, 18px);
        font-weight: 700;
        line-height: var(--type-heading-s-lh, 22.5px);
        min-height: 72px;
        border-radius: var(--Radius-corner-radius-100, 8px)
            var(--Radius-corner-radius-100, 8px) 8px 8px;
        font-family: var(--body-font-family, 'Adobe Clean', sans-serif);
        color: var(--compare-chart-text-color);
        text-align: center;
        cursor: pointer;
    }
    .table-column-header:focus-visible {
        outline: 2px solid var(--compare-chart-hover-color);
        outline-offset: -2px;
    }
    .table-column-header[aria-expanded='false'] {
        border-radius: var(--comparison-border-radius);
    }

    /* Toggle icon — background from --compare-chart-toggle-icon-* in :host. */
    .toggle-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        display: block;
        position: absolute;
        inset-inline-end: 24px;
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

    .table-row {
        margin: 0 var(--spectrum-spacing-500, 24px);
        display: grid;
        grid-template-columns: var(--compare-chart-leading-col) var(
                --compare-chart-data-cols
            );
        gap: var(--comparison-table-spacing);
        align-items: start;
        padding: 0;
    }
    .table-row:not(:last-child) {
        border-bottom: 1px solid var(--compare-chart-row-border-color);
    }

    .row-header {
        color: var(--compare-chart-text-color);
        display: flex;
        gap: 6px;
        align-items: center;
        position: relative;
        grid-column: 1 / -1;
        justify-content: center;
        margin: 0 auto;
        padding: var(--spectrum-spacing-400, 16px) 0 0 0;
        text-align: center;
        font-size: var(--type-body-xs-size, 14px);
        font-style: normal;
        font-weight: var(--type-detail-all-weight, 700);
        line-height: 1.3;
    }
    .row-label {
        color: var(--compare-chart-text-color);
        display: inline;
        flex: 1 1 auto;
        font-family: var(--Font-adobe-clean, 'Adobe Clean');
        font-size: var(--ax-body-xs-size, var(--type-body-xs-size, 14px));
        font-style: normal;
        font-weight: var(--ax-body-weight, 400);
        line-height: 150%;
    }
    .row-label strong {
        color: inherit;
        display: inline;
        font: inherit;
        font-weight: var(--ax-body-weight-bold, 700);
    }

    .description-row {
        padding-top: 6px;
        padding-bottom: 6px;
        border-top: none;
    }
    .description-row .row-header {
        font: var(--type-body-xxxs);
        font-weight: 400;
        color: var(--compare-chart-text-secondary-color);
    }

    .table-row p[role='cell'] {
        margin: 0;
        padding: 0 0 var(--spectrum-spacing-500, 24px) 0;
        border: none;
        background: transparent;
        text-align: center;
        font-size: var(--type-body-xs-size, 14px);
        line-height: var(--type-body-xs-lh, 20px);
        color: var(--compare-chart-text-color);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        grid-column: calc(var(--col, 1) + 1);
        position: relative;
    }
    .compare-chart-chip {
        align-items: center;
        background: var(--compare-chart-color-white);
        border: 1px solid var(--compare-chart-color-gray-300);
        border-radius: 4px;
        box-sizing: border-box;
        display: flex;
        gap: 6px;
        justify-content: center;
        min-height: 18px;
        padding: var(--spectrum-spacing-400, 16px)
            var(--comparison-table-spacing);
        width: calc(100% - 2 * var(--comparison-table-spacing) - 2px);
    }
    .table-row p[role='cell']:not(:nth-child(2)) .compare-chart-chip {
        background-color: var(--compare-chart-color-gray-100);
    }
    .table-row p[role='cell']:nth-child(even) .compare-chart-chip {
        background-color: var(--compare-chart-color-white);
    }

    .table-row p[role='cell'] > small {
        color: var(--compare-chart-text-color);
        display: block;
        font-size: var(--type-body-xxs-size, 12px);
        font-weight: 400;
        line-height: var(--type-body-xxs-lh, 15px);
        margin-top: 4px;
        text-align: center;
    }

    .table-row p.primary-cell > small {
        color: var(--compare-chart-primary-color);
    }

    .table-row p.emoji-primary-cell .compare-chart-chip,
    .table-row p.emoji-primary-cell > small {
        color: var(--compare-chart-primary-color);
    }

    .compare-chart-glyph.excluded {
        color: var(--compare-chart-text-color);
    }

    /* Cell-level primary glyph tint (per Figma: ✅ primary feature). */
    .compare-chart-glyph.included.primary {
        color: var(--compare-chart-primary-color);
        font-weight: 700;
    }

    /* Item-cell rows: no chip border, plain text. */
    .table-row p.item-cell {
        color: var(--compare-chart-text-secondary-color);
        display: block;
        font-size: 11px;
        font-weight: 400;
        gap: 0;
        line-height: 1.4;
        text-align: center;
    }

    .table-row p.item-cell.primary-cell {
        color: var(--compare-chart-primary-color);
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
        color: var(--compare-chart-text-secondary-color);
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
        color: var(--compare-chart-hover-color);
        outline: none;
    }
    .tooltip-popover {
        position: absolute;
        background: var(--compare-chart-tooltip-bg);
        color: var(--compare-chart-tooltip-color);
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
        background: var(--compare-chart-tooltip-bg);
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
    @media screen and (max-width: 599px) {
        :host {
            --compare-chart-leading-col: 0px;
            --compare-chart-sticky-top: 0px;
            padding: var(--spectrum-spacing-500, 24px) 0
                var(--spectrum-spacing-800, 48px);
        }
        :host([data-sticky-header]) .sticky-header-spacer {
            display: block;
            height: var(--compare-chart-sticky-spacer-height, 0px);
        }
        .sticky-header-wrapper {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            justify-content: space-between;
        }
        .sticky-header.is-stuck {
            position: fixed;
            inset-inline: 0;
            width: auto;
            margin-inline: 0;
            top: var(--compare-chart-sticky-offset, 64px);
        }
        .header-leading {
            display: none;
        }
        .header-leading-cta {
            display: none;
        }
        .header-card-segment {
            grid-column: var(--col);
            align-self: stretch;
        }
        .header-segment:has(.mobile-filter-select) {
            padding-bottom: 30px;
        }
        .mobile-filter-select {
            display: block;
        }
        .sticky-header.is-stuck .header-segment {
            padding-bottom: 0;
        }
        .table-row {
            grid-template-columns: 1fr 1fr;
        }
        .row-header {
            grid-column: 1 / -1;
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

    @media screen and (min-width: 600px) and (max-width: 899px) {
        :host {
            --compare-chart-leading-col: 0px;
            --compare-chart-sticky-top: 0px;
            padding: var(--spectrum-spacing-500, 24px) 0
                var(--spectrum-spacing-800, 48px);
        }
        :host([data-sticky-header]) .sticky-header-spacer {
            display: block;
            height: var(--compare-chart-sticky-spacer-height, 0px);
        }
        .sticky-header-wrapper {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            max-width: calc(100% - 160px);
        }
        .sticky-header.is-stuck {
            position: fixed;
            inset-inline: 0;
            width: auto;
            margin-inline: 0;
            top: var(--compare-chart-sticky-offset, 64px);
        }
        .table-container {
            max-width: calc(100% - 130px);
        }
        .table-column-header {
            padding: var(--comparison-table-spacing);
        }
        .header-leading {
            display: none;
        }
        .header-leading-cta {
            display: none;
        }
        .header-card-segment {
            grid-column: var(--col);
            align-self: stretch;
        }
        .header-segment:has(.mobile-filter-select) {
            padding-bottom: 30px;
        }
        .mobile-filter-select {
            display: block;
        }
        .sticky-header.is-stuck .header-segment {
            padding-bottom: 0;
        }
        .table-row {
            grid-template-columns: 1fr 1fr;
        }
        .row-header {
            grid-column: 1 / -1;
            justify-content: center;
            text-align: center;
        }
        /* Tablet shows 2 selected cards from 3+ — auto-place rather than
           honor the source --col, which can exceed the grid. */
        .table-row p[role='cell'] {
            grid-column: auto;
        }
    }

    @media screen and (min-width: 900px) {
        :host {
            padding: var(--spectrum-spacing-500, 24px) 0
                var(--spectrum-spacing-800, 48px);
        }
        .sticky-header-wrapper {
            max-width: calc(100% - 4 * var(--spectrum-spacing-500, 24px));
        }
        .table-container {
            max-width: calc(100% - var(--comparison-tablet-spacing));
        }
        .header-leading {
            display: flex;
            align-items: center;
            justify-content: flex-start;
        }
        .row-header {
            display: inline-flex;
            grid-column: auto;
            justify-content: flex-start;
            margin: 0;
            margin-inline-end: var(--comparison-table-spacing);
            padding: var(--spectrum-spacing-500, 24px)
                var(--spectrum-spacing-500, 24px)
                var(--spectrum-spacing-500, 24px) 0;
            text-align: start;
        }
        .table-row p[role='cell'] {
            padding: var(--spectrum-spacing-500, 24px) 0;
        }
        .table-column-header {
            justify-content: space-between;
            position: static;
            padding: var(--spectrum-spacing-500, 24px);
        }
        .toggle-icon {
            position: static;
        }
    }

    @media screen and (min-width: 1200px) {
        :host {
            max-width: var(--comparison-desktop-max-width);
            padding: var(--spectrum-spacing-500, 24px) 0
                var(--spectrum-spacing-800, 48px);
        }
        .sticky-header-wrapper {
            max-width: calc(
                var(--comparison-desktop-max-width) - 2 *
                    var(--spectrum-spacing-500, 24px) - 2px
            );
        }
        .table-container {
            max-width: var(--comparison-desktop-max-width);
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
`;var ht=new Map,Ae=0;function Pt(p,d){let t=++Ae,e=d,o=performance.now(),i,c=()=>{o=performance.now(),i=setTimeout(l,e)},n=()=>{document.visibilityState==="hidden"?(clearTimeout(i),e-=performance.now()-o):c()};function l(){we(t),p()}return ht.set(t,()=>{clearTimeout(i),document.removeEventListener("visibilitychange",n)}),document.addEventListener("visibilitychange",n),document.visibilityState!=="hidden"&&c(),t}function we(p){let d=ht.get(p);d&&(d(),ht.delete(p))}var $t="mas-compare-chart",Se=3e4,tt=4,_e=900,Ce=64,Re=40,ke=["icons","header","badge","price","description","detail","cta"],M={included:["\u2713","\u2714","\u2705"],excluded:["\u2717","\u2718","\u2716","\xD7"],notApplicable:["\u2014","-"]},Ne=p=>M.included.includes(p),Le=p=>M.excluded.includes(p),Me=p=>!p||M.notApplicable.includes(p)||/^-+$/.test(p),F,E,C,R,k,S,$,O,v,V,_,w,T,Y,B,N,P,I,q,H,D,j,K,W,X,Z,Q,r,ut,gt,ft,Ht,Dt,Ut,Ft,Vt,Yt,Bt,G,zt,Gt,qt,et,jt,xt,Kt,Wt,yt,bt,Xt,rt,Et,Oe,ot,vt,At,Zt,Qt,Jt,wt,te,ee,at,it,Tt,St,re,oe,ae,ie,U,se,L,ne,ce,le,pe,de,he,_t,z=class extends Te{constructor(){super();u(this,r);u(this,F);u(this,E,[]);u(this,C,[]);u(this,R,new Map);u(this,k,new Map);u(this,S,[]);u(this,$,[]);u(this,O,new Map);u(this,v,new Set);u(this,V);u(this,_,!1);u(this,w,0);u(this,T,1);u(this,Y,!1);u(this,B,!1);u(this,N,0);u(this,P,null);u(this,I,null);u(this,q,!1);u(this,H,null);u(this,D,null);u(this,j,!1);u(this,K,!1);u(this,W,t=>{let e=t.target;if(e?.parentElement===this){s(this,r,Yt).call(this,t.detail,e);return}e?.closest?.("merch-card")?.parentElement===this&&s(this,r,ut).call(this)});u(this,X,t=>{var e;t.target?.parentElement===this&&(h(this,S,[]),h(this,$,[]),h(this,C,[]),h(this,E,[]),a(this,R).clear(),a(this,k).clear(),a(this,O).clear(),h(this,v,new Set),this.requestUpdate(),(e=a(this,I))==null||e.call(this,!1),h(this,P,null),h(this,I,null))});u(this,Z,()=>s(this,r,G).call(this));u(this,Q,t=>{t.target?.parentElement===this&&s(this,r,ut).call(this)});h(this,F,this.attachInternals?.()),a(this,F)&&(a(this,F).role="table")}connectedCallback(){super.connectedCallback(),this.addEventListener(dt,a(this,Z)),this.addEventListener(ct,a(this,W)),this.addEventListener(lt,a(this,X)),this.addEventListener(pt,a(this,Q)),h(this,V,new ResizeObserver(()=>s(this,r,Et).call(this))),a(this,V).observe(this),s(this,r,wt).call(this),s(this,r,at).call(this)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(dt,a(this,Z)),this.removeEventListener(ct,a(this,W)),this.removeEventListener(lt,a(this,X)),this.removeEventListener(pt,a(this,Q)),a(this,V)?.disconnect(),a(this,N)&&(cancelAnimationFrame(a(this,N)),h(this,N,0)),s(this,r,Tt).call(this)}firstUpdated(){s(this,r,G).call(this),s(this,r,it).call(this)}willUpdate(t){t.has("expandedGroups")&&s(this,r,xt).call(this)}updated(t){(t.has("consonant")||t.has("spectrum"))&&s(this,r,ft).call(this),(t.has("stickyOffset")||t.has("mobileStickyOffset")||t.has("stickyTop")||t.has("collapsed")||t.has("nonSticky"))&&(s(this,r,at).call(this),s(this,r,it).call(this))}checkReady(){if(!this.querySelector(":scope > aem-fragment"))return Promise.resolve(!0);s(this,r,gt).call(this);let e=new Promise(o=>Pt(()=>o(!1),Se));return Promise.race([a(this,P),e])}render(){return this.collapsed?b:A`
            <div
                class="sticky-sentinel sticky-sentinel-top"
                aria-hidden="true"
            ></div>
            <div class="sticky-header-spacer" aria-hidden="true"></div>
            <div class="header-content sticky-header">
                <div class="sticky-header-wrapper">
                    ${s(this,r,ie).call(this)}
                </div>
            </div>
            <slot name="cards" hidden></slot>
            <div
                class="accessibility-header-row"
                aria-hidden="false"
                role="row"
            >
                ${s(this,r,vt).call(this).map(t=>A`<span role="columnheader">${t.title}</span>`)}
            </div>
            ${mt(a(this,S),(t,e)=>`${t.groupIndex}:${e}`,t=>s(this,r,le).call(this,t))}
            <div
                class="sticky-sentinel sticky-sentinel-bottom"
                aria-hidden="true"
            ></div>
        `}};F=new WeakMap,E=new WeakMap,C=new WeakMap,R=new WeakMap,k=new WeakMap,S=new WeakMap,$=new WeakMap,O=new WeakMap,v=new WeakMap,V=new WeakMap,_=new WeakMap,w=new WeakMap,T=new WeakMap,Y=new WeakMap,B=new WeakMap,N=new WeakMap,P=new WeakMap,I=new WeakMap,q=new WeakMap,H=new WeakMap,D=new WeakMap,j=new WeakMap,K=new WeakMap,W=new WeakMap,X=new WeakMap,Z=new WeakMap,Q=new WeakMap,r=new WeakSet,ut=function(){a(this,N)||h(this,N,requestAnimationFrame(()=>{h(this,N,0),s(this,r,G).call(this)}))},gt=function(){a(this,P)||h(this,P,new Promise(t=>{h(this,I,t)}))},ft=function(t=a(this,E)){t.forEach(e=>{e.consonant=this.consonant,e.toggleAttribute("consonant",!!this.consonant),this.spectrum?(e.spectrum=this.spectrum,e.setAttribute("spectrum",this.spectrum)):e.removeAttribute("spectrum")})},Ht=function(t,e){let o=t?.fields||{};if(Array.isArray(o)){let c=o.find(n=>n.name===e);return c?.multiple?c.values||[]:c?.values?.[0]||""}let i=o[e];return Array.isArray(i)?i[0]||"":i?.value??i??""},Dt=function(t,e){let o=t?.fields||{};if(Array.isArray(o))return o.find(c=>c.name===e)?.values||[];let i=o[e];return Array.isArray(i)?i:i==null||i===""?[]:[i?.value??i]},Ut=function(t){let e=t?.references||{};return Array.isArray(e)?e.map(o=>({identifier:o.identifier||o.id||o.path,value:o.value||o})).filter(o=>o.value):Object.entries(e).map(([o,i])=>({identifier:o,value:i?.value||i})).filter(o=>o.value)},Ft=function(t){let e=s(this,r,Ut).call(this,t),o=n=>e.find(({identifier:l,value:m})=>l===n||m.id===n||m.path===n)?.value,i=s(this,r,Dt).call(this,t,"cards").map(o).filter(Boolean);if(i.length)return i.slice(0,tt);let c=(t.referencesTree||[]).filter(n=>n.fieldName==="cards").map(n=>o(n.identifier)).filter(Boolean);return c.length?c.slice(0,tt):e.map(({value:n})=>n).filter(n=>n?.fields).slice(0,tt)},Vt=function(t){if(t?.getAttributeNames)for(let e of t.getAttributeNames()){let o=t.getAttribute(e);o==null?this.removeAttribute(e):this.setAttribute(e,o)}},Yt=async function(t,e){if(t&&!a(this,B)){h(this,B,!0);try{await s(this,r,Bt).call(this,t,e)}finally{h(this,B,!1)}}},Bt=async function(t,e){var x;s(this,r,gt).call(this),this.querySelectorAll("[data-compare-chart-generated]").forEach(y=>y.remove());let o=new DOMParser,i=s(this,r,Ht).call(this,t,"compareChart"),c=o.parseFromString(i||"","text/html"),n=c.body.querySelector("mas-compare-chart")||c.body;s(this,r,Vt).call(this,n),n.querySelectorAll(":scope > div[name]").forEach(y=>{let f=y.cloneNode(!0);f.dataset.compareChartGenerated="true",this.append(f)});let l=e?.hasAttribute("author"),m=s(this,r,Ft).call(this,t),g=[];m.forEach(y=>{e?.cache?.add(y);let f=document.createElement("merch-card");f.setAttribute("slot","cards"),f.dataset.compareChartGenerated="true",s(this,r,ft).call(this,[f]);let J=document.createElement("aem-fragment");J.setAttribute("fragment",y.id),l&&J.setAttribute("author",""),J.setAttribute("loading","cache"),f.append(J),this.append(f),g.push(f)}),await Promise.all(g.map(y=>y.checkReady?.().catch(()=>!1))),s(this,r,G).call(this),(x=a(this,I))==null||x.call(this,!0),h(this,P,null),h(this,I,null)},G=function(){if(!a(this,Y)){h(this,Y,!0);try{s(this,r,zt).call(this),s(this,r,jt).call(this),s(this,r,xt).call(this),s(this,r,Wt).call(this),s(this,r,Et).call(this),this.requestUpdate()}finally{h(this,Y,!1)}}},zt=function(){let t=Array.from(this.querySelectorAll(':scope > merch-card[slot="cards"]')).slice(0,tt);this.querySelectorAll(":scope > [data-compare-chart-slot]").forEach(o=>o.remove());let e=[];t.forEach((o,i)=>{let c=`card-${i+1}`;o.dataset.cardId=c,o.dataset.columnIndex=String(i+1),o.style.setProperty("--col",i+1);let n=o.getAttribute("cell-color")??"default";e.push(s(this,r,Gt).call(this,o,c,i,n))}),h(this,E,t),h(this,C,e),this.setAttribute("data-child-count",String(t.length)),this.style.setProperty("--compare-chart-cols",t.length)},Gt=function(t,e,o,i){let c={},n=new Set;for(let m of ke){let g=`${e}-${m}`;if(c[m]=g,!t)continue;let x=Array.from(t.querySelectorAll(`:scope > [slot="${m}"]`));x.length&&n.add(m);for(let y of x){if(m==="cta"){s(this,r,qt).call(this,y,g);continue}let f=y.cloneNode(!0);f.setAttribute("slot",g),f.toggleAttribute("data-compare-chart-slot",!0),s(this,r,et).call(this,f),this.appendChild(f)}}t&&(t.hidden=!0,t.setAttribute("aria-hidden","true"),t.dataset.cellColor=i);let l=Array.from(this.querySelectorAll(`:scope > [slot="${c.header}"]`)).map(m=>m.textContent.trim()).filter(Boolean).join(" ");return{cardId:e,col:o+1,cellColor:i,slots:c,presentSlots:n,title:l||`Card ${o+1}`}},qt=function(t,e){let o=t.matches("a,button")?[t]:Array.from(t.querySelectorAll("a,button"));if(!o.length){let i=t.cloneNode(!0);i.setAttribute("slot",e),i.toggleAttribute("data-compare-chart-slot",!0),s(this,r,et).call(this,i),this.appendChild(i);return}for(let i of o){let c=i.cloneNode(!0);c.setAttribute("slot",e),c.toggleAttribute("data-compare-chart-slot",!0),s(this,r,et).call(this,c),this.appendChild(c)}},et=function(t){t.removeAttribute("style"),t.querySelectorAll("[style]").forEach(e=>e.removeAttribute("style"))},jt=function(){h(this,S,[]),h(this,$,Mt(this)),a(this,O).clear();let t=1;Array.from(this.querySelectorAll(":scope > div[name]")).forEach((e,o)=>{let i=e.getAttribute("name"),c=e.querySelector(":scope > h4")?.textContent.trim()??"",n=o+1,l={heading:c,groupIndex:n,groupKey:i,rows:[]};a(this,S).push(l);let m=new Map;e.querySelectorAll(":scope > p[name]").forEach(g=>{m.set(g.getAttribute("name"),g)}),m.forEach((g,x)=>{let y=`${i}@${x}`;t++,l.rows.push({slot:y,rowIndex:t}),a(this,O).set(y,{rowIndex:t,groupIndex:n})})}),a(this,$).forEach(e=>{let o=a(this,S).length+1,i={heading:e.label,groupIndex:o,groupKey:e.name,rows:[]};a(this,S).push(i),e.rows.forEach(c=>{let n=`${e.name}@${c.name}`;t++,i.rows.push({slot:n,rowIndex:t}),a(this,O).set(n,{rowIndex:t,groupIndex:o})})})},xt=function(){let t=(this.expandedGroups??"").trim(),e=a(this,S).length;if(h(this,v,new Set),!t)e>0&&a(this,v).add(1);else if(t==="all")for(let o=1;o<=e;o+=1)a(this,v).add(o);else{if(t==="none")return;t.split(",").map(o=>parseInt(o.trim(),10)).filter(o=>!isNaN(o)&&o>=1&&o<=e).forEach(o=>a(this,v).add(o))}},Kt=function(){let t=a(this,S).length;return a(this,v).size?t&&a(this,v).size===t?"all":[...a(this,v)].sort((e,o)=>e-o).join(","):"none"},Wt=function(){a(this,k).clear(),a(this,R).clear(),Array.from(this.querySelectorAll(":scope > div[name]")).forEach(t=>{let e=t.getAttribute("name"),o=new Map;t.querySelectorAll(":scope > p[name]").forEach(i=>{o.set(i.getAttribute("name"),i)}),o.forEach((i,c)=>{let n=`${e}@${c}`,l=i.cloneNode(!0),m=s(this,r,yt).call(this,l);a(this,k).set(n,{labelHTML:l.innerHTML,title:m,tooltipPosition:i.getAttribute("data-tooltip-position")??"top-center",isItemRow:i.hasAttribute("item")})})}),Array.from(this.querySelectorAll(':scope > merch-card[slot="cards"]')).forEach(t=>{let e=t.dataset.cardId,o=parseInt(t.dataset.columnIndex,10),i=new Map;t.querySelectorAll(':scope > p[name], :scope > [slot="features"] p[name]').forEach(c=>{let n=c.getAttribute("name");!n||!n.includes("@")||i.set(n,c)});for(let[c,n]of i){if(!a(this,O).has(c))continue;let l=n.cloneNode(!0),m=l.textContent.includes("\u2705"),g=l.hasAttribute("primary");g&&l.classList.add("primary-cell"),m&&l.classList.add("emoji-primary-cell");let x=l.hasAttribute("item");x&&l.classList.add("item-cell");let y=s(this,r,yt).call(this,l);s(this,r,bt).call(this,l);let f=a(this,R).get(c)??[];f.push({cardId:e,col:o,isCellPrimary:g,isEmojiPrimary:m,isItem:x,title:y,tooltipPosition:l.getAttribute("data-tooltip-position")??"top-center",html:l.innerHTML,ariaLabel:l.getAttribute("aria-label")}),a(this,R).set(c,f)}});for(let t of a(this,$))t.rows.forEach(e=>{let o=`${t.name}@${e.name}`;a(this,k).set(o,{labelHTML:e.html,title:void 0,tooltipPosition:"top-center",isItemRow:!1});let i=e.cells.map((c,n)=>{let l=document.createElement("p");return l.innerHTML=c,s(this,r,bt).call(this,l),{cardId:a(this,E)[n]?.dataset.cardId,col:n+1,isCellPrimary:!1,isEmojiPrimary:c.includes("\u2705"),isItem:!1,title:void 0,tooltipPosition:"top-center",html:l.innerHTML,ariaLabel:l.getAttribute("aria-label")}}).filter(c=>c.cardId);a(this,R).set(o,i)})},yt=function(t){let e=t.querySelector(":scope > a.secondary-link[title]"),o=e?.getAttribute("title")||t.getAttribute("title")||void 0;return e?.remove(),o&&t.removeAttribute("title"),o},bt=function(t){let e=t.textContent.trim();if(Ne(e))t.setAttribute("aria-label",this.getAttribute("included-text")??"Included"),s(this,r,rt).call(this,t);else if(Le(e))t.setAttribute("aria-label",this.getAttribute("not-included-text")??"Not included"),s(this,r,rt).call(this,t);else if(Me(e)){if(t.setAttribute("aria-label",this.getAttribute("not-applicable-text")??"Not applicable"),!e){let o=document.createElement("span");o.className="empty-cell-sr",o.textContent=this.getAttribute("sr-only-not-applicable-text")??this.getAttribute("not-applicable-text")??"Not applicable",t.textContent="\u2014";let i=document.createElement("span");i.setAttribute("aria-hidden","true"),i.textContent="\u2014",t.replaceChildren(i,o)}}else t.removeAttribute("aria-label"),s(this,r,rt).call(this,t);s(this,r,Xt).call(this,t)},Xt=function(t){if(t.classList.contains("item-cell"))return;let e=document.createElement("span");e.className="compare-chart-chip";let o=Array.from(t.childNodes);for(let i of o){if(i.nodeType===Node.ELEMENT_NODE&&i.tagName==="SMALL")break;e.appendChild(i)}t.insertBefore(e,t.firstChild)},rt=function(t){let e=[...M.included,...M.excluded,...M.notApplicable],o=t.classList.contains("primary-cell");Array.from(t.childNodes).forEach(i=>{if(i.nodeType!==Node.TEXT_NODE)return;let c=i.textContent;if(!e.some(l=>c.includes(l)))return;let n=document.createDocumentFragment();for(let l of c)if(e.includes(l)){let m=document.createElement("span");m.setAttribute("aria-hidden","true"),m.classList.add("compare-chart-glyph"),m.textContent=l==="\u2705"?"\u2713":l,M.included.includes(l)&&m.classList.add("included"),M.excluded.includes(l)&&m.classList.add("excluded"),(o||l==="\u2705")&&m.classList.add("primary"),n.appendChild(m)}else n.appendChild(document.createTextNode(l));i.replaceWith(n)})},Et=function(){let t=this.getBoundingClientRect().width||this.offsetWidth||window.innerWidth,e=t>0&&t<_e,o=e!==a(this,_);h(this,_,e),this.toggleAttribute("data-mobile",e),e?s(this,r,At).call(this):s(this,r,Qt).call(this),s(this,r,wt).call(this),s(this,r,at).call(this),s(this,r,it).call(this),o&&this.requestUpdate()},Oe=function(){return new Set(s(this,r,ot).call(this))},ot=function(){return!a(this,_)||a(this,E).length<=2?a(this,E).map(t=>t.dataset.cardId):[a(this,E)[a(this,w)],a(this,E)[a(this,T)]].filter(Boolean).map(t=>t.dataset.cardId)},vt=function(){return s(this,r,ot).call(this).map(t=>a(this,C).find(e=>e.cardId===t)).filter(Boolean)},At=function(){this.style.setProperty("--compare-chart-cols",2),!(a(this,E).length<=2)&&s(this,r,Zt).call(this)},Zt=function(){let t=a(this,E).length;t<=2||(a(this,w)>=t&&h(this,w,0),a(this,T)>=t&&h(this,T,Math.min(1,t-1)),a(this,w)===a(this,T)&&h(this,T,(a(this,w)+1)%t))},Qt=function(){this.style.setProperty("--compare-chart-cols",a(this,E).length)},Jt=function(t,e){t==="A"?(e===a(this,T)&&h(this,T,a(this,w)),h(this,w,e)):(e===a(this,w)&&h(this,w,a(this,T)),h(this,T,e)),s(this,r,At).call(this),this.requestUpdate()},wt=function(){if(a(this,_)){this.style.setProperty("--compare-chart-sticky-top","0px");return}},te=function(){return this.stickyOffset??this.getAttribute("sticky-offset")??this.stickyTop??this.getAttribute("sticky-top")},ee=function(){return this.mobileStickyOffset??this.getAttribute("mobile-sticky-offset")},at=function(){let t=a(this,_)?s(this,r,ee).call(this):s(this,r,te).call(this),e=a(this,_)?Re:Ce,o=t!=null?String(t).trim():"",i=o?/^\d+$/.test(o)?`${o}px`:o:`${e}px`;this.style.setProperty("--compare-chart-sticky-offset",i)},it=function(){if(s(this,r,Tt).call(this),this.nonSticky||this.collapsed||!this.isConnected)return;let t=this.shadowRoot,e=t?.querySelector(".header-content"),o=t?.querySelector(".sticky-sentinel-top"),i=t?.querySelector(".sticky-sentinel-bottom");if(!e||!o||!i)return;let c=parseFloat(getComputedStyle(e).top)||0,n=e.getBoundingClientRect().height;h(this,H,new IntersectionObserver(([l])=>{h(this,j,l.boundingClientRect.bottom<=c),s(this,r,St).call(this)},{threshold:[0],rootMargin:`${-c}px 0px 0px 0px`})),a(this,H).observe(o),h(this,D,new IntersectionObserver(([l])=>{h(this,K,l.boundingClientRect.top>c+n),s(this,r,St).call(this)},{threshold:[0],rootMargin:`${-(c+n)}px 0px 0px 0px`})),a(this,D).observe(i)},Tt=function(){a(this,H)?.disconnect(),a(this,D)?.disconnect(),h(this,H,null),h(this,D,null)},St=function(){s(this,r,re).call(this,a(this,j)&&a(this,K))},re=function(t){let e=this.shadowRoot?.querySelector(".header-content");if(t!==a(this,q)){if(t){let o=e?.getBoundingClientRect().height??0;this.style.setProperty("--compare-chart-sticky-spacer-height",`${o}px`)}else this.style.removeProperty("--compare-chart-sticky-spacer-height");h(this,q,t),this.toggleAttribute("data-sticky-header",t),e?.classList.toggle("sticky",t),e?.classList.toggle("is-stuck",t)}},oe=function(t){let e=!1;a(this,v).has(t)?a(this,v).delete(t):(h(this,v,new Set([t])),e=!0),this.expandedGroups=s(this,r,Kt).call(this),this.dispatchEvent(new CustomEvent(Rt,{detail:{value:this.expandedGroups},bubbles:!0,composed:!0})),this.requestUpdate(),e&&this.updateComplete.then(()=>s(this,r,ae).call(this,t))},ae=function(t){if(this.collapsed)return;let e=this.shadowRoot?.querySelector(`.table-container[data-group-index="${String(t)}"]`);if(!e)return;let o=this.shadowRoot?.querySelector(".header-content"),i=getComputedStyle(this),c=parseFloat(i.getPropertyValue("--compare-chart-sticky-top"))||0,n=i.getPropertyValue("--compare-chart-sticky-offset").trim(),l=n&&parseFloat(n)||0,m=o?.getBoundingClientRect().height??0,g=c+l+m,x=e.style.scrollMarginTop;e.style.scrollMarginTop=`${g}px`,e.scrollIntoView({block:"start",behavior:"smooth"}),requestAnimationFrame(()=>{e.style.scrollMarginTop=x})},ie=function(){let t=s(this,r,vt).call(this),e=s(this,r,se).call(this,t),o=1;return A`
            ${s(this,r,U).call(this,t,"header",o++,e)}
            ${e.has("price")?s(this,r,U).call(this,t,"price",o++,e):b}
            ${e.has("description")?s(this,r,U).call(this,t,"description",o++,e):b}
            ${e.has("detail")?s(this,r,U).call(this,t,"detail",o++,e):b}
            ${e.has("cta")?s(this,r,U).call(this,t,"cta",o++,e):b}
        `},U=function(t,e,o,i){return A`
            <div
                class="header-leading header-leading-${e}"
                style="--row: ${o};"
            ></div>
            ${t.map((c,n)=>s(this,r,ne).call(this,c,e,n+1,n,o,i))}
        `},se=function(t){let e=new Set;for(let o of t)for(let i of o.presentSlots)e.add(i);return e},L=function(t,e,o){return o.has(e)?A`<slot name=${t.slots[e]}></slot>`:b},ne=function(t,e,o,i,c,n){let l=["header-card-segment",`${e}-segment`],m=t.cellColor;return A`<div
            class=${l.join(" ")}
            data-card-id=${t.cardId}
            data-card-index=${t.col-1}
            data-cell-color=${m}
            style="--col: ${o}; --row: ${c};"
        >
            ${e==="header"?A`
                      ${s(this,r,L).call(this,t,"icons",n)}
                      ${s(this,r,L).call(this,t,"header",n)}
                      ${s(this,r,L).call(this,t,"badge",n)}
                      ${s(this,r,ce).call(this,t,i)}
                  `:b}
            ${e==="price"?s(this,r,L).call(this,t,"price",n):b}
            ${e==="description"?s(this,r,L).call(this,t,"description",n):b}
            ${e==="detail"?s(this,r,L).call(this,t,"detail",n):b}
            ${e==="cta"?s(this,r,L).call(this,t,"cta",n):b}
        </div>`},ce=function(t,e){if(!a(this,_)||a(this,C).length<=2)return b;let o=a(this,C).findIndex(n=>n.cardId===t.cardId),i=e===0?"A":"B",c=i==="A"?a(this,T):a(this,w);return A`<select
            class="mobile-filter-select"
            name="column-filter"
            aria-label=${this.getAttribute("choose-table-column-text")??"Choose column"}
            .value=${String(o)}
            @change=${n=>s(this,r,Jt).call(this,i,parseInt(n.target.value,10))}
        >
            ${a(this,C).map((n,l)=>l===c?b:A`<option
                    value=${l}
                    ?selected=${l===o}
                >
                    ${n.title}
                </option>`)}
        </select>`},le=function(t){let e=a(this,v).has(t.groupIndex);return A`
            <div class="table-container" data-group-index=${t.groupIndex}>
                <button
                    class="table-column-header"
                    aria-expanded=${e}
                    aria-controls="g-${t.groupIndex}"
                    @click=${()=>s(this,r,oe).call(this,t.groupIndex)}
                >
                    <span class="group-title">${t.heading}</span>
                    <span
                        class="toggle-icon ${e?"is-expanded":""}"
                        aria-hidden="true"
                    ></span>
                </button>
                <div
                    id="g-${t.groupIndex}"
                    class="table-body ${e?"":"hide"}"
                    role="rowgroup"
                    aria-label=${t.heading}
                >
                    ${mt(t.rows,(o,i)=>`${o.slot}:${i}`,o=>s(this,r,de).call(this,o))}
                </div>
            </div>
        `},pe=function(t,e){return{cardId:t,col:e,isCellPrimary:!1,isEmojiPrimary:!1,isItem:!1,title:void 0,tooltipPosition:"top-center",html:'<span class="compare-chart-chip"><span class="compare-chart-glyph" aria-hidden="true">\u2014</span></span>',ariaLabel:this.getAttribute("not-applicable-text")??"Not applicable"}},de=function(t){let e=a(this,k).get(t.slot)??{},o=new Map((a(this,R).get(t.slot)??[]).map(l=>[l.cardId,l])),i=s(this,r,ot).call(this),c=i.map(l=>o.get(l)).filter(Boolean);!c.length&&i.length>0&&a(this,k).has(t.slot)&&(c=i.map(l=>{let m=a(this,E).find(x=>x.dataset.cardId===l),g=parseInt(m?.dataset.columnIndex??"1",10);return s(this,r,pe).call(this,l,g)}));let n=["table-row"];return e.isItemRow&&n.push("description-row"),A`
            <div class=${n.join(" ")} role="row">
                <div class="row-header" role="rowheader">
                    <span class="row-label"
                        >${It(e.labelHTML??"")}</span
                    >
                    ${s(this,r,_t).call(this,e.title,e.tooltipPosition)}
                </div>
                ${mt(c,(l,m)=>`${l.cardId}:${m}`,l=>s(this,r,he).call(this,l))}
            </div>
        `},he=function(t){let e=["cell"];return t.isCellPrimary&&e.push("primary-cell"),t.isEmojiPrimary&&e.push("emoji-primary-cell"),t.isItem&&e.push("item-cell"),A`<p
            role="cell"
            class=${e.join(" ")}
            data-card-id=${t.cardId}
            style="--col: ${t.col};"
            aria-label=${t.ariaLabel??b}
        >
            ${It(t.html)}${s(this,r,_t).call(this,t.title,t.tooltipPosition)}
        </p>`},_t=function(t,e){return t?A`<span class="tooltip-wrapper" data-tooltip-position=${e||"top-center"}>
            <button class="tooltip-trigger" aria-label="More info" tabindex="0">
                <span aria-hidden="true">i</span>
            </button>
            <span class="tooltip-popover" role="tooltip">${t}</span>
        </span>`:b},st(z,"properties",{expandedGroups:{type:String,attribute:"expanded-groups",reflect:!0},collapsed:{type:Boolean,attribute:"collapsed",reflect:!0},consonant:{type:Boolean,attribute:"consonant"},spectrum:{type:String,attribute:"spectrum"},stickyOffset:{type:String,attribute:"sticky-offset"},mobileStickyOffset:{type:String,attribute:"mobile-sticky-offset"},stickyTop:{type:String,attribute:"sticky-top"},nonSticky:{type:Boolean,attribute:"non-sticky"}}),st(z,"styles",Ot);customElements.get($t)||customElements.define($t,z);export{z as MasCompareChart};
