import { css } from 'lit';

export const styles = css`
    :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .compchart-section {
        box-sizing: border-box;
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 12px;
        padding: 16px;
        background: var(--spectrum-white);
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: auto;
    }

    .section-header {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        flex-wrap: wrap;
    }

    .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .section-title h2 {
        color: var(--spectrum-gray-900);
        font-size: 22px;
        font-weight: 700;
        line-height: 26px;
        margin: 0;
    }

    .editor-view-toggle {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px;
        min-width: 120px;
        min-height: 32px;
        border-radius: 8px;
        background: var(--spectrum-gray-200);
        box-sizing: border-box;
    }

    .editor-view-toggle button {
        appearance: none;
        border: 2px solid transparent;
        border-radius: 8px;
        min-height: 32px;
        padding: 5px 12px;
        background: transparent;
        color: var(--spectrum-gray-700);
        font:
            700 14px/18px 'Adobe Clean',
            var(--spectrum-sans-font-family-stack);
        cursor: pointer;
    }

    .editor-view-toggle button[aria-selected='true'] {
        border-color: var(--spectrum-gray-900);
        background: var(--spectrum-white);
        color: var(--spectrum-gray-900);
    }

    .editor-view-toggle button:focus-visible {
        outline: 2px solid var(--spectrum-focus-indicator-color);
        outline-offset: 2px;
    }

    .compchart-grid {
        display: grid;
        grid-template-columns: minmax(240px, 1.4fr) repeat(var(--compchart-editor-columns), minmax(180px, 1fr));
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 12px;
        overflow: hidden;
    }

    .compchart-header-cell {
        padding: 12px 16px;
        background: var(--spectrum-gray-100);
        font-weight: 700;
        border-bottom: 1px solid var(--spectrum-gray-300);
        border-right: 1px solid var(--spectrum-gray-300);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .compchart-header-title {
        flex: 1;
        min-width: 0;
    }

    .compchart-restore-all {
        color: var(--spectrum-accent-color-900);
        flex: 0 0 auto;
        font-weight: 400;
        text-decoration: underline;
        white-space: nowrap;
    }

    .compchart-header-cell:last-child {
        border-right: none;
    }

    .compchart-group-header {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: auto auto minmax(0, 1fr) auto auto;
        gap: 8px;
        align-items: center;
        padding: 8px 12px;
        background: var(--spectrum-gray-200);
        border-bottom: 1px solid var(--spectrum-gray-300);
    }

    .compchart-group-header.section-spaced {
        margin-top: 16px;
    }

    .compchart-group-header.dragover {
        box-shadow: inset 0 2px 0 var(--spectrum-blue-500);
    }

    .compchart-group-header.dragover-after {
        box-shadow: inset 0 -2px 0 var(--spectrum-blue-500);
    }

    .compchart-group-header.dragging {
        opacity: 0.5;
    }

    .compchart-chevron {
        background: none;
        border: none;
        align-items: center;
        padding: 4px;
        cursor: pointer;
        display: flex;
        height: 28px;
        justify-content: center;
        width: 28px;
    }

    .compchart-row-label,
    .compchart-cell {
        padding: 10px 12px;
        border-bottom: 1px solid var(--spectrum-gray-300);
        border-right: 1px solid var(--spectrum-gray-300);
        background: var(--spectrum-white);
        display: flex;
        align-items: center;
        gap: 6px;
        box-sizing: border-box;
        min-width: 0;
    }

    .compchart-cell:last-child {
        border-right: none;
    }

    .compchart-overridden-cell {
        background: var(--spectrum-blue-100);
        border-color: var(--spectrum-blue-400);
    }

    .compchart-cell-restore {
        color: var(--spectrum-accent-color-900);
        flex: 0 0 auto;
    }

    .compchart-row-label {
        background: var(--spectrum-gray-50);
    }

    .compchart-row-label.dragover {
        box-shadow: inset 0 2px 0 var(--spectrum-blue-500);
    }

    .compchart-row-label.dragover-after {
        box-shadow: inset 0 -2px 0 var(--spectrum-blue-500);
    }

    .compchart-row-label.dragging {
        opacity: 0.5;
    }

    .compchart-cell-value {
        display: flex;
        align-items: center;
        flex: 1;
        min-width: 0;
        width: 100%;
        min-height: 28px;
        padding: 0 4px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: inherit;
        font: inherit;
        line-height: inherit;
        text-align: left;
        cursor: text;
        overflow-wrap: anywhere;
        word-break: break-word;
    }

    .compchart-cell-value {
        min-height: 62px;
        }
    

    .compchart-cell-value rte-field {
        display: block;
        flex: 1;
        width: 100%;
        color: inherit;
        font: inherit;
        line-height: inherit;
        min-width: 0;
    }

    .compchart-cell-value p,
    .compchart-cell-value h4,
    .compchart-cell-value div {
        margin: 0;
        padding: 0;
        max-width: 100%;
        min-width: 0;
        overflow-wrap: anywhere;
        word-break: break-word;
    }

    .compchart-group-title {
        font-weight: 700;
    }

    .compchart-rte-placeholder {
        color: var(--spectrum-gray-600);
        font-style: italic;
    }

    .compchart-row-actions {
        display: flex;
        align-items: center;
        gap: 2px;
    }

    .compchart-empty-cell {
        color: var(--spectrum-gray-600);
        font-style: italic;
    }

    .compchart-add-row {
        grid-column: 1 / -1;
        display: flex;
        justify-content: center;
        padding: 8px;
        background: var(--spectrum-white);
        border-bottom: 1px solid var(--spectrum-gray-300);
    }

    .compchart-add-group {
        margin-top: 12px;
        display: flex;
        justify-content: center;
    }

    sp-dialog {
        min-width: 360px;
    }

    .compchart-cards-section {
        margin-bottom: 16px;
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 12px;
        padding: 20px;
        background: var(--spectrum-white);
    }

    .compchart-cards-section.dragover {
        border-style: solid;
        border-color: var(--spectrum-blue-500);
        background: var(--spectrum-blue-100);
    }

    .compchart-cards-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
    }

    .compchart-cards-title {
        color: var(--spectrum-gray-900);
        font-size: 18px;
        font-weight: 700;
        line-height: 22px;
        margin: 0;
    }

    .compchart-cards-table-scroll {
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 12px;
        overflow: auto;
    }

    .compchart-cards-table {
        min-width: 1050px;
    }

    .compchart-cards-table-head,
    .compchart-card-row {
        display: grid;
        grid-template-columns:
            116px minmax(140px, 0.9fr) minmax(220px, 1.1fr) minmax(220px, 1.1fr) minmax(240px, 1.4fr)
            132px;
    }

    .compchart-cards-table-head {
        background: var(--spectrum-gray-75);
        border-bottom: 1px solid var(--spectrum-gray-300);
        color: var(--spectrum-gray-800);
        font-size: 14px;
        font-weight: 700;
        line-height: 18px;
    }

    .compchart-cards-table-head > span,
    .compchart-card-cell {
        align-items: center;
        border-right: 1px solid var(--spectrum-gray-300);
        display: flex;
        min-width: 0;
        padding: 16px 20px;
    }

    .compchart-cards-table-head > span {
        min-height: 44px;
        padding-block: 12px;
    }

    .compchart-cards-table-head > span:last-child,
    .compchart-card-cell:last-child {
        border-right: none;
    }

    .compchart-card-row {
        background: var(--spectrum-white);
        border-bottom: 1px solid var(--spectrum-gray-300);
        min-height: 68px;
    }

    .compchart-card-row.dragover {
        box-shadow: inset 0 2px 0 var(--spectrum-blue-500);
        background: var(--spectrum-blue-100);
    }

    .compchart-card-row.dragover-after {
        box-shadow: inset 0 -2px 0 var(--spectrum-blue-500);
        background: var(--spectrum-blue-100);
    }

    .compchart-card-row.dragging {
        opacity: 0.4;
    }

    .compchart-card-handle,
    .compchart-feature-handle,
    .compchart-group-handle {
        align-items: center;
        border-radius: 6px;
        color: var(--spectrum-gray-700);
        cursor: grab;
        display: flex;
        height: 28px;
        justify-content: center;
        width: 28px;
    }

    .compchart-card-handle:hover,
    .compchart-feature-handle:hover,
    .compchart-group-handle:hover {
        background: var(--spectrum-gray-200);
        color: var(--spectrum-gray-900);
    }

    .compchart-card-handle:active,
    .compchart-feature-handle:active,
    .compchart-group-handle:active {
        cursor: grabbing;
    }

    .compchart-card-cell-controls {
        gap: 4px;
        justify-content: center;
        padding-inline: 0;
    }

    .compchart-card-title,
    .compchart-card-offer-name {
        font-weight: 600;
        color: var(--spectrum-gray-800);
    }

    .compchart-card-offer {
        align-items: center;
        display: flex;
        gap: 8px;
        min-width: 0;
    }

    .compchart-card-icon {
        background: var(--spectrum-gray-200);
        border-radius: 4px;
        height: 32px;
        flex: 0 0 32px;
        width: 32px;
        object-fit: contain;
    }

    .compchart-card-title,
    .compchart-card-offer-id,
    .compchart-card-path,
    .compchart-card-type,
    .compchart-card-price,
    .compchart-card-offer-name {
        font-size: 14px;
        line-height: 18px;
        min-width: 0;
    }

    .compchart-card-offer-id,
    .compchart-card-path,
    .compchart-card-type,
    .compchart-card-price {
        font-weight: 500;
    }

    .compchart-truncate {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .compchart-card-status {
        align-items: center;
        color: var(--spectrum-gray-800);
        display: flex;
        font-size: 14px;
        gap: 6px;
        line-height: 18px;
        white-space: nowrap;
    }

.compchart-card-variation-panel,
    .compchart-card-variation-empty {
        background: var(--spectrum-gray-50);
        border-bottom: 1px solid var(--spectrum-gray-300);
        padding: 20px 24px;
    }

    .compchart-card-variation-panel sp-tabs {
        width: 100%;
    }

    .compchart-card-variation-list {
        background: var(--spectrum-white);
        border-radius: 12px;
        margin-top: 28px;
        overflow: hidden;
    }

    .compchart-card-variation-row {
        cursor: grab;
        display: grid;
        grid-template-columns:
            52px minmax(125px, 0.8fr) minmax(185px, 1.1fr) minmax(160px, 0.9fr) minmax(90px, 0.5fr)
            minmax(125px, 0.7fr) minmax(110px, 0.6fr);
        min-height: 68px;
    }

    .compchart-card-variation-row:active {
        cursor: grabbing;
    }

    .compchart-card-variation-row.dragover {
        box-shadow: inset 0 2px 0 var(--spectrum-blue-500);
        background: var(--spectrum-blue-100);
    }

    .compchart-card-variation-row.dragover-after {
        box-shadow: inset 0 -2px 0 var(--spectrum-blue-500);
        background: var(--spectrum-blue-100);
    }

    .compchart-card-variation-row.dragging {
        opacity: 0.4;
    }

    .compchart-card-variation-row.selected {
        background: var(--spectrum-table-selected-row-background-color);
    }

    .compchart-card-variation-row:not(:last-child) {
        border-bottom: 1px solid var(--spectrum-gray-400);
    }

    .compchart-card-variation-row .compchart-card-cell {
        border-right: none;
        padding: 16px 20px;
    }

    .compchart-card-variation-row .compchart-card-cell-controls {
        padding-inline: 10px;
    }

    .compchart-card-price-value,
    .compchart-card-price-value p {
        margin: 0;
        min-width: 0;
    }

    .compchart-empty-cards {
        text-align: center;
        color: var(--spectrum-gray-600);
        padding: 12px;
    }

    sp-underlay:not([open]) + sp-dialog {
        display: none;
    }

    sp-underlay + sp-dialog {
        background: var(--spectrum-white);
        border-radius: 16px;
        left: 50%;
        max-width: 500px;
        position: fixed;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 2000;
    }

    .compchart-preview {
        overflow: auto;
    }

    .compchart-preview-locale-switcher {
        align-items: center;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-bottom: 12px;
        min-height: 32px;
    }

    .compchart-preview-locale-label {
        color: var(--spectrum-gray-900);
        font-size: 14px;
        line-height: 18px;
        white-space: nowrap;
    }

    .compchart-preview-locale-field {
        align-items: center;
        background: var(--spectrum-gray-25);
        border: 2px solid var(--spectrum-gray-300);
        border-radius: 8px;
        box-sizing: border-box;
        color: var(--spectrum-gray-900);
        display: flex;
        font-size: 14px;
        font-weight: 700;
        gap: 6px;
        height: 32px;
        justify-content: space-between;
        line-height: 18px;
        max-width: 280px;
        min-width: 196px;
        padding: 0 11px 0 12px;
    }

    .compchart-preview-locale-field span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .compchart-preview-empty {
        min-height: 240px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--spectrum-gray-600);
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 12px;
        background: var(--spectrum-gray-50);
    }
`;
