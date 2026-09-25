const crypto = require('node:crypto');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

const { expect } = chai;

function asyncIterFromKeys(keys) {
    return (async function* gen() {
        if (keys.length) yield { keys };
    })();
}

describe('Translation state helpers', () => {
    let mockState;
    let initStub;
    let stateHelpers;

    beforeEach(() => {
        mockState = {
            put: sinon.stub().resolves(),
            get: sinon.stub().resolves(null),
            delete: sinon.stub().resolves(),
            list: sinon.stub().returns(asyncIterFromKeys([])),
        };
        initStub = sinon.stub().resolves(mockState);

        stateHelpers = proxyquire('../../src/translation/state.js', {
            '@adobe/aio-lib-state': {
                init: initStub,
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should build stable state keys', () => {
        expect(stateHelpers.buildJobPayloadKey('job-123')).to.equal('translation-job.job-123.payload');
        expect(stateHelpers.buildProjectSummaryKey('project-456')).to.equal('translation-status.project.project-456.summary');
    });

    it('should store job payload with default ttl', async () => {
        const payload = {
            projectId: 'project-1',
            surface: 'acom',
        };

        await stateHelpers.putJobPayload('job-1', payload);

        expect(mockState.put).to.have.been.calledWith('translation-job.job-1.payload', JSON.stringify(payload), {
            ttl: stateHelpers.JOB_PAYLOAD_TTL,
        });
    });

    it('should use configured job payload ttl from action params when present', async () => {
        await stateHelpers.putJobPayload(
            'job-1',
            { projectId: 'project-1' },
            {
                params: {
                    translationJobPayloadTtl: '7200',
                },
            },
        );

        expect(mockState.put).to.have.been.calledWith(
            'translation-job.job-1.payload',
            JSON.stringify({ projectId: 'project-1' }),
            { ttl: 7200 },
        );
    });

    it('should fall back to default job payload ttl when action params are invalid', async () => {
        await stateHelpers.putJobPayload(
            'job-1',
            { projectId: 'project-1' },
            {
                params: {
                    translationJobPayloadTtl: 'invalid',
                },
            },
        );

        expect(mockState.put).to.have.been.calledWith(
            'translation-job.job-1.payload',
            JSON.stringify({ projectId: 'project-1' }),
            { ttl: stateHelpers.JOB_PAYLOAD_TTL },
        );
    });

    it('should read job payload from state', async () => {
        mockState.get.resolves({
            value: JSON.stringify({ projectId: 'project-1', requestedBy: 'user@example.com' }),
        });

        const result = await stateHelpers.getJobPayload('job-1');

        expect(mockState.get).to.have.been.calledWith('translation-job.job-1.payload');
        expect(result).to.deep.equal({ projectId: 'project-1', requestedBy: 'user@example.com' });
    });

    it('should return null when state value is missing', async () => {
        mockState.get.resolves(null);

        const result = await stateHelpers.getProjectSummary('project-1');

        expect(result).to.equal(null);
    });

    it('should delete job payload by key', async () => {
        await stateHelpers.deleteJobPayload('job-1');

        expect(mockState.delete).to.have.been.calledWith('translation-job.job-1.payload');
    });

    it('should store project summary with updatedAt when missing', async () => {
        const summary = {
            projectId: 'project-1',
            jobId: 'job-1',
            status: 'QUEUED',
            submissionDate: '2026-03-24T10:00:00Z',
            progress: {
                startedAt: null,
                completedAt: null,
                durationMs: null,
                itemCount: 0,
                batchSize: 10,
            },
            activationId: null,
            lastError: null,
        };

        await stateHelpers.putProjectSummary('project-1', summary);

        const [, serializedSummary, options] = mockState.put.firstCall.args;
        const parsedSummary = JSON.parse(serializedSummary);
        expect(mockState.put.firstCall.args[0]).to.equal('translation-status.project.project-1.summary');
        expect(options).to.deep.equal({ ttl: stateHelpers.PROJECT_SUMMARY_TTL });
        expect(parsedSummary).to.deep.include({
            projectId: 'project-1',
            jobId: 'job-1',
            status: 'QUEUED',
            submissionDate: '2026-03-24T10:00:00Z',
            activationId: null,
            lastError: null,
        });
        expect(parsedSummary.progress).to.deep.equal(summary.progress);
        expect(parsedSummary.updatedAt).to.be.a('string');
    });

    it('should use configured project summary ttl from action params when present', async () => {
        await stateHelpers.putProjectSummary(
            'project-1',
            {
                projectId: 'project-1',
                status: 'QUEUED',
                progress: {},
            },
            {
                params: {
                    translationProjectSummaryTtl: '86400',
                },
            },
        );

        const [, , options] = mockState.put.firstCall.args;
        expect(options).to.deep.equal({ ttl: 86400 });
    });

    it('should patch project summary with nested merge behavior', async () => {
        mockState.get.resolves({
            value: JSON.stringify({
                projectId: 'project-1',
                jobId: 'job-1',
                activationId: 'activation-1',
                status: 'RUNNING',
                submissionDate: '2026-03-24T10:00:00Z',
                progress: {
                    startedAt: '2026-03-24T10:01:00Z',
                    completedAt: null,
                    durationMs: null,
                    itemCount: 0,
                    batchSize: 10,
                },
                updatedAt: '2026-03-24T10:01:00Z',
                lastError: null,
            }),
        });

        const result = await stateHelpers.patchProjectSummary('project-1', {
            status: 'ASYNC_PROCESSING',
            progress: {
                completedAt: '2026-03-24T10:05:00Z',
                durationMs: 240000,
                itemCount: 15,
            },
        });

        expect(result).to.deep.include({
            projectId: 'project-1',
            jobId: 'job-1',
            activationId: 'activation-1',
            status: 'ASYNC_PROCESSING',
            submissionDate: '2026-03-24T10:00:00Z',
            lastError: null,
        });
        expect(result.progress).to.deep.equal({
            startedAt: '2026-03-24T10:01:00Z',
            completedAt: '2026-03-24T10:05:00Z',
            durationMs: 240000,
            itemCount: 15,
            batchSize: 10,
        });

        const [, serializedSummary] = mockState.put.firstCall.args;
        const storedSummary = JSON.parse(serializedSummary);
        expect(storedSummary.status).to.equal('ASYNC_PROCESSING');
        expect(storedSummary.progress).to.deep.equal(result.progress);
        expect(storedSummary.updatedAt).to.be.a('string');
        expect(storedSummary.updatedAt).to.not.equal('2026-03-24T10:01:00Z');
    });

    it('should allow callers to override ttl and updatedAt', async () => {
        await stateHelpers.patchProjectSummary(
            'project-1',
            {
                status: 'FAILED',
            },
            {
                ttl: 123,
                updatedAt: '2026-03-24T10:10:00Z',
            },
        );

        const [, serializedSummary, options] = mockState.put.firstCall.args;
        expect(options).to.deep.equal({ ttl: 123 });
        expect(JSON.parse(serializedSummary).updatedAt).to.equal('2026-03-24T10:10:00Z');
    });

    describe('task-name index', () => {
        const TITLE = 'my-project_v1.0';
        const PROJECT_ID = 'project-A';
        const expectedHash = () => crypto.createHash('sha1').update(TITLE).digest('hex').slice(0, 8);

        it('builds a stable, human-readable task index key', () => {
            const key = stateHelpers.buildTaskIndexKey(TITLE, PROJECT_ID);
            expect(key).to.equal(`translation-status.task.my-project_v1-0-${expectedHash()}.${PROJECT_ID}.index`);
        });

        it('produces a deterministic key for the same inputs', () => {
            expect(stateHelpers.buildTaskIndexKey(TITLE, PROJECT_ID)).to.equal(
                stateHelpers.buildTaskIndexKey(TITLE, PROJECT_ID),
            );
        });

        it('produces different keys for different projectIds on the same title', () => {
            expect(stateHelpers.buildTaskIndexKey(TITLE, 'A')).to.not.equal(stateHelpers.buildTaskIndexKey(TITLE, 'B'));
        });

        it('disambiguates two titles that look alike after sanitization via the hash segment', () => {
            // The readable segment strips dots but the hash uses the full original title;
            // two titles that produce the same readable but differ in dot placement still get unique keys.
            const a = stateHelpers.buildTaskIndexKey('foo.bar', PROJECT_ID);
            const b = stateHelpers.buildTaskIndexKey('foo-bar', PROJECT_ID);
            expect(a).to.not.equal(b);
        });

        it('builds a projectId-less prefix for fan-out lookup by title', () => {
            const prefix = stateHelpers.buildTaskIndexKeyPrefix(TITLE);
            expect(prefix).to.equal(`translation-status.task.my-project_v1-0-${expectedHash()}.`);
            expect(stateHelpers.buildTaskIndexKey(TITLE, PROJECT_ID).startsWith(prefix)).to.equal(true);
        });

        it('stores a task index entry with the project summary TTL', async () => {
            await stateHelpers.putTaskIndex(TITLE, PROJECT_ID, {
                projectId: PROJECT_ID,
                title: TITLE,
                submittedAt: '2026-06-16T10:00:00Z',
            });

            const [storedKey, serialized, options] = mockState.put.firstCall.args;
            expect(storedKey).to.equal(stateHelpers.buildTaskIndexKey(TITLE, PROJECT_ID));
            expect(JSON.parse(serialized)).to.deep.equal({
                projectId: PROJECT_ID,
                title: TITLE,
                submittedAt: '2026-06-16T10:00:00Z',
            });
            expect(options).to.deep.equal({ ttl: stateHelpers.PROJECT_SUMMARY_TTL });
        });

        it('honours configured project summary ttl when storing a task index entry', async () => {
            await stateHelpers.putTaskIndex(
                TITLE,
                PROJECT_ID,
                { projectId: PROJECT_ID, title: TITLE, submittedAt: '2026-06-16T10:00:00Z' },
                { params: { translationProjectSummaryTtl: '86400' } },
            );
            expect(mockState.put.firstCall.args[2]).to.deep.equal({ ttl: 86400 });
        });

        it('reads a task index entry by (title, projectId)', async () => {
            const payload = { projectId: PROJECT_ID, title: TITLE, submittedAt: '2026-06-16T10:00:00Z' };
            mockState.get.resolves({ value: JSON.stringify(payload) });

            const result = await stateHelpers.getTaskIndex(TITLE, PROJECT_ID);

            expect(mockState.get).to.have.been.calledWith(stateHelpers.buildTaskIndexKey(TITLE, PROJECT_ID));
            expect(result).to.deep.equal(payload);
        });

        it('deletes a task index entry by (title, projectId)', async () => {
            await stateHelpers.deleteTaskIndex(TITLE, PROJECT_ID);
            expect(mockState.delete).to.have.been.calledWith(stateHelpers.buildTaskIndexKey(TITLE, PROJECT_ID));
        });

        it('lists all task index entries with the same title', async () => {
            const prefix = stateHelpers.buildTaskIndexKeyPrefix(TITLE);
            const keyA = stateHelpers.buildTaskIndexKey(TITLE, 'project-A');
            const keyB = stateHelpers.buildTaskIndexKey(TITLE, 'project-B');
            const payloadA = { projectId: 'project-A', title: TITLE, submittedAt: '2026-06-16T10:00:00Z' };
            const payloadB = { projectId: 'project-B', title: TITLE, submittedAt: '2026-06-16T11:00:00Z' };

            mockState.list.callsFake(({ match }) => {
                expect(match).to.equal(`${prefix}*`);
                return asyncIterFromKeys([keyA, keyB]);
            });
            mockState.get.withArgs(keyA).resolves({ value: JSON.stringify(payloadA) });
            mockState.get.withArgs(keyB).resolves({ value: JSON.stringify(payloadB) });

            const result = await stateHelpers.listTaskIndexEntries(TITLE);

            expect(result).to.have.deep.members([payloadA, payloadB]);
        });

        it('rejects listed entries whose stored title does not match (defends against hash collision)', async () => {
            const prefix = stateHelpers.buildTaskIndexKeyPrefix(TITLE);
            const keyA = stateHelpers.buildTaskIndexKey(TITLE, 'project-A');
            mockState.list.callsFake(({ match }) => {
                expect(match).to.equal(`${prefix}*`);
                return asyncIterFromKeys([keyA]);
            });
            mockState.get.withArgs(keyA).resolves({
                value: JSON.stringify({
                    projectId: 'project-A',
                    title: 'a-different-title',
                    submittedAt: '2026-06-16T10:00:00Z',
                }),
            });

            const result = await stateHelpers.listTaskIndexEntries(TITLE);
            expect(result).to.deep.equal([]);
        });

        it('returns an empty array when no task index entries match', async () => {
            mockState.list.returns(asyncIterFromKeys([]));
            const result = await stateHelpers.listTaskIndexEntries(TITLE);
            expect(result).to.deep.equal([]);
        });
    });

    describe('parseGlaasTaskName', () => {
        it('extracts title and timestamp from <title>.<yyyyMMddHHmmss>', () => {
            const parsed = stateHelpers.parseGlaasTaskName('my-project.20260420201713');
            expect(parsed.title).to.equal('my-project');
            expect(parsed.timestamp).to.equal('20260420201713');
            expect(parsed.odinEpoch).to.equal(Date.UTC(2026, 3, 20, 20, 17, 13));
        });

        it('handles titles that contain dots (greedy match anchors on the final .14-digit suffix)', () => {
            const parsed = stateHelpers.parseGlaasTaskName('v1.0.my-fragment.20260420201713');
            expect(parsed.title).to.equal('v1.0.my-fragment');
            expect(parsed.timestamp).to.equal('20260420201713');
        });

        it('handles titles that look like timestamps as long as a real 14-digit suffix follows', () => {
            const parsed = stateHelpers.parseGlaasTaskName('20260101120000.20260420201713');
            expect(parsed.title).to.equal('20260101120000');
            expect(parsed.timestamp).to.equal('20260420201713');
        });

        it('returns null when no .<14-digit> suffix is present', () => {
            expect(stateHelpers.parseGlaasTaskName('not-a-glaas-name')).to.equal(null);
            expect(stateHelpers.parseGlaasTaskName('my-project.123')).to.equal(null);
            expect(stateHelpers.parseGlaasTaskName('')).to.equal(null);
        });

        it('returns null for non-string input', () => {
            expect(stateHelpers.parseGlaasTaskName(null)).to.equal(null);
            expect(stateHelpers.parseGlaasTaskName(undefined)).to.equal(null);
            expect(stateHelpers.parseGlaasTaskName(12345)).to.equal(null);
        });
    });

    describe('findProjectIdByGlaasTaskName', () => {
        const TITLE = 'my-project';
        const prefix = () => stateHelpers.buildTaskIndexKeyPrefix(TITLE);

        function seedCandidates(entries) {
            const keys = entries.map((e) => stateHelpers.buildTaskIndexKey(TITLE, e.projectId));
            mockState.list.callsFake(({ match }) => {
                expect(match).to.equal(`${prefix()}*`);
                return asyncIterFromKeys(keys);
            });
            entries.forEach((e, i) => {
                mockState.get.withArgs(keys[i]).resolves({ value: JSON.stringify(e) });
            });
        }

        it('returns null for an unparseable glaasTaskName', async () => {
            const result = await stateHelpers.findProjectIdByGlaasTaskName('garbage');
            expect(result).to.equal(null);
        });

        it('returns null when no task index entries exist for the title', async () => {
            mockState.list.returns(asyncIterFromKeys([]));
            const result = await stateHelpers.findProjectIdByGlaasTaskName('my-project.20260420201713');
            expect(result).to.equal(null);
        });

        it('returns the single matching projectId when only one candidate exists', async () => {
            seedCandidates([{ projectId: 'project-A', title: TITLE, submittedAt: '2026-04-20T20:17:10Z' }]);
            const result = await stateHelpers.findProjectIdByGlaasTaskName('my-project.20260420201713');
            expect(result).to.equal('project-A');
        });

        it('returns null when multiple candidates share the same title (ambiguous — caller cannot disambiguate)', async () => {
            // Title uniqueness is a separate concern (tracked in its own ticket); when it's
            // violated the routing layer must refuse to guess rather than silently update the
            // wrong project.
            seedCandidates([
                { projectId: 'project-A', title: TITLE, submittedAt: '2026-04-20T19:00:00Z' },
                { projectId: 'project-B', title: TITLE, submittedAt: '2026-04-20T20:17:05Z' },
            ]);
            const result = await stateHelpers.findProjectIdByGlaasTaskName('my-project.20260420201713');
            expect(result).to.equal(null);
        });
    });

    describe('recordFragmentLocaleStatus', () => {
        const PROJECT_ID = 'project-1';
        const SUMMARY_KEY = 'translation-status.project.project-1.summary';

        function seedSummary({
            targetLocales = ['fr_FR', 'de_DE'],
            fragments = ['/content/dam/mas/acom/en_US/a', '/content/dam/mas/acom/en_US/b'],
            status = 'ASYNC_PROCESSING',
        } = {}) {
            const progress = {};
            for (const locale of targetLocales) {
                progress[locale] = {
                    status: 'PENDING',
                    completedAt: null,
                    fragments: Object.fromEntries(fragments.map((path) => [path, { status: 'PENDING', updatedAt: null }])),
                    completed: 0,
                    total: fragments.length,
                };
            }
            const summary = {
                projectId: PROJECT_ID,
                status,
                locales: { targetLocales, progress, completed: 0, total: targetLocales.length },
            };
            mockState.get.withArgs(SUMMARY_KEY).resolves({ value: JSON.stringify(summary) });
            return summary;
        }

        function lastWrittenSummary() {
            const summaryCalls = mockState.put.getCalls().filter((call) => call.args[0] === SUMMARY_KEY);
            return JSON.parse(summaryCalls[summaryCalls.length - 1].args[1]);
        }

        it('flips project to IN_PROGRESS on the first event and reports projectStarted', async () => {
            seedSummary();

            const { summary, transitions } = await stateHelpers.recordFragmentLocaleStatus(
                PROJECT_ID,
                '/content/dam/mas/acom/en_US/a',
                'fr_FR',
                'COMPLETED',
            );

            expect(transitions).to.deep.equal({
                projectStarted: true,
                localeCompleted: null,
                projectCompleted: false,
            });
            expect(summary.status).to.equal('IN_PROGRESS');
            expect(summary.locales.progress.fr_FR.status).to.equal('IN_PROGRESS');
            expect(summary.locales.progress.fr_FR.completed).to.equal(1);
            expect(summary.locales.completed).to.equal(0);
            expect(lastWrittenSummary().status).to.equal('IN_PROGRESS');
        });

        it('reports localeCompleted when all fragments in a locale reach COMPLETED', async () => {
            const initial = seedSummary();
            // simulate first fragment already completed (read-after-update sequence)
            initial.locales.progress.fr_FR.fragments['/content/dam/mas/acom/en_US/a'] = {
                status: 'COMPLETED',
                updatedAt: '2026-04-01T00:00:00Z',
            };
            initial.locales.progress.fr_FR.completed = 1;
            initial.locales.progress.fr_FR.status = 'IN_PROGRESS';
            initial.status = 'IN_PROGRESS';
            mockState.get.withArgs(SUMMARY_KEY).resolves({ value: JSON.stringify(initial) });

            const { summary, transitions } = await stateHelpers.recordFragmentLocaleStatus(
                PROJECT_ID,
                '/content/dam/mas/acom/en_US/b',
                'fr_FR',
                'COMPLETED',
            );

            expect(transitions.localeCompleted).to.equal('fr_FR');
            expect(transitions.projectCompleted).to.equal(false);
            expect(transitions.projectStarted).to.equal(false);
            expect(summary.locales.progress.fr_FR.status).to.equal('COMPLETED');
            expect(summary.locales.progress.fr_FR.completedAt).to.be.a('string');
            expect(summary.locales.completed).to.equal(1);
            expect(summary.status).to.equal('IN_PROGRESS');
        });

        it('reports projectCompleted when the last locale completes', async () => {
            const initial = seedSummary({ targetLocales: ['fr_FR'], fragments: ['/content/dam/mas/acom/en_US/a'] });
            initial.status = 'IN_PROGRESS';
            mockState.get.withArgs(SUMMARY_KEY).resolves({ value: JSON.stringify(initial) });

            const { summary, transitions } = await stateHelpers.recordFragmentLocaleStatus(
                PROJECT_ID,
                '/content/dam/mas/acom/en_US/a',
                'fr_FR',
                'COMPLETED',
            );

            expect(transitions.projectStarted).to.equal(false);
            expect(transitions.localeCompleted).to.equal('fr_FR');
            expect(transitions.projectCompleted).to.equal(true);
            expect(summary.status).to.equal('COMPLETED');
        });

        it('is idempotent on duplicate COMPLETED events for the same fragment+locale', async () => {
            const initial = seedSummary();
            initial.locales.progress.fr_FR.fragments['/content/dam/mas/acom/en_US/a'] = {
                status: 'COMPLETED',
                updatedAt: '2026-04-01T00:00:00Z',
            };
            initial.locales.progress.fr_FR.completed = 1;
            initial.locales.progress.fr_FR.status = 'IN_PROGRESS';
            initial.status = 'IN_PROGRESS';
            mockState.get.withArgs(SUMMARY_KEY).resolves({ value: JSON.stringify(initial) });

            const { summary, transitions } = await stateHelpers.recordFragmentLocaleStatus(
                PROJECT_ID,
                '/content/dam/mas/acom/en_US/a',
                'fr_FR',
                'COMPLETED',
            );

            expect(summary.locales.progress.fr_FR.completed).to.equal(1);
            expect(transitions).to.deep.equal({
                projectStarted: false,
                localeCompleted: null,
                projectCompleted: false,
            });
        });

        it('drops a backwards transition (IN_PROGRESS arriving for an already-COMPLETED fragment)', async () => {
            const initial = seedSummary();
            initial.locales.progress.fr_FR.fragments['/content/dam/mas/acom/en_US/a'] = {
                status: 'COMPLETED',
                updatedAt: '2026-04-01T00:00:00Z',
            };
            initial.locales.progress.fr_FR.fragments['/content/dam/mas/acom/en_US/b'] = {
                status: 'COMPLETED',
                updatedAt: '2026-04-01T00:00:00Z',
            };
            initial.locales.progress.fr_FR.completed = 2;
            initial.locales.progress.fr_FR.status = 'COMPLETED';
            initial.locales.completed = 1;
            initial.status = 'IN_PROGRESS';
            mockState.get.withArgs(SUMMARY_KEY).resolves({ value: JSON.stringify(initial) });

            const { summary, transitions } = await stateHelpers.recordFragmentLocaleStatus(
                PROJECT_ID,
                '/content/dam/mas/acom/en_US/a',
                'fr_FR',
                'IN_PROGRESS',
            );

            expect(summary.locales.progress.fr_FR.fragments['/content/dam/mas/acom/en_US/a'].status).to.equal('COMPLETED');
            expect(summary.locales.progress.fr_FR.status).to.equal('COMPLETED');
            expect(summary.locales.completed).to.equal(1);
            expect(transitions).to.deep.equal({
                projectStarted: false,
                localeCompleted: null,
                projectCompleted: false,
            });
            expect(mockState.put).to.not.have.been.called;
        });

        it('flips a fragment to IN_PROGRESS without completing the locale on non-terminal status', async () => {
            seedSummary();

            const { summary, transitions } = await stateHelpers.recordFragmentLocaleStatus(
                PROJECT_ID,
                '/content/dam/mas/acom/en_US/a',
                'fr_FR',
                'IN_PROGRESS',
            );

            expect(summary.locales.progress.fr_FR.fragments['/content/dam/mas/acom/en_US/a'].status).to.equal('IN_PROGRESS');
            expect(summary.locales.progress.fr_FR.completed).to.equal(0);
            expect(summary.locales.progress.fr_FR.status).to.equal('IN_PROGRESS');
            expect(transitions.projectStarted).to.equal(true);
            expect(transitions.localeCompleted).to.equal(null);
        });

        it('is a no-op when the project summary is missing', async () => {
            mockState.get.withArgs(SUMMARY_KEY).resolves(null);

            const result = await stateHelpers.recordFragmentLocaleStatus(
                PROJECT_ID,
                '/content/dam/mas/acom/en_US/a',
                'fr_FR',
                'COMPLETED',
            );

            expect(result.summary).to.equal(null);
            expect(result.transitions).to.deep.equal({
                projectStarted: false,
                localeCompleted: null,
                projectCompleted: false,
            });
            expect(mockState.put).to.not.have.been.called;
        });

        it('tolerates an unknown locale/fragment by ignoring the event', async () => {
            seedSummary();

            const { summary, transitions } = await stateHelpers.recordFragmentLocaleStatus(
                PROJECT_ID,
                '/content/dam/mas/acom/en_US/not-in-project',
                'fr_FR',
                'COMPLETED',
            );

            expect(transitions).to.deep.equal({
                projectStarted: false,
                localeCompleted: null,
                projectCompleted: false,
            });
            expect(summary.locales.progress.fr_FR.completed).to.equal(0);
        });
    });
});
