import { css } from 'lit';

export const offerFieldStyles = css`
    :host {
        display: block;
    }

    .full-width {
        width: 100%;
    }

    .full-width.invalid {
        --spectrum-actionbutton-border-color-default: var(--spectrum-negative-border-color-default);
        border: 1px solid var(--spectrum-negative-border-color-default);
    }

    .offer-card {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 1px solid var(--spectrum-gray-300);
        border-radius: 8px;
    }

    .offer-details {
        display: flex;
        flex: 1 1 160px;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .offer-card sp-action-button {
        flex-shrink: 0;
    }

    .offer-details p {
        margin: 0;
    }

    .field-message {
        min-height: calc(var(--swc-scale-factor) * 20px);
    }

    sp-help-text {
        display: flex;
        align-items: center;
    }
`;
