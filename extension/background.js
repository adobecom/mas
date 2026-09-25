importScripts('utils/validators.js', 'utils/studio-url.js', 'api/aem-client.js');

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

function handleOpenStudioLink(message, sendResponse) {
    const url = MASStudioUrl.buildStudioUrl(message);
    if (!url || !MASValidators.isAllowedOpenUrl(url)) {
        sendResponse({ success: false, error: 'invalid_request' });
        return;
    }
    chrome.tabs.create({ url }, () => {
        sendResponse({ success: true, url });
    });
}
