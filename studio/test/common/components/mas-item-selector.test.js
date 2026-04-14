import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, TABLE_TYPE } from '../../../src/constants.js';
import '../../../src/swc.js';
import '../../../src/common/components/mas-item-selector.js';
import { TABS } from '../../../src/common/components/mas-item-selector.js';

describe('MasItemSelector', () => {
    afterEach(() => {
        fixtureCleanup();
    });

    const card = {
        path: '/c/card1',
        title: 'C1',
        studioPath: 's',
        model: { path: CARD_MODEL_PATH },
    };
    const collection = {
        path: '/c/col1',
        title: 'Col',
        studioPath: 'sc',
        model: { path: COLLECTION_MODEL_PATH },
    };
    const placeholder = { path: '/c/ph1', key: 'k', value: 'v' };

    describe('TABS', () => {
        it('exports three tabs matching TABLE_TYPE', () => {
            expect(TABS).to.have.lengthOf(3);
            expect(TABS.map((t) => t.value)).to.deep.equal([
                TABLE_TYPE.CARDS,
                TABLE_TYPE.COLLECTIONS,
                TABLE_TYPE.PLACEHOLDERS,
            ]);
        });
    });

    describe('selectedCount and selectedItems', () => {
        it('counts selections across types', async () => {
            const el = await fixture(html`
                <mas-item-selector
                    .cards=${[card]}
                    .collections=${[collection]}
                    .placeholders=${[placeholder]}
                    .selectedCardPaths=${new Set([card.path])}
                    .selectedCollectionPaths=${new Set([collection.path])}
                    .selectedPlaceholderPaths=${new Set()}
                ></mas-item-selector>
            `);
            expect(el.selectedCount).to.equal(2);
            expect(el.selectedItems.map((i) => i.path)).to.deep.equal([card.path, collection.path]);
        });
    });

    describe('selection-changed from selected panel', () => {
        it('re-emits selection-changed with selected false when panel removes item', async () => {
            const handler = sinon.spy();
            const el = await fixture(html`
                <mas-item-selector
                    .cards=${[card]}
                    .collections=${[]}
                    .placeholders=${[]}
                    .selectedCardPaths=${new Set([card.path])}
                    .selectedCollectionPaths=${new Set()}
                    .selectedPlaceholderPaths=${new Set()}
                    .showSelected=${true}
                    @selection-changed=${handler}
                ></mas-item-selector>
            `);
            el.showSelected = true;
            await el.updateComplete;
            const panel = el.shadowRoot.querySelector('mas-items-selected-panel');
            expect(panel).to.exist;
            panel.dispatchEvent(
                new CustomEvent('remove-item', {
                    detail: { path: card.path, item: card },
                    bubbles: true,
                    composed: true,
                }),
            );
            expect(handler.calledOnce).to.be.true;
            expect(handler.firstCall.args[0].detail).to.deep.equal({ path: card.path, selected: false });
        });
    });

    describe('viewOnly', () => {
        it('hides search filters and selected panel', async () => {
            const el = await fixture(html`<mas-item-selector .viewOnly=${true} .cards=${[card]}></mas-item-selector>`);
            expect(el.shadowRoot.querySelector('mas-items-search-filters')).to.be.null;
            expect(el.shadowRoot.querySelector('mas-items-selected-panel')).to.be.null;
        });
    });
});
