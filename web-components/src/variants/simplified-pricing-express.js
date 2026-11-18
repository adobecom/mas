import { html, on } from '../base-element.js';
import { VariantLayout } from './variant-layout.js';
import { CSS, SHADOW_CSS } from './simplified-pricing-express.css.js';
import Media, { isDesktop, MOBILE_LANDSCAPE } from '../media.js';

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

export class SimplifiedPricingExpress extends VariantLayout {
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
        return html`<div
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
            cards.forEach((card) => card.variantLayout?.syncHeights?.());
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
            .forEach((card) => card.variantLayout?.syncHeights?.());
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
            mediaQuery.removeEventListener('change', this.mediaQueryListener);
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
        on(root.querySelector('.card-content'), 'click', (e) =>
            this.handleCardClick(e),
        );
        on(root.querySelector('.chevron-button'), 'click', (e) =>
            this.handleChevronClick(e),
        );
    }

    renderLayout() {
        return html`
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

    static variantStyle = SHADOW_CSS;
}
