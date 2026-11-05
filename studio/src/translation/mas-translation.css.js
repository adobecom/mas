import { css } from 'lit';
import { tableHeaderBaseStyles, tableBodyBaseStyles, tableCellBaseStyles } from './translation-common-styles.css.js';
import { skeletonStyles } from '../common/skeleton-styles.css.js';

export const styles = [
    skeletonStyles,
    tableHeaderBaseStyles,
    tableBodyBaseStyles,
    tableCellBaseStyles,
    css`
        .translation-container {
            padding: 32px;
            position: relative;

            .translation-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                border-bottom: 2px solid var(--spectrum-gray-100);
            }

            .translation-toolbar {
                display: flex;
                align-items: center;
                padding-bottom: 20px;

                sp-search {
                    margin-right: 6px;
                }
            }

            .item-table {
                sp-table-head-cell:last-child,
                sp-table-cell:last-child {
                    max-width: 100px;
                }

                sp-table-head-cell.align-right {
                    text-align: right;
                }
            }

            .action-cell {
                display: flex;
                justify-content: center;
                --system-action-button-background-color-default: transparent;
            }

            .duplicating-overlay {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.7);
                z-index: 10;
            }
        }
    `,
];
