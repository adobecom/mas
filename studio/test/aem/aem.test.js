import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { AEM, filterByTags } from '../../src/aem/aem.js';

describe('AEM SDK', () => {
    let aem;
    let fetchStub;

    beforeEach(() => {
        aem = new AEM('test-bucket', '/test-url');
        
        // Mock the private properties correctly
        Object.defineProperties(aem, {
            cfFragmentsUrl: {
                value: '/test-url/content/dam/fragments',
                writable: true
            },
            headers: {
                value: { Authorization: 'test' },
                writable: true
            }
        });

        // Mock sites property with proper structure
        aem.sites = {
            cf: {
                fragments: {
                    create: sinon.stub().resolves({ id: 'test-id' }),
                    save: sinon.stub().resolves({ id: 'test-id' }),
                    publish: sinon.stub().resolves(true),
                    unpublish: sinon.stub().resolves(true),
                    delete: sinon.stub().resolves(true),
                    search: sinon.stub().resolves([]),
                    getById: sinon.stub().resolves({ id: 'test-id' })
                }
            }
        };

        fetchStub = sinon.stub(window, 'fetch');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('fragments.create', () => {
        it('should create fragment successfully', async () => {
            const mockResponse = {
                id: 'test-id',
                path: '/test/path',
                status: 'Draft',
            };
            
            aem.sites.cf.fragments.create.resolves(mockResponse);

            const result = await aem.sites.cf.fragments.create({
                title: 'Test Fragment',
                model: { id: 'test-model' },
            }, '/test/parent/path');

            expect(result).to.deep.equal(mockResponse);
            expect(aem.sites.cf.fragments.create.calledOnce).to.be.true;
        });

        it('should handle creation errors', async () => {
            const error = new Error('Bad Request');
            aem.sites.cf.fragments.create.rejects(error);

            try {
                await aem.sites.cf.fragments.create({}, '/test/path');
                expect.fail('Should have thrown an error');
            } catch (err) {
                expect(err.message).to.include('Bad Request');
            }
        });
    });

    describe('fragments.publish', () => {
        it('should publish fragment successfully', async () => {
            aem.sites.cf.fragments.publish.resolves(true);

            const result = await aem.sites.cf.fragments.publish({
                id: 'test-id',
            });

            expect(result).to.be.true;
            expect(aem.sites.cf.fragments.publish.calledOnce).to.be.true;
        });
    });

    describe('fragments.unpublish', () => {
        it('should unpublish fragment successfully', async () => {
            fetchStub.resolves({ ok: true });
            aem.sites.cf.fragments.unpublish.resolves(true);

            const result = await aem.sites.cf.fragments.unpublish({
                id: 'test-id'
            });

            expect(result).to.be.true;
            expect(aem.sites.cf.fragments.unpublish.calledOnce).to.be.true;
        });
    });

    describe('filterByTags', () => {
        it('should filter tags with AND/OR logic', () => {
            const items = [
                {
                    id: 'item1',
                    tags: [
                        { id: 'mas:plan_type/abm' },
                        { id: 'mas:status/draft' },
                    ],
                },
                {
                    id: 'item2',
                    tags: [
                        { id: 'mas:plan_type/m2m' },
                        { id: 'mas:status/draft' },
                    ],
                },
                {
                    id: 'item3',
                    tags: [
                        { id: 'mas:plan_type/abm' },
                        { id: 'mas:plan_type/m2m' },
                    ],
                },
            ];

            // OR logic within same root
            const sameRootTags = ['mas:plan_type/abm', 'mas:plan_type/m2m'];
            const sameRootResult = items
                .filter(filterByTags(sameRootTags))
                .map((i) => i.id);
            expect(sameRootResult).to.deep.equal(['item1', 'item2', 'item3']);

            // AND logic between different roots
            const diffRootTags = ['mas:plan_type/abm', 'mas:status/draft'];
            const diffRootResult = items
                .filter(filterByTags(diffRootTags))
                .map((i) => i.id);
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
});
