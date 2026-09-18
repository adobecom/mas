import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';

/**
 * The second hop of a non-release product lookup (list_products -> search_cards)
 * is a real model decision, so it cannot be made deterministic the way the
 * release flow was. It can, however, be made small: the model picks a product
 * from names and arrangement codes, and never needs icon URLs, marketing copy
 * or the raw misc blob. Twenty products' worth of those overran the action's
 * budget entirely once the provider changed.
 */
const product = (i) => ({
    arrangement_code: `pa_product_${i}_direct_individual`,
    product_code: `PROD_${i}`,
    product_family: 'CC_ALL_APPS',
    name: `Product ${i}`,
    customer_segment: 'INDIVIDUAL',
    market_segments: ['COM', 'EDU'],
    icon: `https://example.com/icon-${i}.svg`,
    assets: { icons: { svg: `https://example.com/icon-${i}.svg` } },
    links: { buy: 'https://example.com/buy' },
    misc: { sku: `SKU_${i}`, tier: 'pro', trialDays: 7, regions: ['NA', 'EMEA', 'APAC'] },
    copy: {
        name: `Adobe Product ${i}`,
        description:
            'A professional creative application used by millions worldwide for design, editing and production workflows across every surface.',
        tags: ['creativity', 'design', 'production'],
    },
});

describe('MasChat continueWithMCPResult payload', () => {
    let el;
    let sendStub;

    beforeEach(async () => {
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        sendStub = sinon.stub(el, 'callAIChatAction').resolves({ type: 'message', message: 'ok' });
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
    });

    const sentBody = () => sendStub.firstCall.args[0];

    it('omits icon urls, descriptions and the misc blob the model cannot act on', async () => {
        await el.continueWithMCPResult('list_products', { products: [product(1)] });

        const { message } = sentBody();
        expect(message).to.not.include('https://example.com');
        expect(message).to.not.include('professional creative application');
        expect(message).to.not.include('trialDays');
        expect(message).to.not.include('has_links');
    });

    it('keeps the name and arrangement code the model chooses between', async () => {
        await el.continueWithMCPResult('list_products', { products: [product(1)] });

        const { message } = sentBody();
        expect(message).to.include('Adobe Product 1');
        expect(message).to.include('pa_product_1_direct_individual');
    });

    it('does not repeat the summary in both the message and the history', async () => {
        await el.continueWithMCPResult('list_products', { products: [product(1), product(2)] });

        const { message, conversationHistory } = sentBody();
        const repeats = conversationHistory.filter((turn) => turn.content === message).length;
        expect(repeats).to.equal(0);
    });

    it('keeps twenty products small enough to survive the action budget', async () => {
        const products = Array.from({ length: 20 }, (unused, i) => product(i));

        await el.continueWithMCPResult('list_products', { products });

        const { message } = sentBody();
        expect(message).to.include('Adobe Product 0');
        expect(message).to.include('Adobe Product 19');
        // The unshrunk summary ran to ~9900 characters and timed the action out.
        expect(message.length).to.be.below(3000);
    });

    it('still reports how many products were left out', async () => {
        const products = Array.from({ length: 25 }, (unused, i) => product(i));

        await el.continueWithMCPResult('list_products', { products });

        expect(sentBody().message).to.include('5 more');
    });
});
