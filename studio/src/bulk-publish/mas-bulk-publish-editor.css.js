import { css } from 'lit';
export const styles = css`
    :host {
        display: block;
        padding: 24px 32px 120px;
        max-width: 1100px;
        margin: 0 auto;
    }
    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    h1 {
        font-size: 22px;
        font-weight: 700;
        margin: 0;
    }
    .card {
        background: var(--spectrum-gray-50, #fff);
        border: 1px solid var(--spectrum-gray-200, #eaeaea);
        border-radius: 8px;
        padding: 16px 20px;
        margin-bottom: 16px;
    }
    .card h3 {
        font-size: 15px;
        margin: 0 0 12px;
        font-weight: 700;
    }
    .required {
        color: var(--spectrum-red-600, #d31510);
    }
    .general-info-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 16px;
    }
    .field-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .field-label {
        font-size: 12px;
        color: var(--spectrum-gray-800, #4b4b4b);
    }
    sp-dialog-wrapper.selector-dialog {
        --spectrum-dialog-width: 900px;
        --mod-dialog-confirm-max-width: 900px;
    }
    sp-dialog-wrapper.selector-dialog mas-translation-languages,
    sp-dialog-wrapper.selector-dialog mas-items-selector {
        display: block;
        max-height: 60vh;
        overflow: auto;
    }
`;
