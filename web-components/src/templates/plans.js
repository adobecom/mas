import { css } from '../css.js';

const CSS = css`
    :root {
        --consonant-merch-card-plans-width: 302px;
        --consonant-merch-card-plans-students-width: 302px;
        --consonant-merch-card-plans-icon-size: 40px;
    }

    merch-card[variant^='plans'] {
        --merch-card-plans-heading-xs-min-height: 23px;
        --consonant-merch-card-callout-icon-size: 18px;
        width: var(--consonant-merch-card-plans-width);
    }

    merch-card[variant^='plans'] merch-badge {
        max-width: calc(
            var(--consonant-merch-card-plans-width) *
                var(--merch-badge-card-size) - var(--merch-badge-with-offset) *
                40px - var(--merch-badge-offset) * 48px
        );
    }

    merch-card[variant='plans-students'] {
        width: var(--consonant-merch-card-plans-students-width);
    }

    merch-card[variant^='plans'][size='wide'],
    merch-card[variant^='plans'][size='super-wide'] {
        width: auto;
    }

    merch-card[variant^='plans'] [slot='icons'] {
        --img-width: 41.5px;
    }

    merch-card[variant='plans-education']
        [slot='body-xs']
        span.price:not(.price-legal) {
        display: inline-block;
        font-size: var(--consonant-merch-card-heading-xs-font-size);
        font-weight: 700;
    }

    merch-card[variant='plans'] [slot='subtitle'] {
        font-size: 14px;
        font-weight: 700;
        line-height: 18px;
    }

    merch-card[variant^='plans'] span.price-unit-type {
        display: block;
    }

    merch-card[variant^='plans'] .price-unit-type:not(.disabled)::before {
        content: '';
    }
    merch-card[variant^='plans'] [slot='callout-content'] span.price-unit-type,
    merch-card[variant^='plans'] [slot='addon'] span.price-unit-type,
    merch-card[variant^='plans']
        .price.price-strikethrough
        span.price-unit-type,
    merch-card[variant^='plans']
        .price.price-promo-strikethrough
        span.price-unit-type,
    merch-card[variant^='plans'] span.price-unit-type.disabled {
        display: inline;
    }

    merch-card[variant^='plans']
        [slot='heading-xs']
        span.price.price-strikethrough,
    merch-card[variant^='plans']
        [slot='heading-xs']
        span.price.price-promo-strikethrough,
    merch-card[variant^='plans']
        [slot='heading-m']
        span.price.price-strikethrough,
    merch-card[variant^='plans']
        [slot='heading-m']
        span.price.price-promo-strikethrough,
    merch-card[variant='plans-education']
        [slot='body-xs']
        span.price.price-strikethrough,
    merch-card[variant='plans-education']
        [slot='body-xs']
        span.price.price-promo-strikethrough {
        font-size: var(--consonant-merch-card-heading-xxxs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
        font-weight: 700;
    }

    merch-card[variant^='plans'] [slot='heading-m'] p {
        font-size: var(--consonant-merch-card-heading-xxxs-font-size);
        line-height: var(--consonant-merch-card-body-xs-line-height);
    }

    merch-card[variant^='plans']
        [slot='heading-m']
        span.price:not(.price-strikethrough):not(
            .price-promo-strikethrough
        ):not(.price-legal) {
        font-size: var(--consonant-merch-card-heading-m-font-size);
        line-height: var(--consonant-merch-card-heading-m-line-height);
    }

    merch-card[variant^='plans']
        [slot='heading-m']
        span[is='inline-price'][data-template='price'] {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: baseline;
    }

    merch-card[variant^='plans']
        [slot='heading-m']
        span[is='inline-price'][data-template='price']:has(
            .price-strikethrough,
            .price-promo-strikethrough
        ):not(:has(.price-annual)) {
        display: flex;
    }

    merch-card[variant^='plans']
        [slot='heading-m']
        span[is='inline-price'][data-template='price']:has(.price-annual) {
        display: inline;
    }

    merch-card[variant^='plans'] [slot='heading-xs'],
    merch-card[variant='plans-education'] span.heading-xs,
    merch-card[variant='plans-education']
        [slot='body-xs']
        span.price:not(.price-strikethrough):not(.price-promo-strikethrough) {
        min-height: var(
            --consonant-merch-card-plans-heading-xs-height,
            var(--merch-card-plans-heading-xs-min-height)
        );
    }

    merch-card[variant='plans-education'] [slot='body-xs'] p:has(.heading-xs) {
        margin-bottom: 16x;
    }

    merch-card[variant='plans-education']
        [slot='body-xs']
        p:has(span[is='inline-price']) {
        margin-bottom: 16px;
    }

    merch-card[variant^='plans'] span.text-l {
        display: block;
        font-size: 18px;
        line-height: 23px;
    }

    merch-card[variant='plans-education'] span.promo-text {
        margin-bottom: 8px;
    }

    merch-card[variant='plans-education']
        p:has(a[href^='tel:']):has(+ p, + div) {
        margin-bottom: 16px;
    }

    merch-card[variant^='plans'] [slot='promo-text'],
    merch-card[variant='plans-education'] span.promo-text {
        line-height: var(--consonant-merch-card-body-xs-line-height);
    }

    merch-card[variant='plans-education'] [slot='body-xs'] {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }

    merch-card[variant='plans-education'] .spacer {
        height: calc(
            var(--merch-card-plans-edu-list-max-offset) - var(
                    --merch-card-plans-edu-list-offset
                )
        );
    }

    merch-card[variant='plans-education'] ul + p {
        margin-top: 16px;
    }

    merch-card-collection.plans merch-card {
        width: auto;
        height: 100%;
    }

    merch-card-collection.plans
        merch-card[variant='plans']
        aem-fragment
        + [slot^='heading-'] {
        margin-top: calc(40px + var(--consonant-merch-spacing-xxs));
    }

    merch-card[variant^='plans'] span[data-template='legal'] {
        display: block;
        color: var(----merch-color-grey-80);
        font-size: 14px;
        font-style: italic;
        font-weight: 400;
        line-height: 21px;
    }

    html:has(mas-commerce-service[locale='ja_JP']) {
        merch-card[variant^='plans'] span[data-template='legal'] {
            display: inline;
        }
        merch-card[variant^='plans']
            [slot='heading-m']
            span[is='inline-price'][data-template='price'] {
            display: inline-flex;
        }
        merch-card[variant^='plans']
            [slot='heading-m']
            p:has(.price-alternative) {
            display: flex;
            flex-wrap: wrap;
            align-items: baseline;
            font-size: 0;
        }
        merch-card[variant^='plans']
            [slot='heading-m']
            p:has(.price-alternative)
            span[is='inline-price'][data-template='price'] {
            display: contents;
        }
        merch-card[variant^='plans']
            [slot='heading-m']
            p:has(.price-alternative)
            .price-strikethrough {
            flex-basis: 100%;
        }
    }

    merch-card[variant^='plans'] span.price-legal::first-letter {
        text-transform: uppercase;
    }

    merch-card[variant^='plans']
        span.price-legal
        .price-tax-inclusivity::before {
        content: initial;
    }

    merch-card[variant^='plans'] [slot='description'] {
        min-height: 84px;
    }

    merch-card[variant^='plans'] [slot='body-xs'] a {
        color: var(--link-color);
        display: inline-block;
        padding: 2px 0;
    }

    merch-card[variant^='plans'] [slot='promo-text'] a {
        color: inherit;
    }

    merch-card[variant^='plans'] [slot='callout-content'] {
        margin: 8px 0 0;
    }

    merch-card[variant^='plans'][size='super-wide'] [slot='callout-content'] {
        margin: 0;
    }

    merch-card[variant^='plans'] [slot='callout-content'] > div > div,
    merch-card[variant^='plans'] [slot='callout-content'] > p {
        position: relative;
        padding: 2px 10px 3px;
        background: #d9d9d9;
    }

    merch-card[variant^='plans']
        [slot='callout-content']
        > p:has(> .icon-button) {
        padding-inline-end: 36px;
    }

    merch-card[variant^='plans'] [slot='callout-content'] > p,
    merch-card[variant^='plans'] [slot='callout-content'] > div > div > div {
        color: #000;
    }

    merch-card[variant^='plans'] [slot='callout-content'] img {
        margin: 1.5px 0 1.5px 8px;
    }

    merch-card[variant^='plans'] [slot='whats-included'] [slot='description'] {
        min-height: auto;
    }

    merch-card[variant^='plans'] [slot='quantity-select'] {
        margin-top: auto;
        padding-top: 8px;
    }

    merch-card[variant^='plans']:has([slot='quantity-select']) merch-addon {
        margin: 0;
    }

    merch-card[variant^='plans'] merch-addon {
        --merch-addon-gap: 10px;
        --merch-addon-align: center;
        --merch-addon-checkbox-size: 12px;
        --merch-addon-checkbox-border: 2px solid rgb(109, 109, 109);
        --merch-addon-checkbox-radius: 2px;
        --merch-addon-checkbox-checked-bg: var(--checkmark-icon);
        --merch-addon-checkbox-checked-color: var(--color-accent);
        --merch-addon-label-size: 12px;
        --merch-addon-label-color: rgb(34, 34, 34);
        --merch-addon-label-line-height: normal;
    }

    merch-card[variant^='plans'] [slot='footer'] a {
        line-height: 19px;
        padding: 3px 16px 4px;
    }

    merch-card[variant^='plans'] [slot='footer'] .con-button > span {
        min-width: unset;
    }

    merch-card[variant^='plans'] merch-addon span[data-template='price'] {
        display: none;
    }

    merch-card[variant^='plans']:not([size]) {
        merch-whats-included merch-mnemonic-list,
        merch-whats-included [slot='heading'] {
            width: 100%;
        }

        merch-whats-included
            merch-mnemonic-list:not(
                :has([slot='description'] span:not(:empty))
            ) {
            width: auto;
            margin-right: unset;
        }
    }

    .tab-content-container.red-strikethrough-price
        merch-card[variant^='plans']
        [slot='heading-m']
        .price-strikethrough {
        color: #ff4136;
    }

    .collection-container.plans {
        --merch-card-collection-card-min-height: 273px;
        --merch-card-collection-card-width: var(
            --consonant-merch-card-plans-width
        );
    }

    merch-sidenav.plans {
        --merch-sidenav-padding: 16px 20px 16px 16px;
    }

    merch-card-collection-header.plans {
        --merch-card-collection-header-columns: 1fr fit-content(100%);
        --merch-card-collection-header-areas: 'result filter';
    }

    .one-merch-card.plans,
    .two-merch-cards.plans,
    .three-merch-cards.plans,
    .four-merch-cards.plans {
        --merch-card-collection-card-width: var(
            --consonant-merch-card-plans-width
        );
    }

    merch-card-collection:has([slot='subtitle']) merch-card {
        --merch-card-plans-subtitle-display: block;
    }

    .columns .text .foreground {
        margin: 0;
    }

    .columns.checkmark-list ul {
        margin: 0;
        padding-inline-start: 20px;
        list-style-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -3 18 18" height="18px"><path fill="currentcolor" d="M15.656,3.8625l-.7275-.5665a.5.5,0,0,0-.7.0875L7.411,12.1415,4.0875,8.8355a.5.5,0,0,0-.707,0L2.718,9.5a.5.5,0,0,0,0,.707l4.463,4.45a.5.5,0,0,0,.75-.0465L15.7435,4.564A.5.5,0,0,0,15.656,3.8625Z"></path></svg>');
    }

    .columns.checkmark-list ul li {
        padding-inline-start: 8px;
    }

    /* Tabs containers */

    #tabs-plan {
        --tabs-active-text-color: #131313;
        --tabs-border-color: #444444;
    }
    #tabs-plan .tab-list-container button[role='tab'][aria-selected='false'] {
        border-top-color: #eaeaea;
        border-right-color: #eaeaea;
    }

    #tabs-plan
        .tab-list-container
        button[role='tab'][aria-selected='false']:first-of-type {
        border-left-color: #eaeaea;
    }

    .plans-team {
        display: grid;
        grid-template-columns: min-content;
        justify-content: center;
    }

    .plans-team .columns .row-1 {
        grid-template-columns: repeat(
            2,
            calc(var(--consonant-merch-card-plans-width) * 2 + 32px)
        );
        justify-content: center;
    }

    .plans-team .col-2 {
        align-content: center;
    }

    .plans-team .col-2 h3 {
        font-size: 20px;
        margin: 0 0 16px;
    }

    .plans-highlight
        .columns
        :is(.col-1, .col-2)
        :is(h1, h2, h3, h4, h5):first-child {
        background: rgb(238, 238, 238);
        padding: var(--spacing-m);
        font-size: var(--type-heading-s-size);
        line-height: var(--type-heading-s-lh);
    }

    .plans-team .col-2 p {
        margin: 0 0 16px;
    }

    .plans-team .text .foreground,
    .plans-edu .text .foreground {
        max-width: unset;
        margin: 0;
    }

    .plans-edu .columns .row {
        grid-template-columns: repeat(
            auto-fit,
            var(--consonant-merch-card-plans-students-width)
        );
        justify-content: center;
        align-items: center;
    }

    .plans-edu .columns .row-1 {
        grid-template-columns: var(--consonant-merch-card-plans-students-width);
        margin-block: var(--spacing-xs);
    }

    .plans-edu .columns .row-2 {
        margin-bottom: 40px;
    }

    .plans-edu .columns .row-3 {
        margin-bottom: 48px;
    }

    .plans-edu .col-2 h3 {
        margin: 0 0 16px;
        font-size: 20px;
    }

    .plans-individual .content,
    .plans-team .content,
    .plans-edu-inst .content {
        padding-bottom: 48px;
    }

    /* Mobile */
    @media screen and (--mobile-landscape) {
        merch-whats-included merch-mnemonic-list,
        merch-whats-included [slot='heading'] {
            width: 100%;
        }

        merch-whats-included
            merch-mnemonic-list:not(
                :has([slot='description'] span:not(:empty))
            ) {
            width: auto;
            margin-right: unset;
        }

        merch-card[variant='plans-education'] .spacer {
            height: 0px;
        }

        merch-card[variant^='plans'] merch-badge {
            max-width: calc(
                var(--consonant-merch-card-plans-width) - var(
                        --merch-badge-with-offset
                    ) *
                    40px - var(--merch-badge-offset) * 48px
            );
        }
    }

    /* Tablet */
    @media screen and (--tablet-up) {
        :root {
            --consonant-merch-card-plans-students-width: 486px;
        }

        .four-merch-cards.plans .foreground {
            max-width: unset;
        }
    }

    @media screen and (--tablet-down) {
        .plans-team .columns .row-1 {
            grid-template-columns: min-content;
        }

        .plans-edu-inst {
            display: grid;
            grid-template-columns: min-content;
            justify-content: center;
        }

        .plans-edu-inst .text .foreground {
            max-width: unset;
            margin: 0;
        }
    }

    /* desktop */
    @media screen and (--desktop-up) {
        :root {
            --consonant-merch-card-plans-width: 276px;
            --consonant-merch-card-plans-students-width: 484px;
        }

        merch-sidenav.plans {
            --merch-sidenav-collection-gap: 30px;
        }

        .columns .four-merch-cards.plans {
            grid-template-columns: repeat(
                2,
                var(--consonant-merch-card-plans-width)
            );
        }

        merch-card-collection-header.plans {
            --merch-card-collection-header-columns: fit-content(100%);
            --merch-card-collection-header-areas: 'custom';
        }

        .collection-container.plans:has(merch-sidenav) {
            --translate-direction: -1;
            width: fit-content;
            position: relative;
            inset-inline-start: 50%;
            translate: calc(var(--translate-direction) * 50vw) 0;
            justify-content: start;
            padding-inline: 30px;
        }

        [dir='rtl'] .collection-container.plans:has(merch-sidenav) {
            --translate-direction: 1;
        }

        .plans-individual .content {
            padding-top: 24px;
        }

        .plans-edu .columns .row-1 {
            grid-template-columns: calc(
                var(--consonant-merch-card-plans-students-width) * 2 +
                    var(--spacing-m)
            );
        }

        .plans-edu-inst .text .foreground {
            max-width: 1200px;
            margin: auto;
        }
    }

    /* Large desktop */
    @media screen and (--large-desktop) {
        .columns .four-merch-cards.plans {
            grid-template-columns: repeat(
                2,
                var(--consonant-merch-card-plans-width)
            );
        }

        merch-sidenav.plans {
            --merch-sidenav-collection-gap: 54px;
        }
    }
`;

export const PLANS_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    title: { tag: 'h3', slot: 'heading-xs' },
    subtitle: { tag: 'p', slot: 'subtitle' },
    prices: { tag: 'p', slot: 'heading-m' },
    promoText: { tag: 'p', slot: 'promo-text' },
    description: { tag: 'div', slot: 'body-xs' },
    mnemonics: { size: 'l' },
    callout: { tag: 'div', slot: 'callout-content' },
    quantitySelect: { tag: 'div', slot: 'quantity-select' },
    addon: true,
    secureLabel: true,
    planType: true,
    badgeIcon: true,
    badge: { tag: 'div', slot: 'badge', default: 'spectrum-yellow-300-plans' },
    allowedBadgeColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-gray-700-plans',
        'spectrum-green-900-plans',
        'gradient-purple-blue',
    ],
    allowedBorderColors: [
        'spectrum-yellow-300-plans',
        'spectrum-gray-300-plans',
        'spectrum-green-900-plans',
        'gradient-purple-blue',
    ],
    borderColor: { attribute: 'border-color' },
    size: ['wide', 'super-wide'],
    whatsIncluded: { tag: 'div', slot: 'whats-included' },
    ctas: { slot: 'footer', size: 'm' },
    style: 'consonant',
    perUnitLabel: { tag: 'span', slot: 'per-unit-label' },
};

export const PLANS_EDUCATION_AEM_FRAGMENT_MAPPING = {
    ...(function () {
        const { whatsIncluded, size, ...rest } = PLANS_AEM_FRAGMENT_MAPPING;
        return rest;
    })(),
    title: { tag: 'h3', slot: 'heading-s' },
    secureLabel: false,
};

export const PLANS_STUDENTS_AEM_FRAGMENT_MAPPING = {
    ...(function () {
        const { subtitle, whatsIncluded, size, quantitySelect, ...rest } =
            PLANS_AEM_FRAGMENT_MAPPING;
        return rest;
    })(),
};

export function define({
    EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
    Media,
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
    TemplateLayout,
    escapeHTML,
    getOuterHeight,
}) {
    class Plans extends TemplateLayout {
        #syncObserver;
        #resizeFrame;

        constructor(card) {
            super(card);
            this.adaptForMedia = this.adaptForMedia.bind(this);
        }

        priceOptionsProvider(element, options) {
            if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
            options.displayPlanType =
                this.card?.settings?.displayPlanType ?? false;
        }

        getGlobalCSS() {
            return CSS;
        }

        /**
         * Moves a slot to its proper place (body or footer) depending on card size and screen size
         * @param {string} name
         * @param {string[]} sizes
         * @param {boolean} shouldBeInFooter
         * @returns
         */
        adjustSlotPlacement(name, sizes, shouldBeInFooter) {
            const shadowRoot = this.card.shadowRoot;
            const footer = shadowRoot.querySelector('footer');
            const size = this.card.getAttribute('size');
            if (!size) return;

            const slotInFooter = shadowRoot.querySelector(
                `footer slot[name="${name}"]`,
            );
            const slotInBody = shadowRoot.querySelector(
                `.body slot[name="${name}"]`,
            );
            const body = shadowRoot.querySelector('.body');

            if (!size.includes('wide')) {
                footer?.classList.remove('wide-footer');
                if (slotInFooter) slotInFooter.remove();
            }
            if (!sizes.includes(size)) return;

            footer?.classList.toggle('wide-footer', Media.isDesktopOrUp);
            if (!shouldBeInFooter && slotInFooter) {
                if (slotInBody) slotInFooter.remove();
                else {
                    const bodyPlaceholder = body.querySelector(
                        `[data-placeholder-for="${name}"]`,
                    );
                    if (bodyPlaceholder)
                        bodyPlaceholder.replaceWith(slotInFooter);
                    else body.appendChild(slotInFooter);
                }
                return;
            }
            if (shouldBeInFooter && slotInBody) {
                const bodyPlaceholder = document.createElement('div');
                bodyPlaceholder.setAttribute('data-placeholder-for', name);
                bodyPlaceholder.classList.add('slot-placeholder');
                if (!slotInFooter) {
                    const slotInBodyClone = slotInBody.cloneNode(true);
                    footer.prepend(slotInBodyClone);
                }
                slotInBody.replaceWith(bodyPlaceholder);
            }
        }

        adaptForMedia() {
            if (
                !this.card.closest(
                    'merch-card-collection,overlay-trigger,.two-merch-cards,.three-merch-cards,.four-merch-cards, .columns',
                )
            ) {
                this.card.removeAttribute('size');
                return;
            }

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
            if (tooltipIcon && tooltipIcon.title) {
                tooltipIcon.dataset.tooltip = tooltipIcon.title;
                tooltipIcon.removeAttribute('title');
                tooltipIcon.classList.add('hide-tooltip');
                document.addEventListener('touchstart', (event) => {
                    event.preventDefault();
                    if (event.target !== tooltipIcon) {
                        tooltipIcon.classList.add('hide-tooltip');
                    } else {
                        event.target.classList.toggle('hide-tooltip');
                    }
                });
                document.addEventListener('mouseover', (event) => {
                    event.preventDefault();
                    if (event.target !== tooltipIcon) {
                        tooltipIcon.classList.add('hide-tooltip');
                    } else {
                        event.target.classList.remove('hide-tooltip');
                    }
                });
            }
        }

        syncHeights() {
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
                'heading-m',
                'promo-text',
                'body-xs',
            ];
            this.syncRowHeights(
                slots.map((slot) => ({
                    name: slot,
                    getElement: (card) =>
                        card.querySelector(`[slot="${slot}"]`),
                })),
            );
        }

        async adjustEduLists() {
            if (this.card.variant !== 'plans-education') return;
            const existingSpacer = this.card.querySelector('.spacer');
            if (existingSpacer) return;

            const body = this.card.querySelector('[slot="body-xs"]');
            if (!body) return;
            const list = body.querySelector('ul');
            if (!list) return;

            /* Add spacer */
            const listHeader = list.previousElementSibling;
            const spacer = document.createElement('div');
            spacer.classList.add('spacer');
            body.insertBefore(spacer, listHeader);

            const intersectionObs = new IntersectionObserver(([entry]) => {
                if (entry.boundingClientRect.height === 0) return;
                let offset = 0;
                const heading = this.card.querySelector('[slot="heading-s"]');
                if (heading) offset += getOuterHeight(heading);
                const subtitle = this.card.querySelector('[slot="subtitle"]');
                if (subtitle) offset += getOuterHeight(subtitle);
                const price = this.card.querySelector('[slot="heading-m"]');
                /* If price is slotted, also add 8 pixels for the gap */
                if (price) offset += 8 + getOuterHeight(price);
                for (const child of body.childNodes) {
                    if (child.classList.contains('spacer')) break;
                    offset += getOuterHeight(child);
                }

                const maxOffset =
                    this.card.parentElement.style.getPropertyValue(
                        '--merch-card-plans-edu-list-max-offset',
                    );
                if (offset > (parseFloat(maxOffset) || 0)) {
                    this.card.parentElement.style.setProperty(
                        '--merch-card-plans-edu-list-max-offset',
                        `${offset}px`,
                    );
                }
                this.card.style.setProperty(
                    '--merch-card-plans-edu-list-offset',
                    `${offset}px`,
                );
                intersectionObs.disconnect();
            });

            intersectionObs.observe(this.card);
        }

        async postCardUpdateHook() {
            this.adaptForMedia();
            this.adjustAddon();
            this.adjustCallout();
            if (!this.legalAdjusted) {
                await this.adjustLegal();
                await this.adjustEduLists();
            }
            await super.postCardUpdateHook();
            if (window.matchMedia('(min-width: 768px)').matches) {
                if (this.card === this.card.parentElement?.firstElementChild) {
                    requestAnimationFrame(() => {
                        this.syncHeights();
                    });
                }
            }
        }

        get headingM() {
            return this.card.querySelector('[slot="heading-m"]');
        }

        get mainPrice() {
            const price = this.headingM?.querySelector(
                `${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
            );
            return price;
        }

        get divider() {
            return this.card.variant === 'plans-education'
                ? `<div class="divider"></div>`
                : '';
        }

        async adjustLegal() {
            if (this.legalAdjusted) return;
            try {
                this.legalAdjusted = true;
                await this.card.updateComplete;
                await customElements.whenDefined('inline-price');
                const prices = [];
                const headingPrice = this.card.querySelector(
                    `[slot="heading-m"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
                );
                if (headingPrice) prices.push(headingPrice);
                const legalPromises = prices.map(async (price) => {
                    const legal = price.cloneNode(true);
                    await price.onceSettled();
                    if (!price?.options) return;
                    if (price.options.displayPerUnit)
                        price.dataset.displayPerUnit = 'false';
                    if (price.options.displayTax)
                        price.dataset.displayTax = 'false';
                    if (price.options.displayPlanType)
                        price.dataset.displayPlanType = 'false';
                    legal.setAttribute('data-template', 'legal');
                    price.parentNode.insertBefore(legal, price.nextSibling);
                    await legal.onceSettled();
                });
                await Promise.all(legalPromises);
            } catch {
                /* Proceed with adjusting edu lists */
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
            if (!planType) return;
            addon.planType = planType;
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

        get icons() {
            if (
                !this.card.querySelector('[slot="icons"]') &&
                !this.card.getAttribute('id')
            )
                return '';
            return `<slot name="icons"></slot>`;
        }

        bindEvents(root) {
            root.querySelector('#stock-checkbox > input')?.addEventListener(
                'change',
                (event) => this.card.toggleStockOffer(event),
            );
        }

        resizeHandler() {
            if (this.#resizeFrame) cancelAnimationFrame(this.#resizeFrame);
            this.#resizeFrame = requestAnimationFrame(() => {
                this.#resizeFrame = null;
                if (window.matchMedia('(min-width: 768px)').matches) {
                    this.syncHeights();
                }
            });
        }

        connectedCallbackHook() {
            Media.matchMobile.addEventListener('change', this.adaptForMedia);
            Media.matchDesktopOrUp.addEventListener(
                'change',
                this.adaptForMedia,
            );
        }

        disconnectedCallbackHook() {
            Media.matchMobile.removeEventListener('change', this.adaptForMedia);
            Media.matchDesktopOrUp.removeEventListener(
                'change',
                this.adaptForMedia,
            );
            this.#syncObserver?.disconnect();
            this.#syncObserver = null;
            if (this.#resizeFrame) {
                cancelAnimationFrame(this.#resizeFrame);
                this.#resizeFrame = null;
            }
        }

        renderLayout() {
            return ` ${this.badge}
            <div class="body">
                ${this.icons}
                <slot name="heading-xs"></slot>
                <slot name="heading-s"></slot>
                <slot name="subtitle"></slot>
                ${this.divider}
                <slot name="heading-m"></slot>
                <slot name="annualPrice"></slot>
                <slot name="priceLabel"></slot>
                <slot name="body-xxs"></slot>
                <slot name="promo-text"></slot>
                <slot name="body-xs"></slot>
                <slot name="whats-included"></slot>
                <slot name="callout-content"></slot>
                <slot name="quantity-select"></slot>
                ${this.stockCheckbox}
                <slot name="addon"></slot>
                <slot name="badge"></slot>
            </div>
            ${this.secureLabelFooter}
            <slot></slot>`;
        }

        static templateStyle = css`
            :host([variant^='plans']) {
                min-height: 273px;
                --merch-card-plans-min-width: 244px;
                --merch-card-plans-padding: 15px;
                --merch-card-plans-subtitle-display: contents;
                --merch-card-plans-heading-min-height: 23px;
                --merch-color-green-promo: #05834e;
                --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23505050' viewBox='0 0 12 15'%3E%3Cpath d='M11.5 6H11V5A5 5 0 1 0 1 5v1H.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5ZM3 5a3 3 0 1 1 6 0v1H3Zm4 6.111V12.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1.389a1.5 1.5 0 1 1 2 0Z'/%3E%3C/svg%3E");
                font-weight: 400;
                background:
                    linear-gradient(white, white) padding-box,
                    var(--consonant-merch-card-border-color, #dadada) border-box;
                border: 1px solid transparent;
            }

            :host([variant^='plans']) .slot-placeholder {
                display: none;
            }

            :host([variant='plans-education']) {
                min-height: unset;
            }

            :host([variant='plans-education']) ::slotted(h3[slot='heading-s']) {
                max-width: var(
                    --consonant-merch-card-heading-xs-max-width,
                    100%
                );
            }

            :host([variant='plans-education']) ::slotted([slot='subtitle']) {
                font-size: var(--consonant-merch-card-heading-xxxs-font-size);
                line-height: var(
                    --consonant-merch-card-heading-xxxs-line-height
                );
                font-style: italic;
                font-weight: 400;
            }

            :host([variant='plans-education']) .divider {
                border: 0;
                border-top: 1px solid #e8e8e8;
                margin-top: 8px;
                margin-bottom: 8px;
            }

            :host([variant='plans']) slot[name='subtitle'] {
                display: var(--merch-card-plans-subtitle-display);
                min-height: 18px;
                margin-top: 8px;
                margin-bottom: -8px;
            }

            :host([variant='plans']) ::slotted([slot='heading-xs']) {
                min-height: var(--merch-card-plans-heading-min-height);
            }

            :host([variant^='plans']) .body {
                min-width: var(--merch-card-plans-min-width);
                padding: var(--merch-card-plans-padding);
            }

            :host([variant='plans'][size]) .body {
                max-width: none;
            }

            :host([variant^='plans']) ::slotted([slot='addon']) {
                margin-top: auto;
                padding-top: 8px;
            }

            :host([variant^='plans']) footer ::slotted([slot='addon']) {
                margin: 0;
                padding: 0;
            }

            :host([variant='plans']) .wide-footer #stock-checkbox {
                margin-top: 0;
            }

            :host([variant='plans']) #stock-checkbox {
                margin-top: 8px;
                gap: 9px;
                color: rgb(34, 34, 34);
                line-height: var(--consonant-merch-card-detail-xs-line-height);
                padding-top: 4px;
                padding-bottom: 5px;
            }

            :host([variant='plans']) #stock-checkbox > span {
                border: 2px solid rgb(109, 109, 109);
                width: 12px;
                height: 12px;
            }

            :host([variant^='plans']) footer {
                padding: var(--merch-card-plans-padding);
                padding-top: 1px;
            }

            :host([variant='plans']) .secure-transaction-label {
                color: rgb(80, 80, 80);
                line-height: var(--consonant-merch-card-detail-xs-line-height);
            }

            :host([variant='plans']) ::slotted([slot='heading-xs']) {
                max-width: var(
                    --consonant-merch-card-heading-xs-max-width,
                    100%
                );
            }

            :host([variant='plans']) #badge {
                border-radius: 4px 0 0 4px;
                font-weight: 400;
                line-height: 21px;
                padding: 2px 10px 3px;
            }
        `;

        static collectionOptions = {
            customHeaderArea: (collection) => {
                if (!collection.sidenav) return '';
                return `<slot name="resultsText"></slot>`;
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
                    for (const merchCard of merchCards) {
                        if (merchCard.hasAttribute('data-size')) {
                            merchCard.setAttribute(
                                'size',
                                merchCard.getAttribute('data-size'),
                            );
                            merchCard.removeAttribute('data-size');
                        }
                    }
                    if (!Media.isDesktop) return;
                    let columns = 0;
                    for (const merchCard of merchCards) {
                        if (merchCard.style.display === 'none') continue;
                        const size = merchCard.getAttribute('size');
                        let columnCount =
                            size === 'wide' ? 2 : size === 'super-wide' ? 3 : 1;
                        if (columnCount === 2 && columns % 3 === 2) {
                            merchCard.setAttribute('data-size', size);
                            merchCard.removeAttribute('size');
                            columnCount = 1;
                        }
                        columns += columnCount;
                    }
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
        plans: {
            class: Plans,
            fragmentMapping: PLANS_AEM_FRAGMENT_MAPPING,
            style: Plans.templateStyle,
            collectionOptions: Plans.collectionOptions,
        },
        'plans-students': {
            class: Plans,
            fragmentMapping: PLANS_STUDENTS_AEM_FRAGMENT_MAPPING,
            style: Plans.templateStyle,
            collectionOptions: Plans.collectionOptions,
        },
        'plans-education': {
            class: Plans,
            fragmentMapping: PLANS_EDUCATION_AEM_FRAGMENT_MAPPING,
            style: Plans.templateStyle,
            collectionOptions: Plans.collectionOptions,
        },
    };
}
