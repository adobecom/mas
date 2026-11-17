import { createCheckoutElement } from './checkout-mixin.js';
import { CheckoutMixin } from './checkout-mixin.js';

export class CheckoutLink extends CheckoutMixin(HTMLAnchorElement) {
    static is = 'checkout-link';
    static tag = 'a';

    static createCheckoutLink(options = {}, innerHTML = '') {
        return createCheckoutElement(CheckoutLink, options, innerHTML);
    }

    get isCheckoutLink() {
        return true;
    }

    async clickHandler(e) {
        if (this.handleAupCheckout(e)) {
            return;
        }
        if (this.checkoutActionHandler instanceof Promise) {
            e.preventDefault();
            const handler = await this.checkoutActionHandler;
            handler?.(e);
            return;
        }
    }
}

// Define custom DOM element
if (!window.customElements.get(CheckoutLink.is)) {
    window.customElements.define(CheckoutLink.is, CheckoutLink, {
        extends: CheckoutLink.tag,
    });
}
