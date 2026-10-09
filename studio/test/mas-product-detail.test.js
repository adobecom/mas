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
        it('sends base osi, trial osi, variants, locale and the surface parentPath', async () => {
            el.pendingCreate = {
                product: { arrangement_code: 'acrobat' },
                surface: 'acom',
                locale: 'en_US',
                variants: ['plans'],
            };
            let body;
            globalThis.fetch = async (url, init) => {
                body = JSON.parse(init.body);
                return { ok: true, status: 200, json: async () => ({ success: true, cards: [{ id: 'a' }] }) };
            };
            await el.executeCreate('base-osi', 'trial-osi');
            expect(body.osi).to.equal('base-osi');
            expect(body.trialOsi).to.equal('trial-osi');
            expect(body.variants).to.deep.equal(['plans']);
            expect(body.locale).to.equal('en_US');
            expect(body.parentPath).to.equal('/content/dam/mas/acom/en_US');
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
