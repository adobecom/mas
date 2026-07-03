var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/mas-compare-chart.js
import { html, LitElement, nothing } from "./lit-all.min.js";
import { repeat } from "./lit-all.min.js";
import { unsafeHTML } from "./lit-all.min.js";

// src/constants.js
var Commitment = Object.freeze({
  MONTH: "MONTH",
  YEAR: "YEAR",
  TWO_YEARS: "TWO_YEARS",
  THREE_YEARS: "THREE_YEARS",
  PERPETUAL: "PERPETUAL",
  TERM_LICENSE: "TERM_LICENSE",
  ACCESS_PASS: "ACCESS_PASS",
  THREE_MONTHS: "THREE_MONTHS",
  SIX_MONTHS: "SIX_MONTHS"
});
var Term = Object.freeze({
  ANNUAL: "ANNUAL",
  MONTHLY: "MONTHLY",
  TWO_YEARS: "TWO_YEARS",
  THREE_YEARS: "THREE_YEARS",
  P1D: "P1D",
  P1Y: "P1Y",
  P3Y: "P3Y",
  P10Y: "P10Y",
  P15Y: "P15Y",
  P3D: "P3D",
  P7D: "P7D",
  P30D: "P30D",
  HALF_YEARLY: "HALF_YEARLY",
  QUARTERLY: "QUARTERLY"
});
var SELECTOR_MAS_INLINE_PRICE = 'span[is="inline-price"][data-wcs-osi]';
var SELECTOR_MAS_CHECKOUT_LINK = 'a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';
var SELECTOR_MAS_UPT_LINK = 'a[is="upt-link"]';
var SELECTOR_MAS_ELEMENT = `${SELECTOR_MAS_INLINE_PRICE},${SELECTOR_MAS_CHECKOUT_LINK},${SELECTOR_MAS_UPT_LINK}`;
var EVENT_AEM_LOAD = "aem:load";
var EVENT_AEM_ERROR = "aem:error";
var EVENT_MAS_READY = "mas:ready";
var EVENT_COMPARE_CHART_REHYDRATE = "mas-compare-chart:rehydrate";
var EVENT_EXPANDED_GROUPS_CHANGE = "expanded-groups-change";
var CheckoutWorkflowStep = Object.freeze({
  SEGMENTATION: "segmentation",
  BUNDLE: "bundle",
  COMMITMENT: "commitment",
  RECOMMENDATION: "recommendation",
  EMAIL: "email",
  PAYMENT: "payment",
  CHANGE_PLAN_TEAM_PLANS: "change-plan/team-upgrade/plans",
  CHANGE_PLAN_TEAM_PAYMENT: "change-plan/team-upgrade/payment"
});
var Env = Object.freeze({
  STAGE: "STAGE",
  PRODUCTION: "PRODUCTION",
  LOCAL: "LOCAL"
});

// src/compare-chart-table-parser.js
var normalizeCompareChartKey = (value) => {
  const normalized = String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[/&]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || "item";
};
var htmlFromCell = (cell) => Array.from(cell.childNodes).map((node) => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType === Node.ELEMENT_NODE) return node.outerHTML;
  return "";
}).join("").replace(/\s+/g, " ").trim();
var cellValueFromTableCell = (cell) => {
  const aria = cell.querySelector("[aria-label]")?.getAttribute("aria-label")?.trim().toLowerCase();
  if (aria === "yes") return "\u2713";
  if (aria === "no") return "\u2717";
  if (cell.querySelector(".icon-checkmark-no-fill, .icon-checkmark")) {
    return "\u2713";
  }
  if (cell.querySelector(".icon-crossmark")) return "\u2717";
  return htmlFromCell(cell);
};
var rowHeaderHtml = (cell) => htmlFromCell(cell).replace(/\s+/g, " ").trim();
var rowHeaderLabel = (cell) => {
  const header = cell.querySelector(".ctv2-th-header");
  return (header?.textContent || cell.textContent || "").replace(/:$/, "").replace(/\s+/g, " ").trim();
};
var uniqueKey = (base, used) => {
  const normalizedBase = normalizeCompareChartKey(base);
  let key = normalizedBase;
  let index = 2;
  while (used.has(key)) {
    key = `${normalizedBase}-${index}`;
    index += 1;
  }
  used.add(key);
  return key;
};
var parseCompareChartTables = (root) => {
  const usedGroupNames = /* @__PURE__ */ new Set();
  return Array.from(root.querySelectorAll(":scope > table")).map((table) => {
    const headerCells = Array.from(
      table.querySelectorAll(":scope > thead > tr:first-child > th")
    );
    const sectionHeader = headerCells[0];
    const label = (sectionHeader?.textContent || "").replace(/\s+/g, " ").trim();
    const columns = headerCells.slice(1).map((cell) => cell.textContent.replace(/\s+/g, " ").trim());
    const usedRowNames = /* @__PURE__ */ new Set();
    const rows = Array.from(
      table.querySelectorAll(":scope > tbody > tr")
    ).map((tr) => {
      const cells = Array.from(tr.children);
      const rowHeader = cells.find((cell) => cell.matches('th[scope="row"], th')) || cells[0];
      const labelText = rowHeaderLabel(rowHeader);
      return {
        name: uniqueKey(labelText, usedRowNames),
        html: rowHeaderHtml(rowHeader),
        cells: cells.slice(cells.indexOf(rowHeader) + 1).map(cellValueFromTableCell)
      };
    });
    return {
      name: uniqueKey(label, usedGroupNames),
      label,
      labelHtml: sectionHeader ? rowHeaderHtml(sectionHeader) : label,
      columns,
      rows
    };
  });
};

// src/mas-compare-chart.css.js
import { css } from "./lit-all.min.js";
var styles = css`
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
`;

// src/mas-compare-chart.js
var MAS_COMPARE_CHART = "mas-compare-chart";
var MAS_COMPARE_CHART_LOAD_TIMEOUT = 3e4;
var MAX_COMPARE_CHART_CARDS = 4;
var MOBILE_BREAKPOINT = 900;
var DEFAULT_STICKY_OFFSET = 64;
var DEFAULT_MOBILE_STICKY_OFFSET = 40;
var CARD_SOURCE_SLOTS = [
  "icons",
  "header",
  "badge",
  "price",
  "description",
  "detail",
  "cta"
];
var GLYPH_ALIASES = {
  included: ["\u2713", "\u2714", "\u2705"],
  excluded: ["\u2717", "\u2718", "\u2716", "\xD7"],
  notApplicable: ["\u2014", "-"]
};
var isIncluded = (t) => GLYPH_ALIASES.included.includes(t);
var isExcluded = (t) => GLYPH_ALIASES.excluded.includes(t);
var isNotApplicable = (t) => !t || GLYPH_ALIASES.notApplicable.includes(t) || /^-+$/.test(t);
var _internals, _cards, _cardHeaders, _cellsByRow, _rowMeta, _groups, _tableGroups, _rowSlotIndex, _expandedGroupIndices, _resizeObserver, _isMobile, _selectionA, _selectionB, _hydrating, _hydratingFromFragment, _hydrateRaf, _hydrationReady, _resolveHydrationReady, _isStickyHeaderActive, _stickyTopObserver, _stickyBottomObserver, _stickyPastTop, _stickyBeforeBottom, _handleAemLoad, _handleAemError, _handleRehydrate, _handleNestedCardReady, _MasCompareChart_instances, scheduleHydrate_fn, ensureHydrationReady_fn, propagateCardDisplayProperties_fn, fieldValue_fn, fieldValues_fn, referenceEntries_fn, orderedCardReferences_fn, applyChartMarkupAttributes_fn, hydrateFromFragment_fn, runHydrateFromFragment_fn, hydrate_fn, indexCards_fn, extractCardHeader_fn, cloneCtaChildren_fn, stripInlineStyles_fn, indexRows_fn, parseExpanded_fn, serializeExpanded_fn, captureContent_fn, extractTooltipTitle_fn, decorateCell_fn, layoutChip_fn, wrapGlyphs_fn, applyResponsive_fn, visibleCardIds_fn, visibleCardIdList_fn, visibleCardHeaders_fn, enterMobile_fn, clampMobileSelections_fn, exitMobile_fn, applyColumnSelection_fn, setStickyTopOffset_fn, resolveStickyOffsetRaw_fn, resolveMobileStickyOffsetRaw_fn, applyStickyOffset_fn, refreshStickyObservers_fn, teardownStickyObservers_fn, updateStuckState_fn, setStickyHeaderActive_fn, toggleGroup_fn, scrollOpenedGroupToTop_fn, renderHeaderGrid_fn, renderHeaderRow_fn, visibleSlotPresence_fn, renderCardSlot_fn, renderHeaderSegment_fn, renderColumnPicker_fn, renderGroup_fn, syntheticNotApplicableCell_fn, renderRow_fn, renderCell_fn, renderTooltip_fn;
var MasCompareChart = class extends LitElement {
  constructor() {
    super();
    __privateAdd(this, _MasCompareChart_instances);
    __privateAdd(this, _internals);
    __privateAdd(this, _cards, []);
    // canonical column-major order (hydrated merch-card sources)
    __privateAdd(this, _cardHeaders, []);
    // table-rendered header data extracted from merch-card sources
    __privateAdd(this, _cellsByRow, /* @__PURE__ */ new Map());
    // rowSlot -> [{ cardId, col, isCellPrimary, html, ariaLabel }]
    __privateAdd(this, _rowMeta, /* @__PURE__ */ new Map());
    // rowSlot -> { labelHTML, tooltipHTML? }
    __privateAdd(this, _groups, []);
    // [{ heading, groupIndex, rows: [{ slot, rowIndex }] }]
    __privateAdd(this, _tableGroups, []);
    __privateAdd(this, _rowSlotIndex, /* @__PURE__ */ new Map());
    // 'pdf-tools@view' -> { rowIndex, groupIndex }
    __privateAdd(this, _expandedGroupIndices, /* @__PURE__ */ new Set());
    __privateAdd(this, _resizeObserver);
    __privateAdd(this, _isMobile, false);
    __privateAdd(this, _selectionA, 0);
    __privateAdd(this, _selectionB, 1);
    __privateAdd(this, _hydrating, false);
    __privateAdd(this, _hydratingFromFragment, false);
    __privateAdd(this, _hydrateRaf, 0);
    __privateAdd(this, _hydrationReady, null);
    __privateAdd(this, _resolveHydrationReady, null);
    __privateAdd(this, _isStickyHeaderActive, false);
    __privateAdd(this, _stickyTopObserver, null);
    __privateAdd(this, _stickyBottomObserver, null);
    __privateAdd(this, _stickyPastTop, false);
    __privateAdd(this, _stickyBeforeBottom, false);
    /* ---------- hydration ---------- */
    __privateAdd(this, _handleAemLoad, (event) => {
      const source = event.target;
      if (source?.parentElement === this) {
        __privateMethod(this, _MasCompareChart_instances, hydrateFromFragment_fn).call(this, event.detail, source);
        return;
      }
      if (source?.closest?.("merch-card")?.parentElement === this) {
        __privateMethod(this, _MasCompareChart_instances, scheduleHydrate_fn).call(this);
      }
    });
    __privateAdd(this, _handleAemError, (event) => {
      var _a;
      if (event.target?.parentElement === this) {
        __privateSet(this, _groups, []);
        __privateSet(this, _tableGroups, []);
        __privateSet(this, _cardHeaders, []);
        __privateSet(this, _cards, []);
        __privateGet(this, _cellsByRow).clear();
        __privateGet(this, _rowMeta).clear();
        __privateGet(this, _rowSlotIndex).clear();
        __privateSet(this, _expandedGroupIndices, /* @__PURE__ */ new Set());
        this.requestUpdate();
        (_a = __privateGet(this, _resolveHydrationReady)) == null ? void 0 : _a.call(this, false);
        __privateSet(this, _hydrationReady, null);
        __privateSet(this, _resolveHydrationReady, null);
      }
    });
    __privateAdd(this, _handleRehydrate, () => __privateMethod(this, _MasCompareChart_instances, hydrate_fn).call(this));
    __privateAdd(this, _handleNestedCardReady, (event) => {
      if (event.target?.parentElement === this) __privateMethod(this, _MasCompareChart_instances, scheduleHydrate_fn).call(this);
    });
    __privateSet(this, _internals, this.attachInternals?.());
    if (__privateGet(this, _internals)) __privateGet(this, _internals).role = "table";
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener(
      EVENT_COMPARE_CHART_REHYDRATE,
      __privateGet(this, _handleRehydrate)
    );
    this.addEventListener(EVENT_AEM_LOAD, __privateGet(this, _handleAemLoad));
    this.addEventListener(EVENT_AEM_ERROR, __privateGet(this, _handleAemError));
    this.addEventListener(EVENT_MAS_READY, __privateGet(this, _handleNestedCardReady));
    __privateSet(this, _resizeObserver, new ResizeObserver(
      () => __privateMethod(this, _MasCompareChart_instances, applyResponsive_fn).call(this)
    ));
    __privateGet(this, _resizeObserver).observe(this);
    __privateMethod(this, _MasCompareChart_instances, setStickyTopOffset_fn).call(this);
    __privateMethod(this, _MasCompareChart_instances, applyStickyOffset_fn).call(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener(
      EVENT_COMPARE_CHART_REHYDRATE,
      __privateGet(this, _handleRehydrate)
    );
    this.removeEventListener(EVENT_AEM_LOAD, __privateGet(this, _handleAemLoad));
    this.removeEventListener(EVENT_AEM_ERROR, __privateGet(this, _handleAemError));
    this.removeEventListener(EVENT_MAS_READY, __privateGet(this, _handleNestedCardReady));
    __privateGet(this, _resizeObserver)?.disconnect();
    if (__privateGet(this, _hydrateRaf)) {
      cancelAnimationFrame(__privateGet(this, _hydrateRaf));
      __privateSet(this, _hydrateRaf, 0);
    }
    __privateMethod(this, _MasCompareChart_instances, teardownStickyObservers_fn).call(this);
  }
  firstUpdated() {
    __privateMethod(this, _MasCompareChart_instances, hydrate_fn).call(this);
    __privateMethod(this, _MasCompareChart_instances, refreshStickyObservers_fn).call(this);
  }
  willUpdate(changed) {
    if (changed.has("expandedGroups")) __privateMethod(this, _MasCompareChart_instances, parseExpanded_fn).call(this);
  }
  updated(changed) {
    if (changed.has("consonant") || changed.has("spectrum")) {
      __privateMethod(this, _MasCompareChart_instances, propagateCardDisplayProperties_fn).call(this);
    }
    if (changed.has("stickyOffset") || changed.has("mobileStickyOffset") || changed.has("stickyTop") || changed.has("collapsed") || changed.has("nonSticky")) {
      __privateMethod(this, _MasCompareChart_instances, applyStickyOffset_fn).call(this);
      __privateMethod(this, _MasCompareChart_instances, refreshStickyObservers_fn).call(this);
    }
  }
  checkReady() {
    const aemFragment = this.querySelector(":scope > aem-fragment");
    if (!aemFragment) return Promise.resolve(true);
    __privateMethod(this, _MasCompareChart_instances, ensureHydrationReady_fn).call(this);
    const timeoutPromise = new Promise(
      (resolve) => setTimeout(() => resolve(false), MAS_COMPARE_CHART_LOAD_TIMEOUT)
    );
    return Promise.race([__privateGet(this, _hydrationReady), timeoutPromise]);
  }
  /* ---------- render ---------- */
  render() {
    if (this.collapsed) {
      return nothing;
    }
    return html`
            <div
                class="sticky-sentinel sticky-sentinel-top"
                aria-hidden="true"
            ></div>
            <div class="sticky-header-spacer" aria-hidden="true"></div>
            <div class="header-content sticky-header">
                <div class="sticky-header-wrapper">
                    ${__privateMethod(this, _MasCompareChart_instances, renderHeaderGrid_fn).call(this)}
                </div>
            </div>
            <slot name="cards" hidden></slot>
            <div
                class="accessibility-header-row"
                aria-hidden="false"
                role="row"
            >
                ${__privateMethod(this, _MasCompareChart_instances, visibleCardHeaders_fn).call(this).map(
      (c) => html`<span role="columnheader">${c.title}</span>`
    )}
            </div>
            ${repeat(
      __privateGet(this, _groups),
      (g, i) => `${g.groupIndex}:${i}`,
      (g) => __privateMethod(this, _MasCompareChart_instances, renderGroup_fn).call(this, g)
    )}
            <div
                class="sticky-sentinel sticky-sentinel-bottom"
                aria-hidden="true"
            ></div>
        `;
  }
};
_internals = new WeakMap();
_cards = new WeakMap();
_cardHeaders = new WeakMap();
_cellsByRow = new WeakMap();
_rowMeta = new WeakMap();
_groups = new WeakMap();
_tableGroups = new WeakMap();
_rowSlotIndex = new WeakMap();
_expandedGroupIndices = new WeakMap();
_resizeObserver = new WeakMap();
_isMobile = new WeakMap();
_selectionA = new WeakMap();
_selectionB = new WeakMap();
_hydrating = new WeakMap();
_hydratingFromFragment = new WeakMap();
_hydrateRaf = new WeakMap();
_hydrationReady = new WeakMap();
_resolveHydrationReady = new WeakMap();
_isStickyHeaderActive = new WeakMap();
_stickyTopObserver = new WeakMap();
_stickyBottomObserver = new WeakMap();
_stickyPastTop = new WeakMap();
_stickyBeforeBottom = new WeakMap();
_handleAemLoad = new WeakMap();
_handleAemError = new WeakMap();
_handleRehydrate = new WeakMap();
_handleNestedCardReady = new WeakMap();
_MasCompareChart_instances = new WeakSet();
// Card-ready events arrive one per card across separate microtasks; coalesce
// them into a single rebuild per frame instead of N full re-indexes.
scheduleHydrate_fn = function() {
  if (__privateGet(this, _hydrateRaf)) return;
  __privateSet(this, _hydrateRaf, requestAnimationFrame(() => {
    __privateSet(this, _hydrateRaf, 0);
    __privateMethod(this, _MasCompareChart_instances, hydrate_fn).call(this);
  }));
};
ensureHydrationReady_fn = function() {
  if (__privateGet(this, _hydrationReady)) return;
  __privateSet(this, _hydrationReady, new Promise((resolve) => {
    __privateSet(this, _resolveHydrationReady, resolve);
  }));
};
propagateCardDisplayProperties_fn = function(cards = __privateGet(this, _cards)) {
  cards.forEach((card) => {
    card.consonant = this.consonant;
    card.toggleAttribute("consonant", Boolean(this.consonant));
    if (this.spectrum) {
      card.spectrum = this.spectrum;
      card.setAttribute("spectrum", this.spectrum);
    } else {
      card.removeAttribute("spectrum");
    }
  });
};
fieldValue_fn = function(fragment, name) {
  const fields = fragment?.fields || {};
  if (Array.isArray(fields)) {
    const field = fields.find((item) => item.name === name);
    return field?.multiple ? field.values || [] : field?.values?.[0] || "";
  }
  const value = fields[name];
  if (Array.isArray(value)) return value[0] || "";
  return value?.value ?? value ?? "";
};
fieldValues_fn = function(fragment, name) {
  const fields = fragment?.fields || {};
  if (Array.isArray(fields)) {
    return fields.find((item) => item.name === name)?.values || [];
  }
  const value = fields[name];
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [value?.value ?? value];
};
referenceEntries_fn = function(fragment) {
  const refs = fragment?.references || {};
  if (Array.isArray(refs)) {
    return refs.map((ref) => ({
      identifier: ref.identifier || ref.id || ref.path,
      value: ref.value || ref
    })).filter((ref) => ref.value);
  }
  return Object.entries(refs).map(([identifier, ref]) => ({
    identifier,
    value: ref?.value || ref
  })).filter((ref) => ref.value);
};
orderedCardReferences_fn = function(fragment) {
  const entries = __privateMethod(this, _MasCompareChart_instances, referenceEntries_fn).call(this, fragment);
  const byReference = (reference) => entries.find(
    ({ identifier, value }) => identifier === reference || value.id === reference || value.path === reference
  )?.value;
  const orderedReferences = __privateMethod(this, _MasCompareChart_instances, fieldValues_fn).call(this, fragment, "cards").map(byReference).filter(Boolean);
  if (orderedReferences.length) {
    return orderedReferences.slice(0, MAX_COMPARE_CHART_CARDS);
  }
  const treeReferences = (fragment.referencesTree || []).filter((reference) => reference.fieldName === "cards").map((reference) => byReference(reference.identifier)).filter(Boolean);
  if (treeReferences.length) {
    return treeReferences.slice(0, MAX_COMPARE_CHART_CARDS);
  }
  return entries.map(({ value }) => value).filter((ref) => ref?.fields).slice(0, MAX_COMPARE_CHART_CARDS);
};
applyChartMarkupAttributes_fn = function(table) {
  if (!table?.getAttributeNames) return;
  for (const name of table.getAttributeNames()) {
    const value = table.getAttribute(name);
    if (value == null) this.removeAttribute(name);
    else this.setAttribute(name, value);
  }
};
hydrateFromFragment_fn = async function(fragment, sourceAemFragment) {
  if (!fragment) return;
  if (__privateGet(this, _hydratingFromFragment)) return;
  __privateSet(this, _hydratingFromFragment, true);
  try {
    await __privateMethod(this, _MasCompareChart_instances, runHydrateFromFragment_fn).call(this, fragment, sourceAemFragment);
  } finally {
    __privateSet(this, _hydratingFromFragment, false);
  }
};
runHydrateFromFragment_fn = async function(fragment, sourceAemFragment) {
  var _a;
  __privateMethod(this, _MasCompareChart_instances, ensureHydrationReady_fn).call(this);
  this.querySelectorAll("[data-compare-chart-generated]").forEach(
    (node) => node.remove()
  );
  const parser = new DOMParser();
  const chartMarkup = __privateMethod(this, _MasCompareChart_instances, fieldValue_fn).call(this, fragment, "compareChart");
  const doc = parser.parseFromString(chartMarkup || "", "text/html");
  const table = doc.body.querySelector("mas-compare-chart") || doc.body;
  __privateMethod(this, _MasCompareChart_instances, applyChartMarkupAttributes_fn).call(this, table);
  table.querySelectorAll(":scope > div[name]").forEach((group) => {
    const clone = group.cloneNode(true);
    clone.dataset.compareChartGenerated = "true";
    this.append(clone);
  });
  const author = sourceAemFragment?.hasAttribute("author");
  const cardReferences = __privateMethod(this, _MasCompareChart_instances, orderedCardReferences_fn).call(this, fragment);
  const cards = [];
  cardReferences.forEach((cardFragment) => {
    sourceAemFragment?.cache?.add(cardFragment);
    const card = document.createElement("merch-card");
    card.setAttribute("slot", "cards");
    card.dataset.compareChartGenerated = "true";
    __privateMethod(this, _MasCompareChart_instances, propagateCardDisplayProperties_fn).call(this, [card]);
    const aemFragment = document.createElement("aem-fragment");
    aemFragment.setAttribute("fragment", cardFragment.id);
    if (author) aemFragment.setAttribute("author", "");
    aemFragment.setAttribute("loading", "cache");
    card.append(aemFragment);
    this.append(card);
    cards.push(card);
  });
  await Promise.all(
    cards.map((card) => card.checkReady?.().catch(() => false))
  );
  __privateMethod(this, _MasCompareChart_instances, hydrate_fn).call(this);
  (_a = __privateGet(this, _resolveHydrationReady)) == null ? void 0 : _a.call(this, true);
  __privateSet(this, _hydrationReady, null);
  __privateSet(this, _resolveHydrationReady, null);
};
hydrate_fn = function() {
  if (__privateGet(this, _hydrating)) return;
  __privateSet(this, _hydrating, true);
  try {
    __privateMethod(this, _MasCompareChart_instances, indexCards_fn).call(this);
    __privateMethod(this, _MasCompareChart_instances, indexRows_fn).call(this);
    __privateMethod(this, _MasCompareChart_instances, parseExpanded_fn).call(this);
    __privateMethod(this, _MasCompareChart_instances, captureContent_fn).call(this);
    __privateMethod(this, _MasCompareChart_instances, applyResponsive_fn).call(this);
    this.requestUpdate();
  } finally {
    __privateSet(this, _hydrating, false);
  }
};
indexCards_fn = function() {
  const sourceCards = Array.from(
    this.querySelectorAll(':scope > merch-card[slot="cards"]')
  ).slice(0, MAX_COMPARE_CHART_CARDS);
  this.querySelectorAll(":scope > [data-compare-chart-slot]").forEach(
    (node) => node.remove()
  );
  const cardHeaders = [];
  sourceCards.forEach((sourceCard, i) => {
    const cardId = `card-${i + 1}`;
    sourceCard.dataset.cardId = cardId;
    sourceCard.dataset.columnIndex = String(i + 1);
    sourceCard.style.setProperty("--col", i + 1);
    const cellColor = sourceCard.getAttribute("cell-color") ?? "default";
    cardHeaders.push(
      __privateMethod(this, _MasCompareChart_instances, extractCardHeader_fn).call(this, sourceCard, cardId, i, cellColor)
    );
  });
  __privateSet(this, _cards, sourceCards);
  __privateSet(this, _cardHeaders, cardHeaders);
  this.setAttribute("data-child-count", String(sourceCards.length));
  this.style.setProperty("--compare-chart-cols", sourceCards.length);
};
extractCardHeader_fn = function(sourceCard, cardId, index, cellColor) {
  const slots = {};
  const presentSlots = /* @__PURE__ */ new Set();
  for (const sourceSlot of CARD_SOURCE_SLOTS) {
    const targetSlot = `${cardId}-${sourceSlot}`;
    slots[sourceSlot] = targetSlot;
    if (!sourceCard) continue;
    const children = Array.from(
      sourceCard.querySelectorAll(`:scope > [slot="${sourceSlot}"]`)
    );
    if (children.length) presentSlots.add(sourceSlot);
    for (const child of children) {
      if (sourceSlot === "cta") {
        __privateMethod(this, _MasCompareChart_instances, cloneCtaChildren_fn).call(this, child, targetSlot);
        continue;
      }
      const clone = child.cloneNode(true);
      clone.setAttribute("slot", targetSlot);
      clone.toggleAttribute("data-compare-chart-slot", true);
      __privateMethod(this, _MasCompareChart_instances, stripInlineStyles_fn).call(this, clone);
      this.appendChild(clone);
    }
  }
  if (sourceCard) {
    sourceCard.hidden = true;
    sourceCard.setAttribute("aria-hidden", "true");
    sourceCard.dataset.cellColor = cellColor;
  }
  const title = Array.from(
    this.querySelectorAll(`:scope > [slot="${slots.header}"]`)
  ).map((el) => el.textContent.trim()).filter(Boolean).join(" ");
  return {
    cardId,
    col: index + 1,
    cellColor,
    slots,
    presentSlots,
    title: title || `Card ${index + 1}`
  };
};
cloneCtaChildren_fn = function(root, targetSlot) {
  const actions = root.matches("a,button") ? [root] : Array.from(root.querySelectorAll("a,button"));
  if (!actions.length) {
    const clone = root.cloneNode(true);
    clone.setAttribute("slot", targetSlot);
    clone.toggleAttribute("data-compare-chart-slot", true);
    __privateMethod(this, _MasCompareChart_instances, stripInlineStyles_fn).call(this, clone);
    this.appendChild(clone);
    return;
  }
  for (const action of actions) {
    const clone = action.cloneNode(true);
    clone.setAttribute("slot", targetSlot);
    clone.toggleAttribute("data-compare-chart-slot", true);
    __privateMethod(this, _MasCompareChart_instances, stripInlineStyles_fn).call(this, clone);
    this.appendChild(clone);
  }
};
stripInlineStyles_fn = function(root) {
  root.removeAttribute("style");
  root.querySelectorAll("[style]").forEach(
    (el) => el.removeAttribute("style")
  );
};
indexRows_fn = function() {
  __privateSet(this, _groups, []);
  __privateSet(this, _tableGroups, parseCompareChartTables(this));
  __privateGet(this, _rowSlotIndex).clear();
  let rowIndex = 1;
  Array.from(this.querySelectorAll(":scope > div[name]")).forEach(
    (groupDiv, gi) => {
      const groupKey = groupDiv.getAttribute("name");
      const heading = groupDiv.querySelector(":scope > h4")?.textContent.trim() ?? "";
      const groupIndex = gi + 1;
      const group = { heading, groupIndex, groupKey, rows: [] };
      __privateGet(this, _groups).push(group);
      const lastByFeature = /* @__PURE__ */ new Map();
      groupDiv.querySelectorAll(":scope > p[name]").forEach((p) => {
        lastByFeature.set(p.getAttribute("name"), p);
      });
      lastByFeature.forEach((p, featureKey) => {
        const key = `${groupKey}@${featureKey}`;
        rowIndex++;
        group.rows.push({ slot: key, rowIndex });
        __privateGet(this, _rowSlotIndex).set(key, { rowIndex, groupIndex });
      });
    }
  );
  __privateGet(this, _tableGroups).forEach((tableGroup) => {
    const groupIndex = __privateGet(this, _groups).length + 1;
    const group = {
      heading: tableGroup.label,
      groupIndex,
      groupKey: tableGroup.name,
      rows: []
    };
    __privateGet(this, _groups).push(group);
    tableGroup.rows.forEach((row) => {
      const key = `${tableGroup.name}@${row.name}`;
      rowIndex++;
      group.rows.push({ slot: key, rowIndex });
      __privateGet(this, _rowSlotIndex).set(key, { rowIndex, groupIndex });
    });
  });
};
parseExpanded_fn = function() {
  const v = (this.expandedGroups ?? "").trim();
  const total = __privateGet(this, _groups).length;
  __privateSet(this, _expandedGroupIndices, /* @__PURE__ */ new Set());
  if (!v) {
    if (total > 0) __privateGet(this, _expandedGroupIndices).add(1);
  } else if (v === "all") {
    for (let i = 1; i <= total; i += 1) {
      __privateGet(this, _expandedGroupIndices).add(i);
    }
  } else if (v === "none") {
    return;
  } else {
    v.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n >= 1 && n <= total).forEach((n) => __privateGet(this, _expandedGroupIndices).add(n));
  }
};
serializeExpanded_fn = function() {
  const total = __privateGet(this, _groups).length;
  if (!__privateGet(this, _expandedGroupIndices).size) return "none";
  if (total && __privateGet(this, _expandedGroupIndices).size === total) return "all";
  return [...__privateGet(this, _expandedGroupIndices)].sort((a, b) => a - b).join(",");
};
/**
 * One-shot capture: read every authored row label / tooltip / cell out
 * of the light DOM into JS-side maps.
 * The shadow renderer consumes these maps directly — no per-row named
 * slots, no light-DOM <-> shadow projection thrash.
 */
captureContent_fn = function() {
  __privateGet(this, _rowMeta).clear();
  __privateGet(this, _cellsByRow).clear();
  Array.from(this.querySelectorAll(":scope > div[name]")).forEach(
    (groupDiv) => {
      const groupKey = groupDiv.getAttribute("name");
      const lastByFeature = /* @__PURE__ */ new Map();
      groupDiv.querySelectorAll(":scope > p[name]").forEach((p) => {
        lastByFeature.set(p.getAttribute("name"), p);
      });
      lastByFeature.forEach((p, featureKey) => {
        const key = `${groupKey}@${featureKey}`;
        const clone = p.cloneNode(true);
        const title = __privateMethod(this, _MasCompareChart_instances, extractTooltipTitle_fn).call(this, clone);
        __privateGet(this, _rowMeta).set(key, {
          labelHTML: clone.innerHTML,
          title,
          tooltipPosition: p.getAttribute("data-tooltip-position") ?? "top-center",
          isItemRow: p.hasAttribute("item")
        });
      });
    }
  );
  Array.from(
    this.querySelectorAll(':scope > merch-card[slot="cards"]')
  ).forEach((card) => {
    const cardId = card.dataset.cardId;
    const col = parseInt(card.dataset.columnIndex, 10);
    const lastByKey = /* @__PURE__ */ new Map();
    card.querySelectorAll(
      ':scope > p[name], :scope > [slot="features"] p[name]'
    ).forEach((p) => {
      const key = p.getAttribute("name");
      if (!key || !key.includes("@")) return;
      lastByKey.set(key, p);
    });
    for (const [key, source] of lastByKey) {
      if (!__privateGet(this, _rowSlotIndex).has(key)) {
        continue;
      }
      const p = source.cloneNode(true);
      const isEmojiPrimary = p.textContent.includes("\u2705");
      const cellPrimary = p.hasAttribute("primary");
      if (cellPrimary) p.classList.add("primary-cell");
      if (isEmojiPrimary) p.classList.add("emoji-primary-cell");
      const isItem = p.hasAttribute("item");
      if (isItem) p.classList.add("item-cell");
      const cellTitle = __privateMethod(this, _MasCompareChart_instances, extractTooltipTitle_fn).call(this, p);
      __privateMethod(this, _MasCompareChart_instances, decorateCell_fn).call(this, p);
      const arr = __privateGet(this, _cellsByRow).get(key) ?? [];
      arr.push({
        cardId,
        col,
        isCellPrimary: cellPrimary,
        isEmojiPrimary,
        isItem,
        title: cellTitle,
        tooltipPosition: p.getAttribute("data-tooltip-position") ?? "top-center",
        html: p.innerHTML,
        ariaLabel: p.getAttribute("aria-label")
      });
      __privateGet(this, _cellsByRow).set(key, arr);
    }
  });
  for (const tableGroup of __privateGet(this, _tableGroups)) {
    tableGroup.rows.forEach((row) => {
      const key = `${tableGroup.name}@${row.name}`;
      __privateGet(this, _rowMeta).set(key, {
        labelHTML: row.html,
        title: void 0,
        tooltipPosition: "top-center",
        isItemRow: false
      });
      const cells = row.cells.map((value, index) => {
        const p = document.createElement("p");
        p.innerHTML = value;
        __privateMethod(this, _MasCompareChart_instances, decorateCell_fn).call(this, p);
        return {
          cardId: __privateGet(this, _cards)[index]?.dataset.cardId,
          col: index + 1,
          isCellPrimary: false,
          isEmojiPrimary: value.includes("\u2705"),
          isItem: false,
          title: void 0,
          tooltipPosition: "top-center",
          html: p.innerHTML,
          ariaLabel: p.getAttribute("aria-label")
        };
      }).filter((cell) => cell.cardId);
      __privateGet(this, _cellsByRow).set(key, cells);
    });
  }
};
extractTooltipTitle_fn = function(p) {
  const tooltipLink = p.querySelector(":scope > a.secondary-link[title]");
  const title = tooltipLink?.getAttribute("title") || p.getAttribute("title") || void 0;
  tooltipLink?.remove();
  if (title) p.removeAttribute("title");
  return title;
};
decorateCell_fn = function(p) {
  const text = p.textContent.trim();
  if (isIncluded(text)) {
    p.setAttribute(
      "aria-label",
      this.getAttribute("included-text") ?? "Included"
    );
    __privateMethod(this, _MasCompareChart_instances, wrapGlyphs_fn).call(this, p);
  } else if (isExcluded(text)) {
    p.setAttribute(
      "aria-label",
      this.getAttribute("not-included-text") ?? "Not included"
    );
    __privateMethod(this, _MasCompareChart_instances, wrapGlyphs_fn).call(this, p);
  } else if (isNotApplicable(text)) {
    p.setAttribute(
      "aria-label",
      this.getAttribute("not-applicable-text") ?? "Not applicable"
    );
    if (!text) {
      const sr = document.createElement("span");
      sr.className = "empty-cell-sr";
      sr.textContent = this.getAttribute("sr-only-not-applicable-text") ?? this.getAttribute("not-applicable-text") ?? "Not applicable";
      p.textContent = "\u2014";
      const glyph = document.createElement("span");
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = "\u2014";
      p.replaceChildren(glyph, sr);
    }
  } else {
    p.removeAttribute("aria-label");
    __privateMethod(this, _MasCompareChart_instances, wrapGlyphs_fn).call(this, p);
  }
  __privateMethod(this, _MasCompareChart_instances, layoutChip_fn).call(this, p);
};
/**
 * Visually splits the cell into a bordered "chip" containing the glyph
 * (and any inline non-`<small>` content) plus caption text rendered
 * below the chip. Implemented by wrapping the chip portion in a
 * `<span class="compare-chart-chip">` so the cell `<p>` itself can be a
 * borderless flex column.
 */
layoutChip_fn = function(p) {
  if (p.classList.contains("item-cell")) {
    return;
  }
  const chip = document.createElement("span");
  chip.className = "compare-chart-chip";
  const nodes = Array.from(p.childNodes);
  for (const n of nodes) {
    if (n.nodeType === Node.ELEMENT_NODE && n.tagName === "SMALL") {
      break;
    }
    chip.appendChild(n);
  }
  p.insertBefore(chip, p.firstChild);
};
wrapGlyphs_fn = function(p) {
  const all = [
    ...GLYPH_ALIASES.included,
    ...GLYPH_ALIASES.excluded,
    ...GLYPH_ALIASES.notApplicable
  ];
  const isPrimary = p.classList.contains("primary-cell");
  Array.from(p.childNodes).forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return;
    const t = node.textContent;
    if (!all.some((g) => t.includes(g))) return;
    const frag = document.createDocumentFragment();
    for (const ch of t) {
      if (all.includes(ch)) {
        const span = document.createElement("span");
        span.setAttribute("aria-hidden", "true");
        span.classList.add("compare-chart-glyph");
        span.textContent = ch === "\u2705" ? "\u2713" : ch;
        if (GLYPH_ALIASES.included.includes(ch))
          span.classList.add("included");
        if (GLYPH_ALIASES.excluded.includes(ch))
          span.classList.add("excluded");
        if (isPrimary || ch === "\u2705") span.classList.add("primary");
        frag.appendChild(span);
      } else {
        frag.appendChild(document.createTextNode(ch));
      }
    }
    node.replaceWith(frag);
  });
};
/* ---------- responsive ---------- */
applyResponsive_fn = function() {
  const w = this.getBoundingClientRect().width || this.offsetWidth || window.innerWidth;
  const isMobile = w > 0 && w < MOBILE_BREAKPOINT;
  const changed = isMobile !== __privateGet(this, _isMobile);
  __privateSet(this, _isMobile, isMobile);
  this.toggleAttribute("data-mobile", isMobile);
  if (isMobile) __privateMethod(this, _MasCompareChart_instances, enterMobile_fn).call(this);
  else __privateMethod(this, _MasCompareChart_instances, exitMobile_fn).call(this);
  __privateMethod(this, _MasCompareChart_instances, setStickyTopOffset_fn).call(this);
  __privateMethod(this, _MasCompareChart_instances, applyStickyOffset_fn).call(this);
  __privateMethod(this, _MasCompareChart_instances, refreshStickyObservers_fn).call(this);
  if (changed) this.requestUpdate();
};
visibleCardIds_fn = function() {
  return new Set(__privateMethod(this, _MasCompareChart_instances, visibleCardIdList_fn).call(this));
};
visibleCardIdList_fn = function() {
  if (!__privateGet(this, _isMobile) || __privateGet(this, _cards).length <= 2) {
    return __privateGet(this, _cards).map((w) => w.dataset.cardId);
  }
  return [__privateGet(this, _cards)[__privateGet(this, _selectionA)], __privateGet(this, _cards)[__privateGet(this, _selectionB)]].filter(Boolean).map((w) => w.dataset.cardId);
};
visibleCardHeaders_fn = function() {
  return __privateMethod(this, _MasCompareChart_instances, visibleCardIdList_fn).call(this).map(
    (cardId) => __privateGet(this, _cardHeaders).find((card) => card.cardId === cardId)
  ).filter(Boolean);
};
enterMobile_fn = function() {
  this.style.setProperty("--compare-chart-cols", 2);
  const n = __privateGet(this, _cards).length;
  if (n <= 2) return;
  __privateMethod(this, _MasCompareChart_instances, clampMobileSelections_fn).call(this);
};
clampMobileSelections_fn = function() {
  const n = __privateGet(this, _cards).length;
  if (n <= 2) return;
  if (__privateGet(this, _selectionA) >= n) __privateSet(this, _selectionA, 0);
  if (__privateGet(this, _selectionB) >= n) __privateSet(this, _selectionB, Math.min(1, n - 1));
  if (__privateGet(this, _selectionA) === __privateGet(this, _selectionB)) {
    __privateSet(this, _selectionB, (__privateGet(this, _selectionA) + 1) % n);
  }
};
exitMobile_fn = function() {
  this.style.setProperty("--compare-chart-cols", __privateGet(this, _cards).length);
};
applyColumnSelection_fn = function(side, idx) {
  if (side === "A") {
    if (idx === __privateGet(this, _selectionB)) __privateSet(this, _selectionB, __privateGet(this, _selectionA));
    __privateSet(this, _selectionA, idx);
  } else {
    if (idx === __privateGet(this, _selectionA)) __privateSet(this, _selectionA, __privateGet(this, _selectionB));
    __privateSet(this, _selectionB, idx);
  }
  __privateMethod(this, _MasCompareChart_instances, enterMobile_fn).call(this);
  this.requestUpdate();
};
/* ---------- sticky ---------- */
setStickyTopOffset_fn = function() {
  if (__privateGet(this, _isMobile)) {
    this.style.setProperty("--compare-chart-sticky-top", "0px");
    return;
  }
};
resolveStickyOffsetRaw_fn = function() {
  return this.stickyOffset ?? this.getAttribute("sticky-offset") ?? this.stickyTop ?? this.getAttribute("sticky-top");
};
resolveMobileStickyOffsetRaw_fn = function() {
  return this.mobileStickyOffset ?? this.getAttribute("mobile-sticky-offset");
};
applyStickyOffset_fn = function() {
  const raw = __privateGet(this, _isMobile) ? __privateMethod(this, _MasCompareChart_instances, resolveMobileStickyOffsetRaw_fn).call(this) : __privateMethod(this, _MasCompareChart_instances, resolveStickyOffsetRaw_fn).call(this);
  const fallback = __privateGet(this, _isMobile) ? DEFAULT_MOBILE_STICKY_OFFSET : DEFAULT_STICKY_OFFSET;
  const trimmed = raw != null ? String(raw).trim() : "";
  const offset = trimmed ? /^\d+$/.test(trimmed) ? `${trimmed}px` : trimmed : `${fallback}px`;
  this.style.setProperty("--compare-chart-sticky-offset", offset);
};
refreshStickyObservers_fn = function() {
  __privateMethod(this, _MasCompareChart_instances, teardownStickyObservers_fn).call(this);
  if (this.nonSticky || this.collapsed || !this.isConnected) return;
  const sr = this.shadowRoot;
  const headerContent = sr?.querySelector(".header-content");
  const topSentinel = sr?.querySelector(".sticky-sentinel-top");
  const bottomSentinel = sr?.querySelector(".sticky-sentinel-bottom");
  if (!headerContent || !topSentinel || !bottomSentinel) return;
  const top = parseFloat(getComputedStyle(headerContent).top) || 0;
  const headerHeight = headerContent.getBoundingClientRect().height;
  __privateSet(this, _stickyTopObserver, new IntersectionObserver(
    ([entry]) => {
      __privateSet(this, _stickyPastTop, entry.boundingClientRect.bottom <= top);
      __privateMethod(this, _MasCompareChart_instances, updateStuckState_fn).call(this);
    },
    { threshold: [0], rootMargin: `${-top}px 0px 0px 0px` }
  ));
  __privateGet(this, _stickyTopObserver).observe(topSentinel);
  __privateSet(this, _stickyBottomObserver, new IntersectionObserver(
    ([entry]) => {
      __privateSet(this, _stickyBeforeBottom, entry.boundingClientRect.top > top + headerHeight);
      __privateMethod(this, _MasCompareChart_instances, updateStuckState_fn).call(this);
    },
    {
      threshold: [0],
      rootMargin: `${-(top + headerHeight)}px 0px 0px 0px`
    }
  ));
  __privateGet(this, _stickyBottomObserver).observe(bottomSentinel);
};
teardownStickyObservers_fn = function() {
  __privateGet(this, _stickyTopObserver)?.disconnect();
  __privateGet(this, _stickyBottomObserver)?.disconnect();
  __privateSet(this, _stickyTopObserver, null);
  __privateSet(this, _stickyBottomObserver, null);
};
updateStuckState_fn = function() {
  __privateMethod(this, _MasCompareChart_instances, setStickyHeaderActive_fn).call(this, __privateGet(this, _stickyPastTop) && __privateGet(this, _stickyBeforeBottom));
};
setStickyHeaderActive_fn = function(active) {
  const headerContent = this.shadowRoot?.querySelector(".header-content");
  if (active === __privateGet(this, _isStickyHeaderActive)) return;
  if (active) {
    const headerHeight = headerContent?.getBoundingClientRect().height ?? 0;
    this.style.setProperty(
      "--compare-chart-sticky-spacer-height",
      `${headerHeight}px`
    );
  } else {
    this.style.removeProperty("--compare-chart-sticky-spacer-height");
  }
  __privateSet(this, _isStickyHeaderActive, active);
  this.toggleAttribute("data-sticky-header", active);
  headerContent?.classList.toggle("sticky", active);
  headerContent?.classList.toggle("is-stuck", active);
};
/* ---------- accordion ---------- */
toggleGroup_fn = function(groupIndex) {
  let opened = false;
  if (__privateGet(this, _expandedGroupIndices).has(groupIndex)) {
    __privateGet(this, _expandedGroupIndices).delete(groupIndex);
  } else {
    __privateSet(this, _expandedGroupIndices, /* @__PURE__ */ new Set([groupIndex]));
    opened = true;
  }
  this.expandedGroups = __privateMethod(this, _MasCompareChart_instances, serializeExpanded_fn).call(this);
  this.dispatchEvent(
    new CustomEvent(EVENT_EXPANDED_GROUPS_CHANGE, {
      detail: { value: this.expandedGroups },
      bubbles: true,
      composed: true
    })
  );
  this.requestUpdate();
  if (opened) {
    void this.updateComplete.then(
      () => __privateMethod(this, _MasCompareChart_instances, scrollOpenedGroupToTop_fn).call(this, groupIndex)
    );
  }
};
/** Scroll the opened accordion section to the top of the scrollport, below sticky chrome. */
scrollOpenedGroupToTop_fn = function(groupIndex) {
  if (this.collapsed) return;
  const container = this.shadowRoot?.querySelector(
    `.table-container[data-group-index="${String(groupIndex)}"]`
  );
  if (!container) return;
  const headerBand = this.shadowRoot?.querySelector(".header-content");
  const cs = getComputedStyle(this);
  const stickyTop = parseFloat(cs.getPropertyValue("--compare-chart-sticky-top")) || 0;
  const offsetRaw = cs.getPropertyValue("--compare-chart-sticky-offset").trim();
  const stickyOffset = offsetRaw ? parseFloat(offsetRaw) || 0 : 0;
  const headerH = headerBand?.getBoundingClientRect().height ?? 0;
  const margin = stickyTop + stickyOffset + headerH;
  const prevMargin = container.style.scrollMarginTop;
  container.style.scrollMarginTop = `${margin}px`;
  container.scrollIntoView({ block: "start", behavior: "smooth" });
  requestAnimationFrame(() => {
    container.style.scrollMarginTop = prevMargin;
  });
};
renderHeaderGrid_fn = function() {
  const cards = __privateMethod(this, _MasCompareChart_instances, visibleCardHeaders_fn).call(this);
  const visibleSlots = __privateMethod(this, _MasCompareChart_instances, visibleSlotPresence_fn).call(this, cards);
  let row = 1;
  return html`
            ${__privateMethod(this, _MasCompareChart_instances, renderHeaderRow_fn).call(this, cards, "header", row++, visibleSlots)}
            ${visibleSlots.has("price") ? __privateMethod(this, _MasCompareChart_instances, renderHeaderRow_fn).call(this, cards, "price", row++, visibleSlots) : nothing}
            ${visibleSlots.has("description") ? __privateMethod(this, _MasCompareChart_instances, renderHeaderRow_fn).call(this, cards, "description", row++, visibleSlots) : nothing}
            ${visibleSlots.has("detail") ? __privateMethod(this, _MasCompareChart_instances, renderHeaderRow_fn).call(this, cards, "detail", row++, visibleSlots) : nothing}
            ${visibleSlots.has("cta") ? __privateMethod(this, _MasCompareChart_instances, renderHeaderRow_fn).call(this, cards, "cta", row++, visibleSlots) : nothing}
        `;
};
renderHeaderRow_fn = function(cards, segment, row, visibleSlots) {
  return html`
            <div
                class="header-leading header-leading-${segment}"
                style="--row: ${row};"
            ></div>
            ${cards.map(
    (card, i) => __privateMethod(this, _MasCompareChart_instances, renderHeaderSegment_fn).call(this, card, segment, i + 1, i, row, visibleSlots)
  )}
        `;
};
visibleSlotPresence_fn = function(cards) {
  const visibleSlots = /* @__PURE__ */ new Set();
  for (const card of cards) {
    for (const slotName of card.presentSlots) {
      visibleSlots.add(slotName);
    }
  }
  return visibleSlots;
};
renderCardSlot_fn = function(card, sourceSlot, visibleSlots) {
  if (!visibleSlots.has(sourceSlot)) return nothing;
  return html`<slot name=${card.slots[sourceSlot]}></slot>`;
};
renderHeaderSegment_fn = function(card, segment, visibleCol, visibleIndex, row, visibleSlots) {
  const classes = ["header-card-segment", `${segment}-segment`];
  const dataCellColor = card.cellColor;
  return html`<div
            class=${classes.join(" ")}
            data-card-id=${card.cardId}
            data-card-index=${card.col - 1}
            data-cell-color=${dataCellColor}
            style="--col: ${visibleCol}; --row: ${row};"
        >
            ${segment === "header" ? html`
                      ${__privateMethod(this, _MasCompareChart_instances, renderCardSlot_fn).call(this, card, "icons", visibleSlots)}
                      ${__privateMethod(this, _MasCompareChart_instances, renderCardSlot_fn).call(this, card, "header", visibleSlots)}
                      ${__privateMethod(this, _MasCompareChart_instances, renderCardSlot_fn).call(this, card, "badge", visibleSlots)}
                      ${__privateMethod(this, _MasCompareChart_instances, renderColumnPicker_fn).call(this, card, visibleIndex)}
                  ` : nothing}
            ${segment === "price" ? __privateMethod(this, _MasCompareChart_instances, renderCardSlot_fn).call(this, card, "price", visibleSlots) : nothing}
            ${segment === "description" ? __privateMethod(this, _MasCompareChart_instances, renderCardSlot_fn).call(this, card, "description", visibleSlots) : nothing}
            ${segment === "detail" ? __privateMethod(this, _MasCompareChart_instances, renderCardSlot_fn).call(this, card, "detail", visibleSlots) : nothing}
            ${segment === "cta" ? __privateMethod(this, _MasCompareChart_instances, renderCardSlot_fn).call(this, card, "cta", visibleSlots) : nothing}
        </div>`;
};
renderColumnPicker_fn = function(card, visibleIndex) {
  if (!__privateGet(this, _isMobile) || __privateGet(this, _cardHeaders).length <= 2) return nothing;
  const selectedIdx = __privateGet(this, _cardHeaders).findIndex(
    (header) => header.cardId === card.cardId
  );
  const side = visibleIndex === 0 ? "A" : "B";
  const otherIdx = side === "A" ? __privateGet(this, _selectionB) : __privateGet(this, _selectionA);
  return html`<select
            class="mobile-filter-select"
            name="column-filter"
            aria-label=${this.getAttribute("choose-table-column-text") ?? "Choose column"}
            .value=${String(selectedIdx)}
            @change=${(event) => __privateMethod(this, _MasCompareChart_instances, applyColumnSelection_fn).call(this, side, parseInt(event.target.value, 10))}
        >
            ${__privateGet(this, _cardHeaders).map((header, index) => {
    if (index === otherIdx) return nothing;
    return html`<option
                    value=${index}
                    ?selected=${index === selectedIdx}
                >
                    ${header.title}
                </option>`;
  })}
        </select>`;
};
renderGroup_fn = function(g) {
  const expanded = __privateGet(this, _expandedGroupIndices).has(g.groupIndex);
  return html`
            <div class="table-container" data-group-index=${g.groupIndex}>
                <button
                    class="table-column-header"
                    aria-expanded=${expanded}
                    aria-controls="g-${g.groupIndex}"
                    @click=${() => __privateMethod(this, _MasCompareChart_instances, toggleGroup_fn).call(this, g.groupIndex)}
                >
                    <span class="group-title">${g.heading}</span>
                    <span
                        class="toggle-icon ${expanded ? "is-expanded" : ""}"
                        aria-hidden="true"
                    ></span>
                </button>
                <div
                    id="g-${g.groupIndex}"
                    class="table-body ${expanded ? "" : "hide"}"
                    role="rowgroup"
                    aria-label=${g.heading}
                >
                    ${repeat(
    g.rows,
    (r, i) => `${r.slot}:${i}`,
    (r) => __privateMethod(this, _MasCompareChart_instances, renderRow_fn).call(this, r)
  )}
                </div>
            </div>
        `;
};
/** When column card fragments omit `features`, still render a full row grid. */
syntheticNotApplicableCell_fn = function(cardId, col) {
  return {
    cardId,
    col,
    isCellPrimary: false,
    isEmojiPrimary: false,
    isItem: false,
    title: void 0,
    tooltipPosition: "top-center",
    html: '<span class="compare-chart-chip"><span class="compare-chart-glyph" aria-hidden="true">\u2014</span></span>',
    ariaLabel: this.getAttribute("not-applicable-text") ?? "Not applicable"
  };
};
renderRow_fn = function(r) {
  const meta = __privateGet(this, _rowMeta).get(r.slot) ?? {};
  const cellsByCardId = new Map(
    (__privateGet(this, _cellsByRow).get(r.slot) ?? []).map((cell) => [
      cell.cardId,
      cell
    ])
  );
  const visibleIds = __privateMethod(this, _MasCompareChart_instances, visibleCardIdList_fn).call(this);
  let cells = visibleIds.map((cardId) => cellsByCardId.get(cardId)).filter(Boolean);
  if (!cells.length && visibleIds.length > 0 && __privateGet(this, _rowMeta).has(r.slot)) {
    cells = visibleIds.map((cardId) => {
      const card = __privateGet(this, _cards).find(
        (c) => c.dataset.cardId === cardId
      );
      const col = parseInt(card?.dataset.columnIndex ?? "1", 10);
      return __privateMethod(this, _MasCompareChart_instances, syntheticNotApplicableCell_fn).call(this, cardId, col);
    });
  }
  const rowClasses = ["table-row"];
  if (meta.isItemRow) rowClasses.push("description-row");
  return html`
            <div class=${rowClasses.join(" ")} role="row">
                <div class="row-header" role="rowheader">
                    <span class="row-label"
                        >${unsafeHTML(meta.labelHTML ?? "")}</span
                    >
                    ${__privateMethod(this, _MasCompareChart_instances, renderTooltip_fn).call(this, meta.title, meta.tooltipPosition)}
                </div>
                ${repeat(
    cells,
    (c, i) => `${c.cardId}:${i}`,
    (c) => __privateMethod(this, _MasCompareChart_instances, renderCell_fn).call(this, c)
  )}
            </div>
        `;
};
renderCell_fn = function(c) {
  const classes = ["cell"];
  if (c.isCellPrimary) classes.push("primary-cell");
  if (c.isEmojiPrimary) classes.push("emoji-primary-cell");
  if (c.isItem) classes.push("item-cell");
  return html`<p
            role="cell"
            class=${classes.join(" ")}
            data-card-id=${c.cardId}
            style="--col: ${c.col};"
            aria-label=${c.ariaLabel ?? nothing}
        >
            ${unsafeHTML(c.html)}${__privateMethod(this, _MasCompareChart_instances, renderTooltip_fn).call(this, c.title, c.tooltipPosition)}
        </p>`;
};
/** Custom black popover tooltip (Figma: Table tool tip).
 * 7 positions; default top-center. Source is the `title` attribute on
 * the authored `<p>` (label or cell). Native `title` is stripped at
 * capture so the browser's hover-box never fires. */
renderTooltip_fn = function(text, position) {
  if (!text) return nothing;
  const pos = position || "top-center";
  return html`<span class="tooltip-wrapper" data-tooltip-position=${pos}>
            <button class="tooltip-trigger" aria-label="More info" tabindex="0">
                <span aria-hidden="true">i</span>
            </button>
            <span class="tooltip-popover" role="tooltip">${text}</span>
        </span>`;
};
__publicField(MasCompareChart, "properties", {
  expandedGroups: {
    type: String,
    attribute: "expanded-groups",
    reflect: true
  },
  collapsed: {
    type: Boolean,
    attribute: "collapsed",
    reflect: true
  },
  consonant: { type: Boolean, attribute: "consonant" },
  spectrum: { type: String, attribute: "spectrum" },
  /** Viewport offset (px) from the top edge to the sticky header. */
  stickyOffset: { type: String, attribute: "sticky-offset" },
  /** Viewport offset (px) to the sticky header in mobile layout. */
  mobileStickyOffset: {
    type: String,
    attribute: "mobile-sticky-offset"
  },
  /** @deprecated Use `sticky-offset`. */
  stickyTop: { type: String, attribute: "sticky-top" },
  /** Disables the sticky-header behavior entirely (used by the Studio editor preview). */
  nonSticky: { type: Boolean, attribute: "non-sticky" }
});
__publicField(MasCompareChart, "styles", styles);
if (!customElements.get(MAS_COMPARE_CHART)) {
  customElements.define(MAS_COMPARE_CHART, MasCompareChart);
}
export {
  MasCompareChart
};
//# sourceMappingURL=mas-compare-chart.js.map
