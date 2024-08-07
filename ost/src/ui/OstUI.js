import { html, LitElement, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Store } from '../store/OstStore.js';
import { EVENT_SUBMIT } from '../events.js';
import { repeat } from 'lit/directives/repeat.js';
import { Reaction } from 'mobx';
import { MobxReactionUpdateCustom } from '@adobe/lit-mobx/lib/mixin-custom.js';
import { deeplink, pushState } from '@adobe/mas-commons';
import { classMap } from 'lit/directives/class-map.js';

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
                disableOptions: { type: Array },
                priceTypes: { type: Array },

             },
            checkoutInfo: {
                checkoutType: { type: String },
                workflowStep: { type: String },
                ctaText: { type: String }
            },

        }
    };

    constructor() {
        super();
        this.confirmSelect = false;
    }

    renderHeader() {
        return html`<div class="ost-ui__header">
            <input
                type="text"
                class="ost-ui__search"
                placeholder="Search"
                @input=${this.handleSearch}
                .value=${this.searchText}
            />`
    }

    renderContent() {
        return html`<div class="ost-ui__content">
            ${repeat(
                this.store.offers,
                (offer) => offer.id,
                (offer) => html`<ost-fragment
                    .offer=${offer}
                    @click=${this.handleFragmentClick}
                ></ost-fragment>`
            )}
        </div>`;
    }

    render() {
        return html`<div class="ost-ui">
            ${this.renderHeader()} ${this.renderContent()}
        </div>`;
    }
}