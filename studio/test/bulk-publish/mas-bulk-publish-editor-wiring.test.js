import { fixture, html, expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import '../../src/bulk-publish/mas-bulk-publish-editor.js';

describe('mas-bulk-publish-editor wiring', () => {
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('calls repository.getFragmentById for each URL on validate', async () => {
        const project = {
            id: 'p',
            getFieldValue: (k) =>
                ({
                    status: 'Draft',
                    urls: 'https://mas.adobe.com/studio.html#query=9a75e22f-9c48-418d-8da3-687e8f635282',
                    items: '[]',
                    locales: [],
                    title: 'x',
                })[k],
            setFieldValue: sinon.stub(),
        };
        Store.bulkPublishProjects.inEdit.set(project);
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        const getByIdStub = sinon.stub().resolves({ path: '/x/card' });
        el.repository = {
            getFragmentById: getByIdStub,
            saveFragment: sinon.stub(),
        };
        await el.validate();
        expect(getByIdStub.calledWith('9a75e22f-9c48-418d-8da3-687e8f635282')).to.equal(true);
    });
});
