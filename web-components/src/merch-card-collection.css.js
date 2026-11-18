import { TABLET_UP, DESKTOP_UP } from './constants.js';

export const styles = `
    #footer {
        grid-column: 1 / -1;
        justify-self: stretch;
        color: var(--merch-color-grey-80);
        order: 1000;
    }

    :host(.product-pricing) #footer {
        display: flex;
        justify-content: center;
        /* 24px below the last row, less the grid gap and the padding. */
        margin-top: calc(24px - 8px - 4px);
        /* Room for the button's focus ring, which an ancestor would clip. */
        padding-block: 4px;
    }

    /* Same look as the outlined product-pricing CTAs. */
    :host(.product-pricing) .show-more {
        box-sizing: border-box;
        min-height: 40px;
        padding: 8px 22px;
        border: 2px solid #000;
        border-radius: 999px;
        background: transparent;
        color: #000;
        font: inherit;
        font-size: 14px;
        font-weight: 700;
        line-height: 18px;
        cursor: pointer;
    }

    :host(.product-pricing) .show-more:focus-visible {
        outline: 2px solid #3b63fb;
        outline-offset: 2px;
    }

    sp-theme {
        display: contents;
    }
`;

export const headerStyles = `
    :host {
        --merch-card-collection-header-max-width: var(
            --merch-card-collection-card-width
        );
        --merch-card-collection-header-margin-bottom: 32px;
        --merch-card-collection-header-column-gap: 8px;
        --merch-card-collection-header-row-gap: 16px;
        --merch-card-collection-header-columns: auto auto;
        --merch-card-collection-header-areas: 'search search' 'filter sort'
            'result result';
        --merch-card-collection-header-search-max-width: unset;
        --merch-card-collection-header-search-min-height: 44px;
        --merch-card-collection-header-filter-height: 44px;
        --merch-card-collection-header-filter-font-size: 16px;
        --merch-card-collection-header-filter-padding: 15px;
        --merch-card-collection-header-sort-height: var(
            --merch-card-collection-header-filter-height
        );
        --merch-card-collection-header-sort-font-size: var(
            --merch-card-collection-header-filter-font-size
        );
        --merch-card-collection-header-sort-padding: var(
            --merch-card-collection-header-filter-padding
        );
        --merch-card-collection-header-result-font-size: 14px;
    }

    sp-theme {
        font-size: inherit;
    }

    #header {
        display: grid;
        column-gap: var(--merch-card-collection-header-column-gap);
        row-gap: var(--merch-card-collection-header-row-gap);
        align-items: center;
        grid-template-columns: var(--merch-card-collection-header-columns);
        grid-template-areas: var(--merch-card-collection-header-areas);
        margin-bottom: var(--merch-card-collection-header-margin-bottom);
        max-width: var(--merch-card-collection-header-max-width);
    }

    #header:empty {
        margin-bottom: 0;
    }

    #search {
        grid-area: search;
    }

    #search sp-search {
        max-width: var(--merch-card-collection-header-search-max-width);
        width: 100%;
        min-height: var(--merch-card-collection-header-search-min-height);
    }

    #filter {
        grid-area: filter;
        --mod-actionbutton-edge-to-text: var(
            --merch-card-collection-header-filter-padding
        );
        --mod-actionbutton-height: var(
            --merch-card-collection-header-filter-height
        );
    }

    #filter slot[name='filtersText'] {
        font-size: var(--merch-card-collection-header-filter-font-size);
    }

    #sort {
        grid-area: sort;
        --mod-actionbutton-edge-to-text: var(
            --merch-card-collection-header-sort-padding
        );
        --mod-actionbutton-height: var(
            --merch-card-collection-header-sort-height
        );
    }

    #sort [slot='label-only'] {
        font-size: var(--merch-card-collection-header-sort-font-size);
    }

    #result {
        grid-area: result;
        font-size: var(--merch-card-collection-header-result-font-size);
    }

    #result[type='search'][quantity='none'] {
        font-size: inherit;
    }

    #custom {
        grid-area: custom;
    }

    /* tablets */
    @media screen and ${TABLET_UP} {
        :host {
            --merch-card-collection-header-max-width: auto;
            --merch-card-collection-header-columns: 1fr fit-content(100%)
                fit-content(100%);
            --merch-card-collection-header-areas: 'search filter sort'
                'result result result';
        }
    }

    /* Laptop */
    @media screen and ${DESKTOP_UP} {
        :host {
            --merch-card-collection-header-columns: 1fr fit-content(100%);
            --merch-card-collection-header-areas: 'result sort';
            --merch-card-collection-header-result-font-size: inherit;
        }
    }
`;
