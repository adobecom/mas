import { expect } from '@esm-bundle/chai';
import { AEM, filterByTags } from '../../src/aem/aem.js';

describe('aem.js', () => {
    const aem = new AEM('test');

    describe('filterByTags', () => {
        it('should filter tags with AND/OR logic', () => {
            const items = [
                {
                    id: 'item1',
                    tags: [{ id: 'mas:plan_type/abm' }, { id: 'mas:status/draft' }],
                },
                {
                    id: 'item2',
                    tags: [{ id: 'mas:plan_type/m2m' }, { id: 'mas:status/draft' }],
                },
                {
                    id: 'item3',
                    tags: [{ id: 'mas:plan_type/abm' }, { id: 'mas:plan_type/m2m' }],
                },
            ];

            // OR logic within same root
            const sameRootTags = ['mas:plan_type/abm', 'mas:plan_type/m2m'];
            const sameRootResult = items.filter(filterByTags(sameRootTags)).map((i) => i.id);
            expect(sameRootResult).to.deep.equal(['item1', 'item2', 'item3']);

            // AND logic between different roots
            const diffRootTags = ['mas:plan_type/abm', 'mas:status/draft'];
            const diffRootResult = items.filter(filterByTags(diffRootTags)).map((i) => i.id);
            expect(diffRootResult).to.deep.equal(['item1']);
        });
    });

    describe('method: searchFragment', () => {
        it('should fetch content fragments with multiple calls', async () => {
            window.fetch = async (url) => {
                if (url.includes('cursor1')) {
                    return {
                        ok: true,
                        json: async () => ({
                            items: [
                                {
                                    id: 2,
                                    fields: [{ name: 'variant', value: 'v2' }],
                                },
                            ],
                        }),
                    };
                } else {
                    return {
                        ok: true,
                        json: async () => ({
                            items: [
                                {
                                    id: 1,
                                    fields: [{ name: 'variant', value: 'v1' }],
                                },
                            ],
                            cursor: 'cursor1',
                        }),
                    };
                }
            };

            const result = await aem.searchFragment('some-query');

            const actual = [];

            for await (const items of result) {
                actual.push(...items);
            }

            expect(actual).to.deep.equal([
                { id: 1, fields: [{ name: 'variant', value: 'v1' }] },
                { id: 2, fields: [{ name: 'variant', value: 'v2' }] },
            ]);
        });
    });

    describe('method: getFragmentTranslations', () => {
        it('should fetch translations', async () => {
            window.fetch = async () => ({
                ok: true,
                json: async () => ({ languageCopies: [] }),
            });

            const result = await aem.getFragmentTranslations('test-id');
            expect(result.languageCopies).to.be.an('array');
        });
    });

    describe('method: saveFragment', () => {
        it('strips empty values from multi-value reference fields but preserves clear sentinels elsewhere', async () => {
            let putBody;
            window.fetch = async (url, options) => {
                const headers = { get: () => 'etag1' };
                if (options?.method === 'PUT') {
                    putBody = JSON.parse(options.body);
                }
                return { ok: true, headers, json: async () => ({ id: 'f1', etag: 'etag2', modified: 2 }) };
            };

            await aem.saveFragment({
                id: 'f1',
                title: 't',
                description: 'd',
                fields: [
                    { name: 'cards', type: 'content-fragment', multiple: true, values: ['/content/dam/a', '', null] },
                    { name: 'collections', type: 'content-reference', multiple: true, values: [''] },
                    { name: 'features', type: 'text', multiple: true, values: [''] },
                    { name: 'title', type: 'text', multiple: false, values: [''] },
                ],
            });

            const byName = (name) => putBody.fields.find((field) => field.name === name);
            expect(byName('cards').values).to.deep.equal(['/content/dam/a']);
            expect(byName('collections').values).to.deep.equal([]);
            expect(byName('features').values).to.deep.equal(['']);
            expect(byName('title').values).to.deep.equal(['']);
        });
    });
});
