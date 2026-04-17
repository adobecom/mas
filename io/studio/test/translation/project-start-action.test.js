const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');
const common = require('../../src/common.js');

chai.use(sinonChai);

const { expect } = chai;

function createResponse(json = {}, etag = null) {
    return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(json),
        headers: {
            get: (name) => (name === 'etag' ? etag : null),
        },
    };
}

describe('Translation project-start action', function () {
    this.timeout(5000);
    let mockLogger;
    let mockIms;
    let fetchStub;
    let putJobPayload;
    let putProjectSummary;
    let patchProjectSummary;
    let enqueueJob;
    let buildSiblingActionName;
    let invokeAsyncAction;
    let projectStartAction;

    const baseParams = {
        __ow_headers: {
            authorization: 'Bearer token',
        },
        __ow_action_name: '/ns/MerchAtScaleStudio/translation-project-start',
        __ow_api_key: 'api-key',
        __ow_api_host: 'runtime.example.com',
        __ow_namespace: 'ns',
        projectId: 'project-1',
        surface: 'acom',
        allowedClientId: 'mas-studio',
        odinEndpoint: 'https://odin.example.com',
        translationMapping: {
            acom: 'transcreation',
        },
    };

    const projectCF = {
        id: 'project-1',
        created: {
            by: 'user@example.com',
        },
        modified: {
            by: 'editor@example.com',
        },
        fields: [
            { name: 'fragments', values: ['/content/dam/mas/foo/en_US/fragment1'] },
            { name: 'collections', values: [] },
            { name: 'placeholders', values: [] },
            { name: 'targetLocales', values: ['de_DE'] },
            { name: 'submissionDate', values: [] },
            { name: 'status', values: ['DRAFT'] },
            { name: 'title', values: ['Test Project'] },
            { name: 'projectType', values: ['translation'] },
        ],
    };

    beforeEach(() => {
        mockLogger = {
            info: sinon.stub(),
            error: sinon.stub(),
        };
        mockIms = {
            validateTokenAllowList: sinon.stub(),
        };
        fetchStub = sinon.stub();
        putJobPayload = sinon.stub().resolves();
        putProjectSummary = sinon.stub().resolves();
        patchProjectSummary = sinon.stub().resolves();
        enqueueJob = sinon.stub().resolves();
        buildSiblingActionName = sinon.stub().returns('/ns/MerchAtScaleStudio/translation-project-dispatcher');
        invokeAsyncAction = sinon.stub().resolves({ activationId: 'dispatcher-activation-1' });
        global.fetch = fetchStub;

        const ImsConstructorStub = sinon.stub().returns(mockIms);

        projectStartAction = proxyquire('../../src/translation/project-start.js', {
            '@adobe/aio-sdk': {
                Core: {
                    Logger: sinon.stub().returns(mockLogger),
                },
            },
            '@adobe/aio-lib-ims': {
                Ims: ImsConstructorStub,
            },
            './state.js': {
                putJobPayload,
                putProjectSummary,
                patchProjectSummary,
            },
            './queue.js': {
                enqueueJob,
            },
            '../common.js': {
                ...common,
                buildSiblingActionName,
                invokeAsyncAction,
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return 400 when projectId is missing', async () => {
        const result = await projectStartAction.main({
            ...baseParams,
            projectId: undefined,
        });

        expect(result.error.statusCode).to.equal(400);
        expect(result.error.body.error).to.include('projectId');
    });

    it('should return 401 when IMS validation fails', async () => {
        mockIms.validateTokenAllowList.resolves({ valid: false });

        const result = await projectStartAction.main(baseParams);

        expect(result.error.statusCode).to.equal(401);
        expect(result.error.body.error).to.equal('Authorization failed');
    });

    it('should queue the project and return 202 with a jobId', async () => {
        mockIms.validateTokenAllowList.resolves({ valid: true });
        fetchStub.onFirstCall().resolves(createResponse(projectCF, '"etag-1"'));
        fetchStub.onSecondCall().resolves(
            createResponse({
                ...projectCF,
                fields: projectCF.fields.map((field) => {
                    if (field.name === 'submissionDate') {
                        return { ...field, values: ['2026-03-25T16:00:00Z'] };
                    }
                    if (field.name === 'status') {
                        return { ...field, values: ['QUEUED'] };
                    }
                    return field;
                }),
            }),
        );
        const clock = sinon.useFakeTimers(new Date('2026-03-25T16:00:00Z'));

        const result = await projectStartAction.main(baseParams);

        expect(result).to.deep.equal({
            statusCode: 202,
            body: {
                jobId: 'project-1',
                submissionDate: '2026-03-25T16:00:00Z',
            },
        });
        expect(putJobPayload).to.have.been.calledOnceWith(
            'project-1',
            sinon.match({
                jobId: 'project-1',
                projectId: 'project-1',
                surface: 'acom',
                authToken: 'token',
                projectType: 'translation',
                translationFlow: 'transcreation',
                requestedAt: '2026-03-25T16:00:00Z',
                requestedBy: 'editor@example.com',
            }),
            { params: baseParams },
        );
        expect(putProjectSummary).to.have.been.calledOnceWith(
            'project-1',
            sinon.match({
                projectId: 'project-1',
                jobId: 'project-1',
                status: 'QUEUED',
                submissionDate: '2026-03-25T16:00:00Z',
                queue: {
                    state: 'QUEUED',
                    queuedAt: '2026-03-25T16:00:00Z',
                    startedAt: null,
                },
                dispatcher: {
                    invokedAt: null,
                },
                worker: {
                    activationId: null,
                    dispatchedAt: null,
                    startedAt: null,
                },
                versioning: {
                    startedAt: null,
                    completedAt: null,
                    durationMs: null,
                    itemCount: 0,
                    completedItemCount: 0,
                    failedItemCount: 0,
                },
                lastError: null,
            }),
            { params: baseParams, updatedAt: '2026-03-25T16:00:00Z' },
        );
        expect(enqueueJob).to.have.been.calledOnceWith('project-1');
        expect(buildSiblingActionName).to.have.been.calledOnceWith(baseParams, 'translation-project-dispatcher', {
            overrideParamName: 'translationProjectStartDispatcherActionName',
        });
        expect(invokeAsyncAction).to.have.been.calledOnceWith(
            '/ns/MerchAtScaleStudio/translation-project-dispatcher',
            { jobId: 'project-1' },
            baseParams,
        );
        expect(patchProjectSummary).to.have.been.calledOnceWith(
            'project-1',
            {
                dispatcher: {
                    invokedAt: '2026-03-25T16:00:00.000Z',
                },
            },
            { params: baseParams },
        );

        const patchCall = fetchStub.secondCall;
        expect(patchCall.args[0]).to.equal('https://odin.example.com/adobe/sites/cf/fragments/project-1');
        expect(patchCall.args[1].method).to.equal('PATCH');
        const patchBody = JSON.parse(patchCall.args[1].body);
        expect(patchBody).to.deep.equal([
            { op: 'replace', path: '/fields/4/values', value: ['2026-03-25T16:00:00Z'] },
            { op: 'replace', path: '/fields/5/values', value: ['QUEUED'] },
        ]);

        clock.restore();
    });

    it('should fall back to created.by when modified.by is missing from the project fragment', async () => {
        mockIms.validateTokenAllowList.resolves({ valid: true });
        const projectWithoutModifier = {
            ...projectCF,
            modified: undefined,
        };
        fetchStub.onFirstCall().resolves(createResponse(projectWithoutModifier, '"etag-1"'));
        fetchStub.onSecondCall().resolves(createResponse(projectWithoutModifier));

        await projectStartAction.main(baseParams);

        expect(putJobPayload).to.have.been.calledOnceWith(
            'project-1',
            sinon.match({
                requestedBy: 'user@example.com',
            }),
            { params: baseParams },
        );
    });

    it('should default translationFlow to transcreation when the surface is not mapped', async () => {
        mockIms.validateTokenAllowList.resolves({ valid: true });
        fetchStub.onFirstCall().resolves(createResponse(projectCF, '"etag-1"'));
        fetchStub.onSecondCall().resolves(createResponse(projectCF));

        await projectStartAction.main({
            ...baseParams,
            surface: 'unknown-surface',
        });

        expect(putJobPayload).to.have.been.calledOnceWith(
            'project-1',
            sinon.match({
                translationFlow: 'transcreation',
                surface: 'unknown-surface',
            }),
            { params: sinon.match({ ...baseParams, surface: 'unknown-surface' }) },
        );
    });

    it('should set requestedBy to null when modified.by and created.by are missing from the project fragment', async () => {
        mockIms.validateTokenAllowList.resolves({ valid: true });
        const projectWithoutUserInfo = {
            ...projectCF,
            modified: undefined,
            created: undefined,
        };
        fetchStub.onFirstCall().resolves(createResponse(projectWithoutUserInfo, '"etag-1"'));
        fetchStub.onSecondCall().resolves(createResponse(projectWithoutUserInfo));

        await projectStartAction.main(baseParams);

        expect(putJobPayload).to.have.been.calledOnceWith(
            'project-1',
            sinon.match({
                requestedBy: null,
            }),
            { params: baseParams },
        );
    });
});
