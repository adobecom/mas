const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const PROJECT = '11111111-1111-4111-8111-111111111111';
const VARIATION = '22222222-2222-4222-8222-222222222222';
const MODEL = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL3Byb21vdGlvbg';
const projectPath = '/content/dam/mas/promotions/test-project';
const variationPath = '/content/dam/mas/acom/en_US/promotions/verified-promotion/card';
const makeProject = () => ({
    id: PROJECT,
    path: projectPath,
    model: { id: MODEL },
    title: 'Project',
    description: '',
    tags: [{ id: 'mas:promotion/verified-promotion' }],
    fields: [{ name: 'fragments', type: 'content-fragment', multiple: true, values: [variationPath] }],
});
const makeVariation = () => ({
    id: VARIATION,
    path: variationPath,
    title: 'Card',
    description: '',
    tags: [],
    fields: [
        { name: 'headline', values: ['Old'] },
        { name: 'body', values: ['Unrelated'] },
    ],
});

describe('Promotion history', () => {
    let execute;
    let fetchStub;
    let state;
    let stored;
    let fragments;
    let versions;
    let workflows;
    let roles;
    let cachedMembers;
    let profile;
    let allowed;
    let originalFetch;
    let logger;
    let delay;
    const params = (extra = {}) => ({
        __ow_method: 'post',
        __ow_headers: { authorization: 'Bearer test-token' },
        odinEndpoint: 'https://author.example.com',
        projectId: PROJECT,
        requestId: 'request-one',
        ...extra,
    });
    const response = (body, status = 200, etag = '"one"', headers = {}) => ({
        ok: status >= 200 && status < 300,
        status,
        headers: { get: (name) => headers[name.toLowerCase()] ?? (name.toLowerCase() === 'etag' ? etag : null) },
        json: async () => structuredClone(body),
    });
    const call = (operation, extra) =>
        execute(
            operation,
            params({
                ...(operation === 'restore' ? { requestId: 'restore-request' } : {}),
                ...extra,
            }),
        );
    const prepareSave = (extra = {}) => call('record', { phase: 'prepare', action: 'save', ...extra });
    const completeSave = async (extra = {}) => {
        const { intentId } = await prepareSave(extra);
        fragments.get(extra.targetId ?? PROJECT).title = 'Saved';
        return call('record', { phase: 'complete', intentId, ...(extra.requestId ? { requestId: extra.requestId } : {}) });
    };
    const legacyBackup = async (ids = [PROJECT, VARIATION]) => {
        const event = {
            id: '44444444-4444-4444-8444-444444444444',
            requestId: 'request-one',
            action: 'backup',
            isBackup: true,
            createdAt: new Date().toISOString(),
            user: { ...profile },
            projectId: PROJECT,
            projectPath,
            changes: [],
            snapshot: {
                fragments: ids.map((id) => {
                    const fragment = fragments.get(id);
                    const versionId = `version-${versions.size + 1}`;
                    versions.set(`${id}:${versionId}`, structuredClone(fragment));
                    return { id, path: fragment.path, versionId };
                }),
            },
        };
        stored.set(`promo-history.${PROJECT}.event.${event.id}`, JSON.stringify(event));
        return event;
    };

    beforeEach(() => {
        stored = new Map();
        fragments = new Map([
            [PROJECT, makeProject()],
            [VARIATION, makeVariation()],
        ]);
        versions = new Map();
        workflows = new Map();
        roles = ['GRP-ODIN-MAS-ADMINS'];
        cachedMembers = undefined;
        profile = { id: 'verified-user', email: 'verified@example.com', name: 'Verified User' };
        allowed = true;
        logger = { error: sinon.spy() };
        delay = sinon.stub().resolves();
        state = {
            get: async (key) => {
                if (key === 'mas-users') {
                    return cachedMembers === null
                        ? null
                        : {
                              value:
                                  cachedMembers ??
                                  JSON.stringify([{ userPrincipalName: 'VERIFIED@EXAMPLE.COM', groups: roles }]),
                          };
                }
                return stored.has(key) ? { value: stored.get(key) } : null;
            },
            put: sinon.spy(async (key, value) => stored.set(key, value)),
            list: ({ match }) =>
                (async function* () {
                    yield { keys: [...stored.keys()].filter((key) => key.startsWith(match.replace('*', ''))) };
                })(),
        };
        fetchStub = sinon.stub().callsFake(async (url, options = {}) => {
            if (url.includes('/ims/profile/')) return response(profile);
            const parsed = new URL(url);
            if (parsed.pathname.includes('/workflows/')) {
                const workflow = workflows.get(decodeURIComponent(parsed.pathname.split('/').at(-1)));
                return workflow ? response(workflow) : response({}, 404);
            }
            const versionPath = /\/fragments\/([^/]+)\/versions(?:\/([^/]+))?$/.exec(parsed.pathname);
            if (versionPath) {
                const [, fragmentId, versionId] = versionPath;
                if (options.method === 'POST') {
                    if (!fragments.has(fragmentId)) return response({}, 404);
                    const createdId = `version-${versions.size + 1}`;
                    versions.set(`${fragmentId}:${createdId}`, structuredClone(fragments.get(fragmentId)));
                    return response({}, 201, null, { location: `${parsed.pathname}/${createdId}` });
                }
                const historical = versions.get(`${fragmentId}:${versionId}`);
                return historical ? response(historical) : response({}, 404);
            }
            if (parsed.pathname.endsWith('/tags')) {
                const fragment = fragments.get(parsed.pathname.split('/').at(-2));
                if (options.method === 'PUT') fragment.tags = JSON.parse(options.body).tags.map((id) => ({ id }));
                if (options.method === 'DELETE') fragment.tags = [];
                return response({ tags: fragment.tags });
            }
            if (parsed.searchParams.has('path')) {
                return response({ items: [...fragments.values()].filter((f) => f.path === parsed.searchParams.get('path')) });
            }
            const id = parsed.pathname.split('/').pop();
            if (!fragments.has(id)) return response({}, 404);
            if (options.method === 'PUT') {
                fragments.set(id, { ...fragments.get(id), ...JSON.parse(options.body) });
            }
            return response(fragments.get(id));
        });
        originalFetch = global.fetch;
        global.fetch = fetchStub;
        ({ execute } = proxyquire('../../src/promo-history/service.js', {
            'node:timers/promises': { setTimeout: delay },
            '@adobe/aio-sdk': { Core: { Logger: () => logger } },
            '@adobe/aio-lib-state': { init: async () => state },
            '../../utils.js': {
                getBearerToken: (p) => p.__ow_headers?.authorization?.slice(7),
                isAllowed: async () => allowed,
            },
        }));
    });

    afterEach(() => {
        global.fetch = originalFetch;
        sinon.restore();
    });

    it('prepares saves without native versions and captures one restorable saved state after completion', async () => {
        const { intentId } = await prepareSave({ targetId: VARIATION });
        expect(versions.size).to.equal(0);
        fragments.get(VARIATION).fields[0].values = ['Saved'];

        const { event } = await call('record', { phase: 'complete', intentId });

        expect(event.restoreMode).to.equal('state');
        expect(event).not.to.have.property('beforeSnapshot');
        expect(event.afterSnapshot.fragments).to.have.length(1);
        expect(versions.size).to.equal(1);
        fragments.get(VARIATION).fields[0].values = ['Later'];
        fragments.get(VARIATION).fields[1].values = ['Later body'];
        await call('restore', {
            eventId: event.id,
            selections: [{ fragmentId: VARIATION, fields: ['headline', 'body'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        });
        expect(fragments.get(VARIATION).fields.map(({ values }) => values[0])).to.deep.equal(['Saved', 'Unrelated']);
    });

    it('refuses to capture unrelated content when a pending save completion is retried', async () => {
        const { intentId } = await prepareSave({ targetId: VARIATION });
        fragments.get(VARIATION).fields[0].values = ['Saved'];
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith(`/${VARIATION}/versions`)),
                sinon.match({ method: 'POST' }),
            )
            .onFirstCall()
            .resolves(response({}, 503));
        await expectError(call('record', { phase: 'complete', intentId }), 503);
        fragments.get(VARIATION).fields[0].values = ['Unrelated newer save'];
        fetchStub.resetHistory();

        await expectError(call('record', { phase: 'complete', intentId }), 409);

        expect(fetchStub.getCalls().some(({ args }) => args[1]?.method === 'POST')).to.equal(false);
        expect((await call('list')).events).to.have.length(0);
    });

    it('requires the original completion ETag even when retried content has identical raw values', async () => {
        const { intentId } = await prepareSave({ targetId: VARIATION });
        fragments.get(VARIATION).fields[0].values = ['Saved'];
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith(`/${VARIATION}/versions`)),
                sinon.match({ method: 'POST' }),
            )
            .onFirstCall()
            .resolves(response({}, 503));
        await expectError(call('record', { phase: 'complete', intentId }), 503);
        fetchStub
            .withArgs(sinon.match((url) => url.endsWith(`/${VARIATION}`)))
            .resolves(response(fragments.get(VARIATION), 200, '"newer"'));
        fetchStub.resetHistory();

        await expectError(call('record', { phase: 'complete', intentId }), 409);

        expect(fetchStub.getCalls().some(({ args }) => args[1]?.method === 'POST')).to.equal(false);
    });

    it('retains the created version reference when completion verification must be retried', async () => {
        const { intentId } = await prepareSave({ targetId: VARIATION });
        fragments.get(VARIATION).fields[0].values = ['Saved'];
        const reads = fetchStub.withArgs(sinon.match((url) => url.includes(`/${VARIATION}/versions/`)));
        for (let index = 0; index < 4; index++) reads.onCall(index).resolves(response({}, 404));
        await expectError(call('record', { phase: 'complete', intentId }), 503);

        const { event } = await call('record', { phase: 'complete', intentId });

        expect(event.restoreMode).to.equal('state');
        expect(versions.size).to.equal(1);
    });

    it('does not create another version when a successful POST returned an unusable version reference', async () => {
        const { intentId } = await prepareSave({ targetId: VARIATION });
        fragments.get(VARIATION).fields[0].values = ['Saved'];
        const posts = fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith(`/${VARIATION}/versions`)),
                sinon.match({ method: 'POST' }),
            )
            .resolves(response({}, 201));
        await expectError(call('record', { phase: 'complete', intentId }), 503);

        await expectError(call('record', { phase: 'complete', intentId }), 503);

        expect(posts.calledOnce).to.equal(true);
        expect((await call('list')).events).to.have.length(0);
    });

    it('reuses the verified snapshot if event persistence fails after capture', async () => {
        const { intentId } = await prepareSave({ targetId: VARIATION });
        fragments.get(VARIATION).fields[0].values = ['Saved'];
        state.put = sinon.stub().callsFake(async (key, value) => stored.set(key, value));
        state.put
            .withArgs(sinon.match((key) => key.startsWith(`promo-history.${PROJECT}.event.`)))
            .onFirstCall()
            .rejects(new Error('State unavailable'));
        await expectError(call('record', { phase: 'complete', intentId }), 503);

        const { event } = await call('record', { phase: 'complete', intentId });

        expect(event.restoreMode).to.equal('state');
        expect(versions.size).to.equal(1);
        expect(event.changes[0].before).to.deep.equal(['Old']);
    });

    for (const status of ['NEW', 'MODIFIED', 'PUBLISHED']) {
        it(`captures observed ${status} publication state without inventing published status`, async () => {
            fragments.get(PROJECT).status = 'DRAFT';
            const { intentId } = await call('record', { phase: 'prepare', action: 'publish' });
            fragments.get(PROJECT).status = status;

            const { event } = await call('record', { phase: 'complete', intentId });

            expect(event.publicationStatus).to.equal(status);
            expect(event.publicationOutcome).to.equal(status === 'PUBLISHED' ? 'confirmed' : 'pending');
            expect(event.restoreMode).to.equal('state');
            expect(event.afterSnapshot.fragments[0].status).to.equal(status);
            expect(versions.size).to.equal(1);
        });
    }

    for (const [action, status] of [
        ['publish', 'DRAFT'],
        ['publish', 'PUBLISHED'],
        ['unpublish', 'PUBLISHED'],
        ['unpublish', 'DRAFT'],
    ]) {
        it(`captures unchanged ${status} as pending ${action} without claiming workflow success`, async () => {
            fragments.get(PROJECT).status = status;
            const { intentId } = await call('record', { phase: 'prepare', action });

            const { event } = await call('record', { phase: 'complete', intentId });
            const retry = await call('record', { phase: 'complete', intentId });

            expect(event.publicationStatus).to.equal(status);
            expect(event.publicationOutcome).to.equal('pending');
            expect(event.changes).to.deep.equal([]);
            expect(event.restoreMode).to.equal('state');
            expect(event.afterSnapshot.fragments[0]).to.include({ id: PROJECT, status });
            expect(retry.event.id).to.equal(event.id);
            expect(versions.size).to.equal(1);
        });
    }

    for (const [status, outcome] of [
        ['UNPUBLISHED', 'confirmed'],
        ['DRAFT', 'pending'],
        ['NEW', 'pending'],
        ['MODIFIED', 'pending'],
    ]) {
        it(`records unpublish observed ${status} with ${outcome} outcome`, async () => {
            fragments.get(PROJECT).status = 'PUBLISHED';
            const { intentId } = await call('record', { phase: 'prepare', action: 'unpublish' });
            fragments.get(PROJECT).status = status;

            const { event } = await call('record', { phase: 'complete', intentId });

            expect(event.publicationStatus).to.equal(status);
            expect(event.publicationOutcome).to.equal(outcome);
        });
    }

    for (const operation of ['PENDING', 'SCHEDULED', 'QUEUED']) {
        it(`preserves observed replication ${operation} and prevents confirmation despite terminal lifecycle status`, async () => {
            fragments.get(PROJECT).status = 'MODIFIED';
            const { intentId } = await call('record', { phase: 'prepare', action: 'publish' });
            fragments.get(PROJECT).status = 'PUBLISHED';
            fragments.get(PROJECT).operations = { replication: operation };

            const { event } = await call('record', { phase: 'complete', intentId });

            expect(event.publicationStatus).to.equal('PUBLISHED');
            expect(event.publicationOperation).to.equal(operation);
            expect(event.publicationOutcome).to.equal('pending');
        });
    }

    for (const action of ['save', 'create', 'duplicate']) {
        it(`accepts the exact original ${action} result ETag before native capture`, async () => {
            const { intentId } = await call('record', { phase: 'prepare', action, targetId: VARIATION });
            fragments.get(VARIATION).fields[0].values = ['Saved'];

            const { event } = await call('record', { phase: 'complete', intentId, completionEtag: '"one"' });

            expect(event.restoreMode).to.equal('state');
            expect(versions.size).to.equal(1);
        });

        it(`rejects a later ${action} result ETag before snapshotting unrelated state`, async () => {
            const { intentId } = await call('record', { phase: 'prepare', action, targetId: VARIATION });
            fragments.get(VARIATION).fields[0].values = ['Later unrelated edit'];
            fetchStub.resetHistory();
            let failure;
            try {
                await call('record', { phase: 'complete', intentId, completionEtag: '"original-save"' });
            } catch (error) {
                failure = error;
            }

            expect(failure?.statusCode).to.equal(409);
            expect(failure?.result.auditPending).to.equal(true);
            expect(fetchStub.getCalls().some(({ args }) => args[1]?.method === 'POST')).to.equal(false);
            expect((await call('list')).events).to.have.length(0);
        });
    }

    for (const completionEtag of ['', '*', 123]) {
        it(`rejects invalid completion ETag ${JSON.stringify(completionEtag)} before native capture`, async () => {
            const { intentId } = await prepareSave({ targetId: VARIATION });
            fragments.get(VARIATION).fields[0].values = ['Saved'];

            await expectError(call('record', { phase: 'complete', intentId, completionEtag }), 400);

            expect(versions.size).to.equal(0);
        });
    }

    it('verifies completion ETags for direct creation events too', async () => {
        await expectError(call('record', { action: 'create', targetId: VARIATION, completionEtag: '"old"' }), 409);
        expect(versions.size).to.equal(0);
    });

    it('verifies optional duplicate source project provenance without snapshotting or writing the source', async () => {
        const sourceId = '33333333-3333-4333-8333-333333333333';
        fragments.set(sourceId, { ...makeProject(), id: sourceId, path: `${projectPath}-source` });

        const { event } = await call('record', { action: 'duplicate', targetId: PROJECT, sourceProjectId: sourceId });

        expect(event.sourceProjectId).to.equal(sourceId);
        expect(event.afterSnapshot.fragments.map(({ id }) => id)).to.deep.equal([PROJECT]);
        expect([...versions.keys()].some((key) => key.startsWith(sourceId))).to.equal(false);
    });

    it('rejects duplicate provenance pointing to a non-project', async () => {
        await expectError(call('record', { action: 'duplicate', targetId: PROJECT, sourceProjectId: VARIATION }), 403);
        expect(versions.size).to.equal(0);
    });

    it('verifies duplicate provenance supplied only when completing a prepared audit', async () => {
        const sourceId = '33333333-3333-4333-8333-333333333333';
        fragments.set(sourceId, { ...makeProject(), id: sourceId, path: `${projectPath}-source` });
        const { intentId } = await call('record', { phase: 'prepare', action: 'duplicate', targetId: PROJECT });

        const { event } = await call('record', { phase: 'complete', intentId, sourceProjectId: sourceId });
        const retry = await call('record', { phase: 'complete', intentId, sourceProjectId: sourceId });

        expect(event.sourceProjectId).to.equal(sourceId);
        expect(retry.event.id).to.equal(event.id);
        expect(versions.size).to.equal(1);
        await expectError(call('record', { phase: 'complete', intentId, sourceProjectId: VARIATION }), 409);
    });

    for (const raw of [[], ['<explicit_empty/>']]) {
        it(`restores saved raw ${JSON.stringify(raw)} without copying inherited parent display content`, async () => {
            const parentId = '33333333-3333-4333-8333-333333333333';
            const parentPath = '/content/dam/mas/acom/en_US/card';
            fragments.set(parentId, { ...makeVariation(), id: parentId, path: parentPath });
            fragments.get(PROJECT).fields[0].values = [parentPath];
            fragments.get(VARIATION).fields[0].values = raw;
            const { event } = await call('record', { action: 'create', targetId: VARIATION });
            fragments.get(VARIATION).fields[0].values = ['Later override'];
            fragments.get(parentId).fields[0].values = ['Current inherited display'];

            const result = await call('restore', {
                eventId: event.id,
                selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            });

            expect(fragments.get(VARIATION).fields[0].values).to.deep.equal(raw);
            expect(fragments.get(parentId).fields[0].values).to.deep.equal(['Current inherited display']);
            expect(result.event.beforeContext.inheritance[0].id).to.equal(parentId);
            expect(result.event.afterSnapshot.inheritance[0].id).to.equal(parentId);
        });
    }

    describe('saved-state restore preflight', () => {
        let event;
        beforeEach(async () => {
            ({ event } = await call('record', { action: 'create', targetId: VARIATION }));
            fragments.get(VARIATION).fields[0].values = ['Later'];
            fetchStub.resetHistory();
        });

        for (const [condition, status] of [
            ['unknown field', 400],
            ['stale ETag', 409],
            ['moved target', 409],
            ['missing target', 404],
            ['unowned target', 403],
            ['changed tags', 409],
            ['missing reference', 404],
        ]) {
            it(`rejects ${condition} before any saved-state restore write`, async () => {
                const selection = { fragmentId: VARIATION, fields: ['headline'] };
                const expected = [{ fragmentId: VARIATION, etag: '"one"' }];
                if (condition === 'unknown field') selection.fields = ['untrusted'];
                if (condition === 'stale ETag') expected[0].etag = '"old"';
                if (condition === 'moved target') fragments.get(VARIATION).path += '-moved';
                if (condition === 'missing target') fragments.delete(VARIATION);
                if (condition === 'unowned target') fragments.get(PROJECT).tags = [];
                if (condition === 'changed tags') {
                    selection.fields = ['@tags'];
                    fragments.get(VARIATION).tags = [{ id: 'mas:new' }];
                    fetchStub
                        .withArgs(sinon.match((url) => url.endsWith(`/${VARIATION}/tags`)))
                        .resolves(response({ tags: [{ id: 'mas:concurrent' }] }));
                }
                if (condition === 'missing reference') {
                    const entry = event.afterSnapshot.fragments[0];
                    versions.get(`${entry.id}:${entry.versionId}`).fields.push({
                        name: 'cards',
                        type: 'content-fragment',
                        values: ['/content/dam/mas/acom/en_US/missing'],
                    });
                    selection.fields = ['cards'];
                }

                await expectError(call('restore', { eventId: event.id, selections: [selection], expected }), status);

                expect(fetchStub.getCalls().some(({ args }) => ['POST', 'PUT', 'DELETE'].includes(args[1]?.method))).to.equal(
                    false,
                );
            });
        }

        it('uses afterSnapshot even when a state event has an older compatibility snapshot', async () => {
            const old = await legacyBackup([VARIATION]);
            event.snapshot = old.snapshot;
            stored.set(`promo-history.${PROJECT}.event.${event.id}`, JSON.stringify(event));

            await call('restore', {
                eventId: event.id,
                selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            });

            expect(fragments.get(VARIATION).fields[0].values).to.deep.equal(['Old']);
        });

        it('preserves current field definitions and appends selected absent historical fields', async () => {
            fragments.get(VARIATION).fields = [{ name: 'headline', type: 'text', values: ['Later'] }];

            await call('restore', {
                eventId: event.id,
                selections: [{ fragmentId: VARIATION, fields: ['headline', 'body'] }],
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            });

            expect(fragments.get(VARIATION).fields).to.deep.equal([
                { name: 'headline', type: 'text', values: ['Old'] },
                { name: 'body', values: ['Unrelated'] },
            ]);
        });
    });

    it('uses IMS verified identity instead of caller supplied identity', async () => {
        const { intentId } = await prepareSave({ user: { id: 'forged' }, before: { title: 'forged' } });
        fragments.get(PROJECT).title = 'Updated';
        const { event } = await call('record', { phase: 'complete', intentId });
        expect(event.user.id).to.equal('verified-user');
        const entry = event.snapshot.fragments[0];
        expect(versions.get(`${entry.id}:${entry.versionId}`).title).to.equal('Updated');
    });

    it('rejects invalid IMS tokens before any AEM request or persistence', async () => {
        allowed = false;
        await expectError(prepareSave(), 401);
        expect(fetchStub.called).to.equal(false);
        expect(stored.size).to.equal(0);
    });

    it('rejects a missing IMS identity', async () => {
        profile = {};
        await expectError(prepareSave(), 401);
    });

    it('allows authorized project readers to list without restore roles', async () => {
        await legacyBackup();
        roles = [];
        expect((await call('list')).events).to.have.length(1);
    });

    it('denies read-only principals recording before AEM access or intent allocation, ignoring supplied groups', async () => {
        roles = [];
        await expectError(prepareSave({ user: { email: profile.email, groups: ['GRP-ODIN-MAS-ADMINS'] } }), 403);
        expect(state.put.called).to.equal(false);
        expect(fetchStub.getCalls().some(({ args }) => args[0].includes('/adobe/sites/'))).to.equal(false);
    });

    it('permits regular trusted promo editors to record saves but not restore', async () => {
        roles = ['grp-odin-mas-promo-editors'];
        const { event } = await completeSave();
        expect(event.action).to.equal('save');
        await expectError(call('restore', { eventId: event.id, expected: [] }), 403);
    });

    it('limits pending intents per principal without blocking another author', async () => {
        for (let index = 0; index < 50; index++) {
            stored.set(
                `promo-history.${PROJECT}.intent.pending-${index}`,
                JSON.stringify({ id: `pending-${index}`, createdAt: new Date().toISOString(), user: profile }),
            );
        }
        await expectError(prepareSave(), 429);
        expect(state.put.called).to.equal(false);
        cachedMembers = JSON.stringify([{ userPrincipalName: 'other@example.com', groups: roles }]);
        profile = { id: 'other-user', email: 'other@example.com' };
        expect((await prepareSave()).intentId).to.be.a('string');
    });

    it('does not count completed intents against the pending quota', async () => {
        for (let index = 0; index < 50; index++) {
            stored.set(
                `promo-history.${PROJECT}.intent.done-${index}`,
                JSON.stringify({ id: `done-${index}`, createdAt: new Date().toISOString(), user: profile }),
            );
            stored.set(
                `promo-history.${PROJECT}.event.done-${index}`,
                JSON.stringify({
                    id: `event-${index}`,
                    intentId: `done-${index}`,
                    createdAt: new Date().toISOString(),
                    user: profile,
                    requestId: `done-${index}`,
                }),
            );
        }
        expect((await prepareSave()).intentId).to.be.a('string');
    });

    it('rejects restore without a verified admin or promo power-user role', async () => {
        const event = await legacyBackup();
        roles = ['GRP-ODIN-MAS-ACOM-CURATORS'];
        await expectError(call('restore', { eventId: event.id, expected: [] }), 403);
        expect(fetchStub.getCalls().some(({ args }) => args[1]?.method === 'PUT')).to.equal(false);
    });

    it('restores for an LDAP admin even when IMS organizations does not contain MAS groups', async () => {
        const event = await legacyBackup();
        fetchStub.withArgs(sinon.match((url) => url.includes('/ims/organizations/'))).resolves(response([]));
        fragments.get(VARIATION).fields[0].values = ['Changed'];

        const result = await call('restore', {
            eventId: event.id,
            selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        });

        expect(result.restored).to.deep.equal([VARIATION]);
        expect(fragments.get(VARIATION).fields[0].values).to.deep.equal(['Old']);
    });

    it('does not use caller-supplied identity or IMS organization roles to bypass LDAP membership', async () => {
        const event = await legacyBackup();
        fetchStub.withArgs(sinon.match((url) => url.includes('/ims/organizations/'))).resolves(
            response([
                {
                    orgRef: { authSrc: 'AdobeOrg', ident: '000000000000000000000000' },
                    groups: [{ groupName: 'GRP-ODIN-MAS-ADMINS' }],
                },
            ]),
        );
        cachedMembers = JSON.stringify([
            { userPrincipalName: 'other@example.com', groups: ['GRP-ODIN-MAS-ADMINS'] },
            { userPrincipalName: 'verified@example.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] },
        ]);

        await expectError(
            call('restore', {
                eventId: event.id,
                expected: [],
                user: { email: 'other@example.com', groups: ['GRP-ODIN-MAS-ADMINS'] },
                email: 'other@example.com',
                groups: ['GRP-ODIN-MAS-ADMINS'],
            }),
            403,
        );

        expect(
            fetchStub.getCalls().some(({ args }) => args[0].includes('/adobe/sites/') && args[1]?.method === 'PUT'),
        ).to.equal(false);
    });

    it('denies restore for a verified identity absent from the membership cache', async () => {
        cachedMembers = '[]';

        await expectError(call('restore', { eventId: PROJECT, expected: [] }), 403);

        expect(fetchStub.getCalls().some(({ args }) => args[0].includes('/adobe/sites/'))).to.equal(false);
    });

    for (const [condition, value] of [
        ['missing', null],
        ['invalid JSON', '{'],
        ['invalid schema', '{}'],
        ['invalid groups', JSON.stringify([{ userPrincipalName: 'verified@example.com', groups: 'GRP-ODIN-MAS-ADMINS' }])],
        ['invalid group names', JSON.stringify([{ userPrincipalName: 'verified@example.com', groups: [42] }])],
    ]) {
        it(`rejects restore before AEM access when the membership cache is ${condition}`, async () => {
            cachedMembers = value;

            await expectError(call('restore', { eventId: PROJECT, expected: [] }), 503);

            expect(fetchStub.getCalls().some(({ args }) => args[0].includes('/adobe/sites/'))).to.equal(false);
            expect(state.put.called).to.equal(false);
        });
    }

    it('reports a membership storage outage without granting restore access', async () => {
        sinon.stub(state, 'get').withArgs('mas-users').rejects(new Error('State unavailable'));

        await expectError(call('restore', { eventId: PROJECT, expected: [] }), 503);

        expect(fetchStub.getCalls().some(({ args }) => args[0].includes('/adobe/sites/'))).to.equal(false);
    });

    it('rejects the removed manual backup operation without AEM writes or persistence', async () => {
        await expectError(call('backup'), 400);

        expect(fetchStub.getCalls().some(({ args }) => ['POST', 'PUT', 'DELETE'].includes(args[1]?.method))).to.equal(false);
        expect(state.put.called).to.equal(false);
    });

    it('stores only native version references in the completed save manifest', async () => {
        const { intentId } = await prepareSave();
        fragments.get(PROJECT).title = 'Updated';
        const { event } = await call('record', { phase: 'complete', intentId });
        const persisted = JSON.parse(state.put.lastCall.args[1]);
        expect(persisted.snapshot.fragments).to.deep.equal([{ id: PROJECT, path: projectPath, versionId: 'version-1' }]);
        expect(persisted.snapshot).to.deep.equal(event.snapshot);
        expect(persisted).not.to.have.property('beforeSnapshot');
        expect(persisted.restoreMode).to.equal('state');
        expect(persisted.afterSnapshot.fragments).to.deep.equal([{ id: PROJECT, path: projectPath, versionId: 'version-1' }]);
        const after = persisted.afterSnapshot.fragments[0];
        expect(versions.get(`${after.id}:${after.versionId}`).title).to.equal('Updated');
        expect(state.put.lastCall.args[1]).not.to.include('"fields"');
        expect(state.put.lastCall.args[2].ttl).to.be.at.least(90 * 86400);
    });

    for (const method of ['GET', 'POST']) {
        it(`logs safe request context when an AEM version ${method} fails during save completion`, async () => {
            const resource = `/adobe/sites/cf/fragments/${PROJECT}/versions${method === 'GET' ? '/version-1' : ''}`;
            fetchStub
                .withArgs(
                    sinon.match((url) => new URL(url).pathname === resource),
                    sinon.match((options) => (options.method ?? 'GET') === method),
                )
                .resolves(response({ detail: 'private upstream response' }, 404, null, { 'x-request-id': 'aem-request' }));

            await expectError(completeSave(), 503);

            expect(logger.error.callCount).to.equal(method === 'GET' ? 4 : 1);
            expect(JSON.parse(logger.error.firstCall.args[0])).to.deep.equal({
                event: 'promo-history-aem-request-failed',
                operation: 'record',
                phase: 'complete',
                projectId: PROJECT,
                requestId: 'request-one',
                method,
                endpoint: 'https://author.example.com',
                resource,
                status: 404,
                aemRequestId: 'aem-request',
            });
            expect((await call('list')).events).to.have.length(0);
        });
    }

    it('completes a save when its new AEM version becomes readable after transient 404s', async () => {
        const reads = fetchStub.withArgs(sinon.match((url) => url.includes(`/${PROJECT}/versions/`)));
        reads.onFirstCall().resolves(response({}, 404));
        reads.onSecondCall().resolves(response({}, 404));

        const result = await completeSave();

        expect(result.event.intentId).to.be.a('string');
        expect(reads.callCount).to.equal(3);
        expect(delay.args).to.deep.equal([[250], [500]]);
        expect(
            fetchStub.withArgs(
                sinon.match((url) => url.endsWith(`/${PROJECT}/versions`)),
                sinon.match({ method: 'POST' }),
            ).callCount,
        ).to.equal(1);
    });

    it('does not complete a save if its new version is still missing after bounded retries', async () => {
        const reads = fetchStub
            .withArgs(sinon.match((url) => url.includes(`/${PROJECT}/versions/`)))
            .resolves(response({}, 404));

        await expectError(completeSave(), 503);

        expect(reads.callCount).to.equal(4);
        expect(delay.args).to.deep.equal([[250], [500], [1000]]);
        expect(versions.size).to.equal(1);
        expect((await call('list')).events).to.have.length(0);
    });

    for (const status of [403, 500]) {
        it(`does not retry a newly created version read returning ${status}`, async () => {
            const reads = fetchStub
                .withArgs(sinon.match((url) => url.includes(`/${PROJECT}/versions/`)))
                .resolves(response({}, status));

            await expectError(completeSave(), 503);

            expect(reads.calledOnce).to.equal(true);
            expect(delay.called).to.equal(false);
            expect((await call('list')).events).to.have.length(0);
        });
    }

    it('rejects a created AEM version without a Location header', async () => {
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith('/versions')),
                sinon.match({ method: 'POST' }),
            )
            .resolves(response({}, 201));
        await expectError(completeSave(), 503);
        expect((await call('list')).events).to.have.length(0);
    });

    it('refuses save completion when the native version does not match the observed content', async () => {
        fetchStub
            .withArgs(sinon.match((url) => url.includes(`/${PROJECT}/versions/`)))
            .resolves(response({ ...makeProject(), title: 'Concurrent edit' }));
        await expectError(completeSave(), 503);
        expect((await call('list')).events).to.have.length(0);
    });

    it('does not restore when a retained AEM version is missing', async () => {
        const event = await legacyBackup();
        versions.clear();
        await expectError(
            call('restore', {
                eventId: event.id,
                selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            }),
            404,
        );
        expect(delay.called).to.equal(false);
        expect(fetchStub.getCalls().some(({ args }) => args[1]?.method === 'PUT')).to.equal(false);
    });

    it('keeps history listable when AEM version content is no longer available', async () => {
        const event = await legacyBackup();
        versions.clear();
        fetchStub.resetHistory();
        expect((await call('list')).events[0].id).to.equal(event.id);
        expect(fetchStub.getCalls().some(({ args }) => args[0].includes('/versions/'))).to.equal(false);
    });

    it('restores a selected fragment even when an unrelated historical version is unavailable', async () => {
        const otherId = '33333333-3333-4333-8333-333333333333';
        const other = { ...makeVariation(), id: otherId, path: `${variationPath}-other` };
        fragments.set(otherId, other);
        const event = await legacyBackup([PROJECT, VARIATION, otherId]);
        const entry = event.snapshot.fragments.find((fragment) => fragment.id === otherId);
        versions.delete(`${entry.id}:${entry.versionId}`);
        const { restored } = await call('restore', {
            eventId: event.id,
            selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        });
        expect(restored).to.deep.equal([VARIATION]);
    });

    it('records server observed field diffs after prepare and successful save', async () => {
        const { intentId } = await call('record', { phase: 'prepare', action: 'save', targetId: VARIATION });
        fragments.get(VARIATION).fields[0].values = ['New'];
        const { event } = await call('record', { phase: 'complete', intentId });
        expect(event.changes.find((change) => change.field === 'headline')).to.include({
            fragmentId: VARIATION,
            category: 'fragments',
        });
        expect(event.changes.find((change) => change.field === 'headline').before).to.deep.equal(['Old']);
        expect(event.restoreMode).to.equal('state');
        expect(event.snapshot.fragments).to.deep.equal([{ id: VARIATION, path: variationPath, versionId: 'version-1' }]);
        expect(event.projectPath).to.equal(projectPath);
        expect(event.environment.aem).to.equal('https://author.example.com');
        expect(versions.size).to.equal(1);
        const intent = [...stored.values()].map((value) => JSON.parse(value)).find((value) => value.id === intentId);
        expect(intent.before.fragments.map(({ id }) => id)).to.deep.equal([VARIATION]);
        expect(intent.before.fragments[0].fields[0].values).to.deep.equal(['Old']);
        expect(state.put.firstCall.args[2].ttl).to.equal(86400);
        expect(state.put.lastCall.args[2].ttl).to.be.at.least(90 * 86400);
    });

    it('versions only the saved project without traversing unrelated fragments', async () => {
        fragments.delete(VARIATION);
        const { intentId } = await call('record', { phase: 'prepare', action: 'save', targetId: PROJECT });
        fragments.get(PROJECT).fields.push({ name: 'promoCode', values: ['NEWCODE'] });

        const { event } = await call('record', { phase: 'complete', intentId });

        expect(event.changes.find(({ field }) => field === 'promoCode').after).to.deep.equal(['NEWCODE']);
        expect(event.snapshot.fragments.map(({ id }) => id)).to.deep.equal([PROJECT]);
        expect(versions.size).to.equal(1);
    });

    it('preserves the raw save baseline even when the version API is unavailable at preparation', async () => {
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith('/versions')),
                sinon.match({ method: 'POST' }),
            )
            .resolves(response({}, 503));

        const { intentId } = await prepareSave({ targetId: VARIATION });
        const intent = [...stored.values()].map((value) => JSON.parse(value)).find((value) => value.id === intentId);
        expect(intent.before.fragments[0].fields[0].values).to.deep.equal(['Old']);
        expect(versions.size).to.equal(0);
    });

    it('reuses the raw baseline without creating versions when save preparation is retried', async () => {
        const first = await call('record', { phase: 'prepare', action: 'save', targetId: VARIATION });
        const retry = await call('record', { phase: 'prepare', action: 'save', targetId: VARIATION });

        expect(retry.intentId).to.equal(first.intentId);
        expect(versions.size).to.equal(0);
    });

    for (const action of ['save', 'create']) {
        it(`retries failed ${action} completion capture without recording a false success`, async () => {
            const { intentId } = await call('record', { phase: 'prepare', action, targetId: VARIATION });
            fragments.get(VARIATION).fields[0].values = ['Saved'];
            const posts = fetchStub.withArgs(
                sinon.match((url) => url.endsWith(`/${VARIATION}/versions`)),
                sinon.match({ method: 'POST' }),
            );
            posts.onCall(posts.callCount).resolves(response({}, 503));
            const payload = { phase: 'complete', intentId };

            await expectError(call('record', payload), 503);
            expect((await call('list')).events).to.have.length(0);
            expect(fragments.get(VARIATION).fields[0].values).to.deep.equal(['Saved']);

            const completed = await call('record', payload);
            const count = versions.size;
            fragments.get(VARIATION).fields[0].values = ['Later change'];
            const retry = await call('record', payload);

            expect(retry).to.deep.equal(JSON.parse(JSON.stringify(completed)));
            expect(versions.size).to.equal(count);
            expect((await call('list')).events).to.have.length(1);
        });
    }

    it('rejects completion when the created after version is not readable', async () => {
        const { intentId } = await prepareSave();
        fragments.get(PROJECT).title = 'Saved';
        fetchStub.withArgs(sinon.match((url) => url.includes(`/${PROJECT}/versions/`))).resolves(response({}, 404));

        await expectError(call('record', { phase: 'complete', intentId }), 503);

        expect(delay.args).to.deep.equal([[250], [500], [1000]]);
        expect((await call('list')).events).to.have.length(0);
    });

    it('rejects completion if content changes during after version capture', async () => {
        const { intentId } = await prepareSave();
        fragments.get(PROJECT).title = 'Saved';
        fetchStub
            .withArgs(sinon.match((url) => url.includes(`/${PROJECT}/versions/`)))
            .resolves(response({ ...makeProject(), title: 'Concurrent edit' }));

        await expectError(call('record', { phase: 'complete', intentId }), 503);

        expect((await call('list')).events).to.have.length(0);
    });

    it('rejects completion when after version creation returns no native reference', async () => {
        const { intentId } = await prepareSave();
        fragments.get(PROJECT).title = 'Saved';
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith('/versions')),
                sinon.match({ method: 'POST' }),
            )
            .resolves(response({}, 201));

        await expectError(call('record', { phase: 'complete', intentId }), 503);

        expect((await call('list')).events).to.have.length(0);
    });

    describe('historical inheritance references', () => {
        const parentId = '33333333-3333-4333-8333-333333333333';
        const parentPath = '/content/dam/mas/acom/en_US/card';

        beforeEach(() => {
            fragments.set(parentId, { ...makeVariation(), id: parentId, path: parentPath, status: 'DRAFT' });
            fragments.get(PROJECT).fields[0].values = [parentPath];
        });

        it('captures an immutable saved-state parent outside writable targets', async () => {
            const { intentId } = await prepareSave({ targetId: VARIATION });
            fragments.get(parentId).fields[0].values = ['Parent at save'];
            fragments.get(VARIATION).fields[0].values = ['Saved'];

            const { event } = await call('record', { phase: 'complete', intentId });
            fragments.get(parentId).fields[0].values = ['Later parent'];

            expect(event.snapshot.fragments.map(({ id }) => id)).to.deep.equal([VARIATION]);
            expect(event).not.to.have.property('beforeSnapshot');
            for (const [manifest, expected] of [
                [event.beforeContext, 'Old'],
                [event.afterSnapshot, 'Parent at save'],
            ]) {
                expect(manifest.inheritance).to.have.length(1);
                const entry = manifest.inheritance[0];
                expect(entry).to.deep.equal({
                    fragmentId: VARIATION,
                    id: parentId,
                    path: parentPath,
                    versionId: entry.versionId,
                    status: 'DRAFT',
                });
                expect(versions.get(`${entry.id}:${entry.versionId}`).fields[0].values).to.deep.equal([expected]);
            }
            expect(event.beforeContext).not.to.have.property('fragments');
            expect([...versions.keys()].filter((key) => key.startsWith(VARIATION))).to.have.length(1);
        });

        for (const suffix of ['', '-3']) {
            it(`captures the referenced original parent for a created variation with suffix "${suffix}"`, async () => {
                fragments.get(VARIATION).path += suffix;
                const { event } = await call('record', { action: 'create', targetId: VARIATION });

                expect(event.afterSnapshot.inheritance[0]).to.include({ fragmentId: VARIATION, id: parentId });
                expect(event.snapshot).to.deep.equal(event.afterSnapshot);
            });
        }

        it('prefers an exactly referenced numeric source name over stripping its suffix', async () => {
            const numericId = '55555555-5555-4555-8555-555555555555';
            fragments.set(numericId, { ...makeVariation(), id: numericId, path: `${parentPath}-2` });
            fragments.get(PROJECT).fields[0].values.push(`${parentPath}-2`);
            fragments.get(VARIATION).path += '-2';

            const { event } = await call('record', { action: 'create', targetId: VARIATION });

            expect(event.afterSnapshot.inheritance[0].id).to.equal(numericId);
        });

        it('fails explicitly when a mapped parent cannot be read', async () => {
            fragments.delete(parentId);

            await expectError(completeSave({ targetId: VARIATION }), 404);
            expect((await call('list')).events).to.have.length(0);
        });

        it('fails explicitly when a mapped parent native version cannot be created', async () => {
            fetchStub
                .withArgs(
                    sinon.match((url) => url.endsWith(`/${parentId}/versions`)),
                    sinon.match({ method: 'POST' }),
                )
                .resolves(response({}, 503));

            await expectError(completeSave({ targetId: VARIATION }), 503);
            expect((await call('list')).events).to.have.length(0);
        });

        it('does not infer an unreferenced parent from a matching path', async () => {
            fragments.get(PROJECT).fields[0].values = [variationPath];

            const { event } = await call('record', { action: 'create', targetId: VARIATION });

            expect(event.afterSnapshot).not.to.have.property('inheritance');
            expect([...versions.keys()].some((key) => key.startsWith(parentId))).to.equal(false);
        });

        it('captures restore parent versions without restoring parent content', async () => {
            const { intentId } = await prepareSave({ targetId: VARIATION });
            fragments.get(VARIATION).fields[0].values = ['Saved'];
            const { event } = await call('record', { phase: 'complete', intentId });
            fragments.get(parentId).fields[0].values = ['Current parent'];
            fetchStub.resetHistory();

            const result = await call('restore', {
                eventId: event.id,
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            });

            expect(result.restored).to.deep.equal([VARIATION]);
            expect(result.event).not.to.have.property('beforeSnapshot');
            expect(result.event.afterSnapshot.inheritance[0].id).to.equal(parentId);
            expect(fragments.get(parentId).fields[0].values).to.deep.equal(['Current parent']);
            expect(fetchStub.getCalls().some(({ args }) => args[0].endsWith(parentId) && args[1]?.method === 'PUT')).to.equal(
                false,
            );
        });

        describe('grouped source inheritance', () => {
            const defaultId = '55555555-5555-4555-8555-555555555555';
            const defaultPath = '/content/dam/mas/acom/en_US/default-card';
            const groupedPath = '/content/dam/mas/acom/en_US/pzn/card';
            let parentRefs;

            beforeEach(() => {
                fragments.get(parentId).path = groupedPath;
                fragments.get(parentId).fields[0].values = ['Grouped override is not the promo parent'];
                fragments.get(PROJECT).fields[0].values = [groupedPath];
                fragments.get(VARIATION).path = variationPath.replace('/card', '/pzn/card');
                fragments.set(defaultId, {
                    ...makeVariation(),
                    id: defaultId,
                    path: defaultPath,
                    fields: [
                        { name: 'headline', values: ['Default card value'] },
                        { name: 'variations', values: [groupedPath] },
                    ],
                });
                parentRefs = [{ type: 'content-fragment', path: defaultPath }];
                fetchStub
                    .withArgs(
                        sinon.match((url) => url.endsWith('/referencedBy')),
                        sinon.match({ method: 'POST' }),
                    )
                    .callsFake(async () => response({ items: [{ path: groupedPath, parentReferences: parentRefs }] }));
            });

            it('captures the verified native default parent rather than the raw grouped source', async () => {
                const { intentId } = await prepareSave({ targetId: VARIATION });
                fragments.get(defaultId).fields[0].values = ['Default at completion'];
                fragments.get(VARIATION).fields[0].values = ['Saved'];

                const { event } = await call('record', { phase: 'complete', intentId });

                for (const [manifest, expected] of [
                    [event.beforeContext, 'Default card value'],
                    [event.afterSnapshot, 'Default at completion'],
                ]) {
                    const entry = manifest.inheritance[0];
                    expect(entry).to.include({ fragmentId: VARIATION, id: defaultId, path: defaultPath });
                    expect(versions.get(`${entry.id}:${entry.versionId}`).fields[0].values).to.deep.equal([expected]);
                }
                expect([...versions.keys()].some((key) => key.startsWith(parentId))).to.equal(false);
                const referencedBy = fetchStub.getCalls().find(({ args }) => args[0].endsWith('/referencedBy'));
                expect(JSON.parse(referencedBy.args[1].body)).to.deep.equal({ paths: [groupedPath] });
                expect(fetchStub.getCalls().some(({ args }) => ['PUT', 'DELETE', 'PATCH'].includes(args[1]?.method))).to.equal(
                    false,
                );
            });

            it('prefers the verified default-locale parent over a regional reverse reference', async () => {
                const regionalId = '66666666-6666-4666-8666-666666666666';
                const regionalPath = '/content/dam/mas/acom/en_CA/default-card';
                fragments.set(regionalId, {
                    ...structuredClone(fragments.get(defaultId)),
                    id: regionalId,
                    path: regionalPath,
                });
                parentRefs.unshift({ type: 'content-fragment', path: regionalPath });

                const { event } = await call('record', { action: 'create', targetId: VARIATION });

                expect(event.afterSnapshot.inheritance[0].id).to.equal(defaultId);
            });

            it('resolves a regional grouped source to its verified locale-default parent', async () => {
                const regionalGroupedPath = groupedPath.replace('/en_US/', '/en_CA/');
                fragments.get(parentId).path = regionalGroupedPath;
                fragments.get(PROJECT).fields[0].values = [regionalGroupedPath];
                fragments.get(VARIATION).path = fragments.get(VARIATION).path.replace('/en_US/', '/en_CA/');
                fragments.get(defaultId).fields[1].values = [regionalGroupedPath];

                const { event } = await call('record', { action: 'create', targetId: VARIATION });

                expect(event.afterSnapshot.inheritance[0]).to.include({ id: defaultId, path: defaultPath });
            });

            for (const reason of ['missing', 'ambiguous']) {
                it(`marks ${reason} grouped parents unavailable instead of using grouped raw fields`, async () => {
                    if (reason === 'missing') fragments.get(defaultId).fields[1].values = [];
                    else {
                        const otherId = '66666666-6666-4666-8666-666666666666';
                        const otherPath = `${defaultPath}-other`;
                        fragments.set(otherId, {
                            ...structuredClone(fragments.get(defaultId)),
                            id: otherId,
                            path: otherPath,
                        });
                        parentRefs.push({ type: 'content-fragment', path: otherPath });
                    }

                    const { event } = await call('record', { action: 'create', targetId: VARIATION });

                    expect(event.afterSnapshot).not.to.have.property('inheritance');
                    expect(event.afterSnapshot.inheritanceUnavailable).to.deep.equal([
                        { fragmentId: VARIATION, reason: `grouped-parent-${reason}` },
                    ]);
                    expect([...versions.keys()].some((key) => !key.startsWith(VARIATION))).to.equal(false);
                });
            }

            it('ignores cross-surface references and references that are not content fragments', async () => {
                parentRefs = [
                    { type: 'content-fragment', path: '/content/dam/mas/sandbox/en_US/default-card' },
                    { type: 'page', path: defaultPath },
                ];

                const { event } = await call('record', { action: 'create', targetId: VARIATION });

                expect(event.afterSnapshot).not.to.have.property('inheritance');
                expect(event.afterSnapshot.inheritanceUnavailable[0].reason).to.equal('grouped-parent-missing');
            });

            it('propagates grouped reverse-reference I/O failures instead of treating them as missing parents', async () => {
                fetchStub
                    .withArgs(
                        sinon.match((url) => url.endsWith('/referencedBy')),
                        sinon.match({ method: 'POST' }),
                    )
                    .resolves(response({}, 503));

                await expectError(completeSave({ targetId: VARIATION }), 503);
                expect((await call('list')).events).to.have.length(0);
            });

            it('omits unavailable inheritance for failed targets from a partial restore state manifest', async () => {
                fragments.get(defaultId).fields[1].values = [];
                const event = await legacyBackup();
                fragments.get(PROJECT).title = 'New project title';
                fragments.get(VARIATION).fields[0].values = ['New headline'];
                fetchStub
                    .withArgs(
                        sinon.match((url) => url.endsWith(VARIATION)),
                        sinon.match({ method: 'PUT' }),
                    )
                    .resolves(response({}, 412));

                const result = await call('restore', {
                    eventId: event.id,
                    expected: [
                        { fragmentId: PROJECT, etag: '"one"' },
                        { fragmentId: VARIATION, etag: '"one"' },
                    ],
                });

                expect(result.restored).to.deep.equal([PROJECT]);
                expect(result.event.afterSnapshot.fragments.map(({ id }) => id)).to.deep.equal([PROJECT]);
                expect(result.event.afterSnapshot.inheritanceUnavailable ?? []).to.deep.equal([]);
            });
        });
    });

    describe('legacy content undo', () => {
        let event;

        beforeEach(async () => {
            event = await legacyBackup([VARIATION]);
            event.action = 'save';
            event.restoreMode = 'undo';
            event.beforeSnapshot = event.snapshot;
            event.changes = [{ fragmentId: VARIATION, field: 'headline', before: ['Old'], after: ['New'] }];
            fragments.get(VARIATION).fields[0].values = ['New'];
            const versionId = `version-${versions.size + 1}`;
            versions.set(`${VARIATION}:${versionId}`, structuredClone(fragments.get(VARIATION)));
            event.afterSnapshot = { fragments: [{ id: VARIATION, path: variationPath, versionId }] };
            stored.set(`promo-history.${PROJECT}.event.${event.id}`, JSON.stringify(event));
        });

        it('restores the native before value without a manual backup and preserves unrelated edits', async () => {
            fragments.get(VARIATION).fields[1].values = ['Keep later edit'];
            profile = { id: 'another-admin', email: 'verified@example.com' };

            const result = await call('restore', {
                eventId: event.id,
                selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            });

            expect(result.restored).to.deep.equal([VARIATION]);
            expect(fragments.get(VARIATION).fields.map(({ values }) => values[0])).to.deep.equal(['Old', 'Keep later edit']);
            expect(result.event.changes[0]).to.include({ field: 'headline' });
            expect(result.event.changes[0].before).to.deep.equal(['New']);
            expect(result.event.changes[0].after).to.deep.equal(['Old']);
            expect(result.event.restoreMode).to.equal('state');
            expect(result.event.snapshot.fragments.map(({ id }) => id)).to.deep.equal([VARIATION]);
        });

        it('refuses to overwrite a newer value even with a current ETag', async () => {
            fragments.get(VARIATION).fields[0].values = ['Another user saved this'];
            fetchStub.resetHistory();

            await expectError(
                call('restore', {
                    eventId: event.id,
                    selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
                    expected: [{ fragmentId: VARIATION, etag: '"one"' }],
                }),
                409,
            );

            expect(fetchStub.getCalls().some(({ args }) => ['PUT', 'POST'].includes(args[1]?.method))).to.equal(false);
        });

        it('does not allow undoing fields outside the selected event', async () => {
            await expectError(
                call('restore', {
                    eventId: event.id,
                    selections: [{ fragmentId: VARIATION, fields: ['body'] }],
                    expected: [{ fragmentId: VARIATION, etag: '"one"' }],
                }),
                400,
            );
        });

        it('limits implicit undo to the fields changed by the event', async () => {
            fragments.get(VARIATION).fields[1].values = ['Keep later edit'];

            await call('restore', {
                eventId: event.id,
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            });

            expect(fragments.get(VARIATION).fields.map(({ values }) => values[0])).to.deep.equal(['Old', 'Keep later edit']);
        });

        it('restores a legacy undo result as a saved state rather than undoing the restoration', async () => {
            const first = await call('restore', {
                eventId: event.id,
                selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            });

            await call('restore', {
                requestId: 'undo-restore',
                eventId: first.event.id,
                selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            });

            expect(fragments.get(VARIATION).fields[0].values).to.deep.equal(['Old']);
        });

        it('refuses blindly retrying an undo after its writes succeeded but after snapshot capture failed', async () => {
            const posts = fetchStub.withArgs(
                sinon.match((url) => url.endsWith(`/${VARIATION}/versions`)),
                sinon.match({ method: 'POST' }),
            );
            posts.onCall(posts.callCount).resolves(response({}, 503));
            const payload = {
                eventId: event.id,
                selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            };
            let failure;
            try {
                await call('restore', payload);
            } catch (error) {
                failure = error;
            }
            expect(failure?.result).to.deep.equal({ restored: [VARIATION], failures: [], auditPending: true });
            fetchStub.resetHistory();

            await expectError(call('restore', payload), 409);

            expect(fetchStub.getCalls().some(({ args }) => ['POST', 'PUT', 'DELETE'].includes(args[1]?.method))).to.equal(
                false,
            );
            expect(fragments.get(VARIATION).fields[0].values).to.deep.equal(['Old']);
        });

        for (const [field, before] of [
            ['cardTitle', []],
            ['badge', ['<explicit_empty/>']],
        ]) {
            it(`restores raw ${field} inheritance or explicit-empty values without copying parent display text`, async () => {
                const parentId = '33333333-3333-4333-8333-333333333333';
                const parentPath = '/content/dam/mas/acom/en_US/card';
                fragments.set(parentId, {
                    ...makeVariation(),
                    id: parentId,
                    path: parentPath,
                    fields: [{ name: field, values: ['Parent display text'] }],
                });
                fragments.get(PROJECT).fields[0].values = [parentPath];
                fragments.get(VARIATION).fields.push({ name: field, values: before });
                const saved = await legacyBackup([VARIATION]);
                saved.restoreMode = 'undo';
                saved.changes = [{ fragmentId: VARIATION, field, before, after: ['Override'] }];
                stored.set(`promo-history.${PROJECT}.event.${saved.id}`, JSON.stringify(saved));
                fragments.get(VARIATION).fields.find(({ name }) => name === field).values = ['Override'];

                const result = await call('restore', {
                    eventId: saved.id,
                    selections: [{ fragmentId: VARIATION, fields: [field] }],
                    expected: [{ fragmentId: VARIATION, etag: '"one"' }],
                });

                expect(fragments.get(VARIATION).fields.find(({ name }) => name === field).values).to.deep.equal(before);
                expect(result.event.changes.find((change) => change.field === field).after).to.deep.equal(before);
                const entry = result.event.afterSnapshot.fragments[0];
                expect(
                    versions.get(`${entry.id}:${entry.versionId}`).fields.find(({ name }) => name === field).values,
                ).to.deep.equal(before);
                expect(fragments.get(parentId).fields[0].values).to.deep.equal(['Parent display text']);
            });
        }

        it('keeps audit listable but refuses undo when the native before version is missing', async () => {
            versions.clear();

            expect((await call('list')).events[0].id).to.equal(event.id);
            await expectError(
                call('restore', {
                    eventId: event.id,
                    selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
                    expected: [{ fragmentId: VARIATION, etag: '"one"' }],
                }),
                404,
            );
        });
    });

    for (const action of ['create', 'duplicate']) {
        it(`records ${action} after creation with a native after version but no creation undo`, async () => {
            const { event } = await call('record', { action, targetId: PROJECT });

            expect(event.action).to.equal(action);
            expect(event.user.id).to.equal('verified-user');
            expect(event.changes.find(({ field }) => field === '@title')).to.include({ before: null, after: 'Project' });
            expect(event.snapshot).to.deep.equal(event.afterSnapshot);
            expect(event).not.to.have.property('beforeSnapshot');
            expect(event.restoreMode).to.equal('state');
            expect(event.afterSnapshot.fragments).to.deep.equal([{ id: PROJECT, path: projectPath, versionId: 'version-1' }]);
            expect(versions.size).to.equal(1);
            await call('restore', {
                eventId: event.id,
                expected: [{ fragmentId: PROJECT, etag: '"one"' }],
            });
        });
    }

    for (const action of ['publish', 'unpublish']) {
        it(`audits ${action} with one native saved-state version`, async () => {
            fragments.get(PROJECT).status = action === 'publish' ? 'DRAFT' : 'PUBLISHED';
            const { intentId } = await call('record', { phase: 'prepare', action });
            fragments.get(PROJECT).status = action === 'publish' ? 'PUBLISHED' : 'UNPUBLISHED';

            const { event } = await call('record', { phase: 'complete', intentId });

            expect(event.action).to.equal(action);
            expect(event.targetId).to.equal(PROJECT);
            expect(event.snapshot).to.deep.equal(event.afterSnapshot);
            expect(event.publicationStatus).to.equal(action === 'publish' ? 'PUBLISHED' : 'UNPUBLISHED');
            expect(event.restoreMode).to.equal('state');
            expect(event).not.to.have.property('beforeSnapshot');
            expect(event.afterSnapshot.fragments.map(({ id }) => id)).to.deep.equal([PROJECT]);
            expect(versions.size).to.equal(1);
        });

        it(`rejects variation ${action} before allocating history or native versions`, async () => {
            await expectError(call('record', { phase: 'prepare', action, targetId: VARIATION }), 400);
            expect(state.put.called).to.equal(false);
            expect(versions.size).to.equal(0);
        });

        it(`rejects completion of legacy variation ${action} intents`, async () => {
            const { intentId } = await prepareSave({ targetId: VARIATION });
            for (const [key, serialized] of stored) {
                const entry = JSON.parse(serialized);
                if (entry.id === intentId) stored.set(key, JSON.stringify({ ...entry, action }));
            }
            await expectError(call('record', { phase: 'complete', intentId }), 400);
            expect(versions.size).to.equal(0);
        });

        it(`hides legacy variation ${action} before numbering visible versions`, async () => {
            const { event } = await completeSave({ targetId: VARIATION });
            stored.set(
                `promo-history.${PROJECT}.event.legacy-publication`,
                JSON.stringify({ ...event, id: 'legacy-publication', action, createdAt: '2020-01-01T00:00:00.000Z' }),
            );
            stored.set(
                `promo-history.${PROJECT}.event.legacy-path-only`,
                JSON.stringify({
                    ...event,
                    id: 'legacy-path-only',
                    action,
                    targetId: undefined,
                    createdAt: '2020-01-01T00:00:00.000Z',
                }),
            );
            const { events } = await call('list');
            expect(events.map(({ id, version }) => ({ id, version }))).to.deep.equal([{ id: event.id, version: 1 }]);
        });
    }

    it('rejects default-fragment content audits even when referenced by the project', async () => {
        const shared = { ...makeVariation(), path: '/content/dam/mas/acom/en_US/shared-card' };
        fragments.set(VARIATION, shared);
        fragments.get(PROJECT).fields[0].values = [shared.path];
        await expectError(call('record', { phase: 'prepare', action: 'save', targetId: VARIATION }), 403);
        expect(versions.size).to.equal(0);
    });

    it('hides legacy default-content entries while retaining project membership changes', async () => {
        const sharedPath = '/content/dam/mas/acom/en_US/shared-card';
        const base = {
            id: 'legacy-default',
            projectId: PROJECT,
            targetId: VARIATION,
            targetPath: sharedPath,
            createdAt: new Date().toISOString(),
            action: 'save',
            user: profile,
            changes: [{ fragmentId: VARIATION, path: sharedPath, field: 'headline', before: ['Old'], after: ['New'] }],
        };
        stored.set(`promo-history.${PROJECT}.event.legacy-default`, JSON.stringify(base));
        stored.set(
            `promo-history.${PROJECT}.event.membership`,
            JSON.stringify({
                ...base,
                id: 'membership',
                targetId: PROJECT,
                targetPath: projectPath,
                changes: [
                    { fragmentId: PROJECT, path: projectPath, field: 'fragments', before: [], after: [sharedPath] },
                    ...base.changes,
                ],
            }),
        );
        const { events } = await call('list');
        expect(events.map(({ id }) => id)).to.deep.equal(['membership']);
        expect(events[0].changes.map(({ field }) => field)).to.deep.equal(['fragments']);
    });

    for (const action of ['publish', 'unpublish']) {
        it(`reconciles ${action} in place without creating another version or changing saved content`, async () => {
            const target = fragments.get(PROJECT);
            target.status = action === 'publish' ? 'MODIFIED' : 'PUBLISHED';
            const { intentId } = await call('record', { phase: 'prepare', action });
            const { event } = await call('record', {
                phase: 'complete',
                intentId,
                workflowInstanceId: 'workflow-one',
            });
            expect(event.publicationOutcome).to.equal('pending');
            const count = versions.size;
            workflows.set('workflow-one', {
                type: `${action}-fragments`,
                state: 'COMPLETED',
                end: new Date().toISOString(),
                invalidFragments: [],
            });
            target.status = action === 'publish' ? 'PUBLISHED' : 'UNPUBLISHED';
            target.title = 'Later draft';
            const listed = (await call('list', { eventIds: [event.id] })).events[0];
            expect(listed.id).to.equal(event.id);
            expect(listed.createdAt).to.equal(event.createdAt);
            expect(listed.publicationOutcome).to.equal('confirmed');
            expect(listed.snapshot).to.deep.equal(event.snapshot);
            expect(versions.size).to.equal(count);
            const persisted = [...stored.values()].map((value) => JSON.parse(value)).find((value) => value.id === event.id);
            expect(persisted.publicationOutcome).to.equal('confirmed');
            expect((await call('list', { eventIds: ['99999999-9999-4999-8999-999999999999'] })).events).to.deep.equal([]);
        });
    }

    it('marks a completed workflow with an invalid target as failed, not published', async () => {
        fragments.get(PROJECT).status = 'MODIFIED';
        const { intentId } = await call('record', { phase: 'prepare', action: 'publish' });
        await call('record', { phase: 'complete', intentId, workflowInstanceId: 'workflow-one' });
        workflows.set('workflow-one', {
            type: 'publish-fragments',
            state: 'COMPLETED',
            end: new Date().toISOString(),
            invalidFragments: [{ fragmentPath: projectPath, invalidReferences: [] }],
        });
        expect((await call('list')).events[0].publicationOutcome).to.equal('failed');
    });

    it('captures publication even when AEM finishes while its snapshot is being created', async () => {
        fragments.get(PROJECT).status = 'MODIFIED';
        const { intentId } = await call('record', { phase: 'prepare', action: 'publish' });
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith(`/${PROJECT}/versions`)),
                sinon.match({ method: 'POST' }),
            )
            .onFirstCall()
            .callsFake(async () => {
                fragments.get(PROJECT).status = 'PUBLISHED';
                const id = 'published-version';
                versions.set(`${PROJECT}:${id}`, structuredClone(fragments.get(PROJECT)));
                return response({}, 201, null, { location: `/adobe/sites/cf/fragments/${PROJECT}/versions/${id}` });
            });
        const { event } = await call('record', { phase: 'complete', intentId, workflowInstanceId: 'workflow-one' });
        workflows.set('workflow-one', {
            type: 'publish-fragments',
            state: 'COMPLETED',
            end: new Date().toISOString(),
            invalidFragments: [],
        });
        expect((await call('list', { eventIds: [event.id] })).events[0].publicationOutcome).to.equal('confirmed');
        expect(versions.size).to.equal(1);
    });

    it('restores project membership without modifying the referenced default fragment', async () => {
        const shared = { ...makeVariation(), path: '/content/dam/mas/acom/en_US/default-card' };
        fragments.set(VARIATION, shared);
        fragments.get(PROJECT).fields[0].values = [shared.path];
        const { intentId } = await prepareSave();
        fragments.get(PROJECT).fields[0].values = [];
        const { event } = await call('record', { phase: 'complete', intentId });
        fragments.get(PROJECT).fields[0].values = [shared.path];
        shared.fields[0].values = ['Independent default edit'];
        await call('restore', {
            eventId: event.id,
            selections: [{ fragmentId: PROJECT, fields: ['fragments'] }],
            expected: [{ fragmentId: PROJECT, etag: '"one"' }],
        });
        expect(fragments.get(PROJECT).fields[0].values).to.deep.equal([]);
        expect(shared.fields[0].values).to.deep.equal(['Independent default edit']);
        expect(
            fetchStub.getCalls().some(({ args }) => args[0].endsWith(`/${VARIATION}`) && args[1]?.method === 'PUT'),
        ).to.equal(false);
    });

    it('rejects invalid targeted-refresh IDs rather than expanding the history query', async () => {
        for (const eventIds of [[], ['not-an-id'], 'all', Array(101).fill(PROJECT)]) {
            await expectError(call('list', { eventIds }), 400);
        }
    });

    it('records an ended, non-completed workflow as failed', async () => {
        fragments.get(PROJECT).status = 'MODIFIED';
        const { intentId } = await call('record', { phase: 'prepare', action: 'publish' });
        await call('record', { phase: 'complete', intentId, workflowInstanceId: 'workflow-one' });
        workflows.set('workflow-one', {
            type: 'publish-fragments',
            state: 'ABORTED',
            end: new Date().toISOString(),
        });
        expect((await call('list')).events[0].publicationOutcome).to.equal('failed');
    });

    it('keeps scheduled or running workflows pending even if the previous lifecycle status was published', async () => {
        fragments.get(PROJECT).status = 'PUBLISHED';
        const { intentId } = await call('record', { phase: 'prepare', action: 'publish' });
        await call('record', { phase: 'complete', intentId, workflowInstanceId: 'workflow-one' });
        workflows.set('workflow-one', { type: 'publish-fragments', state: 'RUNNING' });
        fragments.get(PROJECT).operations = { replication: { action: 'PUBLISH', status: 'SCHEDULED' } };
        const event = (await call('list')).events[0];
        expect(event.publicationOutcome).to.equal('pending');
        expect(event.publicationOperation.status).to.equal('SCHEDULED');
    });

    it('does not falsely confirm an unavailable workflow or hide the verification failure', async () => {
        fragments.get(PROJECT).status = 'MODIFIED';
        const { intentId } = await call('record', { phase: 'prepare', action: 'publish' });
        await call('record', { phase: 'complete', intentId, workflowInstanceId: 'missing-workflow' });
        fragments.get(PROJECT).status = 'PUBLISHED';
        const event = (await call('list')).events[0];
        expect(event.publicationOutcome).to.equal('pending');
        expect(event.publicationCheckError).to.be.a('string');
    });

    it('labels a workflow without verification state unavailable rather than indefinitely pending', async () => {
        const { intentId } = await call('record', { phase: 'prepare', action: 'unpublish' });
        await call('record', { phase: 'complete', intentId, workflowInstanceId: 'workflow-one' });
        workflows.set('workflow-one', { type: 'unpublish-fragments' });
        const event = (await call('list')).events[0];
        expect(event.publicationOutcome).to.equal('pending');
        expect(event.publicationCheckError).to.be.a('string');
    });

    for (const [action, status] of [
        ['publish', 'MODIFIED'],
        ['unpublish', 'DRAFT'],
    ]) {
        it(`confirms completed ${action} workflow despite stale lifecycle and replication metadata`, async () => {
            fragments.get(PROJECT).status = status;
            const { intentId } = await call('record', { phase: 'prepare', action });
            await call('record', { phase: 'complete', intentId, workflowInstanceId: 'workflow-one' });
            workflows.set('workflow-one', { type: `${action}-fragments`, state: 'COMPLETED', invalidFragments: [] });
            fragments.get(PROJECT).operations = { replication: { action: action.toUpperCase(), status: 'COMPLETED' } };
            const event = (await call('list')).events[0];
            expect(event.publicationOutcome).to.equal('confirmed');
            expect(event.publicationStatus).to.equal(status);
        });
    }

    it('recognizes terminal replication metadata on a changed unpublish lifecycle', async () => {
        fragments.get(PROJECT).status = 'PUBLISHED';
        const { intentId } = await call('record', { phase: 'prepare', action: 'unpublish' });
        fragments.get(PROJECT).status = 'UNPUBLISHED';
        fragments.get(PROJECT).operations = { replication: { action: 'UNPUBLISH', status: 'COMPLETED' } };
        const { event } = await call('record', { phase: 'complete', intentId });
        expect(event.publicationOutcome).to.equal('confirmed');
    });

    it('refreshes terminal lifecycle against the original baseline, not the persisted pending status', async () => {
        fragments.get(PROJECT).status = 'PUBLISHED';
        const { intentId } = await call('record', { phase: 'prepare', action: 'unpublish' });
        fragments.get(PROJECT).status = 'UNPUBLISHED';
        fragments.get(PROJECT).operations = { replication: 'PENDING' };
        await call('record', { phase: 'complete', intentId });
        delete fragments.get(PROJECT).operations;
        expect((await call('list')).events[0].publicationOutcome).to.equal('confirmed');
    });

    for (const state of ['SCHEDULED', 'ACCEPTED', 'RUNNING']) {
        it(`does not confirm ${state} operations even with completed workflow metadata`, async () => {
            fragments.get(PROJECT).status = 'PUBLISHED';
            const { intentId } = await call('record', { phase: 'prepare', action: 'publish' });
            await call('record', { phase: 'complete', intentId, workflowInstanceId: 'workflow-one' });
            workflows.set('workflow-one', { type: 'publish-fragments', state: 'COMPLETED' });
            fragments.get(PROJECT).operations = { replication: { status: state } };
            expect((await call('list')).events[0].publicationOutcome).to.equal('pending');
        });
    }

    it('preserves explicit replication failure rather than leaving it pending indefinitely', async () => {
        const { intentId } = await call('record', { phase: 'prepare', action: 'publish' });
        fragments.get(PROJECT).operations = { replication: { status: 'FAILED' } };
        const { event } = await call('record', { phase: 'complete', intentId });
        expect(event.publicationOutcome).to.equal('failed');
    });

    it('does not authorize an existing unrelated fragment as an audit target', async () => {
        const id = '33333333-3333-4333-8333-333333333333';
        fragments.set(id, { ...makeVariation(), id, path: '/content/dam/mas/acom/en_US/unrelated' });

        await expectError(call('record', { phase: 'prepare', action: 'save', targetId: id }), 403);

        expect(stored.size).to.equal(0);
    });

    it('audits deletion of a promo variation even when the project still references its deleted path', async () => {
        const { intentId } = await call('record', { phase: 'prepare', action: 'delete', targetId: VARIATION });
        fragments.delete(VARIATION);

        const { event } = await call('record', { phase: 'complete', intentId });

        expect(event).to.include({ action: 'delete', targetId: VARIATION, targetPath: variationPath });
        expect(event.changes.find(({ field }) => field === 'headline').before).to.deep.equal(['Old']);
        expect(event).not.to.have.property('afterSnapshot');
        expect(versions.size).to.equal(0);
    });

    it('rejects save completion if the target changes before its native version is captured', async () => {
        const { intentId } = await prepareSave();
        fragments.get(PROJECT).title = 'Saved';
        fetchStub.resetHistory();
        fetchStub
            .withArgs(sinon.match((url) => url.endsWith(`/${PROJECT}`)))
            .onSecondCall()
            .resolves(response({ ...makeProject(), title: 'Concurrent edit' }));

        await expectError(call('record', { phase: 'complete', intentId }), 409);

        expect((await call('list')).events).to.have.length(0);
    });

    it('filters user action fragment dates and text with stable pagination', async () => {
        await legacyBackup();
        const { intentId } = await call('record', { phase: 'prepare', action: 'save', targetId: VARIATION, requestId: 'two' });
        fragments.get(VARIATION).fields[0].values = ['Searchable'];
        await call('record', { phase: 'complete', intentId, requestId: 'two' });
        const result = await call('list', {
            user: 'verified@example.com',
            action: 'save',
            fragmentId: VARIATION,
            from: '2020-01-01',
            to: '2099-01-01',
            query: 'Searchable',
            limit: 1,
        });
        expect(result.events).to.have.length(1);
        expect(result.events[0].action).to.equal('save');
        const page = await call('list', { limit: 1 });
        expect(page.cursor).to.be.a('string');
        expect((await call('list', { limit: 1, cursor: page.cursor })).events).to.have.length(1);
    });

    it('numbers versions chronologically before searching and paginating', async () => {
        const backup = await legacyBackup();
        const creation = { ...backup, id: 'creation', action: 'create', createdAt: '2026-01-01T10:00:00Z' };
        const saved = { ...backup, id: 'saved', action: 'save', createdAt: '2026-01-02T10:00:00Z' };
        stored.clear();
        for (const event of [saved, creation]) {
            stored.set(`promo-history.${PROJECT}.event.${event.id}`, JSON.stringify(event));
        }

        const page = await call('list', { limit: 1 });
        const next = await call('list', { limit: 1, cursor: page.cursor });
        const searched = await call('list', { query: 'creation' });

        expect(page.events[0]).to.include({ id: 'saved', version: 2 });
        expect(next.events[0]).to.include({ id: 'creation', version: 1 });
        expect(searched.events[0]).to.include({ id: 'creation', version: 1 });
    });

    it('preflights all ETags and does no writes on conflict', async () => {
        const event = await legacyBackup();
        await expectError(
            call('restore', {
                eventId: event.id,
                expected: [
                    { fragmentId: PROJECT, etag: '"one"' },
                    { fragmentId: VARIATION, etag: '"stale"' },
                ],
            }),
            409,
        );
        expect(fetchStub.getCalls().some(({ args }) => args[1]?.method === 'PUT')).to.equal(false);
    });

    it('selectively restores historical values preserving unrelated current fields and never publishes', async () => {
        const event = await legacyBackup();
        fragments.get(VARIATION).fields[0].values = ['Changed'];
        fragments.get(VARIATION).fields[1].values = ['Keep'];
        const result = await call('restore', {
            requestId: 'restore-one',
            eventId: event.id,
            selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        });
        expect(fragments.get(VARIATION).fields.map((field) => field.values[0])).to.deep.equal(['Old', 'Keep']);
        expect(result.restored).to.deep.equal([VARIATION]);
        const entry = event.snapshot.fragments.find((fragment) => fragment.id === VARIATION);
        expect(
            fetchStub.calledWithMatch(sinon.match((url) => url.endsWith(`/${VARIATION}/versions/${entry.versionId}`))),
        ).to.equal(true);
        const writes = fetchStub.getCalls().filter(({ args }) => args[1]?.method === 'PUT');
        expect(writes[0].args[1].headers['If-Match']).to.equal('"one"');
        expect(fetchStub.getCalls().some(({ args }) => /publish|versions\/restore/.test(args[0]))).to.equal(false);
        expect((await call('list', { action: 'restore' })).events).to.have.length(1);
    });

    it('rejects missing historical fragments before any write and never recreates them', async () => {
        const event = await legacyBackup();
        fragments.delete(VARIATION);
        fetchStub.resetHistory();
        await expectError(
            call('restore', {
                eventId: event.id,
                expected: [
                    { fragmentId: PROJECT, etag: '"one"' },
                    { fragmentId: VARIATION, etag: '"one"' },
                ],
            }),
            404,
        );
        expect(fetchStub.getCalls().some(({ args }) => ['PUT', 'POST'].includes(args[1]?.method))).to.equal(false);
    });

    it('rejects empty selections and missing expected ETags', async () => {
        const event = await legacyBackup();
        await expectError(call('restore', { eventId: event.id, selections: [], expected: [] }), 400);
        await expectError(call('restore', { eventId: event.id, selections: [{ fragmentId: PROJECT }] }), 400);
    });

    it('audits confirmed deletion using the original verified intent, not client before data', async () => {
        const { intentId } = await call('record', { phase: 'prepare', action: 'delete', targetId: PROJECT });
        fragments.delete(PROJECT);
        const { event } = await call('record', { phase: 'complete', intentId, before: { title: 'forged' } });
        expect(event.action).to.equal('delete');
        expect(event.changes.some((change) => change.before === 'Project')).to.equal(true);
    });

    it('audits project deletion without fetching versions of the deleted fragment', async () => {
        const { intentId } = await call('record', { phase: 'prepare', action: 'delete' });
        fragments.delete(PROJECT);
        versions.clear();
        fetchStub.resetHistory();
        const { event } = await call('record', { phase: 'complete', intentId });
        expect(event.changes.some((change) => change.field === '@title' && change.before === 'Project')).to.equal(true);
        expect(event).not.to.have.property('afterSnapshot');
        expect(fetchStub.getCalls().some(({ args }) => args[0].includes('/versions/'))).to.equal(false);
    });

    it('rejects intent completion by a different verified identity', async () => {
        const { intentId } = await call('record', { phase: 'prepare', action: 'save' });
        profile.id = 'another-user';
        await expectError(call('record', { phase: 'complete', intentId }), 403);
    });

    it('rejects arbitrary targets outside the project scope', async () => {
        await expectError(
            call('record', {
                phase: 'prepare',
                action: 'save',
                targetId: '33333333-3333-4333-8333-333333333333',
            }),
            403,
        );
    });

    it('rejects post-hoc save events without a verified before intent', async () => {
        await expectError(call('record', { action: 'save', before: makeProject() }), 400);
    });

    it('rejects a project the caller cannot read', async () => {
        fetchStub.callsFake(async () => response({}, 403));
        await expectError(call('list'), 403);
        expect(state.put.called).to.equal(false);
    });

    it('permits promotion power users to restore through the server-side LDAP cache', async () => {
        const event = await legacyBackup();
        roles = ['grp-odin-mas-promo-powerusers'];
        const result = await call('restore', {
            eventId: event.id,
            selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        });
        expect(result.restored).to.deep.equal([VARIATION]);
    });

    it('preflights missing historical references before all writes', async () => {
        const event = await legacyBackup();
        fragments.delete(VARIATION);
        await expectError(
            call('restore', {
                eventId: event.id,
                selections: [{ fragmentId: PROJECT, fields: ['fragments'] }],
                expected: [{ fragmentId: PROJECT, etag: '"one"' }],
            }),
            404,
        );
        expect(fetchStub.getCalls().some(({ args }) => args[1]?.method === 'PUT')).to.equal(false);
    });

    it('reports partial restore writes and persists their actual outcome', async () => {
        const event = await legacyBackup();
        fragments.get(PROJECT).title = 'New project title';
        fragments.get(VARIATION).fields[0].values = ['New headline'];
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith(VARIATION)),
                sinon.match({ method: 'PUT' }),
            )
            .resolves(response({}, 412));
        const result = await call('restore', {
            eventId: event.id,
            expected: [
                { fragmentId: PROJECT, etag: '"one"' },
                { fragmentId: VARIATION, etag: '"one"' },
            ],
        });
        expect(result.restored).to.deep.equal([PROJECT]);
        expect(result.failures).to.deep.equal([
            {
                fragmentId: VARIATION,
                statusCode: 412,
                error: 'Draft restore failed',
            },
        ]);
        expect(result.event.restored).to.deep.equal([PROJECT]);
        expect(result.event.snapshot.fragments.map(({ id }) => id)).to.deep.equal([PROJECT]);
        expect(result.event.afterSnapshot.fragments.map(({ id }) => id)).to.deep.equal([PROJECT]);
        expect(result.event.changes.some((change) => change.fragmentId === VARIATION)).to.equal(false);
    });

    for (const partial of [false, true]) {
        it(`reports auditPending without masking ${partial ? 'partial' : 'successful'} restores if after capture fails`, async () => {
            const event = await legacyBackup();
            fragments.get(PROJECT).title = 'New title';
            fragments.get(VARIATION).fields[0].values = ['New headline'];
            if (partial) {
                fetchStub
                    .withArgs(
                        sinon.match((url) => url.endsWith(VARIATION)),
                        sinon.match({ method: 'PUT' }),
                    )
                    .resolves(response({}, 412));
            }
            const posts = fetchStub.withArgs(
                sinon.match((url) => url.endsWith(`/${PROJECT}/versions`)),
                sinon.match({ method: 'POST' }),
            );
            posts.onFirstCall().resolves(response({}, 503));
            let failure;
            try {
                await call('restore', {
                    eventId: event.id,
                    expected: [
                        { fragmentId: PROJECT, etag: '"one"' },
                        { fragmentId: VARIATION, etag: '"one"' },
                    ],
                });
            } catch (error) {
                failure = error;
            }

            expect(failure?.statusCode).to.equal(503);
            expect(failure.result.auditPending).to.equal(true);
            expect(failure.result.restored).to.deep.equal(partial ? [PROJECT] : [PROJECT, VARIATION]);
            expect(failure.result.failures).to.have.length(partial ? 1 : 0);
            expect(fragments.get(PROJECT).title).to.equal('Project');
            expect((await call('list', { action: 'restore' })).events).to.have.length(0);
        });
    }

    it('captures native actual content after a partially failed tags restore', async () => {
        fragments.get(VARIATION).tags = [{ id: 'mas:old' }];
        const event = await legacyBackup();
        fragments.get(VARIATION).fields[0].values = ['New headline'];
        fragments.get(VARIATION).tags = [{ id: 'mas:new' }];
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith(`/${VARIATION}/tags`)),
                sinon.match({ method: 'PUT' }),
            )
            .resolves(response({}, 412));

        const result = await call('restore', {
            eventId: event.id,
            selections: [{ fragmentId: VARIATION, fields: ['headline', '@tags'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        });

        expect(result.restored).to.deep.equal([]);
        expect(result.failures[0]).to.include({ fragmentId: VARIATION, partial: true });
        const entry = result.event.afterSnapshot.fragments[0];
        const actual = versions.get(`${entry.id}:${entry.versionId}`);
        expect(actual.fields[0].values).to.deep.equal(['Old']);
        expect(actual.tags).to.deep.equal([{ id: 'mas:new' }]);
        expect(result.event).not.to.have.property('beforeSnapshot');
    });

    for (const resource of ['content', 'tags']) {
        it(`retains partial-write evidence when post-PUT ${resource} confirmation fails`, async () => {
            fragments.get(VARIATION).tags = [{ id: 'mas:old' }];
            const event = await legacyBackup();
            fragments.get(VARIATION).fields[0].values = ['New headline'];
            fragments.get(VARIATION).tags = [{ id: 'mas:new' }];
            const reads = fetchStub.withArgs(
                sinon.match((url) => url.endsWith(`/${VARIATION}${resource === 'tags' ? '/tags' : ''}`)),
                sinon.match((options) => options.method === undefined),
            );
            reads.onCall(1).resolves(response({}, 503));
            const result = await call('restore', {
                eventId: event.id,
                selections: [{ fragmentId: VARIATION, fields: ['headline', '@tags'] }],
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            });
            expect(result.failures[0]).to.include({ fragmentId: VARIATION, partial: true });
            expect(result.event.changes.find(({ field }) => field === 'headline').after).to.deep.equal(['Old']);
            expect(result.event.afterSnapshot.fragments[0].id).to.equal(VARIATION);
        });
    }

    it('reports auditPending when committed content cannot be read back at all', async () => {
        const event = await legacyBackup();
        const puts = fetchStub.withArgs(
            sinon.match((url) => url.endsWith(`/${VARIATION}`)),
            sinon.match({ method: 'PUT' }),
        );
        puts.callsFake(async (url, options) => {
            fragments.set(VARIATION, { ...fragments.get(VARIATION), ...JSON.parse(options.body) });
            fetchStub
                .withArgs(
                    sinon.match((value) => value.endsWith(`/${VARIATION}`)),
                    sinon.match((value) => value.method === undefined),
                )
                .resolves(response({}, 503));
            return response(fragments.get(VARIATION));
        });
        let failure;
        try {
            await call('restore', {
                eventId: event.id,
                selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            });
        } catch (error) {
            failure = error;
        }
        expect(failure?.result.auditPending).to.equal(true);
        expect(failure.result.failures[0].partial).to.equal(true);
        expect((await call('list', { action: 'restore' })).events).to.have.length(0);
    });

    it('does not audit an unacknowledged committed tags-only write as an unchanged failure', async () => {
        fragments.get(VARIATION).tags = [{ id: 'mas:old' }];
        const event = await legacyBackup([VARIATION]);
        fragments.get(VARIATION).tags = [{ id: 'mas:new' }];
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith(`/${VARIATION}/tags`)),
                sinon.match({ method: 'PUT' }),
            )
            .callsFake(async () => {
                fragments.get(VARIATION).tags = [{ id: 'mas:old' }];
                throw new Error('Connection closed after the write');
            });
        let failure;
        try {
            await call('restore', {
                eventId: event.id,
                selections: [{ fragmentId: VARIATION, fields: ['@tags'] }],
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            });
        } catch (error) {
            failure = error;
        }
        expect(failure?.result.auditPending).to.equal(true);
        expect(failure.result.failures[0].partial).to.equal(true);
        expect((await call('list', { action: 'restore' })).events).to.have.length(0);
    });

    it('returns completed restore audit and native references unchanged on retry without more AEM writes', async () => {
        const source = await legacyBackup();
        fragments.get(VARIATION).fields[0].values = ['New'];
        const payload = {
            eventId: source.id,
            selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        };
        const completed = await call('restore', payload);
        fetchStub.resetHistory();

        const retry = await call('restore', payload);

        expect(retry).to.deep.equal(JSON.parse(JSON.stringify(completed)));
        expect(fetchStub.getCalls().some(({ args }) => ['POST', 'PUT', 'DELETE'].includes(args[1]?.method))).to.equal(false);
        expect((await call('list', { action: 'restore' })).events).to.have.length(1);
    });

    it('restores metadata while preserving unrelated metadata and field values', async () => {
        const event = await legacyBackup();
        fragments.get(VARIATION).title = 'Changed';
        fragments.get(VARIATION).description = 'Keep description';
        await call('restore', {
            eventId: event.id,
            selections: [{ fragmentId: VARIATION, fields: ['@title'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        });
        expect(fragments.get(VARIATION).title).to.equal('Card');
        expect(fragments.get(VARIATION).description).to.equal('Keep description');
    });

    it('never overwrites shared default fragment content in a full restore', async () => {
        const shared = makeVariation();
        shared.id = '33333333-3333-4333-8333-333333333333';
        shared.path = '/content/dam/mas/acom/en_US/shared-card';
        fragments.set(shared.id, shared);
        fragments.get(PROJECT).fields[0].values.push(shared.path);
        const event = await legacyBackup();
        shared.fields[0].values = ['Keep shared content'];

        await call('restore', {
            eventId: event.id,
            expected: [
                { fragmentId: PROJECT, etag: '"one"' },
                { fragmentId: VARIATION, etag: '"one"' },
            ],
        });

        expect(fragments.get(shared.id).fields[0].values).to.deep.equal(['Keep shared content']);
    });

    it('rejects request ID reuse across different operations', async () => {
        const event = await legacyBackup();
        await expectError(call('restore', { requestId: 'request-one', eventId: event.id, expected: [] }), 409);
    });

    it('checks the selected restore targets before retrying a request ID', async () => {
        const event = await legacyBackup();
        const payload = {
            eventId: event.id,
            selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        };
        await call('restore', payload);
        await expectError(
            call('restore', {
                ...payload,
                selections: [{ fragmentId: PROJECT, fields: ['@title'] }],
            }),
            409,
        );
    });

    it('refuses events that exceed bounded storage before any restore write', async () => {
        const event = await legacyBackup();
        fragments.get(VARIATION).fields[1].values = ['x'.repeat(800000)];
        await expectError(
            call('restore', {
                eventId: event.id,
                selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
                expected: [{ fragmentId: VARIATION, etag: '"one"' }],
            }),
            413,
        );
        expect(fetchStub.getCalls().some(({ args }) => args[1]?.method === 'PUT')).to.equal(false);
    });

    it('records an unchanged project publication only as pending', async () => {
        const { intentId } = await call('record', { phase: 'prepare', action: 'publish' });
        const { event } = await call('record', { phase: 'complete', intentId });
        expect(event.publicationOutcome).to.equal('pending');
        expect(event).not.to.have.property('publicationStatus');
    });

    it('supports prepare after a new project is created with a historical empty baseline', async () => {
        const { intentId } = await call('record', { phase: 'prepare', action: 'create', targetId: PROJECT });
        const { event } = await call('record', { phase: 'complete', intentId });
        expect(event.action).to.equal('create');
        expect(event.changes.find((change) => change.fragmentId === PROJECT && change.field === '@title').before).to.equal(
            null,
        );
    });

    it('captures an untagged copied variation from a verified future target path', async () => {
        fragments.delete(VARIATION);
        const shared = makeVariation();
        shared.id = '33333333-3333-4333-8333-333333333333';
        shared.path = '/content/dam/mas/acom/en_US/card';
        shared.fields = [];
        fragments.set(shared.id, shared);
        fragments.get(PROJECT).fields[0].values = [shared.path];
        const { intentId } = await call('record', { phase: 'prepare', action: 'create', targetPath: variationPath });
        fragments.set(VARIATION, makeVariation());
        const { event } = await call('record', { phase: 'complete', intentId, targetId: VARIATION });
        expect(event.targetId).to.equal(VARIATION);
        expect(event.changes.some(({ fragmentId }) => fragmentId === VARIATION)).to.equal(true);
        expect(event.snapshot).to.deep.equal(event.afterSnapshot);
        expect(event).not.to.have.property('beforeSnapshot');
        expect(event.restoreMode).to.equal('state');
        expect(event.afterSnapshot.fragments).to.deep.equal([{ id: VARIATION, path: variationPath, versionId: 'version-1' }]);
    });

    it('restores tags through the ETag-protected tags API, not ignored fragment PUT properties', async () => {
        fragments.get(VARIATION).tags = [{ id: 'mas:old' }];
        const event = await legacyBackup();
        fragments.get(VARIATION).tags = [{ id: 'mas:new' }];
        const { restored } = await call('restore', {
            eventId: event.id,
            selections: [{ fragmentId: VARIATION, fields: ['@tags'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        });
        expect(restored).to.deep.equal([VARIATION]);
        const write = fetchStub.getCalls().find(({ args }) => args[0].endsWith('/tags') && args[1]?.method === 'PUT');
        expect(write.args[1].headers['If-Match']).to.equal('"one"');
        expect(JSON.parse(write.args[1].body)).to.deep.equal({ tags: ['mas:old'] });
    });

    it('versions only the restored target once after the restore', async () => {
        const event = await legacyBackup();
        fragments.get(VARIATION).fields[0].values = ['Changed'];
        const versionCount = versions.size;
        const result = await call('restore', {
            eventId: event.id,
            selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        });
        expect(result.event.restoreMode).to.equal('state');
        expect(result.event.snapshot.fragments.map(({ id }) => id)).to.deep.equal([VARIATION]);
        expect(result.event).not.to.have.property('beforeSnapshot');
        expect(result.event.afterSnapshot.fragments.map(({ id }) => id)).to.deep.equal([VARIATION]);
        const after = result.event.afterSnapshot.fragments[0];
        expect(versions.get(`${after.id}:${after.versionId}`).fields[0].values).to.deep.equal(['Old']);
        expect(versions.size).to.equal(versionCount + 1);
    });

    it('full fragment restore replaces the historical field set instead of retaining later additions', async () => {
        const event = await legacyBackup();
        fragments.get(VARIATION).fields.push({ name: 'later', values: ['Added later'] });
        await call('restore', {
            eventId: event.id,
            selections: [{ fragmentId: VARIATION }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        });
        expect(fragments.get(VARIATION).fields.map(({ name }) => name)).not.to.include('later');
    });

    it('deduplicates concurrent retries by request ID without mutable shared indexes', async () => {
        const results = await Promise.all([
            call('record', { action: 'create', targetId: PROJECT }),
            call('record', { action: 'create', targetId: PROJECT }),
        ]);
        expect(results[0].event.id).to.equal(results[1].event.id);
        expect((await call('list')).events).to.have.length(1);
    });

    it('retains independent simultaneous writes as separate events', async () => {
        await Promise.all([
            call('record', { action: 'create', targetId: PROJECT, requestId: 'one' }),
            call('record', { action: 'create', targetId: PROJECT, requestId: 'two' }),
        ]);
        expect((await call('list')).events).to.have.length(2);
    });

    it('uses bounded parallel state reads for retained history', async () => {
        for (let index = 0; index < 25; index++) {
            stored.set(
                `promo-history.${PROJECT}.event.${index}`,
                JSON.stringify({
                    id: `${index}`,
                    createdAt: new Date().toISOString(),
                    projectId: PROJECT,
                    changes: [],
                    user: profile,
                }),
            );
        }
        const originalGet = state.get;
        let active = 0;
        let peak = 0;
        state.get = async (key) => {
            active++;
            peak = Math.max(peak, active);
            await new Promise((resolve) => setImmediate(resolve));
            const value = await originalGet(key);
            active--;
            return value;
        };
        expect((await call('list')).events).to.have.length(25);
        expect(peak).to.be.within(2, 10);
    });

    it('prefers a successful concurrent restore over an older failed duplicate and retains attempt evidence', async () => {
        const base = {
            id: '55555555-5555-4555-8555-555555555555',
            action: 'restore',
            projectId: PROJECT,
            requestId: 'restore-request',
            user: profile,
            changes: [],
        };
        stored.set(
            `promo-history.${PROJECT}.event.first`,
            JSON.stringify({
                ...base,
                createdAt: '2026-01-01T00:00:00.000Z',
                restored: [],
                failures: [{ fragmentId: PROJECT, statusCode: 412 }],
            }),
        );
        stored.set(
            `promo-history.${PROJECT}.event.second`,
            JSON.stringify({ ...base, createdAt: '2026-01-01T00:00:01.000Z', restored: [PROJECT] }),
        );
        const { events } = await call('list');
        expect(events).to.have.length(1);
        expect(events[0].restored).to.deep.equal([PROJECT]);
        expect(events[0].concurrentAttempts).to.have.length(1);
        expect(events[0].concurrentAttempts[0].failures[0].statusCode).to.equal(412);
        expect([...stored.keys()].filter((key) => key.includes('.event.'))).to.have.length(2);
    });

    it('retains the successful ETag-protected result when identical restores race across invocations', async () => {
        const source = await legacyBackup([VARIATION]);
        fragments.get(VARIATION).fields[0].values = ['New'];
        let etag = '"one"';
        let writes = 0;
        let successStored;
        const successfulAudit = new Promise((resolve) => {
            successStored = resolve;
        });
        const originalPut = state.put;
        state.put = async (key, value, options) => {
            const entry = JSON.parse(value);
            if (entry.action === 'restore' && entry.failures?.length) await successfulAudit;
            await originalPut(key, value, options);
            if (entry.action === 'restore' && entry.restored?.length) successStored();
        };
        fetchStub.withArgs(sinon.match((url) => url.endsWith(`/${VARIATION}`))).callsFake(async (url, options) => {
            if (options.method === 'PUT') {
                if (options.headers['If-Match'] !== etag) return response({}, 412);
                writes++;
                etag = '"two"';
                fragments.set(VARIATION, { ...fragments.get(VARIATION), ...JSON.parse(options.body) });
            }
            return response(fragments.get(VARIATION), 200, etag);
        });
        const payload = {
            eventId: source.id,
            selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        };
        const results = await Promise.all([call('restore', payload), call('restore', payload)]);
        expect(writes).to.equal(1);
        for (const result of results) {
            expect(result.restored).to.deep.equal([VARIATION]);
            expect(result).not.to.have.property('failures');
        }
        const listed = (await call('list', { action: 'restore' })).events;
        expect(listed).to.have.length(1);
        expect(listed[0].restored).to.deep.equal([VARIATION]);
        expect(listed[0].concurrentAttempts[0].failures[0].statusCode).to.equal(412);
        const retry = await call('restore', payload);
        expect(retry.restored).to.deep.equal([VARIATION]);
        expect(writes).to.equal(1);
    });
});

async function expectError(promise, statusCode) {
    try {
        await promise;
        expect.fail('Expected rejection');
    } catch (error) {
        expect(error.statusCode, error.message).to.equal(statusCode);
    }
}
