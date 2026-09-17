const FORMAT_BY_EXT = {
    png: { type: 'image/png', format: 'png' },
    jpg: { type: 'image/jpeg', format: 'jpg' },
    jpeg: { type: 'image/jpeg', format: 'jpg' },
};

const DESKTOP = { width: 2000, media: '(min-width: 600px)' };
const MOBILE_WIDTH = 750;

export function isSupportedImageUrl(url) {
    if (!url) return false;
    let hostname;
    try {
        ({ hostname } = new URL(url));
    } catch {
        return false;
    }
    return hostname.endsWith('.aem.page');
}

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

export function buildPictureHtml(url) {
    if (!isSupportedImageUrl(url)) return '';
    const safeUrl = new URL(url).href;
    const { type, format } = formatFor(safeUrl);
    return [
        `<source type="image/webp" srcset="${rendition(safeUrl, DESKTOP.width, 'webply')}" media="${DESKTOP.media}">`,
        `<source type="image/webp" srcset="${rendition(safeUrl, MOBILE_WIDTH, 'webply')}">`,
        `<source type="${type}" srcset="${rendition(safeUrl, DESKTOP.width, format)}" media="${DESKTOP.media}">`,
        `<img loading="lazy" alt="" src="${rendition(safeUrl, MOBILE_WIDTH, format)}">`,
    ].join('');
}

export function extractImageUrl(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(`<picture>${html}</picture>`, 'text/html');
    const src = doc.querySelector('img')?.getAttribute('src') ?? doc.querySelector('source')?.getAttribute('srcset');
    if (!src) return '';
    const parsed = new URL(src);
    parsed.searchParams.delete('width');
    parsed.searchParams.delete('format');
    parsed.searchParams.delete('optimize');
    return parsed.href;
}
