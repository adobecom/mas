var Je=Object.defineProperty;var be=p=>{throw TypeError(p)};var et=(p,d,e)=>d in p?Je(p,d,{enumerable:!0,configurable:!0,writable:!0,value:e}):p[d]=e;var te=(p,d,e)=>et(p,typeof d!="symbol"?d+"":d,e),re=(p,d,e)=>d.has(p)||be("Cannot "+e);var a=(p,d,e)=>(re(p,d,"read from private field"),e?e.call(p):d.get(p)),u=(p,d,e)=>d.has(p)?be("Cannot add the same private member more than once"):d instanceof WeakSet?d.add(p):d.set(p,e),m=(p,d,e,t)=>(re(p,d,"write to private field"),t?t.call(p,e):d.set(p,e),e),s=(p,d,e)=>(re(p,d,"access private method"),e);import{html as A,LitElement as lt,nothing as y}from"./lit-all.min.js";import{unsafeHTML as Ce}from"./lit-all.min.js";var xt=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),bt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var tt='span[is="inline-price"][data-wcs-osi]',rt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var ot='a[is="upt-link"]',yt=`${tt},${rt},${ot}`;var oe="aem:load",ae="aem:error",ie="mas:ready";var Et=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var vt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var at=p=>String(p||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\//g,"").replace(/[^a-z0-9&]+/g,"-").replace(/&/g,"").replace(/^-+|-+$/g,"")||"item",ve=p=>Array.from(p.childNodes).map(d=>d.nodeType===Node.TEXT_NODE?d.textContent:d.nodeType===Node.ELEMENT_NODE?d.outerHTML:"").join("").replace(/\s+/g," ").trim(),it=p=>{let d=p.querySelector("[aria-label]")?.getAttribute("aria-label")?.trim().toLowerCase();return d==="yes"?"\u2713":d==="no"?"\u2717":p.querySelector(".icon-checkmark-no-fill, .icon-checkmark")?"\u2713":p.querySelector(".icon-crossmark")?"\u2717":ve(p)},ye=p=>ve(p).replace(/\s+/g," ").trim(),st=p=>(p.querySelector(".ctv2-th-header")?.textContent||p.textContent||"").replace(/:$/,"").replace(/\s+/g," ").trim(),Ee=(p,d)=>{let e=at(p),t=e,o=2;for(;d.has(t);)t=`${e}-${o}`,o+=1;return d.add(t),t},Ae=p=>{let d=new Set;return Array.from(p.querySelectorAll(":scope > table")).map(e=>{let t=Array.from(e.querySelectorAll(":scope > thead > tr:first-child > th")),o=t[0],i=(o?.textContent||"").replace(/\s+/g," ").trim(),l=t.slice(1).map(h=>h.textContent.replace(/\s+/g," ").trim()),n=new Set,c=Array.from(e.querySelectorAll(":scope > tbody > tr")).map(h=>{let g=Array.from(h.children),f=g.find(x=>x.matches('th[scope="row"], th'))||g[0],b=st(f);return{name:Ee(b,n),html:ye(f),cells:g.slice(g.indexOf(f)+1).map(it)}});return{name:Ee(i,d),label:i,labelHtml:o?ye(o):i,columns:l,rows:c}})};import{css as nt}from"./lit-all.min.js";var we=nt`
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
                var(--compare-chart-sticky-gap, 0px)
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
        text-decoration-line: underline;
        text-decoration-style: solid;
        text-decoration-skip-ink: auto;
        text-decoration-thickness: auto;
        text-underline-offset: auto;
        text-underline-position: from-font;
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
        .sticky-header-wrapper {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            justify-content: space-between;
        }
        .sticky-header.is-stuck {
            position: fixed;
            inset-inline: 0;
            width: auto;
            margin-inline: 0;
            top: 0;
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
        .sticky-header-wrapper {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            max-width: calc(100% - 160px);
        }
        .sticky-header.is-stuck {
            position: fixed;
            inset-inline: 0;
            width: auto;
            margin-inline: 0;
            top: 0;
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
`;var Te="mas-compare-chart",ct=3e4,Z=4,pt=900,dt=["icons","header","badge","price","description","detail","cta"],M={included:["\u2713","\u2714","\u2705"],excluded:["\u2717","\u2718","\u2716","\xD7"],notApplicable:["\u2014","-"]},ht=p=>M.included.includes(p),mt=p=>M.excluded.includes(p),ut=p=>!p||M.notApplicable.includes(p)||/^-+$/.test(p),D=(p,d,e)=>p.placeholders?.[d]??e,z,E,_,S,R,T,G,H,v,Y,k,w,C,V,I,P,F,N,$,q,j,K,r,se,ne,_e,Se,Re,ke,Ne,O,Le,Me,Ie,X,Pe,le,Oe,He,ce,pe,$e,Q,de,gt,J,he,me,De,Ue,ze,ue,Ge,ge,fe,Ye,ee,Ve,Fe,Be,U,qe,L,je,Ke,We,Ze,Xe,Qe,xe,B=class extends lt{constructor(){super();u(this,r);u(this,z);u(this,E,[]);u(this,_,[]);u(this,S,new Map);u(this,R,new Map);u(this,T,[]);u(this,G,[]);u(this,H,new Map);u(this,v,new Set);u(this,Y);u(this,k,!1);u(this,w,0);u(this,C,1);u(this,V,!1);u(this,I,null);u(this,P,null);u(this,F,!1);u(this,N,0);u(this,$,()=>s(this,r,fe).call(this));u(this,q,e=>{let t=e.target;if(t?.parentElement===this){s(this,r,Ne).call(this,e.detail,t);return}t?.closest?.("merch-card")?.parentElement===this&&s(this,r,O).call(this)});u(this,j,e=>{var t;e.target?.parentElement===this&&(m(this,T,[]),m(this,_,[]),m(this,E,[]),a(this,S).clear(),a(this,R).clear(),this.requestUpdate(),(t=a(this,P))==null||t.call(this,!1),m(this,I,null),m(this,P,null))});u(this,K,e=>{e.target?.parentElement===this&&s(this,r,O).call(this)});m(this,z,this.attachInternals?.()),a(this,z)&&(a(this,z).role="table")}connectedCallback(){super.connectedCallback(),this.addEventListener("mas-compare-chart:rehydrate",()=>s(this,r,O).call(this)),this.addEventListener(oe,a(this,q)),this.addEventListener(ae,a(this,j)),this.addEventListener(ie,a(this,K)),m(this,Y,new ResizeObserver(()=>s(this,r,de).call(this))),a(this,Y).observe(this)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(oe,a(this,q)),this.removeEventListener(ae,a(this,j)),this.removeEventListener(ie,a(this,K)),a(this,Y)?.disconnect(),s(this,r,ge).call(this)}firstUpdated(){s(this,r,O).call(this),s(this,r,Ge).call(this)}updated(e){e.has("expandedGroups")&&s(this,r,le).call(this),(e.has("consonant")||e.has("spectrum"))&&s(this,r,ne).call(this)}checkReady(){if(!this.querySelector(":scope > aem-fragment"))return Promise.resolve(!0);s(this,r,se).call(this);let t=new Promise(o=>setTimeout(()=>o(!1),ct));return Promise.race([a(this,I),t])}render(){return this.collapsed?y:A`
            <div class="sticky-header-spacer" aria-hidden="true"></div>
            <div class="header-content sticky-header">
                <div class="sticky-header-wrapper">
                    ${s(this,r,Be).call(this)}
                </div>
            </div>
            <slot name="cards" hidden></slot>
            <div
                class="accessibility-header-row"
                aria-hidden="false"
                role="row"
            >
                ${s(this,r,he).call(this).map(e=>A`<span role="columnheader">${e.title}</span>`)}
            </div>
            ${a(this,T).map(e=>s(this,r,We).call(this,e))}
        `}};z=new WeakMap,E=new WeakMap,_=new WeakMap,S=new WeakMap,R=new WeakMap,T=new WeakMap,G=new WeakMap,H=new WeakMap,v=new WeakMap,Y=new WeakMap,k=new WeakMap,w=new WeakMap,C=new WeakMap,V=new WeakMap,I=new WeakMap,P=new WeakMap,F=new WeakMap,N=new WeakMap,$=new WeakMap,q=new WeakMap,j=new WeakMap,K=new WeakMap,r=new WeakSet,se=function(){a(this,I)||m(this,I,new Promise(e=>{m(this,P,e)}))},ne=function(e=a(this,E)){e.forEach(t=>{t.consonant=this.consonant,t.toggleAttribute("consonant",!!this.consonant),this.spectrum?(t.spectrum=this.spectrum,t.setAttribute("spectrum",this.spectrum)):t.removeAttribute("spectrum")})},_e=function(e,t){let o=e?.fields||{};if(Array.isArray(o)){let l=o.find(n=>n.name===t);return l?.multiple?l.values||[]:l?.values?.[0]||""}let i=o[t];return Array.isArray(i)?i[0]||"":i?.value??i??""},Se=function(e,t){let o=e?.fields||{};if(Array.isArray(o))return o.find(l=>l.name===t)?.values||[];let i=o[t];return Array.isArray(i)?i:i==null||i===""?[]:[i?.value??i]},Re=function(e){let t=e?.references||{};return Array.isArray(t)?t.map(o=>({identifier:o.identifier||o.id||o.path,value:o.value||o})).filter(o=>o.value):Object.entries(t).map(([o,i])=>({identifier:o,value:i?.value||i})).filter(o=>o.value)},ke=function(e){let t=s(this,r,Re).call(this,e),o=n=>t.find(({identifier:c,value:h})=>c===n||h.id===n||h.path===n)?.value,i=s(this,r,Se).call(this,e,"cards").map(o).filter(Boolean);if(i.length)return i.slice(0,Z);let l=(e.referencesTree||[]).filter(n=>n.fieldName==="cards").map(n=>o(n.identifier)).filter(Boolean);return l.length?l.slice(0,Z):t.map(({value:n})=>n).filter(n=>n?.fields).slice(0,Z)},Ne=async function(e,t){var f;if(!e)return;s(this,r,se).call(this),this.querySelectorAll("[data-compare-chart-generated]").forEach(b=>b.remove());let o=new DOMParser,i=s(this,r,_e).call(this,e,"compareChart"),l=o.parseFromString(i||"","text/html"),n=l.body.querySelector("mas-compare-chart")||l.body;n.hasAttribute?.("expanded-groups")&&(this.expandedGroups=n.getAttribute("expanded-groups")),n.querySelectorAll(":scope > div[name]").forEach(b=>{let x=b.cloneNode(!0);x.dataset.compareChartGenerated="true",this.append(x)});let c=t?.hasAttribute("author"),h=s(this,r,ke).call(this,e),g=[];h.forEach(b=>{t?.cache?.add(b);let x=document.createElement("merch-card");x.setAttribute("slot","cards"),x.dataset.compareChartGenerated="true",s(this,r,ne).call(this,[x]);let W=document.createElement("aem-fragment");W.setAttribute("fragment",b.id),c&&W.setAttribute("author",""),W.setAttribute("loading","cache"),x.append(W),this.append(x),g.push(x)}),s(this,r,O).call(this),await Promise.all(g.map(b=>b.checkReady?.().catch(()=>!1))),s(this,r,O).call(this),(f=a(this,P))==null||f.call(this,!0),m(this,I,null),m(this,P,null)},O=function(){if(!a(this,V)){m(this,V,!0);try{s(this,r,Le).call(this),s(this,r,Pe).call(this),s(this,r,le).call(this),s(this,r,He).call(this),s(this,r,de).call(this),this.requestUpdate()}finally{m(this,V,!1)}}},Le=function(){let e=Array.from(this.querySelectorAll(':scope > merch-card[slot="cards"]')).slice(0,Z);this.querySelectorAll(":scope > [data-compare-chart-slot]").forEach(o=>o.remove());let t=[];e.forEach((o,i)=>{let l=`card-${i+1}`;o.dataset.cardId=l,o.dataset.columnIndex=String(i+1),o.style.setProperty("--col",i+1);let n=o.getAttribute("cell-color")??"default";t.push(s(this,r,Me).call(this,o,l,i,n))}),m(this,E,e),m(this,_,t),this.setAttribute("data-child-count",String(e.length)),this.style.setProperty("--compare-chart-cols",e.length)},Me=function(e,t,o,i){let l={},n=new Set;for(let h of dt){let g=`${t}-${h}`;if(l[h]=g,!e)continue;let f=Array.from(e.querySelectorAll(`:scope > [slot="${h}"]`));f.length&&n.add(h);for(let b of f){if(h==="cta"){s(this,r,Ie).call(this,b,g);continue}let x=b.cloneNode(!0);x.setAttribute("slot",g),x.toggleAttribute("data-compare-chart-slot",!0),s(this,r,X).call(this,x),this.appendChild(x)}}e&&(e.hidden=!0,e.setAttribute("aria-hidden","true"),e.dataset.cardId=t,e.dataset.columnIndex=String(o+1),e.dataset.cellColor=i);let c=Array.from(this.querySelectorAll(`:scope > [slot="${l.header}"]`)).map(h=>h.textContent.trim()).filter(Boolean).join(" ");return{cardId:t,col:o+1,cellColor:i,slots:l,presentSlots:n,title:c||`Card ${o+1}`}},Ie=function(e,t){let o=e.matches("a,button")?[e]:Array.from(e.querySelectorAll("a,button"));if(!o.length){let i=e.cloneNode(!0);i.setAttribute("slot",t),i.toggleAttribute("data-compare-chart-slot",!0),s(this,r,X).call(this,i),this.appendChild(i);return}for(let i of o){let l=i.cloneNode(!0);l.setAttribute("slot",t),l.toggleAttribute("data-compare-chart-slot",!0),s(this,r,X).call(this,l),this.appendChild(l)}},X=function(e){e.removeAttribute("style"),e.querySelectorAll("[style]").forEach(t=>t.removeAttribute("style"))},Pe=function(){m(this,T,[]),m(this,G,Ae(this)),a(this,H).clear();let e=1;Array.from(this.querySelectorAll(":scope > div[name]")).forEach((t,o)=>{let i=t.getAttribute("name"),l=t.querySelector(":scope > h4")?.textContent.trim()??"",n=o+1,c={heading:l,groupIndex:n,groupKey:i,rows:[]};a(this,T).push(c),t.querySelectorAll(":scope > p[name]").forEach(h=>{let g=h.getAttribute("name"),f=`${i}@${g}`;e++,c.rows.push({slot:f,rowIndex:e}),a(this,H).set(f,{rowIndex:e,groupIndex:n})})}),a(this,G).forEach(t=>{let o=a(this,T).length+1,i={heading:t.label,groupIndex:o,groupKey:t.name,rows:[]};a(this,T).push(i),t.rows.forEach(l=>{let n=`${t.name}@${l.name}`;e++,i.rows.push({slot:n,rowIndex:e}),a(this,H).set(n,{rowIndex:e,groupIndex:o})})})},le=function(){let e=(this.expandedGroups??"").trim(),t=a(this,T).length;if(m(this,v,new Set),!e)t>0&&a(this,v).add(1);else if(e==="all")for(let o=1;o<=t;o+=1)a(this,v).add(o);else{if(e==="none")return;e.split(",").map(o=>parseInt(o.trim(),10)).filter(o=>!isNaN(o)&&o>=1&&o<=t).forEach(o=>a(this,v).add(o))}},Oe=function(){let e=a(this,T).length;return a(this,v).size?e&&a(this,v).size===e?"all":[...a(this,v)].sort((t,o)=>t-o).join(","):"none"},He=function(){a(this,R).clear(),a(this,S).clear(),Array.from(this.querySelectorAll(":scope > div[name]")).forEach(e=>{let t=e.getAttribute("name");e.querySelectorAll(":scope > p[name]").forEach(o=>{let i=`${t}@${o.getAttribute("name")}`,l=o.cloneNode(!0),n=s(this,r,ce).call(this,l);a(this,R).set(i,{labelHTML:l.innerHTML,title:n,tooltipPosition:o.getAttribute("data-tooltip-position")??"top-center",isItemRow:o.hasAttribute("item")})})}),Array.from(this.querySelectorAll(':scope > merch-card[slot="cards"]')).forEach(e=>{let t=e.dataset.cardId,o=parseInt(e.dataset.columnIndex,10),i=new Map;e.querySelectorAll(':scope > p[name], :scope > [slot="features"] p[name]').forEach(l=>{let n=l.getAttribute("name");!n||!n.includes("@")||i.set(n,l)});for(let[l,n]of i){if(!a(this,H).has(l))continue;let c=n.cloneNode(!0),h=c.textContent.includes("\u2705"),g=c.hasAttribute("primary");g&&c.classList.add("primary-cell"),h&&c.classList.add("emoji-primary-cell");let f=c.hasAttribute("item");f&&c.classList.add("item-cell");let b=s(this,r,ce).call(this,c);s(this,r,pe).call(this,c);let x=a(this,S).get(l)??[];x.push({cardId:t,col:o,isCellPrimary:g,isEmojiPrimary:h,isItem:f,title:b,tooltipPosition:c.getAttribute("data-tooltip-position")??"top-center",html:c.innerHTML,ariaLabel:c.getAttribute("aria-label")}),a(this,S).set(l,x)}});for(let e of a(this,G))e.rows.forEach(t=>{let o=`${e.name}@${t.name}`;a(this,R).set(o,{labelHTML:t.html,title:void 0,tooltipPosition:"top-center",isItemRow:!1});let i=t.cells.map((l,n)=>{let c=document.createElement("p");return c.innerHTML=l,s(this,r,pe).call(this,c),{cardId:a(this,E)[n]?.dataset.cardId,col:n+1,isCellPrimary:!1,isEmojiPrimary:l.includes("\u2705"),isItem:!1,title:void 0,tooltipPosition:"top-center",html:c.innerHTML,ariaLabel:c.getAttribute("aria-label")}}).filter(l=>l.cardId);a(this,S).set(o,i)})},ce=function(e){let t=e.querySelector(":scope > a.secondary-link[title]"),o=t?.getAttribute("title")||e.getAttribute("title")||void 0;return t?.remove(),o&&e.removeAttribute("title"),o},pe=function(e){let t=e.querySelector(":scope > .compare-chart-chip");if(t){for(;t.firstChild;)e.insertBefore(t.firstChild,t);t.remove()}let o=e.textContent.trim();if(ht(o))e.setAttribute("aria-label",D(this,"included","Included")),s(this,r,Q).call(this,e);else if(mt(o))e.setAttribute("aria-label",D(this,"not-included","Not included")),s(this,r,Q).call(this,e);else if(ut(o)){if(e.setAttribute("aria-label",D(this,"not-applicable","Not applicable")),!o){let i=document.createElement("span");i.className="empty-cell-sr",i.textContent=D(this,"empty-table-cell","Not applicable"),e.textContent="\u2014";let l=document.createElement("span");l.setAttribute("aria-hidden","true"),l.textContent="\u2014",e.replaceChildren(l,i)}}else e.removeAttribute("aria-label"),s(this,r,Q).call(this,e);s(this,r,$e).call(this,e)},$e=function(e){if(e.classList.contains("item-cell"))return;let t=document.createElement("span");t.className="compare-chart-chip";let o=Array.from(e.childNodes);for(let i of o){if(i.nodeType===Node.ELEMENT_NODE&&i.tagName==="SMALL")break;t.appendChild(i)}e.insertBefore(t,e.firstChild)},Q=function(e){let t=[...M.included,...M.excluded,...M.notApplicable],o=e.classList.contains("primary-cell");Array.from(e.childNodes).forEach(i=>{if(i.nodeType!==Node.TEXT_NODE)return;let l=i.textContent;if(!t.some(c=>l.includes(c)))return;let n=document.createDocumentFragment();for(let c of l)if(t.includes(c)){let h=document.createElement("span");h.setAttribute("aria-hidden","true"),h.classList.add("compare-chart-glyph"),h.textContent=c==="\u2705"?"\u2713":c,M.included.includes(c)&&h.classList.add("included"),M.excluded.includes(c)&&h.classList.add("excluded"),(o||c==="\u2705")&&h.classList.add("primary"),n.appendChild(h)}else n.appendChild(document.createTextNode(c));i.replaceWith(n)})},de=function(){let e=this.getBoundingClientRect().width||this.offsetWidth||window.innerWidth,t=e>0&&e<pt,o=t!==a(this,k);m(this,k,t),this.toggleAttribute("data-mobile",t),t?s(this,r,me).call(this):s(this,r,Ue).call(this),s(this,r,ue).call(this),o&&this.requestUpdate()},gt=function(){return new Set(s(this,r,J).call(this))},J=function(){return!a(this,k)||a(this,E).length<=2?a(this,E).map(e=>e.dataset.cardId):[a(this,E)[a(this,w)],a(this,E)[a(this,C)]].filter(Boolean).map(e=>e.dataset.cardId)},he=function(){return s(this,r,J).call(this).map(e=>a(this,_).find(t=>t.cardId===e)).filter(Boolean)},me=function(){this.style.setProperty("--compare-chart-cols",2),!(a(this,E).length<=2)&&s(this,r,De).call(this)},De=function(){let e=a(this,E).length;e<=2||(a(this,w)>=e&&m(this,w,0),a(this,C)>=e&&m(this,C,Math.min(1,e-1)),a(this,w)===a(this,C)&&m(this,C,(a(this,w)+1)%e))},Ue=function(){this.style.setProperty("--compare-chart-cols",a(this,E).length)},ze=function(e,t){e==="A"?(t===a(this,C)&&m(this,C,a(this,w)),m(this,w,t)):(t===a(this,w)&&m(this,w,a(this,C)),m(this,C,t)),s(this,r,me).call(this),this.requestUpdate()},ue=function(){if(a(this,k)){this.style.setProperty("--compare-chart-sticky-top","0px");return}let e=document.querySelector("header"),t=document.querySelector(".feds-localnav"),o=(e?.getBoundingClientRect().height||0)+(t?.getBoundingClientRect().height||0);this.style.setProperty("--compare-chart-sticky-top",`${o}px`)},Ge=function(){s(this,r,ge).call(this),s(this,r,ue).call(this);let e=this.getAttribute("sticky-top");if(e){let t=/^\d+$/.test(e.trim())?`${e}px`:e;this.style.setProperty("--compare-chart-sticky-gap",t)}window.addEventListener("scroll",a(this,$),!0),window.addEventListener("resize",a(this,$)),s(this,r,fe).call(this)},ge=function(){window.removeEventListener("scroll",a(this,$),!0),window.removeEventListener("resize",a(this,$)),a(this,N)&&(cancelAnimationFrame(a(this,N)),m(this,N,0))},fe=function(){a(this,N)||m(this,N,requestAnimationFrame(()=>{m(this,N,0),s(this,r,Ye).call(this)}))},Ye=function(){let e=this.shadowRoot?.querySelector(".header-content");if(this.collapsed||!e){s(this,r,ee).call(this,!1);return}let t=parseFloat(getComputedStyle(e).top)||0,o=window.scrollY||window.pageYOffset,i=this.getBoundingClientRect(),l=o+i.top-t,n=a(this,k)?24:1,c=a(this,F);!c&&o>=l?s(this,r,ee).call(this,!0):c&&(o<l-n||i.bottom<=t)&&s(this,r,ee).call(this,!1)},ee=function(e){let t=this.shadowRoot?.querySelector(".header-content");e!==a(this,F)&&(m(this,F,e),this.toggleAttribute("data-sticky-header",e),t?.classList.toggle("sticky",e),t?.classList.toggle("is-stuck",e))},Ve=function(e){let t=!1;a(this,v).has(e)?a(this,v).delete(e):(m(this,v,new Set([e])),t=!0),this.expandedGroups=s(this,r,Oe).call(this),this.dispatchEvent(new CustomEvent("expanded-groups-change",{detail:{value:this.expandedGroups},bubbles:!0,composed:!0})),this.requestUpdate(),t&&this.updateComplete.then(()=>s(this,r,Fe).call(this,e))},Fe=function(e){if(this.collapsed)return;let t=this.shadowRoot?.querySelector(`.table-container[data-group-index="${String(e)}"]`);if(!t)return;let o=this.shadowRoot?.querySelector(".header-content"),i=getComputedStyle(this),l=parseFloat(i.getPropertyValue("--compare-chart-sticky-top"))||0,n=i.getPropertyValue("--compare-chart-sticky-gap").trim(),c=n&&parseFloat(n)||0,h=o?.getBoundingClientRect().height??0,g=l+c+h,f=t.style.scrollMarginTop;t.style.scrollMarginTop=`${g}px`,t.scrollIntoView({block:"start",behavior:"smooth"}),requestAnimationFrame(()=>{t.style.scrollMarginTop=f})},Be=function(){let e=s(this,r,he).call(this),t=s(this,r,qe).call(this,e),o=1;return A`
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
            ${e.map((l,n)=>s(this,r,je).call(this,l,t,n+1,n,o,i))}
        `},qe=function(e){let t=new Set;for(let o of e)for(let i of o.presentSlots)t.add(i);return t},L=function(e,t,o){return o.has(t)?A`<slot name=${e.slots[t]}></slot>`:y},je=function(e,t,o,i,l,n){let c=["header-card-segment",`${t}-segment`],h=e.cellColor;return A`<div
            class=${c.join(" ")}
            data-card-id=${e.cardId}
            data-card-index=${e.col-1}
            data-cell-color=${h}
            style="--col: ${o}; --row: ${l};"
        >
            ${t==="header"?A`
                      ${s(this,r,L).call(this,e,"icons",n)}
                      ${s(this,r,L).call(this,e,"header",n)}
                      ${s(this,r,L).call(this,e,"badge",n)}
                      ${s(this,r,Ke).call(this,e,i)}
                  `:y}
            ${t==="price"?s(this,r,L).call(this,e,"price",n):y}
            ${t==="description"?s(this,r,L).call(this,e,"description",n):y}
            ${t==="detail"?s(this,r,L).call(this,e,"detail",n):y}
            ${t==="cta"?s(this,r,L).call(this,e,"cta",n):y}
        </div>`},Ke=function(e,t){if(!a(this,k)||a(this,_).length<=2)return y;let o=a(this,_).findIndex(n=>n.cardId===e.cardId),i=t===0?"A":"B",l=i==="A"?a(this,C):a(this,w);return A`<select
            class="mobile-filter-select"
            name="column-filter"
            aria-label=${D(this,"choose-table-column","Choose column")}
            .value=${String(o)}
            @change=${n=>s(this,r,ze).call(this,i,parseInt(n.target.value,10))}
        >
            ${a(this,_).map((n,c)=>c===l?y:A`<option
                    value=${c}
                    ?selected=${c===o}
                >
                    ${n.title}
                </option>`)}
        </select>`},We=function(e){let t=a(this,v).has(e.groupIndex);return A`
            <div class="table-container" data-group-index=${e.groupIndex}>
                <button
                    class="table-column-header"
                    aria-expanded=${t}
                    aria-controls="g-${e.groupIndex}"
                    @click=${()=>s(this,r,Ve).call(this,e.groupIndex)}
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
                    ${e.rows.map(o=>s(this,r,Xe).call(this,o))}
                </div>
            </div>
        `},Ze=function(e,t){return{cardId:e,col:t,isCellPrimary:!1,isEmojiPrimary:!1,isItem:!1,title:void 0,tooltipPosition:"top-center",html:'<span class="compare-chart-chip"><span class="compare-chart-glyph" aria-hidden="true">\u2014</span></span>',ariaLabel:D(this,"not-applicable","Not applicable")}},Xe=function(e){let t=a(this,R).get(e.slot)??{},o=new Map((a(this,S).get(e.slot)??[]).map(c=>[c.cardId,c])),i=s(this,r,J).call(this),l=i.map(c=>o.get(c)).filter(Boolean);!l.length&&i.length>0&&a(this,R).has(e.slot)&&(l=i.map(c=>{let h=a(this,E).find(f=>f.dataset.cardId===c),g=parseInt(h?.dataset.columnIndex??"1",10);return s(this,r,Ze).call(this,c,g)}));let n=["table-row"];return t.isItemRow&&n.push("description-row"),A`
            <div class=${n.join(" ")} role="row">
                <div class="row-header" role="rowheader">
                    <span class="row-label"
                        >${Ce(t.labelHTML??"")}</span
                    >
                    ${s(this,r,xe).call(this,t.title,t.tooltipPosition)}
                </div>
                ${l.map(c=>s(this,r,Qe).call(this,c))}
            </div>
        `},Qe=function(e){let t=["cell"];return e.isCellPrimary&&t.push("primary-cell"),e.isEmojiPrimary&&t.push("emoji-primary-cell"),e.isItem&&t.push("item-cell"),A`<p
            role="cell"
            class=${t.join(" ")}
            data-card-id=${e.cardId}
            style="--col: ${e.col};"
            aria-label=${e.ariaLabel??y}
        >
            ${Ce(e.html)}${s(this,r,xe).call(this,e.title,e.tooltipPosition)}
        </p>`},xe=function(e,t){return e?A`<span class="tooltip-wrapper" data-tooltip-position=${t||"top-center"}>
            <button class="tooltip-trigger" aria-label="More info" tabindex="0">
                <span aria-hidden="true">i</span>
            </button>
            <span class="tooltip-popover" role="tooltip">${e}</span>
        </span>`:y},te(B,"properties",{expandedGroups:{type:String,attribute:"expanded-groups",reflect:!0},collapsed:{type:Boolean,attribute:"collapsed",reflect:!0},consonant:{type:Boolean,attribute:"consonant"},spectrum:{type:String,attribute:"spectrum"},placeholders:{type:Object}}),te(B,"styles",we);customElements.get(Te)||customElements.define(Te,B);export{B as MasCompareChart};
