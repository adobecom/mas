import { css } from 'lit';
import { tableCellBaseStyles } from '../common/styles/table-styles.css.js';

export const styles = css`
    ${tableCellBaseStyles}

    .status-cell .status-dot.yellow {
        background-color: var(--spectrum-yellow-600);
    }

    .promotions-container {
        height: 100%;
        min-height: 200px;
        border-radius: 8px;
        padding: 24px;
        background-color: var(--spectrum-white);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
        position: relative;
    }

    .promotions-page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .promotions-page-title {
        margin: 0;
        color: #000;
        font-size: 25px;
        font-style: normal;
        font-weight: 700;
        line-height: 30px;
    }

    .create-button {
        --mod-button-border-radius: 16px;
    }

    .promotions-status-tiles {
        display: flex;
        align-items: center;
        gap: 20px;
        align-self: stretch;
        margin-bottom: 24px;
    }

    .status-tile {
        display: flex;
        flex: 1 0 0;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        padding: 12px 20px;
        border: none;
        border-radius: 12px;
        background: var(--spectrum-white);
        box-shadow:
            0 0 2px 0 rgba(0, 0, 0, 0.12),
            0 2px 6px 0 rgba(0, 0, 0, 0.04),
            0 4px 12px 0 rgba(0, 0, 0, 0.08);
        cursor: pointer;
        font-family: inherit;
        text-align: left;
    }

    .status-tile.is-selected {
        outline: 2px solid var(--spectrum-blue-700);
        outline-offset: -2px;
    }

    .status-tile-label {
        color: var(--spectrum-gray-800, #292929);
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 18px;
    }

    .status-tile-count {
        flex: 1 0 0;
        color: #000;
        font-size: 25px;
        font-style: normal;
        font-weight: 700;
        line-height: 30px;
    }

    .promotions-divider {
        display: flex;
        height: 1px;
        min-height: 1px;
        max-height: 1px;
        align-items: flex-start;
        align-self: stretch;
        background: var(--spectrum-gray-200);
        margin-bottom: 24px;
    }

    .environment-filter-picker {
        display: flex;
    }

    sp-action-button.environment-filter {
        display: flex;
        flex-direction: row-reverse;
    }

    .filter-popover {
        padding: 12px;
    }

    .checkbox-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 150px;
        padding-inline-start: 4px;
    }

    .applied-filters {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .applied-filters sp-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .promotions-filters-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 24px;
    }

    .promotions-search-row {
        display: flex;
        width: 100%;
        max-width: 1148px;
        height: 32px;
        align-items: center;
        gap: 6px;
    }

    .promotions-search-field-container {
        display: flex;
        width: 246px;
        min-width: 112px;
        flex-direction: column;
        align-items: flex-start;
        flex-shrink: 0;
    }

    .promotions-search-field-container sp-search {
        display: flex;
        align-self: stretch;
        width: 100%;
        --mod-search-border-radius: 16px;
        --mod-search-border-width: 2px;
        --mod-search-border-color-default: var(--spectrum-gray-300, #dadada);
        --mod-search-background-color: var(--palette-gray-25, #fff);
    }

    .promotions-result-count {
        flex: 1 0 0;
        color: var(--spectrum-gray-800, #292929);
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 18px;
    }

    .filters-container {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .promotions-table {
        border-radius: 8px;
        border: 1px solid var(--spectrum-gray-200);
    }

    .promotions-table sp-table-head {
        background-color: var(--spectrum-global-color-gray-100);
    }

    .promotions-table sp-table-head-cell:last-child,
    .promotions-table sp-table-cell:last-child {
        max-width: 100px;
    }

    .promotions-table sp-table-head-cell:last-child {
        text-align: center;
        justify-content: center;
    }

    .promotions-table sp-table-cell:last-child {
        justify-content: center;
    }

    .promotions-table sp-table-head sp-table-head-cell:nth-child(3),
    .promotions-table sp-table-row sp-table-cell:nth-child(3) {
        max-width: 150px;
    }

    .timeline-cell {
        display: grid;
        grid-template-columns: 140px auto;
        align-items: center;
        gap: var(--spectrum-spacing-100, 8px);
    }

    .staged-badge,
    .evergreen-badge {
        background-color: var(--spectrum-orange-200);
        color: var(--spectrum-gray-900);
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 4px;
        white-space: nowrap;
    }

    .duplicating-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.7);
        z-index: 10;
    }
`;

export default styles;
