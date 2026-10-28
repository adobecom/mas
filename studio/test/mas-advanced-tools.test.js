import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import router from '../src/router.js';
import '../src/mas-advanced-tools.js';

describe('mas-advanced-tools', () => {
    let navigate;

    const bulkEditCard = (el) =>
        [...el.shadowRoot.querySelectorAll('.tool-card')].find(
            (card) => card.querySelector('.tool-card-title').textContent === 'Bulk edits',
        );

    beforeEach(() => {
        navigate = sinon.stub(router, 'navigateToPage').returns(() => {});
    });

    afterEach(() => {
        sinon.restore();
    });

    it('renders the bulk edits card with its icon', async () => {
        const el = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        const card = bulkEditCard(el);
        expect(card).to.exist;
        expect(card.querySelector('.tool-card-icon svg')).to.exist;
    });

    it('renders the bulk edits card as disabled', async () => {
        const el = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        const card = bulkEditCard(el);
        expect(card.getAttribute('aria-disabled')).to.equal('true');
        expect(card.getAttribute('tabindex')).to.equal('-1');
    });

    it('does not navigate when the disabled card is clicked', async () => {
        const el = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        bulkEditCard(el).click();
        expect(navigate.called).to.be.false;
    });

    it('does not navigate when the disabled card receives Enter', async () => {
        const el = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        bulkEditCard(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(navigate.called).to.be.false;
    });
});
