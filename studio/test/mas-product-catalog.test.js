import { expect } from '@esm-bundle/chai';
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
        it('sends base osi, trial osi, variants, locale and the surface parentPath', async () => {
            el.pendingCreate = {
                product: { arrangement_code: 'photoshop' },
                surface: 'acom',
                locale: 'en_US',
                variants: ['plans', 'catalog'],
            };
            let body;
            globalThis.fetch = async (url, init) => {
                body = JSON.parse(init.body);
                return { ok: true, status: 200, json: async () => ({ success: true, cards: [{ id: 'a' }] }) };
            };
            await el.executeCreate('base-osi', 'trial-osi');
            expect(body.arrangement_code).to.equal('photoshop');
            expect(body.osi).to.equal('base-osi');
            expect(body.trialOsi).to.equal('trial-osi');
            expect(body.variants).to.deep.equal(['plans', 'catalog']);
            expect(body.locale).to.equal('en_US');
            expect(body.parentPath).to.equal('/content/dam/mas/acom/en_US');
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
