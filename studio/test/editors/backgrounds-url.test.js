import { expect } from '@esm-bundle/chai';
import {
    buildBackgroundsHtml,
    parseBackgroundsUrls,
    parseBackgroundsDimensions,
    resolveOwnBackgroundsUrls,
    resolveBackgroundBreakpointState,
} from '../../src/editors/backgrounds-url.js';

const DESKTOP_URL = 'https://main--mas-test--adobecom.aem.page/media_desktop.png';
const TABLET_URL = 'https://main--mas-test--adobecom.aem.page/media_tablet.png';
const MOBILE_URL = 'https://main--mas-test--adobecom.aem.page/media_mobile.png';

function parse(html) {
    return new DOMParser().parseFromString(`<picture>${html}</picture>`, 'text/html');
}

describe('buildBackgroundsHtml', () => {
    it('returns empty string when no URLs are provided', () => {
        expect(buildBackgroundsHtml({})).to.equal('');
    });

    const r = (url, width, format) => `${url}?width=${width}&format=${format}&optimize=medium`;
    const describeSources = (doc) =>
        [...doc.querySelectorAll('source')].map((s) => [
            s.getAttribute('type'),
            s.getAttribute('media'),
            s.getAttribute('srcset'),
        ]);

    it('builds EDS-style webply + original-format sources per breakpoint and a mobile img when all three differ', () => {
        const doc = parse(buildBackgroundsHtml({ desktop: DESKTOP_URL, tablet: TABLET_URL, mobile: MOBILE_URL }));
        expect(describeSources(doc)).to.deep.equal([
            ['image/webp', '(min-width: 1200px)', r(DESKTOP_URL, 2000, 'webply')],
            ['image/png', '(min-width: 1200px)', r(DESKTOP_URL, 2000, 'png')],
            ['image/webp', '(min-width: 600px)', r(TABLET_URL, 750, 'webply')],
            ['image/png', '(min-width: 600px)', r(TABLET_URL, 750, 'png')],
            ['image/webp', null, r(MOBILE_URL, 750, 'webply')],
        ]);
        expect(doc.querySelector('img').getAttribute('src')).to.equal(r(MOBILE_URL, 750, 'png'));
    });

    it('builds only a mobile webply source and img when only mobile is provided', () => {
        const doc = parse(buildBackgroundsHtml({ mobile: MOBILE_URL }));
        expect(describeSources(doc)).to.deep.equal([['image/webp', null, r(MOBILE_URL, 750, 'webply')]]);
        expect(doc.querySelector('img').getAttribute('src')).to.equal(r(MOBILE_URL, 750, 'png'));
    });

    it('drops a URL that fails isSupportedImageUrl, treating it as absent', () => {
        const doc = parse(buildBackgroundsHtml({ desktop: 'https://not-aem-page.com/x.png', mobile: MOBILE_URL }));
        expect(doc.querySelectorAll('source[media]')).to.have.lengthOf(0);
        expect(doc.querySelector('img').getAttribute('src')).to.equal(r(MOBILE_URL, 750, 'png'));
    });

    it('keeps a source per explicitly-set breakpoint even when all three share the same URL', () => {
        const doc = parse(buildBackgroundsHtml({ desktop: MOBILE_URL, tablet: MOBILE_URL, mobile: MOBILE_URL }));
        expect(doc.querySelectorAll('source[media="(min-width: 1200px)"]')).to.have.lengthOf(2);
        expect(doc.querySelectorAll('source[media="(min-width: 600px)"]')).to.have.lengthOf(2);
    });

    it('stores the original width/height and never requests a rendition wider than the original', () => {
        const dims = { width: 757, height: 426 };
        const html = buildBackgroundsHtml(
            { desktop: DESKTOP_URL, tablet: TABLET_URL, mobile: MOBILE_URL },
            { desktop: dims, tablet: { width: 1600, height: 569 }, mobile: { width: 500, height: 300 } },
        );
        const doc = parse(html);
        expect(describeSources(doc).map(([, , srcset]) => srcset)).to.deep.equal([
            r(DESKTOP_URL, 757, 'webply'),
            r(DESKTOP_URL, 757, 'png'),
            r(TABLET_URL, 750, 'webply'),
            r(TABLET_URL, 750, 'png'),
            r(MOBILE_URL, 500, 'webply'),
        ]);
        const img = doc.querySelector('img');
        expect(img.getAttribute('src')).to.equal(r(MOBILE_URL, 500, 'png'));
        expect([img.getAttribute('width'), img.getAttribute('height')]).to.deep.equal(['500', '300']);
        expect(parseBackgroundsDimensions(html)).to.deep.equal({
            desktop: dims,
            tablet: { width: 1600, height: 569 },
            mobile: { width: 500, height: 300 },
        });
    });

    it('stores an escaped alt on the img', () => {
        const doc = parse(buildBackgroundsHtml({ mobile: MOBILE_URL }, {}, 'a "quoted" <alt>'));
        expect(doc.querySelector('img').getAttribute('alt')).to.equal('a "quoted" <alt>');
    });

    it("leaves a URL with an unrecognized extension unsized, matching buildPictureInnerMarkup's svg fallback", () => {
        const SVG_URL = 'https://main--mas-test--adobecom.aem.page/icon.svg';
        const doc = parse(buildBackgroundsHtml({ mobile: SVG_URL }));
        expect(doc.querySelector('img').getAttribute('src')).to.equal(SVG_URL);
    });

    it('parses back the clean authored URL for display, not the baked-in rendition', () => {
        const html = buildBackgroundsHtml({ desktop: DESKTOP_URL });
        expect(parse(html).querySelector('source').getAttribute('srcset')).to.contain('width=2000');
        expect(parseBackgroundsUrls(html).desktop).to.equal(DESKTOP_URL);
    });
});

describe('buildBackgroundsHtml - attribute injection safety', () => {
    it('does not let a quote in an otherwise-valid-hostname URL break out of the srcset/src attribute', () => {
        const malicious = 'https://main--mas-test--adobecom.aem.page/a.png" onerror="alert(1)';
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

    it('round-trips desktop and tablet even when explicitly set to the same URL as mobile', () => {
        const html = buildBackgroundsHtml({ desktop: MOBILE_URL, tablet: MOBILE_URL, mobile: MOBILE_URL });
        expect(parseBackgroundsUrls(html)).to.deep.equal({
            desktop: MOBILE_URL,
            tablet: MOBILE_URL,
            mobile: MOBILE_URL,
        });
    });

    it('does not report mobile as filled when only desktop was set (the <img> is just the fallback)', () => {
        const html = buildBackgroundsHtml({ desktop: DESKTOP_URL });
        expect(parseBackgroundsUrls(html)).to.deep.equal({
            desktop: DESKTOP_URL,
            tablet: '',
            mobile: '',
        });
    });

    it('does not report mobile as filled when only desktop and tablet were set', () => {
        const html = buildBackgroundsHtml({ desktop: DESKTOP_URL, tablet: TABLET_URL });
        expect(parseBackgroundsUrls(html)).to.deep.equal({
            desktop: DESKTOP_URL,
            tablet: TABLET_URL,
            mobile: '',
        });
    });
});

describe('resolveOwnBackgroundsUrls', () => {
    it('returns the own value when the fragment has a real own value', () => {
        const ownHtml = buildBackgroundsHtml({ desktop: DESKTOP_URL });
        expect(resolveOwnBackgroundsUrls(ownHtml, '')).to.deep.equal({
            desktop: DESKTOP_URL,
            tablet: '',
            mobile: '',
        });
    });

    it('falls back to the parent value when the fragment has no own field', () => {
        const parentHtml = buildBackgroundsHtml({ mobile: MOBILE_URL });
        expect(resolveOwnBackgroundsUrls(undefined, parentHtml)).to.deep.equal({
            desktop: '',
            tablet: '',
            mobile: MOBILE_URL,
        });
    });

    it("falls back to the parent value when the own field is the explicit-empty single value ['']", () => {
        const parentHtml = buildBackgroundsHtml({ desktop: DESKTOP_URL, tablet: TABLET_URL, mobile: MOBILE_URL });
        expect(resolveOwnBackgroundsUrls('', parentHtml)).to.deep.equal({
            desktop: DESKTOP_URL,
            tablet: TABLET_URL,
            mobile: MOBILE_URL,
        });
    });
});

describe('resolveBackgroundBreakpointState', () => {
    it('reports inherited when there is no own value, even if a parent value exists', () => {
        const parentHtml = buildBackgroundsHtml({ desktop: DESKTOP_URL });
        expect(resolveBackgroundBreakpointState('desktop', '', parentHtml)).to.equal('inherited');
        expect(resolveBackgroundBreakpointState('desktop', undefined, parentHtml)).to.equal('inherited');
    });

    it('reports overridden when the own value differs from the parent', () => {
        const ownHtml = buildBackgroundsHtml({ desktop: DESKTOP_URL });
        const parentHtml = buildBackgroundsHtml({ desktop: TABLET_URL });
        expect(resolveBackgroundBreakpointState('desktop', ownHtml, parentHtml)).to.equal('overridden');
    });

    it('reports same-as-parent when the own value matches the parent', () => {
        const html = buildBackgroundsHtml({ desktop: DESKTOP_URL });
        expect(resolveBackgroundBreakpointState('desktop', html, html)).to.equal('same-as-parent');
    });
});
