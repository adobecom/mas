import { css } from 'lit';

export const styles = css`
    :host {
        .search {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 32px 0 20px 0;
        }

        .filters {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
            sp-picker {
                --mod-picker-background-color-default: transparent;
                border: 1px solid var(--spectrum-gray-300);
                border-radius: 12px;
            }
        }

        .container {
            display: flex;
            gap: 12px;
        }

        .loading-container {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .fragments-table {
            width: 90vw;
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
                color: var(--link-color);

                div {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    max-width: 80px;
                    overflow: hidden;
                }

                sp-button {
                    --spectrum-accent-background-color-default: transparent;
                    --spectrum-button-background-color-hover: transparent;
                    color: var(--link-color);

                    &:hover {
                        color: var(--link-hover-color);
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
    }
`;
