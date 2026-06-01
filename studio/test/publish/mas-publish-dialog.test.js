import { expect, fixture, html } from '@open-wc/testing';
import '../../src/publish/mas-publish-dialog.js';

const VARIATION = { id: 'var-1', path: '/content/dam/mas/sandbox/en_GB/my-fragment', status: 'DRAFT' };
const CARD = { id: 'card-1', path: '/content/dam/mas/sandbox/en_US/some-card', status: 'UNPUBLISHED' };

describe('MasPublishDialog', () => {
    it('open이 false면 아무것도 렌더링하지 않음', async () => {
        const el = await fixture(html`<mas-publish-dialog></mas-publish-dialog>`);
        expect(el.shadowRoot.querySelector('sp-dialog')).to.be.null;
    });

    it('open이 true면 Select All + 개별 체크박스 렌더링', async () => {
        const el = await fixture(html`<mas-publish-dialog></mas-publish-dialog>`);
        el.refs = { variations: [VARIATION], cards: [CARD] };
        el.open = true;
        await el.updateComplete;
        // Select All 1개 + 개별 2개 = 3개
        const checkboxes = el.shadowRoot.querySelectorAll('sp-checkbox');
        expect(checkboxes.length).to.equal(3);
    });

    it('기본값으로 모든 개별 체크박스가 미체크', async () => {
        const el = await fixture(html`<mas-publish-dialog></mas-publish-dialog>`);
        el.refs = { variations: [VARIATION], cards: [CARD] };
        el.open = true;
        await el.updateComplete;
        const checkboxes = el.shadowRoot.querySelectorAll('sp-checkbox[data-ref-id]');
        checkboxes.forEach((cb) => expect(!!cb.checked).to.be.false);
    });

    it('아무것도 선택 안 하고 confirm 시 selectedIds 비어있고 allSelected false', async () => {
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

    it('Select All 체크 시 모든 개별 체크박스가 체크됨', async () => {
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

    it('Select All 체크 후 confirm 시 allSelected: true', async () => {
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

    it('cancel 시 publish-cancelled 발생', async () => {
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
