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
        const headingMPriceSlot = document.createElement('p');
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML = '<p> </p>';
        makeLayout({
            bodyXxs,
            planType: null,
            headingMPriceSlot,
        }).adjustShortDescription();
        expect(headingMPriceSlot.querySelector('.price-legal')).to.be.null;
    });

    it('leaves the short description to the legal price and keeps body-xxs in place', () => {
        const planType = document.createElement('span');
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML = '<p>Great value</p>';
        const layout = makeLayout({ bodyXxs, planType });
        layout.adjustShortDescription();
        expect(planType.querySelector('em')).to.be.null;
        expect(bodyXxs.innerHTML).to.equal('<p>Great value</p>');
    });

    it('does not build a stand-in while the legal price is being adjusted', () => {
        const headingMPriceSlot = document.createElement('p');
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML = '<p>Fee applies</p>';
        const layout = makeLayout({
            bodyXxs,
            planType: null,
            headingMPriceSlot,
        });
        layout.legalAdjusting = true;
        layout.adjustShortDescription();
        expect(headingMPriceSlot.querySelector('.price-legal')).to.be.null;
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

    it('preserves icon-button HTML in the fallback, even without text content', () => {
        const headingMPriceSlot = document.createElement('p');
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML =
            '<p><span class="icon-button" data-tooltip="Info"></span></p>';
        const layout = makeLayout({
            bodyXxs,
            planType: null,
            headingMPriceSlot,
        });
        layout.adjustShortDescription();
        const em = headingMPriceSlot.querySelector(
            '.price-legal[data-fallback] em',
        );
        expect(em.querySelector('.icon-button').dataset.tooltip).to.equal(
            'Info',
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
        expect(headingMPriceSlot.querySelectorAll('em').length).to.equal(1);
    });

    it('does nothing and does not throw when there is no heading-m-price slot to anchor a fallback', () => {
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML = '<p>Fee applies</p>';
        const layout = makeLayout({ bodyXxs, planType: null });
        layout.adjustShortDescription();
        expect(bodyXxs.querySelector('em')).to.be.null;
    });

    it('discards the fallback once a legal price exists, which renders the short description itself', () => {
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
        expect(planType.querySelector('em')).to.be.null;
        expect(bodyXxs.innerHTML).to.equal('<p>Fee applies</p>');
    });
});

// ── MiniCompareChart.shortDescription ─────────────────────────────────────────

describe('MiniCompareChart.shortDescription', () => {
    function layoutWith(bodyXxs) {
        const layout = Object.create(MiniCompareChart.prototype);
        layout.card = { querySelector: () => bodyXxs };
        return layout;
    }

    it('is empty when there is no [slot="body-xxs"]', () => {
        expect(layoutWith(null).shortDescription).to.equal('');
    });

    it('is empty when it has no text and no icon-button', () => {
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML = '<p>  </p>';
        expect(layoutWith(bodyXxs).shortDescription).to.equal('');
    });

    it('returns the authored markup, read in place', () => {
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML = '<p>See <b>details</b></p>';
        const layout = layoutWith(bodyXxs);
        expect(layout.shortDescription).to.equal('<p>See <b>details</b></p>');
        expect(bodyXxs.isConnected).to.be.false;
        expect(bodyXxs.innerHTML).to.equal('<p>See <b>details</b></p>');
    });

    it('counts an icon-button as content even without text', () => {
        const bodyXxs = document.createElement('div');
        bodyXxs.innerHTML =
            '<p><span class="icon-button" data-tooltip="Info"></span></p>';
        expect(layoutWith(bodyXxs).shortDescription).to.include(
            'data-tooltip="Info"',
        );
    });
});
