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
    });

    it('logs the message with the page path and facts', () => {
        logToLana('Something happened', { a: 1 }, 100);
        expect(window.lana.log.firstCall.args[0]).to.equal(`Something happened¶page=${window.location.pathname}¶facts={"a":1}`);
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
