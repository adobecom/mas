import { expect, fixture, html } from '@open-wc/testing';
import '../../src/publish/mas-publish-dialog.js';

const VARIATION = { id: 'var-1', path: '/content/dam/mas/sandbox/en_GB/my-fragment', status: 'DRAFT' };
const CARD = { id: 'card-1', path: '/content/dam/mas/sandbox/en_US/some-card', status: 'UNPUBLISHED' };

describe('MasPublishDialog', () => {
    it('renders nothing when open is false', async () => {
        const el = await fixture(html`<mas-publish-dialog></mas-publish-dialog>`);
        expect(el.shadowRoot.querySelector('sp-dialog')).to.be.null;
    });

    it('renders Select All checkbox and individual checkboxes when open is true', async () => {
        const el = await fixture(html`<mas-publish-dialog></mas-publish-dialog>`);
        el.refs = { variations: [VARIATION], cards: [CARD] };
        el.open = true;
        await el.updateComplete;
        // 1 Select All + 2 individual = 3 total
        const checkboxes = el.shadowRoot.querySelectorAll('sp-checkbox');
        expect(checkboxes.length).to.equal(3);
    });

    it('all individual checkboxes are unchecked by default', async () => {
        const el = await fixture(html`<mas-publish-dialog></mas-publish-dialog>`);
        el.refs = { variations: [VARIATION], cards: [CARD] };
        el.open = true;
        await el.updateComplete;
        const checkboxes = el.shadowRoot.querySelectorAll('sp-checkbox[data-ref-id]');
        checkboxes.forEach((cb) => expect(!!cb.checked).to.be.false);
    });

    it('confirm with nothing selected emits empty selectedIds and allSelected false', async () => {
        const el = await fixture(html`<mas-publish-dialog></mas-publish-dialog>`);
        el.refs = { variations: [VARIATION], cards: [CARD] };
        el.open = true;
        await el.updateComplete;

        let event;
        el.addEventListener('publish-confirmed', (e) => {
            event = e;
        });
        el.confirm();
        expect(event).to.exist;
        expect(event.detail.selectedIds).to.deep.equal([]);
        expect(event.detail.allSelected).to.be.false;
    });

    it('checking Select All checks all individual checkboxes', async () => {
        const el = await fixture(html`<mas-publish-dialog></mas-publish-dialog>`);
        el.refs = { variations: [VARIATION], cards: [CARD] };
        el.open = true;
        await el.updateComplete;

        const selectAll = el.shadowRoot.querySelector('sp-checkbox[data-select-all]');
        selectAll.checked = true;
        selectAll.dispatchEvent(new Event('change'));
        await el.updateComplete;

        const refCheckboxes = el.shadowRoot.querySelectorAll('sp-checkbox[data-ref-id]');
        refCheckboxes.forEach((cb) => expect(!!cb.checked).to.be.true);
    });

    it('confirm after Select All emits allSelected true', async () => {
        const el = await fixture(html`<mas-publish-dialog></mas-publish-dialog>`);
        el.refs = { variations: [VARIATION], cards: [CARD] };
        el.open = true;
        await el.updateComplete;

        const selectAll = el.shadowRoot.querySelector('sp-checkbox[data-select-all]');
        selectAll.checked = true;
        selectAll.dispatchEvent(new Event('change'));
        await el.updateComplete;

        let event;
        el.addEventListener('publish-confirmed', (e) => {
            event = e;
        });
        el.confirm();
        expect(event.detail.selectedIds).to.include.members(['var-1', 'card-1']);
        expect(event.detail.allSelected).to.be.true;
    });

    it('cancel emits publish-cancelled', async () => {
        const el = await fixture(html`<mas-publish-dialog></mas-publish-dialog>`);
        el.refs = { variations: [VARIATION], cards: [] };
        el.open = true;
        await el.updateComplete;

        let cancelled = false;
        el.addEventListener('publish-cancelled', () => {
            cancelled = true;
        });
        el.cancel();
        expect(cancelled).to.be.true;
    });
});
