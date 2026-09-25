import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Fragment } from '../../src/aem/fragment.js';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import '../../src/masks/mas-mask-editor.js';
import '../../src/mas-confirm-dialog.js';

const CARD_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';

async function mount() {
    const el = document.createElement('mas-mask-editor');
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
}

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

describe('mas-mask-editor', () => {
    afterEach(() => {
        Store.masks.editing.set(null);
        Store.masks.fragmentId.set(null);
        Store.masks.editingName.set('');
        Store.masks.creating.set(false);
        Store.masks.setAem(null);
        Store.search.set({});
        document.querySelectorAll('mas-mask-editor').forEach((node) => node.remove());
    });

    it('blurs empty parts and reveals parts that have content', async () => {
        const fragment = new Fragment({
            id: 'm1',
            title: 'Promo',
            path: '/content/dam/mas/acom/en_US/masks/promo',
            fields: [
                { name: 'cardTitle', type: 'text', multiple: false, values: ['Creative Cloud'] },
                { name: 'subtitle', type: 'text', multiple: false, values: [''] },
            ],
            model: { path: CARD_MODEL_PATH },
        });
        Store.masks.editing.set(fragment);
        Store.masks.fragmentId.set('m1');

        const el = await mount();
        await el.updateComplete;

        const titlePart = el.shadowRoot.querySelector('.part.title');
        const subtitlePart = el.shadowRoot.querySelector('.part.subtitle');
        expect(titlePart.classList.contains('blurred')).to.equal(false);
        expect(titlePart.textContent.trim()).to.equal('Creative Cloud');
        expect(subtitlePart.classList.contains('blurred')).to.equal(true);

        fragment.getField('subtitle').values = ['for teams'];
        el.requestUpdate();
        await el.updateComplete;

        const revealed = el.shadowRoot.querySelector('.part.subtitle');
        expect(revealed.classList.contains('blurred')).to.equal(false);
        expect(revealed.textContent.trim()).to.equal('for teams');
    });

    it('renders the duplicated plans field sections in edit mode', async () => {
        const fragment = new Fragment({
            id: 'm1',
            title: 'Promo',
            path: '/content/dam/mas/acom/en_US/masks/promo',
            fields: [{ name: 'cardName', type: 'text', multiple: false, values: ['promo'] }],
            model: { path: CARD_MODEL_PATH },
        });
        Store.masks.editing.set(fragment);
        Store.masks.fragmentId.set('m1');

        const el = await mount();
        await el.updateComplete;

        // General info + representative plans fields are present
        expect(el.shadowRoot.querySelector('#mask-name')).to.not.equal(null);
        expect(el.shadowRoot.querySelector('#group-cardTitle')).to.not.equal(null);
        expect(el.shadowRoot.querySelector('#group-prices')).to.not.equal(null);
        expect(el.shadowRoot.querySelector('#group-ctas')).to.not.equal(null);
    });

    it('resolves a deep link by maskName and loads the mask for editing', async () => {
        const getByPath = sinon.stub().resolves({
            id: 'm1',
            title: 'Promo',
            path: '/content/dam/mas/acom/en_US/masks/promo',
            fields: [{ name: 'cardName', type: 'text', multiple: false, values: ['promo'] }],
            model: { path: CARD_MODEL_PATH },
        });
        Store.masks.setAem({ sites: { cf: { fragments: { getByPath } } } });
        Store.search.set({ path: 'acom' });
        Store.masks.editingName.set('promo');

        const el = await mount();
        await delay(20);
        await el.updateComplete;

        expect(getByPath.calledWith('/content/dam/mas/acom/en_US/masks/promo')).to.equal(true);
        expect(el.shadowRoot.querySelector('#group-cardTitle')).to.not.equal(null);
        expect(Store.masks.fragmentId.get()).to.equal('m1');
    });

    it('renders a name form in create mode', async () => {
        Store.masks.creating.set(true);
        Store.masks.fragmentId.set(null);
        const el = await mount();
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('#mask-name')).to.not.equal(null);
    });

    describe('disabledActions', () => {
        const baseFragment = (extra = {}) =>
            new Fragment({
                id: 'm1',
                title: 'P',
                path: '/content/dam/mas/acom/en_US/masks/p',
                fields: [],
                model: { path: CARD_MODEL_PATH },
                ...extra,
            });

        it('disables publish for PUBLISHED status', async () => {
            const fragment = baseFragment({ status: 'PUBLISHED' });
            Store.masks.editing.set(fragment);
            Store.masks.fragmentId.set('m1');
            const el = await mount();
            await el.updateComplete;
            expect(el.disabledActions.has('publish')).to.be.true;
        });

        it('enables publish for MODIFIED status', async () => {
            const fragment = baseFragment({ status: 'MODIFIED' });
            Store.masks.editing.set(fragment);
            Store.masks.fragmentId.set('m1');
            const el = await mount();
            await el.updateComplete;
            expect(el.disabledActions.has('publish')).to.be.false;
        });

        it('enables publish for DRAFT status with no published.at', async () => {
            const fragment = baseFragment({ status: 'DRAFT' });
            Store.masks.editing.set(fragment);
            Store.masks.fragmentId.set('m1');
            const el = await mount();
            await el.updateComplete;
            expect(el.disabledActions.has('publish')).to.be.false;
        });

        it('disables publish when fragment has unsaved changes', async () => {
            const fragment = baseFragment({ status: 'MODIFIED' });
            fragment.hasChanges = true;
            Store.masks.editing.set(fragment);
            Store.masks.fragmentId.set('m1');
            const el = await mount();
            await el.updateComplete;
            expect(el.disabledActions.has('publish')).to.be.true;
        });

        it('disables all actions while loading', async () => {
            Store.masks.loading.set(true);
            const el = await mount();
            await el.updateComplete;
            const disabled = el.disabledActions;
            expect(disabled.has('save')).to.be.true;
            expect(disabled.has('publish')).to.be.true;
            expect(disabled.has('delete')).to.be.true;
        });
    });

    describe('delete confirmation', () => {
        const baseFragment = () =>
            new Fragment({
                id: 'm1',
                title: 'Promo',
                path: '/content/dam/mas/acom/en_US/masks/promo',
                fields: [],
                model: { path: CARD_MODEL_PATH },
                status: 'MODIFIED',
            });

        it('shows confirmation dialog before deleting', async () => {
            Store.masks.editing.set(baseFragment());
            Store.masks.fragmentId.set('m1');
            const navigateStub = sinon.stub(router, 'navigateToPage').returns(() => {});
            const deleteMaskStub = sinon.stub(Store.masks, 'deleteMask').resolves(true);

            const el = await mount();
            await el.updateComplete;

            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('delete'));

            await delay(0);

            expect(Store.confirmDialogOptions.get()).to.not.equal(null);
            expect(Store.confirmDialogOptions.get().title).to.equal('Delete mask');
            expect(Store.confirmDialogOptions.get().confirmLabel).to.equal('Delete');

            // Cancel — clean up the pending resolver
            const confirmEl = document.createElement('mas-confirm-dialog');
            document.body.appendChild(confirmEl);
            confirmEl.handleDialogAction(false);

            await delay(0);
            expect(deleteMaskStub.called).to.be.false;

            navigateStub.restore();
            deleteMaskStub.restore();
            confirmEl.remove();
        });

        it('proceeds with delete after confirming', async () => {
            Store.masks.editing.set(baseFragment());
            Store.masks.fragmentId.set('m1');
            const navigateStub = sinon.stub(router, 'navigateToPage').returns(() => {});
            const deleteMaskStub = sinon.stub(Store.masks, 'deleteMask').resolves(true);

            const el = await mount();
            await el.updateComplete;

            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('delete'));

            await delay(0);

            const confirmEl = document.createElement('mas-confirm-dialog');
            document.body.appendChild(confirmEl);
            confirmEl.handleDialogAction(true);

            await delay(10);

            expect(deleteMaskStub.calledWith('m1')).to.be.true;

            navigateStub.restore();
            deleteMaskStub.restore();
            confirmEl.remove();
        });
    });

    describe('variables section', () => {
        it('renders mas-multifield with Add variable button', async () => {
            const fragment = new Fragment({
                id: 'm1',
                title: 'P',
                path: '/content/dam/mas/acom/en_US/masks/p',
                fields: [],
                model: { path: CARD_MODEL_PATH },
            });
            Store.masks.editing.set(fragment);
            Store.masks.fragmentId.set('m1');

            const el = await mount();
            await el.updateComplete;

            const multifield = el.shadowRoot.querySelector('mas-multifield');
            expect(multifield).to.not.equal(null);
            expect(multifield.getAttribute('button-label')).to.equal('Add variable');
        });

        it('pre-populates variables from fragment field values', async () => {
            const fragment = new Fragment({
                id: 'm1',
                title: 'P',
                path: '/content/dam/mas/acom/en_US/masks/p',
                fields: [{ name: 'variables', type: 'text', multiple: true, values: ['k1:v1', 'k2:v2'] }],
                model: { path: CARD_MODEL_PATH },
            });
            Store.masks.editing.set(fragment);
            Store.masks.fragmentId.set('m1');

            const el = await mount();
            await el.updateComplete;

            const multifield = el.shadowRoot.querySelector('mas-multifield');
            expect(multifield.value).to.deep.equal([{ value: 'k1:v1' }, { value: 'k2:v2' }]);
        });
    });
});
