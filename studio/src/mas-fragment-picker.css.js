import { css } from 'lit';

/** Lit `CSSResult` for {@link MasFragmentPicker} (M-Studio Select items — Figma 20653:86340). */
export const masFragmentPickerStyles = css`
    :host {
        display: contents;
    }

    sp-underlay:not([open]) + sp-dialog {
        display: none;
    }

    sp-underlay + sp-dialog {
        background: var(--spectrum-white);
        border-radius: 16px;
        left: 50%;
        position: fixed;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 2000;
    }

    sp-dialog.mas-fragment-picker-dialog {
        --spectrum-dialog-confirm-large-width: 80vw;
        max-block-size: calc(100vh - 48px);
        min-inline-size: 1100px;
    }

    sp-dialog.mas-fragment-picker-dialog[size='l'] {
        inline-size: 80vw;
    }

    .picker-shell {
        display: flex;
        flex-direction: column;
        gap: 0;
        margin-block-start: 8px;
        min-inline-size: 0;
    }

    sp-tabs.picker-tabs {
        width: 100%;
    }

    .picker-tab-panel-inner {
        display: flex;
        flex-direction: column;
        gap: 0;
        min-inline-size: 0;
        padding-block-start: 0;
    }

    sp-divider.picker-tabs-divider {
        margin-block: 0 0;
    }

    .picker-toolbar {
        align-items: center;
        display: flex;
        gap: 6px;
        margin-block-end: 12px;
        margin-block-start: 20px;
    }

    .picker-search {
        flex: 1 1 auto;
        min-inline-size: 112px;
        --mod-search-border-color-default: var(--spectrum-gray-300, #dadada);
        --mod-search-border-radius: 16px;
        --mod-search-border-width: 2px;
    }

    .picker-search:focus {
        --spectrum-focus-indicator-color: transparent;
    }

    .picker-result-count {
        color: var(--spectrum-gray-800, #292929);
        flex-shrink: 0;
        font-size: 12px;
        font-weight: 500;
        line-height: 16px;
        white-space: nowrap;
    }

    .picker-result-count-label {
        color: var(--spectrum-gray-700, #505050);
    }

    .picker-filters {
        align-items: center;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 12px;
        margin-block-end: 20px;
    }

    .picker-filters aem-tag-picker-field {
        display: block;
    }

    .picker-table-wrap {
        border: 1px solid var(--spectrum-gray-300, #dadada);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        inline-size: 100%;
        max-block-size: min(420px, 45vh);
        min-block-size: 120px;
        overflow: hidden;
    }

    .picker-table-scroll {
        flex: 1;
        min-block-size: 0;
        overflow: auto;
    }

    .picker-table-head {
        background: var(--spectrum-gray-75, #f3f3f3);
        border-block-end: 1px solid var(--spectrum-gray-300, #dadada);
        color: var(--spectrum-gray-800, #222222);
        display: grid;
        font-size: 14px;
        font-weight: 700;
        grid-template-columns:
            60px 40px minmax(140px, 0.9fr) minmax(220px, 1.1fr) minmax(220px, 1.1fr) minmax(240px, 1.4fr)
            132px;
        line-height: 18px;
        min-inline-size: 1050px;
        position: sticky;
        top: 0;
        z-index: 1;
    }

    .picker-results {
        overflow: visible;
    }

    .picker-table-head > span,
    .picker-cell {
        align-items: center;
        border-inline-end: 1px solid var(--spectrum-gray-300, #dadada);
        display: flex;
        min-inline-size: 0;
        padding-block: 16px;
        padding-inline: 20px;
    }

    .picker-table-head > span {
        min-block-size: 44px;
        padding-block: 12px;
    }

    .picker-table-head > span:last-child,
    .picker-cell:last-child {
        border-inline-end: none;
    }

    .picker-row-group {
        min-inline-size: 1050px;
    }

    .picker-row {
        border-block-end: 1px solid var(--spectrum-gray-300, #dadada);
        cursor: pointer;
        display: grid;
        grid-template-columns:
            60px 40px minmax(140px, 0.9fr) minmax(220px, 1.1fr) minmax(220px, 1.1fr) minmax(240px, 1.4fr)
            132px;
        min-block-size: 68px;
    }

    .picker-row:last-child {
        border-block-end: none;
    }

    .picker-row:hover:not(.is-selected) {
        background: var(--spectrum-gray-75, #f3f3f3);
    }

    .picker-row.is-selected {
        background: #ebeeff;
    }

    .picker-cell-expand,
    .picker-cell-checkbox {
        justify-content: center;
        padding-inline: 0;
    }

    .picker-cell-expand sp-action-button,
    .picker-cell-offer-id sp-action-button {
        flex: 0 0 auto;
    }

    .picker-cell-title,
    .picker-offer-name {
        color: var(--spectrum-gray-800, #222222);
        font-size: 14px;
        font-weight: 700;
        line-height: 18px;
        min-inline-size: 0;
    }

    .picker-cell-title,
    .picker-cell-offer-id,
    .picker-row-path {
        overflow: hidden;
    }

    .picker-cell-offer-id,
    .picker-row-path {
        color: var(--spectrum-gray-800, #222222);
        font-size: 14px;
        font-weight: 500;
        line-height: 18px;
    }

    .picker-truncate,
    .picker-row-path {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .picker-muted {
        color: var(--spectrum-gray-700, #505050);
    }

    .picker-offer {
        align-items: center;
        display: flex;
        gap: 8px;
        min-inline-size: 0;
    }

    .picker-offer-icon {
        background: var(--spectrum-gray-200, #e1e1e1);
        border-radius: 4px;
        block-size: 32px;
        flex: 0 0 32px;
        inline-size: 32px;
        object-fit: contain;
    }

    .picker-status {
        align-items: center;
        color: var(--spectrum-gray-800, #292929);
        display: flex;
        font-size: 14px;
        gap: 6px;
        line-height: 18px;
        white-space: nowrap;
    }

    .picker-status-dot {
        background: var(--spectrum-green-900, #008f5d);
        border-radius: 50%;
        block-size: 10px;
        inline-size: 10px;
    }

    .picker-status.draft .picker-status-dot {
        background: var(--spectrum-gray-600, #6d6d6d);
    }

    .picker-status.modified .picker-status-dot {
        background: var(--spectrum-orange-900, #d97000);
    }

    .picker-variation-badge {
        background: var(--spectrum-gray-200, #e1e1e1);
        border-radius: 4px;
        color: var(--spectrum-gray-800, #292929);
        font-size: 11px;
        font-weight: 600;
        margin-inline-start: 6px;
        padding-block: 2px;
        padding-inline: 6px;
        vertical-align: middle;
    }

    .picker-empty {
        color: var(--spectrum-gray-700, #505050);
        font-size: 14px;
        padding: 24px 12px;
        text-align: center;
    }

    .picker-results sp-progress-circle {
        display: block;
        margin: 32px auto;
    }

    .picker-loading-more sp-progress-circle {
        margin-block: 16px;
    }

    .picker-variation-panel,
    .picker-variation-empty {
        background: var(--spectrum-gray-50, #f8f8f8);
        border-block-end: 1px solid var(--spectrum-gray-300, #dadada);
        padding-block: 20px;
        padding-inline: 28px 20px;
    }

    .picker-variation-panel sp-tabs {
        inline-size: 100%;
    }

    .picker-variation-list {
        background: var(--spectrum-white, #ffffff);
        border-radius: 12px;
        margin-block-start: 28px;
        overflow: hidden;
    }

    .picker-variation-row {
        display: grid;
        grid-template-columns: minmax(180px, 0.9fr) minmax(220px, 1.1fr) minmax(220px, 1.1fr) minmax(240px, 1.4fr) 132px;
        min-block-size: 68px;
    }

    .picker-variation-row:not(:last-child) {
        border-block-end: 1px solid var(--spectrum-gray-400, #c6c6c6);
    }

    .picker-variation-row .picker-cell:last-child {
        border-inline-end: none;
    }

    .picker-footer-summary {
        align-items: center;
        align-self: center;
        display: flex;
        font-size: 12px;
        font-weight: 500;
        justify-content: flex-end;
        line-height: 16px;
        margin-block-end: 0;
        min-block-size: 32px;
        width: 100%;
    }

    .picker-footer-summary-num {
        color: var(--spectrum-gray-800, #292929);
    }
`;
