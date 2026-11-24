import { css } from 'lit';

export const styles = css`
    .dialog-content {
        width: min(560px, 85vw);
        height: 60vh;
        min-height: 320px;
        max-height: 70vh;
    }

    .tabs-row {
        flex-shrink: 0;
    }

    .table-wrapper {
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
    }

    .empty-tab-message {
        padding: 24px 4px;
        color: var(--spectrum-neutral-subdued-content-color-default);
        font-size: 14px;
    }
`;
