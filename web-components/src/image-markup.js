/** On prod (adobe.com), authored *.aem.page asset URLs must be served from the
 *  prod origin. Rewrites the origin to `origin`, keeping path + query; returns
 *  null for non-aem.page URLs so callers leave them untouched. */
export function aemPageToProd(url, origin) {
    if (typeof url !== 'string' || !url) return null;
    let parsed;
    try {
        parsed = new URL(url, origin);
    } catch {
        return null;
    }
    if (!parsed.hostname.endsWith('.aem.page')) return null;
    return `${origin}${parsed.pathname}${parsed.search}`;
}

export function sanitizeAssetUrl(url) {
    if (typeof url !== 'string' || !url) return '';
    try {
        return new URL(url).href;
    } catch {
        return '';
    }
}

export function isSupportedAssetHostname(url) {
    if (typeof url !== 'string' || !url) return false;
    try {
        return new URL(url).hostname.endsWith('.aem.page');
    } catch {
        return false;
    }
}

const FORMAT_BY_EXT = {
    png: { type: 'image/png', format: 'png' },
    jpg: { type: 'image/jpeg', format: 'jpg' },
    jpeg: { type: 'image/jpeg', format: 'jpg' },
};

const DESKTOP = { width: 2000, media: '(min-width: 600px)' };
const MOBILE_WIDTH = 750;

function rendition(url, width, format) {
    const parsed = new URL(url);
    parsed.searchParams.set('width', width);
    parsed.searchParams.set('format', format);
    parsed.searchParams.set('optimize', 'medium');
    return parsed.href;
}

function formatFor(url) {
    const ext = new URL(url).pathname.split('.').pop().toLowerCase();
    return FORMAT_BY_EXT[ext] ?? { type: `image/${ext}`, format: ext };
}

export function buildPictureInnerMarkup(url) {
    if (!isSupportedAssetHostname(url)) return '';
    const safeUrl = sanitizeAssetUrl(url);
    const { type, format } = formatFor(safeUrl);
    return [
        `<source type="image/webp" srcset="${rendition(safeUrl, DESKTOP.width, 'webply')}" media="${DESKTOP.media}">`,
        `<source type="image/webp" srcset="${rendition(safeUrl, MOBILE_WIDTH, 'webply')}">`,
        `<source type="${type}" srcset="${rendition(safeUrl, DESKTOP.width, format)}" media="${DESKTOP.media}">`,
        `<img loading="lazy" alt="" src="${rendition(safeUrl, MOBILE_WIDTH, format)}">`,
    ].join('');
}

function isProdLocation(location) {
    return (
        location?.hostname === 'www.adobe.com' ||
        location?.hostname === 'adobe.com'
    );
}

/** Rewrites *.aem.page asset URLs in image markup (the picture's inner
 *  <source>/<img>) to the current prod origin when running on prod; otherwise
 *  returns the markup unchanged. Shared by hydrate.js (merch-card) and
 *  mas-field.js (standalone field) so both surfaces resolve assets identically.
 *  No-ops off-prod and in non-DOM runtimes (e.g. MAS IO in Node). */
export function rewriteImageUrlsForProd(inner, location = globalThis.location) {
    if (typeof inner !== 'string' || !inner || !isProdLocation(location)) {
        return inner;
    }
    const template = document.createElement('template');
    template.innerHTML = `<picture>${inner}</picture>`;
    template.content
        .querySelectorAll('source[srcset], img[src]')
        .forEach((el) => {
            const attr = el.tagName === 'IMG' ? 'src' : 'srcset';
            const prod = aemPageToProd(el.getAttribute(attr), location.origin);
            if (prod) el.setAttribute(attr, prod);
        });
    return template.content.querySelector('picture').innerHTML;
}

const BACKGROUNDS_DESKTOP_MEDIA = '(min-width: 1200px)';
const BACKGROUNDS_TABLET_MEDIA = '(min-width: 600px)';

/** Extracts one breakpoint's URL out of buildBackgroundsHtml's combined markup.
 *  'desktop'/'tablet' read the matching <source media> srcset. 'mobile' reads
 *  the <img> src only if data-mobile-set is present (else it's just a borrowed fallback). */
export function extractBackgroundUrl(html, key) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(
        `<picture>${html}</picture>`,
        'text/html',
    );
    if (key === 'desktop')
        return (
            doc
                .querySelector(`source[media="${BACKGROUNDS_DESKTOP_MEDIA}"]`)
                ?.getAttribute('srcset') ?? ''
        );
    if (key === 'tablet')
        return (
            doc
                .querySelector(`source[media="${BACKGROUNDS_TABLET_MEDIA}"]`)
                ?.getAttribute('srcset') ?? ''
        );
    if (key === 'mobile') {
        const img = doc.querySelector('img');
        return img?.hasAttribute('data-mobile-set')
            ? (img.getAttribute('src') ?? '')
            : '';
    }
    return '';
}
