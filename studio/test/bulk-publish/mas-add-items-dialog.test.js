import { fixture, html, expect } from '@open-wc/testing';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import '../../src/mas-add-items-dialog.js';

describe('mas-add-items-dialog store reset', () => {
    beforeEach(() => setItemsSelectionStore(Store.bulkPublishProjects));

    afterEach(() => {
        Store.bulkPublishProjects.allCards.set([]);
        Store.bulkPublishProjects.displayCards.set([]);
        Store.bulkPublishProjects.groupedVariationsByParent.set(new Map());
        Store.bulkPublishProjects.groupedVariationsData.set(new Map());
        Store.bulkPublishProjects.allCollections.set([]);
        Store.bulkPublishProjects.displayCollections.set([]);
        Store.bulkPublishProjects.allPlaceholders.set([]);
        Store.bulkPublishProjects.displayPlaceholders.set([]);
    });

    it('clears allCards and groupedVariationsByParent when dialog opens', async () => {
        Store.bulkPublishProjects.allCards.set([{ path: '/stale', title: 'stale' }]);
        Store.bulkPublishProjects.groupedVariationsByParent.set(new Map([['/stale', new Map()]]));

        const el = await fixture(html`<mas-add-items-dialog></mas-add-items-dialog>`);
        el.open = true;
        await el.updateComplete;

        expect(Store.bulkPublishProjects.allCards.value).to.deep.equal([]);
        expect(Store.bulkPublishProjects.groupedVariationsByParent.value.size).to.equal(0);
    });

    it('does NOT clear selectedCards when dialog opens', async () => {
        Store.bulkPublishProjects.selectedCards.set(['/keep-me']);
        const el = await fixture(html`<mas-add-items-dialog></mas-add-items-dialog>`);
        el.open = true;
        await el.updateComplete;
        expect(Store.bulkPublishProjects.selectedCards.value).to.deep.equal(['/keep-me']);
    });

    it('mounts hidden search-and-filters on Collections tab (filter runs, no visible chrome)', async () => {
        const el = await fixture(html`<mas-add-items-dialog></mas-add-items-dialog>`);
        el.open = true;
        el.selectedTab = 'collections';
        await el.updateComplete;
        const search = el.shadowRoot.querySelector('mas-search-and-filters[search-only]');
        expect(search).to.exist;
        expect(search.hasAttribute('hidden')).to.equal(true);
    });

    it('mounts hidden search-and-filters on Placeholders tab', async () => {
        const el = await fixture(html`<mas-add-items-dialog></mas-add-items-dialog>`);
        el.open = true;
        el.selectedTab = 'placeholders';
        await el.updateComplete;
        const search = el.shadowRoot.querySelector('mas-search-and-filters[search-only]');
        expect(search).to.exist;
        expect(search.hasAttribute('hidden')).to.equal(true);
    });

    it('does NOT hide search-and-filters on Cards tab (filter chips visible)', async () => {
        const el = await fixture(html`<mas-add-items-dialog></mas-add-items-dialog>`);
        el.open = true;
        el.selectedTab = 'cards';
        await el.updateComplete;
        const search = el.shadowRoot.querySelector('mas-search-and-filters:not([search-only])');
        expect(search).to.exist;
        expect(search.hasAttribute('hidden')).to.equal(false);
    });
});
