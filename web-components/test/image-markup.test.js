import { expect } from '@esm-bundle/chai';
import {
    aemPageToProd,
    rewriteImageUrlsForProd,
    sanitizeAssetUrl,
    isSupportedAssetHostname,
    buildPictureInnerMarkup,
    extractBackgroundUrl,
} from '../src/image-markup.js';

const AEM =
    'https://main--da-cc--adobecom.aem.page/cc-shared/fragments/media_1.png';
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
            'https://www.adobe.com/cc-shared/fragments/media_1.png?width=750&format=png',
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
            'https://www.adobe.com/cc-shared/fragments/media_1.png?width=750&format=png&optimize=medium',
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
});

describe('extractBackgroundUrl', () => {
    const DESKTOP_URL =
        'https://main--da-cc--adobecom.aem.page/media_desktop.png';
    const TABLET_URL =
        'https://main--da-cc--adobecom.aem.page/media_tablet.png';
    const MOBILE_URL =
        'https://main--da-cc--adobecom.aem.page/media_mobile.png';
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
