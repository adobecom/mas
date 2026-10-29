import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Events from '../src/events.js';
import {
    SLOW_REQUEST_THRESHOLD_MS,
    classifyRequest,
    trackedFetch,
    resetSlowRequestToastGuard,
} from '../src/network-latency.js';

describe('network-latency', () => {
    let sandbox;
    let fetchStub;
    let toastSpy;
    let lanaLogSpy;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        fetchStub = sandbox.stub(window, 'fetch');
        sandbox.stub(performance, 'now').returns(0);
        lanaLogSpy = sandbox.spy();
        window.lana = { log: lanaLogSpy };
        toastSpy = sandbox.spy();
        Events.toast.subscribe(toastSpy);
        resetSlowRequestToastGuard();
    });

    afterEach(() => {
        Events.toast.unsubscribe(toastSpy);
        delete window.lana;
        sandbox.restore();
    });

    function stubDuration(durationMs) {
        let call = 0;
        performance.now.callsFake(() => (call++ === 0 ? 0 : durationMs));
    }

    describe('trackedFetch', () => {
        it('returns the original response without altering url/options for a fast request', async () => {
            const response = new Response(null, { status: 200 });
            fetchStub.resolves(response);
            stubDuration(1000);

            const options = { method: 'GET', headers: { foo: 'bar' } };
            const result = await trackedFetch('https://author.example.com/path', options);

            expect(result).to.equal(response);
            expect(fetchStub.firstCall.args).to.deep.equal(['https://author.example.com/path', options]);
            expect(lanaLogSpy.called).to.be.false;
            expect(toastSpy.called).to.be.false;
        });

        it('logs to Lana and shows a warning toast when a request exceeds the threshold', async () => {
            const response = new Response(null, {
                status: 200,
                headers: { 'X-Request-Id': 'req-123' },
            });
            fetchStub.resolves(response);
            stubDuration(SLOW_REQUEST_THRESHOLD_MS + 1000);

            await trackedFetch('https://author.example.com/adobe/sites/cf/fragments/abc', { method: 'PUT' });

            expect(lanaLogSpy.calledOnce).to.be.true;
            const [message, options] = lanaLogSpy.firstCall.args;
            expect(message).to.include('author.example.com');
            expect(message).to.include('"durationMs":6000');
            expect(message).to.include('"requestType":"save"');
            expect(options).to.deep.equal({
                clientId: 'merch-at-scale-studio',
                delimiter: '¶',
                sampleRate: 100,
                tags: 'studio',
            });

            expect(toastSpy.calledOnce).to.be.true;
            const [{ variant, content }] = toastSpy.firstCall.args;
            expect(variant).to.equal('warning');
            expect(content).to.equal(
                'author.example.com took longer than 5 seconds to respond - expect slowness. Request Id: req-123',
            );
        });

        it('does not log or toast when a request stays under the threshold', async () => {
            fetchStub.resolves(new Response(null, { status: 200 }));
            stubDuration(1000);

            await trackedFetch('https://author.example.com/path', { method: 'GET' });

            expect(lanaLogSpy.called).to.be.false;
            expect(toastSpy.called).to.be.false;
        });

        it('shows only one toast across two consecutive slow requests, but logs both', async () => {
            fetchStub.resolves(new Response(null, { status: 200 }));

            stubDuration(6000);
            await trackedFetch('https://author.example.com/one', { method: 'GET' });
            stubDuration(6000);
            await trackedFetch('https://author.example.com/two', { method: 'GET' });

            expect(lanaLogSpy.callCount).to.equal(2);
            expect(toastSpy.callCount).to.equal(1);
        });

        it('still logs and toasts a slow request that rejects, and rethrows the rejection', async () => {
            const error = new Error('network down');
            fetchStub.rejects(error);
            stubDuration(6000);

            let caught;
            try {
                await trackedFetch('https://author.example.com/path', { method: 'POST' });
            } catch (err) {
                caught = err;
            }

            expect(caught).to.equal(error);
            expect(lanaLogSpy.calledOnce).to.be.true;
            const [message] = lanaLogSpy.firstCall.args;
            expect(message).to.include('"requestId":"unknown"');
            expect(toastSpy.calledOnce).to.be.true;
        });
    });

    describe('classifyRequest', () => {
        it('classifies GET and HEAD requests', () => {
            const searchUrl = 'https://a.example.com/cf/fragments/search';
            expect(classifyRequest(searchUrl, 'GET')).to.equal('GET');
            expect(classifyRequest(searchUrl, 'HEAD')).to.equal('GET');
        });

        it('classifies publish endpoints, including bulk-publish variants', () => {
            const publishUrl = 'https://a.example.com/adobe/sites/cf/fragments/publish';
            expect(classifyRequest(publishUrl, 'POST')).to.equal('publish');
            expect(classifyRequest('https://io.example.com/bulk-publish', 'POST')).to.equal('publish');
            expect(classifyRequest('https://io.example.com/bulk-revert', 'POST')).to.equal('publish');
            expect(classifyRequest('https://io.example.com/bulk-publish-reset', 'POST')).to.equal('publish');
        });

        it('classifies delete endpoints', () => {
            const deleteUrl = 'https://a.example.com/adobe/sites/cf/fragments/abc/deleteAndUnpublish';
            expect(classifyRequest(deleteUrl, 'DELETE')).to.equal('delete');
            expect(classifyRequest('https://a.example.com/path', 'DELETE')).to.equal('delete');
        });

        it('classifies other writes as save', () => {
            const saveUrl = 'https://a.example.com/adobe/sites/cf/fragments/abc';
            expect(classifyRequest(saveUrl, 'PUT')).to.equal('save');
            expect(classifyRequest('https://io.example.com/bulk-save-snapshot', 'POST')).to.equal('save');
        });
    });
});
