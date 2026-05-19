import { expect, fixture, html } from '@open-wc/testing';
import { store } from '../../src/store/ost-store.js';
import '../../src/components/mas-ost-product-detail.js';

function makeProduct(overrides = {}) {
    return {
        name: 'Photoshop',
        arrangement_code: 'photoshop-arr',
        icon: 'https://cdn/icon.png',
        product_code: 'PSHOP',
        product_family: 'CREATIVE_CLOUD',
        ...overrides,
    };
}

function makeOffer(overrides = {}) {
    return {
        offer_id: 'OF-1',
        offer_type: 'BASE',
        price_point: 'REGULAR',
        market_segments: ['COM'],
        pricing: {
            currency: { symbol: '$', format_string: '$#,##0.00' },
            prices: [{ price_details: { display_rules: { price: 19.99 } } }],
        },
        planType: 'ABM',
        name: 'Photoshop',
        icon: 'https://cdn/icon.png',
        ...overrides,
    };
}

function resetStore() {
    store.selectedProduct = undefined;
    store.selectedOffer = undefined;
    store.selectedOsi = undefined;
    store.offers = [];
    store.landscape = 'PUBLISHED';
    store.aosParams = { arrangementCode: '' };
    store.accessToken = '';
    store.apiKey = '';
    store.env = 'PRODUCTION';
    store.notify();
}

describe('mas-ost-product-detail', () => {
    beforeEach(() => {
        resetStore();
    });

    afterEach(() => {
        resetStore();
    });

    describe('full panel mode', () => {
        it('shows the empty state when no product is selected', async () => {
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            const empty = el.shadowRoot.querySelector('.empty-state');
            expect(empty).to.exist;
            expect(empty.textContent.trim()).to.equal('Select a product to view offers.');
        });

        it('renders the product header (icon, name, arrangement code, landscape badge)', async () => {
            store.selectedProduct = makeProduct();
            store.landscape = 'DRAFT';
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            const icon = el.shadowRoot.querySelector('.header .header-icon');
            const name = el.shadowRoot.querySelector('.product-name');
            const code = el.shadowRoot.querySelector('.header .arrangement-code');
            const badge = el.shadowRoot.querySelector('.header sp-badge');
            expect(icon.getAttribute('src')).to.equal('https://cdn/icon.png');
            expect(name.textContent.trim()).to.equal('Photoshop');
            expect(code.textContent).to.contain('Code:');
            expect(code.textContent).to.contain('photoshop-arr');
            expect(badge.textContent.trim()).to.equal('DRAFT');
        });

        it('omits the header icon when product has no icon', async () => {
            store.selectedProduct = makeProduct({ icon: undefined });
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.header .header-icon')).to.not.exist;
        });

        it('falls back to product.arrangementCode when arrangement_code is missing', async () => {
            store.selectedProduct = makeProduct({ arrangement_code: undefined, arrangementCode: 'fallback-arr' });
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.arrangement-code').textContent).to.contain('fallback-arr');
        });

        it('falls back to store.aosParams.arrangementCode as the last resort', async () => {
            store.selectedProduct = makeProduct({ arrangement_code: undefined });
            store.aosParams = { arrangementCode: 'aos-fallback' };
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.arrangement-code').textContent).to.contain('aos-fallback');
        });

        it('renders the product details grid with code and family', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            const detailValues = [...el.shadowRoot.querySelectorAll('.offer-details .detail-value')].map((v) =>
                v.textContent.trim(),
            );
            expect(detailValues).to.include('PSHOP');
            expect(detailValues).to.include('CREATIVE_CLOUD');
        });

        it('omits optional product detail rows when fields are missing', async () => {
            store.selectedProduct = makeProduct({ product_code: undefined, product_family: undefined });
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            const labels = [...el.shadowRoot.querySelectorAll('.offer-details .detail-label')].map((l) => l.textContent.trim());
            expect(labels).to.not.include('Product Code');
            expect(labels).to.not.include('Product Family');
        });

        it('shows the loading spinner while offers are being fetched', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            el.loading = true;
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.loading-container sp-progress-circle')).to.exist;
        });

        it('shows the "No offers found" message when offers list is empty', async () => {
            store.selectedProduct = makeProduct();
            store.offers = [];
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            el.loading = false;
            await el.updateComplete;
            const empty = el.shadowRoot.querySelector('.empty-state');
            expect(empty).to.exist;
            expect(empty.textContent).to.contain('No offers found');
        });

        it('renders one mas-ost-offer-card per offer plus the table header and count', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            // connectedCallback fires fetchOffers asynchronously; force the post-fetch state
            // directly so we can assert the render template without stubbing aos-client.
            store.offers = [makeOffer({ offer_id: 'A' }), makeOffer({ offer_id: 'B' }), makeOffer({ offer_id: 'C' })];
            el.loading = false;
            await el.updateComplete;
            const cards = el.shadowRoot.querySelectorAll('mas-ost-offer-card');
            const sectionLabel = el.shadowRoot.querySelector('.section-label');
            expect(cards.length).to.equal(3);
            expect(sectionLabel.textContent.trim()).to.equal('Offers (3)');
        });

        it('shows the hint text when offers are loaded but none are selected', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            store.offers = [makeOffer()];
            store.selectedOffer = undefined;
            el.loading = false;
            await el.updateComplete;
            const hint = el.shadowRoot.querySelector('.hint-text');
            expect(hint).to.exist;
            expect(hint.textContent.trim()).to.equal('Select an offer to configure your placeholder');
        });

        it('hides the hint text once an offer is selected', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            store.offers = [makeOffer()];
            store.selectedOffer = store.offers[0];
            el.loading = false;
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.hint-text')).to.not.exist;
        });
    });

    describe('summary mode', () => {
        it('renders only the header row when summary attribute is set', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<mas-ost-product-detail summary></mas-ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.header')).to.exist;
            // summary mode should NOT render the full details grid or offers table
            expect(el.shadowRoot.querySelector('.offer-details')).to.not.exist;
            expect(el.shadowRoot.querySelector('.offers-table')).to.not.exist;
        });

        it('shows the selected offer price next to the product header in summary mode', async () => {
            store.selectedProduct = makeProduct();
            store.selectedOffer = makeOffer();
            const el = await fixture(html`<mas-ost-product-detail summary></mas-ost-product-detail>`);
            const price = el.shadowRoot.querySelector('.summary-price');
            expect(price).to.exist;
            expect(price.textContent.trim()).to.equal('$19.99');
        });

        it('omits the price when no offer is selected in summary mode', async () => {
            store.selectedProduct = makeProduct();
            store.selectedOffer = undefined;
            const el = await fixture(html`<mas-ost-product-detail summary></mas-ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.summary-price')).to.not.exist;
        });

        it('shows the landscape badge in summary mode for PUBLISHED', async () => {
            store.selectedProduct = makeProduct();
            store.landscape = 'PUBLISHED';
            const el = await fixture(html`<mas-ost-product-detail summary></mas-ost-product-detail>`);
            const badge = el.shadowRoot.querySelector('.header sp-badge');
            expect(badge).to.exist;
            expect(badge.textContent.trim()).to.equal('PUBLISHED');
        });

        it('hides the landscape badge in summary mode when landscape is BOTH (AI chat consult)', async () => {
            store.selectedProduct = makeProduct();
            store.landscape = 'BOTH';
            const el = await fixture(html`<mas-ost-product-detail summary></mas-ost-product-detail>`);
            const badge = el.shadowRoot.querySelector('.header sp-badge');
            expect(badge).to.not.exist;
        });

        it('renders the Change link in summary mode', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<mas-ost-product-detail summary></mas-ost-product-detail>`);
            const change = el.shadowRoot.querySelector('.change-link');
            expect(change).to.exist;
            expect(change.textContent.trim()).to.equal('Change');
        });

        it('falls back to product.arrangementCode in summary mode header', async () => {
            store.selectedProduct = makeProduct({ arrangement_code: undefined, arrangementCode: 'sum-fallback' });
            const el = await fixture(html`<mas-ost-product-detail summary></mas-ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.arrangement-code').textContent.trim()).to.equal('sum-fallback');
        });
    });

    describe('store reactivity', () => {
        it('re-renders when store notifies of a product change', async () => {
            store.selectedProduct = undefined;
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.empty-state')).to.exist;
            store.selectedProduct = makeProduct();
            store.notify();
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.empty-state')).to.not.exist;
            expect(el.shadowRoot.querySelector('.product-name').textContent.trim()).to.equal('Photoshop');
        });

        it('re-renders the offer list when store.offers changes', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<mas-ost-product-detail></mas-ost-product-detail>`);
            store.offers = [makeOffer({ offer_id: 'NEW-1' }), makeOffer({ offer_id: 'NEW-2' })];
            el.loading = false;
            store.notify();
            await el.updateComplete;
            expect(el.shadowRoot.querySelectorAll('mas-ost-offer-card').length).to.equal(2);
        });
    });
});
