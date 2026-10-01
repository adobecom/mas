import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import '../../../src/swc.js';
import '../../../src/common/components/mas-grouped-selector.js';

describe('MasGroupedSelector', () => {
    afterEach(() => {
        fixtureCleanup();
    });

    const groups = [
        {
            name: 'EMEA',
            items: [
                { value: 'FR', label: 'France' },
                { value: 'DE', label: 'Germany' },
            ],
        },
        {
            name: 'Americas',
            items: [{ value: 'US', label: 'United States' }],
        },
    ];

    describe('empty state', () => {
        it('shows the label and an add trigger when nothing is selected', async () => {
            const el = await fixture(
                html`<mas-grouped-selector label="Selected countries" .groups=${groups}></mas-grouped-selector>`,
            );
            expect(el.shadowRoot.querySelector('h2').textContent).to.include('Selected countries');
            expect(el.shadowRoot.querySelector('overlay-trigger')).to.exist;
        });

        it('hides the add trigger in read-only mode', async () => {
            const el = await fixture(
                html`<mas-grouped-selector label="Selected countries" .groups=${groups} read-only></mas-grouped-selector>`,
            );
            expect(el.shadowRoot.querySelector('overlay-trigger')).to.not.exist;
        });
    });

    describe('disabled state', () => {
        it('shows the placeholder and no trigger when disabled', async () => {
            const el = await fixture(
                html`<mas-grouped-selector
                    label="Selected countries"
                    .groups=${groups}
                    disabled
                    placeholder="Select surfaces first
Countries will be generated automatically once surfaces are selected."
                ></mas-grouped-selector>`,
            );
            expect(el.shadowRoot.querySelector('overlay-trigger')).to.not.exist;
            expect(el.shadowRoot.querySelector('.placeholder').textContent).to.include('Select surfaces first');
        });
    });

    describe('populated state', () => {
        it('shows the selection count and an edit trigger', async () => {
            const el = await fixture(
                html`<mas-grouped-selector
                    label="Selected countries"
                    .groups=${groups}
                    .value=${['FR']}
                ></mas-grouped-selector>`,
            );
            expect(el.shadowRoot.querySelector('h2').textContent).to.include('(1)');
            expect(el.shadowRoot.querySelector('overlay-trigger')).to.exist;
        });

        it('expands to show the selected labels on click', async () => {
            const el = await fixture(
                html`<mas-grouped-selector
                    label="Selected countries"
                    .groups=${groups}
                    .value=${['FR', 'US']}
                ></mas-grouped-selector>`,
            );
            el.shadowRoot.querySelector('.form-field').dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await el.updateComplete;
            const list = el.shadowRoot.querySelector('.summary-list');
            expect(list).to.exist;
            expect(list.textContent).to.include('France');
            expect(list.textContent).to.include('United States');
        });
    });

    describe('selection', () => {
        it('emits change with the toggled item added', async () => {
            const el = await fixture(
                html`<mas-grouped-selector label="Selected countries" .groups=${groups}></mas-grouped-selector>`,
            );
            const changeSpy = new Promise((resolve) => el.addEventListener('change', (e) => resolve(e.detail)));
            const checkbox = el.shadowRoot.querySelector('sp-checkbox[value="FR"]');
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));
            const detail = await changeSpy;
            expect(detail.value).to.deep.equal(['FR']);
        });

        it('selects every item in a region when the region checkbox is checked', async () => {
            const el = await fixture(
                html`<mas-grouped-selector label="Selected countries" .groups=${groups}></mas-grouped-selector>`,
            );
            const changeSpy = new Promise((resolve) => el.addEventListener('change', (e) => resolve(e.detail)));
            const regionCheckbox = el.shadowRoot.querySelector('.region-header sp-checkbox');
            regionCheckbox.checked = true;
            regionCheckbox.dispatchEvent(new Event('change'));
            const detail = await changeSpy;
            expect(detail.value).to.deep.equal(['FR', 'DE']);
        });

        it('filters groups by search query', async () => {
            const el = await fixture(
                html`<mas-grouped-selector label="Selected countries" .groups=${groups}></mas-grouped-selector>`,
            );
            el.searchQuery = 'franc';
            await el.updateComplete;
            const checkboxes = el.shadowRoot.querySelectorAll('.item-grid sp-checkbox');
            expect(checkboxes).to.have.lengthOf(1);
            expect(checkboxes[0].getAttribute('value')).to.equal('FR');
        });
    });

    describe('cancel', () => {
        it('reverts to the value from when the dialog opened', async () => {
            const el = await fixture(
                html`<mas-grouped-selector
                    label="Selected countries"
                    .groups=${groups}
                    .value=${['FR']}
                ></mas-grouped-selector>`,
            );
            const trigger = el.shadowRoot.querySelector('sp-action-button[slot="trigger"]');
            trigger.dispatchEvent(new Event('click', { bubbles: true }));

            const checkbox = el.shadowRoot.querySelector('sp-checkbox[value="US"]');
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));
            await el.updateComplete;
            expect(el.value).to.deep.equal(['FR', 'US']);

            const dialog = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialog.dispatchEvent(new CustomEvent('cancel'));
            await el.updateComplete;
            expect(el.value).to.deep.equal(['FR']);
        });
    });
});
