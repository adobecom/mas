const { expect } = require('chai');

let INTENTS;
let REGISTRY_META_INTENTS;
let dispatcher;

describe('ai-chat/registry drift — client dispatcher vs intent registry', () => {
    before(async () => {
        const registry = await import('../../src/ai-chat/intent-registry.js');
        INTENTS = registry.INTENTS;
        REGISTRY_META_INTENTS = registry.META_INTENTS;
        dispatcher = await import('../../../../studio/src/utils/ai-chat-envelope-dispatcher.js');
    });

    it('client META_INTENTS matches the registry meta intents exactly', () => {
        expect([...dispatcher.META_INTENTS].sort()).to.deep.equal([...REGISTRY_META_INTENTS].sort());
    });

    /**
     * Dotted names are steps of a guided flow, and the client routes anything
     * dotted to 'guided' before it consults STATE_CHANGING_INTENTS — a guided
     * flow renders its own confirmation (the release flow's Card Configuration
     * summary) and must not also go through the generic gate. So a dotted
     * intent listed there could never be read, and listing it only made the
     * gate look wider than it is.
     */
    const isGuidedFlowStep = (name) => name.includes('.');

    it('gates every registry state-changing intent client-side', () => {
        const missing = INTENTS.filter((intent) => intent.category === 'state-changing')
            .map((intent) => intent.name)
            .filter((name) => !isGuidedFlowStep(name))
            .filter((name) => !dispatcher.STATE_CHANGING_INTENTS.has(name));
        expect(missing, 'add these to STATE_CHANGING_INTENTS in studio/src/utils/ai-chat-envelope-dispatcher.js').to.deep.equal(
            [],
        );
    });

    it('confirms a state-changing guided step inside its flow, not through the generic gate', () => {
        const guidedStateChanging = INTENTS.filter(
            (intent) => intent.category === 'state-changing' && isGuidedFlowStep(intent.name),
        ).map((intent) => intent.name);

        // If this is ever empty the exemption above is dead and should go.
        expect(guidedStateChanging, 'expected at least one dotted state-changing intent').to.not.deep.equal([]);
        for (const name of guidedStateChanging) {
            expect(
                dispatcher.classifyEnvelopeIntent({ intent: name }),
                `${name} must reach its flow, not the generic confirmation gate`,
            ).to.equal('guided');
        }
    });

    it('has no client state-changing entries that are not registered intents', () => {
        const unknown = [...dispatcher.STATE_CHANGING_INTENTS].filter(
            (name) => !INTENTS.some((intent) => intent.name === name),
        );
        expect(unknown, 'remove these from STATE_CHANGING_INTENTS — not in intent-registry.js').to.deep.equal([]);
    });

    it('lists only registered null-tool_target intents in client NON_MCP_INTENTS', () => {
        const wrong = [...dispatcher.NON_MCP_INTENTS].filter((name) => {
            const intent = INTENTS.find((entry) => entry.name === name);
            return !intent || Boolean(intent.tool_target);
        });
        expect(
            wrong,
            'these NON_MCP_INTENTS entries have a tool_target in intent-registry.js (or are unregistered) — fix studio/src/utils/ai-chat-envelope-dispatcher.js',
        ).to.deep.equal([]);
    });

    it('covers every registry null-tool_target intent in a client set', () => {
        const missing = INTENTS.filter((intent) => !intent.tool_target)
            .map((intent) => intent.name)
            .filter(
                (name) =>
                    !dispatcher.NON_MCP_INTENTS.has(name) &&
                    !dispatcher.META_INTENTS.has(name) &&
                    !dispatcher.STATE_CHANGING_INTENTS.has(name),
            );
        expect(missing, 'add these to NON_MCP_INTENTS in the client dispatcher').to.deep.equal([]);
    });
});
