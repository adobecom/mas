import { css } from 'lit';

// Layout shared by the reference dialogs: a flex column whose table body scrolls instead of
// growing the modal.
export const dialogTableStyles = css`
    :host {
        display: contents;
    }

    .dialog-content {
        display: flex;
        flex-direction: column;
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
