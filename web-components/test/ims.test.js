import { imsCountry, imsReady, imsSignedIn } from '../src/ims.js';
import { expect } from './utilities.js';

function stubCookie(value) {
    Object.defineProperty(document, 'cookie', {
        configurable: true,
        get: () => value,
    });
}

function restoreCookie() {
    delete document.cookie;
}

describe('IMS module', () => {
    afterEach(() => {
        restoreCookie();
    });

    it('resolves country to null when the cookie is absent', async () => {
        stubCookie('other=1');
        expect(await imsCountry()).to.be.null;
    });

    it('resolves country from a supported ims_country_code cookie', async () => {
        stubCookie('ims_country_code=CH');
        expect(await imsCountry()).to.equal('CH');
    });

    it('uppercases a lowercase cookie value', async () => {
        stubCookie('ims_country_code=ch');
        expect(await imsCountry()).to.equal('CH');
    });

    it('resolves to null for an unsupported cookie country', async () => {
        stubCookie('ims_country_code=ZZ');
        expect(await imsCountry()).to.be.null;
    });

    it('reports signed-in only when the cookie is present', async () => {
        stubCookie('other=1');
        expect(await imsSignedIn()).to.be.false;
        stubCookie('ims_country_code=CH');
        expect(await imsSignedIn()).to.be.true;
    });

    it('imsReady resolves immediately', async () => {
        expect(await imsReady()).to.be.undefined;
    });
});
