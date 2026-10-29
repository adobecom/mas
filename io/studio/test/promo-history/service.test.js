const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const PROJECT = '11111111-1111-4111-8111-111111111111';
const VARIATION = '22222222-2222-4222-8222-222222222222';
const OTHER = '33333333-3333-4333-8333-333333333333';
const projectPath = '/content/dam/mas/promotions/test-project';
const variationPath = '/content/dam/mas/acom/en_US/promotions/verified-promotion/card';
const makeProject = () => ({
    id: PROJECT,
    path: projectPath,
    model: { path: '/conf/mas/settings/dam/cfm/models/promotion' },
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

describe('Promotion project versions', () => {
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
    const params = (extra = {}) => ({
        __ow_method: 'post',
        __ow_headers: { authorization: 'Bearer test-token' },
        odinEndpoint: 'https://author.example.com',
        projectId: PROJECT,
        targetId: PROJECT,
        requestId: 'request-one',
        ...extra,
    });
    const response = (body, status = 200, etag = '"one"', headers = {}) => ({
        ok: status >= 200 && status < 300,
        status,
        headers: { get: (name) => headers[name.toLowerCase()] ?? (name.toLowerCase() === 'etag' ? etag : null) },
        json: async () => structuredClone(body),
    });
    const call = (operation, extra = {}) => execute(operation, params(extra));
    const remember = (id = PROJECT) => {
        const versionId = `version-${versions.size + 1}`;
        versions.set(`${id}:${versionId}`, structuredClone(fragments.get(id)));
        return versionId;
    };
    const save = async (id = PROJECT, modify = (fragment) => (fragment.title = 'Saved'), extra = {}) => {
        const beforeVersionId = remember(id);
        modify(fragments.get(id));
        return call('record', { targetId: id, beforeVersionId, ...extra });
    };
    const undo = (event, fields = ['@title'], extra = {}) =>
        call('restore', {
            requestId: 'restore-one',
            eventId: event.id,
            selections: [{ fragmentId: event.targetId, fields }],
            expected: [{ fragmentId: event.targetId, etag: '"one"' }],
            ...extra,
        });
    const nativePosts = () =>
        fetchStub.getCalls().filter(({ args: [url, options] }) => url.endsWith('/versions') && options.method === 'POST');
    const writes = () => fetchStub.getCalls().filter(({ args: [, options] }) => ['PUT', 'DELETE'].includes(options.method));

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
        state = {
            get: async (key) => {
                if (key === 'mas-users')
                    return cachedMembers === null
                        ? null
                        : {
                              value:
                                  cachedMembers ??
                                  JSON.stringify([{ userPrincipalName: 'VERIFIED@EXAMPLE.COM', groups: roles }]),
                          };
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
                const [, id, versionId] = versionPath;
                if (options.method === 'POST') {
                    if (!fragments.has(id)) return response({}, 404);
                    return response({}, 201, null, { location: `${parsed.pathname}/${remember(id)}` });
                }
                const historical = versions.get(`${id}:${decodeURIComponent(versionId)}`);
                return historical ? response(historical) : response({}, 404);
            }
            if (parsed.pathname.endsWith('/referencedBy')) return response({ items: [] });
            if (parsed.pathname.endsWith('/tags')) {
                const fragment = fragments.get(parsed.pathname.split('/').at(-2));
                if (options.method === 'PUT') fragment.tags = JSON.parse(options.body).tags.map((id) => ({ id }));
                if (options.method === 'DELETE') fragment.tags = [];
                return response({ tags: fragment.tags });
            }
            if (parsed.searchParams.has('path')) {
                return response({
                    items: [...fragments.values()].filter((fragment) => fragment.path === parsed.searchParams.get('path')),
                });
            }
            const id = parsed.pathname.split('/').at(-1);
            if (!fragments.has(id)) return response({}, 404);
            if (options.method === 'PUT') fragments.set(id, { ...fragments.get(id), ...JSON.parse(options.body) });
            return response(fragments.get(id));
        });
        originalFetch = global.fetch;
        global.fetch = fetchStub;
        ({ execute } = proxyquire('../../src/promo-history/service.js', {
            'node:timers/promises': { setTimeout: sinon.stub().resolves() },
            '@adobe/aio-sdk': { Core: { Logger: () => ({ error: sinon.spy() }) } },
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

    it('records verified identity, ISO time, changed fields and authoritative native manifests', async () => {
        const { event } = await save(PROJECT, undefined, { user: { name: 'Impersonator' } });
        expect(event.user).to.deep.equal(profile);
        expect(new Date(event.createdAt).toISOString()).to.equal(event.createdAt);
        expect(event.action).to.equal('save');
        expect(event.changes).to.deep.equal([
            { fragmentId: PROJECT, path: projectPath, field: '@title', before: 'Project', after: 'Saved', category: 'general' },
        ]);
        expect(event.beforeSnapshot.fragments).to.deep.equal([{ id: PROJECT, path: projectPath, versionId: 'version-1' }]);
        expect(event.afterSnapshot.fragments).to.deep.equal([{ id: PROJECT, path: projectPath, versionId: 'version-2' }]);
        expect(nativePosts()).to.have.length(1);
        const [key, value] = [...stored][0];
        expect(key).to.match(new RegExp(`^promo-versions\\.${PROJECT}\\.`));
        expect(JSON.parse(value)).to.deep.equal(event);
        expect(value).not.to.include('"fields"');
        expect(state.put.firstCall.args[2].ttl).to.equal(95 * 86400);
        expect(event).not.to.have.any.keys('fingerprint', 'intentId', 'environment', 'isAudit', 'restoreMode');
    });

    it('records creation without an undo snapshot', async () => {
        const { event } = await call('record', { action: 'create' });
        expect(event.beforeSnapshot).to.deep.equal({ fragments: [] });
        expect(event.afterSnapshot.fragments[0].id).to.equal(PROJECT);
        await expectError(undo(event), 400);
        expect(writes()).to.have.length(0);
    });

    it('does not create native or catalog versions for a no-op save', async () => {
        expect(await save(PROJECT, () => {})).to.deep.equal({ unchanged: true });
        expect(nativePosts()).to.have.length(0);
        expect(stored.size).to.equal(0);
    });

    it('replays a request without another native version or catalog entry', async () => {
        const result = await save();
        expect(await call('record', { beforeVersionId: 'version-1' })).to.deep.equal(result);
        expect(nativePosts()).to.have.length(1);
        expect(stored.size).to.equal(1);
        await expectError(call('record', { targetId: VARIATION, beforeVersionId: 'version-1' }), 409);
    });

    it('scopes request idempotency to verified author', async () => {
        await save();
        profile = { ...profile, id: 'second-user' };
        const { event } = await save(PROJECT, (fragment) => (fragment.title = 'Second'));
        expect(event.user.id).to.equal('second-user');
        expect(stored.size).to.equal(2);
    });

    it('accepts owned promo variations but rejects source cards and other promotions', async () => {
        await save(VARIATION);
        fragments.set(OTHER, { ...makeVariation(), id: OTHER, path: '/content/dam/mas/acom/en_US/card' });
        await expectError(save(OTHER, undefined, { requestId: 'source' }), 403);
        fragments.get(OTHER).path = '/content/dam/mas/acom/en_US/promotions/someone-else/card';
        await expectError(save(OTHER, undefined, { requestId: 'outside' }), 403);
    });

    it('reads the supplied before version only from the same fragment', async () => {
        const beforeVersionId = remember(VARIATION);
        fragments.get(PROJECT).title = 'Saved';
        await expectError(call('record', { beforeVersionId }), 404);
        expect(stored.size).to.equal(0);
    });

    it('requires a before version for saves and rejects create with a before version', async () => {
        await expectError(call('record'), 400);
        await expectError(call('record', { action: 'create', beforeVersionId: remember() }), 400);
    });

    it('checks optional completion ETags before creating a version', async () => {
        await expectError(save(PROJECT, undefined, { completionEtag: '"stale"' }), 409);
        expect(nativePosts()).to.have.length(0);
    });

    it('checks completion ETags again when native capture finishes', async () => {
        let captured = false;
        fetchStub
            .withArgs(sinon.match((url) => url.endsWith(`/${PROJECT}`)))
            .callsFake(async () => response(fragments.get(PROJECT), 200, captured ? '"changed"' : '"one"'));
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith('/versions')),
                sinon.match.has('method', 'POST'),
            )
            .callsFake(async (url) => {
                const versionId = remember();
                captured = true;
                return response({}, 201, null, { location: `${new URL(url).pathname}/${versionId}` });
            });
        await expectError(save(PROJECT, undefined, { completionEtag: '"one"' }), 409);
        expect(stored.size).to.equal(0);
    });

    it('rejects native version locations outside the configured fragment endpoint', async () => {
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith('/versions')),
                sinon.match.has('method', 'POST'),
            )
            .resolves(response({}, 201, null, { location: 'https://attacker.example.com/versions/stolen' }));
        await expectError(save(), 502);
        expect(stored.size).to.equal(0);
    });

    it('rejects content races during native capture', async () => {
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith('/versions')),
                sinon.match.has('method', 'POST'),
            )
            .callsFake(async (url) => {
                const versionId = remember();
                fragments.get(PROJECT).title = 'Concurrent change';
                return response({}, 201, null, { location: `${new URL(url).pathname}/${versionId}` });
            });
        await expectError(save(), 409);
        expect(stored.size).to.equal(0);
    });

    it('lists stable version numbers, search, cursor and current id before filtering', async () => {
        const first = (await save()).event;
        const second = (await save(PROJECT, (fragment) => (fragment.title = 'Second'), { requestId: 'second' })).event;
        const entries = [...stored].map(([key, value]) => [key, JSON.parse(value)]);
        for (const [key, event] of entries) {
            event.createdAt = event.id === first.id ? '2026-10-28T10:00:00.000Z' : '2026-10-29T10:00:00.000Z';
            stored.set(key, JSON.stringify(event));
        }
        const page = await call('list', { limit: 1 });
        expect(page.events.map((event) => [event.id, event.version])).to.deep.equal([[second.id, 2]]);
        expect(page.currentEventId).to.equal(second.id);
        const next = await call('list', { limit: 1, cursor: page.cursor });
        expect(next.events.map((event) => [event.id, event.version])).to.deep.equal([[first.id, 1]]);
        const filtered = await call('list', { query: 'Project' });
        expect(filtered.currentEventId).to.equal(second.id);
        expect(await call('list', { query: 'No matching text' })).to.deep.equal({ events: [], currentEventId: second.id });
    });

    it('does not renumber readable versions when access to an older target is revoked', async () => {
        await save(VARIATION);
        const { event } = await save(PROJECT, undefined, { requestId: 'second' });
        const key = [...stored.keys()].find((key) => JSON.parse(stored.get(key)).id === event.id);
        stored.set(key, JSON.stringify({ ...event, createdAt: new Date(Date.now() + 1000).toISOString() }));
        fetchStub.withArgs(sinon.match((url) => url.includes(`/fragments/${VARIATION}`))).resolves(response({}, 403));
        expect((await call('list')).events.map((item) => item.version)).to.deep.equal([2]);
    });

    it('ignores expired catalogs and old development audit namespaces', async () => {
        const { event } = await save();
        const [key] = [...stored.keys()];
        stored.set(key, JSON.stringify({ ...event, createdAt: new Date(Date.now() - 96 * 86400000).toISOString() }));
        stored.set(`promo-history.${PROJECT}.event.old`, JSON.stringify(event));
        expect(await call('list')).to.deep.equal({ events: [], currentEventId: null });
    });

    for (const extra of [{ limit: 0 }, { limit: 101 }, { cursor: 'missing' }, { query: [] }]) {
        it(`rejects invalid version list input ${JSON.stringify(extra)}`, async () => {
            await expectError(call('list', extra), 400);
        });
    }

    it('does not disclose stored fields after current or native historical access is revoked', async () => {
        await save(VARIATION);
        const denied = fetchStub.withArgs(sinon.match((url) => url.includes(`/fragments/${VARIATION}`)));
        denied.resolves(response({}, 403));
        expect((await call('list')).events).to.deep.equal([]);
        denied.callsFake(async () => response(fragments.get(VARIATION)));
        fetchStub.withArgs(sinon.match((url) => url.includes('/versions/'))).resolves(response({}, 403));
        expect((await call('list')).events).to.deep.equal([]);
    });

    it('keeps safe history for deleted targets with unavailable markers, without recreating them', async () => {
        const { event } = await save(VARIATION);
        fragments.delete(VARIATION);
        const listed = (await call('list')).events;
        expect(listed).to.have.length(1);
        expect(listed[0].unavailableFragments).to.deep.equal([VARIATION]);
        await expectError(undo(event), 404);
        expect(writes()).to.have.length(0);
    });

    it('undoes previous values, preserves unrelated current fields and tags, and records a visible restore', async () => {
        const { event } = await save(VARIATION, (fragment) => (fragment.fields[0].values = ['New']));
        fragments.get(VARIATION).fields[1].values = ['Later body'];
        fragments.get(VARIATION).tags = [{ id: 'mas:later' }];
        const result = await undo(event, ['headline']);
        expect(result.restored).to.deep.equal([VARIATION]);
        expect(fragments.get(VARIATION).fields.map((field) => field.values)).to.deep.equal([['Old'], ['Later body']]);
        expect(fragments.get(VARIATION).tags).to.deep.equal([{ id: 'mas:later' }]);
        expect(result.event.action).to.equal('restore');
        expect(result.event.changes[0]).to.include({ field: 'headline' });
        expect(result.event.changes[0].before).to.deep.equal(['New']);
        expect(result.event.changes[0].after).to.deep.equal(['Old']);
        expect(result.event.beforeSnapshot.fragments).to.have.length(1);
        expect(result.event.afterSnapshot.fragments).to.have.length(1);
        expect((await call('list')).events.map((item) => item.action)).to.include('restore');
        expect(writes()[0].args[1].headers['If-Match']).to.equal('"one"');
    });

    it('allows undoing a restore using its before snapshot', async () => {
        const { event } = await save();
        const restored = await undo(event);
        await undo(restored.event, ['@title'], { requestId: 'undo-restore' });
        expect(fragments.get(PROJECT).title).to.equal('Saved');
    });

    it('rejects stale ETags and selected fields changed again since the source entry', async () => {
        const { event } = await save();
        await expectError(undo(event, ['@title'], { expected: [{ fragmentId: PROJECT, etag: '"stale"' }] }), 409);
        fragments.get(PROJECT).title = 'Someone else';
        await expectError(undo(event), 409);
        expect(writes()).to.have.length(0);
    });

    it('only allows fields actually changed by the source entry', async () => {
        const { event } = await save();
        await expectError(undo(event, ['@description']), 400);
        await expectError(undo(event, []), 400);
        await expectError(
            undo(event, ['@title'], {
                selections: [{ fragmentId: OTHER, fields: ['@title'] }],
                expected: [{ fragmentId: OTHER, etag: '"one"' }],
            }),
            403,
        );
        expect(writes()).to.have.length(0);
    });

    it('restores raw inheritance sentinels rather than inherited display content', async () => {
        fragments.get(VARIATION).fields[0].values = [];
        const { event } = await save(VARIATION, (fragment) => (fragment.fields[0].values = ['Override']));
        await undo(event, ['headline']);
        expect(fragments.get(VARIATION).fields[0].values).to.deep.equal([]);
    });

    it('undoes newly added fields absent from the before version using empty raw values and current schema', async () => {
        const { event } = await save(VARIATION, (fragment) =>
            fragment.fields.push({
                name: 'newField',
                type: 'text',
                multiple: false,
                values: ['Added'],
            }),
        );
        expect(event.changes[0]).to.include({ field: 'newField', before: null });
        const result = await undo(event, ['newField']);
        expect(fragments.get(VARIATION).fields.find((field) => field.name === 'newField')).to.deep.equal({
            name: 'newField',
            type: 'text',
            multiple: false,
            values: [],
        });
        expect(result.event.changes[0].after).to.deep.equal([]);
        expect(fragments.get(VARIATION).fields[1].values).to.deep.equal(['Unrelated']);
    });

    it('restores fields removed by the selected save from its native before version', async () => {
        const { event } = await save(VARIATION, (fragment) => {
            fragment.fields = fragment.fields.filter((field) => field.name !== 'headline');
        });
        await undo(event, ['headline']);
        expect(fragments.get(VARIATION).fields.find((field) => field.name === 'headline').values).to.deep.equal(['Old']);
    });

    it('captures native inheritance display context without persisting parent content', async () => {
        const parentPath = '/content/dam/mas/acom/en_US/card';
        fragments.set(OTHER, { ...makeVariation(), id: OTHER, path: parentPath });
        fragments.get(PROJECT).fields[0].values = [parentPath];
        const { event } = await save(VARIATION);
        expect(event.beforeSnapshot.inheritance[0]).to.include({ fragmentId: VARIATION, id: OTHER, path: parentPath });
        expect(event.afterSnapshot.inheritance[0]).to.include({ fragmentId: VARIATION, id: OTHER, path: parentPath });
        expect([...stored.values()].join('')).not.to.include('"fields"');
        fetchStub.withArgs(sinon.match((url) => url.includes(`/fragments/${OTHER}`))).resolves(response({}, 403));
        expect((await call('list')).events).to.deep.equal([]);
    });

    it('validates proposed fragment references before restore writes', async () => {
        fragments.get(PROJECT).fields[0].values = ['/content/dam/mas/acom/en_US/missing'];
        const { event } = await save(PROJECT, (fragment) => (fragment.fields[0].values = []));
        await expectError(undo(event, ['fragments']), 404);
        expect(writes()).to.have.length(0);
    });

    it('restores selected tags without changing current content', async () => {
        fragments.get(VARIATION).tags = [{ id: 'mas:old' }];
        const { event } = await save(VARIATION, (fragment) => (fragment.tags = [{ id: 'mas:new' }]));
        fragments.get(VARIATION).title = 'Later title';
        const result = await undo(event, ['@tags']);
        expect(result.restored).to.deep.equal([VARIATION]);
        expect(fragments.get(VARIATION).tags).to.deep.equal([{ id: 'mas:old' }]);
        expect(fragments.get(VARIATION).title).to.equal('Later title');
        expect(writes()).to.have.length(1);
        expect(writes()[0].args[0]).to.match(/\/tags$/);
    });

    it('reports partial content/tag failures and versions only confirmed actual changes', async () => {
        fragments.get(VARIATION).tags = [{ id: 'mas:old' }];
        const { event } = await save(VARIATION, (fragment) => {
            fragment.title = 'New';
            fragment.tags = [{ id: 'mas:new' }];
        });
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith('/tags')),
                sinon.match.has('method', 'PUT'),
            )
            .resolves(response({}, 412));
        const result = await undo(event, ['@title', '@tags']);
        expect(result.restored).to.deep.equal([]);
        expect(result.failures[0]).to.include({ fragmentId: VARIATION, statusCode: 412, partial: true });
        expect(result.event.changes.map((change) => change.field)).to.deep.equal(['@title']);
        expect(fragments.get(VARIATION).tags).to.deep.equal([{ id: 'mas:new' }]);
        expect((await undo(event, ['@title', '@tags'])).failures).to.deep.equal(result.failures);
        expect(writes()).to.have.length(2);
    });

    it('returns versionPending with actual outcomes if post-write native capture fails', async () => {
        const { event } = await save();
        let captures = 0;
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith('/versions')),
                sinon.match.has('method', 'POST'),
            )
            .callsFake(async (url) => {
                captures++;
                if (captures === 2) return response({}, 503);
                return response({}, 201, null, { location: `${new URL(url).pathname}/${remember()}` });
            });
        const error = await expectError(undo(event), 503);
        expect(error.result).to.include({ versionPending: true });
        expect(error.result.restored).to.deep.equal([PROJECT]);
        expect(error.result.failures).to.deep.equal([]);
        expect(error.message).not.to.include('audit');
        await expectError(undo(event), 409);
        expect(writes()).to.have.length(1);
    });

    it('reports a tag-only write as partial if its result cannot be read back', async () => {
        const { event } = await save(VARIATION, (fragment) => (fragment.tags = [{ id: 'mas:new' }]));
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith('/tags')),
                sinon.match.has('method', 'DELETE'),
            )
            .callsFake(async () => {
                fragments.get(VARIATION).tags = [];
                fetchStub.withArgs(sinon.match((url) => url.endsWith(`/${VARIATION}`))).resolves(response({}, 403));
                return response({});
            });
        const error = await expectError(undo(event, ['@tags']), 503);
        expect(error.result.versionPending).to.equal(true);
        expect(error.result.failures[0]).to.include({ fragmentId: VARIATION, partial: true });
    });

    it('stops a multi-fragment restore after failure and reports confirmed and unattempted targets', async () => {
        const first = (await save(PROJECT)).event;
        const second = (await save(VARIATION, undefined, { requestId: 'variation-save' })).event;
        fragments.set(OTHER, { ...makeVariation(), id: OTHER, path: `${variationPath}-2` });
        const third = (await save(OTHER, undefined, { requestId: 'other-save' })).event;
        const combined = {
            ...first,
            changes: [...first.changes, ...second.changes, ...third.changes],
            beforeSnapshot: { fragments: [first, second, third].flatMap((event) => event.beforeSnapshot.fragments) },
            afterSnapshot: { fragments: [first, second, third].flatMap((event) => event.afterSnapshot.fragments) },
        };
        const key = [...stored.keys()].find((key) => JSON.parse(stored.get(key)).id === first.id);
        stored.set(key, JSON.stringify(combined));
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith(`/${VARIATION}`)),
                sinon.match.has('method', 'PUT'),
            )
            .resolves(response({}, 412));
        const result = await undo(combined, ['@title'], {
            selections: [PROJECT, VARIATION, OTHER].map((fragmentId) => ({ fragmentId, fields: ['@title'] })),
            expected: [PROJECT, VARIATION, OTHER].map((fragmentId) => ({ fragmentId, etag: '"one"' })),
        });
        expect(result.restored).to.deep.equal([PROJECT]);
        expect(result.failures.map(({ fragmentId, statusCode }) => [fragmentId, statusCode])).to.deep.equal([
            [VARIATION, 412],
            [OTHER, 424],
        ]);
        expect(result.event.changes.map((change) => change.fragmentId)).to.deep.equal([PROJECT]);
        expect(fragments.get(OTHER).title).to.equal('Saved');
        expect(writes()).to.have.length(2);
    });

    it('does not attribute unrelated concurrent changes after a restore write to that restore', async () => {
        const { event } = await save(VARIATION);
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith(`/${VARIATION}`)),
                sinon.match.has('method', 'PUT'),
            )
            .callsFake(async (url, options) => {
                fragments.set(VARIATION, {
                    ...fragments.get(VARIATION),
                    ...JSON.parse(options.body),
                    description: 'Concurrent',
                });
                return response(fragments.get(VARIATION));
            });
        const error = await expectError(undo(event), 503);
        expect(error.result.versionPending).to.equal(true);
        expect((await call('list')).events).to.have.length(1);
    });

    it('keeps bounded polling for eventual consistency after successful restore writes', async () => {
        const { event } = await save();
        let visible = false;
        let pending;
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith(`/${PROJECT}`)),
                sinon.match.has('method', 'PUT'),
            )
            .callsFake(async (url, options) => {
                pending = JSON.parse(options.body);
                return response({});
            });
        fetchStub
            .withArgs(
                sinon.match((url) => url.endsWith(`/${PROJECT}`)),
                sinon.match((options) => !options.method),
            )
            .callsFake(async () => {
                if (pending && visible) fragments.set(PROJECT, { ...fragments.get(PROJECT), ...pending });
                if (pending) visible = true;
                return response(fragments.get(PROJECT));
            });
        expect((await undo(event)).restored).to.deep.equal([PROJECT]);
    });

    it('blocks replay disclosure when historical access has been revoked', async () => {
        const { event } = await save(VARIATION);
        await undo(event);
        fetchStub.withArgs(sinon.match((url) => url.includes(`/fragments/${VARIATION}`))).resolves(response({}, 403));
        await expectError(undo(event), 403);
    });

    it('returns versionPending if catalog persistence fails after confirmed restore writes', async () => {
        const { event } = await save();
        const put = state.put;
        state.put = async (key, value, options) => {
            if (JSON.parse(value).action === 'restore') throw new Error('State unavailable');
            return put(key, value, options);
        };
        const error = await expectError(undo(event), 503);
        expect(error.result.versionPending).to.equal(true);
        expect(error.result.restored).to.deep.equal([PROJECT]);
    });

    it('requires verified IMS identity and trusted write group membership', async () => {
        allowed = false;
        await expectError(call('record', { action: 'create' }), 401);
        allowed = true;
        roles = [];
        await expectError(call('record', { action: 'create' }), 403);
        expect((await call('list')).events).to.deep.equal([]);
        cachedMembers = null;
        await expectError(call('record', { action: 'create' }), 503);
    });

    it('allows editors to record but restricts restore to power users or admins', async () => {
        roles = ['GRP-ODIN-MAS-PROMO-EDITORS'];
        const { event } = await save();
        await expectError(undo(event), 403);
        roles = ['GRP-ODIN-MAS-PROMO-POWERUSERS'];
        expect((await undo(event)).restored).to.deep.equal([PROJECT]);
    });

    for (const extra of [
        { projectId: '../project' },
        { targetId: 'not-an-id' },
        { requestId: '' },
        { action: 'publish' },
        { action: 'delete' },
        { beforeVersionId: '../version' },
        { completionEtag: '*' },
        { __ow_method: 'get' },
    ]) {
        it(`rejects invalid external input ${JSON.stringify(extra)}`, async () => {
            await expectError(call('record', { action: 'create', ...extra }), extra.__ow_method ? 405 : 400);
            expect(writes()).to.have.length(0);
        });
    }

    it('rejects invalid configured AEM endpoints and does not send authorization to them', async () => {
        await expectError(call('list', { odinEndpoint: 'http://attacker.example.com/path' }), 500);
        expect(fetchStub.getCalls().some(({ args: [url] }) => url.includes('attacker'))).to.equal(false);
    });
});

async function expectError(promise, statusCode) {
    try {
        await promise;
        expect.fail('Expected rejection');
    } catch (error) {
        expect(error.statusCode, error.message).to.equal(statusCode);
        return error;
    }
}
