import { css } from 'lit';

// Layered over dialogShellStyles, which supplies the overlay, frame, header and scroll plumbing.
export const styles = css`
    .dialog-content {
        width: min(720px, 90vw);
        /* Sized to content so a fragment with three pages does not open a modal two thirds empty,
           while a busy fragment still scrolls inside the table rather than growing off screen. */
        min-height: 240px;
        max-height: 70vh;
    }

    .dialog-header {
        gap: 16px;
        margin-bottom: 16px;
    }

    .dialog-title {
        font-size: 24px;
    }

    .table-wrapper {
        border: 1px solid var(--spectrum-global-color-gray-300);
        border-radius: 12px;
        overflow: hidden;
    }

    .pages-table {
        --spectrum-table-row-height: 48px;
    }

    /* The table markup lives in this shadow root, so the cells are styled by element selector.
       Every column is sized here rather than on the head alone, otherwise the body cells size
       themselves and the headings drift away from the values underneath them. */
    sp-table-head-cell:first-child,
    sp-table-cell:first-child {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .requests-column {
        flex: 0 0 120px;
    }

    /* Counts are read by comparing them down the column, so the digits are held to a common width
       instead of shifting with each row's glyphs. */
    .page-requests {
        font-variant-numeric: tabular-nums;
        color: var(--spectrum-global-color-gray-900);
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
