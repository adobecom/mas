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

    .usage-dialog {
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
        width: min(720px, 90vw);
        max-width: 100%;
        /* Sized to content so a fragment with three pages does not open a modal two thirds empty,
           while a busy fragment still scrolls inside the table rather than growing off screen. */
        min-height: 240px;
        max-height: 70vh;
    }

    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        flex-shrink: 0;
    }

    .dialog-title {
        margin: 0;
        font-size: 24px;
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
        border: 1px solid var(--spectrum-global-color-gray-300);
        border-radius: 12px;
        overflow: hidden;
    }

    .pages-table {
        flex: 0 1 auto;
        min-height: 0;
        --spectrum-table-row-height: 48px;
    }

    /* The table markup lives in this shadow root, so the cells are styled by element selector.
       Both columns are sized here rather than on the head alone, otherwise the body cells size
       themselves and the "Countries" heading drifts away from the values underneath it. */
    sp-table-head-cell:first-child,
    sp-table-cell:first-child {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    sp-table-head-cell:last-child,
    sp-table-cell:last-child {
        flex: 0 0 180px;
    }

    /* A URL is one unbreakable token: wrapping it mid-path pushes the copy button onto a second
       line and doubles the row height, so it truncates and the full value stays in the tooltip. */
    .page-url {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--spectrum-global-color-gray-900);
        font-weight: 700;
        text-decoration: none;
    }

    .page-url:hover {
        text-decoration: underline;
    }

    /* Country lists are short codes; wrapping them is cheaper than truncating, which would hide
       exactly the values the column exists to show. */
    .page-countries {
        white-space: normal;
        word-break: break-word;
        color: var(--spectrum-neutral-subdued-content-color-default);
    }

    .page-copy {
        flex: 0 0 auto;
    }

    /* Two rows can share a url and differ only in locale, so the locale is what tells them apart. */
    .page-locale {
        flex: 0 0 auto;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--spectrum-global-color-gray-200);
        color: var(--spectrum-neutral-subdued-content-color-default);
        font-size: 11px;
    }

    .usage-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        padding: 24px;
        text-align: center;
        color: var(--spectrum-neutral-subdued-content-color-default);
        font-size: 14px;
    }

    .usage-freshness {
        flex-shrink: 0;
        padding-top: 12px;
        font-size: 12px;
        color: var(--spectrum-neutral-subdued-content-color-default);
    }
`;
