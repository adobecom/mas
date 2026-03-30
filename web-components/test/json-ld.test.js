import { injectJsonLd } from '../src/json-ld.js';
import { expect } from '@esm-bundle/chai';

function makeOffer({
    price = 59.99,
    priceWithoutDiscount,
    commitment = 'YEAR',
    term = 'MONTHLY',
    currencyCode = 'USD',
} = {}) {
    const analytics = JSON.stringify({
        offerId: 'ABC123',
        currencyCode,
    });
    const priceDetails = { price };
    if (priceWithoutDiscount !== undefined) {
        priceDetails.priceWithoutDiscount = priceWithoutDiscount;
    }
    return { priceDetails, commitment, term, analytics };
}

function makeFields({
    cardTitle = 'Creative Cloud',
    description,
    mnemonicIcon,
} = {}) {
    const fields = { cardTitle };
    if (description !== undefined) fields.description = description;
    if (mnemonicIcon !== undefined) fields.mnemonicIcon = mnemonicIcon;
    return fields;
}

const PAGE_URL = 'https://www.adobe.com/products/photoshop?test=1';
const CLEAN_URL = 'https://www.adobe.com/products/photoshop';

describe('injectJsonLd', () => {
    afterEach(() => {
        document.head
            .querySelectorAll('script[type="application/ld+json"]')
            .forEach((el) => el.remove());
    });

    it('injects a valid JSON-LD script into the document head', () => {
        const script = injectJsonLd(makeFields(), makeOffer(), null, PAGE_URL);
        expect(script).to.not.be.null;
        expect(script.type).to.equal('application/ld+json');
        const data = JSON.parse(script.textContent);
        expect(data['@type']).to.equal('Product');
        expect(data.name).to.equal('Creative Cloud');
        expect(data.brand.name).to.equal('Adobe');
        expect(data.offers).to.have.length(1);
        expect(data.offers[0].price).to.equal('59.99');
        expect(data.offers[0].priceCurrency).to.equal('USD');
    });

    it('strips query params from page URL', () => {
        const script = injectJsonLd(makeFields(), makeOffer(), null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data['@id']).to.equal(`${CLEAN_URL}#product`);
        expect(data.offers[0].url).to.equal(CLEAN_URL);
    });

    it('returns P1Y billing duration for ANNUAL term', () => {
        const offer = makeOffer({ term: 'ANNUAL' });
        const script = injectJsonLd(makeFields(), offer, null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data.offers[0].priceSpecification.billingDuration).to.equal(
            'P1Y',
        );
    });

    it('returns P1Y billing duration for PERPETUAL commitment', () => {
        const offer = makeOffer({ commitment: 'PERPETUAL', term: 'MONTHLY' });
        const script = injectJsonLd(makeFields(), offer, null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data.offers[0].priceSpecification.billingDuration).to.equal(
            'P1Y',
        );
    });

    it('returns P1M billing duration for monthly term', () => {
        const offer = makeOffer({ term: 'MONTHLY' });
        const script = injectJsonLd(makeFields(), offer, null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data.offers[0].priceSpecification.billingDuration).to.equal(
            'P1M',
        );
    });

    it('uses currency code from offer analytics', () => {
        const offer = makeOffer({ currencyCode: 'JPY', price: 3300 });
        const script = injectJsonLd(makeFields(), offer, null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data.offers[0].priceCurrency).to.equal('JPY');
        expect(data.offers[0].priceSpecification.priceCurrency).to.equal('JPY');
    });

    it('includes promo pricing from priceWithoutDiscount', () => {
        const offer = makeOffer({ price: 29.99, priceWithoutDiscount: 59.99 });
        const script = injectJsonLd(makeFields(), offer, null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        const spec = data.offers[0].priceSpecification;
        expect(spec.price).to.equal('29.99');
        expect(spec.priceWithoutDiscount).to.equal('59.99');
    });

    it('includes promo pricing from regularOffer', () => {
        const offer = makeOffer({ price: 29.99 });
        const regularOffer = makeOffer({ price: 59.99 });
        const script = injectJsonLd(
            makeFields(),
            offer,
            regularOffer,
            PAGE_URL,
        );
        const data = JSON.parse(script.textContent);
        expect(data.offers[0].priceSpecification.priceWithoutDiscount).to.equal(
            '59.99',
        );
    });

    it('omits priceWithoutDiscount when same as price', () => {
        const offer = makeOffer({ price: 59.99, priceWithoutDiscount: 59.99 });
        const script = injectJsonLd(makeFields(), offer, null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data.offers[0].priceSpecification).to.not.have.property(
            'priceWithoutDiscount',
        );
    });

    it('handles free-tier offers (price 0)', () => {
        const offer = makeOffer({ price: 0 });
        const script = injectJsonLd(makeFields(), offer, null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data.offers[0].price).to.equal('0');
    });

    it('returns null when price is null', () => {
        const offer = makeOffer({ price: null });
        offer.priceDetails.price = null;
        const result = injectJsonLd(makeFields(), offer, null, PAGE_URL);
        expect(result).to.be.null;
    });

    it('returns null when fields is missing', () => {
        const result = injectJsonLd(null, makeOffer(), null, PAGE_URL);
        expect(result).to.be.null;
    });

    it('returns null when cardTitle is missing', () => {
        const result = injectJsonLd({}, makeOffer(), null, PAGE_URL);
        expect(result).to.be.null;
    });

    it('returns null when offer is missing', () => {
        const result = injectJsonLd(makeFields(), null, null, PAGE_URL);
        expect(result).to.be.null;
    });

    it('returns null when analytics has no currencyCode', () => {
        const offer = makeOffer();
        offer.analytics = JSON.stringify({ offerId: 'ABC123' });
        const result = injectJsonLd(makeFields(), offer, null, PAGE_URL);
        expect(result).to.be.null;
    });

    it('returns null when analytics is malformed', () => {
        const offer = makeOffer();
        offer.analytics = 'not-json';
        const result = injectJsonLd(makeFields(), offer, null, PAGE_URL);
        expect(result).to.be.null;
    });

    it('deduplicates by page URL', () => {
        const first = injectJsonLd(makeFields(), makeOffer(), null, PAGE_URL);
        const second = injectJsonLd(makeFields(), makeOffer(), null, PAGE_URL);
        expect(first).to.not.be.null;
        expect(second).to.be.null;
        const scripts = document.head.querySelectorAll(
            'script[type="application/ld+json"]',
        );
        expect(scripts.length).to.equal(1);
    });

    it('includes description when provided', () => {
        const fields = makeFields({
            description: { value: '<p>Photo editing software</p>' },
        });
        const script = injectJsonLd(fields, makeOffer(), null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data.description).to.equal('Photo editing software');
    });

    it('strips HTML from description', () => {
        const fields = makeFields({
            description: {
                value: '<b>Bold</b> and <em>italic</em> text',
            },
        });
        const script = injectJsonLd(fields, makeOffer(), null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data.description).to.equal('Bold and italic text');
    });

    it('omits description when not provided', () => {
        const script = injectJsonLd(makeFields(), makeOffer(), null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data).to.not.have.property('description');
    });

    it('converts single mnemonic icon to image with suffix', () => {
        const fields = makeFields({
            mnemonicIcon: ['https://cdn.adobe.com/icon.svg'],
        });
        const script = injectJsonLd(fields, makeOffer(), null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data.image).to.equal(
            'https://cdn.adobe.com/icon.svg?format=png&width=800&height=800',
        );
    });

    it('converts multiple mnemonic icons to image array', () => {
        const fields = makeFields({
            mnemonicIcon: [
                'https://cdn.adobe.com/a.svg',
                'https://cdn.adobe.com/b.svg',
            ],
        });
        const script = injectJsonLd(fields, makeOffer(), null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data.image).to.be.an('array').with.length(2);
        expect(data.image[0]).to.include('?format=png');
    });

    it('omits image when mnemonicIcon is empty', () => {
        const fields = makeFields({ mnemonicIcon: [] });
        const script = injectJsonLd(fields, makeOffer(), null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data).to.not.have.property('image');
    });

    it('omits image when mnemonicIcon is not provided', () => {
        const script = injectJsonLd(makeFields(), makeOffer(), null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data).to.not.have.property('image');
    });

    it('supports CAD currency from offer analytics', () => {
        const offer = makeOffer({ currencyCode: 'CAD', price: 68.99 });
        const script = injectJsonLd(makeFields(), offer, null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data.offers[0].priceCurrency).to.equal('CAD');
    });

    it('supports EUR currency from offer analytics', () => {
        const offer = makeOffer({ currencyCode: 'EUR', price: 35.99 });
        const script = injectJsonLd(makeFields(), offer, null, PAGE_URL);
        const data = JSON.parse(script.textContent);
        expect(data.offers[0].priceCurrency).to.equal('EUR');
    });
});
