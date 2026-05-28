import { expect, fixture, html } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-confirm-dialog.js';

describe('MasBulkPublishConfirmDialog', () => {
    it('cascade 옵션 체크박스 2개 렌더링', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog open project-title="Test" valid-count="5" skipped-count="0">
            </mas-bulk-publish-confirm-dialog>
        `);
        const checkboxes = el.shadowRoot.querySelectorAll('sp-checkbox');
        expect(checkboxes.length).to.equal(2);
    });

    it('기본값으로 두 체크박스 모두 미체크', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog open project-title="Test" valid-count="3"> </mas-bulk-publish-confirm-dialog>
        `);
        const checkboxes = el.shadowRoot.querySelectorAll('sp-checkbox');
        checkboxes.forEach((cb) => expect(!!cb.checked).to.be.false);
    });

    it('publish-confirmed에 includeVariations: false, includeCards: false 기본값', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog open project-title="Test" valid-count="3"> </mas-bulk-publish-confirm-dialog>
        `);
        let event;
        el.addEventListener('publish-confirmed', (e) => {
            event = e;
        });
        el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new Event('confirm'));
        expect(event).to.exist;
        expect(event.detail).to.deep.equal({ includeVariations: false, includeCards: false });
    });

    it('open이 false면 렌더링 없음', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog project-title="Test" valid-count="3"> </mas-bulk-publish-confirm-dialog>
        `);
        expect(el.shadowRoot.querySelector('sp-dialog-wrapper')).to.be.null;
    });

    it('cancel 시 publish-cancelled 발생', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-confirm-dialog open project-title="Test" valid-count="3"> </mas-bulk-publish-confirm-dialog>
        `);
        let cancelled = false;
        el.addEventListener('publish-cancelled', () => {
            cancelled = true;
        });
        el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new Event('cancel'));
        expect(cancelled).to.be.true;
    });
});
