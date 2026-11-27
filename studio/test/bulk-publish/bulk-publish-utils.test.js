import { expect } from '@open-wc/testing';
import {
    itemTypeFromPath,
    itemTypeFromFragment,
    buildItemsMetadata,
    buildProjectPayload,
    isResolvedItem,
} from '../../src/bulk-publish/bulk-publish-utils.js';
import { COLLECTION_MODEL_PATH, BULK_PUBLISH_PROJECT_MODEL_ID } from '../../src/constants.js';

describe('buildProjectPayload()', () => {
    it('preserves the existing Bulk Publish creation contract', () => {
        const fragments = ['/content/dam/mas/acom/en_US/promotions/sale/card'];
        const items = buildItemsMetadata([{ path: fragments[0], type: 'collection', status: 'valid' }]);
        expect(
            buildProjectPayload({
                parentPath: '/content/dam/mas/acom/bulk-publish-projects',
                title: 'Sale 2026-11-17T03:00:00.000Z',
                status: 'Draft',
                urls: '',
                fragments,
                locales: [],
                items,
            }),
        ).to.deep.equal({
            title: 'Sale 2026-11-17T03:00:00.000Z',
            name: 'sale-2026-11-17t030000000z',
            modelId: BULK_PUBLISH_PROJECT_MODEL_ID,
            parentPath: '/content/dam/mas/acom/bulk-publish-projects',
            fields: [
                { name: 'title', type: 'text', values: ['Sale 2026-11-17T03:00:00.000Z'] },
                { name: 'status', type: 'text', values: ['Draft'] },
                { name: 'urls', type: 'text', values: [''] },
                { name: 'fragments', type: 'content-fragment', multiple: true, values: fragments },
                { name: 'locales', type: 'text', multiple: true, values: [] },
                { name: 'items', type: 'text', values: [items] },
            ],
        });
    });
});

describe('itemTypeFromPath()', () => {
    it('classifies dictionary paths as placeholder', () => {
        expect(itemTypeFromPath('/content/dam/mas/acom/en_US/dictionary/ph1')).to.equal('placeholder');
    });

    it('classifies other paths as fragment', () => {
        expect(itemTypeFromPath('/content/dam/mas/acom/en_US/cards/card1')).to.equal('fragment');
    });

    it('classifies missing path as fragment', () => {
        expect(itemTypeFromPath(undefined)).to.equal('fragment');
    });
});

describe('itemTypeFromFragment()', () => {
    it('classifies collection model fragments as collection', () => {
        const fragment = { path: '/content/dam/mas/acom/en_US/col1', model: { path: COLLECTION_MODEL_PATH } };
        expect(itemTypeFromFragment(fragment)).to.equal('collection');
    });

    it('classifies dictionnary model fragments as placeholder', () => {
        const fragment = {
            path: '/content/dam/mas/acom/en_US/dictionary/ph1',
            model: { path: '/conf/mas/settings/dam/cfm/models/dictionnary' },
        };
        expect(itemTypeFromFragment(fragment)).to.equal('placeholder');
    });

    it('falls back to path classification when model is absent', () => {
        expect(itemTypeFromFragment({ path: '/content/dam/mas/acom/en_US/dictionary/ph1' })).to.equal('placeholder');
        expect(itemTypeFromFragment({ path: '/content/dam/mas/acom/en_US/card1' })).to.equal('fragment');
    });
});

describe('isResolvedItem()', () => {
    for (const status of ['resolved', 'valid']) {
        it(`accepts ${status} items as resolved fragments`, () => {
            expect(isResolvedItem({ status })).to.be.true;
        });
    }

    for (const status of ['pending', 'error', undefined]) {
        it(`does not treat ${status} items as resolved fragments`, () => {
            expect(isResolvedItem({ status })).to.be.false;
        });
    }
});

describe('buildItemsMetadata()', () => {
    it('serializes resolved and legacy valid items with their types and drops unresolved ones', () => {
        const items = [
            { url: 'a', path: '/content/dam/mas/acom/en_US/card1', status: 'resolved', type: 'fragment' },
            { url: 'b', path: '/content/dam/mas/acom/en_US/col1', status: 'valid', type: 'collection' },
            { url: 'c', path: '/content/dam/mas/acom/en_US/dictionary/ph1', status: 'resolved' },
            { url: 'd', path: '/bad', status: 'error' },
            { url: 'e', status: 'resolved' },
            { url: 'f', path: '/pending', status: 'pending' },
            { url: 'g', status: 'valid' },
        ];
        expect(JSON.parse(buildItemsMetadata(items))).to.deep.equal([
            { path: '/content/dam/mas/acom/en_US/card1', type: 'fragment', status: 'resolved' },
            { path: '/content/dam/mas/acom/en_US/col1', type: 'collection', status: 'resolved' },
            { path: '/content/dam/mas/acom/en_US/dictionary/ph1', type: 'placeholder', status: 'resolved' },
        ]);
    });

    it('returns an empty JSON array for no resolved items', () => {
        expect(buildItemsMetadata([])).to.equal('[]');
    });
});
