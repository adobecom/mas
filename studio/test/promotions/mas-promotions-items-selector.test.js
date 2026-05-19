import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { TABLE_TYPE } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/promotions/mas-promotions-items-selector.js';

describe('MasPromotionsItemsSelector', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        setItemsSelectionStore(Store.promotions);
        Store.promotions.inEdit.set(null);
        Store.promotions.showSelected.set(false);
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedCollections.set([]);
        Store.promotions.selectedPlaceholders.set([]);
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.promotions.inEdit.set(null);
        Store.promotions.showSelected.set(false);
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedCollections.set([]);
        Store.promotions.selectedPlaceholders.set([]);
        setItemsSelectionStore(null);
    });

    it('renders two promotion tabs', async () => {
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        expect(el.shadowRoot.querySelectorAll('sp-tab').length).to.equal(2);
    });

    it('dispatches promotion-items-tab-change when tab selection changes', async () => {
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        const spy = sandbox.spy();
        el.addEventListener('promotion-items-tab-change', spy);
        const tabs = el.shadowRoot.querySelector('sp-tabs');
        tabs.selected = TABLE_TYPE.COLLECTIONS;
        tabs.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
        expect(spy.callCount).to.equal(1);
        expect(spy.firstCall.args[0].detail.tab).to.equal(TABLE_TYPE.COLLECTIONS);
    });

    it('updates selectedCount when store selection changes', async () => {
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        expect(el.selectedCount).to.equal(0);
        Store.promotions.selectedCards.set(['/a']);
        Store.promotions.selectedPlaceholders.set(['/p']);
        Store.promotions.selectedCollections.set(['/c']);
        await el.updateComplete;
        expect(el.selectedCount).to.equal(3);
    });

    it('renders mas-promotions-items-table when viewOnly', async () => {
        const el = await fixture(html`<mas-promotions-items-selector .viewOnly=${true}></mas-promotions-items-selector>`);
        expect(el.shadowRoot.querySelectorAll('mas-promotions-items-table').length).to.equal(2);
    });
});
