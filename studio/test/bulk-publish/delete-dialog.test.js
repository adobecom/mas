import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-delete-dialog.js';

describe('mas-bulk-publish-delete-dialog', () => {
    it('renders project title in body', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-delete-dialog .projectTitle=${'Summer Sale'} .open=${true}></mas-bulk-publish-delete-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.textContent).to.include('Summer Sale');
    });

    it('renders nothing when open is false', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-delete-dialog .projectTitle=${'X'} .open=${false}></mas-bulk-publish-delete-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-dialog-wrapper')).to.not.exist;
    });

    it('dispatches delete-confirmed when confirm() is called', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-delete-dialog .projectTitle=${'X'} .open=${true}></mas-bulk-publish-delete-dialog>
        `);
        await el.updateComplete;
        setTimeout(() => el.confirm());
        const ev = await oneEvent(el, 'delete-confirmed');
        expect(ev).to.exist;
    });

    it('dispatches delete-cancelled when cancel() is called', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-delete-dialog .projectTitle=${'X'} .open=${true}></mas-bulk-publish-delete-dialog>
        `);
        await el.updateComplete;
        setTimeout(() => el.cancel());
        const ev = await oneEvent(el, 'delete-cancelled');
        expect(ev).to.exist;
    });
});
