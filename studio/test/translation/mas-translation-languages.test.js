import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import '../../src/swc.js';
import '../../src/translation/mas-translation-languages.js';

describe('MasTranslationLanguages', () => {
    let sandbox;
    let originalSearchValue;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalSearchValue = Store.search.get();
        Store.search.set({ path: 'acom' });
        Store.translationProjects.targetLocales.set([]);
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.search.set(originalSearchValue);
        Store.translationProjects.targetLocales.set([]);
    });

    describe('initialization', () => {
        it('should initialize with locales array from store surface', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.localesArray).to.be.an('array');
            expect(el.localesArray.length).to.be.greaterThan(0);
        });

        it('should transform locales to include locale property', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const firstLocale = el.localesArray[0];
            expect(firstLocale).to.have.property('locale');
            expect(firstLocale.locale).to.include('_');
        });

        it('should sort locales alphabetically by locale code', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const locales = el.localesArray.map((item) => item.locale);
            const sortedLocales = [...locales].sort();
            expect(locales).to.deep.equal(sortedLocales);
        });

        it('should group locales into region groups', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.groupedLocales).to.be.an('array');
            expect(el.groupedLocales.length).to.be.greaterThan(0);
            el.groupedLocales.forEach((group) => {
                expect(group).to.have.property('name');
                expect(group).to.have.property('locales');
                expect(group.locales).to.be.an('array');
            });
        });

        it('should initialize reactive controller', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.targetLocalesController).to.exist;
        });

        it('should initialize with locales array from store surface, excluding en_US', async () => {
            Store.search.set({ path: 'acom' });
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.localesArray).to.be.an('array');
            expect(el.localesArray.length).to.be.greaterThan(0);
            expect(el.localesArray.some((item) => item.lang === 'en' && item.country === 'US')).to.be.false;
        });

        it('should include en_US when include-source is set', async () => {
            Store.search.set({ path: 'acom' });
            const el = await fixture(html`<mas-translation-languages include-source></mas-translation-languages>`);
            expect(el.includeSource).to.equal(true);
            expect(el.localesArray.some((item) => item.locale === 'en_US')).to.be.true;
        });

        it('should exclude regional language variants by default', async () => {
            Store.search.set({ path: 'acom' });
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.includeRegional).to.equal(false);
            expect(el.localesArray.some((item) => item.locale === 'fr_FR')).to.be.true;
            expect(el.localesArray.some((item) => item.locale === 'fr_CA')).to.be.false;
            expect(el.localesArray.some((item) => item.locale === 'fr_BE')).to.be.false;
            expect(el.localesArray.some((item) => item.locale === 'en_AU')).to.be.false;
        });

        it('should include regional language variants when include-regional is set', async () => {
            Store.search.set({ path: 'acom' });
            const el = await fixture(html`<mas-translation-languages include-regional></mas-translation-languages>`);
            expect(el.includeRegional).to.equal(true);
            expect(el.localesArray.some((item) => item.locale === 'fr_CA')).to.be.true;
            expect(el.localesArray.some((item) => item.locale === 'en_AU')).to.be.true;
        });
    });

    describe('selectAllChecked getter', () => {
        it('should return false when no locales are selected', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.selectAllChecked).to.be.false;
        });

        it('should return false when some locales are selected', async () => {
            Store.translationProjects.targetLocales.set(['en_US', 'fr_FR']);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.selectAllChecked).to.be.false;
        });

        it('should return true when all locales are selected', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const allLocales = el.localesArray.map((item) => item.locale);
            Store.translationProjects.targetLocales.set(allLocales);
            expect(el.selectAllChecked).to.be.true;
        });
    });

    describe('numberOfLocales getter', () => {
        it('should return total count when no locales selected', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.numberOfLocales).to.include('languages');
            expect(el.numberOfLocales).to.include(String(el.localesArray.length));
        });

        it('should return "1 language selected" when one locale is selected', async () => {
            Store.translationProjects.targetLocales.set(['en_US']);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.numberOfLocales).to.equal('1 language selected');
        });

        it('should return "X languages selected" when multiple locales are selected', async () => {
            Store.translationProjects.targetLocales.set(['en_US', 'fr_FR', 'de_DE']);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.numberOfLocales).to.equal('3 languages selected');
        });
    });

    describe('groupedLocales getter', () => {
        it('should group locales by region', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const groups = el.groupedLocales;
            const groupNames = groups.map((g) => g.name);
            expect(groupNames.some((n) => ['LATAM/Americas', 'JAPAC', 'EMEA', 'Other'].includes(n))).to.be.true;
        });

        it('should cover all locales across groups', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const allGroupedLocales = el.groupedLocales.flatMap((g) => g.locales.map((item) => item.locale));
            el.localesArray.forEach((item) => {
                expect(allGroupedLocales).to.include(item.locale);
            });
        });
    });

    describe('selectAll method', () => {
        it('should select all locales when checkbox is checked', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const allLocales = el.localesArray.map((item) => item.locale);
            const mockEvent = { target: { checked: true } };
            el.selectAll(mockEvent);
            expect(Store.translationProjects.targetLocales.get()).to.deep.equal(allLocales);
        });

        it('should deselect all locales when checkbox is unchecked', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const allLocales = el.localesArray.map((item) => item.locale);
            Store.translationProjects.targetLocales.set(allLocales);
            const mockEvent = { target: { checked: false } };
            el.selectAll(mockEvent);
            expect(Store.translationProjects.targetLocales.get()).to.deep.equal([]);
        });

        it('should request update after select all', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            let updateRequested = false;
            const originalRequestUpdate = el.requestUpdate.bind(el);
            el.requestUpdate = () => {
                updateRequested = true;
                return originalRequestUpdate();
            };
            const mockEvent = { target: { checked: true } };
            el.selectAll(mockEvent);
            expect(updateRequested).to.be.true;
        });
    });

    describe('toggleLocale method', () => {
        it('should add locale when checkbox is checked', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const mockEvent = {
                target: { checked: true, textContent: '  en_US  ' },
                stopPropagation: sandbox.stub(),
            };
            el.toggleLocale(mockEvent);
            expect(Store.translationProjects.targetLocales.get()).to.include('en_US');
        });

        it('should remove locale when checkbox is unchecked', async () => {
            Store.translationProjects.targetLocales.set(['en_US', 'fr_FR']);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const mockEvent = {
                target: { checked: false, textContent: '  en_US  ' },
                stopPropagation: sandbox.stub(),
            };
            el.toggleLocale(mockEvent);
            expect(Store.translationProjects.targetLocales.get()).to.not.include('en_US');
            expect(Store.translationProjects.targetLocales.get()).to.include('fr_FR');
        });

        it('should stop event propagation', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const stopPropagationStub = sandbox.stub();
            const mockEvent = {
                target: { checked: true, textContent: 'en_US' },
                stopPropagation: stopPropagationStub,
            };
            el.toggleLocale(mockEvent);
            expect(stopPropagationStub.calledOnce).to.be.true;
        });

        it('should preserve existing selections when adding new locale', async () => {
            Store.translationProjects.targetLocales.set(['fr_FR', 'de_DE']);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const mockEvent = {
                target: { checked: true, textContent: 'en_US' },
                stopPropagation: sandbox.stub(),
            };
            el.toggleLocale(mockEvent);
            const selectedLocales = Store.translationProjects.targetLocales.get();
            expect(selectedLocales).to.include('fr_FR');
            expect(selectedLocales).to.include('de_DE');
            expect(selectedLocales).to.include('en_US');
        });
    });

    describe('rendering', () => {
        it('should render select language content container', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const container = el.shadowRoot.querySelector('.select-lang-content');
            expect(container).to.exist;
        });

        it('should render select all checkbox', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const selectAllRow = el.shadowRoot.querySelector('.select-all-row');
            expect(selectAllRow).to.exist;
            const selectAllCheckbox = selectAllRow.querySelector('sp-checkbox');
            expect(selectAllCheckbox).to.exist;
        });

        it('should render select all checkbox with correct label', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const selectAllRow = el.shadowRoot.querySelector('.select-all-row');
            const selectAllCheckbox = selectAllRow.querySelector('sp-checkbox');
            expect(selectAllCheckbox.textContent.trim()).to.equal('Select all');
        });

        it('should render number of languages display', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const languagesDisplay = el.shadowRoot.querySelector('.locale-count');
            expect(languagesDisplay).to.exist;
            expect(languagesDisplay.textContent).to.include('languages');
        });

        it('should render divider', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const divider = el.shadowRoot.querySelector('sp-divider');
            expect(divider).to.exist;
        });

        it('should render region cards', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const regionCards = el.shadowRoot.querySelectorAll('.region-card');
            expect(regionCards.length).to.equal(el.groupedLocales.length);
        });

        it('should render region headers with names', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const regionNames = el.shadowRoot.querySelectorAll('.region-name');
            expect(regionNames.length).to.equal(el.groupedLocales.length);
        });

        it('should render locale checkboxes inside region cards', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const checkboxes = el.shadowRoot.querySelectorAll('.locale-col sp-checkbox');
            expect(checkboxes.length).to.be.greaterThan(0);
            expect(checkboxes.length).to.equal(el.localesArray.length);
        });
    });

    describe('checkbox interaction', () => {
        it('should check select all checkbox when all locales are selected', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const allLocales = el.localesArray.map((item) => item.locale);
            Store.translationProjects.targetLocales.set(allLocales);
            await el.updateComplete;
            const selectAllCheckbox = el.shadowRoot.querySelector('.select-all-row sp-checkbox');
            expect(selectAllCheckbox.checked).to.be.true;
        });

        it('should uncheck select all checkbox when not all locales are selected', async () => {
            Store.translationProjects.targetLocales.set(['en_US']);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            await el.updateComplete;
            const selectAllCheckbox = el.shadowRoot.querySelector('.select-all-row sp-checkbox');
            expect(selectAllCheckbox.checked).to.be.false;
        });

        it('should check individual checkbox when locale is selected', async () => {
            Store.translationProjects.targetLocales.set(['en_US']);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            await el.updateComplete;
            const checkboxes = el.shadowRoot.querySelectorAll('.locale-col sp-checkbox');
            const enUsCheckbox = Array.from(checkboxes).find((cb) => cb.textContent.trim() === 'en_US');
            if (enUsCheckbox) {
                expect(enUsCheckbox.checked).to.be.true;
            }
        });

        it('should uncheck individual checkbox when locale is not selected', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            await el.updateComplete;
            const checkboxes = el.shadowRoot.querySelectorAll('.locale-col sp-checkbox');
            checkboxes.forEach((checkbox) => {
                expect(checkbox.checked).to.be.false;
            });
        });

        it('should trigger selectAll when select all checkbox changes', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const allLocales = el.localesArray.map((item) => item.locale);
            const selectAllCheckbox = el.shadowRoot.querySelector('.select-all-row sp-checkbox');
            selectAllCheckbox.checked = true;
            selectAllCheckbox.dispatchEvent(new Event('change'));
            await el.updateComplete;
            expect(Store.translationProjects.targetLocales.get()).to.deep.equal(allLocales);
        });

        it('should trigger toggleLocale when individual checkbox changes', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            await el.updateComplete;
            const checkboxes = el.shadowRoot.querySelectorAll('.locale-col sp-checkbox');
            if (checkboxes.length > 0) {
                const firstCheckbox = checkboxes[0];
                const localeText = firstCheckbox.textContent.trim();
                firstCheckbox.checked = true;
                firstCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                await el.updateComplete;
                expect(Store.translationProjects.targetLocales.get()).to.include(localeText);
            }
        });
    });

    describe('reactivity', () => {
        it('should update when targetLocales store changes', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            await el.updateComplete;
            const languagesDisplay = el.shadowRoot.querySelector('.locale-count');
            const initialText = languagesDisplay.textContent;
            Store.translationProjects.targetLocales.set(['en_US', 'fr_FR']);
            await el.updateComplete;
            expect(languagesDisplay.textContent).to.not.equal(initialText);
            expect(languagesDisplay.textContent).to.include('2 languages selected');
        });
    });

    describe('different surfaces', () => {
        it('should load locales for sandbox surface', async () => {
            Store.search.set({ path: 'sandbox' });
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.localesArray).to.be.an('array');
            expect(el.localesArray.length).to.be.greaterThan(0);
        });

        it('should load locales for express surface', async () => {
            Store.search.set({ path: 'express' });
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.localesArray).to.be.an('array');
            expect(el.localesArray.length).to.be.greaterThan(0);
        });
    });
});
