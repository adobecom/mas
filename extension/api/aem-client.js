const DEFAULT_MAS_IO_URL = 'https://www.adobe.com/mas/io';
const DEFAULT_WCS_API_KEY = 'wcms-commerce-ims-ro-user-milo-extension';
const LOCALE_PATH_PATTERN = /^Fragment with identifier \/content\/dam\/mas\/[^/]+\/([a-z]{2}_[A-Z]{2})\//;
const NOT_FOUND = { kind: 'not-found' };

// IO names the DAM path it looked up when the fragment has no copy in the requested language,
// and the fragment id when the fragment itself does not exist.
async function missOf(response) {
    try {
        const { message } = JSON.parse(await response.text());
        const locale = LOCALE_PATH_PATTERN.exec(message)?.[1];
        if (locale) return { kind: 'missing-locale', locale };
    } catch {
        // An unreadable body still means IO found nothing.
    }
    return NOT_FOUND;
}

function getValidators() {
    if (typeof self !== 'undefined' && self.MASValidators) return self.MASValidators;
    if (typeof module !== 'undefined' && module.exports) {
        try {
            return require('../utils/validators.js');
        } catch (err) {
            return null;
        }
    }
    return null;
}

class AEMClient {
    constructor({ masIOUrl, wcsApiKey } = {}) {
        const validators = getValidators();
        this.masIOUrl = validators?.resolveMasIOUrl(masIOUrl) ?? DEFAULT_MAS_IO_URL;
        this.wcsApiKey = wcsApiKey || DEFAULT_WCS_API_KEY;
        this.defaultLocale = 'en_US';
    }

    async fetchFragmentData(fragmentId, locale = this.defaultLocale, country = null) {
        if (!/^[a-z]{2}_[A-Z]{2}$/.test(locale)) {
            throw new Error('Invalid locale');
        }
        if (country !== null && !/^[A-Z]{2}$/.test(country)) {
            throw new Error('Invalid country');
        }
        let url =
            `${this.masIOUrl}/fragment` +
            `?id=${encodeURIComponent(fragmentId)}` +
            `&api_key=${encodeURIComponent(this.wcsApiKey)}` +
            `&locale=${encodeURIComponent(locale)}`;
        if (country && !locale.endsWith(`_${country}`)) {
            url += `&country=${encodeURIComponent(country)}`;
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Fragment API rejected the request. It may not be published.');
                }
                if (response.status === 404) {
                    throw Object.assign(new Error('Fragment not found.'), { miss: await missOf(response) });
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();
            if (!text || text.trim() === '') {
                console.error('Empty response from server');
                throw new Error('Empty response from server');
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('JSON Parse Error - Response text:', text.substring(0, 500));
                throw new Error('Invalid JSON response from server');
            }

            return data;
        } catch (error) {
            // A 404 is an answer the panel explains (no copy in this language, not published), not a failure.
            if (!error.miss) console.error('Error fetching fragment data:', error);
            throw error;
        }
    }
}

if (typeof self !== 'undefined') {
    self.AEMClient = AEMClient;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AEMClient };
}
