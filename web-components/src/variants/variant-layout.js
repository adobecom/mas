import { html, nothing } from 'lit';
import { getFragmentMapping } from './variants';
import { MERCH_CARD_LOAD_TIMEOUT } from '../constants.js';

const BORDER_BOX = { box: 'border-box' };

export class VariantLayout {
    static styleMap = {};

    card;

    #container;

    #reflowObserver = null;

    #observedBoxes = new WeakMap();

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
        let additionalStyles;
        if (
            !this.card.badgeBackgroundColor ||
            !this.card.badgeColor ||
            !this.card.badgeText
        ) {
            return;
        }
        if (this.evergreen) {
            additionalStyles = `border: 1px solid ${this.card.badgeBackgroundColor}; border-right: none;`;
        }
        return html`
            <div
                id="badge"
                class="${this.card.variant}-badge"
                style="background-color: ${this.card.badgeBackgroundColor};
                color: ${this.card.badgeColor};
                ${additionalStyles}"
            >
                ${this.card.badgeText}
            </div>
        `;
    }

    get cardImage() {
        return html` <div class="image">
            <slot name="bg-image"></slot>
            ${this.badge}
        </div>`;
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
        return this.card.secureLabel
            ? html`<span class="secure-transaction-label"
                  >${this.card.secureLabel}</span
              >`
            : nothing;
    }

    get secureLabelFooter() {
        return html`<footer>
            ${this.secureLabel}<slot name="footer"></slot>
        </footer>`;
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

    // Variants that re-sync heights on reflow call resyncOnReflow from here.
    // The check runs inside a ResizeObserver callback, after the frame's own
    // style and layout, so its geometry reads never force a recalc. Reading
    // right after a price write (mas:resolved) flushed style for the whole
    // document once per card.
    observeReflow(...elements) {
        if (typeof ResizeObserver === 'undefined') return;
        this.#observedBoxes = new WeakMap();
        this.#reflowObserver = new ResizeObserver((entries) => {
            // merch-card builds a layout before first render and another after;
            // only the one it keeps measures.
            if (this.card.variantLayout !== this) return;
            for (const { target, borderBoxSize } of entries) {
                const [{ inlineSize, blockSize }] = borderBoxSize;
                this.#observedBoxes.set(target, {
                    width: inlineSize,
                    height: blockSize,
                });
            }
            this.resyncOnReflow();
        });
        elements
            .filter(Boolean)
            .forEach((element) =>
                this.#reflowObserver.observe(element, BORDER_BOX),
            );
    }

    // A resolved price may not resize either observed box. Observing the card
    // again makes the observer report it after the next layout, so any number
    // of prices resolving within a frame cost one check per card.
    requestReflowCheck() {
        if (!this.#reflowObserver || this.card.variantLayout !== this) return;
        this.#reflowObserver.unobserve(this.card);
        this.#reflowObserver.observe(this.card, BORDER_BOX);
    }

    disconnectReflow() {
        this.#reflowObserver?.disconnect();
        this.#reflowObserver = null;
    }

    // The observer's last reported size; an element it never reported is
    // measured.
    boxOf(element) {
        return (
            this.#observedBoxes.get(element) ?? element.getBoundingClientRect()
        );
    }

    heightOf(element) {
        return element ? Math.round(this.boxOf(element).height) : 0;
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

    /* c8 ignore next 3 */
    renderLayout() {
        //nothing to do by default
    }

    get aemFragmentMapping() {
        return getFragmentMapping(this.card.variant);
    }
}
