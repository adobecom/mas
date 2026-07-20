import { css } from 'lit';
import { ghostButtonStyles } from '../styles/table-styles.css.js';

export const styles = [
    ghostButtonStyles,
    css`
        .dialog-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
        }

        .dialog-header h2 {
            margin: 0;
            white-space: nowrap;
            font-size: 18px;
        }

        .dialog-header sp-search {
            flex: 1;
            max-width: 400px;
        }

        :host {
            display: flex;
            flex-direction: column;
            min-width: 80vw;
            max-height: 70vh;
            min-height: 50vh;
        }

        sp-tabs {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
        }

        sp-tab-panel[selected] {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            gap: 12px;
            margin-top: 8px;
            border-top: 1px solid var(--spectrum-gray-300);
            padding-top: 16px;
        }

        .container {
            display: flex;
            gap: 16px;
            flex: 1;
            min-height: 0;
            width: 100%;
            padding-bottom: 48px;
        }

        mas-select-items-table {
            flex: 1;
            min-width: 0;
            min-height: 0;
            display: flex;
            overflow-x: auto;
        }

        mas-selected-items {
            min-width: 0;
            width: 308px;
        }

        .container:not(.show-selected) mas-selected-items {
            display: none;
        }

        .container.view-only {
            display: flex;
            width: 100%;
            padding-bottom: 0;
        }

        sp-tab-panel.view-only {
            border-top: none;
            margin-top: 0;
            padding: 20px 0 0 0;
        }

        sp-toast {
            position: fixed;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
        }

        .tabs-container {
            position: relative;
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        .tabs-container sp-tabs {
            flex: 1;
            min-height: 0;
        }

        .tabs-container.import-mode {
            flex: initial;
            flex-direction: row;
            align-items: center;
        }

        .tabs-container.import-mode sp-tabs {
            flex: 1;
        }

        .tabs-container.import-mode .import-url-btn {
            position: static;
            flex-shrink: 0;
        }

        .import-url-btn {
            position: absolute;
            top: 6px;
            right: 0;
        }

        .import-url-view {
            display: flex;
            flex: 1;
            flex-direction: column;
            gap: 8px;
            min-height: 0;
            margin-top: 8px;
            border-top: 1px solid var(--spectrum-gray-300);
            padding-top: 16px;
            padding-bottom: 48px;
        }

        .import-url-heading {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }

        .import-url-label {
            margin: 0;
            font-size: 14px;
        }

        .import-url-content {
            flex: 1;
            display: flex;
            gap: 16px;
            min-height: 0;
            overflow: hidden;
        }

        .import-selected-panel {
            width: 308px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        .import-selected-panel mas-selected-items {
            flex: 1;
            min-height: 0;
        }

        .import-url-left {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .import-items-box {
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 4px;
            overflow: hidden;
        }

        .import-items-header,
        .import-item-row,
        .import-footer-row {
            display: grid;
            grid-template-columns: 1fr 120px 100px;
            align-items: center;
            padding: 6px 10px;
            gap: 8px;
        }

        .import-items-header {
            background: var(--spectrum-gray-100, #f5f5f5);
            border-bottom: 1px solid var(--spectrum-gray-300);
            font-size: 12px;
            font-weight: 600;
            color: var(--spectrum-gray-700, #464646);
        }

        .import-items-list {
            list-style: none;
            margin: 0;
            padding: 0;
            max-height: 200px;
            overflow-y: auto;
        }

        .import-item-row {
            border-bottom: 1px solid var(--spectrum-gray-200);
        }

        .import-footer-row {
            background: var(--spectrum-gray-75, #f8f8f8);
            border-top: 1px solid var(--spectrum-gray-300);
            font-size: 12px;
        }

        .import-item-link {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 13px;
            color: var(--spectrum-blue-900, #1473e6);
            text-decoration: underline;
        }

        .import-item-status {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
        }

        .status-valid {
            color: var(--spectrum-green-700, #188153);
        }

        .status-error {
            color: var(--spectrum-red-600, #d31510);
        }

        .status-pending {
            color: var(--spectrum-gray-600, #505050);
        }

        .import-invalid-warning {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            margin: 0 0 12px;
            font-size: 12px;
            color: var(--spectrum-red-600, #d31510);
        }

        .import-items-header > span:last-child {
            text-align: center;
        }

        .import-actions-cell {
            display: flex;
            justify-content: center;
        }

        .footer-count {
            font-weight: 600;
        }

        .import-url-input-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-height: 0;
        }

        .import-url-input {
            flex: 1;
            resize: none;
            border: 1px solid var(--spectrum-gray-400);
            border-radius: 4px;
            outline: none;
            padding: 8px;
            font-family: inherit;
            font-size: 14px;
            background: transparent;
            color: inherit;
            min-height: 60px;
        }

        .import-url-input:focus {
            border-color: var(--spectrum-blue-800);
            outline: 2px solid var(--spectrum-blue-800);
            outline-offset: -2px;
        }

        .selected-items-count {
            position: fixed;
            bottom: 95px;
            right: 42px;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 6px;

            sp-button {
                min-width: 156px;
                font-weight: 500;
            }

            sp-button[disabled] {
                sp-icon {
                    opacity: 0.2;
                }
            }

            sp-icon {
                transform: scaleX(1);
                transition: transform 0.3s ease-in-out;
            }

            sp-icon.flipped {
                transform: scaleX(-1);
            }
        }
    `,
];
