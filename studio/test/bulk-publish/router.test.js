import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { Router } from '../../src/router.js';
import { PAGE_NAMES } from '../../src/constants.js';
import { ReactiveStore } from '../../src/reactivity/reactive-store.js';
import { initUsers } from '../../src/users.js';
import { delay } from '../utils.js';

describe('router + bulk publish', () => {
    let router;
    let sandbox;
    let original;
    let subscriptions;
    let eventListeners;

    function setUser(groups) {
        Store.profile.set({ email: 'test@adobe.com' });
        Store.users.set([{ userPrincipalName: 'test@adobe.com', groups }]);
    }

    function mockLoadedUser(groups) {
        window.adobeIMS = { getProfile: async () => ({ email: 'test@adobe.com' }) };
        sandbox.stub(window, 'fetch').resolves({
            ok: true,
            json: async () => [{ userPrincipalName: 'test@adobe.com', groups }],
        });
    }

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        original = {
            profile: structuredClone(Store.profile.get()),
            users: structuredClone(Store.users.get()),
            loaded: Store.users.getMeta('loaded'),
            imsAccess: Store.users.getMeta('imsBulkPublishAccess'),
            page: Store.page.get(),
            search: structuredClone(Store.search.get()),
            projectId: Store.bulkPublishProjects.projectId.get(),
            adobeIMS: window.adobeIMS,
        };
        subscriptions = sandbox.spy(ReactiveStore.prototype, 'subscribe');
        eventListeners = sandbox.spy(window, 'addEventListener');
        Store.users.setMeta('loaded', true);
        Store.page.set(PAGE_NAMES.WELCOME);
        Store.bulkPublishProjects.projectId.set(null);
        router = new Router({ hash: '#page=welcome&path=acom' });
        setUser(['GRP-ODIN-MAS-ACOM-CURATORS']);
    });

    afterEach(async () => {
        for (const call of subscriptions.getCalls()) {
            call.thisValue.unsubscribe(call.args[0]);
        }
        for (const call of eventListeners.getCalls()) {
            window.removeEventListener(...call.args);
        }
        await delay(60);
        sandbox.restore();
        Store.profile.set(original.profile);
        Store.users.set(original.users);
        Store.users.setMeta('loaded', original.loaded);
        Store.users.setMeta('imsBulkPublishAccess', original.imsAccess);
        Store.page.set(original.page);
        Store.search.set(original.search);
        Store.bulkPublishProjects.projectId.set(original.projectId);
        window.adobeIMS = original.adobeIMS;
    });

    it('navigates to BULK_PUBLISH', async () => {
        await router.navigateToPage(PAGE_NAMES.BULK_PUBLISH)();
        expect(Store.page.get()).to.equal(PAGE_NAMES.BULK_PUBLISH);
    });

    it('redirects users outside the bulk publish group', async () => {
        setUser(['GRP-ODIN-MAS-ACOM-EDITORS']);
        await router.navigateToPage(PAGE_NAMES.BULK_PUBLISH)();
        expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
    });

    it('navigates to BULK_PUBLISH_EDITOR with a projectId', async () => {
        await router.navigateToPage(PAGE_NAMES.BULK_PUBLISH_EDITOR, {
            bulkPublishProjectId: 'abc',
        })();
        expect(Store.page.get()).to.equal(PAGE_NAMES.BULK_PUBLISH_EDITOR);
        expect(Store.bulkPublishProjects.projectId.get()).to.equal('abc');
    });

    it('does not retain the projectId when editor navigation is denied', async () => {
        setUser(['GRP-ODIN-MAS-ACOM-EDITORS']);
        Store.page.set(PAGE_NAMES.CONTENT);
        await router.navigateToPage(PAGE_NAMES.BULK_PUBLISH_EDITOR, { bulkPublishProjectId: 'abc' })();
        expect(Store.bulkPublishProjects.projectId.get()).to.be.null;
    });

    it('redirects a non-curator opening the editor by hash', async () => {
        setUser(['GRP-ODIN-MAS-ACOM-EDITORS']);
        router.location.hash = '#page=bulkPublishEditor&path=acom&bulkPublishProjectId=abc';
        router.start();
        expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
    });

    it('removes the denied projectId from store and hash', async () => {
        setUser(['GRP-ODIN-MAS-ACOM-EDITORS']);
        router.location.hash = '#page=bulkPublishEditor&path=acom&bulkPublishProjectId=abc';
        router.start();
        await delay(60);
        expect(Store.bulkPublishProjects.projectId.get()).to.be.null;
        expect(router.location.hash).not.to.include('bulkPublishProjectId');
    });

    it('allows a curator opening bulk publish by hash', () => {
        router.location.hash = '#page=bulkPublish&path=acom';
        router.start();
        expect(Store.page.get()).to.equal(PAGE_NAMES.BULK_PUBLISH);
    });

    it('redirects a cold-load bulk publish hash after users finish loading', async () => {
        Store.profile.set({});
        Store.users.set([]);
        Store.users.setMeta('loaded', false);
        router.location.hash = '#page=bulkPublish&path=acom';
        router.start();
        expect(Store.page.get()).to.equal(PAGE_NAMES.BULK_PUBLISH);
        mockLoadedUser(['GRP-ODIN-MAS-ACOM-EDITORS']);
        await initUsers();
        expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
    });

    it('keeps a cold-load bulk publish hash for a curator after users load', async () => {
        Store.profile.set({});
        Store.users.set([]);
        Store.users.setMeta('loaded', false);
        router.location.hash = '#page=bulkPublish&path=acom';
        router.start();
        mockLoadedUser(['GRP-ODIN-MAS-ACOM-CURATORS']);
        await initUsers();
        expect(Store.page.get()).to.equal(PAGE_NAMES.BULK_PUBLISH);
    });

    it('rechecks programmatic navigation after pending users finish loading', async () => {
        Store.profile.set({});
        Store.users.set([]);
        Store.users.setMeta('loaded', false);
        router.start();
        await router.navigateToPage(PAGE_NAMES.BULK_PUBLISH)();
        await delay(60);
        window.dispatchEvent(new Event('hashchange'));
        mockLoadedUser(['GRP-ODIN-MAS-ACOM-EDITORS']);
        await initUsers();
        expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
    });

    it('waits for IMS approval before completing a test identity cold load', async () => {
        Store.users.setMeta('loaded', false);
        router.location.hash = '#page=bulkPublishEditor&path=acom&bulkPublishProjectId=abc';
        router.start();
        window.adobeIMS = { getProfile: async () => ({ email: 'Automation@AdobeTest.com' }) };
        let resolveAccess;
        const accessResponse = new Promise((resolve) => {
            resolveAccess = resolve;
        });
        const fetchStub = sandbox.stub(window, 'fetch').callsFake(async (url) => {
            if (url.endsWith('/bulk-publish-access')) return accessResponse;
            return { ok: true, json: async () => [] };
        });
        const loading = initUsers();
        await delay(0);
        expect(Store.users.getMeta('loaded')).not.to.equal(true);
        resolveAccess({ ok: true, json: async () => ({ allowed: true }) });
        await loading;
        expect(Store.page.get()).to.equal(PAGE_NAMES.BULK_PUBLISH_EDITOR);
        expect(Store.users.getMeta('imsBulkPublishAccess')).to.deep.equal({ email: 'automation@adobetest.com', allowed: true });
        expect(fetchStub.callCount).to.equal(2);
    });

    it('denies a test identity when the IMS endpoint fails and clears stale approval', async () => {
        Store.users.setMeta('loaded', false);
        Store.users.setMeta('imsBulkPublishAccess', { email: 'automation@adobetest.com', allowed: true });
        router.location.hash = '#page=bulkPublish&path=acom';
        router.start();
        window.adobeIMS = { getProfile: async () => ({ email: 'automation@adobetest.com' }) };
        sandbox.stub(window, 'fetch').callsFake(async (url) => {
            if (url.endsWith('/bulk-publish-access')) return { ok: false, status: 502, statusText: 'Bad Gateway' };
            return { ok: true, json: async () => [] };
        });
        await initUsers();
        expect(Store.users.getMeta('imsBulkPublishAccess')?.allowed).not.to.equal(true);
        expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
        expect(Store.users.getMeta('loaded')).to.be.true;
    });

    for (const email of ['author@adobe.com', 'automation@adobetest.com.example.org']) {
        it(`keeps LDAP as the only source for ${email}`, async () => {
            window.adobeIMS = { getProfile: async () => ({ email }) };
            const fetchStub = sandbox.stub(window, 'fetch').resolves({ ok: true, json: async () => [] });
            await initUsers();
            expect(fetchStub.calledOnce).to.be.true;
            expect(fetchStub.firstCall.args[0]).to.match(/\/listMembers$/);
            expect(Store.users.getMeta('imsBulkPublishAccess')).to.be.null;
        });
    }

    for (const failure of ['no membership', 'network error', 'invalid JSON']) {
        it(`denies a test identity on ${failure}`, async () => {
            Store.users.setMeta('loaded', false);
            router.location.hash = '#page=bulkPublish&path=acom';
            router.start();
            window.adobeIMS = { getProfile: async () => ({ email: 'automation@adobetest.com' }) };
            sandbox.stub(window, 'fetch').callsFake(async (url) => {
                if (url.endsWith('/listMembers')) return { ok: true, json: async () => [] };
                if (failure === 'network error') throw new Error('Network unavailable');
                return {
                    ok: true,
                    json: async () => {
                        if (failure === 'invalid JSON') throw new SyntaxError('Invalid JSON');
                        return { allowed: false };
                    },
                };
            });
            await initUsers();
            expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
            expect(Store.users.getMeta('imsBulkPublishAccess')?.allowed).to.be.false;
        });
    }
});
