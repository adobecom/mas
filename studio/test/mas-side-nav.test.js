import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../src/store.js';
import Events from '../src/events.js';
import { CARD_MODEL_PATH } from '../src/constants.js';
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

        it('should filter out hidden fields', () => {
            const fragment = mockFragment([
                { name: 'cardTitle', values: ['Creative Cloud'] },
                { name: 'quantitySelect', values: ['true'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            const names = el.copyableFields.map((f) => f.name);
            expect(names).to.include('cardTitle');
            expect(names).to.not.include('quantitySelect');
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
            const fragment = mockFragment([
                { name: 'prices', values: ['<span is="inline-price">placeholder</span>'] },
            ]);
            editorStub.withArgs('mas-fragment-editor').returns(mockEditor(fragment));
            el.resolvedPriceText = 'US$54.99/mo';
            const priceField = el.copyableFields.find((f) => f.name === 'prices');
            expect(priceField.preview).to.equal('US$54.99/mo');
        });

        it('should fall back to previewValue for prices when no resolved text', () => {
            const fragment = mockFragment([
                { name: 'prices', values: ['<span>$9.99/mo</span>'] },
            ]);
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
});
