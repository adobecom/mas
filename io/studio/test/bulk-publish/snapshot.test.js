const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

describe('bulk-publish/snapshot.js', () => {
    let snapshot;
    let fetchOdinStub;

    const odinEndpoint = 'https://odin.example';
    const authToken = 'token';

    function fetchResponse(body = {}, { ok = true, status = 200, location = null } = {}) {
        return {
            ok,
            status,
            statusText: ok ? 'OK' : `Error ${status}`,
            json: async () => body,
            headers: { get: (key) => (key === 'Location' ? location : null) },
        };
    }

    function makeEntries(fragments, createdAt = new Date().toISOString()) {
        return fragments.map(({ fragmentId, versionId = 'v1', wasPublished = true }) =>
            JSON.stringify({ fragmentId, versionId, wasPublished, createdAt }),
        );
    }

    beforeEach(() => {
        fetchOdinStub = sinon.stub();

        snapshot = proxyquire('../../src/bulk-publish/snapshot.js', {
            '../common.js': {
                '@noCallThru': true,
                fetchOdin: fetchOdinStub,
                processBatchWithConcurrency: async (items, _size, fn) => Promise.all(items.map(fn)),
            },
        });
    });

    afterEach(() => sinon.restore());

    // ── createSnapshot ──────────────────────────────────────────────────────

    describe('createSnapshot()', () => {
        it('returns serialized entries with fragmentId, versionId, wasPublished, createdAt', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({ items: [{ id: 'frag-1', path: '/content/dam/a', status: 'PUBLISHED' }] });
                }
                if (uri.includes('/versions')) {
                    return fetchResponse({}, { location: '/versions/ver-abc' });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/a'],
                projectId: 'proj-1',
                projectTitle: 'Project One',
                odinEndpoint,
                authToken,
            });

            expect(results.entries).to.have.length(1);
            const entry = JSON.parse(results.entries[0]);
            expect(entry).to.have.property('fragmentId', 'frag-1');
            expect(entry).to.have.property('versionId', 'ver-abc');
            expect(entry).to.have.property('wasPublished');
            expect(entry).to.have.property('createdAt');
        });

        it('sets wasPublished: true for Published status', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({ items: [{ id: 'frag-pub', path: '/content/dam/pub', status: 'PUBLISHED' }] });
                }
                return fetchResponse({}, { location: '/versions/ver-1' });
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/pub'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
            });

            expect(JSON.parse(results.entries[0]).wasPublished).to.be.true;
        });

        it('sets wasPublished: true for Modified status', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({ items: [{ id: 'frag-mod', path: '/content/dam/mod', status: 'MODIFIED' }] });
                }
                return fetchResponse({}, { location: '/versions/ver-2' });
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/mod'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
            });

            expect(JSON.parse(results.entries[0]).wasPublished).to.be.true;
        });

        it('sets wasPublished: false for Draft status', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({ items: [{ id: 'frag-draft', path: '/content/dam/draft', status: 'DRAFT' }] });
                }
                return fetchResponse({}, { location: '/versions/ver-3' });
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/draft'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
            });

            expect(JSON.parse(results.entries[0]).wasPublished).to.be.false;
        });

        it('throws if fragment not found at path (items empty)', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({ items: [] });
                }
                return fetchResponse({});
            });

            let err;
            try {
                await snapshot.createSnapshot({
                    paths: ['/content/dam/missing'],
                    projectId: 'p1',
                    projectTitle: 'T',
                    odinEndpoint,
                    authToken,
                });
            } catch (e) {
                err = e;
            }
            expect(err).to.exist;
            expect(err.message).to.match(/Fragment not found at path/);
        });

        it('throws if createVersion returns no versionId (empty Location header)', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({ items: [{ id: 'frag-nv', path: '/content/dam/nv', status: 'DRAFT' }] });
                }
                // versions endpoint returns no Location header
                return fetchResponse({}, { location: null });
            });

            let err;
            try {
                await snapshot.createSnapshot({
                    paths: ['/content/dam/nv'],
                    projectId: 'p1',
                    projectTitle: 'T',
                    odinEndpoint,
                    authToken,
                });
            } catch (e) {
                err = e;
            }
            expect(err).to.exist;
            expect(err.message).to.match(/Failed to create version/);
        });

        it('silently skips a sub-fragment when createVersion returns no versionId (required=false)', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    const path = decodeURIComponent(uri.split('path=')[1]);
                    if (path === '/content/dam/coll') {
                        return fetchResponse({
                            items: [
                                {
                                    id: 'frag-coll',
                                    path,
                                    status: 'DRAFT',
                                    fields: [{ name: 'cards', values: ['/content/dam/card'] }],
                                },
                            ],
                        });
                    }
                    if (path === '/content/dam/card') {
                        return fetchResponse({ items: [{ id: 'frag-card', path, status: 'DRAFT', fields: [] }] });
                    }
                }
                if (uri.includes('/versions')) {
                    const fragId = uri.split('/fragments/')[1].split('/')[0];
                    if (fragId === 'frag-card') return fetchResponse({}, { location: null });
                    return fetchResponse({}, { location: `/versions/ver-${fragId}` });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/coll'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
                includeCards: true,
            });

            const fragmentIds = results.entries.map((r) => JSON.parse(r).fragmentId);
            expect(fragmentIds).to.include('frag-coll');
            expect(fragmentIds).to.not.include('frag-card');
        });

        it('includeCards: true snapshots cards and collections fields (not variations)', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    const path = decodeURIComponent(uri.split('path=')[1]);
                    if (path === '/content/dam/mas/acom/en_US/coll') {
                        return fetchResponse({
                            items: [
                                {
                                    id: 'frag-coll',
                                    path: '/content/dam/mas/acom/en_US/coll',
                                    status: 'PUBLISHED',
                                    fields: [
                                        { name: 'cards', values: ['/content/dam/mas/acom/en_US/card-1'] },
                                        { name: 'variations', values: ['/content/dam/mas/acom/en_US/var-1'] },
                                    ],
                                },
                            ],
                        });
                    }
                    if (path === '/content/dam/mas/acom/en_US/card-1') {
                        return fetchResponse({ items: [{ id: 'frag-card', path, status: 'PUBLISHED', fields: [] }] });
                    }
                }
                if (uri.includes('/versions')) {
                    const fragId = uri.split('/fragments/')[1].split('/')[0];
                    return fetchResponse({}, { location: `/versions/ver-${fragId}` });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/mas/acom/en_US/coll'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
                includeCards: true,
            });

            const fragmentIds = results.entries.map((r) => JSON.parse(r).fragmentId);
            expect(fragmentIds).to.include.members(['frag-coll', 'frag-card']);
            expect(fragmentIds).to.not.include('frag-var');
        });

        it('includeVariations: true snapshots variations fields (not cards)', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    const path = decodeURIComponent(uri.split('path=')[1]);
                    if (path === '/content/dam/mas/acom/en_US/main') {
                        return fetchResponse({
                            items: [
                                {
                                    id: 'frag-main',
                                    path,
                                    status: 'PUBLISHED',
                                    fields: [
                                        { name: 'variations', values: ['/content/dam/mas/acom/en_US/var-1'] },
                                        { name: 'cards', values: ['/content/dam/mas/acom/en_US/card-1'] },
                                    ],
                                },
                            ],
                        });
                    }
                    if (path === '/content/dam/mas/acom/en_US/var-1') {
                        return fetchResponse({ items: [{ id: 'frag-var', path, status: 'DRAFT', fields: [] }] });
                    }
                }
                if (uri.includes('/versions')) {
                    const fragId = uri.split('/fragments/')[1].split('/')[0];
                    return fetchResponse({}, { location: `/versions/ver-${fragId}` });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/mas/acom/en_US/main'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
                includeVariations: true,
            });

            const fragmentIds = results.entries.map((r) => JSON.parse(r).fragmentId);
            expect(fragmentIds).to.include.members(['frag-main', 'frag-var']);
            expect(fragmentIds).to.not.include('frag-card');
        });

        it('includeCards + includeVariations: true recursively traverses the full tree', async () => {
            // collection → card → variation (3 levels deep)
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    const path = decodeURIComponent(uri.split('path=')[1]);
                    const fragments = {
                        '/content/dam/mas/acom/en_US/coll': {
                            id: 'frag-coll',
                            status: 'PUBLISHED',
                            fields: [{ name: 'cards', values: ['/content/dam/mas/acom/en_US/card-1'] }],
                        },
                        '/content/dam/mas/acom/en_US/card-1': {
                            id: 'frag-card',
                            status: 'PUBLISHED',
                            fields: [{ name: 'variations', values: ['/content/dam/mas/acom/en_US/var-1'] }],
                        },
                        '/content/dam/mas/acom/en_US/var-1': { id: 'frag-var', status: 'DRAFT', fields: [] },
                    };
                    const f = fragments[path];
                    return f ? fetchResponse({ items: [{ ...f, path }] }) : fetchResponse({ items: [] });
                }
                if (uri.includes('/versions')) {
                    const fragId = uri.split('/fragments/')[1].split('/')[0];
                    return fetchResponse({}, { location: `/versions/ver-${fragId}` });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/mas/acom/en_US/coll'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
                includeCards: true,
                includeVariations: true,
            });

            const fragmentIds = results.entries.map((r) => JSON.parse(r).fragmentId);
            expect(fragmentIds).to.include.members(['frag-coll', 'frag-card', 'frag-var']);
        });

        it('includeCards: true follows collections field recursively (sub-collection)', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    const path = decodeURIComponent(uri.split('path=')[1]);
                    const fragments = {
                        '/content/dam/mas/acom/en_US/coll': {
                            id: 'frag-coll',
                            status: 'PUBLISHED',
                            fields: [{ name: 'collections', values: ['/content/dam/mas/acom/en_US/sub-coll'] }],
                        },
                        '/content/dam/mas/acom/en_US/sub-coll': {
                            id: 'frag-sub-coll',
                            status: 'PUBLISHED',
                            fields: [{ name: 'cards', values: ['/content/dam/mas/acom/en_US/card-1'] }],
                        },
                        '/content/dam/mas/acom/en_US/card-1': { id: 'frag-card', status: 'PUBLISHED', fields: [] },
                    };
                    const f = fragments[path];
                    return f ? fetchResponse({ items: [{ ...f, path }] }) : fetchResponse({ items: [] });
                }
                if (uri.includes('/versions')) {
                    const fragId = uri.split('/fragments/')[1].split('/')[0];
                    return fetchResponse({}, { location: `/versions/ver-${fragId}` });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/mas/acom/en_US/coll'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
                includeCards: true,
            });

            const fragmentIds = results.entries.map((r) => JSON.parse(r).fragmentId);
            expect(fragmentIds).to.include.members(['frag-coll', 'frag-sub-coll', 'frag-card']);
        });

        it('deduplicates shared paths across the recursive tree', async () => {
            const sharedCard = '/content/dam/mas/acom/en_US/shared-card';
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    const path = decodeURIComponent(uri.split('path=')[1]);
                    const fragments = {
                        '/content/dam/mas/acom/en_US/coll-a': {
                            id: 'frag-a',
                            status: 'PUBLISHED',
                            fields: [{ name: 'cards', values: [sharedCard] }],
                        },
                        '/content/dam/mas/acom/en_US/coll-b': {
                            id: 'frag-b',
                            status: 'PUBLISHED',
                            fields: [{ name: 'cards', values: [sharedCard] }],
                        },
                        [sharedCard]: { id: 'frag-shared', status: 'PUBLISHED', fields: [] },
                    };
                    const f = fragments[path];
                    return f ? fetchResponse({ items: [{ ...f, path }] }) : fetchResponse({ items: [] });
                }
                if (uri.includes('/versions')) {
                    const fragId = uri.split('/fragments/')[1].split('/')[0];
                    return fetchResponse({}, { location: `/versions/ver-${fragId}` });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/mas/acom/en_US/coll-a', '/content/dam/mas/acom/en_US/coll-b'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
                includeCards: true,
            });

            expect(results.entries).to.have.length(3);
            const fragmentIds = results.entries.map((r) => JSON.parse(r).fragmentId);
            expect(fragmentIds.filter((id) => id === 'frag-shared')).to.have.length(1);
        });

        it('does not fetch referenced paths that are outside /content/dam/mas/', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    const path = decodeURIComponent(uri.split('path=')[1]);
                    if (path === '/content/dam/mas/project/en_US/coll') {
                        return fetchResponse({
                            items: [
                                {
                                    id: 'frag-coll',
                                    path,
                                    status: 'PUBLISHED',
                                    fields: [{ name: 'cards', values: ['/content/dam/other/private-card'] }],
                                },
                            ],
                        });
                    }
                    return fetchResponse({ items: [] });
                }
                if (uri.includes('/versions')) {
                    return fetchResponse({}, { location: '/versions/ver-1' });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/mas/project/en_US/coll'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
                includeCards: true,
            });

            expect(results.entries).to.have.length(1);
            expect(JSON.parse(results.entries[0]).fragmentId).to.equal('frag-coll');
            // External path must NOT have been fetched
            const calledUris = fetchOdinStub.args.map(([, uri]) => uri);
            expect(calledUris.some((u) => u.includes('other/private-card'))).to.be.false;
        });

        it('skips missing referenced fragments without throwing', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    const path = decodeURIComponent(uri.split('path=')[1]);
                    if (path === '/content/dam/coll') {
                        return fetchResponse({
                            items: [
                                {
                                    id: 'frag-coll',
                                    path,
                                    status: 'PUBLISHED',
                                    fields: [{ name: 'cards', values: ['/content/dam/missing'] }],
                                },
                            ],
                        });
                    }
                    return fetchResponse({ items: [] });
                }
                if (uri.includes('/versions')) {
                    return fetchResponse({}, { location: '/versions/ver-1' });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/coll'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
                includeCards: true,
            });

            expect(results.entries).to.have.length(1);
            expect(JSON.parse(results.entries[0]).fragmentId).to.equal('frag-coll');
        });

        it('does not re-snapshot a reference path already in the main paths list', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({
                        items: [
                            {
                                id: 'frag-a',
                                path: '/content/dam/a',
                                status: 'PUBLISHED',
                                fields: [{ name: 'cards', values: ['/content/dam/a'] }],
                            },
                        ],
                    });
                }
                if (uri.includes('/versions')) {
                    return fetchResponse({}, { location: '/versions/ver-1' });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/a'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
                includeCards: true,
            });

            expect(results.entries).to.have.length(1);
        });

        it('default (no flags): does not snapshot any sub-items', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({
                        items: [
                            {
                                id: 'frag-main',
                                path: '/content/dam/main',
                                status: 'PUBLISHED',
                                fields: [
                                    { name: 'variations', values: ['/content/dam/var-1'] },
                                    { name: 'cards', values: ['/content/dam/card-1'] },
                                    { name: 'collections', values: ['/content/dam/sub-coll'] },
                                ],
                            },
                        ],
                    });
                }
                if (uri.includes('/versions')) {
                    return fetchResponse({}, { location: '/versions/ver-1' });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/main'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
            });

            expect(results.entries).to.have.length(1);
            expect(JSON.parse(results.entries[0]).fragmentId).to.equal('frag-main');
        });

        it('all entries share the same createdAt timestamp (multi-path)', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    const path = decodeURIComponent(uri.split('path=')[1]);
                    const idx = path.endsWith('b') ? 'b' : 'a';
                    return fetchResponse({ items: [{ id: `frag-${idx}`, path, status: 'PUBLISHED' }] });
                }
                if (uri.includes('/versions')) {
                    const fragId = uri.split('/fragments/')[1].split('/')[0];
                    return fetchResponse({}, { location: `/versions/ver-${fragId}` });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: ['/content/dam/a', '/content/dam/b'],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
            });

            expect(results.entries).to.have.length(2);
            const timestamps = results.entries.map((r) => JSON.parse(r).createdAt);
            expect(timestamps[0]).to.equal(timestamps[1]);
        });

        it('returns expandedPaths containing all paths visited during traversal', async () => {
            const collPath = '/content/dam/mas/acom/en_US/coll';
            const cardPath = '/content/dam/mas/acom/en_US/card-1';
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    const path = decodeURIComponent(uri.split('path=')[1]);
                    if (path === collPath) {
                        return fetchResponse({
                            items: [
                                { id: 'frag-coll', path, status: 'PUBLISHED', fields: [{ name: 'cards', values: [cardPath] }] },
                            ],
                        });
                    }
                    if (path === cardPath) {
                        return fetchResponse({ items: [{ id: 'frag-card', path, status: 'PUBLISHED', fields: [] }] });
                    }
                }
                if (uri.includes('/versions')) {
                    const fragId = uri.split('/fragments/')[1].split('/')[0];
                    return fetchResponse({}, { location: `/versions/ver-${fragId}` });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: [collPath],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
                includeCards: true,
            });

            expect(results.expandedPaths).to.include(collPath);
            expect(results.expandedPaths).to.include(cardPath);
        });

        it('returns expandedPaths equal to input paths when no flags set', async () => {
            const path = '/content/dam/mas/acom/en_US/frag';
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({
                        items: [
                            {
                                id: 'frag-1',
                                path,
                                status: 'PUBLISHED',
                                fields: [{ name: 'cards', values: ['/content/dam/mas/acom/en_US/card'] }],
                            },
                        ],
                    });
                }
                if (uri.includes('/versions')) {
                    return fetchResponse({}, { location: '/versions/ver-1' });
                }
                return fetchResponse({});
            });

            const results = await snapshot.createSnapshot({
                paths: [path],
                projectId: 'p1',
                projectTitle: 'T',
                odinEndpoint,
                authToken,
            });

            expect(results.expandedPaths).to.deep.equal([path]);
        });
    });

    // ── revertSnapshot ───────────────────────────────────────────────────────

    describe('revertSnapshot()', () => {
        it('returns { failures: [], skipped: [] } on full success (wasPublished: true)', async () => {
            const entries = makeEntries([{ fragmentId: 'frag-1', versionId: 'v1', wasPublished: true }]);

            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments/frag-1') && !uri.includes('versions')) {
                    return fetchResponse({ id: 'frag-1', path: '/content/dam/a' });
                }
                if (uri.includes('/restore/')) {
                    return fetchResponse({});
                }
                return fetchResponse({});
            });

            const result = await snapshot.revertSnapshot({ entries, odinEndpoint, authToken });
            expect(result.failures).to.deep.equal([]);
            expect(result.skipped).to.deep.equal([]);
        });

        it('calls unpublish endpoint with correct path when wasPublished: false', async () => {
            const entries = makeEntries([{ fragmentId: 'frag-2', versionId: 'v1', wasPublished: false }]);

            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri === `/adobe/sites/cf/fragments/frag-2`) {
                    return fetchResponse({ id: 'frag-2', path: '/content/dam/b' });
                }
                if (uri.includes('/restore/')) {
                    return fetchResponse({});
                }
                return fetchResponse({});
            });

            await snapshot.revertSnapshot({ entries, odinEndpoint, authToken });

            const unpublishCall = fetchOdinStub.args.find(([, uri]) => uri === '/adobe/sites/cf/fragments/publish');
            expect(unpublishCall).to.exist;
            const body = JSON.parse(unpublishCall[3].body);
            expect(body.paths).to.deep.equal(['/content/dam/b']);
            expect(body.workflowModelId).to.equal('/var/workflow/models/scheduled_deactivation');
        });

        it('does NOT call unpublish endpoint when wasPublished: true', async () => {
            const entries = makeEntries([{ fragmentId: 'frag-3', versionId: 'v1', wasPublished: true }]);

            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments/frag-3')) {
                    return fetchResponse({ id: 'frag-3', path: '/content/dam/c' });
                }
                return fetchResponse({});
            });

            await snapshot.revertSnapshot({ entries, odinEndpoint, authToken });

            const unpublishCall = fetchOdinStub.args.find(([, uri]) => uri === '/adobe/sites/cf/fragments/publish');
            expect(unpublishCall).to.not.exist;
        });

        it('returns skipped: [fragmentId] when getFragmentById responds with 404', async () => {
            const entries = makeEntries([{ fragmentId: 'frag-gone', versionId: 'v1', wasPublished: true }]);

            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments/frag-gone')) {
                    return fetchResponse({}, { ok: false, status: 404 });
                }
                return fetchResponse({});
            });

            const result = await snapshot.revertSnapshot({ entries, odinEndpoint, authToken });
            expect(result.skipped).to.deep.equal(['frag-gone']);
            expect(result.failures).to.deep.equal([]);
        });

        it('returns failures entry when getFragmentById responds with non-404 error (500)', async () => {
            const entries = makeEntries([{ fragmentId: 'frag-err', versionId: 'v1', wasPublished: true }]);

            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments/frag-err')) {
                    return fetchResponse({}, { ok: false, status: 500 });
                }
                return fetchResponse({});
            });

            const result = await snapshot.revertSnapshot({ entries, odinEndpoint, authToken });
            expect(result.failures).to.have.length(1);
            expect(result.failures[0]).to.have.property('error');
            expect(result.skipped).to.deep.equal([]);
        });

        it('returns failures entry when restoreVersion throws', async () => {
            const entries = makeEntries([{ fragmentId: 'frag-rv', versionId: 'v1', wasPublished: true }]);

            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri === `/adobe/sites/cf/fragments/frag-rv`) {
                    return fetchResponse({ id: 'frag-rv', path: '/content/dam/rv' });
                }
                if (uri.includes('/restore/')) {
                    return Promise.reject(new Error('restore failed'));
                }
                return fetchResponse({});
            });

            const result = await snapshot.revertSnapshot({ entries, odinEndpoint, authToken });
            expect(result.failures).to.have.length(1);
            expect(result.failures[0].error).to.equal('restore failed');
        });
    });

    // ── checkModifications ───────────────────────────────────────────────────

    describe('checkModifications()', () => {
        it('modified: true for fragment modified after snapshot createdAt', async () => {
            const createdAt = new Date('2024-01-01T00:00:00Z').toISOString();
            const entries = makeEntries([{ fragmentId: 'frag-a', versionId: 'v1', wasPublished: true }], createdAt);

            fetchOdinStub.resolves(
                fetchResponse({
                    id: 'frag-a',
                    path: '/content/dam/a',
                    modified: { at: new Date('2024-06-01T00:00:00Z').toISOString() },
                }),
            );

            const results = await snapshot.checkModifications({ entries, odinEndpoint, authToken });
            expect(results[0].modified).to.be.true;
        });

        it('modified: false for fragment not modified since snapshot', async () => {
            const createdAt = new Date('2024-06-01T00:00:00Z').toISOString();
            const entries = makeEntries([{ fragmentId: 'frag-b', versionId: 'v1', wasPublished: true }], createdAt);

            fetchOdinStub.resolves(
                fetchResponse({
                    id: 'frag-b',
                    path: '/content/dam/b',
                    modified: { at: new Date('2024-01-01T00:00:00Z').toISOString() },
                }),
            );

            const results = await snapshot.checkModifications({ entries, odinEndpoint, authToken });
            expect(results[0].modified).to.be.false;
        });

        it('modified: false when modified field is missing', async () => {
            const createdAt = new Date('2024-01-01T00:00:00Z').toISOString();
            const entries = makeEntries([{ fragmentId: 'frag-c', versionId: 'v1', wasPublished: true }], createdAt);

            fetchOdinStub.resolves(
                fetchResponse({
                    id: 'frag-c',
                    path: '/content/dam/c',
                }),
            );

            const results = await snapshot.checkModifications({ entries, odinEndpoint, authToken });
            expect(results[0].modified).to.be.false;
        });

        it('modified: null when getFragmentById throws (404 response)', async () => {
            const createdAt = new Date('2024-01-01T00:00:00Z').toISOString();
            const entries = makeEntries([{ fragmentId: 'frag-d', versionId: 'v1', wasPublished: true }], createdAt);

            fetchOdinStub.resolves(fetchResponse({}, { ok: false, status: 404 }));

            const results = await snapshot.checkModifications({ entries, odinEndpoint, authToken });
            expect(results[0].modified).to.be.null;
        });

        it('results sorted by path', async () => {
            const createdAt = new Date('2024-01-01T00:00:00Z').toISOString();
            const entries = makeEntries(
                [
                    { fragmentId: 'frag-z', versionId: 'v1', wasPublished: true },
                    { fragmentId: 'frag-a', versionId: 'v1', wasPublished: true },
                ],
                createdAt,
            );

            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('frag-z')) {
                    return fetchResponse({ id: 'frag-z', path: '/content/dam/z', modified: { at: createdAt } });
                }
                if (uri.includes('frag-a')) {
                    return fetchResponse({ id: 'frag-a', path: '/content/dam/a', modified: { at: createdAt } });
                }
                return fetchResponse({});
            });

            const results = await snapshot.checkModifications({ entries, odinEndpoint, authToken });
            expect(results[0].path).to.equal('/content/dam/a');
            expect(results[1].path).to.equal('/content/dam/z');
        });
    });
});
