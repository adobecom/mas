import { html, LitElement, nothing } from 'lit';
import { Reaction } from 'mobx';
import { MobxReactionUpdateCustom } from '@adobe/lit-mobx/lib/mixin-custom.js';

class OstUI extends MobxReactionUpdateCustom(LitElement, Reaction) {
    TAG_NAME = 'ost-ui';

    static properties = {
        prodCode: { type: Number},
        entitlementInfo: {
            planType: { type: String },
            customerSegment: { type: String },
            offerType: { type: String },
            marketSegment: { type: String },
            countryCode: { type: String }
        },
        templateInfo: {
            type: { type: String },
            priceInfo: { 
                type: Object,
                value: null,
                disableOptions: { type: Array },
                priceTypes: { type: Array },

             },
            checkoutInfo: {
                type: Object,
                value: null,
                checkoutType: { type: String },
                workflowStep: { type: String },
                ctaText: { type: String }
            },

        }
    };

    constructor() {
        super();
    }

    renderHeader() {
        return html`<div class="ost-ui-header">
            /div>`
    }

    renderContent() {
        return html`<div class="ost-ui-content">
        </div>`;
    }

    render() {
        return html`<div class="ost-ui">
            ${this.renderHeader()} ${this.renderContent()}
        </div>`;
    }