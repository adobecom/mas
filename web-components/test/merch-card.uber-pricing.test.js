import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';
import { EVENT_TYPE_RESOLVED, TEMPLATE_PRICE_LEGAL } from '../src/constants.js';

let UberPricing;

before(async () => {
    ({ UberPricing } = await import('../src/variants/uber-pricing.js'));
});

// SYNCED_SLOTS = ['heading-s', 'body-xs', 'heading-xs']; resyncOnReflow keys on
// width plus each slot's height, so the async legal clone (grows heading-xs) and
// a font reflow re-sync, while our own min-height writes leave the key unchanged.
describe('UberPricing.resyncOnReflow', () => {
    it('re-syncs on a real reflow but dedupes unchanged geometry', () => {
        const layout = Object.create(UberPricing.prototype);
        const rect = { width: 0 };
        const heights = { 'heading-s': 18, 'body-xs': 54, 'heading-xs': 20 };
        layout.card = {
            getBoundingClientRect: () => rect,
            querySelector: (sel) => {
                const slot = sel.match(/slot="([^"]+)"/)?.[1];
                return slot
                    ? {
                          getBoundingClientRect: () => ({
                              height: heights[slot],
                          }),
                      }
                    : null;
            },
        };
        const sync = sinon.stub(layout, 'syncHeights');

        layout.resyncOnReflow();
        expect(sync.called, 'no sync while width 0').to.be.false;

        rect.width = 300;
        layout.resyncOnReflow();
        expect(sync.calledOnce, 'syncs when width becomes real').to.be.true;

        layout.resyncOnReflow();
        expect(sync.calledOnce, 'deduped on unchanged geometry').to.be.true;

        heights['heading-xs'] = 40; // legal clone grows the price line
        layout.resyncOnReflow();
        expect(sync.calledTwice, 're-syncs when a synced slot reflows').to.be
            .true;
    });

    it('treats a missing slot as height 0', () => {
        const layout = new UberPricing({
            getBoundingClientRect: () => ({ width: 300 }),
            querySelector: () => null,
        });
        const sync = sinon.stub(layout, 'syncHeights');
        layout.resyncOnReflow();
        expect(sync.calledOnce).to.be.true;
    });
});

// syncHeights lines up the variable slots across a row of cards in a collection.
// It delegates row grouping to the base syncRowHeights (group by rect.top,
// publish the row max as a min-height var), so these drive a fake collection.
describe('UberPricing.syncHeights across a collection', () => {
    const makeCard = ({ top = 0, heights = {} } = {}) => {
        const styles = {};
        const card = {
            variant: 'uber-pricing',
            getBoundingClientRect: () => ({ width: 300, top }),
            querySelector: (sel) => {
                const slot = sel.match(/slot="([^"]+)"/)?.[1];
                const h = heights[slot];
                return h == null ? null : { __h: h };
            },
            style: {
                setProperty: (k, v) => (styles[k] = v),
                removeProperty: (k) => delete styles[k],
                getPropertyValue: (k) => styles[k] ?? '',
            },
            __styles: styles,
        };
        card.variantLayout = { card };
        return card;
    };

    const layoutFor = (cards) => {
        const layout = Object.create(UberPricing.prototype);
        layout.card = cards[0];
        const containerStyles = {};
        sinon.stub(layout, 'getContainer').returns({
            style: {
                setProperty: (k, v) => (containerStyles[k] = v),
                removeProperty: (k) => delete containerStyles[k],
                getPropertyValue: (k) => containerStyles[k] ?? '',
            },
            querySelectorAll: () => cards,
        });
        return layout;
    };

    // Heights come from the fakes' __h, so getComputedStyle reads it; the row
    // only lines up at >=768px, so matchMedia is pinned to match.
    const stubMeasurement = (matches = true) => [
        sinon
            .stub(window, 'getComputedStyle')
            .callsFake((el) =>
                el && '__h' in el ? { height: `${el.__h}px` } : { height: '' },
            ),
        sinon.stub(window, 'matchMedia').returns({ matches }),
    ];

    it('publishes each row max slot height, leaving other rows alone', () => {
        const prop = '--consonant-merch-card-uber-pricing-heading-s-height';
        const a = makeCard({ top: 0, heights: { 'heading-s': 40 } });
        const b = makeCard({ top: 0, heights: { 'heading-s': 60 } });
        const c = makeCard({ top: 500, heights: { 'heading-s': 18 } });
        const layout = layoutFor([a, b, c]);
        const [gcs, mm] = stubMeasurement();
        try {
            layout.syncHeights();
            expect(
                a.__styles[prop],
                'card matches taller row sibling',
            ).to.equal('60px');
            expect(b.__styles[prop]).to.equal('60px');
            expect(
                c.__styles[prop],
                'a card on its own row keeps its own height',
            ).to.equal('18px');
        } finally {
            gcs.restore();
            mm.restore();
        }
    });

    it('does not sync on mobile (stacked cards are each their own row)', () => {
        const prop = '--consonant-merch-card-uber-pricing-heading-s-height';
        const a = makeCard({ top: 0, heights: { 'heading-s': 40 } });
        const layout = layoutFor([a]);
        const [gcs, mm] = stubMeasurement(false);
        try {
            layout.syncHeights();
            expect(a.__styles[prop], 'no row sync below 768px').to.be.undefined;
        } finally {
            gcs.restore();
            mm.restore();
        }
    });
});

describe('UberPricing reflow wiring', () => {
    it('observes the card + description and listens for price resolution', () => {
        const observed = [];
        const RealObserver = window.ResizeObserver;
        class FakeObserver {
            constructor(callback) {
                this.callback = callback;
            }
            observe(el) {
                observed.push(el);
            }
            disconnect() {
                this.disconnected = true;
            }
        }
        window.ResizeObserver = FakeObserver;
        try {
            const desc = { tag: 'desc' };
            const listeners = {};
            // A real instance (not Object.create) so the #onPriceResolved
            // private field is installed by the constructor.
            const card = {
                addEventListener: (evt, cb) => (listeners[evt] = cb),
                removeEventListener: sinon.spy(),
                querySelector: (sel) => (sel.includes('body-xs') ? desc : null),
            };
            const layout = new UberPricing(card);
            const resync = sinon.stub(layout, 'resyncOnReflow');

            layout.connectedCallbackHook();
            expect(observed, 'observes card and description').to.include(card);
            expect(observed).to.include(desc);
            expect(listeners[EVENT_TYPE_RESOLVED], 'listens for resolve').to
                .exist;

            listeners[EVENT_TYPE_RESOLVED]();
            expect(resync.calledOnce, 'a resolved price re-syncs').to.be.true;

            layout.disconnectedCallbackHook();
            expect(
                card.removeEventListener.calledWith(EVENT_TYPE_RESOLVED),
                'removes the resolve listener',
            ).to.be.true;
        } finally {
            window.ResizeObserver = RealObserver;
        }
    });
});

describe('UberPricing.priceOptionsProvider', () => {
    it('sets displayPlanType only on the legal template', () => {
        const layout = new UberPricing({});
        const opts = {};
        layout.priceOptionsProvider({ dataset: { template: 'price' } }, opts);
        expect(opts.displayPlanType, 'left alone off the legal template').to.be
            .undefined;
        layout.priceOptionsProvider(
            { dataset: { template: TEMPLATE_PRICE_LEGAL } },
            opts,
        );
        expect(opts.displayPlanType, 'set on the legal template').to.be.true;
    });
});

describe('UberPricing.adjustLegal', () => {
    const makeFixture = (priceOverrides = {}) => {
        const clone = {
            setAttribute: sinon.spy(),
            onceSettled: () => Promise.resolve(),
            dataset: {},
        };
        const insertBefore = sinon.spy();
        const price = {
            dataset: {},
            options: {},
            cloneNode: () => clone,
            onceSettled: () => Promise.resolve(),
            parentNode: { insertBefore },
            nextSibling: 'next',
            ...priceOverrides,
        };
        const layout = new UberPricing({
            updateComplete: Promise.resolve(),
            querySelector: (sel) => (sel.includes('heading-xs') ? price : null),
        });
        return { layout, price, clone, insertBefore };
    };

    it('clones the price into a legal sibling with per-unit off', async () => {
        const { layout, clone, insertBefore } = makeFixture();
        await layout.adjustLegal();
        expect(clone.setAttribute.calledWith('data-template', 'legal')).to.be
            .true;
        expect(clone.dataset.displayPerUnit).to.equal('false');
        expect(insertBefore.calledWith(clone, 'next')).to.be.true;
    });

    it('runs only once', async () => {
        const { layout, insertBefore } = makeFixture();
        await layout.adjustLegal();
        await layout.adjustLegal();
        expect(insertBefore.callCount).to.equal(1);
    });

    it('does nothing without a price', async () => {
        const { layout, insertBefore } = makeFixture();
        layout.card.querySelector = () => null;
        await layout.adjustLegal();
        expect(insertBefore.called).to.be.false;
    });

    it('bails when the price settles without options', async () => {
        const { layout, insertBefore } = makeFixture({ options: null });
        await layout.adjustLegal();
        expect(insertBefore.called).to.be.false;
    });

    it('swallows errors from the clone', async () => {
        const { layout } = makeFixture({
            cloneNode: () => {
                throw new Error('boom');
            },
        });
        await layout.adjustLegal(); // must not throw
    });
});

describe('UberPricing.postCardUpdateHook', () => {
    const makeLayout = (cardOverrides = {}) =>
        new UberPricing({
            isConnected: true,
            updateComplete: Promise.resolve(),
            ...cardOverrides,
        });

    it('adjusts legal then schedules a desktop sync', async () => {
        const layout = makeLayout();
        const adjust = sinon.stub(layout, 'adjustLegal').resolves();
        const sync = sinon.stub(layout, 'syncHeights');
        const mm = sinon.stub(window, 'matchMedia').returns({ matches: true });
        const raf = sinon
            .stub(window, 'requestAnimationFrame')
            .callsFake((cb) => cb());
        try {
            await layout.postCardUpdateHook();
            expect(adjust.calledOnce, 'adjusts legal').to.be.true;
            expect(sync.calledOnce, 'syncs on desktop').to.be.true;
        } finally {
            mm.restore();
            raf.restore();
        }
    });

    it('skips the sync below desktop and the legal pass once adjusted', async () => {
        const layout = makeLayout();
        layout.legalAdjusted = true;
        const adjust = sinon.stub(layout, 'adjustLegal').resolves();
        const sync = sinon.stub(layout, 'syncHeights');
        const mm = sinon.stub(window, 'matchMedia').returns({ matches: false });
        try {
            await layout.postCardUpdateHook();
            expect(adjust.called, 'legal pass skipped').to.be.false;
            expect(sync.called, 'no sync below desktop').to.be.false;
        } finally {
            mm.restore();
        }
    });

    it('does nothing when the card is disconnected', async () => {
        const layout = makeLayout({ isConnected: false });
        const adjust = sinon.stub(layout, 'adjustLegal').resolves();
        await layout.postCardUpdateHook();
        expect(adjust.called).to.be.false;
    });
});

describe('UberPricing.renderLayout', () => {
    it('returns a template', () => {
        const layout = new UberPricing({});
        expect(layout.renderLayout()).to.exist;
    });
});

describe('UberPricing.syncHeights guards and observer edges', () => {
    it('does not sync a zero-width card', () => {
        const layout = new UberPricing({
            getBoundingClientRect: () => ({ width: 0 }),
        });
        const sync = sinon.stub(layout, 'syncRowHeights');
        layout.syncHeights();
        expect(sync.called).to.be.false;
    });

    it('skips the resize observer when ResizeObserver is absent', () => {
        const Real = window.ResizeObserver;
        window.ResizeObserver = undefined;
        try {
            const layout = new UberPricing({
                addEventListener: sinon.spy(),
                removeEventListener: sinon.spy(),
                querySelector: () => null,
            });
            layout.connectedCallbackHook();
            layout.disconnectedCallbackHook(); // must not throw with no observer
        } finally {
            window.ResizeObserver = Real;
        }
    });
});
