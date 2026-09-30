import { Log } from '../src/log.js';
import { lanaAppender, updateConfig } from '../src/lana.js';
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

describe('lana', () => {
    let lana;
    const originalHref = window.location.href;

    afterEach(() => {
        unmockLana();
        restoreCookie();
        window.history.replaceState({}, '', originalHref);
    });

    beforeEach(() => {
        lana = mockLana();
    });

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

    function facts() {
        const [message] = lana.log.firstCall.args;
        return JSON.parse(message.split('¶facts=')[1]);
    }

    it('calls `window.lana.log` with params', () => {
        Log.reset();

        window.history.replaceState({}, '', '/test/page');

        lanaAppender.append({
            level: Log.Level.ERROR,
            message: 'Test',
            namespace: 'test',
            params: [
                {
                    err: new Error('Houston'),
                    fn: window.open,
                    str: 'test',
                },
            ],
            source: 'testModule',
            timestamp: Date.now(),
        });

        expect(lana.log.firstCall.args).to.deep.equal([
            'Test¶page=/test/page¶facts=[{"err":"Houston","fn":"function open","str":"test","internationalCookie":""}]',
            {
                clientId: 'merch-at-scale',
                delimiter: '¶',
                ignoredProperties: ['analytics', 'literals', 'element'],
                isProdDomain: true,
                serializableTypes: ['Array', 'Object'],
                sampleRate: 1,
                severity: 'e',
                tags: 'acom',
            },
        ]);
    });

    it('will trim page length if longer than 1k characters', () => {
        Log.reset();
        const page = new Array(1001).join('a');
        window.history.replaceState({}, '', page);
        lanaAppender.append({
            level: Log.Level.ERROR,
            message: 'Failed to build price, osi 123: ',
            namespace: 'test',
            params: [
                new Error('Uncaught TypeError: Cannot read properties of null'),
            ],
            source: 'testModule',
            timestamp: Date.now(),
        });

        expect(lana.log.firstCall.args).to.deep.equal([
            'Failed to build price, osi 123:  Uncaught TypeError: Cannot read properties of null¶page=/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa<trunc>¶facts=[{"internationalCookie":""}]',
            {
                clientId: 'merch-at-scale',
                delimiter: '¶',
                ignoredProperties: ['analytics', 'literals', 'element'],
                isProdDomain: true,
                serializableTypes: ['Array', 'Object'],
                sampleRate: 1,
                severity: 'e',
                tags: 'acom',
            },
        ]);
    });

    describe('international cookie', () => {
        beforeEach(() => {
            window.history.replaceState({}, '', '/test/page');
        });

        it('logs an empty internationalCookie when the cookie is absent', () => {
            stubCookie('other=1');

            append();

            expect(facts()).to.deep.equal([{ internationalCookie: '' }]);
        });

        it('logs the cookie value when there are no other facts', () => {
            stubCookie('international=kz');

            append();

            expect(facts()).to.deep.equal([{ internationalCookie: 'kz' }]);
        });

        it('logs the locale prefix verbatim when it is not the first cookie', () => {
            stubCookie('other=1; international=ch_de; ims_country_code=CH');

            append();

            expect(facts()).to.deep.equal([{ internationalCookie: 'ch_de' }]);
        });

        it('merges the cookie into the first fact object', () => {
            stubCookie('international=lu_fr');

            append('inline-price: Failed to render', [
                {
                    'mas-commerce-service:measure':
                        'startTime:1460.40|duration:1.10',
                },
                { other: 'fact' },
            ]);

            expect(facts()).to.deep.equal([
                {
                    'mas-commerce-service:measure':
                        'startTime:1460.40|duration:1.10',
                    internationalCookie: 'lu_fr',
                },
                { other: 'fact' },
            ]);
        });

        it('prepends the cookie fact when the first value is not a plain object', () => {
            stubCookie('international=lu_fr');

            append('Boom', ['a string fact']);

            expect(facts()).to.deep.equal([
                { internationalCookie: 'lu_fr' },
                'a string fact',
            ]);
        });

        it('keeps the cookie fact out of the lana options', () => {
            stubCookie('international=lu_fr');

            append('Boom');

            const [message, options] = lana.log.firstCall.args;
            expect(message).to.equal(
                'Boom¶page=/test/page¶facts=[{"internationalCookie":"lu_fr"}]',
            );
            expect(options).to.not.have.property('international');
            expect(options).to.not.have.property('internationalCookie');
        });
    });
});
