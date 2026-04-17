import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/mas-field.js';

const CTA_HTML =
    '<a data-wcs-osi="ABC123" data-checkout-workflow="UCv3" data-template="checkoutUrl" data-analytics-id="buy-now" class="accent">Buy now</a>';

const SECONDARY_CTA_HTML =
    '<a data-wcs-osi="XYZ" class="secondary">Try for free</a>';

function makeField(fieldName, fieldValue) {
    const el = document.createElement('mas-field');
    el.setAttribute('field', fieldName);
    const fragment = document.createElement('aem-fragment');
    el.append(fragment);
    document.body.append(el);

    // Simulate the aem:load event bubbling up from the aem-fragment child.
    fragment.dispatchEvent(
        new CustomEvent('aem:load', {
            bubbles: true,
            detail: { fields: { [fieldName]: fieldValue } },
        }),
    );
    return el;
}

describe('mas-field – ctas rendering', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    it('renders a <div slot="footer"> wrapper for ctas field', () => {
        const el = makeField('ctas', CTA_HTML);
        const footer = el.querySelector('[slot="footer"]');
        expect(footer).to.exist;
        expect(footer.tagName).to.equal('DIV');
    });

    it('creates a checkout-link <a> when checkout-link is not registered', () => {
        const el = makeField('ctas', CTA_HTML);
        const footer = el.querySelector('[slot="footer"]');
        const link = footer.firstElementChild;
        expect(link.tagName).to.equal('A');
        expect(link.getAttribute('data-wcs-osi')).to.equal('ABC123');
        expect(link.getAttribute('data-checkout-workflow')).to.equal('UCv3');
        expect(link.getAttribute('data-template')).to.equal('checkoutUrl');
        expect(link.getAttribute('data-analytics-id')).to.equal('buy-now');
    });

    it('applies con-button blue classes for accent variant', () => {
        const el = makeField('ctas', CTA_HTML);
        const link = el.querySelector('[slot="footer"] a');
        expect(link.classList.contains('button')).to.be.true;
        expect(link.classList.contains('con-button')).to.be.true;
        expect(link.classList.contains('blue')).to.be.true;
    });

    it('applies fill class for solid primary (no outline)', () => {
        const el = makeField('ctas', SECONDARY_CTA_HTML); // class="secondary" → base outlined
        const link = el.querySelector('[slot="footer"] a');
        expect(link.classList.contains('con-button')).to.be.true;
        expect(link.classList.contains('fill')).to.be.false;
    });

    it('applies fill class for primary without outline', () => {
        const el = makeField(
            'ctas',
            '<a data-wcs-osi="ABC" class="primary">Start trial</a>',
        );
        const link = el.querySelector('[slot="footer"] a');
        expect(link.classList.contains('con-button')).to.be.true;
        expect(link.classList.contains('fill')).to.be.true;
    });

    it('does not apply fill for primary-outline', () => {
        const el = makeField(
            'ctas',
            '<a data-wcs-osi="ABC" class="primary-outline">Learn more</a>',
        );
        const link = el.querySelector('[slot="footer"] a');
        expect(link.classList.contains('con-button')).to.be.true;
        expect(link.classList.contains('fill')).to.be.false;
        expect(link.classList.contains('blue')).to.be.false;
    });

    it('defaults to accent (blue) when link has no variant class', () => {
        const el = makeField('ctas', '<a data-wcs-osi="ABC">Buy</a>');
        const link = el.querySelector('[slot="footer"] a');
        expect(link.classList.contains('blue')).to.be.true;
    });

    it('wraps link text in spectrum-Button-label span', () => {
        const el = makeField('ctas', CTA_HTML);
        const link = el.querySelector('[slot="footer"] a');
        const label = link.querySelector('.spectrum-Button-label');
        expect(label).to.exist;
        expect(label.textContent).to.equal('Buy now');
    });

    it('renders multiple CTAs when multiple links are present', () => {
        const html = `${CTA_HTML} ${SECONDARY_CTA_HTML}`;
        const el = makeField('ctas', html);
        const links = el.querySelectorAll('[slot="footer"] a');
        expect(links.length).to.equal(2);
    });

    it('uses createCheckoutLink when checkout-link is registered', () => {
        const fakeLink = document.createElement('a');
        fakeLink.innerHTML =
            '<span style="pointer-events: none;">Buy now</span>';
        const CheckoutLinkMock = {
            createCheckoutLink: sinon.stub().returns(fakeLink),
        };
        sandbox
            .stub(customElements, 'get')
            .withArgs('checkout-link')
            .returns(CheckoutLinkMock);

        const el = makeField('ctas', CTA_HTML);
        expect(CheckoutLinkMock.createCheckoutLink.calledOnce).to.be.true;
    });

    it('falls back to raw innerHTML for non-ctas fields', () => {
        const el = makeField('title', 'Creative Cloud');
        const content = el.querySelector('[data-role="mas-field-content"]');
        expect(content.textContent).to.equal('Creative Cloud');
        expect(el.querySelector('[slot="footer"]')).to.be.null;
    });

    it('falls back to raw innerHTML when ctas field has no anchor elements', () => {
        const el = makeField('ctas', '<p>No links here</p>');
        const footer = el.querySelector('[slot="footer"]');
        expect(footer).to.be.null;
        expect(
            el.querySelector('[data-role="mas-field-content"]').innerHTML,
        ).to.include('No links');
    });
});
