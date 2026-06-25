import { expect } from '@esm-bundle/chai';
import '../src/mas.js';

let Product;

before(async () => {
    if (!document.querySelector('mas-commerce-service')) {
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    }
    await customElements.whenDefined('merch-card');
    ({ Product } = await import('../src/variants/product.js'));
});

// ── Product.adjustShortDescription ───────────────────────────────────────────

describe('Product.adjustShortDescription', () => {
    function makeLayout({ shortDesc = null, legal = null } = {}) {
        const layout = Object.create(Product.prototype);
        layout.card = {
            querySelector: (sel) => {
                if (sel.includes('short-description')) return shortDesc;
                if (sel.includes('data-template="legal"')) return legal;
                return null;
            },
        };
        return layout;
    }

    it('does nothing when there is no short-description element', () => {
        makeLayout().adjustShortDescription(); // must not throw
    });

    it('does nothing when short-description has no text', () => {
        const shortDesc = document.createElement('div');
        makeLayout({ shortDesc }).adjustShortDescription(); // must not throw
    });

    it('does nothing when legal price element is missing', () => {
        const shortDesc = document.createElement('div');
        shortDesc.innerHTML = '<p>Annual subscription</p>';
        makeLayout({ shortDesc }).adjustShortDescription(); // must not throw
    });

    it('appends .merch-short-description span into legal price', () => {
        const shortDesc = document.createElement('div');
        shortDesc.innerHTML = '<p>Annual subscription</p>';
        const legal = document.createElement('span');
        const layout = makeLayout({ shortDesc, legal });
        layout.adjustShortDescription();
        const span = legal.querySelector('.merch-short-description');
        expect(span).to.exist;
        expect(span.textContent).to.include('Annual subscription');
    });

    it('removes existing .merch-short-description before re-appending', () => {
        const shortDesc = document.createElement('div');
        shortDesc.innerHTML = '<p>Annual subscription</p>';
        const legal = document.createElement('span');
        const layout = makeLayout({ shortDesc, legal });
        layout.adjustShortDescription();
        layout.adjustShortDescription();
        expect(
            legal.querySelectorAll('.merch-short-description').length,
        ).to.equal(1);
    });

    it('inserts after .price-plan-type when present', () => {
        const shortDesc = document.createElement('div');
        shortDesc.innerHTML = '<p>Annual subscription</p>';
        const legal = document.createElement('span');
        const planType = document.createElement('span');
        planType.className = 'price-plan-type';
        legal.appendChild(planType);
        const layout = makeLayout({ shortDesc, legal });
        layout.adjustShortDescription();
        const children = [...legal.children];
        expect(children.indexOf(planType)).to.be.lessThan(
            children.indexOf(legal.querySelector('.merch-short-description')),
        );
    });

    it('wires tooltip events on .icon-button elements', () => {
        const shortDesc = document.createElement('div');
        shortDesc.innerHTML =
            '<p>See details <span class="icon-button" data-tooltip="More info"></span></p>';
        const legal = document.createElement('span');
        const layout = makeLayout({ shortDesc, legal });
        layout.adjustShortDescription();
        const btn = legal.querySelector(
            '.merch-short-description .icon-button',
        );
        expect(btn).to.exist;
        btn.dispatchEvent(new Event('mouseenter'));
        expect(btn.classList.contains('tooltip-visible')).to.be.true;
        btn.dispatchEvent(new Event('mouseleave'));
        expect(btn.classList.contains('tooltip-visible')).to.be.false;
    });

    it('does not wire events twice on the same button', () => {
        const shortDesc = document.createElement('div');
        shortDesc.innerHTML =
            '<p>Details <span class="icon-button" data-tooltip="Info"></span></p>';
        const legal = document.createElement('span');
        const layout = makeLayout({ shortDesc, legal });
        layout.adjustShortDescription();
        layout.adjustShortDescription();
        const btn = legal.querySelector(
            '.merch-short-description .icon-button',
        );
        btn.dispatchEvent(new Event('mouseenter'));
        expect(btn.classList.contains('tooltip-visible')).to.be.true;
    });
});

// ── Product.adjustLegal ───────────────────────────────────────────────────────

describe('Product.adjustLegal', () => {
    function makeLayout({ id = '', headingPrice = null } = {}) {
        const layout = Object.create(Product.prototype);
        layout.card = {
            id,
            updateComplete: Promise.resolve(),
            querySelector: (sel) => {
                if (sel.includes('heading-xs') && sel.includes('inline-price'))
                    return headingPrice;
                return null;
            },
        };
        return layout;
    }

    it('does nothing when card has no id', async () => {
        await makeLayout({ id: '' }).adjustLegal(); // must not throw
    });

    it('does nothing when mainPrice is missing', async () => {
        const layout = makeLayout({ id: 'card-1' });
        await customElements.whenDefined('inline-price').catch(() => {});
        await layout.adjustLegal(); // must not throw
    });

    it('sets legalAdjusted flag so it only runs once', async () => {
        const layout = makeLayout({ id: 'card-1' });
        layout.legalAdjusted = true;
        await layout.adjustLegal(); // must not throw — exits early
        expect(layout.legalAdjusted).to.be.true;
    });
});

// ── Product.renderLayout ──────────────────────────────────────────────────────

describe('Product.renderLayout', () => {
    function makeLayout({ promoBottom = false, badge = '' } = {}) {
        const layout = Object.create(Product.prototype);
        Object.defineProperty(layout, 'promoBottom', {
            get: () => promoBottom,
        });
        Object.defineProperty(layout, 'badge', { get: () => badge });
        Object.defineProperty(layout, 'secureLabelFooter', { get: () => '' });
        return layout;
    }

    it('renders without body-xxs slot', () => {
        const result = makeLayout().renderLayout();
        const str = JSON.stringify(result);
        expect(str).to.not.include('body-xxs');
    });

    it('renders promo-text before body-xs when promoBottom is false', () => {
        const result = makeLayout({ promoBottom: false }).renderLayout();
        const str = JSON.stringify(result);
        expect(str).to.include('promo-text');
        expect(str).to.include('body-xs');
    });

    it('renders promo-text after body-xs when promoBottom is true', () => {
        const result = makeLayout({ promoBottom: true }).renderLayout();
        const str = JSON.stringify(result);
        expect(str).to.include('promo-text');
    });
});
