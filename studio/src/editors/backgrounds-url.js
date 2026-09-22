import {
    isSupportedAssetHostname as isSupportedImageUrl,
    BACKGROUNDS_DESKTOP_MEDIA as DESKTOP_MEDIA,
    BACKGROUNDS_TABLET_MEDIA as TABLET_MEDIA,
    extractBackgroundUrl,
    rendition,
    formatFor,
    stripRenditionParams,
} from '../../../web-components/src/image-markup.js';

const BREAKPOINT_WIDTH = { desktop: 2000, tablet: 1200, mobile: 750 };

/** Sizes the URL for its breakpoint, like buildPictureInnerMarkup does for `image`
 *  otherwise `backgrounds` ships the same full-size original at every breakpoint.
 *  Falls back to the plain URL for unrecognized extensions (e.g. svg). */
function validOrEmpty(url, breakpoint) {
    if (!isSupportedImageUrl(url)) return '';
    const formatInfo = formatFor(url);
    if (!formatInfo) return new URL(url).href;
    return rendition(url, BREAKPOINT_WIDTH[breakpoint], formatInfo.format);
}

/**
 * Combines up to three breakpoint image URLs into a single <picture>-inner
 * markup string. Mobile is the universal fallback (rendered as the plain
 * <img>): whichever of mobile/tablet/desktop is filled first, in that order,
 * becomes the fallback. Desktop/tablet each get their own <source> whenever
 * they're explicitly filled, even if the URL happens to match the fallback —
 * skipping the source in that case would make the round trip lossy (an
 * explicitly-set breakpoint would read back as empty on the next load).
 * All three inputs are optional.
 */
export function buildBackgroundsHtml({ desktop = '', tablet = '', mobile = '' } = {}) {
    const d = validOrEmpty(desktop, 'desktop');
    const t = validOrEmpty(tablet, 'tablet');
    const m = validOrEmpty(mobile, 'mobile');
    const fallback = m || t || d;
    if (!fallback) return '';

    const sources = [];
    if (d) sources.push(`<source srcset="${d}" media="${DESKTOP_MEDIA}">`);
    if (t) sources.push(`<source srcset="${t}" media="${TABLET_MEDIA}">`);
    const mobileMarker = m ? ' data-mobile-set="true"' : '';
    sources.push(`<img loading="lazy" alt=""${mobileMarker} src="${fallback}">`);
    return sources.join('');
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
