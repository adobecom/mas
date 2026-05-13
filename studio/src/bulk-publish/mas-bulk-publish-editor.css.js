import { css } from 'lit';
export const styles = css`
    :host {
        display: block;
        width: 100%;
        box-sizing: border-box;
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
        border: 1px solid var(--spectrum-gray-200, #eaeaea);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
    }
    .card h3 {
        font-size: 18px;
        margin: 0 0 8px;
        font-weight: 700;
    }
    .required {
        color: var(--spectrum-red-600, #d31510);
    }
    .field-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-width: 480px;

        sp-textfield {
            width: 100%;
        }
    }
    .field-label {
        font-size: 12px;
        color: var(--spectrum-gray-800, #4b4b4b);
    }
    .add-locales-dialog {
        --mod-dialog-confirm-large-width: 960px;
        --mod-dialog-confirm-buttongroup-padding-top: 32px;
    }
    :host {
        position: relative;
    }
    .loading-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
`;
