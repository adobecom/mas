import { expect } from '@esm-bundle/chai';
import Store from '../../src/store.js';
import { ReactiveStore } from '../../src/reactivity/reactive-store.js';
import '../../src/offer-mapping/mas-offer-mapping.js';
import { parseOffer } from '../../src/offer-mapping/mas-offer-mapping-item.js';

const rowStore = (record) => new ReactiveStore({ geos: [], status: 'DRAFT', fragment: null, ...record });

async function mount() {
    const el = document.createElement('mas-offer-mapping');
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
}

describe('parseOffer', () => {
    it('returns the osi alone when there is no promo code', () => {
        expect(parseOffer('OSI-1')).to.deep.equal({ osi: 'OSI-1', promotionCode: '' });
    });

    it('splits a slash-joined osi and promo code, trimming whitespace', () => {
        expect(parseOffer('OSI-1 / PROMO-2')).to.deep.equal({ osi: 'OSI-1', promotionCode: 'PROMO-2' });
    });

    it('keeps a comma-joined multi-OSI pair intact (comma is not the promo separator)', () => {
        expect(parseOffer('OSI-A,OSI-B')).to.deep.equal({ osi: 'OSI-A,OSI-B', promotionCode: '' });
    });

    it('handles an empty or undefined offer', () => {
        expect(parseOffer('')).to.deep.equal({ osi: '', promotionCode: '' });
        expect(parseOffer(undefined)).to.deep.equal({ osi: '', promotionCode: '' });
    });
});

describe('mas-offer-mapping search', () => {
    afterEach(() => {
        Store.search.set({});
        Store.offerMapping.rows.set([]);
        document.querySelectorAll('mas-offer-mapping').forEach((node) => node.remove());
    });

    it('filters rows by source OSI, target OSI and promo code (case-insensitive)', async () => {
        Store.offerMapping.rows.set([
            rowStore({ id: 'a', sourceOffer: 'SRC-ALPHA', targetOffer: 'TGT-ONE' }),
            rowStore({ id: 'b', sourceOffer: 'SRC-BETA', targetOffer: 'TGT-TWO/SUMMER24' }),
            rowStore({ id: 'c', sourceOffer: 'SRC-GAMMA/WINTER25', targetOffer: 'TGT-THREE' }),
        ]);
        const el = await mount();

        expect(el.rows.length).to.equal(3);

        el.query = 'alpha';
        expect(el.rows.map((row) => row.get().id)).to.deep.equal(['a']);

        el.query = 'tgt-two';
        expect(el.rows.map((row) => row.get().id)).to.deep.equal(['b']);

        // The promo code lives slash-joined on each side — searchable via parseOffer (target promo).
        el.query = 'summer24';
        expect(el.rows.map((row) => row.get().id)).to.deep.equal(['b']);

        // ...and the source promo condition is searchable too.
        el.query = 'winter25';
        expect(el.rows.map((row) => row.get().id)).to.deep.equal(['c']);

        el.query = 'nomatch';
        expect(el.rows.length).to.equal(0);
    });

    it('updates the query from the search input', async () => {
        const el = await mount();
        const search = el.shadowRoot.querySelector('.offer-mapping-search');
        search.value = 'foo';
        search.dispatchEvent(new Event('input'));
        expect(el.query).to.equal('foo');
    });
});
