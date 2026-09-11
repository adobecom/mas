import { expect } from '@esm-bundle/chai';
import {
    GROUP_BY_NONE,
    GROUP_BY_OPTIONS,
    UNCATEGORIZED_GROUP,
    getGroupName,
    groupFragmentStores,
} from '../../src/fragments/fragment-grouping.js';

describe('fragment-grouping', () => {
    const makeStore = (fragment) => ({
        get: () => fragment,
        value: fragment,
    });

    const templateFragment = (title, modelTitle) => ({
        title,
        model: { title: modelTitle },
        tags: [],
    });

    const offerFragment = (title, offerTitle) => ({
        title,
        model: { title: 'Card' },
        tags: offerTitle ? [{ id: `mas:product_code/${offerTitle}`, title: offerTitle }] : [],
    });

    it('keeps the flat rendering path when groupBy is none', () => {
        const stores = [makeStore(templateFragment('a', 'Card')), makeStore(templateFragment('b', 'Card'))];

        expect(groupFragmentStores(stores, GROUP_BY_NONE)).to.equal(null);
    });

    it('groups by template with correct member counts', () => {
        const stores = [
            makeStore(templateFragment('a', 'Mini Compare Segment')),
            makeStore(templateFragment('b', 'Mini Compare Segment')),
            makeStore(templateFragment('c', 'Mini Compare Segment')),
            makeStore(templateFragment('d', 'Card')),
        ];

        const groups = groupFragmentStores(stores, 'template');

        expect(groups).to.have.lengthOf(2);
        expect(groups.find((g) => g.name === 'Mini Compare Segment').stores).to.have.lengthOf(3);
        expect(groups.find((g) => g.name === 'Card').stores).to.have.lengthOf(1);
    });

    it('groups by offer with correct member counts', () => {
        const stores = [
            makeStore(offerFragment('a', 'Creative Cloud')),
            makeStore(offerFragment('b', 'Creative Cloud')),
            makeStore(offerFragment('c', 'Photoshop')),
        ];

        const groups = groupFragmentStores(stores, 'offer');

        expect(groups).to.have.lengthOf(2);
        expect(groups.find((g) => g.name === 'Creative Cloud').stores).to.have.lengthOf(2);
        expect(groups.find((g) => g.name === 'Photoshop').stores).to.have.lengthOf(1);
    });

    it('buckets fragments with missing/empty/whitespace template or offer under Uncategorized without dropping any', () => {
        const stores = [
            makeStore(templateFragment('a', undefined)),
            makeStore(templateFragment('b', '')),
            makeStore(templateFragment('c', '   ')),
            makeStore(templateFragment('d', 'Card')),
        ];

        const groups = groupFragmentStores(stores, 'template');
        const total = groups.reduce((sum, group) => sum + group.stores.length, 0);

        expect(total).to.equal(stores.length);
        expect(groups.find((g) => g.name === UNCATEGORIZED_GROUP).stores).to.have.lengthOf(3);
    });

    it('buckets fragments with no offer tag under Uncategorized without dropping any', () => {
        const stores = [makeStore(offerFragment('a', undefined)), makeStore(offerFragment('b', 'Photoshop'))];

        const groups = groupFragmentStores(stores, 'offer');
        const total = groups.reduce((sum, group) => sum + group.stores.length, 0);

        expect(total).to.equal(stores.length);
        expect(groups.find((g) => g.name === UNCATEGORIZED_GROUP).stores).to.have.lengthOf(1);
    });

    it('returns groups sorted case-insensitively alphabetically by name', () => {
        const stores = [
            makeStore(templateFragment('a', 'zebra')),
            makeStore(templateFragment('b', 'Apple')),
            makeStore(templateFragment('c', 'banana')),
        ];

        const groups = groupFragmentStores(stores, 'template');

        expect(groups.map((g) => g.name)).to.deep.equal(['Apple', 'banana', 'zebra']);
    });

    it('exposes exactly three group-by options, defaulting to none', () => {
        expect(GROUP_BY_OPTIONS).to.have.lengthOf(3);
        expect(GROUP_BY_OPTIONS.map((o) => o.label)).to.deep.equal(['Template', 'Offer', 'None']);
        expect(GROUP_BY_OPTIONS.map((o) => o.value)).to.include(GROUP_BY_NONE);
        expect(GROUP_BY_NONE).to.equal('none');
    });

    it('getGroupName trims whitespace and falls back to Uncategorized', () => {
        expect(getGroupName({ model: { title: '  Card  ' } }, 'template')).to.equal('Card');
        expect(getGroupName({ model: { title: '' } }, 'template')).to.equal(UNCATEGORIZED_GROUP);
        expect(getGroupName({ tags: [] }, 'offer')).to.equal(UNCATEGORIZED_GROUP);
    });
});
