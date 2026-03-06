// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import { mockLana } from './mocks/lana.js';
import { mockFetch } from './mocks/fetch.js';

import { delay } from './utils.js';
import { mockIms } from './mocks/ims.js';
import { withWcs } from './mocks/wcs.js';

const skipTests = sessionStorage.getItem('skipTests');

runTests(async () => {
    mockIms();
    mockLana();
    await mockFetch(withWcs);
    await import('../src/mas.js');
    describe('merch-card web component', () => {
        it('should exist in the HTML document', async () => {
            expect(document.querySelector('merch-card')).to.exist;
        });
        it('should exist segment card in HTML document', async () => {
            expect(document.querySelector('merch-card[variant="segment"]')).to
                .exist;
        });
        it('should exist a plans card in HTML document', async () => {
            expect(document.querySelector('merch-card[variant="plans"]')).to
                .exist;
        });
        it('should exist an image card in HTML document', async () => {
            expect(document.querySelector('merch-card[variant="image"]')).to
                .exist;
        });
        it('should exist an inline heading card in HTML document', async () => {
            expect(
                document.querySelector('merch-card[variant="inline-heading"]'),
            ).to.exist;
        });
        it('should exist an inline heading card in HTML document with CTA button', async () => {
            expect(
                document.querySelector(
                    'merch-card[variant="inline-heading"] div[slot="footer"] a.con-button.blue',
                ),
            ).to.exist;
        });
        it('should have stock trial checkbox', async () => {
            const plansCard = document.querySelector(
                'merch-card[variant="plans"]',
            );
            const stockCheckbox =
                plansCard.shadowRoot.getElementById('stock-checkbox');
            expect(stockCheckbox).to.exist;
            expect(plansCard.price.dataset.wcsOsi).to.equal('m2m');
            expect(plansCard.checkoutLinks[0].dataset.wcsOsi).to.equal('m2m');
            stockCheckbox.querySelector('input').click();
            await delay(100);
            expect(plansCard.checkoutLinks[0].dataset.wcsOsi).to.equal(
                'm2m,stock-m2m',
            );
        });

        it('should have and interact with quantity-selector', async () => {
            const plansCard = document.querySelector('merch-card[type="q-ty"]');
            const quantitySelect = plansCard.querySelector(
                'merch-quantity-select',
            );
            expect(quantitySelect).to.exist;
            await quantitySelect.updateComplete;
            const inputField =
                quantitySelect.shadowRoot.querySelector('.text-field-input');
            inputField.value = '3';
            const event = new KeyboardEvent('keyup', {
                key: '3',
                bubbles: true,
            });
            event.composedPath = () => [quantitySelect];
            inputField.dispatchEvent(event);
            await delay(100);
            expect(quantitySelect.selectedValue).to.equal(1);
            const button = plansCard.querySelector('.con-button');
            expect(button.getAttribute('data-quantity')).to.equal('1');
        });
    });

    it('should return title for segment card', async () => {
        const title = document.querySelector(
            'merch-card[variant="segment"]',
        ).title;
        expect(title).to.equal('Individuals');
    });

    it('should have custom border color for segment card', async () => {
        const segmentCard = document.querySelector(
            'merch-card[variant="segment"].custom-border-color',
        );
        const borderColor = segmentCard.getAttribute('border-color');
        expect(borderColor).to.exist;
        expect(borderColor).to.not.equal('');
    });

    describe('variant stylesheet handling', () => {
        it('should apply variant stylesheet to shadowRoot.adoptedStyleSheets', async () => {
            const plansCard = document.querySelector(
                'merch-card[variant="plans"]',
            );
            expect(plansCard.shadowRoot.adoptedStyleSheets).to.be.an('array');
            expect(
                plansCard.shadowRoot.adoptedStyleSheets.length,
            ).to.be.greaterThan(0);
        });

        it('should cache stylesheet for same variant cards', async () => {
            const plansCards = document.querySelectorAll(
                'merch-card[variant="plans"]',
            );
            expect(plansCards.length).to.be.greaterThan(1);
            const sheets1 = plansCards[0].shadowRoot.adoptedStyleSheets;
            const sheets2 = plansCards[1].shadowRoot.adoptedStyleSheets;
            const variantSheet1 = sheets1[sheets1.length - 1];
            const variantSheet2 = sheets2[sheets2.length - 1];
            expect(variantSheet1).to.equal(variantSheet2);
        });

        it('should not have duplicate stylesheets in adoptedStyleSheets', async () => {
            const plansCard = document.querySelector(
                'merch-card[variant="plans"]',
            );
            const sheets = plansCard.shadowRoot.adoptedStyleSheets;
            const uniqueSheets = new Set(sheets);
            expect(sheets.length).to.equal(uniqueSheets.size);
        });

        it('should have different stylesheets for different variants', async () => {
            const plansCard = document.querySelector(
                'merch-card[variant="plans"]',
            );
            const segmentCard = document.querySelector(
                'merch-card[variant="segment"]',
            );
            const plansSheets = plansCard.shadowRoot.adoptedStyleSheets;
            const segmentSheets = segmentCard.shadowRoot.adoptedStyleSheets;
            const plansVariantSheet = plansSheets[plansSheets.length - 1];
            const segmentVariantSheet = segmentSheets[segmentSheets.length - 1];
            expect(plansVariantSheet).to.not.equal(segmentVariantSheet);
        });

        it('should have variantLayout property set on card', async () => {
            const plansCard = document.querySelector(
                'merch-card[variant="plans"]',
            );
            expect(plansCard.variantLayout).to.exist;
            expect(plansCard.variantLayout.card).to.equal(plansCard);
        });
    });
});
