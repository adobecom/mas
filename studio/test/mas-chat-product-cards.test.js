import { expect } from '@esm-bundle/chai';
import { fixture, html, oneEvent } from '@open-wc/testing';
import '../src/swc.js';
import '../src/mas-chat-product-cards.js';
import { spTheme } from './utils.js';

const products = [
    {
        label: 'Adobe Acrobat Classic - with feature restricted licensing',
        value: 'PA-1034',
        arrangement_code: 'PA-1034',
        product_code: 'APRO',
        product_family: 'ACROBAT',
        segments: ['TEAM', 'ENTERPRISE'],
        icon: 'https://example.com/acrobat.svg',
    },
    {
        label: 'Campaign SMS',
        value: 'PA-2486',
        arrangement_code: 'PA-2486',
        product_code: 'ACMC',
        product_family: 'CAMPAIGN',
        segments: ['ENTERPRISE'],
        icon: 'https://example.com/campaign.svg',
    },
];

describe('MasChatProductCards', () => {
    it('renders product tiles with minimal metadata', async () => {
        const el = await fixture(html`<mas-chat-product-cards .products=${products}></mas-chat-product-cards>`, {
            parentNode: spTheme(),
        });

        const cards = el.querySelectorAll('sp-action-button.product-card');
        expect(cards).to.have.length(2);

        const firstCard = cards[0];
        const pills = firstCard.querySelectorAll('sp-tag.product-pill');

        expect(firstCard.querySelector('.product-title').textContent).to.contain(products[0].label);
        expect(firstCard.querySelector('.product-code').textContent).to.equal('PA-1034');
        expect(pills).to.have.length(2);
        expect([...pills].map((pill) => pill.textContent.trim())).to.deep.equal(['ACROBAT', 'TEAM']);
        expect(firstCard.querySelector('.product-card-status').textContent).to.contain('Select');
    });

    it('fires button-selected when clicking anywhere on a tile', async () => {
        const el = await fixture(html`<mas-chat-product-cards .products=${products}></mas-chat-product-cards>`, {
            parentNode: spTheme(),
        });

        const eventPromise = oneEvent(el, 'button-selected');
        el.querySelector('sp-action-button.product-card').click();
        const event = await eventPromise;

        expect(event.detail).to.include({
            value: 'PA-1034',
            label: 'Adobe Acrobat Classic - with feature restricted licensing',
        });
    });

    it('marks the selected tile and disables the remaining options', async () => {
        const el = await fixture(html`<mas-chat-product-cards .products=${products}></mas-chat-product-cards>`, {
            parentNode: spTheme(),
        });

        const [firstCard, secondCard] = el.querySelectorAll('sp-action-button.product-card');
        firstCard.click();
        await el.updateComplete;

        expect(firstCard.hasAttribute('selected')).to.be.true;
        expect(secondCard.hasAttribute('disabled')).to.be.true;
    });
});
