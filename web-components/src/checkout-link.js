import { CheckoutMixin, createCheckoutElement } from './checkout-mixin.js';

export class CheckoutLink extends CheckoutMixin(HTMLAnchorElement) {
    static is = 'checkout-link';
    static tag = 'a';

    static createCheckoutLink(options = {}, innerHTML = '') {
        return createCheckoutElement(CheckoutLink, options, innerHTML);
    }

    get isCheckoutLink() {
        return true;
    }
}

if (!customElements.get(CheckoutLink.is)) {
    customElements.define(CheckoutLink.is, CheckoutLink, {
        extends: CheckoutLink.tag,
    });
}
