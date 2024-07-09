import { expect } from '@esm-bundle/chai';
import '@adobe/mas-web-components/src/merch-datasource.js';
import { Store } from '../../src/store/Store.js';
import { withAem } from '../mocks/aem.js';
import { mockFetch } from '../mocks/fetch.js';

describe('Store', async () => {
    await mockFetch(withAem);
    describe('Search', () => {
        it('perform a search with [query, path] params', async () => {
            const store = new Store('test');
            await store.doSearch({
                query: 'test',
            });
            expect(store.search).to.exist;
            expect(store.search.result.length).eq(2);
            const [cc, ps] = store.search.result.values();
            expect(cc.path).eq('/content/dam/sandbox/mas/creative-cloud');
            expect(ps.path).eq('/content/dam/sandbox/mas/photoshop');
        });
    });
});
