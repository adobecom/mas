import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
// mas.js must be imported first to break the circular dep between
// variant-layout.js → variants.js → catalog.js → variant-layout.js
import '../src/mas.js';

let VariantLayout;
let MERCH_CARD_LOAD_TIMEOUT;

before(async () => {
    ({ VariantLayout } = await import('../src/variants/variant-layout.js'));
    ({ MERCH_CARD_LOAD_TIMEOUT } = await import('../src/constants.js'));
});

function makeLayout(cardOverrides = {}) {
    const layout = Object.create(VariantLayout.prototype);
    layout.card = {
        isConnected: true,
        updateComplete: Promise.resolve(),
        prices: [],
        ...cardOverrides,
    };
    return layout;
}

describe('VariantLayout.postCardUpdateHook', () => {
    let clock;

    afterEach(() => {
        clock?.restore();
        clock = null;
    });

    it('returns early when card is not connected', async () => {
        // updateComplete never resolves — if the guard is missing, the test times out
        const layout = makeLayout({
            isConnected: false,
            updateComplete: new Promise(() => {}),
        });
        await layout.postCardUpdateHook();
    });

    it('resolves immediately when prices is empty', async () => {
        const layout = makeLayout({ prices: [] });
        await layout.postCardUpdateHook();
    });

    it('resolves after all prices settle', async () => {
        let resolvePrice;
        const priceSettled = new Promise((res) => {
            resolvePrice = res;
        });
        const price = { onceSettled: () => priceSettled };
        const layout = makeLayout({ prices: [price] });

        let settled = false;
        const hookPromise = layout.postCardUpdateHook().then(() => {
            settled = true;
        });

        expect(settled).to.be.false;
        resolvePrice();
        await hookPromise;
        expect(settled).to.be.true;
    });

    it('resolves after timeout when prices never settle', async () => {
        clock = sinon.useFakeTimers();

        const price = { onceSettled: () => new Promise(() => {}) };
        const layout = makeLayout({ prices: [price] });

        let settled = false;
        const hookPromise = layout.postCardUpdateHook().then(() => {
            settled = true;
        });

        expect(settled).to.be.false;
        await clock.tickAsync(MERCH_CARD_LOAD_TIMEOUT);
        await hookPromise;
        expect(settled).to.be.true;
    });

    it('clears the timeout when prices settle before deadline', async () => {
        clock = sinon.useFakeTimers();
        const clearTimeoutSpy = sinon.spy(clock, 'clearTimeout');

        const price = { onceSettled: () => Promise.resolve() };
        const layout = makeLayout({ prices: [price] });

        await clock.tickAsync(0);
        await layout.postCardUpdateHook();
        expect(clearTimeoutSpy.calledOnce).to.be.true;
    });

    it('handles prices without onceSettled gracefully', async () => {
        const price = {};
        const layout = makeLayout({ prices: [price] });
        await layout.postCardUpdateHook();
    });
});
