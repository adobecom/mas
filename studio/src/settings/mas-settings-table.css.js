import { css } from 'lit';

/**
 * Table-level styles for settings layout, header, rows, empty state and loading state.
 */
export const tableStyles = css`
    #settings-content {
        position: relative;
        min-height: 220px;
    }

    #settings-content *,
    #settings-content *::before,
    #settings-content *::after {
        box-sizing: border-box;
    }

    #settings-table {
        width: 100%;
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 12px;
        overflow: hidden;
    }

    #settings-table sp-table-head {
        background-color: var(--spectrum-gray-50);
        height: 60px;
    }

    #settings-table sp-table-head-cell {
        display: flex;
        align-items: center;
        font-weight: 700;
        min-height: 44px;
    }

    #settings-table .expand-column {
        width: 56px;
        min-width: 56px;
        max-width: 56px;
        justify-content: center;
        position: relative;
    }

    mas-setting-item {
        display: contents;
    }

    .mas-setting-row {
        height: 68px;
        min-height: 68px;
        max-height: 68px;
    }

    .mas-setting-row > sp-table-cell {
        display: flex;
        height: 68px;
        align-items: center;
        padding: 16px 20px;
        justify-content: flex-start;
    }

    #settings-table sp-table-body > mas-setting-item:has(~ mas-setting-item) .mas-setting-row > sp-table-cell {
        border-bottom: 1px solid var(--spectrum-gray-300);
    }

    #settings-table sp-table-body > mas-setting-item:has(+ .override-panel-row) .mas-setting-row > sp-table-cell {
        border-bottom: 0;
    }

    .mas-setting-row > .expand-column {
        padding: 0;
        justify-content: center;
    }

    .mas-setting-row .expand-button {
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .mas-setting-row .name-cell {
        min-width: 180px;
    }

    .mas-setting-row .setting-label {
        font-weight: 700;
    }

    .mas-setting-row .value-cell {
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .mas-setting-row .status-cell {
        white-space: nowrap;
        display: flex;
        align-items: center;
    }

    .mas-setting-row .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 6px;
    }

    .mas-setting-row .actions-cell {
        justify-content: center;
    }

    .mas-setting-row .actions-cell .row-actions-menu {
        width: 32px;
        height: 32px;
    }

    .mas-setting-row .actions-cell .row-actions-menu [slot='icon'] {
        width: 20px;
        height: 20px;
    }

    #settings-table .override-panel-row > sp-table-cell {
        border: 0;
        border-bottom: 1px solid var(--spectrum-gray-300);
        padding: 0;
        background-color: var(--spectrum-gray-50);
    }

    #settings-table sp-table-body > .override-panel-row:not(:first-child) > sp-table-cell {
        border-top: 1px solid var(--spectrum-gray-300);
    }

    #settings-table .override-panel-row > .override-panel-hidden {
        display: none;
    }

    #settings-table .override-panel-row > .override-panel-content {
        padding: 16px 20px;
    }

    .override-panel-toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 20px;
    }

    .override-table {
        width: 100%;
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 12px;
        overflow: hidden;
        background-color: var(--spectrum-white);
    }

    .override-table sp-table-head {
        background-color: var(--spectrum-gray-75);
    }

    .override-table sp-table-head-cell {
        min-height: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        padding: 8px 20px;
        font-weight: 700;
    }

    .override-table .override-table-row {
        min-height: 68px;
        height: 68px;
        max-height: 68px;
    }

    .override-table .override-table-row > sp-table-cell {
        min-height: 68px;
        height: 68px;
        display: flex;
        align-items: center;
        padding: 16px 20px;
        background-color: var(--spectrum-white);
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .override-table .override-locale-column {
        width: 195px;
        min-width: 195px;
        max-width: 195px;
    }

    .override-table .override-template-column {
        width: 195px;
        min-width: 195px;
        max-width: 195px;
    }

    .override-table .override-tags-column {
        width: 233px;
        min-width: 233px;
        max-width: 233px;
    }

    .override-table .override-actions-column {
        width: 103px;
        min-width: 103px;
        max-width: 103px;
    }

    .override-value-cell {
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .override-tags-cell {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .override-actions-cell {
        justify-content: center;
    }

    .override-actions-cell sp-action-menu {
        width: 32px;
        height: 32px;
    }

    .override-actions-cell sp-action-menu [slot='icon'] {
        width: 20px;
        height: 20px;
    }

    #empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 236px;
        padding: 40px 20px;
        border-radius: 12px;
        text-align: center;
    }

    .empty-state-icon {
        width: 96px;
        height: 96px;
    }

    .empty-state-copy {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-width: 380px;
    }

    .empty-state-title {
        margin: 0;
        font-weight: 700;
    }

    .empty-state-description {
        margin: 0;
        line-height: 1.5;
    }

    #settings-table .empty-state-row > sp-table-cell {
        border: 0;
        padding: 0;
        background-color: var(--spectrum-white);
    }

    #settings-table .empty-state-row > .empty-state-hidden {
        display: none;
    }

    #settings-table .empty-state-row > .empty-state-content {
        padding: 0;
    }

    #loading-state {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        z-index: 1000;
        pointer-events: none;
    }
`;
