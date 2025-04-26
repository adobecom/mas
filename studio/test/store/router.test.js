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
        sandbox.stub(window.history, 'pushState');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should initialize store hash parameters', async () => {
        const router = new Router(
            { hash: '#page=placeholders' },
            {
                pushState: sandbox.stub(),
            },
        );
        const pageSetSpy = sandbox.spy(Store.page, 'set');
        router.linkStoreToHash(Store.page, 'page');
        expect(pageSetSpy.calledWith(PAGE_NAMES.PLACEHOLDERS)).to.be.true;
        expect(router.history.pushState.called).to.be.false;
    });

    it('should link store with a dot in the key to hash parameters', async () => {
        const router = new Router(
            { hash: '#commerce.env=stage' },
            {
                pushState: sandbox.stub(),
            },
        );
        const testStore = new ReactiveStore();
        router.linkStoreToHash(testStore, 'commerce.env');
        expect(testStore.get()).to.equal('stage');
    });

    it('should link store to hash parameters', async () => {
        const router = new Router(
            { hash: '#path=/content/dam/test&tags=tag1%2Ctag2' },
            {
                pushState: sandbox.stub(),
            },
        );
        router.start();
        expect(Store.search.get()).to.deep.include({
            path: '/content/dam/test',
        });
        expect(Store.filters.get()).to.deep.include({
            tags: 'tag1,tag2',
        });
    });

    it('should update hash when store values change', async () => {
        const router = new Router(
            { pathname: '/', search: '', hash: '#test=initial' },
            {
                pushState: sandbox.stub(),
            },
        );
        router.start();
        const testStore = new ReactiveStore();
        router.linkStoreToHash(testStore, 'test');
        expect(testStore.get()).to.equal('initial');
        testStore.set('updated');
        await delay(30);
        expect(
            router.history.pushState.withArgs(null, '', '/#test=updated')
                .called,
        ).to.be.true;
    });

    it('should set page parameter to content when query parameter exists', async () => {
        const router = new Router(
            { hash: '#page=content' },
            {
                pushState: sandbox.stub(),
            },
        );
        router.start();
        expect(Store.page.get()).to.equal(PAGE_NAMES.CONTENT);
    });

    it('should not update history when hash has not changed', async () => {
        const router = new Router(
            { pathname: '/', search: '', hash: '#test=value' },
            {
                pushState: sandbox.stub(),
            },
        );
        router.currentParams = new URLSearchParams('test=value');
        router.updateHistory();
        expect(router.history.pushState.called).to.be.false;
    });

    it('should use default values when parameters are not in hash', async () => {
        const router = new Router(
            { hash: '' },
            {
                pushState: sandbox.stub(),
            },
        );
        const testStore = new ReactiveStore();
        router.linkStoreToHash(testStore, 'param', 'defaultValue');
        expect(testStore.get()).to.equal(undefined);
    });

    it('should remove hash parameters when store value is undefined', async () => {
        const router = new Router(
            { pathname: '/', search: '', hash: '#test=value' },
            {
                pushState: sandbox.stub(),
            },
        );
        router.start();
        const testStore = new ReactiveStore('value');
        router.linkStoreToHash(testStore, 'test');
        testStore.set(undefined);
        await delay(30);
        expect(router.history.pushState.withArgs(null, '', '/#').called).to.be
            .true;
    });

    it('should handle popstate events', async () => {
        const router = new Router(
            { pathname: '/', search: '', hash: '#test=initial' },
            {
                pushState: sandbox.stub(),
            },
        );
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
        const router = new Router(
            { hash: '#page=content&commerce.env=stage' },
            {
                pushState: sandbox.stub(),
            },
        );

        const pageSetSpy = sandbox.spy(Store.page, 'set');
        const commerceEnvSetSpy = sandbox.spy(Store.commerceEnv, 'set');

        router.start();

        expect(pageSetSpy.called).to.be.true;
        expect(commerceEnvSetSpy.called).to.be.true;
        expect(Store.page.get()).to.equal(PAGE_NAMES.CONTENT);
        expect(Store.commerceEnv.get()).to.equal('stage');
    });
});
