import { expect } from '@esm-bundle/chai';
import { fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-product-catalog.js';

// The element is created but never appended, so connectedCallback (which fetches
// the product list) does not run — these cover the create flow in isolation.
describe('MasProductCatalog create flow', () => {
    let el;
    let originalFetch;

    beforeEach(() => {
        el = document.createElement('mas-product-catalog');
        originalFetch = globalThis.fetch;
        sessionStorage.setItem('masAccessToken', 'test-token');
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        sessionStorage.removeItem('masAccessToken');
        sinon.restore();
    });

    it('renders the product catalog', async () => {
        sinon.stub(customElements.get('mas-product-catalog').prototype, 'loadProducts');
        const mounted = await fixture(html`<mas-product-catalog></mas-product-catalog>`);
        expect(mounted.querySelector('.product-catalog')).to.exist;
    });

    describe('handleMultiOfferSelect', () => {
        it('creates from the base and trial OSIs', () => {
            el.pendingCreate = { product: { arrangement_code: 'x' }, surface: 'acom', locale: 'en_US', variants: ['plans'] };
            const exec = sinon.stub(el, 'executeCreate');
            el.handleMultiOfferSelect({ detail: { base: { osi: 'base-osi' }, trial: { osi: 'trial-osi' } } });
            expect(exec.calledOnceWithExactly('base-osi', 'trial-osi')).to.equal(true);
        });

        it('passes undefined trial when only a base is selected', () => {
            el.pendingCreate = { product: {}, surface: 'acom', locale: 'en_US', variants: ['plans'] };
            const exec = sinon.stub(el, 'executeCreate');
            el.handleMultiOfferSelect({ detail: { base: { osi: 'base-osi' }, trial: null } });
            expect(exec.calledOnceWithExactly('base-osi', undefined)).to.equal(true);
        });

        it('does nothing without a base offer', () => {
            el.pendingCreate = { product: {}, surface: 'acom', locale: 'en_US', variants: ['plans'] };
            const exec = sinon.stub(el, 'executeCreate');
            el.handleMultiOfferSelect({ detail: { base: null, trial: { osi: 't' } } });
            expect(exec.called).to.equal(false);
        });

        it('does nothing when no create is pending', () => {
            el.pendingCreate = null;
            const exec = sinon.stub(el, 'executeCreate');
            el.handleMultiOfferSelect({ detail: { base: { osi: 'b' }, trial: null } });
            expect(exec.called).to.equal(false);
        });
    });

    describe('executeCreate', () => {
        it('builds one card per variant with the base/trial OSIs and the surface parentPath', async () => {
            el.pendingCreate = {
                product: { arrangement_code: 'photoshop', name: 'Photoshop' },
                surface: 'acom',
                locale: 'en_US',
                variants: ['plans', 'catalog'],
            };
            // Offers create now builds client-side through the shared
            // mas-repository (createReleaseCard), one fragment per variant — no
            // server operation call. Intercept the repository and assert the AEM
            // payloads carry the OSIs and the surface+locale parentPath.
            const create = sinon.stub().resolves({ id: 'a', title: 'Photoshop - Plans', path: '/p/a' });
            const repository = { aem: { sites: { cf: { fragments: { create } } } } };
            const realQuery = document.querySelector.bind(document);
            sinon.stub(document, 'querySelector').callsFake((sel) => (sel === 'mas-repository' ? repository : realQuery(sel)));
            // The client-side mapper reads the merch-card fragment mapping; make
            // it available (and skip the aem-fragment cache warm) for this test.
            const realGet = customElements.get.bind(customElements);
            sinon
                .stub(customElements, 'get')
                .callsFake((name) =>
                    name === 'merch-card'
                        ? { getFragmentMapping: () => ({ title: {}, description: {}, ctas: {}, prices: {}, osi: {} }) }
                        : name === 'aem-fragment'
                          ? undefined
                          : realGet(name),
                );

            await el.executeCreate('base-osi', 'trial-osi');

            expect(create.callCount).to.equal(2);
            const payloads = create.getCalls().map((c) => JSON.stringify(c.args[0]));
            expect(payloads.join(' ')).to.include('base-osi');
            expect(payloads.join(' ')).to.include('trial-osi');
            expect(create.firstCall.args[0].parentPath).to.equal('/content/dam/mas/acom/en_US');
            expect(create.firstCall.args[0].title).to.include('Photoshop');
            expect(el.creating).to.equal(false);
            expect(el.pendingCreate).to.equal(null);
        });

        it('clears pending state even when the operation reports failure', async () => {
            el.pendingCreate = { product: { arrangement_code: 'x' }, surface: 'acom', locale: 'en_US', variants: ['plans'] };
            globalThis.fetch = async () => ({
                ok: true,
                status: 200,
                json: async () => ({ success: false, cards: [{ error: 'nope' }] }),
            });
            await el.executeCreate('base-osi');
            expect(el.pendingCreate).to.equal(null);
            expect(el.creating).to.equal(false);
        });
    });

    describe('confirmCreate', () => {
        it('stages the pending create from the dialog selection and closes the dialog', () => {
            el.createDialog = {
                product: { arrangement_code: 'illustrator' },
                surface: 'ccd',
                locale: 'fr_FR',
                selectedVariants: new Set(['plans', 'catalog']),
            };
            el.confirmCreate();
            expect(el.pendingCreate.product.arrangement_code).to.equal('illustrator');
            expect(el.pendingCreate.surface).to.equal('ccd');
            expect(el.pendingCreate.locale).to.equal('fr_FR');
            expect(el.pendingCreate.variants).to.deep.equal(['plans', 'catalog']);
            expect(el.createDialog).to.equal(null);
        });
    });
});
