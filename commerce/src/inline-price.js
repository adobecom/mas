import {
    createPlaceholder,
    definePlaceholder,
    selectPlaceholders,
    updatePlaceholder,
} from './placeholder.js';
import { selectOffers, useService } from './utilities.js';

/** @type {Commerce.Price.PlaceholderConstructor} */
export class HTMLPriceSpanElement extends HTMLSpanElement {
    static is = 'inline-price';
    static tag = 'span';
    static get observedAttributes() {
        return [
            'data-display-old-price',
            'data-display-per-unit',
            'data-display-recurrence',
            'data-display-tax',
            'data-perpetual',
            'data-promotion-code',
            'data-tax-exclusive',
            'data-template',
            'data-wcs-osi',
        ];
    }

    /** @type {Commerce.Price.PlaceholderConstructor["createInlinePrice"]} */
    static createInlinePrice(options) {
        const service = useService();
        if (!service) return null;
        const {
            displayOldPrice,
            displayPerUnit,
            displayRecurrence,
            displayTax,
            forceTaxExclusive,
            perpetual,
            promotionCode,
            quantity,
            template,
            wcsOsi,
        } = service.collectPriceOptions(options);
        /** @type {Commerce.Price.Placeholder} */
        // @ts-ignore
        const element = createPlaceholder(HTMLPriceSpanElement, {
            displayOldPrice,
            displayPerUnit,
            displayRecurrence,
            displayTax,
            forceTaxExclusive,
            perpetual,
            promotionCode,
            quantity,
            template,
            wcsOsi,
        });
        return element;
    }

    // TODO: consider moving this function to the `web-components` package
    /** @type {Commerce.Price.PlaceholderConstructor["getInlinePrices"]} */
    static getInlinePrices(container) {
        /** @type {Commerce.Price.Placeholder[]} */
        // @ts-ignore
        const elements = selectPlaceholders(HTMLPriceSpanElement, container);
        return elements;
    }

    get isInlinePrice() {
        return true;
    }

    /**
     * Returns `this`, typed as Placeholder mixin.
     * @type {Commerce.Price.Placeholder}
     */
    get placeholder() {
        // @ts-ignore
        return this;
    }

    /**
     * Resolves associated osi via Wcs and renders price offer.
     * @param {Record<string, any>} overrides
     */
    async render(overrides = {}) {
        if (!this.isConnected) return false;
        const service = useService();
        if (!service) return false;
        const options = service.collectPriceOptions(
            overrides,
            this.placeholder
        );
        if (!options.wcsOsi.length) return false;
        const version = this.placeholder.togglePending(options);
        this.innerHTML = '';
        const [promise] = service.resolveOfferSelectors(options);
        return this.renderOffers(
            selectOffers(await promise, options),
            options,
            version
        );
    }

    // TODO: can be extended to accept array of offers and compute subtotal price
    /**
     * Renders price offer as HTML of this component
     * using consonant price template functions
     * from package `@dexter/tacocat-consonant-templates`.
     * @param {Commerce.Wcs.Offer[]} offers
     * @param {Record<string, any>} overrides
     * Optional object with properties to use as overrides
     * over those collected from dataset of this component.
     */
    renderOffers(offers, overrides = {}, version = undefined) {
        if (!this.isConnected) return;
        const service = useService();
        if (!service) return false;
        const options = service.collectPriceOptions({
            ...this.dataset,
            ...overrides,
        });
        version ??= this.placeholder.togglePending(options);
        if (offers.length) {
            if (this.placeholder.toggleResolved(version, offers, options)) {
                this.innerHTML = service.buildPriceHTML(offers, options);
                return true;
            }
        } else {
            const error = new Error(`Not provided: ${options?.wcsOsi ?? '-'}`);
            if (this.placeholder.toggleFailed(version, error, options)) {
                this.innerHTML = '';
                return true;
            }
        }
        return false;
    }

    updateOptions(options) {
        const service = useService();
        if (!service) return false;
        const {
            displayOldPrice,
            displayPerUnit,
            displayRecurrence,
            displayTax,
            forceTaxExclusive,
            perpetual,
            promotionCode,
            quantity,
            template,
            wcsOsi,
        } = service.collectPriceOptions(options);
        updatePlaceholder(this, {
            displayOldPrice,
            displayPerUnit,
            displayRecurrence,
            displayTax,
            forceTaxExclusive,
            perpetual,
            promotionCode,
            quantity,
            template,
            wcsOsi,
        });
        return true;
    }
}

export const InlinePrice = definePlaceholder(HTMLPriceSpanElement);
