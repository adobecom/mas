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
    function makeLayout({
        bodyXxs = null,
        planType = null,
        headingMPriceSlot = null,
    } = {}) {
        const layout = Object.create(MiniCompareChart.prototype);
        layout.card = {
            querySelector: (sel) => {
                if (sel.includes('body-xxs')) return bodyXxs;
                if (sel.includes('data-template="legal"')) {
                    if (!planType) return null;
                    return { querySelector: () => planType };
                }
                return null;
            },
            shadowRoot: headingMPriceSlot
                ? {
                      querySelector: (sel) =>
                          sel.includes('heading-m-price')
                              ? { assignedElements: () => [headingMPriceSlot] }
                              : null,
                  }
                : null,
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

    it('preserves icon-button HTML when appending to .price-plan-type', () => {
        const planType = document.createElement('span');
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML =
            '<p>See details <span class="icon-button" data-tooltip="More info"></span></p>';
        bodyXxs.remove = () => {};
        const layout = makeLayout({ bodyXxs, planType });
        layout.adjustShortDescription();
        const em = planType.querySelector('em');
        expect(em).to.exist;
        expect(em.querySelector('.icon-button')).to.exist;
        expect(em.querySelector('.icon-button').dataset.tooltip).to.equal(
            'More info',
        );
    });

    it('appends icon-button even when there is no text content', () => {
        const planType = document.createElement('span');
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML =
            '<p><span class="icon-button" data-tooltip="Info"></span></p>';
        bodyXxs.remove = () => {};
        const layout = makeLayout({ bodyXxs, planType });
        layout.adjustShortDescription();
        const em = planType.querySelector('em');
        expect(em).to.exist;
        expect(em.querySelector('.icon-button')).to.exist;
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

    it('builds a fallback price-plan-type when there is no legal price', () => {
        const headingMPriceSlot = document.createElement('p');
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML = '<p>Fee applies</p>';
        const layout = makeLayout({
            bodyXxs,
            planType: null,
            headingMPriceSlot,
        });
        layout.adjustShortDescription();
        const fallback = headingMPriceSlot.querySelector(
            '.price-legal[data-fallback]',
        );
        expect(fallback).to.exist;
        const planType = fallback.querySelector('.price-plan-type');
        expect(planType.classList.contains('disabled')).to.be.true;
        expect(planType.querySelector('em').textContent).to.include(
            'Fee applies',
        );
    });

    it('reuses the existing fallback instead of creating a second one', () => {
        const headingMPriceSlot = document.createElement('p');
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML = '<p>Fee applies</p>';
        const layout = makeLayout({
            bodyXxs,
            planType: null,
            headingMPriceSlot,
        });
        layout.adjustShortDescription();
        layout.adjustShortDescription();
        expect(
            headingMPriceSlot.querySelectorAll('.price-legal[data-fallback]')
                .length,
        ).to.equal(1);
    });

    it('does nothing and does not throw when there is no heading-m-price slot to anchor a fallback', () => {
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML = '<p>Fee applies</p>';
        const layout = makeLayout({ bodyXxs, planType: null });
        layout.adjustShortDescription();
        expect(bodyXxs.querySelector('em')).to.be.null;
    });

    it('migrates short description from the fallback to a real legal price once it resolves', () => {
        const headingMPriceSlot = document.createElement('p');
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML = '<p>Fee applies</p>';

        let planType = null;
        const layout = Object.create(MiniCompareChart.prototype);
        layout.card = {
            querySelector: (sel) => {
                if (sel.includes('body-xxs')) return bodyXxs;
                if (sel.includes('data-template="legal"')) {
                    if (!planType) return null;
                    return { querySelector: () => planType };
                }
                return null;
            },
            shadowRoot: {
                querySelector: (sel) =>
                    sel.includes('heading-m-price')
                        ? { assignedElements: () => [headingMPriceSlot] }
                        : null,
            },
        };

        layout.adjustShortDescription();
        expect(
            headingMPriceSlot.querySelector('.price-legal[data-fallback] em'),
        ).to.exist;

        planType = document.createElement('span');
        layout.adjustShortDescription();

        expect(headingMPriceSlot.querySelector('.price-legal[data-fallback]'))
            .to.be.null;
        const em = planType.querySelector('em');
        expect(em).to.exist;
        expect(em.textContent).to.include('Fee applies');
    });
});
