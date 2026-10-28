import { expect } from '@esm-bundle/chai';
import { sortFragmentStores } from '../src/mas-fragment-table.js';

const makeStore = (title) => ({
    get: () => ({ title, path: `/content/dam/mas/acom/en_US/${title}`, fields: [] }),
});
const titles = (stores) => stores.map((store) => store.get().title);

describe('sortFragmentStores', () => {
    it('sorts titles case-insensitively and number-aware', () => {
        const stores = ['banana', 'Apple', 'item10', 'apple', 'item2'].map((title) => makeStore(title));
        const sorted = sortFragmentStores(stores, { sortBy: 'title', sortDirection: 'asc' });
        expect(
            titles(sorted)
                .slice(0, 2)
                .map((t) => t.toLowerCase()),
        ).to.deep.equal(['apple', 'apple']);
        expect(titles(sorted).indexOf('item2')).to.be.lessThan(titles(sorted).indexOf('item10'));
    });

    it('ignores leading whitespace in titles', () => {
        const stores = [' Zed', 'Alpha'].map((title) => makeStore(title));
        expect(titles(sortFragmentStores(stores, { sortBy: 'title', sortDirection: 'asc' }))).to.deep.equal(['Alpha', ' Zed']);
    });

    it('keeps empty titles last in both directions', () => {
        const stores = ['b', '', 'a'].map((title) => makeStore(title));
        expect(titles(sortFragmentStores(stores, { sortBy: 'title', sortDirection: 'asc' }))).to.deep.equal(['a', 'b', '']);
        expect(titles(sortFragmentStores(stores, { sortBy: 'title', sortDirection: 'desc' }))).to.deep.equal(['b', 'a', '']);
    });

    it('reverses the order for desc', () => {
        const stores = ['b', 'a', 'c'].map((title) => makeStore(title));
        expect(titles(sortFragmentStores(stores, { sortBy: 'title', sortDirection: 'desc' }))).to.deep.equal(['c', 'b', 'a']);
    });

    it('computes one key per row', () => {
        let calls = 0;
        const stores = ['b', 'a', 'c', 'd'].map((title) => ({
            get: () => {
                calls++;
                return { title, path: '', fields: [] };
            },
        }));
        sortFragmentStores(stores, { sortBy: 'title', sortDirection: 'asc' });
        expect(calls).to.equal(stores.length);
    });

    it('leaves the order untouched for no sort and for the API-sorted Last Modified', () => {
        const stores = ['b', 'a'].map((title) => makeStore(title));
        expect(sortFragmentStores(stores, { sortBy: null, sortDirection: 'asc' })).to.equal(stores);
        expect(sortFragmentStores(stores, { sortBy: 'modifiedOrCreated', sortDirection: 'asc' })).to.equal(stores);
    });
});
