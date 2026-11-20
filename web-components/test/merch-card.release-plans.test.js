import { expect } from '@esm-bundle/chai';
import '../src/mas.js';
import { hydrate } from '../src/hydrate.js';
import { mockFetch } from './mocks/fetch.js';
import { withWcs } from './mocks/wcs.js';

await mockFetch(withWcs);
document.head.appendChild(document.createElement('mas-commerce-service'));

const abmLabel = 'Annual, billed monthly';
const osi = 'abm-mult';

const releaseFragment = (variant) => ({
    id: `release-${variant}`,
    fields: {
        variant,
        cardTitle: 'Photoshop',
        prices: `<span is="inline-price" data-template="price" data-wcs-osi="${osi}" data-display-per-unit="false" data-display-recurrence="true" data-display-tax="false"></span>`,
        ctas: `<a is="checkout-link" data-wcs-osi="${osi}" class="con-button primary">Select</a>`,
        tags: ['mas:plan_type/abm'],
    },
    settings: { displayPlanType: true, secureLabel: 'Secure transaction' },
    priceLiterals: {
        planTypeLabel: `{planType, select, ABM {${abmLabel}} other {}}`,
    },
});

const renderRelease = async (variant) => {
    const card = document.createElement('merch-card');
    document.body.appendChild(card);
    await customElements.whenDefined('merch-card');
    await hydrate(releaseFragment(variant), card);
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

    it('renders the ABM plan type label on a Plans card', async () => {
        const card = await renderRelease('plans');
        expect(card.querySelector('.price-plan-type')?.textContent).to.equal(
            abmLabel,
        );
    });

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
