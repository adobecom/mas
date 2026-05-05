import { fixture, html, expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import '../../src/bulk-publish/mas-bulk-publish-editor.js';

describe('mas-bulk-publish-editor wiring', () => {
    let repositoryEl;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        repositoryEl = document.createElement('mas-repository');
        repositoryEl.setAttribute('bucket', 'test-bucket');
        document.body.appendChild(repositoryEl);
    });

    afterEach(() => {
        Store.bulkPublishProjects.inEdit.set(null);
        repositoryEl.remove();
        sandbox.restore();
    });

    it('calls repository.getFragmentById for each URL on validate', async () => {
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        await el.updateComplete;

        const data = {
            status: 'Draft',
            urls: 'https://mas.adobe.com/studio.html#query=9a75e22f-9c48-418d-8da3-687e8f635282',
            items: '[]',
            locales: [],
            title: 'x',
        };
        Store.bulkPublishProjects.inEdit.set({
            id: null,
            getFieldValue: (k) => data[k],
            setFieldValue: sinon.stub(),
        });
        await el.updateComplete;

        const getByIdStub = sinon.stub().resolves({ path: '/x/card', id: 'abc', fields: [] });
        sandbox.stub(repositoryEl, 'getFragmentById').callsFake(getByIdStub);

        await el.validate();
        expect(getByIdStub.calledWith('9a75e22f-9c48-418d-8da3-687e8f635282')).to.equal(true);
    });
});
