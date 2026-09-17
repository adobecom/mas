import { expect } from '@esm-bundle/chai';
import { extractBackgroundUrl } from '../src/backgrounds-markup.js';

const DESKTOP_URL = 'https://main--da-cc--adobecom.aem.page/media_desktop.png';
const TABLET_URL = 'https://main--da-cc--adobecom.aem.page/media_tablet.png';
const MOBILE_URL = 'https://main--da-cc--adobecom.aem.page/media_mobile.png';

const COMBINED =
    `<source srcset="${DESKTOP_URL}" media="(min-width: 1200px)">` +
    `<source srcset="${TABLET_URL}" media="(min-width: 600px)">` +
    `<img loading="lazy" alt="" src="${MOBILE_URL}">`;

describe('extractBackgroundUrl', () => {
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
});
