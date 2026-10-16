import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-product-detail.js';

// Created but never appended: connectedCallback's listeners/fetches stay out of
// the way so these cover the Offers create flow in isolation.
describe('MasProductDetail create flow', () => {
    let el;
    let originalFetch;

    beforeEach(() => {
        el = document.createElement('mas-product-detail');
        originalFetch = globalThis.fetch;
        sessionStorage.setItem('masAccessToken', 'test-token');
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        sessionStorage.removeItem('masAccessToken');
        sinon.restore();
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

        it('does nothing without a base offer or a pending create', () => {
            const exec = sinon.stub(el, 'executeCreate');
            el.pendingCreate = { product: {}, surface: 'acom', locale: 'en_US', variants: ['plans'] };
            el.handleMultiOfferSelect({ detail: { base: null, trial: { osi: 't' } } });
            el.pendingCreate = null;
            el.handleMultiOfferSelect({ detail: { base: { osi: 'b' }, trial: null } });
            expect(exec.called).to.equal(false);
        });
    });

    describe('executeCreate', () => {
        it('builds one card per variant with the base/trial OSIs and the surface parentPath', async () => {
            el.pendingCreate = {
                product: { arrangement_code: 'acrobat', name: 'Acrobat' },
                surface: 'acom',
                locale: 'en_US',
                variants: ['plans', 'catalog'],
            };
            // Offers create now builds client-side through the shared
            // mas-repository (createReleaseCard), one fragment per variant — no
            // server operation call. Intercept the repository and assert the AEM
            // payloads carry the OSIs and the surface+locale parentPath.
            const create = sinon.stub().resolves({ id: 'a', title: 'Acrobat - Plans', path: '/p/a' });
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
            expect(create.firstCall.args[0].title).to.include('Acrobat');
            expect(el.creating).to.equal(false);
            expect(el.pendingCreate).to.equal(null);
        });
    });

    describe('confirmCreate', () => {
        it('stages the pending create from the dialog selection and closes the dialog', () => {
            el.createDialog = {
                product: { arrangement_code: 'express' },
                surface: 'express',
                locale: 'en_US',
                selectedVariants: new Set(['plans']),
            };
            el.confirmCreate();
            expect(el.pendingCreate.product.arrangement_code).to.equal('express');
            expect(el.pendingCreate.surface).to.equal('express');
            expect(el.pendingCreate.variants).to.deep.equal(['plans']);
            expect(el.createDialog).to.equal(null);
        });
    });
});
