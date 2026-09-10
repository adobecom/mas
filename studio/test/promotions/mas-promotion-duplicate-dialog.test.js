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

    it('defaults duplicateVariations to false when opened', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog .proposedTitle=${'X'} .open=${true}></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        expect(el.duplicateVariations).to.be.false;
    });

    it('resets duplicateVariations to false each time the dialog reopens', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog .proposedTitle=${'X'} .open=${false}></mas-promotion-duplicate-dialog>
        `);
        el.duplicateVariations = true;
        el.open = false;
        await el.updateComplete;
        el.open = true;
        await el.updateComplete;
        expect(el.duplicateVariations).to.be.false;
    });

    it('includes duplicateVariations in duplicate-confirmed detail', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog .proposedTitle=${'Original'} .open=${true}></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        el.duplicateVariations = true;
        setTimeout(() => el.confirm());
        const ev = await oneEvent(el, 'duplicate-confirmed');
        expect(ev.detail.duplicateVariations).to.be.true;
    });

    it('handleDuplicateVariationsChange updates duplicateVariations from the checkbox', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog .proposedTitle=${'X'} .open=${true}></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        el.handleDuplicateVariationsChange({ target: { checked: true } });
        expect(el.duplicateVariations).to.be.true;
    });

    it('marks the textfield invalid when newTitle matches an existing title (case-insensitive)', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog
                .proposedTitle=${'Black Friday copy'}
                .existingTitles=${['Black Friday Copy']}
                .open=${true}
            ></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-textfield').hasAttribute('invalid')).to.be.true;
    });

    it('does not mark the textfield invalid for a unique title', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog
                .proposedTitle=${'Unique Title'}
                .existingTitles=${['Black Friday']}
                .open=${true}
            ></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-textfield').hasAttribute('invalid')).to.be.false;
    });

    it('does not dispatch duplicate-confirmed when the title matches an existing title', async () => {
        const el = await fixture(html`
            <mas-promotion-duplicate-dialog
                .proposedTitle=${'Black Friday'}
                .existingTitles=${['Black Friday']}
                .open=${true}
            ></mas-promotion-duplicate-dialog>
        `);
        await el.updateComplete;
        let dispatched = false;
        el.addEventListener('duplicate-confirmed', () => {
            dispatched = true;
        });
        el.confirm();
        await new Promise((r) => setTimeout(r, 20));
        expect(dispatched).to.be.false;
    });
});
