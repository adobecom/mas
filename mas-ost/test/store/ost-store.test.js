import { expect } from '@open-wc/testing';
import { OstStore } from '../../src/store/ost-store.js';

describe('OstStore', () => {
    let store;
    beforeEach(() => { store = new OstStore(); });

    it('initializes with default aosParams', () => {
        expect(store.aosParams.customerSegment).to.equal('');
        expect(store.aosParams.offerType).to.equal('');
        expect(store.aosParams.marketSegment).to.equal('');
    });

    it('notifies subscribers on setCountry', () => {
        let notified = false;
        store.subscribe(() => { notified = true; });
        store.setCountry('JP');
        expect(notified).to.be.true;
        expect(store.country).to.equal('JP');
    });

    it('unsubscribes correctly', () => {
        let count = 0;
        const handler = () => { count++; };
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

    it('clears selectedOffer and selectedOsi on setProduct', () => {
        store.selectedOffer = { offerId: 'test' };
        store.selectedOsi = 'test-osi';
        store.setProduct({ name: 'Illustrator' });
        expect(store.selectedOffer).to.be.undefined;
        expect(store.selectedOsi).to.be.undefined;
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

        it('resets authoringFlow to tryBuy and selectedOffers', () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [{ offer: {}, osi: 'test' }];
            store.init({});
            expect(store.authoringFlow).to.equal('tryBuy');
            expect(store.selectedOffers).to.deep.equal([]);
        });

        it('sets authoringFlow to tryBuy when multiSelect config is true', () => {
            store.init({ multiSelect: true });
            expect(store.authoringFlow).to.equal('tryBuy');
            expect(store.flowChosen).to.be.true;
        });

        it('sets authoringFlow to bundle when bundleSelect config is true', () => {
            store.init({ bundleSelect: true });
            expect(store.authoringFlow).to.equal('bundle');
            expect(store.flowChosen).to.be.true;
        });

        it('sets authoringFlow directly from config', () => {
            store.init({ authoringFlow: 'tryBuy' });
            expect(store.authoringFlow).to.equal('tryBuy');
            expect(store.flowChosen).to.be.true;
        });

        it('sets authoringFlow to bundle from config', () => {
            store.init({ authoringFlow: 'bundle' });
            expect(store.authoringFlow).to.equal('bundle');
            expect(store.flowChosen).to.be.true;
        });

        it('sets authoringFlow to consult from config', () => {
            store.init({ authoringFlow: 'consult' });
            expect(store.authoringFlow).to.equal('consult');
            expect(store.flowChosen).to.be.true;
        });

        it('ignores invalid authoringFlow value from config', () => {
            store.init({ authoringFlow: 'bogus' });
            expect(store.authoringFlow).to.equal('tryBuy');
            expect(store.flowChosen).to.be.false;
        });

        it('resets flowChosen to false on init without flow config', () => {
            store.flowChosen = true;
            store.init({});
            expect(store.flowChosen).to.be.false;
        });
    });

    describe('applySearchParams', () => {
        it('reads offerType from search params', () => {
            const params = new URLSearchParams('offerType=TRIAL');
            store.applySearchParams(params);
            expect(store.aosParams.offerType).to.equal('TRIAL');
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
            expect(store.flowChosen).to.be.true;
        });

        it('sets authoringFlow from authoringFlow param', () => {
            const params = new URLSearchParams('authoringFlow=tryBuy');
            store.applySearchParams(params);
            expect(store.authoringFlow).to.equal('tryBuy');
            expect(store.flowChosen).to.be.true;
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

        it('ignores invalid authoringFlow param value', () => {
            const params = new URLSearchParams('authoringFlow=bogus');
            store.applySearchParams(params);
            expect(store.authoringFlow).to.equal('tryBuy');
            expect(store.flowChosen).to.be.false;
        });
    });

    describe('helpMode', () => {
        it('defaults to false', () => {
            expect(store.helpMode).to.be.false;
        });

        it('toggles helpMode and notifies', () => {
            let notified = false;
            store.subscribe(() => { notified = true; });
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
        it("returns 'welcome' when no product selected and flow not chosen", () => {
            expect(store.viewState).to.equal('welcome');
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

        it("returns 'welcome' for consult flow without product and flow not chosen", () => {
            store.authoringFlow = 'consult';
            expect(store.viewState).to.equal('welcome');
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

    describe('authoringFlow', () => {
        it('defaults to tryBuy', () => {
            expect(store.authoringFlow).to.equal('tryBuy');
        });

        it('provides multiSelect compat getter', () => {
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
            let notified = false;
            store.subscribe(() => { notified = true; });
            store.setAuthoringFlow('tryBuy');
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
            store.selectedOffers = [
                { offer: { id: 'base' }, osi: 'base-osi', role: 'base' },
            ];
            expect(store.selectedBaseOffer.id).to.equal('base');
            expect(store.selectedBaseOsi).to.equal('base-osi');
        });

        it('selectedTrialOffer returns trial role offer', () => {
            store.selectedOffers = [
                { offer: { id: 'trial' }, osi: 'trial-osi', role: 'trial' },
            ];
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
});
