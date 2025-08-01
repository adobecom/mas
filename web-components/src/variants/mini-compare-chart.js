import { html, css, unsafeCSS } from 'lit';
import { isMobile, createTag } from '../utils.js';
import { VariantLayout } from './variant-layout.js';
import { CSS } from './mini-compare-chart.css.js';
import { DESKTOP_UP, TABLET_DOWN, MOBILE_LANDSCAPE } from '../media.js';
import { SELECTOR_MAS_INLINE_PRICE } from '../constants.js';
const FOOTER_ROW_MIN_HEIGHT = 32; // as per the XD.

export class MiniCompareChart extends VariantLayout {
    constructor(card) {
        super(card);
    }

    getRowMinHeightPropertyName = (index) =>
        `--consonant-merch-card-footer-row-${index}-min-height`;

    getGlobalCSS() {
        return CSS;
    }

    // For addon tiitle is it ok if we hardocde it in card settings?
    // For addon is it ok if we hardcode it as placeholder key?
    // How to add the price?

    getMiniCompareFooter = () => {
        const secureLabel = this.card.secureLabel
            ? html`<slot name="secure-transaction-label">
                  <span class="secure-transaction-label"
                      >${this.card.secureLabel}</span
                  ></slot
              >`
            : html`<slot name="secure-transaction-label"></slot>`;
        return html`<footer>${secureLabel}<slot name="footer"></slot></footer>`;
    };

    adjustMiniCompareBodySlots() {
        if (this.card.getBoundingClientRect().width <= 2) return;

        this.updateCardElementMinHeight(
            this.card.shadowRoot.querySelector('.top-section'),
            'top-section',
        );

        let slots = [
            'heading-m',
            'body-m',
            'heading-m-price',
            'body-xxs',
            'price-commitment',
            'offers',
            'promo-text',
            'callout-content',
            'addon',
        ];
        if (this.card.classList.contains('bullet-list')) {
            slots.push('footer-rows');
        }

        slots.forEach((slot) =>
            this.updateCardElementMinHeight(
                this.card.shadowRoot.querySelector(`slot[name="${slot}"]`),
                slot,
            ),
        );
        this.updateCardElementMinHeight(
            this.card.shadowRoot.querySelector('footer'),
            'footer',
        );

        const badge = this.card.shadowRoot.querySelector(
            '.mini-compare-chart-badge',
        );
        if (badge && badge.textContent !== '') {
            this.getContainer().style.setProperty(
                '--consonant-merch-card-mini-compare-chart-top-section-mobile-height',
                '32px',
            );
        }
    }
    adjustMiniCompareFooterRows() {
        if (this.card.getBoundingClientRect().width === 0) return;
        const footerRows = this.card.querySelector('[slot="footer-rows"] ul');

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

    get mainPrice() {
        const price = this.card.querySelector(
            `[slot="heading-m-price"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
        );
        return price;
    }

    get headingMPriceSlot() {
        return this.card.shadowRoot
            .querySelector('slot[name="heading-m-price"]')
            ?.assignedElements()[0];
    }

    toggleAddon(merchAddon) {
        const mainPrice = this.mainPrice;
        const headingMPriceSlot = this.headingMPriceSlot;
        if (!mainPrice && headingMPriceSlot) {
            const planType = merchAddon?.getAttribute('plan-type');
            let visibleSpan = null;
            if (merchAddon && planType) {
                const matchingP = merchAddon.querySelector(
                    `p[data-plan-type="${planType}"]`,
                );
                visibleSpan = matchingP?.querySelector(
                    'span[is="inline-price"]',
                );
            }
            this.card
                .querySelectorAll('p[slot="heading-m-price"]')
                .forEach((p) => p.remove());
            if (merchAddon.checked) {
                if (visibleSpan) {
                    const replacementP = createTag(
                        'p',
                        {
                            class: 'addon-heading-m-price-addon',
                            slot: 'heading-m-price',
                        },
                        visibleSpan.innerHTML,
                    );
                    this.card.appendChild(replacementP);
                }
            } else {
                const freeP = createTag(
                    'p',
                    {
                        class: 'card-heading',
                        id: 'free',
                        slot: 'heading-m-price',
                    },
                    'Free',
                );
                this.card.appendChild(freeP);
            }
        }
    }

    async adjustAddon() {
        await this.card.updateComplete;
        const addon = this.card.addon;
        if (!addon) return;
        const price = this.mainPrice;
        let planType = this.card.planType;
        if (price) {
            await price.onceSettled();
            planType = price.value?.[0]?.planType;
        }
        if (!planType) return;
        addon.planType = planType;
    }

    renderLayout() {
        return html` <div class="top-section${this.badge ? ' badge' : ''}">
                <slot name="icons"></slot> ${this.badge}
            </div>
            <slot name="heading-m"></slot>
            ${this.card.classList.contains('bullet-list')
                ? html`<slot name="heading-m-price"></slot>
                      <slot name="price-commitment"></slot>
                      <slot name="body-m"></slot>`
                : html`<slot name="body-m"></slot>
                      <slot name="heading-m-price"></slot>`}
            <slot name="body-xxs"></slot>
            <slot name="price-commitment"></slot>
            <slot name="offers"></slot>
            <slot name="promo-text"></slot>
            <slot name="callout-content"></slot>
            <slot name="addon"></slot>
            ${this.getMiniCompareFooter()}
            <slot name="footer-rows"><slot name="body-s"></slot></slot>`;
    }
    async postCardUpdateHook() {
        await Promise.all(this.card.prices.map((price) => price.onceSettled()));
        await this.adjustAddon();
        if (!isMobile()) {
            this.adjustMiniCompareBodySlots();
            this.adjustMiniCompareFooterRows();
        } else {
            this.removeEmptyRows();
        }
    }
    static variantStyle = css`
        :host([variant='mini-compare-chart']) > slot:not([name='icons']) {
            display: block;
        }
        :host([variant='mini-compare-chart']) footer {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-s);
        }

        :host([variant='mini-compare-chart'].bullet-list) footer {
            flex-flow: column nowrap;
            min-height: var(
                --consonant-merch-card-mini-compare-chart-footer-height
            );
            padding: var(--consonant-merch-spacing-xs);
        }

        /* mini-compare card  */
        :host([variant='mini-compare-chart']) .top-section {
            padding-top: var(--consonant-merch-spacing-s);
            padding-inline-start: var(--consonant-merch-spacing-s);
            height: var(
                --consonant-merch-card-mini-compare-chart-top-section-height
            );
        }

        :host([variant='mini-compare-chart'].bullet-list) .top-section {
            padding-top: var(--consonant-merch-spacing-xs);
            padding-inline-start: var(--consonant-merch-spacing-xs);
        }

        :host([variant='mini-compare-chart'].bullet-list)
            .secure-transaction-label {
            align-self: flex-start;
            flex: none;
            color: var(--merch-color-grey-700);
        }

        @media screen and ${unsafeCSS(MOBILE_LANDSCAPE)} {
            :host([variant='mini-compare-chart'].bullet-list)
                .mini-compare-chart-badge {
                padding: 2px 10px;
                font-size: var(--consonant-merch-card-body-xs-font-size);
                line-height: var(--consonant-merch-card-body-xs-line-height);
            }

            :host([variant='mini-compare-chart'].bullet-list)
                .secure-transaction-label {
                font-size: var(--consonant-merch-card-body-xs-font-size);
            }
        }

        @media screen and ${unsafeCSS(TABLET_DOWN)} {
            [class*'-merch-cards']
                :host([variant='mini-compare-chart'])
                footer {
                flex-direction: column;
                align-items: stretch;
                text-align: center;
            }
        }

        @media screen and ${unsafeCSS(DESKTOP_UP)} {
            :host([variant='mini-compare-chart']) footer {
                padding: var(--consonant-merch-spacing-xs)
                    var(--consonant-merch-spacing-s)
                    var(--consonant-merch-spacing-s)
                    var(--consonant-merch-spacing-s);
            }
        }

        :host([variant='mini-compare-chart']) slot[name='footer-rows'] {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: end;
        }
        /* mini-compare card heights for the slots: heading-m, body-m, heading-m-price, price-commitment, offers, promo-text, footer */
        :host([variant='mini-compare-chart']) slot[name='heading-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-m-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='body-m'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-m-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='heading-m-price'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-heading-m-price-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='body-xxs'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-body-xxs-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='price-commitment'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-price-commitment-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='offers'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-offers-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='promo-text'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-promo-text-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='callout-content'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-callout-content-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='addon'] {
            min-height: var(
                --consonant-merch-card-mini-compare-chart-addon-height
            );
        }
        :host([variant='mini-compare-chart']) slot[name='footer-rows'] {
            justify-content: flex-start;
        }
    `;
}
