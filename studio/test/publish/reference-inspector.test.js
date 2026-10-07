import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { waitUntil } from '@open-wc/testing-helpers/pure';
import { inspectReferences, removeMissingReferences } from '../../src/publish/reference-inspector.js';

const ROOT_PATH = '/content/dam/mas/sandbox/en_US/collection';
const FIRST_PATH = '/content/dam/mas/sandbox/en_US/missing-first';
const SECOND_PATH = '/content/dam/mas/sandbox/en_US/missing-second';

const makeFragment = (id, path, values = [], validationStatus = []) => ({
    id,
    path,
    title: id,
    fields: [{ name: 'cards', type: 'content-fragment', values }],
    validationStatus,
});

describe('publish reference inspector', () => {
    const removalFixture = (values = [FIRST_PATH, SECOND_PATH], positions = [0]) => {
        const owner = makeFragment(
            'root',
            ROOT_PATH,
            values,
            positions.map((index) => ({
                property: `fields.cards.values[${index}].<list element>`,
                message: 'references a path that does not exist in JCR',
            })),
        );
        owner.etag = 'current-etag';
        owner.fields[0].multiple = true;
        const fragments = {
            getById: sinon.stub().resolves(owner),
            getWithEtag: sinon.stub().resolves(owner),
            getByPath: sinon.stub().callsFake(async (path) => {
                if (path === FIRST_PATH) throw new Error('Fragment not found');
                return makeFragment('valid', path);
            }),
            save: sinon.stub().callsFake(async (fragment) => ({ ...fragment, etag: 'saved-etag' })),
        };
        return { owner, fragments, aem: { sites: { cf: { fragments } } } };
    };

    it('marks only confirmed empty lookups in multi-value fields as removable', async () => {
        const { aem, fragments } = removalFixture();
        const report = await inspectReferences(aem, [{ id: 'root', path: ROOT_PATH }]);
        expect(report.issues[0].removable).to.be.true;

        fragments.getByPath.rejects(new Error('403 Forbidden'));
        const blocked = await inspectReferences(aem, [{ id: 'root', path: ROOT_PATH }]);
        expect(blocked.issues.every((issue) => !issue.removable)).to.be.true;
    });

    it('removes only the selected occurrence and saves once with the inspected ETag', async () => {
        const { aem, fragments } = removalFixture([FIRST_PATH, SECOND_PATH, FIRST_PATH]);
        const report = await inspectReferences(aem, [{ id: 'root', path: ROOT_PATH }]);

        const result = await removeMissingReferences(aem, report.issues);

        expect(result.removedCount).to.equal(1);
        expect(result.failures).to.have.length(0);
        expect(fragments.save.callCount).to.equal(1);
        expect(fragments.save.firstCall.args[0].fields[0].values).to.deep.equal([SECOND_PATH, FIRST_PATH]);
        expect(fragments.save.firstCall.args[0].etag).to.equal('current-etag');
        expect(fragments.save.firstCall.args[1]).to.deep.equal({ refetchEtag: false });
    });

    it('does not remove a reference when its target has reappeared', async () => {
        const { aem, fragments } = removalFixture();
        const report = await inspectReferences(aem, [{ id: 'root', path: ROOT_PATH }]);
        fragments.getByPath.resolves(makeFragment('restored', FIRST_PATH));

        const result = await removeMissingReferences(aem, report.issues);

        expect(result.removedCount).to.equal(0);
        expect(result.failures).to.have.length(1);
        expect(fragments.save.called).to.be.false;
    });

    it('rejects changed field positions rather than removing a different occurrence', async () => {
        const { aem, owner, fragments } = removalFixture();
        const report = await inspectReferences(aem, [{ id: 'root', path: ROOT_PATH }]);
        fragments.getWithEtag.resolves({ ...owner, fields: [{ ...owner.fields[0], values: [SECOND_PATH, FIRST_PATH] }] });

        const result = await removeMissingReferences(aem, report.issues);

        expect(result.removedCount).to.equal(0);
        expect(result.failures[0].detail).to.include('changed');
        expect(fragments.save.called).to.be.false;
    });

    it('does not empty a reference field', async () => {
        const { aem, fragments } = removalFixture([FIRST_PATH, FIRST_PATH], [0, 1]);
        const report = await inspectReferences(aem, [{ id: 'root', path: ROOT_PATH }]);

        const result = await removeMissingReferences(aem, report.issues);

        expect(result.removedCount).to.equal(0);
        expect(fragments.save.called).to.be.false;
        expect(result.failures[0].detail).to.include('empty');
    });

    it('blocks removal when the editor has unsaved changes', async () => {
        const { aem, fragments } = removalFixture();
        const report = await inspectReferences(aem, [{ id: 'root', path: ROOT_PATH }]);

        const result = await removeMissingReferences(aem, report.issues, { hasUnsavedChanges: () => true });

        expect(result.removedCount).to.equal(0);
        expect(result.failures[0].detail).to.include('unsaved');
        expect(fragments.getWithEtag.called).to.be.false;
        expect(fragments.save.called).to.be.false;
    });

    it('reports an ETag save failure without claiming removal succeeded', async () => {
        const { aem, fragments } = removalFixture();
        const report = await inspectReferences(aem, [{ id: 'root', path: ROOT_PATH }]);
        fragments.save.rejects(new Error('412 Precondition Failed'));

        const result = await removeMissingReferences(aem, report.issues);

        expect(result.removedCount).to.equal(0);
        expect(result.failures[0].detail).to.include('412');
    });

    it('does not remove references when fresh owner validation no longer confirms missing', async () => {
        const { aem, owner, fragments } = removalFixture();
        const report = await inspectReferences(aem, [{ id: 'root', path: ROOT_PATH }]);
        fragments.getWithEtag.resolves({ ...owner, validationStatus: [] });

        const result = await removeMissingReferences(aem, report.issues);

        expect(result.removedCount).to.equal(0);
        expect(fragments.save.called).to.be.false;
    });

    it('does not treat a target permission failure as a confirmed deletion', async () => {
        const { aem, fragments } = removalFixture();
        const report = await inspectReferences(aem, [{ id: 'root', path: ROOT_PATH }]);
        fragments.getByPath.rejects(new Error('403 Forbidden'));

        const result = await removeMissingReferences(aem, report.issues);

        expect(result.removedCount).to.equal(0);
        expect(fragments.save.called).to.be.false;
        expect(result.failures[0].detail).to.include('403');
    });

    it('preserves partial successes while reporting a different owner save failure', async () => {
        const { aem, owner, fragments } = removalFixture();
        const report = await inspectReferences(aem, [{ id: 'root', path: ROOT_PATH }]);
        const other = { ...owner, id: 'other', path: `${ROOT_PATH}-other` };
        fragments.getWithEtag.withArgs('other').resolves(other);
        fragments.save.callsFake(async (updated) => {
            if (updated.id === 'root') throw new Error('412 Precondition Failed');
            return { ...updated, etag: 'saved-etag' };
        });

        const result = await removeMissingReferences(aem, [
            ...report.issues,
            { ...report.issues[0], ownerId: 'other', ownerPath: other.path },
        ]);

        expect(result.removedCount).to.equal(1);
        expect(result.savedFragments.map((fragment) => fragment.id)).to.deep.equal(['other']);
        expect(result.failures).to.have.length(1);
        expect(result.failures[0].ownerPath).to.equal(ROOT_PATH);
    });

    it('preserves the user-visible owner label alongside the fragment title and path', async () => {
        const root = makeFragment('root', ROOT_PATH, [FIRST_PATH]);
        root.fields.push({ name: 'label', type: 'text', values: ['All plans'] });
        const aem = {
            sites: {
                cf: {
                    fragments: {
                        getById: sinon.stub().resolves(root),
                        getByPath: sinon.stub().rejects(new Error('Not found')),
                    },
                },
            },
        };

        const report = await inspectReferences(aem, [root]);

        expect(report.issues[0].ownerLabel).to.equal('All plans');
        expect(report.issues[0].ownerTitle).to.equal('root');
        expect(report.issues[0].ownerPath).to.equal(ROOT_PATH);
        expect(report.issues[0].targetId).to.be.undefined;
    });

    it('preserves display metadata for a resolved target with an owner validation issue', async () => {
        const root = makeFragment(
            'root',
            ROOT_PATH,
            [FIRST_PATH],
            [
                {
                    property: 'fields.cards.values[0].<list element>',
                    message: 'references a path that does not exist in JCR',
                },
            ],
        );
        const target = makeFragment('target', FIRST_PATH);
        target.fields.push({ name: 'cardTitle', type: 'text', values: ['Creative Cloud'] });
        const aem = {
            sites: { cf: { fragments: { getById: sinon.stub().resolves(root), getByPath: sinon.stub().resolves(target) } } },
        };

        const report = await inspectReferences(aem, [root]);

        expect(report.issues[0].targetId).to.equal('target');
        expect(report.issues[0].targetTitle).to.equal('target');
        expect(report.issues[0].targetLabel).to.equal('Creative Cloud');
    });

    it('keeps at most four requests active across timed-out batches', async () => {
        const paths = Array.from({ length: 12 }, (_, index) => `${ROOT_PATH}/timeout-${index}`);
        const root = makeFragment('root', ROOT_PATH, paths);
        let active = 0;
        let maximum = 0;
        const getByPath = (path, { signal }) => {
            active += 1;
            maximum = Math.max(maximum, active);
            return new Promise((resolve, reject) => {
                signal.addEventListener(
                    'abort',
                    () => {
                        active -= 1;
                        reject(new DOMException('Aborted', 'AbortError'));
                    },
                    { once: true },
                );
            });
        };
        const aem = { sites: { cf: { fragments: { getById: sinon.stub().resolves(root), getByPath } } } };

        const report = await inspectReferences(aem, [root], { requestTimeoutMs: 10 });

        expect(maximum).to.equal(4);
        expect(active).to.equal(0);
        expect(report.issues.map((issue) => issue.targetPath)).to.deep.equal(paths);
        expect(report.complete).to.be.false;
    });

    it('reports every remaining target without starting GETs after the inspection deadline', async () => {
        const paths = Array.from({ length: 6 }, (_, index) => `${ROOT_PATH}/deadline-${index}`);
        const root = makeFragment('root', ROOT_PATH, paths);
        const getByPath = sinon.stub().callsFake(() => new Promise(() => {}));
        const aem = { sites: { cf: { fragments: { getById: sinon.stub().resolves(root), getByPath } } } };

        const report = await inspectReferences(aem, [root], { concurrency: 2, requestTimeoutMs: 1000, timeoutMs: 15 });

        expect(getByPath.callCount).to.equal(2);
        expect(report.issues.map((issue) => issue.targetPath)).to.deep.equal(paths);
        expect(report.complete).to.be.false;
        expect(report.coverageGaps).to.have.length(6);
    });

    it('aborts a timed-out target lookup before advancing the queue', async () => {
        const root = makeFragment('root', ROOT_PATH, [FIRST_PATH]);
        let signal;
        const getByPath = (path, options) => {
            signal = options.signal;
            return new Promise(() => {});
        };
        const aem = { sites: { cf: { fragments: { getById: sinon.stub().resolves(root), getByPath } } } };

        const report = await inspectReferences(aem, [root], { requestTimeoutMs: 10 });

        expect(signal).to.exist;
        expect(signal.aborted).to.be.true;
        expect(report.issues[0].detail).to.include('timed out');
    });

    it('aborts a timed-out root lookup', async () => {
        let controller;
        const getById = (id, abortController) => {
            controller = abortController;
            return new Promise(() => {});
        };
        const aem = { sites: { cf: { fragments: { getById } } } };

        const report = await inspectReferences(aem, [{ id: 'root', path: ROOT_PATH }], { requestTimeoutMs: 10 });

        expect(controller).to.exist;
        expect(controller.signal.aborted).to.be.true;
        expect(report.complete).to.be.false;
    });

    it('runs four target lookups concurrently without exceeding the default limit', async () => {
        const values = Array.from({ length: 12 }, (value, index) => `/content/dam/mas/sandbox/en_US/parallel-${index}`);
        const root = makeFragment('root', ROOT_PATH, values);
        let release;
        const gate = new Promise((resolve) => {
            release = resolve;
        });
        let active = 0;
        let maximum = 0;
        const getByPath = async (path) => {
            active += 1;
            maximum = Math.max(maximum, active);
            await gate;
            active -= 1;
            return makeFragment(path, path);
        };
        const aem = { sites: { cf: { fragments: { getById: sinon.stub().resolves(root), getByPath } } } };
        const inspection = inspectReferences(aem, [root]);
        try {
            await waitUntil(() => active === 4, 'Expected four concurrent lookups', { timeout: 200 });
        } finally {
            release();
            await inspection;
        }

        expect(maximum).to.equal(4);
        expect((await inspection).inspectedCount).to.equal(13);
    });

    it('returns identical ordered reports with concurrency one and four despite out-of-order failures', async () => {
        const nestedPath = '/content/dam/mas/sandbox/en_US/nested-missing';
        const root = makeFragment('root', ROOT_PATH, [FIRST_PATH, SECOND_PATH, FIRST_PATH]);
        const child = makeFragment(
            'child',
            SECOND_PATH,
            [ROOT_PATH, nestedPath],
            [{ property: 'fields.cards.values[1].<list element>', message: 'references a path that does not exist in JCR' }],
        );
        const getByPath = async (path) => {
            await new Promise((resolve) => setTimeout(resolve, path === FIRST_PATH ? 25 : 5));
            if (path === SECOND_PATH) return child;
            throw new Error(path === FIRST_PATH ? 'Failed to get fragment: 429 Too Many Requests' : 'Fragment not found');
        };
        const aem = { sites: { cf: { fragments: { getById: sinon.stub().resolves(root), getByPath } } } };

        const sequential = await inspectReferences(aem, [root], { concurrency: 1 });
        const parallel = await inspectReferences(aem, [root], { concurrency: 4 });

        expect(parallel).to.deep.equal(sequential);
        expect(parallel.issues.map((issue) => issue.targetPath)).to.deep.equal([FIRST_PATH, FIRST_PATH, nestedPath]);
    });

    it('preserves all three missing positions in a collection with 34 raw references', async () => {
        const values = Array.from({ length: 34 }, (value, index) => `/content/dam/mas/sandbox/en_US/card-${index}`);
        const missing = [7, 15, 32];
        const root = makeFragment(
            'root',
            ROOT_PATH,
            values,
            [15, 32, 7].map((index) => ({
                property: `fields.cards.values[${index}].<list element>`,
                message: 'references a path that does not exist in JCR',
            })),
        );
        const getByPath = sinon.stub().callsFake(async (path) => {
            const index = values.indexOf(path);
            if (missing.includes(index)) throw new Error('Fragment not found');
            return makeFragment(`card-${index}`, path);
        });
        const aem = { sites: { cf: { fragments: { getById: sinon.stub().resolves(root), getByPath } } } };

        const report = await inspectReferences(aem, [root]);

        expect(report.issues.map((issue) => issue.valueIndex)).to.deep.equal(missing);
        expect(report.inspectedCount).to.equal(32);
    });

    it('does not look up an arbitrary URL and reports its identifier as needing review', async () => {
        const root = makeFragment('root', ROOT_PATH, ['https://example.com/fragment']);
        const getByPath = sinon.stub();
        const aem = { sites: { cf: { fragments: { getById: sinon.stub().resolves(root), getByPath } } } };

        const report = await inspectReferences(aem, [root]);

        expect(getByPath.called).to.be.false;
        expect(report.issues[0].category).to.equal('needs-review');
        expect(report.complete).to.be.false;
    });

    it('reports a hanging lookup as needing review instead of waiting indefinitely', async () => {
        const root = makeFragment('root', ROOT_PATH, [FIRST_PATH]);
        const aem = {
            sites: { cf: { fragments: { getById: sinon.stub().resolves(root), getByPath: () => new Promise(() => {}) } } },
        };

        const report = await inspectReferences(aem, [root], { requestTimeoutMs: 10 });

        expect(report.complete).to.be.false;
        expect(report.issues[0].category).to.equal('needs-review');
        expect(report.issues[0].detail).to.include('timed out');
    });

    it('marks the uninspected branch when the fragment limit is reached', async () => {
        const root = makeFragment('root', ROOT_PATH, [FIRST_PATH]);
        const child = makeFragment('child', FIRST_PATH);
        const aem = {
            sites: { cf: { fragments: { getById: sinon.stub().resolves(root), getByPath: sinon.stub().resolves(child) } } },
        };

        const report = await inspectReferences(aem, [root], { maxFragments: 1 });

        expect(report.complete).to.be.false;
        expect(report.coverageGaps.map((gap) => gap.ownerPath)).to.include(FIRST_PATH);
    });

    it('continues into readable branches after a lookup failure', async () => {
        const root = makeFragment('root', ROOT_PATH, [FIRST_PATH, SECOND_PATH]);
        const child = makeFragment('child', SECOND_PATH, ['/content/dam/mas/sandbox/en_US/nested']);
        const getByPath = sinon.stub();
        getByPath.withArgs(FIRST_PATH).rejects(new Error('Failed to get fragment: 403 Forbidden'));
        getByPath.withArgs(SECOND_PATH).resolves(child);
        getByPath.withArgs('/content/dam/mas/sandbox/en_US/nested').rejects(new Error('Fragment not found'));
        const aem = { sites: { cf: { fragments: { getById: sinon.stub().resolves(root), getByPath } } } };

        const report = await inspectReferences(aem, [root]);

        expect(report.issues.map((issue) => issue.targetPath)).to.deep.equal([
            FIRST_PATH,
            '/content/dam/mas/sandbox/en_US/nested',
        ]);
        expect(report.issues.every((issue) => issue.category === 'needs-review')).to.be.true;
        expect(report.complete).to.be.false;
    });

    it('reuses shared target lookups while preserving each owner location and terminating cycles', async () => {
        const root = makeFragment('root', ROOT_PATH, [FIRST_PATH, FIRST_PATH, SECOND_PATH]);
        const child = makeFragment('child', SECOND_PATH, [ROOT_PATH, FIRST_PATH]);
        const getByPath = sinon.stub();
        getByPath.withArgs(FIRST_PATH).rejects(new Error('Fragment not found'));
        getByPath.withArgs(SECOND_PATH).resolves(child);
        const aem = { sites: { cf: { fragments: { getById: sinon.stub().resolves(root), getByPath } } } };

        const report = await inspectReferences(aem, [root]);

        expect(report.issues.map((issue) => issue.ownerId)).to.deep.equal(['root', 'root', 'child']);
        expect(getByPath.withArgs(FIRST_PATH).callCount).to.equal(1);
        expect(report.inspectedCount).to.equal(2);
    });

    it('reports every missing raw target even when hydrated references are empty', async () => {
        const root = makeFragment(
            'root',
            ROOT_PATH,
            [FIRST_PATH, SECOND_PATH],
            [
                { property: 'fields.cards.values[1].<list element>', message: 'references a path that does not exist in JCR' },
                { property: 'fields.cards.values[0].<list element>', message: 'references a path that does not exist in JCR' },
            ],
        );
        root.references = [];
        const getById = sinon.stub().resolves(root);
        const getByPath = sinon.stub().rejects(new Error('Fragment not found'));
        const aem = { sites: { cf: { fragments: { getById, getByPath } } } };

        const report = await inspectReferences(aem, [root]);

        expect(report.issues.map((issue) => issue.targetPath)).to.deep.equal([FIRST_PATH, SECOND_PATH]);
        expect(report.issues.map((issue) => issue.category)).to.deep.equal(['confirmed-problem', 'confirmed-problem']);
    });
});
