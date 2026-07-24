import { html, nothing } from 'lit';
import { getFragmentMapping } from './variants';
import { MERCH_CARD_LOAD_TIMEOUT } from '../constants.js';

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
        if (VariantLayout.styleMap[styleKey]) return;
        VariantLayout.styleMap[styleKey] = true;
        const css = this.getGlobalCSS();
        // DOM marker guard: the static styleMap is per bundle copy, so a page
        // loading two bundles would otherwise inject every variant style twice.
        // Content is compared too — minified class names can collide.
        const existing = document.head.querySelector(
            `style[data-mas-variant-style="${styleKey}"]`,
        );
        if (existing && existing.textContent === css) return;
        const styles = document.createElement('style');
        styles.setAttribute('data-mas-variant-style', styleKey);
        styles.innerHTML = css;
        document.head.appendChild(styles);
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

        // Clear every prop first (writes), then measure every element (reads),
        // then apply the row maxima (writes) — layout flushes once for the
        // whole pass instead of once per card × entry.
        const previous = new Map();
        for (const rowCards of rows.values()) {
            for (const card of rowCards) {
                const saved = {};
                for (const { name } of entries) {
                    const prop = `--consonant-merch-card-${variant}-${name}-height`;
                    saved[name] = card.style.getPropertyValue(prop);
                    card.style.removeProperty(prop);
                }
                previous.set(card, saved);
            }
        }
        const measured = new Map();
        for (const rowCards of rows.values()) {
            for (const card of rowCards) {
                const heights = {};
                for (const { name, getElement } of entries) {
                    const el = getElement(card);
                    if (!el) continue;
                    heights[name] = Math.max(
                        0,
                        parseInt(window.getComputedStyle(el).height) || 0,
                    );
                }
                measured.set(card, heights);
            }
        }
        for (const rowCards of rows.values()) {
            for (const { name } of entries) {
                const prop = `--consonant-merch-card-${variant}-${name}-height`;
                let max = 0;
                for (const card of rowCards) {
                    const height = measured.get(card)[name] ?? 0;
                    if (height > max) max = height;
                }
                rowCards.forEach((card) => {
                    if (max > 0) {
                        card.style.setProperty(prop, `${max}px`);
                    } else if (previous.get(card)[name]) {
                        card.style.setProperty(prop, previous.get(card)[name]);
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
