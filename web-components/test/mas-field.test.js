import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/mas-field.js';
import { priceOptionsProvider } from '../src/mas-field.js';
import { FF_DEFAULTS } from '../src/constants.js';

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

describe('mas-field – indexed CTA fields (ctas[N])', () => {
    const TWO_CTAS =
        '<a is="checkout-link" class="accent" href="" data-wcs-osi="osi1">Buy now</a>' +
        '<a is="checkout-link" class="primary-outline" href="" data-wcs-osi="osi2">Free trial</a>';

    afterEach(() => {
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    function makeIndexedField(index, ctasHtml) {
        const el = document.createElement('mas-field');
        el.setAttribute('field', `ctas[${index}]`);
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);
        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: { fields: { ctas: ctasHtml } },
            }),
        );
        return el;
    }

    it('ctas[1] renders the first anchor', () => {
        const el = makeIndexedField(1, TWO_CTAS);
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a).to.exist;
        expect(a.textContent).to.equal('Buy now');
    });

    it('ctas[2] renders the second anchor', () => {
        const el = makeIndexedField(2, TWO_CTAS);
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a).to.exist;
        expect(a.textContent).to.equal('Free trial');
    });

    it('strips class attribute from extracted anchor', () => {
        const el = makeIndexedField(1, TWO_CTAS);
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a.hasAttribute('class')).to.be.false;
    });

    it('preserves data-wcs-osi and is attributes', () => {
        const el = makeIndexedField(1, TWO_CTAS);
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a.getAttribute('data-wcs-osi')).to.equal('osi1');
        expect(a.getAttribute('is')).to.equal('checkout-link');
    });

    it('does not create a slot="footer" wrapper', () => {
        const el = makeIndexedField(1, TWO_CTAS);
        expect(el.querySelector('[slot="footer"]')).to.be.null;
    });

    it('renders nothing when index is out of bounds', () => {
        const el = makeIndexedField(99, TWO_CTAS);
        expect(
            el.querySelector('[data-role="mas-field-content"]').innerHTML,
        ).to.equal('');
    });

    it('renders nothing when ctas field is absent', () => {
        const el = document.createElement('mas-field');
        el.setAttribute('field', 'ctas[1]');
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);
        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: { fields: { cardTitle: 'CC' } },
            }),
        );
        expect(
            el.querySelector('[data-role="mas-field-content"]').innerHTML,
        ).to.equal('');
    });

    it('handles anchors nested inside <p><strong>', () => {
        const el = makeIndexedField(
            1,
            '<p><strong><a href="/buy" data-wcs-osi="osi1">Buy now</a></strong></p>',
        );
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a).to.exist;
        expect(a.textContent).to.equal('Buy now');
        expect(a.getAttribute('data-wcs-osi')).to.equal('osi1');
    });
});

describe('mas-field – checkReady()', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    it('resolves immediately when fragment is already loaded', async () => {
        const el = makeField('title', 'Creative Cloud');
        const result = await el.checkReady();
        expect(result).to.be.true;
    });

    it('resolves after aem:load fires when not yet loaded', async () => {
        const el = document.createElement('mas-field');
        el.setAttribute('field', 'title');
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);

        const readyPromise = el.checkReady();
        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: { fields: { title: 'Creative Cloud' } },
            }),
        );
        const result = await readyPromise;
        expect(result).to.be.true;
    });
});

describe('mas-field – normalized field values', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    it('renders string extracted from object field value { value: "..." }', () => {
        const el = makeField('title', { value: 'Creative Cloud' });
        const content = el.querySelector('[data-role="mas-field-content"]');
        expect(content.textContent).to.equal('Creative Cloud');
    });
});

describe('mas-field – non-checkout and link-style CTAs', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    it('clones non-checkout link without button styling', () => {
        const el = makeField(
            'ctas',
            '<a href="https://example.com" class="accent">Learn more</a>',
        );
        const link = el.querySelector('[slot="footer"] a');
        expect(link).to.exist;
        expect(link.getAttribute('href')).to.equal('https://example.com');
        expect(link.classList.contains('con-button')).to.be.false;
    });

    it('does not add button classes for link-style variant (accent-link)', () => {
        const el = makeField(
            'ctas',
            '<a data-wcs-osi="ABC" class="accent-link">Learn more</a>',
        );
        const link = el.querySelector('[slot="footer"] a');
        expect(link).to.exist;
        expect(link.classList.contains('con-button')).to.be.false;
        expect(link.classList.contains('blue')).to.be.false;
    });

    it('does not add button classes for primary-link variant', () => {
        const el = makeField(
            'ctas',
            '<a data-wcs-osi="ABC" class="primary-link">Details</a>',
        );
        const link = el.querySelector('[slot="footer"] a');
        expect(link.classList.contains('con-button')).to.be.false;
        expect(link.classList.contains('fill')).to.be.false;
    });
});

describe('mas-field – lifecycle', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    it('re-renders when field attribute changes after load', () => {
        const el = document.createElement('mas-field');
        el.setAttribute('field', 'title');
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);
        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: {
                    fields: {
                        title: 'Creative Cloud',
                        description: 'Great plan',
                    },
                },
            }),
        );
        expect(
            el.querySelector('[data-role="mas-field-content"]').textContent,
        ).to.equal('Creative Cloud');
        el.setAttribute('field', 'description');
        expect(
            el.querySelector('[data-role="mas-field-content"]').textContent,
        ).to.equal('Great plan');
    });

    it('ignores aem:load events not from the aem-fragment child', () => {
        const el = document.createElement('mas-field');
        el.setAttribute('field', 'title');
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);

        // Fire from a non-aem-fragment element
        const other = document.createElement('div');
        el.append(other);
        other.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: { fields: { title: 'Should not render' } },
            }),
        );
        expect(
            el.querySelector('[data-role="mas-field-content"]')?.textContent ??
                '',
        ).to.equal('');
    });

    it('stops responding to aem:load after disconnection', () => {
        const el = document.createElement('mas-field');
        el.setAttribute('field', 'title');
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);
        el.remove();

        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: { fields: { title: 'Post-disconnect' } },
            }),
        );
        expect(
            el.querySelector('[data-role="mas-field-content"]')?.textContent ??
                '',
        ).to.equal('');
    });
});

describe('mas-field – non-string field values', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    it('renders numeric field value as text', () => {
        const el = makeField('count', 42);
        const content = el.querySelector('[data-role="mas-field-content"]');
        expect(content.textContent).to.equal('42');
    });

    it('renders empty string for null field value', () => {
        const el = makeField('count', null);
        const content = el.querySelector('[data-role="mas-field-content"]');
        expect(content.textContent).to.equal('');
    });

    it('skips render when field value is undefined', () => {
        const el = document.createElement('mas-field');
        el.setAttribute('field', 'missing');
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);
        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: { fields: { title: 'Something' } },
            }),
        );
        expect(
            el.querySelector('[data-role="mas-field-content"]')?.innerHTML ??
                '',
        ).to.equal('');
    });
});

describe('mas-field – price options provider (locale defaults)', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('mas-field, span[is="inline-price"]')
            .forEach((el) => el.remove());
    });

    it('opts inline-prices inside mas-field into FF_DEFAULTS', () => {
        const masField = document.createElement('mas-field');
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        masField.append(inline);
        document.body.append(masField);

        const options = {};
        priceOptionsProvider(inline, options);
        expect(options[FF_DEFAULTS]).to.equal(true);
    });

    it('does not opt into FF_DEFAULTS for inline-prices outside mas-field', () => {
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        document.body.append(inline);

        const options = {};
        priceOptionsProvider(inline, options);
        expect(options[FF_DEFAULTS]).to.be.undefined;
    });

    it('safely no-ops when element is null', () => {
        const options = {};
        expect(() => priceOptionsProvider(null, options)).to.not.throw();
        expect(options[FF_DEFAULTS]).to.be.undefined;
    });
});
