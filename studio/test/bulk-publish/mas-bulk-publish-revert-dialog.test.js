import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-revert-dialog.js';

describe('mas-bulk-publish-revert-dialog', () => {
    it('renders nothing when open=false', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-revert-dialog .projectTitle=${'My Project'} .open=${false}></mas-bulk-publish-revert-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-dialog-wrapper')).to.not.exist;
    });

    it('renders with project title when open=true', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-revert-dialog .projectTitle=${'Holiday Sale'} .open=${true}></mas-bulk-publish-revert-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-dialog-wrapper')).to.exist;
        expect(el.shadowRoot.textContent).to.include('Holiday Sale');
    });

    it('dispatches revert-confirmed (bubbles, composed) on confirm click', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-revert-dialog .projectTitle=${'Test Project'} .open=${true}></mas-bulk-publish-revert-dialog>
        `);
        await el.updateComplete;
        setTimeout(() => el.confirm());
        const ev = await oneEvent(el, 'revert-confirmed');
        expect(ev).to.exist;
        expect(ev.bubbles).to.equal(true);
        expect(ev.composed).to.equal(true);
    });

    it('dispatches revert-cancelled on cancel', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-revert-dialog .projectTitle=${'Test Project'} .open=${true}></mas-bulk-publish-revert-dialog>
        `);
        await el.updateComplete;
        setTimeout(() => el.cancel());
        const ev = await oneEvent(el, 'revert-cancelled');
        expect(ev).to.exist;
    });
});
