const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('Promotion history web actions', () => {
    let execute;
    let handle;
    beforeEach(() => {
        execute = sinon.stub().resolves({ events: [] });
        ({ handle } = proxyquire('../../src/promo-history/action.js', { './service.js': { execute } }));
    });

    it('decodes JSON POST bodies without trusting caller authorization or endpoint overrides', async () => {
        const result = await handle('list', {
            __ow_method: 'post',
            odinEndpoint: 'https://configured.example.com',
            __ow_headers: { authorization: 'Bearer original' },
            __ow_body: Buffer.from(
                JSON.stringify({
                    projectId: 'project',
                    odinEndpoint: 'https://attacker.example.com',
                    __ow_headers: { authorization: 'Bearer forged' },
                }),
            ).toString('base64'),
        });
        expect(result.statusCode).to.equal(200);
        expect(execute.firstCall.args[1].odinEndpoint).to.equal('https://configured.example.com');
        expect(execute.firstCall.args[1].__ow_headers.authorization).to.equal('Bearer original');
        expect(execute.firstCall.args[1].projectId).to.equal('project');
    });

    it('returns safe actionable service errors', async () => {
        execute.rejects(Object.assign(new Error('Conflict'), { statusCode: 409 }));
        const result = await handle('restore', {});
        expect(result).to.include({ statusCode: 409 });
        expect(result.body).to.deep.equal({ error: 'Conflict' });
    });

    it('does not expose unexpected exception details', async () => {
        execute.rejects(new Error('private server details'));
        const result = await handle('list', {});
        expect(result.statusCode).to.equal(500);
        expect(result.body.error).not.to.include('private');
    });

    it('rejects malformed raw bodies', async () => {
        const result = await handle('record', { __ow_body: 'invalid' });
        expect(result.statusCode).to.equal(400);
        expect(execute.called).to.equal(false);
    });
});
