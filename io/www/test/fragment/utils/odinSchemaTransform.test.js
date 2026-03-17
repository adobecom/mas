import { expect } from 'chai';
import { transformBody, CF_REFERENCE_FIELDS } from '../../../src/fragment/utils/odinSchemaTransform.js';

describe('odinSchemaTransform', function () {
    describe('CF_REFERENCE_FIELDS', function () {
        it('should include compare-chart field names', function () {
            expect(CF_REFERENCE_FIELDS).to.include('fragment');
            expect(CF_REFERENCE_FIELDS).to.include('fragments');
            expect(CF_REFERENCE_FIELDS).to.include('sections');
            expect(CF_REFERENCE_FIELDS).to.include('rows');
            expect(CF_REFERENCE_FIELDS).to.include('rowValues');
            expect(CF_REFERENCE_FIELDS).to.include('values');
        });

        it('should still include original field names', function () {
            expect(CF_REFERENCE_FIELDS).to.include('cards');
            expect(CF_REFERENCE_FIELDS).to.include('collections');
            expect(CF_REFERENCE_FIELDS).to.include('entries');
        });
    });

    describe('transformBody with compare-chart fields', function () {
        it('should transform fragments reference field from paths to IDs', function () {
            const body = {
                fields: [
                    { name: 'fragments', multiple: true, values: ['/content/dam/mas/sandbox/en_US/col-frag'] },
                    { name: 'badge', multiple: false, values: ['Best Offer'] },
                ],
                references: [
                    {
                        type: 'content-fragment',
                        path: '/content/dam/mas/sandbox/en_US/col-frag',
                        id: 'col-frag-id',
                        name: 'col-frag',
                        title: 'Column Fragment',
                        fields: [
                            { name: 'cardTitle', multiple: false, values: ['Acrobat'] },
                        ],
                    },
                ],
            };

            const result = transformBody(body);
            expect(result.fields.fragments).to.deep.equal(['col-frag-id']);
            expect(result.fields.badge).to.equal('Best Offer');
        });

        it('should transform sections, rows, and values reference fields', function () {
            const body = {
                fields: [
                    { name: 'sections', multiple: true, values: ['/content/dam/mas/sandbox/en_US/section-1'] },
                ],
                references: [
                    {
                        type: 'content-fragment',
                        path: '/content/dam/mas/sandbox/en_US/section-1',
                        id: 'section-1-id',
                        name: 'section-1',
                        title: 'Section 1',
                        fields: [
                            { name: 'section-title', multiple: false, values: ['Create PDFs'] },
                            { name: 'rows', multiple: true, values: ['/content/dam/mas/sandbox/en_US/row-1'] },
                        ],
                        references: [
                            {
                                type: 'content-fragment',
                                path: '/content/dam/mas/sandbox/en_US/row-1',
                                id: 'row-1-id',
                                name: 'row-1',
                                title: 'Row 1',
                                fields: [
                                    { name: 'row-title', multiple: false, values: ['Combine files'], mimeType: 'text/html' },
                                    { name: 'values', multiple: true, values: ['/content/dam/mas/sandbox/en_US/value-1'] },
                                ],
                                references: [
                                    {
                                        type: 'content-fragment',
                                        path: '/content/dam/mas/sandbox/en_US/value-1',
                                        id: 'value-1-id',
                                        name: 'value-1',
                                        title: 'Value 1',
                                        fields: [
                                            { name: 'type', multiple: false, values: ['boolean'] },
                                            { name: 'booleanValue', multiple: false, values: [true] },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const result = transformBody(body);

            // Top-level sections resolved to IDs
            expect(result.fields.sections).to.deep.equal(['section-1-id']);

            // Section reference exists with rows resolved
            const sectionRef = result.references['section-1-id'];
            expect(sectionRef).to.exist;
            expect(sectionRef.value.fields.rows).to.deep.equal(['row-1-id']);

            // Row reference exists with values resolved
            const rowRef = result.references['row-1-id'];
            expect(rowRef).to.exist;
            expect(rowRef.value.fields.values).to.deep.equal(['value-1-id']);
            expect(rowRef.value.fields['row-title']).to.deep.equal({ value: 'Combine files', mimeType: 'text/html' });

            // Value reference exists
            const valueRef = result.references['value-1-id'];
            expect(valueRef).to.exist;
            expect(valueRef.value.fields.type).to.equal('boolean');
            expect(valueRef.value.fields.booleanValue).to.equal(true);
        });

        it('should build referencesTree with new field names', function () {
            const body = {
                fields: [
                    { name: 'sections', multiple: true, values: ['/content/dam/mas/sandbox/en_US/sec'] },
                ],
                references: [
                    {
                        type: 'content-fragment',
                        path: '/content/dam/mas/sandbox/en_US/sec',
                        id: 'sec-id',
                        name: 'sec',
                        title: 'Section',
                        fields: [
                            { name: 'rows', multiple: true, values: ['/content/dam/mas/sandbox/en_US/r'] },
                        ],
                        references: [
                            {
                                type: 'content-fragment',
                                path: '/content/dam/mas/sandbox/en_US/r',
                                id: 'row-id',
                                name: 'r',
                                title: 'Row',
                                fields: [
                                    { name: 'values', multiple: true, values: ['/content/dam/mas/sandbox/en_US/v'] },
                                ],
                                references: [
                                    {
                                        type: 'content-fragment',
                                        path: '/content/dam/mas/sandbox/en_US/v',
                                        id: 'val-id',
                                        name: 'v',
                                        title: 'Value',
                                        fields: [
                                            { name: 'type', multiple: false, values: ['boolean'] },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const result = transformBody(body);

            // Verify referencesTree structure
            expect(result.referencesTree).to.have.length(1);

            const sectionNode = result.referencesTree[0];
            expect(sectionNode.fieldName).to.equal('sections');
            expect(sectionNode.identifier).to.equal('sec-id');

            const rowNode = sectionNode.referencesTree[0];
            expect(rowNode.fieldName).to.equal('rows');
            expect(rowNode.identifier).to.equal('row-id');

            const valueNode = rowNode.referencesTree[0];
            expect(valueNode.fieldName).to.equal('values');
            expect(valueNode.identifier).to.equal('val-id');
        });

        it('should handle fragments field with multiple references', function () {
            const body = {
                fields: [
                    {
                        name: 'fragments',
                        multiple: true,
                        values: [
                            '/content/dam/mas/sandbox/en_US/frag-a',
                            '/content/dam/mas/sandbox/en_US/frag-b',
                        ],
                    },
                ],
                references: [
                    {
                        type: 'content-fragment',
                        path: '/content/dam/mas/sandbox/en_US/frag-a',
                        id: 'frag-a-id',
                        name: 'frag-a',
                        title: 'Fragment A',
                        fields: [{ name: 'badge', multiple: false, values: ['A'] }],
                    },
                    {
                        type: 'content-fragment',
                        path: '/content/dam/mas/sandbox/en_US/frag-b',
                        id: 'frag-b-id',
                        name: 'frag-b',
                        title: 'Fragment B',
                        fields: [{ name: 'badge', multiple: false, values: ['B'] }],
                    },
                ],
            };

            const result = transformBody(body);
            expect(result.fields.fragments).to.deep.equal(['frag-a-id', 'frag-b-id']);
            expect(result.referencesTree).to.have.length(2);
            expect(result.referencesTree[0].identifier).to.equal('frag-a-id');
            expect(result.referencesTree[1].identifier).to.equal('frag-b-id');
        });
    });
});
