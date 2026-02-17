// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import { mockLana } from './mocks/lana.js';
import { mockFetch } from './mocks/fetch.js';

import { appendMiloStyles, delay } from './utils.js';
import { mockIms } from './mocks/ims.js';
import { withWcs } from './mocks/wcs.js';

const skipTests = sessionStorage.getItem('skipTests');

runTests(async () => {
    mockIms();
    mockLana();
    await mockFetch(withWcs);
    await import('../src/mas.js');

    if (skipTests !== null) {
        appendMiloStyles();
        return;
    }
    describe('merch-card web component', () => {
        it('should exist in the HTML document', async () => {
            expect(document.querySelector('merch-card')).to.exist;
        });
        it('should exist special offers card in HTML document', async () => {
            expect(
                document.querySelector('merch-card[variant="special-offers"]'),
            ).to.exist;
        });
        it('should display a merch-badge', async () => {
            expect(
                document
                    .querySelector('merch-card[variant="special-offers"]')
                    .shadowRoot.querySelector('.special-offers-badge'),
            ).to.exist;
        });
        it('should render slot-based merch-badge for yellow variant', async () => {
            const card = document.querySelector('#yellow-badge');
            expect(card).to.exist;
            expect(card.getAttribute('border-color')).to.equal(
                'spectrum-yellow-300-special-offers',
            );
            const badge = card.querySelector('merch-badge[slot="badge"]');
            expect(badge).to.exist;
            expect(badge.getAttribute('background-color')).to.equal(
                'spectrum-yellow-300-special-offers',
            );
        });
        it('should render slot-based merch-badge for green variant', async () => {
            const card = document.querySelector('#green-badge');
            expect(card).to.exist;
            expect(card.getAttribute('border-color')).to.equal(
                'spectrum-green-900-special-offers',
            );
            const badge = card.querySelector('merch-badge[slot="badge"]');
            expect(badge).to.exist;
        });
        it('should render slot-based merch-badge for gray variant', async () => {
            const card = document.querySelector('#gray-badge');
            expect(card).to.exist;
            expect(card.getAttribute('border-color')).to.equal(
                'spectrum-gray-300-special-offers',
            );
            const badge = card.querySelector('merch-badge[slot="badge"]');
            expect(badge).to.exist;
        });
    });

    it('should return title for special offer card', async () => {
        const title = document.querySelector(
            'merch-card[variant="special-offers"]',
        ).title;
        expect(title).to.equal('INDIVIDUALS');
    });
});
