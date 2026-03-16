// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import { mockLana } from './mocks/lana.js';
import { mockFetch } from './mocks/fetch.js';

import { delay } from './utils.js';

import { mockIms } from './mocks/ims.js';
import { withWcs } from './mocks/wcs.js';

runTests(async () => {
    mockIms();
    mockLana();
    await mockFetch(withWcs);
    await import('../src/mas.js');

    describe('merch-card web component with mini-compare variant', () => {
        it('mini-compare-chart should have same body slot heights', async () => {
            const miniCompareCharts = document.querySelectorAll(
                'merch-card[variant="mini-compare-chart"]',
            );
            await Promise.all(
                Array.from(miniCompareCharts).map((card) => card.checkReady()),
            );
            await delay();
            // Trigger syncHeights explicitly — rAF callbacks may not fire in headless
            miniCompareCharts.forEach((card) =>
                card.variantLayout?.syncHeights?.(),
            );
            await delay();
            const [card1Slots, card2Slots, card3Slots] = [
                ...miniCompareCharts,
            ].map((miniCompareChart) => {
                const heights = [
                    'slot[name="heading-m"]',
                    'slot[name="subtitle"]',
                    'slot[name="body-m"]',
                    'slot[name="heading-m-price"]',
                    'slot[name="body-xxs"]',
                    'slot[name="price-commitment"]',
                    'slot[name="offers"]',
                    'slot[name="promo-text"]',
                    'slot[name="callout-content"]',
                    'slot[name="quantity-select"]',
                    'footer',
                ]
                    .map((selector) => {
                        const el =
                            miniCompareChart.shadowRoot.querySelector(selector);
                        if (!el) return 0;
                        return parseInt(window.getComputedStyle(el).height, 10);
                    })
                    .join(',');
                return heights;
            });
            expect(card1Slots).to.not.contain('auto');
            expect(card1Slots).to.equal(card2Slots);
            expect(card2Slots).to.equal(card3Slots);
        });

        it('mini-compare-chart should have same height footer rows', async () => {
            const miniCompareCharts = document.querySelectorAll(
                'merch-card[variant="mini-compare-chart"]',
            );
            await Promise.all(
                [...miniCompareCharts].map((card) => card.updateComplete),
            );
            const [card1Rows, card2Rows, card3Rows] = [
                ...miniCompareCharts,
            ].map((miniCompareChart) => {
                const heights = new Array(5)
                    .fill()
                    .map(
                        (_, i) =>
                            parseInt(
                                window.getComputedStyle(
                                    miniCompareChart.querySelector(
                                        `merch-whats-included [slot="content"] merch-mnemonic-list:nth-child(${i + 1})`,
                                    ),
                                ),
                                10,
                            ).height,
                    )
                    .join(',');
                return heights;
            });
            expect(card1Rows).to.not.contain('NaN');
            expect(card1Rows).to.equal(card2Rows);
            expect(card2Rows).to.equal(card3Rows);
        });

        it('mini-compare-chart should remove empty rows', async () => {
            const miniCompareChart = document.querySelector(
                'merch-card[variant="mini-compare-chart"]',
            );
            // Add a whats-included with an empty description row to trigger actual removal
            const whatsIncluded = document.createElement(
                'merch-whats-included',
            );
            const contentSlot = document.createElement('div');
            contentSlot.setAttribute('slot', 'content');
            const emptyRow = document.createElement('merch-mnemonic-list');
            const emptyDesc = document.createElement('div');
            emptyDesc.setAttribute('slot', 'description');
            emptyDesc.textContent = '';
            emptyRow.appendChild(emptyDesc);
            contentSlot.appendChild(emptyRow);
            whatsIncluded.appendChild(contentSlot);
            miniCompareChart.appendChild(whatsIncluded);

            const rowsBefore = miniCompareChart.querySelectorAll(
                'merch-whats-included merch-mnemonic-list',
            ).length;
            miniCompareChart?.variantLayout?.removeEmptyRows();
            const rowsAfter = miniCompareChart.querySelectorAll(
                'merch-whats-included merch-mnemonic-list',
            ).length;
            expect(rowsAfter).to.equal(rowsBefore - 1);

            whatsIncluded.remove();
        });

        it('mini-compare-chart should return correct row min-height property name', async () => {
            const card = document.querySelector(
                'merch-card[variant="mini-compare-chart"]',
            );
            await card.checkReady();
            const variantLayout = card.variantLayout;

            expect(variantLayout.getRowMinHeightPropertyName(1)).to.equal(
                '--consonant-merch-card-footer-row-1-min-height',
            );
            expect(variantLayout.getRowMinHeightPropertyName(5)).to.equal(
                '--consonant-merch-card-footer-row-5-min-height',
            );
        });

        it('mini-compare-chart should return CSS string from getGlobalCSS', async () => {
            const card = document.querySelector(
                'merch-card[variant="mini-compare-chart"]',
            );
            await card.checkReady();
            expect(card.variantLayout.getGlobalCSS()).to.be.a('string');
        });

        it('mini-compare-chart should update price quantity on selector change', async () => {
            const card = document.querySelector(
                'merch-card[variant="mini-compare-chart"]',
            );
            await card.checkReady();
            await delay();

            const variantLayout = card.variantLayout;
            const mainPrice = variantLayout.mainPrice;

            expect(variantLayout.updatePriceQuantity).to.be.a('function');

            if (mainPrice) {
                card.dispatchEvent(
                    new CustomEvent('merch-quantity-selector:change', {
                        detail: { option: '5' },
                        bubbles: true,
                    }),
                );
                await delay(50);
                expect(mainPrice.dataset.quantity).to.equal('5');
            }

            // updatePriceQuantity with no detail should not throw
            variantLayout.updatePriceQuantity({ detail: null });
            variantLayout.updatePriceQuantity({});
        });

        it('mini-compare-chart should clean up on disconnect', async () => {
            const card = document.querySelector(
                'merch-card[variant="mini-compare-chart"]',
            );
            await card.checkReady();
            const variantLayout = card.variantLayout;

            variantLayout.disconnectedCallbackHook();
            expect(variantLayout.visibilityObserver).to.not.be.null;

            // Re-connect
            variantLayout.connectedCallbackHook();
        });

        it('mini-compare-chart headingMPriceSlot getter returns element or undefined', async () => {
            const card = document.querySelector(
                'merch-card[variant="mini-compare-chart"]',
            );
            await card.checkReady();
            const variantLayout = card.variantLayout;

            // headingMPriceSlot is the assigned element of the heading-m-price slot
            const slot = variantLayout.headingMPriceSlot;
            // It may be undefined if nothing is assigned; just verify it doesn't throw
            expect(slot === undefined || slot instanceof Element).to.be.true;
        });

        it('mini-compare-chart should auto-pad rows to match max across siblings', async () => {
            const cards = document.querySelectorAll(
                '#uneven-rows merch-card[variant="mini-compare-chart"]',
            );
            await Promise.all([...cards].map((card) => card.checkReady()));
            await delay();

            const rowCounts = [...cards].map(
                (card) =>
                    card.querySelectorAll(
                        'merch-whats-included [slot="content"] merch-mnemonic-list',
                    ).length,
            );
            const maxRows = Math.max(...rowCounts);
            rowCounts.forEach((count) => expect(count).to.equal(maxRows));

            // Card A had 2 rows, should have placeholders
            const cardA = cards[0];
            const placeholders = cardA.querySelectorAll(
                'merch-mnemonic-list[data-placeholder]',
            );
            expect(placeholders.length).to.equal(3);
        });

        it('mini-compare-chart should configure price display options', async () => {
            const card = document.querySelector(
                'merch-card[variant="mini-compare-chart"]',
            );
            await card.checkReady();
            const variantLayout = card.variantLayout;

            // Test legal template branch
            const legalElement = { dataset: { template: 'legal' } };
            const legalOptions = {};
            variantLayout.priceOptionsProvider(legalElement, legalOptions);
            expect(legalOptions.displayPlanType).to.be.a('boolean');

            // Test strikethrough template branch
            const strikethroughElement = {
                dataset: { template: 'strikethrough' },
            };
            const strikethroughOptions = {};
            variantLayout.priceOptionsProvider(
                strikethroughElement,
                strikethroughOptions,
            );
            expect(strikethroughOptions.displayPerUnit).to.equal(false);

            // Test price template branch
            const priceElement = { dataset: { template: 'price' } };
            const priceOptions = {};
            variantLayout.priceOptionsProvider(priceElement, priceOptions);
            expect(priceOptions.displayPerUnit).to.equal(false);
        });
    });
});
