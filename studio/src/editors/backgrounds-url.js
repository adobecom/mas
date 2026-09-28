import {
    isSupportedAssetHostname as isSupportedImageUrl,
    BACKGROUNDS_DESKTOP_MEDIA as DESKTOP_MEDIA,
    BACKGROUNDS_TABLET_MEDIA as TABLET_MEDIA,
    extractBackgroundUrl,
    rendition,
    formatFor,
    renditionWidth,
    dimensionsAttributes,
    escapeAttribute,
    stripRenditionParams,
} from '../../../web-components/src/image-markup.js';

const BREAKPOINT_WIDTH = { desktop: 2000, tablet: 750, mobile: 750 };

/** EDS-style sources for one breakpoint: a webply <source> followed by one in the
 *  original format, both sized to the breakpoint width (never above the original).
 *  Unrecognized extensions (e.g. svg) get a single plain <source>. */
function breakpointSources(url, breakpoint, dimensions, media) {
    const mediaAttr = media ? ` media="${media}"` : '';
    const dims = dimensionsAttributes(dimensions);
    const formatInfo = formatFor(url);
    if (!formatInfo) return media ? [`<source${dims} srcset="${new URL(url).href}"${mediaAttr}>`] : [];
    const width = renditionWidth(BREAKPOINT_WIDTH[breakpoint], dimensions);
    const webp = `<source type="image/webp"${dims} srcset="${rendition(url, width, 'webply')}"${mediaAttr}>`;
    if (!media) return [webp];
    return [webp, `<source type="${formatInfo.type}"${dims} srcset="${rendition(url, width, formatInfo.format)}"${mediaAttr}>`];
}

function fallbackSrc(url, breakpoint, dimensions) {
    const formatInfo = formatFor(url);
    if (!formatInfo) return new URL(url).href;
    return rendition(url, renditionWidth(BREAKPOINT_WIDTH[breakpoint], dimensions), formatInfo.format);
}

/**
 * Combines up to three breakpoint image URLs into a single <picture>-inner
 * markup string, following the EDS picture structure (webply + original format,
 * width/format/optimize rendition params, original width/height).
 * Mobile is the universal fallback (rendered as the plain <img>): whichever of
 * mobile/tablet/desktop is filled first, in that order, becomes the fallback.
 * Desktop/tablet each get their own <source>s whenever they're explicitly filled,
 * even if the URL happens to match the fallback — skipping them would make the
 * round trip lossy (an explicitly-set breakpoint would read back as empty).
 * All three inputs are optional.
 */
export function buildBackgroundsHtml({ desktop = '', tablet = '', mobile = '' } = {}, dimensions = {}, alt = '') {
    const urls = {
        desktop: isSupportedImageUrl(desktop) ? desktop : '',
        tablet: isSupportedImageUrl(tablet) ? tablet : '',
        mobile: isSupportedImageUrl(mobile) ? mobile : '',
    };
    const fallbackKey = ['mobile', 'tablet', 'desktop'].find((key) => urls[key]);
    if (!fallbackKey) return '';

    const markup = [];
    if (urls.desktop) markup.push(...breakpointSources(urls.desktop, 'desktop', dimensions.desktop, DESKTOP_MEDIA));
    if (urls.tablet) markup.push(...breakpointSources(urls.tablet, 'tablet', dimensions.tablet, TABLET_MEDIA));
    const fallbackDimensions = dimensions[fallbackKey];
    markup.push(...breakpointSources(urls[fallbackKey], 'mobile', fallbackDimensions));
    const mobileMarker = urls.mobile ? ' data-mobile-set="true"' : '';
    markup.push(
        `<img loading="lazy" alt="${escapeAttribute(alt)}"${mobileMarker} src="${fallbackSrc(urls[fallbackKey], 'mobile', fallbackDimensions)}"${dimensionsAttributes(fallbackDimensions)}>`,
    );
    return markup.join('');
}

/** Extracts { desktop, tablet, mobile } back out of markup built by buildBackgroundsHtml,
 *  stripping the baked-in rendition params so editing/display surfaces see the plain
 *  authored URL rather than the sized rendition. */
export function parseBackgroundsUrls(html) {
    if (!html) return { desktop: '', tablet: '', mobile: '' };
    return {
        desktop: stripRenditionParams(extractBackgroundUrl(html, 'desktop')),
        tablet: stripRenditionParams(extractBackgroundUrl(html, 'tablet')),
        mobile: stripRenditionParams(extractBackgroundUrl(html, 'mobile')),
    };
}

export function parseBackgroundsDimensions(html) {
    if (!html) return { desktop: undefined, tablet: undefined, mobile: undefined };
    const doc = new DOMParser().parseFromString(`<picture>${html}</picture>`, 'text/html');
    const getDimensions = (element) => {
        const width = Number(element?.getAttribute('width'));
        const height = Number(element?.getAttribute('height'));
        return width && height ? { width, height } : undefined;
    };
    return {
        desktop: getDimensions(doc.querySelector(`source[media="${DESKTOP_MEDIA}"]`)),
        tablet: getDimensions(doc.querySelector(`source[media="${TABLET_MEDIA}"]`)),
        mobile: getDimensions(doc.querySelector('img[data-mobile-set]')),
    };
}

/** Own URLs for a fragment, falling back to the parent's when there's no real
 *  own value — including `['']`, not just a fully absent field. */
export function resolveOwnBackgroundsUrls(ownHtml, parentHtml) {
    return parseBackgroundsUrls(ownHtml || parentHtml || '');
}

/** Per-breakpoint state: 'inherited' when there's no own value (agrees with
 *  Fragment.getFieldState()), else 'overridden'/'same-as-parent' by comparing
 *  the own and parent URLs for that breakpoint. */
export function resolveBackgroundBreakpointState(key, ownHtml, parentHtml) {
    if (!ownHtml) return 'inherited';
    const own = parseBackgroundsUrls(ownHtml)[key];
    const parent = parseBackgroundsUrls(parentHtml || '')[key];
    return own === parent ? 'same-as-parent' : 'overridden';
}
