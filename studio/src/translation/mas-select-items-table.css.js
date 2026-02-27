import { css } from 'lit';

export const styles = css`
    :host {
        width: 100%;
    }

    :host([data-type='view-only']) {
        --mod-table-selected-row-background-color: transparent;
    }

    .fragments-table {
        --mod-table-header-background-color: var(--spectrum-gray-50);
        --mod-table-border-radius: 0;

        sp-table-head {
            border-top: 1px solid var(--spectrum-gray-300);
            border-left: 1px solid var(--spectrum-gray-300);
            border-right: 1px solid var(--spectrum-gray-300);
            border-radius: 12px 12px 0 0;
        }

        sp-table-head {
            border-top: 1px solid var(--spectrum-gray-300);
            border-left: 1px solid var(--spectrum-gray-300);
            border-right: 1px solid var(--spectrum-gray-300);

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

        .offer-id {
            color: var(--spectrum-blue-900);

            div {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                max-width: 80px;
                overflow: hidden;
                margin-right: 4px;
            }

            div:hover {
                text-decoration: underline;
                color: var(--spectrum-blue-1000);
            }

            sp-action-button {
                --mod-actionbutton-content-color-default: var(--spectrum-blue-900);

                &:hover {
                    --mod-actionbutton-background-color-hover: var(--spectrum-blue-300);
                    --mod-actionbutton-background-color-hover-selected: var(--spectrum-blue-300);
                }

                &:active {
                    --mod-actionbutton-background-color-down: var(--spectrum-blue-400);
                    --mod-actionbutton-background-color-down-selected: var(--spectrum-blue-400);
                }

                &:focus,
                &:focus-visible {
                    --mod-actionbutton-background-color-focus: var(--spectrum-blue-400);
                    --mod-actionbutton-background-color-focus-selected: var(--spectrum-blue-400);
                }
            }
        }

        .path {
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

    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 80px;
    }
`;
