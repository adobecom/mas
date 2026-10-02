/** Values of the "Has variation?" filter. */
export const VARIATION_FILTER = { PROMO: 'promo', GROUPED: 'grouped', NONE: 'none' };

/** Options of the "Has variation?" picker, in display order. */
export const VARIATION_FILTER_OPTIONS = [
    { id: VARIATION_FILTER.PROMO, title: 'Has promo variation' },
    { id: VARIATION_FILTER.GROUPED, title: 'Has grouped variation' },
    { id: VARIATION_FILTER.NONE, title: 'No variations' },
];

/** Label of the "Has variation?" picker. */
export const VARIATION_FILTER_LABEL = 'Has variation?';
