import { expect } from '@open-wc/testing';
import { Fragment } from '../../src/aem/fragment.js';

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
        it('extracts locale from valid path', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    path: '/content/dam/mas/surface-name/en_US/my-fragment',
                }),
            );
            expect(fragment.locale).to.equal('en_US');
        });

        it('extracts locale with underscores', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    path: '/content/dam/mas/surface-name/en_AU/my-fragment',
                }),
            );
            expect(fragment.locale).to.equal('en_AU');
        });

        it('returns empty string for invalid path', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    path: '/invalid/path/structure',
                }),
            );
            expect(fragment.locale).to.equal('');
        });

        it('handles undefined path gracefully', () => {
            const fragment = new Fragment(createFragmentConfig());
            expect(fragment.locale).to.equal('');
        });
    });

    describe('listLocaleVariations', () => {
        it('returns locale variations with different locales', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    path: '/content/dam/mas/sandbox/en_US/my-fragment',
                    references: [
                        { id: 'ref-1', path: '/content/dam/mas/sandbox/fr_FR/my-fragment' },
                        { id: 'ref-2', path: '/content/dam/mas/sandbox/de_DE/my-fragment' },
                        { id: 'ref-3', path: '/content/dam/mas/sandbox/en_US/different-fragment' },
                        { id: 'ref-4', path: '/content/dam/mas/acom/en_US/my-fragment' },
                    ],
                }),
            );
            const variations = fragment.listLocaleVariations();
            expect(variations).to.have.lengthOf(2);
            expect(variations[0].id).to.equal('ref-1');
            expect(variations[1].id).to.equal('ref-2');
        });

        it('filters references correctly', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    path: '/content/dam/mas/sandbox/en_US/my-fragment',
                    references: [
                        { id: 'ref-1', path: '/content/dam/mas/sandbox/en_US/my-fragment' }, // same locale
                        { id: 'ref-2', path: '/content/dam/mas/sandbox/fr_FR/different-fragment' }, // different fragment
                        { id: 'ref-3', path: '/content/dam/mas/acom/fr_FR/my-fragment' }, // different surface
                        { id: 'ref-4', path: '/content/dam/mas/sandbox/fr_FR/my-fragment' }, // valid
                        { id: 'ref-5', path: '/content/dam/mas/sandbox/de_DE/my-fragment' }, // valid
                    ],
                }),
            );
            const variations = fragment.listLocaleVariations();
            expect(variations).to.have.lengthOf(2);
            expect(variations[0].id).to.equal('ref-4');
            expect(variations[1].id).to.equal('ref-5');
        });

        it('returns empty array when references is undefined', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    path: '/content/dam/mas/sandbox/en_US/my-fragment',
                    references: undefined,
                }),
            );
            const variations = fragment.listLocaleVariations();
            expect(variations).to.deep.equal([]);
        });

        it('returns empty array when references is empty', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    path: '/content/dam/mas/sandbox/en_US/my-fragment',
                    references: [],
                }),
            );
            const variations = fragment.listLocaleVariations();
            expect(variations).to.deep.equal([]);
        });

        it('returns empty array when path does not match pattern', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    path: '/invalid/path',
                    references: [{ id: 'ref-1', path: '/content/dam/mas/sandbox/fr_FR/my-fragment' }],
                }),
            );
            const variations = fragment.listLocaleVariations();
            expect(variations).to.deep.equal([]);
        });

        it('filters out references with invalid paths', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    path: '/content/dam/mas/sandbox/en_US/my-fragment',
                    references: [
                        { id: 'ref-1', path: '/invalid/path' },
                        { id: 'ref-2', path: '/content/dam/mas/sandbox/fr_FR/my-fragment' },
                    ],
                }),
            );
            const variations = fragment.listLocaleVariations();
            expect(variations).to.have.lengthOf(1);
            expect(variations[0].id).to.equal('ref-2');
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
        it('returns own values when field has non-empty values', () => {
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['icon.svg'] }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['parent-icon.svg'] }],
                }),
            );

            const result = variation.getEffectiveFieldValues('mnemonicIcon', parent, true);
            expect(result).to.deep.equal(['icon.svg']);
        });

        it('returns empty array for [""] sentinel (explicit clear)', () => {
            // [""] means user explicitly cleared the field - don't inherit from parent
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: [''] }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['parent-icon.svg'] }],
                }),
            );

            const result = variation.getEffectiveFieldValues('mnemonicIcon', parent, true);
            expect(result).to.deep.equal([]);
        });

        it('returns parent values for [] (empty array = inherit)', () => {
            // [] means inherit from parent
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: [] }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['parent-icon.svg'] }],
                }),
            );

            const result = variation.getEffectiveFieldValues('mnemonicIcon', parent, true);
            expect(result).to.deep.equal(['parent-icon.svg']);
        });
    });

    describe('updateField', () => {
        it('updates field when adding item to empty array', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: [] }],
                }),
            );

            const changed = fragment.updateField('mnemonicIcon', ['']);
            expect(changed).to.be.true;
            expect(fragment.getFieldValues('mnemonicIcon')).to.deep.equal(['']);
            expect(fragment.hasChanges).to.be.true;
        });

        it('updates field when removing last item', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['icon.svg'] }],
                }),
            );

            const changed = fragment.updateField('mnemonicIcon', []);
            expect(changed).to.be.true;
            expect(fragment.getFieldValues('mnemonicIcon')).to.deep.equal([]);
            expect(fragment.hasChanges).to.be.true;
        });
    });

    describe('getFieldState', () => {
        it('returns inherited for [] (empty array)', () => {
            // [] means inherit from parent - this is the key change
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: [] }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['parent-icon.svg'] }],
                }),
            );

            const result = variation.getFieldState('mnemonicIcon', parent, true);
            expect(result).to.equal('inherited');
        });

        it('returns overridden for [""] (empty string sentinel = explicit clear)', () => {
            // [""] means user explicitly cleared the field
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: [''] }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['parent-icon.svg'] }],
                }),
            );

            const result = variation.getFieldState('mnemonicIcon', parent, true);
            expect(result).to.equal('overridden');
        });

        it('returns same-as-parent when values match', () => {
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['icon.svg'] }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['icon.svg'] }],
                }),
            );

            const result = variation.getFieldState('mnemonicIcon', parent, true);
            expect(result).to.equal('same-as-parent');
        });

        it('returns overridden when values differ', () => {
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['variation-icon.svg'] }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['parent-icon.svg'] }],
                }),
            );

            const result = variation.getFieldState('mnemonicIcon', parent, true);
            expect(result).to.equal('overridden');
        });

        it('works correctly with empty string sentinel workflow', () => {
            // Full workflow test:
            // 1. User has variation with [""] (explicit clear)
            // 2. User clicks "restore to parent" which sets []
            // 3. State changes from overridden to inherited
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: [''] }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['parent-icon.svg'] }],
                }),
            );

            // Initially overridden ([""] = explicit clear)
            expect(variation.getFieldState('mnemonicIcon', parent, true)).to.equal('overridden');

            // User clicks "restore to parent" - sets to []
            variation.updateField('mnemonicIcon', []);

            // Now should be inherited ([] = inherit from parent)
            expect(variation.getFieldState('mnemonicIcon', parent, true)).to.equal('inherited');
        });
    });
});
