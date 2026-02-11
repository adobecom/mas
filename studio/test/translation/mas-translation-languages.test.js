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

        it('should create locales matrix with 4 columns', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.localesMatrix).to.be.an('array');
            el.localesMatrix.forEach((row) => {
                expect(row).to.have.lengthOf(4);
            });
        });

        it('should initialize reactive controller', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            expect(el.storeController).to.exist;
        });

        it('should initialize with locales array from store surface, excluding en_US', async () => {
            Store.search.set({ path: 'acom' });
            const el = await fixture(html`<mas-translation-langs .selectedLanguages=${[]}></mas-translation-langs>`);
            expect(el.localesArray).to.be.an('array');
            expect(el.localesArray.length).to.be.greaterThan(0);
            expect(el.localesArray.some((item) => item.lang === 'en' && item.country === 'US')).to.be.false;
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

    describe('getLocales method', () => {
        it('should create a matrix with correct number of rows', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const expectedRows = Math.ceil(el.localesArray.length / 4);
            expect(el.localesMatrix).to.have.lengthOf(expectedRows);
        });

        it('should fill last row with empty objects if needed', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const lastRow = el.localesMatrix[el.localesMatrix.length - 1];
            const totalLocales = el.localesArray.length;
            const remainder = totalLocales % 4;
            if (remainder !== 0) {
                const emptyCount = 4 - remainder;
                const emptyItems = lastRow.filter((item) => !item.locale);
                expect(emptyItems).to.have.lengthOf(emptyCount);
            }
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

    describe('changeCheckboxState method', () => {
        it('should add locale when checkbox is checked', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const mockEvent = {
                target: { checked: true, textContent: '  en_US  ' },
                stopPropagation: sandbox.stub(),
            };
            el.changeCheckboxState(mockEvent);
            expect(Store.translationProjects.targetLocales.get()).to.include('en_US');
        });

        it('should remove locale when checkbox is unchecked', async () => {
            Store.translationProjects.targetLocales.set(['en_US', 'fr_FR']);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const mockEvent = {
                target: { checked: false, textContent: '  en_US  ' },
                stopPropagation: sandbox.stub(),
            };
            el.changeCheckboxState(mockEvent);
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
            el.changeCheckboxState(mockEvent);
            expect(stopPropagationStub.calledOnce).to.be.true;
        });

        it('should preserve existing selections when adding new locale', async () => {
            Store.translationProjects.targetLocales.set(['fr_FR', 'de_DE']);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const mockEvent = {
                target: { checked: true, textContent: 'en_US' },
                stopPropagation: sandbox.stub(),
            };
            el.changeCheckboxState(mockEvent);
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
            const selectAllCheckbox = el.shadowRoot.querySelector('#cb-select-all');
            expect(selectAllCheckbox).to.exist;
        });

        it('should render select all checkbox with correct label', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const selectAllCheckbox = el.shadowRoot.querySelector('#cb-select-all');
            expect(selectAllCheckbox.textContent.trim()).to.equal('Select all');
        });

        it('should render number of languages display', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const languagesDisplay = el.shadowRoot.querySelector('.nmb-languages');
            expect(languagesDisplay).to.exist;
            expect(languagesDisplay.textContent).to.include('languages');
        });

        it('should render divider', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const divider = el.shadowRoot.querySelector('sp-divider');
            expect(divider).to.exist;
        });

        it('should render table', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const table = el.shadowRoot.querySelector('sp-table');
            expect(table).to.exist;
            expect(table.getAttribute('quiet')).to.not.be.null;
        });

        it('should render table rows', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(el.localesMatrix.length);
        });

        it('should render table cells with checkboxes', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells.length).to.be.greaterThan(0);
            const checkboxes = el.shadowRoot.querySelectorAll('sp-table-cell sp-checkbox');
            expect(checkboxes.length).to.be.greaterThan(0);
        });

        it('should not render checkbox for empty cells', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const lastRow = el.localesMatrix[el.localesMatrix.length - 1];
            const emptyItemsCount = lastRow.filter((item) => !item.locale).length;
            if (emptyItemsCount > 0) {
                const rows = el.shadowRoot.querySelectorAll('sp-table-row');
                const lastRowElement = rows[rows.length - 1];
                const cells = lastRowElement.querySelectorAll('sp-table-cell');
                let emptyCheckboxCells = 0;
                cells.forEach((cell) => {
                    if (!cell.querySelector('sp-checkbox')) {
                        emptyCheckboxCells++;
                    }
                });
                expect(emptyCheckboxCells).to.equal(emptyItemsCount);
            }
        });
    });

    describe('checkbox interaction', () => {
        it('should check select all checkbox when all locales are selected', async () => {
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const allLocales = el.localesArray.map((item) => item.locale);
            Store.translationProjects.targetLocales.set(allLocales);
            await el.updateComplete;
            const selectAllCheckbox = el.shadowRoot.querySelector('#cb-select-all');
            expect(selectAllCheckbox.checked).to.be.true;
        });

        it('should uncheck select all checkbox when not all locales are selected', async () => {
            Store.translationProjects.targetLocales.set(['en_US']);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            await el.updateComplete;
            const selectAllCheckbox = el.shadowRoot.querySelector('#cb-select-all');
            expect(selectAllCheckbox.checked).to.be.false;
        });

        it('should check individual checkbox when locale is selected', async () => {
            Store.translationProjects.targetLocales.set(['en_US']);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            await el.updateComplete;
            const checkboxes = el.shadowRoot.querySelectorAll('sp-table-cell sp-checkbox');
            const enUsCheckbox = Array.from(checkboxes).find((cb) => cb.textContent.trim() === 'en_US');
            if (enUsCheckbox) {
                expect(enUsCheckbox.checked).to.be.true;
            }
        });

        it('should uncheck individual checkbox when locale is not selected', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            await el.updateComplete;
            const checkboxes = el.shadowRoot.querySelectorAll('sp-table-cell sp-checkbox');
            checkboxes.forEach((checkbox) => {
                expect(checkbox.checked).to.be.false;
            });
        });

        it('should trigger selectAll when select all checkbox changes', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            const allLocales = el.localesArray.map((item) => item.locale);
            const selectAllCheckbox = el.shadowRoot.querySelector('#cb-select-all');
            // Simulate checking the checkbox
            selectAllCheckbox.checked = true;
            selectAllCheckbox.dispatchEvent(new Event('change'));
            await el.updateComplete;
            // Verify effect: all locales should be selected
            expect(Store.translationProjects.targetLocales.get()).to.deep.equal(allLocales);
        });

        it('should trigger changeCheckboxState when individual checkbox changes', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            await el.updateComplete;
            const checkboxes = el.shadowRoot.querySelectorAll('sp-table-cell sp-checkbox');
            if (checkboxes.length > 0) {
                const firstCheckbox = checkboxes[0];
                const localeText = firstCheckbox.textContent.trim();
                // Simulate checking the checkbox
                firstCheckbox.checked = true;
                firstCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                await el.updateComplete;
                // Verify effect: the locale should be added to the selection
                expect(Store.translationProjects.targetLocales.get()).to.include(localeText);
            }
        });
    });

    describe('reactivity', () => {
        it('should update when targetLocales store changes', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-languages></mas-translation-languages>`);
            await el.updateComplete;
            const languagesDisplay = el.shadowRoot.querySelector('.nmb-languages');
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
