import {
    EVENT_AEM_ERROR,
    EVENT_AEM_LOAD,
    EVENT_TYPE_READY,
    MARK_DURATION_SUFFIX,
    MARK_START_SUFFIX,
} from './constants.js';
import { getImsCountryCookie } from './ims.js';
import { getLogHeaders, getParameter } from './utilities.js';
import {
    getService,
    getValidatedMasLibsUrl,
    injectStyle,
    printMeasure,
} from './utils.js';
import { masFetch } from './utils/mas-fetch.js';
import { normalizeExplicitEmptyInFields } from '../../io/www/src/fragment/utils/explicit-empty.js';

const AEM_FRAGMENT_TAG_NAME = 'aem-fragment';
const LOADING_EAGER = 'eager';
const LOADING_CACHE = 'cache';
const FETCH_OPTIONS = { cache: 'default', credentials: 'same-origin' };
/** Merged from a fragment into the fragments it references, see FragmentCache#add. */
const INHERITED_KEYS = [
    'settings',
    'placeholders',
    'dictionary',
    'priceLiterals',
];

class FragmentCache {
    /** key → { fragment, fetchInfo, promise, resolve } */
    #entries = new Map();

    #entry(key) {
        let entry = this.#entries.get(key);
        if (!entry) this.#entries.set(key, (entry = {}));
        return entry;
    }

    /**
     * Adds a fragment under its id and its originalId (the requested default-locale id),
     * then the content fragments it references, which inherit its settings,
     * placeholders, dictionary and price literals. Ids already cached are kept.
     * @param {Object} fragment
     * @param {boolean} references whether to add the referenced fragments
     */
    add(fragment, references = true) {
        const keys = [fragment.id, fragment.fields?.originalId].filter(
            (key) => key && !this.has(key),
        );
        if (!keys.length) return;
        for (const key of keys) this.set(key, fragment);
        if (!references || Array.isArray(fragment.references)) return;
        for (const { type, value } of Object.values(
            fragment.references ?? {},
        )) {
            if (type !== 'content-fragment') continue;
            for (const key of INHERITED_KEYS) {
                value[key] = { ...fragment[key], ...value[key] };
            }
            this.add(value);
        }
    }

    has(key) {
        return this.get(key) !== undefined;
    }

    *entries() {
        for (const [key, { fragment }] of this.#entries) {
            if (fragment !== undefined) yield [key, fragment];
        }
    }

    get(key) {
        return this.#entries.get(key)?.fragment;
    }

    /** Resolves once a fragment is cached under `key`. */
    getAsPromise(key) {
        const entry = this.#entry(key);
        entry.promise ??= this.has(key)
            ? Promise.resolve()
            : new Promise((resolve) => {
                  entry.resolve = resolve;
              });
        return entry.promise;
    }

    getFetchInfo(key) {
        return (this.#entry(key).fetchInfo ??= {
            url: null,
            retryCount: 0,
            stale: false,
            measure: null,
            status: null,
        });
    }

    set(key, fragment) {
        const entry = this.#entry(key);
        entry.fragment = fragment;
        entry.resolve?.();
        delete entry.resolve;
    }

    /**
     * Drops the fragment and fetch info of `key`. A pending getAsPromise is kept,
     * so a loading="cache" element still resolves when the fragment is cached
     * again, instead of waiting out its timeout.
     */
    remove(key) {
        const { promise, resolve } = this.#entries.get(key) ?? {};
        if (resolve) this.#entries.set(key, { promise, resolve });
        else this.#entries.delete(key);
    }

    clear() {
        for (const key of this.#entries.keys()) this.remove(key);
    }
}

const cache = new FragmentCache();

/** Flattens author (Studio) fields, [{ name, multiple, values }], to the publish shape. */
const authorFields = (fields) =>
    Object.fromEntries(
        normalizeExplicitEmptyInFields(fields).map(
            ({ name, multiple, values }) => [
                name,
                multiple ? values : values[0],
            ],
        ),
    );

const publishFields = (fields) =>
    Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [
            key,
            value?.mimeType ? value.value : (value ?? ''),
        ]),
    );

/** The `data` of a raw fragment: its flattened fields and metadata. */
function toData(
    {
        fields,
        id,
        tags,
        settings = {},
        priceLiterals = {},
        dictionary = {},
        maskId,
        placeholders = {},
        variationId,
        promoProject,
        promoVariationProject,
        cdtStart,
        cdtEnd,
        previewLocale,
    },
    author,
) {
    return {
        fields: author ? authorFields(fields) : publishFields(fields),
        id,
        tags,
        settings,
        priceLiterals,
        dictionary,
        maskId,
        placeholders,
        variationId,
        promoProject,
        promoVariationProject,
        cdtStart,
        cdtEnd,
        previewLocale,
    };
}

injectStyle(
    AEM_FRAGMENT_TAG_NAME,
    `${AEM_FRAGMENT_TAG_NAME}{display:contents}`,
);

/**
 * Custom element representing an aem fragment.
 *
 * @attr {string} title - fragment title, optional.
 * @attr {string} fragment - fragment id.
 */
export class AemFragment extends HTMLElement {
    static cache = cache;
    cache = cache; // TO be deprecated

    static observedAttributes = [
        'fragment',
        'loading',
        'timeout',
        'author',
        'preview',
        'mask',
        'pzn',
    ];

    #log;
    #service;
    #rawData = null;
    #data = null;
    #fragmentId;
    #mask;
    #pzn;
    #cacheKey;
    #fetchInfo;
    #loading = LOADING_EAGER;
    #timeout = 5000;
    #author = false;
    #preview;
    /** Settles with the fetch of the last refresh; null after a failure. */
    #fetchPromise;
    #refreshing = false;
    #fetchCount = 0;

    cacheKey() {
        return this.#cacheKey;
    }

    attributeChangedCallback(name, oldValue, value) {
        switch (name) {
            case 'loading':
                if (value === LOADING_EAGER || value === LOADING_CACHE) {
                    this.#loading = value;
                }
                return;
            case 'timeout':
                this.#timeout = parseInt(value, 10);
                return;
            case 'author':
                this.#author = value === '' || value === 'true';
                return;
            case 'preview':
                this.#preview = value;
                return;
            case 'fragment':
                this.#fragmentId = value;
                break;
            case 'mask':
                this.#mask = value;
                break;
            default:
                this.#pzn = value;
        }
        this.#cacheKey = `${this.#fragmentId}${this.#pzn ? `-p_${this.#pzn}` : ''}${this.#mask ? `-m_${this.#mask}` : ''}`;
        this.#fetchInfo = cache.getFetchInfo(this.#cacheKey);
    }

    connectedCallback() {
        if (this.#fetchPromise) return;
        this.#service = getService();
        if (!this.#service?.settings) {
            document.addEventListener(
                EVENT_TYPE_READY,
                () => {
                    if (this.isConnected) this.connectedCallback();
                },
                { once: true },
            );
            return;
        }
        // The service setting wins over the preview attribute set before connection.
        this.#preview = this.#service.settings.preview;
        this.#log ??= this.#service.log.module(
            `${AEM_FRAGMENT_TAG_NAME}[${this.#fragmentId}]`,
        );
        // TODO get rid of the special case for #
        if (!this.#fragmentId || this.#fragmentId === '#') {
            this.#fetchInfo ??= cache.getFetchInfo('missing-fragment-id');
            this.#fail('Missing fragment id');
            return;
        }
        this.refresh(false);
    }

    get fetchInfo() {
        return Object.fromEntries(
            Object.entries(this.#fetchInfo)
                .filter(([, value]) => value != null)
                .map(([key, value]) => [`aem-fragment:${key}`, value]),
        );
    }

    async refresh(flushCache = true) {
        if (this.#refreshing) return undefined;
        this.#refreshing = true;
        try {
            if (flushCache) cache.remove(this.#cacheKey);
            if (this.#loading === LOADING_CACHE) {
                await Promise.race([
                    cache.getAsPromise(this.#cacheKey),
                    new Promise((resolve) =>
                        setTimeout(resolve, this.#timeout),
                    ),
                ]);
            }
            this.#fetchPromise = this.#fetchData();
            await this.#fetchPromise;
        } catch (error) {
            this.#fail(error.message);
            return false;
        } finally {
            this.#refreshing = false;
        }
        const { references, referencesTree, placeholders, wcs } = this.#rawData;
        if (wcs && !getParameter('mas.disableWcsCache')) {
            this.#service.prefillWcsCache(wcs);
        }
        this.dispatchEvent(
            new CustomEvent(EVENT_AEM_LOAD, {
                detail: {
                    ...this.data,
                    references,
                    referencesTree,
                    placeholders,
                    ...this.#fetchInfo,
                },
                bubbles: true,
                composed: true,
            }),
        );
        return true;
    }

    #fail(message) {
        this.#fetchPromise = null;
        this.#fetchInfo.message = message;
        this.classList.add('error');
        const detail = { ...this.#fetchInfo, ...this.#service.duration };
        this.#log.error(message, detail);
        this.dispatchEvent(
            new CustomEvent(EVENT_AEM_ERROR, {
                detail,
                bubbles: true,
                composed: true,
            }),
        );
    }

    async #fetchData() {
        this.classList.remove('error');
        this.#data = null;
        let fragment = cache.get(this.#cacheKey);
        if (!fragment) {
            fragment = await this.#getFragment();
            fragment.fields.originalId ??= this.#fragmentId;
            if (this.#mask || this.#pzn) cache.set(this.#cacheKey, fragment);
            else cache.add(fragment);
        }
        this.#rawData = fragment;
        return true;
    }

    /** The fragment from the preview client, or from MAS IO (stale data when that fails). */
    async #getFragment() {
        if (this.#preview) {
            const { status, body, message } = await this.generatePreview();
            if (status === 200) return body;
            throw new Error(`Failed to generate preview: ${message}`);
        }
        const info = this.#fetchInfo;
        const mark = `${AEM_FRAGMENT_TAG_NAME}:${this.#cacheKey}:${++this.#fetchCount}`;
        const start = `${mark}${MARK_START_SUFFIX}`;
        performance.mark(start);
        info.stale = false;
        info.url = this.#url();
        try {
            const response = await masFetch(info.url, FETCH_OPTIONS).finally(
                () => {
                    info.measure = printMeasure(
                        performance.measure(
                            `${mark}${MARK_DURATION_SUFFIX}`,
                            start,
                        ),
                    );
                },
            );
            Object.assign(info, getLogHeaders(response), {
                status: response.status,
                retryCount: response.retryCount,
            });
            // The status is in the fetch info, logged and dispatched by #fail.
            if (!response.ok) throw new Error('Unexpected fragment response');
            return await response.json();
        } catch (error) {
            info.retryCount = error.retryCount ?? info.retryCount;
            if (!this.#rawData) {
                throw new Error(`Failed to fetch fragment: ${error.message}`);
            }
            info.stale = true;
            this.#log.error('Serving stale data', info);
            return this.#rawData;
        }
    }

    #url() {
        const {
            masIOUrl,
            wcsApiKey,
            country: configuredCountry,
            hasExplicitCountry,
            locale,
            instant,
        } = this.#service.settings;
        const country = hasExplicitCountry
            ? configuredCountry
            : (getImsCountryCookie() ?? configuredCountry);
        const params = {
            id: this.#fragmentId,
            api_key: wcsApiKey,
            locale,
            country: locale.endsWith(`_${country}`) ? null : country,
            instant,
            mask: this.#mask,
            pzn: this.#pzn,
        };
        // Values are not percent-encoded: MAS IO and the CDN cache key use them as is.
        const query = Object.entries(params)
            .filter(([, value]) => value)
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
        return `${masIOUrl}/fragment?${query}`;
    }

    get updateComplete() {
        return (
            this.#fetchPromise ??
            Promise.reject(new Error('AEM fragment cannot be loaded'))
        );
    }

    get data() {
        return (this.#data ??=
            this.#rawData && toData(this.#rawData, this.#author));
    }

    get rawData() {
        return this.#rawData;
    }

    /**
     * Gets the URL for loading fragment-client.js based on maslibs parameter
     * @returns {string} URL for fragment-client.js
     */
    getFragmentClientUrl() {
        const { search, hostname } = window.location;
        const baseUrl =
            getValidatedMasLibsUrl(
                new URLSearchParams(search).get('maslibs'),
                hostname.endsWith('.page') ? 'page' : 'live',
            ) ?? 'https://mas.adobe.com';
        return `${baseUrl}/studio/libs/fragment-client.js`;
    }

    async generatePreview() {
        const { previewFragment } = await import(this.getFragmentClientUrl());
        const { locale, wcsApiKey: apiKey, instant } = this.#service.settings;
        const options = { locale, apiKey, fullContext: true };
        const instantValue =
            new URLSearchParams(window.location.search).get('instant') ??
            instant;
        if (instantValue != null) options.instant = instantValue;
        if (this.#mask != null) options.mask = this.#mask;
        if (this.#pzn != null) options.pzn = this.#pzn;
        return previewFragment(this.#fragmentId, options);
    }
}

customElements.define(AEM_FRAGMENT_TAG_NAME, AemFragment);
