import { css } from 'lit';
import { ghostButtonStyles, selectItemsFormSectionStyles } from '../common/styles/table-styles.css.js';

export const styles = [
    ghostButtonStyles,
    selectItemsFormSectionStyles,
    css`
        :host {
            display: block;
            --promotion-section-gap: 20px;
            padding-bottom: 88px;
        }

        .promotions-form-container {
            background-color: var(--spectrum-white);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            box-sizing: border-box;
            position: relative;
            padding: 6px 24px 24px 24px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            gap: var(--promotion-section-gap);
        }

        .promotions-form-panel {
            border-radius: 16px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--spectrum-gray-300);
            padding: 6px 24px 24px 24px;
            position: relative;
        }

        .promotion-loading {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            z-index: 10;
        }

        .promotions-form-panel-content {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            gap: 24px;
        }

        .promotions-form-panel-content > div {
            flex: 1;
        }

        .promotions-form-panel-divider {
            align-self: stretch;
            height: auto;
        }

        .promotions-form-fields sp-field-label {
            padding-top: 12px;
        }

        .promotions-form-fields sp-textfield {
            width: 100%;
        }

        .promotions-form-items-outer {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .promotions-form-items-outer .form-field {
            margin-top: 0;
        }

        .promotions-form-surfaces-panel sp-button {
            background: white;
        }

        .promotions-form-surfaces-panel div.label {
            align-content: center;
        }

        .surfaces-empty-state {
            display: flex;
            flex-direction: row;
            gap: 12px;
            padding: 12px;
            border: 2px dashed var(--spectrum-gray-400);
            border-radius: 8px;
        }

        #add-surfaces-overlay sp-search {
            width: 100%;
        }

        #add-surfaces-overlay sp-table {
            border-radius: 8px;
            border: 1px solid var(--spectrum-gray-200);
            --spectrum-table-row-checkbox-block-spacing: 0px;
            --spectrum-table-header-checkbox-block-spacing: 0px;
        }

        #add-surfaces-overlay #surfaces-table sp-table-cell,
        #add-surfaces-overlay #surfaces-table sp-table-head-cell {
            display: flex;
            align-items: center;
        }

        .surfaces-results {
            padding: 12px 0px;
            font-size: 12px;
            color: var(--spectrum-gray-600);
            text-align: right;
        }

        .surfaces-results span {
            font-weight: 600;
        }

        .form-field {
            padding: 20px;
            margin-top: 20px;
            border: 1px solid var(--spectrum-gray-300, #dadada);
            border-radius: 16px;
            box-shadow:
                0 0 2px 0 var(--Alias-drop-shadow-elevated-key, rgba(0, 0, 0, 0.12)),
                0 2px 6px 0 var(--Alias-drop-shadow-transition, rgba(0, 0, 0, 0.04)),
                0 4px 12px 0 var(--Alias-drop-shadow-ambient, rgba(0, 0, 0, 0.08));

            h2 {
                margin: 0 0 20px 0;
            }
        }

        .promotion-summary {
            display: block;
            width: 100%;
        }

        .promotion-summary-body {
            display: grid;
            grid-template-columns: minmax(148px, 196px) minmax(0, 1fr);
            gap: 16px;
            align-items: stretch;
        }

        .promotion-summary-stats {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .promotion-stat-card {
            border: 1px solid var(--spectrum-gray-200);
            border-radius: 8px;
            padding: 16px;
            background: var(--spectrum-white);
            box-sizing: border-box;
            flex: 1;
        }

        .promotion-stat-label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: var(--spectrum-gray-700);
            margin-bottom: 8px;
        }

        .promotion-stat-value {
            font-size: 28px;
            font-weight: 700;
            line-height: 1.1;
            color: var(--spectrum-gray-900);
        }

        .promotion-codes-by-country {
            border: 1px solid var(--spectrum-gray-200);
            border-radius: 8px;
            padding: 16px;
            background: var(--spectrum-white);
            box-sizing: border-box;
            min-width: 0;
            height: 100%;
        }

        .promotion-codes-title {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 400;
            margin-bottom: 12px;
            color: var(--spectrum-gray-700);
        }

        .promo-codes-summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        .promo-codes-summary-table th,
        .promo-codes-summary-table td {
            border: 1px solid var(--spectrum-gray-200);
            padding: 8px 12px;
            text-align: left;
            vertical-align: top;
        }

        .promo-codes-summary-table th {
            background: var(--spectrum-gray-75);
            font-weight: 600;
            color: var(--spectrum-gray-800);
        }

        .promo-codes-summary-table td:first-child {
            font-family: var(--spectrum-code-font-family, monospace);
            white-space: nowrap;
        }

        .promotion-items-empty {
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
            box-sizing: border-box;
        }

        .promotion-empty-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            width: 100%;
        }

        .promotion-empty-toolbar sp-tabs {
            flex: 1;
            min-width: 0;
        }

        .promotion-empty-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }

        .promotion-empty-panel {
            width: 100%;
            box-sizing: border-box;
        }

        .offers-empty-state {
            display: flex;
            flex-direction: row;
            gap: 12px;
            padding: 12px 24px;
            border: 1px dashed var(--spectrum-gray-800);
            border-radius: 10px;
            width: 100%;
            box-sizing: border-box;
        }

        .offers-empty-state .label {
            align-content: center;
        }

        .offers-empty-state sp-button {
            background: white;
        }

        .fragments-gated-empty-state {
            display: flex;
            flex-direction: row;
            gap: 12px;
            padding: 12px 24px;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 10px;
            width: 100%;
            box-sizing: border-box;
            background: var(--spectrum-white);
            align-items: flex-start;
        }

        .fragments-gated-empty-state sp-icon-apps {
            flex-shrink: 0;
            color: var(--spectrum-gray-600);
        }

        .fragments-gated-empty-state .label {
            align-content: center;
            color: var(--spectrum-gray-800);
        }

        .selected-items {
            display: flex;
            flex-direction: column;
            gap: 20px;

            .selected-items-header {
                display: flex;
                justify-content: space-between;
                align-items: center;

                h2 {
                    margin: 0;

                    span {
                        font-weight: 500;
                    }
                }

                .toggle-btn {
                    --mod-button-background-color-down: var(--spectrum-gray-300);
                    --mod-button-content-color-default: var(--spectrum-gray-800);
                    --mod-button-content-color-hover: var(--spectrum-gray-900);
                }

                .toggle-btn sp-icon-chevron-down {
                    transition: transform 0.2s;
                }

                .toggle-btn.is-expanded sp-icon-chevron-down {
                    transform: rotate(180deg);
                }
            }

            h2 sp-icon-asterisk100 {
                width: 10px;
                height: 10px;
            }
        }

        h1,
        h2 {
            color: var(--spectrum-neutral-content-color-default);
        }

        h2 sp-icon-asterisk100 {
            width: 10px;
            height: 10px;
        }

        .confirm-dialog-overlay {
            sp-dialog-wrapper {
                z-index: 11;
            }
        }

        .duplicating-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .end-date-row {
            display: flex;
            align-items: center;
            gap: var(--spectrum-spacing-200, 16px);
        }

        .end-date-row input[type='datetime-local']:disabled {
            opacity: 0.4;
        }

        .promotion-tag-field {
            align-items: flex-start;
            justify-content: center;
        }
    `,
];

export default styles;
