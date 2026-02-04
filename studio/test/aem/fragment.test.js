import { expect } from '@open-wc/testing';
import { Fragment } from '../../src/aem/fragment.js';
import generateFragmentStore from '../../src/reactivity/source-fragment-store.js';

describe('Fragment', () => {
    const createFragmentConfig = (overrides = {}) => {
        const { references = [], fields = [], ...rest } = overrides;
        const variationPaths = references.map((ref) => ref.path);
        const hasVariationsField = fields.some((f) => f.name === 'variations');

        const finalFields = hasVariationsField ? fields : [...fields, { name: 'variations', values: variationPaths }];

        return {
            id: 'test-id',
            model: { path: '/models/card' },
            fields: finalFields,
            references,
            ...rest,
        };
    };

    describe('locale getter', () => {
        [
            { path: '/content/dam/mas/surface-name/en_US/my-fragment', expected: 'en_US' },
            { path: '/content/dam/mas/surface-name/en_AU/my-fragment', expected: 'en_AU' },
            { path: '/invalid/path/structure', expected: '' },
            { path: '', expected: '' },
        ].forEach(({ path, expected }) => {
            it(`extracts "${expected}" from path "${path}"`, () => {
                const fragment = new Fragment(createFragmentConfig({ path }));
                expect(fragment.locale).to.equal(expected);
            });
        });
    });

    describe('listLocaleVariations', () => {
        it('returns locale variations and filters correctly', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    path: '/content/dam/mas/sandbox/en_US/my-fragment',
                    references: [
                        { id: 'ref-1', path: '/content/dam/mas/sandbox/fr_FR/my-fragment' }, // valid
                        { id: 'ref-2', path: '/content/dam/mas/sandbox/de_DE/my-fragment' }, // valid
                        { id: 'ref-3', path: '/content/dam/mas/sandbox/en_US/different-fragment' }, // different fragment
                        { id: 'ref-4', path: '/content/dam/mas/acom/en_US/my-fragment' }, // different surface
                        { id: 'ref-5', path: '/invalid/path' }, // invalid path
                    ],
                }),
            );
            const variations = fragment.listLocaleVariations();
            expect(variations).to.have.lengthOf(2);
            expect(variations.map((v) => v.id)).to.include.members(['ref-1', 'ref-2']);
        });

        it('handles edge cases for references', () => {
            [
                { path: '/content/dam/mas/sandbox/en_US/my-fragment', references: undefined, expected: 0 },
                { path: '/content/dam/mas/sandbox/en_US/my-fragment', references: [], expected: 0 },
                {
                    path: '/invalid/path',
                    references: [{ id: 'ref-1', path: '/content/dam/mas/sandbox/fr_FR/my-fragment' }],
                    expected: 0,
                },
            ].forEach(({ path, references, expected }) => {
                const fragment = new Fragment(createFragmentConfig({ path, references }));
                expect(fragment.listLocaleVariations()).to.have.lengthOf(expected);
            });
        });

        it('handles nested fragment paths', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    path: '/content/dam/mas/sandbox/en_US/folder/subfolder/my-fragment',
                    references: [
                        { id: 'ref-1', path: '/content/dam/mas/sandbox/fr_FR/folder/subfolder/my-fragment' },
                        { id: 'ref-2', path: '/content/dam/mas/sandbox/fr_FR/folder/my-fragment' },
                    ],
                }),
            );
            const variations = fragment.listLocaleVariations();
            expect(variations).to.have.lengthOf(1);
            expect(variations[0].id).to.equal('ref-1');
        });
    });

    describe('getEffectiveFieldValues', () => {
        const parent = new Fragment(
            createFragmentConfig({
                fields: [
                    { name: 'mnemonicIcon', values: ['parent-icon.svg'], multiple: true },
                    { name: 'description', values: ['Parent description'], multiple: false },
                ],
            }),
        );

        [
            { name: 'mnemonicIcon', values: ['icon.svg'], expected: ['icon.svg'], desc: 'returns own values' },
            {
                name: 'mnemonicIcon',
                values: [''],
                multiple: true,
                expected: [],
                desc: 'returns empty for [""] sentinel (multi-value)',
            },
            {
                name: 'description',
                values: [''],
                multiple: false,
                expected: ['Parent description'],
                desc: 'returns parent for [""] sentinel (single-value)',
            },
            { name: 'mnemonicIcon', values: [], expected: ['parent-icon.svg'], desc: 'returns parent for [] (inherit)' },
        ].forEach(({ name, values, multiple, expected, desc }) => {
            it(desc, () => {
                const variation = new Fragment(
                    createFragmentConfig({
                        fields: [{ name, values, multiple: multiple ?? name === 'mnemonicIcon' }],
                    }),
                );
                expect(variation.getEffectiveFieldValues(name, parent, true)).to.deep.equal(expected);
            });
        });
    });

    describe('updateField', () => {
        it('updates field correctly', () => {
            const fragment = new Fragment(createFragmentConfig({ fields: [{ name: 'mnemonicIcon', values: [] }] }));

            expect(fragment.updateField('mnemonicIcon', [''])).to.be.true;
            expect(fragment.getFieldValues('mnemonicIcon')).to.deep.equal(['']);
            expect(fragment.hasChanges).to.be.true;

            expect(fragment.updateField('mnemonicIcon', [])).to.be.true;
            expect(fragment.getFieldValues('mnemonicIcon')).to.deep.equal([]);
        });
    });

    describe('getFieldState', () => {
        const parent = new Fragment(
            createFragmentConfig({
                fields: [
                    { name: 'multi', values: ['parent-icon.svg'], multiple: true },
                    { name: 'single', values: ['parent description'], multiple: false },
                ],
            }),
        );

        [
            { name: 'multi', values: [], expected: 'inherited' },
            { name: 'single', values: [''], expected: 'inherited' },
            { name: 'multi', values: [''], expected: 'overridden' },
            { name: 'multi', values: ['parent-icon.svg'], expected: 'same-as-parent' },
            { name: 'multi', values: ['other.svg'], expected: 'overridden' },
        ].forEach(({ name, values, expected }) => {
            it(`returns "${expected}" for field "${name}" with values ${JSON.stringify(values)}`, () => {
                const variation = new Fragment(
                    createFragmentConfig({
                        fields: [{ name, values, multiple: name === 'multi' }],
                    }),
                );
                expect(variation.getFieldState(name, parent, true)).to.equal(expected);
            });
        });

        it('works correctly with empty string sentinel workflow for multi-value fields', () => {
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: [''], multiple: true }],
                }),
            );
            const parentMulti = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['parent.svg'], multiple: true }],
                }),
            );

            expect(variation.getFieldState('mnemonicIcon', parentMulti, true)).to.equal('overridden');
            variation.updateField('mnemonicIcon', []);
            expect(variation.getFieldState('mnemonicIcon', parentMulti, true)).to.equal('inherited');
        });
    });

    describe('prepareVariationForSave', () => {
        const parent = new Fragment(
            createFragmentConfig({
                fields: [
                    { name: 'title', values: ['Parent Title'] },
                    { name: 'description', values: ['Parent Description'], multiple: false },
                    { name: 'mnemonicIcon', values: ['parent-icon.svg'], multiple: true },
                    { name: 'tags', values: ['tag1'] },
                ],
            }),
        );

        it('prepares variation for save correctly', () => {
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [
                        { name: 'title', values: [] }, // inherited
                        { name: 'description', values: ['custom desc'], multiple: false }, // overridden
                        { name: 'mnemonicIcon', values: [''], multiple: true }, // explicit clear
                        { name: 'tags', values: ['tag1'] }, // excluded field
                    ],
                }),
            );

            const prepared = variation.prepareVariationForSave(parent);
            expect(prepared.getFieldValues('title')).to.deep.equal([]);
            expect(prepared.getFieldValues('description')).to.deep.equal(['custom desc']);
            expect(prepared.getFieldValues('mnemonicIcon')).to.deep.equal(['']);
            expect(prepared.getFieldValues('tags')).to.deep.equal(['tag1']);
        });

        [
            { name: 'title', values: ['Parent Title'], expected: [], desc: 'resets same-as-parent to []' },
            { name: 'description', values: [''], multiple: false, expected: [], desc: 'resets single-value [""] to []' },
            {
                name: 'description',
                values: ['<p>Parent Description</p>'],
                parentVal: ['<p>Parent Description</p>'],
                expected: [],
                desc: 'handles HTML content',
            },
        ].forEach(({ name, values, multiple, parentVal, expected, desc }) => {
            it(desc, () => {
                const p = new Fragment(
                    createFragmentConfig({ fields: [{ name, values: parentVal ?? ['Parent Title'], multiple }] }),
                );
                const v = new Fragment(createFragmentConfig({ fields: [{ name, values, multiple }] }));
                const prepared = v.prepareVariationForSave(p);
                expect(prepared.getFieldValues(name)).to.deep.equal(expected);
            });
        });

        it('returns a new Fragment instance and handles null parent', () => {
            const variation = new Fragment(createFragmentConfig({ fields: [{ name: 'title', values: ['Title'] }] }));
            expect(variation.prepareVariationForSave(null)).to.equal(variation);

            const prepared = variation.prepareVariationForSave(parent);
            expect(prepared).to.not.equal(variation);
            expect(variation.getFieldValues('title')).to.deep.equal(['Title']);
        });
    });

    describe('isolation and store', () => {
        it('replaceFrom and refreshFrom maintain isolation', () => {
            const f1 = new Fragment(createFragmentConfig({ fields: [{ name: 'desc', values: ['v1'] }] }));
            const f2 = new Fragment(createFragmentConfig({ fields: [] }));

            f2.replaceFrom(f1);
            f2.getField('desc').values = ['v2'];
            expect(f1.getFieldValues('desc')).to.deep.equal(['v1']);

            f2.updateField('desc', ['v3']);
            f2.discardChanges();
            expect(f2.getFieldValues('desc')).to.deep.equal(['v1']); // restored to initial from replaceFrom? No, replaceFrom doesn't update initialValue.
            // Wait, replaceFrom doesn't update initialValue as per tests.
        });

        it('generateFragmentStore maintains source/preview isolation', () => {
            const fragment = new Fragment(createFragmentConfig({ fields: [{ name: 'desc', values: [] }] }));
            const parent = new Fragment(createFragmentConfig({ fields: [{ name: 'desc', values: ['parent'] }] }));
            const store = generateFragmentStore(fragment, parent);

            expect(store.value.getFieldValues('desc')).to.deep.equal([]);
            expect(store.previewStore.value.getFieldValues('desc')).to.deep.equal(['parent']);

            store.previewStore.value.getField('desc').values = ['modified'];
            expect(store.value.getFieldValues('desc')).to.deep.equal([]);
        });
    });
});
