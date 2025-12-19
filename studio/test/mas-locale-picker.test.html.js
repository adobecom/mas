import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';
import { initElementFromTemplate, oneEvent } from './utils.js';
import Store from '../src/store.js';
import '../src/mas-locale-picker.js';
import { getDefaultLocales, getLocaleCode } from '../src/locales.js';

runTests(async () => {
    describe('mas-locale-picker custom element', async () => {
        beforeEach(async function () {
            // Reset store to default
            Store.filters.set({ locale: 'en_US' });
        });

        describe('Display modes', () => {
            it('should render in strong display mode with globe icon', async function () {
                const el = initElementFromTemplate('strongMode', this.test.title);
                await el.updateComplete;
                expect(el.displayMode).to.equal('strong');
                expect(el.classList.contains('strong')).to.be.true;
                const globeIcon = el.shadowRoot.querySelector('sp-icon-globe-grid');
                expect(globeIcon).to.exist;
            });

            it('should render in light display mode without globe icon', async function () {
                const el = initElementFromTemplate('lightMode', this.test.title);
                await el.updateComplete;
                expect(el.displayMode).to.equal('light');
                expect(el.classList.contains('strong')).to.be.false;
                const globeIcon = el.shadowRoot.querySelector('sp-icon-globe-grid');
                expect(globeIcon).to.not.exist;
            });
        });

        describe('Locales', () => {
            const setContext = (locale) => {
                Store.filters.set({ locale });
            };
            it('should initialize with US English locale', async function () {
                setContext('en_US');
                const el = initElementFromTemplate('localeEN_US', this.test.title);
                await el.updateComplete;
                expect(el.locale).to.equal('en_US');
                expect(el.currentLocale.country).to.equal('US');
                expect(el.currentLocale.lang).to.equal('en');
            });
            it('should initialize with German locale', async function () {
                setContext('de_DE');
                const el = initElementFromTemplate('localeDE_DE', this.test.title);
                await el.updateComplete;
                expect(el.locale).to.equal('de_DE');
                expect(el.currentLocale.country).to.equal('DE');
                expect(el.currentLocale.lang).to.equal('de');
            });
            it('should initialize with Japanese locale', async function () {
                setContext('ja_JP');
                const el = initElementFromTemplate('localeJA_JP', this.test.title);
                await el.updateComplete;
                expect(el.locale).to.equal('ja_JP');
                expect(el.currentLocale.country).to.equal('JP');
                expect(el.currentLocale.lang).to.equal('ja');
            });
            it('should initialize with default locale if requested locale is not present on surface', async function () {
                setContext('ar_SA'); // Assume es_MX is not on default surface
                const el = initElementFromTemplate('nonpresentLocale', this.test.title);
                await el.updateComplete;
                expect(el.locale).to.equal('en_US'); // Fallback to en_US
                expect(el.currentLocale.country).to.equal('US');
                expect(el.currentLocale.lang).to.equal('en');
            });
        });

        describe('Modes', () => {
            it('should work in language mode', async function () {
                const el = initElementFromTemplate('languageMode', this.test.title);
                await el.updateComplete;

                expect(el.mode).to.equal('language');
                const locales = el.getLocales();
                expect(locales.length).to.be.greaterThan(0);
                // All should be default locales
                expect(locales.every((loc) => loc.default)).to.be.true;
                //should contain en_US, de_DE, fr_FR, ja_JP
                const expectedLocales = ['en_US', 'de_DE', 'fr_FR', 'ja_JP'];
                expectedLocales.forEach((code) => {
                    expect(locales.some((loc) => getLocaleCode(loc) === code)).to.be.true;
                });
            });

            it('should work in region mode with English', async function () {
                const el = initElementFromTemplate('regionModeEN', this.test.title);
                await el.updateComplete;

                expect(el.mode).to.equal('region');
                const locales = el.getLocales();
                expect(locales.length).to.be.greaterThan(0);
                // All should be English
                expect(locales.every((loc) => loc.lang === 'en')).to.be.true;
                // Should contain en_US, en_GB, en_CA, en_AU
                const expectedLocales = ['en_US', 'en_GB', 'en_CA', 'en_AU'];
                expectedLocales.forEach((code) => {
                    expect(locales.some((loc) => getLocaleCode(loc) === code)).to.be.true;
                });
            });

            it('should work in region mode with German', async function () {
                Store.filters.set({ locale: 'de_DE' });
                const el = initElementFromTemplate('regionModeDE', this.test.title);
                await el.updateComplete;

                expect(el.mode).to.equal('region');
                const locales = el.getLocales();
                // All should be German
                expect(locales.every((loc) => loc.lang === 'de')).to.be.true;
                // Should contain de_DE, de_AT, de_CH
                const expectedLocales = ['de_DE', 'de_AT', 'de_CH'];
                expectedLocales.forEach((code) => {
                    expect(locales.some((loc) => getLocaleCode(loc) === code)).to.be.true;
                });
            });
        });

        describe('Surfaces', () => {
            it('should filter by acom surface', async function () {
                const el = initElementFromTemplate('surfaceAcom', this.test.title);
                await el.updateComplete;

                expect(el.surface).to.equal('acom');
                const locales = getDefaultLocales('acom');
                expect(locales.length).to.be.greaterThan(0);
            });
            it('should filter by express surface', async function () {
                const locales = getDefaultLocales('express');
                expect(locales.map((loc) => getLocaleCode(loc))).to.deep.equal([
                    'zh_CN',
                    'zh_TW',
                    'da_DK',
                    'nl_NL',
                    'en_US',
                    'fi_FI',
                    'fr_FR',
                    'de_DE',
                    'id_ID',
                    'it_IT',
                    'ja_JP',
                    'ko_KR',
                    'nb_NO',
                    'pt_BR',
                    'es_ES',
                    'sv_SE',
                ]);
            });

            it('should filter by nala surface', async function () {
                const el = initElementFromTemplate('surfaceNala', this.test.title);
                await el.updateComplete;

                expect(el.surface).to.equal('nala');
                const locales = getDefaultLocales('nala');
                expect(locales.length).to.be.greaterThan(0);
            });
        });

        describe('Search functionality', () => {
            it('should enable search by default', async function () {
                const el = initElementFromTemplate('searchEnabled', this.test.title);
                await el.updateComplete;
                const searchField = el.searchField;
                expect(searchField).to.not.be.null;
            });

            it('should disable search when specified', async function () {
                const el = initElementFromTemplate('searchDisabled', this.test.title);
                await el.updateComplete;
                const searchField = el.searchField;
                expect(searchField).to.be.null;
            });

            it('should use custom search placeholder', async function () {
                const el = initElementFromTemplate('customSearchPlaceholder', this.test.title);
                await el.updateComplete;
                expect(el.searchPlaceholder).to.equal('Find a locale...');
            });

            it('should filter locales by search query', async function () {
                const el = initElementFromTemplate('filterLocaleSearch', this.test.title);
                await el.updateComplete;

                el.searchQuery = 'german';
                const filtered = el.getFilteredLocales();
                expect(filtered.every((loc) => loc.lang === 'de')).to.be.true;
            });
        });

        describe('Disabled state', () => {
            it('should render in disabled state', async function () {
                const el = initElementFromTemplate('disabled', this.test.title);
                await el.updateComplete;

                expect(el.disabled).to.be.true;
                const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
                expect(actionMenu.hasAttribute('disabled')).to.be.true;
            });
        });

        describe('Locale change events', () => {
            it('should dispatch locale-changed event', async function () {
                const el = initElementFromTemplate('localeChangedEvent', this.test.title);
                await el.updateComplete;

                const eventPromise = oneEvent(el, 'locale-changed');
                el.handleLocaleChange('de_DE');
                const event = await eventPromise;

                expect(event.detail.locale).to.equal('de_DE');
                expect(event.bubbles).to.be.true;
                expect(event.composed).to.be.true;
                expect(el.locale).to.equal('de_DE');
                expect(el.lang).to.equal('de');
            });
        });

        describe('Combined configurations', () => {
            it('should work with strong mode + region mode + acom surface', async function () {
                const el = initElementFromTemplate('combined1', this.test.title);
                await el.updateComplete;

                expect(el.displayMode).to.equal('strong');
                expect(el.mode).to.equal('region');
                expect(el.surface).to.equal('acom');
                expect(el.classList.contains('strong')).to.be.true;

                const locales = el.getLocales();
                expect(locales.every((loc) => loc.lang === 'en')).to.be.true;
            });

            it('should work with light mode + language mode + disabled', async function () {
                const el = initElementFromTemplate('combined2', this.test.title);
                await el.updateComplete;

                expect(el.displayMode).to.equal('light');
                expect(el.mode).to.equal('language');
                expect(el.disabled).to.be.true;

                const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
                expect(actionMenu.hasAttribute('disabled')).to.be.true;
            });
        });
    });
});
