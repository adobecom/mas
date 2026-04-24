import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-confirm-dialog.js';

describe('mas-bulk-publish-confirm-dialog', () => {
    it('renders title, body, and counts', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${'Back to School'}
                .itemCount=${15}
                .open=${true}
            ></mas-bulk-publish-confirm-dialog>
        `);
        await el.updateComplete;
        const text = el.shadowRoot.textContent;
        expect(text).to.include('Publish project');
        expect(text).to.include('Back to School');
        expect(text).to.include('15');
        expect(text).to.include('Now');
    });

    it('dispatches publish-confirmed when primary button clicked', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${'X'}
                .itemCount=${1}
                .open=${true}
            ></mas-bulk-publish-confirm-dialog>
        `);
        await el.updateComplete;
        setTimeout(() => el.shadowRoot.querySelector('[data-testid="publish-btn"]').click());
        const ev = await oneEvent(el, 'publish-confirmed');
        expect(ev).to.exist;
    });

    it('dispatches publish-cancelled when Cancel clicked', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${'X'}
                .itemCount=${1}
                .open=${true}
            ></mas-bulk-publish-confirm-dialog>
        `);
        await el.updateComplete;
        setTimeout(() => el.shadowRoot.querySelector('[data-testid="cancel-btn"]').click());
        const ev = await oneEvent(el, 'publish-cancelled');
        expect(ev).to.exist;
    });
});
