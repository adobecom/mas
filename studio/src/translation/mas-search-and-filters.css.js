import { css } from 'lit';

export const styles = css`
    :host {
        display: block;
    }

    .search {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 32px 0 20px 0;
    }

    .search sp-search {
        flex: 1;
        max-width: 400px;
    }

    .result-count {
        color: var(--spectrum-gray-700);
        font-size: 14px;
        white-space: nowrap;
    }

    .filters {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
        flex-wrap: wrap;
    }

    .filter-trigger {
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 12px;
        justify-content: start;
        sp-icon-chevron-down {
            order: 2;
        }
    }

    .filter-popover {
        padding: 12px;
    }

    .checkbox-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 300px;
        overflow-y: auto;
        min-width: 150px;
        padding-inline-start: 4px;
    }

    .checkbox-list sp-checkbox {
        display: flex;
        white-space: nowrap;
    }

    .applied-filters {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
    }

    .applied-filters sp-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .clear-all {
        color: var(--spectrum-accent-color-900);
        font-size: 14px;
        cursor: pointer;
        white-space: nowrap;
        background: none;
        border: none;
        padding: 0;
        text-decoration: none;
    }

    .clear-all:hover {
        text-decoration: underline;
    }
`;
