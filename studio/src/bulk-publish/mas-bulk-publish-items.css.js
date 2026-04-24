import { css } from 'lit';
export const styles = css`
    :host {
        display: block;
        background: var(--spectrum-gray-50, #fff);
        border: 1px solid var(--spectrum-gray-200, #eaeaea);
        border-radius: 8px;
        padding: 16px 20px;
    }
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
    }
    h3 {
        font-size: 15px;
        margin: 0;
        font-weight: 700;
    }
    .required {
        color: var(--spectrum-red-600, #d31510);
    }
    .sublabel {
        font-size: 12px;
        color: var(--spectrum-gray-700, #6d6d6d);
        margin: 8px 0 4px;
    }
    textarea {
        width: 100%;
        min-height: 140px;
        padding: 10px 12px;
        border: 1px solid var(--spectrum-gray-300, #d3d3d3);
        border-radius: 6px;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
        box-sizing: border-box;
    }
    textarea:focus {
        outline: none;
        border-color: var(--spectrum-blue-600, #2680eb);
    }
    .add-by-search {
        margin-top: 12px;
    }
    .warning {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--spectrum-orange-700, #c46f00);
        font-size: 13px;
        padding: 6px 0;
    }
    ul {
        list-style: none;
        margin: 8px 0 0;
        padding: 0;
    }
    li {
        padding: 6px 0;
        border-bottom: 1px solid var(--spectrum-gray-100, #f4f4f4);
    }
    .collapse {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
    }
`;
