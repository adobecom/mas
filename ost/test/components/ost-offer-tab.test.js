import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-offer-tab.js';
import { store } from '../../src/store/ost-store.js';

const SELECTED = { offer_id: 'TAB1', offer_type: 'BASE' };

describe('ost-offer-tab configPanel per authoring flow', () => {
    beforeEach(() => {
        store.offers = [SELECTED];
        store.selectedProduct = { name: 'Photoshop' };
        store.aosParams = {};
    });

    afterEach(() => {
        store.authoringFlow = 'single';
        store.selectedOffer = undefined;
        store.selectedOsi = undefined;
        store.selectedOffers = [];
        store.offers = [];
    });

    it('single flow with a selected offer renders placeholder panel and promo tag', async () => {
        store.authoringFlow = 'single';
        store.selectedOffer = SELECTED;
        store.selectedOsi = 'osi';
        const el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
        expect(el.shadowRoot.querySelector('ost-placeholder-panel')).to.exist;
        expect(el.shadowRoot.querySelector('ost-promo-tag')).to.exist;
    });

    it('single flow without a selected offer shows the empty state, no panel', async () => {
        store.authoringFlow = 'single';
        store.selectedOffer = undefined;
        const el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
        expect(el.shadowRoot.querySelector('ost-placeholder-panel')).to.not.exist;
        expect(el.shadowRoot.querySelector('.empty-state')).to.exist;
    });

    it('tryBuy flow renders the selection list, not the placeholder panel', async () => {
        store.authoringFlow = 'tryBuy';
        const el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
        expect(el.shadowRoot.querySelector('ost-selection-list')).to.exist;
        expect(el.shadowRoot.querySelector('ost-placeholder-panel')).to.not.exist;
    });

    it('bundle flow renders the selection list, not the placeholder panel', async () => {
        store.authoringFlow = 'bundle';
        const el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
        expect(el.shadowRoot.querySelector('ost-selection-list')).to.exist;
        expect(el.shadowRoot.querySelector('ost-placeholder-panel')).to.not.exist;
    });

    it('consult flow with a selected offer renders the focused detail, not the panel', async () => {
        store.authoringFlow = 'consult';
        store.selectedOffer = SELECTED;
        store.selectedOsi = 'osi';
        const el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
        expect(el.shadowRoot.querySelector('ost-offer-detail-focused')).to.exist;
        expect(el.shadowRoot.querySelector('ost-placeholder-panel')).to.not.exist;
    });

    it('consult flow without a selected offer shows its own empty state', async () => {
        store.authoringFlow = 'consult';
        store.selectedOffer = undefined;
        const el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
        expect(el.shadowRoot.querySelector('.empty-state')).to.exist;
        expect(el.shadowRoot.querySelector('ost-offer-detail-focused')).to.not.exist;
    });

    it('preserves user placeholderOptions across a single→tryBuy→single switch', async () => {
        store.authoringFlow = 'single';
        store.setPlaceholderOptions({ ...store.placeholderOptions, displayTax: true });
        store.applyFlowSwitch('tryBuy', false);
        store.applyFlowSwitch('single', false);
        expect(store.placeholderOptions.displayTax).to.be.true;
    });

    describe('footer Use button per authoring flow', () => {
        const useButton = (el) => el.shadowRoot.querySelector('[data-testid="ost-footer-use-button"]');

        it('single: label "Use", disabled until an offer is selected', async () => {
            store.authoringFlow = 'single';
            store.selectedOffer = undefined;
            let el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
            expect(useButton(el).textContent.trim()).to.equal('Use');
            expect(useButton(el).hasAttribute('disabled')).to.be.true;

            store.selectedOffer = SELECTED;
            store.selectedOsi = 'osi';
            el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
            expect(useButton(el).hasAttribute('disabled')).to.be.false;
        });

        it('tryBuy: plain "Use", enabled once a base is selected', async () => {
            store.authoringFlow = 'tryBuy';
            store.selectedOffers = [{ offer: SELECTED, osi: 'base-osi', role: 'base' }];
            const el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
            expect(useButton(el).textContent.trim()).to.equal('Use');
            expect(useButton(el).hasAttribute('disabled')).to.be.false;
        });

        it('tryBuy: disabled when no base role is selected', async () => {
            store.authoringFlow = 'tryBuy';
            store.selectedOffers = [];
            const el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
            expect(useButton(el).hasAttribute('disabled')).to.be.true;
        });

        it('bundle: plain "Use", enabled only with 2+ offers', async () => {
            store.authoringFlow = 'bundle';
            store.selectedOffers = [{ offer: SELECTED, osi: 'o1' }];
            let el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
            expect(useButton(el).textContent.trim()).to.equal('Use');
            expect(useButton(el).hasAttribute('disabled')).to.be.true;

            store.selectedOffers = [
                { offer: SELECTED, osi: 'o1' },
                { offer: { offer_id: 'O2' }, osi: 'o2' },
            ];
            el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
            expect(useButton(el).hasAttribute('disabled')).to.be.false;
        });

        it('consult: "Close" (secondary) when no offer, "Use" (accent) when focused', async () => {
            store.authoringFlow = 'consult';
            store.selectedOffer = undefined;
            let el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
            expect(useButton(el).textContent.trim()).to.equal('Close');
            expect(useButton(el).getAttribute('variant')).to.equal('secondary');
            expect(useButton(el).hasAttribute('disabled')).to.be.false;

            store.selectedOffer = SELECTED;
            store.selectedOsi = 'osi';
            el = await fixture(html`<ost-offer-tab></ost-offer-tab>`);
            expect(useButton(el).textContent.trim()).to.equal('Use');
            expect(useButton(el).getAttribute('variant')).to.equal('accent');
        });
    });
});
