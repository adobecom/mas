import fetch from 'node-fetch';
import fs from 'fs';

const BUFFER_SIZE = 100;
const EXCERPT_SIZE = 30;
const HREF_REGEXP = 'href="(?<url>[^"]+)"';
const LOC_REGEXP = '<loc>(?<url>[^<]+)</loc>';
const PERSO_REGEXP = '<meta name="personalization" content="(?<urls>[^"]+)">';
const LINK_REGEXP = '<a[^>]*' + HREF_REGEXP + '[^>]*>[^<]*</a>';
const PARAMETER_REGEXP = '(?<left>\\w+)=(?<right>[^&]+)';
const DOMAIN_REGEXP = '^https://[^/]+';
const HREF_REGEXPS = {
    fragment: '/fragments/',
    ost: 'https://milo.adobe.com/tools/ost?(?<parameters>.+)',
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
    'pricePoint',
    'priceDetails.price',
    'priceDetails.priceWithoutTax',
    'priceDetails.priceWithoutDiscount',
    'priceDetails.priceWithoutDiscountAndTax',
];
const retries = new Set();
const fetched = new Set();
const isRelative = (url) => url[0] == '/';
let isDebug = false;

const getUrlParts = (url) => {
    const domain = new RegExp(DOMAIN_REGEXP).exec(url)[0];
    return {
        domain,
        uri: (url = url.substring(domain.length)),
    };
};

const fetchDocument = (url) => {
    console.log(`fetching ${url}...`);
    return fetch(url);
};

const getLiveUrl = (url) => url.replaceAll('.aem.page', '.aem.live');

async function getFragmentsFromManifest(url) {
    const fragments = [];
    try {
        const response = await fetchDocument(getLiveUrl(url));
        if (response.status == 200 && response.size > 0) {
            const manifest = await response?.json();
            manifest.experiences?.data?.forEach((data) => {
                Object.values(data)
                    .map((value) => /^https:\/\/.+/.exec(value)?.[0])
                    .filter((value) => value != null)
                    .map(getLiveUrl)
                    .forEach((url) => fragments.push(url));
            });
        }
    } catch (error) {
        console.log(`Error while fetching manifest: ${error}`);
    }
    return fragments;
}

async function getPersonnalizationFragments(pageContent) {
    const persoRegexp = new RegExp(PERSO_REGEXP, 'g').exec(pageContent);
    if (!persoRegexp) {
        return null;
    }
    const fragments = new Set();
    const { urls } = persoRegexp.groups;
    const urlArr = urls.replace('\s', '').split(',');
    urlArr.forEach(async (url) => {
        const manifestFragments = await getFragmentsFromManifest(url);
        manifestFragments.forEach((fragment) => fragments.add(fragment));
    });
    return Array.from(fragments);
}

const extractLinks = (pageContent) => {
    const result = {};
    const linkRegexp = new RegExp(LINK_REGEXP, 'g');
    let match;
    while ((match = linkRegexp.exec(pageContent)) != null) {
        const { url } = match.groups;
        const indexEnd = match.index + match[0].length;
        const postExcerpt = pageContent
            .substring(indexEnd, indexEnd + EXCERPT_SIZE)
            .replaceAll(/[,\n\s]+/g, '');
        Object.entries(HREF_REGEXPS).forEach(([type, pattern]) => {
            const patternMatch = new RegExp(pattern).exec(url);
            if (patternMatch) {
                result[type] ??= [];
                result[type].push({
                    patternMatch,
                    postExcerpt,
                });
            }
        });
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

const prefixWcsKey = (key) => 'wcs ' + key;

function getLocaleSettings(locale) {
    if (!locale) {
        return {
            country: 'US',
            language: 'en',
            locale: 'en_US',
        };
    }
    let [country = 'US', language = 'en'] = (GeoMap[locale] ?? locale).split(
        '_',
        2,
    );

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
        let { url } = match.groups;
        listedUrls.add(url);
    }
    return Array.from(listedUrls);
}

const ostUsages = [];
let searchFile;
const searchMatches = [];
const keys = new Set();

async function auditPage(ctx, url) {
    try {
        if (isRelative(url)) {
            url = `https://www.adobe.com${url}`;
        }
        if (ctx.localeRewrite) {
            const localeToken = '/' + ctx.localeRewrite + '/';
            if (url.indexOf(localeToken) < 0) {
                const { domain, uri } = getUrlParts(url);
                url = domain + localeToken + uri.substring(1);
            }
        }
        if (fetched.has(url)) {
            //already fetched & parsed
            return;
        }
        fetched.add(url);
        const response = await fetchDocument(url);
        if (!response.ok) {
            console.log(
                `Error (${ctx.origin}): response status for ${response.url} is ${response.status}`,
            );
            return;
        } else if (isDebug) {
            console.log(`Success: response status for ${url} is 200`);
        }
        if (url === ctx.origin) {
            const { uri } = getUrlParts(url);
            const firstToken = uri.substring(1).split('/')[0];
            ctx.localeRewrite =
                LOCALES.indexOf(firstToken) >= 0 ? firstToken : null;
        } else {
            ctx.fragment = url;
        }
        const content = await response.text();
        const result = extractLinks(content);

        if (searchStringMatch(content, ctx.searchStrings)) {
            searchMatches.push(url);
        }

        result?.ost?.map(({ patternMatch, postExcerpt }) =>
            extractOstUsage(
                ctx,
                patternMatch.groups.parameters,
                postExcerpt,
                ostUsages,
            ),
        );
        const persoFragments = await getPersonnalizationFragments(content);
        result.fragment ??= [];
        let fragments = result.fragment
            .map(({ patternMatch }) => patternMatch.input)
            .filter((fragmentUrl) => fragmentUrl != url);
        if (persoFragments) {
            fragments = fragments.concat(persoFragments);
        }
        await Promise.allSettled(
            fragments.map((fragmentUrl) => auditPage(ctx, fragmentUrl)),
        );
        if (retries.has(url)) {
            retries.delete(url);
            console.log(`retries down to ${retries.size}`);
        }
    } catch (error) {
        ctx.retries = ctx.retries ? ctx.retries++ : 1;
        const delay = (ctx.retries = 1 * 1000);
        retries.add(url);
        console.log(
            `Error while auditing document ${url}: ${error}, retrying (#${ctx.retries})in ${delay / 1000}s...`,
        );
        console.log(`#retries = ${retries.size}`);
        await sleep(delay);
        await auditPage(ctx, url);
    }
}

const BUFFER_ARG = '-b';
const FILE_ARG = '-f';
const MF_ARG = '-m';
const SEARCH_ARG = '-s';
const DEBUG_ARG = '-d';
let defaultBufferSize = BUFFER_SIZE;
let file = '/tmp/audit.csv';

async function main() {
    const startTime = Date.now();
    if (process.argv.length < 3) {
        console.log('you should provide at least one URL to audit');
    }
    let args = process.argv.slice(2);
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
                searchStrings = searchItems
                    .split('\n')
                    .map((s) => s.trim().toLowerCase());
                break;
            }
            case DEBUG_ARG: {
                isDebug = true;
                break;
            }
            default: {
                if (arg.endsWith('sitemap.xml')) {
                    console.log(
                        'looks like a sitemap, will use urls listed there...',
                    );
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
    while (urlsToFetch.length > 0) {
        console.log(`${urlsToFetch.length} remaining...`);
        //next buffer
        // we remove retries that are being run atm
        const bufferSize =
            defaultBufferSize > retries.size
                ? defaultBufferSize - retries.size
                : 1;
        const buffer = urlsToFetch.slice(0, bufferSize);
        //remaining urls once buffer will be done
        urlsToFetch =
            urlsToFetch.length >= bufferSize
                ? urlsToFetch.slice(bufferSize)
                : [];
        //buffer process
        await Promise.allSettled(
            buffer.map((url) => auditPage({ origin: url, searchStrings }, url)),
        );
    }
    console.log(`collected ${ostUsages.length} entries`);
    //collecting related OSI commerce data
    let osisToFetch = Object.keys(mapWcs);
    while (osisToFetch.length > 0) {
        console.log(`${osisToFetch.length} osis remaining...`);
        const buffer = osisToFetch.slice(0, defaultBufferSize);
        osisToFetch =
            osisToFetch.length >= defaultBufferSize
                ? osisToFetch.slice(defaultBufferSize)
                : [];
        await Promise.allSettled(
            buffer.map((osi) => setCommerceData(osi, mapWcs[osi].locale)),
        );
    }

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
        fs.writeFileSync(searchFile + '.matches', searchMatches.join('\n'));
    }
    console.log(`finished in ${(Date.now() - startTime) / 1000}s`);
}

main();
