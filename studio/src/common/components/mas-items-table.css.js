import { css } from 'lit';
import {
    tableHeaderStyles,
    tableCellStyles,
    tableIconCellStyles,
    tableSelectedRowStyles,
    loadingContainerStyles,
} from './common-table-styles.css.js';

export const styles = [
    tableHeaderStyles,
    tableCellStyles,
    tableIconCellStyles,
    tableSelectedRowStyles,
    loadingContainerStyles,
    css`
        :host {
            width: 100%;
        }

        .items-table {
            sp-table-head sp-table-checkbox-cell:first-of-type {
                border-top-left-radius: 12px;
            }

            sp-table-cell {
                word-break: break-word;
            }
        }

        .loading-container--flex {
            padding: 80px;
        }

        .scroll-sentinel {
            height: 1px;
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
