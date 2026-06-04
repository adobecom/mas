import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-help-banner.js';
import { store } from '../../src/store/ost-store.js';
import { HELP_BANNERS } from '../../src/data/help-content.js';

describe('ost-help-banner', () => {
    let originalViewStateDescriptor;

    beforeEach(() => {
        store.helpMode = false;
        store.authoringFlow = 'single';
        store.selectedOffer = undefined;
        originalViewStateDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(store), 'viewState');
    });

    afterEach(() => {
        store.helpMode = false;
        store.authoringFlow = 'single';
        store.selectedOffer = undefined;
        Object.defineProperty(Object.getPrototypeOf(store), 'viewState', originalViewStateDescriptor);
    });

    function stubViewState(value) {
        Object.defineProperty(Object.getPrototypeOf(store), 'viewState', {
            configurable: true,
            get: () => value,
        });
    }

    it('renders nothing when helpMode is off', async () => {
        store.helpMode = false;
        const el = await fixture(html`<ost-help-banner></ost-help-banner>`);

        expect(el.shadowRoot.querySelector('.help-banner')).to.equal(null);
    });

    it('renders the offers banner step, title and body when helpMode is on', async () => {
        store.helpMode = true;
        store.authoringFlow = 'single';
        store.selectedOffer = undefined;
        const el = await fixture(html`<ost-help-banner></ost-help-banner>`);

        const banner = el.shadowRoot.querySelector('.help-banner');
        expect(banner).to.not.equal(null);
        expect(el.shadowRoot.querySelector('.help-step').textContent).to.equal(`${HELP_BANNERS.offers.step}.`);
        expect(el.shadowRoot.querySelector('.help-title').textContent).to.equal(HELP_BANNERS.offers.title);
        expect(el.shadowRoot.querySelector('.help-body').textContent).to.equal(HELP_BANNERS.offers.body);
    });

    it('renders the configure banner when an offer is selected in single flow', async () => {
        store.helpMode = true;
        store.authoringFlow = 'single';
        store.selectedOffer = { offer_id: 'ABC123' };
        const el = await fixture(html`<ost-help-banner></ost-help-banner>`);

        expect(el.shadowRoot.querySelector('.help-title').textContent).to.equal(HELP_BANNERS.configure.title);
        expect(el.shadowRoot.querySelector('.help-step').textContent).to.equal(`${HELP_BANNERS.configure.step}.`);
    });

    it('renders the empty banner when viewState resolves to empty', async () => {
        store.helpMode = true;
        stubViewState('empty');
        const el = await fixture(html`<ost-help-banner></ost-help-banner>`);

        expect(el.shadowRoot.querySelector('.help-title').textContent).to.equal(HELP_BANNERS.empty.title);
        expect(el.shadowRoot.querySelector('.help-step').textContent).to.equal(`${HELP_BANNERS.empty.step}.`);
    });

    it('renders nothing when helpMode is on but viewState has no banner', async () => {
        store.helpMode = true;
        stubViewState('offer-detail-focused');
        const el = await fixture(html`<ost-help-banner></ost-help-banner>`);

        expect(el.shadowRoot.querySelector('.help-banner')).to.equal(null);
    });

    it('re-renders when helpMode toggles on after first render', async () => {
        store.helpMode = false;
        const el = await fixture(html`<ost-help-banner></ost-help-banner>`);
        expect(el.shadowRoot.querySelector('.help-banner')).to.equal(null);

        store.helpMode = true;
        await el.updateComplete;

        expect(el.shadowRoot.querySelector('.help-banner')).to.not.equal(null);
    });

    it('stops re-rendering on store changes after disconnect', async () => {
        store.helpMode = false;
        const el = await fixture(html`<ost-help-banner></ost-help-banner>`);
        el.remove();

        store.helpMode = true;
        await el.updateComplete;

        expect(el.shadowRoot.querySelector('.help-banner')).to.equal(null);
    });
});
