import { css } from 'lit';

export const managerStyles = css`
    :host {
        display: none;
        pointer-events: none;
    }

    :host([open]) {
        position: fixed;
        inset: 0;
        z-index: 1500;
        display: block;
        pointer-events: auto;
    }

    .dialog-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
    }

    .dialog-container {
        background: var(--spectrum-white);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        padding: 24px;
        min-width: 560px;
        max-width: 800px;
        width: min(90vw, 800px);
        max-height: min(80vh, 900px);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    .dialog-header {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--spectrum-gray-200);
        flex-shrink: 0;
    }

    .dialog-body {
        overflow-y: auto;
        flex: 1 1 auto;
        min-height: 0;
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid var(--spectrum-gray-200);
        flex-shrink: 0;
    }

    .select-all-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0 12px;
    }

    .country-count {
        font-size: 12px;
        color: var(--spectrum-gray-600);
    }

    .country-list {
        display: block;
    }

    .country-section {
        display: block;
        border: 1px solid var(--spectrum-gray-200);
        border-radius: 8px;
        margin-bottom: 8px;
        background: var(--spectrum-white);
        box-sizing: border-box;
    }

    .country-section.is-expanded {
        border-color: var(--spectrum-gray-300);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .country-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: var(--spectrum-gray-75);
        border-radius: 8px 8px 0 0;
        box-sizing: border-box;
        cursor: pointer;
    }

    .country-section:not(.is-expanded) .country-header {
        border-radius: 8px;
    }

    .country-header.is-selected {
        background: var(--spectrum-blue-100, #e8f4fd);
    }

    .country-label {
        font-weight: 600;
        font-size: 14px;
        flex: 1;
        min-width: 0;
    }

    .expand-toggle {
        flex-shrink: 0;
        --mod-actionbutton-edge-to-text: 0;
    }

    .expand-toggle sp-icon-chevron-down {
        transition: transform 0.2s;
    }

    .expand-toggle.is-expanded sp-icon-chevron-down {
        transform: rotate(180deg);
    }

    .country-body {
        display: block;
        border-top: 1px solid var(--spectrum-gray-200);
        background: var(--spectrum-white);
        border-radius: 0 0 8px 8px;
        overflow: visible;
    }

    .country-empty {
        padding: 16px;
        font-size: 13px;
        color: var(--spectrum-gray-600);
    }

    .offer-grid {
        display: block;
        width: 100%;
        box-sizing: border-box;
    }

    .offer-grid-header,
    .offer-grid-row {
        display: grid;
        grid-template-columns: minmax(140px, 1.2fr) minmax(180px, 1.3fr) minmax(220px, 1.2fr);
        gap: 12px;
        align-items: start;
        padding: 10px 16px;
        box-sizing: border-box;
        border-top: 1px solid var(--spectrum-gray-200);
    }

    .offer-grid-header {
        font-weight: 600;
        font-size: 13px;
        background: var(--spectrum-gray-50);
        color: var(--spectrum-gray-700);
        align-items: center;
    }

    .offer-grid-row {
        font-size: 13px;
        background: var(--spectrum-white);
    }

    .offer-grid-row + .offer-grid-row {
        border-top: 1px solid var(--spectrum-gray-200);
    }

    .offer-name-cell {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }

    .offer-mnemonic {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        flex-shrink: 0;
    }

    .offer-id-cell {
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: var(--spectrum-blue-900);
        font-size: 12px;
        min-width: 0;
    }

    .offer-id-display {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .offer-id-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .alternate-offer-controls {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    .alternate-offer-label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 11px;
        color: var(--spectrum-gray-700);
        min-width: 0;
    }

    .alternate-offer-label > span {
        font-weight: 600;
    }

    .promo-code-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .custom-osi-input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 4px;
        font-size: 12px;
        box-sizing: border-box;
        background: var(--spectrum-white);
        color: var(--spectrum-gray-800);
        font-family: var(--spectrum-code-font-family, monospace);
    }

    .promo-code-input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 4px;
        font-size: 13px;
        box-sizing: border-box;
        background: var(--spectrum-white);
    }

    .promo-code-input:focus {
        outline: 2px solid var(--spectrum-blue-700);
        border-color: var(--spectrum-blue-700);
    }

    .restore-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: none;
        background: none;
        padding: 0;
        margin: 0;
        font-size: 12px;
        color: var(--spectrum-blue-700);
        cursor: pointer;
        text-align: left;
    }

    .restore-link:hover {
        text-decoration: underline;
    }

    .bulk-promo-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--spectrum-gray-800);
    }

    .bulk-apply-section {
        margin-top: 8px;
        padding: 16px;
        background: var(--spectrum-blue-100, #e8f4fd);
        border-radius: 8px;
        border: 1px solid var(--spectrum-blue-300, #b3d9f7);
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-sizing: border-box;
    }

    .bulk-apply-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .bulk-apply-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--spectrum-blue-900);
    }

    .bulk-apply-row {
        display: flex;
        align-items: flex-end;
        gap: 8px;
    }

    .bulk-apply-row .promo-code-field {
        flex: 1;
        min-width: 0;
    }

    .bulk-promo-input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 4px;
        font-size: 13px;
        box-sizing: border-box;
    }

    .success-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background: var(--spectrum-seafoam-100, #d4f5ec);
        border: 1px solid var(--spectrum-seafoam-300, #7adec9);
        border-radius: 8px;
        font-size: 13px;
        color: var(--spectrum-green-900, #086444);
        margin-top: 8px;
        box-sizing: border-box;
    }
`;
