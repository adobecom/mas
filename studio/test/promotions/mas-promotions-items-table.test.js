import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { TABLE_TYPE } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/promotions/mas-promotions-items-table.js';

describe('MasPromotionsItemsTable', () => {
    beforeEach(() => {
        setItemsSelectionStore(Store.promotions);
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedCollections.set([]);
    });

    afterEach(() => {
        fixtureCleanup();
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedCollections.set([]);
        setItemsSelectionStore(null);
    });

    it('exposes card column definitions when type is cards', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        expect(el.tableColumns.map((c) => c.key)).to.deep.equal([
            'offer',
            'fragmentTitle',
            'offerId',
            'path',
            'itemType',
            'status',
            'actions',
            'preview',
        ]);
    });

    it('exposes collection column definitions when type is collections', async () => {
        const el = await fixture(
            html`<mas-promotions-items-table .type=${TABLE_TYPE.COLLECTIONS}></mas-promotions-items-table>`,
        );
        expect(el.tableColumns.map((c) => c.key)).to.deep.equal(['collectionTitle', 'path', 'status', 'actions', 'preview']);
    });

    it('shows empty state when there is no repository and paths are selected', async () => {
        Store.promotions.selectedCards.set(['/some/path']);
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 0));
        await el.updateComplete;
        expect(el.shadowRoot.textContent).to.include('No items found');
    });
});
