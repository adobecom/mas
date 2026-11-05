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
    let numberingFiles;
    let files;
    const params = (extra = {}) => ({
        __ow_method: 'post',
        __ow_headers: { authorization: 'Bearer test-token' },
        odinEndpoint: 'https://author.example.com',
        scopeType: 'promotion',
        rootId: PROJECT,
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
    const writes = () =>
        fetchStub
            .getCalls()
            .filter(
                ({ args: [url, options] }) =>
                    url.includes('/adobe/sites/cf/fragments/') && ['PUT', 'DELETE'].includes(options.method),
            );

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
        numberingFiles = new Map();
        files = {
            generatePresignURL: sinon.stub().callsFake(async (path) => `https://files.example.com/${path}`),
        };
        state = {
            get: sinon.spy(async (key) => {
                if (key === 'mas-users')
                    return cachedMembers === null
                        ? null
                        : {
                              value:
                                  cachedMembers ??
                                  JSON.stringify([{ userPrincipalName: 'VERIFIED@EXAMPLE.COM', groups: roles }]),
                          };
                return stored.has(key) ? { value: stored.get(key) } : null;
            }),
            put: sinon.spy(async (key, value) => stored.set(key, value)),
            list: sinon.spy(({ match }) =>
                (async function* () {
                    const pattern = new RegExp(`^${match.replaceAll('.', '\\.').replaceAll('*', '.*')}$`);
                    yield { keys: [...stored.keys()].filter((key) => pattern.test(key)) };
                })(),
            ),
        };
        fetchStub = sinon.stub().callsFake(async (url, options = {}) => {
            if (url.includes('/ims/profile/')) return response(profile);
            const parsed = new URL(url);
            if (parsed.hostname === 'files.example.com') {
                const current = numberingFiles.get(parsed.pathname);
                if (options.method !== 'PUT') return response(current?.body, current ? 200 : 404, current?.etag);
                if (
                    (options.headers['If-None-Match'] === '*' && current) ||
                    (options.headers['If-Match'] && options.headers['If-Match'] !== current?.etag)
                )
                    return response({}, 412);
                const next = {
                    etag: `"${Number(current?.etag.replaceAll('"', '') ?? 0) + 1}"`,
                    body: JSON.parse(options.body),
                };
                numberingFiles.set(parsed.pathname, next);
                return response({}, 201, next.etag);
            }
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
        ({ execute } = proxyquire('../../src/history/service.js', {
            'node:timers/promises': { setTimeout: sinon.stub().resolves() },
            '@adobe/aio-sdk': { Core: { Logger: () => ({ error: sinon.spy() }) } },
            '@adobe/aio-lib-state': { init: async () => state },
            '@adobe/aio-lib-files': { init: async () => files },
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
        expect(event.version).to.equal(1);
        expect(event.changes).to.deep.equal([
            { fragmentId: PROJECT, path: projectPath, field: '@title', before: 'Project', after: 'Saved', category: 'general' },
        ]);
        expect(event.beforeSnapshot.fragments).to.deep.equal([{ id: PROJECT, path: projectPath, versionId: 'version-1' }]);
        expect(event.afterSnapshot.fragments).to.deep.equal([{ id: PROJECT, path: projectPath, versionId: 'version-2' }]);
        expect(nativePosts()).to.have.length(1);
        const [key, value] = [...stored][0];
        expect(key).to.match(new RegExp(`^history\\.promotion\\.${PROJECT}\\.`));
        expect(event).to.include({ scopeType: 'promotion', rootId: PROJECT });
        expect(event).not.to.have.property('projectId');
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

    it('lists persisted numeric versions, search, cursor and current id before filtering', async () => {
        const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        const first = (await save()).event;
        clock.tick(1000);
        const second = (await save(PROJECT, (fragment) => (fragment.title = 'Second'), { requestId: 'second' })).event;
        const page = await call('list', { limit: 1 });
        expect(page.events.map((event) => [event.id, event.version])).to.deep.equal([[second.id, 2]]);
        expect(page.currentEventId).to.equal(second.id);
        const next = await call('list', { limit: 1, cursor: page.cursor });
        expect(next.events.map((event) => [event.id, event.version])).to.deep.equal([[first.id, 1]]);
        const filtered = await call('list', { query: 'Project' });
        expect(filtered.currentEventId).to.equal(second.id);
        expect(await call('list', { query: 'No matching text' })).to.deep.equal({ events: [], currentEventId: second.id });
    });

    for (const scopeType of ['collection', '__proto__', undefined]) {
        it(`rejects unsupported scope ${scopeType} before reading any protected resource`, async () => {
            await expectError(call('list', { scopeType }), 400);
            expect(fetchStub.called).to.equal(false);
        });
    }

    it('searches only author names and changed field values', async () => {
        const { event } = await save();
        for (const query of ['verified user', '@title', 'Project', 'Saved']) {
            expect((await call('list', { query })).events.map((item) => item.id)).to.deep.equal([event.id]);
        }
        for (const query of [
            profile.email,
            profile.id,
            PROJECT,
            projectPath,
            event.id,
            event.beforeSnapshot.fragments[0].versionId,
            'general',
            'before',
            'after',
            'email',
        ]) {
            expect((await call('list', { query })).events).to.deep.equal([]);
        }
    });

    it('tags captured native versions with the deterministic change-set event ID', async () => {
        const { event } = await save();
        expect(JSON.parse(nativePosts()[0].args[1].body).comment).to.equal(`Change-set: ${event.id}`);
    });

    it('does not renumber readable versions when access to an older target is revoked', async () => {
        await save(VARIATION);
        const { event } = await save(PROJECT, undefined, { requestId: 'second' });
        const key = [...stored.keys()].find((key) => JSON.parse(stored.get(key)).id === event.id);
        stored.set(key, JSON.stringify({ ...event, createdAt: new Date(Date.now() + 1000).toISOString() }));
        fetchStub.withArgs(sinon.match((url) => url.includes(`/fragments/${VARIATION}`))).resolves(response({}, 403));
        expect((await call('list')).events.map((item) => item.version)).to.deep.equal([event.version]);
    });

    async function recordHistory(count) {
        const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        const events = [];
        for (let index = 0; index < count; index += 1) {
            const { event } = await save(PROJECT, (fragment) => (fragment.title = `Saved ${index}`), {
                requestId: `save-${index}`,
            });
            events.unshift(event);
            clock.tick(1000);
        }
        clock.restore();
        fetchStub.resetHistory();
        return events;
    }

    it('defaults to ten authorized versions and continues without gaps or duplicates', async () => {
        const events = await recordHistory(25);

        const first = await call('list');
        const second = await call('list', { cursor: first.cursor });
        const third = await call('list', { cursor: second.cursor });

        expect(first.events.map((event) => event.id)).to.deep.equal(events.slice(0, 10).map((event) => event.id));
        expect(second.events.map((event) => event.id)).to.deep.equal(events.slice(10, 20).map((event) => event.id));
        expect(third.events.map((event) => event.id)).to.deep.equal(events.slice(20).map((event) => event.id));
        expect(third).not.to.have.property('cursor');
        expect(second.currentEventId).to.equal(first.currentEventId);
    });

    it('fills pages across denied versions and continues when access to the cursor version is revoked', async () => {
        await recordHistory(25);
        const events = [...stored.values()]
            .map((value) => JSON.parse(value))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const deny = (event) =>
            fetchStub
                .withArgs(sinon.match((url) => url.endsWith(`/versions/${event.beforeSnapshot.fragments[0].versionId}`)))
                .resolves(response({}, 403));
        for (const event of events.slice(0, 6)) deny(event);

        const first = await call('list');
        deny(first.events.at(-1));
        const second = await call('list', { cursor: first.cursor });

        expect(first.events.map((event) => event.id)).to.deep.equal(events.slice(6, 16).map((event) => event.id));
        expect(first.currentEventId).to.equal(events[6].id);
        expect(second.events.map((event) => event.id)).to.deep.equal(events.slice(16).map((event) => event.id));
        expect(second.currentEventId).to.equal(first.currentEventId);
        expect(second).not.to.have.property('cursor');
    });

    it('authorizes only the requested page and its lookahead while reading each live fragment once', async () => {
        await recordHistory(25);

        await call('list', { limit: 1 });

        const reads = fetchStub.getCalls().filter(({ args: [url] }) => url.includes('/adobe/sites/cf/fragments/'));
        expect(reads.filter(({ args: [url] }) => url.endsWith(`/${PROJECT}`))).to.have.length(1);
        expect(reads.filter(({ args: [url] }) => url.includes('/versions/')).length).to.be.at.most(4);
    });

    it('reads only a page and lookahead from state rather than every stored event', async () => {
        await recordHistory(25);
        state.get.resetHistory();

        await call('list', { limit: 1 });

        expect(state.get.getCalls().filter(({ args: [key] }) => key.includes('.entry.'))).to.have.length(2);
    });

    it('loads one bounded index page without enumerating State keys or reading the full numbering ledger', async () => {
        await recordHistory(125);
        state.get.resetHistory();
        state.list.resetHistory();

        const first = await call('list');

        expect(first.events).to.have.length(10);
        expect(state.list.callCount).to.equal(0);
        expect(state.get.getCalls().filter(({ args: [key] }) => key.includes('.entry.'))).to.have.length(11);
        const metadataReads = fetchStub
            .getCalls()
            .filter(({ args: [url, options] }) => url.includes('files.example.com') && options.method !== 'PUT');
        expect(metadataReads.map(({ args: [url] }) => new URL(url).pathname)).to.deep.equal([
            `/private/history/promotion/${PROJECT}/index.json`,
            `/private/history/promotion/${PROJECT}/index-1.json`,
        ]);
    });

    it('continues correctly across index-page boundaries without duplicate or missing events', async () => {
        const events = await recordHistory(125);
        state.list.resetHistory();

        const first = await call('list', { limit: 100 });
        const second = await call('list', { limit: 100, cursor: first.cursor });

        expect([...first.events, ...second.events].map((event) => event.id)).to.deep.equal(events.map((event) => event.id));
        expect(second.currentEventId).to.equal(first.currentEventId);
        expect(second).not.to.have.property('cursor');
        expect(state.list.callCount).to.equal(0);
    });

    it('preserves chronological ordering when version allocation order differs across index pages', async () => {
        const events = await recordHistory(105);
        const older = (await call('record', { action: 'create', requestId: 'late-recording' })).event;
        const expected = [...events, older].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));

        const first = await call('list', { limit: 100 });
        const second = await call('list', { limit: 100, cursor: first.cursor });

        expect([...first.events, ...second.events].map((event) => event.id)).to.deep.equal(expected.map((event) => event.id));
    });

    it('keeps the existing ID tie-breaker when events have identical timestamps', async () => {
        sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        const first = (await call('record', { action: 'create', requestId: 'same-time-one' })).event;
        const second = (await call('record', { action: 'create', requestId: 'same-time-two' })).event;
        const expected = [first, second].sort((a, b) => b.id.localeCompare(a.id));

        const listed = await call('list');

        expect(listed.events.map((event) => event.id)).to.deep.equal(expected.map((event) => event.id));
    });

    it('does not commit an unindexed event when index persistence fails and recovers on retry', async () => {
        const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        await save();
        clock.tick(1);
        const beforeVersionId = remember();
        fragments.get(PROJECT).title = 'Second';
        const pageWrites = fetchStub.withArgs(
            sinon.match((url) => url.endsWith('/index-0.json')),
            sinon.match.has('method', 'PUT'),
        );
        pageWrites.resolves(response({}, 503));

        await expectError(call('record', { beforeVersionId, requestId: 'index-failure' }), 503);

        expect(stored.size).to.equal(1);
        pageWrites.resetBehavior();
        const { event } = await call('record', { beforeVersionId, requestId: 'index-failure' });
        expect(event.version).to.equal(2);
        expect((await call('list')).events.map((item) => item.version)).to.deep.equal([2, 1]);
    });

    it('rejects cursors without a numeric version', async () => {
        const events = await recordHistory(25);

        await expectError(call('list', { cursor: `${events[9].createdAt}|${events[9].id}` }), 400);
    });

    it('does not read expired index pages or event bodies after all history has expired', async () => {
        const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        await save();
        clock.tick(96 * 86400000);
        state.list.resetHistory();
        state.get.resetHistory();
        fetchStub.resetHistory();

        expect(await call('list')).to.deep.equal({ events: [], currentEventId: null });

        expect(state.list.callCount).to.equal(0);
        expect(state.get.getCalls().filter(({ args: [key] }) => key.includes('.entry.'))).to.have.length(0);
        expect(fetchStub.getCalls().filter(({ args: [url] }) => /\/index-\d+\.json$/.test(url))).to.have.length(0);
    });

    it('reports a missing index page instead of silently omitting history or rescanning State', async () => {
        await recordHistory(125);
        numberingFiles.delete(`/private/history/promotion/${PROJECT}/index-1.json`);
        state.list.resetHistory();

        await expectError(call('list'), 503);

        expect(state.list.callCount).to.equal(0);
    });

    it('keeps the same version number after older history expires', async () => {
        const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        await save();
        clock.tick(94 * 86400000);
        const second = (await save(PROJECT, (fragment) => (fragment.title = 'Second'), { requestId: 'second' })).event;
        const before = (await call('list')).events.find((event) => event.id === second.id).version;
        expect(before).to.equal(2);
        clock.tick(2 * 86400000);

        expect((await call('list')).events.find((event) => event.id === second.id).version).to.equal(before);
    });

    it('continues numbering after all retained events expire, even after more than a year without saves', async () => {
        const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        await save();
        clock.tick(400 * 86400000);
        stored.clear();

        const { event } = await save(PROJECT, (fragment) => (fragment.title = 'After expiry'), { requestId: 'after-expiry' });

        expect(event.version).to.equal(2);
        expect((await call('list')).events.map((item) => item.version)).to.deep.equal([2]);
    });

    it('shares one numeric sequence across project saves, variations, creations and restores', async () => {
        const created = (await call('record', { action: 'create', requestId: 'create' })).event;
        const saved = (await save(VARIATION, undefined, { requestId: 'variation' })).event;
        const restored = await undo(saved);

        expect([created.version, saved.version, restored.event.version]).to.deep.equal([1, 2, 3]);
        expect((await undo(saved)).event.version).to.equal(3);
        const next = (await save(PROJECT, undefined, { requestId: 'next' })).event;
        expect(next.version).to.equal(4);
    });

    it('allocates distinct numbers for concurrent writers using conditional storage updates', async () => {
        await call('record', { action: 'create', requestId: 'initial' });
        const results = await Promise.all([
            call('record', { action: 'create', requestId: 'concurrent-project' }),
            call('record', { action: 'create', targetId: VARIATION, requestId: 'concurrent-variation' }),
        ]);

        expect(results.map(({ event }) => event.version).sort()).to.deep.equal([2, 3]);
        expect((await call('list')).events.map((event) => event.version).sort()).to.deep.equal([1, 2, 3]);
        expect(
            fetchStub.getCalls().some(({ args: [url, options] }) => {
                return url.includes('files.example.com') && options.headers?.['If-Match'];
            }),
        ).to.equal(true);
    });

    it('reuses one number and event key when identical requests arrive concurrently', async () => {
        const results = await Promise.all([call('record', { action: 'create' }), call('record', { action: 'create' })]);

        expect(results.map(({ event }) => event.version)).to.deep.equal([1, 1]);
        expect(stored.size).to.equal(1);
        expect((await call('record', { action: 'create', requestId: 'next' })).event.version).to.equal(2);
    });

    it('reuses a reserved number when event persistence fails and the request is retried', async () => {
        const put = state.put;
        state.put = sinon.stub().onFirstCall().rejects(new Error('State unavailable'));
        state.put.callsFake(put);
        try {
            await call('record', { action: 'create' });
            expect.fail('Expected persistence failure');
        } catch (error) {
            expect(error.message).to.equal('State unavailable');
        }

        expect((await call('list')).events).to.deep.equal([]);
        expect((await call('record', { action: 'create' })).event.version).to.equal(1);
        expect((await call('record', { action: 'create', requestId: 'next' })).event.version).to.equal(2);
    });

    it('does not reuse an expired reservation when the same request ID is used again after retention', async () => {
        const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        await call('record', { action: 'create' });
        clock.tick(96 * 86400000);
        stored.clear();

        const { event } = await call('record', { action: 'create' });

        expect(event.version).to.equal(2);
        expect(event.createdAt).to.equal(new Date().toISOString());
        expect((await call('list')).events.map((item) => item.version)).to.deep.equal([2]);
    });

    it('keeps numbering metadata private and free of authors, field values and AEM version IDs', async () => {
        const { event } = await save();
        const { body } = numberingFiles.get(`/private/history/promotion/${PROJECT}/numbering.json`);
        expect(body).to.deep.equal({
            lastVersion: 1,
            entries: { [event.id]: { version: 1, createdAt: event.createdAt } },
        });
        const presign = files.generatePresignURL.getCalls().find(({ args: [path] }) => path.endsWith('/numbering.json'));
        expect(presign.args).to.deep.equal([
            `private/history/promotion/${PROJECT}/numbering.json`,
            { permissions: 'rw', expiryInSeconds: 300, urlType: 'internal' },
        ]);
        expect(
            fetchStub
                .getCalls()
                .filter(({ args: [url] }) => url.includes('files.example.com'))
                .every(({ args: [, options] }) => !options.headers?.Authorization && options.redirect === 'error'),
        ).to.equal(true);
    });

    it('fails explicitly rather than returning UUID labels when numbering storage is unavailable or contended', async () => {
        const numberedStorage = fetchStub.withArgs(sinon.match((url) => url.includes('files.example.com')));
        numberedStorage.resolves(response({}, 503));
        await expectError(call('record', { action: 'create' }), 503);
        expect(stored.size).to.equal(0);
        numberedStorage.callsFake(async (url, options = {}) =>
            options.method === 'PUT' ? response({}, 412) : response({}, 404),
        );
        await expectError(call('record', { action: 'create' }), 503);
        expect(stored.size).to.equal(0);
    });

    it('does not read previous page entries again when following a cursor', async () => {
        await recordHistory(25);
        const first = await call('list');
        state.get.resetHistory();

        const second = await call('list', { cursor: first.cursor });

        expect(second.events).to.have.length(10);
        expect(state.get.getCalls().filter(({ args: [key] }) => key.includes('.entry.'))).to.have.length(12);
    });

    it('performs independent AEM reads concurrently without exceeding four requests', async () => {
        await recordHistory(12);
        let active = 0;
        let maximum = 0;
        global.fetch = async (...args) => {
            if (!args[0].includes('/adobe/sites/cf/fragments/')) return fetchStub(...args);
            active += 1;
            maximum = Math.max(maximum, active);
            try {
                await Promise.resolve();
                return await fetchStub(...args);
            } finally {
                active -= 1;
            }
        };

        await call('list');

        expect(maximum).to.be.greaterThan(1);
        expect(maximum).to.be.at.most(4);
    });

    it('ignores expired catalogs', async () => {
        const { event } = await save();
        const [key] = [...stored.keys()];
        stored.set(key, JSON.stringify({ ...event, createdAt: new Date(Date.now() - 96 * 86400000).toISOString() }));
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

    it('never creates versions on default fragments outside the promotion project', async () => {
        const parentPath = '/content/dam/mas/acom/en_US/card';
        fragments.set(OTHER, { ...makeVariation(), id: OTHER, path: parentPath });
        fragments.get(PROJECT).fields[0].values = [parentPath];
        const { event } = await save(VARIATION);
        expect(nativePosts().map(({ args: [url] }) => url)).not.to.include(
            `https://author.example.com/adobe/sites/cf/fragments/${OTHER}/versions`,
        );
        expect(event.afterSnapshot.inheritanceUnavailable).to.deep.equal([
            { fragmentId: VARIATION, reason: 'outside-project' },
        ]);
        expect([...stored.values()].join('')).not.to.include('"fields"');
        fetchStub.withArgs(sinon.match((url) => url.includes(`/fragments/${OTHER}`))).resolves(response({}, 403));
        expect((await call('list')).events).to.have.length(1);
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
        const error = await expectError(undo(event), 409);
        expect(error.message).to.equal('Unrelated content changed before version capture');
        expect(error.result.restored).to.deep.equal([VARIATION]);
        expect(error.result).not.to.have.property('versionPending');
        const replay = await expectError(undo(event), 409);
        expect(replay.message).to.equal(error.message);
        expect(replay.result).to.deep.equal(error.result);
        expect(writes()).to.have.length(1);
        expect((await call('list')).events).to.have.length(1);
    });

    it('reports pending outcomes if a post-write conflict cannot be persisted for safe replay', async () => {
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
        const put = state.put;
        state.put = async (key, value, options) => {
            if (JSON.parse(value).conflict) throw new Error('State unavailable');
            return put(key, value, options);
        };

        const error = await expectError(undo(event), 503);

        expect(error.result).to.include({ versionPending: true });
        expect(error.result.restored).to.deep.equal([VARIATION]);
        expect(writes()).to.have.length(1);
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
        { rootId: '../root' },
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
