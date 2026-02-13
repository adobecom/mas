import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import MasFragmentEditor from '../src/mas-fragment-editor.js';

describe('MasFragmentEditor grouped variation parent resolution', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    function createEditor({ getReferencedBy, getByPath, getLocaleDefaultFragmentAsync } = {}) {
        const editor = new MasFragmentEditor();
        const fragmentsApi = {
            getReferencedBy: getReferencedBy || sandbox.stub().resolves({ parentReferences: [] }),
            getByPath: getByPath || sandbox.stub().resolves(null),
        };
        const repository = { aem: { sites: { cf: { fragments: fragmentsApi } } } };

        sandbox.stub(editor, 'repository').get(() => repository);

        editor.editorContextStore = {
            localeDefaultFragment: null,
            defaultLocaleId: null,
            parentFetchPromise: null,
            notify: sandbox.stub(),
            getLocaleDefaultFragmentAsync: getLocaleDefaultFragmentAsync || sandbox.stub().resolves(null),
        };

        return { editor, fragmentsApi };
    }

    it('polls grouped references every second for up to 15 seconds', async () => {
        const clock = sandbox.useFakeTimers();
        const getReferencedBy = sandbox.stub().resolves({ parentReferences: [] });
        const getByPath = sandbox.stub().resolves(null);
        const { editor } = createEditor({ getReferencedBy, getByPath });

        const resultPromise = editor.pollGroupedVariationParentReference('/content/dam/mas/sandbox/en_US/pac/pzn/grouped');
        await clock.tickAsync(15000);
        const result = await resultPromise;

        expect(result).to.be.null;
        expect(getReferencedBy.callCount).to.equal(16);
        expect(getByPath.called).to.be.false;
    });

    it('resolves parent when a grouped variation reference appears during polling', async () => {
        const clock = sandbox.useFakeTimers();
        const parentPath = '/content/dam/mas/sandbox/en_US/pac/default-fragment';
        const parentData = { id: 'parent-fragment-id', path: parentPath };
        const getReferencedBy = sandbox.stub();
        getReferencedBy.onCall(0).resolves({ parentReferences: [] });
        getReferencedBy.onCall(1).resolves({ parentReferences: [{ path: parentPath }] });
        const getByPath = sandbox.stub().resolves(parentData);
        const { editor } = createEditor({ getReferencedBy, getByPath });

        const resultPromise = editor.pollGroupedVariationParentReference('/content/dam/mas/sandbox/en_US/pac/pzn/grouped');
        await clock.tickAsync(1000);
        const result = await resultPromise;

        expect(result).to.deep.equal(parentData);
        expect(getReferencedBy.callCount).to.equal(2);
        expect(getByPath.calledOnceWith(parentPath)).to.be.true;
        expect(editor.editorContextStore.defaultLocaleId).to.equal('parent-fragment-id');
        expect(editor.editorContextStore.localeDefaultFragment).to.deep.equal(parentData);
    });

    it('sets orphan warning message when grouped variation remains unreferenced', async () => {
        const { editor } = createEditor();
        sandbox.stub(editor, 'pollGroupedVariationParentReference').resolves(null);

        const result = await editor.resolveVariationParentFragment('/content/dam/mas/sandbox/en_US/pac/pzn/grouped');

        expect(result).to.be.null;
        expect(editor.groupedVariationOrphanMessage).to.equal(
            'No default-locale fragment currently references this grouped variation. Inheritance cannot be resolved, and this fragment may be orphaned.',
        );
    });

    it('renders orphan grouped-variation state as a panel', () => {
        const { editor } = createEditor();
        editor.groupedVariationOrphanMessage =
            'No default-locale fragment currently references this grouped variation. Inheritance cannot be resolved, and this fragment may be orphaned.';

        const panel = editor.orphanGroupedVariationState;
        const markup = panel.strings.join('');

        expect(markup).to.include('orphan-grouped-variation-panel');
        expect(markup).to.include('Parent reference missing for this grouped variation.');
        expect(markup).to.include('Re-link this grouped variation from its default-locale source fragment');
    });
});
