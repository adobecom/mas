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

    describe('merch-card web component with mini-compare-chart-mweb variant', () => {
        it('should render layout and sync body slot heights across sibling cards', async () => {
            const container = document.querySelector(
                'main > .three-merch-cards.mini-compare-chart-mweb',
            );
            const cards = container.querySelectorAll(
                'merch-card[variant="mini-compare-chart-mweb"]',
            );
            expect(cards.length).to.equal(3);
            await Promise.all(
                Array.from(cards).map((card) => card.checkReady()),
            );
            await delay(200);

            // Verify renderLayout produced expected shadow DOM structure
            const card1 = cards[0];
            expect(card1.shadowRoot.querySelector('slot[name="heading-xs"]')).to
                .exist;
            expect(card1.shadowRoot.querySelector('slot[name="subtitle"]')).to
                .exist;
            expect(
                card1.shadowRoot.querySelector('slot[name="heading-m-price"]'),
            ).to.exist;
            expect(card1.shadowRoot.querySelector('slot[name="promo-text"]')).to
                .exist;
            expect(card1.shadowRoot.querySelector('slot[name="body-m"]')).to
                .exist;
            expect(card1.shadowRoot.querySelector('footer')).to.exist;
            expect(card1.shadowRoot.querySelector('.footer-rows-container')).to
                .exist;
            expect(card1.shadowRoot.querySelector('slot[name="footer-rows"]'))
                .to.exist;

            // Verify getMiniCompareFooter rendered secure label
            const secureLabelEl = card1.shadowRoot.querySelector(
                'slot[name="secure-transaction-label"]',
            );
            expect(secureLabelEl).to.exist;

            // Verify getGlobalCSS was called (constructor inserts variant style)
            const variantLayout = card1.variantLayout;
            expect(variantLayout).to.exist;
            expect(variantLayout.getGlobalCSS()).to.be.a('string');

            // adjustMiniCompareBodySlots: slot heights should be synced
            const slotNames = [
                'heading-xs',
                'subtitle',
                'heading-m-price',
                'promo-text',
                'body-m',
            ];
            const heightSets = [...cards].map((card) =>
                slotNames
                    .map((name) => {
                        const el = card.querySelector(`[slot="${name}"]`);
                        if (!el) return 0;
                        return (
                            parseInt(window.getComputedStyle(el).minHeight) || 0
                        );
                    })
                    .join(','),
            );
            // All cards should share the same min-height CSS vars
            expect(heightSets[0]).to.equal(heightSets[1]);
        });

        it('should sync footer row heights across cards', async () => {
            const wrapper = document.querySelector(
                'main > .three-merch-cards.mini-compare-chart-mweb',
            );
            const cards = wrapper.querySelectorAll(
                'merch-card[variant="mini-compare-chart-mweb"]',
            );
            await Promise.all([...cards].map((card) => card.checkReady()));
            await delay(200);

            const card1 = cards[0];
            const variantLayout = card1.variantLayout;

            // getRowMinHeightPropertyName should return the expected CSS var name
            expect(variantLayout.getRowMinHeightPropertyName(1)).to.equal(
                '--consonant-merch-card-footer-row-1-min-height',
            );
            expect(variantLayout.getRowMinHeightPropertyName(2)).to.equal(
                '--consonant-merch-card-footer-row-2-min-height',
            );

            // adjustMiniCompareFooterRows should have set CSS vars on the container
            const layoutContainer = variantLayout.getContainer();
            const row1MinHeight = layoutContainer.style.getPropertyValue(
                '--consonant-merch-card-footer-row-1-min-height',
            );
            // Row min-height should be set (at least 32px per FOOTER_ROW_MIN_HEIGHT)
            expect(parseInt(row1MinHeight) || 0).to.be.at.least(32);
        });

        it('should remove footer rows with empty descriptions', async () => {
            const card = document.querySelector(
                '#uneven-rows merch-card#card-mweb-uneven-1',
            );
            await card.checkReady();
            await delay(100);

            // Card has 3 footer-row-cell items, one with empty description
            const rowsBefore = card.querySelectorAll('.footer-row-cell');
            const emptyRowsBefore = [...rowsBefore].filter((row) => {
                const desc = row.querySelector('.footer-row-cell-description');
                return desc && !desc.textContent.trim();
            });
            expect(emptyRowsBefore.length).to.equal(1);

            card.variantLayout.removeEmptyRows();

            const rowsAfter = card.querySelectorAll('.footer-row-cell');
            const emptyRowsAfter = [...rowsAfter].filter((row) => {
                const desc = row.querySelector('.footer-row-cell-description');
                return desc && !desc.textContent.trim();
            });
            expect(emptyRowsAfter.length).to.equal(0);
            // One row was removed
            expect(rowsAfter.length).to.equal(rowsBefore.length - 1);
        });

        it('should update price quantity on selector change', async () => {
            const card = document.querySelector('#card-mweb-1');
            await card.checkReady();
            await delay(100);

            const variantLayout = card.variantLayout;
            const mainPrice = variantLayout.mainPrice;

            // updatePriceQuantity should be a function
            expect(variantLayout.updatePriceQuantity).to.be.a('function');

            if (mainPrice) {
                // Simulate quantity selector change
                card.dispatchEvent(
                    new CustomEvent('merch-quantity-selector:change', {
                        detail: { option: '3' },
                        bubbles: true,
                    }),
                );
                await delay(50);
                expect(mainPrice.dataset.quantity).to.equal('3');
            }

            // updatePriceQuantity with no mainPrice or no detail should not throw
            variantLayout.updatePriceQuantity({ detail: null });
            variantLayout.updatePriceQuantity({});
        });

        it('should configure price display options via priceOptionsProvider', async () => {
            const card = document.querySelector('#card-mweb-1');
            await card.checkReady();
            await delay(100);

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

        it('should return correct mainPrice and icons', async () => {
            const card1 = document.querySelector('#card-mweb-1');
            await card1.checkReady();
            await delay(100);

            const variantLayout1 = card1.variantLayout;

            // mainPrice should return the inline-price element with data-template="price"
            const mainPrice = variantLayout1.mainPrice;
            expect(mainPrice).to.exist;
            expect(mainPrice.dataset.template).to.equal('price');

            // icons: card1 has icons slot and an id, should return html template
            const icons1 = variantLayout1.icons;
            expect(icons1).to.not.be.undefined;

            // Card without icons slot and without id should return nothing
            const card2 = document.querySelector('#card-mweb-2');
            await card2.checkReady();
            const variantLayout2 = card2.variantLayout;
            // card2 has id so icons should still render
            expect(variantLayout2.icons).to.not.be.undefined;
        });

        it('[desktop] should setup toggle with list always open', async () => {
            const card = document.querySelector('#card-mweb-1');
            await card.checkReady();
            await delay(200);

            const bodyXs = card.querySelector('[slot="body-xs"]');
            const titleDiv = bodyXs.querySelector('.footer-rows-title');
            expect(titleDiv, 'footer-rows-title created').to.exist;
            expect(titleDiv.textContent).to.include("See what's included:");

            // Desktop: no toggle button, list always open
            const toggleBtn = titleDiv.querySelector('.toggle-icon');
            expect(toggleBtn, 'no toggle button on desktop').to.be.null;

            const list = bodyXs.querySelector('ul.checkmark-copy-container');
            expect(list, 'list has checkmark-copy-container class').to.exist;
            expect(list.classList.contains('open')).to.be.true;
        });

        it('should clean up on disconnect', async () => {
            const card = document.querySelector('#card-mweb-1');
            await card.checkReady();
            await delay(100);

            const variantLayout = card.variantLayout;

            // disconnectedCallbackHook should remove event listener and observer
            variantLayout.disconnectedCallbackHook();
            expect(variantLayout._syncObserver).to.be.null;

            // Re-connect
            variantLayout.connectedCallbackHook();
        });
    });
});
