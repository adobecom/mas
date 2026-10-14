import { aTimeout, fixture, html, expect, oneEvent, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import { sendKeys } from '@web/test-runner-commands';
import '../../src/swc.js';
import '../../src/references/mas-related-artifacts.js';
import Store from '../../src/store.js';
import { MasRepository } from '../../src/mas-repository.js';
import { AEM } from '../../src/aem/aem.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../../src/constants.js';

const card = (id, tags = []) => ({ id, path: `/content/dam/mas/acom/en_US/${id}`, model: { path: CARD_MODEL_PATH }, tags });
const promoTag = (name) => [{ id: `mas:promotion/${name}` }];
const reference = (id, modelPath = COLLECTION_MODEL_PATH) => ({
    type: 'content-fragment',
    id,
    title: id,
    path: `/content/dam/mas/acom/en_US/${id}`,
    status: 'PUBLISHED',
    model: { path: modelPath },
});
const deferred = () => {
    const handle = {};
    handle.promise = new Promise((resolve, reject) => Object.assign(handle, { resolve, reject }));
    return handle;
};

describe('mas-related-artifacts', () => {
    let sandbox;
    let getReferencedByFragmentId;
    let repository;

    const mount = (fragment) =>
        fixture(html`<mas-related-artifacts .fragment=${fragment} .repository=${repository}></mas-related-artifacts>`);
    const text = (el) => el.shadowRoot.textContent;
    const dialogOf = (el) => el?.shadowRoot.querySelector('mas-related-artifacts-dialog');
    const collectionIds = (el) =>
        dialogOf(el)
            .buckets.find((bucket) => bucket.key === 'collections')
            .rows.map((row) => row.title);
    // Opening and closing the modal each run a Spectrum transition, which can take over a second on
    // a loaded CI runner.
    const modalTransition = { timeout: 5000 };
    // Closing the modal before it finishes opening strands Spectrum's focus trap, which then
    // swallows every click on the page; wait until focus has moved into the dialog.
    const openArtifactsDialog = async (el) => {
        el.shadowRoot.querySelector('.artifacts-view-link').focus();
        el.shadowRoot.querySelector('.artifacts-view-link').click();
        await el.updateComplete;
        await waitUntil(
            () => dialogOf(el).shadowRoot.querySelector('sp-dialog-wrapper')?.matches(':focus-within'),
            'Focus never moved into the artifacts dialog',
            modalTransition,
        );
    };
    const closedDialog = (el) => waitUntil(() => !dialogOf(el).open, 'The artifacts dialog never closed', modalTransition);
    const settled = async (el) => {
        await el.updateComplete;
        await waitUntil(() => !text(el).includes('Loading'));
        await el.updateComplete;
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        getReferencedByFragmentId = sandbox.stub().resolves({ items: [] });
        repository = {
            aem: { sites: { cf: { fragments: { getReferencedByFragmentId } } } },
            loadPromotions: sandbox.stub().resolves(),
        };
    });

    afterEach(async () => {
        sandbox.restore();
        // A modal left open makes the rest of the page inert for the next test.
        const overlay = dialogOf(document.querySelector('mas-related-artifacts'))?.shadowRoot.querySelector('sp-overlay');
        if (!overlay?.open) return;
        const closed = oneEvent(overlay, 'sp-closed');
        overlay.open = false;
        await closed;
    });

    describe('rendering', () => {
        it('titles the box and shows a loading state while references load', async () => {
            getReferencedByFragmentId.returns(deferred().promise);
            const el = await mount(card('card-a'));
            expect(text(el)).to.include('Related studio artifacts:');
            expect(text(el)).to.include('Loading');
        });

        it('shows an unavailable state when the lookup fails', async () => {
            sandbox.stub(console, 'error');
            getReferencedByFragmentId.rejects(new Error('503 Service Unavailable'));
            const el = await mount(card('card-a'));
            await settled(el);
            expect(text(el)).to.include('Related studio artifacts unavailable');
        });

        it('renders nothing when nothing references the fragment', async () => {
            const el = await mount(card('card-a'));
            await settled(el);
            expect(text(el).trim()).to.equal('');
        });

        it('shows one count line per artifact type', async () => {
            getReferencedByFragmentId.resolves({ items: [reference('coll-1'), reference('coll-2')] });
            const el = await mount(card('card-a'));
            await settled(el);
            expect(text(el)).to.include('2 Collections');
        });

        it('leaves cards and other references out of the counts', async () => {
            getReferencedByFragmentId.resolves({
                items: [reference('coll-1'), reference('card-x', CARD_MODEL_PATH), reference('other-x', '/conf/x')],
            });
            const el = await mount(card('card-a'));
            await settled(el);
            expect(el.shadowRoot.querySelectorAll('.artifacts-count-line')).to.have.lengthOf(1);
        });

        it('renders View artifacts as a button so keyboard users can reach it', async () => {
            getReferencedByFragmentId.resolves({ items: [reference('coll-1')] });
            const el = await mount(card('card-a'));
            await settled(el);
            expect(el.shadowRoot.querySelector('.artifacts-view-link').tagName).to.equal('SP-ACTION-BUTTON');
        });

        it('opens the artifacts dialog from View artifacts', async () => {
            getReferencedByFragmentId.resolves({ items: [reference('coll-1')] });
            const el = await mount(card('card-a'));
            await settled(el);
            await openArtifactsDialog(el);
            expect(dialogOf(el).open).to.equal(true);
        });

        it('closes the artifacts dialog when its overlay closes', async () => {
            getReferencedByFragmentId.resolves({ items: [reference('coll-1')] });
            const el = await mount(card('card-a'));
            await settled(el);
            await openArtifactsDialog(el);
            dialogOf(el).shadowRoot.querySelector('sp-overlay').open = false;
            await closedDialog(el);
            expect(dialogOf(el).open).to.equal(false);
        });

        it('returns focus to View artifacts when the dialog is dismissed with Escape', async () => {
            getReferencedByFragmentId.resolves({ items: [reference('coll-1')] });
            const el = await mount(card('card-a'));
            await settled(el);
            await openArtifactsDialog(el);
            await sendKeys({ press: 'Escape' });
            await closedDialog(el);
            await waitUntil(
                () => el.shadowRoot.activeElement === el.shadowRoot.querySelector('.artifacts-view-link'),
                'Closing must return focus to View artifacts',
                modalTransition,
            );
        });

        it('notes a failed promotion-project request instead of reporting no references', async () => {
            sandbox.stub(console, 'error');
            sandbox
                .stub(window, 'fetch')
                .callsFake(async (url) =>
                    String(url).includes('/referencedBy')
                        ? new Response(JSON.stringify({ items: [] }))
                        : new Response('', { status: 500, statusText: 'Internal Server Error' }),
                );
            repository = new MasRepository();
            repository.aem = new AEM('test-bucket');
            const el = await mount(card('variation-a', promoTag('augdemo')));
            await settled(el);
            expect(text(el)).to.include('Promo project lookup unavailable');
        });
    });

    describe('loading lifecycle', () => {
        it('does not request references again when the same fragment re-renders', async () => {
            const el = await mount(card('card-a'));
            await settled(el);
            el.fragment = card('card-a');
            await el.updateComplete;
            expect(getReferencedByFragmentId.callCount).to.equal(1);
        });

        it("keeps B's references out of A after switching A -> B -> A", async () => {
            const calls = [];
            getReferencedByFragmentId.callsFake((id) => {
                const call = { id, ...deferred() };
                calls.push(call);
                return call.promise;
            });
            const el = await mount(card('card-a'));
            el.fragment = card('card-b');
            await el.updateComplete;
            el.fragment = card('card-a');
            await el.updateComplete;

            calls[2].resolve({ items: [reference('coll-a')] });
            await settled(el);
            calls[1].resolve({ items: [reference('coll-b')] });
            await settled(el);

            expect(calls.map((call) => call.id)).to.deep.equal(['card-a', 'card-b', 'card-a']);
            expect(collectionIds(el)).to.deep.equal(['coll-a']);
        });

        it('aborts the pending request when detached', async () => {
            getReferencedByFragmentId.returns(deferred().promise);
            const el = await mount(card('card-a'));
            el.remove();
            expect(getReferencedByFragmentId.firstCall.args[1].abortController.signal.aborted).to.equal(true);
        });

        describe('when detached mid-load', () => {
            let el;
            let parent;
            let abortedRequest;

            beforeEach(async () => {
                sandbox.stub(console, 'error');
                // aem.js rewraps a fetch abort as a generic network error.
                getReferencedByFragmentId.onFirstCall().callsFake((id, { abortController }) => {
                    abortedRequest = new Promise((resolve, reject) => {
                        abortController.signal.addEventListener('abort', () => reject(new Error('Network error: aborted')));
                    });
                    return abortedRequest;
                });
                getReferencedByFragmentId.resolves({ items: [reference('coll-1')] });
                el = await mount(card('card-a'));
                parent = el.parentElement;
                el.remove();
            });

            it('does not report the abort as a failure', async () => {
                await abortedRequest.catch(() => {});
                // A zero-delay macrotask runs after every queued microtask, so the rejection has
                // reached the component's catch by then.
                await aTimeout(0);
                expect(console.error.called).to.equal(false);
            });

            it('reloads when re-attached', async () => {
                parent.appendChild(el);
                await settled(el);
                expect(getReferencedByFragmentId.callCount).to.equal(2);
                expect(text(el)).to.include('1 Collections');
            });
        });

        it('retries a failed lookup from the Retry button', async () => {
            sandbox.stub(console, 'error');
            getReferencedByFragmentId.onFirstCall().rejects(new Error('503 Service Unavailable'));
            getReferencedByFragmentId.resolves({ items: [reference('coll-1')] });
            const el = await mount(card('card-a'));
            await settled(el);
            el.shadowRoot.querySelector('.retry').click();
            await settled(el);
            expect(text(el)).to.include('1 Collections');
        });

        it('does not retry a failed lookup on re-render', async () => {
            sandbox.stub(console, 'error');
            getReferencedByFragmentId.rejects(new Error('503 Service Unavailable'));
            const el = await mount(card('card-a'));
            await settled(el);
            el.fragment = card('card-a');
            await el.updateComplete;
            expect(getReferencedByFragmentId.callCount).to.equal(1);
        });

        for (const cursorMode of ['repeated', 'pending']) {
            it(`shows unavailable for ${cursorMode} pagination instead of partial counts`, async () => {
                sandbox.stub(console, 'error');
                getReferencedByFragmentId.callsFake(async () => ({
                    items: [],
                    cursor: cursorMode === 'repeated' ? 'same-page' : `page-${getReferencedByFragmentId.callCount}`,
                }));
                const el = await mount(card('card-a'));
                await settled(el);
                expect(text(el)).to.include('Related studio artifacts unavailable');
                expect(el.shadowRoot.querySelector('.artifacts-counts')).to.equal(null);
            });
        }

        it('lists the promotion project of an open promo variation', async () => {
            const originalPromotions = Store.promotions.list.data.get();
            const project = { id: 'aug-id', path: '/content/dam/mas/promotions/augdemo', tags: promoTag('augdemo') };
            Store.promotions.list.data.value = [{ get: () => project }];
            const el = await mount(card('variation-a', promoTag('augdemo')));
            await settled(el);
            Store.promotions.list.data.value = originalPromotions;
            expect(text(el)).to.include('1 Promo Project');
        });
    });

    describe('after a save', () => {
        it('does not reload when the promotion tag is unchanged', async () => {
            const el = await mount(card('card-a'));
            await settled(el);
            el.saveCount = 1;
            await el.updateComplete;
            expect(getReferencedByFragmentId.callCount).to.equal(1);
        });

        it('does not reload for an unsaved promotion tag change', async () => {
            const el = await mount(card('card-a'));
            await settled(el);
            el.fragment = card('card-a', promoTag('augdemo'));
            await el.updateComplete;
            expect(getReferencedByFragmentId.callCount).to.equal(1);
        });

        it('reloads when the saved promotion tag changed', async () => {
            const el = await mount(card('card-a'));
            await settled(el);
            el.fragment = card('card-a', promoTag('augdemo'));
            el.saveCount = 1;
            await settled(el);
            expect(getReferencedByFragmentId.callCount).to.equal(2);
        });

        it('replaces a pending load when the saved promotion tag changed', async () => {
            const calls = [];
            getReferencedByFragmentId.callsFake(() => {
                const call = deferred();
                calls.push(call);
                return call.promise;
            });
            const el = await mount(card('card-a'));
            el.fragment = card('card-a', promoTag('augdemo'));
            el.saveCount = 1;
            await el.updateComplete;

            calls[1].resolve({ items: [reference('coll-fresh')] });
            await settled(el);
            calls[0].resolve({ items: [reference('coll-stale')] });
            await settled(el);

            expect(collectionIds(el)).to.deep.equal(['coll-fresh']);
        });
    });
});
