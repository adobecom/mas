import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import router from '../src/router.js';
import { PAGE_NAMES } from '../src/constants.js';
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

    it('opens the bulk edits page when the card is clicked', async () => {
        const el = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        bulkEditCard(el).click();
        expect(navigate.calledOnceWith(PAGE_NAMES.BULK_EDIT)).to.be.true;
    });

    it('opens the bulk edits page when the card is activated with Enter', async () => {
        const el = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        bulkEditCard(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(navigate.calledOnceWith(PAGE_NAMES.BULK_EDIT)).to.be.true;
    });
});
