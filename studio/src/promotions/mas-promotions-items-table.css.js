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
            display: flex;
            width: 100%;
            min-height: 0;
        }

        sp-dialog-wrapper {
            z-index: 11;
        }

        .item-table {
            --offer-actions-column-width: 5rem;
            --offer-promo-actions-gap: var(--spectrum-spacing-500);
            --offer-column-countries-width: 10rem;
            --offer-column-promo-code-width: 9rem;
            --offer-column-product-arrangement-width: 10rem;
            --offer-column-type-width: 8rem;
            --offer-column-segment-width: 8rem;

            sp-table-head {
                border-bottom: 1px solid var(--spectrum-gray-300);
                width: max-content;
            }

            sp-table-head-cell,
            sp-table-cell {
                overflow-wrap: anywhere;
            }

            sp-table-head-cell:nth-child(2),
            sp-table-cell:nth-child(2) {
                flex: 1 0 var(--offer-actions-column-width);
                width: var(--offer-actions-column-width);
                min-width: 86px;
            }

            sp-table-head-cell:nth-child(3),
            sp-table-cell:nth-child(3),
            sp-table-head-cell:nth-child(4),
            sp-table-cell:nth-child(4),
            sp-table-head-cell:nth-child(5),
            sp-table-cell:nth-child(5),
            sp-table-head-cell:nth-child(8),
            sp-table-cell:nth-child(8) {
                flex: 1 0 var(--offer-column-countries-width);
                width: var(--offer-column-countries-width);
                min-width: 200px;
            }

            sp-table-head-cell:nth-child(6),
            sp-table-cell:nth-child(6) {
                flex: 1 0 var(--offer-column-promo-code-width);
                width: var(--offer-column-promo-code-width);
                min-width: 200px;
            }

            sp-table-head-cell:nth-child(7),
            sp-table-cell:nth-child(7) {
                flex: 1 0 var(--offer-column-product-arrangement-width);
                width: var(--offer-column-product-arrangement-width);
            }

            sp-table-head-cell:nth-child(9),
            sp-table-cell:nth-child(9),
            sp-table-head-cell:nth-child(10),
            sp-table-cell:nth-child(10) {
                flex: 1 0 var(--offer-column-type-width);
                width: var(--offer-column-type-width);
            }

            sp-table-head-cell:nth-child(11),
            sp-table-cell:nth-child(11),
            sp-table-head-cell:nth-child(12),
            sp-table-cell:nth-child(12) {
                flex: 1 0 var(--offer-column-segment-width);
                width: var(--offer-column-segment-width);
            }

            .offer-head-cell,
            .offer-cell {
                min-width: 160px;
                max-width: 260px;
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

                .copyable-value + .countries {
                    margin-top: var(--spectrum-spacing-300);
                }
            }

            .promo-code-cell {
                ul,
                li {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                }

                li:not(:last-child) {
                    margin-bottom: var(--spectrum-spacing-300);
                }

                .promo-code {
                    font-weight: bold;
                }
            }

            .countries {
                color: var(--spectrum-table-row-text-color);
            }
        }

        .empty-state {
            width: 100%;
        }
    `,
];
