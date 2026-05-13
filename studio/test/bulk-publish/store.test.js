import { expect } from '@open-wc/testing';
import Store from '../../src/store.js';
import { PAGE_NAMES, QUICK_ACTION, BULK_PUBLISH_PROJECT_MODEL_ID, BULK_PUBLISH_STATUS } from '../../src/constants.js';

describe('bulk-publish constants + store', () => {
    it('defines page names', () => {
        expect(PAGE_NAMES.BULK_PUBLISH).to.equal('bulkPublish');
        expect(PAGE_NAMES.BULK_PUBLISH_EDITOR).to.equal('bulkPublishEditor');
    });

    it('defines a VALIDATE quick-action', () => {
        expect(QUICK_ACTION.VALIDATE).to.equal('validate');
    });

    it('defines the bulk-publish content-model id and status values', () => {
        expect(BULK_PUBLISH_PROJECT_MODEL_ID).to.be.a('string').and.not.be.empty;
        expect(BULK_PUBLISH_STATUS).to.deep.equal({
            DRAFT: 'Draft',
            PUBLISHING: 'Publishing',
            PUBLISHED: 'Published',
            LOCKED: 'Locked',
        });
    });

    it('exposes bulk-publish subtree with list/inEdit/projectId/publishing', () => {
        expect(Store.bulkPublishProjects).to.exist;
        expect(Store.bulkPublishProjects.list.data.get()).to.deep.equal([]);
        expect(Store.bulkPublishProjects.list.loading.get()).to.equal(false);
        expect(Store.bulkPublishProjects.inEdit.get()).to.equal(null);
        expect(Store.bulkPublishProjects.projectId.get()).to.equal(null);
        expect(Store.bulkPublishProjects.publishing.get()).to.deep.equal({});
    });
});
