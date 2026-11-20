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

    async clickHandler(e) {
        if (this.handleAupCheckout(e)) return;
        if (this.checkoutActionHandler instanceof Promise) {
            e.preventDefault();
            const handler = await this.checkoutActionHandler;
            if (handler) {
                handler(e);
                return;
            }
        }

        if (this.href) {
            window.location.href = this.href;
        }
    }
}

// Define custom DOM element
if (!window.customElements.get(CheckoutButton.is)) {
    window.customElements.define(CheckoutButton.is, CheckoutButton, {
        extends: CheckoutButton.tag,
    });
}
