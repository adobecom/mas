import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

/**
 * A release-flow product lookup rendered twice: the tiles from
 * presentProductCatalog, then a second, model-written menu from the follow-up
 * turn. One lookup, two answers.
 *
 * The release flow has a local renderer for exactly this, presentProductSelection,
 * which draws the tiles and skips the follow-up round trip. It was unreachable.
 * 'mcp_operation' is a terminal response type, so the flow bookkeeping in
 * handleSendMessage cleared activeGuidedFlow before the operation was
 * dispatched, and the branch that reads it four lines later could never see
 * 'release'. The envelope path returns before that bookkeeping and sets the
 * flow itself, which is why the bug only ever showed on the legacy JSON path.
 *
 * The dispatch is now told which flow was active when the response arrived,
 * rather than reading state the same turn has already torn down.
 */
const LIST_PRODUCTS = {
    type: 'mcp_operation',
    mcpTool: 'list_products',
    mcpParams: { searchText: 'photoshop' },
    message: 'Looking up products',
};

describe('MasChat dispatches a release lookup as a release lookup', () => {
    let el;
    let storageSandbox;
    let executed;

    beforeEach(async () => {
        storageSandbox = useIsolatedChatSessionStorage();
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        executed = sinon.stub(el, 'executeOperation').resolves();
        sinon.stub(el, 'callAIChatAction').resolves(LIST_PRODUCTS);
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
        storageSandbox.restore();
    });

    const send = () => el.handleSendMessage({ detail: { message: 'photoshop', context: { skipDeterministicRouter: true } } });

    it('carries the release flow into the dispatch instead of the value the turn just cleared', async () => {
        el.activeGuidedFlow = 'release';

        await send();

        expect(executed.calledOnce).to.equal(true);
        expect(executed.firstCall.args[1]?.guidedFlow).to.equal('release');
    });

    it('still ends the flow after a terminal response', async () => {
        el.activeGuidedFlow = 'release';

        await send();

        expect(el.activeGuidedFlow).to.equal(null);
    });

    it('reports no flow when the lookup was not part of one', async () => {
        el.activeGuidedFlow = null;

        await send();

        expect(executed.firstCall.args[1]?.guidedFlow ?? null).to.equal(null);
    });
});

describe('MasChat routes a product list by the flow it was dispatched with', () => {
    let el;
    let storageSandbox;

    beforeEach(async () => {
        storageSandbox = useIsolatedChatSessionStorage();
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
        storageSandbox.restore();
    });

    it('passes the caller-supplied flow through to the regular operation path', async () => {
        const regular = sinon.stub(el, 'executeRegularOperation').resolves();

        await el.executeOperation({ type: 'mcp_operation', mcpTool: 'list_products' }, { guidedFlow: 'release' });

        expect(regular.firstCall.args[2]).to.equal('release');
    });

    it('falls back to the live flow when the caller supplies none', async () => {
        const regular = sinon.stub(el, 'executeRegularOperation').resolves();
        el.activeGuidedFlow = 'release';

        await el.executeOperation({ type: 'mcp_operation', mcpTool: 'list_products' });

        expect(regular.firstCall.args[2]).to.equal('release');
    });
});
