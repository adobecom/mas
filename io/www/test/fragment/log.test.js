import { expect } from 'chai';
import sinon from 'sinon';
import { getErrorContext, getErrorMessage, log, logDebug, logError } from '../../src/fragment/utils/log.js';

describe('log utils', () => {
    let consoleLogStub;
    let consoleErrorStub;
    const baseContext = {
        api_key: 'n/a',
        requestId: 'mas-test',
        id: 'some-fragment',
        locale: 'fr_FR',
        loggedTransformer: 'replace',
    };

    beforeEach(() => {
        consoleLogStub = sinon.stub(console, 'log');
        consoleErrorStub = sinon.stub(console, 'error');
    });

    afterEach(() => {
        consoleLogStub.restore();
        consoleErrorStub.restore();
    });

    it('getErrorContext returns status and detail from response json', async () => {
        const response = {
            status: 502,
            json: async () => ({ detail: 'fetch failed' }),
        };
        const result = await getErrorContext(response);
        expect(result).to.deep.equal({
            status: 502,
            message: 'fetch failed',
        });
    });

    it('getErrorContext falls back to 503 when status missing', async () => {
        const response = {
            json: async () => ({}),
        };
        const result = await getErrorContext(response);
        expect(result).to.deep.equal({
            status: 503,
            message: undefined,
        });
    });

    it('getErrorMessage returns fallback when response json throws', async () => {
        const response = {
            message: 'nok',
            json: async () => {
                throw new Error('boom');
            },
        };
        const message = await getErrorMessage(response);
        expect(message).to.equal('nok');
    });

    it('getErrorMessage returns detail when json parsing succeeds', async () => {
        const response = {
            json: async () => ({ detail: 'something bad' }),
        };
        const message = await getErrorMessage(response);
        expect(message).to.equal('something bad');
    });

    it('log and logError format prefix correctly', () => {
        log('hello', baseContext);
        logError('oops', baseContext);
        expect(consoleLogStub.calledOnce).to.be.true;
        expect(consoleLogStub.firstCall.args[0]).to.include('[info][n/a][mas-test][some-fragment][fr_FR][replace] hello');
        expect(consoleErrorStub.calledOnce).to.be.true;
        expect(consoleErrorStub.firstCall.args[0]).to.include('[error][n/a][mas-test][some-fragment][fr_FR][replace] oops');
    });

    it('logDebug logs only when debugLogs is true', () => {
        logDebug(() => 'debug msg', { ...baseContext, debugLogs: false });
        expect(consoleLogStub.called).to.be.false;
        logDebug(() => 'debug msg', { ...baseContext, debugLogs: true });
        expect(consoleLogStub.calledOnce).to.be.true;
        expect(consoleLogStub.firstCall.args[0]).to.include('[debug][n/a][mas-test][some-fragment][fr_FR][replace] debug msg');
    });
});
