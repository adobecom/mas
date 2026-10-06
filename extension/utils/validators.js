const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCALE_RE = /^[a-z]{2}_[A-Z]{2}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;
const ALLOWED_OPEN_HOSTS = new Set(['mas.adobe.com']);
const MAS_IO_RUNTIME_NAMESPACE = /^14257-merchatscale(-[a-z0-9-]+)?$/;
const MAS_IO_RUNTIME_HOST = /^(14257-merchatscale(-[a-z0-9-]+)?)\.adobeioruntime\.net$/;
const MAS_IO_RUNTIME_WORKSPACE = /^[a-z0-9-]+$/;
const MAS_IO_ADOBE_HOST = /^([a-z0-9-]+\.)+adobe\.com$/;
const MAS_IO_RUNTIME_PATH = '/api/v1/web/MerchAtScale';

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

const runtimeUrl = (namespace) => `https://${namespace}.adobeioruntime.net${MAS_IO_RUNTIME_PATH}`;

function resolveMasIOHost(host) {
    const namespace = MAS_IO_RUNTIME_HOST.exec(host)?.[1];
    if (namespace) return runtimeUrl(namespace);
    if (MAS_IO_ADOBE_HOST.test(host)) return `https://${host}/mas/io`;
    return undefined;
}

// Mirrors resolveMasIOUrl in web-components/src/utils.js: only the host is
// read from the page, protocol and path are always added here.
function resolveMasIOUrl(value) {
    if (typeof value !== 'string' || !value) return undefined;
    if (value.startsWith('https://')) {
        try {
            return resolveMasIOHost(new URL(value).hostname);
        } catch {
            return undefined;
        }
    }
    if (MAS_IO_RUNTIME_NAMESPACE.test(value)) return runtimeUrl(value);
    if (MAS_IO_RUNTIME_WORKSPACE.test(value)) return runtimeUrl(`14257-merchatscale-${value}`);
    return resolveMasIOHost(value);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isValidUUID, isValidLocale, isValidCountry, isAllowedOpenUrl, resolveMasIOUrl };
}

if (typeof self !== 'undefined') {
    self.MASValidators = { isValidUUID, isValidLocale, isValidCountry, isAllowedOpenUrl, resolveMasIOUrl };
}
