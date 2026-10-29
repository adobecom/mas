import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/mas-product-catalog.js';
import Store from '../../src/store.js';
import { clearProductCache } from '../../src/services/product-api.js';

const individual = { name: 'Photoshop', arrangement_code: 'phsp', customer_segment: 'INDIVIDUAL' };
const team = { name: 'Illustrator', arrangement_code: 'ill', customerSegments: { TEAM: true } };
const mixed = { name: 'Acrobat', arrangement_code: 'acro', customerSegments: { TEAM: true, ENTERPRISE: true } };
const enterpriseString = { name: 'Enterprise Suite', arrangement_code: 'ent1', customer_segment: 'ENTERPRISE' };
const enterpriseObject = { name: 'Enterprise Cloud', arrangement_code: 'ent2', customerSegments: { ENTERPRISE: true } };

describe('MasProductCatalog ENTERPRISE offers', () => {
    let el;
    let originalFetch;

    beforeEach(async () => {
        originalFetch = globalThis.fetch;
        sessionStorage.setItem('masAccessToken', 'test-token');
        clearProductCache();
        globalThis.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => [enterpriseString, individual, enterpriseObject, team, mixed],
        });
        el = document.createElement('mas-product-catalog');
        await el.loadProducts();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        sessionStorage.removeItem('masAccessToken');
        clearProductCache();
        Store.productCatalog.search.set('');
        sinon.restore();
    });

    const expected = [mixed, individual, team].sort((a, b) => a.name.localeCompare(b.name));

    it('lists no ENTERPRISE-only products and keeps the others in order', () => {
        expect(el.filteredProducts).to.deep.equal(expected);
        expect(el.filteredProducts.every((p, i) => p === expected[i])).to.equal(true);
    });

    it('lists no ENTERPRISE-only products when searching for one', () => {
        Store.productCatalog.search.set('enterprise');
        expect(el.filteredProducts).to.deep.equal([]);
    });

    it('lists no ENTERPRISE-only products when filtering by the ENTERPRISE segment', () => {
        el.segmentsFilter = new Set(['ENTERPRISE']);
        expect(el.filteredProducts).to.deep.equal([mixed]);
    });
});
