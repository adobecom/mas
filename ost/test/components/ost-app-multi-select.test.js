import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-app.js';
import { store } from '../../src/store/ost-store.js';

describe('ost-app multi-select handback (base + trial)', () => {
    function seedTryBuySelection() {
        store.authoringFlow = 'tryBuy';
        store.selectedOffers = [
            { role: 'base', osi: 'OSI_BASE', offer: { offer_id: 'b1' } },
            { role: 'trial', osi: 'OSI_TRIAL', offer: { offer_id: 't1' } },
        ];
        store.country = 'US';
        store.onMultiSelect = null;
    }

    it('selectMulti hands back the base and trial selections via onMultiSelect', async () => {
        const el = await fixture(html`<ost-app></ost-app>`);
        seedTryBuySelection();
        let received;
        store.onMultiSelect = (detail) => {
            received = detail;
        };

        el.selectMulti();

        expect(received.base).to.deep.equal({ osi: 'OSI_BASE', offer: { offer_id: 'b1' } });
        expect(received.trial).to.deep.equal({ osi: 'OSI_TRIAL', offer: { offer_id: 't1' } });
        expect(received.country).to.equal('US');
    });

    it('routes a tryBuy footer Use to the multi-select handback when onMultiSelect is provided', async () => {
        const el = await fixture(html`<ost-app></ost-app>`);
        seedTryBuySelection();
        let calls = 0;
        store.onMultiSelect = () => {
            calls += 1;
        };

        el.handleFooterUse();

        expect(calls).to.equal(1);
    });
});
