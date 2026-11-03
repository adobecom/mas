import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    REQUEST_TYPE,
    SLOW_REQUEST_THRESHOLD_MS,
    classifyRequest,
    createTrackedFetch,
    startNetworkLatencyMonitor,
} from '../../src/utils/network-latency.js';

const SLOW = SLOW_REQUEST_THRESHOLD_MS + 1;
const AEM_URL = 'https://author.example.com/adobe/sites/cf/fragments/abc';

function formData(entries) {
    const body = new FormData();
    Object.entries(entries).forEach(([key, value]) => body.append(key, value));
    return body;
}

function okResponse(headers = { 'X-Request-Id': 'req-1' }) {
    return new Response('{}', { status: 200, headers });
}

function setup({ fetch = async () => okResponse(), duration = SLOW } = {}) {
    let clock = 0;
    const log = sinon.stub();
    const warn = sinon.stub();
    const now = () => {
        clock += duration;
        return clock;
    };
    return { log, warn, trackedFetch: createTrackedFetch({ fetch, log, warn, now }) };
}

describe('classifyRequest', () => {
    const rows = [
        ['GET', AEM_URL, 'GET', undefined, REQUEST_TYPE.GET],
        ['HEAD', AEM_URL, 'HEAD', undefined, REQUEST_TYPE.GET],
        [
            'read-only bulk publish access POST',
            'https://io.example.com/bulk-publish-access',
            'POST',
            undefined,
            REQUEST_TYPE.GET,
        ],
        ['read-only member list POST', 'https://io.example.com/listMembers', 'POST', undefined, REQUEST_TYPE.GET],
        ['fragment save PUT', AEM_URL, 'PUT', undefined, REQUEST_TYPE.SAVE],
        ['generic POST', AEM_URL, 'POST', undefined, REQUEST_TYPE.SAVE],
        [
            'fragment publish',
            'https://author.example.com/adobe/sites/cf/fragments/publish',
            'POST',
            undefined,
            REQUEST_TYPE.PUBLISH,
        ],
        ['bulk publish', 'https://io.example.com/bulk-publish', 'POST', undefined, REQUEST_TYPE.PUBLISH],
        ['bulk revert', 'https://io.example.com/bulk-revert', 'POST', undefined, REQUEST_TYPE.PUBLISH],
        ['HTTP DELETE', AEM_URL, 'DELETE', undefined, REQUEST_TYPE.DELETE],
        ['delete form body', AEM_URL, 'POST', formData({ ':operation': 'delete' }), REQUEST_TYPE.DELETE],
        ['non-delete form body', AEM_URL, 'POST', formData({ cmd: 'copyPage' }), REQUEST_TYPE.SAVE],
        ['AI chat', 'https://io.example.com/ai-chat', 'POST', undefined, REQUEST_TYPE.CHAT],
    ];

    rows.forEach(([name, url, method, body, expected]) => {
        it(`classifies ${name} as ${expected}`, () => {
            expect(classifyRequest(url, method, body)).to.equal(expected);
        });
    });
});

describe('createTrackedFetch', () => {
    it('does not report a request at the threshold', async () => {
        const { trackedFetch, log, warn } = setup({ duration: SLOW_REQUEST_THRESHOLD_MS });
        await trackedFetch(AEM_URL);
        expect(log.called || warn.called).to.be.false;
    });

    it('returns the original response', async () => {
        const response = okResponse();
        const { trackedFetch } = setup({ fetch: async () => response });
        expect(await trackedFetch(AEM_URL)).to.equal(response);
    });

    it('forwards the arguments to fetch', async () => {
        const fetch = sinon.stub().resolves(okResponse());
        const { trackedFetch } = setup({ fetch });
        const options = { method: 'PUT' };
        await trackedFetch(AEM_URL, options);
        expect(fetch.firstCall.args).to.deep.equal([AEM_URL, options]);
    });

    it('logs the facts of a slow response', async () => {
        const { trackedFetch, log } = setup();
        await trackedFetch(AEM_URL, { method: 'PUT' });
        expect(log.firstCall.args[0]).to.deep.equal({
            domain: 'author.example.com',
            durationMs: SLOW,
            requestType: REQUEST_TYPE.SAVE,
            method: 'PUT',
            status: 200,
            requestId: 'req-1',
        });
    });

    it('warns with the domain and request id', async () => {
        const { trackedFetch, warn } = setup();
        await trackedFetch(AEM_URL);
        expect(warn.firstCall.args[0]).to.equal(
            'author.example.com took longer than 5 seconds to respond - expect slowness. Request Id: req-1',
        );
    });

    it('warns only once while logging every slow request', async () => {
        const { trackedFetch, log, warn } = setup();
        await trackedFetch(AEM_URL);
        await trackedFetch(AEM_URL);
        expect([log.callCount, warn.callCount]).to.deep.equal([2, 1]);
    });

    it('reports an unknown request id when the header is missing', async () => {
        const { trackedFetch, log } = setup({ fetch: async () => okResponse({}) });
        await trackedFetch(AEM_URL);
        expect(log.firstCall.args[0].requestId).to.equal('unknown');
    });

    it('rethrows the original error of a slow failure', async () => {
        const failure = new TypeError('Failed to fetch');
        const { trackedFetch } = setup({ fetch: async () => Promise.reject(failure) });
        const caught = await trackedFetch(AEM_URL).catch((err) => err);
        expect(caught).to.equal(failure);
    });

    it('logs the error name of a slow failure', async () => {
        const { trackedFetch, log } = setup({ fetch: async () => Promise.reject(new TypeError('Failed to fetch')) });
        await trackedFetch(AEM_URL).catch(() => {});
        expect(log.firstCall.args[0]).to.include({ error: 'TypeError', requestId: 'unknown' });
    });

    it('ignores an aborted request', async () => {
        const { trackedFetch, log, warn } = setup({
            fetch: async () => Promise.reject(new DOMException('Aborted', 'AbortError')),
        });
        await trackedFetch(AEM_URL).catch(() => {});
        expect(log.called || warn.called).to.be.false;
    });

    it('still warns on a slow request after an aborted one', async () => {
        const fetch = sinon.stub();
        fetch.onFirstCall().rejects(new DOMException('Aborted', 'AbortError'));
        fetch.onSecondCall().resolves(okResponse());
        const { trackedFetch, warn } = setup({ fetch });
        await trackedFetch(AEM_URL).catch(() => {});
        await trackedFetch(AEM_URL);
        expect(warn.calledOnce).to.be.true;
    });

    it('reports a request that timed out', async () => {
        const { trackedFetch, log } = setup({
            fetch: async () => Promise.reject(new DOMException('Timed out', 'TimeoutError')),
        });
        await trackedFetch(AEM_URL).catch(() => {});
        expect(log.firstCall.args[0].error).to.equal('TimeoutError');
    });

    it('logs a slow AI chat request without warning', async () => {
        const { trackedFetch, log, warn } = setup();
        await trackedFetch('https://io.example.com/ai-chat', { method: 'POST' });
        expect([log.callCount, warn.callCount]).to.deep.equal([1, 0]);
    });

    it('still warns on a slow request after a slow AI chat', async () => {
        const { trackedFetch, warn } = setup();
        await trackedFetch('https://io.example.com/ai-chat', { method: 'POST' });
        await trackedFetch(AEM_URL);
        expect(warn.calledOnce).to.be.true;
    });

    it('returns the response when reporting throws', async () => {
        const response = okResponse();
        const { trackedFetch, log } = setup({ fetch: async () => response });
        log.throws(new Error('log failed'));
        expect(await trackedFetch(AEM_URL)).to.equal(response);
    });

    it('rethrows the original error when reporting throws', async () => {
        const failure = new TypeError('Failed to fetch');
        const { trackedFetch, log } = setup({ fetch: async () => Promise.reject(failure) });
        log.throws(new Error('log failed'));
        const caught = await trackedFetch(AEM_URL).catch((err) => err);
        expect(caught).to.equal(failure);
    });

    it('reads the url and method from a Request', async () => {
        const { trackedFetch, log } = setup();
        await trackedFetch(new Request(AEM_URL, { method: 'PUT' }));
        expect(log.firstCall.args[0]).to.include({ domain: 'author.example.com', method: 'PUT' });
    });

    it('normalizes a lower-case method', async () => {
        const { trackedFetch, log } = setup();
        await trackedFetch(AEM_URL, { method: 'put' });
        expect(log.firstCall.args[0]).to.include({ method: 'PUT', requestType: REQUEST_TYPE.SAVE });
    });

    it('reads the domain from a URL object', async () => {
        const { trackedFetch, log } = setup();
        await trackedFetch(new URL(AEM_URL));
        expect(log.firstCall.args[0].domain).to.equal('author.example.com');
    });

    it('resolves a relative url against the page', async () => {
        const { trackedFetch, log } = setup();
        await trackedFetch('/studio.json');
        expect(log.firstCall.args[0].domain).to.equal(window.location.hostname);
    });
});

describe('startNetworkLatencyMonitor', () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = window.fetch;
    });

    afterEach(() => {
        window.fetch = originalFetch;
    });

    it('routes window.fetch through the original fetch', async () => {
        const response = okResponse();
        const stub = sinon.stub().resolves(response);
        window.fetch = stub;
        startNetworkLatencyMonitor();
        expect(await window.fetch(AEM_URL)).to.equal(response);
        expect(stub.calledOnce).to.be.true;
    });
});
