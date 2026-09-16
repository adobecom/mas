import { css } from 'lit';

export const styles = css`
    :host {
        display: contents;
    }

    /* Raise both above the sticky #preview-column (z-index auto) so the modal is not painted under
       the fragment editor's right panel. */
    sp-underlay {
        z-index: 40;
    }

    .artifacts-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 41;
        background: var(--spectrum-white);
        border-radius: 16px;
    }

    .dialog-content {
        display: flex;
        flex-direction: column;
        width: min(560px, 85vw);
        max-width: 100%;
        height: 60vh;
        min-height: 320px;
        max-height: 70vh;
        gap: 0;
    }

    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        flex-shrink: 0;
    }

    .dialog-title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--spectrum-global-color-gray-900);
    }

    .dialog-close {
        flex-shrink: 0;
    }

    .tabs-row {
        flex-shrink: 0;
    }

    .table-wrapper {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding-top: 12px;
    }

    .artifacts-table {
        flex: 1;
        min-height: 0;
    }

    .artifact-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--spectrum-global-color-gray-900);
        text-decoration: underline;
    }

    .artifact-link:hover {
        color: var(--spectrum-global-color-blue-600);
    }

    .empty-tab-message {
        padding: 24px 4px;
        color: var(--spectrum-neutral-subdued-content-color-default);
        font-size: 14px;
    }
`;
