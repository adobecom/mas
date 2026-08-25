import { imsCountry, imsReady, imsSignedIn } from '../src/ims.js';

import { mockIms, unmockIms } from './mocks/ims.js';
import { expect, sinon } from './utilities.js';

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
        unmockIms();
        restoreCookie();
    });

    describe('imsCountry (from cookie)', () => {
        it('resolves to null when the cookie is absent', async () => {
            stubCookie('other=1');
            expect(await imsCountry()).to.be.null;
        });

        it('resolves the country from the ims_country_code cookie', async () => {
            stubCookie('ims_country_code=CH');
            expect(await imsCountry()).to.equal('CH');
        });

        it('uppercases a lowercase cookie value', async () => {
            stubCookie('ims_country_code=ch');
            expect(await imsCountry()).to.equal('CH');
        });

        it('resolves to null for a malformed cookie value', async () => {
            stubCookie('ims_country_code=%E0%A4%A');
            expect(await imsCountry()).to.be.null;
        });
    });

    describe('imsSignedIn (from adobeIMS)', () => {
        it('resolves true for a signed-in user', async () => {
            await mockIms('CH');
            expect(await imsSignedIn(imsReady())).to.be.true;
        });

        it('resolves false for an anonymous user', async () => {
            await mockIms();
            expect(await imsSignedIn(imsReady())).to.be.false;
        });
    });

    describe('imsReady', () => {
        it('resolves to undefined by timeout if IMS was not detected', async () => {
            const interval = 1;
            const maxAttempts = 3;
            const promise = imsReady({ interval, maxAttempts });

            const clock = sinon.useFakeTimers();
            let attempt = -1;

            while (++attempt < maxAttempts) {
                clock.tick(interval);
                clock.runAll();
            }
            clock.restore();

            expect(await promise).to.be.undefined;
        });
    });
});
