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

        .empty-state {
            width: 100%;
        }
    `,
];
