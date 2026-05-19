import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/mas-ost-offer-card.js';
import { store } from '../../src/store/ost-store.js';

const mockOffer = {
    offer_id: '257E1D82082387D152029F93C1030624',
    offer_type: 'BASE',
    price_point: 'REGULAR',
    language: 'MULT',
    commitment: 'YEAR',
    term: 'MONTHLY',
    planType: 'ABM',
    market_segments: ['COM'],
    customer_segment: 'INDIVIDUAL',
    buying_program: 'RETAIL',
    sales_channel: 'DIRECT',
    merchant: 'ADOBE',
    product_arrangement_code: 'PA-123',
    name: 'Photoshop',
    icon: 'https://example.com/ps.svg',
    pricing: {
        currency: { symbol: '$', format_string: "'US$'#,##0.00" },
        prices: [
            {
                price_details: { display_rules: { price: 22.99 } },
            },
        ],
    },
};

const fakeOffer = {
    offer_id: 'Fake Offer',
    offer_type: 'fake-trial',
    price_point: 'I am not real!',
    language: 'Fake',
    market_segments: ['COM'],
    planType: 'Fake',
    pricing: {
        currency: { format_string: "'US$'#,##0.00" },
        prices: [{ price_details: { display_rules: { price: 99.9 } } }],
    },
};

describe('mas-ost-offer-card', () => {
    it('renders price and plan type badge', async () => {
        const el = await fixture(
            html`<mas-ost-offer-card .offer=${mockOffer}></mas-ost-offer-card>`,
        );

        const priceCell = el.shadowRoot.querySelector('.cell-price');
        expect(priceCell).to.exist;
        expect(priceCell.textContent).to.include('22.99');

        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge).to.exist;
        expect(badge.textContent.trim()).to.equal('ABM');
        expect(badge.getAttribute('variant')).to.equal('positive');
    });

    it('renders full offer ID', async () => {
        const el = await fixture(
            html`<mas-ost-offer-card .offer=${mockOffer}></mas-ost-offer-card>`,
        );

        const idCell = el.shadowRoot.querySelector('.cell-id');
        expect(idCell).to.exist;
        expect(idCell.textContent.trim()).to.equal(mockOffer.offer_id);
    });

    it('applies selected attribute and style', async () => {
        const el = await fixture(
            html`<mas-ost-offer-card .offer=${mockOffer} selected></mas-ost-offer-card>`,
        );
        expect(el.hasAttribute('selected')).to.be.true;
    });

    it('renders offer type badge', async () => {
        const el = await fixture(
            html`<mas-ost-offer-card .offer=${mockOffer}></mas-ost-offer-card>`,
        );
        const badges = el.shadowRoot.querySelectorAll('sp-badge');
        const offerTypeBadge = Array.from(badges).find(
            (b) => b.textContent.trim() === 'BASE',
        );
        expect(offerTypeBadge).to.exist;
        expect(offerTypeBadge.getAttribute('variant')).to.equal('neutral');
    });

    it('handles fake offer click by returning offer_type as OSI', async () => {
        store.authoringFlow = 'single';
        store.selectedOffer = undefined;
        store.selectedOsi = undefined;

        const el = await fixture(
            html`<mas-ost-offer-card .offer=${fakeOffer}></mas-ost-offer-card>`,
        );

        const priceCell = el.shadowRoot.querySelector('.cell-price');
        priceCell.click();
        await el.updateComplete;

        await new Promise((r) => setTimeout(r, 50));
        expect(store.selectedOffer).to.equal(fakeOffer);
        expect(store.selectedOsi).to.equal('fake-trial');
    });

    it('shows trial days for TRIAL offers', async () => {
        const trialOffer = {
            ...mockOffer,
            offer_type: 'TRIAL',
            price_point: 'TRIAL_7_DAY_TRIAL',
        };
        const el = await fixture(
            html`<mas-ost-offer-card .offer=${trialOffer}></mas-ost-offer-card>`,
        );
        const trialDays = el.shadowRoot.querySelector('.trial-days');
        expect(trialDays).to.exist;
        expect(trialDays.textContent.trim()).to.equal('7d');
    });

    it('does not show trial days for non-TRIAL offers', async () => {
        const el = await fixture(
            html`<mas-ost-offer-card .offer=${mockOffer}></mas-ost-offer-card>`,
        );
        const trialDays = el.shadowRoot.querySelector('.trial-days');
        expect(trialDays).to.not.exist;
    });

    it('renders nothing when offer is undefined', async () => {
        const el = await fixture(
            html`<mas-ost-offer-card></mas-ost-offer-card>`,
        );
        const cell = el.shadowRoot.querySelector('.cell');
        expect(cell).to.not.exist;
    });
});
