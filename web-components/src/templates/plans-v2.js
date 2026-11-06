import { css } from '../css.js';

const CSS = css`
    :root {
        --consonant-merch-card-plans-v2-font-family-regular: 'Adobe Clean',
            'adobe-clean', sans-serif;
        --consonant-merch-card-plans-v2-font-family: 'Adobe Clean Display',
            'adobe-clean-display', 'Adobe Clean', 'adobe-clean', sans-serif;
        --consonant-merch-card-plans-v2-width: 276px;
        --consonant-merch-card-plans-v2-height: auto;
        --consonant-merch-card-plans-v2-icon-size: 41.5px;
        --consonant-merch-card-plans-v2-border-color: #e9e9e9;
        --consonant-merch-card-plans-v2-border-radius: 16px;
        --picker-up-icon-black: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="10" width="10" viewBox="0 0 10 10"><path d="M5 3L8 6L2 6Z" fill="%222222"/></svg>');
        --picker-down-icon-black: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="10" width="10" viewBox="0 0 10 10"><path d="M5 7L2 4L8 4Z" fill="%222222"/></svg>');
        --consonant-merch-spacing-m: 20px;
        --consonant-merch-card-plans-v2-toggle-background-color: #f8f8f8;
        --consonant-merch-card-plans-v2-toggle-label-color: #292929;
        --consonant-merch-card-plans-v2-divider-color: #e8e8e8;
        --consonant-merch-card-plans-v2-toggle-expanded-background-color: #ffffff;
    }

    merch-card[variant='plans-v2'] {
        width: var(--consonant-merch-card-plans-v2-width);
        height: var(--consonant-merch-card-plans-v2-height);
        border-radius: var(--consonant-merch-card-plans-v2-border-radius);
        background-color: var(--spectrum-gray-50, #ffffff);
        overflow: visible;
        position: relative;
        z-index: 1;
        background:
            linear-gradient(
                    var(--spectrum-gray-50, #ffffff),
                    var(--spectrum-gray-50, #ffffff)
                )
                padding-box,
            var(
                    --consonant-merch-card-border-color,
                    var(--consonant-merch-card-plans-v2-border-color)
                )
                border-box;
        border: 1px solid transparent;
    }

    merch-card[variant='plans-v2']:has(merch-quantity-select:not([closed])) {
        z-index: 100;
    }

    merch-card[variant='plans-v2'] .spacer {
        height: calc(
            var(--merch-card-plans-v2-max-offset) - var(
                    --merch-card-plans-v2-offset
                )
        );
    }

    .dark merch-card[variant='plans-v2'] {
        --consonant-merch-card-background-color: rgb(20, 24, 38);
        --consonant-merch-card-border-color: #3d3d3d;
        --spectrum-gray-800: rgb(242, 242, 242);
        --spectrum-gray-700: rgb(219, 219, 219);
        background-color: var(--consonant-merch-card-background-color);
    }

    /* Keep "What you get" section white in dark mode */
    .dark merch-card[variant='plans-v2'] merch-whats-included {
        background-color: #ffffff;
    }

    .dark
        merch-card[variant='plans-v2']
        [slot='body-xs']
        .spectrum-Link.spectrum-Link--primary {
        color: #ffffff;
    }

    .dark merch-card[variant='plans-v2'] merch-whats-included h4,
    .dark merch-card[variant='plans-v2'] merch-whats-included ul li {
        color: #292929;
    }
    .dark merch-card[variant='plans-v2'] [slot='body-xs'] {
        color: #c6c6c6;
    }
    .dark
        merch-card[variant='plans-v2']
        [slot='quantity-select']
        merch-quantity-select {
        --label-color: #c6c6c6;
    }

    /* Dark mode heading colors for wide cards */
    .dark merch-card[variant='plans-v2'][size='wide'] [slot^='heading-'],
    .dark merch-card[variant='plans-v2'][size='wide'] span[class^='heading-'],
    .dark merch-card[variant='plans-v2'] span.price-unit-type,
    .dark merch-card[variant='plans-v2'] [slot='heading-m'] .price-recurrence {
        color: #b6b6b6;
    }

    .dark
        merch-card[variant='plans-v2']
        [slot='heading-m']
        span.price.price-strikethrough,
    .dark merch-card[variant='plans-v2'] [slot='heading-m'] s {
        color: #b6b6b6;
    }

    /* Dark mode strikethrough price size for wide cards */
    .dark
        merch-card[variant='plans-v2'][size='wide']
        [slot='heading-m']
        span.price.price-strikethrough,
    .dark merch-card[variant='plans-v2'][size='wide'] [slot='heading-m'] s {
        font-size: 20px;
    }

    .dark merch-card[variant='plans-v2'] {
        --consonant-merch-card-plans-v2-toggle-background-color: var(
            --consonant-merch-card-background-color
        );
        --consonant-merch-card-plans-v2-toggle-expanded-background-color: var(
            --consonant-merch-card-background-color
        );
        --consonant-merch-card-plans-v2-toggle-label-color: #ffffff;
        --consonant-merch-card-plans-v2-divider-color: var(
            --consonant-merch-card-background-color
        );
    }
    merch-card[variant='plans-v2'][size='wide'],
    merch-card[variant='plans-v2'][size='super-wide'] {
        width: 100%;
        max-width: 768px;
    }

    merch-card[variant='plans-v2'] [slot='icons'] {
        --img-width: var(--consonant-merch-card-plans-v2-icon-size);
        --img-height: var(--consonant-merch-card-plans-v2-icon-size);
    }
    merch-card[variant='plans-v2'] [slot='heading-m'] .price-recurrence,
    merch-card[variant='plans-v2'] span.price-unit-type {
        color: #6b6b6b;
    }

    merch-card[variant='plans-v2'] span.price-unit-type {
        display: inline;
        font-size: 20px;
        font-weight: 900;
        line-height: 110%;
    }

    merch-card[variant='plans-v2'] .price-unit-type:not(.disabled)::before {
        content: '';
    }

    merch-card[variant='plans-v2'] .price-unit-type.disabled,
    merch-card[variant='plans-v2'] .price-tax-inclusivity.disabled {
        display: none;
    }

    merch-card[variant='plans-v2'] [slot='heading-m'] .price-unit-type.disabled,
    merch-card[variant='plans-v2']
        [slot='heading-m']
        .price-tax-inclusivity.disabled {
        display: none;
    }

    merch-card[variant='plans-v2'] s .price-unit-type.disabled,
    merch-card[variant='plans-v2'] s .price-tax-inclusivity.disabled,
    merch-card[variant='plans-v2']
        .price-strikethrough
        .price-unit-type.disabled,
    merch-card[variant='plans-v2']
        .price-strikethrough
        .price-tax-inclusivity.disabled {
        display: none;
    }

    merch-card[variant='plans-v2'] [slot='description'] {
        min-height: auto;
    }

    merch-card[variant='plans-v2'] [slot='description'] {
        min-height: auto;
    }

    merch-card[variant='plans-v2'] [slot='quantity-select'] {
    }

    merch-card[variant='plans-v2'] merch-addon {
        --merch-addon-gap: 10px;
        --merch-addon-align: flex-start;
    }

    merch-card[variant='plans-v2'] merch-addon span[data-template='price'] {
        display: inline;
    }

    merch-card[variant^='plans-v2'] span[data-template='legal'] {
        display: inline;
        color: var(--spectrum-gray-600, #6e6e6e);
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: 1.375;
    }

    merch-card[variant='plans-v2'] span.text-l {
        display: inline;
        font-size: inherit;
        line-height: inherit;
    }

    merch-card[variant='plans-v2'] [slot='callout-content'] {
        margin: 0;
    }

    merch-card[variant='plans-v2'] [slot='callout-content'] > div > div,
    merch-card[variant='plans-v2'] [slot='callout-content'] > p {
        background: transparent;
        padding: 0;
    }

    merch-card[variant='plans-v2'] [slot='footer'] a {
        line-height: 1.2;
        padding: 9px 18px 10px 18px;
    }

    merch-card[variant='plans-v2'] [slot='icons'] img {
        width: var(--consonant-merch-card-plans-v2-icon-size);
        height: var(--consonant-merch-card-plans-v2-icon-size);
    }

    merch-card[variant='plans-v2'] [slot='heading-xs'] {
        font-size: 28px;
        font-weight: 900;
        font-family: var(--consonant-merch-card-plans-v2-font-family);
        line-height: 1.1;
        color: var(--spectrum-gray-800, #2c2c2c);
    }

    /* Mobile-specific heading-xs styles */
    @media (--mobile-landscape) {
        merch-card[variant='plans-v2'] [slot='heading-xs'] {
            font-size: 28px;
            font-weight: 800;
            line-height: 125%;
            letter-spacing: -0.02em;
            vertical-align: middle;
        }
        merch-card[variant='plans-v2'][size='wide'] [slot='heading-xs'] {
            font-size: 16px;
        }
    }

    /* Subtitle styling for regular cards */
    merch-card[variant='plans-v2'] [slot='subtitle'] {
        font-size: 18px;
        font-weight: 700;
        font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
        color: var(--spectrum-gray-800, #2c2c2c);
        line-height: 23px;
    }

    /* Wide card override */
    merch-card[variant='plans-v2'][size='wide'] [slot='subtitle'] {
        font-family: var(--consonant-merch-card-plans-v2-font-family);
        font-size: 52px;
        font-weight: 900;
        line-height: 1.1;
    }

    merch-card[variant='plans-v2'] [slot='heading-m'] span.price,
    merch-card[variant='plans-v2'] [slot='heading-m'] p {
        font-size: 20px;
        font-weight: 900;
        font-family: var(--consonant-merch-card-plans-v2-font-family);
        color: var(--spectrum-gray-800, #2c2c2c);
        line-height: 1.1;
    }

    /* Mobile-specific wide card subtitle styles */
    @media (--mobile-landscape) {
        merch-card[variant='plans-v2'][size='wide'] [slot='subtitle'] {
            font-size: 28px;
            font-weight: 900;
            line-height: 1.1;
            letter-spacing: 0px;
        }

        merch-card[variant='plans-v2'] span.price-unit-type,
        merch-card[variant='plans-v2'] [slot='heading-m'] span.price,
        merch-card[variant='plans-v2'] [slot='heading-m'] p {
            font-size: 28px;
        }
    }

    merch-card[variant='plans-v2'] [slot='heading-m'] {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 8px;
        color: inherit;
    }

    merch-card[variant='plans-v2']
        [slot='heading-m']
        span.price.price-strikethrough,
    merch-card[variant='plans-v2'] [slot='heading-m'] s {
        font-size: 20px;
        color: #6b6b6b;
        text-decoration: line-through;
        font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
        font-weight: 400;
    }

    merch-card[variant='plans-v2']
        [slot='heading-m']:has(
            span[is='inline-price'] + span[is='inline-price']
        )
        span[is='inline-price'] {
        display: inline;
        text-decoration: none;
    }

    merch-card[variant='plans-v2'] [slot='heading-m'] .price-legal {
        font-size: 16px;
        font-weight: 400;
        color: var(--spectrum-gray-600, #6e6e6e);
        line-height: 1.375;
    }

    merch-card[variant='plans-v2'] [slot='heading-m'] .price-recurrence {
        line-height: 1.4;
    }

    merch-card[variant='plans-v2']
        [slot='heading-m']
        .price:not(.price-annual)
        .price-recurrence:not(.disabled)::after {
        content: ' ';
        white-space: pre;
    }

    merch-card[variant='plans-v2'] [slot='heading-m'] .price-plan-type,
    merch-card[variant='plans-v2']
        [slot='heading-m']
        span[data-template='planType'] {
        text-transform: unset;
        display: block;
        color: var(--spectrum-gray-700, #505050);
        font-size: 16px;
        font-weight: 400;
        font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
        line-height: 1.4;
    }

    merch-card[variant='plans-v2'] [slot='promo-text'] {
        font-size: 16px;
        font-weight: 700;
        font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
        color: var(--merch-color-green-promo, #05834e);
        line-height: 1.5;
        margin-bottom: 16px;
    }

    merch-card[variant='plans-v2'] [slot='promo-text'] a {
        color: inherit;
        text-decoration: underline;
    }

    merch-card[variant='plans-v2'] [slot='body-xs'] {
        --consonant-merch-card-body-xs-font-size: 18px;
        font-size: 18px;
        font-weight: 400;
        font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
        color: var(--spectrum-gray-700, #505050);
        line-height: 1.4;
    }

    merch-card[variant='plans-v2'] [slot='quantity-select'] {
        margin-bottom: 16px;
    }

    merch-card[variant='plans-v2'] [slot='quantity-select'] label {
        display: block;
        font-size: 12px;
        font-weight: 400;
        color: #464646;
        margin-bottom: var(--consonant-merch-spacing-xxs);
    }

    merch-card[variant='plans-v2']
        [slot='quantity-select']
        merch-quantity-select {
        --qs-input-height: 32px;
        --qs-button-width: 18px;
        --qs-font-size: 14px;
        --border-color: #909090;
        --border-width: 1px;
        --background-color: #fdfdfd;
        --qs-label-font-size: 12px;
        --qs-label-color: #464646;
        --radius: 4px;
        --button-width: 29px;
        --qs-input-width: 59px;
        --picker-button-border-inline-start: none;
        --label-color: var(--spectrum-gray-700, #4b4b4b);
    }

    merch-card[variant='plans-v2']
        [slot='quantity-select']
        merch-quantity-select
        .item.highlighted {
        background-color: #f6f6f6;
    }

    merch-card[variant='plans-v2'] [slot='footer'] {
    }

    merch-card[variant='plans-v2'] [slot='footer'] a {
        width: auto;
        min-width: fit-content;
        text-align: center;
        padding: 5px 18px 6px 18px;
        border-radius: 20px;
        font-size: 16px;
        font-weight: 700;
        line-height: 20px;
        text-decoration: none;
        transition: all 0.2s ease-in-out;
    }
    merch-card[variant='plans-v2'] [slot='footer'] a.con-button.blue:hover {
        background-color: #0d66d0;
        border-color: #0d66d0;
    }

    merch-card[variant='plans-v2'] [slot='footer'] a.con-button.outline {
        background-color: transparent;
        color: #1473e6;
        border: 2px solid #1473e6;
    }

    merch-card[variant='plans-v2'] [slot='footer'] a.con-button.outline:hover {
        background-color: #f5f5f5;
    }

    merch-card[variant='plans-v2'] h4 {
        font-size: 18px;
        font-weight: 700;
        font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
        color: var(--spectrum-gray-800, #292929);
        line-height: 22px;
        margin: 0 0 16px 0;
        align-self: flex-start; /* Explicit alignment for consistent positioning */
    }

    /* Ensure merch-whats-included container is properly aligned */
    merch-card[variant='plans-v2'] merch-whats-included {
        background-color: #ffffff;
        align-self: stretch; /* Full width alignment */
    }

    merch-card[variant='plans-v2'] ul {
        padding: 0;
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: var(--consonant-merch-spacing-xxs);
    }

    merch-card[variant='plans-v2'] ul li {
        font-family: var(--consonant-merch-card-plans-v2-font-family-regular);
        color: #292929;
        line-height: 140%;
        display: inline-flex;
        list-style: none;
        padding: var(--consonant-merch-spacing-xxs) 0;
    }

    merch-card[variant='plans-v2'] ul li::before {
        display: inline-block;
        content: var(--list-checked-icon);
        margin-right: var(--consonant-merch-spacing-xxs);
        vertical-align: middle;
        flex-shrink: 0;
    }

    merch-card[variant='plans-v2'] .help-text {
        font-size: 12px;
        font-weight: 400;
        color: var(--spectrum-gray-600, #6e6e6e);
        line-height: 1.5;
        margin-top: var(--consonant-merch-spacing-xxs);
    }

    @media screen and (--mobile-landscape), (--tablet-down) {
        :root {
            --consonant-merch-card-plans-v2-width: 100%;
        }
        merch-card[variant='plans-v2'] {
            width: 100%;
            max-width: var(--consonant-merch-card-plans-v2-width);
            box-sizing: border-box;
        }
    }

    @media screen and (--tablet-up), (--desktop-up), (--large-desktop) {
        :root {
            --consonant-merch-card-plans-v2-width: 276px;
        }
    }
    collection-container.plans:has(merch-card[variant='plans-v2']) {
        --merch-card-collection-card-min-height: 273px;
        --merch-card-collection-card-width: var(
            --consonant-merch-card-plans-v2-width
        );
        grid-template-columns: auto;
    }

    merch-card-collection-header.plans {
        --merch-card-collection-header-columns: 1fr fit-content(100%);
        --merch-card-collection-header-areas: 'result filter';
    }

    merch-card-collection.plans:is(
            .one-merch-cards,
            .two-merch-cards,
            .three-merch-cards,
            .four-merch-cards
        ):has(merch-card[variant='plans-v2']) {
        --merch-card-collection-card-width: 100%;
        display: grid;
        grid-auto-rows: 1fr;
        align-items: stretch;
    }

    merch-card-collection.plans merch-card[variant='plans-v2'] {
        width: auto;
        height: 100%;
        display: grid;
        grid-template-rows: 1fr auto;
    }

    merch-card-collection.plans
        merch-card[variant='plans-v2'][has-short-description] {
        grid-template-rows: min-content min-content auto;
    }

    merch-card-collection.plans merch-card[variant='plans-v2'] {
        height: 100%;
        align-self: stretch;
    }

    merch-card-collection.plans
        merch-card[variant='plans-v2']
        .heading-wrapper {
        align-items: center;
        gap: 12px;
        overflow: visible;
    }

    merch-card-collection.plans merch-card[variant='plans-v2'] [slot='icons'] {
        align-items: center;
    }

    merch-card-collection.plans
        merch-card[variant='plans-v2']
        [slot='heading-xs'] {
    }

    merch-card-collection.plans
        merch-card[variant='plans-v2']
        aem-fragment
        + [slot^='heading-'] {
        margin-top: calc(40px + var(--consonant-merch-spacing-xxs));
    }

    merch-card-collection.plans
        merch-card[variant='plans-v2']
        [slot='short-description']
        strong {
        font-weight: 800;
        font-size: 18px;
    }

    merch-card[variant='plans-v2'][size='wide'] {
        width: 100%;
        max-width: 635px;
    }

    merch-card[variant='plans-v2'] .price-divider {
        display: none;
    }

    merch-card[variant='plans-v2'][size='wide'] .price-divider {
        display: block;
        height: 1px;
        background-color: #e8e8e8;
        margin: 16px 0;
    }

    merch-card[variant='plans-v2'][size='wide'] .heading-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 0;
    }

    merch-card[variant='plans-v2'][size='wide']
        .heading-wrapper
        [slot='icons'] {
        margin-bottom: 0;
    }

    merch-card[variant='plans-v2'][size='wide']
        .heading-wrapper
        [slot='heading-xs'] {
        margin: 0;
    }

    merch-card[variant='plans-v2'][size='wide'] [slot='body-xs'] {
        margin-bottom: 0;
    }

    merch-card[variant='plans-v2'][size='wide'] [slot='heading-m'] {
        margin-top: 0;
    }

    merch-card[variant='plans-v2'][size='wide']
        [slot='heading-m']
        span[data-template='planType'] {
        font-style: italic;
    }

    merch-card[variant='plans-v2'][size='wide'] footer {
        align-items: flex-start;
    }

    merch-card[variant='plans-v2'][size='wide'] footer [slot='heading-m'] {
        order: -1;
        margin-bottom: 16px;
        align-self: flex-start;
    }

    /* Mobile */
    @media screen and (--mobile-landscape) {
        merch-whats-included merch-mnemonic-list,
        merch-whats-included [slot='heading'] {
            width: 100%;
        }

        merch-card[variant='plans-v2'] .spacer {
            display: none;
        }

        merch-card-collection.plans:is(
                .one-merch-cards,
                .two-merch-cards,
                .three-merch-cards,
                .four-merch-cards
            ):has(merch-card[variant='plans-v2']) {
            grid-auto-rows: auto;
        }

        merch-card-collection.plans:is(
                .one-merch-cards,
                .two-merch-cards,
                .three-merch-cards,
                .four-merch-cards
            ):has(merch-card[variant='plans-v2']) {
            --merch-card-collection-card-width: unset;
        }
    }

    /* Tablet */
    @media screen and (--tablet-up) {
        :root {
            --consonant-merch-card-plans-v2-width: 360px;
        }
        merch-card-collection.plans.four-merch-cards:has(
                merch-card[variant='plans-v2']
            )
            .foreground {
            max-width: unset;
        }
        merch-card-collection.plans:is(
                .two-merch-cards,
                .three-merch-cards,
                .four-merch-cards
            ):has(merch-card[variant='plans-v2']) {
            grid-template-columns: repeat(
                2,
                var(--consonant-merch-card-plans-v2-width)
            );
        }
        merch-card[variant='plans-v2'][size='wide'],
        merch-card[variant='plans-v2'][size='super-wide'] {
            padding: 55px 47px;
        }
    }

    /* Desktop */
    @media screen and (--desktop-up) {
        :root {
            --consonant-merch-card-plans-v2-width: 276px;
        }

        merch-card-collection.plans:is(.three-merch-cards):has(
                merch-card[variant='plans-v2']
            ) {
            grid-template-columns: repeat(
                3,
                var(--consonant-merch-card-plans-v2-width)
            );
        }

        merch-card-collection.plans:is(.four-merch-cards):has(
                merch-card[variant='plans-v2']
            ) {
            grid-template-columns: repeat(
                4,
                var(--consonant-merch-card-plans-v2-width)
            );
        }

        merch-card-collection-header.plans {
            --merch-card-collection-header-columns: fit-content(100%);
            --merch-card-collection-header-areas: 'custom';
        }
    }

    /* Large Desktop */
    @media screen and (--large-desktop) {
        .columns .four-merch-cards.plans:has(merch-card[variant='plans-v2']) {
            grid-template-columns: repeat(
                2,
                var(--consonant-merch-card-plans-v2-width)
            );
        }
    }
`;

export const PLANS_V2_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    title: { tag: 'h3', slot: 'heading-xs' },
    subtitle: { tag: 'p', slot: 'subtitle' },
    prices: { tag: 'p', slot: 'heading-m' },
    shortDescription: { tag: 'p', slot: 'short-description' },
    promoText: { tag: 'p', slot: 'promo-text' },
    description: { tag: 'div', slot: 'body-xs' },
    mnemonics: { size: 'l' },
    callout: { tag: 'div', slot: 'callout-content' },
    quantitySelect: { tag: 'div', slot: 'quantity-select' },
    addon: true,
    secureLabel: true,
    planType: true,
    badgeIcon: true,
    badge: { tag: 'div', slot: 'badge', default: 'spectrum-red-700-plans' },
    allowedBadgeColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-gray-700-plans',
        'spectrum-green-900-plans',
        'spectrum-red-700-plans',
        'gradient-purple-blue',
    ],
    allowedBorderColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-green-900-plans',
        'spectrum-red-700-plans',
        'gradient-purple-blue',
    ],
    borderColor: { attribute: 'border-color' },
    size: ['wide', 'super-wide'],
    whatsIncluded: { tag: 'div', slot: 'whats-included' },
    ctas: { slot: 'footer', size: 'm' },
    style: 'consonant',
    perUnitLabel: { tag: 'span', slot: 'per-unit-label' },
};

export function define({
    EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
    Media,
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
    TemplateLayout,
    escapeHTML,
}) {
    class PlansV2 extends TemplateLayout {
        constructor(card) {
            super(card);
            this.adaptForMedia = this.adaptForMedia.bind(this);
            this.toggleShortDescription =
                this.toggleShortDescription.bind(this);
            this.shortDescriptionExpanded = false;
            this.syncScheduled = false; // Track if sync is already scheduled
        }

        priceOptionsProvider(element, options) {
            const mainPriceSlot = PLANS_V2_AEM_FRAGMENT_MAPPING.prices.slot;
            if (!element.closest(`[slot="${mainPriceSlot}"]`)) return;

            if (element.dataset.template === TEMPLATE_PRICE_LEGAL) {
                options.displayPlanType =
                    this.card?.settings?.displayPlanType ?? false;
                return;
            }

            // For main price display (strikethrough and regular price)
            // Disable perUnit display - it will be shown in legal price only
            if (
                element.dataset.template === 'strikethrough' ||
                element.dataset.template === 'price'
            ) {
                options.displayPerUnit = false;
            }
        }

        getGlobalCSS() {
            return CSS;
        }

        adjustSlotPlacement(name, sizes, shouldBeInFooter) {
            const { shadowRoot } = this.card;
            const footer = shadowRoot.querySelector('footer');
            const body = shadowRoot.querySelector('.body');
            const size = this.card.getAttribute('size');

            if (!size) return;

            const slotInFooter = shadowRoot.querySelector(
                `footer slot[name="${name}"]`,
            );
            const slotInBody = shadowRoot.querySelector(
                `.body slot[name="${name}"]`,
            );

            if (!size.includes('wide')) {
                footer?.classList.remove('wide-footer');
                slotInFooter?.remove();
            }
            if (!sizes.includes(size)) return;

            footer?.classList.toggle('wide-footer', Media.isDesktopOrUp);

            if (!shouldBeInFooter && slotInFooter) {
                if (slotInBody) {
                    slotInFooter.remove();
                } else {
                    const bodyPlaceholder = body.querySelector(
                        `[data-placeholder-for="${name}"]`,
                    );
                    if (bodyPlaceholder) {
                        bodyPlaceholder.replaceWith(slotInFooter);
                    } else {
                        body.appendChild(slotInFooter);
                    }
                }
                return;
            }

            if (shouldBeInFooter && slotInBody) {
                const bodyPlaceholder = document.createElement('div');
                bodyPlaceholder.setAttribute('data-placeholder-for', name);
                bodyPlaceholder.classList.add('slot-placeholder');
                if (!slotInFooter) {
                    footer.prepend(slotInBody.cloneNode(true));
                }
                slotInBody.replaceWith(bodyPlaceholder);
            }
        }

        adaptForMedia() {
            const isInCollection = this.card.closest(
                'merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards,.columns',
            );

            // Only remove size if NOT in a collection AND size was not explicitly set from fragment
            if (!isInCollection) {
                // Don't remove size if it was set from fragment data (during hydration)
                // This allows standalone cards with size="wide" or size="super-wide" to work correctly
                if (!this.card.hasAttribute('size')) {
                    return;
                }
                // If size exists but card is standalone, keep it (it was set from fragment)
                return;
            }

            this.adjustSlotPlacement('heading-m', ['wide'], true);
            this.adjustSlotPlacement(
                'addon',
                ['super-wide'],
                Media.isDesktopOrUp,
            );
            this.adjustSlotPlacement(
                'callout-content',
                ['super-wide'],
                Media.isDesktopOrUp,
            );
        }

        adjustCallout() {
            const tooltipIcon = this.card.querySelector(
                '[slot="callout-content"] .icon-button',
            );
            if (!tooltipIcon?.title) return;

            tooltipIcon.dataset.tooltip = tooltipIcon.title;
            tooltipIcon.removeAttribute('title');
            tooltipIcon.classList.add('hide-tooltip');

            const hideTooltipExcept = (target) => {
                if (target === tooltipIcon) {
                    tooltipIcon.classList.toggle('hide-tooltip');
                } else {
                    tooltipIcon.classList.add('hide-tooltip');
                }
            };

            document.addEventListener('touchstart', (e) => {
                e.preventDefault();
                hideTooltipExcept(e.target);
            });

            document.addEventListener('mouseover', (e) => {
                e.preventDefault();
                if (e.target !== tooltipIcon) {
                    tooltipIcon.classList.add('hide-tooltip');
                } else {
                    tooltipIcon.classList.remove('hide-tooltip');
                }
            });
        }

        async postCardUpdateHook() {
            if (!this.card.isConnected) return;

            this.adaptForMedia();
            this.adjustAddon();
            this.adjustCallout();
            this.updateShortDescriptionVisibility();
            // Track short-description presence for grid layout
            if (this.hasShortDescription) {
                this.card.setAttribute('has-short-description', '');
            } else {
                this.card.removeAttribute('has-short-description');
            }
            if (!this.legalAdjusted) {
                await this.adjustLegal();
            }

            await super.postCardUpdateHook();

            if (window.matchMedia('(min-width: 768px)').matches) {
                requestAnimationFrame(() => {
                    this.syncHeights();
                });
            }
        }

        get mainPrice() {
            return this.card.querySelector(
                `[slot="heading-m"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
            );
        }

        syncHeights() {
            if (this.card.getBoundingClientRect().width <= 2) return;
            this.syncRowHeights([
                {
                    name: 'body',
                    getElement: (card) =>
                        card.shadowRoot?.querySelector('.body'),
                },
                {
                    name: 'footer',
                    getElement: (card) =>
                        card.shadowRoot?.querySelector('footer'),
                },
                {
                    name: 'short-description',
                    getElement: (card) =>
                        card.querySelector('[slot="short-description"]'),
                },
            ]);
        }

        async adjustLegal() {
            if (this.legalAdjusted) return;

            try {
                this.legalAdjusted = true;
                await this.card.updateComplete;
                await customElements.whenDefined('inline-price');

                const headingPrice = this.mainPrice;
                if (!headingPrice) return;

                const legal = headingPrice.cloneNode(true);
                await headingPrice.onceSettled();

                if (!headingPrice?.options) return;

                if (headingPrice.options.displayPerUnit)
                    headingPrice.dataset.displayPerUnit = 'false';
                if (headingPrice.options.displayPlanType)
                    headingPrice.dataset.displayPlanType = 'false';

                if (
                    this.card.settings?.displayAnnual &&
                    headingPrice.options.displayTax
                ) {
                    legal.dataset.displayTax = 'false';
                } else if (headingPrice.options.displayTax) {
                    headingPrice.dataset.displayTax = 'false';
                }

                legal.setAttribute('data-template', 'legal');
                headingPrice.parentNode.insertBefore(
                    legal,
                    headingPrice.nextSibling,
                );
                await legal.onceSettled();
            } catch {
                // Proceed with other adjustments
            }
        }

        async adjustAddon() {
            await this.card.updateComplete;
            const addon = this.card.addon;
            if (!addon) return;

            addon.setAttribute('custom-checkbox', '');
            const price = this.mainPrice;
            if (!price) return;

            await price.onceSettled?.();
            const planType = price.value?.[0]?.planType;
            if (planType) addon.planType = planType;
        }

        get stockCheckbox() {
            return this.card.checkboxLabel
                ? `<label id="stock-checkbox">
                <input type="checkbox">
                <span></span>
                ${escapeHTML(this.card.checkboxLabel)}
            </label>`
                : '';
        }

        bindEvents(root) {
            root.querySelector('#stock-checkbox > input')?.addEventListener(
                'change',
                (event) => this.card.toggleStockOffer(event),
            );
            root.querySelector('.short-description-toggle')?.addEventListener(
                'click',
                this.toggleShortDescription,
            );
        }

        get hasShortDescription() {
            return !!this.card.querySelector('[slot="short-description"]');
        }

        get shortDescriptionLabel() {
            const shortDescElement = this.card.querySelector(
                '[slot="short-description"]',
            );

            const boldElement = shortDescElement.querySelector('strong, b');
            if (boldElement?.textContent?.trim()) {
                return boldElement.textContent.trim();
            }

            const headingOrPara = shortDescElement.querySelector(
                'h1, h2, h3, h4, h5, h6, p',
            );
            if (headingOrPara?.textContent?.trim()) {
                return headingOrPara.textContent.trim();
            }

            const firstLine = shortDescElement.textContent
                ?.trim()
                .split('\n')[0]
                .trim();
            return firstLine;
        }

        updateShortDescriptionVisibility() {
            const shortDescElement = this.card.querySelector(
                '[slot="short-description"]',
            );
            if (!shortDescElement) return;

            // Find the first bold or paragraph element
            const firstElement = shortDescElement.querySelector('strong, b, p');
            if (!firstElement) return;

            // On mobile, hide the first element (it's shown in the toggle label)
            // On tablet and up, show it (it's part of the content)
            if (!Media.isMobile) {
                firstElement.style.display = '';
            } else {
                firstElement.style.display = 'none';
            }
        }

        toggleShortDescription() {
            this.shortDescriptionExpanded = !this.shortDescriptionExpanded;
            const expanded = this.shortDescriptionExpanded;
            this.card.shadowRoot
                ?.querySelectorAll(
                    '.short-description-toggle, .short-description-toggle .toggle-icon, .short-description-content',
                )
                .forEach((el) => el.classList.toggle('expanded', expanded));
        }

        get shortDescriptionToggle() {
            if (!this.hasShortDescription) return '';

            // Show desktop version (no toggle) for tablet and up
            if (!Media.isMobile) {
                return `
                <div class="short-description-content desktop">
                    <slot name="short-description"></slot>
                </div>
            `;
            }

            // Show toggle version only on mobile
            return `
            <div class="short-description-divider"></div>
            <div
                class="short-description-toggle ${
                    this.shortDescriptionExpanded ? 'expanded' : ''
                }"
            >
                <span class="toggle-label">${escapeHTML(this.shortDescriptionLabel)}</span>
                <span
                    class="toggle-icon ${
                        this.shortDescriptionExpanded ? 'expanded' : ''
                    }"
                ></span>
            </div>
            <div
                class="short-description-content ${
                    this.shortDescriptionExpanded ? 'expanded' : ''
                }"
            >
                <slot name="short-description"></slot>
            </div>
        `;
        }

        get icons() {
            return this.card.querySelector('[slot="icons"]') ||
                this.card.getAttribute('id')
                ? '<slot name="icons"></slot>'
                : '';
        }

        get secureLabelFooter() {
            return `<footer>
            ${this.secureLabel}<slot name="quantity-select"></slot
            ><slot name="footer"></slot>
        </footer>`;
        }

        connectedCallbackHook() {
            this.handleMediaChange = () => {
                this.adaptForMedia();
                this.updateShortDescriptionVisibility();
                this.card.requestUpdate();

                if (window.matchMedia('(min-width: 768px)').matches) {
                    requestAnimationFrame(() => {
                        this.syncHeights();
                    });
                }
            };

            Media.matchMobile.addEventListener(
                'change',
                this.handleMediaChange,
            );
            Media.matchDesktopOrUp.addEventListener(
                'change',
                this.handleMediaChange,
            );

            this.handleResize = () => {
                if (this._resizeFrame) cancelAnimationFrame(this._resizeFrame);
                this._resizeFrame = requestAnimationFrame(() => {
                    this._resizeFrame = null;
                    if (window.matchMedia('(min-width: 768px)').matches) {
                        this.syncHeights();
                    }
                });
            };
            window.addEventListener('resize', this.handleResize);

            this.visibilityObserver = new IntersectionObserver(([entry]) => {
                if (entry.boundingClientRect.height === 0) return;
                if (!entry.isIntersecting) return;

                if (window.matchMedia('(min-width: 768px)').matches) {
                    requestAnimationFrame(() => {
                        this.syncHeights();
                    });
                }

                this.visibilityObserver.disconnect();
            });

            this.visibilityObserver.observe(this.card);
        }

        disconnectedCallbackHook() {
            Media.matchMobile.removeEventListener(
                'change',
                this.handleMediaChange,
            );
            Media.matchDesktopOrUp.removeEventListener(
                'change',
                this.handleMediaChange,
            );
            if (this.handleResize) {
                window.removeEventListener('resize', this.handleResize);
                this.handleResize = null;
            }
            if (this._resizeFrame) {
                cancelAnimationFrame(this._resizeFrame);
                this._resizeFrame = null;
            }
            this.visibilityObserver?.disconnect();
        }

        renderLayout() {
            const size = this.card.getAttribute('size');
            const isWide = size === 'wide';

            return ` ${this.badge}
            <div class="body">
                ${
                    isWide
                        ? `
                          <div class="heading-wrapper wide">
                              ${this.icons}
                              <slot name="heading-xs"></slot>
                          </div>
                          <slot name="subtitle"></slot>
                          <slot name="body-xs"></slot>
                          ${this.stockCheckbox}
                          <slot name="addon"></slot>
                          <slot name="badge"></slot>
                          <div class="price-divider"></div>
                          <slot name="heading-m"></slot>
                      `
                        : `
                          <div class="heading-wrapper">
                              ${this.icons}
                              <div class="heading-xs-wrapper">
                                  <slot name="heading-xs"></slot>
                                  <slot name="subtitle"></slot>
                              </div>
                          </div>
                          <slot name="heading-m"></slot>
                          <slot name="body-xs"></slot>
                          ${this.stockCheckbox}
                          <slot name="addon"></slot>
                          <slot name="badge"></slot>
                      `
                }
            </div>
            ${this.secureLabelFooter} ${this.shortDescriptionToggle}
            <slot></slot>`;
        }

        static templateStyle = css`
            :host([variant='plans-v2']) {
                display: flex;
                flex-direction: column;
                min-height: 273px;
                position: relative;
                background-color: var(--spectrum-gray-50, #ffffff);
                border-radius: var(
                    --consonant-merch-card-plans-v2-border-radius,
                    8px
                );
                overflow: hidden;
                font-weight: 400;
                box-sizing: border-box;
                --consonant-merch-card-plans-v2-font-family: 'adobe-clean-display',
                    'Adobe Clean', sans-serif;
                --merch-card-plans-v2-min-width: 220px;
                --merch-card-plans-v2-padding: 24px 24px;
                --merch-color-green-promo: #05834e;
                --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23505050' viewBox='0 0 12 15'%3E%3Cpath d='M11.5 6H11V5A5 5 0 1 0 1 5v1H.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5ZM3 5a3 3 0 1 1 6 0v1H3Zm4 6.111V12.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1.389a1.5 1.5 0 1 1 2 0Z'/%3E%3C/svg%3E");
                --list-checked-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20'%3E%3Cpath fill='%23222222' d='M15.656,3.8625l-.7275-.5665a.5.5,0,0,0-.7.0875L7.411,12.1415,4.0875,8.8355a.5.5,0,0,0-.707,0L2.718,9.5a.5.5,0,0,0,0,.707l4.463,4.45a.5.5,0,0,0,.75-.0465L15.7435,4.564A.5.5,0,0,0,15.656,3.8625Z'%3E%3C/path%3E%3C/svg%3E");
            }

            :host([variant='plans-v2']) .slot-placeholder {
                display: none;
            }

            :host([variant='plans-v2']) .body {
                --merch-card-plans-v2-body-min-height: calc(
                    var(--consonant-merch-card-plans-v2-body-height, 0px) -
                        (24px)
                );
                display: flex;
                flex-direction: column;
                min-width: var(--merch-card-plans-v2-min-width);
                padding: var(--merch-card-plans-v2-padding);
                padding-bottom: 0;
                flex: 0 0 auto;
                gap: 12px;
                min-height: var(--merch-card-plans-v2-body-min-height, auto);
                width: 220px;
            }

            :host([variant='plans-v2'][size]) .body {
                width: auto;
            }

            :host([variant='plans-v2']) footer {
                padding: var(--merch-card-plans-v2-padding);
                min-height: var(
                    --consonant-merch-card-plans-v2-footer-height,
                    auto
                );
                flex-direction: column;
                align-items: flex-start;
            }

            :host([variant='plans-v2']) slot[name='subtitle'] {
                display: var(--merch-card-plans-v2-subtitle-display);
                min-height: 18px;
                margin-top: 4px;
                margin-bottom: -8px;
            }

            :host([variant='plans-v2']) ::slotted([slot='subtitle']) {
                font-size: 14px;
                font-weight: 400;
                color: var(--spectrum-gray-700, #505050);
                line-height: 1.4;
            }

            :host([variant='plans-v2']) ::slotted([slot='heading-xs']) {
                font-size: 32px;
                font-weight: 900;
                font-family: var(
                    --consonant-merch-card-plans-v2-font-family,
                    'Adobe Clean Display',
                    sans-serif
                );
                line-height: 1.2;
                color: var(--spectrum-gray-800, #2c2c2c);
                margin: 0 0 16px 0;
                min-height: var(--merch-card-plans-v2-heading-min-height);
                max-width: var(
                    --consonant-merch-card-heading-xs-max-width,
                    100%
                );
            }

            :host([variant='plans-v2']) slot[name='icons'] {
                gap: 3.5px;
                mask-image: linear-gradient(
                    to right,
                    rgba(0, 0, 0, 1) 0%,
                    rgba(0, 0, 0, 1) 12.5%,
                    rgba(0, 0, 0, 0.8) 25%,
                    rgba(0, 0, 0, 0.6) 37.5%,
                    rgba(0, 0, 0, 0.4) 50%,
                    rgba(0, 0, 0, 0.2) 62.5%,
                    rgba(0, 0, 0, 0.05) 75%,
                    rgba(0, 0, 0, 0.03) 87.5%,
                    rgba(0, 0, 0, 0) 100%
                );
                -webkit-mask-image: linear-gradient(
                    to right,
                    rgba(0, 0, 0, 1) 0%,
                    rgba(0, 0, 0, 1) 12.5%,
                    rgba(0, 0, 0, 0.8) 25%,
                    rgba(0, 0, 0, 0.6) 37.5%,
                    rgba(0, 0, 0, 0.4) 50%,
                    rgba(0, 0, 0, 0.2) 62.5%,
                    rgba(0, 0, 0, 0.05) 75%,
                    rgba(0, 0, 0, 0.03) 87.5%,
                    rgba(0, 0, 0, 0) 100%
                );
            }

            :host([variant='plans-v2']) ::slotted([slot='icons']) {
                display: flex;
            }

            :host([variant='plans-v2']) ::slotted([slot='heading-m']) {
                margin: 0 0 8px 0;
                font-size: 28px;
                font-weight: 800;
                font-family: var(
                    --consonant-merch-card-plans-v2-font-family,
                    'Adobe Clean Display',
                    sans-serif
                );
                line-height: 1.15;
                color: var(--spectrum-gray-800, #2c2c2c);
            }

            :host([variant='plans-v2']) ::slotted([slot='promo-text']) {
                font-size: 16px;
                font-weight: 700;
                color: var(--merch-color-green-promo, #05834e);
                line-height: 1.5;
                margin: 0 0 16px 0;
            }

            :host([variant='plans-v2']) ::slotted([slot='body-xs']) {
                font-size: 18px;
                font-weight: 400;
                font-family: 'Adobe Clean', sans-serif;
                color: var(--spectrum-gray-700, #505050);
                line-height: 1.4;
                margin: 0 0 16px 0;
            }

            :host([variant='plans-v2']) ::slotted([slot='quantity-select']) {
                margin: 0 0 16px 0;
            }

            :host([variant='plans-v2']) .spacer {
                flex: 1 1 auto;
            }

            :host([variant='plans-v2']) ::slotted([slot='whats-included']) {
                padding-top: 24px;
                padding-bottom: 24px;
                border-top: 1px solid #e8e8e8;
            }

            :host([variant='plans-v2']) ::slotted([slot='addon']) {
                margin-top: auto;
                padding-top: 8px;
            }

            :host([variant='plans-v2']) footer ::slotted([slot='addon']) {
                margin: 0;
                padding: 0;
            }

            :host([variant='plans-v2']) .wide-footer #stock-checkbox {
                margin-top: 0;
            }

            :host([variant='plans-v2']) #stock-checkbox {
                margin-top: 8px;
                gap: 9px;
                color: rgb(34, 34, 34);
                line-height: var(--consonant-merch-card-detail-xs-line-height);
                padding-top: 4px;
                padding-bottom: 5px;
            }

            :host([variant='plans-v2']) #stock-checkbox > span {
                border: 2px solid rgb(109, 109, 109);
                width: 12px;
                height: 12px;
            }

            :host([variant='plans-v2']) .secure-transaction-label {
                color: rgb(80, 80, 80);
                line-height: var(--consonant-merch-card-detail-xs-line-height);
            }

            :host([variant='plans-v2']) footer ::slotted(a) {
                display: block;
                width: 100%;
                text-align: center;
                margin-bottom: 12px;
            }

            :host([variant='plans-v2']) footer ::slotted(a:last-child) {
                margin-bottom: 0;
            }

            :host([variant='plans-v2']) .short-description-divider {
                height: 1px;
                background-color: var(
                    --consonant-merch-card-plans-v2-divider-color,
                    #e8e8e8
                );
                margin: 0;
            }

            :host([variant='plans-v2']) .short-description-toggle {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
                padding: 16px 32px;
                cursor: pointer;
                background-color: var(
                    --consonant-merch-card-plans-v2-toggle-background-color,
                    #f8f8f8
                );
                transition: background-color 0.2s ease;
                border-bottom-left-radius: var(
                    --consonant-merch-card-plans-v2-border-radius
                );
                border-bottom-right-radius: var(
                    --consonant-merch-card-plans-v2-border-radius
                );
            }

            :host([variant='plans-v2'])
                .short-description-toggle
                .toggle-label {
                font-size: 18px;
                font-weight: 700;
                font-family: 'Adobe Clean', sans-serif;
                color: var(
                    --consonant-merch-card-plans-v2-toggle-label-color,
                    #292929
                );
                text-align: left;
                flex: 1;
                line-height: 22px;
            }

            :host([variant='plans-v2']) .short-description-toggle .toggle-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                flex-shrink: 0;
                background-image: url('data:image/svg+xml,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="%23F8F8F8"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M18.5484 12.9484H15.0484V9.44844C15.0484 8.86875 14.5781 8.39844 13.9984 8.39844C13.4188 8.39844 12.9484 8.86875 12.9484 9.44844V12.9484H9.44844C8.86875 12.9484 8.39844 13.4188 8.39844 13.9984C8.39844 14.5781 8.86875 15.0484 9.44844 15.0484H12.9484V18.5484C12.9484 19.1281 13.4188 19.5984 13.9984 19.5984C14.5781 19.5984 15.0484 19.1281 15.0484 18.5484V15.0484H18.5484C19.1281 15.0484 19.5984 14.5781 19.5984 13.9984C19.5984 13.4188 19.1281 12.9484 18.5484 12.9484Z" fill="%23292929"/></svg>');
                background-size: 28px 28px;
                background-position: center;
                background-repeat: no-repeat;
                transition: background-image 0.3s ease;
            }

            :host([variant='plans-v2'])
                .short-description-toggle
                .toggle-icon.expanded {
                background-image: url('data:image/svg+xml,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="%23292929"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M9 14L19 14" stroke="%23F8F8F8" stroke-width="2" stroke-linecap="round"/></svg>');
            }

            :host([variant='plans-v2']) .short-description-content {
                max-height: 0;
                overflow: hidden;
                transition:
                    max-height 0.3s ease,
                    padding 0.3s ease;
                padding: 0 32px;
                background-color: #ffffff;
            }

            :host([variant='plans-v2']) .short-description-content.expanded {
                max-height: 500px;
                padding: 24px 32px;
                border-bottom-right-radius: 16px;
                border-bottom-left-radius: 16px;
            }

            :host([variant='plans-v2']) .short-description-content.desktop {
                max-height: none;
                overflow: visible;
                padding: 26px 24px;
                transition: none;
                border-top: 1px solid #e9e9e9;
                min-height: var(
                    --consonant-merch-card-plans-v2-short-description-height,
                    auto
                );
                background-color: #ffffff;
                border-bottom-left-radius: var(
                    --consonant-merch-card-plans-v2-border-radius
                );
                border-bottom-right-radius: var(
                    --consonant-merch-card-plans-v2-border-radius
                );
                width: 226px;
            }

            :host([variant='plans-v2'])
                .short-description-content
                ::slotted([slot='short-description']) {
                font-size: 16px;
                font-weight: 400;
                font-family: 'Adobe Clean', sans-serif;
                color: #292929;
                line-height: 1.4;
                margin: 0;
            }

            :host(
                [variant='plans-v2'][border-color='spectrum-yellow-300-plans']
            ) {
                border-color: #ffd947;
            }

            :host(
                [variant='plans-v2'][border-color='spectrum-gray-300-plans']
            ) {
                border-color: #dadada;
            }

            :host(
                [variant='plans-v2'][border-color='spectrum-green-900-plans']
            ) {
                border-color: #05834e;
            }

            :host([variant='plans-v2'][border-color='spectrum-red-700-plans']) {
                border-color: #eb1000;
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
            }

            :host([variant='plans-v2'])
                ::slotted([slot='badge'].spectrum-red-700-plans) {
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
            }

            :host([variant='plans-v2'])
                ::slotted([slot='badge'].spectrum-yellow-300-plans),
            :host([variant='plans-v2']) #badge.spectrum-yellow-300-plans {
                background-color: #ffd947;
                color: #2c2c2c;
            }

            :host([variant='plans-v2'])
                ::slotted([slot='badge'].spectrum-gray-300-plans),
            :host([variant='plans-v2']) #badge.spectrum-gray-300-plans {
                background-color: #dadada;
                color: #2c2c2c;
            }

            :host([variant='plans-v2'])
                ::slotted([slot='badge'].spectrum-gray-700-plans),
            :host([variant='plans-v2']) #badge.spectrum-gray-700-plans {
                background-color: #4b4b4b;
                color: #ffffff;
            }

            :host([variant='plans-v2'])
                ::slotted([slot='badge'].spectrum-green-900-plans),
            :host([variant='plans-v2']) #badge.spectrum-green-900-plans {
                background-color: #05834e;
                color: #ffffff;
            }

            :host([variant='plans-v2'])
                ::slotted([slot='badge'].spectrum-red-700-plans),
            :host([variant='plans-v2']) #badge.spectrum-red-700-plans {
                background-color: #eb1000;
                color: #ffffff;
            }

            :host([variant='plans-v2']) .price-divider {
                display: none;
            }

            :host([variant='plans-v2']) .heading-wrapper {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            :host([variant='plans-v2'][size='wide']) {
                width: 100%;
                max-width: 768px;
            }

            :host([variant='plans-v2'][size='wide']) .heading-wrapper.wide {
                flex-direction: row;
                align-items: center;
                gap: 8px;
                margin-bottom: 0;
            }

            :host([variant='plans-v2'][size='wide'])
                .heading-wrapper.wide
                slot[name='icons'] {
                margin-bottom: 0;
                mask-image: none;
                -webkit-mask-image: none;
                flex-shrink: 0;
            }

            :host([variant='plans-v2'][size='wide'])
                .heading-wrapper.wide
                ::slotted([slot='icons']) {
                margin-bottom: 0;
            }

            :host([variant='plans-v2'][size='wide'])
                .heading-wrapper.wide
                ::slotted([slot='heading-xs']) {
                margin: 0;
                font-size: 27px;
                font-weight: 800;
                line-height: 1.25;
                white-space: nowrap;
            }

            :host([variant='plans-v2'][size='wide']) slot[name='subtitle'] {
                display: block;
                margin-top: 0;
                margin-bottom: 12px;
            }

            :host([variant='plans-v2'][size='wide'])
                ::slotted([slot='subtitle']) {
                font-family: var(
                    --consonant-merch-card-plans-v2-font-family,
                    'Adobe Clean Display',
                    'Adobe Clean',
                    sans-serif
                );
                font-size: 52px;
                font-weight: 900;
                line-height: 1.1;
                color: var(--spectrum-gray-800, #2c2c2c);
            }

            :host([variant='plans-v2'][size='wide']) .price-divider {
                display: block;
                height: 4px;
                background-color: #e8e8e8;
                margin: 24px 0;
                width: 100%;
            }

            :host([variant='plans-v2'][size='wide'])
                ::slotted([slot='body-xs']) {
                margin-bottom: 0;
            }

            :host([variant='plans-v2'][size='wide'])
                ::slotted([slot='heading-m']) {
                margin-top: 0;
            }

            :host([variant='plans-v2'][size='wide']) footer {
                justify-content: flex-start;
                flex-direction: column;
                align-items: flex-start;
            }

            :host([variant='plans-v2'][size='wide'])
                footer
                ::slotted([slot='heading-m']) {
                order: -1;
                margin-bottom: 16px;
                align-self: flex-start;
            }

            :host([variant='plans-v2'][size='wide']) footer ::slotted(a) {
                width: auto;
                min-width: 150px;
                margin-right: 12px;
                margin-bottom: 0;
            }

            :host([variant='plans-v2'][size='wide'])
                footer
                ::slotted(a:last-child) {
                margin-right: 0;
            }

            @media (--mobile-landscape), (--tablet-down) {
                :host([variant='plans-v2']) {
                    --merch-card-plans-v2-padding: 26px 16px;
                }

                :host([variant='plans-v2']) .short-description-toggle {
                    padding: 16px;
                }

                :host([variant='plans-v2']) .short-description-toggle.expanded {
                    background-color: var(
                        --consonant-merch-card-plans-v2-toggle-expanded-background-color,
                        #ffffff
                    );
                }

                :host([variant='plans-v2']) .short-description-content {
                    padding: 0 16px;
                    width: auto !important;
                }

                :host([variant='plans-v2'])
                    .short-description-content.expanded {
                    padding: 24px 16px;
                }

                :host([variant='plans-v2'][size='wide']) .body {
                    padding: 16px;
                    width: auto;
                }

                :host([variant='plans-v2']) .body {
                    width: auto;
                }
            }
        `;

        static collectionOptions = {
            customHeaderArea: (collection) => {
                if (!collection.sidenav) return '';
                return '<slot name="resultsText"></slot>';
            },
            headerVisibility: {
                search: false,
                sort: false,
                result: ['mobile', 'tablet'],
                custom: ['desktop'],
            },
            onSidenavAttached: (collection) => {
                const minifyOverflowingWideCards = () => {
                    const merchCards =
                        collection.querySelectorAll('merch-card');
                    merchCards.forEach((merchCard) => {
                        if (merchCard.hasAttribute('data-size')) {
                            merchCard.setAttribute(
                                'size',
                                merchCard.getAttribute('data-size'),
                            );
                            merchCard.removeAttribute('data-size');
                        }
                    });

                    if (!Media.isDesktop) return;

                    let columns = 0;
                    merchCards.forEach((merchCard) => {
                        if (merchCard.style.display === 'none') return;
                        const size = merchCard.getAttribute('size');
                        let columnCount =
                            size === 'wide' ? 2 : size === 'super-wide' ? 3 : 1;
                        if (columnCount === 2 && columns % 3 === 2) {
                            merchCard.setAttribute('data-size', size);
                            merchCard.removeAttribute('size');
                            columnCount = 1;
                        }
                        columns += columnCount;
                    });
                };

                Media.matchDesktop.addEventListener(
                    'change',
                    minifyOverflowingWideCards,
                );
                collection.addEventListener(
                    EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
                    minifyOverflowingWideCards,
                );

                collection.onUnmount.push(() => {
                    Media.matchDesktop.removeEventListener(
                        'change',
                        minifyOverflowingWideCards,
                    );
                    collection.removeEventListener(
                        EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
                        minifyOverflowingWideCards,
                    );
                });
            },
        };
    }
    return {
        'plans-v2': {
            class: PlansV2,
            fragmentMapping: PLANS_V2_AEM_FRAGMENT_MAPPING,
            style: PlansV2.templateStyle,
            collectionOptions: PlansV2.collectionOptions,
        },
    };
}
