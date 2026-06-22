const { expect } = require('chai');
const {
    escapeRegExp,
    replaceInValue,
    resolveReplaceTargets,
    applyReplacementsToFragment,
    buildWorkPlan,
    resolveReplaceRows,
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
    it('replaces the search term inside placeholder references in card content', () => {
        expect(replaceInValue('text {{old-placeholder}} more text', 'old-placeholder', 'new-placeholder', false)).to.equal(
            'text {{new-placeholder}} more text',
        );
    });
    it('replaces the search term inside a standalone placeholder reference', () => {
        expect(replaceInValue('{{ilyas-find-replace-firefly}}', 'firefly', 'Firefly', false)).to.equal(
            '{{ilyas-find-replace-Firefly}}',
        );
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
    it('skips dictionary placeholder keys', () => {
        expect(resolveReplaceTargets('key')).to.deep.equal([]);
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
    it('expands promoText to promoText and promoCode', () => {
        expect(resolveReplaceTargets('promoText')).to.deep.equal([
            { kind: 'field', name: 'promoText' },
            { kind: 'field', name: 'promoCode' },
        ]);
    });
    it('expands productDescription to cardTitle, description, features, compareChart, and shortDescription', () => {
        expect(resolveReplaceTargets('productDescription')).to.deep.equal([
            { kind: 'field', name: 'cardTitle' },
            { kind: 'field', name: 'description' },
            { kind: 'field', name: 'features' },
            { kind: 'field', name: 'compareChart' },
            { kind: 'field', name: 'shortDescription' },
        ]);
    });
    it('ignores unknown scope labels', () => {
        expect(resolveReplaceTargets('callout')).to.deep.equal([{ kind: 'field', name: 'callout' }]);
        expect(resolveReplaceTargets('mnemonicIcon')).to.deep.equal([{ kind: 'field', name: 'mnemonicIcon' }]);
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
            { matchCase: true, searchFind: 'School' },
        );
        expect(result.changed).to.equal(true);
        expect(result.fields[0].values[0]).to.equal('Campus subtitle');
        expect(result.rowStatuses[0].status).to.equal('REPLACED');
    });

    it('does not mutate the input fragment', () => {
        const input = fragment();
        applyReplacementsToFragment(input, [{ field: 'subtitle', find: 'School', replace: 'Campus' }], {
            matchCase: true,
            searchFind: 'School',
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
            { matchCase: true, searchFind: 'School' },
        );
        expect(result.title).to.equal('Campus plan');
        expect(result.changed).to.equal(true);
    });

    it('skips tag rows without changing anything', () => {
        const result = applyReplacementsToFragment(fragment(), [{ field: 'tags', find: 'School', replace: 'x' }], {});
        expect(result.changed).to.equal(false);
        expect(result.rowStatuses[0].status).to.equal('SKIPPED');
    });

    it('updates placeholder references in card content', () => {
        const result = applyReplacementsToFragment(
            {
                title: '',
                description: '',
                fields: [{ name: 'cardTitle', values: ['text {{old-placeholder}} more text'] }],
            },
            [{ fragment_id: 'a', field: 'cardTitle', find: 'text {{old-placeholder}} more text', replace: 'new-placeholder' }],
            { matchCase: false, searchFind: 'old-placeholder' },
        );
        expect(result.fields[0].values[0]).to.equal('text {{new-placeholder}} more text');
        expect(result.changed).to.equal(true);
        expect(result.rowStatuses[0].status).to.equal('REPLACED');
    });

    it('never rewrites dictionary placeholder keys', () => {
        const result = applyReplacementsToFragment(
            {
                title: '',
                description: '',
                fields: [
                    { name: 'key', values: ['ilyas-find-replace-firefly'] },
                    { name: 'value', values: ['Adobe firefly pro'] },
                ],
            },
            [
                { fragment_id: 'a', field: 'key', find: 'ilyas-find-replace-firefly', replace: 'Firefly' },
                { fragment_id: 'a', field: 'value', find: 'Adobe firefly pro', replace: 'Firefly' },
            ],
            { matchCase: false, searchFind: 'firefly' },
        );
        expect(result.fields.find((f) => f.name === 'key').values[0]).to.equal('ilyas-find-replace-firefly');
        expect(result.fields.find((f) => f.name === 'value').values[0]).to.equal('Adobe Firefly pro');
        expect(result.rowStatuses.find((r) => r.field === 'key').status).to.equal('SKIPPED');
        expect(result.rowStatuses.find((r) => r.field === 'value').status).to.equal('REPLACED');
        expect(result.changed).to.equal(true);
    });
});

describe('bulk-edit/replace: resolveReplaceRows', () => {
    it('uses find results when no CSV rows were uploaded', () => {
        const rows = resolveReplaceRows(
            [
                {
                    id: 'a',
                    path: '/p/a',
                    locale: 'en_US',
                    etag: 'e1',
                    status: 'DRAFT',
                    matches: [{ field: 'subtitle', value: 'school' }],
                },
            ],
            null,
        );
        expect(rows).to.deep.equal([
            {
                fragment_id: 'a',
                path: '/p/a',
                locale: 'en_US',
                field: 'subtitle',
                find: 'school',
                replace: '',
                etag: 'e1',
                status: 'DRAFT',
            },
        ]);
    });
});

describe('bulk-edit/replace: buildWorkPlan', () => {
    it('applies one replace value to all selected rows and groups by fragment', () => {
        const plan = buildWorkPlan(
            [
                { fragment_id: 'b', path: '/p/b', locale: 'en_US', field: 'subtitle', find: 'firefly' },
                { fragment_id: 'a', path: '/p/a', locale: 'en_US', field: 'subtitle', find: 'firefly' },
            ],
            'Firefly Pro',
            'firefly',
        );
        expect(plan.map((item) => item.id)).to.deep.equal(['a', 'b']);
        expect(plan[0].rows[0].replace).to.equal('Firefly Pro');
    });
});
