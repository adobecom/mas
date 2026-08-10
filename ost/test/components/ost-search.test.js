import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-search.js';
import { store } from '../../src/store/ost-store.js';

describe('ost-search', () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = window.fetch;
        store.allProducts = [];
        store.searchQuery = '';
        store.searchType = '';
        store.selectedProduct = undefined;
        store.selectedOsi = undefined;
        store.aosParams = {};
    });

    afterEach(() => {
        window.fetch = originalFetch;
        store.allProducts = [];
        store.searchQuery = '';
        store.searchType = '';
        store.selectedProduct = undefined;
        store.selectedOsi = undefined;
        store.aosParams = {};
    });

    it('renders sp-search element', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const search = el.shadowRoot.querySelector('sp-search');
        expect(search).to.exist;
        expect(search.getAttribute('placeholder')).to.include('Search');
    });

    it('does not show badge when query is empty', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge).to.not.exist;
    });

    it('shows Product badge for text input', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'photoshop';
        search.dispatchEvent(new Event('input'));
        await new Promise((r) => setTimeout(r, 300));
        await el.updateComplete;
        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge).to.exist;
        expect(badge.textContent.trim()).to.equal('Product');
    });

    it('shows Offer ID badge for 32-char hex input', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const search = el.shadowRoot.querySelector('sp-search');
        search.value = '257E1D82082387D152029F93C1030624';
        search.dispatchEvent(new Event('input'));
        await new Promise((r) => setTimeout(r, 300));
        await el.updateComplete;
        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge).to.exist;
        expect(badge.textContent.trim()).to.equal('Offer ID');
    });

    it('shows OSI badge for 43-char base64 input', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v';
        search.dispatchEvent(new Event('input'));
        await new Promise((r) => setTimeout(r, 300));
        await el.updateComplete;
        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge).to.exist;
        expect(badge.textContent.trim()).to.equal('OSI');
    });

    it('initializes with empty state', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        expect(el.query).to.equal('');
        expect(el.resultType).to.equal('');
    });

    it('exposes back-compat `search` getter pointing at self', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        expect(el.search).to.equal(el);
    });

    it('detectType returns product for plain text', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        expect(el.detectType('Photoshop')).to.equal('product');
    });

    it('detectType returns offer for 32-char hex offer ID', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        expect(el.detectType('257E1D82082387D152029F93C1030624')).to.equal('offer');
    });

    it('detectType returns osi for a 43-char base64 OSI', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const osi = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0ABC';
        expect(el.detectType(osi)).to.equal('osi');
    });

    it('detectType returns product for empty string', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        expect(el.detectType('')).to.equal('product');
    });

    it('writes query and type to the store on debounced input', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'illustrator';
        search.dispatchEvent(new Event('input'));
        await new Promise((r) => setTimeout(r, 300));
        expect(store.searchQuery).to.equal('illustrator');
        expect(store.searchType).to.equal('product');
    });

    it('selectProductByCode selects matching product from tuple entries', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const product = { arrangement_code: 'phsp-arr', name: 'Photoshop' };
        store.allProducts = [['phsp', product]];
        el.selectProductByCode('phsp-arr');
        expect(store.selectedProduct).to.equal(product);
        expect(store.aosParams.arrangementCode).to.equal('phsp-arr');
    });

    it('selectProductByCode matches on plain object entries via code field', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const product = { code: 'ai-code', name: 'Illustrator' };
        store.allProducts = [product];
        el.selectProductByCode('ai-code');
        expect(store.selectedProduct).to.equal(product);
    });

    it('selectProductByCode leaves selection untouched when no product matches', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        store.allProducts = [['phsp', { arrangement_code: 'phsp-arr' }]];
        el.selectProductByCode('does-not-exist');
        expect(store.selectedProduct).to.equal(undefined);
    });

    it('resolveOsi selects product and stores OSI when arrangement code resolves', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const product = { arrangement_code: 'osi-arr', name: 'XD' };
        store.allProducts = [['xd', product]];
        window.fetch = async () => ({
            ok: true,
            json: async () => ({ product_arrangement_code: 'osi-arr' }),
        });
        await el.resolveOsi('some-osi-id');
        expect(store.selectedProduct).to.equal(product);
        expect(store.selectedOsi).to.equal('some-osi-id');
    });

    it('resolveOsi sets initialOsi so the searched offer auto-selects on the offer step', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const product = { arrangement_code: 'osi-arr', name: 'XD' };
        store.allProducts = [['xd', product]];
        store.initialOsi = undefined;
        window.fetch = async () => ({
            ok: true,
            json: async () => ({ product_arrangement_code: 'osi-arr' }),
        });
        await el.resolveOsi('searched-osi');
        expect(store.initialOsi).to.equal('searched-osi');
    });

    it('resolveOsi resets segment filters to All and stashes the offer attributes for auto-select', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const product = { arrangement_code: 'osi-arr', name: 'XD' };
        store.allProducts = [['xd', product]];
        store.setAosParams({ customerSegment: 'TEAM', marketSegment: 'EDU', offerType: 'TRIAL' });
        window.fetch = async () => ({
            ok: true,
            json: async () => ({
                product_arrangement_code: 'osi-arr',
                customer_segment: 'INDIVIDUAL',
                market_segments: ['COM'],
                offer_type: 'BASE',
                commitment: 'YEAR',
                term: 'MONTHLY',
            }),
        });
        await el.resolveOsi('some-osi-id');
        expect(store.aosParams.customerSegment).to.equal('');
        expect(store.aosParams.marketSegment).to.equal('');
        expect(store.aosParams.offerType).to.equal('');
        expect(store.aosParams.commitment).to.equal('');
        expect(store.aosParams.term).to.equal('');
        expect(store.initialOsiAttributes).to.deep.equal({
            customer_segment: 'INDIVIDUAL',
            market_segment: 'COM',
            offer_type: 'BASE',
            commitment: 'YEAR',
            term: 'MONTHLY',
        });
        expect(store.selectedOsi).to.equal('some-osi-id');
    });

    it('resolveOsi swallows fetch errors without throwing', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        window.fetch = async () => {
            throw new Error('aos down');
        };
        await el.resolveOsi('bad-osi');
        expect(store.selectedOsi).to.equal(undefined);
    });

    it('resolveOfferId resets segment filters to All and stashes the offer attributes for auto-select', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const product = { arrangement_code: 'offer-arr', name: 'Acrobat' };
        store.allProducts = [['acro', product]];
        store.setAosParams({ customerSegment: 'TEAM', marketSegment: 'EDU', offerType: 'TRIAL' });
        window.fetch = async () => ({
            ok: true,
            json: async () => [
                {
                    product_arrangement_code: 'offer-arr',
                    customer_segment: 'INDIVIDUAL',
                    market_segments: ['COM'],
                    offer_type: 'BASE',
                    commitment: 'YEAR',
                    term: 'MONTHLY',
                },
            ],
        });
        await el.resolveOfferId('257E1D82082387D152029F93C1030624');
        expect(store.searchQuery).to.equal('offer-arr');
        expect(store.searchType).to.equal('product');
        expect(store.aosParams.customerSegment).to.equal('');
        expect(store.aosParams.marketSegment).to.equal('');
        expect(store.aosParams.offerType).to.equal('');
        expect(store.aosParams.commitment).to.equal('');
        expect(store.aosParams.term).to.equal('');
        expect(store.initialOsiAttributes).to.deep.equal({
            customer_segment: 'INDIVIDUAL',
            market_segment: 'COM',
            offer_type: 'BASE',
            commitment: 'YEAR',
            term: 'MONTHLY',
        });
        expect(store.selectedProduct).to.equal(product);
    });

    it('resolveOfferId swallows fetch errors without throwing', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        window.fetch = async () => {
            throw new Error('aos down');
        };
        await el.resolveOfferId('257E1D82082387D152029F93C1030624');
        expect(store.selectedProduct).to.equal(undefined);
    });

    it('handleSubmit prevents the default form submission', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        let prevented = false;
        el.handleSubmit({
            preventDefault: () => {
                prevented = true;
            },
        });
        expect(prevented).to.equal(true);
    });

    it('disconnectedCallback clears the pending debounce timer', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'premiere';
        search.dispatchEvent(new Event('input'));
        el.remove();
        await new Promise((r) => setTimeout(r, 300));
        expect(store.searchQuery).to.equal('');
    });

    it('hasPendingSearch reflects a debounced-but-unresolved query', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        expect(el.hasPendingSearch()).to.equal(false);
        el.handleSearchInput('photoshop');
        expect(el.hasPendingSearch()).to.equal(true);
    });

    it('flushPendingSearch resolves the pending query immediately', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        el.handleSearchInput('photoshop');
        el.flushPendingSearch();
        expect(el.hasPendingSearch()).to.equal(false);
        expect(store.searchQuery).to.equal('photoshop');
        expect(store.searchType).to.equal('product');
    });

    it('flushPendingSearch is a no-op without a pending query', async () => {
        const el = await fixture(html`<ost-search></ost-search>`);
        el.flushPendingSearch();
        expect(store.searchQuery).to.equal('');
    });
});
