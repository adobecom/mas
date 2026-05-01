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
    .locales-box {
        border: 1px solid var(--spectrum-gray-300, #dadada);
        border-radius: 12px;
        padding: 4px 0;
        overflow: hidden;
    }
    ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    li {
        padding: 8px 12px;
        border-bottom: 1px solid var(--spectrum-gray-200, #eaeaea);
        font-size: 14px;
        color: var(--spectrum-gray-800, #292929);
    }
    li:last-child {
        border-bottom: none;
    }
    .empty {
        font-size: 16px;
        color: var(--spectrum-gray-800, #292929);
        margin: 0;
    }
    .collapse {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
    }
`;
