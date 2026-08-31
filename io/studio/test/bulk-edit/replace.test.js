const { expect } = require('chai');
const {
    escapeRegExp,
    replaceInValue,
    resolveReplaceTargets,
    applyCsvValuesToFragment,
    buildPatchBody,
    buildWorkPlan,
    resolveReplaceRows,
    normalizeEtag,
    valuesMatch,
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
    it('leaves non-string values untouched', () => {
        expect(replaceInValue(42, '4', 'x', true)).to.equal(42);
    });
});

describe('bulk-edit/replace: escapeRegExp', () => {
    it('escapes regex special characters', () => {
        expect(escapeRegExp('a.b*c+')).to.equal('a\\.b\\*c\\+');
    });
});

describe('bulk-edit/replace: normalizeEtag', () => {
    it('strips surrounding quotes for comparison', () => {
        expect(normalizeEtag('"abc"')).to.equal('abc');
        expect(normalizeEtag('abc')).to.equal('abc');
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
});

describe('bulk-edit/replace: applyCsvValuesToFragment', () => {
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

    it('writes the CSV replace value when find matches', () => {
        const result = applyCsvValuesToFragment(
            fragment(),
            [{ fragment_id: 'a', field: 'subtitle', find: 'School subtitle', replace: 'Campus subtitle' }],
            { matchCase: true },
        );
        expect(result.changed).to.equal(true);
        expect(result.fields[0].values[0]).to.equal('Campus subtitle');
        expect(result.rowStatuses[0].status).to.equal('REPLACED');
        expect(result.patches).to.have.lengthOf(1);
    });

    it('does not mutate the input fragment', () => {
        const input = fragment();
        applyCsvValuesToFragment(input, [{ field: 'subtitle', find: 'School subtitle', replace: 'Campus subtitle' }], {
            matchCase: true,
        });
        expect(input.fields[0].values[0]).to.equal('School subtitle');
    });

    it('marks a row SKIPPED when find no longer matches', () => {
        const result = applyCsvValuesToFragment(fragment(), [{ field: 'subtitle', find: 'absent', replace: 'x' }], {});
        expect(result.changed).to.equal(false);
        expect(result.rowStatuses[0].status).to.equal('SKIPPED');
    });

    it('rewrites the title property via fragmentTitle', () => {
        const result = applyCsvValuesToFragment(
            fragment(),
            [{ field: 'fragmentTitle', find: 'School plan', replace: 'Campus plan' }],
            { matchCase: true },
        );
        expect(result.title).to.equal('Campus plan');
        expect(result.changed).to.equal(true);
    });

    it('skips tag rows without changing anything', () => {
        const result = applyCsvValuesToFragment(fragment(), [{ field: 'tags', find: 'School', replace: 'x' }], {});
        expect(result.changed).to.equal(false);
        expect(result.rowStatuses[0].status).to.equal('SKIPPED');
    });

    it('never rewrites dictionary placeholder keys', () => {
        const result = applyCsvValuesToFragment(
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
                { fragment_id: 'a', field: 'value', find: 'Adobe firefly pro', replace: 'Adobe Firefly pro' },
            ],
            { matchCase: false },
        );
        expect(result.fields.find((f) => f.name === 'key').values[0]).to.equal('ilyas-find-replace-firefly');
        expect(result.fields.find((f) => f.name === 'value').values[0]).to.equal('Adobe Firefly pro');
        expect(result.rowStatuses.find((r) => r.field === 'key').status).to.equal('SKIPPED');
        expect(result.rowStatuses.find((r) => r.field === 'value').status).to.equal('REPLACED');
        expect(result.changed).to.equal(true);
    });
});

describe('bulk-edit/replace: buildPatchBody', () => {
    it('emits patch ops only for changed fields', () => {
        const original = {
            title: 'T',
            description: 'D',
            fields: [{ name: 'subtitle', values: ['School offer'], path: '/fields/0' }],
        };
        original.fields[0].path = undefined;
        const ops = buildPatchBody(
            {
                title: 'T',
                description: 'D',
                fields: [{ name: 'subtitle', values: ['School offer'] }],
            },
            {
                fields: [{ name: 'subtitle', values: ['Campus offer'] }],
                title: 'T',
                description: 'D',
            },
        );
        expect(ops.some((op) => op.path.endsWith('/values'))).to.equal(true);
    });
});

describe('bulk-edit/replace: resolveReplaceRows', () => {
    it('prefills replace from find params when no CSV was uploaded', () => {
        const rows = resolveReplaceRows(
            [
                {
                    id: 'a',
                    path: '/p/a',
                    locale: 'en_US',
                    etag: 'e1',
                    status: 'DRAFT',
                    matches: [{ field: 'subtitle', value: 'school offer' }],
                },
            ],
            null,
            { find: 'school', replace: 'campus', matchCase: false },
        );
        expect(rows[0].replace).to.equal('campus offer');
    });
});

describe('bulk-edit/replace: buildWorkPlan', () => {
    it('groups rows by fragment and carries etag', () => {
        const plan = buildWorkPlan([
            {
                fragment_id: 'b',
                path: '/p/b',
                locale: 'en_US',
                field: 'subtitle',
                find: 'firefly',
                replace: 'Firefly Pro',
                etag: 'e2',
            },
            {
                fragment_id: 'a',
                path: '/p/a',
                locale: 'en_US',
                field: 'subtitle',
                find: 'firefly',
                replace: 'Firefly Pro',
                etag: 'e1',
            },
        ]);
        expect(plan.map((item) => item.id)).to.deep.equal(['a', 'b']);
        expect(plan[0].etag).to.equal('e1');
        expect(plan[0].rows[0].replace).to.equal('Firefly Pro');
    });

    it('excludes rows where replace equals find', () => {
        const plan = buildWorkPlan([{ fragment_id: 'a', field: 'subtitle', find: 'same', replace: 'same', etag: 'e1' }]);
        expect(plan).to.deep.equal([]);
    });
});

describe('bulk-edit/replace: valuesMatch', () => {
    it('compares case-insensitively by default', () => {
        expect(valuesMatch('School', 'school', false)).to.equal(true);
        expect(valuesMatch('School', 'school', true)).to.equal(false);
    });
});
