import { expect } from '@open-wc/testing';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import { PAGE_NAMES } from '../../src/constants.js';

describe('router + bulk publish', () => {
    it('navigates to BULK_PUBLISH', async () => {
        await router.navigateToPage(PAGE_NAMES.BULK_PUBLISH)();
        expect(Store.page.get()).to.equal(PAGE_NAMES.BULK_PUBLISH);
    });

    it('navigates to BULK_PUBLISH_EDITOR with a projectId', async () => {
        await router.navigateToPage(PAGE_NAMES.BULK_PUBLISH_EDITOR, {
            bulkPublishProjectId: 'abc',
        })();
        expect(Store.page.get()).to.equal(PAGE_NAMES.BULK_PUBLISH_EDITOR);
        expect(Store.bulkPublishProjects.projectId.get()).to.equal('abc');
    });
});
