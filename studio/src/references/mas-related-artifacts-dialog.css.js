import { css } from 'lit';

export const styles = css`
    sp-dialog-wrapper {
        --mod-dialog-confirm-large-width: 500px;
        --mod-dialog-confirm-padding-grid: 20px;
        --mod-modal-confirm-border-radius: 16px;
        --mod-dialog-confirm-title-text-size: 22px;
        --mod-dialog-confirm-title-text-line-height: 26px;
        --mod-dialog-heading-font-weight: 700;
    }

    .dialog-content {
        width: 100%;
        height: 60vh;
        min-height: 320px;
        max-height: 70vh;
    }

    .tabs-row {
        flex-shrink: 0;
    }

    .table-wrapper {
        flex: 0 1 auto;
        margin-top: 20px;
        border: 1px solid var(--spectrum-gray-300, #dadada);
        border-radius: 12px;
        overflow: hidden;
    }

    .dialog-table-body {
        border: none;
        border-radius: 0;
    }

    sp-table-head-cell {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        height: 44px;
        padding: 0 20px;
        background: var(--spectrum-gray-75, #f3f3f3);
        color: var(--spectrum-gray-900, #222);
        font-size: 14px;
        line-height: 18px;
        font-weight: 700;
    }

    sp-table-row {
        min-height: 68px;
    }

    sp-table-cell {
        min-width: 0;
        display: flex;
        align-items: center;
        padding: 16px 20px;
        border-top: 1px solid var(--spectrum-gray-300, #dadada);
        background: var(--spectrum-white, #fff);
    }

    .artifact-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--spectrum-blue-900, #3b63fb);
        text-decoration: underline;
        font-size: 14px;
        line-height: 18px;
        font-weight: 500;
        min-width: 0;
        max-width: 100%;
    }

    .artifact-link sp-icon-open-in {
        flex-shrink: 0;
    }

    .artifact-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .empty-tab-message {
        padding: 24px 4px;
        color: var(--spectrum-neutral-subdued-content-color-default);
        font-size: 14px;
    }
`;
