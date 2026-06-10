import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';

let Product, Plans, PlansV2, MiniCompareChart;

before(async () => {
    if (!document.querySelector('mas-commerce-service')) {
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    }
    await customElements.whenDefined('merch-card');
    ({ Product } = await import('../src/variants/product.js'));
    ({ Plans } = await import('../src/variants/plans.js'));
    ({ PlansV2 } = await import('../src/variants/plans-v2.js'));
    ({ MiniCompareChart } = await import(
        '../src/variants/mini-compare-chart.js'
    ));
});

// ── Product ───────────────────────────────────────────────────────────────────

describe('Product.adjustAddon', () => {
    function makeLayout(cardOverrides = {}) {
        const layout = Object.create(Product.prototype);
        layout.card = {
            updateComplete: Promise.resolve(),
            addon: null,
            planType: undefined,
            querySelector: () => null,
            ...cardOverrides,
        };
        return layout;
    }

    it('does nothing when there is no add-on', async () => {
        await makeLayout({ addon: null }).adjustAddon(); // must not throw
    });

    it('sets planType from the settled main price', async () => {
        const addon = {};
        const price = {
            onceSettled: () => Promise.resolve(),
            value: [{ planType: 'PUF' }],
        };
        const layout = makeLayout({
            addon,
            querySelector: (sel) => (sel.includes('heading-xs') ? price : null),
        });
        await layout.adjustAddon();
        expect(addon.planType).to.equal('PUF');
    });

    it('does not throw when price element lacks onceSettled (unupgraded custom element)', async () => {
        const addon = {};
        const price = { value: [{ planType: 'PUF' }] }; // no onceSettled
        const layout = makeLayout({
            addon,
            querySelector: (sel) => (sel.includes('heading-xs') ? price : null),
        });
        await layout.adjustAddon();
        expect(addon.planType).to.equal('PUF');
    });
});

// ── Plans ─────────────────────────────────────────────────────────────────────

describe('Plans.adjustAddon', () => {
    // Plans.mainPrice chains: headingM = card.querySelector('[slot="heading-m"]'),
    // then headingM.querySelector(SELECTOR_MAS_INLINE_PRICE...).
    // Mock card.querySelector to return a container with its own querySelector.
    function makeLayout(cardOverrides = {}) {
        const layout = Object.create(Plans.prototype);
        layout.card = {
            updateComplete: Promise.resolve(),
            addon: null,
            querySelector: () => null,
            ...cardOverrides,
        };
        return layout;
    }

    it('does nothing when there is no add-on', async () => {
        await makeLayout({ addon: null }).adjustAddon();
    });

    it('sets custom-checkbox and planType from the settled main price', async () => {
        const addon = { setAttribute: sinon.spy() };
        const price = {
            onceSettled: () => Promise.resolve(),
            value: [{ planType: 'ABM' }],
        };
        const layout = makeLayout({
            addon,
            querySelector: () => ({ querySelector: () => price }),
        });
        await layout.adjustAddon();
        expect(addon.setAttribute.calledWith('custom-checkbox', '')).to.be.true;
        expect(addon.planType).to.equal('ABM');
    });

    it('does not throw when price element lacks onceSettled (unupgraded custom element)', async () => {
        const addon = { setAttribute: sinon.spy() };
        const price = { value: [{ planType: 'ABM' }] }; // no onceSettled
        const layout = makeLayout({
            addon,
            querySelector: () => ({ querySelector: () => price }),
        });
        await layout.adjustAddon();
        expect(addon.planType).to.equal('ABM');
    });
});

// ── PlansV2 ───────────────────────────────────────────────────────────────────

describe('PlansV2.adjustAddon', () => {
    function makeLayout(cardOverrides = {}) {
        const layout = Object.create(PlansV2.prototype);
        layout.card = {
            updateComplete: Promise.resolve(),
            addon: null,
            querySelector: () => null,
            ...cardOverrides,
        };
        return layout;
    }

    it('does nothing when there is no add-on', async () => {
        await makeLayout({ addon: null }).adjustAddon();
    });

    it('sets custom-checkbox and planType from the settled main price', async () => {
        const addon = { setAttribute: sinon.spy() };
        const price = {
            onceSettled: () => Promise.resolve(),
            value: [{ planType: 'ABM' }],
        };
        const layout = makeLayout({
            addon,
            querySelector: (sel) => (sel.includes('heading-m') ? price : null),
        });
        await layout.adjustAddon();
        expect(addon.setAttribute.calledWith('custom-checkbox', '')).to.be.true;
        expect(addon.planType).to.equal('ABM');
    });

    it('does not throw when price element lacks onceSettled (unupgraded custom element)', async () => {
        const addon = { setAttribute: sinon.spy() };
        const price = { value: [{ planType: 'ABM' }] }; // no onceSettled
        const layout = makeLayout({
            addon,
            querySelector: (sel) => (sel.includes('heading-m') ? price : null),
        });
        await layout.adjustAddon();
        expect(addon.planType).to.equal('ABM');
    });
});

// ── MiniCompareChart ──────────────────────────────────────────────────────────

describe('MiniCompareChart.adjustAddon', () => {
    function makeLayout(cardOverrides = {}) {
        const layout = Object.create(MiniCompareChart.prototype);
        layout.card = {
            updateComplete: Promise.resolve(),
            addon: null,
            planType: undefined,
            // Return null for 'merch-addon[plan-type]' so the post-planType
            // updateCardElementMinHeight branch is safely skipped.
            querySelector: (sel) =>
                sel.includes('heading-m-price') ? null : null,
            ...cardOverrides,
        };
        return layout;
    }

    it('does nothing when there is no add-on', async () => {
        await makeLayout({ addon: null }).adjustAddon();
    });

    it('sets planType from the settled main price', async () => {
        const addon = {};
        const price = {
            onceSettled: () => Promise.resolve(),
            value: [{ planType: 'PUF' }],
        };
        const layout = makeLayout({
            addon,
            querySelector: (sel) =>
                sel.includes('heading-m-price') ? price : null,
        });
        await layout.adjustAddon();
        expect(addon.planType).to.equal('PUF');
    });

    it('does not throw when price element lacks onceSettled (unupgraded custom element)', async () => {
        const addon = {};
        const price = { value: [{ planType: 'PUF' }] }; // no onceSettled
        const layout = makeLayout({
            addon,
            querySelector: (sel) =>
                sel.includes('heading-m-price') ? price : null,
        });
        await layout.adjustAddon();
        expect(addon.planType).to.equal('PUF');
    });
});
