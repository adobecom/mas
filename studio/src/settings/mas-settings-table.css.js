import { css } from 'lit';

/**
 * Table-level styles for settings layout, header, rows, empty state and loading state.
 */
export const tableStyles = css`
    :host {
        display: block;
        --cell-expand-width: 60px;
        --cell-label-width: 11.67%;
        --cell-locale-width: 9.41%;
        --cell-template-width: 8.71%;
        --cell-value-width: 12.28%;
        --cell-tags-width: 11.41%;
        --cell-editor-width: 11.85%;
        --cell-datetime-width: 10.71%;
        --cell-status-width: 9.67%;
        --cell-actions-width: 9.06%;
    }

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
        background-color: var(--spectrum-white);
    }

    #settings-table sp-table-head {
        background-color: var(--spectrum-gray-75);
        height: 44px;
    }

    #settings-table sp-table-head-cell {
        display: flex;
        align-items: center;
        font-weight: 700;
        height: 44px;
        min-height: 44px;
        padding: 0 20px;
        color: var(--spectrum-gray-900);
    }

    #settings-table sp-table-head-cell.expand-column {
        padding: 0;
        justify-content: center;
    }

    #settings-table .expand-column {
        width: var(--cell-expand-width);
        min-width: var(--cell-expand-width);
        max-width: var(--cell-expand-width);
        justify-content: center;
        position: relative;
    }

    #settings-table sp-table-head-cell.label-column,
    #settings-table .mas-setting-row > .label-column {
        width: var(--cell-label-width);
        min-width: 0;
    }

    #settings-table sp-table-head-cell.locale-column,
    #settings-table .mas-setting-row > .locale-column {
        width: var(--cell-locale-width);
        min-width: 0;
    }

    #settings-table sp-table-head-cell.template-column,
    #settings-table .mas-setting-row > .template-column {
        width: var(--cell-template-width);
        min-width: 0;
    }

    #settings-table sp-table-head-cell.value-column,
    #settings-table .mas-setting-row > .value-column {
        width: var(--cell-value-width);
        min-width: 0;
    }

    #settings-table sp-table-head-cell.tags-column,
    #settings-table .mas-setting-row > .tags-column {
        width: var(--cell-tags-width);
        min-width: 0;
    }

    #settings-table sp-table-head-cell.editor-column,
    #settings-table .mas-setting-row > .editor-column {
        width: var(--cell-editor-width);
        min-width: 0;
    }

    #settings-table sp-table-head-cell.datetime-column,
    #settings-table .mas-setting-row > .datetime-column {
        width: var(--cell-datetime-width);
        min-width: 0;
    }

    #settings-table sp-table-head-cell.status-column,
    #settings-table .mas-setting-row > .status-column {
        width: var(--cell-status-width);
        min-width: 0;
    }

    #settings-table sp-table-head-cell.actions-column,
    #settings-table .mas-setting-row > .actions-column {
        width: var(--cell-actions-width);
        min-width: 0;
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
        overflow: hidden;
        background-color: var(--spectrum-white);
    }

    .mas-setting-row.is-expanded > sp-table-cell {
        border-bottom: 1px solid var(--spectrum-gray-300);
    }

    .mas-setting-row > .expand-column {
        padding: 0;
        justify-content: center;
    }

    .mas-setting-row .expand-button {
        width: 32px;
        height: 32px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .label-content {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        width: 100%;
    }

    .label-content.is-nested {
        gap: 4px;
    }

    .label-copy {
        min-width: 0;
        flex: 1;
    }

    .setting-label-text {
        display: -webkit-box;
        overflow: hidden;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        font-weight: 700;
        line-height: 18px;
        color: var(--spectrum-gray-900);
    }

    .label-info-icon {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        color: var(--spectrum-gray-700);
    }

    .summary-content,
    .value-content,
    .status-content {
        display: flex;
        align-items: center;
        min-width: 0;
        width: 100%;
    }

    .summary-content {
        gap: 6px;
    }

    .value-content {
        gap: 10px;
    }

    .value-content sp-switch {
        flex-shrink: 0;
    }

    .summary-text,
    .cell-text,
    .value-text {
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--spectrum-gray-800);
        font-size: 14px;
        line-height: 18px;
    }

    .summary-text,
    .cell-text {
        white-space: nowrap;
    }

    .value-text {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
    }

    .date-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        color: var(--spectrum-gray-800);
        font-size: 14px;
        line-height: 18px;
    }

    .status-content {
        gap: 6px;
        white-space: nowrap;
        color: var(--spectrum-gray-800);
        font-size: 14px;
        line-height: 18px;
    }

    .status-content sp-status-light {
        min-block-size: auto;
        padding: 0;
        --spectrum-statuslight-spacing-top-to-dot: 0;
        --spectrum-statuslight-spacing-top-to-label: 0;
        --spectrum-statuslight-spacing-dot-to-label: 0;
    }

    .actions-cell {
        justify-content: flex-start;
    }

    .actions-cell .row-actions-menu {
        width: 32px;
        height: 32px;
    }

    .actions-cell .row-actions-menu [slot='icon'] {
        width: 20px;
        height: 20px;
    }

    #settings-table .override-panel-row > sp-table-cell {
        border: 0;
        padding: 0;
        background-color: var(--spectrum-gray-50);
    }

    #settings-table .override-panel-row > .override-panel-hidden {
        display: none;
    }

    #settings-table .override-panel-row > .override-panel-content {
        position: relative;
        padding: 16px 20px 12px 30px;
    }

    .override-trunk-icon {
        position: absolute;
        left: 30px;
        top: 0;
        height: 64px;
        width: 1px;
        display: block;
        overflow: visible;
    }

    .override-panel-toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 16px;
    }

    .override-rows {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0;
        --override-gutter-width: 12px;
    }

    .override-row {
        display: grid;
        grid-template-columns: var(--override-gutter-width) minmax(0, 1fr);
        column-gap: 8px;
        height: 68px;
        min-height: 68px;
        position: relative;
    }

    .override-connector-cell {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: var(--override-gutter-width);
        min-width: var(--override-gutter-width);
        overflow: visible;
    }

    .override-trunk-icon svg {
        width: 1px;
        height: 100%;
    }

    .override-connector-icon {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        width: var(--override-gutter-width);
        height: 68px;
        overflow: visible;
    }

    .override-connector-icon.is-last {
        height: 37px;
    }

    .override-connector-icon svg {
        width: 16px;
        height: 100%;
        overflow: visible;
    }

    .override-content-row {
        display: grid;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        grid-template-columns:
            minmax(0, var(--cell-label-width))
            minmax(0, var(--cell-locale-width))
            minmax(0, var(--cell-template-width))
            minmax(0, var(--cell-value-width))
            minmax(0, var(--cell-tags-width))
            minmax(0, var(--cell-editor-width))
            minmax(0, var(--cell-datetime-width))
            minmax(0, var(--cell-status-width))
            minmax(0, var(--cell-actions-width));
        height: 68px;
        min-height: 68px;
        background-color: var(--spectrum-white);
        border-left: 1px solid var(--spectrum-gray-300);
        border-right: 1px solid var(--spectrum-gray-300);
    }

    .override-content-row.is-first {
        border-top: 1px solid var(--spectrum-gray-300);
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
        overflow: hidden;
    }

    .override-content-row.is-last {
        border-bottom: 1px solid var(--spectrum-gray-300);
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 12px;
        overflow: hidden;
    }

    .override-content-row:not(.is-last) {
        border-bottom: 1px solid var(--spectrum-gray-300);
    }

    .override-cell {
        min-height: 68px;
        display: flex;
        align-items: center;
        padding: 16px 20px;
        background-color: var(--spectrum-white);
        overflow: hidden;
    }

    .override-label-column {
        padding-left: 24px;
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
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        pointer-events: none;
    }
`;
