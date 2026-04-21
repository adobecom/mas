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
    app.config = {
        searchParameters,
        searchOfferSelectorId,
        initialReferenceOsi,
        ctaTextOption,
        modalsAndEntitlements,
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
