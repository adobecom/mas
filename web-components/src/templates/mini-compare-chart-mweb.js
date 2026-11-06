import { css } from '../css.js';

const CSS = css`
    :root {
        --list-checked-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20'%3E%3Cpath fill='%23222222' d='M15.656,3.8625l-.7275-.5665a.5.5,0,0,0-.7.0875L7.411,12.1415,4.0875,8.8355a.5.5,0,0,0-.707,0L2.718,9.5a.5.5,0,0,0,0,.707l4.463,4.45a.5.5,0,0,0,.75-.0465L15.7435,4.564A.5.5,0,0,0,15.656,3.8625Z'%3E%3C/path%3E%3C/svg%3E");
        --merch-card-collection-card-width: var(
            --consonant-merch-card-mini-compare-chart-mweb-width
        );
    }

    merch-card[variant='mini-compare-chart-mweb'] {
        background:
            linear-gradient(#ffffff, #ffffff) padding-box,
            var(--consonant-merch-card-border-color, #e9e9e9) border-box;
        border: 1px solid transparent;
        max-width: var(--consonant-merch-card-mini-compare-chart-mweb-width);
        width: 100%;
        box-sizing: border-box;
        position: relative;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='heading-m'] {
        padding: 0 var(--consonant-merch-spacing-s) 0;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='badge'] {
        position: absolute;
        top: 16px;
        inset-inline-end: 0;
        line-height: 16px;
    }

    merch-card[variant='mini-compare-chart-mweb']
        div[class$='-badge']:dir(rtl) {
        left: 0;
        right: initial;
        padding: 8px 11px;
        border-radius: 0 5px 5px 0;
    }

    merch-card[variant='mini-compare-chart-mweb'] merch-badge {
        max-width: calc(
            var(--consonant-merch-card-plans-width) *
                var(--merch-badge-card-size) - var(--merch-badge-with-offset) *
                40px - var(--merch-badge-offset) * 48px
        );
    }

    merch-card[variant='mini-compare-chart-mweb'] merch-addon {
        box-sizing: border-box;
    }

    merch-card[variant='mini-compare-chart-mweb'] merch-addon {
        padding-top: 8px;
        padding-bottom: 8px;
        padding-inline-end: 8px;
        border-radius: 0.5rem;
        font-family: var(--merch-body-font-family, 'Adobe Clean');
        margin: var(--consonant-merch-spacing-xs)
            var(--consonant-merch-spacing-s) 0.5rem;
        font-size: var(--consonant-merch-card-body-xs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
    }

    merch-card[variant='mini-compare-chart-mweb']
        merch-addon
        [is='inline-price'] {
        min-height: unset;
        font-weight: bold;
        pointer-events: none;
    }

    merch-card[variant='mini-compare-chart-mweb'] merch-addon::part(checkbox) {
        height: 18px;
        width: 18px;
        margin: 14px 12px 0 8px;
    }

    merch-card[variant='mini-compare-chart-mweb'] merch-addon::part(label) {
        display: flex;
        flex-direction: column;
        padding: 8px 4px 8px 0;
        width: 100%;
    }

    merch-card[variant='mini-compare-chart-mweb'] [is='inline-price'] {
        display: inline;
    }

    merch-card[variant='mini-compare-chart-mweb'] merch-badge span,
    merch-card[variant='mini-compare-chart-mweb']
        merch-badge
        [is='inline-price'] {
        line-height: 1;
        min-height: auto;
    }

    merch-card[variant='mini-compare-chart-mweb'] .price-unit-type.disabled,
    merch-card[variant='mini-compare-chart-mweb']
        .price-tax-inclusivity.disabled {
        display: none;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='heading-m-price'] {
        padding: unset;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']
        .price-unit-type.disabled,
    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']
        .price-tax-inclusivity.disabled {
        display: none;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']
        span.price.price-strikethrough,
    merch-card[variant='mini-compare-chart-mweb'] [slot='heading-m-price'] s {
        font-size: 20px;
        color: #6b6b6b;
        text-decoration: line-through;
        font-weight: 400;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']:has(
            span[is='inline-price'] + span[is='inline-price']
        )
        span[is='inline-price'] {
        display: inline;
        text-decoration: none;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [is='inline-price'][data-template='legal'] {
        display: block;
        min-height: unset;
        padding: 0;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']
        .price-recurrence {
        line-height: 1.4;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']
        .price-plan-type,
    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']
        span[data-template='planType'] {
        text-transform: unset;
        display: block;
        color: var(--spectrum-gray-700, #505050);
        font-size: 16px;
        font-weight: 400;
        line-height: 1.4;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='callout-content'] {
        padding: var(--consonant-merch-spacing-xs)
            var(--consonant-merch-spacing-s) 0px;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='body-m'] {
        padding: 12px 0;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='body-xs'] {
        padding: var(--consonant-merch-spacing-xs)
            var(--consonant-merch-spacing-s);
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='callout-content']
        [is='inline-price'] {
        min-height: unset;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='price-commitment'] {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        padding: 0 var(--consonant-merch-spacing-s);
        font-style: italic;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='price-commitment'] a {
        display: inline-block;
        height: 27px;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='offers'] {
        font-size: var(--consonant-merch-card-body-xs-font-size);
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='body-xxs'] {
        font-size: var(--consonant-merch-card-body-xs-font-size);
        padding: var(--consonant-merch-spacing-xs)
            var(--consonant-merch-spacing-s) 0;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='subtitle'] {
        font-size: var(--consonant-merch-card-body-s-font-size);
        line-height: var(--consonant-merch-card-body-s-line-height);
        margin-block-end: calc(-1 * var(--consonant-merch-spacing-xxs));
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='promo-text'] {
        font-size: var(--consonant-merch-card-body-m-font-size);
        padding: var(--consonant-merch-spacing-xs)
            var(--consonant-merch-spacing-s) 0;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='promo-text'] a {
        color: var(--color-accent);
        text-decoration: underline;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='body-m'] a {
        color: var(--color-accent);
        text-decoration: underline;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='body-m']
        a.spectrum-Link.spectrum-Link--secondary {
        color: inherit;
    }

    merch-card[variant='mini-compare-chart-mweb'] ul {
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--consonant-merch-spacing-xxs);
    }

    merch-card[variant='mini-compare-chart-mweb'] ul li {
        font-family: 'Adobe Clean', sans-serif;
        color: #292929;
        line-height: 140%;
        display: inline-flex;
        list-style: none;
        padding: 0;
        margin-bottom: 8px;
        width: 100%;
    }

    merch-card[variant='mini-compare-chart-mweb'] ul li::before {
        display: inline-block;
        content: var(--list-checked-icon);
        margin-right: var(--consonant-merch-spacing-xxs);
        vertical-align: middle;
        flex-shrink: 0;
        height: 24px;
    }

    merch-card[variant='mini-compare-chart-mweb'] .action-area {
        display: flex;
        justify-content: flex-start;
        align-items: flex-end;
        flex-wrap: wrap;
        width: 100%;
        gap: var(--consonant-merch-spacing-xxs);
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='footer-rows'] ul {
        margin-block-start: 0px;
        margin-block-end: 0px;
        padding-inline-start: 0px;
    }

    merch-card[variant='mini-compare-chart-mweb'] .footer-row-icon {
        display: flex;
        place-items: center;
    }

    merch-card[variant='mini-compare-chart-mweb'] .footer-row-icon img {
        max-width: initial;
        width: 32px;
        height: 32px;
    }

    merch-card[variant='mini-compare-chart-mweb'] .footer-rows-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 700;
        line-height: var(--consonant-merch-card-body-xs-line-height);
        font-size: var(--consonant-merch-card-body-s-font-size);
    }

    merch-card[variant='mini-compare-chart-mweb'] .footer-row-cell {
        border-top: 1px solid var(--consonant-merch-card-border-color);
        display: flex;
        gap: var(--consonant-merch-spacing-xs);
        justify-content: start;
        place-items: center;
        padding: var(--consonant-merch-spacing-xs)
            var(--consonant-merch-spacing-s);
        margin-block: 0px;
    }

    merch-card[variant='mini-compare-chart-mweb']
        .footer-row-icon-checkmark
        img {
        max-width: initial;
    }

    merch-card[variant='mini-compare-chart-mweb'] .footer-row-icon-checkmark {
        display: flex;
        align-items: center;
        height: 20px;
    }

    merch-card[variant='mini-compare-chart-mweb'] .footer-row-cell-checkmark {
        display: flex;
        gap: var(--consonant-merch-spacing-xs);
        justify-content: start;
        align-items: flex-start;
        margin-block: var(--consonant-merch-spacing-xxxs);
    }

    merch-card[variant='mini-compare-chart-mweb']
        .footer-row-cell-description-checkmark {
        font-size: var(--consonant-merch-card-body-s-font-size);
        font-weight: 400;
        line-height: var(--consonant-merch-card-body-s-line-height);
        color: #2c2c2c;
    }

    merch-card[variant='mini-compare-chart-mweb'] .footer-row-cell-description {
        font-size: var(--consonant-merch-card-body-s-font-size);
        line-height: var(--consonant-merch-card-body-s-line-height);
        font-weight: 400;
        color: #2c2c2c;
    }

    merch-card[variant='mini-compare-chart-mweb']
        .footer-row-cell-description
        p {
        color: var(--merch-color-grey-80);
        vertical-align: bottom;
    }

    merch-card[variant='mini-compare-chart-mweb']
        .footer-row-cell-description
        a {
        color: var(--color-accent);
    }

    merch-card[variant='mini-compare-chart-mweb'] .toggle-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        flex-shrink: 0;
        background-color: transparent;
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
        background-image: url('data:image/svg+xml,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="%23F8F8F8"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M18.5484 12.9484H15.0484V9.44844C15.0484 8.86875 14.5781 8.39844 13.9984 8.39844C13.4188 8.39844 12.9484 8.86875 12.9484 9.44844V12.9484H9.44844C8.86875 12.9484 8.39844 13.4188 8.39844 13.9984C8.39844 14.5781 8.86875 15.0484 9.44844 15.0484H12.9484V18.5484C12.9484 19.1281 13.4188 19.5984 13.9984 19.5984C14.5781 19.5984 15.0484 19.1281 15.0484 18.5484V15.0484H18.5484C19.1281 15.0484 19.5984 14.5781 19.5984 13.9984C19.5984 13.4188 19.1281 12.9484 18.5484 12.9484Z" fill="%23292929"/></svg>');
        background-size: 28px 28px;
        background-position: center;
        background-repeat: no-repeat;
        transition: background-image 0.3s ease;
    }

    merch-card[variant='mini-compare-chart-mweb'] .toggle-icon.expanded {
        background-image: url('data:image/svg+xml,<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="%23292929"/><path d="M14 26C7.38258 26 2 20.6174 2 14C2 7.38258 7.38258 2 14 2C20.6174 2 26 7.38258 26 14C26 20.6174 20.6174 26 14 26ZM14 4.05714C8.51696 4.05714 4.05714 8.51696 4.05714 14C4.05714 19.483 8.51696 23.9429 14 23.9429C19.483 23.9429 23.9429 19.483 23.9429 14C23.9429 8.51696 19.483 4.05714 14 4.05714Z" fill="%23292929"/><path d="M9 14L19 14" stroke="%23F8F8F8" stroke-width="2" stroke-linecap="round"/></svg>');
    }

    merch-card[variant='mini-compare-chart-mweb'] .checkmark-copy-container {
        display: none;
    }

    merch-card[variant='mini-compare-chart-mweb']
        .checkmark-copy-container.open {
        display: block;
        margin-top: 16px;
    }

    .collection-container.mini-compare-chart-mweb {
        --merch-card-collection-card-width: var(
            --consonant-merch-card-mini-compare-chart-mweb-width
        );
    }

    .one-merch-card.mini-compare-chart-mweb {
        --merch-card-collection-card-width: var(
            --consonant-merch-card-mini-compare-chart-mweb-width
        );
        grid-template-columns: var(
            --consonant-merch-card-mini-compare-chart-mweb-wide-width
        );
        gap: var(--consonant-merch-spacing-xs);
    }

    .two-merch-cards.mini-compare-chart-mweb,
    .three-merch-cards.mini-compare-chart-mweb,
    .four-merch-cards.mini-compare-chart-mweb {
        --merch-card-collection-card-width: var(
            --consonant-merch-card-mini-compare-chart-mweb-width
        );
        grid-template-columns: repeat(
            2,
            var(--consonant-merch-card-mini-compare-chart-mweb-width)
        );
        gap: var(--consonant-merch-spacing-xs);
    }

    /* Sections inside tabs/fragments that don't receive the .mini-compare-chart-mweb class.
   Make .content wrapper transparent so the section grid applies directly to cards. */
    .one-merch-card:has(merch-card[variant='mini-compare-chart-mweb']) .content,
    .two-merch-cards:has(merch-card[variant='mini-compare-chart-mweb'])
        .content,
    .three-merch-cards:has(merch-card[variant='mini-compare-chart-mweb'])
        .content,
    .four-merch-cards:has(merch-card[variant='mini-compare-chart-mweb'])
        .content {
        display: contents;
    }

    .one-merch-card:has(merch-card[variant='mini-compare-chart-mweb']) {
        grid-template-columns: var(
            --consonant-merch-card-mini-compare-chart-mweb-wide-width
        );
        gap: var(--consonant-merch-spacing-xs);
    }

    /* Cap + center the lone card in its wide column at every width */
    .one-merch-card.mini-compare-chart-mweb
        merch-card[variant='mini-compare-chart-mweb'],
    .one-merch-card:has(merch-card[variant='mini-compare-chart-mweb'])
        merch-card[variant='mini-compare-chart-mweb'] {
        max-width: var(
            --consonant-merch-card-mini-compare-chart-mweb-wide-width
        );
        margin-inline: auto;
    }

    .two-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']),
    .three-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']),
    .four-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']) {
        grid-template-columns: repeat(
            2,
            var(--consonant-merch-card-mini-compare-chart-mweb-width)
        );
        gap: var(--consonant-merch-spacing-xs);
    }

    /* Place compare-plans text-block below all cards in multi-card layouts */
    .two-merch-cards:has(merch-card[variant='mini-compare-chart-mweb'])
        .text-block,
    .three-merch-cards:has(merch-card[variant='mini-compare-chart-mweb'])
        .text-block,
    .four-merch-cards:has(merch-card[variant='mini-compare-chart-mweb'])
        .text-block {
        grid-column: 1 / -1;
    }

    /* bullet list */
    merch-card[variant='mini-compare-chart-mweb'] {
        border-radius: var(--consonant-merch-spacing-xxs);
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='heading-m'] {
        padding: var(--consonant-merch-spacing-xxs)
            var(--consonant-merch-spacing-xs);
        font-size: var(--consonant-merch-card-body-m-font-size);
        line-height: 1.4;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']
        .starting-at {
        font-size: var(--consonant-merch-card-body-s-font-size);
        line-height: var(--consonant-merch-card-body-s-line-height);
        font-weight: 400;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']
        .price {
        font-size: var(--consonant-merch-card-heading-l-font-size);
        line-height: 35px;
        font-weight: 800;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']
        .price-alternative:has(+ .price-annual-prefix) {
        margin-bottom: 4px;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']
        [data-template='strikethrough'] {
        min-height: 24px;
        margin-bottom: 2px;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']
        [data-template='strikethrough'],
    merch-card[variant='mini-compare-chart-mweb']
        [slot='heading-m-price']
        .price-strikethrough {
        font-size: var(--consonant-merch-card-body-s-font-size);
        line-height: var(--consonant-merch-card-body-s-line-height);
        font-weight: 700;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='body-xxs'] {
        padding: var(--consonant-merch-spacing-xxxs)
            var(--consonant-merch-spacing-xs) 0;
        font-size: var(--consonant-merch-card-body-s-font-size);
        line-height: var(--consonant-merch-card-body-s-line-height);
        font-weight: 400;
        letter-spacing: normal;
        font-style: italic;
    }

    merch-card[variant='mini-compare-chart-mweb'].bullet-list
        p.card-heading[slot='body-xxs'] {
        padding: var(--consonant-merch-spacing-xxxs)
            var(--consonant-merch-spacing-xs) 0;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='quantity-select'] {
        padding: 0;
        max-width: 100%;
        box-sizing: border-box;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='promo-text'] {
        padding: 0;
        font-size: var(--consonant-merch-card-body-s-font-size);
        line-height: var(--consonant-merch-card-body-s-line-height);
        font-weight: 700;
        margin: 4px 0;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='promo-text'] a {
        font-weight: 400;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='heading-xs'] {
        font-size: var(--consonant-merch-card-heading-xxs-font-size);
        line-height: var(--consonant-merch-card-heading-xxs-line-height);
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='body-m'] {
        padding: 0;
        font-size: var(--consonant-merch-card-body-s-font-size);
        line-height: var(--consonant-merch-card-body-s-line-height);
        font-weight: 400;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='body-xs'] {
        padding: 12px var(--consonant-merch-spacing-xs);
        font-size: var(--consonant-merch-card-body-s-font-size);
        line-height: var(--consonant-merch-card-body-s-line-height);
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='body-m'] p:has(+ p) {
        margin-bottom: 8px;
    }

    merch-card[variant='mini-compare-chart-mweb'] [slot='callout-content'] {
        padding: var(--consonant-merch-spacing-xs)
            var(--consonant-merch-spacing-xs) 0px;
        margin: 0;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='callout-content']
        > div
        > div {
        background-color: #d9d9d9;
    }

    merch-card[variant='mini-compare-chart-mweb'] merch-addon {
        margin: var(--consonant-merch-spacing-xs)
            var(--consonant-merch-spacing-xs) var(--consonant-merch-spacing-xxs);
    }

    merch-card[variant='mini-compare-chart-mweb']
        merch-addon
        [is='inline-price'] {
        font-weight: 400;
    }

    merch-card[variant='mini-compare-chart-mweb']
        [slot='secure-transaction-label'] {
        display: flex;
    }

    merch-card[variant='mini-compare-chart-mweb'] .footer-rows-container {
        background-color: #f8f8f8;
        border-radius: 0 0 var(--consonant-merch-spacing-xxs)
            var(--consonant-merch-spacing-xxs);
    }

    merch-card[variant='mini-compare-chart-mweb'] .price-plan-type {
        font-size: var(--consonant-merch-card-body-s-font-size);
        line-height: var(--consonant-merch-card-body-s-line-height);
        font-weight: 400;
        font-style: italic;
    }

    /* mini compare mobile */
    @media screen and (--mobile-landscape) {
        :root {
            --consonant-merch-card-mini-compare-chart-mweb-width: 302px;
            --consonant-merch-card-mini-compare-chart-mweb-wide-width: 302px;
        }

        .two-merch-cards.mini-compare-chart-mweb,
        .three-merch-cards.mini-compare-chart-mweb,
        .four-merch-cards.mini-compare-chart-mweb,
        .two-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']),
        .three-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']),
        .four-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']) {
            grid-template-columns: var(
                --consonant-merch-card-mini-compare-chart-mweb-width
            );
            gap: var(--consonant-merch-spacing-xs);
        }

        merch-card[variant='mini-compare-chart-mweb'] [slot='heading-m'] {
            font-size: var(--consonant-merch-card-body-s-font-size);
            line-height: var(--consonant-merch-card-body-s-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb'] [slot='heading-m-price'] {
            font-size: var(--consonant-merch-card-heading-l-font-size);
            line-height: var(--consonant-merch-card-heading-l-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb'] [slot='body-m'] {
            font-size: var(--consonant-merch-card-body-m-font-size);
            line-height: var(--consonant-merch-card-body-s-line-height);
            font-weight: 400;
        }

        merch-card[variant='mini-compare-chart-mweb'] [slot='heading-xs'] {
            font-size: var(--consonant-merch-card-body-xxs-font-size);
            line-height: var(--consonant-merch-card-body-s-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb'] [slot='body-xs'] {
            font-size: var(--consonant-merch-card-body-s-font-size);
            line-height: var(--consonant-merch-card-body-s-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb'] [slot='promo-text'] {
            font-size: var(--consonant-merch-card-body-xs-font-size);
            line-height: var(--consonant-merch-card-body-xs-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb']
            .footer-row-cell-description {
            font-size: var(--consonant-merch-card-body-xs-font-size);
            line-height: var(--consonant-merch-card-body-xs-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb'] merch-addon {
            box-sizing: border-box;
        }
    }

    @media screen and (--tablet-down) {
        merch-card[variant='mini-compare-chart-mweb'] [slot='heading-xs'] {
            font-size: var(--consonant-merch-card-body-s-font-size);
            line-height: var(--consonant-merch-card-body-s-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb'] [slot='body-xs'] {
            font-size: var(--consonant-merch-card-body-s-font-size);
            line-height: var(--consonant-merch-card-body-s-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb'] [slot='heading-m'] {
            font-size: var(--consonant-merch-card-body-s-font-size);
            line-height: var(--consonant-merch-card-body-s-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb'] [slot='heading-m-price'] {
            font-size: var(--consonant-merch-card-body-s-font-size);
            line-height: var(--consonant-merch-card-body-s-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb'] [slot='body-m'] {
            font-size: var(--consonant-merch-card-body-s-font-size);
            line-height: var(--consonant-merch-card-body-s-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb'] [slot='promo-text'] {
            font-size: var(--consonant-merch-card-body-xs-font-size);
            line-height: var(--consonant-merch-card-body-xs-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb']
            .footer-row-cell-description {
            font-size: var(--consonant-merch-card-body-s-font-size);
            line-height: var(--consonant-merch-card-body-s-line-height);
        }
    }
    @media screen and (--tablet-up) {
        :root {
            --consonant-merch-card-mini-compare-chart-mweb-width: 302px;
            --consonant-merch-card-mini-compare-chart-mweb-wide-width: 302px;
        }

        .two-merch-cards.mini-compare-chart-mweb,
        .two-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']) {
            grid-template-columns: repeat(
                2,
                minmax(
                    var(--consonant-merch-card-mini-compare-chart-mweb-width),
                    var(
                        --consonant-merch-card-mini-compare-chart-mweb-wide-width
                    )
                )
            );
            gap: var(--consonant-merch-spacing-m);
        }

        .three-merch-cards.mini-compare-chart-mweb,
        .four-merch-cards.mini-compare-chart-mweb,
        .three-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']),
        .four-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']) {
            grid-template-columns: repeat(
                2,
                minmax(
                    var(--consonant-merch-card-mini-compare-chart-mweb-width),
                    var(
                        --consonant-merch-card-mini-compare-chart-mweb-wide-width
                    )
                )
            );
        }

        merch-card[variant='mini-compare-chart-mweb'] [slot='footer-rows'] {
            padding: var(--consonant-merch-spacing-xs);
        }

        merch-card[variant='mini-compare-chart-mweb'] .footer-rows-title {
            line-height: var(--consonant-merch-card-body-s-line-height);
        }

        merch-card[variant='mini-compare-chart-mweb']
            .checkmark-copy-container {
            display: block;
            margin-top: 16px;
        }

        merch-card[variant='mini-compare-chart-mweb'] .toggle-icon {
            display: none;
        }

        merch-card[variant='mini-compare-chart-mweb']
            .footer-row-cell-checkmark {
            gap: var(--consonant-merch-spacing-xxs);
        }
    }

    /* desktop */
    @media screen and (--desktop-up) {
        :root {
            --consonant-merch-card-mini-compare-chart-mweb-width: 378px;
            --consonant-merch-card-mini-compare-chart-mweb-wide-width: 484px;
        }
        .one-merch-card.mini-compare-chart-mweb,
        .one-merch-card:has(merch-card[variant='mini-compare-chart-mweb']) {
            grid-template-columns: var(
                --consonant-merch-card-mini-compare-chart-mweb-wide-width
            );
        }

        .two-merch-cards.mini-compare-chart-mweb,
        .two-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']) {
            grid-template-columns: repeat(
                2,
                var(--consonant-merch-card-mini-compare-chart-mweb-wide-width)
            );
            gap: var(--consonant-merch-spacing-m);
        }

        .three-merch-cards.mini-compare-chart-mweb,
        .four-merch-cards.mini-compare-chart-mweb,
        .three-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']),
        .four-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']) {
            grid-template-columns: repeat(
                3,
                var(--consonant-merch-card-mini-compare-chart-mweb-width)
            );
            gap: var(--consonant-merch-spacing-m);
        }

        /* Cap + center each card in its wide column */
        .two-merch-cards.mini-compare-chart-mweb
            merch-card[variant='mini-compare-chart-mweb'],
        .two-merch-cards:has(merch-card[variant='mini-compare-chart-mweb'])
            merch-card[variant='mini-compare-chart-mweb'] {
            max-width: var(
                --consonant-merch-card-mini-compare-chart-mweb-wide-width
            );
            margin-inline: auto;
        }
    }

    @media screen and (--large-desktop) {
        .four-merch-cards.mini-compare-chart-mweb,
        .four-merch-cards:has(merch-card[variant='mini-compare-chart-mweb']) {
            grid-template-columns: repeat(
                4,
                var(--consonant-merch-card-mini-compare-chart-mweb-width)
            );
        }
    }

    merch-card[variant='mini-compare-chart-mweb'] div[slot='footer-rows'] {
        height: 100%;
        min-height: var(
            --consonant-merch-card-mini-compare-chart-mweb-footer-rows-height
        );
    }

    merch-card .footer-row-cell:nth-child(1) {
        min-height: var(--consonant-merch-card-footer-row-1-min-height);
    }

    merch-card .footer-row-cell:nth-child(2) {
        min-height: var(--consonant-merch-card-footer-row-2-min-height);
    }

    merch-card .footer-row-cell:nth-child(3) {
        min-height: var(--consonant-merch-card-footer-row-3-min-height);
    }

    merch-card .footer-row-cell:nth-child(4) {
        min-height: var(--consonant-merch-card-footer-row-4-min-height);
    }

    merch-card .footer-row-cell:nth-child(5) {
        min-height: var(--consonant-merch-card-footer-row-5-min-height);
    }

    merch-card .footer-row-cell:nth-child(6) {
        min-height: var(--consonant-merch-card-footer-row-6-min-height);
    }

    merch-card .footer-row-cell:nth-child(7) {
        min-height: var(--consonant-merch-card-footer-row-7-min-height);
    }

    merch-card .footer-row-cell:nth-child(8) {
        min-height: var(--consonant-merch-card-footer-row-8-min-height);
    }
`;

const FOOTER_ROW_MIN_HEIGHT = 32;

// Fallback list id for cards without a heading id; the counter keeps siblings
// unique so aria-controls / DOM ids never collide.
let listIdCounter = 0;

const nextListId = () => `mweb-list-${(listIdCounter += 1)}`;

// Card-scoped min-height props set by syncHeights (via syncRowHeights). The sync
// only grows heights and never runs on mobile, so these must be cleared when the
// layout collapses to one mobile column — else cards keep the taller desktop
// heights and the collapsed "what's included" leaves dead space.
const SYNCED_HEIGHT_NAMES = [
    'heading-xs',
    'subtitle',
    'heading-m-price',
    'quantity-select',
    'promo-text',
    'body-m',
    'body-xs',
];

const MAX_FOOTER_ROWS = 8; // matches the .footer-row-cell nth-child rules in CSS

export const MINI_COMPARE_CHART_MWEB_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    title: { tag: 'h3', slot: 'heading-xs' },
    subtitle: { tag: 'p', slot: 'subtitle' },
    prices: { tag: 'p', slot: 'heading-m-price' },
    promoText: { tag: 'div', slot: 'promo-text' },
    quantitySelect: { tag: 'div', slot: 'quantity-select' },
    shortDescription: { tag: 'div', slot: 'body-m' },
    description: { tag: 'div', slot: 'body-xs' },
    mnemonics: { size: 'l' },
    secureLabel: true,
    planType: true,
    badgeIcon: true,
    badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300-plans' },
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
    ctas: { slot: 'footer', size: 'l' },
    style: 'consonant',
};

export function define({
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    Media,
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
    TemplateLayout,
    createTag,
    keepInHeadingPriceForAnnual,
}) {
    class MiniCompareChartMweb extends TemplateLayout {
        #syncObserver;
        #resizeObserver;
        #resizeTimer;
        #lastWidth = 0;
        #toggleEls;

        constructor(card) {
            super(card);
            this.updatePriceQuantity = this.updatePriceQuantity.bind(this);
        }

        connectedCallbackHook() {
            this.card.addEventListener(
                EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
                this.updatePriceQuantity,
            );
            // Re-sync on any width change, not just the mobile boundary: a narrower
            // column re-wraps text, so row heights must be recomputed to stay aligned.
            // Guard on width — a list toggle changes height only and must not retrigger.
            this.#lastWidth = this.card.getBoundingClientRect().width;
            this.#resizeObserver = new ResizeObserver(() => {
                const width = this.card.getBoundingClientRect().width;
                if (width === this.#lastWidth) return;
                this.#lastWidth = width;
                clearTimeout(this.#resizeTimer);
                this.#resizeTimer = setTimeout(
                    () => this.reconcileBreakpoint(),
                    150,
                );
            });
            this.#resizeObserver.observe(this.card);
        }

        disconnectedCallbackHook() {
            this.card.removeEventListener(
                EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
                this.updatePriceQuantity,
            );
            clearTimeout(this.#resizeTimer);
            this.#resizeObserver?.disconnect();
            this.#resizeObserver = null;
            this.#syncObserver?.disconnect();
            this.#syncObserver = null;
        }

        reconcileBreakpoint() {
            if (Media.isMobile) {
                this.resetSyncedHeights();
                this.removeEmptyRows();
            } else {
                this.#syncSiblingsWhenSettled();
            }
        }

        updatePriceQuantity({ detail }) {
            if (!this.mainPrice || !detail?.option) return;
            this.mainPrice.dataset.quantity = detail.option;
        }

        syncHeights() {
            // A desktop sync started before a resize can resolve after the switch to
            // mobile; never apply cross-card heights to the single mobile column.
            if (Media.isMobile) return;
            if (this.card.getBoundingClientRect().width <= 2) {
                if (!this.#syncObserver) {
                    this.#syncObserver = new ResizeObserver(() => {
                        if (this.card.getBoundingClientRect().width > 2) {
                            this.#syncObserver?.disconnect();
                            this.#syncObserver = null;
                            this.syncHeights();
                        }
                    });
                    this.#syncObserver.observe(this.card);
                }
                return;
            }
            const slots = [
                'heading-xs',
                'subtitle',
                'heading-m-price',
                'quantity-select',
                'promo-text',
                'body-m',
                'body-xs',
            ];
            this.syncRowHeights(
                slots.map((slot) => ({
                    name: slot,
                    getElement: (card) =>
                        card.querySelector(`[slot="${slot}"]`),
                })),
            );
            this.adjustMiniCompareFooterRows();
        }

        priceOptionsProvider(element, options) {
            const mainPriceSlot =
                MINI_COMPARE_CHART_MWEB_AEM_FRAGMENT_MAPPING.prices.slot;
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
                (element.dataset.template === 'price' &&
                    !element.closest?.('merch-card')?.settings?.displayAnnual)
            ) {
                options.displayPerUnit = false;
            }
        }

        getRowMinHeightPropertyName = (index) =>
            `--consonant-merch-card-footer-row-${index}-min-height`;

        getGlobalCSS() {
            return CSS;
        }

        getMiniCompareFooter = () => {
            return ` <footer>
            <slot name="secure-transaction-label">
                <span class="secure-transaction-label-text"
                    >${this.secureLabel}</span
                >
            </slot>
            <p class="action-area">
                <slot name="footer"></slot>
            </p>
        </footer>`;
        };

        getMiniCompareFooterRows = () => {
            return ` <div class="footer-rows-container">
            <slot name="body-xs"></slot>
            <slot name="footer-rows"></slot>
        </div>`;
        };

        adjustMiniCompareFooterRows() {
            if (this.card.getBoundingClientRect().width === 0) return;
            const footerRows = this.card.querySelector(
                '[slot="footer-rows"] ul',
            );

            if (!footerRows || !footerRows.children) return;

            [...footerRows.children].forEach((el, index) => {
                const height = Math.max(
                    FOOTER_ROW_MIN_HEIGHT,
                    parseFloat(window.getComputedStyle(el).height) || 0,
                );
                const maxMinHeight =
                    parseFloat(
                        this.getContainer().style.getPropertyValue(
                            this.getRowMinHeightPropertyName(index + 1),
                        ),
                    ) || 0;
                if (height > maxMinHeight) {
                    this.getContainer().style.setProperty(
                        this.getRowMinHeightPropertyName(index + 1),
                        `${height}px`,
                    );
                }
            });
        }

        removeEmptyRows() {
            const footerRows = this.card.querySelectorAll('.footer-row-cell');
            footerRows.forEach((row) => {
                const rowDescription = row.querySelector(
                    '.footer-row-cell-description',
                );
                if (rowDescription) {
                    const isEmpty = !rowDescription.textContent.trim();
                    if (isEmpty) {
                        row.remove();
                    }
                }
            });
        }

        setupToggle() {
            const bodyXs = this.card.querySelector('[slot="body-xs"]');
            const titleEl = bodyXs?.querySelector('p');
            const listEl = bodyXs?.querySelector('ul');
            if (!titleEl || !listEl) return;
            // Skip if the Milo block already built this structure.
            if (bodyXs.querySelector('.footer-rows-title')) return;

            const titleText = titleEl.textContent.trim();
            const heading = this.card.querySelector('h3')?.id;
            const listId = heading ? `${heading}-list` : nextListId();
            listEl.id = listId;
            listEl.classList.add('checkmark-copy-container');

            const titleDiv = createTag(
                'h4',
                { class: 'footer-rows-title' },
                titleText,
            );
            const toggleBtn = createTag('button', {
                class: 'toggle-icon',
                'aria-label': titleText,
                'aria-expanded': 'false',
                'aria-controls': listId,
            });
            this.#toggleEls = { toggleBtn, listEl };
            titleDiv.append(toggleBtn);

            // Collapsing is mobile-only; CSS hides the button and forces the list
            // open on desktop, so a click there must never collapse it.
            titleDiv.addEventListener('click', () => {
                if (Media.isMobile) this.setListOpen(!this.isListOpen);
            });
            titleEl.replaceWith(titleDiv);
        }

        get isListOpen() {
            return this.#toggleEls?.listEl.classList.contains('open') ?? false;
        }

        // One definition of "open" for the mobile click handler.
        setListOpen(isOpen) {
            const { toggleBtn, listEl } = this.#toggleEls;
            listEl.classList.toggle('open', isOpen);
            toggleBtn.classList.toggle('expanded', isOpen);
            toggleBtn.setAttribute('aria-expanded', String(isOpen));
        }

        get legalDisplayDot() {
            return false;
        }

        get mainPrice() {
            return this.card.querySelector(
                `[slot="heading-m-price"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
            );
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

                if (headingPrice.options.displayPlanType)
                    headingPrice.dataset.displayPlanType = 'false';

                keepInHeadingPriceForAnnual(
                    this.card,
                    headingPrice,
                    legal,
                    'displayTax',
                );
                keepInHeadingPriceForAnnual(
                    this.card,
                    headingPrice,
                    legal,
                    'displayPerUnit',
                );

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

        get icons() {
            if (
                !this.card.querySelector('[slot="icons"]') &&
                !this.card.getAttribute('id')
            )
                return '';
            return `<slot name="icons"></slot>`;
        }

        renderLayout() {
            return `
            ${this.badge}
            <div class="body">
                <div class="body-main">
                    ${this.icons}
                    <slot name="badge"></slot>
                    <slot name="heading-xs"></slot>
                    <div class="price-wrapping">
                        <slot name="subtitle"></slot>
                        <slot name="heading-m-price"></slot>
                    </div>
                    <slot name="promo-text"></slot>
                    <slot name="body-m"></slot>
                    <slot name="quantity-select"></slot>
                </div>
                ${this.getMiniCompareFooter()}
            </div>
            ${this.getMiniCompareFooterRows()}
        `;
        }

        async postCardUpdateHook() {
            if (!this.legalAdjusted) {
                await this.adjustLegal();
            }
            this.setupToggle();
            if (Media.isMobile) {
                this.removeEmptyRows();
            }
            await super.postCardUpdateHook();
            if (!Media.isMobile) {
                await this.#syncSiblingsWhenSettled();
            }
        }

        // All sibling cards of this variant inside the given container.
        #siblingCards(container) {
            return container.querySelectorAll(
                `merch-card[variant="${this.card.variant}"]`,
            );
        }

        // Sync only after every sibling card has finished updating and the layout
        // has settled, driven once from the first card. Running per-card mid-reflow
        // (e.g. straight off a breakpoint change) groups cards by a transient top
        // and strands siblings at mismatched heights.
        async #syncSiblingsWhenSettled() {
            const container = this.getContainer();
            if (!container) return;
            const cards = Array.from(this.#siblingCards(container));
            // Elect the first card of the sibling set as leader; querySelectorAll
            // matches at any depth, so firstElementChild would miss nested layouts.
            if (this.card !== cards[0]) return;
            await Promise.all(cards.map((card) => card.updateComplete));
            await new Promise((resolve) => setTimeout(resolve, 100));
            requestAnimationFrame(() => {
                this.resetSyncedHeights();
                this.syncHeights();
            });
        }

        resetSyncedHeights() {
            const container = this.getContainer();
            if (!container) return;
            const variant = this.card.variant;
            const cards = this.#siblingCards(container);
            for (const name of SYNCED_HEIGHT_NAMES) {
                const prop = `--consonant-merch-card-${variant}-${name}-height`;
                container.style.removeProperty(prop);
                cards.forEach((card) => card.style.removeProperty(prop));
            }
            for (let index = 1; index <= MAX_FOOTER_ROWS; index += 1) {
                container.style.removeProperty(
                    this.getRowMinHeightPropertyName(index),
                );
            }
        }

        static templateStyle = css`
            :host([variant='mini-compare-chart-mweb'])
                .body-main
                > .price-wrapping {
                display: flex;
                flex-direction: column;
            }

            :host([variant='mini-compare-chart-mweb']) .body {
                padding: 0;
            }

            :host([variant='mini-compare-chart-mweb']) .body-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                height: 100%;
                gap: var(--consonant-merch-spacing-xxs);
                padding: var(--consonant-merch-spacing-xs);
                padding-bottom: 0;
            }

            :host([variant='mini-compare-chart-mweb']) footer {
                margin: var(--consonant-merch-spacing-xs);
                margin-top: 0;
                width: auto;
            }

            :host([variant='mini-compare-chart-mweb'])
                .price-wrapping
                > slot[name='subtitle'] {
                display: block;
            }

            :host([variant='mini-compare-chart-mweb'])
                .price-wrapping
                > slot[name='heading-m-price'] {
                display: flex;
                flex: 1;
                flex-direction: column;
                justify-content: flex-end;
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-heading-m-price-height
                );
            }

            :host([variant='mini-compare-chart-mweb'])
                .mini-compare-chart-mweb-badge {
                padding: 2px 10px 3px 10px;
                font-size: var(--consonant-merch-card-body-xs-font-size);
                line-height: var(--consonant-merch-card-body-xs-line-height);
                border-radius: 7.11px 0 0 7.11px;
                font-weight: 700;
            }

            :host([variant='mini-compare-chart-mweb']) footer {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-footer-height
                );
                padding: 0;
                align-items: start;
                flex-flow: column nowrap;
            }

            /* mini-compare card  */
            :host([variant='mini-compare-chart-mweb']) .top-section {
                padding-top: var(--consonant-merch-spacing-s);
                padding-inline-start: var(--consonant-merch-spacing-s);
                height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-top-section-height
                );
            }

            :host([variant='mini-compare-chart-mweb'].bullet-list)
                .top-section {
                padding-top: var(--consonant-merch-spacing-xs);
                padding-inline-start: var(--consonant-merch-spacing-xs);
            }

            @media screen and (--desktop-up) {
                :host([variant='mini-compare-chart-mweb']) footer {
                    padding: 0;
                }
            }

            @media screen and (--tablet-up) {
                :host([variant='mini-compare-chart-mweb'])
                    .price-wrapping
                    > slot[name='subtitle'] {
                    min-height: var(
                        --consonant-merch-card-mini-compare-chart-mweb-subtitle-height,
                        0px
                    );
                }
            }

            :host([variant='mini-compare-chart-mweb'])
                slot[name='footer-rows'] {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: end;
            }
            /* mini-compare card heights for the slots: heading-m, body-m, heading-m-price, price-commitment, offers, promo-text, footer */
            /* Use ::slotted() to target light DOM elements — shadow slots have display:contents so min-height is ignored on them */
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='heading-m']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-heading-m-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='body-m']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-body-m-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='heading-m-price']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-heading-m-price-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='body-xxs']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-body-xxs-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='price-commitment']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-price-commitment-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='offers']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-offers-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='promo-text']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-promo-text-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='quantity-select']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-quantity-select-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='callout-content']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-callout-content-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='heading-xs']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-heading-xs-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='subtitle']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-subtitle-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='body-xs']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-body-xs-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='addon']) {
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-addon-height
                );
            }
            /* Shadow DOM slot min-heights — ensures empty slots reserve space for cross-card alignment */
            :host([variant='mini-compare-chart-mweb'])
                .body-main
                > slot[name='heading-xs'] {
                display: block;
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-heading-xs-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                .body-main
                > slot[name='promo-text'] {
                display: block;
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-promo-text-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                .body-main
                > slot[name='body-m'] {
                display: block;
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-body-m-height
                );
            }
            :host([variant='mini-compare-chart-mweb'])
                .footer-rows-container
                > slot[name='body-xs'] {
                display: block;
                min-height: var(
                    --consonant-merch-card-mini-compare-chart-mweb-body-xs-height
                );
            }

            :host([variant='mini-compare-chart-mweb'])
                slot[name='footer-rows'] {
                justify-content: flex-start;
            }

            /* Border color styles */
            :host(
                [variant='mini-compare-chart-mweb'][border-color='spectrum-yellow-300-plans']
            ) {
                --consonant-merch-card-border-color: #ffd947;
            }

            :host(
                [variant='mini-compare-chart-mweb'][border-color='spectrum-gray-300-plans']
            ) {
                --consonant-merch-card-border-color: #dadada;
            }

            :host(
                [variant='mini-compare-chart-mweb'][border-color='spectrum-green-900-plans']
            ) {
                --consonant-merch-card-border-color: #05834e;
            }

            :host(
                [variant='mini-compare-chart-mweb'][border-color='spectrum-red-700-plans']
            ) {
                --consonant-merch-card-border-color: #eb1000;
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
            }

            :host(
                [variant='mini-compare-chart-mweb'][border-color='gradient-purple-blue']
            ) {
                --consonant-merch-card-border-color: linear-gradient(
                    135deg,
                    #9256dc,
                    #1473e6
                );
            }

            /* Badge color styles */
            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='badge'].spectrum-red-700-plans) {
                filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.16));
            }

            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='badge'].spectrum-yellow-300-plans),
            :host([variant='mini-compare-chart-mweb'])
                #badge.spectrum-yellow-300-plans {
                background-color: #ffd947;
                color: #2c2c2c;
            }

            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='badge'].spectrum-gray-300-plans),
            :host([variant='mini-compare-chart-mweb'])
                #badge.spectrum-gray-300-plans {
                background-color: #dadada;
                color: #2c2c2c;
            }

            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='badge'].spectrum-gray-700-plans),
            :host([variant='mini-compare-chart-mweb'])
                #badge.spectrum-gray-700-plans {
                background-color: #4b4b4b;
                color: #ffffff;
            }

            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='badge'].spectrum-green-900-plans),
            :host([variant='mini-compare-chart-mweb'])
                #badge.spectrum-green-900-plans {
                background-color: #05834e;
                color: #ffffff;
            }

            :host([variant='mini-compare-chart-mweb'])
                ::slotted([slot='badge'].spectrum-red-700-plans),
            :host([variant='mini-compare-chart-mweb'])
                #badge.spectrum-red-700-plans {
                background-color: #eb1000;
                color: #ffffff;
            }

            :host([variant='mini-compare-chart-mweb'])
                ::slotted(h3[slot='heading-xs']) {
                max-width: var(
                    --consonant-merch-card-heading-xs-max-width,
                    100%
                );
            }

            :host([variant='mini-compare-chart-mweb']) .footer-rows-container {
                background-color: #f8f8f8;
                border-radius: 0 0 var(--consonant-merch-spacing-xxs)
                    var(--consonant-merch-spacing-xxs);
            }

            :host([variant='mini-compare-chart-mweb']) .action-area {
                display: flex;
                justify-content: start;
                align-items: flex-end;
                flex-wrap: wrap;
                width: 100%;
                gap: var(--consonant-merch-spacing-xxs);
                margin: unset;
            }
        `;
    }
    return {
        'mini-compare-chart-mweb': {
            class: MiniCompareChartMweb,
            fragmentMapping: MINI_COMPARE_CHART_MWEB_AEM_FRAGMENT_MAPPING,
            style: MiniCompareChartMweb.templateStyle,
        },
    };
}
