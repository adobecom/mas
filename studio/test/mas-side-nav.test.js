import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { render } from 'lit';
import Store from '../src/store.js';
import Events from '../src/events.js';
import { CARD_MODEL_PATH, PAGE_NAMES } from '../src/constants.js';
import '../src/mas-side-nav.js';

function mockFragment(fields = []) {
    return {
        id: 'frag-123',
        model: { path: CARD_MODEL_PATH },
        title: 'Test Card',
        fields,
        isValueEmpty: (val) => !val || val.length === 0 || val.every((v) => !v),
        getField: (name) => fields.find((f) => f.name === name) || null,
        getTagTitle: () => null,
    };
}

function mockEditor(fragment = null) {
    return { fragment, editorContextStore: { isVariation: () => false } };
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

        it('should filter out suppressed copy fields', () => {
            const fragment = mockFragment([
                { name: 'cardTitle', values: ['Creative Cloud'] },
                { name: 'quantitySelect', values: ['true'] },
                { name: 'perUnitLabel', values: ['{perUnit, select, LICENSE {per lic} other {}}'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const names = el.copyableFields.map((f) => f.name);
            expect(names).to.include('cardTitle');
            expect(names).to.not.include('quantitySelect');
            expect(names).to.not.include('perUnitLabel');
        });

        it('should use FIELD_DISPLAY_NAMES for known fields', () => {
            const fragment = mockFragment([
                { name: 'variant', values: ['plans'] },
                { name: 'osi', values: ['K79yhO4'] },
                { name: 'ctas', values: ['<a>Buy</a>'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const map = Object.fromEntries(el.copyableFields.map((f) => [f.name, f.displayName]));
            expect(map.variant).to.equal('Template');
            expect(map.osi).to.equal('OSI');
            expect(map.ctas).to.equal('CTAs');
        });

        it('should fall back to camelToTitle for unmapped fields', () => {
            const fragment = mockFragment([
                { name: 'cardTitle', values: ['Creative Cloud'] },
                { name: 'borderColor', values: ['#fff'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const map = Object.fromEntries(el.copyableFields.map((f) => [f.name, f.displayName]));
            expect(map.cardTitle).to.equal('Card Title');
            expect(map.borderColor).to.equal('Border Color');
        });

        it('should use resolvedPriceText for prices when available', () => {
            const fragment = mockFragment([{ name: 'prices', values: ['<span is="inline-price">placeholder</span>'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            el.resolvedPriceText = 'US$54.99/mo';
            const priceField = el.copyableFields.find((f) => f.name === 'prices');
            expect(priceField.preview).to.equal('US$54.99/mo');
        });

        it('should fall back to previewValue for prices when no resolved text', () => {
            const fragment = mockFragment([{ name: 'prices', values: ['<span>$9.99/mo</span>'] }]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            el.resolvedPriceText = '';
            const priceField = el.copyableFields.find((f) => f.name === 'prices');
            expect(priceField.preview).to.equal('$9.99/mo');
        });
    });

    describe('copyField', () => {
        let clipboardStub;
        let toastStub;

        beforeEach(() => {
            clipboardStub = { write: sandbox.stub().resolves() };
            Object.defineProperty(navigator, 'clipboard', { value: clipboardStub, configurable: true });
            toastStub = sandbox.stub(Events.toast, 'emit');
            sandbox.stub(Store.search, 'get').returns({ path: '/acom' });
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

        it('should render one menu item per copyable field', () => {
            const fragment = mockFragment([
                { name: 'cardTitle', values: ['Creative Cloud'] },
                { name: 'description', values: ['Great plan'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));

            const container = document.createElement('div');
            render(el.copyFieldButton, container);

            const items = container.querySelectorAll('sp-menu-item');
            expect(items.length).to.equal(2);
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
            expect(updateStoresStub.firstCall.args[0]).to.have.length(5);

            el.disconnectedCallback();
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
    });
});
