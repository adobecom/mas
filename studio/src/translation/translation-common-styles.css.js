import { css } from 'lit';

export const ghostButtonStyles = css`
    .ghost-button {
        --mod-button-background-color-default: transparent;
        --mod-button-background-color-hover: var(--spectrum-gray-200);
    }
`;

export const loadingContainerCenteredStyles = css`
    .loading-container--absolute {
        position: absolute;
        top: 50%;
        right: 50%;
        transform: translate(-50%, -50%);
    }
`;

export const loadingContainerFlexStyles = css`
    .loading-container--flex {
        display: flex;
        justify-content: center;
        align-items: center;
    }
`;

export const tableHeaderBaseStyles = css`
    .translation-table {
        --mod-table-header-background-color: var(--spectrum-gray-50);
        --mod-table-border-radius: 0;
    }

    .translation-table sp-table-head {
        border-top: 1px solid var(--spectrum-gray-300);
        border-left: 1px solid var(--spectrum-gray-300);
        border-right: 1px solid var(--spectrum-gray-300);
        border-radius: 12px 12px 0 0;
    }

    .translation-table sp-table-head-cell {
        align-content: center;
    }

    .translation-table sp-table-head-cell:first-of-type {
        border-top-left-radius: 12px;
    }

    .translation-table sp-table-head-cell:last-of-type {
        border-top-right-radius: 12px;
    }
`;

export const tableColumnIconStyles = css`
    .translation-table-icon-cell {
        display: flex;
        align-items: center;
        flex: 0;
    }

    .translation-table-icon-cell--chevron {
        padding: 29px;
    }

    .translation-table-icon-cell--checkbox {
        padding: 22px;
    }
`;

export const tableCellBaseStyles = css`
    .translation-table sp-table-cell,
    sp-table-cell {
        display: flex;
        align-items: center;
    }

    .status-cell {
        display: flex;
        align-items: center;
        gap: 6px;

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--spectrum-gray-500);
        }

        .status-dot.green {
            background-color: var(--spectrum-green-700);
        }

        .status-dot.blue {
            background-color: var(--spectrum-blue-800);
        }
    }
`;

export const tableSelectedRowStyles = css`
    sp-table-row[selected] {
        --mod-table-row-background-color: var(--spectrum-blue-200);
        --spectrum-table-cell-background-color: var(--spectrum-blue-200);
    }
`;
