import { expect } from '@esm-bundle/chai';
import 'https://main--milo--adobecom.hlx.page/libs/deps/mas/merch-card-all.js';
import { Store } from '../../src/store/Store.js';
import { withAem } from '../mocks/aem.js';
import { mockFetch } from '../mocks/fetch.js';
import { mockIms } from '../mocks/ims.js';

describe('Store', async () => {
    await mockFetch(withAem);
    await mockIms();
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
