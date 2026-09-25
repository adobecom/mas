import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup, oneEvent } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/common/components/mas-group-by-select.js';

const OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'template', label: 'Template' },
    { value: 'offer', label: 'Offer' },
];

describe('MasGroupBySelect', () => {
    afterEach(() => fixtureCleanup());

    it('renders the label and one action button per option', async () => {
        const el = await fixture(html`<mas-group-by-select .options=${OPTIONS} .value=${'none'}></mas-group-by-select>`);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.group-by-label').textContent.trim()).to.equal('Group by');
        const buttons = el.shadowRoot.querySelectorAll('sp-action-button');
        expect(Array.from(buttons).map((b) => b.getAttribute('value'))).to.deep.equal(['none', 'template', 'offer']);
    });

    it('marks the selected option from value', async () => {
        const el = await fixture(html`<mas-group-by-select .options=${OPTIONS} .value=${'template'}></mas-group-by-select>`);
        await el.updateComplete;
        const selected = el.shadowRoot.querySelector('sp-action-button[value="template"]');
        expect(selected.selected).to.be.true;
    });

    it('emits change with the new value when a different option is picked', async () => {
        const el = await fixture(html`<mas-group-by-select .options=${OPTIONS} .value=${'none'}></mas-group-by-select>`);
        await el.updateComplete;
        const group = el.shadowRoot.querySelector('sp-action-group');
        setTimeout(() => {
            group.selected = ['offer'];
            group.dispatchEvent(new Event('change'));
        });
        const event = await oneEvent(el, 'change');
        expect(event.detail.value).to.equal('offer');
        expect(el.value).to.equal('offer');
    });

    it('disables every action button when disabled is set', async () => {
        const el = await fixture(
            html`<mas-group-by-select .options=${OPTIONS} .value=${'none'} ?disabled=${true}></mas-group-by-select>`,
        );
        await el.updateComplete;
        const buttons = el.shadowRoot.querySelectorAll('sp-action-button');
        expect(Array.from(buttons).every((b) => b.disabled)).to.be.true;
    });

    it('does not emit change when the value is unchanged', async () => {
        const el = await fixture(html`<mas-group-by-select .options=${OPTIONS} .value=${'offer'}></mas-group-by-select>`);
        await el.updateComplete;
        let fired = false;
        el.addEventListener('change', () => {
            fired = true;
        });
        const group = el.shadowRoot.querySelector('sp-action-group');
        group.selected = ['offer'];
        group.dispatchEvent(new Event('change'));
        expect(fired).to.be.false;
    });
});
