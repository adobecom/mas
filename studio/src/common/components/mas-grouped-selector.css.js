import { css } from 'lit';
import { ghostButtonStyles } from '../styles/table-styles.css.js';

export const styles = [
    ghostButtonStyles,
    css`
        /* Layout (spacing/card styling relative to sibling fields) is each host editor's
           concern — see mas-translation-editor.css.js and mas-promotions-editor-css.js. */
        :host {
            display: block;
        }

        h2 {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 0 0 8px 0;
        }

        h2 sp-icon-asterisk100 {
            width: 10px;
            height: 10px;
        }

        .toggle-btn {
            --mod-button-background-color-down: var(--spectrum-gray-300);
            --mod-button-content-color-default: var(--spectrum-gray-800);
            --mod-button-content-color-hover: var(--spectrum-gray-900);
        }

        .placeholder {
            color: var(--spectrum-gray-700, #505050);
            white-space: pre-line;
        }

        .empty-state {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .summary-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .summary-list {
            color: var(--spectrum-gray-800, #292929);
        }

        .grouped-selector-content {
            min-width: 600px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            height: 100%;
            overflow: hidden;
        }

        .sticky-header {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 4px 0 0 4px;
        }

        .select-all-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .item-count {
            font-size: 12px;
            color: var(--spectrum-gray-700, #505050);
        }

        .groups {
            display: flex;
            flex-direction: column;
            gap: 20px;
            overflow-y: auto;
            flex: 1;
            min-height: 0;
        }

        .region-card {
            border: 1px solid var(--spectrum-gray-300, #dadada);
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .region-header {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .region-name {
            font-size: 14px;
            font-weight: 700;
            color: var(--spectrum-gray-900, #292929);
        }

        .item-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
        }

        .no-results {
            color: var(--spectrum-gray-700, #505050);
            font-size: 14px;
            margin: 0;
        }
    `,
];
