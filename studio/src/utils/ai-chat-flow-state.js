/**
 * Guided-flow state helpers for the AI chat.
 *
 * A guided flow (release, guided_search, ...) pins the backend to one system
 * prompt across turns. These helpers decide when the deterministic router may
 * still fire inside a flow, when the flow ends, and which intent hint each
 * turn carries — kept pure so the escape rules are unit-testable without
 * mounting MasChat.
 */

export const GUIDED_FLOW_TURN_CAP = 6;

export const IN_FLOW_ROUTER_MIN_CONFIDENCE = 0.9;

export const FLOW_TERMINAL_RESPONSE_TYPES = new Set(['mcp_operation', 'card', 'message', 'operation']);

export function routerAction(classified, activeGuidedFlow) {
    if (!classified) return 'abstain';
    if (activeGuidedFlow) {
        return classified.dispatch && classified.confidence >= IN_FLOW_ROUTER_MIN_CONFIDENCE ? 'dispatch' : 'abstain';
    }
    if (classified.missingSlot) return 'prompt-slot';
    if (classified.dispatch) return 'dispatch';
    return 'abstain';
}

export function nextGuidedFlowState(state, responseType) {
    const flow = state?.flow ?? null;
    const turns = state?.turns ?? 0;
    if (!flow) return { flow: null, turns: 0 };
    if (!responseType) return { flow, turns };
    if (FLOW_TERMINAL_RESPONSE_TYPES.has(responseType)) return { flow: null, turns: 0 };
    const turnsNext = turns + 1;
    if (turnsNext >= GUIDED_FLOW_TURN_CAP) return { flow: null, turns: 0 };
    return { flow, turns: turnsNext };
}

export function resolveIntentHint(contextIntentHint, activeGuidedFlow) {
    return contextIntentHint || activeGuidedFlow || null;
}
