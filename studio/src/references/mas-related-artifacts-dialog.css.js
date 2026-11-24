import { css } from 'lit';

export const styles = css`
    sp-dialog-wrapper {
        --mod-dialog-confirm-large-width: 500px;
        --mod-dialog-confirm-padding-grid: 20px;
        --mod-modal-confirm-border-radius: 16px;
        --mod-dialog-confirm-title-text-size: 22px;
        --mod-dialog-confirm-title-text-line-height: 26px;
        --mod-dialog-heading-font-weight: 700;
        --mod-dialog-confirm-title-text-color: var(--spectrum-gray-800, #292929);
        --mod-dialog-confirm-description-padding: 0px;
        --mod-dialog-confirm-divider-block-spacing-start: 0px;
        --mod-dialog-confirm-divider-block-spacing-end: 0px;
        --mod-dialog-confirm-divider-height: 0px;
    }

    .dialog-content {
        width: 100%;
        height: 60vh;
        min-height: 320px;
        max-height: 70vh;
    }

    .tabs-row {
        flex-shrink: 0;
        /* Compact sets --mod-tabs-item-height on the inner list from this token, and Spectrum subtracts the divider from it. */
        --mod-tabs-item-height-compact: calc(34px + var(--mod-tabs-divider-size, var(--spectrum-tabs-divider-size, 0px)));
        --mod-tabs-item-horizontal-spacing: 24px;
        /* Pins the row so the divider and focus space do not push the table below 20px. */
        height: 34px;
        /* Figma's title row is 32px (the close button) and the 26px heading sets the grid row, so 6px makes it up before the 20px gap. */
        margin-top: calc(32px - 26px + 20px);
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

    sp-table-row,
    sp-table-cell {
        border-radius: 0;
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
