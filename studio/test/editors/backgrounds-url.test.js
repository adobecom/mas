import { expect } from '@esm-bundle/chai';
import { buildBackgroundsHtml, parseBackgroundsUrls } from '../../src/editors/backgrounds-url.js';

const DESKTOP_URL = 'https://main--da-cc--adobecom.aem.page/media_desktop.png';
const TABLET_URL = 'https://main--da-cc--adobecom.aem.page/media_tablet.png';
const MOBILE_URL = 'https://main--da-cc--adobecom.aem.page/media_mobile.png';

function parse(html) {
    return new DOMParser().parseFromString(`<picture>${html}</picture>`, 'text/html');
}

describe('buildBackgroundsHtml', () => {
    it('returns empty string when no URLs are provided', () => {
        expect(buildBackgroundsHtml({})).to.equal('');
    });

    it('builds a desktop source, a tablet source, and a mobile img when all three differ', () => {
        const doc = parse(buildBackgroundsHtml({ desktop: DESKTOP_URL, tablet: TABLET_URL, mobile: MOBILE_URL }));
        const sources = [...doc.querySelectorAll('source')];
        const img = doc.querySelector('img');

        expect(sources).to.have.lengthOf(2);
        expect(sources[0].getAttribute('media')).to.equal('(min-width: 1200px)');
        expect(sources[0].getAttribute('srcset')).to.equal(DESKTOP_URL);
        expect(sources[1].getAttribute('media')).to.equal('(min-width: 600px)');
        expect(sources[1].getAttribute('srcset')).to.equal(TABLET_URL);
        expect(img.getAttribute('src')).to.equal(MOBILE_URL);
    });

    it('builds a single plain img with no sources when only mobile is provided', () => {
        const doc = parse(buildBackgroundsHtml({ mobile: MOBILE_URL }));
        expect(doc.querySelectorAll('source')).to.have.lengthOf(0);
        expect(doc.querySelector('img').getAttribute('src')).to.equal(MOBILE_URL);
    });

    it('drops a URL that fails isSupportedImageUrl, treating it as absent', () => {
        const doc = parse(buildBackgroundsHtml({ desktop: 'https://not-aem-page.com/x.png', mobile: MOBILE_URL }));
        expect(doc.querySelectorAll('source')).to.have.lengthOf(0);
        expect(doc.querySelector('img').getAttribute('src')).to.equal(MOBILE_URL);
    });
});

describe('buildBackgroundsHtml - attribute injection safety', () => {
    it('does not let a quote in an otherwise-valid-hostname URL break out of the srcset/src attribute', () => {
        const malicious = 'https://main--da-cc--adobecom.aem.page/a.png" onerror="alert(1)';
        const doc = parse(buildBackgroundsHtml({ mobile: malicious }));
        expect(doc.querySelector('[onerror]')).to.not.exist;
    });
});

describe('parseBackgroundsUrls', () => {
    it('returns all-empty for empty input', () => {
        expect(parseBackgroundsUrls('')).to.deep.equal({ desktop: '', tablet: '', mobile: '' });
    });

    it('round-trips desktop, tablet, and mobile when all three are distinct', () => {
        const html = buildBackgroundsHtml({ desktop: DESKTOP_URL, tablet: TABLET_URL, mobile: MOBILE_URL });
        expect(parseBackgroundsUrls(html)).to.deep.equal({
            desktop: DESKTOP_URL,
            tablet: TABLET_URL,
            mobile: MOBILE_URL,
        });
    });

    it('round-trips a mobile-only value', () => {
        const html = buildBackgroundsHtml({ mobile: MOBILE_URL });
        expect(parseBackgroundsUrls(html)).to.deep.equal({ desktop: '', tablet: '', mobile: MOBILE_URL });
    });
});
