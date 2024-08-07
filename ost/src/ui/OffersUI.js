
import { OstStore } from "../store/OstStore";
import { LitElement, html } from 'lit';
import { MobxReactionUpdateCustom } from '@adobe/lit-mobx/lib/mixin-custom.js';
import { Reaction } from 'mobx';

class OffersUI extends MobxReactionUpdateCustom(LitElement, Reaction) {
    TAG_NAME = 'checkout-ui';

    static properties = {
        arrangementCode : { type: String },
        pricePoint : { type: String },
        commitment : { type: String },
        term : { type: String },
        offerType : { type: String },
        customerSegment : { type: String },
        marketSegment : { type: String },
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

