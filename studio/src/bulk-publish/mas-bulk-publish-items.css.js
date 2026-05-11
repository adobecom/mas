import { css } from 'lit';
export const styles = css`
    :host {
        display: block;
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
        margin-top: 12px;
    }
    .items-box {
        border: 1px solid var(--spectrum-gray-300, #dadada);
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 4px;
    }
    .items-table-header {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background: var(--spectrum-gray-100, #f3f3f3);
        border-bottom: 1px solid var(--spectrum-gray-300, #dadada);
        font-size: 14px;
        font-weight: 700;
        user-select: none;
    }
    .items-table-header span:first-child {
        flex: 1;
    }
    .items-table-header span:nth-child(2) {
        width: 160px;
        flex-shrink: 0;
    }
    .items-table-header span:last-child {
        width: 120px;
        flex-shrink: 0;
    }
    sp-textfield.url-input {
        width: 100%;
    }
    .add-by-search {
        margin-top: 8px;
        --mod-actionbutton-background-color-default: var(--spectrum-gray-100, #f5f5f5);
        --mod-actionbutton-background-color-hover: var(--spectrum-gray-200, #eaeaea);
        --mod-actionbutton-background-color-down: var(--spectrum-gray-300, #e1e1e1);
        --mod-actionbutton-background-color-focus: var(--spectrum-gray-100, #f5f5f5);
        --mod-actionbutton-border-color-default: transparent;
        --mod-actionbutton-border-color-hover: transparent;
        --mod-actionbutton-border-color-down: transparent;
        --mod-actionbutton-border-color-focus: transparent;
        border-radius: var(--spectrum-corner-radius-100, 4px);
    }
    .warning {
        display: none;
    }
    ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    li {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid var(--spectrum-gray-200, #eaeaea);
        gap: 8px;
    }
    li:last-child {
        border-bottom: none;
    }
    li a {
        color: var(--spectrum-gray-800, #292929);
        text-decoration: underline;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        min-width: 0;
    }
    li .url-spacer {
        flex: 1;
    }
    .actions-cell {
        width: 120px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
    }
    li.footer-row {
        border-top: 1px solid var(--spectrum-gray-300, #dadada);
        border-bottom: none;
        font-weight: 700;
        font-size: 14px;
    }
    .footer-count {
        white-space: nowrap;
    }
    .status-cell {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        white-space: nowrap;
        width: 160px;
        flex-shrink: 0;
        user-select: none;
    }
    .status-valid {
        color: var(--spectrum-green-700, #188153);
    }
    .status-error {
        color: var(--spectrum-orange-600, #d45b00);
    }
    .status-pending {
        color: var(--spectrum-gray-600, #505050);
    }
`;
