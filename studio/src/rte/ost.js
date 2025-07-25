import { html } from 'lit';
import {
    CHECKOUT_CTA_TEXTS,
    EVENT_OST_SELECT,
    EVENT_OST_OFFER_SELECT,
    WCS_LANDSCAPE_PUBLISHED,
    WCS_LANDSCAPE_DRAFT,
} from '../constants.js';
import Store from '../store.js';

let ostRoot = document.getElementById('ost');
let closeFunction;

if (!ostRoot) {
    ostRoot = document.createElement('div');
    document.body.appendChild(ostRoot);
}

export const ostDefaults = {
    aosApiKey: 'wcms-commerce-ims-user-prod',
    checkoutClientId: 'creative',
    country: 'US',
    language: 'en',
    environment: 'PROD',
    landscape: 'PUBLISHED',
    searchParameters: {},
    searchOfferSelectorId: null,
    defaultPlaceholderOptions: {
        displayRecurrence: true,
        displayPerUnit: false,
        displayTax: false,
        displayOldPrice: true,
        forceTaxExclusive: true,
    },
    wcsApiKey: 'wcms-commerce-ims-ro-user-cc',
    ctaTextOption: {
        ctaTexts: Object.entries(CHECKOUT_CTA_TEXTS).map(([id, name]) => ({
            id,
            name,
        })),
        getDefaultText() {
            return this.ctaTexts[0].id;
        },

        getTexts() {
            return this.ctaTexts;
        },

        getSelectedText(searchParameters) {
            const ctaLabel = searchParameters.get('text');
            let selectedText;
            if (ctaLabel)
                selectedText =
                    this.ctaTexts.find(({ id, name }) => [id, name].includes(ctaLabel)) ||
                    this.ctaTexts.find(({ id, name }) => [id, name].includes(ctaLabel.replace('{{', '').replace('}}', '')));
            if (selectedText) return selectedText.id;
            return ctaLabel || this.getDefaultText();
        },
    },
};

// Function to get the difference between two objects
function getObjectDifference(values, defaults) {
    const difference = {};

    // Add properties from values that are different from defaults
    for (const key in values) {
        // If the key doesn't exist in defaults, or if the value is different
        if (!(key in defaults) || values[key] !== defaults[key]) {
            difference[key] = values[key];
        }
    }

    return difference;
}

export const attributeFilter = (key) => /^(class|data-|is|href|title|target)/.test(key);

const OST_TYPE_MAPPING = {
    price: null,
    priceStrikethrough: 'strikethrough',
    priceAnnual: 'annual',
    priceOptical: 'optical',
    checkoutUrl: null,
};

const OST_IS_MAPPING = {
    price: 'inline-price',
    strikethrough: 'inline-price',
    annual: 'inline-price',
    optical: 'inline-price',
    checkoutUrl: 'checkout-link',
    legal: 'inline-price',
};

const OST_OPTION_ATTRIBUTE_MAPPING = {
    displayOldPrice: 'data-display-old-price',
    displayPerUnit: 'data-display-per-unit',
    displayRecurrence: 'data-display-recurrence',
    displayTax: 'data-display-tax',
    forceTaxExclusive: 'data-tax-exclusive',
    isPerpetual: 'data-perpetual',
    wcsOsi: 'data-wcs-osi',
    workflow: 'data-checkout-workflow',
    workflowStep: 'data-checkout-workflow-step',
    storedPromoOverride: 'data-promotion-code',
    modal: 'data-modal',
    entitlement: 'data-entitlement',
    upgrade: 'data-upgrade',
};

export const OST_OPTION_ATTRIBUTE_MAPPING_REVERSE = Object.fromEntries(
    Object.entries(OST_OPTION_ATTRIBUTE_MAPPING).map(([key, value]) => [value, key]),
);

const OST_OPTION_DEFAULTS = {
    displayOldPrice: true,
    displayPerUnit: false,
    displayRecurrence: true,
    displayTax: false,
    forceTaxExclusive: false,
    isPerpetual: false,
    workflow: 'UCv3',
    workflowStep: 'email',
};

const OST_VALUE_MAPPING = {
    true: true,
    false: false,
};

export function onPlaceholderSelect(offerSelectorId, type, offer, options, promoOverride) {
    const changes = getObjectDifference(options, OST_OPTION_DEFAULTS);

    const attributes = { 'data-wcs-osi': offerSelectorId };

    const template = OST_TYPE_MAPPING[type] ?? type;
    if (template) {
        attributes['data-template'] = template;
    }
    const is = OST_IS_MAPPING[type];
    if (is) {
        attributes.is = is;
    }

    const ctaText = CHECKOUT_CTA_TEXTS[options.ctaText]; // no placeholder key support.
    if (ctaText) {
        attributes['text'] = ['acom', 'sandbox', 'nala'].includes(Store.search.get().path) ? `{{${options.ctaText}}}` : ctaText;
        attributes['data-analytics-id'] = options.ctaText;
    }

    if (promoOverride) {
        attributes['data-promotion-code'] = promoOverride;
    }
    for (const [key, value] of Object.entries(changes)) {
        const attribute = OST_OPTION_ATTRIBUTE_MAPPING[key];
        if (attribute) {
            attributes[attribute] = value;
        }
    }

    ostRoot.dispatchEvent(
        new CustomEvent(EVENT_OST_SELECT, {
            detail: attributes,
            bubbles: true,
        }),
    );
}

export function onOfferSelect(offerSelectorId, type, offer) {
    ostRoot.dispatchEvent(
        new CustomEvent(EVENT_OST_OFFER_SELECT, {
            detail: { offerSelectorId, offer },
            bubbles: true,
        }),
    );
}

export function getOffferSelectorTool() {
    return html`
        <sp-overlay id="ostDialog" type="modal">
            <sp-dialog-wrapper dismissable underlay>
                <div id="ost"></div>
            </sp-dialog-wrapper>
        </sp-overlay>
    `;
}

export function openOfferSelectorTool(triggerElement, offerElement) {
    try {
        const landscape = Store.commerceEnv?.value == 'stage' ? WCS_LANDSCAPE_DRAFT : WCS_LANDSCAPE_PUBLISHED;
        if (!ostRoot) {
            ostRoot = document.createElement('div');
            document.body.appendChild(ostRoot);
        }
        let searchOfferSelectorId;
        const aosAccessToken = localStorage.getItem('masAccessToken') ?? window.adobeid.authorize();
        const searchParameters = new URLSearchParams();

        const defaultPlaceholderOptions = {
            ...ostDefaults.defaultPlaceholderOptions,
        };
        const offerSelectorPlaceholderOptions = {};
        if (offerElement) {
            searchParameters.append('type', offerElement.isInlinePrice ? 'price' : 'checkout');
            if (!offerElement.isInlinePrice) {
                searchParameters.append('text', offerElement.innerText);
            }
            searchOfferSelectorId = offerElement.getAttribute('data-wcs-osi');

            // Set search parameters
            offerElement.getAttributeNames().forEach((key) => {
                const newKey = OST_OPTION_ATTRIBUTE_MAPPING_REVERSE[key];
                if (newKey) {
                    let newValue = offerElement.getAttribute(key);
                    newValue = OST_VALUE_MAPPING[newValue] ?? newValue;
                    offerSelectorPlaceholderOptions[newKey] = newValue;
                }
            });

            [
                'promotionCode', // contextual promo code (e.g. set on card/)
                'storedPromoOverride', // promo code set directly on price/CTA
                'checkoutType',
                'workflowStep',
                'country',
                'modal',
                'entitlement',
                'upgrade',
            ].forEach((key) => {
                const value = offerSelectorPlaceholderOptions[key];
                if (value) searchParameters.append(key, value);
            });
        }
        const masCommerceService = document.querySelector('mas-commerce-service');
        ostRoot.style.display = 'block';
        closeFunction = window.ost.openOfferSelectorTool({
            ...ostDefaults,
            ...masCommerceService.settings,
            rootElement: ostRoot,
            zIndex: 20,
            aosAccessToken,
            landscape,
            searchParameters,
            searchOfferSelectorId,
            defaultPlaceholderOptions,
            offerSelectorPlaceholderOptions,
            modalsAndEntitlements: ['acom', 'sandbox', 'nala'].includes(Store.search.get().path),
            dialog: true,
            onSelect: triggerElement.tagName === 'OSI-FIELD' ? onOfferSelect : onPlaceholderSelect,
        });
    } catch (error) {
        console.error('Error opening offer selector tool:', error);
    }
}

export function closeOfferSelectorTool() {
    closeFunction?.();
}
