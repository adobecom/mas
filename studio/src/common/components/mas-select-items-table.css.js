import { css } from 'lit';
import {
    tableHeaderBaseStyles,
    tableBodyBaseStyles,
    tableCellBaseStyles,
    tableColumnIconStyles,
    tableSelectedRowStyles,
    loadingContainerFlexStyles,
} from '../styles/table-styles.css.js';
import { skeletonStyles } from '../skeleton-styles.css.js';

export const styles = [
    tableHeaderBaseStyles,
    tableBodyBaseStyles,
    tableCellBaseStyles,
    tableColumnIconStyles,
    tableSelectedRowStyles,
    loadingContainerFlexStyles,
    skeletonStyles,
    css`
        :host {
            width: 100%;
            display: flex;
            justify-content: flex-start;
            min-height: 0;
        }

        :host > p {
            margin: 0;
            text-align: left;
            align-self: flex-start;
        }

        .items-empty-state {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 12px 12px 24px;
            background: var(--spectrum-gray-25, #ffffff);
            border: 1px solid var(--spectrum-gray-300, #dadada);
            border-radius: 10px;
            box-sizing: border-box;
            color: #292929;
        }

        .items-empty-state__icon {
            flex: 0 0 40px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #292929;
        }

        .items-empty-state__text {
            flex: 1 1 auto;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        .items-empty-state__title {
            margin: 0;
            font-size: 14px;
            line-height: 18px;
            font-weight: 700;
        }

        .items-empty-state__description {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
            font-weight: 400;
        }

        sp-table {
            flex: 1;
            min-height: 0;
            overflow: auto;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 12px;
        }

        .fragments-table sp-table-head sp-table-head-cell:first-of-type,
        .fragments-table sp-table-head sp-table-head-cell:last-of-type,
        .fragments-table sp-table-head sp-table-checkbox-cell:first-of-type {
            border-radius: 0;
        }

        :host([data-type='view-only']) {
            --mod-table-selected-row-background-color: transparent;
        }

        .fragments-table {
            sp-table-head {
                position: sticky;
                top: 0;
                z-index: 10;
                background: var(--spectrum-gray-75);
                box-shadow: 0 -2px 0 0 var(--spectrum-gray-75);
                border-bottom: 1px solid var(--spectrum-gray-300);
            }

            sp-table-head-cell {
                position: sticky;
                top: 0;
                z-index: 10;
                background: var(--spectrum-gray-75);
            }

            sp-table-head sp-table-head-cell,
            sp-table-head sp-table-checkbox-cell {
                background: var(--spectrum-gray-75);
                --mod-table-header-top-to-text: 13px;
                --mod-table-header-bottom-to-text: 13px;
                --mod-table-min-header-height: 44px;
                min-height: 44px;
                padding-block: 13px;
            }

            sp-table-body sp-table-row,
            sp-table-body sp-table-cell {
                --mod-table-min-row-height: 68px;
                --mod-table-row-top-to-text: 16px;
                --mod-table-row-bottom-to-text: 16px;
                min-height: 68px;
            }

            sp-table-head-cell.table-icon-cell--checkbox,
            sp-table-row > sp-table-cell.table-icon-cell--checkbox {
                width: 44px !important;
                min-width: 44px !important;
                max-width: 44px !important;
                flex: 0 0 44px !important;
                padding: 0 !important;
                box-sizing: border-box;
                justify-content: center;
            }

            sp-table-head-cell.status,
            sp-table-cell.status,
            sp-table-head-cell:last-of-type,
            sp-table-row > sp-table-cell:last-of-type,
            sp-table-cell.status-cell {
                display: flex !important;
                align-items: center;
                width: 140px !important;
                min-width: 140px !important;
                max-width: 140px !important;
                box-sizing: border-box;
                white-space: nowrap;
            }

            sp-table-cell.status-cell .status-dot {
                display: inline-block;
                vertical-align: middle;
            }

            sp-table-head sp-table-checkbox-cell:first-of-type {
                border-top-left-radius: 12px;
            }

            sp-table-cell {
                word-break: break-word;
            }

            sp-table-body > mas-collapsible-table-row + mas-collapsible-table-row {
                border-top: 1px solid var(--spectrum-gray-300);
            }
        }

        .fragments-table[selects='multiple'] {
            sp-table-head {
                sp-table-checkbox-cell:first-of-type {
                    border-top-left-radius: 12px;
                }
            }
        }

        .fragments-table:not([selects='multiple']) {
            sp-table-head {
                sp-table-head-cell:first-of-type {
                    border-top-left-radius: 12px;
                }
            }
        }

        .loading-container--flex {
            padding: 80px;
        }

        .loading-more {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px;
            color: var(--spectrum-gray-700);
            font-size: var(--spectrum-font-size-75);
        }
    `,
];
