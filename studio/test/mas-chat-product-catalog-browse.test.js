import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';

/**
 * Browsing the catalog does not need a second model call. The model's first
 * turn already answered the question with list_products, and the client holds
 * the result, so handing the products back only makes the model re-issue the
 * same operation and re-type the list — 1.4 to 12s of latency for nothing.
 *
 * A list_products carrying searchText is different: that is the model
 * resolving a named product on the way to something else (offers for
 * Photoshop), and its second hop is a real decision that must survive.
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

describe('MasChat catalog browse renders locally', () => {
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

    it('renders the products as cards without calling the model again', async () => {
        await el.presentProductCatalog({ products: RAW });

        expect(sendStub.called).to.equal(false);
        const last = el.messages[el.messages.length - 1];
        expect(last.productCards).to.have.length(2);
        expect(last.productCards[0].label).to.equal('Adobe Photoshop');
        expect(last.productCards[1].arrangement_code).to.equal('illu_direct_individual');
    });

    it('says how many products it found', async () => {
        await el.presentProductCatalog({ products: RAW });

        expect(el.messages[el.messages.length - 1].content).to.include('2 product');
    });

    it('handles an empty catalog result without calling the model', async () => {
        await el.presentProductCatalog({ products: [] });

        expect(sendStub.called).to.equal(false);
        expect(el.messages[el.messages.length - 1].content).to.match(/no products/i);
    });

    it('keeps the conversation history coherent without faking a release flow', async () => {
        await el.presentProductCatalog({ products: RAW });

        const added = el.conversationHistory.slice(-2);
        expect(added.map((t) => t.role)).to.deep.equal(['user', 'assistant']);
        expect(JSON.stringify(added)).to.not.include('release');
    });

    it('still hands a named product lookup to the model, because its next hop is real', async () => {
        const continueStub = sinon.stub(el, 'continueWithMCPResult').resolves();
        const catalogSpy = sinon.spy(el, 'presentProductCatalog');

        await el.handleProductListResult({ products: RAW }, { searchText: 'photoshop' });

        expect(continueStub.calledOnce).to.equal(true);
        expect(catalogSpy.called).to.equal(false);
    });

    it('renders locally when the lookup carried no search text', async () => {
        const continueStub = sinon.stub(el, 'continueWithMCPResult').resolves();

        await el.handleProductListResult({ products: RAW }, {});

        expect(continueStub.called).to.equal(false);
        expect(el.messages[el.messages.length - 1].productCards).to.have.length(2);
    });
});
