import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import sessionManager from '../src/services/chat-session-manager.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

const id = '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf';
const product = {
    arrangement_code: 'PA-1930',
    product_code: 'PHSP',
    product_family: 'PHOTOSHOP',
    customer_segment: 'TEAM',
    market_segments: ['COM', 'EDU'],
    name: 'Adobe Photoshop',
    copy: { name: 'Adobe Photoshop', description: 'Create images with Photoshop.' },
    assets: { icons: { svg: 'https://example.com/phsp.svg' } },
};
const guided = {
    type: 'guided_step',
    message: 'Found your product:',
    productCards: [{ ...product, label: product.name, value: product.arrangement_code, icon: product.assets.icons.svg }],
};
const send = (el, message, context = {}) =>
    el.handleSendMessage({ detail: { message, context: { ...context, skipDeterministicRouter: true } } });

describe('MasChat state regressions', () => {
    let el;
    let storage;
    let request;
    beforeEach(async () => {
        storage = useIsolatedChatSessionStorage();
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        request = sinon.stub(el, 'callAIChatAction').resolves({ type: 'message', message: 'done', conversationHistory: [] });
    });
    afterEach(() => {
        el.remove();
        sinon.restore();
        storage.restore();
    });
    it('base-only multi-offer handback clears the previous trial', async () => {
        el.selectedReleaseTrialOsi = 'old-trial';
        el.selectedReleaseTrialOffer = { offer_id: 'old-trial-offer' };
        const input = document.createElement('mas-chat-input');
        input.handleMultiOfferSelect({ detail: { base: { osi: 'new-base', offer: { offer_id: 'new-base-offer' } } } });
        let detail;
        input.addEventListener('send-message', (event) => {
            detail = event.detail;
        });
        input.sendMultiOffer();
        await send(el, detail.message, detail.context);
        expect(el.selectedReleaseTrialOsi).to.equal(null);
        expect(el.selectedReleaseTrialOffer).to.equal(null);
    });
    it('a single-offer handback explicitly clears the previous trial', async () => {
        el.selectedReleaseTrialOsi = 'old-trial';
        el.selectedReleaseTrialOffer = { offer_id: 'old-trial-offer' };
        const input = document.createElement('mas-chat-input');
        input.selectedOsi = 'new-base';
        let detail;
        input.addEventListener('send-message', (event) => {
            detail = event.detail;
        });
        input.sendOffer();
        await send(el, detail.message, detail.context);
        expect(el.selectedReleaseTrialOsi).to.equal(null);
        expect(el.selectedReleaseTrialOffer).to.equal(null);
    });
    it('a paired-offer handback preserves the newly selected trial', async () => {
        const input = document.createElement('mas-chat-input');
        input.handleMultiOfferSelect({
            detail: { base: { osi: 'new-base' }, trial: { osi: 'new-trial', offer: { offer_id: 'new-trial-offer' } } },
        });
        let detail;
        input.addEventListener('send-message', (event) => {
            detail = event.detail;
        });
        input.sendMultiOffer();
        await send(el, detail.message, detail.context);
        expect(el.selectedReleaseTrialOsi).to.equal('new-trial');
        expect(el.selectedReleaseTrialOffer).to.deep.equal({ offer_id: 'new-trial-offer' });
    });
    it('unrelated messages preserve the previous trial selection', async () => {
        el.selectedReleaseTrialOsi = 'old-trial';
        el.selectedReleaseTrialOffer = { offer_id: 'old-trial-offer' };
        await send(el, 'help me understand this');
        expect(el.selectedReleaseTrialOsi).to.equal('old-trial');
        expect(el.selectedReleaseTrialOffer).to.deep.equal({ offer_id: 'old-trial-offer' });
    });
    it('switching sessions aborts the pending turn', () => {
        const turn = el.beginTurn();
        const replacement = sessionManager.createSession();
        el.handleSessionChanged({ detail: { sessionId: replacement.id } });
        expect(turn.controller.signal.aborted).to.equal(true);
        expect(el.isCurrentTurn(turn)).to.equal(false);
        expect(el.isLoading).to.equal(false);
    });
    it('a stale response cannot mutate the replacement session', async () => {
        let resolve;
        const pendingResponse = new Promise((done) => {
            resolve = done;
        });
        request.callsFake((params) => (params.requestType ? Promise.resolve({}) : pendingResponse));
        const pending = send(el, 'original session question');
        const replacement = sessionManager.createSession();
        sessionManager.updateSession(replacement.id, {
            messages: [{ role: 'user', content: 'replacement question' }],
            conversationHistory: [{ role: 'user', content: 'replacement history' }],
        });
        el.handleSessionChanged({ detail: { sessionId: replacement.id } });
        resolve({
            type: 'message',
            message: 'stale answer',
            conversationHistory: [{ role: 'assistant', content: 'stale history' }],
        });
        await pending;
        expect(el.messages.some((message) => message.content === 'stale answer')).to.equal(false);
        expect(el.conversationHistory).to.deep.equal([{ role: 'user', content: 'replacement history' }]);
    });
    it('a stale product follow-up cannot populate the replacement session', async () => {
        let resolve;
        const pendingResponse = new Promise((done) => {
            resolve = done;
        });
        request.callsFake((params) => (params.requestType ? Promise.resolve({}) : pendingResponse));
        const pending = el.continueWithOperationResult('list_products', { products: [product] });
        const replacement = sessionManager.createSession();
        el.handleSessionChanged({ detail: { sessionId: replacement.id } });
        resolve(guided);
        await pending;
        expect(el.messages).to.deep.equal([]);
        expect(el.selectedReleaseProduct).to.equal(null);
        expect(el.isLoading).to.equal(false);
        expect(el.loadingLabel).to.equal('');
    });
    for (const clearAll of [false, true]) {
        it(`creates a persistent replacement after ${clearAll ? 'clearing all sessions' : 'deleting the final session'}`, async () => {
            el.conversationHistory = [{ role: 'assistant', content: 'old history' }];
            const deleted = el.currentSessionId;
            if (clearAll) sessionManager.createSession('another session');
            for (const session of sessionManager.listSessions()) sessionManager.deleteSession(session.id);
            el.handleSessionChanged({ detail: { sessionId: null } });
            expect(el.currentSessionId).to.not.equal(deleted);
            expect(sessionManager.getSession(el.currentSessionId)).to.exist;
            expect(el.conversationHistory).to.deep.equal([]);
            const clock = sinon.useFakeTimers({ shouldClearNativeTimers: true });
            await send(el, 'replacement question');
            el.saveCurrentSession();
            clock.tick(500);
            expect(
                sessionManager
                    .getSession(el.currentSessionId)
                    .messages.some((message) => message.content === 'replacement question'),
            ).to.equal(true);
        });
    }
    for (const branch of ['direct response', 'follow-up response', 'local singleton', 'resolved product']) {
        it(`preserves metadata through ${branch} into saved AEM tags`, async () => {
            el.selectedReleaseOsi = 'base-selector';
            if (branch === 'direct response') {
                request.onFirstCall().resolves(guided);
                await send(el, 'find my product');
            } else if (branch === 'follow-up response') {
                request.onFirstCall().resolves(guided);
                await el.continueWithOperationResult('list_products', { products: [product] });
            } else if (branch === 'local singleton') {
                await el.presentProductSelection({ products: [product] }, 'photoshop');
            } else {
                await el.handleResolvedReleaseProduct({ product, arrangementCode: product.arrangement_code });
            }
            const getElement = customElements.get.bind(customElements);
            sinon
                .stub(customElements, 'get')
                .callsFake((name) =>
                    name === 'merch-card'
                        ? { getFragmentMapping: () => ({ title: {}, description: {}, ctas: {}, mnemonics: {}, osi: {} }) }
                        : name === 'aem-fragment'
                          ? undefined
                          : getElement(name),
                );
            let saved;
            sinon.stub(el, 'repository').get(() => ({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                create: async (data) => {
                                    saved = data;
                                    return null;
                                },
                            },
                        },
                    },
                },
            }));
            await el.saveDraftToAEM({ variant: 'catalog' }, { parentPath: '/content/dam/mas/sandbox/en_US', name: 'draft' });
            expect(saved.tags).to.include.members([
                'mas:product_code/PHSP',
                'mas:pa/PA-1930',
                'mas:product_family/PHOTOSHOP',
                'mas:customer_segment/TEAM',
                'mas:market_segments/COM',
                'mas:market_segments/EDU',
            ]);
        });
    }
    for (const operationResult of [
        { success: true, operation: 'copy', newFragmentId: id, newFragmentTitle: 'Copy', message: 'Copied' },
        { success: true, operation: 'update', fragmentId: id, fragmentTitle: 'Updated', message: 'Updated' },
        { success: true, operation: 'publish', fragmentId: id, fragmentTitle: 'Published', message: 'Published' },
        { success: true, operation: 'get', fragment: { id, title: 'Read card' } },
        { success: true, operation: 'get_variations', parent: { id, title: 'Parent' }, variations: [] },
        { success: true, operation: 'get_variations', parent: null, variations: [{ id, title: 'Variation' }] },
    ]) {
        it(`sends structured ${operationResult.operation} ids through actual next request context`, async () => {
            el.messages = [{ role: 'assistant', operationResult }];
            await send(el, 'publish that card');
            const sent = request.firstCall.args[0].context;
            expect(sent.lastOperation.fragmentIds).to.include(id);
            expect(sent.workingSet.map((fragment) => fragment.id)).to.include(id);
        });
    }
    it('sends only successful partial-release child cards as next-request provenance', async () => {
        const failedId = '12f26a12-118e-4367-b4d2-d8b6995bd9ab';
        el.messages = [
            {
                role: 'assistant',
                operationResult: {
                    success: false,
                    operation: 'create_release_cards',
                    results: [{ id: failedId }],
                    fragmentId: failedId,
                    message: `Failed card ${failedId}`,
                    rawResult: {
                        cards: [
                            { success: true, card: { id, title: 'Created card', variant: 'plans' } },
                            { success: false, card: { id: failedId, title: 'Failed card' } },
                            { card: { id: failedId, title: 'Unconfirmed card' } },
                        ],
                    },
                },
            },
        ];
        await send(el, 'publish the created card');
        const context = request.firstCall.args[0].context;
        expect(context.lastOperation.fragmentIds).to.deep.equal([id]);
        expect(context.workingSet.map((fragment) => fragment.id)).to.deep.equal([id]);
    });
    it('does not extract ids from assistant narrative or failed operations', async () => {
        el.messages = [
            { role: 'assistant', content: `Found ${id}` },
            { role: 'assistant', operationResult: { success: false, newFragmentId: id, message: `Could not copy ${id}` } },
        ];
        await send(el, 'publish that card');
        const sent = request.firstCall.args[0].context;
        expect(sent.lastOperation.fragmentIds).to.deep.equal([]);
        expect(sent.workingSet).to.deep.equal([]);
    });
});
