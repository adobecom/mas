import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';

describe('MasChat callAIChatAction response guarding', () => {
    let el;

    beforeEach(() => {
        el = document.createElement('mas-chat');
        window.adobeIMS = {
            getAccessToken: () => ({ token: 'test-token' }),
            adobeIdData: { client_id: 'test-client' },
        };
    });

    afterEach(() => {
        sinon.restore();
        delete window.adobeIMS;
    });

    it('throws a status-bearing error when a 200 body is not valid JSON', async () => {
        sinon.stub(window, 'fetch').resolves(new Response('<html>gateway timeout</html>', { status: 200 }));
        try {
            await el.callAIChatAction({ message: 'hi' });
            throw new Error('expected callAIChatAction to throw');
        } catch (error) {
            expect(error.message).to.include('unreadable');
            expect(error.message).to.include('200');
        }
    });

    it('surfaces the server error body on a non-ok response', async () => {
        sinon
            .stub(window, 'fetch')
            .resolves(new Response(JSON.stringify({ error: 'Failed to get AI response' }), { status: 502 }));
        try {
            await el.callAIChatAction({ message: 'hi' });
            throw new Error('expected callAIChatAction to throw');
        } catch (error) {
            expect(error.message).to.include('Failed to get AI response');
        }
    });

    it('returns the parsed body for a healthy response', async () => {
        sinon
            .stub(window, 'fetch')
            .resolves(new Response(JSON.stringify({ type: 'message', message: 'hello' }), { status: 200 }));
        const body = await el.callAIChatAction({ message: 'hi' });
        expect(body).to.deep.equal({ type: 'message', message: 'hello' });
    });
});
