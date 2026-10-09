import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/common/components/mas-grouped-selector.js';

const render = (selected = [], { readonly = false, required = true } = {}) =>
    fixture(html`
        <mas-grouped-selector
            label="Selected languages"
            heading="Select languages"
            add-label="Add languages"
            description="Choose languages."
            ?required=${required}
            ?readonly=${readonly}
            .selected=${selected}
        >
            <div class="picker">picker</div>
        </mas-grouped-selector>
    `);

const query = (el, selector) => el.shadowRoot.querySelector(selector);

describe('MasGroupedSelector', () => {
    afterEach(() => {
        fixtureCleanup();
    });

    it('renders the empty state when nothing is selected', async () => {
        const el = await render();
        const text = el.shadowRoot.textContent;
        expect(query(el, '.empty-state')).to.exist;
        expect(text).to.include('Select languages');
        expect(text).to.include('Add languages');
        expect(text).to.include('Choose languages.');
    });

    it('renders label and count when items are selected', async () => {
        const el = await render(['fr_FR', 'de_DE']);
        const header = query(el, '.selected-header h2');
        expect(query(el, '.empty-state')).to.be.null;
        expect(header.textContent).to.include('Selected languages');
        expect(header.textContent).to.include('(2)');
    });

    it('renders the required asterisk when required', async () => {
        const required = await render(['fr_FR']);
        expect(query(required, 'sp-icon-asterisk100')).to.exist;
    });

    it('does not render the required asterisk when optional', async () => {
        const optional = await render(['fr_FR'], { required: false });
        expect(query(optional, 'sp-icon-asterisk100')).to.be.null;
    });

    it('renders the edit button when editable', async () => {
        const editable = await render(['fr_FR']);
        expect(query(editable, '.edit-button')).to.exist;
    });

    it('hides the edit button when readonly', async () => {
        const readonly = await render(['fr_FR'], { readonly: true });
        expect(query(readonly, '.edit-button')).to.be.null;
    });

    it('renders the selected list in sorted order', async () => {
        const el = await render(['fr_FR', 'de_DE']);
        query(el, '.toggle-btn').click();
        await el.updateComplete;
        expect(query(el, '.selected-list').textContent).to.equal('de_DE, fr_FR');
    });

    it('does not mutate the selected items when rendering the list', async () => {
        const selected = ['fr_FR', 'de_DE'];
        const el = await render(selected);
        query(el, '.toggle-btn').click();
        await el.updateComplete;
        expect(selected).to.deep.equal(['fr_FR', 'de_DE']);
    });

    it('expands and collapses the selected list from the header', async () => {
        const el = await render(['fr_FR', 'de_DE']);
        expect(query(el, '.selected-list')).to.be.null;
        query(el, '.toggle-btn').click();
        await el.updateComplete;
        expect(query(el, '.selected-list')).to.exist;
        query(el, '.toggle-btn').click();
        await el.updateComplete;
        expect(query(el, '.selected-list')).to.be.null;
    });

    it('does not toggle the list when the edit trigger is clicked', async () => {
        const el = await render(['fr_FR']);
        query(el, '.edit-button').click();
        await el.updateComplete;
        expect(el.expanded).to.be.false;
        query(el, '.selector-dialog').dispatchEvent(new Event('close', { bubbles: true, composed: true }));
    });

    it('projects slotted picker content into the dialog', async () => {
        const el = await render();
        const slot = query(el, '.selector-dialog slot');
        expect(slot.assignedElements()[0].classList.contains('picker')).to.be.true;
    });

    it('dispatches open when the trigger is clicked', async () => {
        const el = await render();
        const onOpen = sinon.spy();
        el.addEventListener('open', onOpen);
        query(el, '.add-button').click();
        expect(onOpen.calledOnce).to.be.true;
        query(el, '.selector-dialog').dispatchEvent(new Event('close', { bubbles: true, composed: true }));
    });

    it('dispatches confirm and closes the dialog on confirm', async () => {
        const el = await render();
        const onConfirm = sinon.spy();
        const onClose = sinon.spy();
        el.addEventListener('confirm', onConfirm);
        const dialog = query(el, '.selector-dialog');
        dialog.addEventListener('close', onClose);
        dialog.dispatchEvent(new Event('confirm'));
        expect(onConfirm.calledOnce).to.be.true;
        expect(onClose.called).to.be.true;
    });

    it('dispatches cancel and closes the dialog on cancel', async () => {
        const el = await render();
        const onCancel = sinon.spy();
        const onClose = sinon.spy();
        el.addEventListener('cancel', onCancel);
        const dialog = query(el, '.selector-dialog');
        dialog.addEventListener('close', onClose);
        dialog.dispatchEvent(new Event('cancel'));
        dialog.dispatchEvent(new Event('close'));
        expect(onCancel.calledOnce).to.be.true;
        expect(onClose.called).to.be.true;
    });

    it('restores unconfirmed selection on close before syncing the empty state', async () => {
        const el = await render();
        const onCancel = sinon.spy(() => {
            el.selected = [];
        });
        el.addEventListener('cancel', onCancel);
        query(el, '.add-button').dispatchEvent(new Event('click'));
        el.selected = ['fr_FR'];
        await el.updateComplete;
        const dialog = query(el, '.selector-dialog');
        dialog.dispatchEvent(new Event('close'));
        dialog.dispatchEvent(new Event('close'));
        await el.updateComplete;
        expect(onCancel.calledOnce).to.be.true;
        expect(el.showEmptyState).to.be.true;
    });

    it('resets confirmation when the dialog is reopened', async () => {
        const el = await render(['fr_FR']);
        const onCancel = sinon.spy();
        el.addEventListener('cancel', onCancel);
        query(el, '.edit-button').dispatchEvent(new Event('click'));
        const dialog = query(el, '.selector-dialog');
        dialog.dispatchEvent(new Event('confirm'));
        dialog.dispatchEvent(new Event('close'));
        expect(onCancel.called).to.be.false;
        query(el, '.edit-button').dispatchEvent(new Event('click'));
        dialog.dispatchEvent(new Event('close'));
        expect(onCancel.calledOnce).to.be.true;
    });

    it('keeps the empty state while the dialog is open and updates it on close', async () => {
        const el = await render();
        query(el, '.add-button').dispatchEvent(new Event('click'));
        el.selected = ['fr_FR'];
        await el.updateComplete;
        expect(el.showEmptyState).to.be.true;
        query(el, '.selector-dialog').dispatchEvent(new Event('confirm'));
        await el.updateComplete;
        expect(document.querySelector('mas-grouped-selector').showEmptyState).to.be.false;
    });

    it('updates the empty state when selection changes while the dialog is closed', async () => {
        const el = await render(['fr_FR']);
        el.selected = [];
        await el.updateComplete;
        expect(el.showEmptyState).to.be.true;
    });
});
