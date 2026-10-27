// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import { mockLana } from './mocks/lana.js';
import { mockFetch } from './mocks/fetch.js';
import { mockIms } from './mocks/ims.js';
import { withWcs } from './mocks/wcs.js';

runTests(async () => {
    mockIms();
    mockLana();
    await mockFetch(withWcs);
    await import('../src/mas.js');

    describe('merch-card pro accessibility', () => {
        let card;
        let inlinePrices;

        before(async () => {
            card = document.getElementById('cpro-product');
            await card.updateComplete;
            inlinePrices = [
                ...card.querySelectorAll('span[is="inline-price"]'),
            ];
            await Promise.all(inlinePrices.map((el) => el.onceSettled()));
        });

        it('keeps non-interactive text free of role, tabindex and modal-trigger', () => {
            const textElements = [
                card.querySelector('[slot="heading-xs"]'),
                card.querySelector('[slot="subtitle"]'),
                card.querySelector('[slot="body-xs"]'),
                card.querySelector('[slot="heading-m"]'),
                ...inlinePrices,
            ];
            expect(inlinePrices).to.have.length(3);
            textElements.forEach((element) => {
                expect(element, 'element exists').to.exist;
                expect(element.hasAttribute('role')).to.be.false;
                expect(element.hasAttribute('tabindex')).to.be.false;
                expect(element.classList.contains('modal-trigger')).to.be
                    .false;
            });
        });

        it('keeps footer CTAs as focusable links', () => {
            const ctas = [...card.querySelectorAll('[slot="footer"] a')];
            expect(ctas).to.have.length(2);
            ctas.forEach((cta) => {
                expect(cta.tagName).to.equal('A');
                expect(cta.getAttribute('href')).to.not.be.empty;
                expect(cta.tabIndex).to.be.at.least(0);
            });
        });

        it("keeps the what's-included toggle a button with aria-expanded", () => {
            const toggle = card.shadowRoot.querySelector(
                '.whats-included-toggle',
            );
            expect(toggle).to.exist;
            expect(toggle.tagName).to.equal('BUTTON');
            expect(toggle.getAttribute('aria-expanded')).to.equal('false');
            expect(toggle.tabIndex).to.be.at.least(0);
        });

        it('re-dispatches a child click with the inline-price as target', () => {
            const [inlinePrice] = inlinePrices;
            let targetIsInlinePrice = false;
            inlinePrice.addEventListener(
                'click',
                (event) => {
                    targetIsInlinePrice = event.target === inlinePrice;
                },
                { once: true },
            );
            inlinePrice.firstElementChild.dispatchEvent(
                new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                }),
            );
            expect(targetIsInlinePrice).to.be.true;
        });
    });
});
