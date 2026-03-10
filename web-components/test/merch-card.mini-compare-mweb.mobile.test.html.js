// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import { mockLana } from './mocks/lana.js';
import { mockFetch } from './mocks/fetch.js';

import { toggleMobile, delay } from './utils.js';
import { mockIms } from './mocks/ims.js';
import { withWcs } from './mocks/wcs.js';

runTests(async () => {
    await toggleMobile();
    mockIms();
    mockLana();
    await mockFetch(withWcs);
    await import('../src/mas.js');

    describe('[mobile] merch-card web component with mini-compare-chart-mweb variant', () => {
        it('[mobile] should remove empty rows via postCardUpdateHook', async () => {
            const card = document.querySelector(
                'merch-card[variant="mini-compare-chart-mweb"]',
            );
            await card.checkReady();

            // postCardUpdateHook on mobile calls removeEmptyRows
            card.variantLayout?.removeEmptyRows();
            expect(true, 'removing empty rows does not fail').to.be.true;

            // Verify empty rows are removed
            const rows = card.querySelectorAll('.footer-row-cell');
            const emptyRows = [...rows].filter((row) => {
                const desc = row.querySelector('.footer-row-cell-description');
                return desc && !desc.textContent.trim();
            });
            expect(emptyRows.length).to.equal(0);
        });

        it('[mobile] should setup toggle with collapsed state by default', async () => {
            const card = document.querySelector(
                'merch-card[variant="mini-compare-chart-mweb"]',
            );
            await card.checkReady();
            await delay(200);

            const bodyXs = card.querySelector('[slot="body-xs"]');
            const titleDiv = bodyXs.querySelector('.footer-rows-title');
            expect(titleDiv, 'footer-rows-title created').to.exist;
            expect(titleDiv.textContent).to.include("See what's included:");

            const toggleBtn = titleDiv.querySelector('.toggle-icon');
            expect(toggleBtn, 'toggle button created').to.exist;
            expect(toggleBtn.getAttribute('aria-expanded')).to.equal('false');

            const list = bodyXs.querySelector('ul.checkmark-copy-container');
            expect(list, 'list has checkmark-copy-container class').to.exist;
            expect(list.classList.contains('open')).to.be.false;
        });

        it('[mobile] should expand and collapse on toggle click', async () => {
            const card = document.querySelector(
                'merch-card[variant="mini-compare-chart-mweb"]',
            );
            await card.checkReady();
            await delay(200);

            const bodyXs = card.querySelector('[slot="body-xs"]');
            const titleDiv = bodyXs.querySelector('.footer-rows-title');
            const toggleBtn = titleDiv.querySelector('.toggle-icon');
            const list = bodyXs.querySelector('ul.checkmark-copy-container');

            // Click to expand
            titleDiv.click();
            await delay(50);
            expect(list.classList.contains('open')).to.be.true;
            expect(toggleBtn.getAttribute('aria-expanded')).to.equal('true');

            // Click to collapse
            titleDiv.click();
            await delay(50);
            expect(list.classList.contains('open')).to.be.false;
            expect(toggleBtn.getAttribute('aria-expanded')).to.equal('false');
        });

        it('[mobile] should not re-setup toggle on second call', async () => {
            const card = document.querySelector(
                'merch-card[variant="mini-compare-chart-mweb"]',
            );
            await card.checkReady();
            await delay(200);

            const bodyXs = card.querySelector('[slot="body-xs"]');
            // setupToggle is idempotent
            card.variantLayout.setupToggle();
            const titles = bodyXs.querySelectorAll('.footer-rows-title');
            expect(titles.length).to.equal(1);
        });
    });
});
