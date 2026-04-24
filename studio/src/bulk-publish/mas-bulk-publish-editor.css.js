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
    .selector-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    .selector-dialog {
        background: #fff;
        border-radius: 16px;
        width: min(960px, 96vw);
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    }
    .selector-dialog .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 28px 12px;
        border-bottom: 1px solid var(--spectrum-gray-200, #eaeaea);
    }
    .selector-dialog .dialog-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
    }
    .selector-dialog .close-btn {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
    }
    .selector-dialog .dialog-body {
        flex: 1;
        overflow: auto;
        padding: 20px 28px;
    }
    .selector-dialog .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 28px;
        border-top: 1px solid var(--spectrum-gray-200, #eaeaea);
    }
`;
