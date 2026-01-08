import { css } from 'lit';

export const styles = css`
    .fragment-picker-row,
    .locale-fragments-table {
        sp-table-cell {
            display: flex;
            align-items: center;
            word-break: break-word;
        }
    }

    .fixed-size-cell {
        display: flex;
        justify-content: center;
        align-items: center;
        max-width: 40px;
        min-width: 40px;
    }

    .expand-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--spectrum-gray-800);

        &:hover {
            transform: scale(1.1);
        }

        sp-icon-chevron-down,
        sp-icon-chevron-right {
            color: inherit;
        }
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

    .locale-fragments {
        position: relative;
        padding: 0 20px 16px 44px;
        border-top: 1px solid var(--spectrum-gray-300);

        sp-table {
            position: relative;
            z-index: 1;
        }

        .tree-connectors {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
        }
    }
`;
