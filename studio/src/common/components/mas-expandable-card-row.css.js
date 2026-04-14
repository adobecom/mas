import { css } from 'lit';
import {
    tableIconCellStyles,
    tableCellStyles,
    tableSelectedRowStyles,
    loadingContainerStyles,
} from './common-table-styles.css.js';

export const styles = [
    tableIconCellStyles,
    tableCellStyles,
    tableSelectedRowStyles,
    loadingContainerStyles,
    css`
        .loading-container--flex {
            padding: 10px;
            width: 100%;
        }

        .offer-id {
            color: var(--spectrum-blue-900);

            div {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                margin-right: 4px;
                word-break: break-all;
                text-overflow: ellipsis;
            }

            div:hover {
                text-decoration: underline;
                color: var(--spectrum-blue-1000);
            }

            sp-action-button {
                --mod-actionbutton-content-color-default: var(--spectrum-blue-900);
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
