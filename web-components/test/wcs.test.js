import { Defaults } from '../src/defaults.js';
import { Wcs } from '../src/wcs.js';
import {
    SUPPORTED_COUNTRIES,
    SUPPORTED_LANGUAGES,
} from '../src/constants.js';

import { mockFetch } from './mocks/fetch.js';
import { withWcs } from './mocks/wcs.js';
import { expect } from './utilities.js';

describe('resolveOfferSelectors', () => {
    it('ignores multiple OSIs and loads them one by one', async () => {
        await mockFetch(withWcs);
        const client = Wcs({
            settings: {
                ...Defaults,
                locale: 'en_US',
                wcsBufferLimit: 4,
            },
        });
        const results = await Promise.allSettled(
            client.resolveOfferSelectors({
                wcsOsi: ['abm', 'no-offer', 'stock-abm', 'void'],
            }),
        );
        expect(results[0].status).to.equal('fulfilled');
        expect(results[1].status).to.equal('rejected');
        expect(results[1].reason.message).to.equal('Commerce offer not found');
        const context1 = results[1].reason.context;
        expect(context1).to.have.property('measure');
        expect(typeof context1.measure).to.equal('string');
        expect(/startTime:.+duration:/.test(context1.measure)).to.be.true;
        expect(context1).to.include({
            status: 200,
            statusText: undefined,
            url: 'https://www.adobe.com//web_commerce_artifact?offer_selector_ids=no-offer&country=undefined&locale=undefined_undefined&landscape=PUBLISHED&api_key=wcms-commerce-ims-ro-user-milo&language=MULT',
            serverTiming:
                'cdn-cache|desc=MISS|edge|dur=12|origin|dur=427|sis|desc=0|ak_p|desc="1748272635433_390603879_647362112_45054_10750_42_0_219"|dur=1',
        });
        expect(results[2].status).to.equal('fulfilled');
        expect(results[3].status).to.equal('rejected');
        expect(results[3].reason.message).to.equal('Bad WCS request');
        const context3 = results[3].reason.context;
        expect(context3).to.have.property('measure');
        expect(/startTime:.+duration:/.test(context3.measure)).to.be.true;
        expect(context3).to.include({
            status: 404,
            url: 'https://www.adobe.com//web_commerce_artifact?offer_selector_ids=void&country=undefined&locale=undefined_undefined&landscape=PUBLISHED&api_key=wcms-commerce-ims-ro-user-milo&language=MULT',
        });
    });

    it('flushes WCS cache', async () => {
        await mockFetch(withWcs);
        const client = Wcs({
            settings: {
                ...Defaults,
                locale: 'en_US',
            },
        });
        await client.resolveOfferSelectors({ wcsOsi: ['abm'] });
        await client.resolveOfferSelectors({ wcsOsi: ['abm'] });
        expect(fetch.callCount).to.equal(1);
        await client.flushWcsCacheInternal();
        await client.resolveOfferSelectors({ wcsOsi: ['abm'] });
        expect(fetch.callCount).to.equal(2);
    });
});

describe('prefillWcsCache', () => {
    it('fills WCS cache with artifacts', async () => {
        await mockFetch(withWcs);
        const client = Wcs({
            settings: {
                ...Defaults,
                locale: 'en_US',
            },
        });
        client.prefillWcsCache({
            prod: {
                'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ-us-mult': [
                    { foo: 'bar' },
                ],
                'FWEdmk_LYpoGnCR0gQMaS5Rbq9a5vFbVFoNaRT0m7NU-us-mult-nicopromo':
                    [{ baz: 'qux' }],
            },
        });

        const [[offer1]] = await Promise.all(
            await client.resolveOfferSelectors({
                country: 'US',
                language: 'en',
                wcsOsi: ['Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ'],
            }),
        );
        expect(fetch.callCount).to.equal(0);
        expect(offer1).to.deep.equal({
            foo: 'bar',
            planType: 'Value is not an offer',
        });
        const [[offer2]] = await Promise.all(
            client.resolveOfferSelectors({
                country: 'US',
                language: 'en',
                promotionCode: 'nicopromo',
                wcsOsi: ['FWEdmk_LYpoGnCR0gQMaS5Rbq9a5vFbVFoNaRT0m7NU'],
            }),
        );
        expect(fetch.callCount).to.equal(0);
        expect(offer2).to.deep.equal({
            baz: 'qux',
            planType: 'Value is not an offer',
        });
    });
});

describe('resolveLanguageAndLocale', () => {
    let client;

    beforeEach(() => {
        client = Wcs({
            settings: {
                ...Defaults,
                locale: 'en_US',
            },
        });
    });

    describe('invalid country', () => {
        it('returns isValid false for unsupported country', () => {
            const result = client.resolveLanguageAndLocale('XX', 'en', false);
            expect(result.isValid).to.be.false;
            expect(result.locale).to.equal('');
        });

        it('handles null country (falsy values skip validation)', () => {
            const result = client.resolveLanguageAndLocale(null, 'en', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('en_null');
        });
    });

    describe('invalid language', () => {
        it('returns isValid false for unsupported language', () => {
            const result = client.resolveLanguageAndLocale('US', 'xx', false);
            expect(result.isValid).to.be.false;
            expect(result.locale).to.equal('');
        });

        it('handles null language (falsy values skip validation)', () => {
            const result = client.resolveLanguageAndLocale('US', null, false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('null_US');
        });
    });

    describe('valid supported country', () => {
        it('accepts all countries from SUPPORTED_COUNTRIES', () => {
            SUPPORTED_COUNTRIES.forEach((country) => {
                const result = client.resolveLanguageAndLocale(
                    country,
                    'en',
                    false,
                );
                expect(result.isValid).to.be.true;
            });
        });
    });

    describe('valid supported language', () => {
        it('accepts all languages from SUPPORTED_LANGUAGES', () => {
            SUPPORTED_LANGUAGES.forEach((language) => {
                const result = client.resolveLanguageAndLocale(
                    'US',
                    language,
                    false,
                );
                expect(result.isValid).to.be.true;
            });
        });
    });

    describe('locale construction for supported language_country', () => {
        it('returns correct locale for en_US', () => {
            const result = client.resolveLanguageAndLocale('US', 'en', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('en_US');
            expect(result.language).to.equal('MULT');
        });

        it('returns correct locale for de_DE', () => {
            const result = client.resolveLanguageAndLocale('DE', 'de', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('de_DE');
            expect(result.language).to.equal('MULT');
        });

        it('returns correct locale for fr_FR', () => {
            const result = client.resolveLanguageAndLocale('FR', 'fr', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('fr_FR');
            expect(result.language).to.equal('MULT');
        });

        it('returns correct locale for ja_JP', () => {
            const result = client.resolveLanguageAndLocale('JP', 'ja', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('ja_JP');
            expect(result.language).to.equal('MULT');
        });

        it('returns correct locale for zh-Hans_CN', () => {
            const result = client.resolveLanguageAndLocale(
                'CN',
                'zh-Hans',
                false,
            );
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('zh-Hans_CN');
            expect(result.language).to.equal('MULT');
        });

        it('returns correct locale for es_MX', () => {
            const result = client.resolveLanguageAndLocale('MX', 'es', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('es_MX');
            expect(result.language).to.equal('MULT');
        });

        it('returns correct locale for pt_BR', () => {
            const result = client.resolveLanguageAndLocale('BR', 'pt', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('pt_BR');
            expect(result.language).to.equal('MULT');
        });
    });

    describe('locale construction for unsupported language_country combination', () => {
        it('falls back to default locale for unsupported combination', () => {
            const result = client.resolveLanguageAndLocale('JP', 'fr', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('en_US');
            expect(result.language).to.equal('MULT');
        });

        it('falls back to default locale for another unsupported combination', () => {
            const result = client.resolveLanguageAndLocale('BR', 'de', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('en_US');
            expect(result.language).to.equal('MULT');
        });
    });

    describe('GB country special case', () => {
        it('keeps original language for GB with perpetual=false', () => {
            const result = client.resolveLanguageAndLocale('GB', 'en', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('en_GB');
            expect(result.language).to.equal('en');
        });

        it('keeps original language for GB with perpetual=true', () => {
            const result = client.resolveLanguageAndLocale('GB', 'en', true);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('en_GB');
            expect(result.language).to.equal('en');
        });
    });

    describe('perpetual flag behavior', () => {
        it('sets language to MULT for non-GB country with perpetual=false', () => {
            const result = client.resolveLanguageAndLocale('US', 'en', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('en_US');
            expect(result.language).to.equal('MULT');
        });

        it('keeps original language for non-GB country with perpetual=true', () => {
            const result = client.resolveLanguageAndLocale('US', 'en', true);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('en_US');
            expect(result.language).to.equal('en');
        });

        it('sets language to MULT for DE with perpetual=false', () => {
            const result = client.resolveLanguageAndLocale('DE', 'de', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('de_DE');
            expect(result.language).to.equal('MULT');
        });

        it('keeps original language for DE with perpetual=true', () => {
            const result = client.resolveLanguageAndLocale('DE', 'de', true);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('de_DE');
            expect(result.language).to.equal('de');
        });

        it('sets language to MULT for FR with perpetual=false', () => {
            const result = client.resolveLanguageAndLocale('FR', 'fr', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('fr_FR');
            expect(result.language).to.equal('MULT');
        });

        it('keeps original language for FR with perpetual=true', () => {
            const result = client.resolveLanguageAndLocale('FR', 'fr', true);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('fr_FR');
            expect(result.language).to.equal('fr');
        });
    });

    describe('newly added countries', () => {
        it('accepts DO (Dominican Republic)', () => {
            const result = client.resolveLanguageAndLocale('DO', 'es', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('es_DO');
            expect(result.language).to.equal('MULT');
        });

        it('accepts GB (Great Britain)', () => {
            const result = client.resolveLanguageAndLocale('GB', 'en', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('en_GB');
            expect(result.language).to.equal('en');
        });

        it('accepts TW (Taiwan)', () => {
            const result = client.resolveLanguageAndLocale(
                'TW',
                'zh-Hant',
                false,
            );
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('zh-Hant_TW');
            expect(result.language).to.equal('MULT');
        });
    });

    describe('edge cases with special regions', () => {
        it('handles AFRICA region', () => {
            const result = client.resolveLanguageAndLocale(
                'AFRICA',
                'en',
                false,
            );
            expect(result.isValid).to.be.true;
            expect(result.language).to.equal('MULT');
        });

        it('handles MENA region', () => {
            const result = client.resolveLanguageAndLocale('MENA', 'ar', false);
            expect(result.isValid).to.be.true;
            expect(result.language).to.equal('MULT');
        });

        it('handles CIS region', () => {
            const result = client.resolveLanguageAndLocale('CIS', 'ru', false);
            expect(result.isValid).to.be.true;
            expect(result.language).to.equal('MULT');
        });
    });

    describe('MULT language support', () => {
        it('accepts MULT as a valid language', () => {
            const result = client.resolveLanguageAndLocale('US', 'MULT', false);
            expect(result.isValid).to.be.true;
            expect(result.language).to.equal('MULT');
        });
    });

    describe('complex locale scenarios', () => {
        it('handles Arabic for Saudi Arabia', () => {
            const result = client.resolveLanguageAndLocale('SA', 'ar', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('ar_SA');
            expect(result.language).to.equal('MULT');
        });

        it('handles Hebrew for Israel', () => {
            const result = client.resolveLanguageAndLocale('IL', 'iw', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('iw_IL');
            expect(result.language).to.equal('MULT');
        });

        it('handles Norwegian for Norway', () => {
            const result = client.resolveLanguageAndLocale('NO', 'nb', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('nb_NO');
            expect(result.language).to.equal('MULT');
        });

        it('handles Hindi for India', () => {
            const result = client.resolveLanguageAndLocale('IN', 'hi', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('hi_IN');
            expect(result.language).to.equal('MULT');
        });

        it('handles Indonesian for Indonesia', () => {
            const result = client.resolveLanguageAndLocale('ID', 'in', false);
            expect(result.isValid).to.be.true;
            expect(result.locale).to.equal('in_ID');
            expect(result.language).to.equal('MULT');
        });
    });
});
