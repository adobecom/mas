import { expect } from '@esm-bundle/chai';
import '../src/mas.js';
import { hydrate } from '../src/hydrate.js';
import { COMPARE_CHART_COLUMN_AEM_FRAGMENT_MAPPING } from '../src/variants/compare-chart-column.js';
import { MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING } from '../src/variants/mini-compare-chart.js';

const mockMerchCard = () => {
    const merchCard = document.createElement('div');
    merchCard.spectrum = 'css';
    merchCard.loading = 'lazy';
    merchCard.attachShadow({ mode: 'open' });
    document.body.appendChild(merchCard);
    return merchCard;
};

describe('COMPARE_CHART_COLUMN_AEM_FRAGMENT_MAPPING callout entry', () => {
    it('matches the shape of the reference callout entry (mini-compare-chart)', () => {
        expect(COMPARE_CHART_COLUMN_AEM_FRAGMENT_MAPPING.callout).to.deep.equal(
            MINI_COMPARE_CHART_AEM_FRAGMENT_MAPPING.callout,
        );
    });
});

describe('compare-chart-column hydrate callout slot', () => {
    let merchCard;

    beforeEach(() => {
        merchCard = mockMerchCard();
        merchCard.variantLayout = {
            aemFragmentMapping: COMPARE_CHART_COLUMN_AEM_FRAGMENT_MAPPING,
        };
    });

    afterEach(() => {
        merchCard.remove();
    });

    it('produces a callout-content slot when the fragment supplies callout text', async () => {
        const fragment = {
            fields: {
                variant: 'compare-chart-column',
                cardTitle: 'Photoshop',
                callout: 'AI Assistant add-on available.',
            },
        };

        await hydrate(fragment, merchCard);

        const callout = merchCard.querySelector('[slot="callout-content"]');
        expect(callout).to.exist;
        expect(callout.textContent).to.equal('AI Assistant add-on available.');
    });

    it('produces no callout-content slot when the fragment has no callout value', async () => {
        const fragment = {
            fields: {
                variant: 'compare-chart-column',
                cardTitle: 'Photoshop',
            },
        };

        await hydrate(fragment, merchCard);

        expect(merchCard.querySelector('[slot="callout-content"]')).to.not
            .exist;
        expect(merchCard.querySelector('[slot="header"]')).to.exist;
    });
});
