const { expect } = require('chai');
const {
    escapeRegExp,
    replaceInValue,
    resolveReplaceTargets,
    applyReplacementsToFragment,
} = require('../../src/bulk-edit/replace.js');

describe('bulk-edit/replace: replaceInValue', () => {
    it('replaces all occurrences case-sensitively', () => {
        expect(replaceInValue('School of school', 'school', 'campus', true)).to.equal('School of campus');
    });
    it('replaces case-insensitively when matchCase is false', () => {
        expect(replaceInValue('School of school', 'school', 'campus', false)).to.equal('campus of campus');
    });
    it('returns the value unchanged when find is absent', () => {
        expect(replaceInValue('nothing here', 'school', 'campus', false)).to.equal('nothing here');
    });
    it('treats the replacement literally (no $& expansion)', () => {
        expect(replaceInValue('a school b', 'school', '$&!', true)).to.equal('a $&! b');
    });
    it('escapes regex metacharacters in the find term', () => {
        expect(replaceInValue('price (USD)', '(USD)', '(EUR)', false)).to.equal('price (EUR)');
    });
    it('leaves non-string values untouched', () => {
        expect(replaceInValue(42, '4', 'x', true)).to.equal(42);
    });
});

describe('bulk-edit/replace: escapeRegExp', () => {
    it('escapes regex special characters', () => {
        expect(escapeRegExp('a.b*c+')).to.equal('a\\.b\\*c\\+');
    });
});

describe('bulk-edit/replace: resolveReplaceTargets', () => {
    it('skips tags', () => {
        expect(resolveReplaceTargets('tags')).to.deep.equal([]);
    });
    it('maps fragmentTitle to the title property', () => {
        expect(resolveReplaceTargets('fragmentTitle')).to.deep.equal([{ kind: 'property', name: 'title' }]);
    });
    it('maps fragmentDescription to the description property', () => {
        expect(resolveReplaceTargets('fragmentDescription')).to.deep.equal([{ kind: 'property', name: 'description' }]);
    });
    it('maps description to both the field and the property', () => {
        expect(resolveReplaceTargets('description')).to.deep.equal([
            { kind: 'field', name: 'description' },
            { kind: 'property', name: 'description' },
        ]);
    });
    it('expands a multi-field scope key (productText)', () => {
        expect(resolveReplaceTargets('productText')).to.deep.equal([
            { kind: 'field', name: 'promoText' },
            { kind: 'field', name: 'shortDescription' },
        ]);
    });
    it('treats an unknown label as a raw field name', () => {
        expect(resolveReplaceTargets('callout')).to.deep.equal([{ kind: 'field', name: 'callout' }]);
    });
});

describe('bulk-edit/replace: applyReplacementsToFragment', () => {
    function fragment() {
        return {
            title: 'School plan',
            description: 'A school description',
            fields: [
                { name: 'subtitle', values: ['School subtitle'] },
                { name: 'promoText', values: ['Best school offer'] },
            ],
        };
    }

    it('rewrites a matched field value and reports REPLACED', () => {
        const result = applyReplacementsToFragment(
            fragment(),
            [{ fragment_id: 'a', field: 'subtitle', find: 'School', replace: 'Campus' }],
            { matchCase: true },
        );
        expect(result.changed).to.equal(true);
        expect(result.fields[0].values[0]).to.equal('Campus subtitle');
        expect(result.rowStatuses[0].status).to.equal('REPLACED');
    });

    it('does not mutate the input fragment', () => {
        const input = fragment();
        applyReplacementsToFragment(input, [{ field: 'subtitle', find: 'School', replace: 'Campus' }], {
            matchCase: true,
        });
        expect(input.fields[0].values[0]).to.equal('School subtitle');
    });

    it('marks a row SKIPPED when find is no longer present', () => {
        const result = applyReplacementsToFragment(fragment(), [{ field: 'subtitle', find: 'absent', replace: 'x' }], {});
        expect(result.changed).to.equal(false);
        expect(result.rowStatuses[0].status).to.equal('SKIPPED');
    });

    it('rewrites the title property via fragmentTitle', () => {
        const result = applyReplacementsToFragment(
            fragment(),
            [{ field: 'fragmentTitle', find: 'School', replace: 'Campus' }],
            { matchCase: true },
        );
        expect(result.title).to.equal('Campus plan');
        expect(result.changed).to.equal(true);
    });

    it('skips tag rows without changing anything', () => {
        const result = applyReplacementsToFragment(fragment(), [{ field: 'tags', find: 'School', replace: 'x' }], {});
        expect(result.changed).to.equal(false);
        expect(result.rowStatuses[0].status).to.equal('SKIPPED');
    });
});
