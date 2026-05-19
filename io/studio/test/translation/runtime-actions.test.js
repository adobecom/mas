const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

const { expect } = chai;

describe('Translation runtime actions', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('should derive a sibling action name from the current action name', () => {
        const runtimeActions = require('../../src/common.js');

        const name = runtimeActions.buildSiblingActionName(
            {
                __ow_action_name: '/ns/MerchAtScaleStudio/translation-project-dispatcher',
            },
            'translation-project-start-worker',
        );

        expect(name).to.equal('/ns/MerchAtScaleStudio/translation-project-start-worker');
    });

    it('should use an explicit override action name when provided', () => {
        const runtimeActions = require('../../src/common.js');

        const name = runtimeActions.buildSiblingActionName(
            {
                translationProjectStartWorkerActionName: '/ns/custom/worker',
            },
            'translation-project-start-worker',
            {
                overrideParamName: 'translationProjectStartWorkerActionName',
            },
        );

        expect(name).to.equal('/ns/custom/worker');
    });

    it('should invoke an action asynchronously with runtime credentials', async () => {
        const invoke = sinon.stub().resolves({ activationId: 'activation-1' });
        const openwhiskFactory = sinon.stub().returns({
            actions: {
                invoke,
            },
        });

        const runtimeActions = proxyquire('../../src/common.js', {
            openwhisk: openwhiskFactory,
        });

        const result = await runtimeActions.invokeAsyncAction(
            '/ns/MerchAtScaleStudio/translation-project-start-worker',
            { jobId: 'job-1' },
            {
                __ow_api_key: 'api-key',
                __ow_api_host: 'https://runtime.example.com',
                __ow_namespace: 'ns',
            },
        );

        expect(openwhiskFactory).to.have.been.calledWith({
            api_key: 'api-key',
            apihost: 'https://runtime.example.com',
            namespace: 'ns',
        });
        expect(invoke).to.have.been.calledWith({
            name: '/ns/MerchAtScaleStudio/translation-project-start-worker',
            params: { jobId: 'job-1' },
            blocking: false,
        });
        expect(result).to.deep.equal({ activationId: 'activation-1' });
    });
});
