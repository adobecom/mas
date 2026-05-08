import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-confirm-dialog.js';

describe('mas-bulk-publish-confirm-dialog', () => {
    it('renders project title and item counts', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${'Back to School'}
                .validCount=${14}
                .skippedCount=${1}
                .open=${true}
            ></mas-bulk-publish-confirm-dialog>
        `);
        await el.updateComplete;
        const text = el.shadowRoot.textContent;
        expect(text).to.include('Back to School');
        expect(text).to.include('14 of 15');
    });

    it('shows skipped warning when skippedCount > 0', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${'Test'}
                .validCount=${14}
                .skippedCount=${1}
                .open=${true}
            ></mas-bulk-publish-confirm-dialog>
        `);
        await el.updateComplete;
        const warning = el.shadowRoot.querySelector('.warning');
        expect(warning).to.exist;
        expect(warning.textContent).to.include('1');
        expect(warning.textContent).to.include('14');
    });

    it('hides skipped warning when all items are valid', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${'Test'}
                .validCount=${15}
                .skippedCount=${0}
                .open=${true}
            ></mas-bulk-publish-confirm-dialog>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.warning')).to.not.exist;
    });

    it('dispatches publish-confirmed when confirm() is called', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${'X'}
                .validCount=${1}
                .skippedCount=${0}
                .open=${true}
            ></mas-bulk-publish-confirm-dialog>
        `);
        await el.updateComplete;
        setTimeout(() => el.confirm());
        const ev = await oneEvent(el, 'publish-confirmed');
        expect(ev).to.exist;
    });

    it('dispatches publish-cancelled when cancel() is called', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog
                .projectTitle=${'X'}
                .validCount=${1}
                .skippedCount=${0}
                .open=${true}
            ></mas-bulk-publish-confirm-dialog>
        `);
        await el.updateComplete;
        setTimeout(() => el.cancel());
        const ev = await oneEvent(el, 'publish-cancelled');
        expect(ev).to.exist;
    });
});
