import { expect } from '@esm-bundle/chai';
import Store from '../src/store.js';
import { PAGE_NAMES, SORT_COLUMNS } from '../src/constants.js';

describe('Store.sort on the content page', () => {
    let originalPage;
    let originalSort;

    beforeEach(() => {
        originalPage = Store.page.get();
        originalSort = Store.sort.get();
        Store.page.set(PAGE_NAMES.CONTENT);
    });

    afterEach(() => {
        Store.page.set(originalPage);
        Store.sort.set(originalSort);
    });

    it('uses null (no sort) as the content default', () => {
        expect(SORT_COLUMNS[PAGE_NAMES.CONTENT][0]).to.be.null;
    });

    it('keeps a valid sort when the same page is set again', () => {
        Store.sort.set({ sortBy: 'path', sortDirection: 'desc' });
        Store.page.set(PAGE_NAMES.CONTENT);
        expect(Store.sort.get()).to.deep.equal({ sortBy: 'path', sortDirection: 'desc' });
    });

    it('drops an invalid sortBy', () => {
        Store.sort.set({ sortBy: 'price', sortDirection: 'asc' });
        expect(Store.sort.get().sortBy).to.be.null;
    });

    it('resets the sort when the page changes', () => {
        Store.sort.set({ sortBy: 'title', sortDirection: 'desc' });
        Store.page.set(PAGE_NAMES.PLACEHOLDERS);
        expect(Store.sort.get().sortBy).to.equal('key');
    });
});
