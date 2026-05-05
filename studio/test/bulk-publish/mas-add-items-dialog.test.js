import { fixture, html, expect } from '@open-wc/testing';
import Store from '../../src/store.js';
import '../../src/mas-add-items-dialog.js';

describe('mas-add-items-dialog store reset', () => {
    afterEach(() => {
        Store.translationProjects.allCards.set([]);
        Store.translationProjects.displayCards.set([]);
        Store.translationProjects.groupedVariationsByParent.set(new Map());
        Store.translationProjects.groupedVariationsData.set(new Map());
        Store.translationProjects.allCollections.set([]);
        Store.translationProjects.displayCollections.set([]);
        Store.translationProjects.allPlaceholders.set([]);
        Store.translationProjects.displayPlaceholders.set([]);
    });

    it('clears allCards and groupedVariationsByParent when dialog opens', async () => {
        Store.translationProjects.allCards.set([{ path: '/stale', title: 'stale' }]);
        Store.translationProjects.groupedVariationsByParent.set(new Map([['/stale', new Map()]]));

        const el = await fixture(html`<mas-add-items-dialog></mas-add-items-dialog>`);
        el.open = true;
        await el.updateComplete;

        expect(Store.translationProjects.allCards.value).to.deep.equal([]);
        expect(Store.translationProjects.groupedVariationsByParent.value.size).to.equal(0);
    });

    it('does NOT clear selectedCards when dialog opens', async () => {
        Store.translationProjects.selectedCards.set(['/keep-me']);
        const el = await fixture(html`<mas-add-items-dialog></mas-add-items-dialog>`);
        el.open = true;
        await el.updateComplete;
        expect(Store.translationProjects.selectedCards.value).to.deep.equal(['/keep-me']);
    });
});
