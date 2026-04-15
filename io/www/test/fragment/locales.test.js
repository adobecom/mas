import { expect } from 'chai';
import {
    getLocaleCode,
    getLocaleByCode,
    getCountryName,
    getCountryFlag,
    getDefaultLocale,
    getDefaultLocaleCode,
    getDefaultLocales,
    getSurfaceLocales,
    getRegionLocales,
    getLanguageName,
    isVariationPathInParentLocaleFamily,
} from '../../src/fragment/locales.js';

describe('locales', function () {
    describe('getLocaleCode', function () {
        it('should return locale code from locale object', function () {
            const locale = { lang: 'en', country: 'US' };
            expect(getLocaleCode(locale)).to.equal('en_US');
        });

        it('should return null when locale is null or undefined', function () {
            expect(getLocaleCode(null)).to.be.null;
            expect(getLocaleCode(undefined)).to.be.null;
        });
    });

    describe('getLocaleByCode', function () {
        it('should return locale object from locale code', function () {
            const result = getLocaleByCode('en_US');
            expect(result).to.deep.equal({ lang: 'en', country: 'US' });
        });

        it('should handle different locale codes', function () {
            expect(getLocaleByCode('fr_FR')).to.deep.equal({ lang: 'fr', country: 'FR' });
            expect(getLocaleByCode('ja_JP')).to.deep.equal({ lang: 'ja', country: 'JP' });
            expect(getLocaleByCode('pt_BR')).to.deep.equal({ lang: 'pt', country: 'BR' });
        });

        it('should return null when code is null or undefined', function () {
            expect(getLocaleByCode(null)).to.be.null;
            expect(getLocaleByCode(undefined)).to.be.null;
        });

        it('should return null for invalid locale code format', function () {
            expect(getLocaleByCode('')).to.be.null;
            expect(getLocaleByCode('en')).to.be.null;
            expect(getLocaleByCode('invalid')).to.be.null;
        });
    });

    describe('getCountryName', function () {
        it('should return country name for valid country code', function () {
            expect(getCountryName('US')).to.equal('United States');
        });

        it('should return country code when country is not found', function () {
            expect(getCountryName('XX')).to.equal('XX');
        });
    });

    describe('getCountryFlag', function () {
        it('should return country flag emoji for valid country code', function () {
            expect(getCountryFlag('US')).to.equal('🇺🇸');
        });

        it('should return default flag when country is not found', function () {
            expect(getCountryFlag('XX')).to.equal('🏴');
        });
    });

    describe('getDefaultLocale', function () {
        it('should return default locale', function () {
            const result = getDefaultLocale('acom', 'en_US');
            expect(result).to.be.an('object');
            expect(result.lang).to.equal('en');
            expect(result.country).to.equal('US');
            expect(result.regions).to.be.an('array');
            expect(result.regions.length).to.be.greaterThan(0);
        });

        it('should return null for invalid surface', function () {
            const result = getDefaultLocale('invalid_surface', 'en_US');
            expect(result).to.be.null;
        });

        it('should fallback to language match when country does not match', function () {
            const result = getDefaultLocale('acom', 'en_XX');
            expect(result).to.be.an('object');
            expect(result.lang).to.equal('en');
        });
    });

    describe('getDefaultLocaleCode', function () {
        it('should return default locale code for a regional variant', function () {
            expect(getDefaultLocaleCode('acom', 'fr_CA'), 'return fr_FR for fr_CA').to.equal('fr_FR');
            expect(getDefaultLocaleCode('acom', 'en_EG'), 'return en_US for en_EG').to.equal('en_US');
            expect(getDefaultLocaleCode('acom', 'en_US'), 'return en_US for en_US').to.equal('en_US');
            expect(getDefaultLocaleCode('acom', 'zh_HK'), 'return zh_TW for zh_HK').to.equal('zh_TW');
            // for acom AU and IN fall back to GB, pt_BR exists as a default language
            expect(getDefaultLocaleCode('acom', 'en_GB'), 'return en_GB for en_GB').to.equal('en_GB');
            expect(getDefaultLocaleCode('acom', 'en_AU'), 'return en_GB for en_AU').to.equal('en_GB');
            expect(getDefaultLocaleCode('acom', 'en_IN'), 'return en_GB for en_IN').to.equal('en_GB');
            expect(getDefaultLocaleCode('acom', 'pt_PT'), 'return pt_PT for pt_PT').to.equal('pt_PT');
            expect(getDefaultLocaleCode('acom', 'pt_BR'), 'return pt_BR for pt_BR').to.equal('pt_BR');

            // for ccd AU and IN fall back to US, pt_PT is a variation of pt_BR
            expect(getDefaultLocaleCode('ccd', 'pt_PT'), 'return pt_BR for pt_PT for ccd').to.equal('pt_BR');
            expect(getDefaultLocaleCode('ccd', 'en_AU'), 'return en_US for en_AU for ccd').to.equal('en_US');
            expect(getDefaultLocaleCode('ccd', 'en_IN'), 'return en_US for en_IN for ccd').to.equal('en_US');

            expect(getDefaultLocaleCode('express', 'en_IN'), 'return en_US for en_IN for express').to.equal('en_US');

            expect(getDefaultLocaleCode(null, 'pt_BR'), 'return null if no surface').to.be.null;
            expect(getDefaultLocaleCode('acom', null), 'return null if no locale code').to.be.null;
            expect(getDefaultLocaleCode('acom', undefined), 'return null if no locale code').to.be.null;
        });

        it('should resolve locale codes for acom-cc like acom', function () {
            expect(getDefaultLocaleCode('acom-cc', 'fr_CA')).to.equal('fr_FR');
            expect(getDefaultLocaleCode('acom-cc', 'en_AU')).to.equal('en_GB');
            expect(getDefaultLocaleCode('acom-cc', 'en_US')).to.equal('en_US');
        });

        it('should resolve locale codes for acom-dc like acom', function () {
            expect(getDefaultLocaleCode('acom-dc', 'fr_CA')).to.equal('fr_FR');
            expect(getDefaultLocaleCode('acom-dc', 'en_AU')).to.equal('en_GB');
            expect(getDefaultLocaleCode('acom-dc', 'en_US')).to.equal('en_US');
        });
    });

    describe('getDefaultLocales', function () {
        it('should return all default locales for a given surface', function () {
            const result = getDefaultLocales('acom');
            expect(result).to.be.an('array');
            expect(result.length).to.be.greaterThan(0);
            expect(result[0]).to.have.property('lang');
            expect(result[0]).to.have.property('country');
        });

        it('should return empty array for invalid surface', function () {
            const result = getDefaultLocales('invalid_surface');
            expect(result).to.be.an('array');
            expect(result.length).to.equal(0);
        });

        it('should return ACOM locales for acom-cc surface', function () {
            const acomResult = getDefaultLocales('acom');
            const acomCcResult = getDefaultLocales('acom-cc');
            expect(acomCcResult).to.deep.equal(acomResult);
        });

        it('should return ACOM locales for acom-dc surface', function () {
            const acomResult = getDefaultLocales('acom');
            const acomDcResult = getDefaultLocales('acom-dc');
            expect(acomDcResult).to.deep.equal(acomResult);
        });
    });

    describe('getRegionLocales', function () {
        it('should return region locales for a default locale on a surface', function () {
            const result = getRegionLocales('acom', 'en_GB', true);
            expect(result).to.be.an('array');
            // en_GB has regions ['AU', 'IN', 'GB'] in ACOM
            expect(result.length).to.be.equal(3);
            expect(result[0]).to.have.property('lang');
            expect(result[0]).to.have.property('country');
            expect(result[0].lang).to.equal('en');
            expect(result[0].country).to.equal('AU');
        });

        it('should not include default locale when includeDefault is false', function () {
            const result = getRegionLocales('acom', 'en_GB', false);
            expect(result).to.be.an('array');
            // en_GB has regions ['AU', 'IN'] in ACOM
            expect(result.length).to.be.equal(2);
        });

        it('should return region locales for a non default locale', function () {
            const result = getRegionLocales('acom', 'fr_LU', false);
            expect(result).to.be.an('array');
            expect(result.length).to.be.equal(4);
        });

        it('should return empty array if no regions', function () {
            const result = getRegionLocales('acom', 'pt_PT', false);
            expect(result).to.be.an('array');
            expect(result.length).to.be.equal(0);
        });

        it('should return empty array for invalid surface', function () {
            const result = getRegionLocales('invalid_surface', 'en_US', false);
            expect(result).to.be.an('array');
            expect(result.length).to.equal(0);
        });
    });

    describe('getSurfaceLocales', function () {
        it('should return default and region locales for a surface', function () {
            const result = getSurfaceLocales('acom');
            expect(result).to.be.an('array');
            expect(result.length).to.be.greaterThan(0);
            expect(result.some((locale) => locale.lang === 'en' && locale.country === 'US')).to.equal(true);
            expect(result.some((locale) => locale.lang === 'en' && locale.country === 'AE')).to.equal(true);
            expect(result.some((locale) => locale.lang === 'en' && locale.country === 'AU')).to.equal(true);
        });

        it('should not return duplicate locales', function () {
            const result = getSurfaceLocales('acom');
            const uniqueCodes = new Set(result.map((locale) => getLocaleCode(locale)));
            expect(result.length).to.equal(uniqueCodes.size);
        });

        it('should return empty array for invalid surface', function () {
            const result = getSurfaceLocales('invalid_surface');
            expect(result).to.be.an('array');
            expect(result.length).to.equal(0);
        });

        it('should return same locales for acom-cc as acom', function () {
            const acomLocales = getSurfaceLocales('acom');
            const acomCcLocales = getSurfaceLocales('acom-cc');
            expect(acomCcLocales.length).to.equal(acomLocales.length);
        });

        it('should return same locales for acom-dc as acom', function () {
            const acomLocales = getSurfaceLocales('acom');
            const acomDcLocales = getSurfaceLocales('acom-dc');
            expect(acomDcLocales.length).to.equal(acomLocales.length);
        });
    });

    describe('getLanguageName', function () {
        it('should return language name for a given language code', function () {
            expect(getLanguageName('en')).to.equal('English');
        });

        it('should return language code when language is not found', function () {
            expect(getLanguageName('xx')).to.equal('xx');
        });
    });

    describe('Chinese locales (HK as region under zh_TW)', function () {
        const allSurfacesWithZh = ['acom', 'sandbox', 'nala', 'ccd', 'express', 'adobe-home', 'commerce'];
        const surfacesWithHKRegion = ['acom', 'sandbox', 'nala'];
        const surfacesWithoutHKRegion = ['ccd', 'express', 'adobe-home', 'commerce'];

        it('should not have zh_HK as a standalone default locale', function () {
            for (const surface of allSurfacesWithZh) {
                const defaults = getDefaultLocales(surface);
                const zhHK = defaults.find((locale) => locale.lang === 'zh' && locale.country === 'HK');
                expect(zhHK, surface).to.be.undefined;
            }
        });

        it('should only define zh_CN and zh_TW as base Chinese defaults, with HK as a region of zh_TW only for acom/sandbox/nala', function () {
            for (const surface of allSurfacesWithZh) {
                const defaults = getDefaultLocales(surface);
                const zhRows = defaults.filter((locale) => locale.lang === 'zh');
                expect(zhRows.map((row) => row.country).sort(), surface).to.deep.equal(['CN', 'TW']);
            }
            for (const surface of surfacesWithHKRegion) {
                const defaults = getDefaultLocales(surface);
                const tw = defaults.find((locale) => locale.lang === 'zh' && locale.country === 'TW');
                expect(tw?.regions, surface).to.include('HK');
            }
            for (const surface of surfacesWithoutHKRegion) {
                const defaults = getDefaultLocales(surface);
                const tw = defaults.find((locale) => locale.lang === 'zh' && locale.country === 'TW');
                expect(tw?.regions, surface).to.be.undefined;
            }
        });

        it('should expose zh_HK via getSurfaceLocales as a regional variant only for acom/sandbox/nala', function () {
            for (const surface of surfacesWithHKRegion) {
                const surfaceLocales = getSurfaceLocales(surface);
                const codes = surfaceLocales.map((locale) => getLocaleCode(locale));
                expect(codes, surface).to.include('zh_HK');
                expect(codes.filter((c) => c === 'zh_HK').length, surface).to.equal(1);
            }
            for (const surface of surfacesWithoutHKRegion) {
                const surfaceLocales = getSurfaceLocales(surface);
                const codes = surfaceLocales.map((locale) => getLocaleCode(locale));
                expect(codes, surface).to.not.include('zh_HK');
            }
        });

        it('should resolve getDefaultLocale for zh_HK to the zh_TW entry', function () {
            for (const surface of surfacesWithHKRegion) {
                const resolved = getDefaultLocale(surface, 'zh_HK');
                expect(resolved.lang, surface).to.equal('zh');
                expect(resolved.country, surface).to.equal('TW');
                expect(resolved.regions, surface).to.include('HK');
            }
        });

        it('should list HK under getRegionLocales for zh_TW only for acom/sandbox/nala', function () {
            const regionsOnly = getRegionLocales('sandbox', 'zh_TW', false);
            expect(regionsOnly.map((locale) => getLocaleCode(locale))).to.deep.equal(['zh_HK']);
            const withDefault = getRegionLocales('sandbox', 'zh_TW', true);
            expect(withDefault.map((locale) => getLocaleCode(locale))).to.deep.equal(['zh_HK', 'zh_TW']);
            for (const surface of surfacesWithoutHKRegion) {
                const result = getRegionLocales(surface, 'zh_TW', false);
                expect(result.length, surface).to.equal(0);
            }
        });

        it('should map zh_HK to zh_TW for acom/sandbox/nala', function () {
            for (const surface of surfacesWithHKRegion) {
                expect(getDefaultLocaleCode(surface, 'zh_HK'), surface).to.equal('zh_TW');
            }
        });
    });

    describe('isVariationPathInParentLocaleFamily', function () {
        const basePath = (localeSegment, rest = 'folder/fragment') => `/content/dam/mas/acom/${localeSegment}/${rest}`;

        it('should return true when variation path uses the same locale as selected', function () {
            expect(isVariationPathInParentLocaleFamily('acom', 'en_US', basePath('en_US'))).to.equal(true);
        });

        it('should return true when variation path uses a regional variant of the selected default locale', function () {
            // en_US on acom includes en_AE, en_CA, etc. (see ACOM en + US regions)
            expect(isVariationPathInParentLocaleFamily('acom', 'en_US', basePath('en_AE'))).to.equal(true);
            expect(isVariationPathInParentLocaleFamily('acom', 'en_US', basePath('en_CA'))).to.equal(true);
        });

        it('should return true for en_GB regional paths when en_GB is selected', function () {
            expect(isVariationPathInParentLocaleFamily('acom', 'en_GB', basePath('en_AU'))).to.equal(true);
            expect(isVariationPathInParentLocaleFamily('acom', 'en_GB', basePath('en_IN'))).to.equal(true);
        });

        it('should return false when variation locale is not in the selected locale family', function () {
            expect(isVariationPathInParentLocaleFamily('acom', 'en_US', basePath('fr_FR'))).to.equal(false);
            expect(isVariationPathInParentLocaleFamily('acom', 'en_GB', basePath('en_US'))).to.equal(false);
        });

        it('should return false when surface or variation path is missing', function () {
            expect(isVariationPathInParentLocaleFamily('', 'en_US', basePath('en_US'))).to.equal(false);
            expect(isVariationPathInParentLocaleFamily('acom', 'en_US', '')).to.equal(false);
        });

        it('should return false when selectedLocale cannot be parsed as a locale code', function () {
            expect(isVariationPathInParentLocaleFamily('acom', 'invalid', basePath('en_US'))).to.equal(false);
        });

        it('should return false when variation path does not match DAM path shape', function () {
            expect(isVariationPathInParentLocaleFamily('acom', 'en_US', 'not-a-dam-path')).to.equal(false);
        });
    });
});
