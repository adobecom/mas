import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    initMasCommerceService,
    removeMasCommerceService,
} from './utilities.js';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';
import '../src/merch-card-collection.js';
import { EVENT_TYPE_RESOLVED, TEMPLATE_PRICE_LEGAL } from '../src/constants.js';

let ProductPricing;

before(async () => {
    ({ ProductPricing } = await import('../src/variants/product-pricing.js'));
});

describe('ProductPricing.resyncOnReflow', () => {
    it('re-syncs on a real reflow but dedupes unchanged geometry', () => {
        const layout = Object.create(ProductPricing.prototype);
        const rect = { width: 0 };
        const heights = {
            'heading-s': 18,
            'body-xs': 54,
            'heading-xs': 20,
            fine: 0,
        };
        const box = (h) => ({ getBoundingClientRect: () => ({ height: h }) });
        layout.card = {
            getBoundingClientRect: () => rect,
            querySelector: (sel) => {
                const slot = sel.match(/slot="([^"]+)"/)?.[1];
                return slot && heights[slot] != null
                    ? box(heights[slot])
                    : null;
            },
            shadowRoot: {
                querySelector: (sel) =>
                    sel.includes('.fine') ? box(heights.fine) : null,
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

        heights.fine = 18; // legal clone grows the legal row
        layout.resyncOnReflow();
        expect(sync.calledTwice, 're-syncs when a synced row reflows').to.be
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
            shadowRoot: {
                querySelector: (sel) =>
                    sel.includes('.fine') && heights.fine != null
                        ? { __h: heights.fine }
                        : null,
            },
            removeAttribute: () => {},
            toggleAttribute: () => {},
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

    it('syncs the price and the legal line as separate rows', () => {
        const price = '--consonant-merch-card-product-pricing-price-height';
        const fine = '--consonant-merch-card-product-pricing-fine-height';
        const withLegal = makeCard({ heights: { 'heading-xs': 20, fine: 18 } });
        const noLegal = makeCard({ heights: { 'heading-xs': 20, fine: 0 } });
        const layout = layoutFor([withLegal, noLegal]);
        const [gcs, mm] = stubMeasurement();
        try {
            layout.syncHeights();
            [withLegal, noLegal].forEach((card) => {
                expect(card.__styles[price]).to.equal('20px');
                expect(card.__styles[fine], 'legal row shared').to.equal(
                    '18px',
                );
            });
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
            const shortDesc = { tag: 'short-desc' };
            const listeners = {};
            // A real instance (not Object.create) so the #onPriceResolved
            // private field is installed by the constructor.
            const card = {
                addEventListener: (evt, cb) => (listeners[evt] = cb),
                removeEventListener: sinon.spy(),
                querySelector: (sel) => {
                    if (sel.includes('body-xs')) return desc;
                    if (sel.includes('short-description')) return shortDesc;
                    return null;
                },
            };
            const layout = new ProductPricing(card);
            const resync = sinon.stub(layout, 'resyncOnReflow');

            layout.connectedCallbackHook();
            expect(observed, 'observes card and description').to.include(card);
            expect(observed).to.include(desc);
            expect(observed, 'observes the short description').to.include(
                shortDesc,
            );
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
        const price = {
            dataset: {},
            options: {},
            cloneNode: () => clone,
            onceSettled: () => Promise.resolve(),
            ...priceOverrides,
        };
        const legalHost = { appendChild: sinon.spy() };
        const layout = new ProductPricing({
            updateComplete: Promise.resolve(),
            querySelector: (sel) =>
                sel.includes('slot="legal"')
                    ? legalHost
                    : sel.includes('heading-xs')
                      ? price
                      : null,
            appendChild: sinon.spy(),
        });
        return { layout, price, clone, legalHost };
    };

    it('keeps per-unit on the bold price, moves tax and plan type to a cloned legal line', async () => {
        const { layout, price, clone, legalHost } = makeFixture({
            options: {
                displayPerUnit: true,
                displayTax: true,
                displayPlanType: true,
            },
        });
        await layout.adjustLegal();
        expect(clone.setAttribute.calledWith('data-template', 'legal')).to.be
            .true;
        expect(price.dataset.displayPerUnit, 'stays on price').to.be.undefined;
        expect(clone.dataset.displayPerUnit, 'off the legal line').to.equal(
            'false',
        );
        expect(price.dataset.displayTax).to.equal('false');
        expect(price.dataset.displayPlanType).to.equal('false');
        expect(legalHost.appendChild.calledWith(clone)).to.be.true;
    });

    it('creates a slot="legal" host when missing', async () => {
        const clone = {
            setAttribute: sinon.spy(),
            onceSettled: () => Promise.resolve(),
            dataset: {},
        };
        const price = {
            dataset: {},
            options: {},
            cloneNode: () => clone,
            onceSettled: () => Promise.resolve(),
        };
        const host = { setAttribute: sinon.spy(), appendChild: sinon.spy() };
        const card = {
            updateComplete: Promise.resolve(),
            querySelector: (sel) =>
                sel.includes('slot="legal"')
                    ? null
                    : sel.includes('heading-xs')
                      ? price
                      : null,
            appendChild: sinon.spy(),
        };
        const create = sinon.stub(document, 'createElement').returns(host);
        try {
            await new ProductPricing(card).adjustLegal();
            expect(host.setAttribute.calledWith('slot', 'legal')).to.be.true;
            expect(card.appendChild.calledWith(host)).to.be.true;
            expect(host.appendChild.calledWith(clone)).to.be.true;
        } finally {
            create.restore();
        }
    });

    it('runs only once', async () => {
        const { layout, legalHost } = makeFixture();
        await layout.adjustLegal();
        await layout.adjustLegal();
        expect(legalHost.appendChild.callCount).to.equal(1);
    });

    it('does nothing without a price', async () => {
        const { layout, legalHost } = makeFixture();
        layout.card.querySelector = () => null;
        await layout.adjustLegal();
        expect(legalHost.appendChild.called).to.be.false;
    });

    it('bails when the price settles without options', async () => {
        const { layout, legalHost } = makeFixture({ options: null });
        await layout.adjustLegal();
        expect(legalHost.appendChild.called).to.be.false;
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

describe('ProductPricing row alignment', () => {
    before(() => initMasCommerceService());
    after(() => removeMasCommerceService());

    const renderRow = async (cardsHtml, column = '261px') => {
        const wrap = document.createElement('div');
        wrap.style.cssText = `display:grid;grid-template-columns:repeat(2,${column});gap:8px;`;
        wrap.innerHTML = cardsHtml
            .map(
                (inner) => `<merch-card variant="product-pricing">
                    <h3 slot="heading-s">Title</h3>${inner}</merch-card>`,
            )
            .join('');
        document.body.appendChild(wrap);
        const cards = [...wrap.children];
        await Promise.all(cards.map((c) => c.updateComplete));
        cards.forEach((c) => c.variantLayout.syncHeights());
        await Promise.all(cards.map((c) => c.updateComplete));
        return { wrap, cards };
    };

    it('bottom-aligns a plain price with a stacked strikethrough price', async () => {
        const { wrap, cards } = await renderRow([
            `<p slot="heading-xs"><span class="price-strikethrough">US$20</span><span class="price-alternative">US$10</span></p>
             <div slot="footer"><a href="#">Buy</a></div>`,
            `<p slot="heading-xs"><span class="price-alternative">US$10</span></p>
             <div slot="footer"><a href="#">Buy</a></div>`,
        ]);
        try {
            const [stacked, plain] = cards.map(
                (c) =>
                    c
                        .querySelector('.price-alternative')
                        .getBoundingClientRect().bottom,
            );
            expect(plain).to.equal(stacked);
        } finally {
            wrap.remove();
        }
    });

    const ctas = (...labels) =>
        `<p slot="heading-xs">US$10</p><div slot="footer">${labels
            .map((l, i) => `<a href="#"${i ? ' class="outline"' : ''}>${l}</a>`)
            .join('')}</div>`;

    it('stacks every card in a row when one card must', async () => {
        const { wrap, cards } = await renderRow(
            [
                ctas('Buy', 'Try'),
                ctas('Jetzt kaufen und sparen', 'Kostenlos testen und mehr'),
            ],
            '340px',
        );
        try {
            cards.forEach((card) => {
                expect(card.hasAttribute('stacked')).to.be.true;
                const [a, b] = [...card.querySelectorAll('[slot="footer"] a')];
                expect(b.getBoundingClientRect().top).to.be.above(
                    a.getBoundingClientRect().bottom,
                );
            });
            const [fa, fb] = cards.map((c) =>
                c.shadowRoot.querySelector('footer').getBoundingClientRect(),
            );
            expect(fa.height).to.equal(fb.height);
        } finally {
            wrap.remove();
        }
    });

    it('drops the row stacking when the layout narrows', async () => {
        const { wrap, cards } = await renderRow(
            [ctas('Jetzt kaufen und sparen', 'Kostenlos testen und mehr')],
            '340px',
        );
        const mm = sinon.stub(window, 'matchMedia').returns({ matches: false });
        try {
            expect(cards[0].hasAttribute('stacked')).to.be.true;
            cards[0].variantLayout.syncHeights();
            expect(cards[0].hasAttribute('stacked')).to.be.false;
            expect(
                cards[0].style.getPropertyValue(
                    '--consonant-merch-card-product-pricing-footer-height',
                ),
            ).to.equal('');
        } finally {
            mm.restore();
            wrap.remove();
        }
    });

    it('keeps price and fine print aligned when one card stacks its CTAs', async () => {
        const { wrap, cards } = await renderRow([
            `<p slot="heading-xs">US$10</p>
             <div slot="footer"><a href="#">Buy</a></div>`,
            `<p slot="heading-xs">US$10</p>
             <div slot="footer"><a href="#">Jetzt kaufen und sparen</a><a href="#" class="outline">Kostenlos testen und mehr</a></div>`,
        ]);
        try {
            const [a, b] = cards.map((c) =>
                c.querySelector('[slot="heading-xs"]').getBoundingClientRect(),
            );
            expect(b.bottom).to.equal(a.bottom);
            const [fa, fb] = cards.map((c) =>
                c.shadowRoot.querySelector('footer').getBoundingClientRect(),
            );
            expect(fb.height, 'footers share a height').to.equal(fa.height);
        } finally {
            wrap.remove();
        }
    });
});

describe('ProductPricing CTAs', () => {
    before(() => initMasCommerceService());
    after(() => removeMasCommerceService());

    const render = async (labels, width = '261px') => {
        const card = document.createElement('merch-card');
        card.setAttribute('variant', 'product-pricing');
        card.style.width = width;
        card.innerHTML = `
            <h3 slot="heading-s">Title</h3>
            <div slot="footer">
                ${labels.map((l, i) => `<a href="#"${i ? ' class="outline"' : ''}>${l}</a>`).join('')}
            </div>`;
        document.body.appendChild(card);
        await card.updateComplete;
        return card;
    };

    const rects = (card) =>
        [...card.querySelectorAll('[slot="footer"] a')].map((el) =>
            el.getBoundingClientRect(),
        );

    it('share a row while both labels fit on one line', async () => {
        const card = await render(['Free trial', 'Buy now'], '340px');
        try {
            const [a, b] = rects(card);
            expect(b.top).to.equal(a.top);
            expect(b.width).to.be.closeTo(a.width, 1);
            expect(a.height).to.equal(40);
        } finally {
            card.remove();
        }
    });

    it('stack, full width, when a label outgrows its half', async () => {
        const card = await render([
            'Kostenlos testen',
            'Jetzt kaufen und sparen',
        ]);
        try {
            const [a, b] = rects(card);
            expect(b.top).to.be.at.least(a.bottom);
            expect(b.left).to.equal(a.left);
            expect(b.width).to.equal(a.width);
            expect(a.height).to.equal(40);
        } finally {
            card.remove();
        }
    });

    it('lead with the filled CTA, side by side or stacked', async () => {
        const side = await render(['Free trial', 'Buy now'], '340px');
        const stacked = await render([
            'Kostenlos testen',
            'Jetzt kaufen und sparen',
        ]);
        try {
            // Authored outlined-first: move the filled link last.
            [side, stacked].forEach((card) => {
                const footer = card.querySelector('[slot="footer"]');
                footer.append(footer.firstElementChild);
            });
            const [sideOutlined, sideFilled] = rects(side);
            const [stackedOutlined, stackedFilled] = rects(stacked);
            expect(sideFilled.left).to.be.below(sideOutlined.left);
            expect(stackedFilled.top).to.be.below(stackedOutlined.top);
        } finally {
            side.remove();
            stacked.remove();
        }
    });

    it('wrap a label wider than the whole footer instead of overflowing', async () => {
        const card = await render([
            'Ein sehr langes Angebot jetzt sofort kostenlos testen',
        ]);
        try {
            const link = card.querySelector('[slot="footer"] a');
            expect(link.scrollWidth).to.be.at.most(link.clientWidth);
            expect(link.offsetHeight).to.be.above(40);
        } finally {
            card.remove();
        }
    });
});

describe('product-pricing collection footer', () => {
    it('leaves room around "Show more" for its focus ring', async () => {
        const collection = document.createElement('merch-card-collection');
        collection.classList.add('product-pricing');
        document.body.appendChild(collection);
        await collection.updateComplete;
        try {
            const footer = collection.shadowRoot.querySelector('#footer');
            const style = getComputedStyle(footer);
            expect(style.paddingTop).to.equal('4px');
            expect(style.paddingBottom).to.equal('4px');
        } finally {
            collection.remove();
        }
    });

    it('styles "Show more" like the outlined CTAs', async () => {
        const collection = document.createElement('merch-card-collection');
        collection.classList.add('product-pricing');
        collection.hasMore = true;
        document.body.appendChild(collection);
        await collection.updateComplete;
        try {
            const button = collection.shadowRoot.querySelector('sp-button');
            const style = getComputedStyle(button);
            expect(style.getPropertyValue('--mod-button-height')).to.equal(
                '40px',
            );
            expect(
                style.getPropertyValue('--mod-button-border-width'),
            ).to.equal('2px');
            expect(
                style.getPropertyValue('--mod-button-border-color-default'),
            ).to.equal('#000');
        } finally {
            collection.remove();
        }
    });
});
