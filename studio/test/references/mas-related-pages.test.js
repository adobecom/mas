import { aTimeout, fixture, html, expect, oneEvent, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/references/mas-related-pages.js';

const fragment = (id) => ({ id, path: `/content/dam/mas/acom/en_US/${id}` });
const usagePage = (path, countries) => ({ url: `https://www.adobe.com/${path}`, locale: 'en_US', requests: 10, countries });
const usageResponse = (pages) =>
    new Response(JSON.stringify({ available: true, updatedAt: '2026-10-12T00:00:00.000Z', pages }), { status: 200 });
// Plain stand-in for a fetch Response, so a late answer settles within one task.
const usageAnswer = (pages) => ({ ok: true, json: async () => ({ available: true, pages }) });
const deferred = () => {
    const handle = {};
    handle.promise = new Promise((resolve, reject) => Object.assign(handle, { resolve, reject }));
    return handle;
};

describe('mas-related-pages', () => {
    let sandbox;
    let fetchStub;
    let ioMeta;

    const mount = (openFragment) => fixture(html`<mas-related-pages .fragment=${openFragment}></mas-related-pages>`);
    const text = (el) => el.shadowRoot.textContent;
    const dialogOf = (el) => el?.shadowRoot.querySelector('mas-external-usage-dialog');
    const requestedIds = () => fetchStub.getCalls().map((call) => JSON.parse(call.args[1].body).fragmentId);
    const settled = async (el) => {
        await el.updateComplete;
        await waitUntil(() => !text(el).includes('Loading'));
        await el.updateComplete;
    };
    // Opening runs a Spectrum transition, which can take over a second on a loaded CI runner.
    // Closing before it finishes strands Spectrum's focus trap, so wait until focus is inside.
    const openPagesDialog = async (el) => {
        el.shadowRoot.querySelector('.artifacts-view-link').focus();
        el.shadowRoot.querySelector('.artifacts-view-link').click();
        await el.updateComplete;
        await waitUntil(
            () => dialogOf(el).shadowRoot.querySelector('sp-dialog-wrapper')?.matches(':focus-within'),
            'Focus never moved into the pages dialog',
            { timeout: 5000 },
        );
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        ioMeta = document.createElement('meta');
        ioMeta.name = 'io-base-url';
        ioMeta.content = 'https://io.example';
        document.head.append(ioMeta);
        sessionStorage.setItem('masAccessToken', 'ims-token');
        fetchStub = sandbox.stub(window, 'fetch').callsFake(async () => usageResponse([]));
    });

    afterEach(async () => {
        sandbox.restore();
        ioMeta.remove();
        sessionStorage.removeItem('masAccessToken');
        // A modal left open makes the rest of the page inert for the next test.
        const overlay = dialogOf(document.querySelector('mas-related-pages'))?.shadowRoot.querySelector('sp-overlay');
        if (!overlay?.open) return;
        const closed = oneEvent(overlay, 'sp-closed');
        overlay.open = false;
        await closed;
    });

    describe('rendering', () => {
        it('titles the box and shows a loading state while usage loads', async () => {
            fetchStub.returns(deferred().promise);
            const el = await mount(fragment('card-a'));
            expect(text(el)).to.include('Related pages:');
            expect(text(el)).to.include('Loading');
        });

        it('shows an unavailable state when the action has no usage', async () => {
            fetchStub.callsFake(async () => new Response('{}', { status: 500 }));
            const el = await mount(fragment('card-a'));
            await settled(el);
            expect(text(el)).to.include('Usage data unavailable');
        });

        it('renders nothing when no pages served the fragment', async () => {
            const el = await mount(fragment('card-a'));
            await settled(el);
            expect(text(el).trim()).to.equal('');
        });

        it('shows one count line per region', async () => {
            fetchStub.callsFake(async () =>
                usageResponse([
                    usagePage('us-page', { US: 10 }),
                    usagePage('jp-page', { JP: 10 }),
                    usagePage('mix', { US: 5, JP: 5 }),
                ]),
            );
            const el = await mount(fragment('card-a'));
            await settled(el);
            expect(
                [...el.shadowRoot.querySelectorAll('.artifacts-count-line')].map((line) => line.textContent.trim()),
            ).to.deep.equal(['1 Global', '1 LATAM/Americas', '1 JAPAC']);
        });

        it('renders View pages as a button so keyboard users can reach it', async () => {
            fetchStub.callsFake(async () => usageResponse([usagePage('us-page', { US: 10 })]));
            const el = await mount(fragment('card-a'));
            await settled(el);
            expect(el.shadowRoot.querySelector('.artifacts-view-link').tagName).to.equal('SP-ACTION-BUTTON');
        });

        it('opens the pages dialog from View pages', async () => {
            fetchStub.callsFake(async () => usageResponse([usagePage('us-page', { US: 10 })]));
            const el = await mount(fragment('card-a'));
            await settled(el);
            await openPagesDialog(el);
            expect(dialogOf(el).open).to.equal(true);
        });
    });

    describe('loading lifecycle', () => {
        it('does not request usage when no IO backend is configured', async () => {
            ioMeta.remove();
            const el = await mount(fragment('card-a'));
            await el.updateComplete;
            expect(fetchStub.called).to.equal(false);
        });

        it('does not request usage again when the same fragment re-renders', async () => {
            const el = await mount(fragment('card-a'));
            await settled(el);
            el.fragment = fragment('card-a');
            await el.updateComplete;
            expect(fetchStub.callCount).to.equal(1);
        });

        it("keeps B's pages out of A after switching A -> B -> A", async () => {
            const calls = [];
            fetchStub.callsFake(() => {
                const call = deferred();
                calls.push(call);
                return call.promise;
            });
            const el = await mount(fragment('card-a'));
            el.fragment = fragment('card-b');
            await el.updateComplete;
            el.fragment = fragment('card-a');
            await el.updateComplete;

            calls[2].resolve(usageAnswer([usagePage('a-page', { US: 10 })]));
            await settled(el);
            calls[1].resolve(usageAnswer([usagePage('b-page', { JP: 10 })]));
            await aTimeout(0);
            await el.updateComplete;

            expect(requestedIds()).to.deep.equal(['card-a', 'card-b', 'card-a']);
            expect(text(el)).to.include('1 LATAM/Americas');
            expect(text(el)).to.not.include('JAPAC');
        });

        it('aborts the pending request when detached', async () => {
            fetchStub.returns(deferred().promise);
            const el = await mount(fragment('card-a'));
            el.remove();
            expect(fetchStub.firstCall.args[1].signal.aborted).to.equal(true);
        });

        it('reloads when re-attached after an aborted load', async () => {
            fetchStub.onFirstCall().callsFake(
                (url, { signal }) =>
                    new Promise((resolve, reject) => {
                        signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
                    }),
            );
            fetchStub.callsFake(async () => usageResponse([usagePage('us-page', { US: 10 })]));
            const el = await mount(fragment('card-a'));
            const parent = el.parentElement;
            el.remove();
            // The repository turns an abort into { available: false }; let that settle before
            // re-attaching so a wrongly recorded result would be visible.
            await aTimeout(0);
            parent.appendChild(el);
            await settled(el);
            expect(fetchStub.callCount).to.equal(2);
            expect(text(el)).to.include('1 LATAM/Americas');
        });

        it('keeps the pages dialog closed for the next fragment', async () => {
            fetchStub.callsFake(async () => usageResponse([usagePage('us-page', { US: 10 })]));
            const el = await mount(fragment('card-a'));
            await settled(el);
            await openPagesDialog(el);
            el.fragment = fragment('card-b');
            await settled(el);
            expect(dialogOf(el).open).to.equal(false);
        });
    });
});
