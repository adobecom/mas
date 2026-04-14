import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import { CARD_MODEL_PATH } from '../../../src/constants.js';
import '../../../src/swc.js';
import '../../../src/common/components/mas-items-selected-panel.js';

describe('MasItemsSelectedPanel', () => {
    afterEach(() => {
        fixtureCleanup();
    });

    const item = {
        path: '/content/item-1',
        title: 'My card',
        model: { path: CARD_MODEL_PATH },
    };

    it('renders nothing when not visible', async () => {
        const el = await fixture(html`<mas-items-selected-panel .visible=${false} .items=${[item]}></mas-items-selected-panel>`);
        expect(el.shadowRoot.textContent.trim()).to.equal('');
        expect(el.shadowRoot.querySelector('ul.selected-items')).to.be.null;
    });

    it('renders nothing when visible but no items', async () => {
        const el = await fixture(html`<mas-items-selected-panel .visible=${true} .items=${[]}></mas-items-selected-panel>`);
        expect(el.shadowRoot.textContent.trim()).to.equal('');
        expect(el.shadowRoot.querySelector('ul.selected-items')).to.be.null;
    });

    it('renders titles when visible with items', async () => {
        const el = await fixture(html`<mas-items-selected-panel .visible=${true} .items=${[item]}></mas-items-selected-panel>`);
        expect(el.shadowRoot.textContent).to.include('My card');
    });

    it('dispatches remove-item when remove is clicked', async () => {
        const onRemove = sinon.spy();
        const el = await fixture(html`
            <mas-items-selected-panel .visible=${true} .items=${[item]} @remove-item=${onRemove}></mas-items-selected-panel>
        `);
        const btn = el.shadowRoot.querySelector('sp-button.remove-button');
        btn.click();
        expect(onRemove.calledOnce).to.be.true;
        expect(onRemove.firstCall.args[0].detail.path).to.equal(item.path);
        expect(onRemove.firstCall.args[0].detail.item).to.equal(item);
    });
});
