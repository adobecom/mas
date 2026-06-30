import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import { MasPublishDialog } from '../../src/publish/mas-publish-dialog.js';

const VARIATION = { id: 'var-1', path: '/content/dam/mas/sandbox/en_GB/my-fragment', status: 'DRAFT' };
const CARD = { id: 'card-1', path: '/content/dam/mas/sandbox/en_US/some-card', status: 'UNPUBLISHED' };

describe('MasPublishDialog', () => {
    afterEach(() => fixtureCleanup());

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

describe('MasPublishDialog.show()', () => {
    afterEach(() => {
        document.body.querySelectorAll('mas-publish-dialog').forEach((el) => el.remove());
    });

    it('resolves with confirmed:true and selectedIds when publish-confirmed fires', async () => {
        const promise = MasPublishDialog.show({ variations: [VARIATION], cards: [CARD] });

        const dialog = document.body.querySelector('mas-publish-dialog');
        dialog.dispatchEvent(
            new CustomEvent('publish-confirmed', {
                detail: { selectedIds: ['var-1'], allSelected: false },
            }),
        );

        const result = await promise;
        expect(result).to.deep.equal({ confirmed: true, selectedIds: ['var-1'], allSelected: false });
    });

    it('resolves with confirmed:false when publish-cancelled fires', async () => {
        const promise = MasPublishDialog.show({ variations: [VARIATION], cards: [] });

        const dialog = document.body.querySelector('mas-publish-dialog');
        dialog.dispatchEvent(new CustomEvent('publish-cancelled'));

        const result = await promise;
        expect(result).to.deep.equal({ confirmed: false, selectedIds: [], allSelected: false });
    });

    it('removes the dialog from DOM after confirm to prevent DOM leak', async () => {
        const promise = MasPublishDialog.show({ variations: [VARIATION], cards: [] });

        const dialog = document.body.querySelector('mas-publish-dialog');
        expect(dialog).to.exist;

        dialog.dispatchEvent(
            new CustomEvent('publish-confirmed', {
                detail: { selectedIds: [], allSelected: true },
            }),
        );
        await promise;

        expect(document.body.querySelector('mas-publish-dialog')).to.be.null;
    });

    it('removes the dialog from DOM after cancel to prevent DOM leak', async () => {
        const promise = MasPublishDialog.show({ variations: [VARIATION], cards: [] });

        const dialog = document.body.querySelector('mas-publish-dialog');
        dialog.dispatchEvent(new CustomEvent('publish-cancelled'));
        await promise;

        expect(document.body.querySelector('mas-publish-dialog')).to.be.null;
    });

    it('cleanup fires only once when publish-confirmed is dispatched twice', async () => {
        let removeCalls = 0;
        const origRemove = Element.prototype.remove;
        Element.prototype.remove = function () {
            if (this.tagName && this.tagName.toLowerCase() === 'mas-publish-dialog') removeCalls++;
            return origRemove.call(this);
        };

        try {
            const showPromise = MasPublishDialog.show({ variations: [VARIATION], cards: [] });
            const dialog = document.body.querySelector('mas-publish-dialog');

            const detail = { selectedIds: [], allSelected: true };
            dialog.dispatchEvent(new CustomEvent('publish-confirmed', { detail }));
            dialog.dispatchEvent(new CustomEvent('publish-confirmed', { detail }));

            await showPromise;
            expect(removeCalls).to.equal(1);
        } finally {
            Element.prototype.remove = origRemove;
        }
    });
});
