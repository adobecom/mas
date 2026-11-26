import { Log } from '../src/log.js';
import { config, lanaAppender, updateConfig } from '../src/lana.js';
import { mockLana, unmockLana } from './mocks/lana.js';
import { expect } from './utilities.js';

updateConfig({ isProdDomain: true });

describe('lana', () => {
    let lana;
    const originalHref = window.location.href;

    afterEach(() => {
        unmockLana();
        config.country = '';
        config.locale = '';
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
            'Test¶page=/test/page¶facts=[{"err":"Houston","fn":"function open","str":"test","mas-commerce-service:country":"","mas-commerce-service:locale":""}]',
            {
                clientId: 'merch-at-scale',
                delimiter: '¶',
                ignoredProperties: ['analytics', 'literals', 'element'],
                isProdDomain: true,
                serializableTypes: ['Array', 'Object'],
                sampleRate: 1,
                severity: 'e',
                tags: 'acom',
                country: '',
                locale: '',
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
            'Failed to build price, osi 123:  Uncaught TypeError: Cannot read properties of null¶page=/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa<trunc>¶facts=[{"mas-commerce-service:country":"","mas-commerce-service:locale":""}]',
            {
                clientId: 'merch-at-scale',
                delimiter: '¶',
                ignoredProperties: ['analytics', 'literals', 'element'],
                isProdDomain: true,
                serializableTypes: ['Array', 'Object'],
                sampleRate: 1,
                severity: 'e',
                tags: 'acom',
                country: '',
                locale: '',
            },
        ]);
    });

    describe('commerce service country and locale', () => {
        beforeEach(() => {
            window.history.replaceState({}, '', '/test/page');
        });

        it('logs an empty country and locale before the service activates', () => {
            append();

            expect(facts()).to.deep.equal([
                {
                    'mas-commerce-service:country': '',
                    'mas-commerce-service:locale': '',
                },
            ]);
        });

        it('logs the country and locale when there are no other facts', () => {
            updateConfig({ country: 'KZ', locale: 'ru_KZ' });

            append();

            expect(facts()).to.deep.equal([
                {
                    'mas-commerce-service:country': 'KZ',
                    'mas-commerce-service:locale': 'ru_KZ',
                },
            ]);
        });

        it('merges the country and locale into the first fact object', () => {
            updateConfig({ country: 'LU', locale: 'fr_LU' });

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
                    'mas-commerce-service:country': 'LU',
                    'mas-commerce-service:locale': 'fr_LU',
                },
                { other: 'fact' },
            ]);
        });

        it('prepends the country and locale facts when the first value is not a plain object', () => {
            updateConfig({ country: 'LU', locale: 'fr_LU' });

            append('Boom', ['a string fact']);

            expect(facts()).to.deep.equal([
                {
                    'mas-commerce-service:country': 'LU',
                    'mas-commerce-service:locale': 'fr_LU',
                },
                'a string fact',
            ]);
        });

        it('logs the country and locale for messages raised without any params', () => {
            updateConfig({ country: 'KZ', locale: 'ru_KZ' });

            append('MERCH-CARD failed to initialize');

            const [message] = lana.log.firstCall.args;
            expect(message).to.equal(
                'MERCH-CARD failed to initialize\u00b6page=/test/page\u00b6facts=[{"mas-commerce-service:country":"KZ","mas-commerce-service:locale":"ru_KZ"}]',
            );
        });
    });
});
