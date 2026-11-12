export { getService } from './utilities.js';

const CTA_VARIANT_PATTERN = /^(accent|primary|secondary)(-(outline|link))?$/;

export function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
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
    const element = document.createElement(tag, is ? { is } : undefined);
    if (content instanceof HTMLElement) element.append(content);
    else element.innerHTML = content;
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    return element;
}

/** Adds `<style data-{name}>` with `text` to the document head once. */
export function injectStyle(name, text) {
    if (document.querySelector(`style[data-${name}]`)) return;
    const style = document.createElement('style');
    style.setAttribute(`data-${name}`, '');
    style.textContent = text;
    document.head.append(style);
}

/**
 * Creates the checkout-link replacing the stored `link`, keeping its attributes
 * (but `is` and `href`). Uses the service-backed factory, or upgrades a plain
 * anchor when the checkout-link element is not registered or not ready yet.
 * @param {HTMLAnchorElement} link anchor with a data-wcs-osi
 * @param {string} label inner markup of the checkout-link
 */
export function toCheckoutLink(link, label = link.innerHTML) {
    let button = customElements
        .get('checkout-link')
        ?.createCheckoutLink(link.dataset, label);
    if (!button) {
        button = document.createElement('a', { is: 'checkout-link' });
        button.setAttribute('is', 'checkout-link');
        button.innerHTML = `<span style="pointer-events: none;">${label}</span>`;
    }
    for (const { name, value } of link.attributes) {
        if (name !== 'is' && name !== 'href') button.setAttribute(name, value);
    }
    return button;
}

/** Resolves persisted CTA metadata before considering PR #1197's legacy wrapper-only encoding. */
export function getHeadlessCtaVariant(link) {
    const variant = [...link.classList].find((value) =>
        CTA_VARIANT_PATTERN.test(value),
    );
    if (variant) return variant;
    const wrapper = link.closest('strong, em')?.tagName;
    if (wrapper === 'STRONG') return 'primary';
    if (wrapper === 'EM') return 'secondary';
    return 'secondary-link';
}

/**
 * Hydrates fragment-consumed CTAs without requiring Milo to decorate their markup.
 * Legacy wrapper-only CTAs retain their variant; explicit classes take precedence
 * and move the strong/em wrapping the link into its label.
 * Kept independent of card hydration so standalone mas-field stays lightweight.
 */
export function hydrateHeadlessCta(link) {
    const variant = getHeadlessCtaVariant(link);
    const source = link.cloneNode(true);
    if (link.classList.contains(variant)) {
        let parent = link.parentElement;
        while (parent?.matches('strong, em')) {
            const label = source.firstElementChild;
            if (
                label?.tagName !== parent.tagName ||
                source.innerHTML.trim() !== label.outerHTML
            ) {
                const wrapper = source.ownerDocument.createElement(
                    parent.localName,
                );
                wrapper.append(...source.childNodes);
                source.append(wrapper);
            }
            parent = parent.parentElement;
        }
    }
    const button = link.dataset.wcsOsi
        ? toCheckoutLink(link, source.innerHTML)
        : source;
    button.classList.remove(
        ...[...button.classList].filter((value) =>
            CTA_VARIANT_PATTERN.test(value),
        ),
    );
    if (!variant.endsWith('-link')) {
        button.classList.add(
            'button',
            'con-button',
            variant === 'accent' || variant === 'primary' ? 'blue' : 'outline',
        );
    }
    return button;
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
 * Normalizes variant names for consistency.
 * Converts any variant starting with 'plans' to just 'plans'.
 * The 'pro' variant also normalizes to 'plans' so it shares the plans
 * merch-card-collection column classes and styling (it does not carry the
 * 'plans' prefix, so it needs an explicit mapping).
 * @param {string} variant - The variant name to normalize
 * @returns {string} The normalized variant name
 */
export function normalizeVariant(variant) {
    if (!variant) return variant;
    if (variant === 'bizpro') variant = 'pro'; // TODO(MWPW-200587): remove after content migration
    if (variant === 'pro') return 'plans';
    if (variant.startsWith('plans')) return 'plans';
    return variant;
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

const HTML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

/**
 * Escapes a value for use in HTML text or a quoted attribute.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHTML(value) {
    return String(value ?? '').replace(
        /[&<>"']/g,
        (char) => HTML_ESCAPES[char],
    );
}

const renderedNodes = new WeakMap();

/**
 * Replaces the markup a component rendered into its shadow root, keeping the
 * nodes other code added to it (for example Milo's MEP combo appends a style
 * and a subtitle), which a plain innerHTML assignment would drop.
 * @param {ShadowRoot} root
 * @param {string} markup
 */
export function setShadowMarkup(root, markup) {
    const own = renderedNodes.get(root);
    const foreign = [...root.childNodes].filter((node) => !own?.has(node));
    root.innerHTML = markup;
    renderedNodes.set(root, new Set(root.childNodes));
    root.append(...foreign);
}

/**
 * Shows the tax or term on the heading price only, or on the legal price when
 * the card displays annual prices (mini-compare-chart templates).
 */
export function keepInHeadingPriceForAnnual(
    card,
    headingPrice,
    legalPrice,
    optionParam,
) {
    if (card.settings?.displayAnnual && headingPrice?.options[optionParam]) {
        legalPrice.dataset[optionParam] = 'false';
    } else if (headingPrice?.options[optionParam]) {
        headingPrice.dataset[optionParam] = 'false';
    }
}
