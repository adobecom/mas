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
        expect(router.location.hash).to.equal('test=updated');
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
        expect(router.location.hash).to.equal('');
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
        const router = new Router({ hash: '#page=content&commerce.env=stage' });

        const pageSetSpy = sandbox.spy(Store.page, 'set');
        const commerceEnvSetSpy = sandbox.spy(Store.commerceEnv, 'set');

        router.start();

        expect(pageSetSpy.called).to.be.true;
        expect(commerceEnvSetSpy.called).to.be.true;
        expect(Store.page.get()).to.equal(PAGE_NAMES.CONTENT);
        expect(Store.commerceEnv.get()).to.equal('stage');
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
        expect(router.location.hash).to.equal('');
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
        expect(router.location.hash).to.equal(''); // PUBLISHED is default, so hash is empty
        
        Store.landscape.set(WCS_LANDSCAPE_DRAFT);
        await delay(60);
        expect(router.location.hash).to.equal('commerce.landscape=DRAFT');
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
