import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { BULK_PUBLISH_STATUS } from '../../src/constants.js';
import { startPublishing, startReverting } from '../../src/bulk-publish/bulk-publish-store.js';

function makeAem({ searchPages = [], versionId = 'v1', restoreRejects = false, getWithEtag = null } = {}) {
    return {
        sites: {
            cf: {
                fragments: {
                    search: sinon.stub().callsFake(async function* () {
                        yield searchPages;
                    }),
                    getById: sinon.stub().resolves({ id: 'frag-id', path: '/p', status: 'Draft' }),
                    createVersion: sinon.stub().resolves(versionId),
                    restoreVersion: restoreRejects
                        ? sinon.stub().rejects(new Error('restore failed'))
                        : sinon.stub().resolves(),
                    getWithEtag: sinon.stub().resolves(getWithEtag ?? { id: 'frag-id', path: '/p' }),
                },
            },
        },
    };
}

describe('startPublishing', () => {
    let repo;
    let clientStub;

    beforeEach(() => {
        Store.bulkPublishProjects.publishing.set({});
        repo = {
            saveFragment: sinon.stub().resolves(),
            aem: makeAem({ searchPages: [{ id: 'frag-id', path: '/p' }], versionId: 'v1' }),
        };
    });

    it('sets status to Publishing, saves, then Published on resolve', async () => {
        const project = {
            id: 'p1',
            getFieldValue: sinon.stub(),
            setFieldValue: sinon.stub(),
        };
        const response = {
            summary: { total: 1, published: 1, skipped: 0, failed: 0 },
            details: [],
        };
        clientStub = sinon.stub().resolves(response);

        await startPublishing({
            project,
            paths: ['/p'],
            locales: [],
            token: 't',
            ioBaseUrl: 'x',
            publishFn: clientStub,
            repository: repo,
        });

        const statusCalls = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statusCalls).to.deep.equal([BULK_PUBLISH_STATUS.PUBLISHING, BULK_PUBLISH_STATUS.PUBLISHED]);
        expect(repo.saveFragment.callCount).to.equal(2);
    });

    it('reverts status to Draft and stores lastError on reject', async () => {
        const project = {
            id: 'p2',
            getFieldValue: sinon.stub(),
            setFieldValue: sinon.stub(),
        };
        clientStub = sinon.stub().rejects(new Error('boom'));

        await startPublishing({
            project,
            paths: ['/p'],
            locales: [],
            token: 't',
            ioBaseUrl: 'x',
            publishFn: clientStub,
            repository: repo,
        }).catch(() => {});

        const statusCalls = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statusCalls[statusCalls.length - 1]).to.equal(BULK_PUBLISH_STATUS.DRAFT);
        const errorCalls = project.setFieldValue.getCalls().filter((c) => c.args[0] === 'lastError');
        const errorCall = errorCalls[errorCalls.length - 1];
        expect(errorCall.args[1]).to.equal('boom');
    });

    describe('snapshot integration', () => {
        it('calls createSnapshot before publishFn', async () => {
            const project = {
                id: 'p-snap',
                getFieldValue: sinon.stub(),
                setFieldValue: sinon.stub(),
            };
            clientStub = sinon.stub().resolves({ summary: { total: 1, published: 1, skipped: 0, failed: 0 }, details: [] });

            await startPublishing({
                project,
                items: [{ fragmentId: 'frag-id', path: '/p', status: 'valid' }],
                paths: ['/p'],
                locales: [],
                token: 't',
                ioBaseUrl: 'x',
                publishFn: clientStub,
                repository: repo,
            });

            expect(repo.aem.sites.cf.fragments.createVersion.calledOnce).to.equal(true);
            expect(clientStub.calledOnce).to.equal(true);
            sinon.assert.callOrder(repo.aem.sites.cf.fragments.createVersion, clientStub);
        });

        it('aborts publish (does NOT call publishFn) if createSnapshot throws', async () => {
            repo.aem = makeAem({ searchPages: [], versionId: null });
            repo.aem.sites.cf.fragments.search = sinon.stub().callsFake(async function* () {
                yield [{ id: 'frag-id', path: '/p' }];
            });
            repo.aem.sites.cf.fragments.createVersion = sinon.stub().resolves(null);

            const project = {
                id: 'p-abort',
                getFieldValue: sinon.stub(),
                setFieldValue: sinon.stub(),
            };
            clientStub = sinon.stub().resolves({});

            await startPublishing({
                project,
                items: [{ fragmentId: 'frag-id', path: '/p', status: 'valid' }],
                paths: ['/p'],
                locales: [],
                token: 't',
                ioBaseUrl: 'x',
                publishFn: clientStub,
                repository: repo,
            });

            expect(clientStub.called).to.equal(false);
        });

        it('stores snapshot in project.snapshot field on success', async () => {
            const project = {
                id: 'p-store-snap',
                getFieldValue: sinon.stub(),
                setFieldValue: sinon.stub(),
            };
            clientStub = sinon.stub().resolves({ summary: { total: 1, published: 1, skipped: 0, failed: 0 }, details: [] });

            await startPublishing({
                project,
                paths: ['/p'],
                locales: [],
                token: 't',
                ioBaseUrl: 'x',
                publishFn: clientStub,
                repository: repo,
            });

            const snapshotCalls = project.setFieldValue.getCalls().filter((c) => c.args[0] === 'snapshot');
            expect(snapshotCalls.length).to.be.greaterThan(0);
            const snapshotValue = snapshotCalls[0].args[1];
            const parsed = JSON.parse(snapshotValue);
            expect(parsed.source).to.equal('pre-publish');
        });

        it('status sequence: PUBLISHING → PUBLISHED after successful publish+snapshot', async () => {
            const project = {
                id: 'p-seq',
                getFieldValue: sinon.stub(),
                setFieldValue: sinon.stub(),
            };
            clientStub = sinon.stub().resolves({ summary: { total: 1, published: 1, skipped: 0, failed: 0 }, details: [] });

            await startPublishing({
                project,
                paths: ['/p'],
                locales: [],
                token: 't',
                ioBaseUrl: 'x',
                publishFn: clientStub,
                repository: repo,
            });

            const statusCalls = project.setFieldValue
                .getCalls()
                .filter((c) => c.args[0] === 'status')
                .map((c) => c.args[1]);
            expect(statusCalls[0]).to.equal(BULK_PUBLISH_STATUS.PUBLISHING);
            expect(statusCalls[statusCalls.length - 1]).to.equal(BULK_PUBLISH_STATUS.PUBLISHED);
        });
    });
});

describe('startReverting()', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.bulkPublishProjects.list.data.set([]);
    });

    afterEach(() => {
        sandbox.restore();
    });

    function makeProject(overrides = {}) {
        const snapshot = {
            createdAt: new Date().toISOString(),
            source: 'pre-publish',
            fragments: {
                'frag-rev': { path: '/rev', versionId: 'v-rev', wasPublished: true },
            },
        };
        const fields = {
            snapshot: JSON.stringify(snapshot),
            status: BULK_PUBLISH_STATUS.PUBLISHED,
            ...overrides,
        };
        return {
            id: 'proj-rev',
            getFieldValue: (k) => fields[k],
            setFieldValue: sinon.stub().callsFake((k, v) => {
                fields[k] = v;
            }),
        };
    }

    function makeRepo(aemOverrides = {}) {
        const aem = makeAem(aemOverrides);
        return {
            saveFragment: sinon.stub().resolves(),
            aem,
        };
    }

    it('sets status to REVERTING, saves, calls revertSnapshot, sets REVERTED on success', async () => {
        const project = makeProject();
        const repo = makeRepo({ searchPages: [{ id: 'frag-rev', path: '/rev' }] });

        await startReverting({ project, repository: repo });

        const statusValues = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statusValues[0]).to.equal(BULK_PUBLISH_STATUS.REVERTING);
        expect(statusValues[statusValues.length - 1]).to.equal(BULK_PUBLISH_STATUS.REVERTED);
        expect(repo.saveFragment.callCount).to.be.greaterThan(0);
        expect(repo.aem.sites.cf.fragments.restoreVersion.calledOnce).to.equal(true);
    });

    it('keeps status PUBLISHED and sets lastError if revertSnapshot throws', async () => {
        const project = makeProject();
        const repo = makeRepo({ restoreRejects: true });

        await startReverting({ project, repository: repo });

        const statusValues = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statusValues[statusValues.length - 1]).to.equal(BULK_PUBLISH_STATUS.PUBLISHED);
        const errorCalls = project.setFieldValue.getCalls().filter((c) => c.args[0] === 'lastError');
        expect(errorCalls.length).to.be.greaterThan(0);
    });

    it('does not clear snapshot field after successful revert', async () => {
        const project = makeProject();
        const repo = makeRepo({ searchPages: [{ id: 'frag-rev', path: '/rev' }] });

        await startReverting({ project, repository: repo });

        // Snapshot is intentionally preserved after revert (sending null to AEM's JSON
        // field causes a 500; the snapshot is harmless and the revert button is disabled
        // after status changes to Reverted).
        const snapshotCalls = project.setFieldValue.getCalls().filter((c) => c.args[0] === 'snapshot');
        expect(snapshotCalls.length).to.equal(0);
    });
});
