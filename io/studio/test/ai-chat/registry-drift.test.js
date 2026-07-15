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

    it('gates every registry state-changing intent client-side', () => {
        const missing = INTENTS.filter((intent) => intent.category === 'state-changing')
            .map((intent) => intent.name)
            .filter((name) => !dispatcher.STATE_CHANGING_INTENTS.has(name));
        expect(missing, 'add these to STATE_CHANGING_INTENTS in studio/src/utils/ai-chat-envelope-dispatcher.js').to.deep.equal(
            [],
        );
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
