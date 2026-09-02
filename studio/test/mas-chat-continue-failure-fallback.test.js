import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';

/**
 * The second hop of a named product lookup asks the model what to do with the
 * products. That call can time out: the client gives up at 55s, which under a
 * slow provider is reachable. When it did, the user got only
 * "Failed to process product data: ..." and the catalog we had already
 * fetched was thrown away, so a successful fetch looked like a total failure.
 *
 * The products are the part that worked. Show them.
 */
const RAW = [
    {
        arrangement_code: 'phsp_direct_individual',
        product_code: 'PHSP',
        name: 'Photoshop',
        copy: { name: 'Adobe Photoshop' },
        assets: { icons: { svg: 'https://example.com/phsp.svg' } },
    },
    {
        arrangement_code: 'illu_direct_individual',
        product_code: 'ILLU',
        name: 'Illustrator',
        copy: { name: 'Adobe Illustrator' },
        assets: { icons: { svg: 'https://example.com/illu.svg' } },
    },
];

describe('MasChat continueWithMCPResult failure fallback', () => {
    let el;

    beforeEach(async () => {
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        sinon.stub(el, 'callAIChatAction').rejects(new Error('The AI service took too long to respond. Please try again.'));
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
    });

    it('still shows the products when the follow-up call fails', async () => {
        await el.continueWithMCPResult('list_products', { products: RAW });

        const withCards = el.messages.find((m) => m.productCards?.length);
        expect(withCards, 'the fetched products should still be rendered').to.not.equal(undefined);
        expect(withCards.productCards).to.have.length(2);
    });

    it('still reports that the follow-up did not complete', async () => {
        await el.continueWithMCPResult('list_products', { products: RAW });

        const error = el.messages.find((m) => m.role === 'error');
        expect(error).to.not.equal(undefined);
        expect(error.content).to.match(/took too long/i);
    });

    it('shows the products before the error, so the useful part reads first', async () => {
        await el.continueWithMCPResult('list_products', { products: RAW });

        const cardsAt = el.messages.findIndex((m) => m.productCards?.length);
        const errorAt = el.messages.findIndex((m) => m.role === 'error');
        expect(cardsAt).to.be.below(errorAt);
    });

    it('clears the loading state on failure', async () => {
        await el.continueWithMCPResult('list_products', { products: RAW });

        expect(el.isLoading).to.equal(false);
    });
});
