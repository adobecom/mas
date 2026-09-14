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
    return `${url}?width=${width}&format=${format}&optimize=medium`;
}

function formatFor(url) {
    const ext = new URL(url).pathname.split('.').pop().toLowerCase();
    return FORMAT_BY_EXT[ext] ?? { type: `image/${ext}`, format: ext };
}

export function buildPictureHtml(url) {
    if (!isSupportedImageUrl(url)) return '';
    const { type, format } = formatFor(url);
    return [
        `<source type="image/webp" srcset="${rendition(url, DESKTOP.width, 'webply')}" media="${DESKTOP.media}">`,
        `<source type="image/webp" srcset="${rendition(url, MOBILE_WIDTH, 'webply')}">`,
        `<source type="${type}" srcset="${rendition(url, DESKTOP.width, format)}" media="${DESKTOP.media}">`,
        `<img loading="lazy" alt="" src="${rendition(url, MOBILE_WIDTH, format)}">`,
    ].join('');
}

export function extractImageUrl(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(`<picture>${html}</picture>`, 'text/html');
    const src = doc.querySelector('img')?.getAttribute('src') ?? doc.querySelector('source')?.getAttribute('srcset');
    return src ? src.split('?')[0] : '';
}
