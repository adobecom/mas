import { css } from 'lit';
import {
    tableHeaderBaseStyles,
    tableCellBaseStyles,
    tableColumnIconStyles,
    tableSelectedRowStyles,
    loadingContainerFlexStyles,
} from './translation-common-styles.css.js';

export const styles = [
    tableHeaderBaseStyles,
    tableCellBaseStyles,
    tableColumnIconStyles,
    tableSelectedRowStyles,
    loadingContainerFlexStyles,
    css`
        :host {
            width: 100%;
        }

        :host([data-type='view-only']) {
            --mod-table-selected-row-background-color: transparent;
        }

        .fragments-table {
            sp-table-head sp-table-checkbox-cell:first-of-type {
                border-top-left-radius: 12px;
            }

            sp-table-cell {
                word-break: break-word;
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
    `,
];
