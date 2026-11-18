import { css } from 'lit';

export const styles = css`
    .dialog-content {
        width: min(560px, 85vw);
        height: 60vh;
        min-height: 320px;
        max-height: 70vh;
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
        color: var(--spectrum-gray-900);
        text-decoration: underline;
    }

    .artifact-link:hover {
        color: var(--spectrum-blue-900);
    }

    .empty-tab-message {
        padding: 24px 4px;
        color: var(--spectrum-neutral-subdued-content-color-default);
        font-size: 14px;
    }
`;
