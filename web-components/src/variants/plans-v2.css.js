import { css } from '../css.js';

export const CSS = css`
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
