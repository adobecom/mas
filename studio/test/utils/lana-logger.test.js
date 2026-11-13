import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { logToLana } from '../../src/utils/lana-logger.js';

describe('logToLana', () => {
    let originalLana;

    beforeEach(() => {
        originalLana = window.lana;
        window.lana = { log: sinon.stub() };
    });

    afterEach(() => {
        window.lana = originalLana;
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    });

    it('logs the message with the Studio page, path and facts from the hash', () => {
        window.location.hash = 'page=content&path=sandbox';
        logToLana('Something happened', { a: 1 }, 100);
        expect(window.lana.log.firstCall.args[0]).to.equal('Something happened¶page=content¶path=sandbox¶facts={"a":1}');
    });

    it('logs an empty page and path when the hash has none', () => {
        logToLana('Something happened', {}, 100);
        expect(window.lana.log.firstCall.args[0]).to.equal('Something happened¶page=¶path=¶facts={}');
    });

    it('keeps an encoded delimiter in the page inside a single telemetry field', () => {
        window.location.hash = 'page=content%C2%B6path%3Dforged&path=sandbox';
        logToLana('Something happened', {}, 100);
        expect(window.lana.log.firstCall.args[0].split('¶')).to.deep.equal([
            'Something happened',
            'page=content%C2%B6path%3Dforged',
            'path=sandbox',
            'facts={}',
        ]);
    });

    it('keeps an encoded delimiter in the path inside a single telemetry field', () => {
        window.location.hash = 'page=content&path=sandbox%C2%B6page%3Dforged';
        logToLana('Something happened', {}, 100);
        expect(window.lana.log.firstCall.args[0].split('¶')).to.deep.equal([
            'Something happened',
            'page=content',
            'path=sandbox%C2%B6page%3Dforged',
            'facts={}',
        ]);
    });

    it('uses the Studio client with the given sample rate', () => {
        logToLana('Something happened', {}, 100);
        expect(window.lana.log.firstCall.args[1]).to.deep.equal({
            clientId: 'merch-at-scale-studio',
            delimiter: '¶',
            sampleRate: 100,
            tags: 'studio',
        });
    });

    it('does nothing when Lana is unavailable', () => {
        window.lana = undefined;
        expect(() => logToLana('Something happened', {}, 100)).to.not.throw();
    });
});
