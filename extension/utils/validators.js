const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCALE_RE = /^[a-z]{2}_[A-Z]{2}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;
const ALLOWED_OPEN_HOSTS = new Set(['mas.adobe.com']);
// Must match connect-src / host_permissions in manifest.json.
const ALLOWED_IO_HOSTS = new Set(['mas.adobe.com', 'www.adobe.com', 'www.stage.adobe.com']);

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

// Same contract as resolveMasIOUrl in web-components/src/utils.js (host or https url in,
// IO base url out), restricted to the IO hosts the extension is allowed to call.
function resolveMasIOUrl(value) {
    if (typeof value !== 'string' || !value) return undefined;
    let host = value;
    if (value.startsWith('https://')) {
        try {
            host = new URL(value).hostname;
        } catch {
            return undefined;
        }
    }
    return ALLOWED_IO_HOSTS.has(host) ? `https://${host}/mas/io` : undefined;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isValidUUID, isValidLocale, isValidCountry, isAllowedOpenUrl, resolveMasIOUrl };
}

if (typeof self !== 'undefined') {
    self.MASValidators = { isValidUUID, isValidLocale, isValidCountry, isAllowedOpenUrl, resolveMasIOUrl };
}
