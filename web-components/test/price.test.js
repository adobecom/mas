import {
    ERROR_MESSAGE_OFFER_NOT_FOUND,
    STATE_FAILED,
    STATE_RESOLVED,
} from '../src/constants.js';
import { InlinePrice } from '../src/inline-price.js';
import { Price } from '../src/price.js';
import { getSettings } from '../src/settings.js';
import priceLiteralsJson from '../price-literals.json' with { type: 'json' };
import { equalsCaseInsensitive } from '@dexter/tacocat-core';
import { FF_DEFAULTS } from '../src/constants.js';
import { mockFetch } from './mocks/fetch.js';
import { mockLana, unmockLana } from './mocks/lana.js';
import * as snapshots from './price/__snapshots__/price.snapshots.js';
import { withWcs } from './mocks/wcs.js';
import {
    initMasCommerceService,
    expect,
    removeMasCommerceService,
} from './utilities.js';
import { MasError } from '../src/mas-error.js';
import '../src/mas.js';
import { Defaults } from '../src/defaults.js';
import {
    splitFormattedPrice,
    formatRegularPrice,
} from '../src/price/utilities.js';
import { sumOffers } from '../src/utilities.js';

/**
 * @param {string} wcsOsi
 * @param {Commerce.Price.AnyOptions} options
 * @returns {Commerce.Price.Placeholder}
 */
function mockInlinePrice(id, wcsOsi = '', options = {}) {
    const element = InlinePrice.createInlinePrice({ ...options, wcsOsi });
    const p = document.createElement('p');
    p.id = id;
    p.append(element);
    document.body.append(p);
    return element;
}

before(() => {
    const metaDefaultFlag = document.createElement('meta');
    metaDefaultFlag.name = FF_DEFAULTS;
    metaDefaultFlag.content = 'on';
    document.head.appendChild(metaDefaultFlag);
});

afterEach(() => {
    removeMasCommerceService();
    unmockLana();
});

beforeEach(async () => {
    await mockFetch(withWcs);
    mockLana();
});

describe('class "InlinePrice"', () => {
    it('renders price', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('price', 'puf');
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(snapshots.price);
        expect(inlinePrice.value).to.be.not.empty;
        expect(inlinePrice.options).to.be.not.empty;
    });

    it('re-dispatches click event', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('puf2', 'puf');
        let targetIsInlinePrice = false;
        inlinePrice.addEventListener(
            'click',
            (event) => {
                targetIsInlinePrice = event.target === inlinePrice;
            },
            { once: true },
        );
        await inlinePrice.onceSettled();
        inlinePrice.firstElementChild.dispatchEvent(
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
            }),
        );
        expect(targetIsInlinePrice).to.be.true;
    });

    it('re-dispatches click event', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('puf3', 'puf');
        let targetIsInlinePrice = false;
        inlinePrice.addEventListener(
            'click',
            (event) => {
                targetIsInlinePrice = event.target === inlinePrice;
            },
            { once: true },
        );
        await inlinePrice.onceSettled();
        inlinePrice.firstElementChild.dispatchEvent(
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
            }),
        );
        expect(targetIsInlinePrice).to.be.true;
    });

    it('renders strikethrough price', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('strikethrough', 'puf');
        Object.assign(inlinePrice.dataset, { template: 'strikethrough' });
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(snapshots.strikethrough);
    });

    it('renders optical price', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('optical', 'puf');
        Object.assign(inlinePrice.dataset, {
            template: 'optical',
            displayPerUnit: true,
            displayTax: true,
        });
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(snapshots.optical);
    });

    it('renders annual price', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('annual', 'puf');
        Object.assign(inlinePrice.dataset, { template: 'annual' });
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(snapshots.annual);
    });

    it('renders default promo price: old and new price', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('promo', 'abm-promo');
        inlinePrice.dataset.promotionCode = 'nicopromo';
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(snapshots.promo);
    });

    it('renders promo price with old price set to true: old and new price', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('promo', 'abm-promo');
        inlinePrice.dataset.promotionCode = 'nicopromo';
        inlinePrice.dataset.displayOldPrice = 'true';
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(snapshots.promoWithOldPrice);
    });

    it('renders promo price with displayOldPrice=false: only new price', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('promo', 'abm-promo');
        inlinePrice.dataset.promotionCode = 'nicopromo';
        inlinePrice.dataset.displayOldPrice = 'false';
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(
            snapshots.promoWithOldPriceFalse,
        );
    });

    it('renders strikethrough promo price: only old strikethrough price', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('strikethrough', 'abm-promo');
        inlinePrice.dataset.promotionCode = 'nicopromo';
        inlinePrice.dataset.displayOldPrice = 'true'; // should make no impact on strikethrough
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(snapshots.promoStrikethrough);
    });

    it('overrides price literals', async () => {
        const commerce = initMasCommerceService();
        const disposer = commerce.providers.price((element, options) => {
            options.literals = {
                recurrenceLabel: 'every month',
            };
        });
        const inlinePrice = mockInlinePrice('customLiterals', 'abm');
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(snapshots.customLiterals);
        disposer();
        inlinePrice.dataset.wcsOsi = 'puf'; // to force a re-render
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(snapshots.price);
    });

    it('does not render failed price', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('xyz', 'xyz');
        inlinePrice.innerHTML = 'test';
        try {
            await inlinePrice.onceSettled();
            // Should not reach here
            expect.fail('Promise should have been rejected');
        } catch (error) {
            // Verify it's a MasError instance
            expect(error).to.be.instanceOf(MasError);
            expect(error.context).to.have.property('measure');
            expect(error.context).to.include({
                status: 404,
                url: 'https://www.adobe.com//web_commerce_artifact?offer_selector_ids=xyz&country=US&locale=en_US&landscape=PUBLISHED&api_key=wcms-commerce-ims-ro-user-milo&language=MULT',
            });
        }
        expect(inlinePrice.querySelector('span.price')).to.be.null;
    });

    it('does not render missing offer', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('noOffer', 'no-offer');
        await expect(inlinePrice.onceSettled()).to.be.eventually.rejectedWith(
            ERROR_MESSAGE_OFFER_NOT_FOUND,
        );
        expect(inlinePrice.innerHTML).to.be.empty;
    });

    it('does not override missing offer with strikethrough', async () => {
        initMasCommerceService();
        const failedPrice = mockInlinePrice('noOffer', 'no-offer');
        Object.assign(failedPrice.dataset, { template: 'price' });
        const strikethroughPrice = InlinePrice.createInlinePrice({
            wcsOsi: 'puf',
        });
        Object.assign(strikethroughPrice.dataset, {
            template: 'strikethrough',
        });
        failedPrice.parentElement.append(strikethroughPrice);
        await strikethroughPrice.onceSettled();
        await expect(failedPrice.onceSettled()).to.be.eventually.rejectedWith(
            ERROR_MESSAGE_OFFER_NOT_FOUND,
        );
        expect(failedPrice.innerHTML).to.be.empty;
    });

    it('renders perpetual offer', async () => {
        initMasCommerceService();
        const inlinePrice = mockInlinePrice('perpetual', 'perpetual', {
            perpetual: true,
        });
        await inlinePrice.onceSettled();
        // expect(inlinePrice.outerHTML).to.be.empty;
        expect(fetch.lastCall.args[0]).to.not.contain('language=');
        // no more perpetual offer
        inlinePrice.dataset.perpetual = 'false';
        await expect(inlinePrice.onceSettled()).to.be.eventually.rejectedWith(
            ERROR_MESSAGE_OFFER_NOT_FOUND,
        );
        expect(fetch.lastCall.args[0]).to.contain('language=MULT');
    });

    it('renders tax exclusive price', async () => {
        await initMasCommerceService({ country: 'CA', language: 'en' });
        const inlinePrice = mockInlinePrice('taxExclusive');
        inlinePrice.dataset.wcsOsi = 'abm-promo';
        inlinePrice.dataset.displayTax = 'true';
        inlinePrice.dataset.forceTaxExclusive = 'true';
        inlinePrice.dataset.promotionCode = 'nicopromo';
        inlinePrice.dataset.displayOldPrice = 'false';
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(snapshots.taxExclusive);
    });

    it('renders discount percentage', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('discount', 'abm-promo');
        inlinePrice.dataset.template = 'discount';
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(snapshots.discount);
    });

    it('renders no discount markup', async () => {
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('noDiscount', 'abm');
        inlinePrice.dataset.template = 'discount';
        await inlinePrice.onceSettled();
        expect(inlinePrice.outerHTML).to.be.html(snapshots.noDiscount);
    });

    it('it recovers after first request fails', async () => {
        const commerce = await initMasCommerceService();
        const inlinePrice = mockInlinePrice(
            'successAfterFail',
            'success-after-fail',
        );
        try {
            await inlinePrice.onceSettled();
            expect.fail('Promise should have been rejected');
        } catch (error) {
            // expected
        }
        expect(inlinePrice.masElement.state).to.equal(STATE_FAILED);
        commerce.refreshOffers();
        await inlinePrice.onceSettled();
        expect(inlinePrice.masElement.state).to.equal(STATE_RESOLVED);
    });

    describe('property "isInlinePrice"', () => {
        it('returns true', async () => {
            await initMasCommerceService();
            const inlinePrice = mockInlinePrice('abm1', 'abm');
            expect(inlinePrice.isInlinePrice).to.be.true;
        });
    });

    describe('method "renderOffers"', () => {
        it('fails placeholder if "orders" array is empty', async () => {
            await initMasCommerceService();
            const inlinePrice = mockInlinePrice('abm2', 'abm');
            inlinePrice.renderOffers([]);
            expect(inlinePrice.state).to.equal(InlinePrice.STATE_FAILED);
        });

        it('alternativePrice option test for aria label: both price should have sr-only.', async () => {
            await initMasCommerceService();
            const p = document.createElement('p');
            p.id = 'alternativePrice';
            document.body.append(p);
            const inlinePrice = mockInlinePrice('abm3', 'abm-promo');
            Object.assign(inlinePrice.dataset, { template: 'strikethrough' });
            const inlinePrice2 = mockInlinePrice('abm4', 'abm-promo');
            p.append(inlinePrice, inlinePrice2);
            await inlinePrice.onceSettled();
            await inlinePrice2.onceSettled();
            const srOnlyLabels = p.querySelectorAll('sr-only');
            expect(srOnlyLabels.length).to.equal(2);
        });
    });

    describe('method "requestUpdate"', () => {
        it('has requestUpdate method', async () => {
            await initMasCommerceService();
            const inlinePrice = mockInlinePrice('abm5', 'abm');
            inlinePrice.requestUpdate();
        });
    });

    describe('default display tax', () => {
        const getPriceLiterals = (settings, priceLiterals) => {
            //we are expecting an array of objects with lang and literals
            if (Array.isArray(priceLiterals)) {
                const find = (language) =>
                    priceLiterals.find((candidate) =>
                        equalsCaseInsensitive(candidate.lang, language),
                    );
                const literals =
                    find(settings.language) ?? find(Defaults.language);
                if (literals) return Object.freeze(literals);
            }
            return {};
        };

        const TESTS = [
            {
                locale: 'AE_ar',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'AE_en',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'AT_de',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'BE_en',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'BE_fr',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'BE_nl',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'BG_bg',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'CH_de',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'CH_fr',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'CH_it',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'AZ_en',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'AZ_ru',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'CZ_cs',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'DE_de',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'DK_da',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'EE_et',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'EG_ar',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'EG_en',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'ES_es',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'FI_fi',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'FR_fr',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'GR_el',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'GR_en',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'HU_hu',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'IE_en',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'IL_en',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'IL_iw',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'IT_it',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'KW_ar',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'KW_en',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'LT_lt',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'LU_de',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'LU_en',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'LU_fr',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'LV_lv',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'DZ_ar',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'DZ_en',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'NG_en',
                expected: [
                    [true, false],
                    [true, false],
                    [true, false],
                    [true, false],
                ],
            },
            {
                locale: 'NL_nl',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'NO_nb',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'PL_pl',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'PT_pt',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'QA_ar',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'QA_en',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'RO_ro',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'RU_ru',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'SA_ar',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'SA_en',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'SE_sv',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'SI_sl',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'SK_sk',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'TR_tr',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'UA_uk',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'MU_en',
                expected: [
                    [true, true],
                    [true, true],
                    [true, true],
                    [true, true],
                ],
            },
            {
                locale: 'AU_en',
                expected: [
                    [true, false],
                    [true, false],
                    [true, false],
                    [true, false],
                ],
            },
            {
                locale: 'HK_en',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'ID_en',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'ID_in',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'IN_en',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'IN_hi',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'JP_ja',
                expected: [
                    [true, false],
                    [true, false],
                    [true, false],
                    [true, false],
                ],
            },
            {
                locale: 'KR_ko',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'MY_en',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'MY_ms',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'NZ_en',
                expected: [
                    [true, false],
                    [true, false],
                    [true, false],
                    [true, false],
                ],
            },
            {
                locale: 'PH_en',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'PH_fil',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'SG_en',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'TH_en',
                expected: [
                    [true, false],
                    [true, false],
                    [true, false],
                    [true, false],
                ],
            },
            {
                locale: 'TH_th',
                expected: [
                    [true, false],
                    [true, false],
                    [true, false],
                    [true, false],
                ],
            },
            {
                locale: 'VN_en',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'VN_vi',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'AR_es',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'BR_pt',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'CA_en',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'CA_fr',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'CL_es',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'CO_es',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'CR_es',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'EC_es',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'GT_es',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'LA_es',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'MX_es',
                expected: [
                    [true, false],
                    [true, true],
                    [true, false],
                    [true, true],
                ],
            },
            {
                locale: 'PE_es',
                expected: [
                    [true, false],
                    [true, false],
                    [true, false],
                    [true, false],
                ],
            },
            {
                locale: 'PR_es',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
            {
                locale: 'US_en',
                expected: [
                    [false, false],
                    [false, false],
                    [false, false],
                    [false, false],
                ],
            },
        ];
        //.filter((test) => test.locale === 'BE_en');  uncomment to run only one test

        const SEGMENTS = ['individual', 'business', 'student', 'university'];

        TESTS.forEach((test) => {
            SEGMENTS.forEach((segment, index) => {
                it(`renders price with tax info for "${test.locale}" and "${segment}"`, async () => {
                    const localeArray = test.locale.split('_');
                    const country = localeArray[0];
                    const language = localeArray[1];
                    await initMasCommerceService({ country, language });
                    const literals = await getPriceLiterals(
                        {
                            language,
                        },
                        priceLiteralsJson.data,
                    );

                    const inlinePrice = mockInlinePrice(segment, segment);
                    inlinePrice.removeAttribute('data-display-tax');
                    inlinePrice.removeAttribute('data-force-tax-exclusive');
                    await inlinePrice.onceSettled();
                    const priceTaxElement = inlinePrice.querySelector(
                        '.price-tax-inclusivity',
                    );
                    if (test.expected[index][0]) {
                        expect(priceTaxElement.classList.contains('disabled'))
                            .to.be.false;
                        let taxInclExclLabel;
                        if (test.expected[index][1]) {
                            // forceTaxExclusive: true
                            taxInclExclLabel = literals.taxExclusiveLabel;
                        } else {
                            taxInclExclLabel = literals.taxInclusiveLabel;
                        }
                        const taxLabel =
                            taxInclExclLabel.match(/TAX \{(.*?)\}/)[1];
                        expect(priceTaxElement.textContent).to.equal(taxLabel);
                    } else {
                        expect(priceTaxElement.classList.contains('disabled'))
                            .to.be.true;
                    }
                });
            });
        });
    });
});

describe('commerce service', () => {
    const offers = [
        {
            priceDetails: {
                price: 32.98,
                priceWithoutTax: 29.99,
                usePrecision: true,
                formatString: "'A$'#,##0.00",
                taxDisplay: 'TAX_INCLUSIVE_DETAILS',
                taxTerm: 'GST',
            },
            planType: 'ABM',
        },
    ];
    describe('function "buildPriceHTML"', () => {
        it('returns empty string if no offers provided', async () => {
            const { buildPriceHTML } = initMasCommerceService();
            expect(buildPriceHTML([])).to.be.empty;
        });

        it('does not pick the promo template when the offer carries no promotion, even if promotionCode is in scope', async () => {
            const { buildPriceHTML } = await initMasCommerceService();
            const nonPromoAbmOffer = [
                {
                    priceDetails: {
                        price: 43.99,
                        formatString: "'A$'#,##0.00",
                    },
                    planType: 'ABM',
                    commitment: 'YEAR',
                    term: 'MONTHLY',
                },
            ];
            expect(() =>
                buildPriceHTML(nonPromoAbmOffer, {
                    country: 'AU',
                    language: 'en',
                    displayAnnual: true,
                    promotionCode: 'CCI_AA_3MO_AUS',
                    template: 'price',
                }),
            ).to.not.throw();
        });
    });

    describe('function "direct price calls"', () => {
        it('works as expected', async () => {
            const service = await initMasCommerceService();
            const { collectPriceOptions, buildPriceHTML } = new Price({
                literals: { price: {} },
                settings: getSettings(service.config, service),
            });
            const inlinePrice1 = mockInlinePrice('abm');
            const options = collectPriceOptions({}, inlinePrice1);
            expect(options).not.to.be.empty;
            buildPriceHTML(
                { priceDetails: {} },
                { template: 'discount', ...options },
            );
            buildPriceHTML(
                { priceDetails: {} },
                { template: 'strikethrough', ...options },
            );
            buildPriceHTML(
                { priceDetails: {} },
                { template: 'optical', ...options },
            );
            buildPriceHTML(
                { priceDetails: {} },
                { template: 'annual', ...options },
            );
            buildPriceHTML(offers, { country: 'US' });
            buildPriceHTML(offers, { country: 'US', promotionCode: 'promo' });
            buildPriceHTML(offers, { country: 'AU' });
            buildPriceHTML(offers, { country: 'AU', promotionCode: 'promo' });
        });
    });

    describe('Soft Bundle (Multiple OSIs)', () => {
        it('renders summed price for US soft bundle', async () => {
            await initMasCommerceService();
            // softbundle-1-us ($19.99) + softbundle-2-us ($24.99) = $44.98
            const inlinePrice = mockInlinePrice(
                {},
                'softbundle-1-us,softbundle-2-us',
            );
            await inlinePrice.onceSettled();
            expect(inlinePrice.outerHTML).to.be.html(snapshots.softBundleUS);
        });

        it('renders summed price for Japan soft bundle', async () => {
            await initMasCommerceService({ country: 'JP', language: 'ja' });
            // softbundle-1-jp (¥3,300) + softbundle-2-jp (¥1,980) = ¥5,280
            const inlinePrice = mockInlinePrice(
                {},
                'softbundle-1-jp,softbundle-2-jp',
            );
            await inlinePrice.onceSettled();
            expect(inlinePrice.outerHTML).to.be.html(snapshots.softBundleJP);
        });

        it('renders summed price for India soft bundle', async () => {
            await initMasCommerceService({ country: 'IN', language: 'hi' });
            // softbundle-1-in (₹944) + softbundle-2-in (₹613.60) = ₹1,557.60
            const inlinePrice = mockInlinePrice(
                {},
                'softbundle-1-in,softbundle-2-in',
            );
            await inlinePrice.onceSettled();
            expect(inlinePrice.outerHTML).to.be.html(snapshots.softBundleIN);
        });

        it('renders summed price for Australia soft bundle with annualized prices', async () => {
            await initMasCommerceService({ country: 'AU', language: 'en' });
            // softbundle-1-au (A$31.99) + softbundle-2-au (A$39.99) = A$71.98
            // annualizedPrice: A$383.88 + A$479.88 = A$863.76
            const inlinePrice = mockInlinePrice(
                {},
                'softbundle-1-au,softbundle-2-au',
            );
            await inlinePrice.onceSettled();
            expect(inlinePrice.outerHTML).to.be.html(snapshots.softBundleAU);
            // Verify annualized prices are summed correctly in the value
            // value is an array of offers, first element is the summed offer
            const [summedOffer] = inlinePrice.value;
            const { annualized } = summedOffer.priceDetails;
            expect(annualized.annualizedPrice).to.equal(863.76);
            expect(annualized.annualizedPriceWithoutTax).to.equal(785.16);
        });

        it('fails when one OSI exists but another does not (CA partial failure)', async () => {
            await initMasCommerceService({ country: 'CA', language: 'en' });
            // softbundle-1-ca exists, but softbundle-2-ca does NOT exist - should fail
            const inlinePrice = mockInlinePrice(
                {},
                'softbundle-1-ca,softbundle-2-ca',
            );
            try {
                await inlinePrice.onceSettled();
                expect.fail('Should have thrown an error');
            } catch (error) {
                // Error is thrown when any OSI fails
                expect(error).to.be.instanceOf(Error);
            }
            expect(inlinePrice.classList.contains('placeholder-failed')).to.be
                .true;
        });
    });
});

describe('priceInfo (pre-formatted WCS price)', () => {
    const usFormat = "'US$'#,##0.00";
    const usRegular = {
        offerSelectorIds: ['pi-regular'],
        priceDetails: {
            price: 69.99,
            formatString: usFormat,
            usePrecision: true,
        },
        commitment: 'YEAR',
        term: 'MONTHLY',
        planType: 'ABM',
    };
    const opts = { country: 'US', language: 'en', template: 'price' };
    const withInfo = (offer, priceInfo) => ({ ...offer, priceInfo });

    describe('splitFormattedPrice', () => {
        it('splits a real WCS string into the same parts as numeric formatting', () => {
            const split = splitFormattedPrice('US$69.99', usFormat, true);
            const { accessiblePrice, recurrenceTerm, ...numeric } =
                formatRegularPrice({
                    commitment: 'YEAR',
                    term: 'MONTHLY',
                    formatString: usFormat,
                    price: 69.99,
                    usePrecision: true,
                });
            expect(split).to.deep.equal(numeric);
        });

        // Delimiter-collision locales (real repo formatStrings): the splitter must
        // key off formatString, not guess. Each asserts split === numeric decomposition.
        [
            {
                name: 'de-DE space grouping + comma decimal',
                formatString: "# ##0,00 '&euro;'",
                price: 1199,
                usePrecision: true,
                formatted: '1 199,00 &euro;',
            },
            {
                name: 'JPY currency-last, no precision',
                formatString: "#,##0 '&#20870;'",
                price: 1199,
                usePrecision: false,
                formatted: '1,199 &#20870;',
            },
            {
                name: 'BR dot grouping + comma decimal',
                formatString: "'R$' #.##0,00",
                price: 3840,
                usePrecision: true,
                formatted: 'R$ 3.840,00',
            },
            {
                name: 'AR dot grouping + comma decimal',
                formatString: "'Ar$' #.##0,00",
                price: 79700,
                usePrecision: true,
                formatted: 'Ar$ 79.700,00',
            },
            {
                name: 'AUD symbol-first, comma grouping',
                formatString: "'A$'#,##0.00",
                price: 1151.88,
                usePrecision: true,
                formatted: 'A$1,151.88',
            },
            {
                name: 'KRW symbol-first, no precision',
                formatString: "'&#8361;'#,##0",
                price: 129000,
                usePrecision: false,
                formatted: '&#8361;129,000',
            },
        ].forEach(({ name, formatString, price, usePrecision, formatted }) => {
            it(`splits ${name} identically to numeric formatting`, () => {
                const { accessiblePrice, recurrenceTerm, ...numeric } =
                    formatRegularPrice({
                        commitment: 'YEAR',
                        term: 'MONTHLY',
                        formatString,
                        price,
                        usePrecision,
                    });
                expect(
                    splitFormattedPrice(formatted, formatString, usePrecision),
                ).to.deep.equal(numeric);
            });
        });

        it('splits a no-precision string (no decimals)', () => {
            expect(
                splitFormattedPrice('¥1,199', "'¥'#,##0", false),
            ).to.deep.equal({
                currencySymbol: '¥',
                integer: '1,199',
                decimalsDelimiter: '',
                decimals: '',
                isCurrencyFirst: true,
                hasCurrencySpace: false,
            });
        });

        it('returns null when the currency symbol is absent from the string', () => {
            // formatString symbol is the "&euro;" entity; a raw "€" will not match
            expect(
                splitFormattedPrice('1.234,56 €', "# ##0,00 '&euro;'", true),
            ).to.equal(null);
        });

        it('returns null on parse mismatch (missing decimal delimiter)', () => {
            expect(splitFormattedPrice('US$6999', usFormat, true)).to.equal(
                null,
            );
        });

        it('returns null for a non-string input', () => {
            expect(splitFormattedPrice(undefined, usFormat, true)).to.equal(
                null,
            );
        });
    });

    describe('buildPriceHTML parity (split path === numeric path)', () => {
        let buildPriceHTML;
        beforeEach(async () => {
            ({ buildPriceHTML } = await initMasCommerceService());
        });

        it('regular price from priceInfo renders identically to numeric', () => {
            const numeric = buildPriceHTML([usRegular], opts);
            const info = buildPriceHTML(
                [
                    withInfo(usRegular, {
                        price: 'US$69.99',
                        usePrecision: true,
                    }),
                ],
                opts,
            );
            expect(info).to.equal(numeric);
            expect(info).to.contain('69');
        });

        // Closes the "no client-side formatting on top of priceInfo" AC: the
        // visible price value must be WCS's string verbatim. The split only
        // arranges it into spans; it must not re-group, re-symbol, or reorder.
        it('renders the priceInfo value verbatim (no reformatting on top)', () => {
            const html = buildPriceHTML(
                [
                    withInfo(usRegular, {
                        price: 'US$69.99',
                        usePrecision: true,
                    }),
                ],
                opts,
            );
            const el = document.createElement('div');
            el.innerHTML = html;
            const value = [
                'currency-symbol',
                'integer',
                'decimals-delimiter',
                'decimals',
            ]
                .map((c) => el.querySelector(`.price-${c}`)?.textContent ?? '')
                .join('');
            expect(value).to.equal('US$69.99');
        });

        it('non-promo annualized from priceInfo renders identically to numeric', () => {
            const annualOffer = {
                ...usRegular,
                priceDetails: {
                    price: 69.99,
                    formatString: usFormat,
                    usePrecision: true,
                    annualized: { annualizedPrice: 839.88 },
                },
            };
            const annualOpts = { ...opts, template: 'annual' };
            const numeric = buildPriceHTML([annualOffer], annualOpts);
            const info = buildPriceHTML(
                [
                    withInfo(annualOffer, {
                        annualized: { annualizedPrice: 'US$839.88' },
                    }),
                ],
                annualOpts,
            );
            expect(info).to.equal(numeric);
        });

        it('tax-exclusive uses priceInfo.priceWithoutTax, not priceInfo.price', () => {
            const exclusiveOffer = {
                ...usRegular,
                priceDetails: {
                    price: 69.99,
                    formatString: usFormat,
                    usePrecision: true,
                    taxDisplay: 'TAX_EXCLUSIVE',
                    taxTerm: 'TAX',
                },
            };
            const numeric = buildPriceHTML([exclusiveOffer], opts);
            const info = buildPriceHTML(
                [
                    withInfo(exclusiveOffer, {
                        price: 'US$0.00', // wrong value; must be ignored when tax-exclusive
                        priceWithoutTax: 'US$69.99',
                        usePrecision: true,
                    }),
                ],
                opts,
            );
            expect(info).to.equal(numeric);
        });

        // Fallback-only in prod today (WCS does not emit priceInfo.priceWithoutDiscount),
        // but the wired branch must be correct for when WCS ships the field.
        it('strikethrough uses priceInfo.priceWithoutDiscount when WCS supplies it', () => {
            const discounted = {
                ...usRegular,
                priceDetails: {
                    price: 43.99,
                    priceWithoutDiscount: 54.99,
                    formatString: usFormat,
                    usePrecision: true,
                },
            };
            const stOpts = { ...opts, template: 'strikethrough' };
            const numeric = buildPriceHTML([discounted], stOpts);
            const info = buildPriceHTML(
                [
                    withInfo(discounted, {
                        price: 'US$43.99',
                        priceWithoutDiscount: 'US$54.99',
                        usePrecision: true,
                    }),
                ],
                stOpts,
            );
            expect(info).to.equal(numeric);
            expect(info).to.contain('54'); // the struck without-discount value
        });

        it('falls back to numeric on parse mismatch', () => {
            const numeric = buildPriceHTML([usRegular], opts);
            const info = buildPriceHTML(
                [withInfo(usRegular, { price: 'US$6999', usePrecision: true })],
                opts,
            );
            expect(info).to.equal(numeric);
        });

        it('ignores priceInfo when displayFormatted is false', () => {
            const dfOpts = { ...opts, displayFormatted: false };
            const numeric = buildPriceHTML([usRegular], dfOpts);
            const info = buildPriceHTML(
                [withInfo(usRegular, { price: 'US$0.00', usePrecision: true })],
                dfOpts,
            );
            expect(info).to.equal(numeric);
        });

        it('ignores priceInfo for India (numeric hi-IN guard)', () => {
            const inOffer = {
                ...usRegular,
                priceDetails: {
                    price: 69.99,
                    formatString: "'₹'#,##,##0.00",
                    usePrecision: true,
                },
            };
            const inOpts = { country: 'IN', language: 'hi', template: 'price' };
            const numeric = buildPriceHTML([inOffer], inOpts);
            const info = buildPriceHTML(
                [withInfo(inOffer, { price: '₹0.00', usePrecision: true })],
                inOpts,
            );
            expect(info).to.equal(numeric);
        });
    });
});

describe('priceDetails-only paths (priceInfo dropped)', () => {
    it('sumOffers (soft bundle) drops priceInfo so the sum renders numerically', () => {
        const base = {
            offerSelectorIds: ['sb-1'],
            priceDetails: { price: 19.99, usePrecision: true },
            // A stale WCS string that must not survive summation.
            priceInfo: { price: 'US$19.99', usePrecision: true },
        };
        const summed = sumOffers([
            base,
            {
                ...base,
                offerSelectorIds: ['sb-2'],
                priceDetails: { price: 24.99, usePrecision: true },
                priceInfo: { price: 'US$24.99', usePrecision: true },
            },
        ]);
        expect(summed.priceInfo).to.equal(undefined);
        expect(summed.priceDetails.price).to.equal(44.98);
    });

    it('dual-OSI discount computes from priceDetails and ignores priceInfo', async () => {
        // Inject a bogus priceInfo on every resolved offer; the cross-offer
        // discount must still compute 20% from priceDetails (43.99 vs 54.99).
        const withBogusPriceInfo = async (originalFetch) => {
            const inner = await withWcs(originalFetch);
            return async (req) => {
                const res = await inner(req);
                if (res === false || !res.ok) return res;
                const body = await res.json();
                body.resolvedOffers = body.resolvedOffers.map((o) => ({
                    ...o,
                    priceInfo: { price: 'US$0.00', usePrecision: true },
                }));
                return { ...res, json: async () => body };
            };
        };
        await mockFetch(withBogusPriceInfo);
        await initMasCommerceService();
        const inlinePrice = mockInlinePrice('crossDiscount', 'abm-promo,abm');
        inlinePrice.dataset.template = 'discount';
        await inlinePrice.onceSettled();
        expect(inlinePrice.querySelector('.discount').textContent).to.equal(
            '20%',
        );
    });
});
