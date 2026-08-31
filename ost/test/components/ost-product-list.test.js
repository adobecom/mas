import { expect, fixture, html } from '@open-wc/testing';
import { store } from '../../src/store/ost-store.js';
import '../../src/components/ost-product-list.js';
import '../../src/components/ost-filter-bar.js';

const MOCK_PRODUCTS = [
    {
        name: 'Photoshop',
        arrangement_code: 'phsp',
        icon: 'https://example.com/ps.png',
        customerSegments: { INDIVIDUAL: true, TEAM: true },
        marketSegments: { COM: true },
        draft: false,
    },
    {
        name: 'Illustrator',
        arrangement_code: 'ilst',
        icon: 'https://example.com/ai.png',
        customerSegments: { INDIVIDUAL: true },
        marketSegments: { COM: true },
        draft: false,
    },
    {
        name: 'Draft Product',
        arrangement_code: 'drft',
        customerSegments: { INDIVIDUAL: true },
        marketSegments: { COM: true },
        draft: true,
    },
];

describe('ost-product-list', () => {
    beforeEach(() => {
        store.allProducts = [...MOCK_PRODUCTS];
        store.aosParams = {
            arrangementCode: '',
            commitment: '',
            term: '',
            customerSegment: 'INDIVIDUAL',
            offerType: 'BASE',
            marketSegment: 'COM',
            pricePoint: '',
        };
        store.landscape = 'PUBLISHED';
        store.productsLoading = false;
    });

    it('clears the deep-link OSI when the user picks a product manually', async () => {
        store.initialOsi = 'stale-deep-osi';
        store.initialOsiAttributes = { offer_type: 'BASE' };
        const el = await fixture(html`<ost-product-list></ost-product-list>`);
        el.handleProductClick({ arrangement_code: 'phsp-arr', name: 'Photoshop' });
        expect(store.initialOsi).to.be.undefined;
        expect(store.initialOsiAttributes).to.be.undefined;
        expect(store.selectedProduct?.name).to.equal('Photoshop');
    });

    it('renders product cards from store', async () => {
        const el = await fixture(html`<ost-product-list></ost-product-list>`);
        const cards = el.shadowRoot.querySelectorAll('.product-card');
        expect(cards.length).to.equal(2);
    });

    it('shows draft products when landscape is DRAFT', async () => {
        store.landscape = 'DRAFT';
        const el = await fixture(html`<ost-product-list></ost-product-list>`);
        const cards = el.shadowRoot.querySelectorAll('.product-card');
        expect(cards.length).to.equal(3);
        const draftBadge = el.shadowRoot.querySelector('.draft-dot');
        expect(draftBadge).to.exist;
    });

    it('displays product name and code', async () => {
        const el = await fixture(html`<ost-product-list></ost-product-list>`);
        const names = el.shadowRoot.querySelectorAll('.product-name');
        expect(names[0].textContent).to.equal('Photoshop');
        const codes = el.shadowRoot.querySelectorAll('.product-code');
        expect(codes[0].textContent).to.equal('phsp');
    });

    it('highlights selected product', async () => {
        store.aosParams.arrangementCode = 'phsp';
        const el = await fixture(html`<ost-product-list></ost-product-list>`);
        const selected = el.shadowRoot.querySelector('.product-card[selected]');
        expect(selected).to.exist;
        const name = selected.querySelector('.product-name');
        expect(name.textContent).to.equal('Photoshop');
    });

    it('calls store.setProduct and setAosParams on click', async () => {
        const productCalls = [];
        const aosCalls = [];
        const origSetProduct = store.setProduct.bind(store);
        const origSetAosParams = store.setAosParams.bind(store);
        store.setProduct = (val) => {
            productCalls.push(val);
            origSetProduct(val);
        };
        store.setAosParams = (val) => {
            aosCalls.push(val);
            origSetAosParams(val);
        };
        const el = await fixture(html`<ost-product-list></ost-product-list>`);
        const card = el.shadowRoot.querySelector('.product-card');
        card.click();
        expect(productCalls.length).to.equal(1);
        expect(aosCalls.length).to.equal(1);
        expect(aosCalls[0]).to.deep.include({ arrangementCode: 'phsp' });
        store.setProduct = origSetProduct;
        store.setAosParams = origSetAosParams;
    });

    it('shows empty state when no products match', async () => {
        store.allProducts = [];
        const el = await fixture(html`<ost-product-list></ost-product-list>`);
        const empty = el.shadowRoot.querySelector('.empty-state');
        expect(empty).to.exist;
        expect(empty.textContent).to.include('No products found');
    });

    it('renders skeleton cards when loading', async () => {
        store.productsLoading = true;
        store.allProducts = [];
        const el = await fixture(html`<ost-product-list></ost-product-list>`);
        const skeletons = el.shadowRoot.querySelectorAll('.skeleton-card');
        expect(skeletons.length).to.equal(8);
        store.productsLoading = false;
    });

    it('replaces skeletons with real cards after loading', async () => {
        store.productsLoading = true;
        store.allProducts = [];
        const el = await fixture(html`<ost-product-list></ost-product-list>`);
        expect(el.shadowRoot.querySelectorAll('.skeleton-card').length).to.equal(8);

        store.productsLoading = false;
        store.allProducts = [...MOCK_PRODUCTS];
        store.notify();
        await el.updateComplete;

        expect(el.shadowRoot.querySelectorAll('.skeleton-card').length).to.equal(0);
        expect(el.shadowRoot.querySelectorAll('.product-card').length).to.be.greaterThan(0);
    });

    it('filters by search query', async () => {
        store.searchQuery = 'Photo';
        store.searchType = 'product';
        const el = await fixture(html`<ost-product-list></ost-product-list>`);
        const cards = el.shadowRoot.querySelectorAll('.product-card');
        expect(cards.length).to.equal(1);
        const name = cards[0].querySelector('.product-name');
        expect(name.textContent).to.equal('Photoshop');
        store.searchQuery = '';
        store.searchType = '';
    });

    it('applying a customer-segment filter narrows the displayed product list', async () => {
        store.aosParams = { ...store.aosParams, customerSegment: 'TEAM' };
        const el = await fixture(html`<ost-product-list></ost-product-list>`);

        const names = Array.from(el.shadowRoot.querySelectorAll('.product-name')).map((n) => n.textContent);

        expect(names).to.deep.equal(['Photoshop']);
        expect(names).to.not.include('Illustrator');
    });

    it('changing the customer-segment filter re-filters the displayed list reactively', async () => {
        const el = await fixture(html`<ost-product-list></ost-product-list>`);
        expect(el.shadowRoot.querySelectorAll('.product-card').length).to.equal(2);

        store.setAosParams({ customerSegment: 'TEAM' });
        await el.updateComplete;

        const cards = el.shadowRoot.querySelectorAll('.product-card');
        expect(cards.length).to.equal(1);
        expect(cards[0].querySelector('.product-name').textContent).to.equal('Photoshop');
    });

    it('market-segment filter excludes products that lack the segment and keeps those that have it', async () => {
        // Products with DIFFERENT market segments so the filter genuinely
        // discriminates: a COM-only product and an EDU-only product. A shared
        // segment would make the empty/non-empty result independent of the
        // filter (tautological).
        store.allProducts = [
            {
                name: 'Commercial Only',
                arrangement_code: 'comm',
                customerSegments: { INDIVIDUAL: true },
                marketSegments: { COM: true },
                draft: false,
            },
            {
                name: 'Education Only',
                arrangement_code: 'edu',
                customerSegments: { INDIVIDUAL: true },
                marketSegments: { EDU: true },
                draft: false,
            },
        ];

        store.aosParams = { ...store.aosParams, marketSegment: 'COM' };
        const comEl = await fixture(html`<ost-product-list></ost-product-list>`);
        const comNames = Array.from(comEl.shadowRoot.querySelectorAll('.product-name')).map((n) => n.textContent);
        expect(comNames).to.deep.equal(['Commercial Only']);

        store.aosParams = { ...store.aosParams, marketSegment: 'GOV' };
        const govEl = await fixture(html`<ost-product-list></ost-product-list>`);
        expect(govEl.shadowRoot.querySelectorAll('.product-card').length).to.equal(0);
        const empty = govEl.shadowRoot.querySelector('.empty-state');
        expect(empty).to.exist;
        expect(empty.textContent).to.include('No products found');
    });

    it('renders an active filter tag for each set customer/market/offer-type filter', async () => {
        store.aosParams = { ...store.aosParams, customerSegment: 'TEAM', marketSegment: 'EDU', offerType: 'TRIAL' };
        const el = await fixture(html`<ost-filter-bar></ost-filter-bar>`);

        const labels = Array.from(el.shadowRoot.querySelectorAll('.tag')).map((t) =>
            t.textContent.trim().replace(/\s*×$/, '').trim(),
        );

        expect(labels).to.include('Team');
        expect(labels).to.include('Education');
        expect(labels).to.include('Trial');
        const count = el.shadowRoot.querySelector('.filter-count');
        expect(count.textContent.trim()).to.equal('3');
    });

    it('shows no filter tags when no filters are active', async () => {
        store.aosParams = { ...store.aosParams, customerSegment: '', marketSegment: '', offerType: '' };
        const el = await fixture(html`<ost-filter-bar></ost-filter-bar>`);

        expect(el.shadowRoot.querySelectorAll('.tag').length).to.equal(0);
        expect(el.shadowRoot.querySelector('.filter-count')).to.not.exist;
    });

    it('clicking a filter tag clears that filter from store.aosParams', async () => {
        store.aosParams = { ...store.aosParams, customerSegment: 'TEAM', marketSegment: '', offerType: '' };
        const el = await fixture(html`<ost-filter-bar></ost-filter-bar>`);

        const tag = el.shadowRoot.querySelector('.tag');
        expect(tag.textContent).to.include('Team');
        tag.click();

        expect(store.aosParams.customerSegment).to.equal('');
    });

    it('clearing one filter tag leaves the other active filters intact', async () => {
        store.aosParams = { ...store.aosParams, customerSegment: 'TEAM', marketSegment: 'EDU', offerType: '' };
        const el = await fixture(html`<ost-filter-bar></ost-filter-bar>`);

        const marketTag = Array.from(el.shadowRoot.querySelectorAll('.tag')).find((t) => t.textContent.includes('Education'));
        marketTag.click();

        expect(store.aosParams.marketSegment).to.equal('');
        expect(store.aosParams.customerSegment).to.equal('TEAM');
    });

    it('clearing the customer-segment tag re-includes the specific previously filtered product', async () => {
        store.aosParams = { ...store.aosParams, customerSegment: 'TEAM' };
        const list = await fixture(html`<ost-product-list></ost-product-list>`);
        const bar = await fixture(html`<ost-filter-bar></ost-filter-bar>`);
        // Only Photoshop has the TEAM segment; Illustrator is INDIVIDUAL-only.
        const filteredNames = Array.from(list.shadowRoot.querySelectorAll('.product-name')).map((n) => n.textContent);
        expect(filteredNames).to.deep.equal(['Photoshop']);

        const tag = bar.shadowRoot.querySelector('.tag');
        tag.click();
        await list.updateComplete;

        const clearedNames = Array.from(list.shadowRoot.querySelectorAll('.product-name')).map((n) => n.textContent);
        expect(clearedNames).to.include('Illustrator');
        expect(clearedNames).to.deep.equal(['Photoshop', 'Illustrator']);
    });
});
