import { expect } from '@esm-bundle/chai';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';

before(async () => {
    // merch-card's connectedCallback needs a commerce service in the DOM,
    // mirroring the setup in hydrate.test.js.
    if (!document.querySelector('mas-commerce-service')) {
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    }
    await customElements.whenDefined('merch-card');
});

async function renderCard(innerHTML) {
    const card = document.createElement('merch-card');
    card.setAttribute('variant', 'pro');
    card.innerHTML = innerHTML;
    document.body.appendChild(card);
    await card.updateComplete;
    // firstUpdated swaps in a fresh variantLayout after the first render;
    // re-render so the shadow DOM event listeners bind to card.variantLayout
    // (real cards re-render on hydration anyway).
    card.requestUpdate();
    await card.updateComplete;
    return card;
}

// MWPW-205322: the edu (student/teacher) card's promotional line must not be
// exposed to assistive tech as a heading, and "What's included?" must be the
// H4 that actually precedes the feature list.
describe('pro edu whats-included heading hierarchy', () => {
    let card;
    afterEach(() => card?.remove());

    it('keeps the card title an H3, demotes the promo line and promotes the section label to H4', async () => {
        card = await renderCard(
            '<h3 slot="heading-xs">Creative Cloud Pro</h3><div slot="whats-included"><p class="whats-included-label">Students and teachers save 7% for the first year</p><div class="section"><h4>Photoshop</h4><ul><li>Edit and enhance photos</li></ul></div></div>',
        );
        card.setAttribute('size', 'edu');
        card.placeholders = { whatsIncludedLabel: "What's included?" };
        card.requestUpdate();
        await card.updateComplete;

        const cardTitle = card.querySelector('[slot="heading-xs"]');
        expect(cardTitle.tagName).to.equal('H3');
        expect(cardTitle.textContent.trim()).to.equal('Creative Cloud Pro');

        const promo = card.querySelector('.whats-included-title');
        expect(promo.tagName).to.equal('P');
        expect(promo.textContent.trim()).to.equal(
            'Students and teachers save 7% for the first year',
        );

        const whatsIncludedHeading = card.querySelector(
            '.whats-included-label',
        );
        expect(whatsIncludedHeading.tagName).to.equal('H4');
        expect(whatsIncludedHeading.textContent.trim()).to.equal(
            "What's included?",
        );

        const headings = [...card.querySelectorAll('h1, h2, h3, h4, h5, h6')];
        const promoIsHeading = headings.some((heading) =>
            heading.textContent.includes('Students and teachers save 7%'),
        );
        expect(promoIsHeading).to.be.false;
        expect(headings).to.include(whatsIncludedHeading);
    });
});
