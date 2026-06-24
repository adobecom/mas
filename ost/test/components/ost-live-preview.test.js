import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-placeholder-panel.js';
import { store } from '../../src/store/ost-store.js';

describe('ost-live-preview', () => {
    beforeEach(() => {
        store.selectedOffer = { offer_id: 'TEST123', offer_type: 'BASE' };
        store.selectedOsi = 'test-osi';
        store.masCommerceService = { createInlinePrice: () => document.createElement('span') };
        store.promotionCode = undefined;
        store.storedPromoOverride = undefined;
    });

    afterEach(() => {
        store.selectedOffer = undefined;
        store.selectedOsi = undefined;
        store.masCommerceService = null;
        store.promotionCode = undefined;
        store.storedPromoOverride = undefined;
        store.country = 'US';
        store.landscape = 'PUBLISHED';
    });

    async function getPreview() {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        return panel.shadowRoot.querySelector('ost-live-preview');
    }

    it('puts the context promotionCode into placeholderOptions when no override is set', async () => {
        store.promotionCode = 'CONTEXT30';
        const preview = await getPreview();
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions.promotionCode).to.equal('CONTEXT30');
    });

    it('prefers the typed override over the context promotionCode', async () => {
        store.promotionCode = 'CONTEXT30';
        store.setPromoCode('MANUAL10');
        const preview = await getPreview();
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions.promotionCode).to.equal('MANUAL10');
    });

    it('passes the store country into placeholderOptions', async () => {
        store.country = 'GB';
        const preview = await getPreview();
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions.country).to.equal('GB');
    });

    it('enables mas-ff-defaults so the preview resolves geo defaults (e.g. DE tax label)', async () => {
        const preview = await getPreview();
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions['mas-ff-defaults']).to.equal(true);
    });

    it('passes the store landscape into placeholderOptions', async () => {
        store.landscape = 'DRAFT';
        const preview = await getPreview();
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions.landscape).to.equal('DRAFT');
    });

    it('passes the single promo OSI for a discount on a PROMOTION offer without reference OSI', async () => {
        store.selectedOffer = { offer_id: 'PROMO1', offer_type: 'PROMOTION' };
        const preview = await getPreview();
        preview.placeholderType = 'discount';
        preview.referenceOsi = '';
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions.wcsOsi).to.deep.equal(['test-osi']);
    });

    it('never shows the reference-OSI hint (discount is automatic now)', async () => {
        store.selectedOffer = { offer_id: 'BASE1', offer_type: 'BASE' };
        const preview = await getPreview();
        preview.placeholderType = 'discount';
        preview.referenceOsi = '';
        await preview.updateComplete;
        expect(Boolean(preview.shadowRoot.querySelector('.discount-hint'))).to.be.false;
    });

    it('renders a static 0% discount for a plain BASE offer', async () => {
        store.selectedOffer = { offer_id: 'BASE1', offer_type: 'BASE' };
        const preview = await getPreview();
        preview.placeholderType = 'discount';
        preview.referenceOsi = '';
        await preview.updateComplete;
        const node = preview.shadowRoot.querySelector('[data-testid="ost-preview-container"] .discount');
        expect(node).to.exist;
        expect(node.textContent.trim()).to.equal('0%');
    });

    it('keeps the static 0% discount after selecting a different plain offer', async () => {
        store.selectedOffer = { offer_id: 'BASE1', offer_type: 'BASE' };
        const preview = await getPreview();
        preview.placeholderType = 'discount';
        preview.referenceOsi = '';
        await preview.updateComplete;
        store.setOffer({ offer_id: 'BASE2', offer_type: 'BASE' });
        store.setOsi('test-osi-2');
        await preview.updateComplete;
        const node = preview.shadowRoot.querySelector('[data-testid="ost-preview-container"] .discount');
        expect(node).to.exist;
        expect(node.textContent.trim()).to.equal('0%');
    });

    it('keeps the 0% after switching from a promo offer (inline-price node) to a plain offer', async () => {
        store.masCommerceService = { createInlinePrice: () => document.createElement('span') };
        store.selectedOffer = { offer_id: 'PROMO1', offer_type: 'PROMOTION' };
        const preview = await getPreview();
        preview.placeholderType = 'discount';
        preview.referenceOsi = '';
        await preview.updateComplete;
        preview.offer = { offer_id: 'BASE2', offer_type: 'BASE' };
        preview.osi = 'test-osi-2';
        preview.requestUpdate();
        await preview.updateComplete;
        const node = preview.shadowRoot.querySelector('[data-testid="ost-preview-container"] .discount');
        expect(node).to.exist;
        expect(node.textContent.trim()).to.equal('0%');
    });

    it('renders the resolved inline-price discount node for a PROMOTION offer (no static 0%)', async () => {
        store.selectedOffer = { offer_id: 'PROMO1', offer_type: 'PROMOTION' };
        store.masCommerceService = {
            createInlinePrice: () => {
                const span = document.createElement('span');
                span.dataset.fromService = 'true';
                return span;
            },
        };
        const preview = await getPreview();
        preview.placeholderType = 'discount';
        preview.referenceOsi = '';
        await preview.updateComplete;
        const node = preview.shadowRoot.querySelector('[data-testid="ost-preview-container"] span');
        expect(node?.dataset.fromService).to.equal('true');
    });

    it('renders a static 0% discount for a TRIAL offer (a free trial has no discount delta)', async () => {
        store.selectedOffer = { offer_id: 'TRIAL1', offer_type: 'TRIAL' };
        const preview = await getPreview();
        preview.placeholderType = 'discount';
        preview.referenceOsi = '';
        await preview.updateComplete;
        const node = preview.shadowRoot.querySelector('[data-testid="ost-preview-container"] .discount');
        expect(node).to.exist;
        expect(node.textContent.trim()).to.equal('0%');
    });

    it('still honors a manual reference OSI for the discount preview', async () => {
        store.selectedOffer = { offer_id: 'BASE1', offer_type: 'BASE' };
        const preview = await getPreview();
        preview.placeholderType = 'discount';
        preview.referenceOsi = 'ref-osi-123';
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions.wcsOsi).to.deep.equal(['test-osi', 'ref-osi-123']);
    });

    it('passes [promo, reference] OSIs for a discount when referenceOsi is set', async () => {
        store.selectedOffer = { offer_id: 'PROMO1', offer_type: 'PROMOTION' };
        const preview = await getPreview();
        preview.placeholderType = 'discount';
        preview.referenceOsi = 'ref-osi-123';
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions.wcsOsi).to.deep.equal(['test-osi', 'ref-osi-123']);
    });

    it('builds options for a placeholder type that has no overrides (|| {} branch)', async () => {
        const preview = await getPreview();
        preview.placeholderType = 'price';
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions).to.exist;
        expect(result.placeholderOptions.template).to.equal('price');
    });

    it('sets the legal template and its displayPlanType override for the legal type', async () => {
        const preview = await getPreview();
        preview.placeholderType = 'legal';
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions.template).to.equal('legal');
        expect(result.placeholderOptions.displayPlanType).to.equal(true);
    });

    it('hides the recurrence and tax-inclusivity labels in a strikethrough preview', async () => {
        store.masCommerceService = {
            createInlinePrice: () => {
                const node = document.createElement('span');
                node.className = 'price price-strikethrough';
                node.innerHTML =
                    '<span class="price-integer">9</span>' +
                    '<span class="price-recurrence">/mo</span>' +
                    '<span class="price-tax-inclusivity">excl. VAT</span>';
                return node;
            },
        };
        const preview = await getPreview();
        preview.placeholderType = 'strikethrough';
        await preview.updateComplete;

        const container = preview.shadowRoot.querySelector('.placeholder-container');
        const recurrence = container.querySelector('span.price-recurrence');
        const tax = container.querySelector('span.price-tax-inclusivity');
        const integer = container.querySelector('span.price-integer');

        expect(getComputedStyle(recurrence).display).to.equal('none');
        expect(getComputedStyle(tax).display).to.equal('none');
        expect(getComputedStyle(integer).display).to.not.equal('none');
    });

    it('keeps the strikethrough price number visible while hiding recurrence/tax labels', async () => {
        store.masCommerceService = {
            createInlinePrice: () => {
                const node = document.createElement('span');
                node.className = 'price price-strikethrough';
                node.innerHTML =
                    '<span class="price-integer">9</span>' +
                    '<span class="price-recurrence">/mo</span>' +
                    '<span class="price-tax-inclusivity">excl. VAT</span>';
                return node;
            },
        };
        const preview = await getPreview();
        preview.placeholderType = 'strikethrough';
        await preview.updateComplete;

        const container = preview.shadowRoot.querySelector('.placeholder-container');
        const integer = container.querySelector('span.price-integer');
        const recurrence = container.querySelector('span.price-recurrence');

        expect(getComputedStyle(integer).display).to.not.equal('none');
        expect(getComputedStyle(recurrence).display).to.equal('none');
    });

    it('clips the sr-only aria label so it is not visible in the strikethrough preview', async () => {
        store.masCommerceService = {
            createInlinePrice: () => {
                const node = document.createElement('span');
                node.className = 'price price-strikethrough';
                node.innerHTML =
                    '<sr-only class="strikethrough-aria-label">Regularly at </sr-only>' +
                    '<span class="price-integer">9</span>';
                return node;
            },
        };
        const preview = await getPreview();
        preview.placeholderType = 'strikethrough';
        await preview.updateComplete;

        const container = preview.shadowRoot.querySelector('.placeholder-container');
        const srOnly = container.querySelector('sr-only');
        const integer = container.querySelector('span.price-integer');
        const styles = getComputedStyle(srOnly);

        expect(styles.position).to.equal('absolute');
        expect(styles.width).to.equal('1px');
        expect(styles.height).to.equal('1px');
        expect(getComputedStyle(integer).display).to.not.equal('none');
    });

    it('U5: builds price options with the selected OSI and template=price', async () => {
        const preview = await getPreview();
        preview.placeholderType = 'price';

        const result = preview.buildPlaceholderOptions();

        expect(result.placeholderOptions.template).to.equal('price');
        expect(result.placeholderOptions.wcsOsi).to.deep.equal(['test-osi']);
        expect(result.placeholderOptions.template).to.not.equal('optical');
    });

    it('U5: sets data-template only for non-price types', async () => {
        store.masCommerceService = {
            createInlinePrice: () => {
                const node = document.createElement('span');
                node.className = 'price';
                return node;
            },
            createCheckoutButton: () => document.createElement('button'),
            createCheckoutLink: () => document.createElement('a'),
        };
        const preview = await getPreview();

        preview.placeholderType = 'price';
        await preview.updateComplete;
        const priceContainer = preview.shadowRoot.querySelector('.placeholder-container');
        const priceNode = priceContainer.querySelector('span.price');
        expect(priceNode).to.exist;
        expect(priceNode.dataset.template).to.equal(undefined);

        preview.placeholderType = 'optical';
        await preview.updateComplete;
        const opticalContainer = preview.shadowRoot.querySelector('.placeholder-container');
        const opticalNode = opticalContainer.querySelector('span.price');
        expect(opticalNode).to.exist;
        expect(opticalNode.dataset.template).to.equal('optical');
    });

    it('U6: sets template=optical and tags the optical node with data-template', async () => {
        store.masCommerceService = {
            createInlinePrice: () => {
                const node = document.createElement('span');
                node.className = 'price';
                return node;
            },
            createCheckoutButton: () => document.createElement('button'),
            createCheckoutLink: () => document.createElement('a'),
        };
        const preview = await getPreview();
        preview.placeholderType = 'optical';

        const result = preview.buildPlaceholderOptions();
        await preview.updateComplete;
        const container = preview.shadowRoot.querySelector('.placeholder-container');
        const node = container.querySelector('span.price');

        expect(result.placeholderOptions.template).to.equal('optical');
        expect(node.dataset.template).to.equal('optical');
        expect(node.dataset.template).to.not.equal('price');
    });

    it('U6: sets template=annual and tags the annual node with data-template', async () => {
        store.masCommerceService = {
            createInlinePrice: () => {
                const node = document.createElement('span');
                node.className = 'price';
                return node;
            },
            createCheckoutButton: () => document.createElement('button'),
            createCheckoutLink: () => document.createElement('a'),
        };
        const preview = await getPreview();
        preview.placeholderType = 'annual';

        const result = preview.buildPlaceholderOptions();
        await preview.updateComplete;
        const container = preview.shadowRoot.querySelector('.placeholder-container');
        const node = container.querySelector('span.price');

        expect(result.placeholderOptions.template).to.equal('annual');
        expect(node.dataset.template).to.equal('annual');
        expect(node.dataset.template).to.not.equal('price');
    });

    it('U8: tags the promo-strikethrough node with data-template and strikes it through', async () => {
        store.masCommerceService = {
            createInlinePrice: () => {
                const node = document.createElement('span');
                node.className = 'placeholder-resolved';
                node.textContent = '$9.99';
                return node;
            },
            createCheckoutButton: () => document.createElement('button'),
            createCheckoutLink: () => document.createElement('a'),
        };
        const preview = await getPreview();
        preview.placeholderType = 'promo-strikethrough';
        await preview.updateComplete;

        const container = preview.shadowRoot.querySelector('.placeholder-container');
        const node = container.querySelector('span.placeholder-resolved');

        expect(node.dataset.template).to.equal('promo-strikethrough');
        expect(getComputedStyle(node).textDecorationLine).to.equal('line-through');
    });

    it('U8: does not strike through a plain price node', async () => {
        store.masCommerceService = {
            createInlinePrice: () => {
                const node = document.createElement('span');
                node.className = 'placeholder-resolved';
                node.textContent = '$9.99';
                return node;
            },
            createCheckoutButton: () => document.createElement('button'),
            createCheckoutLink: () => document.createElement('a'),
        };
        const preview = await getPreview();
        preview.placeholderType = 'price';
        await preview.updateComplete;

        const container = preview.shadowRoot.querySelector('.placeholder-container');
        const node = container.querySelector('span.placeholder-resolved');

        expect(getComputedStyle(node).textDecorationLine).to.not.equal('line-through');
    });

    it('U11: calls createCheckoutButton and renders a button for checkoutUrl', async () => {
        const calls = [];
        store.masCommerceService = {
            createInlinePrice: () => {
                calls.push('createInlinePrice');
                return document.createElement('span');
            },
            createCheckoutButton: () => {
                calls.push('createCheckoutButton');
                return document.createElement('button');
            },
            createCheckoutLink: () => {
                calls.push('createCheckoutLink');
                return document.createElement('a');
            },
        };
        const preview = await getPreview();
        preview.placeholderType = 'checkoutUrl';
        await preview.updateComplete;
        calls.length = 0;
        preview.requestUpdate();
        await preview.updateComplete;

        const container = preview.shadowRoot.querySelector('.placeholder-container');
        const button = container.querySelector('button');

        expect(calls).to.include('createCheckoutButton');
        expect(calls).to.not.include('createInlinePrice');
        expect(button).to.exist;
        preview.placeholderType = 'price';
        await preview.updateComplete;
    });

    it('U11: falls back to createCheckoutLink when no button factory exists', async () => {
        const calls = [];
        store.masCommerceService = {
            createInlinePrice: () => {
                calls.push('createInlinePrice');
                return document.createElement('span');
            },
            createCheckoutLink: () => {
                calls.push('createCheckoutLink');
                return document.createElement('a');
            },
        };
        const preview = await getPreview();
        preview.placeholderType = 'checkoutUrl';
        await preview.updateComplete;
        calls.length = 0;
        preview.requestUpdate();
        await preview.updateComplete;

        const container = preview.shadowRoot.querySelector('.placeholder-container');
        const link = container.querySelector('a');

        expect(calls).to.include('createCheckoutLink');
        expect(calls).to.not.include('createInlinePrice');
        expect(link).to.exist;
        preview.placeholderType = 'price';
        await preview.updateComplete;
    });

    it('U14: includes both country and landscape from the store in placeholderOptions', async () => {
        store.country = 'DE';
        store.landscape = 'DRAFT';
        const preview = await getPreview();
        preview.placeholderType = 'price';

        const result = preview.buildPlaceholderOptions();

        expect(result.placeholderOptions.country).to.equal('DE');
        expect(result.placeholderOptions.landscape).to.equal('DRAFT');
    });

    it('U14: re-renders the preview node when the store country changes', async () => {
        const seenCountries = [];
        store.country = 'US';
        store.landscape = 'PUBLISHED';
        store.masCommerceService = {
            createInlinePrice: (options) => {
                seenCountries.push(options.country);
                const node = document.createElement('span');
                node.className = 'price';
                return node;
            },
            createCheckoutButton: () => document.createElement('button'),
            createCheckoutLink: () => document.createElement('a'),
        };
        const preview = await getPreview();
        preview.placeholderType = 'price';
        await preview.updateComplete;

        store.setCountry('FR');
        await preview.updateComplete;

        expect(seenCountries).to.include('FR');
        expect(seenCountries[seenCountries.length - 1]).to.not.equal('US');
    });
});
