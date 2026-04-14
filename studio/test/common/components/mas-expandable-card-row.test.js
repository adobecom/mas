import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import { CARD_MODEL_PATH } from '../../../src/constants.js';
import '../../../src/swc.js';
import '../../../src/common/components/mas-expandable-card-row.js';

describe('MasExpandableCardRow', () => {
    afterEach(() => {
        fixtureCleanup();
    });

    const cardWithVariation = {
        path: '/content/dam/mas/card-base',
        title: 'Parent',
        studioPath: 'studio/parent',
        model: { path: CARD_MODEL_PATH },
        tags: [{ id: 'mas:product_code/x', title: 'Offer' }],
        offerData: { offerId: 'OID' },
        fields: [{ name: 'variations', values: ['/content/dam/mas/card-base/pzn/g1/var1'] }],
        status: 'PUBLISHED',
    };

    it('renders nothing when card is missing', async () => {
        const el = await fixture(html`<mas-expandable-card-row .card=${null}></mas-expandable-card-row>`);
        expect(el.shadowRoot.textContent.trim()).to.equal('');
        expect(el.shadowRoot.querySelector('sp-table-row')).to.be.null;
    });

    it('dispatches selection-changed when main checkbox toggles', async () => {
        const handler = sinon.spy();
        const el = await fixture(html`
            <mas-expandable-card-row
                .card=${cardWithVariation}
                .selectedPaths=${new Set()}
                @selection-changed=${handler}
            ></mas-expandable-card-row>
        `);
        const cb = el.shadowRoot.querySelector('sp-checkbox');
        cb.click();
        expect(handler.calledOnce).to.be.true;
        expect(handler.firstCall.args[0].detail).to.deep.include({ path: cardWithVariation.path, selected: true });
    });

    it('dispatches load-variations when expanding with empty variations map', async () => {
        const handler = sinon.spy();
        const el = await fixture(html`
            <mas-expandable-card-row
                .card=${cardWithVariation}
                .variationsByPath=${new Map()}
                .selectedPaths=${new Set()}
                @load-variations=${handler}
            ></mas-expandable-card-row>
        `);
        const expandBtn = el.shadowRoot.querySelector('.expand-button');
        expandBtn.click();
        await el.updateComplete;
        expect(handler.calledOnce).to.be.true;
        expect(handler.firstCall.args[0].detail.cardPath).to.equal(cardWithVariation.path);
        expect(handler.firstCall.args[0].detail.variationPaths.length).to.be.greaterThan(0);
    });
});
