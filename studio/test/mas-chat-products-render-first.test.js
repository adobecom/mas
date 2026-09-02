import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';

/**
 * The catalog fetch is fast and reliable (~0.6s); the model turn that decides
 * what to do next is neither, and can time out at 55s. Showing the products as
 * soon as they arrive decouples the two: a browse is answered immediately, and
 * a chain ("find offers for photoshop") shows its resolved products while the
 * follow-up runs, instead of holding everything behind the slow half.
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

const cardMessages = (el) => el.messages.filter((m) => m.productCards?.length);

describe('MasChat renders products before the follow-up turn', () => {
    let el;

    beforeEach(async () => {
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
    });

    it('shows the products before the follow-up call resolves', async () => {
        let release;
        sinon.stub(el, 'callAIChatAction').returns(new Promise((resolve) => (release = resolve)));

        const pending = el.handleProductListResult({ products: RAW }, { searchText: 'photoshop' });
        await Promise.resolve();

        expect(cardMessages(el), 'products should be on screen while the model is still thinking').to.have.length(1);

        release({ type: 'message', message: 'done' });
        await pending;
    });

    it('still runs the follow-up for a named lookup, because its next hop is real', async () => {
        const send = sinon.stub(el, 'callAIChatAction').resolves({ type: 'message', message: 'ok' });

        await el.handleProductListResult({ products: RAW }, { searchText: 'photoshop' });

        expect(send.calledOnce).to.equal(true);
    });

    it('does not call the model for a bare browse', async () => {
        const send = sinon.stub(el, 'callAIChatAction').resolves({ type: 'message', message: 'ok' });

        await el.handleProductListResult({ products: RAW }, {});

        expect(send.called).to.equal(false);
        expect(cardMessages(el)).to.have.length(1);
    });

    it('renders the products once, not twice, when the follow-up fails', async () => {
        sinon.stub(el, 'callAIChatAction').rejects(new Error('The AI service took too long to respond.'));

        await el.handleProductListResult({ products: RAW }, { searchText: 'photoshop' });

        expect(cardMessages(el)).to.have.length(1);
        expect(el.messages.some((m) => m.role === 'error')).to.equal(true);
    });

    it('ignores a follow-up that just re-issues the lookup we already ran', async () => {
        sinon.stub(el, 'callAIChatAction').resolves({
            type: 'mcp_operation',
            mcpTool: 'list_products',
            mcpParams: {},
            message: 'Here are the products from the catalog:',
        });

        await el.handleProductListResult({ products: RAW }, { searchText: 'photoshop' });

        expect(el.messages.some((m) => m.mcpOperation?.mcpTool === 'list_products')).to.equal(false);
        expect(cardMessages(el)).to.have.length(1);
    });

    it('keeps a follow-up that moves the chain forward', async () => {
        sinon.stub(el, 'callAIChatAction').resolves({
            type: 'mcp_operation',
            mcpTool: 'search_offers',
            mcpParams: { arrangementCode: 'phsp_direct_individual' },
            message: 'Searching offers...',
        });

        await el.handleProductListResult({ products: RAW }, { searchText: 'photoshop' });

        expect(el.messages.some((m) => m.mcpOperation?.mcpTool === 'search_offers')).to.equal(true);
    });
});
