import { Log } from '../src/log.js';
import {
    lanaAppender,
    updateConfig,
    updateCountrySettings,
} from '../src/lana.js';
import { mockLana, unmockLana } from './mocks/lana.js';
import { expect } from './utilities.js';

updateConfig({ isProdDomain: true });

function stubCookie(value) {
    Object.defineProperty(document, 'cookie', {
        configurable: true,
        get: () => value,
    });
}

function restoreCookie() {
    delete document.cookie;
}

function append(message = 'Test', params = []) {
    lanaAppender.append({
        level: Log.Level.ERROR,
        message,
        namespace: 'test',
        params,
        source: 'testModule',
        timestamp: Date.now(),
    });
}

describe('lana international country logging', () => {
    let lana;
    const originalHref = window.location.href;

    beforeEach(() => {
        lana = mockLana();
    });

    afterEach(() => {
        unmockLana();
        restoreCookie();
        updateCountrySettings();
        window.history.replaceState({}, '', originalHref);
    });

    it('logs an empty string when neither an override nor a cookie country is set', () => {
        append();

        const [, options] = lana.log.firstCall.args;
        expect(options).to.have.property('international', '');
    });

    it('logs the cookie-resolved country when no explicit override is present', () => {
        stubCookie('ims_country_code=lu');
        updateCountrySettings({ country: 'US', hasExplicitCountry: false });

        append();

        const [, options] = lana.log.firstCall.args;
        expect(options.international).to.equal('LU');
    });

    it('logs the explicit override even when the cookie holds a different value', () => {
        stubCookie('ims_country_code=fr');
        updateCountrySettings({ country: 'LU', hasExplicitCountry: true });

        append();

        const [, options] = lana.log.firstCall.args;
        expect(options.international).to.equal('LU');
    });

    it('forwards message, page and international together for an error-level entry', () => {
        updateCountrySettings({ country: 'LU', hasExplicitCountry: true });
        window.history.replaceState({}, '', '/test/page');

        append('Boom');

        expect(lana.log.calledOnce).to.be.true;
        const [message, options] = lana.log.firstCall.args;
        expect(message).to.equal('Boom¶page=/test/page');
        expect(options.international).to.equal('LU');
    });
});
