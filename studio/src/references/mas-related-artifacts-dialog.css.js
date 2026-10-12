import { css } from 'lit';

export const styles = css`
    :host {
        display: contents;
    }

    .dialog-content {
        display: flex;
        flex-direction: column;
        width: min(560px, 85vw);
        height: 60vh;
        min-height: 320px;
        max-height: 70vh;
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

    /* sp-table resolves to display:table unless the virtualizer drives it, which would strand
       sp-table-body's own flex-grow. Restoring the flex column lets the head keep its height while
       the body absorbs the rest. */
    .dialog-table {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
    }

    /* sp-table-body gives itself a tabindex -- and with it overflow:auto and keyboard reach -- as
       soon as its content is taller than its box. min-height is what lets it shrink below its rows
       so that can happen; without it the body grows to fit and nothing ever scrolls. */
    .dialog-table-body {
        min-height: 0;
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
