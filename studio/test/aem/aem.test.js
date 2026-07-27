import { expect } from '@esm-bundle/chai';
import { AEM, filterByTags } from '../../src/aem/aem.js';
import { UserFriendlyError } from '../../src/utils.js';

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

    describe('method: deleteFragment', () => {
        it('calls deleteAndUnpublish endpoint with If-Match header', async () => {
            let capturedUrl;
            let capturedOptions;
            window.fetch = async (url, options) => {
                capturedUrl = url;
                capturedOptions = options;
                return { ok: true, status: 202 };
            };

            await aem.deleteFragment({ id: 'frag-123', etag: '"etag-abc"' });

            expect(capturedUrl).to.include('/cf/fragments/frag-123/deleteAndUnpublish');
            expect(capturedOptions.method).to.equal('DELETE');
            expect(capturedOptions.headers['If-Match']).to.equal('"etag-abc"');
        });

        it('throws when response is not ok', async () => {
            window.fetch = async () => ({ ok: false, status: 412, statusText: 'Precondition Failed' });

            try {
                await aem.deleteFragment({ id: 'frag-123', etag: '"etag-abc"' });
                expect.fail('should have thrown');
            } catch (err) {
                expect(err.message).to.include('412');
            }
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

    describe('method: postFormWithCsrf', () => {
        let originalGetCsrfToken;

        beforeEach(() => {
            originalGetCsrfToken = aem.getCsrfToken;
        });

        afterEach(() => {
            aem.getCsrfToken = originalGetCsrfToken;
            delete window.fetch;
        });

        it('fetches a CSRF token and POSTs the form data to baseUrl + path', async () => {
            const calls = [];
            window.fetch = async (url, options) => {
                calls.push({ url, options });
                return { ok: true, status: 200 };
            };
            aem.getCsrfToken = async () => 'csrf-123';

            const formData = new FormData();
            formData.append('foo', 'bar');

            const response = await aem.postFormWithCsrf('/content/cq:tags/mas/foo', formData);

            expect(calls.length).to.equal(1);
            expect(calls[0].url).to.equal(`${aem.baseUrl}/content/cq:tags/mas/foo`);
            expect(calls[0].options.method).to.equal('POST');
            expect(calls[0].options.headers['CSRF-Token']).to.equal('csrf-123');
            expect(calls[0].options.body).to.equal(formData);
            expect(response.ok).to.be.true;
        });

        it('does not throw when the response is not ok - callers are responsible for checking', async () => {
            window.fetch = async () => ({ ok: false, status: 500, statusText: 'Server Error' });
            aem.getCsrfToken = async () => 'csrf-123';

            const response = await aem.postFormWithCsrf('/content/cq:tags/mas/foo', new FormData());

            expect(response.ok).to.be.false;
            expect(response.status).to.equal(500);
        });

        it('throws a wrapped network error when fetch fails', async () => {
            window.fetch = async () => {
                throw new Error('Network down');
            };
            aem.getCsrfToken = async () => 'csrf-123';

            try {
                await aem.postFormWithCsrf('/content/cq:tags/mas/foo', new FormData());
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Network error: Network down');
            }
        });

        it('propagates an error when fetching the CSRF token fails', async () => {
            aem.getCsrfToken = async () => {
                throw new Error('CSRF fetch failed');
            };

            try {
                await aem.postFormWithCsrf('/content/cq:tags/mas/foo', new FormData());
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('CSRF fetch failed');
            }
        });
    });

    describe('method: createTag', () => {
        let originalGetCsrfToken;

        beforeEach(() => {
            originalGetCsrfToken = aem.getCsrfToken;
        });

        afterEach(() => {
            aem.getCsrfToken = originalGetCsrfToken;
            delete window.fetch;
        });

        it('throws a UserFriendlyError and does not create the tag when it already exists', async () => {
            const calls = [];
            window.fetch = async (url, options) => {
                calls.push({ url, options });
                return { ok: true, status: 200 };
            };

            try {
                await aem.createTag('/content/cq:tags/mas/promotions/my-promo', 'My Promo');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.be.instanceOf(UserFriendlyError);
                expect(error.message).to.equal('Tag already exists.');
            }

            expect(calls.length).to.equal(1);
            expect(calls[0].url).to.equal(`${aem.baseUrl}/content/cq:tags/mas/promotions/my-promo.json`);
            expect(calls[0].options.method).to.equal('GET');
        });

        it('fetches a CSRF token and creates the tag when it does not exist (404)', async () => {
            const calls = [];
            window.fetch = async (url, options) => {
                calls.push({ url, options });
                if (options.method === 'GET') {
                    return { ok: false, status: 404 };
                }
                return { ok: true, status: 201 };
            };
            aem.getCsrfToken = async () => 'csrf-123';

            await aem.createTag('/content/cq:tags/mas/promotions/my-promo', 'My Promo');

            expect(calls.length).to.equal(2);
            const postCall = calls[1];
            expect(postCall.url).to.equal(`${aem.baseUrl}/content/cq:tags/mas/promotions/my-promo`);
            expect(postCall.options.method).to.equal('POST');
            expect(postCall.options.headers['CSRF-Token']).to.equal('csrf-123');
            expect(postCall.options.body.get('jcr:primaryType')).to.equal('cq:Tag');
            expect(postCall.options.body.get('jcr:title')).to.equal('My Promo');
        });

        it('throws when the tag creation POST fails', async () => {
            window.fetch = async (url, options) => {
                if (options.method === 'GET') {
                    return { ok: false, status: 404 };
                }
                throw new Error('Network down');
            };
            aem.getCsrfToken = async () => 'csrf-123';

            try {
                await aem.createTag('/content/cq:tags/mas/promotions/my-promo', 'My Promo');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Network down');
            }
        });

        it('throws when the tag existence check returns an unexpected status', async () => {
            window.fetch = async () => ({ ok: false, status: 500, statusText: 'Server Error' });

            try {
                await aem.createTag('/content/cq:tags/mas/promotions/my-promo', 'My Promo');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.be.a('string');
            }
        });
    });

    describe('method: deleteTag', () => {
        let originalGetCsrfToken;

        beforeEach(() => {
            originalGetCsrfToken = aem.getCsrfToken;
        });

        afterEach(() => {
            aem.getCsrfToken = originalGetCsrfToken;
            delete window.fetch;
        });

        it('fetches a CSRF token and deletes the tag', async () => {
            const calls = [];
            window.fetch = async (url, options) => {
                calls.push({ url, options });
                return { ok: true, status: 200 };
            };
            aem.getCsrfToken = async () => 'csrf-123';

            const response = await aem.deleteTag('/content/cq:tags/mas/promotions/my-promo');

            expect(calls.length).to.equal(1);
            expect(calls[0].url).to.equal(`${aem.baseUrl}/content/cq:tags/mas/promotions/my-promo`);
            expect(calls[0].options.method).to.equal('POST');
            expect(calls[0].options.headers['CSRF-Token']).to.equal('csrf-123');
            expect(response.ok).to.be.true;
        });

        it('throws when the delete POST fails', async () => {
            window.fetch = async () => ({ ok: false, status: 500, statusText: 'Server Error' });
            aem.getCsrfToken = async () => 'csrf-123';

            try {
                await aem.deleteTag('/content/cq:tags/mas/promotions/my-promo');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Failed to delete tag: 500 Server Error');
            }
        });

        it('throws on a network error during delete', async () => {
            window.fetch = async () => {
                throw new Error('Network down');
            };
            aem.getCsrfToken = async () => 'csrf-123';

            try {
                await aem.deleteTag('/content/cq:tags/mas/promotions/my-promo');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Network down');
            }
        });

        it('propagates an error when fetching the CSRF token fails', async () => {
            aem.getCsrfToken = async () => {
                throw new Error('CSRF fetch failed');
            };

            try {
                await aem.deleteTag('/content/cq:tags/mas/promotions/my-promo');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('CSRF fetch failed');
            }
        });
    });
});
