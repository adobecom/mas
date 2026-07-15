const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCALE_RE = /^[a-z]{2}_[A-Z]{2}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;
const ALLOWED_OPEN_HOSTS = new Set(['mas.adobe.com']);

function isValidUUID(value) {
    return typeof value === 'string' && UUID_RE.test(value);
}

function isValidLocale(value) {
    return typeof value === 'string' && LOCALE_RE.test(value);
}

function isValidCountry(value) {
    return typeof value === 'string' && COUNTRY_RE.test(value);
}

function isAllowedOpenUrl(value) {
    if (typeof value !== 'string' || !value) return false;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && ALLOWED_OPEN_HOSTS.has(url.hostname);
    } catch (err) {
        return false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isValidUUID, isValidLocale, isValidCountry, isAllowedOpenUrl };
}

if (typeof self !== 'undefined') {
    self.MASValidators = { isValidUUID, isValidLocale, isValidCountry, isAllowedOpenUrl };
}
