import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-offer-card.js';
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

describe('ost-offer-card', () => {
    it('renders price and plan type badge', async () => {
        const el = await fixture(html`<ost-offer-card .offer=${mockOffer}></ost-offer-card>`);

        const priceCell = el.shadowRoot.querySelector('.cell-price');
        expect(priceCell).to.exist;
        expect(priceCell.textContent).to.include('22.99');

        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge).to.exist;
        expect(badge.textContent.trim()).to.equal('ABM');
        expect(badge.getAttribute('variant')).to.equal('positive');
    });

    it('renders full offer ID', async () => {
        const el = await fixture(html`<ost-offer-card .offer=${mockOffer}></ost-offer-card>`);

        const idCell = el.shadowRoot.querySelector('.cell-id');
        expect(idCell).to.exist;
        expect(idCell.textContent.trim()).to.equal(mockOffer.offer_id);
    });

    it('applies selected attribute and style', async () => {
        const el = await fixture(html`<ost-offer-card .offer=${mockOffer} selected></ost-offer-card>`);
        expect(el.hasAttribute('selected')).to.be.true;
    });

    it('renders offer type badge', async () => {
        const el = await fixture(html`<ost-offer-card .offer=${mockOffer}></ost-offer-card>`);
        const badges = el.shadowRoot.querySelectorAll('sp-badge');
        const offerTypeBadge = Array.from(badges).find((b) => b.textContent.trim() === 'BASE');
        expect(offerTypeBadge).to.exist;
        expect(offerTypeBadge.getAttribute('variant')).to.equal('neutral');
    });

    it('handles fake offer click by returning offer_type as OSI', async () => {
        store.authoringFlow = 'single';
        store.selectedOffer = undefined;
        store.selectedOsi = undefined;

        const el = await fixture(html`<ost-offer-card .offer=${fakeOffer}></ost-offer-card>`);

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
        const el = await fixture(html`<ost-offer-card .offer=${trialOffer}></ost-offer-card>`);
        const trialDays = el.shadowRoot.querySelector('.trial-days');
        expect(trialDays).to.exist;
        expect(trialDays.textContent.trim()).to.equal('7d');
    });

    it('does not show trial days for non-TRIAL offers', async () => {
        const el = await fixture(html`<ost-offer-card .offer=${mockOffer}></ost-offer-card>`);
        const trialDays = el.shadowRoot.querySelector('.trial-days');
        expect(trialDays).to.not.exist;
    });

    it('renders nothing when offer is undefined', async () => {
        const el = await fixture(html`<ost-offer-card></ost-offer-card>`);
        const cell = el.shadowRoot.querySelector('.cell');
        expect(cell).to.not.exist;
    });

    describe('U4 select offer', () => {
        afterEach(() => {
            store.authoringFlow = 'single';
            store.selectedOffer = undefined;
            store.selectedOsi = undefined;
        });

        it('selects the clicked offer and advances to the placeholder config view', async () => {
            store.authoringFlow = 'single';
            store.selectedOffer = undefined;
            store.selectedOsi = undefined;
            const offerA = { ...mockOffer, offer_type: 'fake-base', offer_id: 'OFFER-A' };
            const el = await fixture(html`<ost-offer-card .offer=${offerA}></ost-offer-card>`);

            el.shadowRoot.querySelector('.cell-price').click();
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 50));

            expect(store.selectedOffer).to.equal(offerA);
            expect(store.selectedOsi).to.equal('fake-base');
            expect(store.viewState).to.equal('configure');
            expect(store.viewState).to.not.equal('offers');
        });

        it('replaces the selection when a second distinct offer is clicked', async () => {
            store.authoringFlow = 'single';
            store.selectedOffer = undefined;
            store.selectedOsi = undefined;
            const offerA = { ...mockOffer, offer_type: 'fake-base', offer_id: 'OFFER-A' };
            const offerB = { ...mockOffer, offer_type: 'fake-trial', offer_id: 'OFFER-B' };
            const elA = await fixture(html`<ost-offer-card .offer=${offerA}></ost-offer-card>`);
            const elB = await fixture(html`<ost-offer-card .offer=${offerB}></ost-offer-card>`);

            elA.shadowRoot.querySelector('.cell-price').click();
            await elA.updateComplete;
            await new Promise((r) => setTimeout(r, 50));
            elB.shadowRoot.querySelector('.cell-price').click();
            await elB.updateComplete;
            await new Promise((r) => setTimeout(r, 50));

            expect(store.selectedOffer).to.equal(offerB);
            expect(store.selectedOsi).to.equal('fake-trial');
            expect(store.selectedOffer).to.not.equal(offerA);
        });
    });

    describe('price formatting', () => {
        it('renders formatted price with currency symbol from pricing data', async () => {
            const symbolOffer = {
                ...mockOffer,
                pricing: {
                    currency: { symbol: '€', format_string: '#,##0.00' },
                    prices: [{ price_details: { display_rules: { price: 9.5 } } }],
                },
            };
            const el = await fixture(html`<ost-offer-card .offer=${symbolOffer}></ost-offer-card>`);
            const priceCell = el.shadowRoot.querySelector('.cell-price');
            expect(priceCell.textContent.trim()).to.equal('€9.50/yr');
        });

        it('renders price via format_string when no currency symbol is present', async () => {
            const formatStringOffer = {
                ...mockOffer,
                commitment: 'MONTH',
                term: 'MONTHLY',
                pricing: {
                    currency: { format_string: "'US$'#,##0.00" },
                    prices: [{ price_details: { display_rules: { price: 14.25 } } }],
                },
            };
            const el = await fixture(html`<ost-offer-card .offer=${formatStringOffer}></ost-offer-card>`);
            const priceCell = el.shadowRoot.querySelector('.cell-price');
            expect(priceCell.textContent.trim()).to.equal("'US$'14.25/mo");
        });

        it('renders $0.00 for offers with FREE price point', async () => {
            const freeOffer = {
                ...mockOffer,
                price_point: 'FREE',
                pricing: { currency: { symbol: '$' }, prices: [] },
            };
            const el = await fixture(html`<ost-offer-card .offer=${freeOffer}></ost-offer-card>`);
            const priceCell = el.shadowRoot.querySelector('.cell-price');
            expect(priceCell.textContent).to.include('$0.00');
        });

        it('renders $0.00 when the price value resolves to zero', async () => {
            const zeroOffer = {
                ...mockOffer,
                price_point: 'REGULAR',
                pricing: {
                    currency: { symbol: '£' },
                    prices: [{ price_details: { display_rules: { price: 0 } } }],
                },
            };
            const el = await fixture(html`<ost-offer-card .offer=${zeroOffer}></ost-offer-card>`);
            const priceCell = el.shadowRoot.querySelector('.cell-price');
            expect(priceCell.textContent.trim()).to.equal('£0.00/yr');
        });

        it('renders empty price when pricing data is absent', async () => {
            const noPricingOffer = { ...mockOffer, pricing: undefined };
            const el = await fixture(html`<ost-offer-card .offer=${noPricingOffer}></ost-offer-card>`);
            const priceCell = el.shadowRoot.querySelector('.cell-price');
            expect(priceCell.textContent.trim()).to.equal('/yr');
        });
    });

    describe('badge variants', () => {
        it('falls back to the neutral badge variant for an unknown plan type', async () => {
            const unknownPlanOffer = { ...mockOffer, planType: 'WHATEVER' };
            const el = await fixture(html`<ost-offer-card .offer=${unknownPlanOffer}></ost-offer-card>`);
            const badge = el.shadowRoot.querySelector('sp-badge');
            expect(badge.textContent.trim()).to.equal('WHATEVER');
            expect(badge.getAttribute('variant')).to.equal('neutral');
        });

        it('renders a yellow landscape badge for DRAFT source', async () => {
            const draftOffer = { ...mockOffer, landscapeSource: 'DRAFT' };
            const el = await fixture(html`<ost-offer-card .offer=${draftOffer}></ost-offer-card>`);
            const badges = el.shadowRoot.querySelectorAll('sp-badge');
            const landscapeBadge = Array.from(badges).find((b) => b.textContent.trim() === 'DRAFT');
            expect(landscapeBadge).to.exist;
            expect(landscapeBadge.getAttribute('variant')).to.equal('yellow');
        });

        it('renders an informative landscape badge for a non-DRAFT source', async () => {
            const publishedOffer = { ...mockOffer, landscapeSource: 'PUBLISHED' };
            const el = await fixture(html`<ost-offer-card .offer=${publishedOffer}></ost-offer-card>`);
            const badges = el.shadowRoot.querySelectorAll('sp-badge');
            const landscapeBadge = Array.from(badges).find((b) => b.textContent.trim() === 'PUBLISHED');
            expect(landscapeBadge).to.exist;
            expect(landscapeBadge.getAttribute('variant')).to.equal('informative');
        });
    });

    describe('copy offer ID', () => {
        it('writes the offer ID to the clipboard and renders a Copied label', async () => {
            const el = await fixture(html`<ost-offer-card .offer=${mockOffer}></ost-offer-card>`);
            let written;
            const originalWriteText = navigator.clipboard.writeText;
            navigator.clipboard.writeText = (text) => {
                written = text;
                return Promise.resolve();
            };

            try {
                await el.copyOfferId(new MouseEvent('click'), mockOffer.offer_id);
                await el.updateComplete;

                expect(written).to.equal(mockOffer.offer_id);
                const copiedLabel = el.shadowRoot.querySelector('.copied-label');
                expect(copiedLabel).to.exist;
                expect(copiedLabel.textContent.trim()).to.equal('Copied');
            } finally {
                navigator.clipboard.writeText = originalWriteText;
            }
        });
    });

    describe('consult flow', () => {
        afterEach(() => {
            store.authoringFlow = 'single';
            store.selectedOffer = undefined;
            store.selectedOsi = undefined;
        });

        it('stashes the clicked offer without resolving an OSI', async () => {
            store.authoringFlow = 'consult';
            store.selectedOffer = undefined;
            store.selectedOsi = undefined;
            const consultOffer = { ...mockOffer, offer_id: 'CONSULT-1' };
            const el = await fixture(html`<ost-offer-card .offer=${consultOffer}></ost-offer-card>`);

            el.shadowRoot.querySelector('.cell-price').click();
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 50));

            expect(store.selectedOffer).to.equal(consultOffer);
            expect(store.selectedOsi).to.equal(undefined);
        });
    });

    describe('card layout', () => {
        it('renders every offer field in the bordered card layout', async () => {
            const el = await fixture(html`<ost-offer-card card .offer=${mockOffer}></ost-offer-card>`);

            expect(el.shadowRoot.querySelector('.offer-card-name').textContent.trim()).to.equal('Photoshop');
            const values = el.shadowRoot.querySelectorAll('.value-8');
            expect(values[0].textContent.trim()).to.equal(mockOffer.offer_id);
            expect(values[1].textContent.trim()).to.equal('REGULAR');
            const value2 = el.shadowRoot.querySelectorAll('.value-2');
            expect(value2[0].textContent.trim()).to.equal('ABM');
            expect(value2[1].textContent.trim()).to.equal('BASE');
            expect(value2[2].textContent.trim()).to.equal('MULT');
            expect(el.shadowRoot.querySelector('.offer-card-price').textContent.trim()).to.equal('$22.99/yr');
        });

        it('renders the offer icon image in the card layout when present', async () => {
            const el = await fixture(html`<ost-offer-card card .offer=${mockOffer}></ost-offer-card>`);
            const icon = el.shadowRoot.querySelector('img.offer-card-icon');
            expect(icon).to.exist;
            expect(icon.getAttribute('src')).to.equal(mockOffer.icon);
        });

        it('renders a placeholder span instead of an icon when the offer has no icon', async () => {
            const noIconOffer = { ...mockOffer, icon: undefined };
            const el = await fixture(html`<ost-offer-card card .offer=${noIconOffer}></ost-offer-card>`);
            expect(el.shadowRoot.querySelector('img.offer-card-icon')).to.not.exist;
            expect(el.shadowRoot.querySelector('.cell')).to.not.exist;
        });

        it('selects the offer when the bordered card is clicked', async () => {
            store.authoringFlow = 'single';
            store.selectedOffer = undefined;
            store.selectedOsi = undefined;
            const cardOffer = { ...mockOffer, offer_type: 'fake-card', offer_id: 'CARD-1' };
            const el = await fixture(html`<ost-offer-card card .offer=${cardOffer}></ost-offer-card>`);

            el.shadowRoot.querySelector('.offer-card').click();
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 50));

            expect(store.selectedOffer).to.equal(cardOffer);
            expect(store.selectedOsi).to.equal('fake-card');

            store.authoringFlow = 'single';
            store.selectedOffer = undefined;
            store.selectedOsi = undefined;
        });
    });

    describe('scroll into view on selection', () => {
        it('scrolls itself into view when rendered already selected', async () => {
            const el = document.createElement('ost-offer-card');
            el.offer = mockOffer;
            el.selected = true;
            let scrolled = false;
            el.scrollIntoView = () => {
                scrolled = true;
            };
            document.body.appendChild(el);
            await el.updateComplete;
            expect(scrolled).to.be.true;
            el.remove();
        });

        it('scrolls into view when it becomes selected after render', async () => {
            const el = await fixture(html`<ost-offer-card .offer=${mockOffer}></ost-offer-card>`);
            let scrolled = false;
            el.scrollIntoView = () => {
                scrolled = true;
            };
            el.selected = true;
            await el.updateComplete;
            expect(scrolled).to.be.true;
        });

        it('does not scroll when not selected', async () => {
            const el = await fixture(html`<ost-offer-card .offer=${mockOffer}></ost-offer-card>`);
            let scrolled = false;
            el.scrollIntoView = () => {
                scrolled = true;
            };
            el.requestUpdate();
            await el.updateComplete;
            expect(scrolled).to.be.false;
        });
    });
});
