export const CSS = `
    merch-card[variant='compchart'] {
        --compchart-cell-border-color: var(--spectrum-gray-300, #d3d3d3);
        --compchart-cell-border-radius: 4px;
        --compchart-cell-bg: #fff;
        --compchart-cell-bg-alt: var(--color-gray-100, #f8f8f8);
        --compchart-primary-tint: #05834E;
        --consonant-merch-card-border-width: 1px;
        --consonant-merch-card-border-radius: 8px;
        background-color: var(--compchart-cell-bg);
        display: block;
    }

    merch-card[variant='compchart'][primary] {
        --compchart-primary-active: var(--compchart-primary-tint);
    }

    /* glyph color tinting via primary */
    merch-card[variant='compchart'][primary] [aria-hidden='true'] {
        color: var(--compchart-primary-tint);
    }
`;
