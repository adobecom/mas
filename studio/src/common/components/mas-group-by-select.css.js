import { css } from 'lit';

export const groupBySelectStyles = css`
    :host {
        display: block;
    }

    .group-by-toolbar {
        display: flex;
        align-items: center;
        gap: var(--spectrum-spacing-200);
        margin-block-end: var(--spectrum-spacing-200);
    }

    .group-by-label {
        font-weight: 600;
        color: var(--spectrum-gray-800);
    }

    :host([disabled]) .group-by-label {
        opacity: 0.4;
    }

    .group-by-track {
        background: var(--spectrum-gray-100);
        border-radius: 10px;
        padding: 4px;
        --mod-actiongroup-horizontal-spacing-regular: 4px;
    }

    .group-by-track sp-action-button {
        --mod-actionbutton-border-width: 2px;
        --mod-actionbutton-border-radius: 8px;
    }

    .group-by-track sp-action-button:not([selected]) {
        --mod-actionbutton-background-color-default: transparent;
        --mod-actionbutton-background-color-hover: var(--spectrum-gray-200);
        --mod-actionbutton-border-color-default: transparent;
        --mod-actionbutton-content-color-default: var(--spectrum-gray-700);
        --mod-actionbutton-content-color-hover: var(--spectrum-gray-900);
    }

    .group-by-track sp-action-button[selected] {
        --mod-actionbutton-background-color-default: var(--spectrum-white, #fff);
        --mod-actionbutton-background-color-hover: var(--spectrum-white, #fff);
        --mod-actionbutton-background-color-down: var(--spectrum-white, #fff);
        --mod-actionbutton-border-color-default: var(--spectrum-black, #000);
        --mod-actionbutton-border-color-hover: var(--spectrum-black, #000);
        --mod-actionbutton-content-color-default: var(--spectrum-black, #000);
        --mod-actionbutton-content-color-hover: var(--spectrum-black, #000);
    }
`;
