import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { PAGE_NAMES } from '../../src/constants.js';
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
        await delay(30);
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
        expect(testStore.get()).to.equal(undefined);
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
        await delay(30);
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
});
