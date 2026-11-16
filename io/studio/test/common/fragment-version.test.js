const { expect } = require('chai');
const { versionFieldValues, compareVersionValues, restoreVersionFields } = require('../../src/common/fragment-version.cjs');

describe('Shared raw fragment versions', () => {
    it('compares raw inheritance and missing fields without resolving inherited content', () => {
        const before = versionFieldValues({ title: 'Before', fields: [{ name: 'headline', values: [] }] });
        const after = versionFieldValues({ title: 'After', fields: [{ name: 'body', values: ['New'] }] });
        expect(compareVersionValues(before, after, null)).to.deep.equal([
            { field: '@title', before: 'Before', after: 'After' },
            { field: 'headline', before: [], after: null },
            { field: 'body', before: null, after: ['New'] },
        ]);
    });

    it('restores selected values and missing historical fields without mutating sources or unrelated fields', () => {
        const current = [
            { name: 'headline', values: ['Current'], type: 'text' },
            { name: 'body', values: ['Keep'] },
        ];
        const historical = [
            { name: 'headline', values: [] },
            { name: 'removed', values: ['Reintroduce'] },
        ];
        const restored = restoreVersionFields(current, historical, ['headline', 'removed']);
        expect(restored).to.deep.equal([
            { name: 'headline', values: [], type: 'text' },
            { name: 'body', values: ['Keep'] },
            { name: 'removed', values: ['Reintroduce'] },
        ]);
        restored[2].values.push('Changed');
        expect(historical[1].values).to.deep.equal(['Reintroduce']);
        expect(current[0].values).to.deep.equal(['Current']);
    });
});
