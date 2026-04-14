import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, TABLE_TYPE, FRAGMENT_STATUS } from '../../../src/constants.js';
import '../../../src/swc.js';
import '../../../src/common/components/mas-items-table.js';

describe('MasItemsTable', () => {
    afterEach(() => {
        fixtureCleanup();
    });

    const mockCard = {
        path: '/content/card-1',
        title: 'Card',
        studioPath: 'studio/card',
        model: { path: CARD_MODEL_PATH },
        tags: [],
        status: FRAGMENT_STATUS.PUBLISHED,
    };

    const mockCollection = {
        path: '/content/col-1',
        title: 'Col',
        studioPath: 'studio/col',
        model: { path: COLLECTION_MODEL_PATH },
        status: FRAGMENT_STATUS.PUBLISHED,
    };

    const mockPlaceholder = {
        path: '/content/ph-1',
        key: 'k',
        value: 'v',
        status: FRAGMENT_STATUS.PUBLISHED,
    };

    describe('tableColumns', () => {
        it('returns selectable columns for cards', async () => {
            const el = await fixture(html`<mas-items-table type=${TABLE_TYPE.CARDS}></mas-items-table>`);
            expect(el.tableColumns.some((c) => c.key === 'checkbox')).to.be.true;
            expect(el.tableColumns.some((c) => c.key === 'fragmentTitle')).to.be.true;
        });

        it('returns view-only columns for cards when viewOnly', async () => {
            const el = await fixture(html`<mas-items-table type=${TABLE_TYPE.CARDS} .viewOnly=${true}></mas-items-table>`);
            expect(el.tableColumns.some((c) => c.key === 'itemType')).to.be.true;
            expect(el.tableColumns.some((c) => c.key === 'checkbox')).to.be.false;
        });

        it('returns columns for placeholders', async () => {
            const el = await fixture(html`<mas-items-table type=${TABLE_TYPE.PLACEHOLDERS}></mas-items-table>`);
            expect(el.tableColumns.some((c) => c.key === 'key')).to.be.true;
        });
    });

    describe('render states', () => {
        it('shows loading indicator when loading', async () => {
            const el = await fixture(html`<mas-items-table .loading=${true}></mas-items-table>`);
            expect(el.shadowRoot.querySelector('sp-progress-circle')).to.exist;
        });

        it('shows empty message when not loading and no items', async () => {
            const el = await fixture(html`<mas-items-table .loading=${false} .items=${[]}></mas-items-table>`);
            expect(el.shadowRoot.textContent).to.include('No items found');
        });

        it('renders table for collections', async () => {
            const el = await fixture(html`
                <mas-items-table type=${TABLE_TYPE.COLLECTIONS} .items=${[mockCollection]} .selectedPaths=${new Set()}></mas-items-table>
            `);
            expect(el.shadowRoot.querySelector('sp-table')).to.exist;
        });
    });

    describe('selection-changed', () => {
        it('dispatches selection-changed when toggling collection row', async () => {
            const handler = sinon.spy();
            const el = await fixture(html`
                <mas-items-table
                    type=${TABLE_TYPE.COLLECTIONS}
                    .items=${[mockCollection]}
                    .selectedPaths=${new Set()}
                    @selection-changed=${handler}
                ></mas-items-table>
            `);
            const row = el.shadowRoot.querySelector('sp-table-row');
            const cb = row.querySelector('sp-checkbox');
            cb.click();
            expect(handler.calledOnce).to.be.true;
            expect(handler.firstCall.args[0].detail).to.deep.include({ path: mockCollection.path, selected: true });
        });
    });
});
