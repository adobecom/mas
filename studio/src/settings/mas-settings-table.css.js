import { css } from 'lit';

/**
 * Shared styles for mas-settings-table and mas-setting-item.
 */
export const styles = css`
    #settings-content {
        position: relative;
        min-height: 220px;
    }

    #settings-table {
        --mas-settings-border-color: var(--spectrum-gray-300, #dadada);
        --mas-settings-head-background: var(--spectrum-gray-75, #f3f3f3);
        --mas-settings-row-background: var(--spectrum-white, #ffffff);
        --mas-settings-expanded-background: var(--spectrum-gray-50, #f8f8f8);
        --mas-settings-head-color: var(--spectrum-gray-900, #222222);
        --mas-settings-body-color: var(--spectrum-gray-800, #292929);
        --mas-settings-strong-color: var(--spectrum-gray-900, #131313);
        --settings-expand-column-width: 56px;
        --settings-cell-padding-inline: 20px;
        --settings-cell-padding-block: 16px;
        width: 100%;
        border: 1px solid var(--mas-settings-border-color);
        border-radius: 12px;
        overflow: hidden;
        box-sizing: border-box;
    }

    #settings-table sp-table-head-cell {
        background-color: var(--mas-settings-head-background);
        font-size: var(--spectrum-font-size-100);
        font-weight: 700;
        color: var(--mas-settings-head-color);
        min-height: 44px;
        border-bottom: 1px solid var(--mas-settings-border-color);
        box-sizing: border-box;
    }

    #settings-table sp-table-row sp-table-cell {
        background-color: var(--mas-settings-row-background);
        border-bottom: 1px solid var(--mas-settings-border-color);
        color: var(--mas-settings-body-color);
        box-sizing: border-box;
    }

    #settings-table .expand-column {
        width: var(--settings-expand-column-width);
        min-width: var(--settings-expand-column-width);
        max-width: var(--settings-expand-column-width);
        justify-content: center;
    }

    .mas-setting-row sp-table-cell {
        padding: var(--settings-cell-padding-block) var(--settings-cell-padding-inline);
        min-height: 68px;
        box-sizing: border-box;
        vertical-align: middle;
    }

    .mas-setting-row .expand-button {
        border: 0;
        background: transparent;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--spectrum-gray-900);
    }

    .mas-setting-row .name-cell {
        min-width: 180px;
    }

    .mas-setting-row .setting-label {
        font-weight: 700;
        color: var(--mas-settings-strong-color);
    }

    .mas-setting-row .template-cell {
        color: var(--mas-settings-body-color);
    }

    .mas-setting-row .value-cell {
        white-space: nowrap;
    }

    .mas-setting-row .value-cell sp-switch {
        margin-right: 10px;
    }

    .mas-setting-row .status-cell {
        white-space: nowrap;
    }

    .mas-setting-row .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--spectrum-green-700);
    }

    .mas-setting-row .status-dot {
        margin-right: 6px;
    }

    .mas-setting-row .actions-cell {
        text-align: center;
    }

    .mas-setting-row .date-cell {
        white-space: pre-line;
    }

    .mas-setting-expanded {
        border-left: 1px solid var(--mas-settings-border-color);
        border-right: 1px solid var(--mas-settings-border-color);
        border-bottom: 1px solid var(--mas-settings-border-color);
        border-radius: 0 0 12px 12px;
        background-color: var(--mas-settings-expanded-background);
        padding: 16px 20px 16px 30px;
        margin-left: var(--settings-expand-column-width);
        margin-right: 0;
    }

    .mas-setting-expanded .settings-expanded-header {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 12px;
    }

    .mas-setting-expanded .override-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .mas-setting-expanded .override-item {
        position: relative;
        background: var(--mas-settings-row-background);
        border: 1px solid var(--mas-settings-border-color);
        border-radius: 12px;
        padding: 0;
        overflow: hidden;
    }

    .mas-setting-expanded .override-item::before {
        content: '';
        position: absolute;
        left: -18px;
        top: 50%;
        width: 14px;
        border-top: 2px solid var(--mas-settings-border-color);
    }

    .mas-setting-expanded .override-row {
        display: grid;
        grid-template-columns:
            minmax(120px, 2fr)
            minmax(90px, 1fr)
            minmax(100px, 1fr)
            minmax(140px, 2fr)
            minmax(110px, 1fr)
            minmax(120px, 1fr)
            minmax(120px, 1fr)
            minmax(110px, 1fr)
            56px;
    }

    .mas-setting-expanded .override-cell {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        min-height: 68px;
    }

    .mas-setting-expanded .override-cell:last-child {
        justify-content: center;
    }

    .mas-setting-expanded .override-label {
        font-weight: 700;
    }

    #empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 236px;
        padding: 40px 20px;
        border: 1px solid var(--mas-settings-border-color);
        border-radius: 12px;
        color: var(--spectrum-gray-900);
        box-sizing: border-box;
        text-align: center;
        background: var(--spectrum-gray-75);
    }

    .empty-state-icon {
        width: 96px;
        height: 96px;
        color: var(--spectrum-gray-900);
    }

    .empty-state-copy {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-width: 380px;
    }

    .empty-state-title {
        margin: 0;
        font-size: var(--spectrum-font-size-300);
        font-weight: 700;
        line-height: var(--spectrum-line-height-300);
        color: var(--spectrum-gray-900);
    }

    .empty-state-description {
        margin: 0;
        font-size: var(--spectrum-font-size-100);
        line-height: 1.5;
        color: var(--spectrum-gray-800);
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
