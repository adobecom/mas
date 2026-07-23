import { expect } from '@open-wc/testing';
import {
    getProjectField,
    getProjectFieldList,
    itemTypeFromPath,
    itemTypeFromFragment,
    buildItemsMetadata,
} from '../../src/bulk-publish/bulk-publish-utils.js';
import { COLLECTION_MODEL_PATH } from '../../src/constants.js';

describe('getProjectField()', () => {
    it('reads value via getFieldValue() when available', () => {
        const project = { getFieldValue: (k) => (k === 'title' ? 'Hello' : undefined) };
        expect(getProjectField(project, 'title')).to.equal('Hello');
    });

    it('falls back to plain property when getFieldValue is absent', () => {
        const project = { title: 'Plain' };
        expect(getProjectField(project, 'title')).to.equal('Plain');
    });

    it('unwraps store wrapper via .value before reading', () => {
        const project = { value: { getFieldValue: (k) => (k === 'status' ? 'Draft' : undefined) } };
        expect(getProjectField(project, 'status')).to.equal('Draft');
    });

    it('unwraps .value and falls back to property when getFieldValue absent', () => {
        const project = { value: { status: 'Published' } };
        expect(getProjectField(project, 'status')).to.equal('Published');
    });

    it('returns fallback when field is undefined and no property exists', () => {
        const project = { getFieldValue: () => undefined };
        expect(getProjectField(project, 'missing', 'default')).to.equal('default');
    });

    it('returns fallback when field value is null', () => {
        const project = { getFieldValue: () => null };
        expect(getProjectField(project, 'field', 'default')).to.equal('default');
    });

    it('returns undefined when no fallback and field missing', () => {
        expect(getProjectField({}, 'nope')).to.equal(undefined);
    });
});

describe('getProjectFieldList()', () => {
    it('reads array via getFieldValues() when available', () => {
        const project = { getFieldValues: (k) => (k === 'locales' ? ['en', 'ja'] : []) };
        expect(getProjectFieldList(project, 'locales')).to.deep.equal(['en', 'ja']);
    });

    it('falls back to plain array property when getFieldValues is absent', () => {
        const project = { locales: ['fr', 'de'] };
        expect(getProjectFieldList(project, 'locales')).to.deep.equal(['fr', 'de']);
    });

    it('unwraps store wrapper via .value before reading', () => {
        const project = { value: { getFieldValues: (k) => (k === 'locales' ? ['ko'] : []) } };
        expect(getProjectFieldList(project, 'locales')).to.deep.equal(['ko']);
    });

    it('returns empty array when field is missing entirely', () => {
        expect(getProjectFieldList({}, 'locales')).to.deep.equal([]);
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

describe('buildItemsMetadata()', () => {
    it('serializes valid items with their types and drops invalid ones', () => {
        const items = [
            { url: 'a', path: '/content/dam/mas/acom/en_US/card1', status: 'valid', type: 'fragment' },
            { url: 'b', path: '/content/dam/mas/acom/en_US/col1', status: 'valid', type: 'collection' },
            { url: 'c', path: '/content/dam/mas/acom/en_US/dictionary/ph1', status: 'valid' },
            { url: 'd', path: '/bad', status: 'error' },
            { url: 'e', status: 'valid' },
        ];
        expect(JSON.parse(buildItemsMetadata(items))).to.deep.equal([
            { path: '/content/dam/mas/acom/en_US/card1', type: 'fragment', status: 'valid' },
            { path: '/content/dam/mas/acom/en_US/col1', type: 'collection', status: 'valid' },
            { path: '/content/dam/mas/acom/en_US/dictionary/ph1', type: 'placeholder', status: 'valid' },
        ]);
    });

    it('returns an empty JSON array for no valid items', () => {
        expect(buildItemsMetadata([])).to.equal('[]');
    });
});
