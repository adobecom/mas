import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    initMasCommerceService,
    removeMasCommerceService,
} from './utilities.js';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';
import { EVENT_TYPE_RESOLVED, TEMPLATE_PRICE_LEGAL } from '../src/constants.js';

let ProductPricing;

before(async () => {
    ({ ProductPricing } = await import('../src/variants/product-pricing.js'));
});

// SYNCED_SLOTS = ['heading-s', 'body-xs', 'heading-xs']; resyncOnReflow keys on
// width plus each slot's height, so the async legal clone (grows heading-xs) and
// a font reflow re-sync, while our own min-height writes leave the key unchanged.
describe('ProductPricing.resyncOnReflow', () => {
    it('re-syncs on a real reflow but dedupes unchanged geometry', () => {
        const layout = Object.create(ProductPricing.prototype);
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
        const layout = new ProductPricing({
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
describe('ProductPricing.syncHeights across a collection', () => {
    const makeCard = ({ top = 0, heights = {} } = {}) => {
        const styles = {};
        const card = {
            variant: 'product-pricing',
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
        const layout = Object.create(ProductPricing.prototype);
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
        const prop = '--consonant-merch-card-product-pricing-heading-s-height';
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
        const prop = '--consonant-merch-card-product-pricing-heading-s-height';
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

describe('ProductPricing reflow wiring', () => {
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
            const layout = new ProductPricing(card);
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

describe('ProductPricing.priceOptionsProvider', () => {
    it('searches the product name in heading-s', () => {
        expect(new ProductPricing({}).headingSelector).to.equal(
            '[slot="heading-s"]',
        );
    });

    it('sets displayPlanType only on the legal template', () => {
        const layout = new ProductPricing({});
        const opts = {};
        layout.priceOptionsProvider({ dataset: { template: 'price' } }, opts);
        expect(opts.displayPlanType, 'left alone off the legal template').to.be
            .undefined;
        layout.priceOptionsProvider(
            { dataset: { template: TEMPLATE_PRICE_LEGAL } },
            opts,
        );
        expect(opts.displayPlanType, 'shown by default on the legal template')
            .to.be.true;
    });

    it('honors the card displayPlanType setting on the legal template', () => {
        const legal = { dataset: { template: TEMPLATE_PRICE_LEGAL } };
        const off = {};
        new ProductPricing({
            settings: { displayPlanType: false },
        }).priceOptionsProvider(legal, off);
        expect(off.displayPlanType, 'author turned it off').to.be.false;
        const on = {};
        new ProductPricing({
            settings: { displayPlanType: true },
        }).priceOptionsProvider(legal, on);
        expect(on.displayPlanType, 'author turned it on').to.be.true;
    });
});

describe('ProductPricing.adjustLegal', () => {
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
        const layout = new ProductPricing({
            updateComplete: Promise.resolve(),
            querySelector: (sel) => (sel.includes('heading-xs') ? price : null),
        });
        return { layout, price, clone, insertBefore };
    };

    it('strips fine print off the bold price and clones a legal sibling', async () => {
        const { layout, price, clone, insertBefore } = makeFixture({
            options: {
                displayPerUnit: true,
                displayTax: true,
                displayPlanType: true,
            },
        });
        await layout.adjustLegal();
        expect(clone.setAttribute.calledWith('data-template', 'legal')).to.be
            .true;
        expect(price.dataset.displayPerUnit).to.equal('false');
        expect(price.dataset.displayTax).to.equal('false');
        expect(price.dataset.displayPlanType).to.equal('false');
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

describe('ProductPricing.postCardUpdateHook', () => {
    const makeLayout = (cardOverrides = {}) =>
        new ProductPricing({
            isConnected: true,
            updateComplete: Promise.resolve(),
            querySelector: () => null,
            toggleAttribute: () => {},
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

describe('ProductPricing.renderLayout', () => {
    it('returns a template', () => {
        const layout = new ProductPricing({});
        expect(layout.renderLayout()).to.exist;
    });
});

describe('ProductPricing.syncHeights guards and observer edges', () => {
    it('does not sync a zero-width card', () => {
        const layout = new ProductPricing({
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
            const layout = new ProductPricing({
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

// A card with no authored price must not reserve the row-synced price height:
// that reservation is the ~80px blank band above the CTAs. The collapse is CSS,
// so this asserts the rendered slot, which also catches a selector the browser
// silently drops (:has() inside :host() is invalid and was dropped).
describe('ProductPricing price row collapse', () => {
    before(() => initMasCommerceService());
    after(() => removeMasCommerceService());

    const render = async (withPrice) => {
        const card = document.createElement('merch-card');
        card.setAttribute('variant', 'product-pricing');
        card.innerHTML = `
            <h3 slot="heading-s">Title</h3>
            <div slot="body-xs">Copy</div>
            ${withPrice ? '<p slot="heading-xs">US$9.99/mo</p>' : ''}
            <div slot="footer"><a href="#">Buy</a></div>`;
        document.body.appendChild(card);
        await card.updateComplete;
        card.variantLayout.flagPriceRow();
        await card.updateComplete;
        return card;
    };

    const priceSlotDisplay = (card) =>
        getComputedStyle(
            card.shadowRoot.querySelector('slot[name="heading-xs"]'),
        ).display;

    it('collapses the price slot only when no price is authored', async () => {
        const priced = await render(true);
        const bare = await render(false);
        try {
            expect(bare.hasAttribute('no-price'), 'flags the bare card').to.be
                .true;
            expect(priced.hasAttribute('no-price'), 'priced card unflagged').to
                .be.false;
            expect(
                priceSlotDisplay(bare),
                'bare price slot collapsed',
            ).to.equal('none');
            expect(priceSlotDisplay(priced), 'priced slot rendered').to.equal(
                'flex',
            );
        } finally {
            priced.remove();
            bare.remove();
        }
    });
});
