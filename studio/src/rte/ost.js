import { html } from 'lit';
import { CHECKOUT_CTA_TEXTS, EVENT_OST_SELECT, EVENT_OST_OFFER_SELECT, WCS_LANDSCAPE_PUBLISHED } from '../constants.js';
import Store from '../store.js';

let ostRoot = document.getElementById('ost');
let closeFunction;

if (!ostRoot) {
    ostRoot = document.createElement('div');
    document.body.appendChild(ostRoot);
}

const ostDefaultSettings = () => {
    const masCommerceService = document.querySelector('mas-commerce-service');
    const {
        displayOldPrice,
        displayPerUnit,
        displayPlanType,
        displayRecurrence,
        displayTax,
        isPerpetual,
        checkoutWorkflowStep,
    } = masCommerceService.settings;
    const effectiveDisplayOldPrice = masCommerceService.featureFlags['mas-ff-defaults'] ? displayOldPrice : true;
    return {
        displayOldPrice: effectiveDisplayOldPrice,
        displayPerUnit,
        displayPlanType,
        displayRecurrence,
        displayTax,
        forceTaxExclusive: true, // see https://git.corp.adobe.com/wcms/tacocat.js/blob/develop/packages/offer-selector-tool/src/PlaceholderKey.jsx#L38
        isPerpetual,
        workflowStep: checkoutWorkflowStep,
    };
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
    'promo-strikethrough': 'inline-price',
};

const OST_OPTION_ATTRIBUTE_MAPPING = {
    displayOldPrice: 'data-display-old-price',
    displayPerUnit: 'data-display-per-unit',
    displayRecurrence: 'data-display-recurrence',
    displayTax: 'data-display-tax',
    forceTaxExclusive: 'data-force-tax-exclusive',
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

const OST_VALUE_MAPPING = {
    true: true,
    false: false,
};

export async function onPlaceholderSelect(offerSelectorId, type, offer, options, promoOverride) {
    const masCommerceService = document.querySelector('mas-commerce-service');
    let settings = ostDefaultSettings();
    if (masCommerceService.featureFlags['mas-ff-defaults']) {
        const taxFlags = await masCommerceService?.resolvePriceTaxFlags(
            masCommerceService.settings.country,
            null,
            offer.customer_segment,
            offer.market_segments[0],
        );
        settings = {
            ...settings,
            ...taxFlags,
            displayPerUnit: offer.customer_segment !== 'INDIVIDUAL',
        };
    }
    const changes = getObjectDifference(options, settings);

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
    if (!options.isPerpetual) {
        delete changes.isPerpetual;
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
    const masCommerceService = document.querySelector('mas-commerce-service');
    try {
        const landscape = Store.landscape?.value ?? WCS_LANDSCAPE_PUBLISHED;
        if (!ostRoot) {
            ostRoot = document.createElement('div');
            document.body.appendChild(ostRoot);
        }
        let searchOfferSelectorId;
        const aosAccessToken = localStorage.getItem('masAccessToken') ?? window.adobeid.authorize();
        const searchParameters = new URLSearchParams();

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
        ostRoot.style.display = 'block';

        closeFunction = window.ost.openOfferSelectorTool({
            aosApiKey: 'wcms-commerce-ims-user-prod',
            checkoutClientId: 'creative',
            environment: 'PROD',
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
                            this.ctaTexts.find(({ id, name }) =>
                                [id, name].includes(ctaLabel.replace('{{', '').replace('}}', '')),
                            );
                    if (selectedText) return selectedText.id;
                    return ctaLabel || this.getDefaultText();
                },
            },
            rootElement: ostRoot,
            zIndex: 2000,
            aosAccessToken,
            landscape,
            searchParameters,
            searchOfferSelectorId,
            country: masCommerceService.settings.country,
            language: masCommerceService.settings.language,
            defaultPlaceholderOptions: ostDefaultSettings(),
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
