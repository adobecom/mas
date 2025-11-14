import fetch from 'node-fetch';
import fs from 'fs';

const AUDIT_TARGET = {
    ost: 'ost',
    modal: 'modal',
};
const BUFFER_SIZE = 100;
const EXCERPT_SIZE = 30;
const LOC_REGEXP = '<loc>(?<url>[^<]+)</loc>';
const PERSO_REGEXP = '<meta name="personalization" content="(?<urls>[^"]+)">';
const HREF_REGEXP = 'href="(?<url>[^"]+)"';
const LINK_REGEXP = `<a[^>]*${HREF_REGEXP}[^>]*>[^<]*</a>`;
const PARAMETER_REGEXP = '(?<left>\\w+)=(?<right>[^&]+)';
const DOMAIN_REGEXP = '^https://[^/]+';
// Constants for preventing hanging
const MAX_FETCH_TIMEOUT = 5000; // 5 seconds timeout for fetch requests
const MAX_RETRY_ATTEMPTS = 3; // Maximum number of retry attempts
const MAX_RECURSION_DEPTH = 10; // Maximum recursion depth for fragment processing

const HREF_REGEXPS = {
    [AUDIT_TARGET.ost]: {
        fragment: '/fragments/',
        ost: 'https://milo.adobe.com/tools/ost?(?<parameters>.+)',
    },
    [AUDIT_TARGET.modal]: {
        fragment: '/fragments/',
        iframes: '(/mini-plans/|/modals-content-rich/)',
    },
};
const LOCALES = [
    'au',
    'cn',
    'hk_en',
    'hk_zh',
    'id_en',
    'id_id',
    'in',
    'in_hi',
    'kr',
    'my_en',
    'my_ms',
    'nz',
    'ph_en',
    'ph_fil',
    'sg',
    'th_en',
    'th_th',
    'tw',
    'vn_en',
    'vn_vi',
    'ae_en',
    'ae_ar',
    'africa',
    'at',
    'be_en',
    'be_fr',
    'be_nl',
    'bg',
    'ch_de',
    'ch_fr',
    'ch_it',
    'cis_en',
    'cis_ru',
    'cz',
    'de',
    'dk',
    'ee',
    'eg_ar',
    'eg_en',
    'es',
    'fi',
    'fr',
    'gr_el',
    'gr_en',
    'hu',
    'ie',
    'il_en',
    'il_he',
    'iq',
    'is',
    'it',
    'kw_ar',
    'kw_en',
    'lt',
    'lu_de',
    'lu_en',
    'lu_fr',
    'lv',
    'mena_ar',
    'mena_en',
    'ng',
    'nl',
    'no',
    'pl',
    'pt',
    'qa_ar',
    'qa_en',
    'ro',
    'ru',
    'sa_en',
    'sa_ar',
    'se',
    'si',
    'sk',
    'tr',
    'ua',
    'uk',
    'za',
    'ar',
    'br',
    'ca',
    'ca_fr',
    'cl',
    'co',
    'cr',
    'ec',
    'gt',
    'la',
    'mx',
    'pe',
    'pr',
    'jp',
];
const GeoMap = {
    ar: 'AR_es',
    be_en: 'BE_en',
    be_fr: 'BE_fr',
    be_nl: 'BE_nl',
    br: 'BR_pt',
    ca: 'CA_en',
    ch_de: 'CH_de',
    ch_fr: 'CH_fr',
    ch_it: 'CH_it',
    cl: 'CL_es',
    co: 'CO_es',
    la: 'DO_es',
    mx: 'MX_es',
    pe: 'PE_es',
    africa: 'ZA_en',
    dk: 'DK_da',
    de: 'DE_de',
    ee: 'EE_et',
    eg_ar: 'EG_ar',
    eg_en: 'EG_en',
    es: 'ES_es',
    fr: 'FR_fr',
    gr_el: 'GR_el',
    gr_en: 'GR_en',
    ie: 'IE_en',
    il_he: 'IL_iw',
    it: 'IT_it',
    lv: 'LV_lv',
    lt: 'LT_lt',
    lu_de: 'LU_de',
    lu_en: 'LU_en',
    lu_fr: 'LU_fr',
    my_en: 'MY_en',
    my_ms: 'MY_ms',
    hu: 'HU_hu',
    mt: 'MT_en',
    mena_en: 'DZ_en',
    mena_ar: 'DZ_ar',
    nl: 'NL_nl',
    no: 'NO_nb',
    pl: 'PL_pl',
    pt: 'PT_pt',
    ro: 'RO_ro',
    si: 'SI_sl',
    sk: 'SK_sk',
    fi: 'FI_fi',
    se: 'SE_sv',
    tr: 'TR_tr',
    uk: 'GB_en',
    at: 'AT_de',
    cz: 'CZ_cs',
    bg: 'BG_bg',
    ru: 'RU_ru',
    ua: 'UA_uk',
    au: 'AU_en',
    in_en: 'IN_en',
    in_hi: 'IN_hi',
    id_en: 'ID_en',
    id_id: 'ID_in',
    nz: 'NZ_en',
    sa_ar: 'SA_ar',
    sa_en: 'SA_en',
    sg: 'SG_en',
    cn: 'CN_zh-Hans',
    tw: 'TW_zh-Hant',
    hk_zh: 'HK_zh-hant',
    jp: 'JP_ja',
    kr: 'KR_ko',
    za: 'ZA_en',
    ng: 'NG_en',
    cr: 'CR_es',
    ec: 'EC_es',
    pr: 'US_es',
};
const wcsUrl = (osi, locale) =>
    `https://wcs.adobe.com/web_commerce_artifact?offer_selector_ids=${osi}&country=${locale.country}&language=${locale.country === 'GB' ? 'EN' : 'MULT'}&locale=${locale.locale}&api_key=wcms-commerce-ims-ro-user-milo&landscape=PUBLISHED`;
const mapWcs = {};
const WCS_KEYS = [
    'offerId',
    'productArrangementCode',
    'commitment',
    'term',
    'customerSegment',
    'marketSegments',
    'offerType',
    'productArrangement.productCode',
    'productArrangement.productFamily',
    'pricePoint',
    'priceDetails.price',
    'priceDetails.priceWithoutTax',
    'priceDetails.priceWithoutDiscount',
    'priceDetails.priceWithoutDiscountAndTax',
];
const retries = new Set();
const fetched = new Set();
const foundUsages = [];
let file = '/tmp/audit.csv';
let auditTarget = AUDIT_TARGET.ost;
let defaultBufferSize = BUFFER_SIZE;
let isDebug = false;

// Add this global cache for manifests
const manifestCache = new Map();

const convertRelativeToAbsoluteUrl = (url) => {
    if (!url) {
        console.log('Warning: Empty URL passed to convertRelativeToAbsoluteUrl');
        return '';
    }

    try {
        if (url[0] === '/') return `https://www.adobe.com${url}`;
        return url;
    } catch (error) {
        console.log(`Error in convertRelativeToAbsoluteUrl: ${error.message} for URL: ${url}`);
        return url || '';
    }
};

const getUriAndDomain = (url) => {
    if (!url) {
        console.log('Warning: Empty URL passed to getUriAndDomain');
        return { domain: '', uri: '' };
    }

    const match = new RegExp(DOMAIN_REGEXP).exec(url);
    if (!match) {
        console.log(`Warning: URL does not match domain pattern: ${url}`);
        // Try to extract domain safely
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return {
            domain: `${urlObj.protocol}//${urlObj.hostname}`,
            uri: urlObj.pathname + urlObj.search + urlObj.hash,
        };
    }

    const domain = match[0];
    return {
        domain,
        uri: url.substring(domain.length),
    };
};

const fetchDocument = async (url) => {
    if (!url) {
        console.log('Warning: Empty URL passed to fetchDocument');
        throw new Error('Empty URL passed to fetchDocument');
    }
    const normalizedUrl = normalizeUrl(url);

    console.log(`fetching ${url}...`);

    // Add timeout to fetch requests to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MAX_FETCH_TIMEOUT);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        // Rethrow to be handled by the caller
        throw error;
    }
};

const normalizeUrl = (url) => {
    if (!url) return '';

    try {
        // Remove trailing slashes, normalize case for protocol and domain
        let normalized = url.trim().toLowerCase();

        // Handle URL variations
        if (normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }

        return normalized;
    } catch (error) {
        console.log(`Error normalizing URL ${url}: ${error.message}`);
        return url;
    }
};

const getLiveUrl = (url) => url.replaceAll('.aem.page', '.aem.live').replaceAll('.hlx.page', '.aem.live');

async function getFragmentsFromManifest(url) {
    if (!url) {
        console.log('Warning: Empty URL passed to getFragmentsFromManifest');
        return [];
    }

    const normalizedUrl = normalizeUrl(url);

    // Check cache first
    if (manifestCache.has(normalizedUrl)) {
        if (isDebug) console.log(`Using cached manifest for ${url}`);
        return manifestCache.get(normalizedUrl);
    }

    // Also check if already in fetched map to avoid duplicate processing
    if (fetched.has(normalizedUrl)) {
        if (isDebug) console.log(`Manifest URL already fetched: ${url}`);
        // Return empty array as we don't have cached fragments but URL was processed
        manifestCache.set(normalizedUrl, []);
        return [];
    }

    // Add to fetched set to mark as processed
    fetched.add(normalizedUrl);

    const fragments = [];
    try {
        const liveUrl = getLiveUrl(normalizedUrl);

        // Add debug output to monitor requests
        if (isDebug) console.log(`Fetching manifest: ${liveUrl}`);

        const response = await fetchDocument(liveUrl);

        if (!response || !response.ok) {
            console.log(`Failed to fetch manifest from ${liveUrl}: ${response?.status || 'unknown error'}`);
            manifestCache.set(normalizedUrl, fragments);
            return fragments;
        }

        let manifest;
        try {
            manifest = await response.json();
        } catch (error) {
            console.log(`Error parsing JSON from ${liveUrl}: ${error.message}`);
            manifestCache.set(normalizedUrl, fragments);
            return fragments;
        }

        if (!manifest || !manifest.experiences || !manifest.experiences.data) {
            manifestCache.set(normalizedUrl, fragments);
            return fragments;
        }

        manifest.experiences.data.forEach((data) => {
            if (!data) return;

            Object.values(data)
                .filter((value) => value !== null && value !== undefined)
                .map((value) => /^https:\/\/.+/.exec(value)?.[0])
                .filter((value) => value != null)
                .map((url) => {
                    // Normalize fragment URLs too
                    const fragmentUrl = getLiveUrl(url);
                    const normalizedFragmentUrl = normalizeUrl(fragmentUrl);
                    fragments.push(normalizedFragmentUrl);
                    return normalizedFragmentUrl;
                });
        });

        // Store in cache
        manifestCache.set(normalizedUrl, fragments);
    } catch (error) {
        console.log(`Error while fetching manifest: ${error.message}`);
        // Cache the empty result so we don't retry
        manifestCache.set(normalizedUrl, fragments);
    }

    return fragments;
}

async function getPersonalizationFragments(pageContent) {
    if (!pageContent) {
        return null;
    }

    try {
        const persoRegexp = new RegExp(PERSO_REGEXP, 'g').exec(pageContent);
        if (!persoRegexp || !persoRegexp.groups || !persoRegexp.groups.urls) {
            return null;
        }

        const fragments = new Set();
        const { urls } = persoRegexp.groups;

        if (!urls) {
            return null;
        }

        const urlArr = urls
            .replace('\s', '')
            .split(',')
            .filter((url) => url && url.trim());

        // Filter out URLs that have already been processed
        const uniqueUrls = urlArr.filter((url) => {
            const normalizedUrl = normalizeUrl(url);
            return !fetched.has(normalizedUrl);
        });

        if (isDebug) {
            console.log(`Found ${urlArr.length} personalization URLs, ${uniqueUrls.length} unique`);
        }

        // Process unique URLs
        for (const url of uniqueUrls) {
            try {
                const normalizedUrl = normalizeUrl(url);
                // Mark as fetched before processing to prevent concurrent processing
                fetched.add(normalizedUrl);

                const manifestFragments = await getFragmentsFromManifest(url);
                if (manifestFragments && manifestFragments.length) {
                    manifestFragments.forEach((fragment) => fragments.add(fragment));
                }
            } catch (error) {
                console.log(`Error processing manifest fragments for URL ${url}: ${error.message}`);
            }
        }

        return Array.from(fragments);
    } catch (error) {
        console.log(`Error in getPersonalizationFragments: ${error.message}`);
        return null;
    }
}

const extractLinks = (pageContent) => {
    if (!pageContent || typeof pageContent !== 'string') {
        console.log('Warning: Invalid pageContent passed to extractLinks');
        return {};
    }

    const result = {};
    const linkRegexp = new RegExp(LINK_REGEXP, 'g');
    let match;

    try {
        while ((match = linkRegexp.exec(pageContent)) != null) {
            if (!match.groups || !match.groups.url) continue;

            const { url } = match.groups;
            const indexEnd = match.index + match[0].length;
            const postExcerpt = pageContent.substring(indexEnd, indexEnd + EXCERPT_SIZE).replaceAll(/[,\n\s]+/g, '');

            // Only process if auditTarget is defined
            if (!auditTarget || !HREF_REGEXPS[auditTarget]) {
                continue;
            }

            Object.entries(HREF_REGEXPS[auditTarget]).forEach(([type, pattern]) => {
                try {
                    const patternMatch = new RegExp(pattern).exec(url);
                    if (patternMatch) {
                        result[type] ??= [];
                        result[type].push({
                            patternMatch,
                            postExcerpt,
                        });
                    }
                } catch (error) {
                    console.log(`Error matching pattern for ${type}: ${error.message}`);
                }
            });
        }
    } catch (error) {
        console.log(`Error in extractLinks: ${error.message}`);
    }

    if (isDebug) {
        console.log(`extracted ${JSON.stringify(result)}`);
    }
    return result;
};

const searchStringMatch = (pageContent, searchStrings) => {
    let match = false;
    let index = 0;
    if (!searchStrings || searchStrings.length == 0) {
        return false;
    }
    const lowerCase = pageContent.toLowerCase();
    while (!match && index < searchStrings.length) {
        match = lowerCase.indexOf(searchStrings[index++]) >= 0;
    }
    return match;
};

const prefixWcsKey = (key) => `wcs ${key}`;

function getLocaleSettings(locale) {
    if (!locale) {
        return {
            country: 'US',
            language: 'en',
            locale: 'en_US',
        };
    }
    let [country = 'US', language = 'en'] = (GeoMap[locale] ?? locale).split('_', 2);

    country = country.toUpperCase();
    language = language.toLowerCase();

    return {
        country,
        language,
        locale: `${language}_${country}`,
    };
}

async function setCommerceData(osi, locale) {
    const localeSettings = getLocaleSettings(locale);
    const response = await fetchDocument(wcsUrl(osi, localeSettings));
    const data = {};
    if (response.ok) {
        const json = await response.json();
        const offer = json.resolvedOffers[0];
        if (offer) {
            WCS_KEYS.forEach((key) => {
                let subkeys = key.split('.');
                let object = offer;
                while (subkeys?.length > 0) {
                    const subkey = subkeys[0];
                    subkeys = subkeys.slice(1);
                    object = object[subkey];
                }
                data[prefixWcsKey(key)] = object;
            });
        }
    }
    if (Object.keys(data).length == 0) {
        console.log(`no data for osi ${osi}`);
    }
    mapWcs[osi] = data;
}

function extractOstUsage(ctx, parameterString, postExcerpt, collection) {
    const parameterMatches = new RegExp(PARAMETER_REGEXP, 'g');
    const entry = { ...ctx, postExcerpt };
    let match;
    while ((match = parameterMatches.exec(parameterString)) != null) {
        const { left, right } = match.groups;
        entry[left] = right;
        keys.add(left);
    }
    if (entry.osi) {
        mapWcs[entry.osi] = {};
        if (ctx.localeRewrite) {
            mapWcs[entry.osi].locale = ctx.localeRewrite;
        }
    }
    collection.push(entry);
}

async function extractUrlsFromSiteMap(sitemapUrl) {
    const response = await fetchDocument(sitemapUrl);
    const sitemapContent = await response.text();
    const listedUrls = new Set();
    const linkRegexp = new RegExp(LOC_REGEXP, 'g');
    let match;
    while ((match = linkRegexp.exec(sitemapContent)) != null) {
        const { url } = match.groups;
        listedUrls.add(url);
    }
    return Array.from(listedUrls);
}

const rewriteUrlLocale = (localeRewrite, url) => {
    if (!localeRewrite || !url) return url;
    if (url.indexOf(`/${localeRewrite}/`) < 0) {
        const { domain, uri } = getUriAndDomain(url);
        return `${domain}/${localeRewrite}/${uri.substring(1)}`;
    }
    return url;
};

const ostUsages = [];
const searchMatches = [];
const keys = new Set();
let searchFile;

async function auditPage(ctx, pageUrl, depth = 0) {
    // Validate inputs
    if (!pageUrl) {
        console.log('Warning: Empty URL passed to auditPage');
        return;
    }

    if (!ctx) {
        ctx = { origin: pageUrl };
    }

    // Add depth tracking to prevent infinite recursion
    if (depth > MAX_RECURSION_DEPTH) {
        console.log(`Maximum recursion depth reached for ${pageUrl}, stopping`);
        return;
    }

    try {
        const { localeRewrite, origin } = ctx;
        let url = convertRelativeToAbsoluteUrl(pageUrl);
        url = rewriteUrlLocale(localeRewrite, url);

        // Normalize URL for caching
        const normalizedUrl = normalizeUrl(url);

        // Already fetched & parsed - Check with normalized URL
        if (fetched.has(normalizedUrl)) {
            if (isDebug) console.log(`Skipping already fetched URL: ${url}`);
            return;
        }

        // Add to fetched set immediately to prevent concurrent duplicate requests
        fetched.add(normalizedUrl);

        const response = await fetchDocument(url);
        if (!response || !response.ok) {
            console.log(`Error (${origin}): response status for ${response?.url || url} is ${response?.status || 'unknown'}`);
            return;
        } else if (isDebug) {
            console.log(`Success: response status for ${url} is 200`);
        }

        // Process locale info
        try {
            if (url === origin) {
                const { uri } = getUriAndDomain(url);
                if (uri) {
                    const firstToken = uri.substring(1).split('/')[0];
                    ctx.localeRewrite = LOCALES.indexOf(firstToken) >= 0 ? firstToken : null;
                }
            } else {
                ctx.fragment = url;
            }
        } catch (error) {
            console.log(`Error processing locale for ${url}: ${error.message}`);
        }

        // Get and process content
        let content;
        try {
            content = await response.text();
        } catch (error) {
            console.log(`Error getting text content from ${url}: ${error.message}`);
            return;
        }

        if (!content) {
            console.log(`Empty content received for ${url}`);
            return;
        }

        // Extract links and process them
        const result = extractLinks(content);

        // Process search matches
        try {
            if (searchStringMatch(content, ctx.searchStrings)) {
                searchMatches.push(url);
            }
        } catch (error) {
            console.log(`Error processing search match for ${url}: ${error.message}`);
        }

        // Process OST usage
        try {
            if (result?.ost?.length) {
                result.ost.forEach(({ patternMatch, postExcerpt }) => {
                    if (patternMatch?.groups?.parameters) {
                        extractOstUsage(ctx, patternMatch.groups.parameters, postExcerpt, ostUsages);
                    }
                });
            }
        } catch (error) {
            console.log(`Error processing OST usage for ${url}: ${error.message}`);
        }

        // Process iframe usages
        try {
            if (result?.iframes?.length) {
                result.iframes.forEach(({ patternMatch, postExcerpt }) => {
                    if (patternMatch?.input) {
                        foundUsages.push({
                            ...ctx,
                            pageUrl,
                            url: patternMatch.input,
                            postExcerpt,
                        });
                    }
                });
            }
        } catch (error) {
            console.log(`Error processing iframes for ${url}: ${error.message}`);
        }

        // Process personalization fragments
        let fragments = [];
        try {
            const persoFragments = await getPersonalizationFragments(content);
            result.fragment ??= [];

            fragments = (result.fragment || [])
                .filter((item) => item?.patternMatch?.input)
                .map(({ patternMatch }) => patternMatch.input)
                .filter((fragmentUrl) => fragmentUrl && fragmentUrl !== url)
                .map((fragmentUrl) => normalizeUrl(convertRelativeToAbsoluteUrl(fragmentUrl))); // Normalize fragment URLs

            if (persoFragments && persoFragments.length) {
                // Normalize personalization fragments too
                const normalizedPersoFragments = persoFragments
                    .map((fragmentUrl) => normalizeUrl(convertRelativeToAbsoluteUrl(fragmentUrl)))
                    .filter((fragmentUrl) => fragmentUrl && fragmentUrl !== normalizedUrl);

                fragments = fragments.concat(normalizedPersoFragments);
            }

            // Filter out any fragments that have already been fetched
            fragments = fragments.filter((fragmentUrl) => !fetched.has(fragmentUrl));
        } catch (error) {
            console.log(`Error processing fragments for ${url}: ${error.message}`);
        }

        // Process fragments with depth tracking - only if there are fragments to process
        if (fragments.length > 0) {
            await Promise.allSettled(fragments.map((fragmentUrl) => auditPage(ctx, fragmentUrl, depth + 1)));
        }

        if (retries.has(url)) {
            retries.delete(url);
            console.log(`retries down to ${retries.size}`);
        }
    } catch (error) {
        // Improved retry logic with maximum attempts
        ctx.retries = (ctx.retries || 0) + 1;

        if (ctx.retries > MAX_RETRY_ATTEMPTS) {
            console.log(`Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached for ${pageUrl}, giving up`);
            return;
        }

        const delay = ctx.retries * 1000;
        retries.add(pageUrl);

        console.log(
            `Error while auditing document ${pageUrl}: ${error.message}, retrying (#${ctx.retries}) in ${delay / 1000}s...`,
        );
        console.log(`#retries = ${retries.size}`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        await auditPage(ctx, pageUrl, depth); // Keep the same depth on retry
    }
}

const writeIframeUsagesToFile = () => {
    console.log(`collected ${foundUsages.length} entries`);
    const headers = ['page URL', 'fragment URL', 'iFrame URL'];
    fs.writeFileSync(
        file,
        `${headers.join(',')}\n${foundUsages.map(({ origin, pageUrl, url }) => `${origin},${pageUrl},${url}`).join('\n')}`,
    );
};

const writeOstUsagesToFile = () => {
    console.log('writing OST usages to file...');
    //rendering of collected ostUsages objects together with all collected keys as a CSV
    let headers = Array.from(keys);
    headers.unshift('fragment');
    headers.unshift('origin');
    headers.push('postExcerpt');
    headers = headers.concat(WCS_KEYS.map(prefixWcsKey));
    fs.writeFileSync(
        file,
        `${headers.join(',')}\n${ostUsages
            .map((o) => {
                if (mapWcs[o.osi]) {
                    o = { ...o, ...mapWcs[o.osi] };
                }
                return headers.map((k) => o?.[k] || '').join(',');
            })
            .join('\n')}`,
    );
    if (searchMatches.length > 0) {
        fs.writeFileSync(`${searchFile}.matches`, searchMatches.join('\n'));
    }
};

const collectOsiData = async () => {
    console.log(`collected ${ostUsages.length} entries`);
    //collecting related OSI commerce data
    let osisToFetch = Object.keys(mapWcs);
    while (osisToFetch.length > 0) {
        console.log(`${osisToFetch.length} osis remaining...`);
        const buffer = osisToFetch.slice(0, defaultBufferSize);
        osisToFetch = osisToFetch.length >= defaultBufferSize ? osisToFetch.slice(defaultBufferSize) : [];

        // Add timeout for the entire batch
        const batchPromise = Promise.allSettled(buffer.map((osi) => setCommerceData(osi, mapWcs[osi].locale)));
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Batch processing timeout after ${MAX_FETCH_TIMEOUT}ms`));
            }, MAX_FETCH_TIMEOUT * 2); // Double the fetch timeout for the batch
        });
        // Race the batch against the timeout
        try {
            await Promise.race([batchPromise, timeoutPromise]);
        } catch (error) {
            console.error(`Error processing batch: ${error.message}`);
        }
    }
};

const processUrlBatchesWithRetries = async ({ urlsToFetch, searchStrings }) => {
    // Normalize all URLs first and filter out duplicates
    const uniqueUrls = Array.from(
        new Set(
            urlsToFetch
                .map((url) => {
                    const normalized = normalizeUrl(convertRelativeToAbsoluteUrl(url));
                    return normalized;
                })
                .filter((url) => url && !fetched.has(url)), // Filter out empty and already fetched URLs
        ),
    );

    console.log(`Processing ${uniqueUrls.length} unique URLs out of ${urlsToFetch.length} total`);

    let remainingUrls = [...uniqueUrls];

    while (remainingUrls.length > 0) {
        console.log(`${remainingUrls.length} remaining...`);

        const bufferSize = defaultBufferSize;

        const buffer = remainingUrls.slice(0, bufferSize);
        remainingUrls = remainingUrls.length >= bufferSize ? remainingUrls.slice(bufferSize) : [];

        // Process buffer of URLs
        await Promise.allSettled(buffer.map((url) => auditPage({ origin: url, searchStrings }, url)));
    }
};

const processArgs = async () => {
    const BUFFER_ARG = '-b';
    const FILE_ARG = '-f';
    const MF_ARG = '-m';
    const SEARCH_ARG = '-s';
    const DEBUG_ARG = '-d';
    const TARGET_ARG = '-t';
    let args = process.argv.slice(2);
    if (!args.length) {
        console.log('you should provide at least one URL to audit');
    }
    let searchStrings;
    let urlsToFetch = [];
    while (args.length > 0) {
        const arg = args.splice(0, 1)[0];
        switch (arg) {
            case BUFFER_ARG: {
                defaultBufferSize = parseInt(args.splice(0, 1)[0]);
                console.log(`will use bufferSize of ${defaultBufferSize}`);
                break;
            }
            case FILE_ARG: {
                file = args.splice(0, 1)[0];
                console.log(`will write output to ${file}`);
                break;
            }
            case MF_ARG: {
                const mf = args.splice(0, 1)[0];
                const lines = fs.readFileSync(mf, 'utf8');
                args = args.concat(lines.split('\n'));
                break;
            }
            case SEARCH_ARG: {
                searchFile = args.splice(0, 1)[0];
                const searchItems = fs.readFileSync(searchFile, 'utf8');
                searchStrings = searchItems.split('\n').map((s) => s.trim().toLowerCase());
                break;
            }
            case TARGET_ARG: {
                const target = args.splice(0, 1)[0];
                if (Object.values(AUDIT_TARGET).includes(target)) {
                    auditTarget = AUDIT_TARGET[target];
                }
                console.log(`audit target: ${auditTarget}`);
                break;
            }
            case DEBUG_ARG: {
                isDebug = true;
                break;
            }
            default: {
                if (arg.endsWith('sitemap.xml')) {
                    console.log('looks like a sitemap, will use urls listed there...');
                    const sitemapUrls = await extractUrlsFromSiteMap(arg);
                    console.log(`collected ${sitemapUrls.length} urls`);
                    urlsToFetch = urlsToFetch.concat(sitemapUrls);
                } else {
                    urlsToFetch.push(arg);
                }
                break;
            }
        }
    }
    return { searchStrings, urlsToFetch };
};

async function main() {
    const startTime = Date.now();
    const { urlsToFetch, searchStrings } = await processArgs();
    console.log(`will audit ${urlsToFetch.length} URLs with buffer size ${defaultBufferSize}, targetting ${auditTarget}`);
    try {
        await processUrlBatchesWithRetries({ urlsToFetch, searchStrings });

        switch (auditTarget) {
            case AUDIT_TARGET.modal:
                writeIframeUsagesToFile();
                break;
            case AUDIT_TARGET.ost:
                await collectOsiData();
                writeOstUsagesToFile();
                break;
            default:
                break;
        }

        console.log(`finished in ${(Date.now() - startTime) / 1000}s`);
    } catch (error) {
        console.error(`Fatal error: ${error.message}`);
    } finally {
        clearTimeout(scriptTimeout);
    }
}

main();
