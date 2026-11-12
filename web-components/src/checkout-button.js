import { CheckoutMixin, createCheckoutElement } from './checkout-mixin.js';

export class CheckoutButton extends CheckoutMixin(HTMLButtonElement) {
    static is = 'checkout-button';
    static tag = 'button';

    static createCheckoutButton(options = {}, innerHTML = '') {
        return createCheckoutElement(CheckoutButton, options, innerHTML);
    }

    get href() {
        return this.getAttribute('data-href');
    }

    get isCheckoutButton() {
        return true;
    }
}

if (!customElements.get(CheckoutButton.is)) {
    customElements.define(CheckoutButton.is, CheckoutButton, {
        extends: CheckoutButton.tag,
    });
}
