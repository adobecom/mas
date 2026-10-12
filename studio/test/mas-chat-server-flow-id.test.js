import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

/**
 * "Create cards for firefly standard" rendered the same product twice: the
 * eager tiles from presentProductCatalog, then a second render from the
 * follow-up turn.
 *
 * Typing that as free text never runs handlePromptSelected, which is one of
 * only two places the client sets activeGuidedFlow to 'release'; the other is
 * an envelope with a release_create intent, and a release lookup carries no
 * envelope. So nothing on the client ever marked the conversation as a
 * release, the lookup was dispatched as an ordinary one, and the non-release
 * branch rendered eagerly and then asked the model to continue.
 *
 * The server always knew — isReleaseIntent matches "create cards", and the
 * guided tools require flowId — so the client now takes the server's word for
 * it rather than keeping a second copy of that keyword list.
 *
 * Captured live on the branch page before this fix, the first response was
 * `{ type: 'mcp_operation', mcpTool: 'list_products' }` with no flowId at all:
 * the model emitted it and the response body dropped it. That half is fixed in
 * io/studio; this covers the client reading it.
 */
const releaseLookup = (flowId) => ({
    type: 'mcp_operation',
    ...(flowId ? { flowId } : {}),
    mcpTool: 'list_products',
    mcpParams: { searchText: 'firefly standard' },
    message: 'Looking up firefly standard in the catalog...',
});

describe('MasChat takes the flow from the server', () => {
    let el;
    let storageSandbox;
    let flowAtDispatch;

    beforeEach(async () => {
        storageSandbox = useIsolatedChatSessionStorage();
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        flowAtDispatch = [];
        sinon.stub(el, 'executeOperation').callsFake(async (operation, options) => {
            flowAtDispatch.push({
                active: el.activeGuidedFlow ?? null,
                passed: options?.guidedFlow ?? null,
            });
        });
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
        storageSandbox.restore();
    });

    const send = (response, message = 'Create cards for firefly standard') => {
        sinon.stub(el, 'callAIChatAction').resolves(response);
        return el.handleSendMessage({ detail: { message, context: { skipDeterministicRouter: true } } });
    };

    it('recognises a release lookup on the first turn, with no guided step before it', async () => {
        expect(el.activeGuidedFlow ?? null, 'precondition: no flow yet').to.equal(null);

        await send(releaseLookup('release'));

        expect(flowAtDispatch, 'the operation was dispatched').to.have.lengthOf(1);
        expect(flowAtDispatch[0].passed, 'the release branch needs this to be release').to.equal('release');
    });

    it('resets the turn counter with the flow, so the cap does not fire mid-flow', async () => {
        el.guidedFlowTurns = 5;

        await send(releaseLookup('release'));

        expect(el.guidedFlowTurns).to.equal(0);
    });

    it('leaves an ordinary lookup alone', async () => {
        await send(releaseLookup(null));

        expect(flowAtDispatch[0].passed, 'an unlabelled lookup is not a release').to.not.equal('release');
        expect(el.activeGuidedFlow ?? null).to.equal(null);
    });

    it('ignores a flow it does not know', async () => {
        await send(releaseLookup('not_a_real_flow'));

        expect(el.activeGuidedFlow ?? null).to.not.equal('not_a_real_flow');
    });
});
