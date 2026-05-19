import { expect, fixture, html } from '@open-wc/testing';
import { store } from '../../src/store/ost-store.js';
import '../../src/components/mas-ost-product-list.js';

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

describe('mas-ost-product-list', () => {
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

    it('renders product cards from store', async () => {
        const el = await fixture(
            html`<mas-ost-product-list></mas-ost-product-list>`,
        );
        const cards = el.shadowRoot.querySelectorAll('.product-card');
        expect(cards.length).to.equal(2);
    });

    it('shows draft products when landscape is DRAFT', async () => {
        store.landscape = 'DRAFT';
        const el = await fixture(
            html`<mas-ost-product-list></mas-ost-product-list>`,
        );
        const cards = el.shadowRoot.querySelectorAll('.product-card');
        expect(cards.length).to.equal(3);
        const draftBadge = el.shadowRoot.querySelector('.draft-dot');
        expect(draftBadge).to.exist;
    });

    it('displays product name and code', async () => {
        const el = await fixture(
            html`<mas-ost-product-list></mas-ost-product-list>`,
        );
        const names = el.shadowRoot.querySelectorAll('.product-name');
        expect(names[0].textContent).to.equal('Photoshop');
        const codes = el.shadowRoot.querySelectorAll('.product-code');
        expect(codes[0].textContent).to.equal('phsp');
    });

    it('highlights selected product', async () => {
        store.aosParams.arrangementCode = 'phsp';
        const el = await fixture(
            html`<mas-ost-product-list></mas-ost-product-list>`,
        );
        const selected = el.shadowRoot.querySelector(
            '.product-card[selected]',
        );
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
        const el = await fixture(
            html`<mas-ost-product-list></mas-ost-product-list>`,
        );
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
        const el = await fixture(
            html`<mas-ost-product-list></mas-ost-product-list>`,
        );
        const empty = el.shadowRoot.querySelector('.empty-state');
        expect(empty).to.exist;
        expect(empty.textContent).to.include('No products found');
    });

    it('renders skeleton cards when loading', async () => {
        store.productsLoading = true;
        store.allProducts = [];
        const el = await fixture(
            html`<mas-ost-product-list></mas-ost-product-list>`,
        );
        const skeletons = el.shadowRoot.querySelectorAll('.skeleton-card');
        expect(skeletons.length).to.equal(8);
        store.productsLoading = false;
    });

    it('replaces skeletons with real cards after loading', async () => {
        store.productsLoading = true;
        store.allProducts = [];
        const el = await fixture(
            html`<mas-ost-product-list></mas-ost-product-list>`,
        );
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
        const el = await fixture(
            html`<mas-ost-product-list></mas-ost-product-list>`,
        );
        const cards = el.shadowRoot.querySelectorAll('.product-card');
        expect(cards.length).to.equal(1);
        const name = cards[0].querySelector('.product-name');
        expect(name.textContent).to.equal('Photoshop');
        store.searchQuery = '';
        store.searchType = '';
    });
});
