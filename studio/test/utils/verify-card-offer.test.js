import { expect } from '@esm-bundle/chai';
import { cardOfferResolves } from '../../src/utils/verify-card-offer.js';

describe('cardOfferResolves', () => {
    const withOsi = { fields: [{ name: 'osi', type: 'text', values: ['osi-xyz'] }] };

    it('allows a card that declares no offer selector', async () => {
        const result = await cardOfferResolves({ fields: [{ name: 'title', values: ['x'] }] }, async () => null);
        expect(result).to.be.true;
    });

    it('blocks a card whose declared offer selector does not resolve', async () => {
        const result = await cardOfferResolves(withOsi, async () => null);
        expect(result).to.be.false;
    });

    it('allows a card whose declared offer selector resolves to an offer', async () => {
        const result = await cardOfferResolves(withOsi, async () => ({ offerId: 'real-offer' }));
        expect(result).to.be.true;
    });
});
