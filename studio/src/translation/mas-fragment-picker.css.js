import { css } from 'lit';

export const styles = css`
    :host {
        --link-color: #3b63fb;
        --link-hover-color: #1d3ecf;
        width: 90vw;

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
    }
`;
