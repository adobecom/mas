const DESKTOP_MEDIA = '(min-width: 1200px)';
const TABLET_MEDIA = '(min-width: 600px)';

/** Extracts one breakpoint's URL out of the combined <picture>-inner markup
 *  built by studio/src/editors/backgrounds-url.js's buildBackgroundsHtml.
 *  'desktop'/'tablet' read the matching <source media> srcset; 'mobile' reads
 *  the plain <img> src (the universal fallback). Returns '' when that
 *  breakpoint isn't present in the markup, or for an unknown key. */
export function extractBackgroundUrl(html, key) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(
        `<picture>${html}</picture>`,
        'text/html',
    );
    if (key === 'desktop')
        return (
            doc
                .querySelector(`source[media="${DESKTOP_MEDIA}"]`)
                ?.getAttribute('srcset') ?? ''
        );
    if (key === 'tablet')
        return (
            doc
                .querySelector(`source[media="${TABLET_MEDIA}"]`)
                ?.getAttribute('srcset') ?? ''
        );
    if (key === 'mobile')
        return doc.querySelector('img')?.getAttribute('src') ?? '';
    return '';
}
