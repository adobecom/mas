import { css } from 'lit';
import {
    tableHeaderBaseStyles,
    tableBodyBaseStyles,
    tableCellBaseStyles,
    scrollableTableStyles,
} from '../common/styles/table-styles.css.js';

export const promotionsItemsTableStyles = [
    tableHeaderBaseStyles,
    tableBodyBaseStyles,
    tableCellBaseStyles,
    scrollableTableStyles,

    css`
        :host {
            position: relative;
            width: 100%;
            display: flex;
            min-height: 0;
        }

        sp-dialog-wrapper {
            z-index: 11;
        }

        .loading-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .offers-table {
            --offer-column-width: 10rem;
            --actions-column-width: 6rem;
            --countries-column-width: 10rem;
            --promo-code-column-width: 11rem;
            --product-arrangement-column-width: 10rem;
            --type-column-width: 6rem;
            --segment-column-width: 7rem;

            sp-table-head-cell {
                border-bottom: 1px solid var(--spectrum-gray-300);
            }

            sp-table-head-cell,
            sp-table-cell {
                overflow-wrap: anywhere;
            }

            .actions-head-cell,
            .actions-cell {
                flex: 1 0 var(--actions-column-width);
            }

            .countries-head-cell,
            .countries-cell,
            .offer-id-head-cell,
            .offer-id-cell {
                flex: 1 0 var(--countries-column-width);
            }

            .promo-code-head-cell,
            .promo-code-cell {
                flex: 1 0 var(--promo-code-column-width);
            }

            .product-arrangement-head-cell,
            .product-arrangement-cell {
                flex: 1 0 var(--product-arrangement-column-width);
            }

            .type-head-cell,
            .type-cell {
                flex: 1 0 var(--type-column-width);
            }

            .segment-head-cell,
            .segment-cell {
                flex: 1 0 var(--segment-column-width);
            }

            .offer-head-cell,
            .offer-cell {
                flex: 1 0 var(--offer-column-width);
            }

            .offer-cell {
                display: flex;
                align-items: center;
                gap: var(--spectrum-spacing-100);

                .mnemonic-icon {
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                }
            }

            .offer-id {
                flex-direction: column;
                justify-content: center;
                align-items: flex-start;

                .copyable-value {
                    align-self: stretch;
                    width: 100%;
                }
            }
        }

        sp-dialog-wrapper {
            z-index: 11;
        }

        .grouped-tables {
            display: flex;
            flex-direction: column;
            width: 100%;
            min-width: 0;
        }

        .group-section {
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 8px;
            width: 100%;
            box-sizing: border-box;
            overflow: hidden;
        }

        .group-section + .group-section {
            margin-block-start: var(--spectrum-spacing-300);
        }

        .group-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--spectrum-spacing-100);
            width: 100%;
            box-sizing: border-box;
            padding: var(--spectrum-spacing-200) var(--spectrum-spacing-300);
            background: none;
            border: 0;
            font: inherit;
            font-weight: 700;
            color: var(--spectrum-gray-900);
            cursor: pointer;
            text-align: start;
        }

        .group-section:has(.group-header-row[aria-expanded='true']) .group-header-row {
            border-bottom: 1px solid var(--spectrum-gray-200);
        }

        .group-section:has(.group-header-row[aria-expanded='true']) mas-select-items-table {
            display: block;
            box-sizing: border-box;
            width: calc(100% - 40px);
            margin: 20px;
            overflow-x: auto;
        }

        .group-header-row sp-icon-chevron-down {
            transition: transform 0.2s;
        }

        .group-header-row sp-icon-chevron-down.expanded {
            transform: rotate(180deg);
        }

        .grouping-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spectrum-spacing-500);
        }

        .empty-state {
            width: 100%;
        }
    `,
];
