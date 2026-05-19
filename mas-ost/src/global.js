import './utils/safe-define.js';
import './components/mas-ost-app.js';
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
        onMultiSelect,
        multiSelect = false,
        authoringFlow,
        rootElement,
        dialog = false,
        searchParameters,
        searchOfferSelectorId,
        initialReferenceOsi,
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
        onMultiSelect,
        multiSelect,
        authoringFlow,
        zIndex,
        defaultPlaceholderOptions,
        offerSelectorPlaceholderOptions,
        ctaTextOption,
    });

    const app = document.createElement('mas-ost-app');
    // Mirror flow-selection options into app.config so the lifecycle re-init in
    // mas-ost-app.updated() preserves them (otherwise `store.init(this.config)`
    // resets authoringFlow/flowChosen and the welcome screen re-appears even
    // when the caller requested a specific flow — e.g. chat OSI-attach which
    // deeplinks into 'consult').
    app.config = {
        searchParameters,
        searchOfferSelectorId,
        initialReferenceOsi,
        ctaTextOption,
        modalsAndEntitlements,
        authoringFlow,
        multiSelect,
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
