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

    .promotions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .promotions-page-header {
        font-size: 25px;
        font-weight: 700;
        line-height: 30px;
        margin: 0;
        color: var(--spectrum-gray-900, #000);
    }

    .promotions-filter-bar {
        display: flex;
        width: 1148px;
        height: 32px;
        align-items: center;
        gap: 6px;
        margin-bottom: 24px;
    }

    .search-field-container {
        display: flex;
        width: 246px;
        min-width: 112px;
        flex-direction: column;
        align-items: flex-start;
        flex-shrink: 0;
    }

    .search-field-container sp-search {
        width: 100%;
    }

    .result-count {
        display: flex;
        align-items: baseline;
        gap: 4px;
        font-size: 12px;
        line-height: 150%;
        letter-spacing: 0;
        white-space: nowrap;
    }

    .result-count-value {
        color: #292929;
        font-weight: 700;
    }

    .result-count-label {
        color: #505050;
        font-weight: 400;
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

    .promotions-filters-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
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

    .timeline-cell {
        display: grid;
        grid-template-columns: 140px auto;
        align-items: center;
        gap: var(--spectrum-spacing-100, 8px);
    }

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
