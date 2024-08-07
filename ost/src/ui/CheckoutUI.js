import { OstStore } from "../store/OstStore";
import { LitElement, html } from 'lit';
import { MobxReactionUpdateCustom } from '@adobe/lit-mobx/lib/mixin-custom.js';
import { Reaction } from 'mobx';

class CheckoutUI extends MobxReactionUpdateCustom(LitElement, Reaction) {
    TAG_NAME = 'checkout-ui';

    static properties = {
        selectedOffer: { type: Object},
        checkoutPlaceholders: { type: any},
        checkoutType: { type: String},
        workflowStep: { type: String},
        ctaText: { type: String},
        ctaTextOption: { type: Object},
    };

    constructor() {
        super();
    }

    render() {
        return html`<div class="checkout-ui">
            Placeholder fr checkout UI
        </div>`;
    }
}
