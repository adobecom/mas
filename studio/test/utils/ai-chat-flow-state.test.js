import { expect } from '@esm-bundle/chai';
import {
    GUIDED_FLOW_TURN_CAP,
    routerAction,
    nextGuidedFlowState,
    resolveIntentHint,
    guidedFlowHintForIntent,
} from '../../src/utils/ai-chat-flow-state.js';

const dispatchResult = (confidence) => ({
    intent: 'id-lookup',
    confidence,
    dispatch: { mcpTool: 'get_card', mcpParams: { id: 'frag-1' } },
    missingSlot: null,
});

const slotResult = (confidence) => ({
    intent: 'title-search',
    confidence,
    dispatch: null,
    missingSlot: { slot: 'surface', prompt: 'Which surface?' },
});

const abstainResult = () => ({ intent: 'unknown', confidence: 0, dispatch: null, missingSlot: null });

describe('ai-chat-flow-state', () => {
    describe('routerAction', () => {
        it('dispatches high-confidence lookups even during a guided flow', () => {
            expect(routerAction(dispatchResult(0.99), 'guided_search')).to.equal('dispatch');
        });

        it('abstains on medium-confidence dispatches during a guided flow', () => {
            expect(routerAction(dispatchResult(0.8), 'release')).to.equal('abstain');
        });

        it('abstains on slot prompts during a guided flow', () => {
            expect(routerAction(slotResult(0.8), 'guided_search')).to.equal('abstain');
        });

        it('prompts for the missing slot when no flow is active', () => {
            expect(routerAction(slotResult(0.8), null)).to.equal('prompt-slot');
        });

        it('dispatches lower-confidence results when no flow is active', () => {
            expect(routerAction(dispatchResult(0.55), null)).to.equal('dispatch');
        });

        it('abstains when the router produced nothing', () => {
            expect(routerAction(abstainResult(), null)).to.equal('abstain');
            expect(routerAction(null, null)).to.equal('abstain');
        });
    });

    describe('nextGuidedFlowState', () => {
        it('clears the flow on every terminal response type', () => {
            for (const type of ['mcp_operation', 'card', 'message', 'operation']) {
                const next = nextGuidedFlowState({ flow: 'guided_search', turns: 2 }, type);
                expect(next).to.deep.equal({ flow: null, turns: 0 });
            }
        });

        it('keeps the flow and counts the turn on guided_step', () => {
            const next = nextGuidedFlowState({ flow: 'guided_search', turns: 1 }, 'guided_step');
            expect(next).to.deep.equal({ flow: 'guided_search', turns: 2 });
        });

        it('clears the flow once the turn cap is reached', () => {
            const next = nextGuidedFlowState({ flow: 'release', turns: GUIDED_FLOW_TURN_CAP - 1 }, 'guided_step');
            expect(next).to.deep.equal({ flow: null, turns: 0 });
        });

        it('normalizes to empty state when no flow is active', () => {
            expect(nextGuidedFlowState({ flow: null, turns: 3 }, 'guided_step')).to.deep.equal({
                flow: null,
                turns: 0,
            });
        });

        it('leaves the state unchanged when the response has no type', () => {
            expect(nextGuidedFlowState({ flow: 'release', turns: 2 }, undefined)).to.deep.equal({
                flow: 'release',
                turns: 2,
            });
        });
    });

    describe('guidedFlowHintForIntent', () => {
        it('maps release_create flow intents to the release hint', () => {
            expect(guidedFlowHintForIntent('release_create.start')).to.equal('release');
            expect(guidedFlowHintForIntent('release_create.set_product')).to.equal('release');
        });

        it('returns null for non-flow intents', () => {
            expect(guidedFlowHintForIntent('get_card')).to.equal(null);
            expect(guidedFlowHintForIntent('ASK_USER')).to.equal(null);
            expect(guidedFlowHintForIntent(null)).to.equal(null);
        });
    });

    describe('resolveIntentHint', () => {
        it('prefers the explicit context hint', () => {
            expect(resolveIntentHint('guided_help', 'guided_search')).to.equal('guided_help');
        });

        it('falls back to the active guided flow for typed input', () => {
            expect(resolveIntentHint(null, 'guided_search')).to.equal('guided_search');
            expect(resolveIntentHint(undefined, 'release')).to.equal('release');
        });

        it('returns null when neither is set', () => {
            expect(resolveIntentHint(null, null)).to.equal(null);
        });
    });
});
