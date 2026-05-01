import { css } from 'lit';
export const styles = css`
    :host {
        display: block;
        background: var(--spectrum-gray-50, #fff);
        border: 1px solid var(--spectrum-gray-300, #dadada);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
    }
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }
    .header-actions {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    h3 {
        font-size: 18px;
        margin: 0;
        font-weight: 700;
    }
    .count {
        font-weight: 400;
        color: var(--spectrum-gray-600, #505050);
    }
    .required {
        color: var(--spectrum-red-600, #d31510);
    }
    .sublabel {
        font-size: 14px;
        color: var(--spectrum-gray-700, #6d6d6d);
        margin-bottom: 8px;
    }
    .items-box {
        border: 1px solid var(--spectrum-gray-300, #dadada);
        border-radius: 12px;
        padding: 4px 0;
        overflow: hidden;
    }
    .items-box textarea {
        width: 100%;
        min-height: 56px;
        padding: 8px 12px;
        border: none;
        border-top: 1px solid var(--spectrum-gray-200, #eaeaea);
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
        box-sizing: border-box;
        background: transparent;
    }
    .items-box textarea:only-child {
        border-top: none;
        min-height: 120px;
    }
    .items-box textarea:focus {
        outline: none;
    }
    .add-by-search {
        margin-top: 8px;
    }
    .warning {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--spectrum-orange-600, #d45b00);
        font-size: 14px;
        margin-bottom: 8px;
    }
    ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid var(--spectrum-gray-200, #eaeaea);
    }
    li:last-child {
        border-bottom: none;
    }
    a {
        color: var(--spectrum-gray-800, #292929);
        text-decoration: underline;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
    }
    .collapse {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
    }
`;
