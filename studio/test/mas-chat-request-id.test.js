import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

/**
 * Every bug reported today was diagnosed by instrumenting the browser, because
 * nothing tied a user's report to a server-side trace. The action's log lines
 * all carry the activation id, so one id retrieves the whole turn — but the id
 * only reached the caller when the response failed to parse, never for a
 * response that parsed and was merely wrong, which is what gets reported.
 */
describe('MasChat records the id a report can be traced by', () => {
    let el;
    let storageSandbox;

    const respondWith = (body, headers = {}) => {
        sinon.stub(window, 'fetch').resolves({
            ok: true,
            status: 200,
            headers: { get: (name) => headers[name.toLowerCase()] ?? null },
            json: async () => body,
        });
    };

    beforeEach(async () => {
        storageSandbox = useIsolatedChatSessionStorage();
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        window.adobeIMS = { getAccessToken: () => ({ token: 'tok' }), adobeIdData: { client_id: 'mas-studio' } };
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
        storageSandbox.restore();
    });

    it('takes the id from the response body', async () => {
        respondWith({ type: 'message', message: 'hi', requestId: 'act-abc-123' });

        await el.callAIChatAction({ message: 'hello' });

        expect(el.lastRequestId).to.equal('act-abc-123');
    });

    it('falls back to the header when the body carries none', async () => {
        respondWith({ type: 'message', message: 'hi' }, { 'x-openwhisk-activation-id': 'act-from-header' });

        await el.callAIChatAction({ message: 'hello' });

        expect(el.lastRequestId).to.equal('act-from-header');
    });

    it('records nothing rather than a stale id when neither is present', async () => {
        respondWith({ type: 'message', message: 'hi' });

        await el.callAIChatAction({ message: 'hello' });

        expect(el.lastRequestId).to.equal(null);
    });
});
