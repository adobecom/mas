import { css } from 'lit';

export const styles = css`
    .placeholders-container {
        height: 100%;
        min-height: 200px;
        border-radius: 8px;
        padding: 24px;
        background-color: var(--spectrum-white);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
        position: relative;
    }

    .placeholders-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }

    .header-left {
        display: flex;
        align-items: center;
    }

    .search-filters-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        gap: 14px;
    }

    .placeholders-title {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    .placeholders-title h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
    }

    .filters-container {
        display: flex;
        gap: 14px;
        align-items: center;
    }

    .placeholders-content {
        flex: 1;
        position: relative;
    }

    .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background-color: var(--spectrum-semantic-negative-color-background);
        color: var(--spectrum-semantic-negative-color-text);
        border-radius: 4px;
        margin-bottom: 16px;
    }

    .error-message sp-icon-alert {
        color: var(--spectrum-semantic-negative-color-icon);
    }

    sp-progress-circle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    sp-progress-circle.loading-indicator {
        top: -60px;
    }

    mas-locale-picker {
        width: 150px;
        border: 1px solid var(--spectrum-gray-700);
        border-radius: 4px;
    }

    .placeholders-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        border-radius: 8px;
        border: 1px solid var(--spectrum-gray-200);
        table-layout: fixed;
    }

    .no-placeholders-label {
        text-align: center;
    }

    .placeholders-table sp-table-head {
        background-color: var(--spectrum-gray-100);
        border-bottom: 1px solid var(--spectrum-gray-200);
    }

    .placeholders-table sp-table-head-cell {
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        color: var(--spectrum-gray-700);
        font-size: 12px;
        font-weight: 700;
    }

    .placeholders-table sp-table-head-cell:last-child,
    .placeholders-table sp-table-cell:last-child {
        max-width: 100px;
        justify-content: flex-end;
    }

    .placeholders-table sp-table-head-cell.align-right {
        text-align: right;
    }

    .placeholders-table sp-table-cell {
        display: flex;
        align-items: center;
        justify-content: flex-start;
    }

    .placeholders-table sp-table-cell,
    .placeholders-table sp-table-checkbox-cell:not([head-cell]) {
        border-block-start: var(--mod-table-border-width, var(--spectrum-table-border-width)) solid
            var(--highcontrast-table-divider-color, var(--mod-table-divider-color, var(--spectrum-table-divider-color)));
        border-radius: 0;
    }

    .placeholders-table sp-table-cell.editing-cell {
        box-sizing: border-box;
        display: inline-flex;
        padding: 0 30px 0 0;
    }

    .placeholders-table sp-table-cell.updated-by {
        overflow: hidden;

        & overlay-trigger {
            overflow: hidden;
        }

        & .cell-content {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .placeholders-table sp-table-body {
        overflow: visible;
    }

    .action-cell {
        position: relative;
        box-sizing: border-box;
    }

    .action-buttons {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: flex-end;
        width: 100%;
    }

    .action-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        flex: 0 0 auto;

        &:disabled {
            filter: grayscale(1);
            opacity: 0.6;
        }
    }

    .action-button:hover {
        background-color: var(--spectrum-gray-200);
    }

    .dropdown-menu-container {
        position: relative;
    }

    .dropdown-menu {
        position: absolute;
        right: 0;
        top: 100%;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        z-index: 100;
        width: 160px;
        padding: 8px 0;
        display: flex;
        flex-direction: column;
    }

    .dropdown-item {
        flex: 1;
        align-items: center;
        padding: 8px 16px;
        cursor: pointer;
        gap: 8px;
        justify-self: flex-start;
        display: flex;
    }

    .dropdown-item:hover {
        background-color: var(--spectrum-gray-100);
    }

    .dropdown-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .dropdown-item.disabled:hover {
        background-color: transparent;
    }

    .dropdown-item span {
        flex: 1;
        display: inline-flex;
    }

    .status-cell {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        min-width: 120px;
        padding: 8px 0;
    }

    .status-cell mas-fragment-status {
        width: auto;
        display: inline-flex;
        font-weight: 500;
    }

    .edit-field-container {
        width: 100%;
        padding: 8px;
        display: flex;
    }

    .edit-field-container sp-textfield {
        width: 100%;
        flex: 1;
    }

    .edit-field-container rte-field {
        width: 100%;
        min-height: 80px;
        margin-bottom: 8px;
    }

    .rte-container {
        position: relative;
        display: block;
        width: 100%;
        min-height: 120px;
        margin: 5px 0;
    }

    sp-switch {
        display: inline-flex;
    }

    rte-field {
        display: block;
        min-height: 120px;
        border-radius: 4px;
        width: 100%;
    }

    .rich-text-cell {
        overflow: hidden;
        padding: 4px 0;
        font-size: var(--spectrum-global-font-size-100);
        line-height: var(--spectrum-global-font-line-height-medium);
        position: relative;
        text-overflow: ellipsis;
    }

    .rich-text-cell p {
        margin: 0 0 8px 0;
    }

    .rich-text-cell p:last-child {
        margin-bottom: 0;
    }

    .rich-text-cell a {
        color: var(--spectrum-blue-600);
        text-decoration: none;
    }

    .rich-text-cell a:hover {
        text-decoration: underline;
    }

    .bulk-action-container {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition:
            opacity 0.3s ease,
            visibility 0.3s ease;
        border-radius: 4px;
        background-color: var(--spectrum-semantic-negative-color-background);
        padding: 6px;
    }

    .bulk-action-container.visible {
        opacity: 1;
        visibility: visible;
    }

    .bulk-action-container sp-action-button {
        color: var(--spectrum-white);
        background-color: var(--spectrum-red-800);
        box-shadow: 1px 2px 6px rgba(0, 0, 0, 0.2);
    }

    .approve-button sp-icon-checkmark {
        color: var(--spectrum-semantic-positive-color-default, green);
    }

    .reject-button sp-icon-close {
        color: var(--spectrum-semantic-negative-color-default, red);
    }

    /* Dialog styles */
    .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 0;
        padding: var(calc(var(--swc-scale-factor) * 16px));
        width: 80vw;
        max-width: 900px;
        box-sizing: border-box;
    }

    .form-field {
        margin-bottom: var(calc(var(--swc-scale-factor) * 16px));
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .form-field:last-child {
        margin-bottom: 0;
    }

    .form-field sp-field-label {
        display: block;
        margin-bottom: var(calc(var(--swc-scale-factor) * 6px));
    }

    .form-field sp-picker,
    .form-field sp-textfield {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
    }

    .form-field mas-locale-picker {
        border: none;
        background: none;
    }

    .form-field .rte-container {
        width: 100%;
    }

    sp-table .key {
        flex: 2;
    }
    sp-table .value {
        flex: 3;
    }
`;

export default styles;
