import { css } from 'lit';

export const styles = css`
    :host {
        --link-color: #3b63fb;
        --link-hover-color: #1d3ecf;
        --table-row-background-color-rgba: 229, 240, 254;

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
                --system-picker-background-color-default: transparent;
                border: 1px solid var(--spectrum-gray-300);
                border-radius: 12px;
            }
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

            .fragments-table {
                --spectrum-table-header-background-color: var(--spectrum-gray-50);
                --spectrum-gray-900-rgb: var(--table-row-background-color-rgba);
                --spectrum-blue-900-rgb: var(--table-row-background-color-rgba);
                --spectrum-table-row-hover-opacity: 1;
                --spectrum-table-selected-row-background-opacity: 1;
                --spectrum-table-selected-row-background-opacity-hover: 1;
                --spectrum-table-border-radius: 0;

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

                    sp-table-head-cell:first-of-type {
                        border-top-left-radius: 12px;
                        max-width: 40px;
                        min-width: 40px;
                    }

                    sp-table-head-cell:nth-of-type(2) {
                        max-width: 40px;
                        min-width: 40px;
                    }

                    sp-table-head-cell:last-of-type {
                        align-content: center;
                        border-top-right-radius: 12px;
                    }
                }

                sp-table-head-cell,
                sp-table-cell {
                    align-content: center;
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
                    grid-template-columns: 160px auto;
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
