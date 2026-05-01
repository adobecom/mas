import { css } from 'lit';

export const styles = css`
    :host {
        display: contents;
    }

    .dialog-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        gap: 0;
    }

    .tabs-row {
        flex-shrink: 0;
    }

    sp-divider {
        flex-shrink: 0;
    }

    .search-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 0 8px;
        flex-shrink: 0;
    }

    .search-row sp-search {
        flex: 1;
        max-width: 480px;
    }

    .result-count {
        font-size: 12px;
        color: var(--spectrum-gray-700, #505050);
        white-space: nowrap;
    }

    .filter-row {
        flex-shrink: 0;
        padding-bottom: 12px;
    }

    .table-wrapper {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        border-radius: 12px;
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 20px;
        flex-shrink: 0;
    }
`;
