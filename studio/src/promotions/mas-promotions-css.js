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

    .promotions-segmented-control-container {
        margin-bottom: 24px;
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
