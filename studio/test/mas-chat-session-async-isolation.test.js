import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import sessionManager from '../src/services/chat-session-manager.js';
import { clearProductCache } from '../src/services/product-api.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

const product = {
    arrangement_code: 'PA-1930',
    product_code: 'OLD',
    name: 'Old product',
    copy: { description: 'Old product description' },
};
const confirmation = {
    type: 'release_confirmation',
    message: 'Old confirmation',
    confirmationSummary: { product: { arrangement_code: 'PA-1930' } },
    conversationHistory: [{ role: 'assistant', content: 'old history' }],
};
const deferred = () => {
    let resolve;
    const promise = new Promise((done) => {
        resolve = done;
    });
    return { promise, resolve };
};

describe('MasChat isolates asynchronous work after model responses', () => {
    let el;
    let storage;
    let ai;
    beforeEach(async () => {
        storage = useIsolatedChatSessionStorage();
        clearProductCache();
        window.adobeIMS = { getAccessToken: () => ({ token: 'test-token' }) };
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        ai = sinon.stub(el, 'callAIChatAction');
        ai.callsFake((params) => Promise.resolve(params.requestType ? {} : { type: 'message', message: 'done' }));
    });
    afterEach(() => {
        el.remove();
        sinon.restore();
        storage.restore();
        clearProductCache();
        delete window.adobeIMS;
    });
    const send = (el) =>
        el.handleSendMessage({ detail: { message: 'old product', context: { skipDeterministicRouter: true } } });
    const replaceSession = (el) => {
        const session = sessionManager.createSession();
        sessionManager.updateSession(session.id, {
            messages: [{ role: 'user', content: 'replacement question' }],
            conversationHistory: [{ role: 'user', content: 'replacement history' }],
        });
        el.handleSessionChanged({ detail: { sessionId: session.id } });
        el.selectedReleaseProduct = { arrangement_code: 'PA-NEW', name: 'Replacement product' };
    };
    const assertReplacement = (el) => {
        expect(el.messages).to.deep.equal([{ role: 'user', content: 'replacement question' }]);
        expect(el.conversationHistory).to.deep.equal([{ role: 'user', content: 'replacement history' }]);
        expect(el.selectedReleaseProduct).to.deep.equal({ arrangement_code: 'PA-NEW', name: 'Replacement product' });
        expect(el.isLoading).to.equal(false);
    };
    for (const branch of [
        'initial confirmation detail',
        'confirmation description fallback',
        'follow-up confirmation detail',
        'recovery catalog',
        'operation result',
    ]) {
        it(`rejects stale ${branch} after the initial model response`, async () => {
            const started = deferred();
            const result = deferred();
            sinon.stub(window, 'fetch').callsFake(() => {
                started.resolve();
                return result.promise;
            });
            let pending;
            if (branch === 'recovery catalog') {
                el.messages = [{ role: 'assistant', content: 'Which product?', buttonGroup: { label: 'Product' } }];
                pending = send(el);
            } else if (branch === 'operation result') {
                ai.onFirstCall().resolves({
                    type: 'studio_operation',
                    operationName: 'get_product_by_arrangement_code',
                    operationParams: { arrangementCode: 'PA-1930' },
                    conversationHistory: [{ role: 'assistant', content: 'old operation history' }],
                });
                pending = send(el);
            } else {
                ai.onFirstCall().resolves(confirmation);
                if (branch === 'confirmation description fallback') el.selectedReleaseProduct = { arrangement_code: 'PA-1930' };
                pending =
                    branch === 'follow-up confirmation detail'
                        ? el.continueWithOperationResult('list_products', { products: [product] })
                        : send(el);
            }
            await started.promise;
            replaceSession(el);
            result.resolve(
                new Response(
                    JSON.stringify(branch === 'recovery catalog' ? [product] : { product, arrangementCode: 'PA-1930' }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } },
                ),
            );
            await pending;
            assertReplacement(el);
        });
    }
    for (const returnToOriginal of [false, true]) {
        it(`isolates an operation started without a turn${returnToOriginal ? ' across A to B to A' : ''}`, async () => {
            const started = deferred();
            const result = deferred();
            sinon.stub(window, 'fetch').callsFake(() => {
                started.resolve();
                return result.promise;
            });
            const originalId = el.currentSessionId;
            const pending = el.executeOperation({
                type: 'studio_operation',
                operationName: 'get_product_by_arrangement_code',
                operationParams: { arrangementCode: 'PA-1930' },
            });
            await started.promise;
            replaceSession(el);
            if (returnToOriginal) {
                el.handleSessionChanged({ detail: { sessionId: originalId } });
                el.messages = [{ role: 'user', content: 'replacement question' }];
                el.conversationHistory = [{ role: 'user', content: 'replacement history' }];
                el.selectedReleaseProduct = { arrangement_code: 'PA-NEW', name: 'Replacement product' };
            }
            result.resolve(
                new Response(JSON.stringify({ product, arrangementCode: 'PA-1930' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }),
            );
            await pending;
            assertReplacement(el);
        });
    }
    for (const branch of ['single draft', 'release drafts']) {
        it(`rejects stale ${branch} persistence completion`, async () => {
            const started = deferred();
            const result = deferred();
            const originalGet = customElements.get.bind(customElements);
            sinon
                .stub(customElements, 'get')
                .callsFake((name) =>
                    name === 'merch-card'
                        ? { getFragmentMapping: () => ({ title: {}, description: {}, ctas: {}, osi: {} }) }
                        : name === 'aem-fragment'
                          ? undefined
                          : originalGet(name),
                );
            let creates = 0;
            sinon.stub(el, 'repository').get(() => ({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                create: () => {
                                    creates += 1;
                                    started.resolve();
                                    return result.promise;
                                },
                            },
                        },
                    },
                },
            }));
            el.selectedReleaseProduct = product;
            ai.onFirstCall().resolves(
                branch === 'single draft'
                    ? {
                          type: 'card',
                          cardConfig: { variant: 'catalog' },
                          message: 'Old card',
                          conversationHistory: confirmation.conversationHistory,
                      }
                    : {
                          type: 'release_cards',
                          cardConfigs: [{ variant: 'catalog' }, { variant: 'catalog' }],
                          message: 'Old release cards',
                          conversationHistory: confirmation.conversationHistory,
                      },
            );
            const pending = send(el);
            await started.promise;
            replaceSession(el);
            result.resolve({ id: 'old-card', title: 'Old card', path: '/content/dam/mas/old-card' });
            await pending;
            assertReplacement(el);
            expect(creates).to.equal(1);
        });
    }
});
