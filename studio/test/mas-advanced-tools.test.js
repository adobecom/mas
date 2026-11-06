import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import router from '../src/router.js';
import { PAGE_NAMES } from '../src/constants.js';
import '../src/mas-advanced-tools.js';

describe('mas-advanced-tools', () => {
    let navigate;

    const bulkEditCard = (el) =>
        [...el.shadowRoot.querySelectorAll('.tool-card')].find(
            (card) => card.querySelector('.tool-card-title').textContent === 'Find and replace',
        );

    beforeEach(() => {
        navigate = sinon.stub(router, 'navigateToPage').returns(() => {});
    });

    afterEach(() => {
        sinon.restore();
    });

    it('renders the find and replace card with its icon', async () => {
        const el = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        const card = bulkEditCard(el);
        expect(card).to.exist;
        expect(card.querySelector('.tool-card-icon svg')).to.exist;
    });

    it('renders the find and replace card as keyboard accessible', async () => {
        const el = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        const card = bulkEditCard(el);
        expect(card.hasAttribute('aria-disabled')).to.be.false;
        expect(card.getAttribute('tabindex')).to.equal('0');
    });

    it('opens the project list when the card is clicked', async () => {
        const el = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        bulkEditCard(el).click();
        expect(navigate.calledWith(PAGE_NAMES.BULK_EDIT)).to.be.true;
    });

    it('opens the project list when the card receives Enter', async () => {
        const el = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        bulkEditCard(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(navigate.calledWith(PAGE_NAMES.BULK_EDIT)).to.be.true;
    });

    it('opens the project list with Space and prevents scrolling', async () => {
        const el = await fixture(html`<mas-advanced-tools></mas-advanced-tools>`);
        const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
        bulkEditCard(el).dispatchEvent(event);
        expect(navigate.calledWith(PAGE_NAMES.BULK_EDIT)).to.be.true;
        expect(event.defaultPrevented).to.be.true;
    });
});
