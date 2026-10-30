import { css } from 'lit';

export const referencesBoxStyles = css`
    :host {
        display: block;
    }

    .references-container {
        box-sizing: border-box;
        width: 600px;
        max-width: 100%;
        margin-top: var(--spectrum-spacing-300);
        background: var(--spectrum-gray-50);
        border-radius: 12px;
        padding: var(--spectrum-spacing-300);
    }

    .references-title {
        margin: 0 0 var(--spectrum-spacing-100);
        font-size: var(--spectrum-font-size-100);
        font-weight: 700;
        color: var(--spectrum-gray-900);
    }

    .artifacts-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .artifacts-header .references-title {
        margin-bottom: 0;
    }

    .artifacts-view-link {
        --mod-actionbutton-content-color-default: var(--spectrum-blue-900);
        --mod-actionbutton-content-color-hover: var(--spectrum-blue-900);
        --mod-actionbutton-content-color-down: var(--spectrum-blue-900);
        --mod-actionbutton-content-color-focus: var(--spectrum-blue-900);
        --mod-actionbutton-font-size: var(--spectrum-font-size-100);
    }

    .artifacts-view-link sp-icon-open-in {
        margin-inline-start: var(--spectrum-spacing-75);
        vertical-align: middle;
    }

    .artifacts-counts {
        display: flex;
        flex-direction: column;
        gap: var(--spectrum-spacing-50);
        margin-top: var(--spectrum-spacing-100);
    }

    .artifacts-count-line {
        font-size: var(--spectrum-font-size-100);
        color: var(--spectrum-gray-800);
    }

    .referencing-message {
        color: var(--spectrum-neutral-subdued-content-color-default);
        font-size: var(--spectrum-font-size-100);
    }
`;
