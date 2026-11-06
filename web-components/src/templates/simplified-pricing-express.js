import { css } from '../css.js';

const CSS = css`
    :root {
        --merch-card-simplified-pricing-express-width: 311px;
    }

    merch-card[variant='simplified-pricing-express'] merch-badge {
        white-space: nowrap;
        color: var(--spectrum-white);
        font-size: var(--consonant-merch-card-detail-m-font-size);
        line-height: var(--consonant-merch-card-detail-m-line-height);
    }

    /* Grid layout for simplified-pricing-express cards */
    merch-card-collection.simplified-pricing-express {
        display: grid;
        justify-content: center;
        justify-items: center;
        align-items: stretch;
        gap: 16px;
        /* Default to 1 column on mobile */
        grid-template-columns: 1fr;
    }

    /* Also support direct merch-card children and wrapped in p tags */
    merch-card-collection.simplified-pricing-express p {
        margin: 0;
        font-size: inherit;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='body-xs']
        p:has(mas-mnemonic) {
        padding-top: 16px;
    }

    @supports not selector(:has(*)) {
        merch-card[variant='simplified-pricing-express']
            [slot='body-xs']
            p:last-child {
            padding-top: 16px;
        }
    }

    merch-card[variant='simplified-pricing-express']
        [slot='body-xs']
        p:nth-child(2) {
        padding-top: 16px;
    }

    /* Desktop - 3 columns */
    @media screen and (--desktop-up) {
        merch-card-collection.simplified-pricing-express {
            grid-template-columns: repeat(3, 1fr);
            max-width: calc(
                3 * var(--merch-card-simplified-pricing-express-width) + 32px
            );
            margin: 0 auto;
        }

        merch-card[variant='simplified-pricing-express'] [slot='body-xs'] {
            display: flex;
            flex-direction: column;
            min-height: var(
                --consonant-merch-card-simplified-pricing-express-description-height
            );
        }

        /* Push paragraph with mnemonics to the bottom using :has() */
        merch-card[variant='simplified-pricing-express']
            [slot='body-xs']
            p:has(mas-mnemonic) {
            margin-top: auto;
            min-height: var(
                --consonant-merch-card-simplified-pricing-express-icons-height
            );
        }

        /* Fallback for browsers without :has() support - target last paragraph */
        @supports not selector(:has(*)) {
            merch-card[variant='simplified-pricing-express']
                [slot='body-xs']
                p:last-child {
                margin-top: auto;
            }
        }

        /* Additional fallback - if second paragraph exists, assume it has mnemonics */
        merch-card[variant='simplified-pricing-express']
            [slot='body-xs']
            p:nth-child(2) {
            margin-top: auto;
        }
    }

    merch-card[variant='simplified-pricing-express'] p {
        margin: 0 !important; /* needed to override express-milo default margin to all <p> */
        font-size: inherit;
    }

    merch-card[variant='simplified-pricing-express'] [slot='heading-xs'] {
        font-size: 18px;
        font-weight: 700;
        line-height: 23.4px;
        color: var(--spectrum-gray-800);
    }

    merch-card[variant='simplified-pricing-express'] [slot='body-xs'] {
        font-size: var(
            --merch-card-simplified-pricing-express-body-xs-font-size,
            14px
        );
        line-height: var(
            --merch-card-simplified-pricing-express-body-xs-line-height,
            18.2px
        );
        color: var(--spectrum-gray-700);
        margin-bottom: 24px;
        justify-content: space-between;
    }

    merch-card[variant='simplified-pricing-express'] [slot='cta'] {
        display: block;
        width: 100%;
    }

    merch-card[variant='simplified-pricing-express'] [slot='cta'] sp-button,
    merch-card[variant='simplified-pricing-express'] [slot='cta'] button,
    merch-card[variant='simplified-pricing-express'] [slot='cta'] a.con-button {
        display: block;
        width: 100%;
        box-sizing: border-box;
        font-weight: var(
            --merch-card-simplified-pricing-express-cta-font-weight
        );
        line-height: var(
            --merch-card-simplified-pricing-express-cta-line-height
        );
        font-size: var(--merch-card-simplified-pricing-express-cta-font-size);
        margin: 0;
        border-radius: 26px;
        padding: 10px 24px;
        min-height: 48px;
    }

    merch-card[variant='simplified-pricing-express'] [slot='price'] {
        display: flex;
        flex-direction: column;
    }

    merch-card[variant='simplified-pricing-express']
        [data-template='price']
        .price-strikethrough
        span.price-recurrence,
    merch-card[variant='simplified-pricing-express']
        [data-template='strikethrough']:has(+ [data-template='price'])
        span.price-recurrence {
        display: none;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:first-child
        span[is='inline-price']:first-child {
        margin-inline-end: 8px;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:first-child {
        display: flex;
        align-items: baseline;
        margin: 0;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='price']
        span[is='inline-price']
        .price-recurrence {
        font-size: 12px;
        font-weight: 700;
        line-height: 15.6px;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='price']
        span[is='inline-price'] {
        font-size: var(
            --merch-card-simplified-pricing-express-price-p-font-size
        );
        line-height: var(
            --merch-card-simplified-pricing-express-price-p-line-height
        );
        font-weight: bold;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='price']
        span[is='inline-price'][data-template='optical'] {
        font-size: var(--merch-card-simplified-pricing-express-price-font-size);
        color: var(--spectrum-gray-800);
    }

    merch-card[variant='simplified-pricing-express'] [slot='price'] p {
        font-size: var(
            --merch-card-simplified-pricing-express-price-p-font-size
        );
        font-weight: var(
            --merch-card-simplified-pricing-express-price-p-font-weight
        );
        line-height: var(
            --merch-card-simplified-pricing-express-price-p-line-height
        );
    }

    merch-card[variant='simplified-pricing-express'] [slot='price'] p:empty {
        min-height: var(
            --merch-card-simplified-pricing-express-price-p-line-height
        );
    }

    /* Callout content styling */
    merch-card[variant='simplified-pricing-express'] [slot='callout-content'] {
        color: var(--spectrum-gray-800);
        width: 100%;
        gap: 0;
        margin-bottom: var(--merch-card-simplified-pricing-express-padding);
        margin-top: 0;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='callout-content']
        span[is='inline-price'] {
        font-weight: inherit;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='callout-content']
        > p {
        background: transparent;
        font-size: 12px;
        font-weight: 400;
        line-height: 18px;
        padding: 0;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='callout-content']
        > p:empty,
    merch-card[variant='simplified-pricing-express'] [slot='price'] > p:empty {
        display: contents;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='callout-content']
        a {
        color: var(--spectrum-indigo-900);
        font-weight: 700;
        text-decoration: inherit;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:first-child
        .price-currency-symbol {
        font-size: var(--merch-card-simplified-pricing-express-price-font-size);
        font-weight: var(
            --merch-card-simplified-pricing-express-price-font-weight
        );
        line-height: var(
            --merch-card-simplified-pricing-express-price-line-height
        );
        width: 100%;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='price']
        .price-currency-symbol {
        font-size: var(
            --merch-card-simplified-pricing-express-price-p-font-size
        );
        font-weight: var(
            --merch-card-simplified-pricing-express-price-p-font-weight
        );
        line-height: var(
            --merch-card-simplified-pricing-express-price-p-line-height
        );
    }

    merch-card[variant='simplified-pricing-express']
        [slot='price']
        span[is='inline-price']
        .price-unit-type {
        font-size: var(
            --merch-card-simplified-pricing-express-price-recurrence-font-size
        );
        font-weight: var(
            --merch-card-simplified-pricing-express-price-recurrence-font-weight
        );
        line-height: var(
            --merch-card-simplified-pricing-express-price-recurrence-line-height
        );
    }

    /* Strikethrough price styling */
    merch-card[variant='simplified-pricing-express']
        span[is='inline-price'][data-template='strikethrough']
        .price,
    merch-card[variant='simplified-pricing-express']
        span[is='inline-price'][data-template='strikethrough']
        .price-strikethrough,
    merch-card[variant='simplified-pricing-express']
        span.placeholder-resolved[data-template='strikethrough'],
    merch-card[variant='simplified-pricing-express']
        span[is='inline-price'][data-template='price']
        .price-strikethrough {
        text-decoration: none;
        font-size: var(
            --merch-card-simplified-pricing-express-price-p-font-size
        );
        line-height: var(
            --merch-card-simplified-pricing-express-price-p-line-height
        );
    }

    merch-card[variant='simplified-pricing-express']
        span[is='inline-price'][data-template='strikethrough']
        .price,
    merch-card[variant='simplified-pricing-express']
        span[is='inline-price'][data-template='price']
        .price-strikethrough,
    merch-card[variant='simplified-pricing-express']
        span[is='inline-price'][data-template='legal'] {
        color: var(--spectrum-gray-500);
    }

    merch-card[variant='simplified-pricing-express'] [slot='price'] p a {
        color: var(--spectrum-indigo-900);
        font-weight: 500;
        text-decoration: underline;
        white-space: nowrap;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:first-child
        span[is='inline-price']
        .price-integer,
    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:first-child
        span[is='inline-price']
        .price-decimals-delimiter,
    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:first-child
        span[is='inline-price']
        .price-decimals {
        font-size: 22px;
        font-weight: 700;
        line-height: 28.6px;
        text-decoration-thickness: 2px;
    }

    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:first-child
        span[is='inline-price'][data-template='strikethrough']
        .price-integer,
    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:first-child
        span[is='inline-price'][data-template='strikethrough']
        .price-decimals-delimiter,
    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:first-child
        span[is='inline-price'][data-template='strikethrough']
        .price-decimals,
    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:first-child
        span[is='inline-price'][data-template='price']
        .price-strikethrough
        .price-integer,
    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:first-child
        span[is='inline-price'][data-template='price']
        .price-strikethrough
        .price-decimals-delimiter,
    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:first-child
        span[is='inline-price'][data-template='price']
        .price-strikethrough
        .price-decimals {
        text-decoration: line-through;
    }

    /* Ensure non-first paragraph prices have normal font weight */
    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:not(:first-child)
        span[is='inline-price']
        .price-integer,
    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:not(:first-child)
        span[is='inline-price']
        .price-decimals-delimiter,
    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:not(:first-child)
        span[is='inline-price']
        .price-decimals,
    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:not(:first-child)
        span[is='inline-price']
        .price-recurrence,
    merch-card[variant='simplified-pricing-express']
        [slot='price']
        > p:not(:first-child)
        span[is='inline-price']
        .price-unit-type {
        font-size: var(
            --merch-card-simplified-pricing-express-price-p-font-size
        );
        font-weight: var(
            --merch-card-simplified-pricing-express-price-p-font-weight
        );
        line-height: var(
            --merch-card-simplified-pricing-express-price-p-line-height
        );
    }

    /* Hide screen reader only text */
    merch-card[variant='simplified-pricing-express'] sr-only {
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

    /* mas-mnemonic inline styles for simplified-pricing-express */
    merch-card[variant='simplified-pricing-express'] mas-mnemonic {
        display: inline-block;
        align-items: center;
        vertical-align: baseline;
        margin-inline-end: 8px;
        overflow: visible;
        padding-top: 0;
        --mas-mnemonic-tooltip-padding: 4px 8px;
    }

    /* Fix leftmost tooltip cutoff on mobile */
    @media screen and (--mobile-landscape) {
        merch-card[variant='simplified-pricing-express']
            [slot='body-xs']
            p:first-child
            mas-mnemonic:first-child {
            --tooltip-left-offset: 0;
        }
    }

    /* Tooltip containers - overflow handled by Shadow DOM */

    /* Mobile styles */
    @media screen and (--mobile-landscape) {
        .collection-container.simplified-pricing-express {
            grid-template-columns: 1fr;
            width: 100%;
        }

        merch-card-collection.simplified-pricing-express {
            gap: 8px;
            width: 100%;
            max-width: 100%;
        }

        merch-card[variant='simplified-pricing-express'] {
            width: 100%;
            max-width: none;
            margin: 0 auto;
        }

        /* Badge alignment on mobile */
        merch-card[variant='simplified-pricing-express'] [slot='badge'] {
            font-size: 16px;
        }

        /* Trial badge alignment on mobile */
        merch-card[variant='simplified-pricing-express'] [slot='trial-badge'] {
            margin-left: 0;
            align-self: flex-start;
        }

        merch-card[variant='simplified-pricing-express']
            [slot='trial-badge']
            merch-badge {
            font-size: 12px;
            line-height: 20.8px;
        }

        /* Fix spacing between cards on mobile */
        main
            merch-card-collection.simplified-pricing-express
            p:has(merch-card[variant='simplified-pricing-express']),
        main .section p:has(merch-card[variant='simplified-pricing-express']) {
            margin: 0;
        }
    }

    /* Collapse/expand styles for mobile only */
    @media screen and (--mobile-landscape) {
        /* Base transition for smooth animation */
        merch-card[variant='simplified-pricing-express'] {
            transition: max-height 0.5s ease-out;
        }

        merch-card[variant='simplified-pricing-express'] [slot='body-xs'],
        merch-card[variant='simplified-pricing-express'] [slot='price'],
        merch-card[variant='simplified-pricing-express']
            [slot='callout-content'],
        merch-card[variant='simplified-pricing-express'] [slot='cta'] {
            transition:
                opacity 0.5s ease-out,
                max-height 0.5s ease-out;
        }

        /* Collapsed state - hide content sections with animation */
        merch-card[variant='simplified-pricing-express']:not(
                [data-expanded='true']
            )
            [slot='body-xs'],
        merch-card[variant='simplified-pricing-express']:not(
                [data-expanded='true']
            )
            [slot='price'],
        merch-card[variant='simplified-pricing-express']:not(
                [data-expanded='true']
            )
            [slot='callout-content'],
        merch-card[variant='simplified-pricing-express']:not(
                [data-expanded='true']
            )
            [slot='cta'],
        merch-card[variant='simplified-pricing-express'][data-expanded='false']
            [slot='body-xs'],
        merch-card[variant='simplified-pricing-express'][data-expanded='false']
            [slot='price'],
        merch-card[variant='simplified-pricing-express'][data-expanded='false']
            [slot='callout-content'],
        merch-card[variant='simplified-pricing-express'][data-expanded='false']
            [slot='cta'] {
            opacity: 0;
            max-height: 0;
            margin: 0;
            padding: 0;
            overflow: hidden;
            pointer-events: none;
        }

        /* Expanded state - show content with animation */
        merch-card[variant='simplified-pricing-express'][data-expanded='true']
            [slot='body-xs'],
        merch-card[variant='simplified-pricing-express'][data-expanded='true']
            [slot='price'],
        merch-card[variant='simplified-pricing-express'][data-expanded='true']
            [slot='callout-content'],
        merch-card[variant='simplified-pricing-express'][data-expanded='true']
            [slot='cta'] {
            opacity: 1;
            pointer-events: auto;
        }

        /* Collapsed card should have fixed height and padding */
        merch-card[variant='simplified-pricing-express'][data-expanded='false'],
        merch-card[variant='simplified-pricing-express']:not(
                [data-expanded='true']
            ) {
            max-height: 57px;
            padding: 0;
            border-radius: 8px;
        }

        merch-card[variant='simplified-pricing-express'][gradient-border='true'][data-expanded='false'],
        merch-card[variant='simplified-pricing-express'][gradient-border='true']:not(
                [data-expanded='true']
            ) {
            max-height: 85px;
        }
    }

    /* Tablet styles - responsive full width with padding */
    @media screen and (--tablet-up) and (--tablet-down) {
        .collection-container.simplified-pricing-express {
            display: block;
            width: 100%;
            padding: 0 32px;
            box-sizing: border-box;
        }

        merch-card-collection.simplified-pricing-express {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
        }

        merch-card[variant='simplified-pricing-express'] {
            width: 100%;
            min-width: unset;
            max-width: 100%;
        }
    }

    merch-card[variant='simplified-pricing-express']
        [slot='cta']
        sp-button[variant='accent'],
    merch-card[variant='simplified-pricing-express']
        [slot='cta']
        button.spectrum-Button--accent,
    merch-card[variant='simplified-pricing-express']
        [slot='cta']
        a.spectrum-Button.spectrum-Button--accent {
        background-color: var(--spectrum-indigo-900);
        color: var(--spectrum-white, #ffffff);
        width: 100%;
    }

    /* Ensure text color is applied to the label span element for accessibility */
    merch-card[variant='simplified-pricing-express']
        [slot='cta']
        sp-button[variant='accent']
        .spectrum-Button-label,
    merch-card[variant='simplified-pricing-express']
        [slot='cta']
        button.spectrum-Button--accent
        .spectrum-Button-label,
    merch-card[variant='simplified-pricing-express']
        [slot='cta']
        a.spectrum-Button.spectrum-Button--accent
        .spectrum-Button-label {
        color: var(--spectrum-white, #ffffff);
    }

    /* Small font size button styles for desktop when button text is too long */
    @media screen and (--desktop-up) {
        merch-card[variant='simplified-pricing-express']
            [slot='cta']
            sp-button.small-font-size-button,
        merch-card[variant='simplified-pricing-express']
            [slot='cta']
            button.small-font-size-button,
        merch-card[variant='simplified-pricing-express']
            [slot='cta']
            a.con-button.small-font-size-button,
        merch-card[variant='simplified-pricing-express']
            [slot='cta']
            a.spectrum-Button.small-font-size-button,
        merch-card[variant='simplified-pricing-express']
            a[slot='cta'].small-font-size-button {
            font-size: var(
                --merch-card-simplified-pricing-express-body-xs-font-size,
                14px
            );
        }
    }
`;

export const SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING = {
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
        slot: 'body-xs',
        maxCount: 2000,
        withSuffix: false,
    },
    prices: {
        tag: 'div',
        slot: 'price',
    },
    callout: {
        tag: 'div',
        slot: 'callout-content',
        editorLabel: 'Price description',
    },
    ctas: {
        slot: 'cta',
        size: 'XL',
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
    disabledAttributes: [
        'badgeColor',
        'badgeBorderColor',
        'trialBadgeColor',
        'trialBadgeBorderColor',
    ],
    supportsDefaultChild: true,
};

export function define({ MOBILE_LANDSCAPE, Media, TemplateLayout, isDesktop }) {
    class SimplifiedPricingExpress extends TemplateLayout {
        getGlobalCSS() {
            return CSS;
        }

        get aemFragmentMapping() {
            return SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING;
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

        syncHeights() {
            if (this.card.getBoundingClientRect().width === 0) {
                return;
            }

            const shadow = this.card.shadowRoot;
            if (!shadow) return;

            ['header', 'price-container', 'cta'].forEach((className) =>
                this.updateCardElementMinHeight(
                    shadow.querySelector(`.${className}`),
                    className,
                ),
            );

            const descriptionSlot = this.card.querySelector('[slot="body-xs"]');
            if (descriptionSlot) {
                this.updateCardElementMinHeight(descriptionSlot, 'description');
            }

            const iconRow = this.card.querySelector(
                '[slot="body-xs"] p:has(mas-mnemonic)',
            );
            if (iconRow) {
                this.updateCardElementMinHeight(iconRow, 'icons');
            }
        }

        async postCardUpdateHook() {
            if (!this.card.isConnected) return;
            await super.postCardUpdateHook();

            const container = this.getContainer();
            if (!container) return;
            const cards = container.querySelectorAll(
                `merch-card[variant="${this.card.variant}"]`,
            );

            /* Set small font size button class if button text is too long */
            const CTA_LONG_TEXT_CHAR_THRESHOLD = 34;
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

            if (Media.isDesktopOrUp) {
                cards.forEach((card) => card.templateLayout?.syncHeights?.());
            }
        }

        connectedCallbackHook() {
            if (!this.card || this.card.failed) {
                return;
            }

            this.setupAccordion();
            if (this.card?.hasAttribute('data-default-card') && !isDesktop()) {
                this.card.setAttribute('data-expanded', 'true');
            }
            this.observeVisibility();
        }

        resyncSiblings() {
            const container = this.getContainer();
            if (!container) return;
            container
                .querySelectorAll(`merch-card[variant="${this.card.variant}"]`)
                .forEach((card) => card.templateLayout?.syncHeights?.());
        }

        observeVisibility() {
            if (typeof ResizeObserver === 'undefined') return;
            this.lastSyncedWidth = 0;
            this.sizeObserver = new ResizeObserver(() => {
                const width = this.card.getBoundingClientRect().width;
                if (width <= 2 || width === this.lastSyncedWidth) return;
                this.lastSyncedWidth = width;
                this.resyncSiblings();
            });
            this.sizeObserver.observe(this.card);
        }

        setupAccordion() {
            const merchCard = this.card;
            if (!merchCard) {
                return;
            }

            const updateExpandedState = () => {
                if (!isDesktop()) {
                    const isDefaultCard =
                        merchCard.hasAttribute('data-default-card');
                    merchCard.setAttribute(
                        'data-expanded',
                        isDefaultCard ? 'true' : 'false',
                    );
                } else {
                    merchCard.removeAttribute('data-expanded');
                }
            };

            updateExpandedState();

            const mediaQuery = window.matchMedia(MOBILE_LANDSCAPE);
            this.mediaQueryListener = () => {
                updateExpandedState();
            };
            mediaQuery.addEventListener('change', this.mediaQueryListener);
        }

        disconnectedCallbackHook() {
            if (this.mediaQueryListener) {
                const mediaQuery = window.matchMedia(MOBILE_LANDSCAPE);
                mediaQuery.removeEventListener(
                    'change',
                    this.mediaQueryListener,
                );
            }
            this.sizeObserver?.disconnect();
            this.sizeObserver = null;
        }

        handleChevronClick(e) {
            e.preventDefault();
            e.stopPropagation();
            this.toggleExpanded();
        }

        handleCardClick(e) {
            if (
                e.target.closest(
                    '.chevron-button, mas-mnemonic, button, a, [role="button"]',
                )
            ) {
                return;
            }
            e.preventDefault();
            this.toggleExpanded();
        }

        toggleExpanded() {
            const merchCard = this.card;
            if (!merchCard || isDesktop()) {
                return;
            }

            const currentExpanded = merchCard.getAttribute('data-expanded');
            const isExpanded = currentExpanded === 'true';
            const newExpanded = !isExpanded ? 'true' : 'false';

            merchCard.setAttribute('data-expanded', newExpanded);
        }

        bindEvents(root) {
            root.querySelector('.card-content')?.addEventListener(
                'click',
                (e) => this.handleCardClick(e),
            );
            root.querySelector('.chevron-button')?.addEventListener(
                'click',
                (e) => this.handleChevronClick(e),
            );
        }

        renderLayout() {
            return `
            ${this.badge}
            <div class="card-content">
                <div class="header">
                    <slot name="heading-xs"></slot>
                    <slot name="trial-badge"></slot>
                    <button class="chevron-button">
                        <svg
                            class="chevron-icon"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 15.5L5 8.5L6.4 7.1L12 12.7L17.6 7.1L19 8.5L12 15.5Z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                </div>
                <div class="description">
                    <slot name="body-xs"></slot>
                </div>
                <div class="price-container">
                    <slot name="price"></slot>
                    <slot name="callout-content"></slot>
                </div>
                <div class="cta">
                    <slot name="cta"></slot>
                </div>
            </div>
            <slot></slot>
        `;
        }

        static templateStyle = css`
            :host([variant='simplified-pricing-express']) {
                --merch-card-simplified-pricing-express-width: 365px;
                --merch-card-simplified-pricing-express-padding: 24px;
                --merch-card-simplified-pricing-express-padding-mobile: 16px;
                --merch-card-simplified-pricing-express-price-font-size: 22px;
                --merch-card-simplified-pricing-express-price-font-weight: 700;
                --merch-card-simplified-pricing-express-price-line-height: 28.6px;
                --merch-card-simplified-pricing-express-price-currency-font-size: 22px;
                --merch-card-simplified-pricing-express-price-currency-font-weight: 700;
                --merch-card-simplified-pricing-express-price-currency-line-height: 28.6px;
                --merch-card-simplified-pricing-express-price-currency-symbol-font-size: 22px;
                --merch-card-simplified-pricing-express-price-currency-symbol-font-weight: 700;
                --merch-card-simplified-pricing-express-price-currency-symbol-line-height: 28.6px;
                --merch-card-simplified-pricing-express-price-recurrence-font-size: 12px;
                --merch-card-simplified-pricing-express-price-recurrence-font-weight: 700;
                --merch-card-simplified-pricing-express-price-recurrence-line-height: 15.6px;
                --merch-card-simplified-pricing-express-body-xs-font-size: 14px;
                --merch-card-simplified-pricing-express-body-xs-line-height: 18.2px;
                --merch-card-simplified-pricing-express-price-p-font-size: 12px;
                --merch-card-simplified-pricing-express-price-p-font-weight: 400;
                --merch-card-simplified-pricing-express-price-p-line-height: 15.6px;
                --merch-card-simplified-pricing-express-cta-font-size: 18px;
                --merch-card-simplified-pricing-express-cta-font-weight: 700;
                --merch-card-simplified-pricing-express-cta-line-height: 23.4px;

                /* Gradient definitions */
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
                width: var(--merch-card-simplified-pricing-express-width);
                max-width: var(--merch-card-simplified-pricing-express-width);
                background: transparent;
                border: none;
                display: flex;
                flex-direction: column;
                overflow: visible;
                box-sizing: border-box;
                position: relative;
            }

            :host([variant='simplified-pricing-express']) .badge-wrapper {
                padding: 4px 24px;
                border-radius: 8px 8px 0 0;
                text-align: center;
                font-size: 12px;
                font-weight: 700;
                line-height: 15.6px;
                color: var(--spectrum-gray-800);
                position: relative;
                min-height: 23px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            :host([variant='simplified-pricing-express']) .card-content {
                border-radius: 8px;
                padding: var(--merch-card-simplified-pricing-express-padding);
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: var(--consonant-merch-spacing-xxs);
                position: relative;
            }

            :host([variant='simplified-pricing-express']) .card-content > * {
                position: relative;
            }

            :host(
                    [variant='simplified-pricing-express']:not(
                            [gradient-border='true']
                        )
                )
                .card-content {
                background: var(--spectrum-gray-50);
                border: 1px solid
                    var(
                        --consonant-merch-card-border-color,
                        var(--spectrum-gray-100)
                    );
            }

            :host(
                    [variant='simplified-pricing-express']:has(
                            [slot='badge']:not(:empty)
                        )
                )
                .card-content {
                border-top-left-radius: 0;
                border-top-right-radius: 0;
            }

            :host(
                    [variant='simplified-pricing-express']:not(
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

            :host(
                    [variant='simplified-pricing-express']:has(
                            [slot='badge']:not(:empty)
                        )
                )
                .badge-wrapper {
                margin-bottom: -2px;
            }

            :host(
                    [variant='simplified-pricing-express'][gradient-border='true']
                )
                .badge-wrapper {
                border: none;
                margin-bottom: -6px;
                padding-bottom: 10px;
            }

            :host(
                    [variant='simplified-pricing-express'][gradient-border='true']
                )
                .badge-wrapper
                ::slotted(*) {
                color: white !important;
            }

            :host(
                    [variant='simplified-pricing-express'][gradient-border='true']
                )
                .card-content {
                border: 1px solid transparent;
                padding: calc(
                    var(--merch-card-simplified-pricing-express-padding) + 1px
                );
                border-radius: 8px;
                background-origin: border-box;
                background-clip: padding-box, border-box;
            }

            :host(
                    [variant='simplified-pricing-express'][border-color='gradient-purple-blue']
                )
                .badge-wrapper {
                background: var(--gradient-purple-blue);
            }
            :host(
                    [variant='simplified-pricing-express'][border-color='gradient-purple-blue']
                )
                .card-content {
                background-image: linear-gradient(
                        var(--spectrum-gray-50),
                        var(--spectrum-gray-50)
                    ),
                    var(--gradient-purple-blue);
            }

            :host(
                    [variant='simplified-pricing-express'][border-color='gradient-firefly-spectrum']
                )
                .badge-wrapper {
                background: var(--gradient-firefly-spectrum);
            }
            :host(
                    [variant='simplified-pricing-express'][border-color='gradient-firefly-spectrum']
                )
                .card-content {
                background-image: linear-gradient(
                        var(--spectrum-gray-50),
                        var(--spectrum-gray-50)
                    ),
                    var(--gradient-firefly-spectrum);
            }

            :host(
                    [variant='simplified-pricing-express'][gradient-border='true']:has(
                            [slot='badge']:not(:empty)
                        )
                )
                .card-content {
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }

            :host([variant='simplified-pricing-express']) .header {
                display: flex;
                flex-direction: row;
                align-items: flex-start;
                justify-content: space-between;
                gap: 8px;
            }

            :host([variant='simplified-pricing-express']) [slot='heading-xs'] {
                font-size: 18px;
                font-weight: 700;
                line-height: 23.4px;
                color: var(--spectrum-gray-800);
            }

            :host([variant='simplified-pricing-express']) .description {
                gap: 16px;
                display: flex;
                flex-direction: column;
            }

            :host([variant='simplified-pricing-express']) .price-container {
                display: flex;
                flex-direction: column;
                margin-top: auto;
            }

            :host([variant='simplified-pricing-express'])
                [slot='callout-content'] {
                font-size: 12px;
                font-weight: 400;
                font-style: normal;
                line-height: 18px;
                color: var(--spectrum-gray-800);
                background: transparent;
                margin-top: 2px;
            }

            /* Desktop only - Fixed heights for alignment */
            @media (min-width: 1200px) {
                :host([variant='simplified-pricing-express']) .card-content {
                    height: 100%;
                }

                :host([variant='simplified-pricing-express']) .header {
                    min-height: var(
                        --consonant-merch-card-simplified-pricing-express-header-height
                    );
                }

                :host([variant='simplified-pricing-express']) .description {
                    flex: 1;
                }

                :host([variant='simplified-pricing-express']) .price-container {
                    min-height: var(
                        --consonant-merch-card-simplified-pricing-express-price-container-height
                    );
                }

                :host([variant='simplified-pricing-express']) .cta {
                    flex-shrink: 0;
                    min-height: var(
                        --consonant-merch-card-simplified-pricing-express-cta-height
                    );
                }
            }

            :host([variant='simplified-pricing-express']) .cta,
            :host([variant='simplified-pricing-express']) .cta ::slotted(*) {
                width: 100%;
                display: block;
            }

            /* Mobile accordion styles */
            :host([variant='simplified-pricing-express']) .chevron-button {
                display: none;
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                transition: transform 0.5s ease;
            }

            :host([variant='simplified-pricing-express']) .chevron-icon {
                width: 24px;
                height: 24px;
                color: var(--spectrum-gray-800);
                transition: transform 0.5s ease;
            }

            /* Chevron rotation based on parent card's data-expanded attribute */
            :host-context(merch-card[data-expanded='false']) .chevron-icon {
                transform: rotate(0deg);
            }
            :host-context(merch-card[data-expanded='true']) .chevron-icon {
                transform: rotate(180deg);
            }

            /* Tablet styles - full width, no accordion */
            @media (min-width: 768px) and (max-width: 1199px) {
                :host([variant='simplified-pricing-express']) {
                    width: 100%;
                    max-width: 100%;
                }

                :host(
                        [variant='simplified-pricing-express'][gradient-border='true']
                    )
                    .card-content,
                :host(
                        [variant='simplified-pricing-express']:not(
                                [gradient-border='true']
                            )
                    )
                    .card-content {
                    padding: var(
                        --merch-card-simplified-pricing-express-padding-mobile
                    );
                }

                /* Hide badge-wrapper on tablet except for gradient borders */
                :host(
                        [variant='simplified-pricing-express']:not(
                                [gradient-border='true']
                            )
                    )
                    .badge-wrapper {
                    display: none;
                }
            }

            /* Mobile only styles - accordion behavior */
            @media (max-width: 767px) {
                :host([variant='simplified-pricing-express']) {
                    width: 100%;
                    max-width: 100%;
                    min-height: auto;
                    cursor: pointer;
                    transition: all 0.5s ease;
                }

                :host([variant='simplified-pricing-express']) .header {
                    position: relative;
                    justify-content: space-between;
                    gap: 8px;
                }

                :host([variant='simplified-pricing-express']) .chevron-button {
                    display: block;
                    flex-shrink: 0;
                    margin-left: auto;
                }

                :host(
                        [variant='simplified-pricing-express'][gradient-border='true']
                    )
                    .card-content,
                :host(
                        [variant='simplified-pricing-express']:not(
                                [gradient-border='true']
                            )
                    )
                    .card-content {
                    padding: calc(
                        var(
                                --merch-card-simplified-pricing-express-padding-mobile
                            ) +
                            2px
                    );
                    transition:
                        max-height 0.5s ease-out,
                        padding 0.5s ease-out;
                }

                /* Hide badge-wrapper on mobile except for gradient borders */
                :host(
                        [variant='simplified-pricing-express']:not(
                                [gradient-border='true']
                            )
                    )
                    .badge-wrapper {
                    display: none;
                }

                /* Non-gradient border collapsed state - limit card-content height */
                :host(
                        [variant='simplified-pricing-express']:not(
                                [gradient-border='true']
                            )[data-expanded='false']
                    )
                    .card-content {
                    max-height: 50px;
                    overflow: hidden;
                    transition:
                        max-height 0.5s ease-out,
                        padding 0.5s ease-out;
                }

                /* Gradient border collapsed state - limit badge-wrapper height */
                :host(
                        [variant='simplified-pricing-express'][gradient-border='true'][data-expanded='false']
                    )
                    .card-content {
                    max-height: 50px;
                    overflow: hidden;
                    padding: 16px 16px 35px 16px;
                    transition:
                        max-height 0.5s ease-out,
                        padding 0.5s ease-out;
                }

                /* Expanded state - explicit max-height for animation (CSS can't animate to 'auto') */
                :host(
                        [variant='simplified-pricing-express'][data-expanded='true']
                    )
                    .card-content {
                    max-height: 1000px;
                }
            }
        `;
    }
    return {
        'simplified-pricing-express': {
            class: SimplifiedPricingExpress,
            fragmentMapping: SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
            style: SimplifiedPricingExpress.templateStyle,
        },
    };
}
