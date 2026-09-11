import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    getItemsSelectionStore,
    setItemsSelectionStore,
    pushItemsSelectionStore,
    popItemsSelectionStore,
} from '../../src/common/items-selection-store.js';

describe('items-selection-store', () => {
    afterEach(() => {
        setItemsSelectionStore(null);
    });

    it('getItemsSelectionStore throws when no slice is bound', () => {
        setItemsSelectionStore(null);
        expect(() => getItemsSelectionStore()).to.throw('Items selection store not set');
    });

    it('getItemsSelectionStore with allowUnset returns null when no slice is bound', () => {
        setItemsSelectionStore(null);
        expect(getItemsSelectionStore({ allowUnset: true })).to.be.null;
    });

    it('getItemsSelectionStore returns the bound slice', () => {
        const slice = { foo: 1 };
        setItemsSelectionStore(slice);
        expect(getItemsSelectionStore()).to.equal(slice);
    });

    it('setItemsSelectionStore clears any outstanding ownership bookkeeping', () => {
        const a = { name: 'a' };
        const token = pushItemsSelectionStore(a);
        setItemsSelectionStore(null);

        // The claim made before the reset is forgotten: releasing its token is a no-op.
        const other = { name: 'other' };
        setItemsSelectionStore(other);
        popItemsSelectionStore(token);
        expect(getItemsSelectionStore()).to.equal(other);
    });

    describe('pushItemsSelectionStore / popItemsSelectionStore', () => {
        it('restores null once the sole owner pops', () => {
            const slice = { name: 'only' };
            const token = pushItemsSelectionStore(slice);
            expect(getItemsSelectionStore()).to.equal(slice);
            popItemsSelectionStore(token);
            expect(getItemsSelectionStore({ allowUnset: true })).to.be.null;
        });

        it('nested ownership: popping the inner owner restores the outer one', () => {
            const outer = { name: 'outer' };
            const inner = { name: 'inner' };
            const outerToken = pushItemsSelectionStore(outer);
            const innerToken = pushItemsSelectionStore(inner);
            expect(getItemsSelectionStore()).to.equal(inner);

            popItemsSelectionStore(innerToken);
            expect(getItemsSelectionStore()).to.equal(outer);

            popItemsSelectionStore(outerToken);
            expect(getItemsSelectionStore({ allowUnset: true })).to.be.null;
        });

        it('out-of-order release: popping a non-topmost owner leaves the active store untouched', () => {
            const a = { name: 'a' };
            const b = { name: 'b' };
            const tokenA = pushItemsSelectionStore(a);
            const tokenB = pushItemsSelectionStore(b);
            expect(getItemsSelectionStore()).to.equal(b);

            popItemsSelectionStore(tokenA);
            expect(getItemsSelectionStore()).to.equal(b);

            popItemsSelectionStore(tokenB);
            expect(getItemsSelectionStore({ allowUnset: true })).to.be.null;
        });

        it('popping an unknown token is a no-op', () => {
            const slice = { name: 'slice' };
            pushItemsSelectionStore(slice);
            expect(() => popItemsSelectionStore(Symbol('unknown'))).to.not.throw();
            expect(getItemsSelectionStore()).to.equal(slice);
        });

        it('warns when a non-topmost owner is released', () => {
            const warnStub = sinon.stub(console, 'warn');
            try {
                const tokenA = pushItemsSelectionStore({ name: 'a' });
                pushItemsSelectionStore({ name: 'b' });
                popItemsSelectionStore(tokenA);
                expect(warnStub.calledOnce).to.be.true;
            } finally {
                warnStub.restore();
            }
        });

        it('does not warn when owners release in LIFO order', () => {
            const warnStub = sinon.stub(console, 'warn');
            try {
                const tokenA = pushItemsSelectionStore({ name: 'a' });
                const tokenB = pushItemsSelectionStore({ name: 'b' });
                popItemsSelectionStore(tokenB);
                popItemsSelectionStore(tokenA);
                expect(warnStub.called).to.be.false;
            } finally {
                warnStub.restore();
            }
        });
    });
});
