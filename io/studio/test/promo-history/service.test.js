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

    it('uses IMS verified identity instead of caller supplied identity', async () => {
        const { intentId } = await prepareSave({ user: { id: 'forged' }, before: { title: 'forged' } });
        fragments.get(PROJECT).title = 'Updated';
        const { event } = await call('record', { phase: 'complete', intentId });
        expect(event.user.id).to.equal('verified-user');
        const entry = event.snapshot.fragments[0];
        expect(versions.get(`${entry.id}:${entry.versionId}`).title).to.equal('Project');
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
        expect(state.put.lastCall.args[1]).not.to.include('"fields"');
        expect(state.put.lastCall.args[2].ttl).to.be.at.least(90 * 86400);
    });

    for (const method of ['GET', 'POST']) {
        it(`logs safe request context when an AEM version ${method} fails during save preparation`, async () => {
            const resource = `/adobe/sites/cf/fragments/${PROJECT}/versions${method === 'GET' ? '/version-1' : ''}`;
            fetchStub
                .withArgs(
                    sinon.match((url) => new URL(url).pathname === resource),
                    sinon.match((options) => (options.method ?? 'GET') === method),
                )
                .resolves(response({ detail: 'private upstream response' }, 404, null, { 'x-request-id': 'aem-request' }));

            await expectError(prepareSave(), 404);

            expect(logger.error.callCount).to.equal(method === 'GET' ? 4 : 1);
            expect(JSON.parse(logger.error.firstCall.args[0])).to.deep.equal({
                event: 'promo-history-aem-request-failed',
                operation: 'record',
                phase: 'prepare',
                projectId: PROJECT,
                requestId: 'request-one',
                method,
                endpoint: 'https://author.example.com',
                resource,
                status: 404,
                aemRequestId: 'aem-request',
            });
            expect(stored.size).to.equal(0);
        });
    }

    it('prepares a save when its new AEM version becomes readable after transient 404s', async () => {
        const reads = fetchStub.withArgs(sinon.match((url) => url.includes(`/${PROJECT}/versions/`)));
        reads.onFirstCall().resolves(response({}, 404));
        reads.onSecondCall().resolves(response({}, 404));

        const result = await prepareSave();

        expect(result.intentId).to.be.a('string');
        expect(reads.callCount).to.equal(3);
        expect(delay.args).to.deep.equal([[250], [500]]);
        expect(
            fetchStub.withArgs(
                sinon.match((url) => url.endsWith(`/${PROJECT}/versions`)),
                sinon.match({ method: 'POST' }),
            ).callCount,
        ).to.equal(1);
    });

    it('does not prepare a save if its new version is still missing after bounded retries', async () => {
        const reads = fetchStub
            .withArgs(sinon.match((url) => url.includes(`/${PROJECT}/versions/`)))
            .resolves(response({}, 404));

        await expectError(prepareSave(), 404);

        expect(reads.callCount).to.equal(4);
        expect(delay.args).to.deep.equal([[250], [500], [1000]]);
        expect(versions.size).to.equal(1);
        expect(stored.size).to.equal(0);
    });

    for (const status of [403, 500]) {
        it(`does not retry a newly created version read returning ${status}`, async () => {
            const reads = fetchStub
                .withArgs(sinon.match((url) => url.includes(`/${PROJECT}/versions/`)))
                .resolves(response({}, status));

            await expectError(prepareSave(), status);

            expect(reads.calledOnce).to.equal(true);
            expect(delay.called).to.equal(false);
            expect(stored.size).to.equal(0);
        });
    }

    it('rejects a created AEM version without a Location header', async () => {
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith('/versions')),
                sinon.match({ method: 'POST' }),
            )
            .resolves(response({}, 201));
        await expectError(prepareSave(), 502);
        expect(state.put.called).to.equal(false);
    });

    it('refuses save preparation when the native version does not match the observed content', async () => {
        fetchStub
            .withArgs(sinon.match((url) => url.includes(`/${PROJECT}/versions/`)))
            .resolves(response({ ...makeProject(), title: 'Concurrent edit' }));
        await expectError(prepareSave(), 409);
        expect(state.put.called).to.equal(false);
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
        expect(event.restoreMode).to.equal('undo');
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

    it('blocks save preparation when the native before version cannot be created', async () => {
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith('/versions')),
                sinon.match({ method: 'POST' }),
            )
            .resolves(response({}, 503));

        await expectError(call('record', { phase: 'prepare', action: 'save', targetId: VARIATION }), 503);

        expect(state.put.called).to.equal(false);
    });

    it('reuses the automatic version when save preparation is retried', async () => {
        const first = await call('record', { phase: 'prepare', action: 'save', targetId: VARIATION });
        const retry = await call('record', { phase: 'prepare', action: 'save', targetId: VARIATION });

        expect(retry.intentId).to.equal(first.intentId);
        expect(versions.size).to.equal(1);
    });

    describe('automatic content undo', () => {
        let event;

        beforeEach(async () => {
            const { intentId } = await call('record', { phase: 'prepare', action: 'save', targetId: VARIATION });
            fragments.get(VARIATION).fields[0].values = ['New'];
            ({ event } = await call('record', { phase: 'complete', intentId }));
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
            expect(result.event.restoreMode).to.equal('undo');
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

        it('can undo a restoration using its own native before version', async () => {
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

            expect(fragments.get(VARIATION).fields[0].values).to.deep.equal(['New']);
        });

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
        it(`records ${action} after creation without preparing a version backup`, async () => {
            const { event } = await call('record', { action, targetId: PROJECT });

            expect(event.action).to.equal(action);
            expect(event.user.id).to.equal('verified-user');
            expect(event.changes.find(({ field }) => field === '@title')).to.include({ before: null, after: 'Project' });
            expect(event).not.to.have.property('snapshot');
            expect(versions.size).to.equal(0);
        });
    }

    for (const action of ['publish', 'unpublish']) {
        it(`audits ${action} without automatically creating a backup`, async () => {
            fragments.get(VARIATION).status = action === 'publish' ? 'DRAFT' : 'PUBLISHED';
            const { intentId } = await call('record', { phase: 'prepare', action, targetId: VARIATION });
            fragments.get(VARIATION).status = action === 'publish' ? 'PUBLISHED' : 'DRAFT';

            const { event } = await call('record', { phase: 'complete', intentId });

            expect(event.action).to.equal(action);
            expect(event.targetId).to.equal(VARIATION);
            expect(event).not.to.have.property('snapshot');
            expect(versions.size).to.equal(0);
        });
    }

    it('audits changes to a shared fragment explicitly referenced by the project', async () => {
        const shared = { ...makeVariation(), path: '/content/dam/mas/acom/en_US/shared-card' };
        fragments.set(VARIATION, shared);
        fragments.get(PROJECT).fields[0].values = [shared.path];
        const { intentId } = await call('record', { phase: 'prepare', action: 'save', targetId: VARIATION });
        shared.fields[0].values = ['Updated shared card'];

        const { event } = await call('record', { phase: 'complete', intentId });

        expect(event.changes[0]).to.include({ fragmentId: VARIATION, path: shared.path });
        expect(event).not.to.have.property('snapshot');
        expect(versions.size).to.equal(0);
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
        expect(versions.size).to.equal(0);
    });

    it('rejects save preparation if the fragment changes while its native version is being captured', async () => {
        fetchStub
            .withArgs(sinon.match((url) => url.endsWith(`/${PROJECT}`)))
            .onSecondCall()
            .resolves(response({ ...makeProject(), title: 'Concurrent edit' }));

        await expectError(prepareSave(), 409);

        expect(stored.size).to.equal(0);
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
        expect(result.event.changes.some((change) => change.fragmentId === VARIATION)).to.equal(false);
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

    it('does not record a successful publish when server state did not change', async () => {
        const { intentId } = await call('record', { phase: 'prepare', action: 'publish' });
        await expectError(call('record', { phase: 'complete', intentId }), 409);
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
        expect(event).not.to.have.property('snapshot');
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

    it('versions only changed restore targets so the restore can also be undone', async () => {
        const event = await legacyBackup();
        fragments.get(VARIATION).fields[0].values = ['Changed'];
        const versionCount = versions.size;
        const result = await call('restore', {
            eventId: event.id,
            selections: [{ fragmentId: VARIATION, fields: ['headline'] }],
            expected: [{ fragmentId: VARIATION, etag: '"one"' }],
        });
        expect(result.event.restoreMode).to.equal('undo');
        expect(result.event.snapshot.fragments.map(({ id }) => id)).to.deep.equal([VARIATION]);
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
});

async function expectError(promise, statusCode) {
    try {
        await promise;
        expect.fail('Expected rejection');
    } catch (error) {
        expect(error.statusCode, error.message).to.equal(statusCode);
    }
}
