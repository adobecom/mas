import { expect } from 'chai';
import { transformer } from '../../src/fragment/transformers/aup.js';
import { CARD_MODEL_ID } from '../../src/fragment/utils/common.js';
import { baseOffer } from '../../../../price/test/fixtures/cases.js';

const offersFor = (osi) => [{ ...structuredClone(baseOffer), offerSelectorIds: [osi], productArrangementCode: `pa-${osi}` }];
const rich = (value) => ({ value, mimeType: 'text/html' });
const PRO_FIELDS = {
    variant: 'pro',
    osi: 'OSI-PRO',
    size: 'edu',
    mnemonicIcon: ['https://www.adobe.com/icons/cc.svg', ''],
    mnemonicAlt: ['Creative Cloud'],
    badge: rich(
        '<merch-badge background-color="spectrum-yellow-300" border-color="spectrum-yellow-300">Save 50%</merch-badge>',
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
    addon: '<merch-addon background="grey">Add Stock <span is="inline-price" data-wcs-osi="OSI-STOCK" data-plan-type="ABM"></span></merch-addon>',
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
        wcs: wcs ?? { prod: { 'OSI-PRO-us-mult': offersFor('OSI-PRO') } },
    },
});

const map = async (...args) => (await transformer.process(contextFor(...args))).body;

describe('aup transformer', () => {
    it('maps a card to the AUP shape', async () => {
        const body = await map(PRO_FIELDS, { offer: 'offer-id' });
        expect(body).to.include({
            fragment: 'card',
            template: 'pro',
            analyticsId: 'ccsn',
            offerId: 'offer-id',
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
            backgroundColor: 'spectrum-yellow-300',
            borderColor: 'spectrum-yellow-300',
        });
        expect(body.mnemonics).to.deep.equal([{ icon: 'https://www.adobe.com/icons/cc.svg', alt: 'Creative Cloud' }]);
        expect(body.features).to.deep.equal([
            {
                id: 'whatsIncluded',
                header: '<p>Students save 50%.</p>',
                items: [
                    {
                        icon: undefined,
                        alt: undefined,
                        description: '<h4>Everything in <strong>Pro</strong></h4>',
                        href: undefined,
                    },
                ],
            },
        ]);
        expect(body.addon).to.deep.equal({
            background: 'grey',
            label: 'Add Stock',
            offers: [{ wcsOsi: 'OSI-STOCK', planType: 'ABM' }],
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
                'OSI-ADDON-us-mult-promo': offersFor('OSI-ADDON'),
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
            label: 'Add AI',
            offers: [{ wcsOsi: 'OSI-AI', planType: undefined }],
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

    it('maps an empty card', async () => {
        const body = await map({ addon: '<merch-addon disabled></merch-addon>', whatsIncluded: '' });
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
