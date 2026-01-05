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
