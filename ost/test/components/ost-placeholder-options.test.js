import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-placeholder-options.js';
import { store } from '../../src/store/ost-store.js';

const cb = (el, key) => el.shadowRoot.querySelector(`[data-testid="ost-disable-${key}"]`);
const isChecked = (box) => box.hasAttribute('checked');

describe('ost-placeholder-options', () => {
    beforeEach(() => {
        store.defaultPlaceholderOptions = {
            displayFormatted: true,
            displayRecurrence: true,
            displayPerUnit: false,
            displayTax: false,
            forceTaxExclusive: false,
            displayOldPrice: true,
        };
        store.placeholderOptions = { ...store.defaultPlaceholderOptions };
    });

    afterEach(() => {
        store.placeholderOptions = { ...store.defaultPlaceholderOptions };
    });

    const expand = async (el) => {
        const toggle = el.shadowRoot.querySelector('[data-testid="ost-options-toggle"]');
        toggle.click();
        await el.updateComplete;
    };

    it('is collapsed by default — no checkboxes shown', async () => {
        const el = await fixture(html`<ost-placeholder-options></ost-placeholder-options>`);
        expect(Boolean(el.shadowRoot.querySelector('sp-checkbox'))).to.be.false;
        expect(el.shadowRoot.querySelector('[data-testid="ost-options-toggle"]')).to.exist;
    });

    it('expands the checkbox group when the toggle is clicked', async () => {
        const el = await fixture(html`<ost-placeholder-options></ost-placeholder-options>`);
        await expand(el);
        const group = el.shadowRoot.querySelector('sp-checkbox-group, .disable-group');
        expect(group).to.exist;
    });

    it('renders the five disable checkboxes with terse labels (no HTML Format)', async () => {
        const el = await fixture(html`<ost-placeholder-options></ost-placeholder-options>`);
        await expand(el);
        const boxes = el.shadowRoot.querySelectorAll('sp-checkbox');
        const labels = Array.from(boxes).map((b) => b.textContent.trim());
        expect(labels).to.deep.equal(['Term', 'Unit', 'Tax Label', 'Include Tax', 'Old price']);
    });

    it('checked = disabled for an enabled-by-default option', async () => {
        const el = await fixture(html`<ost-placeholder-options></ost-placeholder-options>`);
        await expand(el);
        expect(isChecked(cb(el, 'displayRecurrence'))).to.be.false;
    });

    it('checked when the option is disabled', async () => {
        store.placeholderOptions = { ...store.placeholderOptions, displayRecurrence: false };
        const el = await fixture(html`<ost-placeholder-options></ost-placeholder-options>`);
        await expand(el);
        expect(isChecked(cb(el, 'displayRecurrence'))).to.be.true;
    });

    it('toggling a Disable checkbox turns the option off in the store', async () => {
        const el = await fixture(html`<ost-placeholder-options></ost-placeholder-options>`);
        await expand(el);
        const box = cb(el, 'displayRecurrence');
        box.checked = true;
        box.dispatchEvent(new Event('change'));
        expect(store.placeholderOptions.displayRecurrence).to.be.false;
    });

    it('Include Tax is checked when tax is included (forceTaxExclusive false)', async () => {
        const el = await fixture(html`<ost-placeholder-options></ost-placeholder-options>`);
        await expand(el);
        expect(isChecked(cb(el, 'forceTaxExclusive'))).to.be.true;
    });

    it('unchecking Include Tax sets forceTaxExclusive true', async () => {
        const el = await fixture(html`<ost-placeholder-options></ost-placeholder-options>`);
        await expand(el);
        const box = cb(el, 'forceTaxExclusive');
        box.checked = false;
        box.dispatchEvent(new Event('change'));
        expect(store.placeholderOptions.forceTaxExclusive).to.be.true;
    });

    it('does not render an HTML Format option', async () => {
        const el = await fixture(html`<ost-placeholder-options></ost-placeholder-options>`);
        await expand(el);
        expect(Boolean(cb(el, 'displayFormatted'))).to.be.false;
    });

    describe('every Disable checkbox drives its option (5 keys)', () => {
        const optionBoxes = [
            { key: 'displayRecurrence', default: true },
            { key: 'displayPerUnit', default: false },
            { key: 'displayTax', default: false },
            { key: 'forceTaxExclusive', default: false },
            { key: 'displayOldPrice', default: true },
        ];

        const fireBox = (el, key, checked) => {
            const box = cb(el, key);
            box.checked = checked;
            box.dispatchEvent(new Event('change'));
        };

        optionBoxes.forEach(({ key, default: defaultValue }) => {
            const nonDefault = !defaultValue;
            // checked = disabled for every key, including forceTaxExclusive
            // (checked "Include Tax" means tax included = forceTaxExclusive false).
            const checkedToFlip = defaultValue;

            it(`toggling ${key} away from its default sets the option to ${nonDefault}`, async () => {
                const el = await fixture(html`<ost-placeholder-options></ost-placeholder-options>`);
                await expand(el);
                expect(store.getEffectiveOptions('price')[key]).to.equal(defaultValue);
                fireBox(el, key, checkedToFlip);
                expect(store.getEffectiveOptions('price')[key]).to.equal(nonDefault);
            });

            it(`toggling ${key} back restores the option to ${defaultValue}`, async () => {
                const el = await fixture(html`<ost-placeholder-options></ost-placeholder-options>`);
                await expand(el);
                fireBox(el, key, checkedToFlip);
                expect(store.getEffectiveOptions('price')[key]).to.equal(nonDefault);
                fireBox(el, key, !checkedToFlip);
                expect(store.getEffectiveOptions('price')[key]).to.equal(defaultValue);
            });
        });
    });
});
