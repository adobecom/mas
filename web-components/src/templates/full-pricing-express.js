import { css } from '../css.js';

const CSS = css`
    :root {
        --merch-card-full-pricing-express-width: 378px;
        --merch-card-full-pricing-express-mobile-width: 365px;
    }

    /* Collection grid layout */
    merch-card-collection.full-pricing-express {
        display: grid;
        justify-content: center;
        justify-items: center;
        align-items: stretch;
        gap: 16px;
    }

    /* Mobile - 1 column */
    merch-card-collection.full-pricing-express {
        grid-template-columns: 1fr;
        max-width: 100%;
        margin: 0 auto;
        padding: 0 16px;
        box-sizing: border-box;
    }

    /* Mobile - override Milo .content max-width for full-width cards */
    @media screen and (max-width: 767px) {
        .section:has(.collection-container.full-pricing-express) .content {
            max-width: 100%;
            margin: 0 auto;
        }

        .collection-container.full-pricing-express {
            display: block;
            width: 100%;
            max-width: 100%;
        }
    }

    /* Tablet - 2 columns (768px-1199px) */
    @media screen and (min-width: 768px) and (max-width: 1199px) {
        merch-card-collection.full-pricing-express {
            grid-template-columns: repeat(2, 1fr);
            justify-items: stretch;
            max-width: 100%;
            padding: 0 16px;
        }

        /* Override Milo .content max-width for full-width cards */
        .section:has(.collection-container.full-pricing-express) .content {
            max-width: 100%;
            margin: 0 auto;
        }

        .collection-container.full-pricing-express {
            display: block;
            width: 100%;
            max-width: 100%;
        }
    }

    /* Desktop small - 2 columns */
    @media screen and (--desktop-up) and (max-width: 1399px) {
        merch-card-collection.full-pricing-express {
            grid-template-columns: repeat(2, 1fr);
            max-width: calc(
                2 * var(--merch-card-full-pricing-express-width) + 16px
            );
        }
    }

    /* Desktop large - 3 columns */
    @media screen and (min-width: 1400px) {
        merch-card-collection.full-pricing-express {
            grid-template-columns: repeat(3, 1fr);
            max-width: calc(
                3 * var(--merch-card-full-pricing-express-width) + 32px
            );
        }
    }

    /* Remove default paragraph margins */
    merch-card[variant='full-pricing-express'] p {
        margin: 0 !important;
        font-size: inherit;
    }

    /* Slot-specific styles */
    merch-card[variant='full-pricing-express'] [slot='heading-xs'] {
        font-size: 20px;
        font-weight: 700;
        line-height: 26px;
        color: var(--spectrum-gray-800);
        margin-bottom: 8px;
    }

    /* Title font size on mobile and tablet */
    @media (max-width: 1199px) {
        merch-card[variant='full-pricing-express'] [slot='heading-xs'] {
            font-size: 18px;
            line-height: 23.4px;
        }
    }

    /* Inline mnemonics inside heading */
    merch-card[variant='full-pricing-express']
        [slot='heading-xs']
        mas-mnemonic {
        display: inline-flex;
        --mod-img-width: 20px;
        --mod-img-height: 20px;
        margin-right: 8px;
        align-items: center;
        vertical-align: middle;
        padding-bottom: 3px;
    }

    merch-card[variant='full-pricing-express']
        [slot='heading-xs']
        mas-mnemonic
        img {
        width: 20px;
        height: 20px;
        object-fit: contain;
    }

    /* Icons slot styling */
    merch-card[variant='full-pricing-express'] [slot='icons'] {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-shrink: 0;
    }

    /* Premium/crown icon sizing on mobile and tablet (14x14px) */
    @media (max-width: 1199px) {
        merch-card[variant='full-pricing-express']
            [slot='heading-xs']
            merch-icon,
        merch-card[variant='full-pricing-express']
            [slot='heading-xs']
            mas-mnemonic
            merch-icon,
        merch-card[variant='full-pricing-express']
            [slot='heading-xs']
            mas-mnemonic {
            --mod-img-width: 14px;
            --mod-img-height: 14px;
            vertical-align: baseline;
        }

        merch-card[variant='full-pricing-express']
            [slot='heading-xs']
            mas-mnemonic
            img {
            width: 14px;
            height: 14px;
        }
    }

    merch-card[variant='full-pricing-express'] [slot='trial-badge'] {
        position: absolute;
        top: -8px;
        right: 16px;
        font-size: var(--merch-card-full-pricing-express-trial-badge-font-size);
        font-weight: var(
            --merch-card-full-pricing-express-trial-badge-font-weight
        );
        line-height: var(
            --merch-card-full-pricing-express-trial-badge-line-height
        );
        z-index: 0;
        max-width: calc(100% - 24px);
    }

    merch-card[variant='full-pricing-express']
        [slot='trial-badge']
        merch-badge {
        display: -webkit-box;
        max-width: 240px;
        border-radius: 4px;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        font-size: var(--merch-card-full-pricing-express-trial-badge-font-size);
        font-weight: var(
            --merch-card-full-pricing-express-trial-badge-font-weight
        );
        line-height: var(
            --merch-card-full-pricing-express-trial-badge-line-height
        );
        color: var(--spectrum-express-accent);
        overflow: hidden;
    }

    merch-card[variant='full-pricing-express'] [slot='trial-badge']:empty {
        display: none;
    }

    merch-card[variant='full-pricing-express'] [slot='body-s'] {
        font-size: 16px;
        line-height: 20.8px;
        color: var(--spectrum-gray-900);
    }

    merch-card[variant='full-pricing-express'] [slot='body-s'] hr {
        margin-top: 0;
        margin-bottom: 24px;
        background-color: #e9e9e9;
    }

    merch-card[variant='full-pricing-express'] [slot='shortDescription'] {
        font-size: 16px;
        line-height: 20.8px;
        color: var(--spectrum-gray-700);
        margin-bottom: var(--merch-card-full-pricing-express-section-gap);
    }

    merch-card[variant='full-pricing-express'] [slot='body-s'] ul {
        margin: 0;
        padding-left: 20px;
        list-style: disc;
    }

    merch-card[variant='full-pricing-express'] [slot='body-s'] li {
        margin-bottom: 8px;
    }

    merch-card[variant='full-pricing-express'] [slot='body-s'] li:last-child {
        margin-bottom: 0;
    }

    merch-card[variant='full-pricing-express'] [slot='body-s'] p {
        padding: 8px;
    }

    merch-card[variant='full-pricing-express'] [slot='body-s'] p a {
        color: var(--spectrum-indigo-900);
        font-weight: 700;
        text-decoration: underline;
    }

    /* Feature list hyperlinks should be underlined */
    merch-card[variant='full-pricing-express'] [slot='body-s'] ul a,
    merch-card[variant='full-pricing-express'] [slot='body-s'] li a,
    merch-card[variant='full-pricing-express'] [slot='body-xs'] a {
        color: var(--spectrum-indigo-900);
        text-decoration: underline;
    }

    merch-card[variant='full-pricing-express']
        [slot='body-s']
        .button-container {
        margin: 0;
        padding: 0;
    }

    merch-card[variant='full-pricing-express'] [slot='body-s'] p:last-child a {
        text-decoration: none;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-flow: column;
        color: var(--spectrum-indigo-900);
        background: transparent;
        border: none;
        margin: 0;
        font-size: 16px;
        padding-top: 0;
    }

    merch-card[variant='full-pricing-express']
        [slot='body-s']
        p:last-child
        a:hover {
        background-color: initial;
        border: none;
    }

    /* Price styling */
    merch-card[variant='full-pricing-express'] [slot='price'] {
        display: flex;
        flex-direction: column;
        width: 100%;
        justify-content: center;
    }

    merch-card[variant='full-pricing-express']
        [data-template='price']
        .price-strikethrough
        span.price-recurrence,
    merch-card[variant='full-pricing-express']
        [data-template='strikethrough']:has(+ [data-template='price'])
        span.price-recurrence {
        display: none;
    }

    merch-card[variant='full-pricing-express'] [slot='price'] p strong {
        display: inline-flex;
        justify-content: center;
        width: 100%;
    }

    merch-card[variant='full-pricing-express'] [slot='price'] > p:first-child {
        display: flex;
        align-items: baseline;
        margin: 0;
    }

    merch-card[variant='full-pricing-express']
        [slot='price']
        > p
        span[is='inline-price']:first-child {
        margin-right: 8px;
    }

    merch-card[variant='full-pricing-express']
        [slot='price']
        span[is='inline-price'][data-template='optical'] {
        font-size: var(--merch-card-full-pricing-express-price-font-size);
        color: var(--spectrum-gray-800);
    }

    merch-card[variant='full-pricing-express']
        [slot='price']
        .price-strikethrough
        .price-integer,
    merch-card[variant='full-pricing-express']
        [slot='price']
        .price-strikethrough
        .price-decimals-delimiter,
    merch-card[variant='full-pricing-express']
        [slot='price']
        .price-strikethrough
        .price-decimals {
        font-size: 28px;
        font-weight: 700;
        line-height: 36.4px;
    }

    merch-card[variant='full-pricing-express']
        [slot='price']
        .price-currency-symbol,
    merch-card[variant='full-pricing-express'] [slot='price'] .price-integer,
    merch-card[variant='full-pricing-express']
        [slot='price']
        .price-decimals-delimiter,
    merch-card[variant='full-pricing-express']
        [slot='price']
        .price-currency-space,
    merch-card[variant='full-pricing-express'] [slot='price'] .price-decimals {
        font-size: var(--merch-card-full-pricing-express-price-font-size);
        font-weight: var(--merch-card-full-pricing-express-price-font-weight);
        line-height: var(--merch-card-full-pricing-express-price-line-height);
    }

    merch-card[variant='full-pricing-express']
        [slot='price']
        span[is='inline-price']
        .price-recurrence,
    merch-card[variant='full-pricing-express']
        [slot='price']
        span[is='inline-price']
        .price-unit-type {
        font-size: 12px;
        font-weight: bold;
        line-height: 15.6px;
        color: #222;
    }

    merch-card[variant='full-pricing-express'] [slot='price'] p {
        font-size: 12px;
        font-weight: 400;
        line-height: 15.6px;
        color: var(--spectrum-gray-700);
    }

    merch-card[variant='full-pricing-express']
        [slot='price']
        > p
        span[is='inline-price']:only-child {
        color: rgb(34, 34, 34);
    }

    /* Target inline prices in paragraphs that are not the first paragraph */
    merch-card[variant='full-pricing-express']
        [slot='price']
        > p:not(:first-child)
        span[is='inline-price'] {
        font-size: 12px;
        font-weight: 500;
        line-height: 15.6px;
        margin-right: 0;
    }

    merch-card[variant='full-pricing-express']
        [slot='price']
        > p:nth-child(3)
        span[is='inline-price']
        .price-currency-symbol,
    merch-card[variant='full-pricing-express']
        [slot='price']
        > p:nth-child(3)
        span[is='inline-price']
        .price-integer,
    merch-card[variant='full-pricing-express']
        [slot='price']
        > p:nth-child(3)
        span[is='inline-price']
        .price-decimals-delimiter,
    merch-card[variant='full-pricing-express']
        [slot='price']
        > p:nth-child(3)
        span[is='inline-price']
        .price-decimals,
    merch-card[variant='full-pricing-express']
        [slot='price']
        > p:nth-child(3)
        span[is='inline-price']
        .price-recurrence,
    merch-card[variant='full-pricing-express']
        [slot='price']
        > p:nth-child(3)
        span[is='inline-price']
        .price-unit-type {
        font-size: 12px;
        font-weight: normal;
        line-height: 15.6px;
    }

    merch-card[variant='full-pricing-express'] [slot='price'] p a {
        color: var(--spectrum-indigo-900);
        font-weight: 700;
        text-decoration: none;
    }

    /* Callout content styling - inside price container */
    merch-card[variant='full-pricing-express'] [slot='callout-content'] {
        color: var(--spectrum-gray-800);
        width: 100%;
        display: block;
        margin: 0;
        font-size: 12px;
        font-weight: 400;
        line-height: 18px;
    }

    merch-card[variant='full-pricing-express']
        [slot='callout-content']
        span[is='inline-price'] {
        font-size: inherit;
        font-weight: inherit;
        line-height: inherit;
    }

    merch-card[variant='full-pricing-express'] [slot='callout-content'] > p {
        background: transparent;
        padding: 0;
    }

    merch-card[variant='full-pricing-express']
        [slot='callout-content']
        > p:empty,
    merch-card[variant='full-pricing-express'] [slot='price'] > p:empty {
        display: contents;
    }

    merch-card[variant='full-pricing-express'] [slot='callout-content'] a {
        color: var(--spectrum-indigo-900);
        font-weight: 700;
        text-decoration: inherit;
    }

    /* Strikethrough price styling */
    merch-card[variant='full-pricing-express']
        span[is='inline-price']
        .price-unit-type,
    merch-card[variant='full-pricing-express']
        span[is='inline-price'][data-template='strikethrough']
        .price,
    merch-card[variant='full-pricing-express']
        span[is='inline-price'][data-template='strikethrough']
        .price-strikethrough,
    merch-card[variant='full-pricing-express']
        span.placeholder-resolved[data-template='strikethrough'],
    merch-card[variant='full-pricing-express']
        span[is='inline-price'][data-template='price']
        .price-strikethrough {
        text-decoration: none;
        font-size: 12px;
        line-height: 15.6px;
    }

    merch-card[variant='full-pricing-express']
        span[is='inline-price'][data-template='strikethrough']
        .price,
    merch-card[variant='full-pricing-express']
        span[is='inline-price'][data-template='price']
        .price-strikethrough {
        color: #8f8f8f;
    }

    merch-card[variant='full-pricing-express']
        [slot='price']
        span[is='inline-price'][data-template='strikethrough']
        + span[is='inline-price'],
    merch-card[variant='full-pricing-express']
        [slot='price']
        span[is='inline-price'][data-template='strikethrough']
        ~ strong {
        color: #222222;
    }

    merch-card[variant='full-pricing-express'] [slot='price'] p .heading-xs,
    merch-card[variant='full-pricing-express'] [slot='price'] p .heading-s,
    merch-card[variant='full-pricing-express'] [slot='price'] p .heading-m,
    merch-card[variant='full-pricing-express'] [slot='price'] p .heading-l {
        font-size: 22px;
        line-height: 28.6px;
        text-align: center;
        width: 100%;
    }

    merch-card[variant='full-pricing-express']
        span[is='inline-price'][data-template='strikethrough']
        .price-integer,
    merch-card[variant='full-pricing-express']
        span[is='inline-price'][data-template='strikethrough']
        .price-decimals-delimiter,
    merch-card[variant='full-pricing-express']
        span[is='inline-price'][data-template='strikethrough']
        .price-decimals,
    merch-card[variant='full-pricing-express']
        span[is='inline-price'][data-template='price']
        .price-strikethrough
        .price-integer,
    merch-card[variant='full-pricing-express']
        span[is='inline-price'][data-template='price']
        .price-strikethrough
        .price-decimals-delimiter,
    merch-card[variant='full-pricing-express']
        span[is='inline-price'][data-template='price']
        .price-strikethrough
        .price-decimals {
        text-decoration: line-through;
        text-decoration-thickness: 2px;
    }

    /* CTA button styling */
    merch-card[variant='full-pricing-express'] [slot='cta'] {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    merch-card[variant='full-pricing-express'] [slot='cta'] sp-button,
    merch-card[variant='full-pricing-express'] [slot='cta'] button,
    merch-card[variant='full-pricing-express'] [slot='cta'] a.con-button,
    merch-card[variant='full-pricing-express'] [slot='cta'] a.spectrum-Button {
        --mod-button-height: 40px;
        --mod-button-top-to-text: 9px;
        --mod-button-bottom-to-text: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        box-sizing: border-box;
        font-weight: 700;
        font-size: 16px;
        line-height: 20.8px;
        margin: 0;
        padding: 0 24px;
        border-radius: 26px;
        min-height: 40px;
    }

    merch-card[variant='full-pricing-express']
        [slot='cta']
        sp-button[variant='accent'],
    merch-card[variant='full-pricing-express']
        [slot='cta']
        button.spectrum-Button--accent,
    merch-card[variant='full-pricing-express']
        [slot='cta']
        a.spectrum-Button.spectrum-Button--accent {
        background-color: var(--spectrum-indigo-900);
        color: var(--spectrum-white, #ffffff);
        width: 100%;
    }

    /* Ensure text color is applied to the label span element for accessibility */
    merch-card[variant='full-pricing-express']
        [slot='cta']
        sp-button[variant='accent']
        .spectrum-Button-label,
    merch-card[variant='full-pricing-express']
        [slot='cta']
        button.spectrum-Button--accent
        .spectrum-Button-label,
    merch-card[variant='full-pricing-express']
        [slot='cta']
        a.spectrum-Button.spectrum-Button--accent
        .spectrum-Button-label {
        color: var(--spectrum-white, #ffffff);
    }

    /* Small font size button styles for desktop when button text is too long */
    @media screen and (--desktop-up) {
        merch-card[variant='full-pricing-express']
            [slot='cta']
            sp-button.small-font-size-button,
        merch-card[variant='full-pricing-express']
            [slot='cta']
            button.small-font-size-button,
        merch-card[variant='full-pricing-express']
            [slot='cta']
            a.con-button.small-font-size-button,
        merch-card[variant='full-pricing-express']
            [slot='cta']
            a.spectrum-Button.small-font-size-button,
        merch-card[variant='full-pricing-express']
            a[slot='cta'].small-font-size-button {
            font-size: 14px;
            padding: 2px 24px;
        }
    }

    /* Badge styling */
    merch-card[variant='full-pricing-express'] merch-badge {
        color: var(--spectrum-white);
        font-size: 16px;
        font-weight: bold;
        line-height: 20.8px;
    }

    /* Mobile-specific selective display of body-s (under 768px) */
    @media (max-width: 767px) {
        /* Show body-s container */
        merch-card[variant='full-pricing-express'] [slot='body-s'] {
            display: block;
        }

        /* Hide all direct children by default */
        merch-card[variant='full-pricing-express'] [slot='body-s'] > * {
            display: none;
        }

        /* Show only the last hr (2nd one) */
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > hr:last-of-type {
            display: block;
            margin: 24px 0;
        }

        /* Show only the button container (last p tag) */
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > p:last-child {
            display: block;
        }

        merch-card[variant='full-pricing-express'] {
            width: 100%;
            max-width: 100%;
        }

        /* Price font size on mobile */
        merch-card[variant='full-pricing-express']
            [slot='price']
            .price-currency-symbol,
        merch-card[variant='full-pricing-express']
            [slot='price']
            .price-integer,
        merch-card[variant='full-pricing-express']
            [slot='price']
            .price-decimals-delimiter,
        merch-card[variant='full-pricing-express']
            [slot='price']
            .price-decimals,
        merch-card[variant='full-pricing-express']
            [slot='price']
            .price-recurrence,
        merch-card[variant='full-pricing-express']
            [slot='price']
            .price-strikethrough,
        merch-card[variant='full-pricing-express']
            [slot='price']
            .price-unit-type,
        merch-card[variant='full-pricing-express']
            [slot='price']
            .price-tax-inclusivity {
            font-size: 22px;
        }

        /* Badge alignment on mobile */
        merch-card[variant='full-pricing-express'] [slot='badge'] {
            font-size: 16px;
            font-weight: 400;
        }

        /* Trial badge alignment on mobile */
        merch-card[variant='full-pricing-express'] [slot='trial-badge'] {
            margin-left: 0;
            align-self: flex-start;
        }

        merch-card[variant='full-pricing-express']
            [slot='trial-badge']
            merch-badge {
            font-size: var(
                --merch-card-full-pricing-express-trial-badge-font-size
            );
            line-height: var(
                --merch-card-full-pricing-express-trial-badge-line-height
            );
        }
    }

    /* Hide screen reader only text */
    merch-card[variant='full-pricing-express'] sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    /* mas-tooltip inline styles for full-pricing-express */
    merch-card[variant='full-pricing-express'] mas-tooltip {
        display: inline-block;
        align-items: center;
        vertical-align: baseline;
        margin-right: 8px;
        overflow: visible;
        padding-top: 16px;
    }

    /* mas-mnemonic inline styles for full-pricing-express */
    merch-card[variant='full-pricing-express'] mas-mnemonic {
        display: inline-block;
        align-items: center;
        vertical-align: baseline;
        margin-right: 8px;
        overflow: visible;
        --mas-mnemonic-tooltip-padding: 4px 8px;
    }

    /* Responsive rules for tablet and desktop (768px+) */
    @media (min-width: 768px) {
        merch-card[variant='full-pricing-express'] [slot='body-s'] {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
        }

        merch-card[variant='full-pricing-express']
            [slot='body-s']
            p:first-child {
            padding: 16px 8px;
        }

        /* Ensure the second divider wrapper stays at bottom with proper spacing */
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > hr:last-of-type {
            margin-top: auto;
            padding-top: 24px;
            margin-bottom: 16px;
            border: none;
            border-bottom: 1px solid #e9e9e9;
            height: 0;
            background: transparent;
        }

        /* Ensure the button container stays at the bottom */
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > p.button-container,
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > p:last-child {
            margin-top: 0;
            margin-bottom: 0;
        }

        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > *:nth-child(1) {
            min-height: var(
                --consonant-merch-card-full-pricing-express-description-row-0-height
            );
        }
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > *:nth-child(2) {
            min-height: var(
                --consonant-merch-card-full-pricing-express-description-row-1-height
            );
        }
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > *:nth-child(3) {
            min-height: var(
                --consonant-merch-card-full-pricing-express-description-row-2-height
            );
        }
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > *:nth-child(4) {
            min-height: var(
                --consonant-merch-card-full-pricing-express-description-row-3-height
            );
        }
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > *:nth-child(5) {
            min-height: var(
                --consonant-merch-card-full-pricing-express-description-row-4-height
            );
        }
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > *:nth-child(6) {
            min-height: var(
                --consonant-merch-card-full-pricing-express-description-row-5-height
            );
        }
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > *:nth-child(7) {
            min-height: var(
                --consonant-merch-card-full-pricing-express-description-row-6-height
            );
        }
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > *:nth-child(8) {
            min-height: var(
                --consonant-merch-card-full-pricing-express-description-row-7-height
            );
        }
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > *:nth-child(9) {
            min-height: var(
                --consonant-merch-card-full-pricing-express-description-row-8-height
            );
        }
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > *:nth-child(10) {
            min-height: var(
                --consonant-merch-card-full-pricing-express-description-row-9-height
            );
        }
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > *:nth-child(11) {
            min-height: var(
                --consonant-merch-card-full-pricing-express-description-row-10-height
            );
        }
        merch-card[variant='full-pricing-express']
            [slot='body-s']
            > *:nth-child(12) {
            min-height: var(
                --consonant-merch-card-full-pricing-express-description-row-11-height
            );
        }
    }
`;

export const FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING = {
    title: {
        tag: 'h3',
        slot: 'heading-xs',
        maxCount: 250,
        withSuffix: true,
    },
    badge: {
        tag: 'div',
        slot: 'badge',
        default: 'spectrum-blue-400',
    },
    allowedBadgeColors: [
        'spectrum-blue-400',
        'spectrum-gray-300',
        'spectrum-yellow-300',
        'gradient-purple-blue',
        'gradient-firefly-spectrum',
    ],
    description: {
        tag: 'div',
        slot: 'body-s',
        maxCount: 2000,
        withSuffix: false,
    },
    shortDescription: {
        tag: 'div',
        slot: 'short-description',
        maxCount: 3000,
        withSuffix: false,
    },
    callout: {
        tag: 'div',
        slot: 'callout-content',
        editorLabel: 'Price description',
    },
    prices: {
        tag: 'div',
        slot: 'price',
    },
    trialBadge: {
        tag: 'div',
        slot: 'trial-badge',
    },
    ctas: {
        slot: 'cta',
        size: 'XL',
    },
    mnemonics: {
        size: 'xs',
    },
    borderColor: {
        attribute: 'border-color',
        specialValues: {
            gray: 'var(--spectrum-gray-300)',
            blue: 'var(--spectrum-blue-400)',
            'gradient-purple-blue':
                'linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)',
            'gradient-firefly-spectrum':
                'linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)',
        },
    },
    showAllSpectrumColors: true,
    multiWhatsIncluded: 'true',
    disabledAttributes: [],
};

export function define({ TemplateLayout }) {
    class FullPricingExpress extends TemplateLayout {
        static SYNCED_SECTIONS = [
            'header',
            'short-description',
            'price-container',
            'cta',
        ];

        getGlobalCSS() {
            return CSS;
        }

        get aemFragmentMapping() {
            return FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING;
        }

        get headingSelector() {
            return '[slot="heading-xs"]';
        }

        get badge() {
            const badgeElement = this.card.querySelector('[slot="badge"]');
            return `<div
            class="badge-wrapper"
            style="${badgeElement ? '' : 'visibility: hidden'}"
        >
            <slot name="badge"></slot>
        </div>`;
        }

        async waitForTitleFont() {
            const title = this.card.querySelector(this.headingSelector);
            if (title && document.fonts?.load) {
                const style = window.getComputedStyle(title);
                const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
                await document.fonts
                    .load(font, title.textContent)
                    .catch(() => null);
            }
            await document.fonts.ready;
        }

        async syncHeights() {
            await this.waitForTitleFont();
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await new Promise((resolve) => requestAnimationFrame(resolve));
            if (this.card.getBoundingClientRect().width <= 2) return;
            const sectionEntries = FullPricingExpress.SYNCED_SECTIONS.map(
                (name) => ({
                    name,
                    getElement: (card) =>
                        card.shadowRoot?.querySelector(`.${name}`),
                }),
            );
            const container = this.getContainer();
            const cards = container
                ? container.querySelectorAll(
                      `merch-card[variant="${this.card.variant}"]`,
                  )
                : [this.card];
            const descriptionRowSelector = '[slot="body-s"] > *';
            const descriptionRows = Math.max(
                0,
                ...Array.from(
                    cards,
                    (card) =>
                        card.querySelectorAll(descriptionRowSelector).length,
                ),
            );
            const rowEntries = Array.from(
                { length: descriptionRows },
                (_, index) => ({
                    name: `description-row-${index}`,
                    getElement: (card) =>
                        card.querySelectorAll(descriptionRowSelector)[index],
                }),
            );
            this.syncRowHeights([...sectionEntries, ...rowEntries]);
        }

        async postCardUpdateHook() {
            if (!this.card.isConnected) return;
            await super.postCardUpdateHook();

            const container = this.getContainer();
            if (container) {
                const cards = container.querySelectorAll(
                    `merch-card[variant="${this.card.variant}"]`,
                );
                const CTA_LONG_TEXT_CHAR_THRESHOLD = 49;
                cards.forEach((card) => {
                    card.classList.remove('small-font-size-button');
                    const ctas = card.querySelectorAll(
                        '[slot="cta"] sp-button, [slot="cta"] button, [slot="cta"] a.con-button, [slot="cta"] a.spectrum-Button, a[slot="cta"]',
                    );
                    ctas.forEach((cta) => {
                        const isLong =
                            cta.textContent.trim().length >
                            CTA_LONG_TEXT_CHAR_THRESHOLD;
                        cta.classList.toggle('small-font-size-button', isLong);
                    });
                });
            }

            if (window.matchMedia('(min-width: 768px)').matches) {
                this.syncHeights();
            }
        }

        resyncOnReflow() {
            const width = this.card.getBoundingClientRect().width;
            if (width <= 2) return;
            const title = this.card.querySelector(this.headingSelector);
            const titleHeight = title
                ? Math.round(title.getBoundingClientRect().height)
                : 0;
            const key = `${Math.round(width)}:${titleHeight}`;
            if (key === this.lastSyncedKey) return;
            this.lastSyncedKey = key;
            this.syncHeights();
        }

        connectedCallbackHook() {
            if (!this.card || typeof ResizeObserver === 'undefined') return;
            this.lastSyncedKey = '';
            this.sizeObserver = new ResizeObserver(() => this.resyncOnReflow());
            this.sizeObserver.observe(this.card);
            const title = this.card.querySelector(this.headingSelector);
            if (title) this.sizeObserver.observe(title);
        }

        disconnectedCallbackHook() {
            this.sizeObserver?.disconnect();
            this.sizeObserver = null;
        }

        renderLayout() {
            return `
            ${this.badge}
            <div class="card-content">
                <div class="header">
                    <slot name="heading-xs"></slot>
                    <div class="icons">
                        <slot name="icons"></slot>
                    </div>
                </div>
                <div class="short-description">
                    <slot name="short-description"></slot>
                </div>
                <div class="price-container">
                    <slot name="trial-badge"></slot>
                    <slot name="price"></slot>
                    <slot name="callout-content"></slot>
                </div>
                <div class="cta">
                    <slot name="cta"></slot>
                </div>
                <div class="description">
                    <slot name="body-s"></slot>
                </div>
            </div>
            <slot></slot>
        `;
        }

        static templateStyle = css`
            :host([variant='full-pricing-express']) {
                /* CSS Variables */
                --merch-card-full-pricing-express-width: 437px;
                --merch-card-full-pricing-express-mobile-width: 303px;
                --merch-card-full-pricing-express-padding: 24px;
                --merch-card-full-pricing-express-padding-mobile: 20px;
                --merch-card-full-pricing-express-section-gap: 24px;
                --express-custom-gray-500: #8f8f8f;
                --express-custom-gray-400: #d5d5d5;
                --express-custom-price-border: #e0e2ff;

                /* Price container specific */
                --merch-card-full-pricing-express-price-bg: #f8f8f8;
                --merch-card-full-pricing-express-price-radius: 8px;

                /* Typography - matching simplified-pricing-express */
                --merch-card-full-pricing-express-trial-badge-font-size: 12px;
                --merch-card-full-pricing-express-trial-badge-font-weight: 700;
                --merch-card-full-pricing-express-trial-badge-line-height: 15.6px;
                --merch-card-full-pricing-express-price-font-size: 28px;
                --merch-card-full-pricing-express-price-line-height: 36.4px;
                --merch-card-full-pricing-express-price-font-weight: 700;
                --merch-card-full-pricing-express-cta-font-size: 18px;
                --merch-card-full-pricing-express-cta-font-weight: 700;
                --merch-card-full-pricing-express-cta-line-height: 23.4px;

                /* Accent color */
                --spectrum-express-accent: #5258e4;
                --spectrum-express-indigo-300: #d3d5ff;
                --spectrum-express-white: #ffffff;

                /* Gradient definitions (reused) */
                --gradient-purple-blue: linear-gradient(
                    96deg,
                    #b539c8 0%,
                    #7155fa 66%,
                    #3b63fb 100%
                );
                --gradient-firefly-spectrum: linear-gradient(
                    96deg,
                    #d73220 0%,
                    #d92361 33%,
                    #7155fa 100%
                );

                width: var(--merch-card-full-pricing-express-width);
                max-width: var(--merch-card-full-pricing-express-width);
                background: transparent;
                border: none;
                display: flex;
                flex-direction: column;
                overflow: visible;
                box-sizing: border-box;
                position: relative;
            }

            /* Badge wrapper styling (same as simplified) */
            :host([variant='full-pricing-express']) .badge-wrapper {
                padding: 4px 12px;
                border-radius: 8px 8px 0 0;
                text-align: center;
                font-size: 16px;
                font-weight: 700;
                line-height: 20.8px;
                color: var(--spectrum-gray-800);
                position: relative;
                min-height: 23px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            :host([variant='full-pricing-express']) .icons {
                display: flex;
                padding-bottom: 4px;
                border-bottom: 1px solid var(--spectrum-black);
            }

            /* Card content styling */
            :host([variant='full-pricing-express']) .card-content {
                border-radius: 8px;
                padding: var(--merch-card-full-pricing-express-padding);
                flex: 1;
                display: flex;
                flex-direction: column;
                position: relative;
            }

            :host([variant='full-pricing-express']) .card-content > * {
                position: relative;
            }

            /* Regular border styling */
            :host(
                    [variant='full-pricing-express']:not(
                            [gradient-border='true']
                        )
                )
                .card-content {
                background: var(--spectrum-gray-50);
                border: 1px solid #d5d5d5;
            }

            /* When badge exists, adjust card content border radius */
            :host(
                    [variant='full-pricing-express']:has(
                            [slot='badge']:not(:empty)
                        )
                )
                .card-content {
                border-top-left-radius: 0;
                border-top-right-radius: 0;
            }

            /* When badge exists with regular border, ensure top border */
            :host(
                    [variant='full-pricing-express']:not(
                            [gradient-border='true']
                        ):has([slot='badge']:not(:empty))
                )
                .card-content {
                border-top: 1px solid
                    var(
                        --consonant-merch-card-border-color,
                        var(--spectrum-gray-100)
                    );
            }

            /* When badge has content, ensure seamless connection */
            :host(
                    [variant='full-pricing-express']:has(
                            [slot='badge']:not(:empty)
                        )
                )
                .badge-wrapper {
                margin-bottom: -2px;
            }

            /* Gradient border styling (reused from simplified) */
            :host([variant='full-pricing-express'][gradient-border='true'])
                .badge-wrapper {
                border: none;
                margin-bottom: -6px;
                padding-bottom: 6px;
            }

            :host([variant='full-pricing-express'][gradient-border='true'])
                .badge-wrapper
                ::slotted(*) {
                color: white;
            }

            :host([variant='full-pricing-express'][gradient-border='true'])
                .card-content {
                border: 1px solid transparent;
                padding: calc(
                    var(--merch-card-full-pricing-express-padding) + 1px
                );
                border-radius: 8px;
                background-origin: border-box;
                background-clip: padding-box, border-box;
            }

            /* Gradient backgrounds */
            :host(
                    [variant='full-pricing-express'][border-color='gradient-purple-blue']
                )
                .badge-wrapper {
                background: var(--gradient-purple-blue);
            }
            :host(
                    [variant='full-pricing-express'][border-color='gradient-purple-blue']
                )
                .card-content {
                background-image: linear-gradient(
                        var(--spectrum-express-white, #ffffff),
                        var(--spectrum-express-white, #ffffff)
                    ),
                    var(--gradient-purple-blue);
            }

            :host(
                    [variant='full-pricing-express'][border-color='gradient-firefly-spectrum']
                )
                .badge-wrapper {
                background: var(--gradient-firefly-spectrum);
            }
            :host(
                    [variant='full-pricing-express'][border-color='gradient-firefly-spectrum']
                )
                .card-content {
                background-image: linear-gradient(
                        var(--spectrum-express-white, #ffffff),
                        var(--spectrum-express-white, #ffffff)
                    ),
                    var(--gradient-firefly-spectrum);
            }

            /* Header styling */
            :host([variant='full-pricing-express']) .header {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }

            :host([variant='full-pricing-express']) [slot='heading-xs'] {
                font-size: 18px;
                font-weight: 700;
                line-height: 23.4px;
                color: var(--spectrum-gray-800);
            }

            /* Icons/Mnemonics styling */
            :host([variant='full-pricing-express']) [slot='icons'] {
                display: flex;
                gap: 8px;
                align-items: center;
                flex-shrink: 0;
            }

            :host([variant='full-pricing-express'])
                .icons
                ::slotted(merch-icon) {
                --mod-img-width: auto;
                --mod-img-height: 18px;
                align-self: flex-end;
            }

            :host([variant='full-pricing-express'])
                .icons
                ::slotted(merch-icon:nth-of-type(2)) {
                --mod-img-height: 14px;
                height: 14px;
            }

            /* Description sections */
            :host([variant='full-pricing-express']) .description {
                display: flex;
                flex-direction: column;
            }

            /* Price container with background */
            :host([variant='full-pricing-express']) .price-container {
                background: var(--merch-card-full-pricing-express-price-bg);
                padding: 24px 16px;
                border-radius: var(
                    --merch-card-full-pricing-express-price-radius
                );
                border: 1px solid var(--express-custom-price-border);
                display: flex;
                flex-direction: column;
                position: relative;
                overflow: visible;
                margin-bottom: var(
                    --merch-card-full-pricing-express-section-gap
                );
                justify-content: center;
                align-items: center;
                min-height: var(
                    --consonant-merch-card-full-pricing-express-price-container-height
                );
            }

            :host([variant='full-pricing-express']) [slot='callout-content'] {
                font-size: 12px;
                font-weight: 400;
                font-style: normal;
                line-height: 18px;
                color: var(--spectrum-gray-800);
                text-align: center;
                background: transparent;
            }

            /* CTA styling */
            :host([variant='full-pricing-express']) .cta,
            :host([variant='full-pricing-express']) .cta ::slotted(*) {
                width: 100%;
                display: block;
            }

            /* Mobile and tablet styles */
            @media (max-width: 1199px) {
                :host([variant='full-pricing-express']) {
                    width: 100%;
                    max-width: 100%;
                }

                :host([variant='full-pricing-express']) .card-content {
                    padding: 24px 16px;
                }

                :host([variant='full-pricing-express'][gradient-border='true'])
                    .card-content {
                    padding: 26px 18px;
                }

                :host([variant='full-pricing-express']) .short-description {
                    padding: 24px 0;
                }
            }

            /* Tablet and desktop - fixed heights for alignment */
            @media (min-width: 768px) {
                :host([variant='full-pricing-express']) .card-content {
                    height: 100%;
                }

                :host([variant='full-pricing-express']) .description {
                    flex: 1;
                }

                :host([variant='full-pricing-express']) .cta {
                    margin-bottom: 24px;
                    min-height: var(
                        --consonant-merch-card-full-pricing-express-cta-height
                    );
                }

                :host([variant='full-pricing-express']) .short-description {
                    margin-bottom: 24px;
                    min-height: var(
                        --consonant-merch-card-full-pricing-express-short-description-height
                    );
                }

                :host([variant='full-pricing-express']) .header {
                    min-height: var(
                        --consonant-merch-card-full-pricing-express-header-height
                    );
                }
            }
        `;
    }
    return {
        'full-pricing-express': {
            class: FullPricingExpress,
            fragmentMapping: FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
            style: FullPricingExpress.templateStyle,
        },
    };
}
