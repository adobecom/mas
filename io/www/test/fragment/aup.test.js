import { expect } from 'chai';
import sinon from 'sinon';
import { clearFulfillableItemsCache, transformer } from '../../src/fragment/transformers/aup.js';
import { createResponse } from './mocks/MockFetch.js';
import { CARD_MODEL_ID } from '../../src/fragment/utils/common.js';
import { baseOffer } from '../../../../price/test/fixtures/cases.js';

const offersFor = (osi, overrides) => [
    { ...structuredClone(baseOffer), offerSelectorIds: [osi], productArrangementCode: `pa-${osi}`, ...overrides },
];
const rich = (value) => ({ value, mimeType: 'text/html' });
const PRO_FIELDS = {
    variant: 'pro',
    osi: 'OSI-PRO',
    size: 'edu',
    mnemonicIcon: ['https://www.adobe.com/icons/cc.svg', '', 'https://www.adobe.com/icons/adobe-stock.svg'],
    mnemonicAlt: ['Creative Cloud'],
    mnemonicLink: ['https://www.adobe.com/creativecloud.html'],
    badge: rich(
        '<merch-badge background-color="spectrum-yellow-300-plans" border-color="gradient-purple-blue" icon="sp-icon-star">Save 50%</merch-badge>',
    ),
    backgroundColor: 'light',
    borderColor: 'black',
    cardTitle: rich('<p>Creative Cloud Pro</p>'),
    subtitle: 'All-in-one toolkit',
    prices: rich('<p>US$29.99/mo</p>'),
    description: rich(
        '<p>Save on 20+ apps.</p><p><a href="https://www.adobe.com/offer-terms/ccm.html" target="_blank">See terms</a></p>',
    ),
    callout: rich('<p>AI assistant add-on</p>'),
    showSecureLabel: true,
    addon:
        '<merch-addon background="grey"><p>Add <strong>Stock</strong></p><p data-plan-type="M2M"><span is="inline-price" data-wcs-osi="OSI-STOCK">US$29.99/mo</span></p>' +
        '<p><span is="inline-price" data-wcs-osi="OSI-STOCK-PUF" data-promotion-code="STOCK"></span></p><p><span is="inline-price" data-wcs-osi="OSI-STOCK-NA"></span></p></merch-addon>',
    addonConfirmation: '<p>Stock added</p>',
    ctas: rich(
        '<p><a class="accent" data-checkout-workflow="UCv3" data-checkout-workflow-step="segmentation" data-wcs-osi="OSI-PRO" data-modal="crm" data-quantity="2" data-perpetual="false" data-upgrade="true" data-analytics-id="free-trial">Free trial</a> ' +
            '<a class="primary-outline" href="https://www.adobe.com/pro.html" target="_self">Learn more</a> <span>ignored</span></p>',
    ),
    whatsIncluded:
        '<p class="whats-included-label">Students save 50%.</p><div class="section"><h4>Everything in <strong>Pro</strong></h4></div>',
    tags: ['mas:product_code/ccsn', 'mas:market_segments/edu'],
    customFields: ['<p>Step up</p>', ''],
    customFieldLabels: ['header-promo-banner'],
};

const contextFor = (fields = PRO_FIELDS, { type = 'html', settings, wcs, ...overrides } = {}) => ({
    id: 'card',
    requestId: 'request',
    api_key: 'unified_checkout_server_v3',
    locale: 'en_US',
    type,
    mapping: 'aup',
    ...overrides,
    body: {
        id: 'card',
        model: { id: CARD_MODEL_ID },
        fields: structuredClone(fields),
        ...(settings && { settings }),
        wcs: wcs ?? {
            prod: {
                'OSI-PRO-us-mult': offersFor('OSI-PRO'),
                'OSI-STOCK-us-mult': offersFor('OSI-STOCK', { offerType: 'TRIAL' }),
                'OSI-STOCK-PUF-us-mult-stock': offersFor('OSI-STOCK-PUF', { offerType: 'BASE', term: 'ANNUAL' }),
            },
        },
    },
});

const map = async (...args) => (await transformer.process(contextFor(...args))).body;

describe('aup transformer', () => {
    it("reports the resolved offer's id without a requested offer id", async () => {
        const wcs = { prod: { 'OSI-PRO-us-mult': offersFor('OSI-PRO', { offerId: 'WCS-OFFER-ID' }) } };
        expect((await map(PRO_FIELDS, { wcs })).offerId).to.equal('WCS-OFFER-ID');
    });

    it('maps a card to the AUP shape', async () => {
        const body = await map(PRO_FIELDS, {
            offer: '257E1D82082387D152029F93C1030624',
            offerId: '257E1D82082387D152029F93C1030624',
        });
        expect(body).to.include({
            fragment: 'card',
            template: 'pro',
            analyticsId: 'ccsn',
            offerId: '257E1D82082387D152029F93C1030624',
            osi: 'OSI-PRO',
            productArrangementCode: 'pa-OSI-PRO',
            title: '<p>Creative Cloud Pro</p>',
            subtitle: 'All-in-one toolkit',
            description:
                '<p>Save on 20+ apps.</p><p><a href="https://www.adobe.com/offer-terms/ccm.html" target="_blank" rel="noopener noreferrer">See terms</a></p>',
            callout: '<p>AI assistant add-on</p>',
            price: '<p>US$29.99/mo</p>',
            promoCode: null,
            trialBadge: null,
            quantitySelect: null,
            backgroundImage: null,
        });
        expect(body.badge).to.deep.equal({
            text: 'Save 50%',
            color: '#000000',
            backgroundColor: '#F5C700',
            borderColor: 'linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)',
            icon: 'sp-icon-star',
        });
        expect(body.mnemonics).to.deep.equal([
            {
                icon: 'https://www.adobe.com/icons/cc.svg',
                alt: 'Creative Cloud',
                link: 'https://www.adobe.com/creativecloud.html',
            },
            { icon: 'https://www.adobe.com/icons/adobe-stock.svg', alt: 'Adobe Stock', link: undefined },
        ]);
        expect(body.features).to.deep.equal([
            {
                id: 'whatsIncluded',
                header: '<p>Students save 50%.</p>',
                items: [{ icon: undefined, title: '<p>Everything in <strong>Pro</strong></p>', items: [] }],
            },
        ]);
        expect(
            (
                await map({
                    addon: '<merch-addon>Add <span is="inline-price"><span class="disabled">/yr</span></span></merch-addon>',
                })
            ).addon.label,
        ).to.equal('Add');
        expect(body.addon).to.deep.equal({
            background: 'grey',
            customCheckbox: true,
            label: 'Add Stock',
            offers: [
                { planType: 'M2M', offerType: 'TRIAL', wcsOsi: 'OSI-STOCK', price: 'US$29.99/mo' },
                { planType: 'PUF', offerType: 'BASE', wcsOsi: 'OSI-STOCK-PUF', price: '' },
                { planType: undefined, offerType: undefined, wcsOsi: 'OSI-STOCK-NA', price: '' },
            ],
            confirmation: '<p>Stock added</p>',
        });
        expect(body.secureTransaction).to.deep.equal({ enabled: true });
        expect(body.customFields).to.deep.equal([{ label: 'header-promo-banner', value: '<p>Step up</p>' }]);
        expect(body.style).to.deep.equal({ backgroundColor: 'light', borderColor: 'black', size: 'edu' });
        expect(body.seeTerms).to.deep.equal({ label: 'See terms', url: 'https://www.adobe.com/offer-terms/ccm.html' });
        expect(body.tags).to.deep.equal(PRO_FIELDS.tags);
        expect(body.pznTags).to.deep.equal([]);
    });

    it('maps checkout and link ctas', async () => {
        const [checkout, link] = (await map()).ctas;
        expect(checkout).to.include({
            text: 'Free trial',
            variant: 'accent',
            style: 'fill',
            isCheckout: true,
            analyticsId: 'free-trial',
            wcsOsi: 'OSI-PRO',
        });
        expect(checkout.checkout).to.deep.equal({
            workflow: 'UCv3',
            workflowStep: 'segmentation',
            marketSegment: undefined,
            quantity: 2,
            promotionCode: '',
            perpetual: false,
            entitlement: undefined,
            upgrade: true,
            modal: 'crm',
        });
        const url = new URL(checkout.url);
        expect(url.origin).to.equal('https://commerce.adobe.com');
        expect(url.searchParams.get('pa')).to.equal('pa-OSI-PRO');
        expect(link).to.deep.equal({
            text: 'Learn more',
            variant: 'primary',
            style: 'outline',
            isCheckout: false,
            url: 'https://www.adobe.com/pro.html',
            target: '_self',
            analyticsId: undefined,
        });
    });

    it('defaults the checkout step and uses the fragment promotion code', async () => {
        const fields = {
            ...PRO_FIELDS,
            promoCode: 'PROMO',
            ctas: rich('<button data-wcs-osi="OSI-PRO, OSI-ADDON">Buy</button>'),
        };
        const wcs = {
            prod: {
                'OSI-PRO-us-mult-promo': offersFor('OSI-PRO'),
                'OSI-PRO,OSI-ADDON-us-mult-promo': [...offersFor('OSI-ADDON'), ...offersFor('OSI-PRO')],
            },
        };
        const body = await map(fields, { wcs });
        expect(body.promoCode).to.equal('PROMO');
        expect(body.productArrangementCode).to.equal('pa-OSI-PRO');
        const [cta] = body.ctas;
        expect(cta).not.to.have.property('variant');
        expect(cta.checkout.promotionCode).to.equal('PROMO');
        expect(new URL(cta.url).pathname).to.match(/\/store\/email/);
    });

    it('leaves the checkout url out when an offer is not cached', async () => {
        const body = await map(PRO_FIELDS, { wcs: {} });
        expect(body.productArrangementCode).to.be.undefined;
        expect(body.ctas[0].url).to.be.undefined;
        expect(body.ctas[0].isCheckout).to.be.true;
    });

    it('serializes text-bearing values per type', async () => {
        const json = await map(PRO_FIELDS, { type: 'json' });
        expect(json.title).to.deep.equal([
            { nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'Creative Cloud Pro' }] },
        ]);
        expect(json.badge.text).to.equal('Save 50%');
        const text = await map(PRO_FIELDS, { type: 'text' });
        expect(text.description).to.equal('Save on 20+ apps.\nSee terms');
    });

    it('applies badge defaults and authored colors', async () => {
        const body = await map({
            badge: rich('Best value'),
            badgeColor: 'white',
            trialBadge: rich('<merch-badge color="green">Free trial</merch-badge>'),
        });
        expect(body.badge).to.deep.equal({
            text: 'Best value',
            color: 'white',
            backgroundColor: '#F8D904',
            borderColor: undefined,
        });
        expect(body.trialBadge).to.deep.equal({ text: 'Free trial', borderColor: '#31A547', color: 'green' });
        expect((await map({ badge: rich('<merch-badge></merch-badge>') })).badge).to.be.null;
        expect((await map({ trialBadge: rich('<p></p>'), trialBadgeBorderColor: 'red' })).trialBadge).to.be.null;
    });

    it('maps mnemonic list items, settings and optional fields', async () => {
        const body = await map(
            {
                whatsIncluded:
                    '<h3 slot="heading">Included</h3><merch-mnemonic-list><merch-icon slot="icon" src="ps.svg" alt="Photoshop" href="https://ps"></merch-icon><p slot="description">Photoshop</p></merch-mnemonic-list>' +
                    '<merch-mnemonic-list><p>Bare</p></merch-mnemonic-list>',
                quantitySelect: rich(
                    '<merch-quantity-select title="Qty" min="1" max="10" step="1" default-value="2"></merch-quantity-select>',
                ),
                customFields: ['<p>value only</p>'],
                perUnitLabel: '{perUnit}',
                backgroundImage: 'bg.png',
                backgroundImageAltText: 'background',
                shortDescription: rich('<a href="https://www.adobe.com/legal.html">Legal</a>'),
                promoText: rich('<p>Limited time</p>'),
            },
            {
                settings: {
                    secureLabel: 'Secure transaction',
                    addon: 'Add AI <span is="inline-price" data-wcs-osi="OSI-AI"></span>',
                },
            },
        );
        expect(body.features[0]).to.deep.equal({
            id: 'whatsIncluded',
            header: '<p>Included</p>',
            items: [
                { icon: 'ps.svg', alt: 'Photoshop', description: '<p>Photoshop</p>', href: 'https://ps' },
                { icon: undefined, alt: undefined, description: '<p>Bare</p>', href: undefined },
            ],
        });
        expect(body.quantitySelect).to.deep.equal({ title: 'Qty', min: 1, max: 10, step: 1, default: 2 });
        expect(body.secureTransaction).to.deep.equal({ enabled: true, label: 'Secure transaction' });
        expect(body.addon).to.deep.equal({
            background: undefined,
            customCheckbox: false,
            label: 'Add AI',
            offers: [{ planType: undefined, offerType: undefined, wcsOsi: 'OSI-AI', price: '' }],
            confirmation: undefined,
        });
        expect(body.customFields).to.deep.equal([{ label: '', value: '<p>value only</p>' }]);
        expect(body).to.include({
            perUnitLabel: '{perUnit}',
            promoText: '<p>Limited time</p>',
            shortDescription: '<p><a href="https://www.adobe.com/legal.html">Legal</a></p>',
        });
        expect(body.backgroundImage).to.deep.equal({ src: 'bg.png', alt: 'background' });
        expect(body.seeTerms).to.be.undefined;
    });

    it("maps an unlabelled what's included list and reports rejected markup", async () => {
        const body = await map({
            whatsIncluded: '<div class="section">Apps</div>',
            description: rich('<p>Hello<img src="x.png"></p>'),
        });
        expect(body.features[0].header).to.be.undefined;
        expect(body.description).to.equal('<p>Hello</p>');
    });

    it('maps pro sections with their icon, title and rows', async () => {
        const body = await map({
            whatsIncluded:
                '<div class="section"><h4><sp-icon-star></sp-icon-star>Apps</h4><ul><li>Photoshop</li><li>Illustrator</li></ul></div>' +
                '<div class="section"><h4><merch-icon src="ai.svg"></merch-icon>AI</h4></div>' +
                '<div class="section"><h4><svg></svg><em>Storage</em></h4></div>',
        });
        expect(body.features).to.deep.equal([
            {
                id: 'whatsIncluded',
                items: [
                    { icon: 'sp-icon-star', title: '<p>Apps</p>', items: ['<p>Photoshop</p>', '<p>Illustrator</p>'] },
                    { icon: 'ai.svg', title: '<p>AI</p>', items: [] },
                    { icon: undefined, title: '<p><em>Storage</em></p>', items: [] },
                ],
            },
        ]);
    });

    describe('fulfillable items', () => {
        const AOS = { AOS_URL: 'https://aos.example/offers', AOS_API_KEY: 'aos-key' };
        const APPS =
            '<p class="whats-included-label">Apps included</p>' +
            '<merch-mnemonic-list><div slot="icon"><merch-icon src="photoshop.svg" alt=""></merch-icon></div><p slot="description"></p></merch-mnemonic-list>' +
            '<merch-mnemonic-list data-fi-code="firefly_credits"><merch-icon src="custom.svg" alt="Firefly"></merch-icon><p slot="description">Firefly</p></merch-mnemonic-list>' +
            '<merch-mnemonic-list><merch-icon src="fonts.svg" alt="Adobe Fonts"></merch-icon><p slot="description">Fonts</p></merch-mnemonic-list>';
        const FULFILLABLE_ITEMS = [
            { code: 'photoshop_no_icon', copy: { name: 'Photoshop' } },
            {
                code: 'photoshop_cc',
                copy: { name: 'Adobe Photoshop', short_description: 'Edit photos', description: 'long' },
                assets: { icons: { svg: 'https://aos/ps.svg' } },
            },
            { code: 'firefly_credits', copy: { name: 'Adobe Firefly', description: 'Generative credits' } },
        ];
        let fetchStub;

        beforeEach(() => {
            clearFulfillableItemsCache();
            fetchStub = sinon
                .stub(globalThis, 'fetch')
                .callsFake(() =>
                    createResponse(200, [
                        { offer_id: 'no-merch' },
                        { merchandising: { fulfillable_items: FULFILLABLE_ITEMS } },
                    ]),
                );
        });

        afterEach(() => fetchStub.restore());

        it('splits authored apps into included apps, enriched from AOS, and other items', async () => {
            const body = await map({ osi: 'OSI-PRO', whatsIncluded: APPS }, AOS);
            expect(body.features).to.deep.equal([
                {
                    id: 'includedApps',
                    header: '<p>Apps included</p>',
                    items: [
                        {
                            icon: 'photoshop.svg',
                            alt: 'Adobe Photoshop',
                            code: 'photoshop_cc',
                            name: 'Adobe Photoshop',
                            tooltip: 'Edit photos',
                            href: undefined,
                        },
                        {
                            icon: 'custom.svg',
                            alt: 'Firefly',
                            code: 'firefly_credits',
                            name: 'Firefly',
                            tooltip: 'Generative credits',
                            href: undefined,
                        },
                    ],
                },
                {
                    id: 'whatsIncluded',
                    items: [{ icon: 'fonts.svg', alt: 'Adobe Fonts', description: '<p>Fonts</p>', href: undefined }],
                },
            ]);
            const url = new URL(fetchStub.firstCall.args[0]);
            expect(url.origin + url.pathname).to.equal('https://aos.example/offers');
            expect(Object.fromEntries(url.searchParams)).to.include({
                arrangement_code: 'pa-OSI-PRO',
                country: 'US',
                locale: 'en_US',
            });
            expect(fetchStub.firstCall.args[1].headers['x-api-key']).to.equal('aos-key');
            await map({ osi: 'OSI-PRO', whatsIncluded: APPS }, AOS);
            expect(fetchStub.callCount).to.equal(1);
            const unlabelled = '<merch-mnemonic-list><p slot="description">Photoshop</p></merch-mnemonic-list>';
            const [{ items }] = (await map({ osi: 'OSI-PRO', whatsIncluded: unlabelled }, AOS)).features;
            expect(items[0]).to.include({ icon: 'https://aos/ps.svg', alt: 'Adobe Photoshop', name: 'Photoshop' });
        });

        it('keeps authored codes without AOS and fills missing names from fulfillable items', async () => {
            fetchStub.callsFake(() =>
                createResponse(200, [{ merchandising: { fulfillable_items: [{ code: 'firefly_credits', copy: {} }] } }]),
            );
            const icon = '<merch-icon src="ff.svg" data-fi-code="firefly_credits"></merch-icon>';
            const whatsIncluded = `<merch-mnemonic-list>${icon}</merch-mnemonic-list><merch-mnemonic-list data-fi-code="unknown"></merch-mnemonic-list>`;
            const expected = [
                {
                    icon: 'ff.svg',
                    alt: undefined,
                    code: 'firefly_credits',
                    name: undefined,
                    tooltip: undefined,
                    href: undefined,
                },
                { icon: undefined, alt: undefined, code: 'unknown', name: undefined, tooltip: undefined, href: undefined },
            ];
            expect((await map({ osi: 'OSI-PRO', whatsIncluded }, AOS)).features).to.deep.equal([
                { id: 'includedApps', items: expected },
            ]);
            expect((await map({ whatsIncluded })).features).to.deep.equal([{ id: 'includedApps', items: expected }]);
        });

        it('appends offer baseline included apps not authored, enriched from AOS', async () => {
            const authored = '<p slot="heading"></p><merch-mnemonic-list data-fi-code="firefly_credits"></merch-mnemonic-list>';
            const body = await map(
                { osi: 'OSI-PRO', whatsIncluded: authored, includedApps: ['firefly_credits', 'photoshop_cc', 'unknown'] },
                AOS,
            );
            expect(body.features).to.deep.equal([
                {
                    id: 'includedApps',
                    items: [
                        {
                            icon: undefined,
                            alt: 'Adobe Firefly',
                            code: 'firefly_credits',
                            name: 'Adobe Firefly',
                            tooltip: 'Generative credits',
                            href: undefined,
                        },
                        {
                            icon: 'https://aos/ps.svg',
                            alt: 'Adobe Photoshop',
                            code: 'photoshop_cc',
                            name: 'Adobe Photoshop',
                            tooltip: 'Edit photos',
                        },
                        { icon: undefined, alt: undefined, code: 'unknown', name: undefined, tooltip: undefined },
                    ],
                },
            ]);
        });

        it('falls back to authored items when AOS fails or has no merchandising', async () => {
            fetchStub.callsFake(() => createResponse(500));
            const items = [{ icon: 'fonts.svg', alt: 'Adobe Fonts', description: '<p>Fonts</p>', href: undefined }];
            const fonts = APPS.split('</merch-mnemonic-list>')[2];
            const whatsIncluded = `${fonts}</merch-mnemonic-list>`;
            expect((await map({ osi: 'OSI-PRO', whatsIncluded }, AOS)).features).to.deep.equal([
                { id: 'whatsIncluded', items },
            ]);
            fetchStub.callsFake(() => createResponse(200, [{}]));
            expect(
                (await map({ osi: 'OSI-PRO', whatsIncluded }, { AOS_URL: 'https://aos.example', AOS_API_KEY: 'k' })).features,
            ).to.deep.equal([{ id: 'whatsIncluded', items }]);
            expect(new URL(fetchStub.lastCall.args[0]).pathname).to.equal('/offers');
        });
    });

    it('reports the layer of each filled area, the fragment by default', async () => {
        const fieldSourcesById = { card: { cardTitle: 'template', prices: 'plan', badge: 'mask', includedApps: 'product' } };
        const body = await map({ ...PRO_FIELDS, includedApps: ['photoshop_cc'] }, { fieldSourcesById });
        expect(body.sources.map(({ source }) => source)).to.deep.equal(['product', 'template', 'plan', 'fragment', 'mask']);
        expect(body.sources).to.deep.include.members([
            { source: 'product', fields: ['features'] },
            { source: 'template', fields: ['title'] },
            { source: 'plan', fields: ['price'] },
            { source: 'mask', fields: ['badge'] },
        ]);
        const fragmentFields = body.sources.find(({ source }) => source === 'fragment').fields;
        expect(fragmentFields).to.include.members(['description', 'features']);
        expect(fragmentFields).to.not.include.members(['title', 'promoText']);
    });

    it('maps an empty card', async () => {
        const body = await map({ addon: '{{disabled}}', whatsIncluded: '' });
        expect(body).to.include({ template: undefined, analyticsId: undefined, osi: undefined, badge: null, addon: null });
        expect(body.mnemonics).to.deep.equal([]);
        expect(body.ctas).to.deep.equal([]);
        expect(body.features).to.deep.equal([]);
        expect(body.secureTransaction).to.be.null;
        expect(body.tags).to.deep.equal([]);
    });

    it('is a no-op without the aup mapping, a type, or a card body', async () => {
        for (const overrides of [{ mapping: undefined }, { type: '' }]) {
            const context = contextFor(PRO_FIELDS, overrides);
            expect((await transformer.process(context)).body).to.have.property('fields');
        }
        const collection = contextFor();
        collection.body.model.id = 'collection-model';
        expect((await transformer.process(collection)).body).to.have.property('fields');
        expect((await transformer.process({ mapping: 'aup', type: 'json' })).body).to.be.undefined;
    });
});
