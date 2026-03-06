import { css } from 'lit';

export const styles = css`
    .translation-container {
        padding: 32px;

        .loading-container {
            position: absolute;
            top: 50%;
            right: 50%;
            transform: translate(-50%, -50%);
        }

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

        .translation-table {
            --mod-table-header-background-color: var(--spectrum-gray-50);
            --mod-table-border-radius: 0;

            sp-table-head {
                border-top: 1px solid var(--spectrum-gray-300);
                border-left: 1px solid var(--spectrum-gray-300);
                border-right: 1px solid var(--spectrum-gray-300);
                border-radius: 12px 12px 0 0;
            }

            sp-table-head-cell,
            sp-table-cell {
                align-content: center;
            }

            sp-table-head-cell:first-of-type {
                border-top-left-radius: 12px;
            }

            sp-table-head-cell:last-of-type {
                border-top-right-radius: 12px;
            }

            sp-table-head-cell:last-child,
            sp-table-cell:last-child {
                max-width: 100px;
            }
        }

        .action-cell {
            display: flex;
            justify-content: center;
            --system-action-button-background-color-default: transparent;
        }
    }
`;
