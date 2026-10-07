import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/mas-ost-app.js';
import { store } from '../../src/store/ost-store.js';

/**
 * resolveDeepLinkProduct registers a 'state-changed' handler to wait for the
 * catalog when the deeplinked product isn't loaded yet. The handler resolved
 * (setProduct → notify) and only THEN removeEventListener'd — but notify
 * re-dispatches 'state-changed' synchronously, re-entering the still-registered
 * handler. With the catalog arriving via setProducts (which also runs the
 * pendingArrangementCode auto-select → setProduct → notify), that re-entry
 * cascaded: setProduct fired dozens of times for one product and, in the built
 * bundle, recursed until the stack overflowed. The sibling resolveDeepLinkOffer
 * handler already does it right: removeEventListener BEFORE resolving.
 */
describe('mas-ost-app deeplink product resolution', () => {
    beforeEach(() => {
        store.init({});
        store.allProducts = [];
        store.selectedProduct = undefined;
    });

    it('resolves the deeplinked product once when the catalog loads afterward (no re-entrant cascade)', async () => {
        const el = await fixture(html`<mas-ost-app></mas-ost-app>`);
        store.allProducts = [];
        store.applySearchParams(new URLSearchParams('arrangement_code=PA-1930'));
        el.resolveDeepLinkProduct('PA-1930');

        let calls = 0;
        const originalSetProduct = store.setProduct.bind(store);
        store.setProduct = (product) => {
            calls += 1;
            if (calls > 100) throw new Error('infinite recursion resolving the deeplinked product');
            return originalSetProduct(product);
        };

        try {
            store.setProducts([['PA-1930', { arrangement_code: 'PA-1930', name: 'Firefly' }]]);
        } finally {
            store.setProduct = originalSetProduct;
        }

        expect(store.selectedProduct?.arrangement_code).to.equal('PA-1930');
        expect(calls, 'the deeplinked product must resolve once, not re-enter on every notify').to.be.lessThan(5);
    });
});
