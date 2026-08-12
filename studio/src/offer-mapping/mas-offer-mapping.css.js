import { css } from 'lit';

export const styles = css`
    :host {
        display: block;
        box-sizing: border-box;
        padding: 32px;
        min-width: 900px;
    }

    :host *,
    :host *::before,
    :host *::after {
        box-sizing: border-box;
    }

    .offer-mapping-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    h2 {
        margin: 0;
        color: var(--spectrum-alias-content-color-default);
        font-size: 25px;
        font-weight: 700;
        line-height: 30px;
    }

    .toolbar {
        display: flex;
        align-items: flex-end;
        gap: 16px;
        margin-bottom: 16px;
    }

    .total {
        margin-left: auto;
        font-size: 14px;
        color: var(--spectrum-gray-700, #464646);
    }

    .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--spectrum-red-800, #b40000);
        margin-bottom: 12px;
    }

    .offer-mapping-table {
        width: 100%;
    }

    sp-table-head-cell.align-right,
    sp-table-cell.align-right {
        text-align: right;
    }

    sp-table-head-cell.sortable {
        cursor: pointer;
        user-select: none;
    }

    /* sp-table rows lay out with flex, so column sizing is driven by flex (width% is ignored, only
       min-width is honored). The two OSI columns grow equally to absorb the free space and floor at
       min-width on narrow viewports. Geos/Status/Action get a FIXED flex-basis so the header and body
       share identical tracks — content-based (flex:0 0 auto) sizing would drift because a header label
       ("Status") is a different width than its cell ("Draft"). */
    sp-table-head-cell.source,
    sp-table-cell.source,
    sp-table-head-cell.target,
    sp-table-cell.target {
        flex: 1 1 0;
        min-width: 280px;
    }

    sp-table-head-cell.geos,
    sp-table-cell.geos {
        flex: 0 0 160px;
    }

    sp-table-head-cell.status,
    sp-table-cell.status {
        flex: 0 0 140px;
        white-space: nowrap;
    }

    sp-table-head-cell.action,
    sp-table-cell.action-cell {
        flex: 0 0 100px;
        white-space: nowrap;
    }

    /* The status pill's host is display:flex, so it stretches to the cell; keep it fit-content. */
    sp-table-cell.status mas-fragment-status {
        display: inline-flex;
    }

    .osi-value {
        font-size: 12px;
        font-weight: 600;
        word-break: break-all;
    }

    .empty {
        color: var(--spectrum-gray-500, #8c8c8c);
    }

    .promo-chip {
        display: inline-block;
        margin-left: 6px;
        font-size: 11px;
        font-weight: 400;
        padding: 1px 8px;
        border-radius: 8px;
        background: var(--spectrum-green-100, #cdf0d8);
        color: var(--spectrum-green-900, #0d5c1e);
        vertical-align: middle;
    }

    .aos-line {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
    }

    .aos-chip {
        font-size: 11px;
        line-height: 16px;
        padding: 1px 8px;
        border-radius: 8px;
        background: var(--spectrum-gray-100, #e6e6e6);
        color: var(--spectrum-gray-800, #292929);
        white-space: nowrap;
    }

    .aos-offer-id {
        font-family: var(--spectrum-code-font-family, monospace);
    }

    .geo-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .geo-tag {
        font-size: 12px;
        padding: 1px 8px;
        border-radius: 8px;
        background: var(--spectrum-gray-100, #e6e6e6);
    }

    .editing-cell osi-field,
    .editing-cell aem-tag-picker-field {
        display: block;
        min-width: 220px;
    }

    .action-cell {
        white-space: nowrap;
    }

    .action-buttons {
        display: flex;
        align-items: center;
        gap: 4px;
        justify-content: flex-end;
    }

    .action-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: transparent;
        cursor: pointer;
        color: var(--spectrum-gray-700, #464646);
    }

    .action-button:hover:not([disabled]) {
        background: var(--spectrum-gray-100, #e6e6e6);
    }

    .action-button[disabled] {
        opacity: 0.4;
        cursor: default;
    }

    .dropdown-menu-container {
        position: relative;
    }

    .dropdown-menu {
        position: absolute;
        right: 0;
        top: 100%;
        z-index: 10;
        min-width: 140px;
        background: var(--spectrum-gray-50, #fff);
        border: 1px solid var(--spectrum-gray-300, #dadada);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        padding: 4px;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
    }

    .dropdown-item:hover {
        background: var(--spectrum-gray-100, #e6e6e6);
    }

    .dropdown-item.disabled {
        opacity: 0.4;
        pointer-events: none;
    }

    .no-mappings-label {
        padding: 24px;
        text-align: center;
        color: var(--spectrum-gray-600, #6e6e6e);
    }
`;
