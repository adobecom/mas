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

// ── MiniCompareChart.adjustShortDescription ───────────────────────────────────

describe('MiniCompareChart.adjustShortDescription', () => {
    function makeLayout({ bodyXxs = null, planType = null } = {}) {
        const layout = Object.create(MiniCompareChart.prototype);
        layout.card = {
            querySelector: (sel) => {
                if (sel.includes('body-xxs')) return bodyXxs;
                if (sel.includes('heading-m-price')) {
                    if (!planType) return null;
                    return { querySelector: () => planType };
                }
                return null;
            },
        };
        return layout;
    }

    it('does nothing when no [slot="body-xxs"] exists', () => {
        makeLayout().adjustShortDescription(); // must not throw
    });

    it('does nothing when shortDescription has no text and no icon-button', () => {
        const planType = document.createElement('span');
        const bodyXxs = document.createElement('div');
        bodyXxs.remove = () => {};
        const layout = makeLayout({ bodyXxs, planType });
        layout.adjustShortDescription();
        expect(planType.querySelector('em')).to.be.null;
    });

    it('appends text into .price-plan-type as an <em>', () => {
        const planType = document.createElement('span');
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML = '<p>Great value</p>';
        bodyXxs.remove = () => {};
        const layout = makeLayout({ bodyXxs, planType });
        layout.adjustShortDescription();
        const em = planType.querySelector('em');
        expect(em).to.exist;
        expect(em.textContent).to.include('Great value');
    });

    it('does not append twice when called a second time', () => {
        const planType = document.createElement('span');
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML = '<p>Stock</p>';
        bodyXxs.remove = () => {};
        const layout = makeLayout({ bodyXxs, planType });
        layout.adjustShortDescription();
        layout.adjustShortDescription();
        expect(planType.querySelectorAll('em').length).to.equal(1);
    });
});
