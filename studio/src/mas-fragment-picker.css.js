import { css } from 'lit';

export const styles = css`
    :host {
        --link-color: #3b63fb;
        --link-hover-color: #1d3ecf;

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
        }

        .container {
            display: flex;
            gap: 12px;
            padding-bottom: 32px;

            .loading-container {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .offer-id {
                display: flex;
                align-items: baseline;
                color: var(--link-color);

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

            .selected-files {
                display: flex;
                flex-direction: column;
                padding: 12px;
                margin: 0;
                gap: 12px;
                border: 1px solid var(--spectrum-gray-300);
                border-radius: 12px;
                background: var(--spectrum-gray-50);

                .file {
                    display: grid;
                    grid-template-columns: max-content auto;
                    grid-template-rows: max-content max-content;
                    padding: 12px;
                    gap: 4px;
                    border: 1px solid var(--spectrum-gray-300);
                    border-radius: 12px;
                    background: var(--spectrum-white);

                    h3 {
                        grid-column: 1;
                        grid-row: 1;
                        margin: 0;
                    }

                    div {
                        grid-column: 1;
                        grid-row: 2;
                        font-size: 0.875em;
                    }

                    sp-button {
                        grid-column: 2;
                        grid-row: 1 / 3;
                        align-self: center;
                        --system-button-secondary-background-color-default: transparent;
                    }
                }
            }
        }

        .selected-files-count {
            margin-bottom: 32px;
            text-align: end;
        }
    }
`;
