const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('bulk-publish permissions', () => {
    const scopedGroup = 'GRP-ODIN-MAS-CCDAH-CURATORS';
    const path = '/content/dam/mas/ccd/en_US/card';
    let permissions, fetchStub, state, readProject, originalFetch;
    const project = {
        id: 'project',
        path: '/content/dam/mas/ccd/en_US/bulk-publish/project',
        model: { path: '/conf/mas/settings/dam/cfm/models/bulk-publish-project' },
        fields: [{ name: 'fragments', values: [path] }],
    };
    const response = (body) => ({ ok: true, status: 200, json: async () => body });
    const org = (groups, ident = '3B962FB55F5F922E0A495C88') => [
        { orgRef: { ident, authSrc: 'AdobeOrg' }, groups: groups.map((groupName) => ({ groupName })) },
    ];

    beforeEach(() => {
        originalFetch = global.fetch;
        fetchStub = sinon.stub().resolves(response({ id: 'verified-user', email: 'author@adobe.com' }));
        global.fetch = fetchStub;
        state = {
            get: sinon
                .stub()
                .resolves({ value: JSON.stringify([{ userPrincipalName: 'author@adobe.com', groups: [scopedGroup] }]) }),
        };
        readProject = sinon.stub().resolves({ fragment: structuredClone(project) });
        permissions = proxyquire('../../src/bulk-publish/permissions.js', {
            '@adobe/aio-lib-state': { init: async () => state },
            './project.js': { readProjectFragment: readProject },
            '../common.js': {
                fetchOdin: async (endpoint, uri) =>
                    response(
                        uri.includes('?path=')
                            ? { items: [{ id: 'card', path: new URL(uri, endpoint).searchParams.get('path'), fields: [] }] }
                            : { id: 'card', path },
                    ),
            },
        });
    });

    afterEach(() => {
        global.fetch = originalFetch;
        sinon.restore();
    });

    async function rejects(promise, status) {
        try {
            await promise;
            expect.fail('Expected permission rejection');
        } catch (error) {
            expect(error.statusCode).to.equal(status);
        }
    }

    it('uses authoritative LDAP memberships tied to verified IMS email', async () => {
        expect(await permissions.getPermissions('token')).to.deep.equal({ allowed: true, surfaces: ['ccd', 'adobe-home'] });
        expect(fetchStub.firstCall.args[0]).to.equal('https://ims-na1.adobelogin.com/ims/profile/v1');
        expect(state.get.firstCall.args).to.deep.equal(['mas-users']);
    });

    for (const group of ['GRP-ODIN-MAS-ACOM-CURATORS', 'GRP-ODIN-MAS-ADMINS']) {
        it(`retains unrestricted access for ${group}`, async () => {
            state.get.resolves({
                value: JSON.stringify([{ userPrincipalName: 'AUTHOR@ADOBE.COM', groups: [scopedGroup, group.toLowerCase()] }]),
            });
            expect(await permissions.getPermissions('token')).to.deep.equal({ allowed: true });
        });
    }

    it('denies unrelated groups', async () => {
        state.get.resolves({
            value: JSON.stringify([{ userPrincipalName: 'author@adobe.com', groups: ['GRP-ODIN-MAS-EDITORS'] }]),
        });
        expect(await permissions.getPermissions('token')).to.deep.equal({ allowed: false });
    });

    it('does not use client-provided identity or group fields', async () => {
        state.get.resolves({ value: '[]' });
        expect(await permissions.getPermissions('token', { email: 'author@adobe.com', groups: [scopedGroup] })).to.deep.equal({
            allowed: false,
        });
    });

    it('uses fixed IMS organization memberships for test users', async () => {
        fetchStub.onCall(0).resolves(response({ id: 'test-user', email: 'test@adobetest.com' }));
        fetchStub.onCall(1).resolves(response(org([scopedGroup.toLowerCase()])));
        expect(await permissions.getPermissions('token')).to.deep.equal({ allowed: true, surfaces: ['ccd', 'adobe-home'] });
        expect(state.get.called).to.be.false;
    });

    it('ignores test-user memberships in a foreign organization', async () => {
        fetchStub.onCall(0).resolves(response({ id: 'test-user', email: 'test@adobetest.com' }));
        fetchStub.onCall(1).resolves(response(org([scopedGroup], 'foreign')));
        expect(await permissions.getPermissions('token')).to.deep.equal({ allowed: false });
    });

    for (const value of [undefined, '{', '{}', '[{"userPrincipalName":"author@adobe.com","groups":[null]}]']) {
        it(`fails closed on unavailable/malformed membership cache ${value}`, async () => {
            state.get.resolves({ value });
            await rejects(permissions.getPermissions('token'), 503);
        });
    }

    it('fails closed with a generic profile error', async () => {
        fetchStub.rejects(new Error('secret-token'));
        await rejects(permissions.getPermissions('token'), 502);
    });

    it('allows a CCD project and validates its localized targets before effects', async () => {
        const context = await permissions.authorizeProject({
            authToken: 'token',
            odinEndpoint: 'https://odin',
            projectId: 'project',
        });
        expect(context.fragment.id).to.equal('project');
        expect(() => context.assertPaths(['/content/dam/mas/ccd/fr_FR/card'])).not.to.throw();
        expect(() => context.assertPaths(['/content/dam/mas/acom/en_US/card'])).to.throw('Bulk publish permission denied');
    });

    it('allows an Adobe Home project', async () => {
        readProject.resolves({ fragment: { ...project, path: project.path.replace('/ccd/', '/adobe-home/'), fields: [] } });
        await permissions.authorizeProject({ authToken: 'token', odinEndpoint: 'https://odin', projectId: 'project' });
    });

    for (const change of [
        { path: project.path.replace('/ccd/', '/acom/') },
        { model: { path: '/conf/mas/settings/dam/cfm/models/promotion' } },
        { fields: [{ name: 'fragments', values: ['/content/dam/mas/acom/en_US/card'] }] },
        { fields: [{ name: 'fragments', values: ['/content/dam/mas/ccd/en_US/../../acom/en_US/card'] }] },
        { fields: [{ name: 'fragments', values: ['/content/dam/mas/ccd/en_US/%2e%2e/card'] }] },
        {
            fields: [
                { name: 'locales', values: ['../../acom/en_US'] },
                { name: 'fragments', values: [path] },
            ],
        },
    ]) {
        it(`denies foreign project or target ${JSON.stringify(change)}`, async () => {
            readProject.resolves({ fragment: { ...project, ...change } });
            await rejects(
                permissions.authorizeProject({ authToken: 'token', odinEndpoint: 'https://odin', projectId: 'project' }),
                403,
            );
        });
    }

    it('denies a snapshot whose trusted fragment ID resolves to another surface', async () => {
        permissions = proxyquire('../../src/bulk-publish/permissions.js', {
            '@adobe/aio-lib-state': { init: async () => state },
            './project.js': { readProjectFragment: readProject },
            '../common.js': { fetchOdin: async () => response({ id: 'foreign', path: '/content/dam/mas/acom/en_US/card' }) },
        });
        await rejects(
            permissions.authorizeEntries({
                authToken: 'token',
                odinEndpoint: 'https://odin',
                entries: [JSON.stringify({ fragmentId: 'foreign', path })],
            }),
            403,
        );
    });

    it('rejects foreign nested expansion before reading the foreign fragment', async () => {
        const request = sinon.stub().resolves(
            response({
                items: [{ id: 'card', path, fields: [{ name: 'variations', values: ['/content/dam/mas/acom/fr_FR/card'] }] }],
            }),
        );
        permissions = proxyquire('../../src/bulk-publish/permissions.js', {
            '@adobe/aio-lib-state': { init: async () => state },
            './project.js': { readProjectFragment: readProject },
            '../common.js': { fetchOdin: request },
        });
        await rejects(
            permissions.authorizeProject({
                authToken: 'token',
                odinEndpoint: 'https://odin',
                projectId: 'project',
                includeVariations: true,
            }),
            403,
        );
        expect(request.calledOnce).to.be.true;
    });

    it('rejects malformed project IDs before reading Odin', async () => {
        await rejects(
            permissions.authorizeProject({
                authToken: 'token',
                odinEndpoint: 'https://odin',
                projectId: '../foreign?path=other',
            }),
            403,
        );
        expect(readProject.called).to.be.false;
    });

    it('fails closed on project read failures without exposing their contents', async () => {
        readProject.rejects(new Error('secret-token'));
        await rejects(
            permissions.authorizeProject({
                authToken: 'token',
                odinEndpoint: 'https://odin',
                projectId: 'project',
            }),
            502,
        );
    });

    describe('operation-specific snapshot authorization', () => {
        const input = {
            projectId: 'project',
            odinEndpoint: 'https://odin',
            authToken: 'token',
            __ow_headers: { authorization: 'Bearer token' },
        };
        let request, fragment;

        beforeEach(() => {
            fragment = {
                ...project,
                fields: [
                    ...structuredClone(project.fields),
                    {
                        name: 'snapshots',
                        values: [
                            JSON.stringify({
                                fragmentId: 'deleted-card',
                                path: '/content/dam/mas/ccd/en_US/deleted',
                                publishComplete: false,
                            }),
                        ],
                    },
                ],
            };
            readProject.resolves({ fragment });
            request = sinon
                .stub()
                .callsFake(async (endpoint, uri) =>
                    uri.includes('?') ? response({ items: [{ id: 'card', path, fields: [] }] }) : { ok: false, status: 404 },
                );
            permissions = proxyquire('../../src/bulk-publish/permissions.js', {
                '@adobe/aio-lib-state': { init: async () => state },
                './project.js': { readProjectFragment: readProject },
                '../common.js': { fetchOdin: request },
            });
        });

        it('saves a replacement snapshot without resolving obsolete deleted entries', async () => {
            const entries = [JSON.stringify({ fragmentId: 'card', path, versionId: 'v-current' })];
            const record = sinon.stub().resolves({ entries, failures: [] });
            const update = sinon.stub().resolves();
            const action = proxyquire('../../src/bulk-publish/save-snapshot-action.js', {
                './permissions.js': permissions,
                './project.js': { readProjectFragment: readProject, updateProjectFragment: update },
                './snapshot.js': { recordSnapshot: record },
                '../../utils.js': { isAllowed: async () => true, getBearerToken: () => 'token' },
            });
            const result = await action.main(input);
            expect(result.statusCode).to.equal(200);
            expect(record.calledOnce).to.be.true;
            expect(update.firstCall.args[3].snapshots).to.deep.equal(entries);
            expect(request.called).to.be.false;
        });

        it('resets project state without resolving stored snapshots or current targets', async () => {
            fragment.fields[0].values = ['/content/dam/mas/express/en_US/not-consumed'];
            const update = sinon.stub().resolves();
            const action = proxyquire('../../src/bulk-publish/reset-action.js', {
                './permissions.js': permissions,
                './project.js': { readProjectFragment: readProject, updateProjectFragment: update },
                '../../utils.js': { isAllowed: async () => true, getBearerToken: () => 'token' },
            });
            const result = await action.main(input);
            expect(result.statusCode).to.equal(200);
            expect(update.calledOnce).to.be.true;
            expect(request.called).to.be.false;
        });

        it('authorizes ordinary publication without consuming obsolete pending entries when expansion is off', async () => {
            await permissions.authorizeProject(input);
            expect(request.callCount).to.equal(1);
            expect(request.firstCall.args[1]).to.include('path=');
        });

        it('still denies foreign pending paths that expanded publication actually consumes', async () => {
            fragment.fields[1].values = [
                JSON.stringify({
                    fragmentId: 'foreign',
                    path: '/content/dam/mas/express/en_US/foreign',
                    publishComplete: false,
                }),
            ];
            await rejects(permissions.authorizeProject({ ...input, includeCards: true }), 403);
        });

        it('preserves revert skipping deleted scoped fragments instead of requiring their existence', async () => {
            const revert = sinon.stub().resolves({ failures: [], skipped: ['deleted-card'] });
            const update = sinon.stub().resolves();
            fragment.fields[0].values = ['/content/dam/mas/express/en_US/not-consumed'];
            const action = proxyquire('../../src/bulk-publish/revert-action.js', {
                './permissions.js': permissions,
                './project.js': { readProjectFragment: readProject, updateProjectFragment: update },
                './snapshot.js': { revertSnapshot: revert },
                '../../utils.js': { isAllowed: async () => true, getBearerToken: () => 'token' },
            });
            const result = await action.main(input);
            expect(result.statusCode).to.equal(200);
            expect(revert.calledOnce).to.be.true;
            expect(request.callCount).to.equal(1);
        });

        it('still denies saving current project targets from another surface', async () => {
            fragment.fields[0].values = ['/content/dam/mas/express/en_US/foreign'];
            await rejects(permissions.authorizeProject(input, fragment, 'save'), 403);
            expect(request.called).to.be.false;
        });

        it('still denies restoring an existing snapshot fragment from another surface', async () => {
            request.resolves(response({ id: 'deleted-card', path: '/content/dam/mas/express/en_US/foreign' }));
            await rejects(permissions.authorizeProject(input, fragment, 'revert'), 403);
        });

        it('authorizes snapshot creation using only the supplied targets rather than obsolete project entries', async () => {
            fragment.fields[0].values = ['/content/dam/mas/express/en_US/not-consumed'];
            await permissions.authorizeProject({ ...input, paths: [path] }, fragment, 'snapshot');
            expect(request.called).to.be.false;
        });
    });

    describe('implicit publishing references', () => {
        const input = {
            authToken: 'token',
            odinEndpoint: 'https://odin',
            projectId: 'project',
            includeCards: false,
            includeVariations: false,
        };
        const childPath = '/content/dam/mas/ccd/en_US/child';
        const foreignPath = '/content/dam/mas/express/en_US/foreign';
        let request;

        beforeEach(() => {
            request = sinon.stub().callsFake(async (endpoint, uri) => {
                const target = new URL(uri, endpoint).searchParams.get('path');
                return response({
                    items: [{ id: target === path ? 'card' : 'child', path: target, status: 'DRAFT', fields: [] }],
                });
            });
            permissions = proxyquire('../../src/bulk-publish/permissions.js', {
                '@adobe/aio-lib-state': { init: async () => state },
                './project.js': { readProjectFragment: readProject },
                '../common.js': { fetchOdin: request },
            });
        });

        it('allows direct dictionary-index replication without authorizing its modified ACOM fallback', async () => {
            const indexPath = '/content/dam/mas/ccd/en_US/dictionary/index';
            const fallbackPath = '/content/dam/mas/acom/en_US/dictionary/index';
            readProject.resolves({
                fragment: { ...project, fields: [{ name: 'fragments', values: [indexPath] }] },
            });
            request.onCall(0).resolves(
                response({
                    items: [
                        {
                            id: 'index',
                            path: indexPath,
                            status: 'MODIFIED',
                            fields: [{ name: 'fallback', type: 'content-fragment', values: [fallbackPath] }],
                        },
                    ],
                }),
            );
            request.onCall(1).resolves(
                response({
                    items: [
                        {
                            id: 'fallback',
                            path: fallbackPath,
                            status: 'MODIFIED',
                            fields: [],
                        },
                    ],
                }),
            );
            await permissions.authorizeProject(input);
            expect(request.callCount).to.equal(1);
        });

        it('still denies explicit foreign expansions of a directly replicated dictionary index', async () => {
            const indexPath = '/content/dam/mas/ccd/en_US/dictionary/index';
            readProject.resolves({
                fragment: { ...project, fields: [{ name: 'fragments', values: [indexPath] }] },
            });
            request.onCall(0).resolves(
                response({
                    items: [
                        {
                            id: 'index',
                            path: indexPath,
                            fields: [{ name: 'cards', type: 'content-reference', values: [foreignPath] }],
                        },
                    ],
                }),
            );
            await rejects(permissions.authorizeProject({ ...input, includeCards: true }), 403);
        });

        it('still checks dictionary-index fallback references reached by a workflow', async () => {
            const indexPath = '/content/dam/mas/ccd/en_US/dictionary/index';
            request.onCall(0).resolves(
                response({
                    items: [
                        {
                            id: 'card',
                            path,
                            fields: [{ name: 'dictionary', type: 'content-fragment', values: [indexPath] }],
                        },
                    ],
                }),
            );
            request.onCall(1).resolves(
                response({
                    items: [
                        {
                            id: 'index',
                            path: indexPath,
                            status: 'MODIFIED',
                            fields: [{ name: 'fallback', type: 'content-fragment', values: [foreignPath] }],
                        },
                    ],
                }),
            );
            await rejects(permissions.authorizeProject(input), 403);
        });

        for (const indexFirst of [true, false]) {
            it(`checks a dictionary index also reached through a workflow when indexFirst=${indexFirst}`, async () => {
                const indexPath = '/content/dam/mas/ccd/en_US/dictionary/index';
                readProject.resolves({
                    fragment: {
                        ...project,
                        fields: [{ name: 'fragments', values: indexFirst ? [indexPath, path] : [path, indexPath] }],
                    },
                });
                request.callsFake(async (endpoint, uri) => {
                    const target = new URL(uri, endpoint).searchParams.get('path');
                    return response({
                        items: [
                            {
                                id: target === path ? 'card' : 'index',
                                path: target,
                                status: 'MODIFIED',
                                fields: [
                                    {
                                        name: 'dependency',
                                        type: 'content-fragment',
                                        values: [target === path ? indexPath : foreignPath],
                                    },
                                ],
                            },
                        ],
                    });
                });
                await rejects(permissions.authorizeProject(input), 403);
            });
        }

        for (const entryPoint of ['dispatcher', 'worker']) {
            it(`denies default-flags collection publication before ${entryPoint} effects`, async () => {
                request.onCall(0).resolves(
                    response({
                        items: [
                            {
                                id: 'collection',
                                path,
                                fields: [{ name: 'cards', type: 'content-reference', values: [foreignPath] }],
                            },
                        ],
                    }),
                );
                const effect = sinon.stub();
                const result =
                    entryPoint === 'dispatcher'
                        ? await proxyquire('../../src/bulk-publish/index.js', {
                              './permissions.js': permissions,
                              '../../utils.js': { isAllowed: async () => true, getBearerToken: () => 'token' },
                              '../common.js': { invokeAsyncAction: effect },
                          }).main({ ...input, __ow_headers: { authorization: 'Bearer token' } })
                        : await require('../../src/bulk-publish/bulk-publish-worker.js').main(input, {
                              authorizeProject: permissions.authorizeProject,
                              createSnapshot: effect,
                              recordSnapshot: effect,
                              updateProjectFragment: effect,
                              publishResolved: effect,
                              logger: { info: sinon.stub(), error: sinon.stub() },
                          });
                expect(result.error.statusCode).to.equal(403);
                expect(effect.called).to.be.false;
            });
        }

        it('recursively checks mask and placeholder references independently of expansion flags', async () => {
            request.onCall(0).resolves(
                response({
                    items: [{ id: 'card', path, fields: [{ name: 'mask', type: 'content-fragment', values: [childPath] }] }],
                }),
            );
            request.onCall(1).resolves(
                response({
                    items: [
                        {
                            id: 'mask',
                            path: childPath,
                            status: 'DRAFT',
                            fields: [{ name: 'placeholder', type: 'fragment-reference', values: [foreignPath] }],
                        },
                    ],
                }),
            );
            await rejects(permissions.authorizeProject(input), 403);
            expect(request.callCount).to.equal(3);
        });

        it('checks authoritative reference metadata rather than only known field names', async () => {
            request.onCall(0).resolves(
                response({
                    items: [{ id: 'card', path, fields: [], references: [{ type: 'fragment', path: foreignPath }] }],
                }),
            );
            await rejects(permissions.authorizeProject(input), 403);
        });

        it('resolves UUID references before trusting their actual surface', async () => {
            request.onCall(0).resolves(
                response({
                    items: [
                        {
                            id: 'card',
                            path,
                            fields: [{ name: 'dependency', type: 'content-fragment', values: ['foreign-id'] }],
                        },
                    ],
                }),
            );
            request.onCall(1).resolves(response({ id: 'foreign-id', path: foreignPath, status: 'DRAFT', fields: [] }));
            await rejects(permissions.authorizeProject(input), 403);
            expect(request.secondCall.args[1]).to.equal('/adobe/sites/cf/fragments/foreign-id?references=direct-hydrated');
        });

        it('terminates a same-surface reference cycle without dropping dependency checks', async () => {
            request.onCall(0).resolves(
                response({
                    items: [{ id: 'card', path, fields: [{ name: 'cards', type: 'content-reference', values: [childPath] }] }],
                }),
            );
            request.onCall(1).resolves(
                response({
                    items: [
                        {
                            id: 'child',
                            path: childPath,
                            status: 'DRAFT',
                            fields: [{ name: 'collection', type: 'content-fragment', values: [path] }],
                        },
                    ],
                }),
            );
            await permissions.authorizeProject(input);
            expect(request.callCount).to.equal(2);
        });

        it('authorizes a same-surface UUID dependency using its current Odin path', async () => {
            request.onCall(0).resolves(
                response({
                    items: [
                        { id: 'card', path, fields: [{ name: 'dependency', type: 'content-fragment', values: ['child-id'] }] },
                    ],
                }),
            );
            request.onCall(1).resolves(response({ id: 'child-id', path: childPath, status: 'DRAFT', fields: [] }));
            await permissions.authorizeProject(input);
            expect(request.callCount).to.equal(2);
        });

        it('checks implicit dependencies of locale-expanded cards before authorizing publication', async () => {
            const localizedRoot = path.replace('/en_US/', '/fr_FR/');
            const localizedChild = childPath.replace('/en_US/', '/fr_FR/');
            readProject.resolves({
                fragment: { ...project, fields: [...project.fields, { name: 'locales', values: ['fr_FR'] }] },
            });
            const fragments = new Map([
                [path, { id: 'card', path, fields: [{ name: 'cards', values: [childPath] }] }],
                [localizedRoot, { id: 'localized-root', path: localizedRoot, fields: [] }],
                [childPath, { id: 'child', path: childPath, status: 'DRAFT', fields: [] }],
                [
                    localizedChild,
                    {
                        id: 'localized-child',
                        path: localizedChild,
                        fields: [{ name: 'dependency', type: 'content-fragment', values: [foreignPath] }],
                    },
                ],
                [foreignPath, { id: 'foreign', path: foreignPath, status: 'DRAFT', fields: [] }],
            ]);
            request.callsFake(async (endpoint, uri) =>
                response({ items: [fragments.get(new URL(uri, endpoint).searchParams.get('path'))] }),
            );
            await rejects(permissions.authorizeProject({ ...input, includeCards: true }), 403);
        });

        for (const missing of [{ items: [] }, null]) {
            it(`fails closed when an implicit dependency cannot be resolved: ${JSON.stringify(missing)}`, async () => {
                request.onCall(0).resolves(
                    response({
                        items: [
                            { id: 'card', path, fields: [{ name: 'cards', type: 'content-reference', values: [childPath] }] },
                        ],
                    }),
                );
                request.onCall(1).resolves(missing === null ? { ok: false, status: 404 } : response(missing));
                await rejects(permissions.authorizeProject(input), 502);
            });
        }

        it('fails closed on a dependency without an actual path', async () => {
            request.resolves(response({ items: [{ id: 'card', fields: [] }] }));
            await rejects(permissions.authorizeProject(input), 403);
        });

        it('fails closed on malformed authoritative reference metadata', async () => {
            request.resolves(response({ items: [{ id: 'card', path, fields: [], references: {} }] }));
            await rejects(permissions.authorizeProject(input), 502);
        });

        it('checks implicit dependencies of pending snapshot targets before worker effects', async () => {
            readProject.resolves({
                fragment: {
                    ...project,
                    fields: [
                        ...project.fields,
                        {
                            name: 'snapshots',
                            values: [JSON.stringify({ fragmentId: 'child-id', path: childPath, publishComplete: false })],
                        },
                    ],
                },
            });
            request.callsFake(async (endpoint, uri) => {
                const target = new URL(uri, endpoint).searchParams.get('path');
                const child = {
                    id: 'child-id',
                    path: childPath,
                    fields: [{ name: 'dependency', type: 'content-fragment', values: [foreignPath] }],
                };
                if (target === foreignPath) {
                    return response({ items: [{ id: 'foreign', path: foreignPath, status: 'DRAFT', fields: [] }] });
                }
                return response(target ? { items: [target === childPath ? child : { id: 'card', path, fields: [] }] } : child);
            });
            const effect = sinon.stub();
            const result = await require('../../src/bulk-publish/bulk-publish-worker.js').main(
                {
                    ...input,
                    includeCards: true,
                },
                {
                    authorizeProject: permissions.authorizeProject,
                    createSnapshot: effect,
                    recordSnapshot: effect,
                    updateProjectFragment: effect,
                    publishResolved: effect,
                    logger: { info: sinon.stub(), error: sinon.stub() },
                },
            );
            expect(result.error.statusCode).to.equal(403);
            expect(effect.called).to.be.false;
        });

        it('does not broaden snapshot expansion when authorizing implicit publishing references', async () => {
            const fragment = { fields: [{ name: 'cards', type: 'content-reference', values: [childPath] }] };
            expect(permissions.getReferencePaths(fragment, input)).to.deep.equal([]);
        });

        it('allows a verified passive published cross-surface reference without broadening snapshot targets', async () => {
            request.onCall(0).resolves(
                response({
                    items: [
                        { id: 'card', path, fields: [{ name: 'cards', type: 'content-reference', values: [foreignPath] }] },
                    ],
                }),
            );
            request.onCall(1).resolves(
                response({
                    items: [{ id: 'foreign', path: foreignPath, status: 'PUBLISHED', fields: [] }],
                }),
            );
            await permissions.authorizeProject(input);
            expect(request.callCount).to.equal(2);
        });

        it('does not upgrade a passive mask reference into snapshot expansion', async () => {
            const passiveChild = '/content/dam/mas/express/en_US/passive-child';
            request.onCall(0).resolves(
                response({
                    items: [{ id: 'card', path, fields: [{ name: 'mask', type: 'content-fragment', values: [foreignPath] }] }],
                }),
            );
            request.onCall(1).resolves(
                response({
                    items: [
                        {
                            id: 'mask',
                            path: foreignPath,
                            status: 'PUBLISHED',
                            fields: [{ name: 'cards', type: 'content-reference', values: [passiveChild] }],
                        },
                    ],
                }),
            );
            request.onCall(2).resolves(
                response({
                    items: [{ id: 'passive-child', path: passiveChild, status: 'PUBLISHED', fields: [] }],
                }),
            );
            await permissions.authorizeProject({ ...input, includeCards: true });
            expect(request.callCount).to.equal(3);
        });

        it('rechecks snapshot expansion when a previously implicit dependency becomes an explicit target', async () => {
            const secondRoot = '/content/dam/mas/ccd/en_US/second-root';
            const grandchild = '/content/dam/mas/ccd/en_US/grandchild';
            const locales = ['fr_FR'];
            readProject.resolves({
                fragment: {
                    ...project,
                    fields: [
                        { name: 'fragments', values: [path, secondRoot] },
                        { name: 'locales', values: locales },
                    ],
                },
            });
            const fragments = new Map([
                [path, { id: 'card', path, fields: [{ name: 'mask', type: 'content-fragment', values: [childPath] }] }],
                [secondRoot, { id: 'second', path: secondRoot, fields: [{ name: 'cards', values: [childPath] }] }],
                [
                    childPath,
                    { id: 'child', path: childPath, status: 'DRAFT', fields: [{ name: 'cards', values: [grandchild] }] },
                ],
                [grandchild, { id: 'grandchild', path: grandchild, status: 'DRAFT', fields: [] }],
                [foreignPath, { id: 'foreign', path: foreignPath, status: 'DRAFT', fields: [] }],
            ]);
            for (const base of [path, secondRoot, childPath, grandchild]) {
                const localized = base.replace('/en_US/', '/fr_FR/');
                fragments.set(localized, {
                    id: `localized-${base.split('/').at(-1)}`,
                    path: localized,
                    fields:
                        base === grandchild ? [{ name: 'dependency', type: 'content-fragment', values: [foreignPath] }] : [],
                });
            }
            request.callsFake(async (endpoint, uri) =>
                response({ items: [fragments.get(new URL(uri, endpoint).searchParams.get('path'))] }),
            );
            await rejects(permissions.authorizeProject({ ...input, includeCards: true }), 403);
        });

        for (const status of [undefined, 'UNKNOWN']) {
            it(`fails closed when an implicit target status cannot be established: ${status}`, async () => {
                request.onCall(0).resolves(
                    response({
                        items: [
                            { id: 'card', path, fields: [{ name: 'cards', type: 'content-reference', values: [childPath] }] },
                        ],
                    }),
                );
                request.onCall(1).resolves(response({ items: [{ id: 'child', path: childPath, status, fields: [] }] }));
                await rejects(permissions.authorizeProject(input), 502);
            });
        }

        it('still denies cross-surface targets explicitly expanded for publication when already published', async () => {
            request.onCall(0).resolves(
                response({
                    items: [
                        { id: 'card', path, fields: [{ name: 'cards', type: 'content-reference', values: [foreignPath] }] },
                    ],
                }),
            );
            request.onCall(1).resolves(
                response({
                    items: [{ id: 'foreign', path: foreignPath, status: 'PUBLISHED', fields: [] }],
                }),
            );
            await rejects(permissions.authorizeProject({ ...input, includeCards: true }), 403);
        });

        it('checks active descendants of passive published cross-surface references', async () => {
            const descendantPath = '/content/dam/mas/express/en_US/descendant';
            request.onCall(0).resolves(
                response({
                    items: [
                        { id: 'card', path, fields: [{ name: 'cards', type: 'content-reference', values: [foreignPath] }] },
                    ],
                }),
            );
            request.onCall(1).resolves(
                response({
                    items: [
                        {
                            id: 'foreign',
                            path: foreignPath,
                            status: 'PUBLISHED',
                            fields: [{ name: 'dependency', type: 'content-fragment', values: [descendantPath] }],
                        },
                    ],
                }),
            );
            request.onCall(2).resolves(
                response({
                    items: [{ id: 'descendant', path: descendantPath, status: 'UNPUBLISHED', fields: [] }],
                }),
            );
            await rejects(permissions.authorizeProject(input), 403);
            expect(request.callCount).to.equal(3);
        });

        it('preserves global publication permissions without scoped dependency resolution', async () => {
            state.get.resolves({
                value: JSON.stringify([{ userPrincipalName: 'author@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-CURATORS'] }]),
            });
            request.resolves(response({ items: [] }));
            await permissions.authorizeProject(input, undefined, 'dispatch');
            await permissions.authorizeProject(input, undefined, 'snapshot');
            expect(readProject.called).to.be.false;
            await permissions.authorizeProject(input);
            expect(request.called).to.be.false;
        });
    });
});
