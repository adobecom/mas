const PROD_HOSTNAMES = ['www.adobe.com', 'adobe.com'];

/** Parses `url` (against `base`), or returns null when it is not a URL. */
function parseUrl(url, base) {
    try {
        return new URL(url, base);
    } catch {
        return null;
    }
}

/** On prod (adobe.com), authored *.aem.page asset URLs must be served from the
 *  prod origin. Rewrites the origin to `origin`, keeping path + query; returns
 *  null for non-aem.page URLs so callers leave them untouched. */
export function aemPageToProd(url, origin) {
    const parsed = url ? parseUrl(url, origin) : null;
    if (!parsed?.hostname.endsWith('.aem.page')) return null;
    return `${origin}${parsed.pathname}${parsed.search}`;
}

export function sanitizeAssetUrl(url) {
    return (url && parseUrl(url)?.href) || '';
}

export function isSupportedAssetHostname(url) {
    return Boolean(url && parseUrl(url)?.hostname.endsWith('.aem.page'));
}

const FORMAT_BY_EXT = {
    png: { type: 'image/png', format: 'png' },
    jpg: { type: 'image/jpeg', format: 'jpg' },
    jpeg: { type: 'image/jpeg', format: 'jpg' },
    webp: { type: 'image/webp', format: 'webp' },
    gif: { type: 'image/gif', format: 'gif' },
};

const DESKTOP = { width: 2000, media: '(min-width: 600px)' };
const MOBILE_WIDTH = 750;

export function rendition(url, width, format) {
    const parsed = new URL(url);
    parsed.searchParams.set('width', width);
    parsed.searchParams.set('format', format);
    parsed.searchParams.set('optimize', 'medium');
    return parsed.href;
}

/** Never request a rendition wider than the original — upscaling only adds bytes. */
export function renditionWidth(width, dimensions) {
    return dimensions?.width ? Math.min(width, dimensions.width) : width;
}

export function formatFor(url) {
    const ext = new URL(url).pathname.split('.').pop().toLowerCase();
    return FORMAT_BY_EXT[ext] ?? null;
}

const RENDITION_PARAMS = ['width', 'format', 'optimize'];

export function getImageDimensions(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () =>
            resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = reject;
        image.src = url;
    });
}

/** Parses picture markup with a <template>, so nothing loads or upgrades. */
function parsePicture(markup) {
    const template = document.createElement('template');
    template.innerHTML = markup;
    return template.content.querySelector('picture');
}

export function extractImageDimensions(inner) {
    if (!inner) return undefined;
    const image = parsePicture(`<picture>${inner}</picture>`).querySelector(
        'img',
    );
    const width = Number(image?.getAttribute('width'));
    const height = Number(image?.getAttribute('height'));
    return width && height ? { width, height } : undefined;
}

export function escapeAttribute(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

export function dimensionsAttributes(dimensions) {
    if (!dimensions?.width || !dimensions?.height) return '';
    return ` width="${dimensions.width}" height="${dimensions.height}"`;
}

/** Strips the width/format/optimize params rendition() adds, recovering the plain
 * authored URL for editing/display/copy surfaces.
 * Returns '' for empty or unparseable input. */
export function stripRenditionParams(url) {
    const parsed = url && parseUrl(url);
    if (!parsed) return '';
    for (const param of RENDITION_PARAMS) parsed.searchParams.delete(param);
    return parsed.href;
}

export function buildPictureInnerMarkup(url, dimensions, alt = '') {
    if (!isSupportedAssetHostname(url)) return '';
    const safeUrl = sanitizeAssetUrl(url);
    const formatInfo = formatFor(safeUrl);
    const altAttribute = `alt="${escapeAttribute(alt)}"`;
    const size = dimensionsAttributes(dimensions);
    if (!formatInfo)
        return `<img loading="lazy" ${altAttribute}${size} src="${safeUrl}">`;
    const { type, format } = formatInfo;
    const desktopWidth = renditionWidth(DESKTOP.width, dimensions);
    const mobileWidth = renditionWidth(MOBILE_WIDTH, dimensions);
    return [
        `<source type="image/webp" srcset="${rendition(safeUrl, desktopWidth, 'webply')}" media="${DESKTOP.media}">`,
        `<source type="image/webp" srcset="${rendition(safeUrl, mobileWidth, 'webply')}">`,
        `<source type="${type}" srcset="${rendition(safeUrl, desktopWidth, format)}" media="${DESKTOP.media}">`,
        `<img loading="lazy" ${altAttribute} src="${rendition(safeUrl, mobileWidth, format)}"${size}>`,
    ].join('');
}

const isProdLocation = (location) =>
    PROD_HOSTNAMES.includes(location?.hostname);

/** Rewrites the *.aem.page asset URLs of a parsed picture to `origin`. */
function rewritePicture(picture, origin) {
    for (const element of picture.querySelectorAll(
        'source[srcset], img[src]',
    )) {
        const attribute = element.localName === 'img' ? 'src' : 'srcset';
        const prod = aemPageToProd(element.getAttribute(attribute), origin);
        if (prod) element.setAttribute(attribute, prod);
    }
    return picture;
}

/** Rewrites *.aem.page asset URLs in image markup (the picture's inner
 *  <source>/<img>) to the current prod origin when running on prod; otherwise
 *  returns the markup unchanged. Shared by hydrate.js (merch-card) and
 *  mas-field.js (standalone field) so both surfaces resolve assets identically.
 *  No-ops off-prod and in non-DOM runtimes (e.g. MAS IO in Node). */
export function rewriteImageUrlsForProd(inner, location = globalThis.location) {
    if (!inner || !isProdLocation(location)) return inner;
    return rewritePicture(
        parsePicture(`<picture>${inner}</picture>`),
        location.origin,
    ).innerHTML;
}

const ALLOWED_PICTURE_TAGS = new Set(['SOURCE', 'IMG']);
const ALLOWED_PICTURE_ATTRS = new Set([
    'src',
    'srcset',
    'media',
    'type',
    'alt',
    'role',
    'loading',
    'data-mobile-set',
    'width',
    'height',
]);

/** Parses stored image/backgrounds markup (a picture's inner markup, or the
 *  whole <picture>) and strips it down to picture/source/img — the AEM field
 *  isn't schema-constrained, so this guards render time, not Studio's output. */
function sanitizedPicture(inner) {
    const picture = parsePicture(
        /^\s*<picture[\s>]/i.test(inner)
            ? inner
            : `<picture>${inner}</picture>`,
    );
    for (const element of picture.querySelectorAll('*')) {
        if (!ALLOWED_PICTURE_TAGS.has(element.tagName)) {
            element.remove();
            continue;
        }
        for (const { name } of [...element.attributes]) {
            if (!ALLOWED_PICTURE_ATTRS.has(name)) {
                element.removeAttribute(name);
            }
        }
    }
    return picture;
}

/** Strips stored image/backgrounds markup down to picture/source/img before innerHTML. */
export function sanitizePictureMarkup(inner) {
    return inner ? sanitizedPicture(inner).innerHTML : '';
}

/**
 * Creates the <picture> for stored image markup: sanitized like
 * sanitizePictureMarkup and with prod asset URLs like rewriteImageUrlsForProd,
 * from a single parse.
 * @param {string} inner the picture's inner markup, or the whole <picture>
 * @returns {HTMLPictureElement}
 */
export function createPicture(inner, location = globalThis.location) {
    const parsed = sanitizedPicture(inner);
    if (isProdLocation(location)) rewritePicture(parsed, location.origin);
    const picture = document.createElement('picture');
    picture.append(...parsed.childNodes);
    return picture;
}

export const BACKGROUNDS_DESKTOP_MEDIA = '(min-width: 1200px)';
export const BACKGROUNDS_TABLET_MEDIA = '(min-width: 600px)';

/** Extracts one breakpoint's URL out of buildBackgroundsHtml's combined markup.
 *  'desktop'/'tablet' read the matching <source media> srcset. 'mobile' reads
 *  the <img> src only if data-mobile-set is present (else it's just a borrowed fallback). */
export function extractBackgroundUrl(html, key) {
    if (!html) return '';
    const picture = parsePicture(`<picture>${html}</picture>`);
    if (key === 'mobile') {
        const img = picture.querySelector('img');
        return (
            (img?.hasAttribute('data-mobile-set') && img.getAttribute('src')) ||
            ''
        );
    }
    const media =
        (key === 'desktop' && BACKGROUNDS_DESKTOP_MEDIA) ||
        (key === 'tablet' && BACKGROUNDS_TABLET_MEDIA);
    return (
        (media &&
            picture
                .querySelector(`source[media="${media}"]`)
                ?.getAttribute('srcset')) ||
        ''
    );
}
