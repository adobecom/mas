import { expect } from 'chai';
import sinon from 'sinon';
import filesLib from '@adobe/aio-lib-files';
import { getFilesClient, resetFilesClient } from '../../src/fragment/utils/files-client.js';
import { MockFiles } from './mocks/MockFiles.js';

describe('Files client', () => {
    afterEach(() => {
        sinon.restore();
        resetFilesClient();
    });

    it('is only returned once initialised, which is started once', async () => {
        const client = new MockFiles();
        const init = sinon.stub(filesLib, 'init').resolves(client);
        expect(getFilesClient({})).to.be.undefined;
        expect(getFilesClient({})).to.be.undefined;
        await init.returnValues[0];
        expect(getFilesClient({})).to.equal(client);
        expect(init.calledOnce).to.be.true;
    });

    it('is initialised again after a failed initialisation', async () => {
        const init = sinon.stub(filesLib, 'init').rejects(new Error('no credentials'));
        expect(getFilesClient({})).to.be.undefined;
        await init.returnValues[0].catch(() => {});
        await Promise.resolve();
        expect(getFilesClient({})).to.be.undefined;
        expect(init.calledTwice).to.be.true;
    });
});
