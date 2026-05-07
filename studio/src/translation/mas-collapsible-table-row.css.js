import { css } from 'lit';
import {
    tableColumnIconStyles,
    tableCellBaseStyles,
    tableSelectedRowStyles,
    loadingContainerFlexStyles,
} from '../common/styles/table-styles.css.js';

export const styles = [
    tableColumnIconStyles,
    tableCellBaseStyles,
    tableSelectedRowStyles,
    loadingContainerFlexStyles,
    css`
        .loading-container--flex {
            padding: 10px;
            width: 100%;
        }

        .path,
        .offer-id {
            min-width: 0;
            overflow: hidden;
        }

        .path span {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .offer-id {
            color: var(--spectrum-blue-900);

            div {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                margin-right: 4px;
            }

            div:hover {
                text-decoration: underline;
                color: var(--spectrum-blue-1000);
            }

            sp-action-button {
                --mod-actionbutton-content-color-default: var(--spectrum-blue-900);

                &:hover {
                    --mod-actionbutton-background-color-hover: var(--spectrum-blue-300);
                    --mod-actionbutton-background-color-hover-selected: var(--spectrum-blue-300);
                }

                &:active {
                    --mod-actionbutton-background-color-down: var(--spectrum-blue-400);
                    --mod-actionbutton-background-color-down-selected: var(--spectrum-blue-400);
                }

                &:focus,
                &:focus-visible {
                    --mod-actionbutton-background-color-focus: var(--spectrum-blue-400);
                    --mod-actionbutton-background-color-focus-selected: var(--spectrum-blue-400);
                }
            }
            sp-tooltip {
                word-break: break-all;
            }
        }

        .tags-cell {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
        }

        .tags-label {
            margin-left: 6px;
        }

        .expand-button {
            background: none;
            border: none;
        }

        sp-tabs {
            padding: 0 20px 16px 0;
            background-color: var(--spectrum-gray-50);
        }

        sp-tab-panel {
            padding-top: 16px;
        }

        sp-tab-panel sp-table-body {
            border: none;
        }

        .nested-content-container {
            background-color: var(--spectrum-gray-50);
        }

        .nested-content {
            --connector-offset: 30px;
            position: relative;
            margin-left: 60px;
        }

        .nested-content.has-connector::before {
            content: '';
            position: absolute;
            left: calc(-1 * var(--connector-offset));
            top: 0;
            bottom: var(--nested-content-connector-bottom, 0px);
            width: 1px;
            background-color: var(--spectrum-gray-400);
        }

        .nested-content sp-table {
            width: 100%;
        }

        .nested-content sp-table-body {
            position: relative;
        }

        .nested-content sp-table-body::before {
            content: '';
            position: absolute;
            left: calc(-1 * var(--connector-offset));
            top: 0;
            width: 1px;
            background-color: var(--spectrum-gray-400);
        }

        .nested-content sp-table-body sp-table-row {
            position: relative;
        }

        .nested-content sp-table-body sp-table-row:not(.variation-details-row)::before {
            content: '';
            position: absolute;
            left: -30px;
            top: 50%;
            transform: translateY(-50%);
            width: 30px;
            height: 1px;
            background-color: var(--spectrum-gray-400);
        }

        .nested-content sp-table-body sp-table-row:not(.variation-details-row)::after {
            content: '';
            position: absolute;
            left: -3px;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--spectrum-gray-400);
        }

        .nested-content sp-table-body sp-table-row:first-of-type:not(.variation-details-row) {
            sp-table-cell:first-of-type {
                border-top-left-radius: 12px;
            }

            sp-table-cell:last-of-type {
                border-top-right-radius: 12px;
            }
        }

        .nested-content sp-table-body sp-table-row:last-of-type:not(.variation-details-row) {
            sp-table-cell:first-of-type {
                border-bottom-left-radius: 12px;
            }

            sp-table-cell:last-of-type {
                border-bottom-right-radius: 12px;
            }
        }

        sp-table-row.select-all-row {
            background: var(--spectrum-gray-50);
            border-bottom: 1px solid var(--spectrum-gray-300);
        }

        .select-all-label {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .fragment-count {
            font-size: var(--spectrum-font-size-75);
            color: var(--spectrum-gray-700);
            white-space: nowrap;
        }

        .offer-cell {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .mnemonic-icon {
            width: 32px;
            height: 32px;
            object-fit: contain;
            flex-shrink: 0;
        }

        .variation-details-row {
            sp-table-cell {
                background-color: var(--spectrum-gray-50);
            }

            sp-table-cell:first-of-type {
                padding: 25px;
                flex: 0;
            }

            sp-table-cell:nth-of-type(2) {
                padding: 22px;
                flex: 0;
            }

            sp-tag {
                --mod-tag-background-color: var(--spectrum-gray-100);
                --mod-tag-border-color: transparent;
            }
        }
    `,
];
