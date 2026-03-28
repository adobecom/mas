import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { executeOperation } from '../../src/utils/ai-operations-executor.js';

describe('ai-operations-executor', () => {
    let sandbox;
    let repository;

    function makeFragment(overrides = {}) {
        return {
            id: 'frag-1',
            title: 'Test Fragment',
            path: '/content/dam/test',
            fields: [],
            model: { path: '/conf/mas/settings/dam/cfm/models/card' },
            ...overrides,
        };
    }

    function makeRepository(fragmentOverride) {
        const fragment = fragmentOverride ?? makeFragment();
        return {
            aem: {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub().resolves(fragment),
                            getByPath: sandbox.stub().resolves(fragment),
                            publish: sandbox.stub().resolves(),
                            delete: sandbox.stub().resolves(),
                            copy: sandbox.stub().resolves({
                                id: 'frag-copy',
                                title: 'Test Fragment (copy)',
                                path: '/content/dam/test-copy',
                            }),
                            save: sandbox.stub().resolves({
                                ...fragment,
                                title: fragment.title,
                            }),
                        },
                    },
                },
                searchFragment: sandbox.stub(),
            },
            search: { value: { path: '/content/dam' } },
        };
    }

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        repository = makeRepository();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('executeOperation', () => {
        describe('validation', () => {
            it('should throw for null operation', async () => {
                try {
                    await executeOperation(null, repository);
                    expect.fail('Should have thrown');
                } catch (e) {
                    expect(e).to.be.an('error');
                }
            });

            it('should throw for undefined operation', async () => {
                try {
                    await executeOperation(undefined, repository);
                    expect.fail('Should have thrown');
                } catch (e) {
                    expect(e).to.be.an('error');
                }
            });

            it('should throw for operation without operation field', async () => {
                try {
                    await executeOperation({ foo: 'bar' }, repository);
                    expect.fail('Should have thrown');
                } catch (e) {
                    expect(e.message).to.equal('Invalid operation data');
                }
            });

            it('should throw for unknown operation type', async () => {
                try {
                    await executeOperation({ operation: 'unknown_op' }, repository);
                    expect.fail('Should have thrown');
                } catch (e) {
                    expect(e.message).to.equal('Unknown operation: unknown_op');
                }
            });
        });

        describe('publish', () => {
            it('should publish a fragment with references by default', async () => {
                const result = await executeOperation({ operation: 'publish', fragmentId: 'frag-1' }, repository);
                expect(result.success).to.be.true;
                expect(result.fragmentId).to.equal('frag-1');
                expect(result.fragmentTitle).to.equal('Test Fragment');
                expect(result.fragmentPath).to.equal('/content/dam/test');
                expect(result.message).to.include('published');
                expect(repository.aem.sites.cf.fragments.publish.calledOnce).to.be.true;
                const publishArgs = repository.aem.sites.cf.fragments.publish.firstCall.args;
                expect(publishArgs[1]).to.deep.equal(['DRAFT', 'UNPUBLISHED']);
            });

            it('should publish without references when publishReferences is false', async () => {
                const result = await executeOperation(
                    {
                        operation: 'publish',
                        fragmentId: 'frag-1',
                        publishReferences: false,
                    },
                    repository,
                );
                expect(result.success).to.be.true;
                const publishArgs = repository.aem.sites.cf.fragments.publish.firstCall.args;
                expect(publishArgs[1]).to.deep.equal([]);
            });

            it('should throw when fragment not found', async () => {
                repository.aem.sites.cf.fragments.getById.resolves(null);
                try {
                    await executeOperation({ operation: 'publish', fragmentId: 'missing' }, repository);
                    expect.fail('Should have thrown');
                } catch (e) {
                    expect(e.message).to.equal('Fragment not found: missing');
                }
            });
        });

        describe('get', () => {
            it('should get fragment by id', async () => {
                const result = await executeOperation({ operation: 'get', fragmentId: 'frag-1' }, repository);
                expect(result.success).to.be.true;
                expect(result.fragment.id).to.equal('frag-1');
                expect(result.message).to.include('Test Fragment');
                expect(repository.aem.sites.cf.fragments.getById.calledOnceWith('frag-1')).to.be.true;
                expect(repository.aem.sites.cf.fragments.getByPath.called).to.be.false;
            });

            it('should get fragment by path when fragmentId starts with /', async () => {
                const result = await executeOperation({ operation: 'get', fragmentId: '/content/dam/test' }, repository);
                expect(result.success).to.be.true;
                expect(repository.aem.sites.cf.fragments.getByPath.calledOnceWith('/content/dam/test')).to.be.true;
                expect(repository.aem.sites.cf.fragments.getById.called).to.be.false;
            });

            it('should throw when fragment not found by id', async () => {
                repository.aem.sites.cf.fragments.getById.resolves(null);
                try {
                    await executeOperation({ operation: 'get', fragmentId: 'missing' }, repository);
                    expect.fail('Should have thrown');
                } catch (e) {
                    expect(e.message).to.equal('Fragment not found: missing');
                }
            });

            it('should throw when fragment not found by path', async () => {
                repository.aem.sites.cf.fragments.getByPath.resolves(null);
                try {
                    await executeOperation({ operation: 'get', fragmentId: '/missing/path' }, repository);
                    expect.fail('Should have thrown');
                } catch (e) {
                    expect(e.message).to.equal('Fragment not found: /missing/path');
                }
            });
        });

        describe('search', () => {
            it('should search fragments with default params', async () => {
                const items = [makeFragment({ id: 'a' }), makeFragment({ id: 'b' })];
                async function* gen() {
                    yield items;
                }
                repository.aem.searchFragment.returns(gen());

                const result = await executeOperation({ operation: 'search', params: {} }, repository);
                expect(result.success).to.be.true;
                expect(result.count).to.equal(2);
                expect(result.results).to.have.lengthOf(2);
            });

            it('should include content-type tag in search params', async () => {
                async function* gen() {
                    yield [];
                }
                repository.aem.searchFragment.returns(gen());

                await executeOperation({ operation: 'search', params: {} }, repository);
                const searchParams = repository.aem.searchFragment.firstCall.args[0];
                expect(searchParams.tags).to.include('mas:studio/content-type/merch-card');
            });

            it('should merge user-provided tags with default tags', async () => {
                async function* gen() {
                    yield [];
                }
                repository.aem.searchFragment.returns(gen());

                await executeOperation(
                    {
                        operation: 'search',
                        params: { tags: ['custom:tag'] },
                    },
                    repository,
                );
                const searchParams = repository.aem.searchFragment.firstCall.args[0];
                expect(searchParams.tags).to.include('custom:tag');
                expect(searchParams.tags).to.include('mas:studio/content-type/merch-card');
            });

            it('should add variant tag when variant is specified', async () => {
                async function* gen() {
                    yield [];
                }
                repository.aem.searchFragment.returns(gen());

                await executeOperation(
                    {
                        operation: 'search',
                        params: { variant: 'ccd-action' },
                    },
                    repository,
                );
                const searchParams = repository.aem.searchFragment.firstCall.args[0];
                expect(searchParams.tags).to.include('mas:studio/variant/ccd-action');
            });

            it('should not add variant tag when variant is not specified', async () => {
                async function* gen() {
                    yield [];
                }
                repository.aem.searchFragment.returns(gen());

                await executeOperation({ operation: 'search', params: {} }, repository);
                const searchParams = repository.aem.searchFragment.firstCall.args[0];
                const variantTags = searchParams.tags.filter((t) => t.startsWith('mas:studio/variant/'));
                expect(variantTags).to.have.lengthOf(0);
            });

            it('should respect limit parameter', async () => {
                const items = Array.from({ length: 20 }, (v, i) => makeFragment({ id: `f-${i}` }));
                async function* gen() {
                    yield items;
                }
                repository.aem.searchFragment.returns(gen());

                const result = await executeOperation({ operation: 'search', params: { limit: 5 } }, repository);
                expect(result.results.length).to.be.at.most(5);
            });

            it('should use default limit of 10', async () => {
                async function* gen() {
                    yield [];
                }
                repository.aem.searchFragment.returns(gen());

                await executeOperation({ operation: 'search', params: {} }, repository);
                const limit = repository.aem.searchFragment.firstCall.args[1];
                expect(limit).to.equal(10);
            });

            it('should filter to card model only', async () => {
                const cardFragment = makeFragment({ id: 'card-1' });
                const otherFragment = makeFragment({
                    id: 'other-1',
                    model: {
                        path: '/conf/mas/settings/dam/cfm/models/other',
                    },
                });
                async function* gen() {
                    yield [cardFragment, otherFragment];
                }
                repository.aem.searchFragment.returns(gen());

                const result = await executeOperation({ operation: 'search', params: {} }, repository);
                expect(result.results).to.have.lengthOf(1);
                expect(result.results[0].id).to.equal('card-1');
            });

            it('should return correct message for single result', async () => {
                async function* gen() {
                    yield [makeFragment()];
                }
                repository.aem.searchFragment.returns(gen());

                const result = await executeOperation({ operation: 'search', params: {} }, repository);
                expect(result.message).to.equal('Found 1 card');
            });

            it('should return correct message for multiple results', async () => {
                async function* gen() {
                    yield [makeFragment({ id: 'a' }), makeFragment({ id: 'b' })];
                }
                repository.aem.searchFragment.returns(gen());

                const result = await executeOperation({ operation: 'search', params: {} }, repository);
                expect(result.message).to.equal('Found 2 cards');
            });

            it('should handle empty search results', async () => {
                async function* gen() {
                    yield [];
                }
                repository.aem.searchFragment.returns(gen());

                const result = await executeOperation({ operation: 'search', params: {} }, repository);
                expect(result.success).to.be.true;
                expect(result.count).to.equal(0);
                expect(result.message).to.equal('Found 0 cards');
            });

            it('should use repository search path', async () => {
                async function* gen() {
                    yield [];
                }
                repository.aem.searchFragment.returns(gen());

                await executeOperation({ operation: 'search', params: {} }, repository);
                const searchParams = repository.aem.searchFragment.firstCall.args[0];
                expect(searchParams.path).to.equal('/content/dam');
            });

            it('should handle missing params gracefully', async () => {
                async function* gen() {
                    yield [];
                }
                repository.aem.searchFragment.returns(gen());

                const result = await executeOperation({ operation: 'search' }, repository);
                expect(result.success).to.be.true;
            });

            it('should collect items from multiple generator yields', async () => {
                async function* gen() {
                    yield [makeFragment({ id: 'a' })];
                    yield [makeFragment({ id: 'b' })];
                }
                repository.aem.searchFragment.returns(gen());

                const result = await executeOperation({ operation: 'search', params: { limit: 10 } }, repository);
                expect(result.count).to.equal(2);
            });

            it('should stop collecting when limit is reached', async () => {
                async function* gen() {
                    yield [makeFragment({ id: 'a' }), makeFragment({ id: 'b' }), makeFragment({ id: 'c' })];
                    yield [makeFragment({ id: 'd' })];
                }
                repository.aem.searchFragment.returns(gen());

                const result = await executeOperation({ operation: 'search', params: { limit: 2 } }, repository);
                expect(result.results.length).to.be.at.most(2);
            });
        });

        describe('delete', () => {
            it('should delete a fragment', async () => {
                const result = await executeOperation({ operation: 'delete', fragmentId: 'frag-1' }, repository);
                expect(result.success).to.be.true;
                expect(result.fragmentId).to.equal('frag-1');
                expect(result.fragmentTitle).to.equal('Test Fragment');
                expect(result.message).to.include('deleted');
                expect(repository.aem.sites.cf.fragments.delete.calledOnce).to.be.true;
            });

            it('should pass the fragment object to delete', async () => {
                await executeOperation({ operation: 'delete', fragmentId: 'frag-1' }, repository);
                const deletedFragment = repository.aem.sites.cf.fragments.delete.firstCall.args[0];
                expect(deletedFragment.id).to.equal('frag-1');
            });

            it('should throw when fragment not found', async () => {
                repository.aem.sites.cf.fragments.getById.resolves(null);
                try {
                    await executeOperation({ operation: 'delete', fragmentId: 'missing' }, repository);
                    expect.fail('Should have thrown');
                } catch (e) {
                    expect(e.message).to.equal('Fragment not found: missing');
                }
            });
        });

        describe('copy', () => {
            it('should copy a fragment and return new fragment data', async () => {
                const result = await executeOperation({ operation: 'copy', fragmentId: 'frag-1' }, repository);
                expect(result.success).to.be.true;
                expect(result.originalId).to.equal('frag-1');
                expect(result.newFragmentId).to.equal('frag-copy');
                expect(result.newFragmentTitle).to.equal('Test Fragment (copy)');
                expect(result.newFragmentPath).to.equal('/content/dam/test-copy');
                expect(result.message).to.include('copy');
            });

            it('should pass the source fragment to copy', async () => {
                await executeOperation({ operation: 'copy', fragmentId: 'frag-1' }, repository);
                const sourceFragment = repository.aem.sites.cf.fragments.copy.firstCall.args[0];
                expect(sourceFragment.id).to.equal('frag-1');
            });

            it('should throw when source fragment not found', async () => {
                repository.aem.sites.cf.fragments.getById.resolves(null);
                try {
                    await executeOperation({ operation: 'copy', fragmentId: 'missing' }, repository);
                    expect.fail('Should have thrown');
                } catch (e) {
                    expect(e.message).to.equal('Fragment not found: missing');
                }
            });
        });

        describe('update', () => {
            it('should update existing fields on a fragment', async () => {
                const fragment = makeFragment({
                    fields: [{ name: 'title', values: ['Old'] }],
                });
                repository = makeRepository(fragment);

                const result = await executeOperation(
                    {
                        operation: 'update',
                        fragmentId: 'frag-1',
                        updates: { title: 'New Title' },
                    },
                    repository,
                );
                expect(result.success).to.be.true;
                expect(result.updatedFields).to.deep.equal(['title']);
                const savedFragment = repository.aem.sites.cf.fragments.save.firstCall.args[0];
                const titleField = savedFragment.fields.find((f) => f.name === 'title');
                expect(titleField.values).to.deep.equal(['New Title']);
            });

            it('should add new fields if they do not exist', async () => {
                const fragment = makeFragment({ fields: [] });
                repository = makeRepository(fragment);

                await executeOperation(
                    {
                        operation: 'update',
                        fragmentId: 'frag-1',
                        updates: { newField: 'value' },
                    },
                    repository,
                );
                const savedFragment = repository.aem.sites.cf.fragments.save.firstCall.args[0];
                const addedField = savedFragment.fields.find((f) => f.name === 'newField');
                expect(addedField).to.exist;
                expect(addedField.values).to.deep.equal(['value']);
            });

            it('should update multiple fields at once', async () => {
                const fragment = makeFragment({
                    fields: [
                        { name: 'title', values: ['Old'] },
                        { name: 'description', values: ['Old desc'] },
                    ],
                });
                repository = makeRepository(fragment);

                const result = await executeOperation(
                    {
                        operation: 'update',
                        fragmentId: 'frag-1',
                        updates: {
                            title: 'New',
                            description: 'New desc',
                        },
                    },
                    repository,
                );
                expect(result.updatedFields).to.have.lengthOf(2);
                expect(result.updatedFields).to.include('title');
                expect(result.updatedFields).to.include('description');
            });

            it('should include fragment title in result message', async () => {
                const result = await executeOperation(
                    {
                        operation: 'update',
                        fragmentId: 'frag-1',
                        updates: { title: 'New' },
                    },
                    repository,
                );
                expect(result.message).to.include('Test Fragment');
            });

            it('should throw when fragment not found', async () => {
                repository.aem.sites.cf.fragments.getById.resolves(null);
                try {
                    await executeOperation(
                        {
                            operation: 'update',
                            fragmentId: 'missing',
                            updates: { title: 'X' },
                        },
                        repository,
                    );
                    expect.fail('Should have thrown');
                } catch (e) {
                    expect(e.message).to.equal('Fragment not found: missing');
                }
            });

            it('should mix existing and new fields', async () => {
                const fragment = makeFragment({
                    fields: [{ name: 'title', values: ['Old'] }],
                });
                repository = makeRepository(fragment);

                await executeOperation(
                    {
                        operation: 'update',
                        fragmentId: 'frag-1',
                        updates: { title: 'New', brand: 'Adobe' },
                    },
                    repository,
                );
                const savedFragment = repository.aem.sites.cf.fragments.save.firstCall.args[0];
                expect(savedFragment.fields).to.have.lengthOf(2);
                expect(savedFragment.fields.find((f) => f.name === 'title').values).to.deep.equal(['New']);
                expect(savedFragment.fields.find((f) => f.name === 'brand').values).to.deep.equal(['Adobe']);
            });
        });
    });
});
