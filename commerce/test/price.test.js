import {
    ERROR_MESSAGE_BAD_REQUEST,
    ERROR_MESSAGE_OFFER_NOT_FOUND,
} from '../src/constants.js';
import { InlinePrice } from '../src/inline-price.js';
import { definePlaceholder } from '../src/placeholder.js';
import { initService, resetService } from '../src/service.js';

import { mockConfig } from './mocks/config.js';
import { mockFetch, unmockFetch } from './mocks/fetch.js';
import { mockLana, unmockLana } from './mocks/lana.js';
import snapshots from './mocks/snapshots.js';
import { expect } from './utilities.js';

/**
 * @param {string} wcsOsi
 * @param {Commerce.Price.AnyOptions} options
 * @returns {Commerce.Price.Placeholder}
 */
function mockInlinePrice(wcsOsi = '', options = {}, append = true) {
    const element = InlinePrice.createInlinePrice({ ...options, wcsOsi });
    if (append) document.body.append(element, document.createElement('br'));
    return element;
}

/** @type {import('sinon').SinonStub} */
let fetch;

afterEach(() => {
    document.body.innerHTML = '';
    resetService();
    unmockFetch();
    unmockLana();
});

beforeEach(async () => {
    fetch = await mockFetch();
    mockLana();
});

describe('class "InlinePrice"', () => {
    it('renders price', async () => {
        await initService(mockConfig(), true);
        const inlinePrice = mockInlinePrice('puf');
        await inlinePrice.onceSettled();
        expect(inlinePrice.innerHTML).to.be.html(snapshots.price);
    });

    it('renders strikethrough price', async () => {
        await initService(mockConfig(), true);
        const inlinePrice = mockInlinePrice('puf');
        Object.assign(inlinePrice.dataset, { template: 'strikethrough' });
        await inlinePrice.onceSettled();
        expect(inlinePrice.innerHTML).to.be.html(snapshots.strikethrough);
    });

    it('renders optical price', async () => {
        await initService(mockConfig(), true);
        const inlinePrice = mockInlinePrice('puf');
        Object.assign(inlinePrice.dataset, {
            template: 'optical',
            displayPerUnit: true,
            displayTax: true,
        });
        await inlinePrice.onceSettled();
        expect(inlinePrice.innerHTML).to.be.html(snapshots.optical);
    });

    it('renders annual price', async () => {
        await initService(mockConfig(), true);
        const inlinePrice = mockInlinePrice('abm');
        Object.assign(inlinePrice.dataset, { template: 'annual' });
        await inlinePrice.onceSettled();
        expect(inlinePrice.innerHTML).to.be.html(snapshots.annual);
    });

    it('renders price with promo with strikethrough', async () => {
        await initService(mockConfig(), true);
        const inlinePrice = mockInlinePrice('abm-promo');
        inlinePrice.dataset.promotionCode = 'nicopromo';
        await inlinePrice.onceSettled();
        expect(inlinePrice.innerHTML).to.be.html(snapshots.promoStikethrough);
    });

    it('renders price with promo', async () => {
        await initService(mockConfig(), true);
        const inlinePrice = mockInlinePrice('abm-promo');
        inlinePrice.dataset.promotionCode = 'nicopromo';
        inlinePrice.dataset.displayOldPrice = 'false';
        await inlinePrice.onceSettled();
        expect(inlinePrice.innerHTML).to.be.html(snapshots.promo);
    });

    it('renders price with offer data', async () => {
        await initService(mockConfig(), true);
        class InlineOffer extends InlinePrice {
            static is = 'inline-offer';
            static tag = 'span';
            renderOffers(offers, overrides) {
                super.renderOffers(offers, {
                    ...overrides,
                    displayFormatted: false,
                });
                const [
                    {
                        productArrangementCode,
                        commitment,
                        term,
                        customerSegment,
                        offerType,
                        pricePoint,
                    },
                ] = offers;
                const props = [
                    productArrangementCode,
                    commitment,
                    term,
                    customerSegment,
                    offerType,
                    pricePoint,
                ].join(' - ');
                this.textContent = `${this.textContent} - ${props}`;
            }
        }
        definePlaceholder(InlineOffer);
        /** @type {Commerce.Price.Placeholder} */
        // @ts-ignore
        const inlineOffer = document.createElement('span', {
            is: 'inline-offer',
        });
        Object.assign(inlineOffer.dataset, { wcsOsi: 'abm' });
        document.body.appendChild(inlineOffer);
        await inlineOffer.onceSettled();
        expect(inlineOffer.textContent).equal(
            'US$54.99/mo - ccsn_direct_individual - YEAR - MONTHLY - INDIVIDUAL - BASE - REGULAR'
        );
    });

    it('overrides price literals', async () => {
        const commerce = await initService(mockConfig(), true);
        const disposer = commerce.providers.price((element, options) => {
            options.literals = {
                recurrenceLabel: 'every month',
            };
        });
        const inlinePrice = mockInlinePrice('abm');
        await inlinePrice.onceSettled();
        expect(inlinePrice.innerHTML).to.be.html(snapshots.customLiterals);
        disposer();
        inlinePrice.dataset.wcsOsi = 'puf'; // to force a re-render
        await inlinePrice.onceSettled();
        expect(inlinePrice.innerHTML).to.be.html(snapshots.price);
    });

    it('does not render failed price', async () => {
        await initService(mockConfig(), true);
        const inlinePrice = mockInlinePrice('xyz');
        inlinePrice.innerHTML = 'test';
        await expect(inlinePrice.onceSettled()).to.be.eventually.rejectedWith(
            ERROR_MESSAGE_BAD_REQUEST
        );
        expect(inlinePrice.innerHTML).to.be.empty;
    });

    it('does not render missing offer', async () => {
        await initService(mockConfig(), true);
        const inlinePrice = mockInlinePrice('no-offer');
        await expect(inlinePrice.onceSettled()).to.be.eventually.rejectedWith(
            ERROR_MESSAGE_OFFER_NOT_FOUND
        );
        expect(inlinePrice.innerHTML).to.equal('');
    });

    it('renders perpetual offer', async () => {
        await initService(mockConfig(), true);
        const inlinePrice = mockInlinePrice('perpetual', { perpetual: true });
        await inlinePrice.onceSettled();
        // expect(inlinePrice.innerHTML).to.be.empty;
        expect(fetch.lastCall.args[0]).to.contain('language=EN');
        // no more perpetual offer
        inlinePrice.dataset.perpetual = 'false';
        await expect(inlinePrice.onceSettled()).to.be.eventually.rejectedWith(
            ERROR_MESSAGE_OFFER_NOT_FOUND
        );
        expect(fetch.lastCall.args[0]).to.contain('language=MULT');
    });

    it('renders tax exclusive price', async () => {
        await initService(
            mockConfig({
                forceTaxExclusive: true,
            }),
            true
        );
        const inlinePrice = mockInlinePrice('tax-exclusive');
        inlinePrice.dataset.promotionCode = 'nicopromo';
        await inlinePrice.onceSettled();
        expect(inlinePrice.innerHTML).to.be.html(snapshots.taxExclusive);
    });

    it('renders discount percentage', async () => {
        await initService(mockConfig(), true);
        const inlinePrice = mockInlinePrice('abm-promo');
        inlinePrice.dataset.template = 'discount';
        await inlinePrice.onceSettled();
        expect(inlinePrice.innerHTML).to.be.html(snapshots.discount);
    });

    it('renders no discount markup', async () => {
        await initService(mockConfig(), true);
        const inlinePrice = mockInlinePrice('abm');
        inlinePrice.dataset.template = 'discount';
        await inlinePrice.onceSettled();
        expect(inlinePrice.innerHTML).to.be.html(snapshots.noDiscount);
    });

    describe('property "isInlinePrice"', () => {
        it('returns true', async () => {
            await initService(mockConfig(), true);
            const inlinePrice = mockInlinePrice('abm');
            expect(inlinePrice.isInlinePrice).to.be.true;
        });
    });

    describe('method "renderOffers"', () => {
        it('fails placeholder if "orders" array is empty', async () => {
            await initService(mockConfig(), true);
            const inlinePrice = mockInlinePrice('abm');
            inlinePrice.renderOffers([], {}, inlinePrice.togglePending());
            expect(inlinePrice.state).to.equal(InlinePrice.STATE_FAILED);
        });
    });

    describe('method "updateOptions"', () => {
        it('updates element data attributes', async () => {
            await initService(mockConfig(), true);
            const inlinePrice = InlinePrice.createInlinePrice({
                template: 'price',
                wcsOsi: 'abm',
            });
            const options = {
                displayOldPrice: true,
                displayPerUnit: true,
                displayRecurrence: true,
                displayTax: true,
                forceTaxExclusive: true,
                perpetual: true,
                promotionCode: 'promo',
                quantity: ['1', '2'],
                template: 'priceOptical',
                wcsOsi: ['m2m', 'puf'],
            };
            inlinePrice.updateOptions(options);
            const { dataset } = inlinePrice;
            expect(dataset.displayOldPrice).to.equal(
                String(options.displayOldPrice)
            );
            expect(dataset.displayPerUnit).to.equal(
                String(options.displayPerUnit)
            );
            expect(dataset.displayRecurrence).to.equal(
                String(options.displayRecurrence)
            );
            expect(dataset.displayTax).to.equal(String(options.displayTax));
            expect(dataset.forceTaxExclusive).to.equal(
                String(options.forceTaxExclusive)
            );
            expect(dataset.perpetual).to.equal(String(options.perpetual));
            expect(dataset.promotionCode).to.equal(
                String(options.promotionCode)
            );
            expect(dataset.quantity).to.equal(String(options.quantity));
            expect(dataset.template).to.equal(String(options.template));
            expect(dataset.wcsOsi).to.equal(String(options.wcsOsi));
        });
    });

    describe('static method "getInlinePrices"', () => {
        it('returns list of found links', async () => {
            await initService(mockConfig(), true);
            const inlinePrice1 = mockInlinePrice('abm');
            const inlinePrice2 = mockInlinePrice('m2m');
            expect(InlinePrice.getInlinePrices()).to.deep.equal([
                inlinePrice1,
                inlinePrice2,
            ]);
        });
    });
});

describe('commerce service', () => {
    describe('function "buildPriceHTML"', () => {
        it('returns empty string if no orders provided', async () => {
            const { buildPriceHTML } = await initService(mockConfig(), true);
            expect(buildPriceHTML([])).to.be.empty;
        });
    });
});
