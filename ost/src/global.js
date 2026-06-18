import './swc.js';
import './components/ost-app.js';
import { store } from './store/ost-store.js';

function openOfferSelectorTool(options) {
    const {
        country = 'US',
        language = 'en',
        env = 'PRODUCTION',
        environment,
        landscape = 'PUBLISHED',
        wcsApiKey,
        aosApiKey,
        aosAccessToken,
        checkoutClientId = 'mas-commerce-service',
        promotionCode,
        onSelect,
        onCancel,
        multiSelect = false,
        authoringFlow,
        rootElement,
        dialog = false,
        searchParameters,
        searchOfferSelectorId,
        initialReferenceOsi,
        bundleOsis,
        defaultPlaceholderOptions,
        offerSelectorPlaceholderOptions = {
            displayFormatted: true,
        },
        zIndex = 20000,
        ctaTextOption,
        modalsAndEntitlements = false,
    } = options;

    store.init({
        country,
        language,
        env,
        environment,
        landscape,
        wcsApiKey,
        apiKey: aosApiKey,
        accessToken: aosAccessToken,
        checkoutClientId,
        promotionCode,
        onSelect,
        onCancel,
        multiSelect,
        authoringFlow,
        zIndex,
        defaultPlaceholderOptions,
        offerSelectorPlaceholderOptions,
        ctaTextOption,
    });

    const app = document.createElement('ost-app');
    // Mirror flow-selection options into app.config so the lifecycle re-init in
    // ost-app.updated() preserves them (otherwise `store.init(this.config)`
    // resets authoringFlow back to 'single' even when the caller requested a
    // specific flow — e.g. chat OSI-attach which deeplinks into 'consult').
    app.config = {
        searchParameters,
        searchOfferSelectorId,
        initialReferenceOsi,
        bundleOsis,
        ctaTextOption,
        modalsAndEntitlements,
        authoringFlow,
        multiSelect,
        // Commerce config must survive the ost-app.updated() re-init too, or
        // store.init(this.config) resets these to undefined and AOS calls fail
        // (e.g. environment defaults to the AOS-invalid 'PRODUCTION' → HTTP 400,
        // surfacing as "No offers found").
        country,
        language,
        env,
        environment,
        landscape,
        wcsApiKey,
        apiKey: aosApiKey,
        accessToken: aosAccessToken,
        checkoutClientId,
        promotionCode,
        offerSelectorPlaceholderOptions,
        defaultPlaceholderOptions,
    };

    if (dialog) {
        app.setAttribute('dialog', '');
    }

    const container = rootElement || document.body;
    container.appendChild(app);

    return () => {
        app.remove();
    };
}

window.ost = { openOfferSelectorTool };
