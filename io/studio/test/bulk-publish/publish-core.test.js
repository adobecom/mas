const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('bulk-publish/publish-core.js — publishResolved', () => {
    let core;
    let publishChunkStub;
    const logger = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() };

    beforeEach(() => {
        publishChunkStub = sinon.stub();
        core = proxyquire('../../src/bulk-publish/publish-core.js', {
            './publisher.js': { publishChunk: publishChunkStub },
        });
    });

    afterEach(() => sinon.restore());

    it('groups paths by locale, chunks, publishes, and returns flat details', async () => {
        publishChunkStub.callsFake(async ({ chunk }) => chunk.map((path) => ({ path, status: 'published' })));

        const resolved = ['/content/dam/mas/acom/en_US/a', '/content/dam/mas/acom/es_MX/a'];
        const details = await core.publishResolved(resolved, 'https://odin', 'token', logger);

        expect(details).to.have.length(2);
        expect(details.every((d) => d.status === 'published')).to.be.true;
        expect(publishChunkStub.callCount).to.equal(2);
    });
});
