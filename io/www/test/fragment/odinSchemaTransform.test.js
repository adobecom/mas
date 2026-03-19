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
