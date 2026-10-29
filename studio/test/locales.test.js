import { expect } from '@esm-bundle/chai';
import { getLocalePickerItems, groupByRegion } from '../src/locales.js';

describe('getLocalePickerItems', () => {
    const values = (items) => items.map(({ value }) => value);

    it('maps default locales to value and country', () => {
        const items = getLocalePickerItems('acom');
        expect(items).to.deep.include({ value: 'fr_FR', country: 'FR' });
    });

    it('excludes en_US by default', () => {
        expect(values(getLocalePickerItems('acom'))).to.not.include('en_US');
    });

    it('includes en_US with includeSource', () => {
        expect(values(getLocalePickerItems('acom', { includeSource: true }))).to.include('en_US');
    });

    it('excludes regional variants by default', () => {
        const codes = values(getLocalePickerItems('acom'));
        expect(codes).to.not.include.members(['fr_CA', 'fr_BE', 'en_AU', 'de_AT']);
    });

    it('includes regional variants with includeRegional', () => {
        const codes = values(getLocalePickerItems('acom', { includeRegional: true }));
        expect(codes).to.include.members(['fr_FR', 'fr_CA', 'fr_BE', 'en_AU', 'de_AT']);
    });

    it('returns locales for other surfaces', () => {
        expect(getLocalePickerItems('express')).to.not.be.empty;
        expect(getLocalePickerItems('sandbox')).to.not.be.empty;
    });
});

describe('groupByRegion', () => {
    const country = (locale) => locale.split('_').at(-1);

    it('groups items by region in REGION_GROUPS order', () => {
        const groups = groupByRegion(['fr_FR', 'ja_JP', 'en_US'], country);
        expect(groups).to.deep.equal([
            { name: 'LATAM/Americas', items: ['en_US'] },
            { name: 'JAPAC', items: ['ja_JP'] },
            { name: 'EMEA', items: ['fr_FR'] },
        ]);
    });

    it('puts items with unknown countries into Other', () => {
        expect(groupByRegion(['xx_ZZ'], country)).to.deep.equal([{ name: 'Other', items: ['xx_ZZ'] }]);
    });

    it('reads the country through the provided accessor', () => {
        const item = { value: 'de_DE', country: 'DE' };
        expect(groupByRegion([item], (i) => i.country)).to.deep.equal([{ name: 'EMEA', items: [item] }]);
    });

    it('returns an empty array for no items', () => {
        expect(groupByRegion([], country)).to.deep.equal([]);
    });
});
