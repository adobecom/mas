// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

import { mockLana } from './mocks/lana.js';
import { mockFetch } from './mocks/fetch.js';

import { delay } from './utils.js';

import { mockIms } from './mocks/ims.js';
import { withWcs } from './mocks/wcs.js';
import Media from '../src/media.js';
import { hydrate } from '../src/hydrate.js';

// Deterministically control Media.isMobile without real viewport changes —
// setViewport round-trips are slow/flaky under the full suite and can stall the
// file. The toggle/height logic keys off Media.isMobile and a JS `.open` class,
// not live media queries, so a stubbed getter exercises the same code paths.
const setIsMobile = (value) => {
    Object.defineProperty(Media.matchMobile, 'matches', {
        configurable: true,
        get: () => value,
    });
};
const resetIsMobile = () => {
    delete Media.matchMobile.matches;
};

runTests(async () => {
    mockIms();
    mockLana();
    await mockFetch(withWcs);
    await import('../src/mas.js');

    describe('merch-card web component with mini-compare-chart-mweb variant', () => {
        it('preserves plan-type defaults for missing and empty disclaimers', async () => {
            for (const id of ['card-mweb-1', 'card-mweb-3']) {
                const card = document.getElementById(id);
                await card.checkReady();
                expect(
                    card.shadowRoot.querySelector(
                        'slot[name="callout-content"]',
                    ).hidden,
                ).to.equal(true);
                const legal = card.querySelector('[data-template="legal"]');
                for (const displayPlanType of [true, false]) {
                    const originalSettings = card.settings;
                    try {
                        card.settings = {
                            ...originalSettings,
                            displayPlanType,
                        };
                        const options = {};
                        card.variantLayout.priceOptionsProvider(legal, options);
                        expect(options.displayPlanType).to.equal(
                            displayPlanType,
                        );
                    } finally {
                        card.settings = originalSettings;
                    }
                }
            }
        });

        it('keeps the legal override when the offer quantity changes', async () => {
            const card = document.querySelector('#card-mweb-2');
            await card.checkReady();
            const legal = card.querySelector('[data-template="legal"]');
            legal.dataset.quantity = '2';
            await legal.onceSettled();
            expect(legal.options.displayPlanType).to.equal(false);
            expect(
                card.shadowRoot
                    .querySelector('slot[name="callout-content"]')
                    .assignedElements()[0].textContent,
            ).to.include('Fee applies');
        });

        it('hydrates localized callout text and restores defaults when cleared', async () => {
            const card = document.createElement('merch-card');
            document.querySelector('main').append(card);
            try {
                for (const callout of [
                    '<p>No refund if you cancel after 14 days. Up to 10 licenses with free trial.</p>',
                    '',
                ]) {
                    await hydrate(
                        {
                            id: 'authored-disclaimer',
                            fields: {
                                variant: 'mini-compare-chart-mweb',
                                cardTitle: 'Annual prepaid',
                                prices: '<span is="inline-price" data-template="price" data-wcs-osi="abm"></span>',
                                callout,
                            },
                            settings: { displayPlanType: true },
                        },
                        card,
                    );
                    await card.checkReady();
                    await card.updateComplete;
                    const slot = card.shadowRoot.querySelector(
                        'slot[name="callout-content"]',
                    );
                    expect(slot.hidden).to.equal(!callout);
                    if (callout) {
                        expect(slot.assignedElements()[0].innerHTML).to.equal(
                            callout,
                        );
                    }
                    const legal = card.querySelector('[data-template="legal"]');
                    await legal.onceSettled();
                    expect(legal.options.displayPlanType).to.equal(!callout);
                }
            } finally {
                card.remove();
            }
        });

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
            variantLayout.syncHeights();

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

        it('should display the seat dropdown and carry the selected quantity to checkout', async () => {
            const card = document.querySelector('#card-mweb-1');
            await card.checkReady();
            const selector = card.querySelector('merch-quantity-select');
            await selector.updateComplete;

            const slot = card.shadowRoot.querySelector(
                'slot[name="quantity-select"]',
            );
            expect(slot.previousElementSibling.name).to.equal('body-m');
            expect(slot.assignedElements()).to.include(selector.parentElement);
            expect(selector.getBoundingClientRect().top).to.be.at.least(
                card.querySelector('[slot="body-m"]').getBoundingClientRect()
                    .bottom,
            );
            expect(selector.getBoundingClientRect().height).to.be.greaterThan(
                0,
            );
            expect(selector.selectedValue).to.equal(3);

            selector.button.click();
            await selector.updateComplete;
            selector.shadowRoot.querySelector('#qs-item-2').click();
            await selector.updateComplete;

            expect(selector.selectedValue).to.equal(5);
            expect(card.variantLayout.mainPrice.dataset.quantity).to.equal('5');
            expect(card.checkoutLinks).to.have.length(1);
            expect(card.checkoutLinks[0].dataset.quantity).to.equal('5');
        });

        it('should configure price display options via priceOptionsProvider', async () => {
            const card = document.querySelector('#card-mweb-1');
            await card.checkReady();
            await delay(100);

            const variantLayout = card.variantLayout;

            const parent = document.createElement('div');
            // Test legal template branch
            const legalElement = {
                dataset: { template: 'legal' },
                closest: () => parent,
            };
            const legalOptions = {};
            variantLayout.priceOptionsProvider(legalElement, legalOptions);
            expect(legalOptions.displayPlanType).to.be.a('boolean');

            // Test strikethrough template branch
            const strikethroughElement = {
                dataset: { template: 'strikethrough' },
                closest: () => parent,
            };
            const strikethroughOptions = {};
            variantLayout.priceOptionsProvider(
                strikethroughElement,
                strikethroughOptions,
            );
            expect(strikethroughOptions.displayPerUnit).to.equal(false);

            // Test price template branch
            const priceElement = {
                dataset: { template: 'price' },
                closest: () => parent,
            };
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

        it('[desktop] creates a hidden toggle button and shows the list via CSS', async () => {
            const card = document.querySelector('#card-mweb-1');
            await card.checkReady();
            await delay(200);

            const bodyXs = card.querySelector('[slot="body-xs"]');
            const titleDiv = bodyXs.querySelector('.footer-rows-title');
            expect(titleDiv, 'footer-rows-title created').to.exist;
            expect(titleDiv.textContent).to.include("See what's included:");

            // The button is always in the DOM so a later resize to mobile has a
            // collapse control; CSS (not JS) hides it and shows the list at
            // desktop widths.
            const toggleBtn = titleDiv.querySelector('.toggle-icon');
            expect(toggleBtn, 'toggle button created').to.exist;
            const list = bodyXs.querySelector('ul.checkmark-copy-container');
            expect(list, 'list has checkmark-copy-container class').to.exist;
            expect(
                getComputedStyle(toggleBtn).display,
                'button hidden',
            ).to.equal('none');
            expect(getComputedStyle(list).display, 'list shown').to.equal(
                'block',
            );
        });

        it('[desktop→mobile] clears grow-only synced heights so mobile restores natural height', async () => {
            const card = document.querySelector('#card-mweb-1');
            await card.checkReady();
            await delay(200);

            const layout = card.variantLayout;
            const container = layout.getContainer();

            try {
                // Desktop sync sets cross-card min-height vars on the container.
                setIsMobile(false);
                layout.reconcileBreakpoint();
                await delay(50);
                expect(
                    parseInt(
                        container.style.getPropertyValue(
                            '--consonant-merch-card-footer-row-1-min-height',
                        ),
                    ) || 0,
                    'footer-row height synced on desktop',
                ).to.be.at.least(32);

                // Mobile is single-column: the grow-only heights must be cleared
                // so collapsed cards size naturally instead of keeping desktop
                // heights.
                setIsMobile(true);
                layout.reconcileBreakpoint();
                await delay(50);
                expect(
                    container.style.getPropertyValue(
                        '--consonant-merch-card-footer-row-1-min-height',
                    ),
                    'footer-row height cleared on mobile',
                ).to.equal('');
                expect(
                    container.style.getPropertyValue(
                        '--consonant-merch-card-mini-compare-chart-mweb-body-xs-height',
                    ),
                    'body-xs height cleared on mobile',
                ).to.equal('');
            } finally {
                resetIsMobile();
            }
        });

        it('[mobile] title click toggles the collapsible list', async () => {
            const card = document.querySelector('#card-mweb-1');
            await card.checkReady();
            await delay(200);

            const layout = card.variantLayout;
            const bodyXs = card.querySelector('[slot="body-xs"]');
            const titleDiv = bodyXs.querySelector('.footer-rows-title');
            const list = bodyXs.querySelector('ul.checkmark-copy-container');
            const toggleBtn = titleDiv.querySelector('.toggle-icon');

            try {
                setIsMobile(true);
                layout.setListOpen(false);
                expect(list.classList.contains('open'), 'collapsed baseline').to
                    .be.false;
                expect(toggleBtn.getAttribute('aria-expanded')).to.equal(
                    'false',
                );

                titleDiv.click();
                expect(list.classList.contains('open'), 'expands on click').to
                    .be.true;
                expect(toggleBtn.getAttribute('aria-expanded')).to.equal(
                    'true',
                );

                titleDiv.click();
                expect(list.classList.contains('open'), 'collapses on click').to
                    .be.false;
            } finally {
                resetIsMobile();
            }
        });

        it('[desktop] title click never collapses the list', async () => {
            const card = document.querySelector('#card-mweb-1');
            await card.checkReady();
            await delay(200);

            const layout = card.variantLayout;
            const titleDiv = card.querySelector('.footer-rows-title');

            try {
                setIsMobile(false);
                layout.setListOpen(false); // force a collapsed class
                titleDiv.click();
                // Desktop clicks are no-ops; CSS keeps the list visible.
                expect(layout.isListOpen, 'click ignored on desktop').to.be
                    .false;
            } finally {
                resetIsMobile();
            }
        });

        it('reconnects without throwing and still reconciles on resize', async () => {
            const card = document.querySelector('#card-mweb-1');
            await card.checkReady();
            await delay(100);

            const layout = card.variantLayout;
            const container = layout.getContainer();

            layout.disconnectedCallbackHook();
            layout.connectedCallbackHook(); // must not throw

            try {
                setIsMobile(true);
                layout.reconcileBreakpoint(); // re-wired path clears synced heights
                expect(
                    container.style.getPropertyValue(
                        '--consonant-merch-card-footer-row-1-min-height',
                    ),
                    'heights cleared after reconnect',
                ).to.equal('');
            } finally {
                resetIsMobile();
            }
        });

        it('renders the authored disclaimer below the price on desktop and mobile', async () => {
            const card = document.querySelector('#card-mweb-2');
            await card.checkReady();
            const disclaimer = card.querySelector('[slot="callout-content"]');
            const legal = card.querySelector('[data-template="legal"]');
            await legal.onceSettled();
            expect(legal.options.displayPlanType).to.equal(false);
            expect(disclaimer.textContent).to.include('Fee applies');

            const originalHTML = disclaimer.innerHTML;
            const localizedText =
                "Jusqu'\u00e0 10 licences avec essai gratuit. ".repeat(8);
            try {
                for (const width of [1200, 430]) {
                    await setViewport({ width, height: 1000 });
                    for (const text of [
                        originalHTML,
                        `<p>Aucun remboursement en cas de r\u00e9siliation apr\u00e8s 14 jours. ${localizedText}
                            <a href="https://adobe.com/legal">Conditions</a></p>`,
                    ]) {
                        disclaimer.innerHTML = text;
                        await delay(200);
                        const slot = card.shadowRoot.querySelector(
                            'slot[name="callout-content"]',
                        );
                        expect(slot.assignedElements()).to.include(disclaimer);
                        expect(
                            slot.parentElement.previousElementSibling.name,
                        ).to.equal('heading-m-price');
                        const rect = disclaimer.getBoundingClientRect();
                        const priceRect = card
                            .querySelector('[slot="heading-m-price"]')
                            .getBoundingClientRect();
                        const promoRect = card
                            .querySelector('[slot="promo-text"]')
                            .getBoundingClientRect();
                        expect(rect.height).to.be.greaterThan(0);
                        expect(rect.top).to.be.at.least(priceRect.bottom - 1);
                        expect(rect.bottom).to.be.at.most(promoRect.top + 1);
                        expect(disclaimer.scrollWidth).to.be.at.most(
                            disclaimer.clientWidth,
                        );
                        const paragraphStyle = getComputedStyle(
                            disclaimer.querySelector('p'),
                        );
                        expect(paragraphStyle.backgroundColor).to.equal(
                            'rgba(0, 0, 0, 0)',
                        );
                        expect(paragraphStyle.fontStyle).to.equal('italic');
                        expect(paragraphStyle.fontFamily).to.equal(
                            getComputedStyle(card).fontFamily,
                        );
                        expect(paragraphStyle.fontWeight).to.equal('400');
                        expect(paragraphStyle.fontSize).to.equal('14px');
                        expect(paragraphStyle.lineHeight).to.equal('21px');
                        const emptySlot = document
                            .querySelector('#card-mweb-1')
                            .shadowRoot.querySelector(
                                'slot[name="callout-content"]',
                            );
                        if (width === 1200) {
                            card.variantLayout.resetSyncedHeights();
                            card.variantLayout.syncHeights();
                            expect(
                                Math.abs(
                                    slot.parentElement.getBoundingClientRect()
                                        .height -
                                        emptySlot.parentElement.getBoundingClientRect()
                                            .height,
                                ),
                            ).to.be.at.most(1);
                        } else {
                            expect(
                                emptySlot.parentElement.getBoundingClientRect()
                                    .height,
                            ).to.equal(0);
                        }
                    }
                }
            } finally {
                disclaimer.innerHTML = originalHTML;
                await setViewport({ width: 1200, height: 1000 });
            }
        });
    });
});
