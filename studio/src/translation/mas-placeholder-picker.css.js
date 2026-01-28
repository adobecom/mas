import { css } from 'lit';
export const styles = css`
    :host {
        width: 90vw;
    }

    .search {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 32px 0 20px 0;
    }

    .container {
        display: flex;
    }

    sp-table {
        --mod-table-header-background-color: var(--spectrum-gray-50);
        --mod-table-border-radius: 0;
        width: 100%;

        sp-table-head {
            border-top: 1px solid var(--spectrum-gray-300);
            border-left: 1px solid var(--spectrum-gray-300);
            border-right: 1px solid var(--spectrum-gray-300);
            border-radius: 12px 12px 0 0;

            sp-table-head-cell {
                align-content: center;
            }

            sp-table-checkbox-cell:first-of-type {
                border-top-left-radius: 12px;
            }

            sp-table-head-cell:last-of-type {
                align-content: center;
                border-top-right-radius: 12px;
            }
        }

        sp-table-cell {
            display: flex;
            align-items: center;
            word-break: break-word;
        }

        .status-cell {
            display: flex;
            align-items: center;
            gap: 6px;

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: var(--spectrum-gray-500);
            }

            .status-dot.green {
                background-color: var(--spectrum-green-700);
            }

            .status-dot.blue {
                background-color: var(--spectrum-blue-800);
            }
        }
    }

    sp-table[selects='multiple'] {
        sp-table-head {
            sp-table-checkbox-cell:first-of-type {
                border-top-left-radius: 12px;
            }
        }
    }

    sp-table:not([selects='multiple']) {
        sp-table-head {
            sp-table-head-cell:first-of-type {
                border-top-left-radius: 12px;
            }
        }
    }

    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        padding: 80px;
    }
`;
