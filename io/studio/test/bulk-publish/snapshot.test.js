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

            expect(results).to.have.length(1);
            const entry = JSON.parse(results[0]);
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

            expect(JSON.parse(results[0]).wasPublished).to.be.true;
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

            expect(JSON.parse(results[0]).wasPublished).to.be.true;
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

            expect(JSON.parse(results[0]).wasPublished).to.be.false;
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

            expect(results).to.have.length(2);
            const timestamps = results.map((r) => JSON.parse(r).createdAt);
            expect(timestamps[0]).to.equal(timestamps[1]);
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

    // ── translation version detection (via recordSnapshot) ───────────────────

    describe('translation version detection', () => {
        it('skips versions with createdBy odin-cf-versioning-user', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/fragments?path='))
                    return fetchResponse({ items: [{ id: 'frag-1', path: '/a', status: 'PUBLISHED' }] });
                if (uri.includes('/versions'))
                    return fetchResponse({
                        items: [
                            { id: 'v-trans', createdBy: 'odin-cf-versioning-user', comment: '' },
                            { id: 'v-green', createdBy: 'author@adobe.com', comment: 'edit' },
                        ],
                    });
                return fetchResponse({});
            });
            const results = await snapshot.recordSnapshot({ paths: ['/a'], odinEndpoint, authToken });
            expect(JSON.parse(results.entries[0]).versionId).to.equal('v-green');
        });

        it('skips versions with Pre-rollout snapshot comment', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/fragments?path='))
                    return fetchResponse({ items: [{ id: 'frag-1', path: '/a', status: 'PUBLISHED' }] });
                if (uri.includes('/versions'))
                    return fetchResponse({
                        items: [
                            { id: 'v-trans', createdBy: 'someone', comment: 'Pre-rollout snapshot — source CF: /x' },
                            { id: 'v-green', createdBy: 'author@adobe.com', comment: 'edit' },
                        ],
                    });
                return fetchResponse({});
            });
            const results = await snapshot.recordSnapshot({ paths: ['/a'], odinEndpoint, authToken });
            expect(JSON.parse(results.entries[0]).versionId).to.equal('v-green');
        });

        it('uses first version when no translation versions exist', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/fragments?path='))
                    return fetchResponse({ items: [{ id: 'frag-1', path: '/a', status: 'PUBLISHED' }] });
                if (uri.includes('/versions'))
                    return fetchResponse({
                        items: [
                            { id: 'v-latest', createdBy: 'author@adobe.com', comment: 'Latest' },
                            { id: 'v-older', createdBy: 'author@adobe.com', comment: 'Older' },
                        ],
                    });
                return fetchResponse({});
            });
            const results = await snapshot.recordSnapshot({ paths: ['/a'], odinEndpoint, authToken });
            expect(JSON.parse(results.entries[0]).versionId).to.equal('v-latest');
        });

        it('treats version with undefined comment as non-translation', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/fragments?path='))
                    return fetchResponse({ items: [{ id: 'frag-1', path: '/a', status: 'PUBLISHED' }] });
                if (uri.includes('/versions')) return fetchResponse({ items: [{ id: 'v-1', createdBy: 'author@adobe.com' }] });
                return fetchResponse({});
            });
            const results = await snapshot.recordSnapshot({ paths: ['/a'], odinEndpoint, authToken });
            expect(JSON.parse(results.entries[0]).versionId).to.equal('v-1');
        });

        it('treats Pre-bulk-publish versions as non-translation (eligible as revert target)', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/fragments?path='))
                    return fetchResponse({ items: [{ id: 'frag-1', path: '/a', status: 'PUBLISHED' }] });
                if (uri.includes('/versions'))
                    return fetchResponse({
                        items: [
                            { id: 'v-bulk', createdBy: 'author@adobe.com', comment: 'Pre-bulk-publish — My Project' },
                            { id: 'v-trans', createdBy: 'odin-cf-versioning-user', comment: '' },
                            { id: 'v-green', createdBy: 'author@adobe.com', comment: 'Manual edit' },
                        ],
                    });
                return fetchResponse({});
            });
            // Pre-bulk-publish is NOT a translation version, so it is eligible as revert target
            const results = await snapshot.recordSnapshot({ paths: ['/a'], odinEndpoint, authToken });
            expect(JSON.parse(results.entries[0]).versionId).to.equal('v-bulk');
        });

        it('calls GET /adobe/sites/cf/fragments/{id}/versions', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/fragments?path='))
                    return fetchResponse({ items: [{ id: 'frag-abc', path: '/a', status: 'PUBLISHED' }] });
                if (uri.includes('/versions'))
                    return fetchResponse({ items: [{ id: 'v-1', createdBy: 'author@adobe.com', comment: '' }] });
                return fetchResponse({});
            });
            await snapshot.recordSnapshot({ paths: ['/a'], odinEndpoint, authToken });
            expect(fetchOdinStub).to.have.been.calledWith(
                odinEndpoint,
                '/adobe/sites/cf/fragments/frag-abc/versions',
                authToken,
                sinon.match.object,
            );
        });
    });

    // ── recordSnapshot ────────────────────────────────────────────────────────

    describe('recordSnapshot()', () => {
        it('returns entries with non-translation versionId and does NOT POST to /versions', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({ items: [{ id: 'frag-1', path: '/content/dam/a', status: 'PUBLISHED' }] });
                }
                if (uri.includes('/versions')) {
                    return fetchResponse({
                        items: [
                            {
                                id: 'v-trans',
                                createdBy: 'odin-cf-versioning-user',
                                comment: 'Pre-rollout snapshot — source CF: /x',
                            },
                            { id: 'v-green', createdBy: 'author@adobe.com', comment: 'Manual edit' },
                        ],
                    });
                }
                return fetchResponse({});
            });

            const results = await snapshot.recordSnapshot({ paths: ['/content/dam/a'], odinEndpoint, authToken });

            expect(results.entries).to.have.length(1);
            expect(results.failures).to.have.length(0);
            const entry = JSON.parse(results.entries[0]);
            expect(entry.fragmentId).to.equal('frag-1');
            expect(entry.versionId).to.equal('v-green');
            expect(entry.wasPublished).to.be.true;
            expect(entry.createdAt).to.be.a('string');

            const postVersionCall = fetchOdinStub.args.find(
                ([, uri, , opts]) => uri.includes('/versions') && opts?.method === 'POST',
            );
            expect(postVersionCall).to.not.exist;
        });

        it('sets wasPublished: false for DRAFT status', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({ items: [{ id: 'frag-d', path: '/content/dam/d', status: 'DRAFT' }] });
                }
                if (uri.includes('/versions')) {
                    return fetchResponse({ items: [{ id: 'v-1', createdBy: 'author@adobe.com', comment: '' }] });
                }
                return fetchResponse({});
            });

            const results = await snapshot.recordSnapshot({ paths: ['/content/dam/d'], odinEndpoint, authToken });
            expect(JSON.parse(results.entries[0]).wasPublished).to.be.false;
        });

        it('records failure when fragment not found at path', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({ items: [] });
                }
                return fetchResponse({});
            });

            const results = await snapshot.recordSnapshot({ paths: ['/content/dam/missing'], odinEndpoint, authToken });
            expect(results.entries).to.have.length(0);
            expect(results.failures).to.have.length(1);
            expect(results.failures[0].error).to.match(/Fragment not found at path/);
        });

        it('records failure when no non-translation version exists', async () => {
            fetchOdinStub.callsFake((endpoint, uri) => {
                if (uri.includes('/adobe/sites/cf/fragments?path=')) {
                    return fetchResponse({ items: [{ id: 'frag-t', path: '/content/dam/t', status: 'PUBLISHED' }] });
                }
                if (uri.includes('/versions')) {
                    return fetchResponse({ items: [{ id: 'v-t', createdBy: 'odin-cf-versioning-user', comment: '' }] });
                }
                return fetchResponse({});
            });

            const results = await snapshot.recordSnapshot({ paths: ['/content/dam/t'], odinEndpoint, authToken });
            expect(results.entries).to.have.length(0);
            expect(results.failures).to.have.length(1);
            expect(results.failures[0].error).to.match(/No non-translation version found/);
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
