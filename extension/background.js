importScripts('utils/validators.js', 'api/aem-client.js');

const aemClient = new AEMClient();

const STUDIO_BASE_URL = 'https://mas.adobe.com';

const VARIANT_SURFACES = {
    catalog: 'acom',
    plans: 'acom',
    'plans-v2': 'acom',
    'plans-students': 'acom',
    'plans-education': 'acom',
    'ccd-slice': 'ccd',
    'ccd-suggested': 'ccd',
    fries: 'commerce',
    'ah-try-buy-widget': 'ahome',
    'ah-promoted-plans': 'ahome',
    'full-pricing-express': 'acom',
    'simplified-pricing-express': 'acom',
};

function isExtensionSender(sender) {
    return sender && sender.id === chrome.runtime.id;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isExtensionSender(sender)) {
        return false;
    }

    if (message.type === 'FETCH_FRAGMENT_DATA') {
        handleFetchFragmentData(message.fragmentId, message.locale, message.country, sendResponse);
        return true;
    }

    if (message.type === 'OPEN_STUDIO_LINK') {
        handleOpenStudioLink(message, sendResponse);
        return true;
    }

    return false;
});

async function handleFetchFragmentData(fragmentId, locale, country, sendResponse) {
    if (!MASValidators.isValidUUID(fragmentId)) {
        sendResponse({ success: false, error: 'invalid_fragment_id' });
        return;
    }
    if (locale && !MASValidators.isValidLocale(locale)) {
        sendResponse({ success: false, error: 'invalid_locale' });
        return;
    }
    if (country && !MASValidators.isValidCountry(country)) {
        sendResponse({ success: false, error: 'invalid_country' });
        return;
    }
    try {
        const data = await aemClient.fetchFragmentData(fragmentId, locale, country);
        sendResponse({ success: true, data });
    } catch (error) {
        sendResponse({ success: false, error: 'fetch_failed' });
    }
}

function buildStudioUrl(message) {
    const { view, fragmentId, variant, locale, surface } = message;

    if (view === 'content') {
        if (!MASValidators.isValidUUID(fragmentId)) return null;
        const sur = (variant && VARIANT_SURFACES[variant]) || 'acom';
        const params = new URLSearchParams({
            page: 'content',
            query: fragmentId,
            locale: 'en_US',
            path: `/content/dam/mas/en-us/${sur}`,
        });
        return `${STUDIO_BASE_URL}/studio.html#${params.toString()}`;
    }

    if (view === 'fragment-editor') {
        if (locale && !MASValidators.isValidLocale(locale)) return null;
        if (surface && !/^[a-z0-9/_-]+$/i.test(surface)) return null;
        if (fragmentId && !MASValidators.isValidUUID(fragmentId)) return null;
        const params = new URLSearchParams({ page: 'fragment-editor' });
        if (locale) params.set('locale', locale);
        if (surface) params.set('path', surface);
        if (fragmentId) params.set('fragmentId', fragmentId);
        return `${STUDIO_BASE_URL}/studio.html#${params.toString()}`;
    }

    return null;
}

function handleOpenStudioLink(message, sendResponse) {
    const url = buildStudioUrl(message);
    if (!url || !MASValidators.isAllowedOpenUrl(url)) {
        sendResponse({ success: false, error: 'invalid_request' });
        return;
    }
    chrome.tabs.create({ url }, () => {
        sendResponse({ success: true, url });
    });
}

chrome.runtime.onInstalled.addListener(() => {
    console.log('Merch At Scale Studio Extension installed');
});
