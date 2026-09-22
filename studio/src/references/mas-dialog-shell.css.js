import { css } from 'lit';

// Chrome shared by the fragment editor's reference modals. Each dialog keeps its own stylesheet for
// the parts that genuinely differ (width, title size, row styling) and layers it over this one.
export const dialogShellStyles = css`
    :host {
        display: contents;
    }

    /* Raise both above the sticky #preview-column (z-index auto) so the modal is not painted under
       the fragment editor's right panel. */
    sp-underlay {
        z-index: 40;
    }

    .dialog-shell {
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
        max-width: 100%;
    }

    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
    }

    .dialog-title {
        margin: 0;
        font-weight: 700;
        color: var(--spectrum-global-color-gray-900);
    }

    .dialog-close {
        flex-shrink: 0;
    }

    .table-wrapper {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
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
`;
