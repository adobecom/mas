import { css } from 'lit';

export const ghostButtonStyles = css`
    .ghost-button {
        --mod-button-background-color-default: transparent;
        --mod-button-background-color-hover: var(--spectrum-gray-200);
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
    .item-table {
        --mod-table-header-background-color: var(--spectrum-gray-50);
        --mod-table-border-radius: 0;
    }

    .item-table sp-table-head {
        border-top: 1px solid var(--spectrum-gray-300);
        border-left: 1px solid var(--spectrum-gray-300);
        border-right: 1px solid var(--spectrum-gray-300);
        border-radius: 12px 12px 0 0;
    }

    .item-table sp-table-head-cell {
        align-content: center;
    }

    .item-table sp-table-head-cell:first-of-type {
        border-top-left-radius: 12px;
    }

    .item-table sp-table-head-cell:last-of-type {
        border-top-right-radius: 12px;
    }
`;

export const tableColumnIconStyles = css`
    .table-icon-cell {
        display: flex;
        align-items: center;
        flex: 0;
    }

    .table-icon-cell--chevron {
        padding: 29px;
    }

    .table-icon-cell--checkbox {
        padding: 22px;
    }
`;

export const tableCellBaseStyles = css`
    .item-table sp-table-cell,
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

export const selectItemsFormSectionStyles = css`
    .select-items {
        sp-button {
            --mod-button-background-color-default: transparent;
            --mod-button-background-color-hover: var(--spectrum-gray-200);
        }

        sp-icon-add {
            width: 48px;
            height: 48px;
        }

        .label {
            align-content: center;
        }
    }

    .items-empty-state {
        display: flex;
        flex-direction: row;
        gap: 12px;
        padding: 12px 24px;
        border: 1px dashed var(--spectrum-gray-800);
        border-radius: 10px;
    }

    .selected-items {
        display: flex;
        flex-direction: column;
        gap: 20px;

        .selected-items-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            h2 {
                margin: 0;

                span {
                    font-weight: 500;
                }
            }

            .toggle-btn {
                --mod-button-background-color-down: var(--spectrum-gray-300);
                --mod-button-content-color-default: var(--spectrum-gray-800);
                --mod-button-content-color-hover: var(--spectrum-gray-900);
            }
        }

        h2 sp-icon-asterisk100 {
            width: 10px;
            height: 10px;
        }
    }
`;
