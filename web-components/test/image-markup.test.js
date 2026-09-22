import { expect } from '@esm-bundle/chai';
import {
    aemPageToProd,
    rewriteImageUrlsForProd,
    sanitizeAssetUrl,
    isSupportedAssetHostname,
    buildPictureInnerMarkup,
    extractBackgroundUrl,
    sanitizePictureMarkup,
    rendition,
    formatFor,
    stripRenditionParams,
} from '../src/image-markup.js';

const AEM =
    'https://main--mas-test--adobecom.aem.page/test-fragments/media_1.png';
const INNER =
    `<source type="image/webp" srcset="${AEM}?width=2000&format=webply&optimize=medium" media="(min-width: 600px)">` +
    `<source type="image/webp" srcset="${AEM}?width=750&format=webply&optimize=medium">` +
    `<img loading="lazy" alt="" src="${AEM}?width=750&format=png&optimize=medium">`;

const parse = (html) =>
    new DOMParser().parseFromString(`<picture>${html}</picture>`, 'text/html');

describe('aemPageToProd', () => {
    it('rewrites an aem.page URL to the prod origin, keeping path + query', () => {
        expect(
            aemPageToProd(
                `${AEM}?width=750&format=png`,
                'https://www.adobe.com',
            ),
        ).to.equal(
            'https://www.adobe.com/test-fragments/media_1.png?width=750&format=png',
        );
    });

    it('returns null for a non-aem.page URL', () => {
        expect(
            aemPageToProd('https://example.com/x.png', 'https://www.adobe.com'),
        ).to.be.null;
    });

    it('returns null for empty input', () => {
        expect(aemPageToProd('', 'https://www.adobe.com')).to.be.null;
    });
});

describe('rewriteImageUrlsForProd', () => {
    it('leaves markup unchanged off prod', () => {
        expect(
            rewriteImageUrlsForProd(INNER, { hostname: 'localhost' }),
        ).to.equal(INNER);
    });

    it('leaves markup unchanged when location is absent (non-DOM runtime)', () => {
        expect(rewriteImageUrlsForProd(INNER, undefined)).to.equal(INNER);
    });

    it('rewrites *.aem.page origins to the prod origin on adobe.com', () => {
        const out = rewriteImageUrlsForProd(INNER, {
            hostname: 'www.adobe.com',
            origin: 'https://www.adobe.com',
        });
        const doc = parse(out);
        expect(doc.querySelector('img').getAttribute('src')).to.equal(
            'https://www.adobe.com/test-fragments/media_1.png?width=750&format=png&optimize=medium',
        );
        doc.querySelectorAll('source').forEach((s) => {
            expect(s.getAttribute('srcset')).to.contain(
                'https://www.adobe.com/',
            );
            expect(s.getAttribute('srcset')).to.not.contain('aem.page');
        });
    });

    it('returns inner markup without adding a <picture> wrapper', () => {
        const out = rewriteImageUrlsForProd(INNER, {
            hostname: 'www.adobe.com',
            origin: 'https://www.adobe.com',
        });
        expect(out).to.not.contain('<picture>');
    });
});

describe('sanitizeAssetUrl', () => {
    it('percent-encodes a quote so it cannot break out of an attribute', () => {
        const malicious = `${AEM}" onerror="alert(1)`;
        expect(sanitizeAssetUrl(malicious)).to.not.contain('"');
    });

    it('returns an equivalent href for an already-safe URL', () => {
        expect(sanitizeAssetUrl(AEM)).to.equal(AEM);
    });

    it('returns empty string for an unparsable URL', () => {
        expect(sanitizeAssetUrl('not a url')).to.equal('');
    });

    it('returns empty string for empty input', () => {
        expect(sanitizeAssetUrl('')).to.equal('');
    });
});

describe('isSupportedAssetHostname', () => {
    it('accepts an absolute *.aem.page URL', () => {
        expect(isSupportedAssetHostname(AEM)).to.be.true;
    });

    it('rejects a non-aem.page host', () => {
        expect(isSupportedAssetHostname('https://example.com/media_x.png')).to
            .be.false;
    });

    it('rejects an unparsable URL', () => {
        expect(isSupportedAssetHostname('not a url')).to.be.false;
    });

    it('rejects an empty value', () => {
        expect(isSupportedAssetHostname('')).to.be.false;
    });

    it('rejects a relative URL', () => {
        expect(isSupportedAssetHostname('./media_x.png')).to.be.false;
    });

    it('rejects the bare aem.page apex (must be a subdomain)', () => {
        expect(isSupportedAssetHostname('https://aem.page/media_x.png')).to.be
            .false;
    });
});

describe('buildPictureInnerMarkup', () => {
    it('returns empty string for an unsupported host', () => {
        expect(buildPictureInnerMarkup('https://example.com/x.png')).to.equal(
            '',
        );
    });

    it('emits two webp sources plus an original-format source and img for png', () => {
        const doc = parse(buildPictureInnerMarkup(AEM));
        const sources = [...doc.querySelectorAll('source')];
        const img = doc.querySelector('img');
        expect(sources).to.have.lengthOf(3);

        expect(sources[0].getAttribute('type')).to.equal('image/webp');
        expect(sources[0].getAttribute('srcset')).to.equal(
            `${AEM}?width=2000&format=webply&optimize=medium`,
        );
        expect(sources[0].getAttribute('media')).to.equal('(min-width: 600px)');

        expect(sources[1].getAttribute('type')).to.equal('image/webp');
        expect(sources[1].getAttribute('srcset')).to.equal(
            `${AEM}?width=750&format=webply&optimize=medium`,
        );
        expect(sources[1].hasAttribute('media')).to.be.false;

        expect(sources[2].getAttribute('type')).to.equal('image/png');
        expect(sources[2].getAttribute('srcset')).to.equal(
            `${AEM}?width=2000&format=png&optimize=medium`,
        );
        expect(sources[2].getAttribute('media')).to.equal('(min-width: 600px)');

        expect(img.getAttribute('loading')).to.equal('lazy');
        expect(img.getAttribute('alt')).to.equal('');
        expect(img.getAttribute('src')).to.equal(
            `${AEM}?width=750&format=png&optimize=medium`,
        );
    });

    it('does not let a quote in an otherwise-valid-hostname URL break out of the srcset/src attribute', () => {
        const malicious = `${AEM}" onerror="alert(1)`;
        const doc = parse(buildPictureInnerMarkup(malicious));
        expect(doc.querySelector('[onerror]')).to.not.exist;
    });

    it('falls back to a plain img with the original URL for an unrecognized extension (no garbage format= param)', () => {
        const SVG_URL =
            'https://main--mas-test--adobecom.aem.page/test-fragments/media_1.svg';
        const doc = parse(buildPictureInnerMarkup(SVG_URL));
        expect(doc.querySelectorAll('source')).to.have.lengthOf(0);
        const img = doc.querySelector('img');
        expect(img).to.exist;
        expect(img.getAttribute('src')).to.equal(SVG_URL);
    });

    it('falls back to a plain img with the original URL when the path has no file extension', () => {
        const NO_EXT_URL =
            'https://main--mas-test--adobecom.aem.page/test-fragments/media_1';
        const doc = parse(buildPictureInnerMarkup(NO_EXT_URL));
        expect(doc.querySelectorAll('source')).to.have.lengthOf(0);
        const img = doc.querySelector('img');
        expect(img).to.exist;
        expect(img.getAttribute('src')).to.equal(NO_EXT_URL);
    });

    it('supports a webp source instead of silently clearing the value', () => {
        const WEBP =
            'https://main--mas-test--adobecom.aem.page/test-fragments/media_1.webp';
        const doc = parse(buildPictureInnerMarkup(WEBP));
        const original = [...doc.querySelectorAll('source')].at(-1);
        expect(original.getAttribute('type')).to.equal('image/webp');
        expect(original.getAttribute('srcset')).to.contain('format=webp');
        expect(doc.querySelector('img').getAttribute('src')).to.contain(
            'format=webp',
        );
    });

    it('supports a gif source instead of silently clearing the value', () => {
        const GIF =
            'https://main--mas-test--adobecom.aem.page/test-fragments/media_1.gif';
        const doc = parse(buildPictureInnerMarkup(GIF));
        const original = [...doc.querySelectorAll('source')].at(-1);
        expect(original.getAttribute('type')).to.equal('image/gif');
        expect(original.getAttribute('srcset')).to.contain('format=gif');
        expect(doc.querySelector('img').getAttribute('src')).to.contain(
            'format=gif',
        );
    });

    it('maps jpg to image/jpeg source type', () => {
        const JPG =
            'https://main--mas-test--adobecom.aem.page/fragments/media_abc.jpg';
        const doc = parse(buildPictureInnerMarkup(JPG));
        const original = [...doc.querySelectorAll('source')].at(-1);
        expect(original.getAttribute('type')).to.equal('image/jpeg');
        expect(original.getAttribute('srcset')).to.contain('format=jpg');
    });

    it('merges the rendition params into an existing query instead of appending a second "?"', () => {
        const AEM_WITH_QUERY = `${AEM}?rev=3`;
        const doc = parse(buildPictureInnerMarkup(AEM_WITH_QUERY));
        const img = doc.querySelector('img');
        const src = img.getAttribute('src');
        expect(src.split('?').length - 1).to.equal(1);
        expect(src).to.contain('rev=3');
        expect(src).to.contain('width=750');
    });
});

describe('rendition', () => {
    it('sets width, format, and optimize=medium on the URL', () => {
        const parsed = new URL(rendition(AEM, 750, 'webp'));
        expect(parsed.searchParams.get('width')).to.equal('750');
        expect(parsed.searchParams.get('format')).to.equal('webp');
        expect(parsed.searchParams.get('optimize')).to.equal('medium');
    });

    it('merges into an existing query instead of appending a second "?"', () => {
        const out = rendition(`${AEM}?rev=3`, 2000, 'png');
        expect(out.split('?').length - 1).to.equal(1);
        expect(out).to.contain('rev=3');
    });
});

describe('formatFor', () => {
    it('maps a png extension to the png format', () => {
        expect(formatFor(AEM)).to.deep.equal({
            type: 'image/png',
            format: 'png',
        });
    });

    it('maps a webp extension to the webp format', () => {
        expect(
            formatFor(
                'https://main--mas-test--adobecom.aem.page/test-fragments/media_1.webp',
            ),
        ).to.deep.equal({ type: 'image/webp', format: 'webp' });
    });

    it('returns null for an unrecognized extension', () => {
        expect(
            formatFor(
                'https://main--mas-test--adobecom.aem.page/test-fragments/media_1.svg',
            ),
        ).to.be.null;
    });
});

describe('stripRenditionParams', () => {
    it('removes width, format, and optimize params while keeping the rest of the query', () => {
        expect(
            stripRenditionParams(
                `${AEM}?width=750&format=webp&optimize=medium&rev=3`,
            ),
        ).to.equal(`${AEM}?rev=3`);
    });

    it('returns empty string for empty input', () => {
        expect(stripRenditionParams('')).to.equal('');
    });

    it('returns empty string instead of throwing for an unparseable URL', () => {
        expect(() => stripRenditionParams('not a url')).to.not.throw();
        expect(stripRenditionParams('not a url')).to.equal('');
    });
});

describe('extractBackgroundUrl', () => {
    const DESKTOP_URL =
        'https://main--mas-test--adobecom.aem.page/media_desktop.png';
    const TABLET_URL =
        'https://main--mas-test--adobecom.aem.page/media_tablet.png';
    const MOBILE_URL =
        'https://main--mas-test--adobecom.aem.page/media_mobile.png';
    const COMBINED =
        `<source srcset="${DESKTOP_URL}" media="(min-width: 1200px)">` +
        `<source srcset="${TABLET_URL}" media="(min-width: 600px)">` +
        `<img loading="lazy" alt="" data-mobile-set="true" src="${MOBILE_URL}">`;

    it('extracts the desktop source srcset', () => {
        expect(extractBackgroundUrl(COMBINED, 'desktop')).to.equal(DESKTOP_URL);
    });

    it('extracts the tablet source srcset', () => {
        expect(extractBackgroundUrl(COMBINED, 'tablet')).to.equal(TABLET_URL);
    });

    it('extracts the mobile img src', () => {
        expect(extractBackgroundUrl(COMBINED, 'mobile')).to.equal(MOBILE_URL);
    });

    it('returns empty string for a breakpoint that is not present', () => {
        const mobileOnly = `<img loading="lazy" alt="" src="${MOBILE_URL}">`;
        expect(extractBackgroundUrl(mobileOnly, 'desktop')).to.equal('');
        expect(extractBackgroundUrl(mobileOnly, 'tablet')).to.equal('');
    });

    it('returns empty string for empty input', () => {
        expect(extractBackgroundUrl('', 'desktop')).to.equal('');
    });

    it('returns empty string for an unknown key', () => {
        expect(extractBackgroundUrl(COMBINED, 'bogus')).to.equal('');
    });

    it('does not report mobile as filled when the img is just the desktop/tablet fallback (no data-mobile-set marker)', () => {
        const desktopTabletOnly =
            `<source srcset="${DESKTOP_URL}" media="(min-width: 1200px)">` +
            `<source srcset="${TABLET_URL}" media="(min-width: 600px)">` +
            `<img loading="lazy" alt="" src="${TABLET_URL}">`;
        expect(extractBackgroundUrl(desktopTabletOnly, 'mobile')).to.equal('');
    });
});

describe('sanitizePictureMarkup', () => {
    it('returns empty string for empty input', () => {
        expect(sanitizePictureMarkup('')).to.equal('');
    });

    it('leaves well-formed source/img markup functionally untouched', () => {
        const before = parse(INNER);
        const after = parse(sanitizePictureMarkup(INNER));
        expect(after.querySelectorAll('source, img')).to.have.lengthOf(
            before.querySelectorAll('source, img').length,
        );
        expect(after.querySelector('img').getAttribute('src')).to.equal(
            before.querySelector('img').getAttribute('src'),
        );
    });

    it('strips a script tag injected alongside legitimate source/img markup', () => {
        const malicious = `${INNER}<script>1+1</script>`;
        const doc = parse(sanitizePictureMarkup(malicious));
        expect(doc.querySelector('script')).to.not.exist;
        expect(doc.querySelector('img')).to.exist;
    });

    it('strips an event-handler attribute from an otherwise-legitimate img', () => {
        const malicious = `<img src="${AEM}" data-evil="1">`;
        const doc = parse(sanitizePictureMarkup(malicious));
        expect(doc.querySelector('img').hasAttribute('data-evil')).to.be.false;
        expect(doc.querySelector('img').getAttribute('src')).to.equal(AEM);
    });

    it('removes a wrapping element that is not source/img, along with its contents', () => {
        const malicious = `<div data-evil="1"><img src="${AEM}"></div>`;
        const doc = parse(sanitizePictureMarkup(malicious));
        expect(doc.querySelector('div')).to.not.exist;
        expect(doc.querySelector('img')).to.not.exist;
    });

    it('preserves the source/img content when given a full <picture>-wrapped value instead of just its inner markup', () => {
        const fullPicture = `<picture>${INNER}</picture>`;
        const doc = parse(sanitizePictureMarkup(fullPicture));
        expect(doc.querySelectorAll('source, img')).to.have.lengthOf(
            parse(INNER).querySelectorAll('source, img').length,
        );
        expect(doc.querySelector('img').getAttribute('src')).to.equal(
            parse(INNER).querySelector('img').getAttribute('src'),
        );
    });
});
