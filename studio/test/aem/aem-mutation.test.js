import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { AEM } from '../../src/aem/aem.js';

describe('AEM fragment mutation observer', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => sandbox.restore());

    for (const [api, method, action] of [
        ['save', 'saveFragment', 'save'],
        ['create', 'createFragment', 'create'],
        ['copy', 'copyFragmentClassic', 'duplicate'],
        ['publish', 'publishFragment', 'publish'],
        ['publishFragments', 'publishFragments', 'publish'],
        ['unpublish', 'unpublishFragment', 'unpublish'],
        ['delete', 'deleteFragment', 'delete'],
        ['forceDelete', 'forceDeleteFragment', 'delete'],
    ]) {
        it(`observes ${api} before and after a successful write`, async () => {
            const order = [];
            sandbox.stub(AEM.prototype, method).callsFake(async () => {
                order.push('write');
                return 'saved';
            });
            const observer = sandbox.spy(async (kind, target, write) => {
                order.push('prepare');
                const result = await write();
                order.push('complete');
                return result;
            });
            const aem = new AEM('test', undefined, observer);
            const target = { id: 'fragment' };
            const result = await aem.sites.cf.fragments[api](target);
            expect(observer.firstCall.args.slice(0, 2)).to.deep.equal([action, target]);
            expect(order).to.deep.equal(['prepare', 'write', 'complete']);
            expect(result).to.equal('saved');
        });
    }

    it('preserves ordinary writes without an observer', async () => {
        sandbox.stub(AEM.prototype, 'saveFragment').resolves('saved');
        const aem = new AEM('test');
        expect(await aem.sites.cf.fragments.save({ id: 'fragment' })).to.equal('saved');
    });

    it('observes standalone tag updates without duplicating the internal write', async () => {
        const observer = sandbox.spy(async (action, target, write) => write());
        const aem = new AEM('test', undefined, observer);
        const target = { id: 'fragment', newTags: [] };
        sandbox.stub(window, 'fetch').resolves(new Response('{}', { headers: { Etag: '"one"' } }));
        await aem.saveTags(target);
        expect(observer.calledOnce).to.be.true;
        expect(observer.firstCall.args.slice(0, 2)).to.deep.equal(['save', target]);
    });

    it('observes classic-copy creation against the destination path', async () => {
        const observer = sandbox.spy(async (action, target, write) => write());
        const aem = new AEM('test', undefined, observer);
        sandbox.stub(window, 'fetch').resolves(new Response(JSON.stringify({ id: 'copy' })));
        await aem.createFragmentCopy({ id: 'source', model: { id: 'model' }, fields: [] }, '/destination', 'copy', 'csrf');
        expect(observer.firstCall.args[0]).to.equal('create');
        expect(observer.firstCall.args[1].id).to.be.undefined;
        expect(observer.firstCall.args[1].path).to.equal('/destination/copy');
    });
});
