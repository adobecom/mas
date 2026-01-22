import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import NestedStoreController from '../../src/reactivity/nested-store-controller.js';
import { ReactiveStore } from '../../src/reactivity/reactive-store.js';

describe('NestedStoreController', () => {
    let sandbox;
    let mockHost;
    let outerStore;
    let innerStore;

    const createMockHost = () => ({
        addController: sinon.stub(),
        removeController: sinon.stub(),
        requestUpdate: sinon.stub(),
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockHost = createMockHost();
        outerStore = new ReactiveStore(null);
        innerStore = new ReactiveStore('initial-value');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Constructor', () => {
        it('should register itself as a controller on the host', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            expect(mockHost.addController.calledOnce).to.be.true;
            expect(mockHost.addController.calledWith(controller)).to.be.true;
        });

        it('should store reference to outer store', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            expect(controller.outerStore).to.equal(outerStore);
        });

        it('should store reference to host', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            expect(controller.host).to.equal(mockHost);
        });
    });

    describe('value getter', () => {
        it('should return null when no inner store is set', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            expect(controller.value).to.be.null;
        });

        it('should return inner store value when inner store is set', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(innerStore);
            expect(controller.value).to.equal('initial-value');
        });

        it('should return updated value when inner store changes', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(innerStore);
            innerStore.set('updated-value');
            expect(controller.value).to.equal('updated-value');
        });
    });

    describe('hostConnected', () => {
        it('should subscribe to outer store', () => {
            const subscribeSpy = sandbox.spy(outerStore, 'subscribe');
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            expect(subscribeSpy.calledOnce).to.be.true;
        });

        it('should immediately receive current outer store value', () => {
            outerStore.set(innerStore);
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            expect(controller.value).to.equal('initial-value');
        });

        it('should request host update when outer store has value', () => {
            outerStore.set(innerStore);
            const controller = new NestedStoreController(mockHost, outerStore);
            mockHost.requestUpdate.resetHistory();
            controller.hostConnected();
            expect(mockHost.requestUpdate.called).to.be.true;
        });
    });

    describe('hostDisconnected', () => {
        it('should unsubscribe from outer store', () => {
            const unsubscribeSpy = sandbox.spy(outerStore, 'unsubscribe');
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            controller.hostDisconnected();
            expect(unsubscribeSpy.calledOnce).to.be.true;
        });

        it('should unsubscribe from inner store', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(innerStore);
            const unsubscribeSpy = sandbox.spy(innerStore, 'unsubscribe');
            controller.hostDisconnected();
            expect(unsubscribeSpy.calledOnce).to.be.true;
        });

        it('should set inner store reference to null', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(innerStore);
            controller.hostDisconnected();
            expect(controller.value).to.be.null;
        });
    });

    describe('Outer store changes', () => {
        it('should subscribe to new inner store when outer store changes', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            const subscribeSpy = sandbox.spy(innerStore, 'subscribe');
            outerStore.set(innerStore);
            expect(subscribeSpy.calledOnce).to.be.true;
        });

        it('should unsubscribe from old inner store when outer store changes', () => {
            const oldInnerStore = new ReactiveStore('old-value');
            const newInnerStore = new ReactiveStore('new-value');
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(oldInnerStore);
            const unsubscribeSpy = sandbox.spy(oldInnerStore, 'unsubscribe');
            outerStore.set(newInnerStore);
            expect(unsubscribeSpy.calledOnce).to.be.true;
        });

        it('should request host update when outer store changes', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            mockHost.requestUpdate.resetHistory();
            outerStore.set(innerStore);
            expect(mockHost.requestUpdate.called).to.be.true;
        });

        it('should not resubscribe when outer store sets same inner store', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(innerStore);
            const subscribeSpy = sandbox.spy(innerStore, 'subscribe');
            // Setting the same inner store again should be ignored
            outerStore.set(innerStore);
            expect(subscribeSpy.called).to.be.false;
        });

        it('should handle outer store changing to null', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(innerStore);
            const unsubscribeSpy = sandbox.spy(innerStore, 'unsubscribe');
            outerStore.set(null);
            expect(unsubscribeSpy.calledOnce).to.be.true;
            expect(controller.value).to.be.null;
        });
    });

    describe('Inner store changes', () => {
        it('should request host update when inner store value changes', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(innerStore);
            mockHost.requestUpdate.resetHistory();
            innerStore.set('new-value');
            expect(mockHost.requestUpdate.calledOnce).to.be.true;
        });

        it('should reflect new value after inner store changes', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(innerStore);
            innerStore.set('updated-value');
            expect(controller.value).to.equal('updated-value');
        });

        it('should handle multiple inner store value changes', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(innerStore);
            mockHost.requestUpdate.resetHistory();
            innerStore.set('value-1');
            innerStore.set('value-2');
            innerStore.set('value-3');
            expect(mockHost.requestUpdate.callCount).to.equal(3);
            expect(controller.value).to.equal('value-3');
        });
    });

    describe('Complex scenarios', () => {
        it('should handle switching between multiple inner stores', () => {
            const innerStore1 = new ReactiveStore('value-1');
            const innerStore2 = new ReactiveStore('value-2');
            const innerStore3 = new ReactiveStore('value-3');
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(innerStore1);
            expect(controller.value).to.equal('value-1');
            outerStore.set(innerStore2);
            expect(controller.value).to.equal('value-2');
            outerStore.set(innerStore3);
            expect(controller.value).to.equal('value-3');
        });

        it('should not react to old inner store changes after switching', () => {
            const oldInnerStore = new ReactiveStore('old-value');
            const newInnerStore = new ReactiveStore('new-value');
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(oldInnerStore);
            outerStore.set(newInnerStore);
            mockHost.requestUpdate.resetHistory();
            // Changing old inner store should not trigger update
            oldInnerStore.set('changed-old-value');
            expect(mockHost.requestUpdate.called).to.be.false;
            expect(controller.value).to.equal('new-value');
        });

        it('should work with object values in inner store', () => {
            const objectInnerStore = new ReactiveStore({ name: 'test', count: 0 });
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(objectInnerStore);
            expect(controller.value).to.deep.equal({ name: 'test', count: 0 });
            objectInnerStore.set({ name: 'test', count: 1 });
            expect(controller.value).to.deep.equal({ name: 'test', count: 1 });
        });

        it('should handle reconnection after disconnection', () => {
            const controller = new NestedStoreController(mockHost, outerStore);
            controller.hostConnected();
            outerStore.set(innerStore);
            controller.hostDisconnected();
            expect(controller.value).to.be.null;
            controller.hostConnected();
            // After reconnection, should receive current outer store value
            expect(controller.value).to.equal('initial-value');
        });
    });
});
