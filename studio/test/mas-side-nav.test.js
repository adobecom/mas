import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { render } from 'lit';
import Store from '../src/store.js';
import Events from '../src/events.js';
import { CARD_MODEL_PATH, PAGE_NAMES } from '../src/constants.js';
import '../src/mas-side-nav.js';

function mockFragment(fields = [], overrides = {}) {
    const fragment = {
        id: 'frag-123',
        model: { path: CARD_MODEL_PATH },
        title: 'Test Card',
        ...overrides,
    };
    fragment.fields = overrides.fields ?? fields;
    fragment.isValueEmpty = (val) => !val || val.length === 0 || val.every((v) => !v);
    fragment.getField = (name) => fragment.fields.find((f) => f.name === name) || null;
    fragment.getTagTitle = () => null;
    return fragment;
}

function mockEditor(fragment = null, previewFragment = null, options = {}) {
    const { isVariation = false, localeDefaultFragment = null } = options;
    return {
        fragment,
        fragmentStore: previewFragment ? { previewStore: { value: previewFragment } } : null,
        localeDefaultFragment,
        editorContextStore: { isVariation: () => isVariation },
    };
}

describe('MasSideNav – Copy Field', () => {
    let sandbox;
    let el;
    let editorStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        editorStub = sandbox.stub(document, 'querySelector');
        editorStub.callThrough();
        el = document.createElement('mas-side-nav');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('copyableFields', () => {
        it('should return empty array when no fragment editor exists', () => {
            editorStub.withArgs('mas-fragment-editor').returns(null);
            expect(el.copyableFields).to.deep.equal([]);
        });

        it('should return empty array when fragment has no fields', () => {
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(mockFragment()));
            expect(el.copyableFields).to.deep.equal([]);
        });

        it('should filter out empty-value fields', () => {
            const fragment = mockFragment([
                { name: 'cardTitle', values: ['Creative Cloud'] },
                { name: 'description', values: [] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const names = el.copyableFields.map((f) => f.name);
            expect(names).to.include('cardTitle');
            expect(names).to.not.include('description');
        });

        it('should include only allowlisted copy fields', () => {
            const fragment = mockFragment([
                { name: 'prices', values: ['US$9.99/mo'] },
                { name: 'cardTitle', values: ['Creative Cloud'] },
                { name: 'title', values: ['Creative Cloud Collection'] },
                { name: 'description', values: ['Create anything'] },
                { name: 'shortDescription', values: ['Short summary'] },
                { name: 'promoText', values: ['Save 50%'] },
                { name: 'callout', values: ['Limited time'] },
                { name: 'subtitle', values: ['For teams'] },
                { name: 'ctas', values: ['<a>Buy</a>'] },
                { name: 'cta', values: ['Buy now'] },
                { name: 'quantitySelect', values: ['true'] },
                { name: 'perUnitLabel', values: ['{perUnit, select, LICENSE {per lic} other {}}'] },
                { name: 'variant', values: ['plans'] },
                { name: 'osi', values: ['K79yhO4'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const names = el.copyableFields.map((f) => f.name);
            expect(names).to.include('prices');
            expect(names).to.include('cardTitle');
            expect(names).to.include('title');
            expect(names).to.include('description');
            expect(names).to.include('shortDescription');
            expect(names).to.include('promoText');
            expect(names).to.include('callout');
            expect(names).to.include('subtitle');
            expect(names).to.include('ctas');
            expect(names).to.not.include('cta');
            expect(names).to.not.include('quantitySelect');
            expect(names).to.not.include('perUnitLabel');
            expect(names).to.not.include('variant');
            expect(names).to.not.include('osi');
        });

        it('should not include mapped fields that are not allowlisted', () => {
            const fragment = mockFragment([
                { name: 'variant', values: ['plans'] },
                { name: 'osi', values: ['K79yhO4'] },
                { name: 'ctas', values: ['<a>Buy</a>'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const map = Object.fromEntries(el.copyableFields.map((f) => [f.name, f.displayName]));
            expect(map.ctas).to.equal('CTAs');
            expect(map.variant).to.be.undefined;
            expect(map.osi).to.be.undefined;
        });

        it('should fall back to camelToTitle for unmapped fields', () => {
            const fragment = mockFragment([
                { name: 'cardTitle', values: ['Creative Cloud'] },
                { name: 'borderColor', values: ['#fff'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const map = Object.fromEntries(el.copyableFields.map((f) => [f.name, f.displayName]));
            expect(map.cardTitle).to.equal('Card Title');
            expect(map.borderColor).to.be.undefined;
        });

        it('should use previewValue pipeline for prices like other fields', () => {
            const fragment = mockFragment([{ name: 'prices', values: ['<span is="inline-price">placeholder</span>'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const priceField = el.copyableFields.find((f) => f.name === 'prices');
            expect(priceField.preview).to.equal('placeholder');
        });

        it('should use resolved preview-store value for placeholder-backed fields', () => {
            const sourceFragment = mockFragment([{ name: 'description', values: ['{{checkout-now}}'] }]);
            const previewFragment = mockFragment([{ name: 'description', values: ['Buy now'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(sourceFragment, previewFragment));

            const descriptionField = el.copyableFields.find((f) => f.name === 'description');
            expect(descriptionField.preview).to.equal('Buy now');
        });

        it('should fall back to source values when preview-store field is missing', () => {
            const sourceFragment = mockFragment([{ name: 'description', values: ['{{checkout-now}}'] }]);
            const previewFragment = mockFragment([{ name: 'ctas', values: ['<a>Buy now</a>'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(sourceFragment, previewFragment));

            const descriptionField = el.copyableFields.find((f) => f.name === 'description');
            expect(descriptionField.preview).to.equal('{{checkout-now}}');
        });

        it('should use preview-store values for prices like other fields', () => {
            const sourceFragment = mockFragment([{ name: 'prices', values: ['<span is="inline-price">raw</span>'] }]);
            const previewFragment = mockFragment([{ name: 'prices', values: ['<span is="inline-price">US$39.99/mo</span>'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(sourceFragment, previewFragment));

            const priceField = el.copyableFields.find((f) => f.name === 'prices');
            expect(priceField.preview).to.equal('US$39.99/mo');
        });

        it('should fall back to previewValue for prices when no resolved text', () => {
            const fragment = mockFragment([{ name: 'prices', values: ['<span>$9.99/mo</span>'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            el.resolvedPriceText = '';
            const priceField = el.copyableFields.find((f) => f.name === 'prices');
            expect(priceField.preview).to.equal('$9.99/mo');
        });

        it('should preserve locale-driven tax label rendered on the price (e.g. FR_fr "TTC")', () => {
            // Reproduces MWPW-193548: the source span has no data-display-tax,
            // but the rendered preview shows the locale-default tax label.
            // The Copy Field popover preview must mirror the rendered output.
            const sourceFragment = mockFragment([
                {
                    name: 'prices',
                    values: ['<p><span is="inline-price" data-template="price" data-wcs-osi="abc"></span></p>'],
                },
            ]);
            const previewFragment = mockFragment([
                {
                    name: 'prices',
                    values: ['<p><span is="inline-price" data-template="price" data-wcs-osi="abc"></span></p>'],
                },
            ]);
            const editor = mockEditor(sourceFragment, previewFragment);
            const card = document.createElement('merch-card');
            const resolvedPrice = document.createElement('span');
            resolvedPrice.setAttribute('is', 'inline-price');
            resolvedPrice.setAttribute('data-template', 'price');
            resolvedPrice.setAttribute('data-wcs-osi', 'abc');
            const priceInner = document.createElement('span');
            priceInner.className = 'price';
            priceInner.append(document.createTextNode('26,21 €/mois'));
            const taxLabel = document.createElement('span');
            taxLabel.className = 'price-tax-inclusivity';
            taxLabel.textContent = 'TTC';
            priceInner.append(taxLabel);
            resolvedPrice.append(priceInner);
            card.append(resolvedPrice);
            editor.querySelector = sandbox.stub().withArgs('merch-card').returns(card);
            editorStub.withArgs('mas-fragment-editor').returns(editor);

            const priceField = el.copyableFields.find((f) => f.name === 'prices');
            expect(priceField.preview).to.include('TTC');
            expect(priceField.preview).to.include('26,21');
        });

        it('should resolve inline-price tokens inside description from rendered preview card', () => {
            const sourceFragment = mockFragment([
                {
                    name: 'description',
                    values: ['<p>Save <span is="inline-price" data-template="price" data-wcs-osi="abc"></span>/mo</p>'],
                },
            ]);
            const previewFragment = mockFragment([
                {
                    name: 'description',
                    values: ['<p>Save <span is="inline-price" data-template="price" data-wcs-osi="abc"></span>/mo</p>'],
                },
            ]);
            const editor = mockEditor(sourceFragment, previewFragment);
            const card = document.createElement('merch-card');
            const resolvedPrice = document.createElement('span');
            resolvedPrice.setAttribute('is', 'inline-price');
            resolvedPrice.setAttribute('data-template', 'price');
            resolvedPrice.setAttribute('data-wcs-osi', 'abc');
            resolvedPrice.textContent = 'US$99.99';
            card.append(resolvedPrice);
            editor.querySelector = sandbox.stub().withArgs('merch-card').returns(card);
            editorStub.withArgs('mas-fragment-editor').returns(editor);

            const descriptionField = el.copyableFields.find((f) => f.name === 'description');
            expect(descriptionField.preview).to.equal('Save US$99.99/mo');
        });

        it('should resolve multiple inline-price tokens by attributes, not DOM order', () => {
            const sourceFragment = mockFragment([
                {
                    name: 'description',
                    values: [
                        '<p><span is="inline-price" data-template="strikethrough" data-wcs-osi="abc"></span> then <span is="inline-price" data-template="price" data-wcs-osi="abc"></span></p>',
                    ],
                },
            ]);
            const previewFragment = mockFragment([
                {
                    name: 'description',
                    values: [
                        '<p><span is="inline-price" data-template="strikethrough" data-wcs-osi="abc"></span> then <span is="inline-price" data-template="price" data-wcs-osi="abc"></span></p>',
                    ],
                },
            ]);
            const editor = mockEditor(sourceFragment, previewFragment);
            const card = document.createElement('merch-card');

            // Intentionally reverse order to ensure matching is attribute-based.
            const currentPrice = document.createElement('span');
            currentPrice.setAttribute('is', 'inline-price');
            currentPrice.setAttribute('data-template', 'price');
            currentPrice.setAttribute('data-wcs-osi', 'abc');
            const currentInner = document.createElement('span');
            currentInner.className = 'price price-alternative';
            currentInner.textContent = 'US$99.99';
            currentPrice.append(currentInner);

            const oldPrice = document.createElement('span');
            oldPrice.setAttribute('is', 'inline-price');
            oldPrice.setAttribute('data-template', 'strikethrough');
            oldPrice.setAttribute('data-wcs-osi', 'abc');
            const oldInner = document.createElement('span');
            oldInner.className = 'price price-strikethrough';
            oldInner.textContent = 'US$199.99';
            oldPrice.append(oldInner);

            card.append(currentPrice, oldPrice);
            editor.querySelector = sandbox.stub().withArgs('merch-card').returns(card);
            editorStub.withArgs('mas-fragment-editor').returns(editor);

            const descriptionField = el.copyableFields.find((f) => f.name === 'description');
            expect(descriptionField.preview).to.equal('<s>US$199.99</s> then US$99.99');
        });

        it('should preserve strikethrough preview segments when old price is resolved', () => {
            const sourceFragment = mockFragment([
                {
                    name: 'description',
                    values: [
                        '<p><span is="inline-price" data-template="strikethrough" data-wcs-osi="abc"></span> and <span is="inline-price" data-template="price" data-wcs-osi="abc"></span></p>',
                    ],
                },
            ]);
            const previewFragment = mockFragment([
                {
                    name: 'description',
                    values: [
                        '<p><span is="inline-price" data-template="strikethrough" data-wcs-osi="abc"></span> and <span is="inline-price" data-template="price" data-wcs-osi="abc"></span></p>',
                    ],
                },
            ]);
            const editor = mockEditor(sourceFragment, previewFragment);
            const card = document.createElement('merch-card');

            const oldPrice = document.createElement('span');
            oldPrice.setAttribute('is', 'inline-price');
            oldPrice.setAttribute('data-template', 'strikethrough');
            oldPrice.setAttribute('data-wcs-osi', 'abc');
            const oldInner = document.createElement('span');
            oldInner.className = 'price price-strikethrough';
            oldInner.textContent = 'US$199.99';
            oldPrice.append(oldInner);

            const currentPrice = document.createElement('span');
            currentPrice.setAttribute('is', 'inline-price');
            currentPrice.setAttribute('data-template', 'price');
            currentPrice.setAttribute('data-wcs-osi', 'abc');
            const currentInner = document.createElement('span');
            currentInner.className = 'price';
            currentInner.textContent = 'US$99.99';
            currentPrice.append(currentInner);

            card.append(oldPrice, currentPrice);
            editor.querySelector = sandbox.stub().withArgs('merch-card').returns(card);
            editorStub.withArgs('mas-fragment-editor').returns(editor);

            const descriptionField = el.copyableFields.find((f) => f.name === 'description');
            expect(descriptionField.preview).to.equal('<s>US$199.99</s> and US$99.99');
        });

        it('should not include accessibility aria labels from inline-price in description preview', () => {
            const sourceFragment = mockFragment([
                {
                    name: 'description',
                    values: [
                        '<p><span is="inline-price" data-template="strikethrough" data-wcs-osi="abc"></span> then <span is="inline-price" data-template="price" data-wcs-osi="abc"></span></p>',
                    ],
                },
            ]);
            const previewFragment = mockFragment([
                {
                    name: 'description',
                    values: [
                        '<p><span is="inline-price" data-template="strikethrough" data-wcs-osi="abc"></span> then <span is="inline-price" data-template="price" data-wcs-osi="abc"></span></p>',
                    ],
                },
            ]);
            const editor = mockEditor(sourceFragment, previewFragment);
            const card = document.createElement('merch-card');

            const oldPrice = document.createElement('span');
            oldPrice.setAttribute('is', 'inline-price');
            oldPrice.setAttribute('data-template', 'strikethrough');
            oldPrice.setAttribute('data-wcs-osi', 'abc');
            const oldPriceAria = document.createElement('sr-only');
            oldPriceAria.className = 'strikethrough-aria-label';
            oldPriceAria.textContent = 'Regularly at ';
            const oldPriceVisible = document.createElement('span');
            oldPriceVisible.className = 'price price-strikethrough';
            oldPriceVisible.textContent = 'US$199.99';
            oldPrice.append(oldPriceAria, oldPriceVisible);

            const currentPrice = document.createElement('span');
            currentPrice.setAttribute('is', 'inline-price');
            currentPrice.setAttribute('data-template', 'price');
            currentPrice.setAttribute('data-wcs-osi', 'abc');
            const currentPriceVisible = document.createElement('span');
            currentPriceVisible.className = 'price';
            currentPriceVisible.textContent = 'US$99.99';
            currentPrice.append(currentPriceVisible);

            card.append(oldPrice, currentPrice);
            editor.querySelector = sandbox.stub().withArgs('merch-card').returns(card);
            editorStub.withArgs('mas-fragment-editor').returns(editor);

            const descriptionField = el.copyableFields.find((f) => f.name === 'description');
            expect(descriptionField.preview).to.equal('<s>US$199.99</s> then US$99.99');
            expect(descriptionField.preview).to.not.include('Regularly at');
        });

        it('should include non-empty inherited base fields for variations', () => {
            const sourceFragment = mockFragment(
                [
                    { name: 'cardTitle', values: ['Creative Cloud ARG'] },
                    { name: 'showSecureLabel', values: ['true'] },
                ],
                { id: 'variation-123' },
            );
            const baseFragment = mockFragment(
                [
                    { name: 'cardTitle', values: ['Creative Cloud'] },
                    { name: 'description', values: ['{{secure-label}}'] },
                    { name: 'ctas', values: ['<strong><a href="/plans">Buy now</a></strong>'] },
                    { name: 'subtitle', values: ['creativity and design'] },
                ],
                { id: 'base-123' },
            );
            const previewFragment = mockFragment([{ name: 'description', values: ['Secure transaction'] }], {
                id: 'variation-123',
            });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(
                    mockEditor(sourceFragment, previewFragment, { isVariation: true, localeDefaultFragment: baseFragment }),
                );

            const fields = el.copyableFields;
            const inheritedNames = fields.filter((f) => f.source === 'inherited').map((f) => f.name);
            expect(inheritedNames).to.include('description');
            expect(inheritedNames).to.include('ctas');
            expect(inheritedNames).to.include('subtitle');
            expect(inheritedNames).to.not.include('cardTitle');
            expect(fields.find((f) => f.name === 'description').preview).to.equal('Secure transaction');
            expect(fields.find((f) => f.name === 'subtitle').preview).to.equal('creativity and design');
        });

        it('should exclude non-allowlisted inherited fields', () => {
            const sourceFragment = mockFragment([{ name: 'cardTitle', values: ['Variation title'] }], { id: 'variation-123' });
            const baseFragment = mockFragment(
                [
                    { name: 'description', values: ['Included description'] },
                    { name: 'quantitySelect', values: ['true'] },
                    { name: 'perUnitLabel', values: ['per license'] },
                    { name: 'showPlanType', values: ['true'] },
                ],
                { id: 'base-123' },
            );
            const previewFragment = mockFragment([{ name: 'description', values: ['Resolved description'] }], {
                id: 'variation-123',
            });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(
                    mockEditor(sourceFragment, previewFragment, { isVariation: true, localeDefaultFragment: baseFragment }),
                );

            const names = el.copyableFields.map((f) => f.name);
            expect(names).to.include('description');
            expect(names).to.not.include('quantitySelect');
            expect(names).to.not.include('perUnitLabel');
            expect(names).to.not.include('showPlanType');
        });

        it('should return only current fields when variation base fragment has no fields', () => {
            const variationFragment = mockFragment([{ name: 'cardTitle', values: ['Variation'] }], {
                id: 'variation-123',
            });
            const baseFragment = mockFragment([], { id: 'base-123' });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(mockEditor(variationFragment, null, { isVariation: true, localeDefaultFragment: baseFragment }));
            const fields = el.copyableFields;
            expect(fields.every((f) => f.source === 'current')).to.be.true;
            expect(fields.some((f) => f.name === 'cardTitle')).to.be.true;
        });
    });

    describe('copyableCtas', () => {
        it('should return empty arrays when no fragment editor', () => {
            editorStub.withArgs('mas-fragment-editor').returns(null);
            expect(el.copyableCtas).to.deep.equal({ current: [], inherited: [] });
        });

        it('should return current CTAs for non-variation fragment', () => {
            const fragment = mockFragment([{ name: 'ctas', values: ['<a href="/buy">Buy now</a>'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const { current, inherited } = el.copyableCtas;
            expect(current).to.have.length(1);
            expect(current[0].text).to.equal('Buy now');
            expect(current[0].href).to.equal('/buy');
            expect(current[0].index).to.equal(1);
            expect(current[0].source).to.equal('current');
            expect(inherited).to.have.length(0);
        });

        it('should return inherited CTAs for variation with empty current ctas', () => {
            const variationFragment = mockFragment([], { id: 'variation-123' });
            const baseFragment = mockFragment([{ name: 'ctas', values: ['<a href="/base">Base CTA</a>'] }], { id: 'base-123' });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(mockEditor(variationFragment, null, { isVariation: true, localeDefaultFragment: baseFragment }));
            const { current, inherited } = el.copyableCtas;
            expect(current).to.have.length(0);
            expect(inherited).to.have.length(1);
            expect(inherited[0].text).to.equal('Base CTA');
            expect(inherited[0].source).to.equal('inherited');
            expect(inherited[0].index).to.equal(1);
        });

        it('should return current CTAs and no inherited when variation has its own CTAs', () => {
            const variationFragment = mockFragment([{ name: 'ctas', values: ['<a href="/v">Variation CTA</a>'] }], {
                id: 'variation-123',
            });
            const baseFragment = mockFragment([{ name: 'ctas', values: ['<a href="/base">Base CTA</a>'] }], { id: 'base-123' });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(mockEditor(variationFragment, null, { isVariation: true, localeDefaultFragment: baseFragment }));
            const { current, inherited } = el.copyableCtas;
            expect(current).to.have.length(1);
            expect(current[0].href).to.equal('/v');
            expect(inherited).to.have.length(0);
        });

        it('should return empty arrays when fragment has no ctas field', () => {
            const fragment = mockFragment([{ name: 'cardTitle', values: ['Title'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const { current, inherited } = el.copyableCtas;
            expect(current).to.have.length(0);
            expect(inherited).to.have.length(0);
        });

        it('should return empty current when ctas field has empty values', () => {
            const fragment = mockFragment([{ name: 'ctas', values: [] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const { current, inherited } = el.copyableCtas;
            expect(current).to.have.length(0);
            expect(inherited).to.have.length(0);
        });

        it('should return empty inherited when base fragment has no ctas field for variation', () => {
            const variationFragment = mockFragment([], { id: 'variation-123' });
            const baseFragment = mockFragment([{ name: 'cardTitle', values: ['Title'] }], { id: 'base-123' });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(mockEditor(variationFragment, null, { isVariation: true, localeDefaultFragment: baseFragment }));
            const { current, inherited } = el.copyableCtas;
            expect(current).to.have.length(0);
            expect(inherited).to.have.length(0);
        });

        it('should return empty inherited when base ctas values are empty for variation', () => {
            const variationFragment = mockFragment([], { id: 'variation-123' });
            const baseFragment = mockFragment([{ name: 'ctas', values: [] }], { id: 'base-123' });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(mockEditor(variationFragment, null, { isVariation: true, localeDefaultFragment: baseFragment }));
            const { current, inherited } = el.copyableCtas;
            expect(current).to.have.length(0);
            expect(inherited).to.have.length(0);
        });

        it('should include href-only CTAs in current when text is empty', () => {
            const fragment = mockFragment([{ name: 'ctas', values: ['<a href="/buy"></a>'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const { current } = el.copyableCtas;
            expect(current).to.have.length(1);
            expect(current[0].href).to.equal('/buy');
        });
    });

    describe('copyField', () => {
        let clipboardStub;
        let toastStub;
        let clipboardItem;

        beforeEach(() => {
            clipboardStub = { write: sandbox.stub().resolves() };
            Object.defineProperty(navigator, 'clipboard', { value: clipboardStub, configurable: true });
            toastStub = sandbox.stub(Events.toast, 'emit');
            sandbox.stub(Store.search, 'get').returns({ path: '/acom' });
            clipboardItem = globalThis.ClipboardItem;
            globalThis.ClipboardItem = class ClipboardItemMock {
                constructor(data) {
                    this.data = data;
                }

                async getType(type) {
                    return this.data[type];
                }
            };
        });

        afterEach(() => {
            globalThis.ClipboardItem = clipboardItem;
        });

        it('should copy rich link to clipboard and show positive toast', async () => {
            const fragment = mockFragment([
                { name: 'prices', values: ['$10/mo'] },
                { name: 'name', values: ['card-name'] },
                { name: 'cardTitle', values: ['Creative Cloud'] },
                { name: 'variant', values: ['plans'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            await el.copyField('prices');
            expect(clipboardStub.write.calledOnce).to.be.true;
            expect(toastStub.calledOnce).to.be.true;
            expect(toastStub.firstCall.args[0].variant).to.equal('positive');
        });

        it('should show negative toast on clipboard failure', async () => {
            clipboardStub.write.rejects(new Error('denied'));
            const fragment = mockFragment([
                { name: 'prices', values: ['$10/mo'] },
                { name: 'name', values: ['card-name'] },
                { name: 'cardTitle', values: ['Creative Cloud'] },
                { name: 'variant', values: ['plans'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            await el.copyField('prices');
            expect(toastStub.calledOnce).to.be.true;
            expect(toastStub.firstCall.args[0].variant).to.equal('negative');
        });

        it('should do nothing when no fragment editor', async () => {
            editorStub.withArgs('mas-fragment-editor').returns(null);
            await el.copyField('prices');
            expect(clipboardStub.write.called).to.be.false;
            expect(toastStub.called).to.be.false;
        });

        it('should copy inherited field links using the base fragment id', async () => {
            const currentFragment = mockFragment([{ name: 'subtitle', values: ['Variation subtitle'] }], {
                id: 'variation-123',
            });
            const baseFragment = mockFragment([{ name: 'subtitle', values: ['Base subtitle'] }], { id: 'base-123' });
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(currentFragment));

            await el.copyField('subtitle', baseFragment);
            expect(clipboardStub.write.calledOnce).to.be.true;
            const item = clipboardStub.write.firstCall.args[0][0];
            const htmlText = await (await item.getType('text/html')).text();
            expect(htmlText).to.include('query=base-123');
            expect(htmlText).to.not.include('query=variation-123');
        });

        it('should keep current row copy links targeting the current fragment id', async () => {
            const currentFragment = mockFragment([{ name: 'subtitle', values: ['Variation subtitle'] }], {
                id: 'variation-123',
            });
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(currentFragment));

            await el.copyField('subtitle', currentFragment);
            expect(clipboardStub.write.calledOnce).to.be.true;
            const item = clipboardStub.write.firstCall.args[0][0];
            const htmlText = await (await item.getType('text/html')).text();
            expect(htmlText).to.include('query=variation-123');
        });
    });

    describe('copyCtaItem', () => {
        let clipboardStub;
        let toastStub;
        let clipboardItem;

        beforeEach(() => {
            clipboardStub = { write: sandbox.stub().resolves() };
            Object.defineProperty(navigator, 'clipboard', { value: clipboardStub, configurable: true });
            toastStub = sandbox.stub(Events.toast, 'emit');
            sandbox.stub(Store.search, 'get').returns({ path: '/acom' });
            clipboardItem = globalThis.ClipboardItem;
            globalThis.ClipboardItem = class ClipboardItemMock {
                constructor(data) {
                    this.data = data;
                }

                async getType(type) {
                    return this.data[type];
                }
            };
        });

        afterEach(() => {
            globalThis.ClipboardItem = clipboardItem;
        });

        it('should copy CTA link to clipboard and show positive toast with text', async () => {
            const fragment = mockFragment([
                { name: 'ctas', values: ['<a>Buy</a>'] },
                { name: 'name', values: ['card-name'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            await el.copyCtaItem('Buy now', 1);
            expect(clipboardStub.write.calledOnce).to.be.true;
            expect(toastStub.calledOnce).to.be.true;
            expect(toastStub.firstCall.args[0].variant).to.equal('positive');
            expect(toastStub.firstCall.args[0].content).to.include('Buy now');
        });

        it('should show negative toast on clipboard failure', async () => {
            clipboardStub.write.rejects(new Error('denied'));
            const fragment = mockFragment([{ name: 'name', values: ['card-name'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            await el.copyCtaItem('Buy now', 1);
            expect(toastStub.calledOnce).to.be.true;
            expect(toastStub.firstCall.args[0].variant).to.equal('negative');
        });

        it('should do nothing when sourceFragment is null', async () => {
            await el.copyCtaItem('Buy now', 1, null);
            expect(clipboardStub.write.called).to.be.false;
            expect(toastStub.called).to.be.false;
        });
    });

    describe('copyFieldButton', () => {
        it('should disable the trigger while variation data is loading', () => {
            el.variationDataLoading = true;
            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const trigger = container.querySelector('mas-side-nav-item[label="Copy Field"]');
            expect(trigger).to.exist;
            expect(trigger.hasAttribute('disabled')).to.be.true;
        });

        it('should render one menu item per copyable field plus the JSON-LD Schema item', () => {
            const fragment = mockFragment([
                { name: 'cardTitle', values: ['Creative Cloud'] },
                { name: 'description', values: ['Great plan'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));

            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const items = container.querySelectorAll('sp-menu-item');
            expect(items.length).to.equal(3);
        });

        it('should render copy field menu inside a scroll container', () => {
            const fragment = mockFragment([{ name: 'cardTitle', values: ['Creative Cloud'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));

            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const scrollContainer = container.querySelector('.copy-field-scroll');
            expect(scrollContainer).to.exist;
            expect(scrollContainer.querySelector('sp-menu')).to.exist;
        });

        it('should render inherited fields under an inherited section for variations', () => {
            const sourceFragment = mockFragment([{ name: 'cardTitle', values: ['Creative Cloud ARG'] }], {
                id: 'variation-123',
            });
            const baseFragment = mockFragment([{ name: 'description', values: ['creativity and design'] }], {
                id: 'base-123',
            });
            const previewFragment = mockFragment([{ name: 'description', values: ['creativity and design'] }], {
                id: 'variation-123',
            });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(
                    mockEditor(sourceFragment, previewFragment, { isVariation: true, localeDefaultFragment: baseFragment }),
                );

            const container = document.createElement('div');
            render(el.copyFieldButton, container);
            const inheritedSection = [...container.querySelectorAll('sp-menu-item[disabled]')].find((item) =>
                item.textContent.includes('Inherited from base fragment'),
            );
            expect(inheritedSection).to.exist;
            const overriddenSection = [...container.querySelectorAll('sp-menu-item[disabled]')].find((item) =>
                item.textContent.includes('Overridden in this variation'),
            );
            expect(overriddenSection).to.exist;

            const overriddenRows = container.querySelectorAll('.field-entry-overridden');
            expect(overriddenRows.length).to.equal(1);
        });

        it('should render strikethrough text in overlay previews for old-price content', () => {
            const sourceFragment = mockFragment([
                {
                    name: 'description',
                    values: [
                        '<p><span is="inline-price" data-template="strikethrough" data-wcs-osi="abc"></span> then <span is="inline-price" data-template="price" data-wcs-osi="abc"></span></p>',
                    ],
                },
            ]);
            const previewFragment = mockFragment([
                {
                    name: 'description',
                    values: [
                        '<p><span is="inline-price" data-template="strikethrough" data-wcs-osi="abc"></span> then <span is="inline-price" data-template="price" data-wcs-osi="abc"></span></p>',
                    ],
                },
            ]);
            const editor = mockEditor(sourceFragment, previewFragment);
            const card = document.createElement('merch-card');

            const currentPrice = document.createElement('span');
            currentPrice.setAttribute('is', 'inline-price');
            currentPrice.setAttribute('data-template', 'price');
            currentPrice.setAttribute('data-wcs-osi', 'abc');
            const currentInner = document.createElement('span');
            currentInner.className = 'price';
            currentInner.textContent = 'US$99.99';
            currentPrice.append(currentInner);

            const oldPrice = document.createElement('span');
            oldPrice.setAttribute('is', 'inline-price');
            oldPrice.setAttribute('data-template', 'strikethrough');
            oldPrice.setAttribute('data-wcs-osi', 'abc');
            const oldInner = document.createElement('span');
            oldInner.className = 'price price-strikethrough';
            oldInner.textContent = 'US$199.99';
            oldPrice.append(oldInner);

            card.append(currentPrice, oldPrice);
            editor.querySelector = sandbox.stub().withArgs('merch-card').returns(card);
            editorStub.withArgs('mas-fragment-editor').returns(editor);

            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const strike = container.querySelector('s');
            expect(strike).to.exist;
            expect(strike.textContent).to.equal('US$199.99');
        });

        it('should clear default focused menu item when opened by pointer', async () => {
            const sourceFragment = mockFragment([{ name: 'cardTitle', values: ['Creative Cloud ARG'] }], {
                id: 'variation-123',
            });
            const baseFragment = mockFragment([{ name: 'description', values: ['creativity and design'] }], {
                id: 'base-123',
            });
            const previewFragment = mockFragment([{ name: 'description', values: ['creativity and design'] }], {
                id: 'variation-123',
            });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(
                    mockEditor(sourceFragment, previewFragment, { isVariation: true, localeDefaultFragment: baseFragment }),
                );

            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const trigger = container.querySelector('mas-side-nav-item[label="Copy Field"]');
            const overlay = container.querySelector('overlay-trigger');
            const focusedItem = container.querySelector('sp-menu-item:not([disabled])');
            focusedItem.setAttribute('focused', '');
            focusedItem.blur = sandbox.stub();

            trigger.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
            overlay.dispatchEvent(new Event('sp-opened'));
            await Promise.resolve();
            await Promise.resolve();

            expect(focusedItem.hasAttribute('focused')).to.be.false;
            expect(focusedItem.blur.calledOnce).to.be.true;
        });

        it('should keep focused menu item when opened without pointer interaction', async () => {
            const sourceFragment = mockFragment([{ name: 'cardTitle', values: ['Creative Cloud ARG'] }], {
                id: 'variation-123',
            });
            const baseFragment = mockFragment([{ name: 'description', values: ['creativity and design'] }], {
                id: 'base-123',
            });
            const previewFragment = mockFragment([{ name: 'description', values: ['creativity and design'] }], {
                id: 'variation-123',
            });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(
                    mockEditor(sourceFragment, previewFragment, { isVariation: true, localeDefaultFragment: baseFragment }),
                );

            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const overlay = container.querySelector('overlay-trigger');
            const focusedItem = container.querySelector('sp-menu-item:not([disabled])');
            focusedItem.setAttribute('focused', '');
            focusedItem.blur = sandbox.stub();

            overlay.dispatchEvent(new Event('sp-opened'));
            await Promise.resolve();
            await Promise.resolve();

            expect(focusedItem.hasAttribute('focused')).to.be.true;
            expect(focusedItem.blur.called).to.be.false;
        });

        it('should not render inherited section for non-variation fragments', () => {
            const sourceFragment = mockFragment([{ name: 'cardTitle', values: ['Creative Cloud'] }]);
            const previewFragment = mockFragment([{ name: 'description', values: ['creativity and design'] }]);
            const baseFragment = mockFragment([{ name: 'description', values: ['creativity and design'] }], {
                id: 'base-123',
            });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(
                    mockEditor(sourceFragment, previewFragment, { isVariation: false, localeDefaultFragment: baseFragment }),
                );

            const container = document.createElement('div');
            render(el.copyFieldButton, container);
            const inheritedSection = [...container.querySelectorAll('sp-menu-item[disabled]')].find((item) =>
                item.textContent.includes('Inherited from base fragment'),
            );
            expect(inheritedSection).to.not.exist;
            const overriddenSection = [...container.querySelectorAll('sp-menu-item[disabled]')].find((item) =>
                item.textContent.includes('Overridden in this variation'),
            );
            expect(overriddenSection).to.not.exist;
            expect(container.querySelectorAll('.field-entry-overridden').length).to.equal(0);
        });

        it('should render CTAs section for non-variation fragment with ctas', () => {
            const fragment = mockFragment([{ name: 'ctas', values: ['<a href="/buy">Buy now</a>'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));

            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const ctaLabel = [...container.querySelectorAll('.copy-section-label')].find((el) => el.textContent === 'CTAs');
            expect(ctaLabel).to.exist;
            const ctaValueLabels = [...container.querySelectorAll('.field-label')].filter((el) =>
                el.textContent.startsWith('CTA '),
            );
            expect(ctaValueLabels).to.have.length(1);
            expect(ctaValueLabels[0].textContent).to.equal('CTA 1');

            // The combined 'ctas' field row must NOT appear — CTAs are shown as individual items only
            const fieldLabels = [...container.querySelectorAll('.field-label')].filter((el) => el.textContent === 'CTAs');
            expect(fieldLabels).to.have.length(0);
        });

        it('should render overridden CTA section for variation with current CTAs', () => {
            const variationFragment = mockFragment([{ name: 'ctas', values: ['<a href="/v">Variation CTA</a>'] }], {
                id: 'variation-123',
            });
            const baseFragment = mockFragment([{ name: 'ctas', values: ['<a href="/base">Base CTA</a>'] }], { id: 'base-123' });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(mockEditor(variationFragment, null, { isVariation: true, localeDefaultFragment: baseFragment }));

            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const overriddenSection = [...container.querySelectorAll('sp-menu-item[disabled]')].find(
                (item) =>
                    item.classList.contains('overridden-section') && item.textContent.includes('Overridden in this variation'),
            );
            expect(overriddenSection).to.exist;
            const ctaEntries = [...container.querySelectorAll('.field-entry-overridden')];
            expect(ctaEntries.length).to.be.greaterThan(0);
        });

        it('should render inherited CTA section for variation without current CTAs', () => {
            const variationFragment = mockFragment([], { id: 'variation-123' });
            const baseFragment = mockFragment([{ name: 'ctas', values: ['<a href="/base">Base CTA</a>'] }], { id: 'base-123' });
            editorStub
                .withArgs('mas-fragment-editor')
                .returns(mockEditor(variationFragment, null, { isVariation: true, localeDefaultFragment: baseFragment }));

            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const inheritedCtaSection = [...container.querySelectorAll('sp-menu-item[disabled]')].find(
                (item) =>
                    item.classList.contains('inherited-section') && item.textContent.includes('Inherited from base fragment'),
            );
            expect(inheritedCtaSection).to.exist;
        });

        it('should render multiple CTAs with correct index labels and dividers', () => {
            const fragment = mockFragment([
                { name: 'ctas', values: ['<a href="/buy">Buy now</a><a href="/trial">Free trial</a>'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));

            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const ctaLabels = [...container.querySelectorAll('.field-label')].filter((el) => el.textContent.startsWith('CTA '));
            expect(ctaLabels).to.have.length(2);
            expect(ctaLabels[0].textContent).to.equal('CTA 1');
            expect(ctaLabels[1].textContent).to.equal('CTA 2');
        });

        it('should not render CTAs section when no ctas in fragment', () => {
            const fragment = mockFragment([{ name: 'cardTitle', values: ['Creative Cloud'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));

            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const ctaLabel = [...container.querySelectorAll('.copy-section-label')].find((el) => el.textContent === 'CTAs');
            expect(ctaLabel).to.not.exist;
        });
    });

    describe('copyJsonLd', () => {
        let clipboardStub;
        let toastStub;
        let clipboardItem;

        beforeEach(() => {
            clipboardStub = { write: sandbox.stub().resolves() };
            Object.defineProperty(navigator, 'clipboard', { value: clipboardStub, configurable: true });
            toastStub = sandbox.stub(Events.toast, 'emit');
            sandbox.stub(Store.search, 'get').returns({ path: 'sandbox' });
            clipboardItem = globalThis.ClipboardItem;
            globalThis.ClipboardItem = class ClipboardItemMock {
                constructor(data) {
                    this.data = data;
                }

                async getType(type) {
                    return this.data[type];
                }
            };
        });

        afterEach(() => {
            globalThis.ClipboardItem = clipboardItem;
        });

        it('should render JSON-LD Schema item in the Copy Field popover', () => {
            const fragment = mockFragment([{ name: 'cardTitle', values: ['Photoshop'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));

            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const items = [...container.querySelectorAll('sp-menu-item')];
            const jsonLdItem = items.find((item) => item.textContent.trim() === 'JSON-LD Schema');
            expect(jsonLdItem).to.exist;
        });

        it('should copy a rich link with jsonld=on to clipboard', async () => {
            const fragment = mockFragment([], { id: 'frag-abc' });
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));

            await el.copyJsonLd();

            expect(clipboardStub.write.calledOnce).to.be.true;
            const item = clipboardStub.write.firstCall.args[0][0];
            const htmlBlob = await item.getType('text/html');
            const htmlText = await htmlBlob.text();
            expect(htmlText).to.include('jsonld=on');
            expect(htmlText).to.include('jsonLdSchema');
        });

        it('should include fragment id in the link href', async () => {
            const fragment = mockFragment([], { id: 'frag-abc' });
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));

            await el.copyJsonLd();

            const item = clipboardStub.write.firstCall.args[0][0];
            const htmlBlob = await item.getType('text/html');
            const htmlText = await htmlBlob.text();
            expect(htmlText).to.include('frag-abc');
        });

        it('should emit positive toast on success', async () => {
            const fragment = mockFragment([], { id: 'frag-abc' });
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));

            await el.copyJsonLd();

            expect(toastStub.calledOnce).to.be.true;
            expect(toastStub.firstCall.args[0].variant).to.equal('positive');
            expect(toastStub.firstCall.args[0].content).to.equal('Copied JSON-LD Schema link');
        });

        it('should emit negative toast on clipboard failure', async () => {
            clipboardStub.write.rejects(new Error('denied'));
            const fragment = mockFragment([], { id: 'frag-abc' });
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));

            await el.copyJsonLd();

            expect(toastStub.calledOnce).to.be.true;
            expect(toastStub.firstCall.args[0].variant).to.equal('negative');
            expect(toastStub.firstCall.args[0].content).to.equal('Failed to copy JSON-LD Schema link');
        });

        it('should emit negative toast when fragment model is unknown', async () => {
            const fragment = mockFragment([], { id: 'frag-abc', model: { path: '/unknown/model' } });
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));

            await el.copyJsonLd();

            expect(clipboardStub.write.called).to.be.false;
            expect(toastStub.calledOnce).to.be.true;
            expect(toastStub.firstCall.args[0].variant).to.equal('negative');
        });

        it('should do nothing when fragment is missing', async () => {
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(null));

            await el.copyJsonLd();

            expect(clipboardStub.write.called).to.be.false;
            expect(toastStub.called).to.be.false;
        });
    });

    describe('updateVariationLoadingState', () => {
        let contextStore;
        let contextIsVariationStub;

        beforeEach(() => {
            contextStore = Store.fragmentEditor.editorContext;
            contextIsVariationStub = sandbox.stub(contextStore, 'isVariation').returns(false);
            contextStore.parentFetchPromise = null;
        });

        afterEach(() => {
            contextStore.parentFetchPromise = null;
            contextIsVariationStub.restore();
        });

        it('should resolve and cache price preview when merch-card dispatches mas:ready', async () => {
            const editor = document.createElement('div');
            editor.fragment = { id: 'frag-123' };
            const card = document.createElement('merch-card');
            editor.append(card);
            document.body.append(el, editor);

            const price = document.createElement('span');
            price.setAttribute('is', 'inline-price');
            price.setAttribute('data-template', 'price');
            price.textContent = ' US$54.99/mo ';
            card.append(price);
            sandbox.stub(editor, 'querySelector').withArgs('merch-card').returns(card);

            editorStub.withArgs('mas-fragment-editor').returns(editor);
            const updateStub = sandbox.stub(el, 'requestUpdate');

            card.dispatchEvent(new CustomEvent('mas:ready', { bubbles: true, composed: true }));
            await Promise.resolve();

            expect(el.resolvedPriceText).to.equal('US$54.99/mo');
            expect(updateStub.called).to.be.true;
            el.remove();
            editor.remove();
        });

        it('should use the first non-empty resolved inline-price text on mas:ready', async () => {
            const editor = document.createElement('div');
            editor.fragment = { id: 'frag-123' };
            const card = document.createElement('merch-card');
            editor.append(card);
            document.body.append(el, editor);

            const unresolved = document.createElement('span');
            unresolved.setAttribute('is', 'inline-price');
            unresolved.setAttribute('data-template', 'price');
            unresolved.textContent = '';
            const resolved = document.createElement('span');
            resolved.setAttribute('is', 'inline-price');
            resolved.textContent = ' US$9.99/mo ';
            card.append(unresolved, resolved);
            sandbox.stub(editor, 'querySelector').withArgs('merch-card').returns(card);
            editorStub.withArgs('mas-fragment-editor').returns(editor);

            card.dispatchEvent(new CustomEvent('mas:ready', { bubbles: true, composed: true }));
            await Promise.resolve();

            expect(el.resolvedPriceText).to.equal('US$9.99/mo');
            el.remove();
            editor.remove();
        });

        it('should update price preview when current preview merch-card dispatches mas:ready', async () => {
            const editor = document.createElement('div');
            editor.fragment = { id: 'frag-123' };
            document.body.append(el, editor);

            let currentCard = null;
            sandbox.stub(editor, 'querySelector').callsFake((selector) => (selector === 'merch-card' ? currentCard : null));
            editorStub.withArgs('mas-fragment-editor').returns(editor);

            const card = document.createElement('merch-card');
            const price = document.createElement('span');
            price.setAttribute('is', 'inline-price');
            price.setAttribute('data-template', 'price');
            price.textContent = ' US$9.99/mo ';
            card.append(price);
            currentCard = card;
            editor.append(card);

            card.dispatchEvent(new CustomEvent('mas:ready', { bubbles: true, composed: true }));
            await Promise.resolve();

            expect(el.resolvedPriceText).to.equal('US$9.99/mo');
            el.remove();
            editor.remove();
        });

        it('should wait for parent fetch when current fragment is a variation', async () => {
            let resolveParent;
            contextIsVariationStub.returns(true);
            contextStore.parentFetchPromise = new Promise((resolve) => {
                resolveParent = resolve;
            });

            const editor = document.createElement('div');
            editor.fragment = { id: 'frag-123' };
            editor.updateComplete = Promise.resolve();
            sandbox.stub(editor, 'querySelector').withArgs('merch-card').returns(null);
            editorStub.withArgs('mas-fragment-editor').returns(editor);

            el.variationDataLoading = true;
            const loadingPromise = el.updateVariationLoadingState();
            await Promise.resolve();
            expect(el.variationDataLoading).to.be.true;

            resolveParent();
            await loadingPromise;
            expect(el.variationDataLoading).to.be.false;
        });

        it('should disable loading when fragment id is missing', async () => {
            const editor = document.createElement('div');
            editor.fragment = {};
            editorStub.withArgs('mas-fragment-editor').returns(editor);

            el.variationDataLoading = true;
            await el.updateVariationLoadingState();

            expect(el.variationDataLoading).to.be.false;
        });

        it('should force loading state off when parent fetch times out', async () => {
            const warnStub = sandbox.stub(console, 'warn');
            contextIsVariationStub.returns(true);
            contextStore.parentFetchPromise = new Promise(() => {});

            const editor = document.createElement('div');
            editor.fragment = { id: 'frag-123' };
            editorStub.withArgs('mas-fragment-editor').returns(editor);

            sandbox.stub(window, 'setTimeout').callsFake((cb) => {
                cb();
                return 999;
            });

            el.variationDataLoading = true;
            await el.updateVariationLoadingState();

            expect(warnStub.calledOnce).to.be.true;
            expect(el.variationDataLoading).to.be.false;
        });
    });

    describe('lifecycle', () => {
        afterEach(() => {
            Store.fragments.inEdit.set(null);
            el.disconnectedCallback();
        });

        it('should unsubscribe from inEdit store on disconnect', () => {
            const unsubscribeStub = sandbox.stub(Store.fragments.inEdit, 'unsubscribe');
            el.disconnectedCallback();
            expect(unsubscribeStub.calledOnce).to.be.true;
        });

        it('should disable loading when inEdit store is reset', () => {
            const updateStoresStub = sandbox.stub(el.reactiveController, 'updateStores');

            el.variationDataLoading = true;
            el.connectedCallback();

            expect(el.variationDataLoading).to.be.false;
            expect(updateStoresStub.called).to.be.true;
            expect(updateStoresStub.firstCall.args[0]).to.have.length(7);
        });

        it('should subscribe to previewStore updates when fragment enters edit', () => {
            const updateStoresStub = sandbox.stub(el.reactiveController, 'updateStores');
            const previewStore = { value: { id: 'frag-123', fields: [] } };
            const fragmentStore = { previewStore };

            el.connectedCallback();
            Store.fragments.inEdit.set(fragmentStore);

            const updatedStores = updateStoresStub.lastCall.args[0];
            expect(updatedStores).to.include(previewStore);
        });
    });

    describe('handleStoreChanges', () => {
        it('should redirect away from translations when disabled', () => {
            const setPageStub = sandbox.stub(Store.page, 'set');
            sandbox.stub(Store.page, 'get').returns(PAGE_NAMES.TRANSLATIONS);
            sandbox.stub(el, 'updateVariationLoadingState');
            sandbox.stub(el, 'isTranslationEnabled').get(() => false);

            el.handleStoreChanges();

            expect(setPageStub.calledOnceWithExactly(PAGE_NAMES.CONTENT)).to.be.true;
            expect(el.updateVariationLoadingState.calledOnce).to.be.true;
        });

        it('should redirect away from translation editor when disabled', () => {
            const setPageStub = sandbox.stub(Store.page, 'set');
            sandbox.stub(Store.page, 'get').returns(PAGE_NAMES.TRANSLATION_EDITOR);
            sandbox.stub(el, 'updateVariationLoadingState');
            sandbox.stub(el, 'isTranslationEnabled').get(() => false);

            el.handleStoreChanges();

            expect(setPageStub.calledOnceWithExactly(PAGE_NAMES.CONTENT)).to.be.true;
        });

        it('should not redirect when translations are enabled', () => {
            const setPageStub = sandbox.stub(Store.page, 'set');
            sandbox.stub(Store.page, 'get').returns(PAGE_NAMES.TRANSLATIONS);
            sandbox.stub(el, 'updateVariationLoadingState');
            sandbox.stub(el, 'isTranslationEnabled').get(() => true);

            el.handleStoreChanges();

            expect(setPageStub.called).to.be.false;
        });
    });
});
