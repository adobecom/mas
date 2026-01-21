import { css } from 'lit';

export const styles = css`
    :host {
        width: 100%;
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
            }

            div:hover {
                text-decoration: underline;
                color: var(--spectrum-blue-1000);
            }

            sp-button {
                --mod-button-background-color-default: transparent;
                --mod-button-background-color-hover: transparent;
                --mod-button-content-color-default: var(--spectrum-blue-900);

                &:hover {
                    color: var(--spectrum-blue-1000);
                }

                sp-icon-copy {
                    display: block;
                    transition:
                        opacity 0.2s ease,
                        transform 0.2s ease;
                }

                sp-icon-checkmark {
                    display: none;
                    color: var(--spectrum-green-700);
                }

                &.copied {
                    sp-icon-copy {
                        display: none;
                    }

                    sp-icon-checkmark {
                        display: block;
                        animation: checkmark-pop 0.3s ease-out;
                    }
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
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 30px 0;
    }

    @keyframes checkmark-pop {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        50% {
            transform: scale(1.2);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
`;
