import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';

const RAW_PRODUCTS = [
    {
        arrangement_code: 'ccsn_direct_individual',
        product_code: 'CCSN',
        product_family: 'CC_ALL_APPS',
        name: 'Creative Cloud Pro',
        copy: { name: 'Creative Cloud Pro' },
        assets: { icons: { svg: 'https://example.com/cc.svg' } },
    },
    {
        arrangement_code: 'phsp_direct_individual',
        product_code: 'PHSP',
        product_family: 'CC_ALL_APPS',
        name: 'Photoshop',
        copy: { name: 'Adobe Photoshop' },
        assets: { icons: { svg: 'https://example.com/phsp.svg' } },
    },
];

describe('MasChat presentProductSelection (deterministic step 3)', () => {
    let el;
    let sendStub;

    beforeEach(() => {
        el = document.createElement('mas-chat');
        el.messages = [];
        el.conversationHistory = [{ role: 'assistant', content: '{"type":"mcp_operation","mcpTool":"list_products"}' }];
        sendStub = sinon.stub(el, 'handleSendMessage').resolves();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('renders selectable product cards locally for multiple matches without any AI call', async () => {
        await el.presentProductSelection({ products: RAW_PRODUCTS }, 'creative cloud pro');

        const lastMessage = el.messages.at(-1);
        expect(lastMessage.productCards).to.have.length(2);
        expect(lastMessage.productCards[0].value).to.equal('ccsn_direct_individual');
        expect(lastMessage.buttonGroup.label).to.equal('Product');
        expect(lastMessage.content).to.include('"creative cloud pro"');
        expect(sendStub.called).to.equal(false);
    });

    it('keeps the model context coherent with alternating synthetic history turns', async () => {
        await el.presentProductSelection({ products: RAW_PRODUCTS }, 'creative cloud pro');

        const [marker, assistantTurn] = el.conversationHistory.slice(-2);
        expect(marker.role).to.equal('user');
        expect(marker.content).to.include('2 products retrieved');
        expect(assistantTurn.role).to.equal('assistant');
        expect(assistantTurn.content).to.include('```json');
        expect(assistantTurn.content).to.include('"flowId": "release"');
        expect(assistantTurn.content).to.include('"type": "guided_step"');
    });

    it('auto-advances a single match exactly like a manual selection', async () => {
        await el.presentProductSelection({ products: [RAW_PRODUCTS[0]] }, 'creative cloud pro');

        expect(el.selectedReleaseProduct.arrangement_code).to.equal('ccsn_direct_individual');
        const lastMessage = el.messages.at(-1);
        expect(lastMessage.productCards).to.have.length(1);
        expect(lastMessage.productCardsSelectedValue).to.equal('ccsn_direct_individual');
        expect(sendStub.calledOnce).to.equal(true);
        const sendArg = sendStub.firstCall.args[0].detail;
        expect(sendArg.message).to.include('Selected product: Creative Cloud Pro');
        expect(sendArg.message).to.include('arrangement_code: ccsn_direct_individual');
        expect(sendArg.context.hidden).to.equal(true);
    });

    it('reports zero matches locally with a retry hint', async () => {
        await el.presentProductSelection({ products: [] }, 'nonexistent thing');

        const lastMessage = el.messages.at(-1);
        expect(lastMessage.content).to.include('No products found matching "nonexistent thing"');
        expect(sendStub.called).to.equal(false);
        const assistantTurn = el.conversationHistory.at(-1);
        expect(assistantTurn.content).to.include('No products found');
    });
});
