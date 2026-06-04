var de=Object.defineProperty;var _t=p=>{throw TypeError(p)};var he=(p,m,t)=>m in p?de(p,m,{enumerable:!0,configurable:!0,writable:!0,value:t}):p[m]=t;var st=(p,m,t)=>he(p,typeof m!="symbol"?m+"":m,t),nt=(p,m,t)=>m.has(p)||_t("Cannot "+t);var i=(p,m,t)=>(nt(p,m,"read from private field"),t?t.call(p):m.get(p)),u=(p,m,t)=>m.has(p)?_t("Cannot add the same private member more than once"):m instanceof WeakSet?m.add(p):m.set(p,t),d=(p,m,t,e)=>(nt(p,m,"write to private field"),e?e.call(p,t):m.set(p,t),t),s=(p,m,t)=>(nt(p,m,"access private method"),t);import{html as A,LitElement as Ee,nothing as y}from"./lit-all.min.js";import{repeat as ht}from"./lit-all.min.js";import{unsafeHTML as Ot}from"./lit-all.min.js";var Le=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Me=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var me='span[is="inline-price"][data-wcs-osi]',ue='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var ge='a[is="upt-link"]',Oe=`${me},${ue},${ge}`;var ct="aem:load",lt="aem:error",pt="mas:ready";var dt="mas-compare-chart:rehydrate",kt="expanded-groups-change";var Pe=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Ie=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var fe=p=>String(p||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[/&]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-+|-+$/g,"")||"item",Nt=p=>Array.from(p.childNodes).map(m=>m.nodeType===Node.TEXT_NODE?m.textContent:m.nodeType===Node.ELEMENT_NODE?m.outerHTML:"").join("").replace(/\s+/g," ").trim(),xe=p=>{let m=p.querySelector("[aria-label]")?.getAttribute("aria-label")?.trim().toLowerCase();return m==="yes"?"\u2713":m==="no"?"\u2717":p.querySelector(".icon-checkmark-no-fill, .icon-checkmark")?"\u2713":p.querySelector(".icon-crossmark")?"\u2717":Nt(p)},St=p=>Nt(p).replace(/\s+/g," ").trim(),be=p=>(p.querySelector(".ctv2-th-header")?.textContent||p.textContent||"").replace(/:$/,"").replace(/\s+/g," ").trim(),Rt=(p,m)=>{let t=fe(p),e=t,o=2;for(;m.has(e);)e=`${t}-${o}`,o+=1;return m.add(e),e},Lt=p=>{let m=new Set;return Array.from(p.querySelectorAll(":scope > table")).map(t=>{let e=Array.from(t.querySelectorAll(":scope > thead > tr:first-child > th")),o=e[0],a=(o?.textContent||"").replace(/\s+/g," ").trim(),l=e.slice(1).map(h=>h.textContent.replace(/\s+/g," ").trim()),n=new Set,c=Array.from(t.querySelectorAll(":scope > tbody > tr")).map(h=>{let g=Array.from(h.children),x=g.find(f=>f.matches('th[scope="row"], th'))||g[0],b=be(x);return{name:Rt(b,n),html:St(x),cells:g.slice(g.indexOf(x)+1).map(xe)}});return{name:Rt(a,m),label:a,labelHtml:o?St(o):a,columns:l,rows:c}})};import{css as ye}from"./lit-all.min.js";var Mt=ye`
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
`;var Pt="mas-compare-chart",ve=3e4,tt=4,Ae=900,we=64,Ce=40,Te=["icons","header","badge","price","description","detail","cta"],M={included:["\u2713","\u2714","\u2705"],excluded:["\u2717","\u2718","\u2716","\xD7"],notApplicable:["\u2014","-"]},_e=p=>M.included.includes(p),ke=p=>M.excluded.includes(p),Se=p=>!p||M.notApplicable.includes(p)||/^-+$/.test(p),F,E,k,S,R,T,$,O,v,G,_,w,C,V,Y,N,P,I,q,H,D,j,K,W,Z,X,Q,r,mt,ut,gt,It,$t,Ht,Dt,Ut,Ft,Gt,B,Vt,Yt,zt,et,Bt,ft,qt,jt,xt,bt,Kt,rt,yt,Re,ot,Et,vt,Wt,Zt,Xt,At,Qt,Jt,it,at,wt,Ct,te,ee,re,oe,U,ie,L,ae,se,ne,ce,le,pe,Tt,z=class extends Ee{constructor(){super();u(this,r);u(this,F);u(this,E,[]);u(this,k,[]);u(this,S,new Map);u(this,R,new Map);u(this,T,[]);u(this,$,[]);u(this,O,new Map);u(this,v,new Set);u(this,G);u(this,_,!1);u(this,w,0);u(this,C,1);u(this,V,!1);u(this,Y,!1);u(this,N,0);u(this,P,null);u(this,I,null);u(this,q,!1);u(this,H,null);u(this,D,null);u(this,j,!1);u(this,K,!1);u(this,W,t=>{let e=t.target;if(e?.parentElement===this){s(this,r,Ft).call(this,t.detail,e);return}e?.closest?.("merch-card")?.parentElement===this&&s(this,r,mt).call(this)});u(this,Z,t=>{var e;t.target?.parentElement===this&&(d(this,T,[]),d(this,$,[]),d(this,k,[]),d(this,E,[]),i(this,S).clear(),i(this,R).clear(),i(this,O).clear(),d(this,v,new Set),this.requestUpdate(),(e=i(this,I))==null||e.call(this,!1),d(this,P,null),d(this,I,null))});u(this,X,()=>s(this,r,B).call(this));u(this,Q,t=>{t.target?.parentElement===this&&s(this,r,mt).call(this)});d(this,F,this.attachInternals?.()),i(this,F)&&(i(this,F).role="table")}connectedCallback(){super.connectedCallback(),this.addEventListener(dt,i(this,X)),this.addEventListener(ct,i(this,W)),this.addEventListener(lt,i(this,Z)),this.addEventListener(pt,i(this,Q)),d(this,G,new ResizeObserver(()=>s(this,r,yt).call(this))),i(this,G).observe(this),s(this,r,At).call(this),s(this,r,it).call(this)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(dt,i(this,X)),this.removeEventListener(ct,i(this,W)),this.removeEventListener(lt,i(this,Z)),this.removeEventListener(pt,i(this,Q)),i(this,G)?.disconnect(),i(this,N)&&(cancelAnimationFrame(i(this,N)),d(this,N,0)),s(this,r,wt).call(this)}firstUpdated(){s(this,r,B).call(this),s(this,r,at).call(this)}willUpdate(t){t.has("expandedGroups")&&s(this,r,ft).call(this)}updated(t){(t.has("consonant")||t.has("spectrum"))&&s(this,r,gt).call(this),(t.has("stickyOffset")||t.has("mobileStickyOffset")||t.has("stickyTop")||t.has("collapsed")||t.has("nonSticky"))&&(s(this,r,it).call(this),s(this,r,at).call(this))}checkReady(){if(!this.querySelector(":scope > aem-fragment"))return Promise.resolve(!0);s(this,r,ut).call(this);let e=new Promise(o=>setTimeout(()=>o(!1),ve));return Promise.race([i(this,P),e])}render(){return this.collapsed?y:A`
            <div
                class="sticky-sentinel sticky-sentinel-top"
                aria-hidden="true"
            ></div>
            <div class="sticky-header-spacer" aria-hidden="true"></div>
            <div class="header-content sticky-header">
                <div class="sticky-header-wrapper">
                    ${s(this,r,oe).call(this)}
                </div>
            </div>
            <slot name="cards" hidden></slot>
            <div
                class="accessibility-header-row"
                aria-hidden="false"
                role="row"
            >
                ${s(this,r,Et).call(this).map(t=>A`<span role="columnheader">${t.title}</span>`)}
            </div>
            ${ht(i(this,T),(t,e)=>`${t.groupIndex}:${e}`,t=>s(this,r,ne).call(this,t))}
            <div
                class="sticky-sentinel sticky-sentinel-bottom"
                aria-hidden="true"
            ></div>
        `}};F=new WeakMap,E=new WeakMap,k=new WeakMap,S=new WeakMap,R=new WeakMap,T=new WeakMap,$=new WeakMap,O=new WeakMap,v=new WeakMap,G=new WeakMap,_=new WeakMap,w=new WeakMap,C=new WeakMap,V=new WeakMap,Y=new WeakMap,N=new WeakMap,P=new WeakMap,I=new WeakMap,q=new WeakMap,H=new WeakMap,D=new WeakMap,j=new WeakMap,K=new WeakMap,W=new WeakMap,Z=new WeakMap,X=new WeakMap,Q=new WeakMap,r=new WeakSet,mt=function(){i(this,N)||d(this,N,requestAnimationFrame(()=>{d(this,N,0),s(this,r,B).call(this)}))},ut=function(){i(this,P)||d(this,P,new Promise(t=>{d(this,I,t)}))},gt=function(t=i(this,E)){t.forEach(e=>{e.consonant=this.consonant,e.toggleAttribute("consonant",!!this.consonant),this.spectrum?(e.spectrum=this.spectrum,e.setAttribute("spectrum",this.spectrum)):e.removeAttribute("spectrum")})},It=function(t,e){let o=t?.fields||{};if(Array.isArray(o)){let l=o.find(n=>n.name===e);return l?.multiple?l.values||[]:l?.values?.[0]||""}let a=o[e];return Array.isArray(a)?a[0]||"":a?.value??a??""},$t=function(t,e){let o=t?.fields||{};if(Array.isArray(o))return o.find(l=>l.name===e)?.values||[];let a=o[e];return Array.isArray(a)?a:a==null||a===""?[]:[a?.value??a]},Ht=function(t){let e=t?.references||{};return Array.isArray(e)?e.map(o=>({identifier:o.identifier||o.id||o.path,value:o.value||o})).filter(o=>o.value):Object.entries(e).map(([o,a])=>({identifier:o,value:a?.value||a})).filter(o=>o.value)},Dt=function(t){let e=s(this,r,Ht).call(this,t),o=n=>e.find(({identifier:c,value:h})=>c===n||h.id===n||h.path===n)?.value,a=s(this,r,$t).call(this,t,"cards").map(o).filter(Boolean);if(a.length)return a.slice(0,tt);let l=(t.referencesTree||[]).filter(n=>n.fieldName==="cards").map(n=>o(n.identifier)).filter(Boolean);return l.length?l.slice(0,tt):e.map(({value:n})=>n).filter(n=>n?.fields).slice(0,tt)},Ut=function(t){if(t?.getAttributeNames)for(let e of t.getAttributeNames()){let o=t.getAttribute(e);o==null?this.removeAttribute(e):this.setAttribute(e,o)}},Ft=async function(t,e){if(t&&!i(this,Y)){d(this,Y,!0);try{await s(this,r,Gt).call(this,t,e)}finally{d(this,Y,!1)}}},Gt=async function(t,e){var x;s(this,r,ut).call(this),this.querySelectorAll("[data-compare-chart-generated]").forEach(b=>b.remove());let o=new DOMParser,a=s(this,r,It).call(this,t,"compareChart"),l=o.parseFromString(a||"","text/html"),n=l.body.querySelector("mas-compare-chart")||l.body;s(this,r,Ut).call(this,n),n.querySelectorAll(":scope > div[name]").forEach(b=>{let f=b.cloneNode(!0);f.dataset.compareChartGenerated="true",this.append(f)});let c=e?.hasAttribute("author"),h=s(this,r,Dt).call(this,t),g=[];h.forEach(b=>{e?.cache?.add(b);let f=document.createElement("merch-card");f.setAttribute("slot","cards"),f.dataset.compareChartGenerated="true",s(this,r,gt).call(this,[f]);let J=document.createElement("aem-fragment");J.setAttribute("fragment",b.id),c&&J.setAttribute("author",""),J.setAttribute("loading","cache"),f.append(J),this.append(f),g.push(f)}),await Promise.all(g.map(b=>b.checkReady?.().catch(()=>!1))),s(this,r,B).call(this),(x=i(this,I))==null||x.call(this,!0),d(this,P,null),d(this,I,null)},B=function(){if(!i(this,V)){d(this,V,!0);try{s(this,r,Vt).call(this),s(this,r,Bt).call(this),s(this,r,ft).call(this),s(this,r,jt).call(this),s(this,r,yt).call(this),this.requestUpdate()}finally{d(this,V,!1)}}},Vt=function(){let t=Array.from(this.querySelectorAll(':scope > merch-card[slot="cards"]')).slice(0,tt);this.querySelectorAll(":scope > [data-compare-chart-slot]").forEach(o=>o.remove());let e=[];t.forEach((o,a)=>{let l=`card-${a+1}`;o.dataset.cardId=l,o.dataset.columnIndex=String(a+1),o.style.setProperty("--col",a+1);let n=o.getAttribute("cell-color")??"default";e.push(s(this,r,Yt).call(this,o,l,a,n))}),d(this,E,t),d(this,k,e),this.setAttribute("data-child-count",String(t.length)),this.style.setProperty("--compare-chart-cols",t.length)},Yt=function(t,e,o,a){let l={},n=new Set;for(let h of Te){let g=`${e}-${h}`;if(l[h]=g,!t)continue;let x=Array.from(t.querySelectorAll(`:scope > [slot="${h}"]`));x.length&&n.add(h);for(let b of x){if(h==="cta"){s(this,r,zt).call(this,b,g);continue}let f=b.cloneNode(!0);f.setAttribute("slot",g),f.toggleAttribute("data-compare-chart-slot",!0),s(this,r,et).call(this,f),this.appendChild(f)}}t&&(t.hidden=!0,t.setAttribute("aria-hidden","true"),t.dataset.cellColor=a);let c=Array.from(this.querySelectorAll(`:scope > [slot="${l.header}"]`)).map(h=>h.textContent.trim()).filter(Boolean).join(" ");return{cardId:e,col:o+1,cellColor:a,slots:l,presentSlots:n,title:c||`Card ${o+1}`}},zt=function(t,e){let o=t.matches("a,button")?[t]:Array.from(t.querySelectorAll("a,button"));if(!o.length){let a=t.cloneNode(!0);a.setAttribute("slot",e),a.toggleAttribute("data-compare-chart-slot",!0),s(this,r,et).call(this,a),this.appendChild(a);return}for(let a of o){let l=a.cloneNode(!0);l.setAttribute("slot",e),l.toggleAttribute("data-compare-chart-slot",!0),s(this,r,et).call(this,l),this.appendChild(l)}},et=function(t){t.removeAttribute("style"),t.querySelectorAll("[style]").forEach(e=>e.removeAttribute("style"))},Bt=function(){d(this,T,[]),d(this,$,Lt(this)),i(this,O).clear();let t=1;Array.from(this.querySelectorAll(":scope > div[name]")).forEach((e,o)=>{let a=e.getAttribute("name"),l=e.querySelector(":scope > h4")?.textContent.trim()??"",n=o+1,c={heading:l,groupIndex:n,groupKey:a,rows:[]};i(this,T).push(c);let h=new Map;e.querySelectorAll(":scope > p[name]").forEach(g=>{h.set(g.getAttribute("name"),g)}),h.forEach((g,x)=>{let b=`${a}@${x}`;t++,c.rows.push({slot:b,rowIndex:t}),i(this,O).set(b,{rowIndex:t,groupIndex:n})})}),i(this,$).forEach(e=>{let o=i(this,T).length+1,a={heading:e.label,groupIndex:o,groupKey:e.name,rows:[]};i(this,T).push(a),e.rows.forEach(l=>{let n=`${e.name}@${l.name}`;t++,a.rows.push({slot:n,rowIndex:t}),i(this,O).set(n,{rowIndex:t,groupIndex:o})})})},ft=function(){let t=(this.expandedGroups??"").trim(),e=i(this,T).length;if(d(this,v,new Set),!t)e>0&&i(this,v).add(1);else if(t==="all")for(let o=1;o<=e;o+=1)i(this,v).add(o);else{if(t==="none")return;t.split(",").map(o=>parseInt(o.trim(),10)).filter(o=>!isNaN(o)&&o>=1&&o<=e).forEach(o=>i(this,v).add(o))}},qt=function(){let t=i(this,T).length;return i(this,v).size?t&&i(this,v).size===t?"all":[...i(this,v)].sort((e,o)=>e-o).join(","):"none"},jt=function(){i(this,R).clear(),i(this,S).clear(),Array.from(this.querySelectorAll(":scope > div[name]")).forEach(t=>{let e=t.getAttribute("name"),o=new Map;t.querySelectorAll(":scope > p[name]").forEach(a=>{o.set(a.getAttribute("name"),a)}),o.forEach((a,l)=>{let n=`${e}@${l}`,c=a.cloneNode(!0),h=s(this,r,xt).call(this,c);i(this,R).set(n,{labelHTML:c.innerHTML,title:h,tooltipPosition:a.getAttribute("data-tooltip-position")??"top-center",isItemRow:a.hasAttribute("item")})})}),Array.from(this.querySelectorAll(':scope > merch-card[slot="cards"]')).forEach(t=>{let e=t.dataset.cardId,o=parseInt(t.dataset.columnIndex,10),a=new Map;t.querySelectorAll(':scope > p[name], :scope > [slot="features"] p[name]').forEach(l=>{let n=l.getAttribute("name");!n||!n.includes("@")||a.set(n,l)});for(let[l,n]of a){if(!i(this,O).has(l))continue;let c=n.cloneNode(!0),h=c.textContent.includes("\u2705"),g=c.hasAttribute("primary");g&&c.classList.add("primary-cell"),h&&c.classList.add("emoji-primary-cell");let x=c.hasAttribute("item");x&&c.classList.add("item-cell");let b=s(this,r,xt).call(this,c);s(this,r,bt).call(this,c);let f=i(this,S).get(l)??[];f.push({cardId:e,col:o,isCellPrimary:g,isEmojiPrimary:h,isItem:x,title:b,tooltipPosition:c.getAttribute("data-tooltip-position")??"top-center",html:c.innerHTML,ariaLabel:c.getAttribute("aria-label")}),i(this,S).set(l,f)}});for(let t of i(this,$))t.rows.forEach(e=>{let o=`${t.name}@${e.name}`;i(this,R).set(o,{labelHTML:e.html,title:void 0,tooltipPosition:"top-center",isItemRow:!1});let a=e.cells.map((l,n)=>{let c=document.createElement("p");return c.innerHTML=l,s(this,r,bt).call(this,c),{cardId:i(this,E)[n]?.dataset.cardId,col:n+1,isCellPrimary:!1,isEmojiPrimary:l.includes("\u2705"),isItem:!1,title:void 0,tooltipPosition:"top-center",html:c.innerHTML,ariaLabel:c.getAttribute("aria-label")}}).filter(l=>l.cardId);i(this,S).set(o,a)})},xt=function(t){let e=t.querySelector(":scope > a.secondary-link[title]"),o=e?.getAttribute("title")||t.getAttribute("title")||void 0;return e?.remove(),o&&t.removeAttribute("title"),o},bt=function(t){let e=t.textContent.trim();if(_e(e))t.setAttribute("aria-label",this.getAttribute("included-text")??"Included"),s(this,r,rt).call(this,t);else if(ke(e))t.setAttribute("aria-label",this.getAttribute("not-included-text")??"Not included"),s(this,r,rt).call(this,t);else if(Se(e)){if(t.setAttribute("aria-label",this.getAttribute("not-applicable-text")??"Not applicable"),!e){let o=document.createElement("span");o.className="empty-cell-sr",o.textContent=this.getAttribute("sr-only-not-applicable-text")??this.getAttribute("not-applicable-text")??"Not applicable",t.textContent="\u2014";let a=document.createElement("span");a.setAttribute("aria-hidden","true"),a.textContent="\u2014",t.replaceChildren(a,o)}}else t.removeAttribute("aria-label"),s(this,r,rt).call(this,t);s(this,r,Kt).call(this,t)},Kt=function(t){if(t.classList.contains("item-cell"))return;let e=document.createElement("span");e.className="compare-chart-chip";let o=Array.from(t.childNodes);for(let a of o){if(a.nodeType===Node.ELEMENT_NODE&&a.tagName==="SMALL")break;e.appendChild(a)}t.insertBefore(e,t.firstChild)},rt=function(t){let e=[...M.included,...M.excluded,...M.notApplicable],o=t.classList.contains("primary-cell");Array.from(t.childNodes).forEach(a=>{if(a.nodeType!==Node.TEXT_NODE)return;let l=a.textContent;if(!e.some(c=>l.includes(c)))return;let n=document.createDocumentFragment();for(let c of l)if(e.includes(c)){let h=document.createElement("span");h.setAttribute("aria-hidden","true"),h.classList.add("compare-chart-glyph"),h.textContent=c==="\u2705"?"\u2713":c,M.included.includes(c)&&h.classList.add("included"),M.excluded.includes(c)&&h.classList.add("excluded"),(o||c==="\u2705")&&h.classList.add("primary"),n.appendChild(h)}else n.appendChild(document.createTextNode(c));a.replaceWith(n)})},yt=function(){let t=this.getBoundingClientRect().width||this.offsetWidth||window.innerWidth,e=t>0&&t<Ae,o=e!==i(this,_);d(this,_,e),this.toggleAttribute("data-mobile",e),e?s(this,r,vt).call(this):s(this,r,Zt).call(this),s(this,r,At).call(this),s(this,r,it).call(this),s(this,r,at).call(this),o&&this.requestUpdate()},Re=function(){return new Set(s(this,r,ot).call(this))},ot=function(){return!i(this,_)||i(this,E).length<=2?i(this,E).map(t=>t.dataset.cardId):[i(this,E)[i(this,w)],i(this,E)[i(this,C)]].filter(Boolean).map(t=>t.dataset.cardId)},Et=function(){return s(this,r,ot).call(this).map(t=>i(this,k).find(e=>e.cardId===t)).filter(Boolean)},vt=function(){this.style.setProperty("--compare-chart-cols",2),!(i(this,E).length<=2)&&s(this,r,Wt).call(this)},Wt=function(){let t=i(this,E).length;t<=2||(i(this,w)>=t&&d(this,w,0),i(this,C)>=t&&d(this,C,Math.min(1,t-1)),i(this,w)===i(this,C)&&d(this,C,(i(this,w)+1)%t))},Zt=function(){this.style.setProperty("--compare-chart-cols",i(this,E).length)},Xt=function(t,e){t==="A"?(e===i(this,C)&&d(this,C,i(this,w)),d(this,w,e)):(e===i(this,w)&&d(this,w,i(this,C)),d(this,C,e)),s(this,r,vt).call(this),this.requestUpdate()},At=function(){if(i(this,_)){this.style.setProperty("--compare-chart-sticky-top","0px");return}},Qt=function(){return this.stickyOffset??this.getAttribute("sticky-offset")??this.stickyTop??this.getAttribute("sticky-top")},Jt=function(){return this.mobileStickyOffset??this.getAttribute("mobile-sticky-offset")},it=function(){let t=i(this,_)?s(this,r,Jt).call(this):s(this,r,Qt).call(this),e=i(this,_)?Ce:we,o=t!=null?String(t).trim():"",a=o?/^\d+$/.test(o)?`${o}px`:o:`${e}px`;this.style.setProperty("--compare-chart-sticky-offset",a)},at=function(){if(s(this,r,wt).call(this),this.nonSticky||this.collapsed||!this.isConnected)return;let t=this.shadowRoot,e=t?.querySelector(".header-content"),o=t?.querySelector(".sticky-sentinel-top"),a=t?.querySelector(".sticky-sentinel-bottom");if(!e||!o||!a)return;let l=parseFloat(getComputedStyle(e).top)||0,n=e.getBoundingClientRect().height;d(this,H,new IntersectionObserver(([c])=>{d(this,j,c.boundingClientRect.bottom<=l),s(this,r,Ct).call(this)},{threshold:[0],rootMargin:`${-l}px 0px 0px 0px`})),i(this,H).observe(o),d(this,D,new IntersectionObserver(([c])=>{d(this,K,c.boundingClientRect.top>l+n),s(this,r,Ct).call(this)},{threshold:[0],rootMargin:`${-(l+n)}px 0px 0px 0px`})),i(this,D).observe(a)},wt=function(){i(this,H)?.disconnect(),i(this,D)?.disconnect(),d(this,H,null),d(this,D,null)},Ct=function(){s(this,r,te).call(this,i(this,j)&&i(this,K))},te=function(t){let e=this.shadowRoot?.querySelector(".header-content");if(t!==i(this,q)){if(t){let o=e?.getBoundingClientRect().height??0;this.style.setProperty("--compare-chart-sticky-spacer-height",`${o}px`)}else this.style.removeProperty("--compare-chart-sticky-spacer-height");d(this,q,t),this.toggleAttribute("data-sticky-header",t),e?.classList.toggle("sticky",t),e?.classList.toggle("is-stuck",t)}},ee=function(t){let e=!1;i(this,v).has(t)?i(this,v).delete(t):(d(this,v,new Set([t])),e=!0),this.expandedGroups=s(this,r,qt).call(this),this.dispatchEvent(new CustomEvent(kt,{detail:{value:this.expandedGroups},bubbles:!0,composed:!0})),this.requestUpdate(),e&&this.updateComplete.then(()=>s(this,r,re).call(this,t))},re=function(t){if(this.collapsed)return;let e=this.shadowRoot?.querySelector(`.table-container[data-group-index="${String(t)}"]`);if(!e)return;let o=this.shadowRoot?.querySelector(".header-content"),a=getComputedStyle(this),l=parseFloat(a.getPropertyValue("--compare-chart-sticky-top"))||0,n=a.getPropertyValue("--compare-chart-sticky-offset").trim(),c=n&&parseFloat(n)||0,h=o?.getBoundingClientRect().height??0,g=l+c+h,x=e.style.scrollMarginTop;e.style.scrollMarginTop=`${g}px`,e.scrollIntoView({block:"start",behavior:"smooth"}),requestAnimationFrame(()=>{e.style.scrollMarginTop=x})},oe=function(){let t=s(this,r,Et).call(this),e=s(this,r,ie).call(this,t),o=1;return A`
            ${s(this,r,U).call(this,t,"header",o++,e)}
            ${e.has("price")?s(this,r,U).call(this,t,"price",o++,e):y}
            ${e.has("description")?s(this,r,U).call(this,t,"description",o++,e):y}
            ${e.has("detail")?s(this,r,U).call(this,t,"detail",o++,e):y}
            ${e.has("cta")?s(this,r,U).call(this,t,"cta",o++,e):y}
        `},U=function(t,e,o,a){return A`
            <div
                class="header-leading header-leading-${e}"
                style="--row: ${o};"
            ></div>
            ${t.map((l,n)=>s(this,r,ae).call(this,l,e,n+1,n,o,a))}
        `},ie=function(t){let e=new Set;for(let o of t)for(let a of o.presentSlots)e.add(a);return e},L=function(t,e,o){return o.has(e)?A`<slot name=${t.slots[e]}></slot>`:y},ae=function(t,e,o,a,l,n){let c=["header-card-segment",`${e}-segment`],h=t.cellColor;return A`<div
            class=${c.join(" ")}
            data-card-id=${t.cardId}
            data-card-index=${t.col-1}
            data-cell-color=${h}
            style="--col: ${o}; --row: ${l};"
        >
            ${e==="header"?A`
                      ${s(this,r,L).call(this,t,"icons",n)}
                      ${s(this,r,L).call(this,t,"header",n)}
                      ${s(this,r,L).call(this,t,"badge",n)}
                      ${s(this,r,se).call(this,t,a)}
                  `:y}
            ${e==="price"?s(this,r,L).call(this,t,"price",n):y}
            ${e==="description"?s(this,r,L).call(this,t,"description",n):y}
            ${e==="detail"?s(this,r,L).call(this,t,"detail",n):y}
            ${e==="cta"?s(this,r,L).call(this,t,"cta",n):y}
        </div>`},se=function(t,e){if(!i(this,_)||i(this,k).length<=2)return y;let o=i(this,k).findIndex(n=>n.cardId===t.cardId),a=e===0?"A":"B",l=a==="A"?i(this,C):i(this,w);return A`<select
            class="mobile-filter-select"
            name="column-filter"
            aria-label=${this.getAttribute("choose-table-column-text")??"Choose column"}
            .value=${String(o)}
            @change=${n=>s(this,r,Xt).call(this,a,parseInt(n.target.value,10))}
        >
            ${i(this,k).map((n,c)=>c===l?y:A`<option
                    value=${c}
                    ?selected=${c===o}
                >
                    ${n.title}
                </option>`)}
        </select>`},ne=function(t){let e=i(this,v).has(t.groupIndex);return A`
            <div class="table-container" data-group-index=${t.groupIndex}>
                <button
                    class="table-column-header"
                    aria-expanded=${e}
                    aria-controls="g-${t.groupIndex}"
                    @click=${()=>s(this,r,ee).call(this,t.groupIndex)}
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
                    ${ht(t.rows,(o,a)=>`${o.slot}:${a}`,o=>s(this,r,le).call(this,o))}
                </div>
            </div>
        `},ce=function(t,e){return{cardId:t,col:e,isCellPrimary:!1,isEmojiPrimary:!1,isItem:!1,title:void 0,tooltipPosition:"top-center",html:'<span class="compare-chart-chip"><span class="compare-chart-glyph" aria-hidden="true">\u2014</span></span>',ariaLabel:this.getAttribute("not-applicable-text")??"Not applicable"}},le=function(t){let e=i(this,R).get(t.slot)??{},o=new Map((i(this,S).get(t.slot)??[]).map(c=>[c.cardId,c])),a=s(this,r,ot).call(this),l=a.map(c=>o.get(c)).filter(Boolean);!l.length&&a.length>0&&i(this,R).has(t.slot)&&(l=a.map(c=>{let h=i(this,E).find(x=>x.dataset.cardId===c),g=parseInt(h?.dataset.columnIndex??"1",10);return s(this,r,ce).call(this,c,g)}));let n=["table-row"];return e.isItemRow&&n.push("description-row"),A`
            <div class=${n.join(" ")} role="row">
                <div class="row-header" role="rowheader">
                    <span class="row-label"
                        >${Ot(e.labelHTML??"")}</span
                    >
                    ${s(this,r,Tt).call(this,e.title,e.tooltipPosition)}
                </div>
                ${ht(l,(c,h)=>`${c.cardId}:${h}`,c=>s(this,r,pe).call(this,c))}
            </div>
        `},pe=function(t){let e=["cell"];return t.isCellPrimary&&e.push("primary-cell"),t.isEmojiPrimary&&e.push("emoji-primary-cell"),t.isItem&&e.push("item-cell"),A`<p
            role="cell"
            class=${e.join(" ")}
            data-card-id=${t.cardId}
            style="--col: ${t.col};"
            aria-label=${t.ariaLabel??y}
        >
            ${Ot(t.html)}${s(this,r,Tt).call(this,t.title,t.tooltipPosition)}
        </p>`},Tt=function(t,e){return t?A`<span class="tooltip-wrapper" data-tooltip-position=${e||"top-center"}>
            <button class="tooltip-trigger" aria-label="More info" tabindex="0">
                <span aria-hidden="true">i</span>
            </button>
            <span class="tooltip-popover" role="tooltip">${t}</span>
        </span>`:y},st(z,"properties",{expandedGroups:{type:String,attribute:"expanded-groups",reflect:!0},collapsed:{type:Boolean,attribute:"collapsed",reflect:!0},consonant:{type:Boolean,attribute:"consonant"},spectrum:{type:String,attribute:"spectrum"},stickyOffset:{type:String,attribute:"sticky-offset"},mobileStickyOffset:{type:String,attribute:"mobile-sticky-offset"},stickyTop:{type:String,attribute:"sticky-top"},nonSticky:{type:Boolean,attribute:"non-sticky"}}),st(z,"styles",Mt);customElements.get(Pt)||customElements.define(Pt,z);export{z as MasCompareChart};
