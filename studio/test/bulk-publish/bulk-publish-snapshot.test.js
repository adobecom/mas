import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { createSnapshot, revertSnapshot, checkModifications } from '../../src/bulk-publish/bulk-publish-snapshot.js';
import { STATUS_PUBLISHED } from '../../src/constants.js';

function makeAem({ searchPages = [], fragmentById = {}, versionId = 'v1', getWithEtag = {}, status = STATUS_PUBLISHED } = {}) {
    return {
        sites: {
            cf: {
                fragments: {
                    getByPath: sinon.stub().callsFake(async (path) => {
                        const found = searchPages.find((p) => p.path === path);
                        return found ?? null;
                    }),
                    getById: sinon.stub().callsFake(async (id) => {
                        if (fragmentById[id]) return fragmentById[id];
                        return { id, path: `/content/dam/${id}`, status };
                    }),
                    createVersion: sinon.stub().resolves(versionId),
                    restoreVersion: sinon.stub().resolves(),
                    getWithEtag: sinon.stub().callsFake(async (id) => {
                        if (getWithEtag[id]) return getWithEtag[id];
                        return { id, path: `/content/dam/${id}` };
                    }),
                    setToDraft: sinon.stub().resolves(),
                },
            },
        },
    };
}

describe('createSnapshot()', () => {
    it('creates a version for each fragment and returns snapshot with enriched fragments map (keyed by UUID)', async () => {
        const aem = makeAem({
            searchPages: [{ id: 'frag-1', path: '/content/dam/frag-1' }],
            fragmentById: { 'frag-1': { id: 'frag-1', path: '/content/dam/frag-1', status: STATUS_PUBLISHED } },
            versionId: 'ver-abc',
        });
        const project = { id: 'proj-1', items: [{ path: '/content/dam/frag-1' }] };
        const snapshot = await createSnapshot(project, aem, 'user@test.com');

        expect(snapshot.fragments).to.have.key('frag-1');
        expect(snapshot.fragments['frag-1'].path).to.equal('/content/dam/frag-1');
        expect(snapshot.fragments['frag-1'].versionId).to.equal('ver-abc');
        expect(aem.sites.cf.fragments.createVersion.calledOnce).to.equal(true);
    });

    it('sets wasPublished: true for fragments that were PUBLISHED before snapshot', async () => {
        const aem = makeAem({
            searchPages: [{ id: 'frag-pub', path: '/p' }],
            fragmentById: { 'frag-pub': { id: 'frag-pub', path: '/p', status: STATUS_PUBLISHED } },
            versionId: 'v-pub',
        });
        const project = { id: 'p1', items: [{ path: '/p' }] };
        const snapshot = await createSnapshot(project, aem, 'u@e.com');
        expect(snapshot.fragments['frag-pub'].wasPublished).to.equal(true);
    });

    it('sets wasPublished: false for fragments that were DRAFT before snapshot', async () => {
        const aem = makeAem({
            searchPages: [{ id: 'frag-draft', path: '/d' }],
            fragmentById: { 'frag-draft': { id: 'frag-draft', path: '/d', status: 'Draft' } },
            versionId: 'v-draft',
        });
        const project = { id: 'p2', items: [{ path: '/d' }] };
        const snapshot = await createSnapshot(project, aem, 'u@e.com');
        expect(snapshot.fragments['frag-draft'].wasPublished).to.equal(false);
    });

    it('throws and does NOT return a snapshot if any createFragmentVersion call fails', async () => {
        const aem = makeAem({
            searchPages: [{ id: 'frag-fail', path: '/f' }],
            fragmentById: { 'frag-fail': { id: 'frag-fail', path: '/f', status: 'Draft' } },
            versionId: null,
        });
        const project = { id: 'p3', items: [{ path: '/f' }] };
        let threw = false;
        try {
            await createSnapshot(project, aem, 'u@e.com');
        } catch {
            threw = true;
        }
        expect(threw).to.equal(true);
    });

    it('snapshot.createdBy is populated from userEmail argument', async () => {
        const aem = makeAem({
            searchPages: [{ id: 'frag-x', path: '/x' }],
            fragmentById: { 'frag-x': { id: 'frag-x', path: '/x', status: 'Draft' } },
            versionId: 'v1',
        });
        const project = { id: 'p4', items: [{ path: '/x' }] };
        const snapshot = await createSnapshot(project, aem, 'specific@user.com');
        expect(snapshot.createdBy).to.equal('specific@user.com');
    });

    it('snapshot.source === "pre-publish"', async () => {
        const aem = makeAem({
            searchPages: [{ id: 'frag-y', path: '/y' }],
            fragmentById: { 'frag-y': { id: 'frag-y', path: '/y', status: 'Draft' } },
            versionId: 'v1',
        });
        const project = { id: 'p5', items: [{ path: '/y' }] };
        const snapshot = await createSnapshot(project, aem, 'u@e.com');
        expect(snapshot.source).to.equal('pre-publish');
    });

    it('processes all items and creates a version for each', async () => {
        const aem = makeAem({ versionId: 'v1' });
        const project = {
            id: 'p-multi',
            items: [{ fragmentId: 'f1' }, { fragmentId: 'f2' }, { fragmentId: 'f3' }],
        };
        const snapshot = await createSnapshot(project, aem, 'u@e.com');
        expect(Object.keys(snapshot.fragments)).to.have.lengthOf(3);
        expect(aem.sites.cf.fragments.createVersion.callCount).to.equal(3);
    });
});

describe('revertSnapshot()', () => {
    function makeSnapshot(entries) {
        return {
            createdAt: new Date().toISOString(),
            fragments: Object.fromEntries(
                entries.map(({ id, path, versionId, wasPublished }) => [id, { path, versionId, wasPublished }]),
            ),
        };
    }

    it('calls restoreVersion for each entry in snapshot.fragments', async () => {
        const aem = makeAem();
        const snapshot = makeSnapshot([
            { id: 'f1', path: '/p1', versionId: 'v1', wasPublished: true },
            { id: 'f2', path: '/p2', versionId: 'v2', wasPublished: true },
        ]);
        await revertSnapshot(snapshot, aem);
        expect(aem.sites.cf.fragments.restoreVersion.callCount).to.equal(2);
        expect(aem.sites.cf.fragments.restoreVersion.calledWith('f1', 'v1')).to.equal(true);
        expect(aem.sites.cf.fragments.restoreVersion.calledWith('f2', 'v2')).to.equal(true);
    });

    it('calls setToDraft after restoreVersion for wasPublished === false entries', async () => {
        const aem = makeAem({ fragmentById: { f1: { id: 'f1', path: '/p1', status: 'Draft' } } });
        const snapshot = makeSnapshot([{ id: 'f1', path: '/p1', versionId: 'v1', wasPublished: false }]);
        await revertSnapshot(snapshot, aem);
        expect(aem.sites.cf.fragments.setToDraft.calledOnce).to.equal(true);
        expect(aem.sites.cf.fragments.setToDraft.calledWith('/p1')).to.equal(true);
        const restoreOrder = aem.sites.cf.fragments.restoreVersion.firstCall.callId;
        const draftOrder = aem.sites.cf.fragments.setToDraft.firstCall.callId;
        expect(restoreOrder).to.be.lessThan(draftOrder);
    });

    it('does NOT call setToDraft for entries where wasPublished === true', async () => {
        const aem = makeAem();
        const snapshot = makeSnapshot([{ id: 'f1', path: '/p1', versionId: 'v1', wasPublished: true }]);
        await revertSnapshot(snapshot, aem);
        expect(aem.sites.cf.fragments.setToDraft.called).to.equal(false);
    });

    it('returns failures array with path and error for failed fragments (never throws)', async () => {
        const aem = makeAem({ fragmentById: { f1: { id: 'f1', path: '/fail-path', status: 'Draft' } } });
        aem.sites.cf.fragments.restoreVersion = sinon.stub().rejects(new Error('restore failed'));
        const snapshot = makeSnapshot([{ id: 'f1', path: '/fail-path', versionId: 'v1', wasPublished: true }]);
        const { failures } = await revertSnapshot(snapshot, aem);
        expect(failures).to.have.length(1);
        expect(failures[0].path).to.equal('/fail-path');
        expect(failures[0].error).to.include('restore failed');
    });

    it('continues processing remaining fragments after a partial failure', async () => {
        const aem = makeAem({
            fragmentById: {
                f1: { id: 'f1', path: '/fail-path', status: 'Draft' },
                f2: { id: 'f2', path: '/ok-path', status: 'Draft' },
            },
        });
        aem.sites.cf.fragments.restoreVersion = sinon.stub().onFirstCall().rejects(new Error('404')).onSecondCall().resolves();
        const snapshot = makeSnapshot([
            { id: 'f1', path: '/fail-path', versionId: 'v1', wasPublished: true },
            { id: 'f2', path: '/ok-path', versionId: 'v2', wasPublished: true },
        ]);
        const { failures } = await revertSnapshot(snapshot, aem);
        expect(failures).to.have.length(1);
        expect(failures[0].path).to.equal('/fail-path');
        expect(aem.sites.cf.fragments.restoreVersion.callCount).to.equal(2);
    });

    it('skips deleted fragments (getById 404) and returns them in skipped array', async () => {
        const aem = makeAem();
        const notFoundErr = new Error('Not Found');
        notFoundErr.response = { status: 404 };
        aem.sites.cf.fragments.getById = sinon.stub().rejects(notFoundErr);
        const snapshot = makeSnapshot([{ id: 'deleted-frag', path: '/gone', versionId: 'v1', wasPublished: true }]);
        const { failures, skipped } = await revertSnapshot(snapshot, aem);
        expect(failures).to.deep.equal([]);
        expect(skipped).to.deep.equal(['deleted-frag']);
        expect(aem.sites.cf.fragments.restoreVersion.called).to.equal(false);
    });

    it('treats non-404 getById errors as failures', async () => {
        const aem = makeAem();
        const serverErr = new Error('Internal Server Error');
        serverErr.response = { status: 500 };
        aem.sites.cf.fragments.getById = sinon.stub().rejects(serverErr);
        const snapshot = makeSnapshot([{ id: 'f1', path: '/p1', versionId: 'v1', wasPublished: true }]);
        const { failures } = await revertSnapshot(snapshot, aem);
        expect(failures).to.have.length(1);
        expect(failures[0].error).to.include('Internal Server Error');
    });

    it('returns empty failures array when all restores succeed', async () => {
        const aem = makeAem();
        const snapshot = makeSnapshot([{ id: 'f1', path: '/p1', versionId: 'v1', wasPublished: true }]);
        const { failures } = await revertSnapshot(snapshot, aem);
        expect(failures).to.deep.equal([]);
    });
});

describe('checkModifications()', () => {
    function makeSnapshot(createdAt, fragmentEntries) {
        return {
            createdAt,
            fragments: Object.fromEntries(fragmentEntries.map(({ id, path }) => [id, { path }])),
        };
    }

    it('returns modified: true for fragments whose modified.at is after snapshot.createdAt', async () => {
        const snapshotTime = '2026-01-01T10:00:00.000Z';
        const aem = {
            sites: {
                cf: {
                    fragments: {
                        getById: sinon.stub().resolves({ id: 'f1', path: '/p1', modified: { at: '2026-01-02T10:00:00.000Z' } }),
                    },
                },
            },
        };
        const snapshot = makeSnapshot(snapshotTime, [{ id: 'f1', path: '/p1' }]);
        const results = await checkModifications(snapshot, aem);
        expect(results[0].modified).to.equal(true);
    });

    it('returns modified: false for fragments unchanged since snapshot', async () => {
        const snapshotTime = '2026-01-05T10:00:00.000Z';
        const aem = {
            sites: {
                cf: {
                    fragments: {
                        getById: sinon.stub().resolves({ id: 'f1', path: '/p1', modified: { at: '2026-01-01T10:00:00.000Z' } }),
                    },
                },
            },
        };
        const snapshot = makeSnapshot(snapshotTime, [{ id: 'f1', path: '/p1' }]);
        const results = await checkModifications(snapshot, aem);
        expect(results[0].modified).to.equal(false);
    });

    it('handles missing modified field gracefully (treats as unmodified)', async () => {
        const aem = {
            sites: {
                cf: {
                    fragments: {
                        getById: sinon.stub().resolves({ id: 'f1', path: '/p1' }),
                    },
                },
            },
        };
        const snapshot = makeSnapshot('2026-01-01T10:00:00.000Z', [{ id: 'f1', path: '/p1' }]);
        const results = await checkModifications(snapshot, aem);
        expect(results[0].modified).to.equal(false);
    });

    it('returns modified: null when getById throws (fragment not found)', async () => {
        const notFoundErr = new Error('Not Found');
        notFoundErr.response = { status: 404 };
        const aem = {
            sites: {
                cf: {
                    fragments: {
                        getById: sinon.stub().rejects(notFoundErr),
                    },
                },
            },
        };
        const snapshot = makeSnapshot('2026-01-01T10:00:00.000Z', [{ id: 'missing-id', path: '/gone' }]);
        const results = await checkModifications(snapshot, aem);
        expect(results[0].modified).to.equal(null);
        expect(results[0].fragmentId).to.equal('missing-id');
        expect(results[0].deleted).to.equal(true);
    });

    it('returns deleted: false for non-404 errors', async () => {
        const serverErr = new Error('Internal Server Error');
        serverErr.response = { status: 500 };
        const aem = { sites: { cf: { fragments: { getById: sinon.stub().rejects(serverErr) } } } };
        const snapshot = makeSnapshot('2026-01-01T10:00:00.000Z', [{ id: 'err-id', path: '/err' }]);
        const results = await checkModifications(snapshot, aem);
        expect(results[0].modified).to.equal(null);
        expect(results[0].deleted).to.equal(false);
    });

    it('handles mixed results: found modified, found unmodified, not found', async () => {
        const snapshotTime = '2026-01-05T00:00:00.000Z';
        const getById = sinon.stub();
        getById
            .withArgs('f-modified')
            .resolves({ id: 'f-modified', path: '/modified', modified: { at: '2026-01-06T00:00:00.000Z' } });
        getById.withArgs('f-clean').resolves({ id: 'f-clean', path: '/clean', modified: { at: '2026-01-01T00:00:00.000Z' } });
        getById.withArgs('f-missing').rejects(new Error('404'));

        const aem = { sites: { cf: { fragments: { getById } } } };
        const snapshot = makeSnapshot(snapshotTime, [
            { id: 'f-modified', path: '/modified' },
            { id: 'f-clean', path: '/clean' },
            { id: 'f-missing', path: '/missing' },
        ]);

        const results = await checkModifications(snapshot, aem);
        const byPath = Object.fromEntries(results.map((r) => [r.path, r.modified]));
        const missingEntry = results.find((r) => r.fragmentId === 'f-missing');

        expect(byPath['/modified']).to.equal(true);
        expect(byPath['/clean']).to.equal(false);
        expect(missingEntry.modified).to.equal(null);
    });

    it('returns results sorted by path', async () => {
        const fragmentPaths = { f1: '/a-path', f2: '/m-path', f3: '/z-path' };
        const aem = {
            sites: {
                cf: {
                    fragments: {
                        getById: sinon.stub().callsFake(async (id) => ({
                            id,
                            path: fragmentPaths[id],
                            modified: { at: '2020-01-01T00:00:00.000Z' },
                        })),
                    },
                },
            },
        };
        const snapshot = makeSnapshot('2026-01-01T00:00:00.000Z', [
            { id: 'f3', path: '/z-path' },
            { id: 'f1', path: '/a-path' },
            { id: 'f2', path: '/m-path' },
        ]);
        const results = await checkModifications(snapshot, aem);
        expect(results.map((r) => r.path)).to.deep.equal(['/a-path', '/m-path', '/z-path']);
    });
});
