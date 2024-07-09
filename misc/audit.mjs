import fetch from 'node-fetch';
import fs from 'fs';

const BUFFER_SIZE = 100;
const EXCERPT_SIZE = 30;
const BUFFER_ARG = '-b';
const FILE_ARG = '-f';
const MF_ARG = '-m';
const HREF_REGEXP = 'href="(?<url>[^"]+)"';
const LOC_REGEXP = '<loc>(?<url>[^<]+)</loc>';
const PERSO_REGEXP = '<meta name="personalization" content="(?<urls>[^"]+)">';
const LINK_REGEXP = '<a[^>]*' + HREF_REGEXP +'[^>]*>[^<]*</a>';
const PARAMETER_REGEXP = '(?<left>\\w+)=(?<right>[^&]+)';
const DOMAIN_REGEXP = '^https://[^/]+'
const HREF_REGEXPS = {
    'fragment': '/fragments/',
    'ost': 'https://milo.adobe.com/tools/ost?(?<parameters>.+)',
}
const LOCALES = ['au', 'cn', 'hk_en', 'hk_zh', 'id_en', 'id_id', 'in', 'in_hi', 'kr', 'my_en', 'my_ms', 'nz', 'ph_en', 'ph_fil', 'sg', 'th_en', 'th_th', 'tw', 'vn_en', 'vn_vi',
    'ae_en', 'ae_ar', 'africa', 'at', 'be_en', 'be_fr', 'be_nl', 'bg', 'ch_de', 'ch_fr', 'ch_it', 'cis_en', 'cis_ru', 'cz', 'de', 'dk', 'ee', 'eg_ar', 'eg_en', 'es', 'fi', 'fr', 'gr_el', 'gr_en', 'hu', 'ie', 'il_en', 'il_he', 'iq', 'is', 'it', 'kw_ar', 'kw_en', 'lt', 'lu_de', 'lu_en', 'lu_fr', 'lv', 'mena_ar', 'mena_en', 'ng', 'nl', 'no', 'pl', 'pt', 'qa_ar', 'qa_en', 'ro', 'ru', 'sa_en', 'sa_ar', 'se', 'si', 'sk', 'tr', 'ua', 'uk', 'za',
    'ar', 'br', 'ca', 'ca_fr', 'cl', 'co', 'cr', 'ec', 'gt', 'la', 'mx', 'pe', 'pr', 'jp'];
const wcsUrl = (osi) => `https://wcs.adobe.com/web_commerce_artifact?offer_selector_ids=${osi}&country=US&language=MULT&locale=en_US&api_key=wcms-commerce-ims-ro-user-milo&landscape=PUBLISHED`;
const mapWcs = {};
const WCS_KEYS = [ 'offerId' , 'productArrangementCode' , 'commitment' , 'term' , 'customerSegment' , 'marketSegments' , 'offerType' , 'pricePoint' ];
const retries = new Set();
const fetched = new Set();
const isRelative = (url) => (url[0] == '/');
let defaultBufferSize = BUFFER_SIZE;
let file = '/tmp/audit.csv';

const getUrlParts = ( url ) => {
    const domain = (new RegExp(DOMAIN_REGEXP)).exec(url)[0];
    return {
        domain,
        uri: url = url.substring(domain.length),
    }
}

const fetchDocument = (url) => {
    console.log(`fetching ${url}...`);
    return fetch(url);
};

const getLiveUrl = (url) => url.replaceAll('.hlx.page', '.hlx.live');

async function getFragmentsFromManifest(url) {
    const fragments = [];
    try {
        const response = await fetch(getLiveUrl(url));
        if(response.status == 200 && response.size > 0) {
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
        console.log(`Error while fetching manifest: ${error}`)
    }
    return fragments;
}

async function getPersonnalizationFragments(pageContent) {
    const persoRegexp = (new RegExp(PERSO_REGEXP, 'g')).exec(pageContent);
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
        const postExcerpt = pageContent.substring(indexEnd, indexEnd + EXCERPT_SIZE).replaceAll(/[,\n\s]+/g,'');
        Object.entries(HREF_REGEXPS).forEach(([type, pattern]) => {
            const patternMatch = (new RegExp(pattern)).exec(url);
            if (patternMatch) {
                result[type] ??= [];
                result[type].push({
                    patternMatch,
                    postExcerpt
                });
            }
        });
    }
    return result;
}

const prefixWcsKey = (key) => ('wcs ' + key);

async function getCommerceData(osi) {
    const response = await fetch(wcsUrl(osi));
    const data = {};
    if (response.ok) {
        const json = await response.json();
        const offer = json.resolvedOffers[0];
        if (offer) {
            WCS_KEYS.forEach( (key) => data[prefixWcsKey(key)] = offer[key]);
        }
    }
    return data;
}

async function extractOstUsage(ctx, parameterString, postExcerpt, collection) {
    const parameterMatches = new RegExp(PARAMETER_REGEXP, 'g');
    const entry = {...ctx, postExcerpt};
    let match;
    while ((match = parameterMatches.exec(parameterString)) != null) {
        const { left, right } = match.groups;
        entry[left] = right;
        keys.add(left);
    }
    if (entry.osi) {
        mapWcs[entry.osi] = {};
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
const keys = new Set();

async function auditPage( ctx, url ) {
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
        const response = await fetchDocument(url);
        fetched.add(url);
        if (!response.ok) {
            console.log(`Error: response status for ${response.url} is ${response.status}`);
            return;
        }
        if (url === ctx.origin) {
            const { uri } = getUrlParts(url);
            const firstToken = uri.substring(1).split('/')[0];
            ctx.localeRewrite = LOCALES.indexOf(firstToken) >= 0 ? firstToken : null;
        } else {
            ctx.fragment = url;
        }
        const content = await response.text();
        const result = extractLinks(content);

        await result?.ost?.map(async ({ patternMatch, postExcerpt }) => await extractOstUsage(ctx, patternMatch.groups.parameters, postExcerpt, ostUsages));
        const persoFragments = await getPersonnalizationFragments(content);
        result.fragment ??= [];
        let fragments = result.fragment
            .map(({ patternMatch }) => patternMatch.input)
            .filter((fragmentUrl) => fragmentUrl != url);
        if (persoFragments) {
            fragments = fragments.concat(persoFragments);
        }
        await Promise.allSettled(fragments.map((fragmentUrl) => auditPage(ctx, fragmentUrl)));
        if (retries.has(url)) {            
            retries.delete(url);
            console.log(`retries down to ${retries.size}`);
        }
    }
    catch(error) {
        ctx.retries = ctx.retries ? ctx.retries ++ : 1;
        const delay = ctx.retries = 1 * 1000;
        retries.add(url)
        console.log(`Error while auditing document ${url}: ${error}, retrying (#${ctx.retries})in ${delay/1000}s...`);   
        console.log(`#retries = ${retries.size}`);     
        await sleep(delay);
        await auditPage(ctx, url);
    };
}

async function main() {
    const startTime = Date.now();
    if (process.argv.length < 3) {
        console.log("you should provide at least one URL to audit");
    }
    let args = process.argv.slice(2);
    let urlsToFetch = [];
    while (args.length > 0) {
        const arg = args.splice(0, 1)[0];
        switch(arg) {
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
            default: {
                if (arg.endsWith('sitemap.xml')) {
                    console.log("looks like a sitemap, will use urls listed there...");
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
        const bufferSize = defaultBufferSize > retries.size ? defaultBufferSize - retries.size : 1; 
        const buffer = urlsToFetch.slice(0, bufferSize);
        //remaining urls once buffer will be done
        urlsToFetch = (urlsToFetch.length >= bufferSize) ? urlsToFetch.slice(bufferSize) : [];
        //buffer process
        await Promise.allSettled(buffer.map((url) => auditPage({ origin: url }, url)));
    }
    console.log(`collected ${ostUsages.length} entries`);
    //collecting related OSI commerce data
    await Promise.allSettled(Object.keys(mapWcs).map(async (osi) => mapWcs[osi] = await getCommerceData(osi)));

    //rendering of collected ostUsages objects together with all collected keys as a CSV
    let headers = Array.from(keys);
    headers.unshift('fragment');
    headers.unshift('origin');
    headers.push('postExcerpt');
    headers = headers.concat(WCS_KEYS.map(prefixWcsKey));
    fs.writeFileSync(file,
        `${headers.join(',')}\n${ostUsages.map((o) => {
            o = {...o, ...mapWcs[o.osi] }
            return headers.map(k => o[k]).join(',');
        }).join('\n')}`
    );
    console.log(`finished in ${(Date.now() - startTime)/1000}s`);
}

main();
