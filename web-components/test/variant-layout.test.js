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

// These run against the browser's real ResizeObserver: the re-arm in
// requestReflowCheck relies on a new observation reporting even when the size
// did not change. Observers only deliver on rendered frames, which a
// backgrounded test page never gets, so the suite skips itself there.
describe('VariantLayout reflow observation', () => {
    let card;
    let child;
    let layout;
    let reports;

    before(async function () {
        const rendering = await Promise.race([
            new Promise((resolve) =>
                requestAnimationFrame(() => resolve(true)),
            ),
            new Promise((resolve) => setTimeout(() => resolve(false), 500)),
        ]);
        if (!rendering) this.skip();
    });
    const nextReport = () =>
        new Promise((resolve) => {
            reports.push(resolve);
        });

    // Price resolutions arrive in their own tasks, never inside a delivery.
    const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

    beforeEach(() => {
        card = document.createElement('div');
        card.style.cssText = 'width:200px;height:100px;';
        child = document.createElement('div');
        child.style.cssText = 'height:30px;';
        card.append(child);
        document.body.append(card);
        reports = [];
        layout = new VariantLayout(card);
        layout.resyncOnReflow = () => reports.shift()?.();
        card.variantLayout = layout;
    });

    afterEach(() => {
        layout.disconnectReflow();
        card.remove();
    });

    it('reports the observed sizes once layout is done', async () => {
        const first = nextReport();
        layout.observeReflow(card, child);
        await first;
        expect(layout.boxOf(card)).to.deep.equal({ width: 200, height: 100 });
        expect(layout.heightOf(child)).to.equal(30);
        expect(layout.heightOf(null)).to.equal(0);
    });

    it('reports again on request although nothing was resized', async () => {
        const first = nextReport();
        layout.observeReflow(card, child);
        await first;
        await nextTask();

        const second = nextReport();
        layout.requestReflowCheck();
        await second;
    });

    it('coalesces requests made in one task into one report', async () => {
        const first = nextReport();
        layout.observeReflow(card, child);
        await first;
        await nextTask();

        let count = 0;
        layout.resyncOnReflow = () => (count += 1);
        layout.requestReflowCheck();
        layout.requestReflowCheck();
        layout.requestReflowCheck();
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(count).to.equal(1);
    });

    it('reports a hidden card as zero wide so no geometry is read', async () => {
        card.style.display = 'none';
        const rect = sinon.spy(card, 'getBoundingClientRect');
        const first = nextReport();
        layout.observeReflow(card, child);
        await first;
        expect(layout.boxOf(card).width).to.equal(0);
        expect(rect.called).to.be.false;
    });

    it('measures an element the observer has not reported', () => {
        layout.observeReflow(card);
        expect(layout.boxOf(child).height).to.equal(30);
    });

    it('stops reporting once disconnected', async () => {
        const first = nextReport();
        layout.observeReflow(card, child);
        await first;
        await nextTask();

        let count = 0;
        layout.resyncOnReflow = () => (count += 1);
        layout.disconnectReflow();
        layout.requestReflowCheck();
        card.style.width = '300px';
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(count).to.equal(0);
    });
});
