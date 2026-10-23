import { css } from '../css.js';

export const CSS = css`
    /* Global CSS for the headless family (headless, marquee, faq, banner-blade):
   label + value only, no card chrome. Layout lives in HEADLESS_FAMILY_STYLE (headless.js). */

    /* Headless variant: minimal container for label/value rows */
    .headless {
        display: flex;
        flex-direction: column;
        padding: var(--consonant-merch-spacing-xs, 8px);
    }

    /* Neutralize non-headless slot treatments (heading weight/color, promo-text green,
   callout background box) from global.css so every row renders as plain text,
   matching the untouched body-xs/short-description rows. Applies to every variant
   in the headless family (headless, marquee, faq, banner-blade). */
    merch-card[variant='headless'] [slot='heading-xs'],
    merch-card[variant='marquee'] [slot='heading-xs'],
    merch-card[variant='faq'] [slot='heading-xs'],
    merch-card[variant='banner-blade'] [slot='heading-xs'],
    merch-card[variant='headless'] [slot='promo-text'],
    merch-card[variant='marquee'] [slot='promo-text'],
    merch-card[variant='faq'] [slot='promo-text'],
    merch-card[variant='banner-blade'] [slot='promo-text'] {
        color: var(--consonant-merch-card-body-xs-color);
        font-weight: 400;
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
    }
    merch-card[variant='headless'] [slot='callout-content'],
    merch-card[variant='marquee'] [slot='callout-content'],
    merch-card[variant='faq'] [slot='callout-content'],
    merch-card[variant='banner-blade'] [slot='callout-content'] {
        display: block;
        margin: 0;
        gap: 0;
    }
    merch-card[variant='headless'] [slot='callout-content'] > p,
    merch-card[variant='marquee'] [slot='callout-content'] > p,
    merch-card[variant='faq'] [slot='callout-content'] > p,
    merch-card[variant='banner-blade'] [slot='callout-content'] > p,
    merch-card[variant='headless'] [slot='callout-content'] > div,
    merch-card[variant='marquee'] [slot='callout-content'] > div,
    merch-card[variant='faq'] [slot='callout-content'] > div,
    merch-card[variant='banner-blade'] [slot='callout-content'] > div,
    merch-card[variant='headless'] [slot='callout-content'] > div > div,
    merch-card[variant='marquee'] [slot='callout-content'] > div > div,
    merch-card[variant='faq'] [slot='callout-content'] > div > div,
    merch-card[variant='banner-blade'] [slot='callout-content'] > div > div {
        background: transparent;
        padding: 0;
        border-radius: 0;
        width: auto;
    }
    /* Subtle gray annotation next to each headless CTA showing its authored variant
   (Primary/Secondary/Link), set alongside the button in hydrate.js's transformLinkToButton(). */
    merch-card[variant='headless'] .headless-cta-item,
    merch-card[variant='marquee'] .headless-cta-item,
    merch-card[variant='faq'] .headless-cta-item,
    merch-card[variant='banner-blade'] .headless-cta-item {
        display: inline-flex;
        align-items: center;
    }
    merch-card[variant='headless'] .headless-cta-variant-label,
    merch-card[variant='marquee'] .headless-cta-variant-label,
    merch-card[variant='faq'] .headless-cta-variant-label,
    merch-card[variant='banner-blade'] .headless-cta-variant-label {
        font-size: 0.75em;
        color: var(--spectrum-gray-600);
        background: var(--spectrum-gray-100);
        border-radius: 4px;
        padding: 2px 6px;
        line-height: 1.4;
        margin-left: var(--consonant-merch-spacing-xxs, 4px);
    }
    merch-card[variant='headless'] .headless-cta-item:not(:last-child)::after,
    merch-card[variant='marquee'] .headless-cta-item:not(:last-child)::after,
    merch-card[variant='faq'] .headless-cta-item:not(:last-child)::after,
    merch-card[variant='banner-blade']
        .headless-cta-item:not(:last-child)::after {
        content: ', ';
    }
`;
