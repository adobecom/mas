import { html } from 'lit';

let ostRoot;
let closeFunction;

const ctaTexts = {
    'buy-now': 'Buy now',
    'free-trial': 'Free trial',
    'start-free-trial': 'Start free trial',
    'save-now': 'Save now',
    'get-started': 'Get started',
    'choose-a-plan': 'Choose a plan',
    'learn-more': 'Learn more',
    'change-plan-team-plans': 'Change Plan Team Plans',
    upgrade: 'Upgrade',
    'change-plan-team-payment': 'Change Plan Team Payment',
    'take-the-quiz': 'Take the quiz',
    'see-more': 'See more',
    'upgrade-now': 'Upgrade now',
};

export const ostDefaults = {
    aosApiKey: 'wcms-commerce-ims-user-prod',
    checkoutClientId: 'creative',
    country: 'US',
    environment: 'PROD',
    landscape: 'PUBLISHED',
    language: 'en',
    searchParameters: {},
    searchOfferSelectorId: null,
    defaultPlaceholderOptions: {
        displayRecurrence: true,
        displayPerUnit: false,
        displayTax: false,
        displayOldPrice: false,
        forceTaxExclusive: true,
    },
    wcsApiKey: 'wcms-commerce-ims-ro-user-cc',
    ctaTextOption: {
        ctaTexts: Object.entries(ctaTexts).map(([id, name]) => ({ id, name })),
        getDefaultText() {
            return this.ctaTexts[0].id;
        },

        getTexts() {
            return this.ctaTexts;
        },

        getSelectedText(searchParameters) {
            const ctaLabel = searchParameters.get('text');
            const selectedText = this.ctaTexts.find(({ id, name }) =>
                [id, name].includes(ctaLabel),
            );
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

export const attributeFilter = (key) =>
    /^(class|data-|is|href|title)/.test(key);

const OST_TYPE_MAPPING = {
    price: null,
    priceStrikethrough: 'strikethrough',
    priceAnnual: 'annual',
    priceOptical: 'optical',
    checkoutUrl: null,
};

const OST_IS_MAPPING = {
    price: 'inline-price',
    priceStrikethrough: 'inline-price',
    priceAnnual: 'inline-price',
    priceOptical: 'inline-price',
    checkoutUrl: 'checkout-link',
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
};

export const OST_OPTION_ATTRIBUTE_MAPPING_REVERSE = Object.fromEntries(
    Object.entries(OST_OPTION_ATTRIBUTE_MAPPING).map(([key, value]) => [
        value,
        key,
    ]),
);

const OST_OPTION_DEFAULTS = {
    displayOldPrice: false,
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

export function onSelect(offerSelectorId, type, offer, options, promoOverride) {
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

    const ctaText = ctaTexts[options.ctaText]; // no placeholder key support.
    if (ctaText) {
        attributes['text'] = ctaText;
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
        new CustomEvent('use', {
            detail: attributes,
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
        </overlay-trigger>
    `;
}

export function openOfferSelectorTool(offerElement) {
    if (!ostRoot) {
        ostRoot = document.createElement('div');
        document.body.appendChild(ostRoot);
    }
    let searchOfferSelectorId;
    const aosAccessToken =
        localStorage.getItem('masAccessToken') ?? window.adobeid.authorize();
    const searchParameters = new URLSearchParams();

    const defaultPlaceholderOptions = {
        ...ostDefaults.defaultPlaceholderOptions,
    };
    const offerSelectorPlaceholderOptions = {};
    if (offerElement) {
        searchParameters.append(
            'type',
            offerElement.isCheckoutLink ? 'checkout' : 'price',
        );
        if (offerElement.isCheckoutLink) {
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

        ['promotionCode', 'checkoutType', 'workflowStep', 'country'].forEach(
            (key) => {
                const value = offerSelectorPlaceholderOptions[key];
                if (value) searchParameters.append(key, value);
            },
        );
    }
    ostRoot.style.display = 'block';
    closeFunction = window.ost.openOfferSelectorTool({
        ...ostDefaults,
        rootElement: ostRoot,
        zIndex: 20,
        aosAccessToken,
        searchParameters,
        searchOfferSelectorId,
        defaultPlaceholderOptions,
        offerSelectorPlaceholderOptions,
        dialog: true,
        onSelect,
    });
}

export function closeOfferSelectorTool() {
    closeFunction?.();
}