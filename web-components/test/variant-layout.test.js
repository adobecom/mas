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

describe('VariantLayout.syncRowHeights', () => {
    let gcsStub;
    const ops = [];

    const makeFakeCard = (top, elHeights) => {
        const styles = {};
        const card = {
            variant: 'plans',
            getBoundingClientRect: () => ({ width: 300, top }),
            style: {
                setProperty: (k, v) => {
                    ops.push('set');
                    styles[k] = v;
                },
                removeProperty: (k) => {
                    ops.push('clear');
                    delete styles[k];
                },
                getPropertyValue: (k) => styles[k] ?? '',
            },
            __styles: styles,
            __els: Object.fromEntries(
                Object.entries(elHeights).map(([name, h]) => [
                    name,
                    { __h: h },
                ]),
            ),
        };
        card.variantLayout = { card };
        return card;
    };

    beforeEach(() => {
        ops.length = 0;
        gcsStub = sinon.stub(window, 'getComputedStyle').callsFake(function (
            el,
            ...rest
        ) {
            if (el && '__h' in el) {
                ops.push('read');
                return { height: `${el.__h}px` };
            }
            return gcsStub.wrappedMethod.call(window, el, ...rest);
        });
    });

    afterEach(() => {
        gcsStub.restore();
    });

    const runSync = (cards, entries) => {
        const container = {
            style: {
                getPropertyValue: () => '',
                removeProperty: () => {},
            },
            querySelectorAll: () => cards,
        };
        const layout = Object.create(VariantLayout.prototype);
        layout.card = cards[0];
        sinon.stub(layout, 'getContainer').returns(container);
        layout.syncRowHeights(entries);
    };

    const entriesFor = (names) =>
        names.map((name) => ({
            name,
            getElement: (card) => card.__els[name] ?? null,
        }));

    it('applies the row max per slot and keeps rows independent', () => {
        const a1 = makeFakeCard(0, { title: 20, body: 50 });
        const a2 = makeFakeCard(0, { title: 32, body: 41 });
        const b1 = makeFakeCard(400, { title: 60, body: 10 });
        runSync([a1, a2, b1], entriesFor(['title', 'body']));

        const titleProp = '--consonant-merch-card-plans-title-height';
        const bodyProp = '--consonant-merch-card-plans-body-height';
        expect(a1.__styles[titleProp]).to.equal('32px');
        expect(a2.__styles[titleProp]).to.equal('32px');
        expect(a1.__styles[bodyProp]).to.equal('50px');
        expect(a2.__styles[bodyProp]).to.equal('50px');
        expect(b1.__styles[titleProp]).to.equal('60px');
        expect(b1.__styles[bodyProp]).to.equal('10px');
    });

    it('clears all props before the first measurement and writes after the last', () => {
        // The three-phase shape is the perf contract: interleaving a write
        // between measurements forces one reflow per card × slot.
        const a1 = makeFakeCard(0, { title: 20 });
        const a2 = makeFakeCard(0, { title: 30 });
        a1.__styles['--consonant-merch-card-plans-title-height'] = '99px';
        runSync([a1, a2], entriesFor(['title']));

        expect(ops.lastIndexOf('clear')).to.be.lessThan(ops.indexOf('read'));
        expect(ops.lastIndexOf('read')).to.be.lessThan(ops.indexOf('set'));
    });

    it('restores the previous value when a slot measures empty', () => {
        const a1 = makeFakeCard(0, { title: 20 });
        const a2 = makeFakeCard(0, { title: 25 });
        const prop = '--consonant-merch-card-plans-missing-height';
        a1.__styles[prop] = '17px';
        runSync([a1, a2], entriesFor(['title', 'missing']));

        expect(a1.__styles[prop], 'previous value restored').to.equal('17px');
        expect(a2.__styles[prop], 'no value to restore').to.be.undefined;
    });
});

describe('VariantLayout.insertVariantStyle', () => {
    afterEach(() => {
        document.head
            .querySelectorAll('style[data-mas-variant-style^="Probe"]')
            .forEach((el) => el.remove());
        delete VariantLayout.styleMap.ProbeLayoutA;
        delete VariantLayout.styleMap.ProbeLayoutB;
    });

    it('injects once per class and skips an identical style from another bundle copy', () => {
        class ProbeLayoutA extends VariantLayout {
            getGlobalCSS() {
                return '.probe-a { color: red; }';
            }
        }
        new ProbeLayoutA({});
        new ProbeLayoutA({});
        // A second bundle copy starts with a fresh static styleMap.
        delete VariantLayout.styleMap.ProbeLayoutA;
        new ProbeLayoutA({});
        const styles = document.head.querySelectorAll(
            'style[data-mas-variant-style="ProbeLayoutA"]',
        );
        expect(styles.length).to.equal(1);
        expect(styles[0].textContent).to.equal('.probe-a { color: red; }');
    });

    it('still injects when a colliding key holds different content', () => {
        class ProbeLayoutB extends VariantLayout {
            getGlobalCSS() {
                return '.probe-b { color: blue; }';
            }
        }
        const collider = document.createElement('style');
        collider.setAttribute('data-mas-variant-style', 'ProbeLayoutB');
        collider.textContent = '.other {}';
        document.head.appendChild(collider);
        new ProbeLayoutB({});
        const styles = document.head.querySelectorAll(
            'style[data-mas-variant-style="ProbeLayoutB"]',
        );
        expect(styles.length).to.equal(2);
    });
});

describe('global stylesheet DOM marker', () => {
    it('is injected exactly once', () => {
        expect(
            document.head.querySelectorAll('style[data-mas-global]').length,
        ).to.equal(1);
    });
});
