import { expect, fixture, html } from '@open-wc/testing';
import { store } from '../../src/store/ost-store.js';
import '../../src/components/ost-product-detail.js';

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
    store.selectedOffers = [];
    store.authoringFlow = 'single';
    store.flowChosen = false;
    store.country = 'US';
    store.landscape = 'PUBLISHED';
    store.aosParams = { arrangementCode: '' };
    store.accessToken = '';
    store.apiKey = '';
    store.env = 'PRODUCTION';
    store.notify();
}

describe('ost-product-detail', () => {
    beforeEach(() => {
        resetStore();
    });

    afterEach(() => {
        resetStore();
    });

    describe('full panel mode', () => {
        it('shows the empty state when no product is selected', async () => {
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            const empty = el.shadowRoot.querySelector('.empty-state');
            expect(empty).to.exist;
            expect(empty.textContent.trim()).to.equal('Select a product to view offers.');
        });

        it('renders the product header (icon, name, arrangement code, landscape badge)', async () => {
            store.selectedProduct = makeProduct();
            store.landscape = 'DRAFT';
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
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
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.header .header-icon')).to.not.exist;
        });

        it('falls back to product.arrangementCode when arrangement_code is missing', async () => {
            store.selectedProduct = makeProduct({ arrangement_code: undefined, arrangementCode: 'fallback-arr' });
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.arrangement-code').textContent).to.contain('fallback-arr');
        });

        it('falls back to store.aosParams.arrangementCode as the last resort', async () => {
            store.selectedProduct = makeProduct({ arrangement_code: undefined });
            store.aosParams = { arrangementCode: 'aos-fallback' };
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.arrangement-code').textContent).to.contain('aos-fallback');
        });

        it('renders the product details grid with code and family', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            const detailValues = [...el.shadowRoot.querySelectorAll('.offer-details .detail-value')].map((v) =>
                v.textContent.trim(),
            );
            expect(detailValues).to.include('PSHOP');
            expect(detailValues).to.include('CREATIVE_CLOUD');
        });

        it('omits optional product detail rows when fields are missing', async () => {
            store.selectedProduct = makeProduct({ product_code: undefined, product_family: undefined });
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            const labels = [...el.shadowRoot.querySelectorAll('.offer-details .detail-label')].map((l) => l.textContent.trim());
            expect(labels).to.not.include('Product Code');
            expect(labels).to.not.include('Product Family');
        });

        it('shows the loading spinner while offers are being fetched', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            el.loading = true;
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.loading-container sp-progress-circle')).to.exist;
        });

        it('shows the "No offers found" message when offers list is empty', async () => {
            store.selectedProduct = makeProduct();
            store.offers = [];
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            el.loading = false;
            await el.updateComplete;
            const empty = el.shadowRoot.querySelector('.empty-state');
            expect(empty).to.exist;
            expect(empty.textContent).to.contain('No offers found');
        });

        it('renders one ost-offer-card per offer plus the table header and count', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            // connectedCallback fires fetchOffers asynchronously; force the post-fetch state
            // directly so we can assert the render template without stubbing aos-client.
            store.offers = [makeOffer({ offer_id: 'A' }), makeOffer({ offer_id: 'B' }), makeOffer({ offer_id: 'C' })];
            el.loading = false;
            await el.updateComplete;
            const cards = el.shadowRoot.querySelectorAll('ost-offer-card');
            const sectionLabel = el.shadowRoot.querySelector('.section-label');
            expect(cards.length).to.equal(3);
            expect(sectionLabel.textContent.trim()).to.equal('Offers (3)');
        });

        it('shows the hint text when offers are loaded but none are selected', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
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
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
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
            const el = await fixture(html`<ost-product-detail summary></ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.header')).to.exist;
            // summary mode should NOT render the full details grid or offers table
            expect(el.shadowRoot.querySelector('.offer-details')).to.not.exist;
            expect(el.shadowRoot.querySelector('.offers-table')).to.not.exist;
        });

        it('does not render a static summary price (Live Preview is the source of truth)', async () => {
            // Static AOS-derived price and the WCS-resolved Live Preview price can
            // disagree on tax-inclusive locales (e.g. FR), so the static header
            // price was removed; the user should rely on Live Preview only.
            store.selectedProduct = makeProduct();
            store.selectedOffer = makeOffer();
            const el = await fixture(html`<ost-product-detail summary></ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.summary-price')).to.not.exist;
        });

        it('shows the landscape badge in summary mode for PUBLISHED', async () => {
            store.selectedProduct = makeProduct();
            store.landscape = 'PUBLISHED';
            const el = await fixture(html`<ost-product-detail summary></ost-product-detail>`);
            const badge = el.shadowRoot.querySelector('.header sp-badge');
            expect(badge).to.exist;
            expect(badge.textContent.trim()).to.equal('PUBLISHED');
        });

        it('hides the landscape badge in summary mode when landscape is BOTH (AI chat consult)', async () => {
            store.selectedProduct = makeProduct();
            store.landscape = 'BOTH';
            const el = await fixture(html`<ost-product-detail summary></ost-product-detail>`);
            const badge = el.shadowRoot.querySelector('.header sp-badge');
            expect(badge).to.not.exist;
        });

        it('renders the Change link in summary mode', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<ost-product-detail summary></ost-product-detail>`);
            const change = el.shadowRoot.querySelector('.change-link');
            expect(change).to.exist;
            expect(change.textContent.trim()).to.equal('Change');
        });

        it('falls back to product.arrangementCode in summary mode header', async () => {
            store.selectedProduct = makeProduct({ arrangement_code: undefined, arrangementCode: 'sum-fallback' });
            const el = await fixture(html`<ost-product-detail summary></ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.arrangement-code').textContent.trim()).to.equal('sum-fallback');
        });
    });

    describe('store reactivity', () => {
        it('re-renders when store notifies of a product change', async () => {
            store.selectedProduct = undefined;
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            expect(el.shadowRoot.querySelector('.empty-state')).to.exist;
            store.selectedProduct = makeProduct();
            store.notify();
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.empty-state')).to.not.exist;
            expect(el.shadowRoot.querySelector('.product-name').textContent.trim()).to.equal('Photoshop');
        });

        it('re-renders the offer list when store.offers changes', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            store.offers = [makeOffer({ offer_id: 'NEW-1' }), makeOffer({ offer_id: 'NEW-2' })];
            el.loading = false;
            store.notify();
            await el.updateComplete;
            expect(el.shadowRoot.querySelectorAll('ost-offer-card').length).to.equal(2);
        });
    });

    describe('handleChangeOffer', () => {
        it('clears the selected offer/OSI and the narrowing aosParams', async () => {
            store.selectedProduct = makeProduct();
            store.selectedOffer = makeOffer({ offer_id: 'OF-X' });
            store.selectedOsi = 'osi-x';
            store.aosParams = {
                arrangementCode: 'photoshop-arr',
                commitment: 'YEAR',
                term: 'MONTHLY',
                customerSegment: 'INDIVIDUAL',
                marketSegment: 'COM',
                offerType: 'BASE',
                pricePoint: 'REGULAR',
            };
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            el.handleChangeOffer();
            expect(store.selectedOffer).to.be.undefined;
            expect(store.selectedOsi).to.be.undefined;
            expect(store.lastSelectedOfferId).to.equal('OF-X');
            // arrangementCode is intentionally preserved so we stay on the same product
            expect(store.aosParams.arrangementCode).to.equal('photoshop-arr');
            // Narrowing filters are reset so Change actually surfaces other offers
            expect(store.aosParams.commitment).to.equal('');
            expect(store.aosParams.term).to.equal('');
            expect(store.aosParams.customerSegment).to.equal('');
            expect(store.aosParams.marketSegment).to.equal('');
            expect(store.aosParams.offerType).to.equal('');
            expect(store.aosParams.pricePoint).to.equal('');
        });
    });

    describe('autoResolveOsi', () => {
        it('short-circuits to setOsi with offer_type for fake offers', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            await el.autoResolveOsi({ offer_type: 'fake-PHSP_BASE' });
            expect(store.selectedOsi).to.equal('fake-PHSP_BASE');
        });

        it('calls createOfferSelector and sets the returned id as OSI on success', async () => {
            const originalFetch = window.fetch;
            // createOfferSelector wraps response.json() in { data: json }; bare id is enough.
            window.fetch = async () => ({
                ok: true,
                json: async () => ({ id: 'resolved-osi-123' }),
            });
            try {
                store.selectedProduct = makeProduct();
                const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
                await el.autoResolveOsi({
                    product_arrangement_code: 'photoshop-arr',
                    commitment: 'YEAR',
                    term: 'MONTHLY',
                    offer_type: 'BASE',
                    market_segments: ['COM'],
                });
                expect(store.selectedOsi).to.equal('resolved-osi-123');
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('swallows network errors and leaves the OSI unchanged', async () => {
            const originalFetch = window.fetch;
            window.fetch = async () => {
                throw new Error('network down');
            };
            try {
                store.selectedProduct = makeProduct();
                store.selectedOsi = 'prior-osi';
                const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
                await el.autoResolveOsi({ offer_type: 'BASE' });
                expect(store.selectedOsi).to.equal('prior-osi');
            } finally {
                window.fetch = originalFetch;
            }
        });
    });

    describe('autoFillBaseAndTrial', () => {
        it('is a no-op when multiSelect is not active', async () => {
            store.selectedProduct = makeProduct();
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            const baseOffer = makeOffer({ offer_id: 'B-1', offer_type: 'BASE' });
            const trialOffer = makeOffer({ offer_id: 'T-1', offer_type: 'TRIAL' });
            await el.autoFillBaseAndTrial([baseOffer, trialOffer]);
            expect(store.selectedOffers).to.have.length(0);
        });

        it('is a no-op when offers list lacks both BASE and TRIAL', async () => {
            store.selectedProduct = makeProduct();
            store.authoringFlow = 'tryBuy';
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            await el.autoFillBaseAndTrial([makeOffer({ offer_type: 'BASE' })]);
            expect(store.selectedOffers).to.have.length(0);
        });

        it('is a no-op when offers list has more than 2 entries', async () => {
            store.selectedProduct = makeProduct();
            store.authoringFlow = 'tryBuy';
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            await el.autoFillBaseAndTrial([
                makeOffer({ offer_id: 'A', offer_type: 'BASE' }),
                makeOffer({ offer_id: 'B', offer_type: 'TRIAL' }),
                makeOffer({ offer_id: 'C', offer_type: 'BASE' }),
            ]);
            expect(store.selectedOffers).to.have.length(0);
        });

        it('resolves BASE and TRIAL OSIs and adds both to selectedOffers on success', async () => {
            const originalFetch = window.fetch;
            // Differentiate responses by the offer_type embedded in the POST body
            // rather than by call order — Promise.all parallelizes so order is racy.
            window.fetch = async (_url, init) => {
                const body = JSON.parse(init?.body ?? '{}');
                const isBase = body.offer_type === 'BASE';
                // createOfferSelector wraps response.json() in { data: json }, so
                // the destructure becomes { data: { id } } → id. Return the bare
                // id payload here.
                return {
                    ok: true,
                    json: async () => ({ id: isBase ? 'osi-base' : 'osi-trial' }),
                };
            };
            try {
                store.selectedProduct = makeProduct();
                store.authoringFlow = 'tryBuy';
                store.flowChosen = true;
                const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
                store.selectedOffers = []; // make sure no leftover state
                const baseOffer = makeOffer({ offer_id: 'B-1', offer_type: 'BASE' });
                const trialOffer = makeOffer({ offer_id: 'T-1', offer_type: 'TRIAL' });
                await el.autoFillBaseAndTrial([baseOffer, trialOffer]);
                expect(store.selectedOffers).to.have.length(2);
                expect(store.selectedOffers.find((o) => o.role === 'base').osi).to.equal('osi-base');
                expect(store.selectedOffers.find((o) => o.role === 'trial').osi).to.equal('osi-trial');
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('swallows resolve errors and does not partially populate selectedOffers', async () => {
            const originalFetch = window.fetch;
            window.fetch = async () => {
                throw new Error('aos down');
            };
            try {
                store.selectedProduct = makeProduct();
                store.authoringFlow = 'tryBuy';
                const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
                store.selectedOffers = []; // baseline
                await el.autoFillBaseAndTrial([
                    makeOffer({ offer_id: 'B', offer_type: 'BASE' }),
                    makeOffer({ offer_id: 'T', offer_type: 'TRIAL' }),
                ]);
                // Promise.all short-circuits on rejection so the inner try
                // catches before either addOffer runs.
                expect(store.selectedOffers).to.have.length(0);
            } finally {
                window.fetch = originalFetch;
            }
        });
    });

    describe('fetchOffers', () => {
        it('emits a synthetic offer when aosParams.offerType starts with "fake-"', async () => {
            const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
            store.selectedProduct = makeProduct();
            store.aosParams = { arrangementCode: 'photoshop-arr', offerType: 'fake-PHSP_BASE' };
            await el.fetchOffers(makeProduct());
            const offers = store.offers;
            expect(offers).to.have.length(1);
            expect(offers[0].offer_id).to.equal('Fake Offer');
            expect(offers[0].offer_type).to.equal('fake-PHSP_BASE');
            expect(offers[0].name).to.equal('Photoshop');
        });

        it('fetches offers, sets them, and auto-resolves OSI when only one offer comes back', async () => {
            const originalFetch = window.fetch;
            // Differentiate by URL: searchOffers hits /offers, createOfferSelector
            // (called by autoResolveOsi) hits /offer_selectors. Mocks must return
            // shapes the real code expects (createOfferSelector destructures
            // res.data.id).
            window.fetch = async (url) => {
                if (String(url).includes('/offer_selectors')) {
                    // createOfferSelector wraps response.json() — return bare id.
                    return { ok: true, json: async () => ({ id: 'auto-osi' }) };
                }
                return { ok: true, json: async () => [makeOffer({ offer_id: 'ONLY-1' })] };
            };
            try {
                const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
                store.selectedProduct = makeProduct();
                store.aosParams = { arrangementCode: 'photoshop-arr' };
                await el.fetchOffers(makeProduct());
                expect(store.offers).to.have.length(1);
                expect(store.selectedOffer?.offer_id).to.equal('ONLY-1');
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('merges DRAFT + PUBLISHED responses when landscape is BOTH and de-dupes by offer_id keeping PUBLISHED', async () => {
            const originalFetch = window.fetch;
            let callIndex = 0;
            window.fetch = async () => ({
                ok: true,
                json: async () => {
                    callIndex++;
                    if (callIndex === 1) {
                        // PUBLISHED response
                        return [makeOffer({ offer_id: 'SAME', planType: 'PUF' })];
                    }
                    // DRAFT response (same offer_id; must be dropped in favor of PUBLISHED)
                    return [makeOffer({ offer_id: 'SAME', planType: 'ABM' })];
                },
            });
            try {
                const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
                store.selectedProduct = makeProduct();
                store.landscape = 'BOTH';
                store.aosParams = { arrangementCode: 'photoshop-arr' };
                await el.fetchOffers(makeProduct());
                expect(store.offers).to.have.length(1);
                expect(store.offers[0].landscapeSource).to.equal('PUBLISHED');
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('falls back to an empty offers list when the fetch throws', async () => {
            const originalFetch = window.fetch;
            window.fetch = async () => {
                throw new Error('aos down');
            };
            try {
                const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
                store.selectedProduct = makeProduct();
                store.offers = [makeOffer({ offer_id: 'stale' })];
                store.aosParams = { arrangementCode: 'photoshop-arr' };
                await el.fetchOffers(makeProduct());
                expect(store.offers).to.have.length(0);
                expect(el.loading).to.equal(false);
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('uses language undefined when commitment is PERPETUAL', async () => {
            const originalFetch = window.fetch;
            let capturedUrl;
            window.fetch = async (url) => {
                capturedUrl = url;
                return { ok: true, json: async () => [] };
            };
            try {
                const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
                store.selectedProduct = makeProduct();
                store.aosParams = { arrangementCode: 'photoshop-arr', commitment: 'PERPETUAL' };
                await el.fetchOffers(makeProduct());
                expect(capturedUrl).to.not.include('language=');
            } finally {
                window.fetch = originalFetch;
            }
        });

        it('uses language=EN when country is GB and commitment is not PERPETUAL', async () => {
            const originalFetch = window.fetch;
            let capturedUrl;
            window.fetch = async (url) => {
                capturedUrl = url;
                return { ok: true, json: async () => [] };
            };
            try {
                const el = await fixture(html`<ost-product-detail></ost-product-detail>`);
                store.selectedProduct = makeProduct();
                store.country = 'GB';
                store.aosParams = { arrangementCode: 'photoshop-arr' };
                await el.fetchOffers(makeProduct());
                expect(capturedUrl).to.include('language=EN');
            } finally {
                window.fetch = originalFetch;
            }
        });
    });
});
