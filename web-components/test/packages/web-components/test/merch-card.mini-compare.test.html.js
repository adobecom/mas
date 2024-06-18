// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import { mockLana } from '/test/mocks/lana.js';
import { mockFetch } from '/test/mocks/fetch.js';
import { mockConfig } from '/test/mocks/config.js';

import { init } from '@wcms/commerce';

import '../src/merch-card.js';
import '../src/merch-offer.js';
import '../src/merch-offer-select.js';
import '../src/merch-quantity-select.js';

import { appendMiloStyles } from './utils.js';
import { mockIms } from './mocks/ims.js';

const skipTests = sessionStorage.getItem('skipTests');

runTests(async () => {
    mockIms();
    mockLana();
    await mockFetch();
    await init(mockConfig());
    if (skipTests !== null) {
        appendMiloStyles();
        return;
    }
    describe('merch-card web component with mini-compare variant', () => {
        it('mini-compare-chart should have same body slot heights', async () => {
            const miniCompareCharts = document.querySelectorAll(
                'merch-card[variant="mini-compare-chart"]'
            );
            await Promise.all(
                [...miniCompareCharts].flatMap((card) => {
                    return [
                        card.updateComplete,
                        ...[...card.querySelectorAll('[data-wcs-osi]')].map(
                            (osi) => osi.onceSettled()
                        ),
                    ];
                })
            );
            const [card1Slots, card2Slots, card3Slots] = [
                ...miniCompareCharts,
            ].map((miniCompareChart) => {
                const heights = [
                    'heading-m',
                    'body-m',
                    'heading-m-price',
                    'price-commitment',
                    'offers',
                    'promo-text',
                    'footer',
                ]
                    .map(
                        (slot) =>
                            window.getComputedStyle(
                                miniCompareChart.shadowRoot.querySelector(
                                    `slot[name="${slot}"]`
                                )
                            ).height
                    )
                    .join(',');
                return heights;
            });
            expect(card1Slots).to.equal(card2Slots);
            expect(card2Slots).to.equal(card3Slots);
        });

        it('mini-compare-chart should have same height footer rows', async () => {
            const miniCompareCharts = document.querySelectorAll(
                'merch-card[variant="mini-compare-chart"]'
            );
            await Promise.all(
                [...miniCompareCharts].map((card) => card.updateComplete)
            );
            const [card1Rows, card2Rows, card3Rows] = [
                ...miniCompareCharts,
            ].map((miniCompareChart) => {
                const heights = new Array(5)
                    .fill()
                    .map(
                        (_, i) =>
                            window.getComputedStyle(
                                miniCompareChart.querySelector(
                                    `.footer-row-cell:nth-child(${i + 1})`
                                )
                            ).height
                    )
                    .join(',');
                return heights;
            });
            expect(card1Rows).to.equal(card2Rows);
            expect(card2Rows).to.equal(card3Rows);
        });
    });
});
