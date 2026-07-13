import { css } from 'lit';

export const styles = css`
    :host {
        display: contents;
    }

    sp-underlay:not([open]) + sp-dialog {
        display: none;
    }

    sp-underlay + sp-dialog {
        position: fixed;
        border-radius: 16px;
        z-index: 1;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 480px;
        background: var(--spectrum-white);
        max-height: 650px;
    }

    .section-title {
        font-weight: 700;
        margin: 12px 0 4px;
        font-size: 14px;
    }
    .ref-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 8px;
    }

    .ref-item {
        background: var(--spectrum-blue-100, #e8f0fe);
        border-radius: 8px;
        padding: 10px 12px;
    }

    .ref-path {
        font-size: 12px;
        color: var(--spectrum-global-color-gray-700);
        margin-left: 24px;
    }

    .select-all-row {
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--spectrum-global-color-gray-300);
    }

    .intro {
        margin-bottom: 12px;
        color: var(--spectrum-global-color-gray-800);
    }

    h2 {
        padding-block-end: 0;
    }
`;
