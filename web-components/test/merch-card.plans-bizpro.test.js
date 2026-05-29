import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';

let BizProPlans;

before(async () => {
    // merch-card's connectedCallback needs a commerce service in the DOM,
    // mirroring the setup in hydrate.test.js.
    if (!document.querySelector('mas-commerce-service')) {
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    }
    await customElements.whenDefined('merch-card');
    ({ BizProPlans } = await import('../src/variants/plans-bizpro.js'));
});

async function renderCard(innerHTML) {
    const card = document.createElement('merch-card');
    card.setAttribute('variant', 'plans-bizpro');
    card.innerHTML = innerHTML;
    document.body.appendChild(card);
    await card.updateComplete;
    return card;
}

describe('plans-bizpro add-on slot', () => {
    let card;
    afterEach(() => card?.remove());

    it('detects an add-on at slot="addon" and projects it', async () => {
        card = await renderCard(
            '<merch-addon slot="addon"><p>Add AI</p></merch-addon>',
        );
        expect(card.variantLayout.hasAddOn).to.be.true;
        expect(card.shadowRoot.querySelector('slot[name="addon"]')).to.exist;
        expect(card.shadowRoot.querySelector('slot[name="add-on"]')).to.not
            .exist;
    });
});

describe('BizProPlans.adjustAddon', () => {
    function makeLayout(cardOverrides = {}) {
        const layout = Object.create(BizProPlans.prototype);
        layout.card = {
            updateComplete: Promise.resolve(),
            querySelector: () => null,
            addon: null,
            ...cardOverrides,
        };
        return layout;
    }

    it('does nothing when there is no add-on', async () => {
        const layout = makeLayout({ addon: null });
        await layout.adjustAddon(); // must not throw
    });

    it('sets custom-checkbox and planType from the settled main price', async () => {
        const addon = { setAttribute: sinon.spy() };
        const price = {
            onceSettled: () => Promise.resolve(),
            value: [{ planType: 'PUF' }],
        };
        const layout = makeLayout({
            addon,
            querySelector: (sel) =>
                sel.includes('heading-m') ? price : null,
        });
        await layout.adjustAddon();
        expect(addon.setAttribute.calledWith('custom-checkbox', '')).to.be.true;
        expect(addon.planType).to.equal('PUF');
    });

    it('sets custom-checkbox but skips planType when no price', async () => {
        const addon = { setAttribute: sinon.spy() };
        const layout = makeLayout({ addon, querySelector: () => null });
        await layout.adjustAddon();
        expect(addon.setAttribute.calledWith('custom-checkbox', '')).to.be.true;
        expect(addon.planType).to.be.undefined;
    });
});

describe('plans-bizpro add-on theming', () => {
    let card;
    afterEach(() => card?.remove());

    it('renders the bordered add-on wrapper around the slotted merch-addon', async () => {
        card = await renderCard(
            '<merch-addon slot="addon"><p>Add AI</p></merch-addon>',
        );
        const wrapper = card.shadowRoot.querySelector('.add-on');
        expect(wrapper).to.exist;
        // #8d88f2 === rgb(141, 136, 242)
        expect(getComputedStyle(wrapper).borderTopColor).to.equal(
            'rgb(141, 136, 242)',
        );
    });
});
