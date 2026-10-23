import { getFragmentMapping } from './variants';
import { MERCH_CARD_LOAD_TIMEOUT } from '../constants.js';
import { escapeHTML } from '../utils.js';

export class VariantLayout {
    static styleMap = {};

    card;

    #container;

    getContainer() {
        this.#container =
            this.#container ??
            this.card.closest(
                'merch-card-collection, [class*="-merch-cards"]',
            ) ??
            this.card.parentElement;
        return this.#container;
    }

    insertVariantStyle() {
        const styleKey = this.constructor.name;
        if (!VariantLayout.styleMap[styleKey]) {
            VariantLayout.styleMap[styleKey] = true;
            const styles = document.createElement('style');
            styles.innerHTML = this.getGlobalCSS();
            document.head.appendChild(styles);
        }
    }

    updateCardElementMinHeight(el, name) {
        if (!el || this.card.heightSync === false) return;
        const elMinHeightPropertyName = `--consonant-merch-card-${this.card.variant}-${name}-height`;
        const height = Math.max(
            0,
            parseInt(window.getComputedStyle(el).height) || 0,
        );
        const container = this.getContainer();
        const maxMinHeight =
            parseInt(
                container.style.getPropertyValue(elMinHeightPropertyName),
            ) || 0;
        if (height > maxMinHeight) {
            container.style.setProperty(elMinHeightPropertyName, `${height}px`);
        }
    }

    syncRowHeights(entries) {
        if (this.card.heightSync === false) return;
        const container = this.getContainer();
        if (!container) return;
        const variant = this.card.variant;
        const cards = Array.from(
            container.querySelectorAll(`merch-card[variant="${variant}"]`),
        ).filter((c) => c.variantLayout?.card?.heightSync !== false);
        if (cards.length === 0) return;

        for (const { name } of entries) {
            const prop = `--consonant-merch-card-${variant}-${name}-height`;
            if (container.style.getPropertyValue(prop)) {
                container.style.removeProperty(prop);
            }
        }

        const rows = new Map();
        for (const card of cards) {
            const rect = card.getBoundingClientRect();
            if (rect.width <= 2) continue;
            const rowKey = Math.round(rect.top);
            let row = rows.get(rowKey);
            if (!row) {
                row = [];
                rows.set(rowKey, row);
            }
            row.push(card);
        }

        for (const rowCards of rows.values()) {
            for (const { name, getElement } of entries) {
                const prop = `--consonant-merch-card-${variant}-${name}-height`;
                const previous = rowCards.map((card) =>
                    card.style.getPropertyValue(prop),
                );
                let max = 0;
                const elements = rowCards.map((card) => {
                    card.style.removeProperty(prop);
                    const el = getElement(card);
                    if (!el) return el;
                    const height = Math.max(
                        0,
                        parseInt(window.getComputedStyle(el).height) || 0,
                    );
                    if (height > max) max = height;
                    return el;
                });
                rowCards.forEach((card, index) => {
                    if (elements[index]?.tagName === 'HR') return;
                    if (max > 0) {
                        card.style.setProperty(prop, `${max}px`);
                    } else if (previous[index]) {
                        card.style.setProperty(prop, previous[index]);
                    }
                });
            }
        }
    }

    get legalDisplayDot() {
        return true;
    }

    constructor(card) {
        this.card = card;
        this.insertVariantStyle();
    }

    get badge() {
        const { badgeBackgroundColor, badgeColor, badgeText, variant } =
            this.card;
        if (!badgeBackgroundColor || !badgeColor || !badgeText) return '';
        const border = this.evergreen
            ? ` border: 1px solid ${badgeBackgroundColor}; border-right: none;`
            : '';
        const style = `background-color: ${badgeBackgroundColor}; color: ${badgeColor};${border}`;
        return `<div id="badge" class="${escapeHTML(variant)}-badge" style="${escapeHTML(style)}">${escapeHTML(badgeText)}</div>`;
    }

    get cardImage() {
        return `<div class="image"><slot name="bg-image"></slot>${this.badge}</div>`;
    }

    /* c8 ignore next 3 */
    getGlobalCSS() {
        return '';
    }

    /* c8 ignore next 3 */
    get theme() {
        return document.querySelector('sp-theme');
    }

    get evergreen() {
        return this.card.classList.contains('intro-pricing');
    }

    get promoBottom() {
        return this.card.classList.contains('promo-bottom');
    }

    get headingSelector() {
        return '[slot="heading-xs"]';
    }

    get secureLabel() {
        const { secureLabel } = this.card;
        return secureLabel
            ? `<span class="secure-transaction-label">${escapeHTML(secureLabel)}</span>`
            : '';
    }

    get secureLabelFooter() {
        return `<footer>${this.secureLabel}<slot name="footer"></slot></footer>`;
    }

    async postCardUpdateHook() {
        if (!this.card.isConnected) return;
        await this.card.updateComplete;
        if (this.card.prices?.length > 0) {
            const settle = Promise.allSettled(
                this.card.prices.map(
                    (price) => price.onceSettled?.() || Promise.resolve(),
                ),
            );
            let timeoutId;
            const timeout = new Promise((resolve) => {
                timeoutId = setTimeout(resolve, MERCH_CARD_LOAD_TIMEOUT);
            });
            await Promise.race([settle, timeout]);
            clearTimeout(timeoutId);
        }
    }

    connectedCallbackHook() {
        //nothing to do by default
    }

    disconnectedCallbackHook() {
        //nothing to do by default
    }

    syncHeights() {
        // Base implementation - variants can override this
        // Called when all cards in collection are ready
        // Variants that need height synchronization should override this method
    }

    /**
     * Returns the shadow DOM markup of the card as an HTML string.
     * Author values must be escaped with escapeHTML.
     * @returns {string}
     */
    /* c8 ignore next 3 */
    renderLayout() {
        return '';
    }

    /**
     * Called after renderLayout() markup has been written to the shadow root,
     * to attach listeners and set element properties.
     * @param {ShadowRoot} root
     */
    /* c8 ignore next 1 */
    bindEvents(root) {}

    get aemFragmentMapping() {
        return getFragmentMapping(this.card.variant);
    }
}
