import { css } from 'lit';

export const styles = css`
    :host {
        --comparison-border-radius: 8px;
        --comparison-row-border-color: #e9e9e9;
        --comparison-desktop-max-width: 1200px;
        --comparison-tablet-spacing: 50px;
        --comparison-table-spacing: 12px;
        --comparison-row-bg: var(--color-gray-100, #f8f8f8);
        --comparison-row-bg-alt: #fff;
        --comparison-cell-border: 1px solid var(--spectrum-gray-300, #d3d3d3);
        --comparison-cell-radius: 4px;
        --hover-border-color: #357BEB;
        --primary-cell-path-color: #05834E;
        --comparison-cols: 3;
        --comparison-leading-col: minmax(192px, 1fr);
        --comparison-data-cols: repeat(var(--comparison-cols), minmax(100px, 1fr));

        display: block;
        max-width: 100%;
        margin: 0 auto;
        padding: 0 30px;
        box-sizing: border-box;
        font-family: var(--body-font-family, 'Adobe Clean', sans-serif);
        color: var(--color-text, #2c2c2c);
    }

    :host([dir='rtl']) ::slotted([slot='prices']) {
        direction: ltr;
    }

    /* ---------- header band (sticky) ---------- */
    .header-content {
        display: grid;
        grid-template-columns: var(--comparison-data-cols);
        gap: var(--comparison-table-spacing);
        background: transparent;
        border-radius: var(--comparison-border-radius);
        padding: var(--comparison-table-spacing) 0;
        z-index: 3;
    }

    .header-content.sticky {
        position: sticky;
        top: var(--comparison-sticky-top, 0px);
        background: var(--color-gray-100, #f8f8f8);
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
        padding: 8px 12px;
    }

    .header-content-dummy {
        height: 1px;
        margin-top: -1px;
        pointer-events: none;
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

    /* mobile dropdowns */
    .mobile-headers {
        display: none;
        gap: var(--comparison-table-spacing);
        margin-bottom: 8px;
    }
    .mobile-headers select {
        flex: 1;
        padding: 8px 12px;
        font-size: 14px;
        border: 1px solid var(--comparison-row-border-color);
        border-radius: 4px;
        background: #fff;
    }

    /* ---------- per-group container ---------- */
    .table-container {
        border: 1px solid var(--comparison-row-border-color);
        border-radius: var(--comparison-border-radius);
        overflow: hidden;
        margin-bottom: var(--comparison-table-spacing);
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

    .toggle-icon {
        width: 22px;
        height: 22px;
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        flex-shrink: 0;
    }
    /* plus / minus inlined data URLs */
    .table-column-header[aria-expanded='false'] .toggle-icon {
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 22 22'><circle cx='11' cy='11' r='10' fill='none' stroke='%23222' stroke-width='1.5'/><path d='M11 6v10M6 11h10' stroke='%23222' stroke-width='1.5' stroke-linecap='round'/></svg>");
    }
    .table-column-header[aria-expanded='true'] .toggle-icon {
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 22 22'><circle cx='11' cy='11' r='10' fill='%23222'/><path d='M6 11h10' stroke='%23fff' stroke-width='1.5' stroke-linecap='round'/></svg>");
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
        grid-template-columns: var(--comparison-leading-col) var(--comparison-data-cols);
        gap: var(--comparison-table-spacing);
        align-items: center;
        padding: var(--comparison-table-spacing) 20px;
        border-top: 1px solid var(--comparison-row-border-color);
    }
    .table-row:first-child { border-top: none; }

    .row-header {
        font-size: var(--type-body-xs-size, 14px);
        line-height: 1.4;
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .tooltip-trigger {
        all: unset;
        width: 12px;
        height: 12px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #6e6e6e;
        font-size: 12px;
        border: 1px solid currentColor;
        border-radius: 50%;
        line-height: 1;
    }
    .tooltip-trigger:hover,
    .tooltip-trigger:focus-visible {
        color: var(--hover-border-color);
    }

    .tooltip-popover {
        position: absolute;
        background: #fff;
        color: var(--color-text, #222);
        border: 1px solid var(--comparison-row-border-color);
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 12px;
        line-height: 1.4;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        z-index: 10;
        max-width: 240px;
    }
    .tooltip-popover[hidden] { display: none; }

    /* ---------- cells (slotted from cards) ---------- */
    ::slotted(p[role='cell']) {
        margin: 0;
        padding: 8px 10px;
        border: var(--comparison-cell-border);
        border-radius: var(--comparison-cell-radius);
        background: var(--comparison-row-bg);
        text-align: center;
        font-size: var(--type-body-xs-size, 14px);
        min-height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }
    /* col 2 = white card; others = gray */
    ::slotted(p[role='cell'][style*='--col: 2']) {
        background: var(--comparison-row-bg-alt);
    }
    /* primary column tint for glyphs */
    ::slotted(p.primary-cell) span[aria-hidden='true'] {
        color: var(--primary-cell-path-color);
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

    /* ---------- breakpoints ---------- */
    @media (max-width: 599px) {
        :host {
            --comparison-cols: 2;
            --comparison-leading-col: 0;
            padding: 0 12px;
        }
        .table-row {
            grid-template-columns: 1fr 1fr;
        }
        .row-header {
            grid-column: 1 / -1;
            margin-bottom: 4px;
            font-weight: 600;
        }
        .header-content {
            grid-template-columns: 1fr 1fr;
        }
        .mobile-headers {
            display: flex;
        }
    }

    @media (min-width: 600px) and (max-width: 899px) {
        :host {
            --comparison-cols: 2;
            --comparison-leading-col: minmax(160px, 1fr);
            padding: 0 25px;
        }
        .mobile-headers {
            display: flex;
        }
    }

    @media (min-width: 900px) {
        :host {
            padding: 0 25px;
        }
        .header-content {
            grid-template-columns: var(--comparison-leading-col) var(--comparison-data-cols);
        }
    }

    @media (min-width: 1200px) {
        :host {
            max-width: var(--comparison-desktop-max-width);
            padding: 0;
        }
        :host([data-child-count='3']) {
            --comparison-leading-col: minmax(268px, 1fr);
        }
        :host(:not([data-child-count='3'])) {
            --comparison-leading-col: minmax(268px, 1.15fr);
        }
    }

    /* ---------- dark mode ---------- */
    :host-context(.dark) .header-content.sticky {
        background: #2c2c2c;
        color: #fff;
    }

    /* ---------- static-header ---------- */
    :host([static-header]) .header-content {
        position: static !important;
        box-shadow: none !important;
    }
`;
