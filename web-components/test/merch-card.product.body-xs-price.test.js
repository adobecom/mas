import { expect } from '@esm-bundle/chai';
import '../src/mas.js';

describe('Product body-xs inline price font-weight', () => {
    let card;

    before(async () => {
        if (!document.querySelector('mas-commerce-service')) {
            document.head.appendChild(
                document.createElement('mas-commerce-service'),
            );
        }
        await customElements.whenDefined('merch-card');
    });

    beforeEach(async () => {
        card = document.createElement('merch-card');
        card.setAttribute('variant', 'product');
        card.innerHTML = `
            <div slot="body-xs">
                <p><strong><span is="inline-price" data-template="price" id="bold">50%</span></strong> off</p>
                <p><span is="inline-price" data-template="price" id="plain">US$10</span></p>
            </div>
            <merch-addon slot="addon"><span is="inline-price" data-template="price" id="addon">US$5</span></merch-addon>`;
        document.body.appendChild(card);
        await card.updateComplete;
        await card.querySelector('merch-addon').updateComplete;
    });

    afterEach(() => {
        card.remove();
    });

    it('renders a price wrapped in <strong> at 700', () => {
        const price = card.querySelector('#bold');
        expect(getComputedStyle(price).fontWeight).to.equal('700');
    });

    it('renders a plain price at 400', () => {
        const price = card.querySelector('#plain');
        expect(getComputedStyle(price).fontWeight).to.equal('400');
    });

    it('keeps the merch-addon price bold', () => {
        const price = card.querySelector('#addon');
        expect(getComputedStyle(price).fontWeight).to.equal('700');
    });
});
