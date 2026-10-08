import { expect } from '@open-wc/testing';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import { PAGE_NAMES } from '../../src/constants.js';

describe('router + bulk publish', () => {
    it('navigates to BULK_PUBLISH', async () => {
        Store.profile.set({ email: 'curator@adobe.com' });
        Store.users.set([{ userPrincipalName: 'curator@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-CURATORS'] }]);
        Store.users.setMeta('loaded', true);
        await router.navigateToPage(PAGE_NAMES.BULK_PUBLISH)();
        expect(Store.page.get()).to.equal(PAGE_NAMES.BULK_PUBLISH);
    });

    it('redirects users outside the bulk publish group', async () => {
        Store.profile.set({ email: 'author@adobe.com' });
        Store.users.set([{ userPrincipalName: 'author@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-EDITORS'] }]);
        Store.users.setMeta('loaded', true);
        await router.navigateToPage(PAGE_NAMES.BULK_PUBLISH)();
        expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
    });

    it('navigates to BULK_PUBLISH_EDITOR with a projectId', async () => {
        Store.profile.set({ email: 'curator@adobe.com' });
        Store.users.set([{ userPrincipalName: 'curator@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-CURATORS'] }]);
        Store.users.setMeta('loaded', true);
        await router.navigateToPage(PAGE_NAMES.BULK_PUBLISH_EDITOR, {
            bulkPublishProjectId: 'abc',
        })();
        expect(Store.page.get()).to.equal(PAGE_NAMES.BULK_PUBLISH_EDITOR);
        expect(Store.bulkPublishProjects.projectId.get()).to.equal('abc');
    });
});
