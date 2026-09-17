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
