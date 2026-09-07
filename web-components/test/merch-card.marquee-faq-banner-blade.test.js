import { expect } from '@esm-bundle/chai';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';

before(async () => {
    // merch-card's connectedCallback needs a commerce service in the DOM,
    // mirroring the setup in merch-card.pro.test.js.
    if (!document.querySelector('mas-commerce-service')) {
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    }
    await customElements.whenDefined('merch-card');
});

async function renderCard(variant, innerHTML, attrs = {}) {
    const card = document.createElement('merch-card');
    card.setAttribute('variant', variant);
    for (const [name, value] of Object.entries(attrs)) {
        card.setAttribute(name, value);
    }
    card.innerHTML = innerHTML;
    document.body.appendChild(card);
    await card.updateComplete;
    // firstUpdated swaps in a fresh variantLayout after the first render;
    // re-render so the shadow DOM reflects it (real cards re-render on
    // hydration anyway).
    card.requestUpdate();
    await card.updateComplete;
    return card;
}

function headlessRow(card, slotName) {
    return [...card.shadowRoot.querySelectorAll('.headless-row')].find((row) =>
        row.querySelector(`slot[name="${slotName}"]`),
    );
}

describe('marquee variant', () => {
    let card;
    afterEach(() => card?.remove());

    it('renders a labeled row with a slot for each mapped field', async () => {
        card = await renderCard('marquee', '<h3 slot="heading-xs">Title</h3>');
        const rows = {
            'heading-xs': 'Title',
            'body-xs': 'Product description',
            'short-description': 'Short Description',
            prices: 'Product price',
            footer: 'CTAs',
        };
        for (const [slot, label] of Object.entries(rows)) {
            const row = headlessRow(card, slot);
            expect(row, `row for slot ${slot}`).to.exist;
            expect(row.querySelector('.headless-label').textContent).to.equal(
                label,
            );
        }
    });

    it('omits the secure label row when secure-label is not set', async () => {
        card = await renderCard('marquee', '<h3 slot="heading-xs">Title</h3>');
        const labels = [
            ...card.shadowRoot.querySelectorAll('.headless-label'),
        ].map((el) => el.textContent);
        expect(labels).to.not.include('Secure label');
    });

    it('renders the secure label row when secure-label is set', async () => {
        card = await renderCard('marquee', '<h3 slot="heading-xs">Title</h3>', {
            'secure-label': 'Secure transaction',
        });
        const rows = [...card.shadowRoot.querySelectorAll('.headless-row')];
        const secureRow = rows.find(
            (row) =>
                row.querySelector('.headless-label')?.textContent ===
                'Secure label',
        );
        expect(secureRow).to.exist;
        expect(secureRow.textContent).to.contain('Secure transaction');
    });
});

describe('faq variant', () => {
    let card;
    afterEach(() => card?.remove());

    it('renders a labeled row with a slot for each mapped field', async () => {
        card = await renderCard('faq', '<div slot="body-xs">Answer 1</div>');
        const rows = {
            prices: 'Product price',
            'body-xs': 'FAQ answer 1',
            'short-description': 'FAQ answer 2',
            'callout-content': 'FAQ answer 3',
        };
        for (const [slot, label] of Object.entries(rows)) {
            const row = headlessRow(card, slot);
            expect(row, `row for slot ${slot}`).to.exist;
            expect(row.querySelector('.headless-label').textContent).to.equal(
                label,
            );
        }
    });
});

describe('banner-blade variant', () => {
    let card;
    afterEach(() => card?.remove());

    it('renders a labeled row with a slot for each mapped field', async () => {
        card = await renderCard(
            'banner-blade',
            '<div slot="body-xs">Description</div>',
        );
        const rows = {
            'body-xs': 'Description',
            footer: 'CTAs',
        };
        for (const [slot, label] of Object.entries(rows)) {
            const row = headlessRow(card, slot);
            expect(row, `row for slot ${slot}`).to.exist;
            expect(row.querySelector('.headless-label').textContent).to.equal(
                label,
            );
        }
    });
});
