import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/mas-fragment-variations.js';

describe('MasFragmentVariations', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const createVariationFragment = (overrides = {}) => ({
        id: 'variation-1',
        path: '/content/dam/mas/sandbox/en_US/pac/pzn/variation-1',
        title: 'Variation title',
        fields: [
            { name: 'pznTags', values: ['mas:pzn/tag-a', 'mas:pzn/tag-b'] },
            { name: 'promoCode', values: ['SAVE20'] },
        ],
        tags: [],
        ...overrides,
    });

    const createFragmentMock = () => ({
        listLocaleVariations: () => [],
        listGroupedVariations: () => [],
    });

    describe('getGroupedVariationTagsValue', () => {
        it('returns comma-separated pznTags from fragment fields', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();
            expect(el.getGroupedVariationTagsValue(variation)).to.equal('mas:pzn/tag-a,mas:pzn/tag-b');
        });

        it('returns empty string when pznTags field is missing', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment({ fields: [] });
            expect(el.getGroupedVariationTagsValue(variation)).to.equal('');
        });

        it('returns empty string when pznTags values are empty', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment({
                fields: [{ name: 'pznTags', values: [] }],
            });
            expect(el.getGroupedVariationTagsValue(variation)).to.equal('');
        });
    });

    describe('getPromoCode', () => {
        it('returns first promoCode value from fragment fields', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();
            expect(el.getPromoCode(variation)).to.equal('SAVE20');
        });

        it('returns empty string when promoCode field is missing', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment({ fields: [] });
            expect(el.getPromoCode(variation)).to.equal('');
        });
    });

    describe('openDuplicateDialog', () => {
        it('sets duplicateSource and pre-populates duplicatePznTags from source tags', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();

            el.openDuplicateDialog(variation);

            expect(el.duplicateSource).to.deep.equal(variation);
            expect(el.duplicatePznTags).to.deep.equal(['mas:pzn/tag-a', 'mas:pzn/tag-b']);
        });

        it('sets duplicatePznTags to empty array when source has no pznTags', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment({ fields: [] });

            el.openDuplicateDialog(variation);

            expect(el.duplicatePznTags).to.deep.equal([]);
        });
    });

    describe('closeDuplicateDialog', () => {
        it('resets duplicateSource and duplicatePznTags', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();
            el.openDuplicateDialog(variation);

            el.closeDuplicateDialog();

            expect(el.duplicateSource).to.be.null;
            expect(el.duplicatePznTags).to.deep.equal([]);
        });

        it('does not reset state when duplicateLoading is true', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();
            el.openDuplicateDialog(variation);
            el.duplicateLoading = true;

            el.closeDuplicateDialog();

            expect(el.duplicateSource).to.deep.equal(variation);
            expect(el.duplicatePznTags).to.deep.equal(['mas:pzn/tag-a', 'mas:pzn/tag-b']);
        });
    });

    describe('canSubmitDuplicate', () => {
        it('returns false when duplicateLoading is true', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            el.duplicateLoading = true;
            el.duplicatePznTags = ['mas:pzn/tag-a'];
            expect(el.canSubmitDuplicate).to.be.false;
        });

        it('returns false when duplicatePznTags is empty', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            el.duplicateLoading = false;
            el.duplicatePznTags = [];
            expect(el.canSubmitDuplicate).to.be.false;
        });

        it('returns true when not loading and tags are present', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            el.duplicateLoading = false;
            el.duplicatePznTags = ['mas:pzn/tag-a'];
            expect(el.canSubmitDuplicate).to.be.true;
        });
    });

    describe('handleDuplicatePznTagsChange', () => {
        it('updates duplicatePznTags from event target value', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const newTags = ['mas:pzn/new-tag'];

            el.handleDuplicatePznTagsChange({ target: { value: newTags } });

            expect(el.duplicatePznTags).to.deep.equal(newTags);
        });

        it('sets duplicatePznTags to empty array when event value is falsy', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            el.duplicatePznTags = ['mas:pzn/tag-a'];

            el.handleDuplicatePznTagsChange({ target: { value: null } });

            expect(el.duplicatePznTags).to.deep.equal([]);
        });
    });

    describe('handleDuplicateSubmit', () => {
        it('calls duplicateGroupedVariation and closes dialog on success', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();
            el.openDuplicateDialog(variation);

            const mockRepository = document.createElement('mas-repository');
            mockRepository.duplicateGroupedVariation = sandbox.stub().resolves({ id: 'new-fragment' });
            sandbox.stub(document, 'querySelector').withArgs('mas-repository').returns(mockRepository);

            await el.handleDuplicateSubmit();

            expect(mockRepository.duplicateGroupedVariation.calledOnceWith('variation-1', ['mas:pzn/tag-a', 'mas:pzn/tag-b']))
                .to.be.true;
            expect(el.duplicateLoading).to.be.false;
            expect(el.duplicateSource).to.be.null;
        });

        it('resets duplicateLoading and keeps dialog open on error', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();
            el.openDuplicateDialog(variation);

            const mockRepository = document.createElement('mas-repository');
            mockRepository.duplicateGroupedVariation = sandbox.stub().rejects(new Error('AEM error'));
            sandbox.stub(document, 'querySelector').withArgs('mas-repository').returns(mockRepository);

            await el.handleDuplicateSubmit();

            expect(el.duplicateLoading).to.be.false;
            expect(el.duplicateSource).to.deep.equal(variation);
        });

        it('does nothing when no repository element is found', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();
            el.openDuplicateDialog(variation);
            sandbox.stub(document, 'querySelector').withArgs('mas-repository').returns(null);

            await el.handleDuplicateSubmit();

            expect(el.duplicateLoading).to.be.false;
        });

        it('does nothing when duplicateSource has no id', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            el.duplicateSource = { fields: [] };

            const mockRepository = document.createElement('mas-repository');
            mockRepository.duplicateGroupedVariation = sandbox.stub().resolves();
            sandbox.stub(document, 'querySelector').withArgs('mas-repository').returns(mockRepository);

            await el.handleDuplicateSubmit();

            expect(mockRepository.duplicateGroupedVariation.called).to.be.false;
        });
    });

    describe('duplicateDialogTemplate', () => {
        it('returns nothing when duplicateSource is null', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const { nothing } = await import('lit');
            expect(el.duplicateDialogTemplate).to.equal(nothing);
        });

        it('renders dialog when duplicateSource is set', async () => {
            const variation = createVariationFragment();
            const el = await fixture(
                html`<mas-fragment-variations .fragment=${createFragmentMock()}></mas-fragment-variations>`,
            );
            el.openDuplicateDialog(variation);
            await el.updateComplete;

            const dialog = el.querySelector('sp-dialog');
            expect(dialog).to.exist;
        });

        it('passes reactive duplicatePznTags to tag picker on rerender', async () => {
            const variation = createVariationFragment();
            const el = await fixture(
                html`<mas-fragment-variations .fragment=${createFragmentMock()}></mas-fragment-variations>`,
            );
            el.openDuplicateDialog(variation);
            await el.updateComplete;

            const newTags = ['mas:locale/en-US', 'mas:pzn/tag-c'];
            el.handleDuplicatePznTagsChange({ target: { value: newTags } });
            await el.updateComplete;

            const picker = el.querySelector('aem-tag-picker-field');
            expect(picker.value).to.deep.equal(newTags);
        });

        it('disables the tag picker while duplicateLoading is true', async () => {
            const variation = createVariationFragment();
            const el = await fixture(
                html`<mas-fragment-variations .fragment=${createFragmentMock()}></mas-fragment-variations>`,
            );
            el.openDuplicateDialog(variation);
            el.duplicateLoading = true;
            await el.updateComplete;

            const picker = el.querySelector('aem-tag-picker-field');
            expect(picker.disabled).to.be.true;

            el.duplicateLoading = false;
            await el.updateComplete;
            expect(picker.disabled).to.be.false;
        });
    });
});
