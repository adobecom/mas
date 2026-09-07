import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/mas-field.js';
import {
    checkoutOptionsProvider,
    priceOptionsProvider,
} from '../src/mas-field.js';
import { FF_DEFAULTS } from '../src/constants.js';
import { COMPAT_VERSION_GLOBAL_PROMO_CODE } from '../src/compat-version.js';

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
    const THREE_CTAS =
        '<a is="checkout-link" class="accent" href="" data-wcs-osi="osi1">Buy now</a>' +
        '<a is="checkout-link" class="primary-outline" href="" data-wcs-osi="osi2">Free trial</a>' +
        '<a is="checkout-link" class="primary-outline" href="" data-wcs-osi="osi3" data-key="abc123xyz">Save now</a>';

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
        const el = makeIndexedField(1, THREE_CTAS);
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a).to.exist;
        expect(a.textContent).to.equal('Buy now');
    });

    it('ctas[2] renders the second anchor', () => {
        const el = makeIndexedField(2, THREE_CTAS);
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a).to.exist;
        expect(a.textContent).to.equal('Free trial');
    });

    it('strips class attribute from extracted anchor', () => {
        const el = makeIndexedField(1, THREE_CTAS);
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a.hasAttribute('class')).to.be.false;
    });

    it('preserves data-wcs-osi and is attributes', () => {
        const el = makeIndexedField(1, THREE_CTAS);
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a.getAttribute('data-wcs-osi')).to.equal('osi1');
        expect(a.getAttribute('is')).to.equal('checkout-link');
    });

    it('does not create a slot="footer" wrapper', () => {
        const el = makeIndexedField(1, THREE_CTAS);
        expect(el.querySelector('[slot="footer"]')).to.be.null;
    });

    it('renders nothing when index is out of bounds', () => {
        const el = makeIndexedField(99, THREE_CTAS);
        expect(
            el.querySelector('[data-role="mas-field-content"]').innerHTML,
        ).to.equal('');
    });

    it('ctas[abc123xyz] renders the third anchor', () => {
        const el = makeIndexedField('abc123xyz', THREE_CTAS);
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a).to.exist;
        expect(a.textContent).to.equal('Save now');
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

describe('mas-field – label-keyed fields (customFields[label])', () => {
    const FIELDS = {
        customFields: [
            '<p>Value one</p>',
            '<p>Value two</p>',
            '<p>Value three</p>',
        ],
        customFieldLabels: ['Alpha', 'Beta', 'Gamma'],
    };

    afterEach(() => {
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    function makeLabelField(label, fields = FIELDS) {
        const el = document.createElement('mas-field');
        el.setAttribute('field', `customFields[${label}]`);
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);
        fragment.dispatchEvent(
            new CustomEvent('aem:load', { bubbles: true, detail: { fields } }),
        );
        return el;
    }

    it('renders the value matching the label', () => {
        const el = makeLabelField('Beta');
        expect(
            el.querySelector('[data-role="mas-field-content"]').textContent,
        ).to.equal('Value two');
    });

    it('renders the first item when label is Alpha', () => {
        const el = makeLabelField('Alpha');
        expect(
            el.querySelector('[data-role="mas-field-content"]').textContent,
        ).to.equal('Value one');
    });

    it('renders nothing when label is not found', () => {
        const el = makeLabelField('Nonexistent');
        expect(
            el.querySelector('[data-role="mas-field-content"]').innerHTML,
        ).to.equal('');
    });

    it('renders nothing when customFieldLabels is absent', () => {
        const el = makeLabelField('Alpha', {
            customFields: ['<p>Value one</p>'],
        });
        expect(
            el.querySelector('[data-role="mas-field-content"]').innerHTML,
        ).to.equal('');
    });

    it('handles single string values (non-array)', () => {
        const el = makeLabelField('Solo', {
            customFields: '<p>Only value</p>',
            customFieldLabels: 'Solo',
        });
        expect(
            el.querySelector('[data-role="mas-field-content"]').textContent,
        ).to.equal('Only value');
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

describe('mas-field – fragment context promo code', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    it('sets data-promotion-code and stashes compatVersion from the loaded fragment', () => {
        const el = document.createElement('mas-field');
        el.setAttribute('field', 'prices');
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);
        fragment.data = {
            id: 'fragment-id',
            fields: {
                promoCode: 'PROMO123',
                compatVersion: COMPAT_VERSION_GLOBAL_PROMO_CODE,
            },
        };
        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: { fields: { prices: '<p>$9.99</p>' } },
            }),
        );
        expect(el.getAttribute('data-promotion-code')).to.equal('PROMO123');
        expect(el.compatVersion).to.equal(COMPAT_VERSION_GLOBAL_PROMO_CODE);
    });

    it('does not set data-promotion-code when fragment has no promoCode', () => {
        const el = document.createElement('mas-field');
        el.setAttribute('field', 'prices');
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);
        fragment.data = { id: 'fragment-id', fields: {} };
        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: { fields: { prices: '<p>$9.99</p>' } },
            }),
        );
        expect(el.hasAttribute('data-promotion-code')).to.be.false;
    });
});

describe('mas-field – stamps context promo code on CTA anchors', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    const CHECKOUT_ANCHOR =
        '<a is="checkout-link" href="" data-wcs-osi="osi1" class="accent">Buy now</a>';

    function makeCtaField(field, ctasHtml, data) {
        const el = document.createElement('mas-field');
        el.setAttribute('field', field);
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);
        fragment.data = data;
        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: { fields: { ctas: ctasHtml } },
            }),
        );
        return el;
    }

    it('stamps data-promotion-code on an indexed CTA anchor when compat opts in', () => {
        const el = makeCtaField('ctas[1]', CHECKOUT_ANCHOR, {
            id: 'f1',
            fields: {
                promoCode: 'PROMO123',
                compatVersion: COMPAT_VERSION_GLOBAL_PROMO_CODE,
            },
        });
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a.getAttribute('data-promotion-code')).to.equal('PROMO123');
    });

    it('stamps data-promotion-code on a footer checkout button (non-indexed ctas)', () => {
        const el = makeCtaField('ctas', CHECKOUT_ANCHOR, {
            id: 'f1',
            fields: {
                promoCode: 'PROMO123',
                compatVersion: COMPAT_VERSION_GLOBAL_PROMO_CODE,
            },
        });
        const a = el.querySelector('[slot="footer"] a');
        expect(a.getAttribute('data-promotion-code')).to.equal('PROMO123');
    });

    it('stamps for a promo project regardless of compatVersion', () => {
        const el = makeCtaField('ctas[1]', CHECKOUT_ANCHOR, {
            id: 'f1',
            promoProject: 'promo-project',
            fields: { promoCode: 'PROMO123' },
        });
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a.getAttribute('data-promotion-code')).to.equal('PROMO123');
    });

    it('does not stamp when compat gate fails and there is no promo project', () => {
        const el = makeCtaField('ctas[1]', CHECKOUT_ANCHOR, {
            id: 'f1',
            fields: {
                promoCode: 'PROMO123',
                compatVersion: COMPAT_VERSION_GLOBAL_PROMO_CODE - 1,
            },
        });
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a.hasAttribute('data-promotion-code')).to.be.false;
    });

    it("does not overwrite an anchor's own authored promo code", () => {
        const el = makeCtaField(
            'ctas[1]',
            '<a is="checkout-link" href="" data-wcs-osi="osi1" data-promotion-code="OWN">Buy now</a>',
            {
                id: 'f1',
                fields: {
                    promoCode: 'PROMO123',
                    compatVersion: COMPAT_VERSION_GLOBAL_PROMO_CODE,
                },
            },
        );
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a.getAttribute('data-promotion-code')).to.equal('OWN');
    });

    it('does not stamp non-checkout anchors (no data-wcs-osi)', () => {
        const el = makeCtaField(
            'ctas',
            '<a href="https://example.com" class="accent">Learn more</a>',
            {
                id: 'f1',
                fields: {
                    promoCode: 'PROMO123',
                    compatVersion: COMPAT_VERSION_GLOBAL_PROMO_CODE,
                },
            },
        );
        const a = el.querySelector('[slot="footer"] a');
        expect(a.hasAttribute('data-promotion-code')).to.be.false;
    });

    it('propagates the fragment id onto the CTA anchor unconditionally', () => {
        const el = makeCtaField('ctas[1]', CHECKOUT_ANCHOR, {
            id: 'f1',
            fields: {
                promoCode: 'PROMO123',
                compatVersion: COMPAT_VERSION_GLOBAL_PROMO_CODE - 1,
            },
        });
        const a = el.querySelector('[data-role="mas-field-content"] a');
        expect(a.getAttribute('fragment-id')).to.equal('f1');
        expect(a.hasAttribute('data-promotion-code')).to.be.false;
    });

    it('resolves promo code and id after the anchor is unwrapped out of mas-field', () => {
        const el = makeCtaField('ctas[1]', CHECKOUT_ANCHOR, {
            id: 'f1',
            fields: {
                promoCode: 'PROMO123',
                compatVersion: COMPAT_VERSION_GLOBAL_PROMO_CODE,
            },
        });
        const a = el.querySelector('[data-role="mas-field-content"] a');
        document.body.append(a);
        el.remove();

        expect(a.closest('mas-field')).to.be.null;
        expect(a.getAttribute('fragment-id')).to.equal('f1');
        const options = {};
        checkoutOptionsProvider(a, options);
        expect(options.promotionCode).to.equal('PROMO123');
        a.remove();
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

    it('opts inline-prices inside mas-field into clause wrapping', () => {
        const masField = document.createElement('mas-field');
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        masField.append(inline);
        document.body.append(masField);

        const options = {};
        priceOptionsProvider(inline, options);
        expect(options.wrapClauses).to.equal(true);
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

    it('sets options.promotionCode when compatVersion opts into global promo codes', () => {
        const masField = document.createElement('mas-field');
        masField.setAttribute('data-promotion-code', 'PROMO123');
        masField.compatVersion = COMPAT_VERSION_GLOBAL_PROMO_CODE;
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        masField.append(inline);
        document.body.append(masField);

        const options = {};
        priceOptionsProvider(inline, options);
        expect(options.promotionCode).to.equal('PROMO123');
    });

    it('sets options.promotionCode for a promo project regardless of compatVersion', () => {
        const masField = document.createElement('mas-field');
        masField.setAttribute('data-promotion-code', 'PROMO123');
        masField.setAttribute('data-promotion-project', 'promo-project');
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        masField.append(inline);
        document.body.append(masField);

        const options = {};
        priceOptionsProvider(inline, options);
        expect(options.promotionCode).to.equal('PROMO123');
    });

    it('leaves options.promotionCode unset when compatVersion is below the global promo code version and there is no promo project', () => {
        const masField = document.createElement('mas-field');
        masField.setAttribute('data-promotion-code', 'PROMO123');
        masField.compatVersion = COMPAT_VERSION_GLOBAL_PROMO_CODE - 1;
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        masField.append(inline);
        document.body.append(masField);

        const options = {};
        priceOptionsProvider(inline, options);
        expect(options.promotionCode).to.be.undefined;
    });

    it('does not override an existing options.promotionCode', () => {
        const masField = document.createElement('mas-field');
        masField.setAttribute('data-promotion-code', 'PROMO123');
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        masField.append(inline);
        document.body.append(masField);

        const options = { promotionCode: 'OWN-CODE' };
        priceOptionsProvider(inline, options);
        expect(options.promotionCode).to.equal('OWN-CODE');
    });

    it('leaves options.promotionCode unset when mas-field has no promo code', () => {
        const masField = document.createElement('mas-field');
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        masField.append(inline);
        document.body.append(masField);

        const options = {};
        priceOptionsProvider(inline, options);
        expect(options.promotionCode).to.be.undefined;
    });

    it('resolves FF_DEFAULTS and promo code for a price unwrapped out of mas-field via the fragment-id marker', () => {
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        inline.setAttribute('fragment-id', 'f1');
        inline.setAttribute('data-promotion-code', 'PROMO123');
        document.body.append(inline);

        const options = {};
        priceOptionsProvider(inline, options);
        expect(options[FF_DEFAULTS]).to.equal(true);
        expect(options.promotionCode).to.equal('PROMO123');
    });

    it('stamps context onto inline-price spans rendered for a prices field', () => {
        const el = document.createElement('mas-field');
        el.setAttribute('field', 'prices');
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);
        fragment.data = {
            id: 'f1',
            fields: {
                promoCode: 'PROMO123',
                compatVersion: COMPAT_VERSION_GLOBAL_PROMO_CODE,
            },
        };
        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: {
                    fields: {
                        prices: '<span is="inline-price" data-template="price" data-wcs-osi="osi1"></span>',
                    },
                },
            }),
        );
        const span = el.querySelector(
            '[data-role="mas-field-content"] span[is="inline-price"]',
        );
        expect(span.getAttribute('data-promotion-code')).to.equal('PROMO123');
        expect(span.getAttribute('fragment-id')).to.equal('f1');
    });

    it('sets checkout options.promotionCode when compatVersion opts into global promo codes', () => {
        const masField = document.createElement('mas-field');
        masField.setAttribute('data-promotion-code', 'PROMO123');
        masField.compatVersion = COMPAT_VERSION_GLOBAL_PROMO_CODE;
        const link = document.createElement('a', { is: 'checkout-link' });
        masField.append(link);
        document.body.append(masField);

        const options = {};
        checkoutOptionsProvider(link, options);
        expect(options.promotionCode).to.equal('PROMO123');
    });

    it('leaves checkout options.promotionCode unset when compatVersion is below the global promo code version and there is no promo project', () => {
        const masField = document.createElement('mas-field');
        masField.setAttribute('data-promotion-code', 'PROMO123');
        masField.compatVersion = COMPAT_VERSION_GLOBAL_PROMO_CODE - 1;
        const link = document.createElement('a', { is: 'checkout-link' });
        masField.append(link);
        document.body.append(masField);

        const options = {};
        checkoutOptionsProvider(link, options);
        expect(options.promotionCode).to.be.undefined;
    });

    it('does not override an existing checkout options.promotionCode', () => {
        const masField = document.createElement('mas-field');
        masField.setAttribute('data-promotion-code', 'PROMO123');
        const link = document.createElement('a', { is: 'checkout-link' });
        masField.append(link);
        document.body.append(masField);

        const options = { promotionCode: 'OWN-CODE' };
        checkoutOptionsProvider(link, options);
        expect(options.promotionCode).to.equal('OWN-CODE');
    });

    it('leaves checkout options untouched for elements outside mas-field', () => {
        const link = document.createElement('a', { is: 'checkout-link' });
        document.body.append(link);

        const options = {};
        checkoutOptionsProvider(link, options);
        expect(options.promotionCode).to.be.undefined;
        expect(() => checkoutOptionsProvider(null, options)).to.not.throw();
    });

    function makeLegalField(displayPlanType) {
        const masField = document.createElement('mas-field');
        const fragment = document.createElement('aem-fragment');
        Object.defineProperty(fragment, 'data', {
            configurable: true,
            value: { settings: { displayPlanType } },
        });
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        inline.dataset.template = 'legal';
        masField.append(fragment, inline);
        document.body.append(masField);
        return inline;
    }

    it('sets displayPlanType for legal templates from the fragment setting', () => {
        const inline = makeLegalField(true);
        const options = {};
        priceOptionsProvider(inline, options);
        expect(options.displayPlanType).to.equal(true);
    });

    it('leaves displayPlanType off for legal when the fragment setting is off', () => {
        const inline = makeLegalField(false);
        const options = {};
        priceOptionsProvider(inline, options);
        expect(options.displayPlanType).to.equal(false);
    });

    it('merges the fragment price literals into options.literals', () => {
        const masField = document.createElement('mas-field');
        const fragment = document.createElement('aem-fragment');
        Object.defineProperty(fragment, 'data', {
            configurable: true,
            value: {
                priceLiterals: {
                    planTypeLabel:
                        '{planType, select, ABM {Annual, billed monthly} M2M {Monthly} other {}}',
                },
            },
        });
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        inline.dataset.template = 'legal';
        masField.append(fragment, inline);
        document.body.append(masField);
        const options = {};
        priceOptionsProvider(inline, options);
        expect(options.literals.planTypeLabel).to.contain('M2M {Monthly}');
    });

    it('defaults displayPlanType to false for legal when the setting is absent', () => {
        const masField = document.createElement('mas-field');
        masField.append(document.createElement('aem-fragment'));
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        inline.dataset.template = 'legal';
        masField.append(inline);
        document.body.append(masField);

        const options = {};
        priceOptionsProvider(inline, options);
        expect(options.displayPlanType).to.equal(false);
    });

    it('does not set displayPlanType for non-legal templates', () => {
        const masField = document.createElement('mas-field');
        const fragment = document.createElement('aem-fragment');
        Object.defineProperty(fragment, 'data', {
            configurable: true,
            value: { settings: { displayPlanType: true } },
        });
        const inline = document.createElement('span');
        inline.setAttribute('is', 'inline-price');
        inline.dataset.template = 'price';
        masField.append(fragment, inline);
        document.body.append(masField);

        const options = {};
        priceOptionsProvider(inline, options);
        expect(options.displayPlanType).to.be.undefined;
    });
});

describe('mas-field – mas:ready event', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    it('dispatches a bubbling mas:ready after rendering on aem:load', () => {
        const el = document.createElement('mas-field');
        el.setAttribute('field', 'title');
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);

        const onReady = sinon.spy();
        document.addEventListener('mas:ready', onReady, { once: true });
        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: { fields: { title: 'CC' } },
            }),
        );

        expect(onReady.calledOnce).to.be.true;
        expect(onReady.firstCall.args[0].target).to.equal(el);
    });
});

describe('mas-field – tooltip icon-button rendering', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    it('renders a serialized .icon-button as a visible info glyph with a hover tooltip', () => {
        const el = makeField(
            'shortDescription',
            '<p>terms <span class="icon-button" data-tooltip="cancel policy"></span></p>',
        );
        const btn = el.querySelector('.icon-button');
        expect(btn, 'icon-button rendered in mas-field content').to.exist;
        const svg = btn.querySelector('svg');
        expect(svg, 'info glyph SVG injected').to.exist;
        expect(
            svg.getAttribute('class') || '',
            'milo info icon class',
        ).to.contain('icon-milo-info');
        expect(
            btn.getBoundingClientRect().width,
            'glyph occupies space',
        ).to.be.greaterThan(0);
        // Tooltip popover text is driven from data-tooltip and shown on hover/focus.
        const styles = document.querySelector(
            'style[data-mas-field]',
        ).textContent;
        expect(styles).to.contain('content: attr(data-tooltip)');
        expect(styles).to.contain(':hover::before');
    });

    it('decorates the tooltip with a11y attributes and an initial placement class', () => {
        const el = makeField(
            'shortDescription',
            '<p>terms <span class="icon-button" data-tooltip="cancel policy"></span></p>',
        );
        const btn = el.querySelector('.icon-button');
        expect(btn.getAttribute('role'), 'role').to.equal('button');
        expect(btn.getAttribute('tabindex'), 'tabindex').to.equal('0');
        expect(
            btn.getAttribute('aria-label'),
            'aria-label from tooltip',
        ).to.equal('cancel policy');
        expect(
            ['top', 'bottom', 'left', 'right'].some((c) =>
                btn.classList.contains(c),
            ),
            'has a placement class',
        ).to.be.true;
        expect(
            btn.dataset.originalPosition,
            'records original position',
        ).to.be.a('string');
    });

    it('flips placement toward the viewport on hover (edge-flip)', () => {
        const el = makeField(
            'shortDescription',
            '<p><span class="icon-button" data-tooltip="a fairly long tooltip that would overflow near an edge"></span></p>',
        );
        const btn = el.querySelector('.icon-button');
        // Force the icon hard against the right edge, then trigger the show handler.
        el.style.position = 'fixed';
        el.style.left = `${window.innerWidth - 4}px`;
        el.style.top = '200px';
        btn.dispatchEvent(new Event('mouseenter'));
        expect(
            btn.classList.contains('right'),
            'not stuck on right at right edge',
        ).to.be.false;
        expect(
            ['top', 'bottom', 'left'].some((c) => btn.classList.contains(c)),
            'flipped to a fitting side',
        ).to.be.true;
    });

    // Edge-flip cases. #positionTooltip reads the icon's getBoundingClientRect
    // plus the computed ::before size; the ::before is display:none until hover so
    // its width/height resolve to non-px keywords (max-content/auto) that the code's
    // parseFloat treats as 0, leaving only its 10px+10px padding. Pinning the icon
    // with fixed positioning (margin zeroed) gives an exact 16px-wide rect, so each
    // branch is reachable at a known left/top: `vw-30` overflows right without
    // hitting the popover's own right edge, isolating the "overflow-only" and
    // "overflow+top-cutoff" branches from the corner branch.
    const TIP = 'cancellation applies within the stated policy window';
    function tooltipAt(left, top, klass = '') {
        const el = makeField(
            'shortDescription',
            `<p><span class="icon-button ${klass}" data-tooltip="${TIP}"></span></p>`,
        );
        const btn = el.querySelector('.icon-button');
        btn.style.position = 'fixed';
        btn.style.margin = '0';
        btn.style.left = `${left}px`;
        btn.style.top = `${top}px`;
        return btn;
    }
    const vw = () => window.innerWidth;
    const vh = () => window.innerHeight;
    it('flips to the right at the left edge', () => {
        const btn = tooltipAt(10, 200);
        btn.dispatchEvent(new Event('mouseenter'));
        expect(btn.classList.contains('right'), 'left edge -> right').to.be
            .true;
    });

    it('flips down when overflowing right near the top', () => {
        const btn = tooltipAt(vw() - 30, 2);
        btn.dispatchEvent(new Event('mouseenter'));
        expect(btn.classList.contains('bottom'), 'right+top -> bottom').to.be
            .true;
    });

    it('flips to the left when overflowing right in mid-viewport', () => {
        const btn = tooltipAt(vw() - 30, Math.round(vh() / 2));
        btn.dispatchEvent(new Event('mouseenter'));
        expect(btn.classList.contains('left'), 'right overflow -> left').to.be
            .true;
    });

    it('flips a top tooltip to the bottom when cut off at the top', () => {
        const btn = tooltipAt(Math.round(vw() / 2), 2);
        btn.dispatchEvent(new Event('mouseenter'));
        expect(btn.classList.contains('bottom'), 'top cutoff -> bottom').to.be
            .true;
    });

    it('flips an authored bottom tooltip to the top when cut off at the bottom', () => {
        const btn = tooltipAt(Math.round(vw() / 2), vh() - 20, 'bottom');
        expect(btn.dataset.originalPosition, 'authored bottom').to.equal(
            'bottom',
        );
        btn.dispatchEvent(new Event('mouseenter'));
        expect(btn.classList.contains('top'), 'bottom cutoff -> top').to.be
            .true;
    });

    it('restores the original placement when a flipped tooltip fits again', () => {
        const btn = tooltipAt(Math.round(vw() / 2), Math.round(vh() / 2));
        // Pretend a previous hover flipped it away from its 'top' original.
        btn.classList.remove('top');
        btn.classList.add('left');
        btn.dispatchEvent(new Event('mouseenter'));
        expect(btn.classList.contains('top'), 'restored to original').to.be
            .true;
        expect(btn.classList.contains('left'), 'stale side dropped').to.be
            .false;
    });

    it('hides the tooltip on Escape', () => {
        const btn = tooltipAt(Math.round(vw() / 2), 200);
        btn.dispatchEvent(new Event('mouseenter'));
        expect(btn.classList.contains('hide-tooltip'), 'shown on hover').to.be
            .false;
        btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(btn.classList.contains('hide-tooltip'), 'hidden on Escape').to.be
            .true;
    });
});

describe('mas-field – hideTrialCTAs setting', () => {
    const TRIAL_CTAS =
        '<a is="checkout-link" class="accent" href="" data-wcs-osi="osi1" data-analytics-id="buy-now">Buy now</a>' +
        '<a is="checkout-link" class="primary-outline" href="" data-wcs-osi="osi2" data-analytics-id="free-trial">Free trial</a>' +
        '<a is="checkout-link" class="secondary-link" href="" data-wcs-osi="osi3" data-analytics-id="start-free-trial">Start free trial</a>' +
        '<a is="checkout-link" class="accent" href="" data-wcs-osi="osi4" data-analytics-id="save-today">Save today</a>';

    afterEach(() => {
        document.body
            .querySelectorAll('mas-field')
            .forEach((el) => el.remove());
    });

    function makeField(field, ctasHtml, settings) {
        const el = document.createElement('mas-field');
        el.setAttribute('field', field);
        const fragment = document.createElement('aem-fragment');
        el.append(fragment);
        document.body.append(el);
        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: { fields: { ctas: ctasHtml }, settings },
            }),
        );
        return el;
    }

    function anchorsOf(el) {
        return [
            ...el.querySelectorAll('[data-role="mas-field-content"] a'),
        ].map((a) => a.textContent);
    }

    it('strips trial CTAs from a plain ctas field when hideTrialCTAs is true', () => {
        const el = makeField('ctas', TRIAL_CTAS, { hideTrialCTAs: true });
        expect(anchorsOf(el)).to.deep.equal(['Buy now', 'Save today']);
    });

    it('keeps every CTA when hideTrialCTAs is false', () => {
        const el = makeField('ctas', TRIAL_CTAS, { hideTrialCTAs: false });
        expect(anchorsOf(el)).to.have.lengthOf(4);
    });

    it('keeps every CTA when the setting is absent', () => {
        const el = makeField('ctas', TRIAL_CTAS, undefined);
        expect(anchorsOf(el)).to.have.lengthOf(4);
    });

    it('renders nothing when an indexed ref points at a trial CTA', () => {
        const el = makeField('ctas[2]', TRIAL_CTAS, { hideTrialCTAs: true });
        expect(anchorsOf(el)).to.be.empty;
    });

    it('does not shift indices when a trial CTA is suppressed', () => {
        const el = makeField('ctas[4]', TRIAL_CTAS, { hideTrialCTAs: true });
        expect(anchorsOf(el)).to.deep.equal(['Save today']);
    });

    it('renders a non-trial indexed CTA unchanged', () => {
        const el = makeField('ctas[1]', TRIAL_CTAS, { hideTrialCTAs: true });
        expect(anchorsOf(el)).to.deep.equal(['Buy now']);
    });

    const ALL_TRIAL_CTAS =
        '<a is="checkout-link" class="accent" href="" data-wcs-osi="osi1" data-analytics-id="free-trial">Free trial</a>' +
        '<a is="checkout-link" class="primary-outline" href="" data-wcs-osi="osi2" data-analytics-id="start-free-trial">Start free trial</a>';

    it('keeps every CTA on a plain ctas field when all of them are trials', () => {
        const el = makeField('ctas', ALL_TRIAL_CTAS, { hideTrialCTAs: true });
        expect(anchorsOf(el)).to.deep.equal(['Free trial', 'Start free trial']);
    });

    it('renders nothing for an indexed ref into an all-trial field', () => {
        const el = makeField('ctas[1]', ALL_TRIAL_CTAS, {
            hideTrialCTAs: true,
        });
        expect(anchorsOf(el)).to.be.empty;
    });
});

describe('mas-field osi getter', () => {
    it('returns the regular price OSI', () => {
        const field = document.createElement('mas-field');
        field.innerHTML =
            '<span is="inline-price" data-template="price" data-wcs-osi="REG"></span>';
        expect(field.osi).to.equal('REG');
    });

    it('falls back to the fragment osi field', () => {
        const field = document.createElement('mas-field');
        Object.defineProperty(field, 'aemFragment', {
            configurable: true,
            value: { data: { fields: { osi: 'FIELD' } } },
        });
        expect(field.osi).to.equal('FIELD');
    });
});
