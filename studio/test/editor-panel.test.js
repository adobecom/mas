import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/editor-panel.js';
import Store from '../src/store.js';
import { PROMOTION_MODEL_PATH } from '../src/constants.js';

describe('EditorPanel confirmDelete', () => {
    let sandbox;
    let el;
    let mockRepo;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        el = document.createElement('editor-panel');
        mockRepo = {
            aem: { sites: { cf: { fragments: { getReferencedBy: sandbox.stub().resolves({ parentReferences: [] }) } } } },
            deleteFragment: sandbox.stub().resolves(true),
            removeFromParentVariations: sandbox.stub().resolves(),
        };
        sandbox.stub(el, 'repository').get(() => mockRepo);
        el.inEdit.value = {
            get: () => ({ id: 'variation-id', path: '/path' }),
        };
        el.localeDefaultFragment = { id: 'parent' };
        sandbox.stub(el.editorContextStore, 'isVariation').returns(true);
        sandbox.stub(Store.fragments.inEdit, 'set').callsFake((val) => {
            Store.fragments.inEdit.value = val;
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('captures promo-project references before deleting a variation directly, then cleans them up once the delete succeeds', async () => {
        const promoProjectPath = '/content/dam/mas/sandbox/promotions/summer-sale';
        const promoProject = {
            id: 'promo-1',
            fields: [{ name: 'fragments', type: 'content-fragment', multiple: true, values: ['/path'] }],
        };
        const getReferencedBy = sandbox.stub().resolves({ parentReferences: [{ path: promoProjectPath }] });
        const getByPath = sandbox.stub().resolves({ id: 'promo-1', model: { path: PROMOTION_MODEL_PATH } });
        const getWithEtag = sandbox.stub().resolves(promoProject);
        const save = sandbox.stub().resolves();
        mockRepo.aem = { sites: { cf: { fragments: { getReferencedBy, getByPath, getWithEtag, save } } } };

        await el.confirmDelete();

        expect(getReferencedBy.calledWith('/path')).to.be.true;
        expect(getReferencedBy.calledBefore(mockRepo.deleteFragment)).to.be.true;
        expect(getByPath.calledWith(promoProjectPath)).to.be.true;
        const [savedProject, saveOptions] = save.firstCall.args;
        expect(savedProject.getFieldValues('fragments')).to.deep.equal([]);
        expect(saveOptions).to.deep.equal({ refetchEtag: false });
    });

    it('does not clean up promo-project references when the direct variation delete fails', async () => {
        mockRepo.deleteFragment.resolves(false);
        const promoProjectPath = '/content/dam/mas/sandbox/promotions/summer-sale';
        const getByPath = sandbox.stub();
        const save = sandbox.stub();
        mockRepo.aem = {
            sites: {
                cf: {
                    fragments: {
                        getReferencedBy: sandbox.stub().resolves({ parentReferences: [{ path: promoProjectPath }] }),
                        getByPath,
                        save,
                    },
                },
            },
        };

        await el.confirmDelete();

        expect(getByPath.called).to.be.false;
        expect(save.called).to.be.false;
    });
});
