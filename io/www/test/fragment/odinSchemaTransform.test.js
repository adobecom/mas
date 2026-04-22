import { expect } from 'chai';
import { transformBody } from '../../src/fragment/utils/odinSchemaTransform.js';

describe('odinSchemaTransform', () => {
    describe('transformBody', () => {
        it('returns body unchanged when body has no references', () => {
            const body = {
                fields: [{ name: 'title', values: ['Hello'], multiple: false }],
                // no references property
            };
            const result = transformBody(body);
            expect(result.fields).to.deep.equal({ title: 'Hello' });
            expect(result).to.not.have.property('references');
        });

        it('returns body unchanged when body.references is null', () => {
            const body = {
                fields: [{ name: 'label', values: ['Test'], multiple: false }],
                references: null,
            };
            const result = transformBody(body);
            expect(result.fields).to.deep.equal({ label: 'Test' });
            expect(result.references).to.be.null;
        });

        it('keeps non-string values in CF reference fields (e.g. numeric ids)', () => {
            const body = {
                fields: [
                    {
                        name: 'cards',
                        values: ['/path/to/card', 12345],
                        multiple: true,
                    },
                ],
                references: [],
            };
            const result = transformBody(body);
            // String resolved via pathToIdMap (empty), number kept as-is (branch coverage)
            expect(result.fields.cards).to.deep.equal(['/path/to/card', 12345]);
        });

        it('handles text/html mimeType fields', () => {
            const body = {
                fields: [{ name: 'description', mimeType: 'text/html', values: ['<p>Hello</p>'], multiple: false }],
            };
            const result = transformBody(body);
            expect(result.fields.description).to.deep.equal({ mimeType: 'text/html', value: '<p>Hello</p>' });
        });

        it('returns array for multiple non-reference fields', () => {
            const body = {
                fields: [{ name: 'keywords', values: ['a', 'b'], multiple: true }],
            };
            const result = transformBody(body);
            expect(result.fields.keywords).to.deep.equal(['a', 'b']);
        });

        it('handles ref without model gracefully', () => {
            const fragment = {
                id: 'frag-no-model',
                type: 'content-fragment',
                name: 'no-model',
                title: 'No Model',
                description: '',
                path: '/content/dam/mas/no-model',
                fields: [{ name: 'title', values: ['x'], multiple: false }],
                references: [],
                // no model property
            };
            const body = {
                fields: [{ name: 'cards', values: ['/content/dam/mas/no-model'], multiple: true }],
                references: [fragment],
            };
            const result = transformBody(body);
            expect(result.references['frag-no-model'].value.model).to.deep.equal({ id: undefined });
        });

        it('adds tag objects from ref.tags into body.references', () => {
            const tag = { id: 'tag-id-001', name: 'promo', title: 'Promo Tag' };
            const cardFragment = {
                id: 'card-id-001',
                type: 'content-fragment',
                name: 'card',
                title: 'Card',
                description: '',
                path: '/content/dam/mas/card',
                model: { id: 'merch-card' },
                fields: [{ name: 'title', values: ['Card'], multiple: false }],
                references: [],
                tags: [tag],
            };
            const body = {
                fields: [{ name: 'cards', values: ['/content/dam/mas/card'], multiple: true }],
                references: [cardFragment],
            };
            const result = transformBody(body);
            expect(result.references).to.have.property('tag-id-001');
            expect(result.references['tag-id-001']).to.deep.equal({ type: 'tag', value: tag });
        });

        it('resolves content-fragment path references in nested fields (e.g. variations) using top-level references', () => {
            const variationFragment = {
                id: '69cf8eba-7b5a-47b3-b458-bb4818567a5c',
                type: 'content-fragment',
                name: 'variation-en-gb',
                title: 'Creative Cloud All Apps - en-GB',
                description: '',
                path: '/content/dam/mas/acom/en_US/pzn/creative-cloud-all-apps-en-gb',
                fields: [{ name: 'title', values: ['CC All Apps'], multiple: false }],
                references: [],
            };
            const cardFragment = {
                id: 'card-id-001',
                type: 'content-fragment',
                name: 'card-cc-pro',
                title: 'CC Pro Card',
                description: '',
                path: '/content/dam/mas/acom/en_US/create1111112112',
                fields: [
                    { name: 'title', values: ['CC Pro'], multiple: false },
                    {
                        name: 'variations',
                        multiple: true,
                        values: ['/content/dam/mas/acom/en_US/pzn/creative-cloud-all-apps-en-gb'],
                    },
                ],
                // card's own references does NOT include the variation fragment
                references: [],
            };
            const body = {
                fields: [{ name: 'cards', values: ['/content/dam/mas/acom/en_US/create1111112112'], multiple: true }],
                references: [cardFragment, variationFragment],
            };
            const result = transformBody(body);
            // The card's variations field must have the path resolved to the fragment ID
            expect(result.references['card-id-001'].value.fields.variations).to.deep.equal([
                '69cf8eba-7b5a-47b3-b458-bb4818567a5c',
            ]);
        });

        it('flattens deeply nested refs so variation fragments appear in top-level body.references', () => {
            const variationFragment = {
                id: 'var-id-001',
                type: 'content-fragment',
                name: 'variation-us',
                title: 'CC All Apps - US',
                description: '',
                path: '/content/dam/mas/acom/en_US/pzn/variation-us',
                fields: [{ name: 'title', values: ['CC All Apps US'], multiple: false }],
                references: [],
            };
            // Card appears twice: once with empty refs (in tab-a), once with variation refs (in tab-b)
            const cardWithEmptyRefs = {
                id: 'card-id-001',
                type: 'content-fragment',
                name: 'card-cc',
                title: 'CC Card',
                description: '',
                path: '/content/dam/mas/acom/en_US/card-cc',
                fields: [
                    { name: 'title', values: ['CC'], multiple: false },
                    {
                        name: 'variations',
                        multiple: true,
                        values: ['/content/dam/mas/acom/en_US/pzn/variation-us'],
                    },
                ],
                references: [],
            };
            const cardWithFullRefs = {
                ...cardWithEmptyRefs,
                references: [variationFragment],
            };
            const tabA = {
                id: 'tab-a',
                type: 'content-fragment',
                name: 'tab-a',
                title: 'Tab A',
                description: '',
                path: '/content/dam/mas/tab-a',
                fields: [{ name: 'cards', values: ['/content/dam/mas/acom/en_US/card-cc'], multiple: true }],
                references: [cardWithEmptyRefs],
            };
            const tabB = {
                id: 'tab-b',
                type: 'content-fragment',
                name: 'tab-b',
                title: 'Tab B',
                description: '',
                path: '/content/dam/mas/tab-b',
                fields: [{ name: 'cards', values: ['/content/dam/mas/acom/en_US/card-cc'], multiple: true }],
                references: [cardWithFullRefs],
            };
            const body = {
                fields: [{ name: 'collections', values: ['/content/dam/mas/tab-a', '/content/dam/mas/tab-b'], multiple: true }],
                references: [tabA, tabB],
            };
            const result = transformBody(body);
            // Variation fragment must be present in top-level references
            expect(result.references).to.have.property('var-id-001');
            expect(result.references['var-id-001'].value.fields.title).to.equal('CC All Apps US');
            // Card's variations field must be resolved to ID
            expect(result.references['card-id-001'].value.fields.variations).to.deep.equal(['var-id-001']);
        });

        it('skips duplicate refs (same id) to avoid infinite recursion', () => {
            const sharedRef = {
                id: 'same-id',
                type: 'content-fragment',
                name: 'Card',
                title: 'Card',
                description: '',
                path: '/path/card',
                fields: [{ name: 'title', values: ['Card'], multiple: false }],
                references: [],
            };
            const body = {
                fields: [
                    { name: 'label', values: ['Collection'], multiple: false },
                    { name: 'cards', values: ['/path/card'], multiple: true },
                ],
                references: [sharedRef, { ...sharedRef }],
            };
            const result = transformBody(body);
            expect(result.references).to.have.property('same-id');
            expect(result.references['same-id'].value.fields.title).to.equal('Card');
            // Second occurrence was skipped (cycle guard); structure still valid
            expect(Object.keys(result.references)).to.deep.equal(['same-id']);
        });
    });
});
