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

        it('returns empty array for [""] sentinel on multi-value fields (explicit clear)', () => {
            // [""] on multi-value fields means user explicitly cleared the field - don't inherit from parent
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: [''], multiple: true }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['parent-icon.svg'], multiple: true }],
                }),
            );

            const result = variation.getEffectiveFieldValues('mnemonicIcon', parent, true);
            expect(result).to.deep.equal([]);
        });

        it('returns parent values for [""] on single-value fields (AEM initialization)', () => {
            // [""] on single-value fields is how AEM initializes empty fields - inherit from parent
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: [''], multiple: false }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: ['Parent description'], multiple: false }],
                }),
            );

            const result = variation.getEffectiveFieldValues('description', parent, true);
            expect(result).to.deep.equal(['Parent description']);
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

        it('returns inherited for [""] on single-value fields (AEM initializes empty fields this way)', () => {
            // [""] is how AEM initializes empty single-value fields when creating a variation
            // This should be treated as inherited, not overridden
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: [''], multiple: false }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: ['parent description'], multiple: false }],
                }),
            );

            const result = variation.getFieldState('description', parent, true);
            expect(result).to.equal('inherited');
        });

        it('returns overridden for [""] on multi-value fields (explicit clear sentinel)', () => {
            // [""] on multi-value fields means user explicitly cleared the field
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: [''], multiple: true }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['parent-icon.svg'], multiple: true }],
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

        it('works correctly with empty string sentinel workflow for multi-value fields', () => {
            // Full workflow test for multi-value fields:
            // 1. User has variation with [""] (explicit clear on multi-value field)
            // 2. User clicks "restore to parent" which sets []
            // 3. State changes from overridden to inherited
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: [''], multiple: true }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['parent-icon.svg'], multiple: true }],
                }),
            );

            // Initially overridden ([""] = explicit clear for multi-value fields)
            expect(variation.getFieldState('mnemonicIcon', parent, true)).to.equal('overridden');

            // User clicks "restore to parent" - sets to []
            variation.updateField('mnemonicIcon', []);

            // Now should be inherited ([] = inherit from parent)
            expect(variation.getFieldState('mnemonicIcon', parent, true)).to.equal('inherited');
        });
    });

    describe('prepareVariationForSave', () => {
        it('resets inherited fields (empty array) to [] before save', () => {
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [
                        { name: 'title', values: [] }, // inherited - should stay []
                        { name: 'description', values: ['custom desc'] }, // overridden - should keep value
                    ],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [
                        { name: 'title', values: ['Parent Title'] },
                        { name: 'description', values: ['Parent Description'] },
                    ],
                }),
            );

            const prepared = variation.prepareVariationForSave(parent);

            expect(prepared.getFieldValues('title')).to.deep.equal([]);
            expect(prepared.getFieldValues('description')).to.deep.equal(['custom desc']);
        });

        it('resets same-as-parent fields to [] before save', () => {
            // When variation has same content as parent, it should be reset to []
            // to avoid storing duplicate data
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [
                        { name: 'title', values: ['Same Title'] },
                        { name: 'description', values: ['Different Description'] },
                    ],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [
                        { name: 'title', values: ['Same Title'] },
                        { name: 'description', values: ['Parent Description'] },
                    ],
                }),
            );

            const prepared = variation.prepareVariationForSave(parent);

            // title matches parent, should be reset to []
            expect(prepared.getFieldValues('title')).to.deep.equal([]);
            // description differs, should keep its value
            expect(prepared.getFieldValues('description')).to.deep.equal(['Different Description']);
        });

        it('resets [""] on single-value fields to [] (treated as inherited)', () => {
            // [""] on single-value fields is how AEM initializes empty fields
            // This should be treated as inherited and reset to []
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: [''], multiple: false }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: ['Parent Description'], multiple: false }],
                }),
            );

            const prepared = variation.prepareVariationForSave(parent);

            expect(prepared.getFieldValues('description')).to.deep.equal([]);
        });

        it('keeps [""] on multi-value fields (explicit clear sentinel)', () => {
            // [""] on multi-value fields means user explicitly cleared the field
            // This is an override and should be kept
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: [''], multiple: true }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'mnemonicIcon', values: ['parent-icon.svg'], multiple: true }],
                }),
            );

            const prepared = variation.prepareVariationForSave(parent);

            // [""] is explicit clear for multi-value, should be kept as overridden
            expect(prepared.getFieldValues('mnemonicIcon')).to.deep.equal(['']);
        });

        it('does not reset excluded fields (variations, tags, etc.)', () => {
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [
                        { name: 'tags', values: ['tag1', 'tag2'] },
                        { name: 'locReady', values: ['true'] },
                    ],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [
                        { name: 'tags', values: ['tag1', 'tag2'] }, // same as variation
                        { name: 'locReady', values: ['true'] }, // same as variation
                    ],
                }),
            );

            const prepared = variation.prepareVariationForSave(parent);

            // These fields should NOT be reset even if they match parent
            expect(prepared.getFieldValues('tags')).to.deep.equal(['tag1', 'tag2']);
            expect(prepared.getFieldValues('locReady')).to.deep.equal(['true']);
        });

        it('returns a new Fragment instance (not mutating original)', () => {
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'title', values: ['Same Title'] }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'title', values: ['Same Title'] }],
                }),
            );

            const prepared = variation.prepareVariationForSave(parent);

            // Should be a different instance
            expect(prepared).to.not.equal(variation);
            // Original should be unchanged
            expect(variation.getFieldValues('title')).to.deep.equal(['Same Title']);
            // Prepared should have reset value
            expect(prepared.getFieldValues('title')).to.deep.equal([]);
        });

        it('returns original fragment when no parent provided', () => {
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'title', values: ['Title'] }],
                }),
            );

            const prepared = variation.prepareVariationForSave(null);

            expect(prepared).to.equal(variation);
        });

        it('handles complex HTML content comparison correctly', () => {
            // Simulates the real-world scenario where variation has content
            // that was copied from parent (e.g., via customize transformer)
            const htmlContent = '<p>Description with <strong>formatting</strong></p>';
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: [htmlContent], multiple: false }],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: [htmlContent], multiple: false }],
                }),
            );

            const prepared = variation.prepareVariationForSave(parent);

            // Same content should be reset to []
            expect(prepared.getFieldValues('description')).to.deep.equal([]);
        });

        it('keeps truly overridden HTML content', () => {
            const variation = new Fragment(
                createFragmentConfig({
                    fields: [
                        {
                            name: 'description',
                            values: ['<p>Custom variation description</p>'],
                            multiple: false,
                        },
                    ],
                }),
            );
            const parent = new Fragment(
                createFragmentConfig({
                    fields: [
                        {
                            name: 'description',
                            values: ['<p>Parent description</p>'],
                            multiple: false,
                        },
                    ],
                }),
            );

            const prepared = variation.prepareVariationForSave(parent);

            // Different content should be kept
            expect(prepared.getFieldValues('description')).to.deep.equal(['<p>Custom variation description</p>']);
        });
    });

    describe('replaceFrom - structuredClone isolation', () => {
        it('does not share field references after replaceFrom', () => {
            const sourceData = createFragmentConfig({
                fields: [{ name: 'description', values: ['original'] }],
            });

            const fragment1 = new Fragment(sourceData);
            const fragment2 = new Fragment(createFragmentConfig({ fields: [] }));

            // Replace fragment2 with fragment1's data
            fragment2.replaceFrom(fragment1);

            // Modify fragment2's field
            fragment2.getField('description').values = ['modified'];

            // fragment1 should NOT be affected
            expect(fragment1.getFieldValues('description')).to.deep.equal(['original']);
        });

        it('does not share nested object references after replaceFrom', () => {
            const sourceData = createFragmentConfig({
                model: { path: '/models/card', name: 'Card' },
                fields: [{ name: 'title', values: ['test'] }],
            });

            const fragment1 = new Fragment(sourceData);
            const fragment2 = new Fragment(createFragmentConfig({ fields: [] }));

            fragment2.replaceFrom(fragment1);

            // Modify fragment2's model
            fragment2.model.name = 'Modified';

            // fragment1 should NOT be affected
            expect(fragment1.model.name).to.equal('Card');
        });
    });

    describe('refreshFrom - initialValue isolation', () => {
        it('initialValue captures the loaded fragment data', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: ['original'] }],
                }),
            );

            // initialValue should have the loaded data
            const initialDesc = fragment.initialValue.fields.find((f) => f.name === 'description');
            expect(initialDesc.values).to.deep.equal(['original']);
        });

        it('discardChanges restores to originally loaded data', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: ['original'] }],
                }),
            );

            // Modify the fragment
            fragment.updateField('description', ['modified']);
            expect(fragment.hasChanges).to.be.true;
            expect(fragment.getFieldValues('description')).to.deep.equal(['modified']);

            // Discard should restore to originally loaded data
            fragment.discardChanges();

            expect(fragment.hasChanges).to.be.false;
            expect(fragment.getFieldValues('description')).to.deep.equal(['original']);
        });

        it('discardChanges does not share references with initialValue', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: ['original'] }],
                }),
            );

            // Modify and discard
            fragment.updateField('description', ['modified']);
            fragment.discardChanges();

            // Modify again - initialValue should not be affected
            fragment.updateField('description', ['modified again']);
            const initialDesc = fragment.initialValue.fields.find((f) => f.name === 'description');
            expect(initialDesc.values).to.deep.equal(['original']);
        });

        it('replaceFrom does not affect initialValue', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: ['original'] }],
                }),
            );

            // replaceFrom should NOT update initialValue
            fragment.replaceFrom(
                createFragmentConfig({
                    fields: [{ name: 'description', values: ['replaced'] }],
                }),
            );

            // Current value should be 'replaced'
            expect(fragment.getFieldValues('description')).to.deep.equal(['replaced']);

            // initialValue should still have 'original' (captured during constructor's refreshFrom)
            const initialDesc = fragment.initialValue.fields.find((f) => f.name === 'description');
            expect(initialDesc.values).to.deep.equal(['original']);
        });

        it('refreshFrom updates initialValue to new data', () => {
            const fragment = new Fragment(
                createFragmentConfig({
                    fields: [{ name: 'description', values: ['original'] }],
                }),
            );

            // refreshFrom should update initialValue
            fragment.refreshFrom(
                createFragmentConfig({
                    fields: [{ name: 'description', values: ['refreshed'] }],
                }),
            );

            // Both current and initialValue should have 'refreshed'
            expect(fragment.getFieldValues('description')).to.deep.equal(['refreshed']);
            const initialDesc = fragment.initialValue.fields.find((f) => f.name === 'description');
            expect(initialDesc.values).to.deep.equal(['refreshed']);
        });
    });

    describe('generateFragmentStore - source/preview isolation', () => {
        it('source and preview stores have independent field arrays', () => {
            const fragmentData = createFragmentConfig({
                fields: [{ name: 'description', values: [] }],
            });
            const parentData = createFragmentConfig({
                fields: [{ name: 'description', values: ['<p>Parent content</p>'] }],
            });

            const fragment = new Fragment(fragmentData);
            const parent = new Fragment(parentData);
            const store = generateFragmentStore(fragment, parent);

            // Source should have empty description (raw variation data)
            expect(store.value.getFieldValues('description')).to.deep.equal([]);

            // Preview should have parent content (merged for display)
            expect(store.previewStore.value.getFieldValues('description')).to.deep.equal(['<p>Parent content</p>']);

            // Verify they are different array references
            const sourceField = store.value.getField('description');
            const previewField = store.previewStore.value.getField('description');
            expect(sourceField).to.not.equal(previewField);
            expect(sourceField.values).to.not.equal(previewField.values);
        });

        it('modifying preview does not affect source', () => {
            const fragmentData = createFragmentConfig({
                fields: [{ name: 'description', values: [] }],
            });
            const parentData = createFragmentConfig({
                fields: [{ name: 'description', values: ['<p>Parent content</p>'] }],
            });

            const fragment = new Fragment(fragmentData);
            const parent = new Fragment(parentData);
            const store = generateFragmentStore(fragment, parent);

            // Directly modify preview field (simulating what resolveFragment might do)
            store.previewStore.value.getField('description').values = ['<p>Modified preview</p>'];

            // Source should still be empty
            expect(store.value.getFieldValues('description')).to.deep.equal([]);
        });

        it('source fragment has correct field values after store creation', () => {
            const fragmentData = createFragmentConfig({
                fields: [{ name: 'description', values: [] }],
            });
            const parentData = createFragmentConfig({
                fields: [{ name: 'description', values: ['<p>Parent content</p>'] }],
            });

            const fragment = new Fragment(fragmentData);
            const parent = new Fragment(parentData);
            const store = generateFragmentStore(fragment, parent);

            // Source should have empty description (the raw variation data)
            expect(store.value.getFieldValues('description')).to.deep.equal([]);

            // Preview should have parent content (merged for display)
            expect(store.previewStore.value.getFieldValues('description')).to.deep.equal(['<p>Parent content</p>']);
        });
    });
});
