import { expect } from '@open-wc/testing';
import { OstStore } from '../../src/store/ost-store.js';

describe('OstStore', () => {
    let store;
    beforeEach(() => {
        store = new OstStore();
    });

    it('initializes with default aosParams', () => {
        expect(store.aosParams.customerSegment).to.equal('');
        expect(store.aosParams.offerType).to.equal('');
        expect(store.aosParams.marketSegment).to.equal('');
    });

    it('notifies subscribers on setCountry', () => {
        let notified = false;
        store.subscribe(() => {
            notified = true;
        });
        store.setCountry('JP');
        expect(notified).to.be.true;
        expect(store.country).to.equal('JP');
    });

    it('unsubscribes correctly', () => {
        let count = 0;
        const handler = () => {
            count++;
        };
        store.subscribe(handler);
        store.setCountry('JP');
        store.unsubscribe(handler);
        store.setCountry('DE');
        expect(count).to.equal(1);
    });

    it('sets products and selects one', () => {
        const products = [['phsp', { name: 'Photoshop' }]];
        store.setProducts(products);
        expect(store.allProducts).to.deep.equal(products);
        store.setProduct(products[0][1]);
        expect(store.selectedProduct.name).to.equal('Photoshop');
    });

    it('autoSelectProductByArrangementCode selects immediately when catalog is loaded', () => {
        store.setProducts([
            ['phsp_direct_individual', { name: 'Photoshop' }],
            ['ppro_direct_individual', { name: 'Premiere plan' }],
        ]);
        store.autoSelectProductByArrangementCode('ppro_direct_individual');
        expect(store.selectedProduct?.name).to.equal('Premiere plan');
    });

    it('autoSelectProductByArrangementCode matches the product arrangement_code field when the key differs', () => {
        store.setProducts([['phsp', { arrangement_code: 'phsp-arr', name: 'Photoshop' }]]);
        store.autoSelectProductByArrangementCode('phsp-arr');
        expect(store.selectedProduct?.name).to.equal('Photoshop');
    });

    it('autoSelectProductByArrangementCode defers via pendingArrangementCode until setProducts arrives', () => {
        store.allProducts = [];
        store.autoSelectProductByArrangementCode('ppro_direct_individual');
        expect(store.selectedProduct).to.be.undefined;
        expect(store.pendingArrangementCode).to.equal('ppro_direct_individual');
        store.setProducts([['ppro_direct_individual', { name: 'Premiere plan' }]]);
        expect(store.selectedProduct?.name).to.equal('Premiere plan');
    });

    it('sets offers and selects one', () => {
        const offers = [{ offerId: 'ABC123', planType: 'ABM' }];
        store.setOffers(offers);
        store.setOffer(offers[0]);
        expect(store.selectedOffer.offerId).to.equal('ABC123');
    });

    it('updates aosParams and notifies', () => {
        store.setAosParams({ commitment: 'YEAR', term: 'MONTHLY' });
        expect(store.aosParams.commitment).to.equal('YEAR');
    });

    it('initializes from config', () => {
        store.init({
            country: 'DE',
            language: 'de',
            env: 'STAGE',
            apiKey: 'test-key',
            accessToken: 'test-token',
        });
        expect(store.country).to.equal('DE');
        expect(store.env).to.equal('STAGE');
    });

    it('sets language from country mapping on setCountry', () => {
        store.setCountry('JP');
        expect(store.language).to.equal('ja');
    });

    it('defaults language to en for unmapped country', () => {
        store.setCountry('US');
        expect(store.language).to.equal('en');
    });

    it('clears selectedOffer and selectedOsi when switching to a different product', () => {
        store.selectedProduct = { name: 'Photoshop', arrangement_code: 'phsp' };
        store.selectedOffer = { offerId: 'test' };
        store.selectedOsi = 'test-osi';
        store.setProduct({ name: 'Illustrator', arrangement_code: 'ilst' });
        expect(store.selectedOffer).to.be.undefined;
        expect(store.selectedOsi).to.be.undefined;
    });

    it('preserves selectedOffer and selectedOsi when re-setting the same product (deep-link pending re-fulfill)', () => {
        const product = { name: 'Premiere plan', arrangement_code: 'ppro_direct_individual' };
        store.setProduct(product);
        store.setOffer({ offer_id: 'BD42B3', offer_type: 'BASE' });
        store.setOsi('osi-deep');
        store.setProduct(product);
        expect(store.selectedOffer?.offer_id).to.equal('BD42B3');
        expect(store.selectedOsi).to.equal('osi-deep');
    });

    it('sets osi', () => {
        store.setOsi('test-osi-value');
        expect(store.selectedOsi).to.equal('test-osi-value');
    });

    it('sets promo code via setPromoCode', () => {
        store.setPromoCode('PROMO123');
        expect(store.storedPromoOverride).to.equal('PROMO123');
    });

    it('has default placeholder options', () => {
        expect(store.defaultPlaceholderOptions.displayFormatted).to.be.true;
        expect(store.defaultPlaceholderOptions.displayRecurrence).to.be.true;
        expect(store.defaultPlaceholderOptions.displayPerUnit).to.be.false;
        expect(store.defaultPlaceholderOptions.displayTax).to.be.false;
        expect(store.defaultPlaceholderOptions.forceTaxExclusive).to.be.false;
        expect(store.defaultPlaceholderOptions.displayOldPrice).to.be.true;
    });

    it('has default placeholder types', () => {
        expect(store.placeholderTypes).to.have.length(8);
        expect(store.placeholderTypes[0].type).to.equal('price');
        expect(store.placeholderTypes[6].type).to.equal('legal');
        expect(store.placeholderTypes[6].overrides.displayPlanType).to.be.true;
    });

    it('merges defaultPlaceholderOptions on init', () => {
        store.init({ defaultPlaceholderOptions: { displayTax: true } });
        expect(store.defaultPlaceholderOptions.displayTax).to.be.true;
        expect(store.defaultPlaceholderOptions.displayFormatted).to.be.true;
    });

    it('extends EventTarget', () => {
        expect(store).to.be.instanceOf(EventTarget);
    });

    describe('init() reset behavior', () => {
        it('resets aosParams to defaults', () => {
            store.setAosParams({ commitment: 'YEAR', term: 'ANNUAL' });
            expect(store.aosParams.commitment).to.equal('YEAR');
            store.init({});
            expect(store.aosParams.commitment).to.equal('');
            expect(store.aosParams.term).to.equal('');
            expect(store.aosParams.customerSegment).to.equal('');
        });

        it('resets transient state', () => {
            store.setProduct({ name: 'Photoshop' });
            store.setOffer({ offerId: 'ABC' });
            store.setOsi('test-osi');
            store.setSearch('query', 'product');
            store.init({});
            expect(store.selectedProduct).to.be.undefined;
            expect(store.selectedOffer).to.be.undefined;
            expect(store.selectedOsi).to.be.undefined;
            expect(store.searchQuery).to.equal('');
        });

        it('preserves allProducts across sessions', () => {
            const products = [['phsp', { name: 'Photoshop' }]];
            store.setProducts(products);
            store.init({});
            expect(store.allProducts).to.deep.equal(products);
        });

        it('resets authoringFlow to single (default) and clears selectedOffers', () => {
            // The default authoringFlow is 'single' so a deep-linked open
            // (e.g. RTE double-click on an existing CTA — passes
            // searchOfferSelectorId but no explicit flow) lands in
            // single-offer authoring, not try/buy. Try/buy must be opted
            // into explicitly via multiSelect=true or authoringFlow='tryBuy'.
            store.authoringFlow = 'bundle';
            store.selectedOffers = [{ offer: {}, osi: 'test' }];
            store.init({});
            expect(store.authoringFlow).to.equal('single');
            expect(store.selectedOffers).to.deep.equal([]);
        });

        it('resets wizardStep to entitlements on init', () => {
            store.wizardStep = 'offer';
            store.init({});
            expect(store.wizardStep).to.equal('entitlements');
        });

        it('sets authoringFlow to tryBuy when multiSelect config is true', () => {
            store.init({ multiSelect: true });
            expect(store.authoringFlow).to.equal('tryBuy');
        });

        it('sets authoringFlow to bundle when bundleSelect config is true', () => {
            store.init({ bundleSelect: true });
            expect(store.authoringFlow).to.equal('bundle');
        });

        it('sets authoringFlow directly from config', () => {
            store.init({ authoringFlow: 'tryBuy' });
            expect(store.authoringFlow).to.equal('tryBuy');
        });

        it('sets authoringFlow to bundle from config', () => {
            store.init({ authoringFlow: 'bundle' });
            expect(store.authoringFlow).to.equal('bundle');
        });

        it('sets authoringFlow to consult from config', () => {
            store.init({ authoringFlow: 'consult' });
            expect(store.authoringFlow).to.equal('consult');
        });

        it('ignores invalid authoringFlow value from config (falls back to single default)', () => {
            store.init({ authoringFlow: 'bogus' });
            expect(store.authoringFlow).to.equal('single');
        });
    });

    describe('applySearchParams', () => {
        it('reads offerType from search params', () => {
            const params = new URLSearchParams('offerType=TRIAL');
            store.applySearchParams(params);
            expect(store.aosParams.offerType).to.equal('TRIAL');
        });

        it('reads storedPromoOverride from search params (price-element promo on deep-link)', () => {
            const params = new URLSearchParams('storedPromoOverride=UMRM2MUSPr501YOC');
            store.applySearchParams(params);
            expect(store.effectivePromoCode).to.equal('UMRM2MUSPr501YOC');
        });

        it('reads promotionCode from search params', () => {
            const params = new URLSearchParams('promotionCode=CTX30');
            store.applySearchParams(params);
            expect(store.effectivePromoCode).to.equal('CTX30');
        });

        it('sets tryBuy flow from multiSelect param', () => {
            const params = new URLSearchParams('multiSelect=true');
            store.applySearchParams(params);
            expect(store.authoringFlow).to.equal('tryBuy');
        });

        it('sets bundle flow from bundleSelect param', () => {
            const params = new URLSearchParams('bundleSelect=true');
            store.applySearchParams(params);
            expect(store.authoringFlow).to.equal('bundle');
        });

        it('sets authoringFlow from authoringFlow param', () => {
            const params = new URLSearchParams('authoringFlow=tryBuy');
            store.applySearchParams(params);
            expect(store.authoringFlow).to.equal('tryBuy');
        });

        it('sets bundle from authoringFlow param', () => {
            const params = new URLSearchParams('authoringFlow=bundle');
            store.applySearchParams(params);
            expect(store.authoringFlow).to.equal('bundle');
        });

        it('sets consult from authoringFlow param', () => {
            const params = new URLSearchParams('authoringFlow=consult');
            store.applySearchParams(params);
            expect(store.authoringFlow).to.equal('consult');
        });

        it('ignores invalid authoringFlow param value (default is single)', () => {
            const params = new URLSearchParams('authoringFlow=bogus');
            store.applySearchParams(params);
            expect(store.authoringFlow).to.equal('single');
        });
    });

    describe('helpMode', () => {
        it('defaults to false', () => {
            expect(store.helpMode).to.be.false;
        });

        it('toggles helpMode and notifies', () => {
            let notified = false;
            store.subscribe(() => {
                notified = true;
            });
            store.toggleHelp();
            expect(store.helpMode).to.be.true;
            expect(notified).to.be.true;
        });

        it('toggles back to false', () => {
            store.toggleHelp();
            store.toggleHelp();
            expect(store.helpMode).to.be.false;
        });
    });

    describe('viewState', () => {
        it("returns 'offers' before any offer is selected", () => {
            expect(store.viewState).to.equal('offers');
        });

        it("returns 'offers' when product selected but no offer", () => {
            store.setProduct({ name: 'Photoshop' });
            expect(store.viewState).to.equal('offers');
        });

        it("returns 'configure' when both product and offer selected in single flow", () => {
            store.authoringFlow = 'single';
            store.setProduct({ name: 'Photoshop' });
            store.setOffer({ offerId: 'ABC123' });
            expect(store.viewState).to.equal('configure');
        });

        it("resets to 'offers' when product changes in single flow", () => {
            store.authoringFlow = 'single';
            store.setProduct({ name: 'Photoshop' });
            store.setOffer({ offerId: 'ABC123' });
            expect(store.viewState).to.equal('configure');
            store.setProduct({ name: 'Illustrator' });
            expect(store.viewState).to.equal('offers');
        });

        it("returns 'offers' for tryBuy flow even with offer selected", () => {
            store.authoringFlow = 'tryBuy';
            store.setProduct({ name: 'Photoshop' });
            expect(store.viewState).to.equal('offers');
        });

        it("returns 'offers' for bundle flow", () => {
            store.authoringFlow = 'bundle';
            store.setProduct({ name: 'Photoshop' });
            expect(store.viewState).to.equal('offers');
        });

        it("returns 'offers' for consult flow with product", () => {
            store.authoringFlow = 'consult';
            store.setProduct({ name: 'Photoshop' });
            expect(store.viewState).to.equal('offers');
        });

        it("returns 'offer-detail-focused' for consult flow once an offer is selected", () => {
            store.authoringFlow = 'consult';
            store.setProduct({ name: 'Photoshop' });
            store.selectedOffer = { offer_id: 'ABC123' };
            expect(store.viewState).to.equal('offer-detail-focused');
        });

        it("returns 'offers' when flow is chosen via deep-link and no product selected", () => {
            store.init({ authoringFlow: 'tryBuy' });
            expect(store.viewState).to.equal('offers');
        });

        it("returns 'offers' for bundle deep-link without product", () => {
            store.init({ authoringFlow: 'bundle' });
            expect(store.viewState).to.equal('offers');
        });

        it("returns 'offers' for consult deep-link without product", () => {
            store.init({ authoringFlow: 'consult' });
            expect(store.viewState).to.equal('offers');
        });
    });

    describe('wizardStep', () => {
        it('defaults to entitlements', () => {
            expect(store.wizardStep).to.equal('entitlements');
        });

        it('canAdvance is false in single flow without a product', () => {
            store.authoringFlow = 'single';
            expect(store.canAdvance).to.be.false;
        });

        it('canAdvance is true in single flow once a product is selected', () => {
            store.authoringFlow = 'single';
            store.setProduct({ name: 'Photoshop' });
            expect(store.canAdvance).to.be.true;
        });

        it('canAdvance is true for tryBuy/bundle without a product', () => {
            store.authoringFlow = 'tryBuy';
            expect(store.canAdvance).to.be.true;
            store.authoringFlow = 'bundle';
            expect(store.canAdvance).to.be.true;
        });

        it('goToOffer advances when canAdvance is true', () => {
            store.setProduct({ name: 'Photoshop' });
            store.goToOffer();
            expect(store.wizardStep).to.equal('offer');
        });

        it('goToOffer is a no-op when canAdvance is false', () => {
            store.authoringFlow = 'single';
            store.goToOffer();
            expect(store.wizardStep).to.equal('entitlements');
        });

        it('goToEntitlements returns to Tab 1, preserves product, clears offer', () => {
            store.setProduct({ name: 'Photoshop' });
            store.setOffer({ offer_id: 'ABC123' });
            store.setOsi('osi-1');
            store.goToOffer();
            store.goToEntitlements();
            expect(store.wizardStep).to.equal('entitlements');
            expect(store.selectedProduct.name).to.equal('Photoshop');
            expect(store.selectedOffer).to.be.undefined;
            expect(store.selectedOsi).to.be.undefined;
        });

        it('goToEntitlements records lastSelectedOfferId', () => {
            store.setProduct({ name: 'Photoshop' });
            store.setOffer({ offer_id: 'ABC123' });
            store.goToEntitlements();
            expect(store.lastSelectedOfferId).to.equal('ABC123');
        });

        it('goToEntitlements preserves initialOsi so Back keeps the deep link', () => {
            store.initialOsi = 'DEEP';
            store.setOffer({ offer_id: 'ABC123' });
            store.setOsi('DEEP');
            store.goToEntitlements();
            expect(store.selectedOffer).to.be.undefined;
            expect(store.selectedOsi).to.be.undefined;
            expect(store.initialOsi).to.equal('DEEP');
        });
    });

    describe('chooseAuthoringFlow', () => {
        it('switches flow and clears selections immediately (no pending switch)', () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [{ offer: {}, osi: 'a' }];
            store.chooseAuthoringFlow('single');
            expect(store.authoringFlow).to.equal('single');
            expect(store.selectedOffers).to.deep.equal([]);
            expect(store.pendingFlowSwitch).to.be.null;
        });

        it('ignores invalid flow', () => {
            store.chooseAuthoringFlow('bogus');
            expect(store.authoringFlow).to.equal('single');
        });

        it('ignores switch to the current flow', () => {
            let notified = false;
            store.subscribe(() => {
                notified = true;
            });
            store.chooseAuthoringFlow('single');
            expect(notified).to.be.false;
        });
    });

    describe('authoringFlow', () => {
        it('defaults to single (single-offer authoring is the safe default)', () => {
            expect(store.authoringFlow).to.equal('single');
        });

        it('provides multiSelect compat getter (true only for tryBuy)', () => {
            expect(store.multiSelect).to.be.false;
            store.authoringFlow = 'tryBuy';
            expect(store.multiSelect).to.be.true;
            store.authoringFlow = 'single';
            expect(store.multiSelect).to.be.false;
        });
    });

    describe('canConfirm', () => {
        it('returns true for single when offer is selected', () => {
            store.authoringFlow = 'single';
            store.setOffer({ offerId: 'test' });
            expect(store.canConfirm).to.be.true;
        });

        it('returns false for single when no offer', () => {
            store.authoringFlow = 'single';
            expect(store.canConfirm).to.be.false;
        });

        it('returns true for tryBuy when base is selected', () => {
            store.authoringFlow = 'tryBuy';
            store.selectedOffers = [{ offer: {}, osi: 'base-osi', role: 'base' }];
            expect(store.canConfirm).to.be.true;
        });

        it('returns false for tryBuy when no base', () => {
            store.authoringFlow = 'tryBuy';
            expect(store.canConfirm).to.be.false;
        });

        it('returns true for bundle with 2+ offers', () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [
                { offer: {}, osi: 'a' },
                { offer: {}, osi: 'b' },
            ];
            expect(store.canConfirm).to.be.true;
        });

        it('returns false for bundle with < 2 offers', () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [{ offer: {}, osi: 'a' }];
            expect(store.canConfirm).to.be.false;
        });

        it('returns false for consult', () => {
            store.authoringFlow = 'consult';
            expect(store.canConfirm).to.be.false;
        });
    });

    describe('clearSelectedOffer', () => {
        it('clears the selected offer and osi', () => {
            store.setOffer({ offer_id: 'o' });
            store.setOsi('OSI-1');
            store.clearSelectedOffer();
            expect(store.selectedOffer).to.be.undefined;
            expect(store.selectedOsi).to.be.undefined;
        });
    });

    describe('autoSelectByInitialOsi', () => {
        const base = { offer_id: 'b', offer_type: 'BASE' };
        const trial = { offer_id: 't', offer_type: 'TRIAL' };

        it('selects the offer matching the resolved offer_type', () => {
            store.initialOsi = 'OSI-TRIAL';
            store.setAosParams({ offerType: 'TRIAL' });
            const selected = store.autoSelectByInitialOsi([base, trial]);
            expect(selected).to.be.true;
            expect(store.selectedOffer).to.equal(trial);
            expect(store.selectedOsi).to.equal('OSI-TRIAL');
        });

        it('returns false when a multi-offer list has no offer_type match', () => {
            store.initialOsi = 'OSI-X';
            store.setAosParams({ offerType: 'PROMOTION' });
            expect(store.autoSelectByInitialOsi([base, trial])).to.be.false;
            expect(store.selectedOffer).to.be.undefined;
        });

        it('returns false without an initialOsi', () => {
            store.setAosParams({ offerType: 'BASE' });
            expect(store.autoSelectByInitialOsi([base, trial])).to.be.false;
        });

        it('selects the sole offer for a single-offer list under an initialOsi', () => {
            store.initialOsi = 'OSI-SOLE';
            store.setAosParams({ offerType: 'PROMOTION' });
            expect(store.autoSelectByInitialOsi([base])).to.be.true;
            expect(store.selectedOffer).to.equal(base);
            expect(store.selectedOsi).to.equal('OSI-SOLE');
        });

        it('returns false for an empty offer list', () => {
            store.initialOsi = 'OSI-BASE';
            expect(store.autoSelectByInitialOsi([])).to.be.false;
        });
    });

    describe('addOffer', () => {
        it('sets selectedOffer in single flow', () => {
            store.authoringFlow = 'single';
            const offer = { offerId: 'test' };
            store.addOffer(offer, 'osi-1');
            expect(store.selectedOffer).to.equal(offer);
            expect(store.selectedOsi).to.equal('osi-1');
        });

        it('fills base slot then trial in tryBuy flow', () => {
            store.authoringFlow = 'tryBuy';
            const base = { offerId: 'base' };
            const trial = { offerId: 'trial' };
            store.addOffer(base, 'base-osi');
            expect(store.selectedBaseOffer).to.equal(base);
            expect(store.currentSlot).to.equal('trial');
            store.addOffer(trial, 'trial-osi');
            expect(store.selectedTrialOffer).to.equal(trial);
        });

        it('toggles offers in bundle flow', () => {
            store.authoringFlow = 'bundle';
            const offerA = { offerId: 'a' };
            const offerB = { offerId: 'b' };
            store.addOffer(offerA, 'osi-a');
            store.addOffer(offerB, 'osi-b');
            expect(store.selectedOffers).to.have.length(2);
            store.addOffer(offerA, 'osi-a');
            expect(store.selectedOffers).to.have.length(1);
            expect(store.selectedOffers[0].offer).to.equal(offerB);
        });

        it('does nothing in consult flow', () => {
            store.authoringFlow = 'consult';
            store.addOffer({ offerId: 'test' }, 'osi');
            expect(store.selectedOffers).to.have.length(0);
            expect(store.selectedOffer).to.be.undefined;
        });

        it('clears initialOsi when the user manually picks an offer', () => {
            store.authoringFlow = 'single';
            store.initialOsi = 'DEEP';
            store.addOffer({ offerId: 'test' }, 'osi-1');
            expect(store.initialOsi).to.be.undefined;
        });
    });

    describe('removeOffer / removeOfferByRole', () => {
        it('removes by index', () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [
                { offer: { id: 'a' }, osi: 'a' },
                { offer: { id: 'b' }, osi: 'b' },
            ];
            store.removeOffer(0);
            expect(store.selectedOffers).to.have.length(1);
            expect(store.selectedOffers[0].osi).to.equal('b');
        });

        it('removes by role', () => {
            store.authoringFlow = 'tryBuy';
            store.selectedOffers = [
                { offer: {}, osi: 'base', role: 'base' },
                { offer: {}, osi: 'trial', role: 'trial' },
            ];
            store.removeOfferByRole('trial');
            expect(store.selectedOffers).to.have.length(1);
            expect(store.selectedTrialOffer).to.be.null;
        });
    });

    describe('isOfferSelected', () => {
        it('detects single selected offer', () => {
            const offer = { offerId: 'test' };
            store.setOffer(offer);
            expect(store.isOfferSelected(offer)).to.be.true;
        });

        it('detects offer in selectedOffers array', () => {
            const offer = { offerId: 'test' };
            store.authoringFlow = 'bundle';
            store.selectedOffers = [{ offer, osi: 'osi' }];
            expect(store.isOfferSelected(offer)).to.be.true;
        });

        it('returns false for unselected offer', () => {
            expect(store.isOfferSelected({ offerId: 'nope' })).to.be.false;
        });
    });

    describe('setAuthoringFlow with state carry', () => {
        it('switches immediately when no selections', () => {
            store.setAuthoringFlow('tryBuy');
            expect(store.authoringFlow).to.equal('tryBuy');
            expect(store.pendingFlowSwitch).to.be.null;
        });

        it('sets pendingFlowSwitch when selections exist', () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [{ offer: {}, osi: 'a' }];
            store.setAuthoringFlow('single');
            expect(store.pendingFlowSwitch).to.equal('single');
            expect(store.authoringFlow).to.equal('bundle');
        });

        it('confirmFlowSwitch with keep transfers offers', () => {
            store.authoringFlow = 'bundle';
            const offerA = { offerId: 'a' };
            store.selectedOffers = [{ offer: offerA, osi: 'osi-a' }];
            store.setAuthoringFlow('tryBuy');
            store.confirmFlowSwitch(true);
            expect(store.authoringFlow).to.equal('tryBuy');
            expect(store.selectedBaseOffer).to.equal(offerA);
        });

        it('confirmFlowSwitch with discard clears offers', () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [{ offer: {}, osi: 'a' }];
            store.setAuthoringFlow('single');
            store.confirmFlowSwitch(false);
            expect(store.authoringFlow).to.equal('single');
            expect(store.selectedOffers).to.deep.equal([]);
        });

        it('cancelFlowSwitch restores original state', () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [{ offer: {}, osi: 'a' }];
            store.setAuthoringFlow('single');
            store.cancelFlowSwitch();
            expect(store.authoringFlow).to.equal('bundle');
            expect(store.pendingFlowSwitch).to.be.null;
        });

        it('ignores switch to same flow', () => {
            // Default authoringFlow is 'single', so setAuthoringFlow('single')
            // is a no-op and must not notify subscribers.
            let notified = false;
            store.subscribe(() => {
                notified = true;
            });
            store.setAuthoringFlow('single');
            expect(notified).to.be.false;
        });

        it('carries single selectedOffer to tryBuy base slot', () => {
            store.authoringFlow = 'single';
            const offer = { offerId: 'phsp' };
            store.setOffer(offer);
            store.setOsi('phsp-osi');
            store.setAuthoringFlow('tryBuy');
            store.confirmFlowSwitch(true);
            expect(store.authoringFlow).to.equal('tryBuy');
            expect(store.selectedBaseOffer).to.equal(offer);
            expect(store.selectedBaseOsi).to.equal('phsp-osi');
        });
    });

    describe('bundleOsis', () => {
        it('joins OSIs with comma', () => {
            store.selectedOffers = [
                { offer: {}, osi: 'a' },
                { offer: {}, osi: 'b' },
                { offer: {}, osi: 'c' },
            ];
            expect(store.bundleOsis).to.equal('a,b,c');
        });
    });

    describe('backward compatibility getters', () => {
        it('selectedBaseOffer returns base role offer', () => {
            store.selectedOffers = [{ offer: { id: 'base' }, osi: 'base-osi', role: 'base' }];
            expect(store.selectedBaseOffer.id).to.equal('base');
            expect(store.selectedBaseOsi).to.equal('base-osi');
        });

        it('selectedTrialOffer returns trial role offer', () => {
            store.selectedOffers = [{ offer: { id: 'trial' }, osi: 'trial-osi', role: 'trial' }];
            expect(store.selectedTrialOffer.id).to.equal('trial');
            expect(store.selectedTrialOsi).to.equal('trial-osi');
        });

        it('returns null when no matching role', () => {
            expect(store.selectedBaseOffer).to.be.null;
            expect(store.selectedTrialOffer).to.be.null;
        });

        it('canConfirmMultiSelect works with tryBuy flow', () => {
            store.authoringFlow = 'tryBuy';
            expect(store.canConfirmMultiSelect).to.be.false;
            store.selectedOffers = [{ offer: {}, osi: 'base-osi', role: 'base' }];
            expect(store.canConfirmMultiSelect).to.be.true;
        });
    });

    describe('effectivePromoCode', () => {
        it('prefers override, falls back to context promotionCode', () => {
            store.promotionCode = 'CONTEXT30';
            store.storedPromoOverride = undefined;
            expect(store.effectivePromoCode).to.equal('CONTEXT30');
            store.setPromoCode('MANUAL10');
            expect(store.effectivePromoCode).to.equal('MANUAL10');
            store.setPromoCode('');
            expect(store.effectivePromoCode).to.equal('CONTEXT30');
        });

        it('returns empty string when neither override nor context is set', () => {
            store.promotionCode = undefined;
            store.storedPromoOverride = undefined;
            expect(store.effectivePromoCode).to.equal('');
        });

        it('U13: auto-populates from context promotionCode when no override is set', () => {
            store.storedPromoOverride = undefined;
            store.promotionCode = 'CTXONLY';
            expect(store.effectivePromoCode).to.equal('CTXONLY');
            expect(store.storedPromoOverride).to.be.undefined;
        });

        it('U13: setPromoCode override wins over context promotionCode', () => {
            store.promotionCode = 'CTXONLY';
            store.setPromoCode('OVERRIDE');
            expect(store.effectivePromoCode).to.equal('OVERRIDE');
        });

        it('U13: setPromoCode empty string reverts to context promotionCode', () => {
            store.promotionCode = 'CTXONLY';
            store.setPromoCode('OVERRIDE');
            store.setPromoCode('');
            expect(store.effectivePromoCode).to.equal('CTXONLY');
        });

        it('U13: both override and context empty resolve to empty string', () => {
            store.promotionCode = '';
            store.setPromoCode('');
            expect(store.effectivePromoCode).to.equal('');
        });
    });

    describe('U14 country and landscape', () => {
        it('setCountry sets store.country to the given code', () => {
            store.setCountry('FR');
            expect(store.country).to.equal('FR');
            expect(store.country).to.not.equal('US');
        });

        it('setCountry derives language from country mapping', () => {
            store.setCountry('JP');
            expect(store.language).to.equal('ja');
        });

        it('setCountry falls back to en for an unmapped country code', () => {
            store.setCountry('ZZ');
            expect(store.language).to.equal('en');
        });

        it('setCountry updates country and notifies subscribers for that change', () => {
            store.setCountry('US');
            let notifiedCountry;
            store.subscribe(() => {
                notifiedCountry = store.country;
            });
            store.setCountry('DE');
            expect(store.country).to.equal('DE');
            expect(notifiedCountry).to.equal('DE');
        });

        it('setting landscape updates store.landscape', () => {
            expect(store.landscape).to.equal('PUBLISHED');
            store.landscape = 'DRAFT';
            expect(store.landscape).to.equal('DRAFT');
            expect(store.landscape).to.not.equal('PUBLISHED');
        });

        it('setting landscape updates landscape and notifies subscribers for that change', () => {
            store.landscape = 'PUBLISHED';
            let notifiedLandscape;
            store.subscribe(() => {
                notifiedLandscape = store.landscape;
            });
            store.landscape = 'DRAFT';
            expect(store.landscape).to.equal('DRAFT');
            expect(notifiedLandscape).to.equal('DRAFT');
        });
    });

    describe('setEnv', () => {
        it('switches env and clears offers for re-resolution', () => {
            store.setOffers([{ offerId: 'a' }, { offerId: 'b' }]);
            store.setEnv('STAGE');
            expect(store.env).to.equal('STAGE');
            expect(store.offers).to.deep.equal([]);
        });

        it('is a no-op when env is unchanged', () => {
            store.setOffers([{ offerId: 'a' }]);
            store.setEnv('PRODUCTION');
            expect(store.offers).to.have.length(1);
        });

        it('preserves selected product and offer across env switch', () => {
            store.setProduct({ name: 'Photoshop' });
            store.setOffer({ offerId: 'a' });
            store.setEnv('STAGE');
            expect(store.selectedProduct.name).to.equal('Photoshop');
            expect(store.selectedOffer.offerId).to.equal('a');
        });
    });

    describe('setCurrentSlot', () => {
        it('sets slot to trial when valid', () => {
            store.setCurrentSlot('trial');
            expect(store.currentSlot).to.equal('trial');
        });

        it('sets slot back to base', () => {
            store.setCurrentSlot('trial');
            store.setCurrentSlot('base');
            expect(store.currentSlot).to.equal('base');
        });

        it('ignores an invalid slot value', () => {
            store.setCurrentSlot('trial');
            store.setCurrentSlot('bogus');
            expect(store.currentSlot).to.equal('trial');
        });
    });

    describe('clearOffers', () => {
        it('empties selectedOffers and clears single selection', () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [{ offer: {}, osi: 'a' }];
            store.selectedOffer = { offerId: 'x' };
            store.selectedOsi = 'x-osi';
            store.clearOffers();
            expect(store.selectedOffers).to.deep.equal([]);
            expect(store.selectedOffer).to.be.undefined;
            expect(store.selectedOsi).to.be.undefined;
        });
    });

    describe('toggleMultiSelect', () => {
        it('switches from tryBuy back to single', () => {
            store.authoringFlow = 'tryBuy';
            store.selectedOffers = [{ offer: {}, osi: 'a', role: 'base' }];
            store.toggleMultiSelect();
            expect(store.authoringFlow).to.equal('single');
            expect(store.selectedOffers).to.deep.equal([]);
        });

        it('switches to tryBuy and carries existing single offer into base slot', () => {
            store.authoringFlow = 'single';
            const offer = { offerId: 'phsp' };
            store.setOffer(offer);
            store.setOsi('phsp-osi');
            store.toggleMultiSelect();
            expect(store.authoringFlow).to.equal('tryBuy');
            expect(store.selectedBaseOffer).to.equal(offer);
            expect(store.selectedBaseOsi).to.equal('phsp-osi');
            expect(store.selectedOffer).to.be.undefined;
        });

        it('switches to tryBuy with no carried offers when none selected', () => {
            store.authoringFlow = 'single';
            store.toggleMultiSelect();
            expect(store.authoringFlow).to.equal('tryBuy');
            expect(store.selectedOffers).to.deep.equal([]);
        });
    });

    describe('addOffer tryBuy explicit role', () => {
        it('honors an explicit role argument over currentSlot', () => {
            store.authoringFlow = 'tryBuy';
            const trial = { offerId: 'trial' };
            store.addOffer(trial, 'trial-osi', 'trial');
            expect(store.selectedTrialOffer).to.equal(trial);
            expect(store.currentSlot).to.equal('base');
        });

        it('replaces an existing offer in the same role slot', () => {
            store.authoringFlow = 'tryBuy';
            store.addOffer({ offerId: 'base1' }, 'osi1', 'base');
            const base2 = { offerId: 'base2' };
            store.addOffer(base2, 'osi2', 'base');
            expect(store.selectedBaseOffer).to.equal(base2);
            expect(store.selectedOffers.filter((o) => o.role === 'base')).to.have.length(1);
        });
    });

    describe('removeOffer bounds', () => {
        it('is a no-op for an out-of-range index', () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [{ offer: {}, osi: 'a' }];
            store.removeOffer(5);
            expect(store.selectedOffers).to.have.length(1);
        });

        it('is a no-op for a negative index', () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [{ offer: {}, osi: 'a' }];
            store.removeOffer(-1);
            expect(store.selectedOffers).to.have.length(1);
        });
    });

    describe('confirmFlowSwitch no-op', () => {
        it('does nothing when no pending switch exists', () => {
            store.authoringFlow = 'single';
            store.confirmFlowSwitch(true);
            expect(store.authoringFlow).to.equal('single');
            expect(store.pendingFlowSwitch).to.be.null;
        });
    });

    describe('flow switch carries to bundle', () => {
        it('maps prior offers into bundle entries on confirm with keep', () => {
            store.authoringFlow = 'tryBuy';
            store.selectedOffers = [
                { offer: { id: 'base' }, osi: 'osi-base', role: 'base' },
                { offer: { id: 'trial' }, osi: 'osi-trial', role: 'trial' },
            ];
            store.setAuthoringFlow('bundle');
            store.confirmFlowSwitch(true);
            expect(store.authoringFlow).to.equal('bundle');
            expect(store.selectedOffers).to.have.length(2);
            expect(store.selectedOffers[0].osi).to.equal('osi-base');
            expect(store.selectedOffers[0].role).to.be.undefined;
        });

        it('carries a single offer into tryBuy with a second prior offer as trial', () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [
                { offer: { id: 'one' }, osi: 'osi-one' },
                { offer: { id: 'two' }, osi: 'osi-two' },
            ];
            store.setAuthoringFlow('tryBuy');
            store.confirmFlowSwitch(true);
            expect(store.selectedBaseOsi).to.equal('osi-one');
            expect(store.selectedTrialOsi).to.equal('osi-two');
        });
    });

    describe('autoSelectProductByArrangementCode', () => {
        it('selects the product whose tuple key matches the arrangement code', () => {
            store.setProducts([
                ['phsp', { name: 'Photoshop' }],
                ['illu', { name: 'Illustrator' }],
            ]);
            store.autoSelectProductByArrangementCode('illu');
            expect(store.selectedProduct.name).to.equal('Illustrator');
        });

        it('stashes a pending code when the catalog is not yet loaded', () => {
            store.autoSelectProductByArrangementCode('phsp');
            expect(store.selectedProduct).to.be.undefined;
            expect(store.pendingArrangementCode).to.equal('phsp');
        });

        it('fulfills the pending arrangement code once products arrive', () => {
            store.autoSelectProductByArrangementCode('illu');
            store.setProducts([
                ['phsp', { name: 'Photoshop' }],
                ['illu', { name: 'Illustrator' }],
            ]);
            expect(store.selectedProduct.name).to.equal('Illustrator');
            expect(store.pendingArrangementCode).to.be.null;
        });
    });

    describe('applySearchParams deep link', () => {
        it('is a no-op when no search parameters are provided', () => {
            store.applySearchParams(null);
            expect(store.deepLink).to.deep.equal({});
        });

        it('reads country and promotionCode params', () => {
            const params = new URLSearchParams('country=DE&promotionCode=SAVE20');
            store.applySearchParams(params);
            expect(store.country).to.equal('DE');
            expect(store.storedPromoOverride).to.equal('SAVE20');
        });

        it('captures deep link string and boolean fields', () => {
            const params = new URLSearchParams(
                'offerId=O123&type=checkout&workflowStep=ucv3&text=Buy&checkoutType=UCv3&modal=twp&entitlement=true&upgrade=true',
            );
            store.applySearchParams(params);
            expect(store.deepLink.offerId).to.equal('O123');
            expect(store.deepLink.type).to.equal('checkout');
            expect(store.deepLink.workflowStep).to.equal('ucv3');
            expect(store.deepLink.text).to.equal('Buy');
            expect(store.deepLink.checkoutType).to.equal('UCv3');
            expect(store.deepLink.modal).to.equal('twp');
            expect(store.deepLink.entitlement).to.be.true;
            expect(store.deepLink.upgrade).to.be.true;
        });

        it('parses entitlement/upgrade false flags as false', () => {
            const params = new URLSearchParams('entitlement=false&upgrade=false');
            store.applySearchParams(params);
            expect(store.deepLink.entitlement).to.be.false;
            expect(store.deepLink.upgrade).to.be.false;
        });

        it('applies aosParams from search params', () => {
            const params = new URLSearchParams(
                'commitment=YEAR&term=MONTHLY&customerSegment=INDIVIDUAL&marketSegment=COM&offerType=BASE',
            );
            store.applySearchParams(params);
            expect(store.aosParams.commitment).to.equal('YEAR');
            expect(store.aosParams.term).to.equal('MONTHLY');
            expect(store.aosParams.customerSegment).to.equal('INDIVIDUAL');
            expect(store.aosParams.marketSegment).to.equal('COM');
            expect(store.aosParams.offerType).to.equal('BASE');
        });

        it('auto-selects the product from arrangement_code alongside aosParams', () => {
            store.setProducts([['phsp', { name: 'Photoshop' }]]);
            const params = new URLSearchParams('arrangement_code=phsp&commitment=YEAR');
            store.applySearchParams(params);
            expect(store.aosParams.arrangementCode).to.equal('phsp');
            expect(store.selectedProduct.name).to.equal('Photoshop');
        });

        it('auto-selects the product from arrangement_code with no other aos params', () => {
            store.setProducts([['illu', { name: 'Illustrator' }]]);
            const params = new URLSearchParams('arrangement_code=illu');
            store.applySearchParams(params);
            expect(store.selectedProduct.name).to.equal('Illustrator');
        });
    });

    describe('notify', () => {
        it('dispatches a state-changed event to subscribers', () => {
            let notified = false;
            store.subscribe(() => {
                notified = true;
            });
            store.notify();
            expect(notified).to.be.true;
        });
    });

    describe('loadOffers', () => {
        function makeAosOffer(overrides = {}) {
            return {
                offer_id: 'OF-1',
                offer_type: 'BASE',
                price_point: 'REGULAR',
                market_segments: ['COM'],
                commitment: 'YEAR',
                term: 'MONTHLY',
                ...overrides,
            };
        }

        it('populates store.offers from searchOffers and clears loading', async () => {
            const originalFetch = window.fetch;
            window.fetch = async () => ({
                ok: true,
                json: async () => [makeAosOffer({ offer_id: 'A' }), makeAosOffer({ offer_id: 'B' })],
            });
            try {
                store.selectedProduct = { name: 'Photoshop', icon: 'icon.png' };
                store.aosParams = { arrangementCode: 'photoshop-arr' };
                await store.loadOffers();
                expect(store.offers).to.have.length(2);
                expect(store.offers.every((o) => o.name === 'Photoshop')).to.be.true;
                expect(store.loading).to.be.false;
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('auto-selects and resolves OSI when a single offer comes back', async () => {
            const originalFetch = window.fetch;
            window.fetch = async (url) => {
                if (String(url).includes('/offer_selectors')) {
                    return { ok: true, json: async () => ({ id: 'auto-osi' }) };
                }
                return { ok: true, json: async () => [makeAosOffer({ offer_id: 'ONLY-1' })] };
            };
            try {
                store.selectedProduct = { name: 'Photoshop' };
                store.aosParams = { arrangementCode: 'photoshop-arr' };
                await store.loadOffers();
                await new Promise((resolve) => setTimeout(resolve, 0));
                expect(store.offers).to.have.length(1);
                expect(store.selectedOffer?.offer_id).to.equal('ONLY-1');
                expect(store.selectedOsi).to.equal('auto-osi');
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('returns early without fetching when no product is selected', async () => {
            const originalFetch = window.fetch;
            let called = false;
            window.fetch = async () => {
                called = true;
                return { ok: true, json: async () => [] };
            };
            try {
                store.selectedProduct = undefined;
                await store.loadOffers();
                expect(called).to.be.false;
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('emits a synthetic offer when aosParams.offerType starts with "fake-"', async () => {
            store.selectedProduct = { name: 'Photoshop', icon: 'icon.png' };
            store.aosParams = { arrangementCode: 'photoshop-arr', offerType: 'fake-PHSP_BASE' };
            await store.loadOffers();
            expect(store.offers).to.have.length(1);
            expect(store.offers[0].offer_id).to.equal('Fake Offer');
            expect(store.offers[0].offer_type).to.equal('fake-PHSP_BASE');
            expect(store.offers[0].name).to.equal('Photoshop');
        });

        it('falls back to an empty offers list when the fetch throws', async () => {
            const originalFetch = window.fetch;
            window.fetch = async () => {
                throw new Error('aos down');
            };
            try {
                store.selectedProduct = { name: 'Photoshop' };
                store.offers = [makeAosOffer({ offer_id: 'stale' })];
                store.aosParams = { arrangementCode: 'photoshop-arr' };
                await store.loadOffers();
                expect(store.offers).to.have.length(0);
                expect(store.loading).to.be.false;
            } finally {
                window.fetch = originalFetch;
            }
        });
    });

    describe('auto-trigger loadOffers', () => {
        it('setProduct triggers a searchOffers fetch', async () => {
            const originalFetch = window.fetch;
            let called = false;
            window.fetch = async () => {
                called = true;
                return { ok: true, json: async () => [] };
            };
            try {
                store.setProduct({ arrangement_code: 'x', name: 'X' });
                await new Promise((resolve) => setTimeout(resolve, 0));
                expect(called).to.be.true;
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('setAosParams triggers a searchOffers fetch when a product is selected', async () => {
            const originalFetch = window.fetch;
            let calls = 0;
            window.fetch = async () => {
                calls++;
                return { ok: true, json: async () => [] };
            };
            try {
                store.selectedProduct = { arrangement_code: 'x', name: 'X' };
                store.setAosParams({ commitment: 'YEAR' });
                await new Promise((resolve) => setTimeout(resolve, 0));
                expect(calls).to.be.greaterThan(0);
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('the offers key guard skips a duplicate loadOffers for unchanged params', async () => {
            const originalFetch = window.fetch;
            let calls = 0;
            window.fetch = async () => {
                calls++;
                return { ok: true, json: async () => [] };
            };
            try {
                store.setProduct({ arrangement_code: 'x', name: 'X' });
                await new Promise((resolve) => setTimeout(resolve, 0));
                const after = calls;
                store.setAosParams({});
                await new Promise((resolve) => setTimeout(resolve, 0));
                expect(calls).to.equal(after);
            } finally {
                window.fetch = originalFetch;
            }
        });
    });
});
