import { css } from 'lit';

// Layered over dialogShellStyles, which supplies the overlay, frame, header and scroll plumbing.
export const styles = css`
    .dialog-content {
        width: min(560px, 85vw);
        height: 60vh;
        min-height: 320px;
        max-height: 70vh;
        gap: 0;
    }

    .dialog-header {
        margin-bottom: 8px;
    }

    .dialog-title {
        font-size: 18px;
    }

    .tabs-row {
        flex-shrink: 0;
    }

    .table-wrapper {
        padding-top: 12px;
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
