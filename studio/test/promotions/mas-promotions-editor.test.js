import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import MasPromotionsEditor from '../../src/mas-promotions-editor.js';

describe('MasPromotionsEditor', () => {
    let sandbox;
    let originalInEdit;
    let originalSelectedCards;
    let originalSelectedCollections;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalInEdit = Store.promotions.inEdit.get();
        originalSelectedCards = [...Store.promotions.selectedCards.value];
        originalSelectedCollections = [...Store.promotions.selectedCollections.value];
        Store.promotions.inEdit.set(null);
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedCollections.set([]);
        setItemsSelectionStore(Store.promotions);
    });

    afterEach(() => {
        sandbox.restore();
        Store.promotions.inEdit.set(originalInEdit);
        Store.promotions.selectedCards.set(originalSelectedCards);
        Store.promotions.selectedCollections.set(originalSelectedCollections);
        document.querySelectorAll('mas-promotions-editor').forEach((n) => n.remove());
        setItemsSelectionStore(null);
    });

    async function mountEditor() {
        const el = new MasPromotionsEditor();
        sandbox.stub(el, 'repository').get(() => null);
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
    }

    describe('selectedItemsCount', () => {
        it('sums selected cards and collections from the promotions store', async () => {
            const el = await mountEditor();
            Store.promotions.selectedCards.set(['/c1']);
            Store.promotions.selectedCollections.set(['/col1', '/col2']);
            await el.updateComplete;
            expect(el.selectedItemsCount).to.equal(3);
        });
    });
});
