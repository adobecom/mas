import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-app.js';
import { store } from '../../src/store/ost-store.js';

describe('ost-app', () => {
    function enterOffersState() {
        store.authoringFlow = 'single';
        store.selectedProduct = { name: 'Photoshop', arrangement_code: 'phsp' };
        store.selectedOffer = undefined;
        store.wizardStep = 'offer';
        store.notify();
    }

    it('renders sp-theme with correct attributes', async () => {
        const el = await fixture(html`<ost-app></ost-app>`);
        const theme = el.shadowRoot.querySelector('sp-theme');
        expect(theme).to.exist;
        expect(theme.getAttribute('system')).to.equal('spectrum-two');
        expect(theme.getAttribute('color')).to.equal('light');
        expect(theme.getAttribute('scale')).to.equal('medium');
    });

    it('initializes store when config property is set', async () => {
        const el = await fixture(html`<ost-app></ost-app>`);
        el.config = { country: 'DE', language: 'de', env: 'STAGE' };
        await el.updateComplete;
        expect(store.country).to.equal('DE');
        expect(store.env).to.equal('STAGE');
    });

    it('lands on the entitlements tab by default', async () => {
        store.init({});
        const el = await fixture(html`<ost-app></ost-app>`);
        await el.updateComplete;
        const tab = el.shadowRoot.querySelector('ost-entitlements-tab');
        expect(tab).to.exist;
        expect(el.shadowRoot.querySelector('ost-offer-tab')).to.not.exist;
    });

    it('renders the entitlements tab children (search, filters, products, mode picker)', async () => {
        store.init({});
        const el = await fixture(html`<ost-app></ost-app>`);
        await el.updateComplete;
        const tab = el.shadowRoot.querySelector('ost-entitlements-tab');
        await tab.updateComplete;
        expect(tab.shadowRoot.querySelector('ost-search')).to.exist;
        expect(tab.shadowRoot.querySelector('ost-filter-bar')).to.exist;
        expect(tab.shadowRoot.querySelector('ost-product-list')).to.exist;
        expect(tab.shadowRoot.querySelector('ost-country-picker')).to.exist;
        expect(tab.shadowRoot.querySelector('sp-picker')).to.exist;
    });

    it('shows the offer tab once advanced to the offer step', async () => {
        const el = await fixture(html`<ost-app></ost-app>`);
        enterOffersState();
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('ost-offer-tab')).to.exist;
    });

    it('renders header bar and tab list', async () => {
        store.init({});
        const el = await fixture(html`<ost-app></ost-app>`);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.ost-header-bar')).to.exist;
        expect(el.shadowRoot.querySelector('.ost-tabs sp-tabs')).to.exist;
        expect(el.shadowRoot.querySelector('.ost-title').textContent).to.equal('Offer Selector Tool');
    });

    it('dispatches ost-select event', async () => {
        const el = await fixture(html`<ost-app></ost-app>`);
        let received = null;
        el.addEventListener('ost-select', (e) => {
            received = e.detail;
        });
        el.select({ osi: 'test-osi', type: 'price' });
        expect(received).to.deep.include({ osi: 'test-osi', type: 'price' });
    });

    it('dispatches ost-cancel event', async () => {
        const el = await fixture(html`<ost-app></ost-app>`);
        let cancelled = false;
        el.addEventListener('ost-cancel', () => {
            cancelled = true;
        });
        el.cancel();
        expect(cancelled).to.be.true;
    });

    describe('callbacks via store.on* config', () => {
        beforeEach(() => {
            store.onSelect = null;
            store.onCancel = null;
            store.onMultiSelect = null;
            store.onBundleSelect = null;
        });
        afterEach(() => {
            store.onSelect = null;
            store.onCancel = null;
            store.onMultiSelect = null;
            store.onBundleSelect = null;
        });

        it('calls store.onSelect with positional args when select() runs', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            const calls = [];
            store.onSelect = (...args) => {
                calls.push(args);
            };
            el.select({
                osi: 'X',
                type: 'price',
                offer: { id: 'o' },
                options: { displayTax: true },
                promoOverride: 'PROMO',
                country: 'DE',
            });
            const match = calls.find((c) => c[0] === 'X');
            expect(match).to.exist;
            expect(match).to.deep.equal(['X', 'price', { id: 'o' }, { displayTax: true }, 'PROMO', 'DE']);
        });

        it('calls store.onCancel when cancel() runs', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            let called = false;
            store.onCancel = () => {
                called = true;
            };
            el.cancel();
            expect(called).to.be.true;
        });
    });

    describe('selectMulti', () => {
        beforeEach(() => {
            store.onMultiSelect = null;
        });
        afterEach(() => {
            store.onMultiSelect = null;
        });

        it('is a no-op when canConfirmMultiSelect is false', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'tryBuy';
            store.selectedOffers = [];
            let fired = false;
            el.addEventListener('ost-multi-select', () => {
                fired = true;
            });
            el.selectMulti();
            expect(fired).to.be.false;
        });

        it('dispatches ost-multi-select and calls store.onMultiSelect with base + trial', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'tryBuy';
            store.country = 'US';
            store.selectedOffers = [
                { offer: { offer_id: 'B' }, osi: 'osi-base', role: 'base' },
                { offer: { offer_id: 'T' }, osi: 'osi-trial', role: 'trial' },
            ];
            const calls = [];
            let received;
            el.addEventListener('ost-multi-select', (e) => {
                received = e.detail;
            });
            store.onMultiSelect = (d) => {
                calls.push(d);
            };
            el.selectMulti();
            expect(received).to.exist;
            expect(received.base).to.deep.equal({ osi: 'osi-base', offer: { offer_id: 'B' } });
            expect(received.trial).to.deep.equal({ osi: 'osi-trial', offer: { offer_id: 'T' } });
            expect(received.country).to.equal('US');
            const match = calls.find((c) => c && c.base?.osi === 'osi-base');
            expect(match).to.exist;
        });

        it('emits trial: null when only the base slot is filled', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'tryBuy';
            store.selectedOffers = [{ offer: { offer_id: 'B' }, osi: 'osi-base', role: 'base' }];
            let received;
            el.addEventListener('ost-multi-select', (e) => {
                received = e.detail;
            });
            el.selectMulti();
            expect(received.base).to.exist;
            expect(received.trial).to.equal(null);
        });
    });

    describe('selectBundle', () => {
        beforeEach(() => {
            store.onBundleSelect = null;
        });
        afterEach(() => {
            store.onBundleSelect = null;
        });

        it('is a no-op when canConfirm is false', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'bundle';
            store.selectedOffers = []; // bundle requires >= 2 to confirm
            let fired = false;
            el.addEventListener('ost-bundle-select', () => {
                fired = true;
            });
            el.selectBundle();
            expect(fired).to.be.false;
        });

        it('dispatches ost-bundle-select with all offers and calls store.onBundleSelect', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'bundle';
            store.country = 'JP';
            store.selectedOffers = [
                { offer: { offer_id: 'A' }, osi: 'osi-a' },
                { offer: { offer_id: 'B' }, osi: 'osi-b' },
                { offer: { offer_id: 'C' }, osi: 'osi-c' },
            ];
            const calls = [];
            let received;
            el.addEventListener('ost-bundle-select', (e) => {
                received = e.detail;
            });
            store.onBundleSelect = (d) => {
                calls.push(d);
            };
            el.selectBundle();
            expect(received.offers).to.have.length(3);
            expect(received.country).to.equal('JP');
            const match = calls.find((c) => c?.offers?.length === 3);
            expect(match).to.exist;
        });
    });

    describe('handleBack / handleFocusedBack / wasDeepLinked', () => {
        it('handleBack returns to the entitlements tab, preserves product, clears offer', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.selectedProduct = { name: 'Acrobat' };
            store.selectedOffer = { offer_id: 'OF-9' };
            store.selectedOsi = 'osi-9';
            store.wizardStep = 'offer';
            el.handleBack();
            expect(store.wizardStep).to.equal('entitlements');
            expect(store.selectedProduct?.name).to.equal('Acrobat'); // product preserved
            expect(store.selectedOffer).to.be.undefined;
            expect(store.selectedOsi).to.be.undefined;
            expect(store.lastSelectedOfferId).to.equal('OF-9');
        });

        it('handleFocusedBack just clears selectedOffer', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.selectedOffer = { offer_id: 'F' };
            el.handleFocusedBack();
            expect(store.selectedOffer).to.be.undefined;
        });

        it('wasDeepLinked is true when config.searchOfferSelectorId is set', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            el.config = { searchOfferSelectorId: 'osi-deep' };
            expect(el.wasDeepLinked).to.be.true;
        });

        it('wasDeepLinked is true when store.deepLink.offerId is set', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.deepLink = { offerId: 'OF-deep' };
            expect(el.wasDeepLinked).to.be.true;
            store.deepLink = {};
        });

        it('wasDeepLinked is false when neither is set', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.deepLink = {};
            expect(el.wasDeepLinked).to.be.false;
        });
    });

    describe('handleFocusedUse', () => {
        afterEach(() => {
            store.onSelect = null;
        });

        it('is a no-op when no offer is selected', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.selectedOffer = undefined;
            let received;
            el.addEventListener('ost-select', (e) => {
                received = e.detail;
            });
            await el.handleFocusedUse();
            expect(received).to.be.undefined;
        });

        it('is a no-op while a previous focused-use is still in flight', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.selectedOffer = { offer_id: 'X' };
            el.usingFocusedOffer = true;
            let received;
            el.addEventListener('ost-select', (e) => {
                received = e.detail;
            });
            await el.handleFocusedUse();
            expect(received).to.be.undefined;
            el.usingFocusedOffer = false;
        });

        it('uses offer_id as passthrough OSI when available, fires ost-select, and calls store.onSelect with type=price', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.selectedOffer = { offer_id: 'FOID', id: 'fallback' };
            store.country = 'FR';
            const calls = [];
            store.onSelect = (...args) => {
                calls.push(args);
            };
            let evtDetail;
            el.addEventListener('ost-select', (e) => {
                if (e.detail?.osi === 'FOID') evtDetail = e.detail;
            });
            await el.handleFocusedUse();
            expect(evtDetail).to.exist;
            expect(evtDetail.osi).to.equal('FOID');
            expect(evtDetail.country).to.equal('FR');
            const match = calls.find((c) => c[0] === 'FOID');
            expect(match).to.exist;
            expect(match[1]).to.equal('price'); // consult passthrough always emits as price
            expect(match[5]).to.equal('FR');
            expect(el.usingFocusedOffer).to.be.false;
        });
    });

    describe('handleFooterUse', () => {
        afterEach(() => {
            store.onMultiSelect = null;
            store.onBundleSelect = null;
            store.onCancel = null;
        });

        it('routes to selectMulti when flow is tryBuy', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'tryBuy';
            store.selectedOffers = [{ offer: { offer_id: 'B' }, osi: 'osi-b', role: 'base' }];
            let fired = false;
            el.addEventListener('ost-multi-select', () => {
                fired = true;
            });
            el.handleFooterUse();
            expect(fired).to.be.true;
        });

        it('routes to selectBundle when flow is bundle', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'bundle';
            store.selectedOffers = [
                { offer: { offer_id: 'A' }, osi: 'a' },
                { offer: { offer_id: 'B' }, osi: 'b' },
            ];
            let fired = false;
            el.addEventListener('ost-bundle-select', () => {
                fired = true;
            });
            el.handleFooterUse();
            expect(fired).to.be.true;
        });

        it('routes to cancel when flow is consult', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'consult';
            let cancelled = false;
            el.addEventListener('ost-cancel', () => {
                cancelled = true;
            });
            el.handleFooterUse();
            expect(cancelled).to.be.true;
        });
    });

    describe('offer tab views', () => {
        it('renders ost-placeholder-panel when authoringFlow is single and an offer is selected', async () => {
            store.authoringFlow = 'single';
            store.selectedProduct = { name: 'Photoshop', arrangement_code: 'phsp' };
            store.selectedOffer = { offer_id: 'X' };
            store.wizardStep = 'offer';
            store.notify();
            const el = await fixture(html`<ost-app></ost-app>`);
            await el.updateComplete;
            const tab = el.shadowRoot.querySelector('ost-offer-tab');
            await tab.updateComplete;
            expect(tab.shadowRoot.querySelector('ost-placeholder-panel')).to.exist;
        });

        it('renders ost-offer-detail-focused in consult flow when an offer is selected', async () => {
            store.authoringFlow = 'consult';
            store.selectedProduct = { name: 'Photoshop', arrangement_code: 'phsp' };
            store.selectedOffer = { offer_id: 'C' };
            store.wizardStep = 'offer';
            store.notify();
            const el = await fixture(html`<ost-app></ost-app>`);
            await el.updateComplete;
            const tab = el.shadowRoot.querySelector('ost-offer-tab');
            await tab.updateComplete;
            expect(tab.shadowRoot.querySelector('ost-offer-detail-focused')).to.exist;
        });

        it('renders ost-selection-list in tryBuy flow', async () => {
            store.authoringFlow = 'tryBuy';
            store.selectedProduct = { name: 'Photoshop', arrangement_code: 'phsp' };
            store.wizardStep = 'offer';
            store.notify();
            const el = await fixture(html`<ost-app></ost-app>`);
            await el.updateComplete;
            const tab = el.shadowRoot.querySelector('ost-offer-tab');
            await tab.updateComplete;
            expect(tab.shadowRoot.querySelector('ost-selection-list')).to.exist;
        });
    });

    describe('dialog mode', () => {
        it('renders a backdrop and close button when dialog attribute is set', async () => {
            const el = await fixture(html`<ost-app dialog></ost-app>`);
            expect(el.shadowRoot.querySelector('.ost-backdrop')).to.exist;
            expect(el.shadowRoot.querySelector('.ost-close-btn')).to.exist;
        });

        it('clicking the close button cancels the OST', async () => {
            const el = await fixture(html`<ost-app dialog></ost-app>`);
            let cancelled = false;
            el.addEventListener('ost-cancel', () => {
                cancelled = true;
            });
            el.shadowRoot.querySelector('.ost-close-btn').click();
            expect(cancelled).to.be.true;
        });

        it('clicking the backdrop cancels the OST', async () => {
            const el = await fixture(html`<ost-app dialog></ost-app>`);
            let cancelled = false;
            el.addEventListener('ost-cancel', () => {
                cancelled = true;
            });
            el.shadowRoot.querySelector('.ost-backdrop').click();
            expect(cancelled).to.be.true;
        });
    });

    describe('resolveDeepLinkProduct', () => {
        afterEach(() => {
            store.allProducts = [];
            store.selectedProduct = undefined;
        });

        it('selects the product immediately when the catalog already has it', async () => {
            store.allProducts = [
                ['phsp', { arrangement_code: 'phsp-arr', name: 'Photoshop' }],
                ['ilst', { arrangement_code: 'ilst-arr', name: 'Illustrator' }],
            ];
            const el = await fixture(html`<ost-app></ost-app>`);
            el.resolveDeepLinkProduct('ilst-arr');
            expect(store.selectedProduct?.name).to.equal('Illustrator');
        });

        it('defers resolution until the catalog loads, then selects', async () => {
            store.allProducts = [];
            const el = await fixture(html`<ost-app></ost-app>`);
            el.resolveDeepLinkProduct('acro-arr');
            expect(store.selectedProduct).to.be.undefined;
            // Simulate catalog load arriving later
            store.allProducts = [['acro', { arrangement_code: 'acro-arr', name: 'Acrobat' }]];
            expect(store.selectedProduct?.name).to.equal('Acrobat');
        });

        it('handles products that use `code` instead of `arrangement_code`', async () => {
            store.allProducts = [['exp', { code: 'express-arr', name: 'Express' }]];
            const el = await fixture(html`<ost-app></ost-app>`);
            el.resolveDeepLinkProduct('express-arr');
            expect(store.selectedProduct?.name).to.equal('Express');
        });
    });

    describe('resolveDeepLinkOffer', () => {
        it('swallows errors silently', async () => {
            const originalFetch = window.fetch;
            window.fetch = async () => {
                throw new Error('aos down');
            };
            try {
                const el = await fixture(html`<ost-app></ost-app>`);
                await el.resolveDeepLinkOffer('osi-bad'); // must not throw
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('seeds AOS filters and selectedOsi from the resolved OSI then defers product/offer selection', async () => {
            const originalFetch = window.fetch;
            // getOfferSelector returns response.json() unwrapped (see aos-client.js:121)
            window.fetch = async () => ({
                ok: true,
                json: async () => ({
                    product_arrangement_code: 'phsp-arr',
                    commitment: 'YEAR',
                    term: 'MONTHLY',
                    customer_segment: 'INDIVIDUAL',
                    market_segment: 'COM',
                    offer_type: 'BASE',
                    price_point: 'REGULAR',
                }),
            });
            try {
                store.allProducts = [['phsp', { arrangement_code: 'phsp-arr', name: 'Photoshop' }]];
                const el = await fixture(html`<ost-app></ost-app>`);
                await el.resolveDeepLinkOffer('osi-deep-resolveCheck');
                // aosParams updates land synchronously from the OSI response.
                // selectedOsi is intentionally not asserted here: the immediate
                // resolveDeepLinkProduct call invokes setProduct, which clears
                // selectedOsi as part of the product-changed contract; in real
                // usage the offer-watching handler re-resolves it once offers
                // load.
                expect(store.aosParams.arrangementCode).to.equal('phsp-arr');
                expect(store.aosParams.commitment).to.equal('YEAR');
                expect(store.aosParams.offerType).to.equal('BASE');
                expect(store.aosParams.customerSegment).to.equal('INDIVIDUAL');
                expect(store.aosParams.marketSegment).to.equal('COM');
                expect(store.selectedProduct?.name).to.equal('Photoshop');
                store.allProducts = [];
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('returns silently when the resolved OSI has no arrangement code', async () => {
            const originalFetch = window.fetch;
            window.fetch = async () => ({
                ok: true,
                json: async () => ({ commitment: 'YEAR' }), // no arrangement_code
            });
            try {
                const el = await fixture(html`<ost-app></ost-app>`);
                const before = store.aosParams.arrangementCode;
                await el.resolveDeepLinkOffer('osi-shallow');
                // aosParams unchanged
                expect(store.aosParams.arrangementCode).to.equal(before);
            } finally {
                window.fetch = originalFetch;
            }
        });
    });
});
