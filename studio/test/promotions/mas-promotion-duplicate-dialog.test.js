import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup, oneEvent } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/promotions/mas-promotion-duplicate-dialog.js';

describe('MasPromotionDuplicateDialog', () => {
    afterEach(() => {
        fixtureCleanup();
    });

    it('renders nothing when open is false', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog .proposedTitle=${'My Project'} .open=${false}></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-dialog-wrapper')).to.be.null;
    });

    it('renders dialog when open is true', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog .proposedTitle=${'My Project'} .open=${true}></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-dialog-wrapper')).to.exist;
    });

    it('syncs newTitle to proposedTitle when opened', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog .proposedTitle=${'Black Friday'} .open=${false}></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        el.open = true;
        await el.updateComplete;
        expect(el.newTitle).to.equal('Black Friday');
    });

    it('dispatches duplicate-confirmed with newTitle when confirm() is called', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog .proposedTitle=${'Original'} .open=${true}></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        el.newTitle = 'My Custom Name';
        setTimeout(() => el.confirm());
        const ev = await oneEvent(el, 'duplicate-confirmed');
        expect(ev.detail.title).to.equal('My Custom Name');
    });

    it('falls back to proposedTitle in duplicate-confirmed when newTitle is empty', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog .proposedTitle=${'Fallback Title'} .open=${true}></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        el.newTitle = '';
        setTimeout(() => el.confirm());
        const ev = await oneEvent(el, 'duplicate-confirmed');
        expect(ev.detail.title).to.equal('Fallback Title');
    });

    it('dispatches duplicate-cancelled when cancel() is called', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog .proposedTitle=${'X'} .open=${true}></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        setTimeout(() => el.cancel());
        const ev = await oneEvent(el, 'duplicate-cancelled');
        expect(ev).to.exist;
    });

    it('handleInput updates newTitle', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog .proposedTitle=${'X'} .open=${true}></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        el.handleInput({ target: { value: 'Updated Name' } });
        expect(el.newTitle).to.equal('Updated Name');
    });

    it('dispatches duplicate-cancelled when @close fires on the dialog wrapper', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog .proposedTitle=${'X'} .open=${true}></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        const wrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
        setTimeout(() => wrapper.dispatchEvent(new Event('close', { bubbles: true, composed: true })));
        const ev = await oneEvent(el, 'duplicate-cancelled');
        expect(ev).to.exist;
    });
});
