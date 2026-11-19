import { VariantLayout } from './variant-layout';
import { html, on, nothing } from '../base-element.js';
import { CSS, SHADOW_CSS } from './plans-v2.css.js';
import Media from '../media.js';
import {
    EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
} from '../constants.js';

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

export class PlansV2 extends VariantLayout {
    constructor(card) {
        super(card);
        this.adaptForMedia = this.adaptForMedia.bind(this);
        this.toggleShortDescription = this.toggleShortDescription.bind(this);
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
        this.adjustSlotPlacement('addon', ['super-wide'], Media.isDesktopOrUp);
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
                getElement: (card) => card.shadowRoot?.querySelector('.body'),
            },
            {
                name: 'footer',
                getElement: (card) => card.shadowRoot?.querySelector('footer'),
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
            ? html`<label id="stock-checkbox">
                <input type="checkbox"></input>
                <span></span>
                ${this.card.checkboxLabel}
            </label>`
            : nothing;
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
        this.card.requestUpdate();
    }

    get shortDescriptionToggle() {
        if (!this.hasShortDescription) return nothing;

        // Show desktop version (no toggle) for tablet and up
        if (!Media.isMobile) {
            return html`
                <div class="short-description-content desktop">
                    <slot name="short-description"></slot>
                </div>
            `;
        }

        // Show toggle version only on mobile
        return html`
            <div class="short-description-divider"></div>
            <div
                class="short-description-toggle ${this.shortDescriptionExpanded
                    ? 'expanded'
                    : ''}"
            >
                <span class="toggle-label">${this.shortDescriptionLabel}</span>
                <span
                    class="toggle-icon ${this.shortDescriptionExpanded
                        ? 'expanded'
                        : ''}"
                ></span>
            </div>
            <div
                class="short-description-content ${this.shortDescriptionExpanded
                    ? 'expanded'
                    : ''}"
            >
                <slot name="short-description"></slot>
            </div>
        `;
    }

    get icons() {
        return this.card.querySelector('[slot="icons"]') ||
            this.card.getAttribute('id')
            ? html`<slot name="icons"></slot>`
            : nothing;
    }

    get secureLabelFooter() {
        return html`<footer>
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

        Media.matchMobile.addEventListener('change', this.handleMediaChange);
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
        Media.matchMobile.removeEventListener('change', this.handleMediaChange);
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

    bindEvents(root) {
        on(root.querySelector('#stock-checkbox input'), 'change', (event) =>
            this.card.toggleStockOffer(event),
        );
        on(
            root.querySelector('.short-description-toggle'),
            'click',
            this.toggleShortDescription,
        );
    }

    renderLayout() {
        const size = this.card.getAttribute('size');
        const isWide = size === 'wide';

        return html` ${this.badge}
            <div class="body">
                ${isWide
                    ? html`
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
                    : html`
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
                      `}
            </div>
            ${this.secureLabelFooter} ${this.shortDescriptionToggle}
            <slot></slot>`;
    }

    static variantStyle = SHADOW_CSS;

    static collectionOptions = {
        // A node, which the Lit and the BaseElement collection headers both render.
        customHeaderArea: (collection) => {
            if (!collection.sidenav) return nothing;
            const slot = document.createElement('slot');
            slot.name = 'resultsText';
            return slot;
        },
        headerVisibility: {
            search: false,
            sort: false,
            result: ['mobile', 'tablet'],
            custom: ['desktop'],
        },
        onSidenavAttached: (collection) => {
            const minifyOverflowingWideCards = () => {
                const merchCards = collection.querySelectorAll('merch-card');
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
