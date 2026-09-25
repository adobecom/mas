import { expect } from '@open-wc/testing';
import { ReactiveStore } from '../../src/reactivity/reactive-store.js';

describe('ReactiveStore', () => {
    let store;

    beforeEach(() => {
        store = new ReactiveStore(0);
    });

    it('returns the initial value from get()', () => {
        const initialized = new ReactiveStore(42);
        expect(initialized.get()).to.equal(42);
    });

    it('applies the validator to the initial value in the constructor', () => {
        const doubling = new ReactiveStore(5, (v) => v * 2);
        expect(doubling.get()).to.equal(10);
    });

    it('updates the value and notifies subscribers on set with a new primitive', () => {
        const seen = [];
        store.subscribe((value) => seen.push(value));
        store.set(7);
        expect(store.get()).to.equal(7);
        expect(seen).to.deep.equal([0, 7]);
    });

    it('resolves set with an updater function against the current value', () => {
        store.set(3);
        store.set((current) => current + 4);
        expect(store.get()).to.equal(7);
    });

    it('skips notification when an equal primitive is set', () => {
        let notifications = 0;
        store.subscribe(() => {
            notifications += 1;
        });
        store.set(0);
        expect(notifications).to.equal(1);
    });

    it('still notifies when an equal object reference content is set (object identity differs)', () => {
        const objectStore = new ReactiveStore({ a: 1 });
        let calls = 0;
        objectStore.subscribe(() => {
            calls += 1;
        });
        objectStore.set({ a: 1 });
        expect(calls).to.equal(2);
    });

    it('passes a structured clone of the previous value as oldValue for object stores', () => {
        const objectStore = new ReactiveStore({ a: 1 });
        let receivedOld;
        objectStore.subscribe((value, oldValue) => {
            receivedOld = oldValue;
        });
        objectStore.set({ a: 2 });
        expect(receivedOld).to.deep.equal({ a: 1 });
    });

    it('falls back to the raw previous value as oldValue when structuredClone throws', () => {
        const fn = () => {};
        const cloneableStore = new ReactiveStore(fn);
        let receivedOld;
        cloneableStore.subscribe((value, oldValue) => {
            receivedOld = oldValue;
        });
        cloneableStore.set(() => 1);
        expect(receivedOld).to.equal(fn);
    });

    it('calls a subscriber immediately with the current value on subscribe', () => {
        const initialized = new ReactiveStore('hi');
        let receivedValue;
        let receivedOld;
        initialized.subscribe((value, oldValue) => {
            receivedValue = value;
            receivedOld = oldValue;
        });
        expect(receivedValue).to.equal('hi');
        expect(receivedOld).to.equal('hi');
    });

    it('ignores a duplicate subscription of the same function', () => {
        let calls = 0;
        const fn = () => {
            calls += 1;
        };
        store.subscribe(fn);
        store.subscribe(fn);
        store.set(1);
        expect(calls).to.equal(2);
    });

    it('stops calling a subscriber after unsubscribe', () => {
        let calls = 0;
        const fn = () => {
            calls += 1;
        };
        store.subscribe(fn);
        store.unsubscribe(fn);
        store.set(1);
        expect(calls).to.equal(1);
    });

    it('leaves other subscribers intact when unsubscribing an unregistered function', () => {
        let calls = 0;
        store.subscribe(() => {
            calls += 1;
        });
        store.unsubscribe(() => {});
        store.set(1);
        expect(calls).to.equal(2);
    });

    it('notifies every subscriber on set', () => {
        const order = [];
        store.subscribe(() => order.push('a'));
        store.subscribe(() => order.push('b'));
        order.length = 0;
        store.set(9);
        expect(order).to.deep.equal(['a', 'b']);
    });

    it('returns the raw value from validate when no validator is registered', () => {
        expect(store.validate({ x: 1 })).to.deep.equal({ x: 1 });
    });

    it('applies a validator registered after construction on the next set', () => {
        store.registerValidator((v) => v + 100);
        store.set(5);
        expect(store.get()).to.equal(105);
    });

    it('reports false from hasMeta for an unset key and true after setMeta', () => {
        expect(store.hasMeta('loading')).to.be.false;
        store.setMeta('loading', true);
        expect(store.hasMeta('loading')).to.be.true;
    });

    it('returns the stored meta value from getMeta', () => {
        store.setMeta('error', 'boom');
        expect(store.getMeta('error')).to.equal('boom');
    });

    it('returns null from getMeta for an unset key', () => {
        expect(store.getMeta('missing')).to.equal(null);
    });

    it('deletes a meta entry with removeMeta', () => {
        store.setMeta('temp', 1);
        store.removeMeta('temp');
        expect(store.hasMeta('temp')).to.be.false;
    });

    it('exposes the current value via toString', () => {
        store.set(11);
        expect(store.toString()).to.equal(11);
    });

    it('returns true from equals when the argument strictly matches the value', () => {
        store.set(8);
        expect(store.equals(8)).to.be.true;
    });

    it('returns false from equals when the argument differs from the value', () => {
        store.set(8);
        expect(store.equals(9)).to.be.false;
    });
});
