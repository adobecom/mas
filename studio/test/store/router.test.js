import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { PAGE_NAMES, WCS_LANDSCAPE_PUBLISHED, WCS_LANDSCAPE_DRAFT } from '../../src/constants.js';
import { Router } from '../../src/router.js';
import { ReactiveStore } from '../../src/reactivity/reactive-store.js';
import { delay } from '../utils.js';

describe('Router URL parameter handling', async () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should initialize store hash parameters', async () => {
        const router = new Router({ hash: '#page=placeholders' });
        const pageSetSpy = sandbox.spy(Store.page, 'set');
        router.linkStoreToHash(Store.page, 'page');
        expect(pageSetSpy.calledWith(PAGE_NAMES.PLACEHOLDERS)).to.be.true;
        expect(router.location.hash).to.equal('#page=placeholders');
    });

    it('should link store with a dot in the key to hash parameters', async () => {
        const router = new Router({ hash: '#commerce.env=stage' });
        const testStore = new ReactiveStore();
        router.linkStoreToHash(testStore, 'commerce.env');
        expect(testStore.get()).to.equal('stage');
    });

    it('should link store to hash parameters', async () => {
        const router = new Router({
            hash: '#path=/content/dam/test&tags=tag1%2Ctag2',
        });
        router.start();
        expect(Store.search.get()).to.deep.include({
            path: '/content/dam/test',
        });
        expect(Store.filters.get()).to.deep.include({
            tags: 'tag1,tag2',
        });
    });

    it('should update hash when store values change', async () => {
        const router = new Router({
            pathname: '/',
            search: '',
            hash: '#test=initial',
        });
        router.start();
        const testStore = new ReactiveStore();
        router.linkStoreToHash(testStore, 'test');
        expect(testStore.get()).to.equal('initial');
        testStore.set('updated');
        await delay(60);
        expect(router.location.hash).to.equal('page=welcome&test=updated');
    });

    it('should set page parameter to content when query parameter exists', async () => {
        const router = new Router({ hash: '#page=content' });
        router.start();
        expect(Store.page.get()).to.equal(PAGE_NAMES.CONTENT);
    });

    it('should use default values when parameters are not in hash', async () => {
        const router = new Router({ hash: '' });
        const testStore = new ReactiveStore();
        router.linkStoreToHash(testStore, 'param', 'defaultValue');
        await delay(60);
        expect(router.location.hash).to.equal('');
        expect(testStore.get()).to.equal('defaultValue');
    });

    it('should remove hash parameters when store value is undefined', async () => {
        const router = new Router({
            pathname: '/',
            search: '',
            hash: '#test=value',
        });
        router.start();
        const testStore = new ReactiveStore('value');
        router.linkStoreToHash(testStore, 'test');
        testStore.set(undefined);
        await delay(60);
        expect(router.location.hash).to.equal('page=welcome');
    });

    it('should handle popstate events', async () => {
        const router = new Router({
            pathname: '/',
            search: '',
            hash: '#test=initial',
        });
        const testStore = new ReactiveStore();
        const changeEventSpy = sandbox.spy();

        router.addEventListener('change', changeEventSpy);
        router.linkStoreToHash(testStore, 'test');
        router.start();

        // Mock hash change via popstate
        const mockLocation = { hash: '#test=updated' };
        router.location = mockLocation;

        // Trigger popstate event
        window.dispatchEvent(new Event('popstate'));

        expect(changeEventSpy.called).to.be.true;
    });

    it('should initialize all stores in start method', async () => {
        const router = new Router({ hash: '#page=content&commerce.landscape=DRAFT' });

        router.start();

        // Wait a bit for the stores to be initialized
        await delay(50);

        expect(Store.page.get()).to.equal(PAGE_NAMES.CONTENT);
        expect(Store.landscape.get()).to.equal('DRAFT');
    });

    it('should normalize settings-editor route without fragmentId to settings', async () => {
        const originalPage = Store.page.get();
        const originalFragmentId = Store.settings.fragmentId.get();
        const originalCreating = Store.settings.creating.get();
        const originalProfile = Store.profile.get();
        const originalUsers = Store.users.get();
        const originalUsersLoadedMeta = Store.users.getMeta('loaded');

        Store.profile.set({ email: 'power@adobe.com' });
        Store.users.set([
            {
                userPrincipalName: 'power@adobe.com',
                groups: ['GRP-ODIN-MAS-ADMINS'],
            },
        ]);
        Store.users.setMeta('loaded', true);
        Store.settings.fragmentId.set(null);
        Store.settings.creating.set(false);

        const router = new Router({ hash: '#page=settings-editor&path=sandbox' });
        router.start();
        await delay(60);

        expect(Store.page.get()).to.equal(PAGE_NAMES.SETTINGS);
        expect(router.location.hash).to.include('page=settings');
        expect(router.location.hash).to.not.include('page=settings-editor');
        expect(router.location.hash).to.include('path=sandbox');

        Store.page.set(originalPage);
        Store.settings.fragmentId.set(originalFragmentId);
        Store.settings.creating.set(originalCreating);
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
        Store.users.setMeta('loaded', originalUsersLoadedMeta);
    });

    it('should preserve explicit page=welcome when navigating home from settings', async () => {
        const originalPage = Store.page.get();
        const originalProfile = Store.profile.get();
        const originalUsers = Store.users.get();
        const originalUsersLoadedMeta = Store.users.getMeta('loaded');

        Store.profile.set({ email: 'power@adobe.com' });
        Store.users.set([
            {
                userPrincipalName: 'power@adobe.com',
                groups: ['GRP-ODIN-MAS-ADMINS'],
            },
        ]);
        Store.users.setMeta('loaded', true);

        const router = new Router({ hash: '#page=settings&path=sandbox' });
        router.start();
        await delay(60);
        await router.navigateToPage(PAGE_NAMES.WELCOME)();
        await delay(60);

        expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
        expect(router.location.hash).to.include('path=sandbox');
        expect(router.location.hash).to.include('page=welcome');

        Store.page.set(originalPage);
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
        Store.users.setMeta('loaded', originalUsersLoadedMeta);
    });

    it('should preserve page=welcome on hashchange even after users resolve', async () => {
        const originalPage = Store.page.get();
        const originalProfile = Store.profile.get();
        const originalUsers = Store.users.get();
        const originalUsersLoadedMeta = Store.users.getMeta('loaded');

        Store.page.set(PAGE_NAMES.CONTENT);
        Store.profile.set({});
        Store.users.set([]);
        Store.users.setMeta('loaded', false);

        const router = new Router({ hash: '#page=content&path=cards' });
        router.start();
        await delay(60);

        router.location.hash = '#path=sandbox';
        window.dispatchEvent(new Event('hashchange'));
        await delay(60);

        expect(router.location.hash).to.include('path=sandbox');
        expect(router.location.hash).to.include('page=welcome');
        expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);

        Store.profile.set({ email: 'power@adobe.com' });
        Store.users.set([
            {
                userPrincipalName: 'power@adobe.com',
                groups: ['GRP-ODIN-MAS-ADMINS'],
            },
        ]);
        Store.users.setMeta('loaded', true);
        await delay(60);

        expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
        expect(router.location.hash).to.include('path=sandbox');
        expect(router.location.hash).to.include('page=welcome');

        Store.page.set(originalPage);
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
        Store.users.setMeta('loaded', originalUsersLoadedMeta);
    });

    it('should redirect settings deeplink to welcome when user is not power user', async () => {
        const originalPage = Store.page.get();
        const originalFragmentId = Store.settings.fragmentId.get();
        const originalCreating = Store.settings.creating.get();
        const originalProfile = Store.profile.get();
        const originalUsers = Store.users.get();
        const originalUsersLoadedMeta = Store.users.getMeta('loaded');

        Store.profile.set({ email: 'viewer@adobe.com' });
        Store.users.set([
            {
                userPrincipalName: 'viewer@adobe.com',
                groups: ['GRP-OTHER'],
            },
        ]);
        Store.users.setMeta('loaded', true);
        Store.settings.fragmentId.set('setting-1');
        Store.settings.creating.set(true);

        const router = new Router({ hash: '#page=settings&path=sandbox&fragmentId=setting-1' });
        router.start();
        await delay(60);

        expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
        expect(Store.settings.fragmentId.get()).to.equal(null);
        expect(Store.settings.creating.get()).to.equal(false);
        expect(router.location.hash).to.not.include('page=settings');
        expect(router.location.hash).to.not.include('fragmentId=');

        Store.page.set(originalPage);
        Store.settings.fragmentId.set(originalFragmentId);
        Store.settings.creating.set(originalCreating);
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
        Store.users.setMeta('loaded', originalUsersLoadedMeta);
    });

    it('should block navigateToPage settings when user is not power user', async () => {
        const originalPage = Store.page.get();
        const originalFragmentId = Store.settings.fragmentId.get();
        const originalCreating = Store.settings.creating.get();
        const originalProfile = Store.profile.get();
        const originalUsers = Store.users.get();
        const originalUsersLoadedMeta = Store.users.getMeta('loaded');

        Store.profile.set({ email: 'viewer@adobe.com' });
        Store.users.set([
            {
                userPrincipalName: 'viewer@adobe.com',
                groups: ['GRP-OTHER'],
            },
        ]);
        Store.users.setMeta('loaded', true);
        Store.page.set(PAGE_NAMES.CONTENT);
        Store.settings.fragmentId.set('setting-1');
        Store.settings.creating.set(true);

        const router = new Router({ hash: '#page=content&path=sandbox' });
        await router.navigateToPage(PAGE_NAMES.SETTINGS)();

        expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);
        expect(Store.settings.fragmentId.get()).to.equal(null);
        expect(Store.settings.creating.get()).to.equal(false);

        Store.page.set(originalPage);
        Store.settings.fragmentId.set(originalFragmentId);
        Store.settings.creating.set(originalCreating);
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
        Store.users.setMeta('loaded', originalUsersLoadedMeta);
    });

    it('should allow settings deeplink when user has per-surface POWERUSERS for that path', async () => {
        const originalPage = Store.page.get();
        const originalProfile = Store.profile.get();
        const originalUsers = Store.users.get();
        const originalUsersLoadedMeta = Store.users.getMeta('loaded');

        Store.profile.set({ email: 'acom@adobe.com' });
        Store.users.set([
            {
                userPrincipalName: 'acom@adobe.com',
                groups: ['GRP-ODIN-MAS-ACOM-POWERUSERS'],
            },
        ]);
        Store.users.setMeta('loaded', true);

        const router = new Router({ hash: '#page=settings&path=acom' });
        router.start();
        await delay(60);

        expect(Store.page.get()).to.equal(PAGE_NAMES.SETTINGS);

        Store.page.set(originalPage);
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
        Store.users.setMeta('loaded', originalUsersLoadedMeta);
    });

    it('should redirect settings deeplink when user lacks admin and surface is admin-only', async () => {
        const originalPage = Store.page.get();
        const originalProfile = Store.profile.get();
        const originalUsers = Store.users.get();
        const originalUsersLoadedMeta = Store.users.getMeta('loaded');

        Store.profile.set({ email: 'acom@adobe.com' });
        Store.users.set([
            {
                userPrincipalName: 'acom@adobe.com',
                groups: ['GRP-ODIN-MAS-ACOM-POWERUSERS'],
            },
        ]);
        Store.users.setMeta('loaded', true);

        const router = new Router({ hash: '#page=settings&path=sandbox' });
        router.start();
        await delay(60);

        expect(Store.page.get()).to.equal(PAGE_NAMES.WELCOME);

        Store.page.set(originalPage);
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
        Store.users.setMeta('loaded', originalUsersLoadedMeta);
    });

    it('should initialize landscape store with hash parameter', async () => {
        const router = new Router({ hash: '#commerce.landscape=DRAFT' });
        const landscapeSetSpy = sandbox.spy(Store.landscape, 'set');
        router.linkStoreToHash(Store.landscape, 'commerce.landscape');
        expect(landscapeSetSpy.calledWith('DRAFT')).to.be.true;
        expect(router.location.hash).to.equal('#commerce.landscape=DRAFT');
    });

    it('should link landscape store with dot notation to hash parameters', async () => {
        const router = new Router({ hash: '#commerce.landscape=DRAFT' });
        const testStore = new ReactiveStore();
        router.linkStoreToHash(testStore, 'commerce.landscape');
        expect(testStore.get()).to.equal('DRAFT');
    });

    it('should update hash when landscape store value changes', async () => {
        const router = new Router({
            pathname: '/',
            search: '',
            hash: '#commerce.landscape=DRAFT',
        });
        const testStore = new ReactiveStore();
        router.linkStoreToHash(testStore, 'commerce.landscape');
        expect(testStore.get()).to.equal('DRAFT');
        testStore.set('PUBLISHED');
        await delay(60);
        expect(router.location.hash).to.equal('commerce.landscape=PUBLISHED');
    });

    it('should use default landscape value when parameter is not in hash', async () => {
        const router = new Router({ hash: '' });
        const testStore = new ReactiveStore();
        router.linkStoreToHash(testStore, 'commerce.landscape', WCS_LANDSCAPE_PUBLISHED);
        await delay(60);
        expect(router.location.hash).to.equal('');
        expect(testStore.get()).to.equal(WCS_LANDSCAPE_PUBLISHED);
    });

    it('should remove landscape hash parameter when store value is undefined', async () => {
        const router = new Router({
            pathname: '/',
            search: '',
            hash: '#commerce.landscape=DRAFT',
        });
        router.start();
        const testStore = new ReactiveStore('DRAFT');
        router.linkStoreToHash(testStore, 'commerce.landscape');
        testStore.set(undefined);
        await delay(60);
        expect(router.location.hash).to.equal('page=welcome');
    });

    it('should handle landscape parameter in popstate events', async () => {
        const router = new Router({
            pathname: '/',
            search: '',
            hash: '#commerce.landscape=DRAFT',
        });
        const testStore = new ReactiveStore();
        const changeEventSpy = sandbox.spy();

        router.addEventListener('change', changeEventSpy);
        router.linkStoreToHash(testStore, 'commerce.landscape');
        router.start();

        // Mock hash change via popstate
        const mockLocation = { hash: '#commerce.landscape=PUBLISHED' };
        router.location = mockLocation;

        // Trigger popstate event
        window.dispatchEvent(new Event('popstate'));

        expect(changeEventSpy.called).to.be.true;
    });

    it('should handle multiple landscape values correctly', async () => {
        const router = new Router({ hash: '#commerce.landscape=DRAFT' });
        router.start();

        // Verify initial state
        expect(Store.landscape.get()).to.equal('DRAFT');
        expect(router.location.hash).to.equal('#commerce.landscape=DRAFT');

        // Test switching between different landscape values
        Store.landscape.set(WCS_LANDSCAPE_PUBLISHED);
        await delay(60);
        expect(router.location.hash).to.equal('page=welcome'); // PUBLISHED is default, page=welcome is preserved

        Store.landscape.set(WCS_LANDSCAPE_DRAFT);
        await delay(60);
        expect(router.location.hash).to.include('page=welcome');
        expect(router.location.hash).to.include('commerce.landscape=DRAFT');
    });

    it('should remove invalid landscape hash parameter in start method', async () => {
        const router = new Router({ hash: '#page=content&commerce.landscape=INVALID' });
        router.start();

        // Wait for hash to be updated
        await delay(60);

        // Invalid landscape value should be removed from hash
        expect(Store.landscape.get()).to.equal(WCS_LANDSCAPE_PUBLISHED);
        expect(router.location.hash).to.equal('page=content');
    });
});
