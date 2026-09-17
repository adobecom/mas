import { isSupportedImageUrl } from './image-url.js';

const DESKTOP_MEDIA = '(min-width: 1200px)';
const TABLET_MEDIA = '(min-width: 600px)';

function validOrEmpty(url) {
    return isSupportedImageUrl(url) ? url : '';
}

/**
 * Combines up to three breakpoint image URLs into a single <picture>-inner
 * markup string. Mobile is the universal fallback (rendered as the plain
 * <img>): whichever of mobile/tablet/desktop is filled first, in that order,
 * becomes the fallback, and the others (when they differ from it) become
 * breakpoint-specific <source> entries. All three inputs are optional.
 */
export function buildBackgroundsHtml({ desktop = '', tablet = '', mobile = '' } = {}) {
    const d = validOrEmpty(desktop);
    const t = validOrEmpty(tablet);
    const m = validOrEmpty(mobile);
    const fallback = m || t || d;
    if (!fallback) return '';

    const sources = [];
    if (d && d !== fallback) sources.push(`<source srcset="${d}" media="${DESKTOP_MEDIA}">`);
    if (t && t !== fallback) sources.push(`<source srcset="${t}" media="${TABLET_MEDIA}">`);
    sources.push(`<img loading="lazy" alt="" src="${fallback}">`);
    return sources.join('');
}

/** Extracts { desktop, tablet, mobile } back out of markup built by buildBackgroundsHtml. */
export function parseBackgroundsUrls(html) {
    if (!html) return { desktop: '', tablet: '', mobile: '' };
    const doc = new DOMParser().parseFromString(`<picture>${html}</picture>`, 'text/html');
    const desktopSource = doc.querySelector(`source[media="${DESKTOP_MEDIA}"]`);
    const tabletSource = doc.querySelector(`source[media="${TABLET_MEDIA}"]`);
    const img = doc.querySelector('img');
    return {
        desktop: desktopSource?.getAttribute('srcset') ?? '',
        tablet: tabletSource?.getAttribute('srcset') ?? '',
        mobile: img?.getAttribute('src') ?? '',
    };
}
