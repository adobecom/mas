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
        :host {
            display: block;
            width: 100%;
            box-sizing: border-box;
        }

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
            color: #292929;
            font-weight: 500;
            font-size: 14px;
            line-height: 18px;
            gap: 4px;

            overlay-trigger {
                min-width: 0;
            }

            div {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }

            div:hover {
                text-decoration: underline;
                cursor: pointer;
                color: var(--spectrum-neutral-content-color-hover, #000000);
            }

            sp-action-button {
                --mod-actionbutton-content-color-default: #292929;
                --mod-actionbutton-content-color-hover: #292929;
                --mod-actionbutton-content-color-focus: #292929;
                --mod-actionbutton-height: 32px;
                --mod-actionbutton-border-radius: 8px;
                --mod-actionbutton-icon-size: 20px;
                --mod-actionbutton-edge-to-visual-only: 6px;
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

        sp-table-row > sp-table-cell:last-of-type,
        sp-table-cell.status-cell {
            width: 140px !important;
            min-width: 140px !important;
            max-width: 140px !important;
            flex: 0 0 140px !important;
            box-sizing: border-box;
            white-space: nowrap;
            display: flex;
            align-items: center;
        }

        sp-table-cell.status-cell .status-dot {
            display: inline-block;
            vertical-align: middle;
        }

        sp-table-row {
            --mod-table-min-row-height: 68px;
            --mod-table-row-top-to-text: 16px;
            --mod-table-row-bottom-to-text: 16px;
            min-height: 68px;
        }

        sp-table-cell {
            min-height: 68px;
        }

        sp-tabs {
            padding: 20px 20px 20px 0;
            background-color: var(--spectrum-gray-50);
            position: relative;
        }

        sp-tabs::after {
            content: '';
            position: absolute;
            top: 66px;
            left: 0;
            right: 20px;
            height: 2px;
            background: #e1e1e1;
            border-radius: 2px;
            pointer-events: none;
            z-index: 0;
        }

        sp-tab-panel {
            padding-top: 32px;
        }

        sp-tab-panel sp-table-body {
            border: none;
        }

        .nested-content-container {
            background-color: var(--spectrum-gray-50);
        }

        .nested-content {
            margin-left: 30px;
        }

        .nested-content sp-table {
            width: 100%;
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

            sp-table-cell {
                background-color: transparent;
            }
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
