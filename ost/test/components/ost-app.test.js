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

    describe('deep-link product resolution (unified via store)', () => {
        afterEach(() => {
            store.allProducts = [];
            store.selectedProduct = undefined;
            store.pendingArrangementCode = null;
        });

        it('applyDeepLink with only an arrangementCode routes through store.autoSelectProductByArrangementCode', async () => {
            store.setProducts([['ppro_direct_individual', { name: 'Premiere plan' }]]);
            const el = await fixture(html`<ost-app></ost-app>`);
            el.config = { searchParameters: '', arrangementCode: 'ppro_direct_individual' };
            store.setAosParams({ arrangementCode: 'ppro_direct_individual' });
            el.applyDeepLink();
            expect(store.selectedProduct?.name).to.equal('Premiere plan');
        });

        it('defers when the catalog is empty, then selects once setProducts arrives', async () => {
            store.allProducts = [];
            const el = await fixture(html`<ost-app></ost-app>`);
            store.setAosParams({ arrangementCode: 'ppro_direct_individual' });
            el.applyDeepLink();
            expect(store.selectedProduct).to.be.undefined;
            store.setProducts([['ppro_direct_individual', { name: 'Premiere plan' }]]);
            expect(store.selectedProduct?.name).to.equal('Premiere plan');
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
                    market_segments: ['COM'],
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
                // usage loadOffers' autoSelectByInitialOsi re-resolves it once
                // offers load.
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

        it('persists the deep-link OSI on store.initialOsi', async () => {
            const originalFetch = window.fetch;
            window.fetch = async () => {
                throw new Error('aos down');
            };
            try {
                const el = await fixture(html`<ost-app></ost-app>`);
                await el.resolveDeepLinkOffer('osi-persist');
                expect(store.initialOsi).to.equal('osi-persist');
            } finally {
                window.fetch = originalFetch;
                store.initialOsi = undefined;
            }
        });
    });

    describe('deep-link re-resolution on Back then return to offer', () => {
        afterEach(() => {
            store.initialOsi = undefined;
            store.selectedOffer = undefined;
            store.wizardStep = 'entitlements';
        });

        it('re-resolves the deep-linked offer when re-entering the offer step', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            const calls = [];
            el.resolveDeepLinkOffer = (id) => {
                calls.push(id);
                return Promise.resolve();
            };
            store.initialOsi = 'osi-back';
            store.selectedOffer = undefined;
            store.wizardStep = 'offer';
            store.notify();
            expect(calls).to.deep.equal(['osi-back']);
        });

        it('does not re-resolve when an offer is already selected', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            const calls = [];
            el.resolveDeepLinkOffer = (id) => {
                calls.push(id);
                return Promise.resolve();
            };
            store.initialOsi = 'osi-back';
            store.selectedOffer = { offer_id: 'already' };
            store.wizardStep = 'offer';
            store.notify();
            expect(calls).to.deep.equal([]);
        });

        it('skips re-resolution while a previous re-apply is still in flight', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            const calls = [];
            el.resolveDeepLinkOffer = (id) => {
                calls.push(id);
                return Promise.resolve();
            };
            el.reapplyingDeepLink = true;
            store.initialOsi = 'osi-inflight';
            store.selectedOffer = undefined;
            store.wizardStep = 'offer';
            store.notify();
            expect(calls).to.deep.equal([]);
            el.reapplyingDeepLink = false;
        });

        it('does not re-resolve when not on the offer step', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            const calls = [];
            el.resolveDeepLinkOffer = (id) => {
                calls.push(id);
                return Promise.resolve();
            };
            store.initialOsi = 'osi-back';
            store.selectedOffer = undefined;
            store.wizardStep = 'entitlements';
            store.notify();
            expect(calls).to.deep.equal([]);
        });
    });

    describe('help mode banner', () => {
        afterEach(() => {
            store.helpMode = false;
        });

        it('renders the help banner only after help mode is toggled on', async () => {
            store.init({});
            store.helpMode = false;
            const el = await fixture(html`<ost-app></ost-app>`);
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('ost-help-banner')).to.not.exist;
            store.toggleHelp();
            await el.updateComplete;
            expect(store.helpMode).to.be.true;
            expect(el.shadowRoot.querySelector('.ost-help-banner-wrapper ost-help-banner')).to.exist;
        });

        it('clicking the Help toggle flips store.helpMode', async () => {
            store.init({});
            store.helpMode = false;
            const el = await fixture(html`<ost-app></ost-app>`);
            await el.updateComplete;
            el.shadowRoot.querySelector('.ost-help-toggle').click();
            expect(store.helpMode).to.be.true;
        });
    });

    describe('handleTabChange', () => {
        afterEach(() => {
            store.wizardStep = 'entitlements';
            store.selectedProduct = undefined;
            store.authoringFlow = 'single';
        });

        it('advances to the offer step when the offer tab is selected', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'single';
            store.selectedProduct = { name: 'Photoshop' };
            store.wizardStep = 'entitlements';
            el.handleTabChange({ target: { selected: 'offer' } });
            expect(store.wizardStep).to.equal('offer');
        });

        it('returns to the entitlements step when the entitlements tab is selected', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.wizardStep = 'offer';
            store.selectedOffer = { offer_id: 'Z' };
            el.handleTabChange({ target: { selected: 'entitlements' } });
            expect(store.wizardStep).to.equal('entitlements');
            expect(store.selectedOffer).to.be.undefined;
        });
    });

    describe('onTabUse / onTabBack routing', () => {
        afterEach(() => {
            store.authoringFlow = 'single';
            store.selectedOffer = undefined;
            store.onSelect = null;
        });

        it('onTabUse routes to focused-use in consult flow with a selected offer', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'consult';
            store.selectedOffer = { offer_id: 'CUSE' };
            store.country = 'US';
            let received;
            el.addEventListener('ost-select', (e) => {
                if (e.detail?.osi === 'CUSE') received = e.detail;
            });
            el.onTabUse();
            expect(received).to.exist;
            expect(received.osi).to.equal('CUSE');
        });

        it('onTabUse falls through to footer-use when not consult', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'tryBuy';
            store.selectedOffers = [{ offer: { offer_id: 'B' }, osi: 'osi-b', role: 'base' }];
            let fired = false;
            el.addEventListener('ost-multi-select', () => {
                fired = true;
            });
            el.onTabUse();
            expect(fired).to.be.true;
        });

        it('onTabBack routes to focused-back in consult flow with a selected offer', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'consult';
            store.selectedOffer = { offer_id: 'CBACK' };
            store.wizardStep = 'offer';
            el.onTabBack();
            expect(store.selectedOffer).to.be.undefined;
            expect(store.wizardStep).to.equal('offer');
        });

        it('onTabBack falls through to handleBack when not consult', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.authoringFlow = 'single';
            store.selectedProduct = { name: 'Acrobat' };
            store.selectedOffer = { offer_id: 'OF-1' };
            store.wizardStep = 'offer';
            el.onTabBack();
            expect(store.wizardStep).to.equal('entitlements');
            expect(store.selectedProduct?.name).to.equal('Acrobat');
        });
    });

    describe('handleFooterUse code-output reach-through', () => {
        afterEach(() => {
            store.authoringFlow = 'single';
            store.selectedProduct = undefined;
            store.selectedOffer = undefined;
            store.wizardStep = 'entitlements';
            store.onSelect = null;
        });

        it('invokes the nested ost-code-output handleUse for the single flow', async () => {
            store.authoringFlow = 'single';
            store.selectedProduct = { name: 'Photoshop', arrangement_code: 'phsp' };
            store.selectedOffer = { offer_id: 'X' };
            store.wizardStep = 'offer';
            store.notify();
            const el = await fixture(html`<ost-app></ost-app>`);
            await el.updateComplete;
            const tab = el.shadowRoot.querySelector('ost-offer-tab');
            await tab.updateComplete;
            const panel = tab.shadowRoot.querySelector('ost-placeholder-panel');
            await panel.updateComplete;
            const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
            let called = false;
            codeOutput.handleUse = () => {
                called = true;
            };
            el.handleFooterUse();
            expect(called).to.be.true;
        });
    });

    describe('handleFocusedUse id fallback', () => {
        afterEach(() => {
            store.onSelect = null;
            store.selectedOffer = undefined;
        });

        it('falls back to offer.id when offer_id is absent', async () => {
            const el = await fixture(html`<ost-app></ost-app>`);
            store.selectedOffer = { id: 'FALLBACK-ID' };
            store.country = 'DE';
            let received;
            el.addEventListener('ost-select', (e) => {
                if (e.detail?.osi === 'FALLBACK-ID') received = e.detail;
            });
            await el.handleFocusedUse();
            expect(received).to.exist;
            expect(received.osi).to.equal('FALLBACK-ID');
        });
    });

    describe('applyDeepLink', () => {
        afterEach(() => {
            store.aosParams = {};
            store.allProducts = [];
            store.selectedProduct = undefined;
            store.wizardStep = 'entitlements';
            store.deepLink = {};
        });

        it('applies searchParameters then lands on the offer step for a deep-linked open', async () => {
            store.allProducts = [['phsp', { arrangement_code: 'arr-x', name: 'Photoshop' }]];
            const el = await fixture(html`<ost-app></ost-app>`);
            let appliedParams;
            const originalApply = store.applySearchParams.bind(store);
            store.applySearchParams = (params) => {
                appliedParams = params;
                store.aosParams = { ...store.aosParams, arrangementCode: 'arr-x' };
            };
            el.config = { searchParameters: { foo: 'bar' } };
            await el.updateComplete;
            expect(appliedParams).to.deep.equal({ foo: 'bar' });
            expect(store.wizardStep).to.equal('offer');
            expect(store.selectedProduct?.name).to.equal('Photoshop');
            store.applySearchParams = originalApply;
        });
    });

    describe('fetchProducts', () => {
        afterEach(() => {
            store.allProducts = [];
            delete window.tacocat;
        });

        it('seeds products from window.tacocat.products without fetching', async () => {
            window.tacocat = { products: { phsp: { name: 'Photoshop' }, acro: { name: 'Acrobat' } } };
            store.allProducts = [];
            const el = await fixture(html`<ost-app></ost-app>`);
            await el.fetchProducts();
            expect(el.productsError).to.equal('');
            expect(store.allProducts.length).to.equal(2);
        });

        it('records productsError and empties products when the fetch response is not ok', async () => {
            delete window.tacocat;
            store.allProducts = [];
            const originalFetch = window.fetch;
            window.fetch = async () => ({ ok: false, status: 503 });
            try {
                const el = await fixture(html`<ost-app></ost-app>`);
                el.productsError = '';
                store.allProducts = [];
                await el.fetchProducts();
                expect(el.productsError).to.contain('503');
                expect(store.allProducts).to.deep.equal([]);
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('records productsError when the payload has no combinedProducts', async () => {
            delete window.tacocat;
            store.allProducts = [];
            const originalFetch = window.fetch;
            window.fetch = async () => ({ ok: true, json: async () => ({ somethingElse: true }) });
            try {
                const el = await fixture(html`<ost-app></ost-app>`);
                el.productsError = '';
                store.allProducts = [];
                await el.fetchProducts();
                expect(el.productsError).to.contain('combinedProducts');
                expect(store.allProducts).to.deep.equal([]);
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('caches and seeds products on a successful fetch', async () => {
            delete window.tacocat;
            store.allProducts = [];
            const originalFetch = window.fetch;
            window.fetch = async () => ({
                ok: true,
                json: async () => ({ combinedProducts: { phsp: { name: 'Photoshop' } } }),
            });
            try {
                const el = await fixture(html`<ost-app></ost-app>`);
                el.productsError = '';
                store.allProducts = [];
                await el.fetchProducts();
                expect(el.productsError).to.equal('');
                expect(store.allProducts.length).to.equal(1);
                expect(window.tacocat.products).to.deep.equal({ phsp: { name: 'Photoshop' } });
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('sends IMS auth headers when an access token is present', async () => {
            delete window.tacocat;
            store.allProducts = [];
            store.accessToken = 'tok-123';
            store.apiKey = 'key-abc';
            const originalFetch = window.fetch;
            const originalIMS = window.adobeIMS;
            window.adobeIMS = { adobeIdData: { imsOrg: 'ORG@AdobeOrg', client_id: 'client-xyz' } };
            let sentHeaders;
            window.fetch = async (url, opts) => {
                sentHeaders = opts.headers;
                return { ok: true, json: async () => ({ combinedProducts: { phsp: { name: 'Photoshop' } } }) };
            };
            try {
                const el = await fixture(html`<ost-app></ost-app>`);
                el.productsError = '';
                store.allProducts = [];
                await el.fetchProducts();
                expect(sentHeaders.Authorization).to.equal('Bearer tok-123');
                expect(sentHeaders['x-gw-ims-org-id']).to.equal('ORG@AdobeOrg');
                expect(sentHeaders['x-api-key']).to.equal('client-xyz');
            } finally {
                window.fetch = originalFetch;
                window.adobeIMS = originalIMS;
                store.accessToken = undefined;
                store.apiKey = undefined;
            }
        });

        it('returns early when the catalog is already populated', async () => {
            store.allProducts = [['phsp', { name: 'Photoshop' }]];
            let fetched = false;
            const originalFetch = window.fetch;
            window.fetch = async () => {
                fetched = true;
                return { ok: true, json: async () => ({ combinedProducts: {} }) };
            };
            try {
                const el = await fixture(html`<ost-app></ost-app>`);
                await el.fetchProducts();
                expect(fetched).to.be.false;
            } finally {
                window.fetch = originalFetch;
            }
        });
    });

    // Deep-link offer selection is now owned by the store: resolveDeepLinkOffer
    // sets initialOsi + aosParams and lets loadOffers' autoSelectByInitialOsi
    // pick the matching offer (covered in ost-store.test.js). The old per-call
    // state-changed offer-watching handler was removed to avoid it re-selecting a
    // previous product's offer after the user switched OSI.
});
