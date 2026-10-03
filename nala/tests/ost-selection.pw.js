import { test, expect } from '@playwright/test';
import OSTNewPage from '../studio/ost/ost-new.page.js';

for (const { name, selected, filled } of [
    { name: 'preserves an offer already carried into a bundle', selected: true, filled: true },
    { name: 'waits for a manually selected offer to finish resolving', selected: false, filled: false },
    { name: 'adds an auto-selected offer that is not yet in a bundle', selected: true, filled: false },
]) {
    test(name, async ({ page }) => {
        await page.setContent(`
            <div data-testid="ost-modal">
                <ost-offer-card card ${selected ? 'selected' : ''}>Product</ost-offer-card>
                <ost-selection-list>
                    ${filled ? '<div class="selection-slot filled"><div class="slot-osi">offer-a</div></div>' : ''}
                </ost-selection-list>
            </div>
        `);
        await page.evaluate(() => {
            const card = document.querySelector('ost-offer-card');
            card.offer = { offer_id: 'offer-a' };
            card.resolving = false;
            card.clicks = 0;
            card.addEventListener('click', () => {
                card.clicks += 1;
                card.resolving = true;
                setTimeout(() => {
                    const list = document.querySelector('ost-selection-list');
                    list.innerHTML = list.children.length
                        ? ''
                        : '<div class="selection-slot filled"><div class="slot-osi">offer-a</div></div>';
                    card.setAttribute('selected', '');
                    card.resolving = false;
                }, 200);
            });
        });

        const ost = new OSTNewPage(page);
        await ost.selectFirstOffer();

        await expect(ost.bundleSlot).toHaveCount(1);
        expect(await ost.offerCard.first().evaluate((card) => ({ resolving: card.resolving, clicks: card.clicks }))).toEqual({
            resolving: false,
            clicks: filled ? 0 : 1,
        });
    });
}
