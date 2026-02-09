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

    describe('merch-card image variant', () => {
        it('should render image slot and badge', async () => {
            const card = document.getElementById('image-default');
            await card.updateComplete;
            await delay(0);
            const imageSlot = card.shadowRoot.querySelector(
                '.image slot[name="bg-image"]',
            );
            const badge = card.shadowRoot.getElementById('badge');
            expect(imageSlot).to.exist;
            expect(badge).to.exist;
        });

        it('should order promo text before body by default', async () => {
            const card = document.getElementById('image-default');
            await card.updateComplete;
            const slotOrder = [
                ...card.shadowRoot
                    .querySelector('.body')
                    .querySelectorAll('slot'),
            ].map((slot) => slot.getAttribute('name'));
            expect(slotOrder).to.deep.equal([
                'icons',
                'heading-xs',
                'body-xxs',
                'promo-text',
                'body-xs',
            ]);
        });

        it('should order promo text after body when promo-bottom', async () => {
            const card = document.getElementById('image-promo-bottom');
            await card.updateComplete;
            const slotOrder = [
                ...card.shadowRoot
                    .querySelector('.body')
                    .querySelectorAll('slot'),
            ].map((slot) => slot.getAttribute('name'));
            expect(slotOrder).to.deep.equal([
                'icons',
                'heading-xs',
                'body-xxs',
                'body-xs',
                'promo-text',
            ]);
        });

        it('should render secure label footer for non-evergreen cards', async () => {
            const card = document.getElementById('image-default');
            await card.updateComplete;
            const footer = card.shadowRoot.querySelector('footer');
            const label = footer?.querySelector('.secure-transaction-label');
            const hr = card.shadowRoot.querySelector('hr');
            expect(footer).to.exist;
            expect(label).to.exist;
            expect(hr).to.exist;
        });

        it('should render detail background for evergreen cards', async () => {
            const card = document.getElementById('image-evergreen');
            await card.updateComplete;
            const detail = card.shadowRoot.querySelector(
                '.detail-bg-container',
            );
            const footer = card.shadowRoot.querySelector('footer');
            const hr = card.shadowRoot.querySelector('hr');
            expect(detail).to.exist;
            expect(detail.getAttribute('style')).to.contain('background:');
            expect(footer).to.not.exist;
            expect(hr).to.not.exist;
        });
    });
});
