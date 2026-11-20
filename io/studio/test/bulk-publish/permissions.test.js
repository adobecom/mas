const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('bulk-publish permissions', () => {
    const scopedGroup = 'GRP-ODIN-MAS-CCDAH-CURATORS';
    const path = '/content/dam/mas/ccd/en_US/card';
    const targets = ['/content/dam/mas/express/en_US/card', '/content/dam/mas/acom/en_US/card'];
    const operations = ['dispatch', 'publish', 'save', 'snapshot', 'revert', 'reset'];
    const input = {
        authToken: 'token',
        odinEndpoint: 'https://odin',
        projectId: 'project',
        __ow_headers: { authorization: 'Bearer token' },
    };
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
    let permissions, fetchStub, state, readProject, request, originalFetch;

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
        request = sinon.stub().resolves(response({ id: 'card', path }));
        permissions = proxyquire('../../src/bulk-publish/permissions.js', {
            '@adobe/aio-lib-state': { init: async () => state },
            './project.js': { readProjectFragment: readProject },
            '../common.js': { fetchOdin: request },
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
        await rejects(permissions.authorizeProject(input), 403);
        expect(readProject.called).to.be.false;
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

    for (const surface of ['ccd', 'adobe-home']) {
        for (const operation of operations) {
            it(`allows ${operation} on a ${surface} project containing other surfaces like ACOM curators`, async () => {
                const fragment = {
                    ...project,
                    path: project.path.replace('/ccd/', `/${surface}/`),
                    fields: [
                        { name: 'fragments', values: [...targets, '/content/dam/mas/adobe-home/en_US/card'] },
                        { name: 'locales', values: ['fr_FR'] },
                        {
                            name: 'snapshots',
                            values: [JSON.stringify({ fragmentId: 'foreign-card', path: targets[0], publishComplete: false })],
                        },
                    ],
                };
                readProject.resolves({ fragment });

                const context = await permissions.authorizeProject(
                    { ...input, paths: targets, includeCards: true, includeVariations: true },
                    undefined,
                    operation,
                );

                expect(context.fragment).to.equal(fragment);
                expect(() => context.assertPaths(targets)).not.to.throw();
                expect(context.permissions.surfaces).to.be.undefined;
                expect(request.called).to.be.false;
            });
        }
    }

    for (const surface of ['express', 'acom']) {
        for (const operation of operations) {
            it(`denies ${operation} on a ${surface} project even when the supplied surface is CCD`, async () => {
                readProject.resolves({ fragment: { ...project, path: project.path.replace('/ccd/', `/${surface}/`) } });

                await rejects(permissions.authorizeProject({ ...input, surface: 'ccd' }, undefined, operation), 403);

                expect(request.called).to.be.false;
            });
        }
    }

    for (const change of [
        { model: { path: '/conf/mas/settings/dam/cfm/models/promotion' } },
        { path: '/content/dam/mas/ccd/en_US/../../express/project' },
        { path: '/content/dam/mas/ccd/en_US/%2e%2e/project' },
    ]) {
        it(`denies an invalid project ${JSON.stringify(change)}`, async () => {
            readProject.resolves({ fragment: { ...project, ...change } });
            await rejects(permissions.authorizeProject(input), 403);
        });
    }

    it('denies a project outside the scope even when its fragment was already read by the action', async () => {
        await rejects(
            permissions.authorizeProject(input, { ...project, path: project.path.replace('/ccd/', '/express/') }, 'save'),
            403,
        );
    });

    it('rejects malformed project IDs before reading Odin', async () => {
        await rejects(permissions.authorizeProject({ ...input, projectId: '../foreign?path=other' }), 403);
        expect(readProject.called).to.be.false;
    });

    it('fails closed on project read failures without exposing their contents', async () => {
        readProject.rejects(new Error('secret-token'));
        await rejects(permissions.authorizeProject(input), 502);
    });

    it('keeps target-surface authorization for legacy snapshot requests without project context', async () => {
        request.resolves(response({ id: 'foreign', path: targets[0] }));
        await rejects(
            permissions.authorizeEntries({
                ...input,
                entries: [JSON.stringify({ fragmentId: 'foreign', path })],
            }),
            403,
        );
    });

    it('skips deleted entries in legacy snapshot requests', async () => {
        request.resolves({ ok: false, status: 404 });
        await permissions.authorizeEntries({ ...input, entries: [JSON.stringify({ fragmentId: 'deleted' })] });
    });

    for (const group of ['GRP-ODIN-MAS-ACOM-CURATORS', 'GRP-ODIN-MAS-ADMINS']) {
        it(`preserves the existing ${group} publication flow`, async () => {
            state.get.resolves({ value: JSON.stringify([{ userPrincipalName: 'author@adobe.com', groups: [group] }]) });
            await permissions.authorizeProject(input, undefined, 'dispatch');
            await permissions.authorizeProject(input, undefined, 'snapshot');
            expect(readProject.called).to.be.false;
            await permissions.authorizeProject(input);
            expect(request.called).to.be.false;
        });
    }

    describe('cross-surface project operations', () => {
        beforeEach(() => {
            request.resolves(response({ id: 'foreign', path: targets[0] }));
            readProject.resolves({
                fragment: {
                    ...project,
                    fields: [
                        { name: 'fragments', values: targets },
                        { name: 'snapshots', values: [JSON.stringify({ fragmentId: 'foreign', path: targets[0] })] },
                    ],
                },
            });
        });

        it('dispatches the authorized project using the caller token', async () => {
            const invoke = sinon.stub().resolves({ activationId: 'activation' });
            const action = proxyquire('../../src/bulk-publish/index.js', {
                './permissions.js': permissions,
                '../../utils.js': { isAllowed: async () => true, getBearerToken: () => 'token' },
                '../common.js': { invokeAsyncAction: invoke },
            });

            const result = await action.main(input);

            expect(result.statusCode).to.equal(202);
            expect(invoke.firstCall.args[1]).to.include({ projectId: 'project', authToken: 'token' });
        });

        for (const includeCards of [false, true]) {
            it(`publishes cross-surface targets with the caller token when includeCards=${includeCards}`, async () => {
                const publishResolved = sinon.stub().resolves(targets.map((target) => ({ path: target, status: 'published' })));
                const recordSnapshot = sinon.stub().resolves({ entries: [], failures: [] });
                const createSnapshot = sinon.stub().resolves({ entries: [], expandedPaths: targets, failures: [] });

                const result = await require('../../src/bulk-publish/bulk-publish-worker.js').runWorker(
                    { ...input, includeCards, includeVariations: includeCards },
                    {
                        authorizeProject: permissions.authorizeProject,
                        recordSnapshot,
                        createSnapshot,
                        publishResolved,
                        publishDictionaryIndexes: sinon.stub().resolves([]),
                        updateProjectFragment: sinon.stub().resolves(),
                        logger: { info: sinon.stub(), error: sinon.stub() },
                    },
                );

                expect(result.published).to.equal(2);
                expect(publishResolved.firstCall.args.slice(0, 3)).to.deep.equal([
                    targets,
                    input.odinEndpoint,
                    input.authToken,
                ]);
                expect(recordSnapshot.firstCall.args[0].assertPaths).to.be.undefined;
                expect(createSnapshot.firstCall.args[0].assertPaths).to.be.undefined;
            });
        }

        for (const file of ['save-snapshot-action', 'snapshot-action', 'revert-action', 'check-modifications-action']) {
            it(`allows cross-surface targets in ${file} after authorizing the project`, async () => {
                const effect = sinon.stub().resolves({ entries: [], failures: [], skipped: [] });
                const action = proxyquire(`../../src/bulk-publish/${file}.js`, {
                    './permissions.js': permissions,
                    '../../utils.js': { isAllowed: async () => true, getBearerToken: () => 'token' },
                    './project.js': { readProjectFragment: readProject, updateProjectFragment: sinon.stub().resolves() },
                    './snapshot.js': {
                        recordSnapshot: effect,
                        createSnapshot: effect,
                        revertSnapshot: effect,
                        checkModifications: effect,
                    },
                });

                const result = await action.main({
                    ...input,
                    paths: targets,
                    entries: [JSON.stringify({ fragmentId: 'foreign', path: targets[0] })],
                });

                expect(result.statusCode).to.equal(200);
                expect(effect.calledOnce).to.be.true;
                expect(effect.firstCall.args[0].authToken).to.equal(input.authToken);
                expect(effect.firstCall.args[0].assertPaths).to.be.undefined;
            });
        }

        it('denies snapshot comparison for a project outside CCD and Adobe Home', async () => {
            readProject.resolves({ fragment: { ...project, path: project.path.replace('/ccd/', '/express/') } });
            const checkModifications = sinon.stub();
            const action = proxyquire('../../src/bulk-publish/check-modifications-action.js', {
                './permissions.js': permissions,
                '../../utils.js': { isAllowed: async () => true, getBearerToken: () => 'token' },
                './snapshot.js': { checkModifications },
            });

            const result = await action.main({ ...input, entries: [JSON.stringify({ fragmentId: 'card', path })] });

            expect(result.error.statusCode).to.equal(403);
            expect(checkModifications.called).to.be.false;
        });

        it('preserves partial publication when a requested localization is missing', async () => {
            const localizedPath = targets[0].replace('/en_US/', '/fr_FR/');
            readProject.resolves({
                fragment: {
                    ...project,
                    fields: [
                        { name: 'fragments', values: [targets[0]] },
                        { name: 'locales', values: ['fr_FR'] },
                    ],
                },
            });
            const publishResolved = sinon.stub().resolves([
                { path: targets[0], status: 'published' },
                { path: localizedPath, status: 'failed', reason: 'not-found' },
            ]);
            const updateProjectFragment = sinon.stub().resolves();

            const result = await require('../../src/bulk-publish/bulk-publish-worker.js').runWorker(input, {
                authorizeProject: permissions.authorizeProject,
                recordSnapshot: sinon.stub().resolves({ entries: [], failures: [] }),
                createSnapshot: sinon.stub().resolves({ entries: [], expandedPaths: [targets[0]], failures: [] }),
                publishResolved,
                publishDictionaryIndexes: sinon.stub().resolves([]),
                updateProjectFragment,
                logger: { info: sinon.stub(), error: sinon.stub() },
            });

            expect(result.published).to.equal(1);
            expect(result.failures).to.deep.equal([{ path: localizedPath, reason: 'not-localized' }]);
            expect(updateProjectFragment.lastCall.args[3].status).to.equal('Partially published');
        });
    });
});
