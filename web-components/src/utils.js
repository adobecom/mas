import { EVENT_TYPE_READY } from './constants.js';

const MAS_COMMERCE_SERVICE = 'mas-commerce-service';

export function debounce(func, delay) {
    let debounceTimer;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

export const getSlotText = (element, name) =>
    element?.querySelector(`[slot="${name}"]`)?.textContent?.trim();

/**
 * Helper function to create an element with attributes
 * @param {string} tag
 * @param {Object} attributes
 * @param {*} content
 * @returns {HTMLElement}
 */
export function createTag(tag, attributes = {}, content = null, is = null) {
    const element = is
        ? document.createElement(tag, { is })
        : document.createElement(tag);
    if (content instanceof HTMLElement) {
        element.appendChild(content);
    } else {
        element.innerHTML = content;
    }

    // Set attributes
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    return element;
}

export function printMeasure(measure) {
    return `startTime:${measure.startTime.toFixed(2)}|duration:${measure.duration.toFixed(2)}`;
}

/**
 * Checks if the current device is mobile or tablet based on the screen width.
 * @returns {boolean} True if the device is mobile, otherwise false.
 */
export function isMobileOrTablet() {
    return window.matchMedia('(max-width: 1024px)').matches;
}

/* c8 ignore next 4 */
export function wait(ms = 1000) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const foregroundTimers = new Map();
let foregroundTimerId = 0;

/**
 * setTimeout that only counts down *foreground* time, i.e. time during which
 * document.visibilityState === 'visible'. A plain setTimeout burns its budget
 * against the wall clock, so work in a backgrounded tab or a paused in-app
 * webview (the paid-social cohort in MWPW-206151) trips the timeout on resume,
 * even though the work it races only ran for a few ms. Drop-in for the
 * setTimeout/clearTimeout pair: pause the budget while hidden, resume on show.
 * @param {() => void} callback invoked once the foreground budget elapses
 * @param {number} ms foreground budget in milliseconds
 * @returns {number} id to pass to clearForegroundTimeout
 */
export function setForegroundTimeout(callback, ms) {
    const id = ++foregroundTimerId;
    let remaining = ms;
    let startedAt = performance.now();
    let timer;
    const fire = () => {
        clearForegroundTimeout(id);
        callback();
    };
    const start = () => {
        startedAt = performance.now();
        timer = setTimeout(fire, remaining);
    };
    const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            clearTimeout(timer);
            remaining -= performance.now() - startedAt;
        } else {
            start();
        }
    };
    foregroundTimers.set(id, () => {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVisibilityChange);
    });
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (document.visibilityState !== 'hidden') start();
    return id;
}

/** Cancels a timer started with setForegroundTimeout. */
export function clearForegroundTimeout(id) {
    const dispose = foregroundTimers.get(id);
    if (!dispose) return;
    dispose();
    foregroundTimers.delete(id);
}

/**
 * Calls given `getConfig` every time new instance of the commerce service is activated,
 * passing new instance as the only argument.
 * @param {(commerce: Commerce.Instance) => void} getConfig
 * @param {{ once?: boolean; }} options
 * @returns {() => void}
 * A function, stopping notifications when called.
 */
export function discoverService(getConfig, { once = false } = {}) {
    let latest = null;
    function discover() {
        /** @type { Commerce.Instance } */
        const current = document.querySelector(MAS_COMMERCE_SERVICE);
        if (current === latest) return;
        latest = current;
        if (current) getConfig(current);
    }
    document.addEventListener(EVENT_TYPE_READY, discover, { once });
    setTimeout(discover, 0);
    return () => document.removeEventListener(EVENT_TYPE_READY, discover);
}

export function getService() {
    return document.getElementsByTagName(MAS_COMMERCE_SERVICE)?.[0];
}

export function historyPushState(queryParams) {
    if (!window.history.pushState) return;
    const newURL = new URL(window.location.href);
    newURL.search = queryParams;
    window.history.pushState({ path: newURL.href }, '', newURL.href);
}

export function updateHash(key, value) {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    hash.set(key, value);
    window.location.hash = hash.toString();
}

/**
 * Convert the query params to hash
 * @param {string[]} keys - The keys to convert to hash
 */
export function paramsToHash(keys = []) {
    keys.forEach((key) => {
        const urlParams = new URLSearchParams(window.location.search);
        const value = urlParams.get(key);
        if (!value) return;
        if (window.location.hash.includes(`${key}=`)) {
            // in case the key already exists in the hash, update the hash
            updateHash(key, value);
        } else {
            // otherwise, add the key to the hash
            window.location.hash = window.location.hash
                ? `${window.location.hash}&${key}=${value}`
                : `${key}=${value}`;
        }
        urlParams.delete(key);
        historyPushState(urlParams.toString());
    });
}

export function getOuterHeight(element) {
    const style = window.getComputedStyle(element);
    return (
        element.offsetHeight +
        parseFloat(style.marginTop) +
        parseFloat(style.marginBottom)
    );
}

/** strikethrough price followed with promo price, or with some short text (0 or 1 character) in between, needs to have labels hidden */
export function shouldHideStPriceLabels(element) {
    const nextElSibling =
        element.nextElementSibling?.nodeName === 'BR'
            ? element.nextElementSibling.nextElementSibling
            : element.nextElementSibling;
    return (
        element.dataset.template === 'strikethrough' &&
        (element.nextSibling?.nodeName !== '#text' ||
            element.nextSibling.textContent.trim().length < 2) &&
        nextElSibling?.isInlinePrice &&
        nextElSibling?.dataset?.template === 'price'
    );
}

const MASLIBS_PATTERN =
    /^([a-z0-9]+(-[a-z0-9]+)*)(--([a-z0-9]+(-[a-z0-9]+)*)){0,2}$/;
const MASLIBS_MAX_LENGTH = 100;
const MASLIBS_EXTENSIONS = ['live', 'page'];

/**
 * Validates the maslibs parameter and returns the base URL for MAS libraries.
 * Only branch, branch--repo and branch--repo--owner shapes are allowed, so
 * the resulting host always stays under aem.live / aem.page.
 * @param {string} masLibs raw maslibs parameter value
 * @param {string} extension aem domain extension: 'live' (default) or 'page'
 * @returns {string|null} base URL, or null if either value is missing or invalid
 */
export function getValidatedMasLibsUrl(masLibs, extension = 'live') {
    if (!masLibs || masLibs.trim() === '') return null;
    if (!MASLIBS_EXTENSIONS.includes(extension)) return null;
    const value = masLibs.trim().toLowerCase();
    if (value === 'local') return 'http://localhost:3000';
    if (value.length > MASLIBS_MAX_LENGTH || !MASLIBS_PATTERN.test(value)) {
        return null;
    }
    const branch = value.includes('--') ? value : `${value}--mas--adobecom`;
    let url;
    try {
        url = new URL(`https://${branch}.aem.${extension}`);
    } catch {
        // stricter URL parsers (e.g. Node) reject invalid punycode labels
        return null;
    }
    if (!url.hostname.endsWith(`.aem.${extension}`)) return null;
    return url.origin;
}

const ASSET_PROD_HOSTS = ['www.adobe.com', 'www.stage.adobe.com'];

/**
 * Rewrites an aem.live/aem.page asset URL to a relative path when the current
 * page is served from a production/stage adobe.com host, so preview-domain
 * URLs accidentally authored into content don't leak into production markup.
 * @param {string} url
 * @param {string} currentHostname defaults to window.location.hostname (injectable for tests)
 * @returns {string} the relative path if rewritten, otherwise the original url
 */
export function toRelativeAssetUrl(
    url,
    currentHostname = window.location.hostname,
) {
    if (!url) return url;
    if (!ASSET_PROD_HOSTS.includes(currentHostname)) return url;
    try {
        const parsed = new URL(url, `https://${currentHostname}`);
        if (!/\.aem\.(live|page)$/.test(parsed.hostname)) return url;
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return url;
    }
}

const MAS_IO_RUNTIME_NAMESPACE = /^14257-merchatscale(-[a-z0-9-]+)?$/;
const MAS_IO_RUNTIME_HOST =
    /^(14257-merchatscale(-[a-z0-9-]+)?)\.adobeioruntime\.net$/;
const MAS_IO_RUNTIME_WORKSPACE = /^[a-z0-9-]+$/;
const MAS_IO_ADOBE_HOST = /^([a-z0-9-]+\.)+adobe\.com$/;
const MAS_IO_RUNTIME_PATH = '/api/v1/web/MerchAtScale';

const runtimeUrl = (namespace) =>
    `https://${namespace}.adobeioruntime.net${MAS_IO_RUNTIME_PATH}`;

function resolveMasIOHost(host) {
    const namespace = MAS_IO_RUNTIME_HOST.exec(host)?.[1];
    if (namespace) return runtimeUrl(namespace);
    if (MAS_IO_ADOBE_HOST.test(host)) return `https://${host}/mas/io`;
    return undefined;
}

/**
 * Builds the MAS IO base url from a mas-io-url value. Only the host is kept,
 * protocol and path are always added here, so the fragment payload (rendered as card HTML)
 * can only come from an Adobe-controlled origin.
 * Accepted values (full https urls with one of these hosts are accepted too):
 * - `axel`, `14257-merchatscale-axel` or `14257-merchatscale-axel.adobeioruntime.net` (I/O Runtime workspace)
 * - `www.stage.adobe.com` (I/O Runtime behind the adobe.com CDN)
 * @param {string} value
 * @returns {string|undefined} the resolved url, or undefined if the value is not allowed
 */
export function resolveMasIOUrl(value) {
    if (!value) return undefined;
    if (value.startsWith('https://')) {
        try {
            return resolveMasIOHost(new URL(value).hostname);
        } catch {
            return undefined;
        }
    }
    if (MAS_IO_RUNTIME_NAMESPACE.test(value)) return runtimeUrl(value);
    if (MAS_IO_RUNTIME_WORKSPACE.test(value))
        return runtimeUrl(`14257-merchatscale-${value}`);
    return resolveMasIOHost(value);
}
