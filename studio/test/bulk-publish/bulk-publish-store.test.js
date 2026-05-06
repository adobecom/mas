import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { BULK_PUBLISH_STATUS } from '../../src/constants.js';
import { startPublishing } from '../../src/bulk-publish/bulk-publish-store.js';

describe('startPublishing', () => {
    let repo;
    let clientStub;

    beforeEach(() => {
        Store.bulkPublishProjects.publishing.set({});
        repo = { saveFragment: sinon.stub().resolves() };
    });

    it('sets status to Publishing, saves, then Published on resolve', async () => {
        const project = {
            id: 'p1',
            getFieldValue: sinon.stub(),
            setFieldValue: sinon.stub(),
        };
        const response = {
            summary: { total: 1, published: 1, skipped: 0, failed: 0 },
            details: [],
        };
        clientStub = sinon.stub().resolves(response);

        await startPublishing({
            project,
            paths: ['/p'],
            locales: [],
            token: 't',
            ioBaseUrl: 'x',
            publishFn: clientStub,
            repository: repo,
        });

        const statusCalls = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statusCalls).to.deep.equal([BULK_PUBLISH_STATUS.PUBLISHING, BULK_PUBLISH_STATUS.PUBLISHED]);
        expect(repo.saveFragment.callCount).to.equal(2);
    });

    it('reverts status to Draft and stores lastError on reject', async () => {
        const project = {
            id: 'p2',
            getFieldValue: sinon.stub(),
            setFieldValue: sinon.stub(),
        };
        clientStub = sinon.stub().rejects(new Error('boom'));

        await startPublishing({
            project,
            paths: ['/p'],
            locales: [],
            token: 't',
            ioBaseUrl: 'x',
            publishFn: clientStub,
            repository: repo,
        }).catch(() => {});

        const statusCalls = project.setFieldValue
            .getCalls()
            .filter((c) => c.args[0] === 'status')
            .map((c) => c.args[1]);
        expect(statusCalls[statusCalls.length - 1]).to.equal(BULK_PUBLISH_STATUS.DRAFT);
        const errorCalls = project.setFieldValue.getCalls().filter((c) => c.args[0] === 'lastError');
        const errorCall = errorCalls[errorCalls.length - 1];
        expect(errorCall.args[1]).to.equal('boom');
    });
});
