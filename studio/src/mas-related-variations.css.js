import { css } from 'lit';
import { skeletonStyles } from './common/skeleton-styles.css.js';

export const styles = [
    skeletonStyles,
    css`
        .related-variations-container {
            width: 600px;
            margin-top: 16px;

            .related-variations-title {
                margin: 0 0 8px;
                font-size: 14px;
                font-weight: 700;
                color: var(--spectrum-gray-900, #292929);
            }

            .variation-type-section {
                background: var(--spectrum-gray-50, #f8f8f8);
                border-radius: 12px;
                padding: 16px;
            }

            .variation-type-section + .variation-type-section {
                margin-top: 16px;
            }

            .variation-type-toggle {
                --mod-actionbutton-background-color-default: transparent;
                --mod-actionbutton-content-color-default: var(--spectrum-gray-900, #292929);
                --mod-actionbutton-font-weight: 700;
                width: 100%;
                justify-content: flex-start;
                margin: 0;
                font-weight: bold;
            }

            .variation-type-toggle:hover {
                --mod-actionbutton-content-color-hover: var(--spectrum-blue-800, #3b63fb);
            }

            .empty-variations-message {
                padding: 12px 4px;
                color: var(--spectrum-gray-700, #6e6e6e);
                font-size: 14px;
            }

            sp-table {
                margin-top: 12px;
            }

            sp-table-cell {
                display: flex;
                align-items: center;
            }

            sp-table-cell.path,
            sp-table-head-cell.path {
                flex: 0 0 200px;
                width: 200px;
            }

            sp-table-cell.path {
                white-space: normal;
                word-break: break-word;
            }
        }
    `,
];
