importScripts('utils/validators.js', 'utils/studio-url.js', 'api/aem-client.js', 'api/promotion-lookup.js');

function isExtensionSender(sender) {
    return sender && sender.id === chrome.runtime.id;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isExtensionSender(sender)) {
        return false;
    }

    if (message.type === 'FETCH_FRAGMENT_DATA') {
        handleFetchFragmentData(message, sendResponse);
        return true;
    }

    if (message.type === 'OPEN_STUDIO_LINK') {
        handleOpenStudioLink(message, sendResponse);
        return true;
    }

    return false;
});

async function handleFetchFragmentData(message, sendResponse) {
    const { fragmentId, locale, country, masIOUrl, wcsApiKey } = message;
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
        const client = new AEMClient({ masIOUrl, wcsApiKey });
        const data = await client.fetchFragmentData(fragmentId, locale, country);
        sendResponse({ success: true, data });
    } catch (error) {
        sendResponse({ success: false, error: 'fetch_failed' });
    }
}

async function handleOpenStudioLink(message, sendResponse) {
    // The page names a promotion only by folder and title; its Studio link needs the project id.
    const request = message.view === 'promotion' ? await MASPromotionLookup.linkRequest(message) : message;
    const url = MASStudioUrl.buildStudioUrl(request);
    if (!url || !MASValidators.isAllowedOpenUrl(url)) {
        sendResponse({ success: false, error: 'invalid_request' });
        return;
    }
    chrome.tabs.create({ url }, () => {
        sendResponse({ success: true, url });
    });
}
