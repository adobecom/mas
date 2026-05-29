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
