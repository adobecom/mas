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

// Real WCS stage payloads (wcs-stage.adobe.io, landscape=ALL). Each case is the
// priceDetails/priceInfo pair for one country, so the tree the client indexes is
// the tree WCS actually sends.
describe('priceInfo (WCS pre-split tree)', () => {
    const opts = { country: 'US', language: 'en', template: 'price' };
    const withInfo = (offer, priceInfo) => ({ ...offer, priceInfo });

    const abm = {
        US: {
            priceDetails: {
                price: 109,
                annualized: { annualizedPrice: 1308 },
                usePrecision: true,
                formatString: "'US$'#,##0.00",
                taxDisplay: 'TAX_EXCLUSIVE',
                taxTerm: 'TAX',
            },
            priceInfo: {
                format: {
                    currencySymbol: 'US$',
                    decimalsDelimiter: '.',
                    usePrecision: true,
                    isCurrencyFirst: true,
                    hasCurrencySpace: false,
                },
                recurrence: { term: 'MONTHLY' },
                asIs: {
                    withDiscount: {
                        withTax: {
                            integer: '109',
                            decimals: '00',
                            full: 'US$109.00',
                        },
                    },
                },
                annualized: {
                    withDiscount: {
                        withTax: {
                            integer: '1,308',
                            decimals: '00',
                            full: 'US$1,308.00',
                        },
                    },
                },
            },
            shows: '109',
            annualShows: '1,308',
        },
        // No-precision locale: WCS omits `decimals` entirely on the leaf.
        JP: {
            priceDetails: {
                price: 11990,
                annualized: { annualizedPrice: 143880 },
                usePrecision: false,
                formatString: "#,##0 '&#20870;'",
                taxDisplay: 'TAX_INCLUSIVE_DETAILS',
                taxTerm: 'TAX',
            },
            priceInfo: {
                format: {
                    currencySymbol: '&#20870;',
                    usePrecision: false,
                    isCurrencyFirst: false,
                    hasCurrencySpace: false,
                },
                recurrence: { term: 'MONTHLY' },
                asIs: {
                    withDiscount: {
                        withTax: {
                            integer: '11,990',
                            full: '11,990 &#20870;',
                        },
                    },
                },
                annualized: {
                    withDiscount: {
                        withTax: {
                            integer: '143,880',
                            full: '143,880 &#20870;',
                        },
                    },
                },
            },
            shows: '11,990',
            annualShows: '143,880',
        },
        // India: WCS groups lakh/crore itself, so no client re-grouping.
        IN: {
            priceDetails: {
                price: 9312,
                annualized: { annualizedPrice: 111744 },
                usePrecision: true,
                formatString: "'&#8377;'#,##,##0.00",
                taxDisplay: 'TAX_EXCLUSIVE',
                taxTerm: 'GST',
            },
            priceInfo: {
                format: {
                    currencySymbol: '&#8377;',
                    decimalsDelimiter: '.',
                    usePrecision: true,
                    isCurrencyFirst: true,
                    hasCurrencySpace: false,
                },
                recurrence: { term: 'MONTHLY' },
                asIs: {
                    withDiscount: {
                        withTax: {
                            integer: '9,312',
                            decimals: '00',
                            full: '&#8377;9,312.00',
                        },
                    },
                },
                annualized: {
                    withDiscount: {
                        withTax: {
                            integer: '1,11,744',
                            decimals: '00',
                            full: '&#8377;1,11,744.00',
                        },
                    },
                },
            },
            shows: '9,312',
            annualShows: '1,11,744',
        },
        // Currency-last with a space, dot grouping, comma decimal.
        DE: {
            priceDetails: {
                price: 86.55,
                annualized: { annualizedPrice: 1038.6 },
                usePrecision: true,
                formatString: "#.##0,00 '&euro;'",
                taxDisplay: 'TAX_EXCLUSIVE',
                taxTerm: 'VAT',
            },
            priceInfo: {
                format: {
                    currencySymbol: '&euro;',
                    decimalsDelimiter: ',',
                    usePrecision: true,
                    isCurrencyFirst: false,
                    hasCurrencySpace: true,
                },
                recurrence: { term: 'MONTHLY' },
                asIs: {
                    withDiscount: {
                        withTax: {
                            integer: '86',
                            decimals: '55',
                            full: '86,55 &euro;',
                        },
                    },
                },
                annualized: {
                    withDiscount: {
                        withTax: {
                            integer: '1.038',
                            decimals: '60',
                            full: '1.038,60 &euro;',
                        },
                    },
                },
            },
            shows: '86',
            annualShows: '1.038',
        },
    };

    const offerFor = (country) => ({
        offerSelectorIds: ['pi'],
        commitment: 'YEAR',
        term: 'MONTHLY',
        planType: 'ABM',
        priceDetails: abm[country].priceDetails,
    });

    describe('renders WCS parts verbatim', () => {
        let buildPriceHTML;
        beforeEach(async () => {
            ({ buildPriceHTML } = await initMasCommerceService());
        });

        const partsOf = (html) => {
            const el = document.createElement('div');
            el.innerHTML = html;
            return ['integer', 'decimals-delimiter', 'decimals']
                .map((c) => el.querySelector(`.price-${c}`)?.textContent ?? '')
                .join('');
        };

        Object.keys(abm).forEach((country) => {
            const c = abm[country];
            const countryOpts = { ...opts, country };

            it(`${country}: price matches the numeric path and shows WCS digits`, () => {
                const offer = offerFor(country);
                const numeric = buildPriceHTML([offer], countryOpts);
                const info = buildPriceHTML(
                    [withInfo(offer, c.priceInfo)],
                    countryOpts,
                );
                expect(info).to.equal(numeric);
                expect(partsOf(info)).to.contain(c.shows);
            });

            it(`${country}: annualized indexes the annualized timescale`, () => {
                const offer = offerFor(country);
                const annualOpts = { ...countryOpts, template: 'annual' };
                const numeric = buildPriceHTML([offer], annualOpts);
                const info = buildPriceHTML(
                    [withInfo(offer, c.priceInfo)],
                    annualOpts,
                );
                expect(info).to.equal(numeric);
                expect(partsOf(info)).to.contain(c.annualShows);
            });
        });

        // WCS reports hasCurrencySpace:false for JPY while its own `full` string
        // ("11,990 &#20870;") carries the space, so the client keeps deriving it
        // from formatString. Guards the space from disappearing if that changes.
        it('JP keeps the space before a trailing currency symbol', () => {
            const offer = offerFor('JP');
            const info = buildPriceHTML([withInfo(offer, abm.JP.priceInfo)], {
                ...opts,
                country: 'JP',
            });
            const el = document.createElement('div');
            el.innerHTML = info;
            expect(
                el.querySelector('.price-currency-space')?.innerHTML,
            ).to.equal('&nbsp;');
        });

        // PUF: per-month equivalent now comes from WCS's optical block, which
        // matches opticalPriceRoundingRules (verified on stage across JP/TW/CO/GB/IN).
        it('PUF optical indexes the optical timescale', () => {
            const pufOffer = {
                offerSelectorIds: ['pi-puf'],
                commitment: 'YEAR',
                term: 'ANNUAL',
                planType: 'PUF',
                priceDetails: {
                    price: 263.88,
                    usePrecision: true,
                    formatString: "'US$'#,##0.00",
                    taxDisplay: 'TAX_EXCLUSIVE',
                    taxTerm: 'TAX',
                },
            };
            const pufInfo = {
                format: {
                    currencySymbol: 'US$',
                    decimalsDelimiter: '.',
                    usePrecision: true,
                    isCurrencyFirst: true,
                    hasCurrencySpace: false,
                },
                recurrence: { term: 'ANNUAL' },
                asIs: {
                    withDiscount: {
                        withTax: {
                            integer: '263',
                            decimals: '88',
                            full: 'US$263.88',
                        },
                    },
                },
                optical: {
                    withDiscount: {
                        withTax: {
                            integer: '21',
                            decimals: '99',
                            full: 'US$21.99',
                        },
                    },
                },
            };
            const opticalOpts = { ...opts, template: 'optical' };
            const numeric = buildPriceHTML([pufOffer], opticalOpts);
            const info = buildPriceHTML(
                [withInfo(pufOffer, pufInfo)],
                opticalOpts,
            );
            expect(info).to.equal(numeric);
            expect(partsOf(info)).to.contain('21');
        });

        // Regression: taxDisplay selects the legal line, never a different number.
        // WCS sends a 0 without-tax leaf on offers with no separate net amount
        // (trials), so keying the displayed value off taxDisplay renders 0.00.
        // Real payloads: OSI FWEdmk_LYpoGnCR0gQMaS5Rbq9a5vFbVFoNaRT0m7NU.
        [
            {
                name: 'US TAX_EXCLUSIVE',
                country: 'US',
                price: 263.88,
                taxDisplay: 'TAX_EXCLUSIVE',
                formatString: "'US$'#,##0.00",
                symbol: 'US$',
                first: true,
                space: false,
                integer: '263',
                decimals: '88',
                full: 'US$263.88',
                shows: '263',
            },
            {
                name: 'EG TAX_INCLUSIVE_DETAILS',
                country: 'EG',
                price: 8194.32,
                taxDisplay: 'TAX_INCLUSIVE_DETAILS',
                formatString: "'LE' #,##0.00",
                symbol: 'LE',
                first: true,
                space: true,
                integer: '8,194',
                decimals: '32',
                full: 'LE 8,194.32',
                shows: '8,194',
            },
        ].forEach((c) => {
            it(`renders the charged price, not the 0 without-tax leaf (${c.name})`, () => {
                const trialOffer = {
                    offerSelectorIds: ['pi-trial'],
                    commitment: 'YEAR',
                    term: 'ANNUAL',
                    planType: 'PUF',
                    priceDetails: {
                        price: c.price,
                        priceWithoutTax: 0,
                        usePrecision: true,
                        formatString: c.formatString,
                        taxDisplay: c.taxDisplay,
                        taxTerm: 'VAT',
                    },
                };
                const trialOpts = { ...opts, country: c.country };
                const zeroLeaf = {
                    integer: '0',
                    decimals: '00',
                    full: `${c.symbol}0.00`,
                };
                const numeric = buildPriceHTML([trialOffer], trialOpts);
                const info = buildPriceHTML(
                    [
                        withInfo(trialOffer, {
                            format: {
                                currencySymbol: c.symbol,
                                decimalsDelimiter: '.',
                                usePrecision: true,
                                isCurrencyFirst: c.first,
                                hasCurrencySpace: c.space,
                            },
                            recurrence: { term: 'ANNUAL' },
                            asIs: {
                                withDiscount: {
                                    withTax: {
                                        integer: c.integer,
                                        decimals: c.decimals,
                                        full: c.full,
                                    },
                                    withoutTax: zeroLeaf,
                                },
                            },
                        }),
                    ],
                    trialOpts,
                );
                expect(info).to.equal(numeric);
                expect(partsOf(info)).to.contain(c.shows);
                expect(partsOf(info)).to.not.equal('0');
            });
        });

        it('strikethrough indexes withoutDiscount', () => {
            const discounted = {
                offerSelectorIds: ['pi-st'],
                commitment: 'YEAR',
                term: 'MONTHLY',
                planType: 'ABM',
                priceDetails: {
                    price: 43.99,
                    priceWithoutDiscount: 54.99,
                    usePrecision: true,
                    formatString: "'US$'#,##0.00",
                },
            };
            const stOpts = { ...opts, template: 'strikethrough' };
            const numeric = buildPriceHTML([discounted], stOpts);
            const info = buildPriceHTML(
                [
                    withInfo(discounted, {
                        format: {
                            currencySymbol: 'US$',
                            decimalsDelimiter: '.',
                            usePrecision: true,
                            isCurrencyFirst: true,
                            hasCurrencySpace: false,
                        },
                        recurrence: { term: 'MONTHLY' },
                        asIs: {
                            withDiscount: {
                                withTax: {
                                    integer: '43',
                                    decimals: '99',
                                    full: 'US$43.99',
                                },
                            },
                            withoutDiscount: {
                                withTax: {
                                    integer: '54',
                                    decimals: '99',
                                    full: 'US$54.99',
                                },
                            },
                        },
                    }),
                ],
                stOpts,
            );
            expect(info).to.equal(numeric);
            expect(partsOf(info)).to.contain('54');
        });

        // WCS omits absent blocks rather than nulling them (agreed with the WCS
        // team), and omits withoutDiscount.withTax entirely today, so a missing
        // leaf must fall back to numeric instead of throwing or rendering blank.
        it('falls back to numeric when the indexed leaf is absent', () => {
            const discounted = {
                offerSelectorIds: ['pi-missing'],
                commitment: 'YEAR',
                term: 'MONTHLY',
                planType: 'ABM',
                priceDetails: {
                    price: 43.99,
                    priceWithoutDiscount: 54.99,
                    usePrecision: true,
                    formatString: "'US$'#,##0.00",
                },
            };
            const stOpts = { ...opts, template: 'strikethrough' };
            const numeric = buildPriceHTML([discounted], stOpts);
            const info = buildPriceHTML(
                [
                    withInfo(discounted, {
                        format: {
                            currencySymbol: 'US$',
                            decimalsDelimiter: '.',
                            usePrecision: true,
                            isCurrencyFirst: true,
                            hasCurrencySpace: false,
                        },
                        recurrence: { term: 'MONTHLY' },
                        asIs: {
                            withDiscount: {
                                withTax: {
                                    integer: '43',
                                    decimals: '99',
                                    full: 'US$43.99',
                                },
                            },
                            // withoutDiscount omitted, as WCS does today
                        },
                    }),
                ],
                stOpts,
            );
            expect(info).to.equal(numeric);
            expect(partsOf(info)).to.contain('54');
        });

        it('promo annualized stays on the client-summed numeric path', () => {
            const promoOffer = {
                offerSelectorIds: ['pi-promo'],
                commitment: 'YEAR',
                term: 'MONTHLY',
                planType: 'ABM',
                priceDetails: {
                    price: 43.99,
                    priceWithoutDiscount: 54.99,
                    usePrecision: true,
                    formatString: "'US$'#,##0.00",
                },
                promotion: {
                    start: '2020-01-01T00:00:00Z',
                    end: '2100-01-01T00:00:00Z',
                    displaySummary: {
                        amount: 20,
                        duration: 'P3M',
                        outcomeType: 'PERCENTAGE_DISCOUNT',
                    },
                },
            };
            // displayAnnual + promotionCode + the offer's own promotion routes to
            // pricePromoWithAnnual, the template that sums the weighted year.
            const annualOpts = {
                ...opts,
                displayAnnual: true,
                promotionCode: 'promo',
            };
            const numeric = buildPriceHTML([promoOffer], annualOpts);
            const info = buildPriceHTML(
                [
                    withInfo(promoOffer, {
                        format: {
                            currencySymbol: 'US$',
                            decimalsDelimiter: '.',
                            usePrecision: true,
                            isCurrencyFirst: true,
                            hasCurrencySpace: false,
                        },
                        recurrence: { term: 'MONTHLY' },
                        asIs: {
                            withDiscount: {
                                withTax: {
                                    integer: '43',
                                    decimals: '99',
                                    full: 'US$43.99',
                                },
                            },
                        },
                        // A wrong annualized leaf that must be ignored for promos.
                        annualized: {
                            withDiscount: {
                                withTax: {
                                    integer: '0',
                                    decimals: '00',
                                    full: 'US$0.00',
                                },
                            },
                        },
                    }),
                ],
                annualOpts,
            );
            expect(info).to.equal(numeric);
            expect(partsOf(info)).to.not.equal('0');
        });

        // JP PUF + STG_MASTESTPROMO (Drew's stage promo code, works on any offer
        // and country). 50% off, tax-inclusive, so the strikethrough needs
        // withoutDiscount.withTax and optical must stay on the discounted leaf.
        describe('discounted offer (stage promo)', () => {
            const promoOffer = {
                offerSelectorIds: ['pi-drew'],
                commitment: 'YEAR',
                term: 'ANNUAL',
                planType: 'PUF',
                priceDetails: {
                    price: 17340,
                    priceWithoutDiscount: 34680,
                    priceWithoutDiscountAndTax: 31528,
                    usePrecision: false,
                    formatString: "#,##0 '&#20870;'",
                    taxDisplay: 'TAX_INCLUSIVE_DETAILS',
                    taxTerm: 'TAX',
                },
                promotion: {
                    id: '065a0819-0e29-4a14-a638-ac031808fa1d',
                    promotionCode: 'STG_MASTESTPROMO',
                    start: '2026-09-10T16:03:05.000Z',
                    end: '2099-09-10T15:56:00.000Z',
                    displaySummary: {
                        outcomeType: 'PERCENTAGE_DISCOUNT',
                        duration: 'P1Y',
                        amount: 50,
                        minProductQuantity: 1,
                    },
                },
            };
            const leaf = (integer) => ({
                integer,
                full: `${integer} &#20870;`,
            });
            const promoInfo = {
                format: {
                    currencySymbol: '&#20870;',
                    usePrecision: false,
                    isCurrencyFirst: false,
                    hasCurrencySpace: false,
                },
                tax: { display: 'TAX_INCLUSIVE_DETAILS', term: 'TAX' },
                recurrence: { term: 'ANNUAL' },
                asIs: {
                    withDiscount: {
                        withTax: leaf('17,340'),
                        withoutTax: leaf('0'),
                    },
                    withoutDiscount: {
                        withTax: leaf('34,680'),
                        withoutTax: leaf('31,528'),
                    },
                },
                optical: {
                    withDiscount: {
                        withTax: leaf('1,445'),
                        withoutTax: leaf('0'),
                    },
                    withoutDiscount: {
                        withTax: leaf('2,890'),
                        withoutTax: leaf('2,628'),
                    },
                },
            };
            const jpOpts = { ...opts, country: 'JP', language: 'ja' };

            [
                // No promotionCode in scope: promo not applied, regular price shows.
                {
                    name: 'price, promo not applied',
                    extra: {},
                    shows: '34,680',
                },
                {
                    name: 'strikethrough',
                    extra: { template: 'strikethrough' },
                    shows: '34,680',
                },
                // Optical always divides `price`, so it stays on the discounted
                // leaf even when the context wants the pre-discount number.
                {
                    name: 'optical per-month',
                    extra: { template: 'optical' },
                    shows: '1,445',
                },
                // Promo applied renders both prices (struck regular + discounted),
                // so assert on the whole markup rather than the first span.
                {
                    name: 'promo applied',
                    extra: { promotionCode: 'STG_MASTESTPROMO' },
                    shows: '17,340',
                    whole: true,
                },
            ].forEach((c) => {
                it(`${c.name}: tree === numeric`, () => {
                    const o = { ...jpOpts, ...c.extra };
                    const numeric = buildPriceHTML([promoOffer], o);
                    const info = buildPriceHTML(
                        [withInfo(promoOffer, promoInfo)],
                        o,
                    );
                    expect(info).to.equal(numeric);
                    expect(c.whole ? info : partsOf(info)).to.contain(c.shows);
                });
            });

            it('never renders the 0 without-tax leaf', () => {
                ['price', 'strikethrough', 'optical'].forEach((template) => {
                    const info = buildPriceHTML(
                        [withInfo(promoOffer, promoInfo)],
                        { ...jpOpts, template },
                    );
                    expect(partsOf(info), template).to.not.equal('0');
                });
            });
        });

        it('ignores priceInfo when displayFormatted is false', () => {
            const offer = offerFor('US');
            const dfOpts = { ...opts, displayFormatted: false };
            const numeric = buildPriceHTML([offer], dfOpts);
            const info = buildPriceHTML(
                [withInfo(offer, abm.US.priceInfo)],
                dfOpts,
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
