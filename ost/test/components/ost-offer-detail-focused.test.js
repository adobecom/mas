import { expect, fixture, html } from '@open-wc/testing';
import { store } from '../../src/store/ost-store.js';
import '../../src/components/ost-offer-detail-focused.js';

function makeOffer(overrides = {}) {
    return {
        offer_id: 'offer-1',
        planType: 'ABM',
        commitment: 'YEAR',
        term: 'ANNUAL',
        offer_type: 'BASE',
        customer_segment: 'INDIVIDUAL',
        market_segments: ['COM'],
        price_point: 'REGULAR',
        language: 'en-US',
        pricing: {
            currency: { symbol: '$', format_string: '$#,##0.00' },
            prices: [{ price_details: { display_rules: { price: 19.99 } } }],
        },
        ...overrides,
    };
}

function resetStore() {
    store.selectedOffer = undefined;
    store.selectedProduct = undefined;
    store.landscape = 'PUBLISHED';
    store.accessToken = '';
    store.apiKey = '';
    store.env = 'PRODUCTION';
    store.notify();
}

describe('ost-offer-detail-focused', () => {
    beforeEach(() => {
        resetStore();
    });

    afterEach(() => {
        resetStore();
    });

    it('renders empty when no offer is selected', async () => {
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        expect(el.shadowRoot.querySelector('.scroll')).to.not.exist;
    });

    it('renders the header with product name and landscape badge when offer is selected', async () => {
        store.selectedOffer = makeOffer();
        store.selectedProduct = { name: 'Photoshop', arrangement_code: 'photoshop-arr' };
        store.landscape = 'DRAFT';
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        const name = el.shadowRoot.querySelector('.product-name');
        const arrCode = el.shadowRoot.querySelector('.arrangement-code');
        const badge = el.shadowRoot.querySelector('.header sp-badge');
        expect(name.textContent.trim()).to.equal('Photoshop');
        expect(arrCode.textContent.trim()).to.equal('photoshop-arr');
        expect(badge.textContent.trim()).to.equal('DRAFT');
    });

    it('falls back to offer name when product name is missing', async () => {
        store.selectedOffer = makeOffer({ name: 'Standalone Offer' });
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        expect(el.shadowRoot.querySelector('.product-name').textContent.trim()).to.equal('Standalone Offer');
    });

    it('formats a paid annual price as $19.99 /yr', async () => {
        store.selectedOffer = makeOffer();
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        const price = el.shadowRoot.querySelector('.price-block .price');
        const period = el.shadowRoot.querySelector('.price-block .period');
        expect(price.textContent.trim()).to.equal('$19.99');
        expect(period.textContent.trim()).to.equal('/yr');
    });

    it('formats a monthly commitment as /mo', async () => {
        store.selectedOffer = makeOffer({ commitment: 'MONTH', term: 'MONTHLY' });
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        expect(el.shadowRoot.querySelector('.period').textContent.trim()).to.equal('/mo');
    });

    it('renders $0.00 for a FREE price_point offer', async () => {
        store.selectedOffer = makeOffer({
            price_point: 'FREE',
            pricing: { currency: { symbol: '$' }, prices: [{ price_details: { display_rules: { price: 0 } } }] },
        });
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        expect(el.shadowRoot.querySelector('.price').textContent.trim()).to.equal('$0.00');
    });

    it('falls back to $ when offer has no currency symbol', async () => {
        store.selectedOffer = makeOffer({
            price_point: 'FREE',
            pricing: undefined,
        });
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        expect(el.shadowRoot.querySelector('.price').textContent.trim()).to.equal('$0.00');
    });

    it('renders the plan badge with the correct variant mapping', async () => {
        store.selectedOffer = makeOffer({ planType: 'PUF' });
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        const detailBadges = el.shadowRoot.querySelectorAll('.detail-value sp-badge');
        const planBadge = [...detailBadges].find((b) => b.textContent.trim() === 'PUF');
        expect(planBadge).to.exist;
        expect(planBadge.getAttribute('variant')).to.equal('informative');
    });

    it('renders neutral badge for unknown plan types', async () => {
        store.selectedOffer = makeOffer({ planType: 'UNKNOWN_XYZ' });
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        const detailBadges = el.shadowRoot.querySelectorAll('.detail-value sp-badge');
        const planBadge = [...detailBadges].find((b) => b.textContent.trim() === 'UNKNOWN_XYZ');
        expect(planBadge.getAttribute('variant')).to.equal('neutral');
    });

    it('renders the offer ID', async () => {
        store.selectedOffer = makeOffer({ offer_id: 'OF-42' });
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        const cells = [...el.shadowRoot.querySelectorAll('.detail-value')].map((c) => c.textContent.trim());
        expect(cells).to.include('OF-42');
    });

    it('renders each market segment as a badge', async () => {
        store.selectedOffer = makeOffer({ market_segments: ['COM', 'EDU', 'GOV'] });
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        const segBadges = [...el.shadowRoot.querySelectorAll('.badges sp-badge')].map((b) => b.textContent.trim());
        expect(segBadges).to.have.members(['COM', 'EDU', 'GOV']);
    });

    it('does not render market segments section when none are present', async () => {
        store.selectedOffer = makeOffer({ market_segments: [] });
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        expect(el.shadowRoot.querySelector('.badges')).to.not.exist;
    });

    it('renders the product section only when a product is selected', async () => {
        store.selectedOffer = makeOffer();
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        const labels = [...el.shadowRoot.querySelectorAll('.section-label')].map((l) => l.textContent.trim());
        expect(labels).to.not.include('Product');

        store.selectedProduct = { product_code: 'PC-1', product_family: 'PF', arrangement_code: 'AC' };
        store.notify();
        await el.updateComplete;
        const labelsAfter = [...el.shadowRoot.querySelectorAll('.section-label')].map((l) => l.textContent.trim());
        expect(labelsAfter).to.include('Product');
    });

    it('shows an OSI empty placeholder when no OSI has been resolved', async () => {
        store.selectedOffer = makeOffer();
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        // ost-offer-detail-focused.ensureOsi may race; force the visible state for assertion.
        el.osi = '';
        el.osiError = '';
        el.osiLoading = false;
        await el.updateComplete;
        const empty = el.shadowRoot.querySelector('.osi-empty');
        expect(empty).to.exist;
        expect(empty.textContent.trim()).to.equal('—');
    });

    it('renders the OSI value and a Copy button when OSI is resolved', async () => {
        store.selectedOffer = makeOffer();
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        el.osi = 'OSI-42';
        el.osiLoading = false;
        el.osiError = '';
        el.osiCopied = false;
        await el.updateComplete;
        const osiValue = el.shadowRoot.querySelector('.osi-value');
        const copyBtn = el.shadowRoot.querySelector('sp-action-button[label="Copy OSI"]');
        expect(osiValue.textContent.trim()).to.equal('OSI-42');
        expect(copyBtn).to.exist;
    });

    it('renders an OSI error message when resolution fails', async () => {
        store.selectedOffer = makeOffer();
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        el.osi = '';
        el.osiError = 'Could not resolve OSI';
        el.osiLoading = false;
        await el.updateComplete;
        const err = el.shadowRoot.querySelector('.osi-error');
        expect(err.textContent.trim()).to.equal('Could not resolve OSI');
    });

    it('shows "Copied" instead of the Copy button after copying', async () => {
        store.selectedOffer = makeOffer();
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        el.osi = 'OSI-COPY';
        el.osiCopied = true;
        el.osiLoading = false;
        await el.updateComplete;
        const copied = el.shadowRoot.querySelector('.copied-label');
        expect(copied).to.exist;
        expect(copied.textContent.trim()).to.equal('Copied');
    });

    it('shows a progress circle while OSI is loading', async () => {
        store.selectedOffer = makeOffer();
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        el.osiLoading = true;
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-progress-circle')).to.exist;
    });

    it('copyOsi() no-ops when there is no OSI', async () => {
        store.selectedOffer = makeOffer();
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        el.osi = '';
        el.osiCopied = false;
        await el.copyOsi();
        expect(el.osiCopied).to.be.false;
    });

    it('copyOsi() writes to clipboard and toggles osiCopied when clipboard is available', async () => {
        store.selectedOffer = makeOffer();
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        el.osi = 'TO-COPY';
        const writes = [];
        const origClipboard = navigator.clipboard;
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: (text) => {
                    writes.push(text);
                    return Promise.resolve();
                },
            },
        });
        try {
            await el.copyOsi();
            expect(writes).to.deep.equal(['TO-COPY']);
            expect(el.osiCopied).to.be.true;
        } finally {
            Object.defineProperty(navigator, 'clipboard', { configurable: true, value: origClipboard });
        }
    });

    it('copyOsi() swallows clipboard errors silently', async () => {
        store.selectedOffer = makeOffer();
        const el = await fixture(html`<ost-offer-detail-focused></ost-offer-detail-focused>`);
        el.osi = 'WILL-FAIL';
        el.osiCopied = false;
        const origClipboard = navigator.clipboard;
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: () => Promise.reject(new Error('denied')) },
        });
        try {
            await el.copyOsi();
            expect(el.osiCopied).to.be.false;
        } finally {
            Object.defineProperty(navigator, 'clipboard', { configurable: true, value: origClipboard });
        }
    });
});
