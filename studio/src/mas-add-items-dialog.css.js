import { css } from 'lit';

export const styles = css`
    :host {
        display: contents;
    }

    sp-dialog-wrapper {
        --mod-dialog-confirm-large-width: 100%;
        --mod-dialog-confirm-buttongroup-padding-top: 32px;
    }

    .dialog-content {
        display: flex;
        flex-direction: column;
        width: 85vw;
        max-width: 100%;
        height: 65vh;
        min-height: 50%;
        max-height: 75vh;
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
        display: flex;
        flex-direction: column;
    }

    .table-wrapper mas-select-items-table[hidden] {
        display: none;
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 20px;
        flex-shrink: 0;
    }
`;
