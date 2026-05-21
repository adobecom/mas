var Qe=Object.defineProperty;var be=d=>{throw TypeError(d)};var Je=(d,p,e)=>p in d?Qe(d,p,{enumerable:!0,configurable:!0,writable:!0,value:e}):d[p]=e;var ee=(d,p,e)=>Je(d,typeof p!="symbol"?p+"":p,e),te=(d,p,e)=>p.has(d)||be("Cannot "+e);var i=(d,p,e)=>(te(d,p,"read from private field"),e?e.call(d):p.get(d)),g=(d,p,e)=>p.has(d)?be("Cannot add the same private member more than once"):p instanceof WeakSet?p.add(d):p.set(d,e),m=(d,p,e,t)=>(te(d,p,"write to private field"),t?t.call(d,e):p.set(d,e),e),s=(d,p,e)=>(te(d,p,"access private method"),e);import{html as w,LitElement as nt,nothing as C}from"./lit-all.min.js";import{unsafeHTML as Ce}from"./lit-all.min.js";var ft=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),xt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var et='span[is="inline-price"][data-wcs-osi]',tt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var rt='a[is="upt-link"]',bt=`${et},${tt},${rt}`;var re="aem:load",oe="aem:error",ae="mas:ready";var yt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Et=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var ot=d=>String(d||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\//g,"").replace(/[^a-z0-9&]+/g,"-").replace(/&/g,"").replace(/^-+|-+$/g,"")||"item",Ae=d=>Array.from(d.childNodes).map(p=>p.nodeType===Node.TEXT_NODE?p.textContent:p.nodeType===Node.ELEMENT_NODE?p.outerHTML:"").join("").replace(/\s+/g," ").trim(),at=d=>{let p=d.querySelector("[aria-label]")?.getAttribute("aria-label")?.trim().toLowerCase();return p==="yes"?"\u2713":p==="no"?"\u2717":d.querySelector(".icon-checkmark-no-fill, .icon-checkmark")?"\u2713":d.querySelector(".icon-crossmark")?"\u2717":Ae(d)},ye=d=>Ae(d).replace(/\s+/g," ").trim(),it=d=>(d.querySelector(".ctv2-th-header")?.textContent||d.textContent||"").replace(/:$/,"").replace(/\s+/g," ").trim(),Ee=(d,p)=>{let e=ot(d),t=e,o=2;for(;p.has(t);)t=`${e}-${o}`,o+=1;return p.add(t),t},ve=d=>{let p=new Set;return Array.from(d.querySelectorAll(":scope > table")).map(e=>{let t=Array.from(e.querySelectorAll(":scope > thead > tr:first-child > th")),o=t[0],a=(o?.textContent||"").replace(/\s+/g," ").trim(),n=t.slice(1).map(h=>h.textContent.replace(/\s+/g," ").trim()),l=new Set,c=Array.from(e.querySelectorAll(":scope > tbody > tr")).map(h=>{let u=Array.from(h.children),f=u.find(x=>x.matches('th[scope="row"], th'))||u[0],b=it(f);return{name:Ee(b,l),html:ye(f),cells:u.slice(u.indexOf(f)+1).map(at)}});return{name:Ee(a,p),label:a,labelHtml:o?ye(o):a,columns:n,rows:c}})};import{css as st}from"./lit-all.min.js";var we=st`
    :host {
        --comparison-border-radius: 8px;
        --comparison-row-border-color: #e9e9e9;
        --comparison-desktop-max-width: 1200px;
        --comparison-tablet-spacing: 50px;
        --comparison-table-spacing: 12px;
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
        --compare-chart-header-detail-font: italic 400 12px/15px 'Adobe Clean',
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
        background: transparent;
        box-shadow: none;
        box-sizing: border-box;
        padding-bottom: var(--spacing-s, 24px);
        transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
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
    .sticky-header.is-stuck .sticky-header-wrapper {
        justify-content: space-between;
        gap: 0;
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
        font: var(--compare-chart-header-title-font);
        letter-spacing: 0;
    }
    .header-card-segment {
        grid-column: calc(var(--col) + 1);
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
        padding: var(--spacing-xxs, 8px);
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
        grid-row: 1;
        position: relative;
        justify-content: flex-start;
    }
    .price-segment {
        grid-row: 2;
        align-self: stretch;
    }
    .description-segment {
        grid-row: 3;
        padding: 0 var(--comparison-table-spacing);
    }
    .detail-segment {
        grid-row: 4;
        padding: 0 var(--comparison-table-spacing);
    }
    .cta-segment {
        grid-row: 5;
        gap: 8px;
        padding: var(--spacing-xxs, 8px);
    }
    .cta-segment slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        align-self: stretch;
        width: 100%;
        gap: var(--spacing-xxs, 8px);
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
        padding: var(--spacing-xxs, 8px);
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
        padding: var(--spacing-xxs, 8px);
        box-sizing: border-box;
        background: rgba(255, 255, 255, 0.001);
        font:
            italic 400 var(--type-body-xxs-size, 12px) / 1.25 'Adobe Clean',
            sans-serif !important;
        letter-spacing: 0;
        margin: 0;
        text-align: center;
        color: #2c2c2c;
    }
    ::slotted([slot$='-cta']) {
        display: flex;
        justify-content: center;
        font: var(--compare-chart-header-cta-font);
        letter-spacing: 0;
        margin: 0;
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
        margin: var(--spacing-xs, 16px) auto 0;
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
        padding: var(--spacing-s, 24px);
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
        margin: 0 var(--spacing-s, 24px);
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
        padding: var(--spacing-xs, 16px) 0 0 0;
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
        padding: 0 0 var(--spacing-s, 24px) 0;
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
        padding: var(--spacing-xs, 16px) var(--comparison-table-spacing);
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
            padding: 0;
        }
        .sticky-header-wrapper {
            grid-template-columns: repeat(2, minmax(0, 1fr));
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
        .header-segment {
            grid-row: 1;
        }
        .price-segment {
            grid-row: 2;
        }
        .description-segment {
            grid-row: 3;
        }
        .detail-segment {
            grid-row: 4;
        }
        .cta-segment {
            grid-row: 5;
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
            padding: 0;
        }
        .sticky-header-wrapper {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            max-width: calc(100% - 160px);
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
        .header-segment {
            grid-row: 1;
        }
        .price-segment {
            grid-row: 2;
        }
        .description-segment {
            grid-row: 3;
        }
        .detail-segment {
            grid-row: 4;
        }
        .cta-segment {
            grid-row: 5;
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
            padding: 0;
        }
        .sticky-header-wrapper {
            max-width: calc(100% - 4 * var(--spacing-s, 24px));
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
            padding: var(--spacing-s, 24px) var(--spacing-s, 24px)
                var(--spacing-s, 24px) 0;
            text-align: start;
        }
        .table-row p[role='cell'] {
            padding: var(--spacing-s, 24px) 0;
        }
        .table-column-header {
            justify-content: space-between;
            position: static;
            padding: var(--spacing-s, 24px);
        }
        .toggle-icon {
            position: static;
        }
    }

    @media screen and (min-width: 1200px) {
        :host {
            max-width: var(--comparison-desktop-max-width);
            padding: 0;
        }
        .sticky-header-wrapper {
            max-width: calc(
                var(--comparison-desktop-max-width) - 2 *
                    var(--spacing-s, 24px) - 2px
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
`;var _e="mas-compare-chart",lt=3e4,Z=4,ct=900,dt=["icons","header","badge","price","description","detail","cta"],L={included:["\u2713","\u2714","\u2705"],excluded:["\u2717","\u2718","\u2716","\xD7"],notApplicable:["\u2014","-"]},pt=d=>L.included.includes(d),ht=d=>L.excluded.includes(d),mt=d=>!d||L.notApplicable.includes(d)||/^-+$/.test(d),D=(d,p,e)=>d.placeholders?.[p]??e,z,y,T,S,R,_,G,H,E,V,M,A,v,Y,I,P,B,k,$,q,j,K,r,ie,se,Te,Se,Re,ke,Ne,O,Le,Me,Ie,X,Pe,ne,Oe,He,le,ce,$e,Q,de,gt,J,pe,he,De,Ue,ze,me,Ge,ge,ue,Ve,fe,Ye,Fe,Be,qe,N,U,je,Ke,We,Ze,Xe,xe,F=class extends nt{constructor(){super();g(this,r);g(this,z);g(this,y,[]);g(this,T,[]);g(this,S,new Map);g(this,R,new Map);g(this,_,[]);g(this,G,[]);g(this,H,new Map);g(this,E,new Set);g(this,V);g(this,M,!1);g(this,A,0);g(this,v,1);g(this,Y,!1);g(this,I,null);g(this,P,null);g(this,B,!1);g(this,k,0);g(this,$,()=>s(this,r,ue).call(this));g(this,q,e=>{let t=e.target;if(t?.parentElement===this){s(this,r,Ne).call(this,e.detail,t);return}t?.closest?.("merch-card")?.parentElement===this&&s(this,r,O).call(this)});g(this,j,e=>{var t;e.target?.parentElement===this&&(m(this,_,[]),m(this,T,[]),m(this,y,[]),i(this,S).clear(),i(this,R).clear(),this.requestUpdate(),(t=i(this,P))==null||t.call(this,!1),m(this,I,null),m(this,P,null))});g(this,K,e=>{e.target?.parentElement===this&&s(this,r,O).call(this)});m(this,z,this.attachInternals?.()),i(this,z)&&(i(this,z).role="table")}connectedCallback(){super.connectedCallback(),this.addEventListener("mas-compare-chart:rehydrate",()=>s(this,r,O).call(this)),this.addEventListener(re,i(this,q)),this.addEventListener(oe,i(this,j)),this.addEventListener(ae,i(this,K)),m(this,V,new ResizeObserver(()=>s(this,r,de).call(this))),i(this,V).observe(this)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(re,i(this,q)),this.removeEventListener(oe,i(this,j)),this.removeEventListener(ae,i(this,K)),i(this,V)?.disconnect(),s(this,r,ge).call(this)}firstUpdated(){s(this,r,O).call(this),s(this,r,Ge).call(this)}updated(e){e.has("expandedGroups")&&s(this,r,ne).call(this),(e.has("consonant")||e.has("spectrum"))&&s(this,r,se).call(this)}checkReady(){if(!this.querySelector(":scope > aem-fragment"))return Promise.resolve(!0);s(this,r,ie).call(this);let t=new Promise(o=>setTimeout(()=>o(!1),lt));return Promise.race([i(this,I),t])}render(){return this.collapsed?C:w`
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
                ${s(this,r,pe).call(this).map(e=>w`<span role="columnheader">${e.title}</span>`)}
            </div>
            ${i(this,_).map(e=>s(this,r,Ke).call(this,e))}
        `}};z=new WeakMap,y=new WeakMap,T=new WeakMap,S=new WeakMap,R=new WeakMap,_=new WeakMap,G=new WeakMap,H=new WeakMap,E=new WeakMap,V=new WeakMap,M=new WeakMap,A=new WeakMap,v=new WeakMap,Y=new WeakMap,I=new WeakMap,P=new WeakMap,B=new WeakMap,k=new WeakMap,$=new WeakMap,q=new WeakMap,j=new WeakMap,K=new WeakMap,r=new WeakSet,ie=function(){i(this,I)||m(this,I,new Promise(e=>{m(this,P,e)}))},se=function(e=i(this,y)){e.forEach(t=>{t.consonant=this.consonant,t.toggleAttribute("consonant",!!this.consonant),this.spectrum?(t.spectrum=this.spectrum,t.setAttribute("spectrum",this.spectrum)):t.removeAttribute("spectrum")})},Te=function(e,t){let o=e?.fields||{};if(Array.isArray(o)){let n=o.find(l=>l.name===t);return n?.multiple?n.values||[]:n?.values?.[0]||""}let a=o[t];return Array.isArray(a)?a[0]||"":a?.value??a??""},Se=function(e,t){let o=e?.fields||{};if(Array.isArray(o))return o.find(n=>n.name===t)?.values||[];let a=o[t];return Array.isArray(a)?a:a==null||a===""?[]:[a?.value??a]},Re=function(e){let t=e?.references||{};return Array.isArray(t)?t.map(o=>({identifier:o.identifier||o.id||o.path,value:o.value||o})).filter(o=>o.value):Object.entries(t).map(([o,a])=>({identifier:o,value:a?.value||a})).filter(o=>o.value)},ke=function(e){let t=s(this,r,Re).call(this,e),o=l=>t.find(({identifier:c,value:h})=>c===l||h.id===l||h.path===l)?.value,a=s(this,r,Se).call(this,e,"cards").map(o).filter(Boolean);if(a.length)return a.slice(0,Z);let n=(e.referencesTree||[]).filter(l=>l.fieldName==="cards").map(l=>o(l.identifier)).filter(Boolean);return n.length?n.slice(0,Z):t.map(({value:l})=>l).filter(l=>l?.fields).slice(0,Z)},Ne=async function(e,t){var f;if(!e)return;s(this,r,ie).call(this),this.querySelectorAll("[data-compare-chart-generated]").forEach(b=>b.remove());let o=new DOMParser,a=s(this,r,Te).call(this,e,"compareChart"),n=o.parseFromString(a||"","text/html"),l=n.body.querySelector("mas-compare-chart")||n.body;l.hasAttribute?.("expanded-groups")&&(this.expandedGroups=l.getAttribute("expanded-groups")),l.querySelectorAll(":scope > div[name]").forEach(b=>{let x=b.cloneNode(!0);x.dataset.compareChartGenerated="true",this.append(x)});let c=t?.hasAttribute("author"),h=s(this,r,ke).call(this,e),u=[];h.forEach(b=>{t?.cache?.add(b);let x=document.createElement("merch-card");x.setAttribute("slot","cards"),x.dataset.compareChartGenerated="true",s(this,r,se).call(this,[x]);let W=document.createElement("aem-fragment");W.setAttribute("fragment",b.id),c&&W.setAttribute("author",""),W.setAttribute("loading","cache"),x.append(W),this.append(x),u.push(x)}),s(this,r,O).call(this),await Promise.all(u.map(b=>b.checkReady?.().catch(()=>!1))),s(this,r,O).call(this),(f=i(this,P))==null||f.call(this,!0),m(this,I,null),m(this,P,null)},O=function(){if(!i(this,Y)){m(this,Y,!0);try{s(this,r,Le).call(this),s(this,r,Pe).call(this),s(this,r,ne).call(this),s(this,r,He).call(this),s(this,r,de).call(this),this.requestUpdate()}finally{m(this,Y,!1)}}},Le=function(){let e=Array.from(this.querySelectorAll(':scope > merch-card[slot="cards"]')).slice(0,Z);this.querySelectorAll(":scope > [data-compare-chart-slot]").forEach(o=>o.remove());let t=[];e.forEach((o,a)=>{let n=`card-${a+1}`;o.dataset.cardId=n,o.dataset.columnIndex=String(a+1),o.style.setProperty("--col",a+1);let l=o.getAttribute("cell-color")??"default";t.push(s(this,r,Me).call(this,o,n,a,l))}),m(this,y,e),m(this,T,t),this.setAttribute("data-child-count",String(e.length)),this.style.setProperty("--compare-chart-cols",e.length)},Me=function(e,t,o,a){let n={},l=new Set;for(let h of dt){let u=`${t}-${h}`;if(n[h]=u,!e)continue;let f=Array.from(e.querySelectorAll(`:scope > [slot="${h}"]`));f.length&&l.add(h);for(let b of f){if(h==="cta"){s(this,r,Ie).call(this,b,u);continue}let x=b.cloneNode(!0);x.setAttribute("slot",u),x.toggleAttribute("data-compare-chart-slot",!0),s(this,r,X).call(this,x),this.appendChild(x)}}e&&(e.hidden=!0,e.setAttribute("aria-hidden","true"),e.dataset.cardId=t,e.dataset.columnIndex=String(o+1),e.dataset.cellColor=a);let c=Array.from(this.querySelectorAll(`:scope > [slot="${n.header}"]`)).map(h=>h.textContent.trim()).filter(Boolean).join(" ");return{cardId:t,col:o+1,cellColor:a,slots:n,presentSlots:l,title:c||`Card ${o+1}`}},Ie=function(e,t){let o=e.matches("a,button")?[e]:Array.from(e.querySelectorAll("a,button"));if(!o.length){let a=e.cloneNode(!0);a.setAttribute("slot",t),a.toggleAttribute("data-compare-chart-slot",!0),s(this,r,X).call(this,a),this.appendChild(a);return}for(let a of o){let n=a.cloneNode(!0);n.setAttribute("slot",t),n.toggleAttribute("data-compare-chart-slot",!0),s(this,r,X).call(this,n),this.appendChild(n)}},X=function(e){e.removeAttribute("style"),e.querySelectorAll("[style]").forEach(t=>t.removeAttribute("style"))},Pe=function(){m(this,_,[]),m(this,G,ve(this)),i(this,H).clear();let e=1;Array.from(this.querySelectorAll(":scope > div[name]")).forEach((t,o)=>{let a=t.getAttribute("name"),n=t.querySelector(":scope > h4")?.textContent.trim()??"",l=o+1,c={heading:n,groupIndex:l,groupKey:a,rows:[]};i(this,_).push(c),t.querySelectorAll(":scope > p[name]").forEach(h=>{let u=h.getAttribute("name"),f=`${a}@${u}`;e++,c.rows.push({slot:f,rowIndex:e}),i(this,H).set(f,{rowIndex:e,groupIndex:l})})}),i(this,G).forEach(t=>{let o=i(this,_).length+1,a={heading:t.label,groupIndex:o,groupKey:t.name,rows:[]};i(this,_).push(a),t.rows.forEach(n=>{let l=`${t.name}@${n.name}`;e++,a.rows.push({slot:l,rowIndex:e}),i(this,H).set(l,{rowIndex:e,groupIndex:o})})})},ne=function(){let e=(this.expandedGroups??"").trim(),t=i(this,_).length;if(m(this,E,new Set),!e)t>0&&i(this,E).add(1);else if(e==="all")for(let o=1;o<=t;o+=1)i(this,E).add(o);else{if(e==="none")return;e.split(",").map(o=>parseInt(o.trim(),10)).filter(o=>!isNaN(o)&&o>=1&&o<=t).forEach(o=>i(this,E).add(o))}},Oe=function(){let e=i(this,_).length;return i(this,E).size?e&&i(this,E).size===e?"all":[...i(this,E)].sort((t,o)=>t-o).join(","):"none"},He=function(){i(this,R).clear(),i(this,S).clear(),Array.from(this.querySelectorAll(":scope > div[name]")).forEach(e=>{let t=e.getAttribute("name");e.querySelectorAll(":scope > p[name]").forEach(o=>{let a=`${t}@${o.getAttribute("name")}`,n=o.cloneNode(!0),l=s(this,r,le).call(this,n);i(this,R).set(a,{labelHTML:n.innerHTML,title:l,tooltipPosition:o.getAttribute("data-tooltip-position")??"top-center",isItemRow:o.hasAttribute("item")})})}),Array.from(this.querySelectorAll(':scope > merch-card[slot="cards"]')).forEach(e=>{let t=e.dataset.cardId,o=parseInt(e.dataset.columnIndex,10),a=new Map;e.querySelectorAll(':scope > p[name], :scope > [slot="features"] p[name]').forEach(n=>{let l=n.getAttribute("name");!l||!l.includes("@")||a.set(l,n)});for(let[n,l]of a){if(!i(this,H).has(n))continue;let c=l.cloneNode(!0),h=c.textContent.includes("\u2705"),u=c.hasAttribute("primary");u&&c.classList.add("primary-cell"),h&&c.classList.add("emoji-primary-cell");let f=c.hasAttribute("item");f&&c.classList.add("item-cell");let b=s(this,r,le).call(this,c);s(this,r,ce).call(this,c);let x=i(this,S).get(n)??[];x.push({cardId:t,col:o,isCellPrimary:u,isEmojiPrimary:h,isItem:f,title:b,tooltipPosition:c.getAttribute("data-tooltip-position")??"top-center",html:c.innerHTML,ariaLabel:c.getAttribute("aria-label")}),i(this,S).set(n,x)}});for(let e of i(this,G))e.rows.forEach(t=>{let o=`${e.name}@${t.name}`;i(this,R).set(o,{labelHTML:t.html,title:void 0,tooltipPosition:"top-center",isItemRow:!1});let a=t.cells.map((n,l)=>{let c=document.createElement("p");return c.innerHTML=n,s(this,r,ce).call(this,c),{cardId:i(this,y)[l]?.dataset.cardId,col:l+1,isCellPrimary:!1,isEmojiPrimary:n.includes("\u2705"),isItem:!1,title:void 0,tooltipPosition:"top-center",html:c.innerHTML,ariaLabel:c.getAttribute("aria-label")}}).filter(n=>n.cardId);i(this,S).set(o,a)})},le=function(e){let t=e.querySelector(":scope > a.secondary-link[title]"),o=t?.getAttribute("title")||e.getAttribute("title")||void 0;return t?.remove(),o&&e.removeAttribute("title"),o},ce=function(e){let t=e.querySelector(":scope > .compare-chart-chip");if(t){for(;t.firstChild;)e.insertBefore(t.firstChild,t);t.remove()}let o=e.textContent.trim();if(pt(o))e.setAttribute("aria-label",D(this,"included","Included")),s(this,r,Q).call(this,e);else if(ht(o))e.setAttribute("aria-label",D(this,"not-included","Not included")),s(this,r,Q).call(this,e);else if(mt(o)){if(e.setAttribute("aria-label",D(this,"not-applicable","Not applicable")),!o){let a=document.createElement("span");a.className="empty-cell-sr",a.textContent=D(this,"empty-table-cell","Not applicable"),e.textContent="\u2014";let n=document.createElement("span");n.setAttribute("aria-hidden","true"),n.textContent="\u2014",e.replaceChildren(n,a)}}else e.removeAttribute("aria-label"),s(this,r,Q).call(this,e);s(this,r,$e).call(this,e)},$e=function(e){if(e.classList.contains("item-cell"))return;let t=document.createElement("span");t.className="compare-chart-chip";let o=Array.from(e.childNodes);for(let a of o){if(a.nodeType===Node.ELEMENT_NODE&&a.tagName==="SMALL")break;t.appendChild(a)}e.insertBefore(t,e.firstChild)},Q=function(e){let t=[...L.included,...L.excluded,...L.notApplicable],o=e.classList.contains("primary-cell");Array.from(e.childNodes).forEach(a=>{if(a.nodeType!==Node.TEXT_NODE)return;let n=a.textContent;if(!t.some(c=>n.includes(c)))return;let l=document.createDocumentFragment();for(let c of n)if(t.includes(c)){let h=document.createElement("span");h.setAttribute("aria-hidden","true"),h.classList.add("compare-chart-glyph"),h.textContent=c==="\u2705"?"\u2713":c,L.included.includes(c)&&h.classList.add("included"),L.excluded.includes(c)&&h.classList.add("excluded"),(o||c==="\u2705")&&h.classList.add("primary"),l.appendChild(h)}else l.appendChild(document.createTextNode(c));a.replaceWith(l)})},de=function(){let e=this.getBoundingClientRect().width||this.offsetWidth||window.innerWidth,t=e>0&&e<ct,o=t!==i(this,M);m(this,M,t),this.toggleAttribute("data-mobile",t),t?s(this,r,he).call(this):s(this,r,Ue).call(this),s(this,r,me).call(this),o&&this.requestUpdate()},gt=function(){return new Set(s(this,r,J).call(this))},J=function(){return!i(this,M)||i(this,y).length<=2?i(this,y).map(e=>e.dataset.cardId):[i(this,y)[i(this,A)],i(this,y)[i(this,v)]].filter(Boolean).map(e=>e.dataset.cardId)},pe=function(){return s(this,r,J).call(this).map(e=>i(this,T).find(t=>t.cardId===e)).filter(Boolean)},he=function(){this.style.setProperty("--compare-chart-cols",2),!(i(this,y).length<=2)&&s(this,r,De).call(this)},De=function(){let e=i(this,y).length;e<=2||(i(this,A)>=e&&m(this,A,0),i(this,v)>=e&&m(this,v,Math.min(1,e-1)),i(this,A)===i(this,v)&&m(this,v,(i(this,A)+1)%e))},Ue=function(){this.style.setProperty("--compare-chart-cols",i(this,y).length)},ze=function(e,t){e==="A"?(t===i(this,v)&&m(this,v,i(this,A)),m(this,A,t)):(t===i(this,A)&&m(this,A,i(this,v)),m(this,v,t)),s(this,r,he).call(this),this.requestUpdate()},me=function(){if(i(this,M)){this.style.setProperty("--compare-chart-sticky-top","0px");return}let e=document.querySelector("header"),t=document.querySelector(".feds-localnav"),o=(e?.getBoundingClientRect().height||0)+(t?.getBoundingClientRect().height||0);this.style.setProperty("--compare-chart-sticky-top",`${o}px`)},Ge=function(){s(this,r,ge).call(this),s(this,r,me).call(this);let e=this.getAttribute("sticky-top");if(e){let t=/^\d+$/.test(e.trim())?`${e}px`:e;this.style.setProperty("--compare-chart-sticky-gap",t)}window.addEventListener("scroll",i(this,$),!0),window.addEventListener("resize",i(this,$)),s(this,r,ue).call(this)},ge=function(){window.removeEventListener("scroll",i(this,$),!0),window.removeEventListener("resize",i(this,$)),i(this,k)&&(cancelAnimationFrame(i(this,k)),m(this,k,0))},ue=function(){i(this,k)||m(this,k,requestAnimationFrame(()=>{m(this,k,0),s(this,r,Ve).call(this)}))},Ve=function(){let e=this.shadowRoot?.querySelector(".header-content");if(this.collapsed||!e){s(this,r,fe).call(this,!1);return}let t=parseFloat(getComputedStyle(e).top)||0,o=e.getBoundingClientRect(),a=this.getBoundingClientRect();s(this,r,fe).call(this,a.top<t&&a.bottom>t&&o.top<=t+1)},fe=function(e){let t=this.shadowRoot?.querySelector(".header-content");e!==i(this,B)&&(m(this,B,e),this.toggleAttribute("data-sticky-header",e),t?.classList.toggle("sticky",e),t?.classList.toggle("is-stuck",e))},Ye=function(e){let t=!1;i(this,E).has(e)?i(this,E).delete(e):(m(this,E,new Set([e])),t=!0),this.expandedGroups=s(this,r,Oe).call(this),this.dispatchEvent(new CustomEvent("expanded-groups-change",{detail:{value:this.expandedGroups},bubbles:!0,composed:!0})),this.requestUpdate(),t&&this.updateComplete.then(()=>s(this,r,Fe).call(this,e))},Fe=function(e){if(this.collapsed)return;let t=this.shadowRoot?.querySelector(`.table-container[data-group-index="${String(e)}"]`);if(!t)return;let o=this.shadowRoot?.querySelector(".header-content"),a=getComputedStyle(this),n=parseFloat(a.getPropertyValue("--compare-chart-sticky-top"))||0,l=a.getPropertyValue("--compare-chart-sticky-gap").trim(),c=l&&parseFloat(l)||0,h=o?.getBoundingClientRect().height??0,u=n+c+h,f=t.style.scrollMarginTop;t.style.scrollMarginTop=`${u}px`,t.scrollIntoView({block:"start",behavior:"smooth"}),requestAnimationFrame(()=>{t.style.scrollMarginTop=f})},Be=function(){let e=s(this,r,pe).call(this),t=s(this,r,qe).call(this,e);return w`
            <div class="header-leading header-leading-header"></div>
            ${e.map((o,a)=>s(this,r,U).call(this,o,"header",a+1,a,t))}
            <div class="header-leading header-leading-price"></div>
            ${e.map((o,a)=>s(this,r,U).call(this,o,"price",a+1,a,t))}
            <div class="header-leading header-leading-description"></div>
            ${e.map((o,a)=>s(this,r,U).call(this,o,"description",a+1,a,t))}
            <div class="header-leading header-leading-detail"></div>
            ${e.map((o,a)=>s(this,r,U).call(this,o,"detail",a+1,a,t))}
            ${e.map((o,a)=>s(this,r,U).call(this,o,"cta",a+1,a,t))}
        `},qe=function(e){let t=new Set;for(let o of e)for(let a of o.presentSlots)t.add(a);return t},N=function(e,t,o){return o.has(t)?w`<slot name=${e.slots[t]}></slot>`:C},U=function(e,t,o,a,n){let l=["header-card-segment",`${t}-segment`],c=e.cellColor;return w`<div
            class=${l.join(" ")}
            data-card-id=${e.cardId}
            data-card-index=${e.col-1}
            data-cell-color=${c}
            style="--col: ${o};"
        >
            ${t==="header"?w`
                      ${s(this,r,N).call(this,e,"icons",n)}
                      ${s(this,r,N).call(this,e,"header",n)}
                      ${s(this,r,N).call(this,e,"badge",n)}
                      ${s(this,r,je).call(this,e,a)}
                  `:C}
            ${t==="price"?s(this,r,N).call(this,e,"price",n):C}
            ${t==="description"?s(this,r,N).call(this,e,"description",n):C}
            ${t==="detail"?s(this,r,N).call(this,e,"detail",n):C}
            ${t==="cta"?s(this,r,N).call(this,e,"cta",n):C}
        </div>`},je=function(e,t){if(!i(this,M)||i(this,T).length<=2)return C;let o=i(this,T).findIndex(l=>l.cardId===e.cardId),a=t===0?"A":"B",n=a==="A"?i(this,v):i(this,A);return w`<select
            class="mobile-filter-select"
            name="column-filter"
            aria-label=${D(this,"choose-table-column","Choose column")}
            .value=${String(o)}
            @change=${l=>s(this,r,ze).call(this,a,parseInt(l.target.value,10))}
        >
            ${i(this,T).map((l,c)=>c===n?C:w`<option
                    value=${c}
                    ?selected=${c===o}
                >
                    ${l.title}
                </option>`)}
        </select>`},Ke=function(e){let t=i(this,E).has(e.groupIndex);return w`
            <div class="table-container" data-group-index=${e.groupIndex}>
                <button
                    class="table-column-header"
                    aria-expanded=${t}
                    aria-controls="g-${e.groupIndex}"
                    @click=${()=>s(this,r,Ye).call(this,e.groupIndex)}
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
                    ${e.rows.map(o=>s(this,r,Ze).call(this,o))}
                </div>
            </div>
        `},We=function(e,t){return{cardId:e,col:t,isCellPrimary:!1,isEmojiPrimary:!1,isItem:!1,title:void 0,tooltipPosition:"top-center",html:'<span class="compare-chart-chip"><span class="compare-chart-glyph" aria-hidden="true">\u2014</span></span>',ariaLabel:D(this,"not-applicable","Not applicable")}},Ze=function(e){let t=i(this,R).get(e.slot)??{},o=new Map((i(this,S).get(e.slot)??[]).map(c=>[c.cardId,c])),a=s(this,r,J).call(this),n=a.map(c=>o.get(c)).filter(Boolean);!n.length&&a.length>0&&i(this,R).has(e.slot)&&(n=a.map(c=>{let h=i(this,y).find(f=>f.dataset.cardId===c),u=parseInt(h?.dataset.columnIndex??"1",10);return s(this,r,We).call(this,c,u)}));let l=["table-row"];return t.isItemRow&&l.push("description-row"),w`
            <div class=${l.join(" ")} role="row">
                <div class="row-header" role="rowheader">
                    <span class="row-label"
                        >${Ce(t.labelHTML??"")}</span
                    >
                    ${s(this,r,xe).call(this,t.title,t.tooltipPosition)}
                </div>
                ${n.map(c=>s(this,r,Xe).call(this,c))}
            </div>
        `},Xe=function(e){let t=["cell"];return e.isCellPrimary&&t.push("primary-cell"),e.isEmojiPrimary&&t.push("emoji-primary-cell"),e.isItem&&t.push("item-cell"),w`<p
            role="cell"
            class=${t.join(" ")}
            data-card-id=${e.cardId}
            style="--col: ${e.col};"
            aria-label=${e.ariaLabel??C}
        >
            ${Ce(e.html)}${s(this,r,xe).call(this,e.title,e.tooltipPosition)}
        </p>`},xe=function(e,t){return e?w`<span class="tooltip-wrapper" data-tooltip-position=${t||"top-center"}>
            <button class="tooltip-trigger" aria-label="More info" tabindex="0">
                <span aria-hidden="true">i</span>
            </button>
            <span class="tooltip-popover" role="tooltip">${e}</span>
        </span>`:C},ee(F,"properties",{expandedGroups:{type:String,attribute:"expanded-groups",reflect:!0},collapsed:{type:Boolean,attribute:"collapsed",reflect:!0},consonant:{type:Boolean,attribute:"consonant"},spectrum:{type:String,attribute:"spectrum"},placeholders:{type:Object}}),ee(F,"styles",we);customElements.get(_e)||customElements.define(_e,F);export{F as MasCompareChart};
