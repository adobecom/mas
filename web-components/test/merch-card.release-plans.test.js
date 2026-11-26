import { expect } from '@esm-bundle/chai';
import '../src/mas.js';
import { hydrate } from '../src/hydrate.js';
import { mockFetch } from './mocks/fetch.js';
import { withWcs } from './mocks/wcs.js';

await mockFetch(withWcs);
document.head.appendChild(document.createElement('mas-commerce-service'));

const abmLabel = 'Annual, billed monthly';
const osi = 'abm-mult';

// The price markup each release-card generator emits: io/operations create-release-cards
// and Studio's buildReleasePrice (MASA chat and the Offers pages).
const generatedPrices = {
    io: `<span is="inline-price" data-template="price" data-wcs-osi="${osi}" data-display-per-unit="false" data-display-recurrence="true" data-display-tax="false"></span>`,
    studio: `<span is="inline-price" data-template="price" data-wcs-osi="${osi}"></span>`,
};

const releaseFragment = (variant, prices = generatedPrices.io) => ({
    id: `release-${variant}`,
    fields: {
        variant,
        cardTitle: 'Photoshop',
        prices,
        ctas: `<a is="checkout-link" data-wcs-osi="${osi}" class="con-button primary">Select</a>`,
        tags: ['mas:plan_type/abm'],
    },
    settings: { displayPlanType: true, secureLabel: 'Secure transaction' },
    priceLiterals: {
        planTypeLabel: `{planType, select, ABM {${abmLabel}} other {}}`,
    },
});

const renderRelease = async (variant, prices) => {
    const card = document.createElement('merch-card');
    document.body.appendChild(card);
    await customElements.whenDefined('merch-card');
    await hydrate(releaseFragment(variant, prices), card);
    await card.updateComplete;
    await card.checkReady();
    return card;
};

describe('generated ABM release card rendering', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('merch-card')
            .forEach((el) => el.remove());
    });

    for (const [generator, prices] of Object.entries(generatedPrices)) {
        it(`renders the ABM plan type label on a Plans card (${generator} price)`, async () => {
            const card = await renderRelease('plans', prices);
            expect(
                card.querySelector('.price-plan-type')?.textContent,
            ).to.equal(abmLabel);
        });
    }

    it('renders the secure-transaction logo on a Plans card', async () => {
        const card = await renderRelease('plans');
        const label = card.shadowRoot.querySelector(
            '.secure-transaction-label',
        );
        expect(label?.textContent).to.equal('Secure transaction');
    });

    it('does not render the secure-transaction logo on a Catalog card', async () => {
        const card = await renderRelease('catalog');
        expect(
            card.shadowRoot.querySelector('.secure-transaction-label'),
        ).to.equal(null);
    });
});
