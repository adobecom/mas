import { expect } from '@esm-bundle/chai';
import '../src/mas.js';

before(async () => {
    if (!document.querySelector('mas-commerce-service')) {
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    }
    await customElements.whenDefined('merch-card');
});

afterEach(() => {
    document.body.querySelectorAll('merch-card').forEach((el) => el.remove());
});

describe('merch-card osi getter', () => {
    it('prefers the promo price OSI over the regular price OSI', () => {
        const card = document.createElement('merch-card');
        card.innerHTML =
            '<span is="inline-price" data-template="price" data-wcs-osi="REG"></span>' +
            '<span is="inline-price" data-template="price" data-promotion-code="P" data-wcs-osi="PROMO"></span>';
        expect(card.osi).to.equal('PROMO');
    });

    it('falls back to the regular price OSI when there is no promo', () => {
        const card = document.createElement('merch-card');
        card.innerHTML =
            '<span is="inline-price" data-template="price" data-wcs-osi="REG"></span>';
        expect(card.osi).to.equal('REG');
    });

    it('falls back to the fragment osi field when there is no price', () => {
        const card = document.createElement('merch-card');
        Object.defineProperty(card, 'aemFragment', {
            configurable: true,
            value: { data: { fields: { osi: 'FIELD' } } },
        });
        expect(card.osi).to.equal('FIELD');
    });

    it('is undefined when nothing resolves', () => {
        const card = document.createElement('merch-card');
        expect(card.osi).to.equal(undefined);
    });

    it('ignores prices nested in a merch-addon', () => {
        const card = document.createElement('merch-card');
        card.innerHTML =
            '<span is="inline-price" data-template="price" data-wcs-osi="MAIN"></span>' +
            '<merch-addon><span is="inline-price" data-template="price" data-promotion-code="P" data-wcs-osi="ADDON"></span></merch-addon>';
        expect(card.osi).to.equal('MAIN');
    });

    it('treats a cancel-context promotion as no promo and uses the regular OSI', () => {
        const card = document.createElement('merch-card');
        card.innerHTML =
            '<span is="inline-price" data-template="price" data-wcs-osi="REG"></span>' +
            '<span is="inline-price" data-template="price" data-promotion-code="cancel-context" data-wcs-osi="CANCEL"></span>';
        expect(card.osi).to.equal('REG');
    });
});
