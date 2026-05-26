import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { MasRepository } from '../../src/mas-repository.js';

describe('MasRepository bulk-publish helpers', () => {
    let repo;
    beforeEach(() => {
        repo = new MasRepository();
        repo.search = { value: { path: 'sandbox' } };
        repo.processError = sinon.stub();
        repo.searchFragmentList = sinon.stub().resolves([{ id: 'f1', fields: [] }]);
    });

    it('loadBulkPublishProjects populates Store.bulkPublishProjects.list', async () => {
        await repo.loadBulkPublishProjects();
        const list = Store.bulkPublishProjects.list.data.get();
        expect(list).to.have.lengthOf(1);
    });

    it('loadBulkPublishProjects toggles loading flag', async () => {
        let sawLoading = false;
        const handler = (v) => {
            if (v === true) sawLoading = true;
        };
        Store.bulkPublishProjects.list.loading.subscribe(handler);
        await repo.loadBulkPublishProjects();
        Store.bulkPublishProjects.list.loading.unsubscribe(handler);
        expect(sawLoading).to.equal(true);
        expect(Store.bulkPublishProjects.list.loading.get()).to.equal(false);
    });

    it('getFragmentById delegates to aem.sites.cf.fragments.getById', async () => {
        repo.aem = { sites: { cf: { fragments: { getById: sinon.stub().resolves({ id: 'x' }) } } } };
        const result = await repo.getFragmentById('x');
        expect(result).to.deep.equal({ id: 'x' });
        expect(repo.aem.sites.cf.fragments.getById.calledWith('x')).to.equal(true);
    });
});
