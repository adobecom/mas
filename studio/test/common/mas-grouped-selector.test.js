import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup, oneEvent } from '@open-wc/testing-helpers/pure';
import { sendKeys } from '@web/test-runner-commands';
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

const openDialog = async (el) => {
    const opened = oneEvent(query(el, 'overlay-trigger'), 'sp-opened');
    query(el, '.add-button').click();
    await opened;
};

describe('MasGroupedSelector', () => {
    afterEach(() => {
        fixtureCleanup();
    });

    it('renders the empty state when nothing is selected', async () => {
        const el = await render();
        const text = el.shadowRoot.textContent;
        expect(query(el, '.empty-state')).to.exist;
        expect(text).to.include('Select languages');
    });

    it('renders addLabel and description in the empty-state label', async () => {
        const el = await render();
        expect([
            query(el, '.empty-state .label strong').textContent,
            query(el, '.empty-state .label span').textContent,
        ]).to.deep.equal(['Add languages', 'Choose languages.']);
    });

    it('renders label and count when items are selected', async () => {
        const el = await render(['fr_FR', 'de_DE']);
        const header = query(el, '.selected-header h2');
        expect(query(el, '.empty-state')).to.be.null;
        expect(header.textContent).to.include('Selected languages');
        expect(header.textContent).to.include('(2)');
    });

    it('names the add button with addLabel', async () => {
        const el = await render();
        expect(query(el, '.add-button').getAttribute('aria-label')).to.equal('Add languages');
    });

    it('names the toggle button with label', async () => {
        const el = await render(['fr_FR']);
        expect(query(el, '.toggle-btn').getAttribute('aria-label')).to.equal('Selected languages');
    });

    it('names the edit button with its visible text', async () => {
        const el = await render(['fr_FR']);
        expect(query(el, '.edit-button').textContent.trim()).to.equal('Edit');
    });

    it('marks the toggle button expanded by default', async () => {
        const el = await render(['fr_FR']);
        expect(query(el, '.toggle-btn').getAttribute('aria-expanded')).to.equal('true');
    });

    it('marks the toggle button collapsed after collapsing', async () => {
        const el = await render(['fr_FR']);
        query(el, '.toggle-btn').click();
        await el.updateComplete;
        expect(query(el, '.toggle-btn').getAttribute('aria-expanded')).to.equal('false');
    });

    it('toggles the selected list with Enter', async () => {
        const el = await render(['fr_FR']);
        query(el, '.toggle-btn').focus();
        await sendKeys({ press: 'Enter' });
        await el.updateComplete;
        expect(query(el, '.selected-list')).to.be.null;
    });

    it('toggles the selected list with Space', async () => {
        const el = await render(['fr_FR']);
        query(el, '.toggle-btn').focus();
        await sendKeys({ press: 'Space' });
        await el.updateComplete;
        expect(query(el, '.selected-list')).to.be.null;
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
        expect(query(el, '.selected-list').textContent).to.equal('de_DE, fr_FR');
    });

    it('does not mutate the selected items when rendering the list', async () => {
        const selected = ['fr_FR', 'de_DE'];
        const el = await render(selected);
        expect(query(el, '.selected-list')).to.exist;
        expect(selected).to.deep.equal(['fr_FR', 'de_DE']);
    });

    it('collapses the selected list from the toggle button', async () => {
        const el = await render(['fr_FR', 'de_DE']);
        expect(query(el, '.selected-list')).to.exist;
        query(el, '.toggle-btn').click();
        await el.updateComplete;
        expect(query(el, '.selected-list')).to.be.null;
    });

    it('expands the selected list from the toggle button', async () => {
        const el = await render(['fr_FR', 'de_DE']);
        el.expanded = false;
        await el.updateComplete;
        expect(query(el, '.selected-list')).to.be.null;
        query(el, '.toggle-btn').click();
        await el.updateComplete;
        expect(query(el, '.selected-list')).to.exist;
    });

    it('does not toggle the list when the edit trigger is clicked', async () => {
        const el = await render(['fr_FR']);
        query(el, '.edit-button').click();
        await el.updateComplete;
        expect(el.expanded).to.be.true;
        query(el, '.selector-dialog').dispatchEvent(new Event('close', { bubbles: true, composed: true }));
    });

    it('does not toggle the list when the header outside the toggle button is clicked', async () => {
        const el = await render(['fr_FR']);
        query(el, '.selected-header').click();
        await el.updateComplete;
        expect(el.expanded).to.be.true;
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
        query(el, '.add-button').dispatchEvent(new Event('click'));
        expect(onOpen.calledOnce).to.be.true;
        query(el, '.selector-dialog').dispatchEvent(new Event('close', { bubbles: true, composed: true }));
    });

    it('dispatches confirm on confirm', async () => {
        const el = await render();
        const onConfirm = sinon.spy();
        el.addEventListener('confirm', onConfirm);
        query(el, '.selector-dialog').dispatchEvent(new Event('confirm'));
        expect(onConfirm.calledOnce).to.be.true;
    });

    it('closes the dialog on confirm', async () => {
        const el = await render();
        const onClose = sinon.spy();
        const dialog = query(el, '.selector-dialog');
        dialog.addEventListener('close', onClose);
        dialog.dispatchEvent(new Event('confirm'));
        expect(onClose.called).to.be.true;
    });

    it('keeps the dialog open when the confirm handler reports failure', async () => {
        const el = await render();
        el.addEventListener('confirm', ({ detail }) => {
            detail.pending = Promise.resolve(false);
        });
        const onClose = sinon.spy();
        const dialog = query(el, '.selector-dialog');
        dialog.addEventListener('close', onClose);
        dialog.dispatchEvent(new Event('confirm'));
        await Promise.resolve();
        await Promise.resolve();
        expect(onClose.called).to.be.false;
    });

    it('closes the dialog once the confirm handler succeeds', async () => {
        const el = await render();
        let resolve;
        el.addEventListener('confirm', ({ detail }) => {
            detail.pending = new Promise((r) => {
                resolve = r;
            });
        });
        const onClose = sinon.spy();
        const dialog = query(el, '.selector-dialog');
        dialog.addEventListener('close', onClose);
        dialog.dispatchEvent(new Event('confirm'));
        expect(onClose.called).to.be.false;
        resolve(true);
        await Promise.resolve();
        await Promise.resolve();
        expect(onClose.calledOnce).to.be.true;
    });

    const holdConfirm = (el) => {
        const control = {};
        el.addEventListener('confirm', ({ detail }) => {
            detail.pending = new Promise((resolve, reject) => Object.assign(control, { resolve, reject }));
        });
        return control;
    };

    it('ignores a second confirm while the first is pending', async () => {
        const el = await render();
        holdConfirm(el);
        const onConfirm = sinon.spy();
        el.addEventListener('confirm', onConfirm);
        const dialog = query(el, '.selector-dialog');
        dialog.dispatchEvent(new Event('confirm'));
        dialog.dispatchEvent(new Event('confirm'));
        expect(onConfirm.calledOnce).to.be.true;
    });

    it('ignores cancel while confirm is pending', async () => {
        const el = await render();
        holdConfirm(el);
        const onClose = sinon.spy();
        const dialog = query(el, '.selector-dialog');
        dialog.addEventListener('close', onClose);
        dialog.dispatchEvent(new Event('confirm'));
        dialog.dispatchEvent(new Event('cancel'));
        expect(onClose.called).to.be.false;
    });

    it('does not dismiss on Escape while confirm is pending', async () => {
        const el = await render();
        holdConfirm(el);
        await openDialog(el);
        const onCancel = sinon.spy();
        el.addEventListener('cancel', onCancel);
        query(el, '.selector-dialog').dispatchEvent(new Event('confirm'));
        await sendKeys({ press: 'Escape' });
        await el.updateComplete;
        expect(onCancel.called).to.be.false;
        expect(query(el, 'overlay-trigger').open).to.equal('click');
    });

    it('prevents default on Escape keydown while confirm is pending', async () => {
        const el = await render();
        holdConfirm(el);
        const dialog = query(el, '.selector-dialog');
        dialog.dispatchEvent(new Event('confirm'));
        const keydown = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
        dialog.dispatchEvent(keydown);
        expect(keydown.defaultPrevented).to.be.true;
    });

    it('closes the dialog on Escape keydown when idle', async () => {
        const el = await render();
        const onClose = sinon.spy();
        const dialog = query(el, '.selector-dialog');
        dialog.addEventListener('close', onClose);
        const keydown = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
        dialog.dispatchEvent(keydown);
        expect(onClose.calledOnce).to.be.true;
        expect(keydown.defaultPrevented).to.be.false;
    });

    it('discards unsaved dialog changes when Escape is pressed', async () => {
        const el = await render(['fr_FR']);
        el.addEventListener('cancel', () => {
            el.selected = ['fr_FR'];
        });
        query(el, '.edit-button').dispatchEvent(new Event('click'));
        el.selected = ['fr_FR', 'de_DE'];
        await el.updateComplete;
        query(el, '.selector-dialog').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
        await el.updateComplete;
        expect(el.selected).to.deep.equal(['fr_FR']);
        expect(query(el, '.selected-list').textContent).to.equal('fr_FR');
    });

    it('ignores non-Escape keydown on the dialog', async () => {
        const el = await render();
        const onClose = sinon.spy();
        const dialog = query(el, '.selector-dialog');
        dialog.addEventListener('close', onClose);
        dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
        expect(onClose.called).to.be.false;
    });

    it('shows progress on the confirm button while pending', async () => {
        const el = await render();
        holdConfirm(el);
        query(el, '.selector-dialog').dispatchEvent(new Event('confirm'));
        await el.updateComplete;
        expect(query(el, '.selector-dialog').confirmLabel).to.equal('Confirming…');
    });

    it('restores the confirm label once pending settles', async () => {
        const el = await render();
        const control = holdConfirm(el);
        query(el, '.selector-dialog').dispatchEvent(new Event('confirm'));
        control.resolve(false);
        await el.updateComplete;
        await el.updateComplete;
        expect(query(el, '.selector-dialog').confirmLabel).to.equal('Confirm');
    });

    it('keeps the dialog open and accepts a retry when pending rejects', async () => {
        const el = await render();
        const control = holdConfirm(el);
        const onClose = sinon.spy();
        const dialog = query(el, '.selector-dialog');
        dialog.addEventListener('close', onClose);
        dialog.dispatchEvent(new Event('confirm'));
        control.reject(new Error('AEM down'));
        await el.updateComplete;
        await el.updateComplete;
        expect(onClose.called).to.be.false;
        expect(el.applying).to.be.false;
    });

    it('dispatches cancel once on cancel followed by close', async () => {
        const el = await render();
        const onCancel = sinon.spy();
        el.addEventListener('cancel', onCancel);
        query(el, '.add-button').dispatchEvent(new Event('click'));
        const dialog = query(el, '.selector-dialog');
        dialog.dispatchEvent(new Event('cancel'));
        dialog.dispatchEvent(new Event('close'));
        expect(onCancel.calledOnce).to.be.true;
    });

    it('dispatches cancel when Escape dismisses the dialog', async () => {
        const el = await render();
        await openDialog(el);
        const cancelled = oneEvent(el, 'cancel');
        await sendKeys({ press: 'Escape' });
        expect(await cancelled).to.exist;
    });

    it('returns focus to the add trigger when Escape dismisses the dialog', async () => {
        const el = await render();
        await openDialog(el);
        const closed = oneEvent(query(el, 'overlay-trigger'), 'sp-closed');
        await sendKeys({ press: 'Escape' });
        await closed;
        expect(el.shadowRoot.activeElement?.matches('.add-button')).to.be.true;
    });

    it('ignores close when the dialog is not open', async () => {
        const el = await render();
        const onCancel = sinon.spy();
        el.addEventListener('cancel', onCancel);
        query(el, '.selector-dialog').dispatchEvent(new Event('close'));
        expect(onCancel.called).to.be.false;
    });

    it('ignores confirm, cancel and close events bubbling from slotted content', async () => {
        const el = await render();
        const ownEvents = [];
        for (const type of ['confirm', 'cancel']) {
            el.addEventListener(type, ({ target }) => target === el && ownEvents.push(type));
        }
        const dialog = query(el, '.selector-dialog');
        const onClose = sinon.spy();
        dialog.addEventListener('close', ({ target }) => target === dialog && onClose());
        const picker = el.querySelector('.picker');
        for (const type of ['confirm', 'cancel', 'close']) {
            picker.dispatchEvent(new Event(type, { bubbles: true }));
        }
        expect(ownEvents).to.deep.equal([]);
        expect(onClose.called).to.be.false;
    });

    it('closes the dialog on cancel', async () => {
        const el = await render();
        const onClose = sinon.spy();
        const dialog = query(el, '.selector-dialog');
        dialog.addEventListener('close', onClose);
        dialog.dispatchEvent(new Event('cancel'));
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

    it('focuses the edit trigger when the first confirm replaces the empty state', async () => {
        const el = await render();
        query(el, '.add-button').dispatchEvent(new Event('click'));
        el.selected = ['fr_FR'];
        query(el, '.selector-dialog').dispatchEvent(new Event('confirm'));
        await el.updateComplete;
        await el.updateComplete;
        expect(el.shadowRoot.activeElement?.matches('.edit-button')).to.be.true;
    });

    it('focuses the add trigger when removing every item restores the empty state', async () => {
        const el = await render(['fr_FR']);
        query(el, '.edit-button').dispatchEvent(new Event('click'));
        el.selected = [];
        query(el, '.selector-dialog').dispatchEvent(new Event('confirm'));
        await el.updateComplete;
        await el.updateComplete;
        expect(el.shadowRoot.activeElement?.matches('.add-button')).to.be.true;
    });

    it('focuses the add trigger when cancel restores an empty selection', async () => {
        const el = await render(['fr_FR']);
        el.addEventListener('cancel', () => {
            el.selected = [];
        });
        query(el, '.edit-button').dispatchEvent(new Event('click'));
        query(el, '.selector-dialog').dispatchEvent(new Event('cancel'));
        await el.updateComplete;
        await el.updateComplete;
        expect(el.shadowRoot.activeElement?.matches('.add-button')).to.be.true;
    });

    it('does not move focus when cancel leaves the empty state unchanged', async () => {
        const el = await render(['fr_FR']);
        query(el, '.edit-button').dispatchEvent(new Event('click'));
        query(el, '.selector-dialog').dispatchEvent(new Event('cancel'));
        await el.updateComplete;
        await el.updateComplete;
        expect(el.shadowRoot.activeElement).to.be.null;
    });

    it('does not move focus when selection empties while the dialog is closed', async () => {
        const el = await render(['fr_FR']);
        el.selected = [];
        await el.updateComplete;
        expect(el.shadowRoot.activeElement === null).to.be.true;
    });

    it('updates the empty state when selection changes while the dialog is closed', async () => {
        const el = await render(['fr_FR']);
        el.selected = [];
        await el.updateComplete;
        expect(el.showEmptyState).to.be.true;
    });

    it('disables the triggers when disabled', async () => {
        const empty = await render();
        empty.disabled = true;
        await empty.updateComplete;
        expect(query(empty, '.add-button').disabled).to.be.true;
        fixtureCleanup();
        const filled = await render(['fr_FR']);
        filled.disabled = true;
        await filled.updateComplete;
        expect(query(filled, '.edit-button').disabled).to.be.true;
    });
});
