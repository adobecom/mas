var st=Object.defineProperty;var ve=p=>{throw TypeError(p)};var nt=(p,h,e)=>h in p?st(p,h,{enumerable:!0,configurable:!0,writable:!0,value:e}):p[h]=e;var oe=(p,h,e)=>nt(p,typeof h!="symbol"?h+"":h,e),ae=(p,h,e)=>h.has(p)||ve("Cannot "+e);var a=(p,h,e)=>(ae(p,h,"read from private field"),e?e.call(p):h.get(p)),u=(p,h,e)=>h.has(p)?ve("Cannot add the same private member more than once"):h instanceof WeakSet?h.add(p):h.set(p,e),m=(p,h,e,t)=>(ae(p,h,"write to private field"),t?t.call(p,e):h.set(p,e),e),s=(p,h,e)=>(ae(p,h,"access private method"),e);import{html as A,LitElement as gt,nothing as y}from"./lit-all.min.js";import{repeat as ce}from"./lit-all.min.js";import{unsafeHTML as ke}from"./lit-all.min.js";var _t=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Tt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var ct='span[is="inline-price"][data-wcs-osi]',lt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var pt='a[is="upt-link"]',St=`${ct},${lt},${pt}`;var ie="aem:load",se="aem:error",ne="mas:ready";var Ae="mas-compare-chart:rehydrate",we="expanded-groups-change";var Rt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var kt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var dt=p=>String(p||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[/&]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-+|-+$/g,"")||"item",Te=p=>Array.from(p.childNodes).map(h=>h.nodeType===Node.TEXT_NODE?h.textContent:h.nodeType===Node.ELEMENT_NODE?h.outerHTML:"").join("").replace(/\s+/g," ").trim(),ht=p=>{let h=p.querySelector("[aria-label]")?.getAttribute("aria-label")?.trim().toLowerCase();return h==="yes"?"\u2713":h==="no"?"\u2717":p.querySelector(".icon-checkmark-no-fill, .icon-checkmark")?"\u2713":p.querySelector(".icon-crossmark")?"\u2717":Te(p)},Ce=p=>Te(p).replace(/\s+/g," ").trim(),mt=p=>(p.querySelector(".ctv2-th-header")?.textContent||p.textContent||"").replace(/:$/,"").replace(/\s+/g," ").trim(),_e=(p,h)=>{let e=dt(p),t=e,o=2;for(;h.has(t);)t=`${e}-${o}`,o+=1;return h.add(t),t},Se=p=>{let h=new Set;return Array.from(p.querySelectorAll(":scope > table")).map(e=>{let t=Array.from(e.querySelectorAll(":scope > thead > tr:first-child > th")),o=t[0],i=(o?.textContent||"").replace(/\s+/g," ").trim(),c=t.slice(1).map(d=>d.textContent.replace(/\s+/g," ").trim()),n=new Set,l=Array.from(e.querySelectorAll(":scope > tbody > tr")).map(d=>{let g=Array.from(d.children),f=g.find(x=>x.matches('th[scope="row"], th'))||g[0],b=mt(f);return{name:_e(b,n),html:Ce(f),cells:g.slice(g.indexOf(f)+1).map(ht)}});return{name:_e(i,h),label:i,labelHtml:o?Ce(o):i,columns:c,rows:l}})};import{css as ut}from"./lit-all.min.js";var Re=ut`
    :host {
        --comparison-border-radius: 8px;
        --comparison-row-border-color: #e9e9e9;
        --comparison-desktop-max-width: 1200px;
        --comparison-tablet-spacing: var(--spectrum-spacing-800, 48px);
        --comparison-table-spacing: var(--spectrum-spacing-300, 12px);
        --compare-chart-row-border-color: var(--comparison-row-border-color);
        --compare-chart-desktop-max-width: var(--comparison-desktop-max-width);
        --compare-chart-spacing: var(--comparison-table-spacing);
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
        --compare-chart-sticky-inline-inset: 0px;
        --compare-chart-sticky-offset: 64px;

        /* Local fallbacks for Milo/Spectrum typography tokens. */
        --type-heading-xs: 700 18px/22px 'Adobe Clean', sans-serif;
        --type-body-bold-s: 700 16px/24px 'Adobe Clean', sans-serif;
        --type-body-bold-xs: 700 14px/20px 'Adobe Clean', sans-serif;
        --type-body-bold-xxs: 700 12px/15px 'Adobe Clean', sans-serif;
        --type-body-xs: 400 14px/20px 'Adobe Clean', sans-serif;
        --type-body-italic-xxs: italic 400 12px/15px 'Adobe Clean', sans-serif;
        --type-body-xxxs: 400 11px/14px 'Adobe Clean', sans-serif;
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
        color: var(--color-text);
    }

    :host-context(.dark),
    :host([data-dark]) {
        --color-text: #f5f5f5;
        --color-text-secondary: #b0b0b0;
        --comparison-row-border-color: #444;
        --compare-chart-row-border-color: #444;
        background: #1e1e1e;
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
        background: var(--color-white, #fff);
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
        color: var(--color-text);
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
        color: var(--color-text);
        text-align: center;
        align-self: stretch;
    }
    .header-card-segment slot {
        display: block;
        max-width: 100%;
    }
    .header-segment,
    .price-segment {
        border: 1px solid var(--color-gray-300, #d5d5d5);
        border-radius: var(--comparison-border-radius);
        padding: var(--spectrum-spacing-200, 8px);
        background: #fff;
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
        background: var(--color-gray-100, #f8f8f8);
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
        border-top: 1px solid var(--color-gray-300, #d5d5d5);
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
        background: var(--color-white, #fff);
        color: var(--color-black, #000);
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
        color: var(--color-text);
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
        color: var(--C1-Text-text, #2c2c2c);
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
        color: var(--color-gray-700-variant, var(--color-text));
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
    :host(.compchart-preview-chart) .accessibility-header-row + .table-container {
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
        background: var(--C1-Web-Gray-Scale-gray-100, #f8f8f8);
        border: 1px solid var(--C1-Stroke-compare-table-border, #d4d4d4);
        font-size: var(--type-heading-s-size, 18px);
        font-weight: 700;
        line-height: var(--type-heading-s-lh, 22.5px);
        min-height: 72px;
        border-radius: var(--Radius-corner-radius-100, 8px)
            var(--Radius-corner-radius-100, 8px) 8px 8px;
        font-family: var(--body-font-family, 'Adobe Clean', sans-serif);
        color: var(--color-black, #000);
        text-align: center;
        cursor: pointer;
    }
    .table-column-header:focus-visible {
        outline: 2px solid var(--hover-border-color);
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
        border-bottom: 1px solid var(--comparison-row-border-color);
    }

    .row-header {
        color: var(--color-black, #000);
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
        color: var(--C1-Text-text, #2c2c2c);
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
        color: var(--color-text-secondary);
    }

    .table-row p[role='cell'] {
        margin: 0;
        padding: 0 0 var(--spectrum-spacing-500, 24px) 0;
        border: none;
        background: transparent;
        text-align: center;
        font-size: var(--type-body-xs-size, 14px);
        line-height: var(--type-body-xs-lh, 20px);
        color: var(--color-black, #000);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        grid-column: calc(var(--col, 1) + 1);
        position: relative;
    }
    .compare-chart-chip {
        align-items: center;
        background: #fff;
        border: 1px solid var(--color-gray-300, #d5d5d5);
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
        background-color: var(--color-gray-100, #f8f8f8);
    }
    .table-row p[role='cell']:nth-child(even) .compare-chart-chip {
        background-color: var(--color-white, #fff);
    }

    .table-row p[role='cell'] > small {
        color: var(--color-black, #000);
        display: block;
        font-size: var(--type-body-xxs-size, 12px);
        font-weight: 400;
        line-height: var(--type-body-xxs-lh, 15px);
        margin-top: 4px;
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
`;var Ne="mas-compare-chart",ft=3e4,X=4,xt=900,bt=64,yt=["icons","header","badge","price","description","detail","cta"],M={included:["\u2713","\u2714","\u2705"],excluded:["\u2717","\u2718","\u2716","\xD7"],notApplicable:["\u2014","-"]},Et=p=>M.included.includes(p),vt=p=>M.excluded.includes(p),At=p=>!p||M.notApplicable.includes(p)||/^-+$/.test(p),$=(p,h,e)=>p.placeholders?.[h]??e,F,E,T,S,R,_,G,I,v,z,k,w,C,V,Y,P,O,B,N,H,j,K,W,r,le,pe,Le,Me,Pe,Oe,Ie,He,D,$e,De,Ue,Q,Fe,de,Ge,ze,he,me,Ve,J,ue,wt,ee,ge,fe,Ye,Be,qe,xe,je,be,Ke,ye,te,We,re,Ze,Xe,Qe,U,Je,L,et,tt,rt,ot,at,it,Ee,q=class extends gt{constructor(){super();u(this,r);u(this,F);u(this,E,[]);u(this,T,[]);u(this,S,new Map);u(this,R,new Map);u(this,_,[]);u(this,G,[]);u(this,I,new Map);u(this,v,new Set);u(this,z);u(this,k,!1);u(this,w,0);u(this,C,1);u(this,V,!1);u(this,Y,!1);u(this,P,null);u(this,O,null);u(this,B,!1);u(this,N,0);u(this,H,()=>s(this,r,te).call(this));u(this,j,e=>{let t=e.target;if(t?.parentElement===this){s(this,r,Ie).call(this,e.detail,t);return}t?.closest?.("merch-card")?.parentElement===this&&s(this,r,D).call(this)});u(this,K,e=>{var t;e.target?.parentElement===this&&(m(this,_,[]),m(this,T,[]),m(this,E,[]),a(this,S).clear(),a(this,R).clear(),this.requestUpdate(),(t=a(this,O))==null||t.call(this,!1),m(this,P,null),m(this,O,null))});u(this,W,e=>{e.target?.parentElement===this&&s(this,r,D).call(this)});m(this,F,this.attachInternals?.()),a(this,F)&&(a(this,F).role="table")}connectedCallback(){super.connectedCallback(),this.addEventListener(Ae,()=>s(this,r,D).call(this)),this.addEventListener(ie,a(this,j)),this.addEventListener(se,a(this,K)),this.addEventListener(ne,a(this,W)),m(this,z,new ResizeObserver(()=>s(this,r,ue).call(this))),a(this,z).observe(this),s(this,r,Ke).call(this)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(ie,a(this,j)),this.removeEventListener(se,a(this,K)),this.removeEventListener(ne,a(this,W)),a(this,z)?.disconnect(),s(this,r,ye).call(this)}firstUpdated(){s(this,r,D).call(this)}updated(e){e.has("expandedGroups")&&s(this,r,de).call(this),(e.has("consonant")||e.has("spectrum"))&&s(this,r,pe).call(this),(e.has("stickyOffset")||e.has("stickyTop"))&&(s(this,r,be).call(this),s(this,r,te).call(this))}checkReady(){if(!this.querySelector(":scope > aem-fragment"))return Promise.resolve(!0);s(this,r,le).call(this);let t=new Promise(o=>setTimeout(()=>o(!1),ft));return Promise.race([a(this,P),t])}render(){return this.collapsed?y:A`
            <div class="sticky-header-spacer" aria-hidden="true"></div>
            <div class="header-content sticky-header">
                <div class="sticky-header-wrapper">
                    ${s(this,r,Qe).call(this)}
                </div>
            </div>
            <slot name="cards" hidden></slot>
            <div
                class="accessibility-header-row"
                aria-hidden="false"
                role="row"
            >
                ${s(this,r,ge).call(this).map(e=>A`<span role="columnheader">${e.title}</span>`)}
            </div>
            ${ce(a(this,_),(e,t)=>`${e.groupIndex}:${t}`,e=>s(this,r,rt).call(this,e))}
        `}};F=new WeakMap,E=new WeakMap,T=new WeakMap,S=new WeakMap,R=new WeakMap,_=new WeakMap,G=new WeakMap,I=new WeakMap,v=new WeakMap,z=new WeakMap,k=new WeakMap,w=new WeakMap,C=new WeakMap,V=new WeakMap,Y=new WeakMap,P=new WeakMap,O=new WeakMap,B=new WeakMap,N=new WeakMap,H=new WeakMap,j=new WeakMap,K=new WeakMap,W=new WeakMap,r=new WeakSet,le=function(){a(this,P)||m(this,P,new Promise(e=>{m(this,O,e)}))},pe=function(e=a(this,E)){e.forEach(t=>{t.consonant=this.consonant,t.toggleAttribute("consonant",!!this.consonant),this.spectrum?(t.spectrum=this.spectrum,t.setAttribute("spectrum",this.spectrum)):t.removeAttribute("spectrum")})},Le=function(e,t){let o=e?.fields||{};if(Array.isArray(o)){let c=o.find(n=>n.name===t);return c?.multiple?c.values||[]:c?.values?.[0]||""}let i=o[t];return Array.isArray(i)?i[0]||"":i?.value??i??""},Me=function(e,t){let o=e?.fields||{};if(Array.isArray(o))return o.find(c=>c.name===t)?.values||[];let i=o[t];return Array.isArray(i)?i:i==null||i===""?[]:[i?.value??i]},Pe=function(e){let t=e?.references||{};return Array.isArray(t)?t.map(o=>({identifier:o.identifier||o.id||o.path,value:o.value||o})).filter(o=>o.value):Object.entries(t).map(([o,i])=>({identifier:o,value:i?.value||i})).filter(o=>o.value)},Oe=function(e){let t=s(this,r,Pe).call(this,e),o=n=>t.find(({identifier:l,value:d})=>l===n||d.id===n||d.path===n)?.value,i=s(this,r,Me).call(this,e,"cards").map(o).filter(Boolean);if(i.length)return i.slice(0,X);let c=(e.referencesTree||[]).filter(n=>n.fieldName==="cards").map(n=>o(n.identifier)).filter(Boolean);return c.length?c.slice(0,X):t.map(({value:n})=>n).filter(n=>n?.fields).slice(0,X)},Ie=async function(e,t){if(e&&!a(this,Y)){m(this,Y,!0);try{await s(this,r,He).call(this,e,t)}finally{m(this,Y,!1)}}},He=async function(e,t){var f;s(this,r,le).call(this),this.querySelectorAll("[data-compare-chart-generated]").forEach(b=>b.remove());let o=new DOMParser,i=s(this,r,Le).call(this,e,"compareChart"),c=o.parseFromString(i||"","text/html"),n=c.body.querySelector("mas-compare-chart")||c.body;n.hasAttribute?.("expanded-groups")&&(this.expandedGroups=n.getAttribute("expanded-groups")),n.querySelectorAll(":scope > div[name]").forEach(b=>{let x=b.cloneNode(!0);x.dataset.compareChartGenerated="true",this.append(x)});let l=t?.hasAttribute("author"),d=s(this,r,Oe).call(this,e),g=[];d.forEach(b=>{t?.cache?.add(b);let x=document.createElement("merch-card");x.setAttribute("slot","cards"),x.dataset.compareChartGenerated="true",s(this,r,pe).call(this,[x]);let Z=document.createElement("aem-fragment");Z.setAttribute("fragment",b.id),l&&Z.setAttribute("author",""),Z.setAttribute("loading","cache"),x.append(Z),this.append(x),g.push(x)}),await Promise.all(g.map(b=>b.checkReady?.().catch(()=>!1))),s(this,r,D).call(this),(f=a(this,O))==null||f.call(this,!0),m(this,P,null),m(this,O,null)},D=function(){if(!a(this,V)){m(this,V,!0);try{s(this,r,$e).call(this),s(this,r,Fe).call(this),s(this,r,de).call(this),s(this,r,ze).call(this),s(this,r,ue).call(this),this.requestUpdate()}finally{m(this,V,!1)}}},$e=function(){let e=Array.from(this.querySelectorAll(':scope > merch-card[slot="cards"]')).slice(0,X);this.querySelectorAll(":scope > [data-compare-chart-slot]").forEach(o=>o.remove());let t=[];e.forEach((o,i)=>{let c=`card-${i+1}`;o.dataset.cardId=c,o.dataset.columnIndex=String(i+1),o.style.setProperty("--col",i+1);let n=o.getAttribute("cell-color")??"default";t.push(s(this,r,De).call(this,o,c,i,n))}),m(this,E,e),m(this,T,t),this.setAttribute("data-child-count",String(e.length)),this.style.setProperty("--compare-chart-cols",e.length)},De=function(e,t,o,i){let c={},n=new Set;for(let d of yt){let g=`${t}-${d}`;if(c[d]=g,!e)continue;let f=Array.from(e.querySelectorAll(`:scope > [slot="${d}"]`));f.length&&n.add(d);for(let b of f){if(d==="cta"){s(this,r,Ue).call(this,b,g);continue}let x=b.cloneNode(!0);x.setAttribute("slot",g),x.toggleAttribute("data-compare-chart-slot",!0),s(this,r,Q).call(this,x),this.appendChild(x)}}e&&(e.hidden=!0,e.setAttribute("aria-hidden","true"),e.dataset.cardId=t,e.dataset.columnIndex=String(o+1),e.dataset.cellColor=i);let l=Array.from(this.querySelectorAll(`:scope > [slot="${c.header}"]`)).map(d=>d.textContent.trim()).filter(Boolean).join(" ");return{cardId:t,col:o+1,cellColor:i,slots:c,presentSlots:n,title:l||`Card ${o+1}`}},Ue=function(e,t){let o=e.matches("a,button")?[e]:Array.from(e.querySelectorAll("a,button"));if(!o.length){let i=e.cloneNode(!0);i.setAttribute("slot",t),i.toggleAttribute("data-compare-chart-slot",!0),s(this,r,Q).call(this,i),this.appendChild(i);return}for(let i of o){let c=i.cloneNode(!0);c.setAttribute("slot",t),c.toggleAttribute("data-compare-chart-slot",!0),s(this,r,Q).call(this,c),this.appendChild(c)}},Q=function(e){e.removeAttribute("style"),e.querySelectorAll("[style]").forEach(t=>t.removeAttribute("style"))},Fe=function(){m(this,_,[]),m(this,G,Se(this)),a(this,I).clear();let e=1;Array.from(this.querySelectorAll(":scope > div[name]")).forEach((t,o)=>{let i=t.getAttribute("name"),c=t.querySelector(":scope > h4")?.textContent.trim()??"",n=o+1,l={heading:c,groupIndex:n,groupKey:i,rows:[]};a(this,_).push(l);let d=new Map;t.querySelectorAll(":scope > p[name]").forEach(g=>{d.set(g.getAttribute("name"),g)}),d.forEach((g,f)=>{let b=`${i}@${f}`;e++,l.rows.push({slot:b,rowIndex:e}),a(this,I).set(b,{rowIndex:e,groupIndex:n})})}),a(this,G).forEach(t=>{let o=a(this,_).length+1,i={heading:t.label,groupIndex:o,groupKey:t.name,rows:[]};a(this,_).push(i),t.rows.forEach(c=>{let n=`${t.name}@${c.name}`;e++,i.rows.push({slot:n,rowIndex:e}),a(this,I).set(n,{rowIndex:e,groupIndex:o})})})},de=function(){let e=(this.expandedGroups??"").trim(),t=a(this,_).length;if(m(this,v,new Set),!e)t>0&&a(this,v).add(1);else if(e==="all")for(let o=1;o<=t;o+=1)a(this,v).add(o);else{if(e==="none")return;e.split(",").map(o=>parseInt(o.trim(),10)).filter(o=>!isNaN(o)&&o>=1&&o<=t).forEach(o=>a(this,v).add(o))}},Ge=function(){let e=a(this,_).length;return a(this,v).size?e&&a(this,v).size===e?"all":[...a(this,v)].sort((t,o)=>t-o).join(","):"none"},ze=function(){a(this,R).clear(),a(this,S).clear(),Array.from(this.querySelectorAll(":scope > div[name]")).forEach(e=>{let t=e.getAttribute("name"),o=new Map;e.querySelectorAll(":scope > p[name]").forEach(i=>{o.set(i.getAttribute("name"),i)}),o.forEach((i,c)=>{let n=`${t}@${c}`,l=i.cloneNode(!0),d=s(this,r,he).call(this,l);a(this,R).set(n,{labelHTML:l.innerHTML,title:d,tooltipPosition:i.getAttribute("data-tooltip-position")??"top-center",isItemRow:i.hasAttribute("item")})})}),Array.from(this.querySelectorAll(':scope > merch-card[slot="cards"]')).forEach(e=>{let t=e.dataset.cardId,o=parseInt(e.dataset.columnIndex,10),i=new Map;e.querySelectorAll(':scope > p[name], :scope > [slot="features"] p[name]').forEach(c=>{let n=c.getAttribute("name");!n||!n.includes("@")||i.set(n,c)});for(let[c,n]of i){if(!a(this,I).has(c))continue;let l=n.cloneNode(!0),d=l.textContent.includes("\u2705"),g=l.hasAttribute("primary");g&&l.classList.add("primary-cell"),d&&l.classList.add("emoji-primary-cell");let f=l.hasAttribute("item");f&&l.classList.add("item-cell");let b=s(this,r,he).call(this,l);s(this,r,me).call(this,l);let x=a(this,S).get(c)??[];x.push({cardId:t,col:o,isCellPrimary:g,isEmojiPrimary:d,isItem:f,title:b,tooltipPosition:l.getAttribute("data-tooltip-position")??"top-center",html:l.innerHTML,ariaLabel:l.getAttribute("aria-label")}),a(this,S).set(c,x)}});for(let e of a(this,G))e.rows.forEach(t=>{let o=`${e.name}@${t.name}`;a(this,R).set(o,{labelHTML:t.html,title:void 0,tooltipPosition:"top-center",isItemRow:!1});let i=t.cells.map((c,n)=>{let l=document.createElement("p");return l.innerHTML=c,s(this,r,me).call(this,l),{cardId:a(this,E)[n]?.dataset.cardId,col:n+1,isCellPrimary:!1,isEmojiPrimary:c.includes("\u2705"),isItem:!1,title:void 0,tooltipPosition:"top-center",html:l.innerHTML,ariaLabel:l.getAttribute("aria-label")}}).filter(c=>c.cardId);a(this,S).set(o,i)})},he=function(e){let t=e.querySelector(":scope > a.secondary-link[title]"),o=t?.getAttribute("title")||e.getAttribute("title")||void 0;return t?.remove(),o&&e.removeAttribute("title"),o},me=function(e){let t=e.querySelector(":scope > .compare-chart-chip");if(t){for(;t.firstChild;)e.insertBefore(t.firstChild,t);t.remove()}let o=e.textContent.trim();if(Et(o))e.setAttribute("aria-label",$(this,"included","Included")),s(this,r,J).call(this,e);else if(vt(o))e.setAttribute("aria-label",$(this,"not-included","Not included")),s(this,r,J).call(this,e);else if(At(o)){if(e.setAttribute("aria-label",$(this,"not-applicable","Not applicable")),!o){let i=document.createElement("span");i.className="empty-cell-sr",i.textContent=$(this,"empty-table-cell","Not applicable"),e.textContent="\u2014";let c=document.createElement("span");c.setAttribute("aria-hidden","true"),c.textContent="\u2014",e.replaceChildren(c,i)}}else e.removeAttribute("aria-label"),s(this,r,J).call(this,e);s(this,r,Ve).call(this,e)},Ve=function(e){if(e.classList.contains("item-cell"))return;let t=document.createElement("span");t.className="compare-chart-chip";let o=Array.from(e.childNodes);for(let i of o){if(i.nodeType===Node.ELEMENT_NODE&&i.tagName==="SMALL")break;t.appendChild(i)}e.insertBefore(t,e.firstChild)},J=function(e){let t=[...M.included,...M.excluded,...M.notApplicable],o=e.classList.contains("primary-cell");Array.from(e.childNodes).forEach(i=>{if(i.nodeType!==Node.TEXT_NODE)return;let c=i.textContent;if(!t.some(l=>c.includes(l)))return;let n=document.createDocumentFragment();for(let l of c)if(t.includes(l)){let d=document.createElement("span");d.setAttribute("aria-hidden","true"),d.classList.add("compare-chart-glyph"),d.textContent=l==="\u2705"?"\u2713":l,M.included.includes(l)&&d.classList.add("included"),M.excluded.includes(l)&&d.classList.add("excluded"),(o||l==="\u2705")&&d.classList.add("primary"),n.appendChild(d)}else n.appendChild(document.createTextNode(l));i.replaceWith(n)})},ue=function(){let e=this.getBoundingClientRect().width||this.offsetWidth||window.innerWidth,t=e>0&&e<xt,o=t!==a(this,k);m(this,k,t),this.toggleAttribute("data-mobile",t),t?s(this,r,fe).call(this):s(this,r,Be).call(this),s(this,r,xe).call(this),o&&this.requestUpdate()},wt=function(){return new Set(s(this,r,ee).call(this))},ee=function(){return!a(this,k)||a(this,E).length<=2?a(this,E).map(e=>e.dataset.cardId):[a(this,E)[a(this,w)],a(this,E)[a(this,C)]].filter(Boolean).map(e=>e.dataset.cardId)},ge=function(){return s(this,r,ee).call(this).map(e=>a(this,T).find(t=>t.cardId===e)).filter(Boolean)},fe=function(){this.style.setProperty("--compare-chart-cols",2),!(a(this,E).length<=2)&&s(this,r,Ye).call(this)},Ye=function(){let e=a(this,E).length;e<=2||(a(this,w)>=e&&m(this,w,0),a(this,C)>=e&&m(this,C,Math.min(1,e-1)),a(this,w)===a(this,C)&&m(this,C,(a(this,w)+1)%e))},Be=function(){this.style.setProperty("--compare-chart-cols",a(this,E).length)},qe=function(e,t){e==="A"?(t===a(this,C)&&m(this,C,a(this,w)),m(this,w,t)):(t===a(this,w)&&m(this,w,a(this,C)),m(this,C,t)),s(this,r,fe).call(this),this.requestUpdate()},xe=function(){if(a(this,k)){this.style.setProperty("--compare-chart-sticky-top","0px");return}},je=function(){return this.stickyOffset??this.getAttribute("sticky-offset")??this.stickyTop??this.getAttribute("sticky-top")},be=function(){let e=s(this,r,je).call(this),t=e!=null&&String(e).trim()!==""?/^\d+$/.test(String(e).trim())?`${String(e).trim()}px`:String(e).trim():`${bt}px`;this.style.setProperty("--compare-chart-sticky-offset",t)},Ke=function(){s(this,r,ye).call(this),s(this,r,xe).call(this),s(this,r,be).call(this),window.addEventListener("scroll",a(this,H),!0),window.addEventListener("resize",a(this,H)),s(this,r,te).call(this)},ye=function(){window.removeEventListener("scroll",a(this,H),!0),window.removeEventListener("resize",a(this,H)),a(this,N)&&(cancelAnimationFrame(a(this,N)),m(this,N,0))},te=function(){a(this,N)||m(this,N,requestAnimationFrame(()=>{m(this,N,0),s(this,r,We).call(this)}))},We=function(){let e=this.shadowRoot?.querySelector(".header-content");if(this.collapsed||!e){s(this,r,re).call(this,!1);return}let t=parseFloat(getComputedStyle(e).top)||0,o=this.getBoundingClientRect(),i=e.getBoundingClientRect(),c=a(this,B),n=i.height,l=a(this,k)?24:1,d=i.top<=t+1&&o.top<i.top-1,g=!c&&d&&o.bottom>t+n,f=c&&(o.top>t+l||o.bottom<=t+n);g?s(this,r,re).call(this,!0):f&&s(this,r,re).call(this,!1)},re=function(e){let t=this.shadowRoot?.querySelector(".header-content");if(e!==a(this,B)){if(e){let o=t?.getBoundingClientRect().height??0;this.style.setProperty("--compare-chart-sticky-spacer-height",`${o}px`)}else this.style.removeProperty("--compare-chart-sticky-spacer-height");m(this,B,e),this.toggleAttribute("data-sticky-header",e),t?.classList.toggle("sticky",e),t?.classList.toggle("is-stuck",e)}},Ze=function(e){let t=!1;a(this,v).has(e)?a(this,v).delete(e):(m(this,v,new Set([e])),t=!0),this.expandedGroups=s(this,r,Ge).call(this),this.dispatchEvent(new CustomEvent(we,{detail:{value:this.expandedGroups},bubbles:!0,composed:!0})),this.requestUpdate(),t&&this.updateComplete.then(()=>s(this,r,Xe).call(this,e))},Xe=function(e){if(this.collapsed)return;let t=this.shadowRoot?.querySelector(`.table-container[data-group-index="${String(e)}"]`);if(!t)return;let o=this.shadowRoot?.querySelector(".header-content"),i=getComputedStyle(this),c=parseFloat(i.getPropertyValue("--compare-chart-sticky-top"))||0,n=i.getPropertyValue("--compare-chart-sticky-offset").trim(),l=n&&parseFloat(n)||0,d=o?.getBoundingClientRect().height??0,g=c+l+d,f=t.style.scrollMarginTop;t.style.scrollMarginTop=`${g}px`,t.scrollIntoView({block:"start",behavior:"smooth"}),requestAnimationFrame(()=>{t.style.scrollMarginTop=f})},Qe=function(){let e=s(this,r,ge).call(this),t=s(this,r,Je).call(this,e),o=1;return A`
            ${s(this,r,U).call(this,e,"header",o++,t)}
            ${t.has("price")?s(this,r,U).call(this,e,"price",o++,t):y}
            ${t.has("description")?s(this,r,U).call(this,e,"description",o++,t):y}
            ${t.has("detail")?s(this,r,U).call(this,e,"detail",o++,t):y}
            ${t.has("cta")?s(this,r,U).call(this,e,"cta",o++,t):y}
        `},U=function(e,t,o,i){return A`
            <div
                class="header-leading header-leading-${t}"
                style="--row: ${o};"
            ></div>
            ${e.map((c,n)=>s(this,r,et).call(this,c,t,n+1,n,o,i))}
        `},Je=function(e){let t=new Set;for(let o of e)for(let i of o.presentSlots)t.add(i);return t},L=function(e,t,o){return o.has(t)?A`<slot name=${e.slots[t]}></slot>`:y},et=function(e,t,o,i,c,n){let l=["header-card-segment",`${t}-segment`],d=e.cellColor;return A`<div
            class=${l.join(" ")}
            data-card-id=${e.cardId}
            data-card-index=${e.col-1}
            data-cell-color=${d}
            style="--col: ${o}; --row: ${c};"
        >
            ${t==="header"?A`
                      ${s(this,r,L).call(this,e,"icons",n)}
                      ${s(this,r,L).call(this,e,"header",n)}
                      ${s(this,r,L).call(this,e,"badge",n)}
                      ${s(this,r,tt).call(this,e,i)}
                  `:y}
            ${t==="price"?s(this,r,L).call(this,e,"price",n):y}
            ${t==="description"?s(this,r,L).call(this,e,"description",n):y}
            ${t==="detail"?s(this,r,L).call(this,e,"detail",n):y}
            ${t==="cta"?s(this,r,L).call(this,e,"cta",n):y}
        </div>`},tt=function(e,t){if(!a(this,k)||a(this,T).length<=2)return y;let o=a(this,T).findIndex(n=>n.cardId===e.cardId),i=t===0?"A":"B",c=i==="A"?a(this,C):a(this,w);return A`<select
            class="mobile-filter-select"
            name="column-filter"
            aria-label=${$(this,"choose-table-column","Choose column")}
            .value=${String(o)}
            @change=${n=>s(this,r,qe).call(this,i,parseInt(n.target.value,10))}
        >
            ${a(this,T).map((n,l)=>l===c?y:A`<option
                    value=${l}
                    ?selected=${l===o}
                >
                    ${n.title}
                </option>`)}
        </select>`},rt=function(e){let t=a(this,v).has(e.groupIndex);return A`
            <div class="table-container" data-group-index=${e.groupIndex}>
                <button
                    class="table-column-header"
                    aria-expanded=${t}
                    aria-controls="g-${e.groupIndex}"
                    @click=${()=>s(this,r,Ze).call(this,e.groupIndex)}
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
                    ${ce(e.rows,(o,i)=>`${o.slot}:${i}`,o=>s(this,r,at).call(this,o))}
                </div>
            </div>
        `},ot=function(e,t){return{cardId:e,col:t,isCellPrimary:!1,isEmojiPrimary:!1,isItem:!1,title:void 0,tooltipPosition:"top-center",html:'<span class="compare-chart-chip"><span class="compare-chart-glyph" aria-hidden="true">\u2014</span></span>',ariaLabel:$(this,"not-applicable","Not applicable")}},at=function(e){let t=a(this,R).get(e.slot)??{},o=new Map((a(this,S).get(e.slot)??[]).map(l=>[l.cardId,l])),i=s(this,r,ee).call(this),c=i.map(l=>o.get(l)).filter(Boolean);!c.length&&i.length>0&&a(this,R).has(e.slot)&&(c=i.map(l=>{let d=a(this,E).find(f=>f.dataset.cardId===l),g=parseInt(d?.dataset.columnIndex??"1",10);return s(this,r,ot).call(this,l,g)}));let n=["table-row"];return t.isItemRow&&n.push("description-row"),A`
            <div class=${n.join(" ")} role="row">
                <div class="row-header" role="rowheader">
                    <span class="row-label"
                        >${ke(t.labelHTML??"")}</span
                    >
                    ${s(this,r,Ee).call(this,t.title,t.tooltipPosition)}
                </div>
                ${ce(c,(l,d)=>`${l.cardId}:${d}`,l=>s(this,r,it).call(this,l))}
            </div>
        `},it=function(e){let t=["cell"];return e.isCellPrimary&&t.push("primary-cell"),e.isEmojiPrimary&&t.push("emoji-primary-cell"),e.isItem&&t.push("item-cell"),A`<p
            role="cell"
            class=${t.join(" ")}
            data-card-id=${e.cardId}
            style="--col: ${e.col};"
            aria-label=${e.ariaLabel??y}
        >
            ${ke(e.html)}${s(this,r,Ee).call(this,e.title,e.tooltipPosition)}
        </p>`},Ee=function(e,t){return e?A`<span class="tooltip-wrapper" data-tooltip-position=${t||"top-center"}>
            <button class="tooltip-trigger" aria-label="More info" tabindex="0">
                <span aria-hidden="true">i</span>
            </button>
            <span class="tooltip-popover" role="tooltip">${e}</span>
        </span>`:y},oe(q,"properties",{expandedGroups:{type:String,attribute:"expanded-groups",reflect:!0},collapsed:{type:Boolean,attribute:"collapsed",reflect:!0},consonant:{type:Boolean,attribute:"consonant"},spectrum:{type:String,attribute:"spectrum"},stickyOffset:{type:String,attribute:"sticky-offset"},stickyTop:{type:String,attribute:"sticky-top"},placeholders:{type:Object}}),oe(q,"styles",Re);customElements.get(Ne)||customElements.define(Ne,q);export{q as MasCompareChart};
