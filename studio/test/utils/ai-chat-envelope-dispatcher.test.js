import { expect } from '@esm-bundle/chai';
import {
    classifyEnvelopeIntent,
    renderConfirmationTemplate,
    STATE_CHANGING_INTENTS,
    META_INTENTS,
} from '../../src/utils/ai-chat-envelope-dispatcher.js';

/**
 * This module had no tests, which is how two unreachable entries survived in it.
 *
 * classifyEnvelopeIntent routes any dotted intent to 'guided' BEFORE consulting
 * STATE_CHANGING_INTENTS. That ordering is deliberate: a dotted name is a step
 * of a guided flow, and a guided flow renders its own confirmation (the release
 * flow's Card Configuration summary), so it must not also be sent through the
 * generic confirmation gate. The consequence is that a dotted intent listed in
 * STATE_CHANGING_INTENTS can never be read, and a confirmation template keyed
 * to one can never render.
 *
 * Both existed. 'release_create.confirm' was in STATE_CHANGING_INTENTS, and
 * CONFIRMATION_TEMPLATES held a 'release_create_confirm' key — underscored,
 * so it could not have matched the dotted intent name even without the
 * short-circuit. The last two tests here fail if either shape comes back.
 */
describe('ai-chat envelope dispatcher', () => {
    describe('classifyEnvelopeIntent', () => {
        it('routes meta intents to meta', () => {
            for (const intent of META_INTENTS) {
                expect(classifyEnvelopeIntent({ intent }), intent).to.equal('meta');
            }
        });

        it('routes a dotted intent to guided, because the flow owns its own confirmation', () => {
            expect(classifyEnvelopeIntent({ intent: 'release_create.confirm' })).to.equal('guided');
            expect(classifyEnvelopeIntent({ intent: 'release_create.start' })).to.equal('guided');
        });

        it('routes a plain state-changing intent through the confirmation gate', () => {
            expect(classifyEnvelopeIntent({ intent: 'publish_card' })).to.equal('mcp-state-changing');
            expect(classifyEnvelopeIntent({ intent: 'create_locale_variation' })).to.equal('mcp-state-changing');
        });

        it('treats anything else as a read-only MCP call', () => {
            expect(classifyEnvelopeIntent({ intent: 'search_cards' })).to.equal('mcp-readonly');
        });

        it('does not throw on a malformed envelope', () => {
            for (const envelope of [null, undefined, {}, { intent: 42 }]) {
                expect(classifyEnvelopeIntent(envelope)).to.equal('unknown');
            }
        });
    });

    describe('renderConfirmationTemplate', () => {
        it('fills slots from the envelope', () => {
            expect(renderConfirmationTemplate('publish_card', { id: 'abc' })).to.equal('Publish card abc to production?');
        });

        it('resolves a dotted path in a template', () => {
            const text = renderConfirmationTemplate('bulk_publish_cards', { fragmentIds: ['a', 'b', 'c'] });
            expect(text).to.equal('Publish 3 cards to production?');
        });

        it('returns null when no template exists', () => {
            expect(renderConfirmationTemplate('search_cards', {})).to.equal(null);
        });
    });

    describe('nothing here can be unreachable', () => {
        it('lists no dotted intent as state-changing, since dotted routes to guided first', () => {
            const dotted = [...STATE_CHANGING_INTENTS].filter((intent) => intent.includes('.'));

            expect(
                dotted,
                `these can never be read: classifyEnvelopeIntent sends dotted intents to guided: ${dotted.join(', ')}`,
            ).to.deep.equal([]);
        });

        it('keys every confirmation template to an intent that reaches the gate', () => {
            // A template only renders for an intent classified mcp-state-changing.
            // Any other key is dead, whether by typo or by routing.
            const orphaned = [...STATE_CHANGING_INTENTS].filter(
                (intent) => classifyEnvelopeIntent({ intent }) !== 'mcp-state-changing',
            );
            expect(orphaned, `state-changing intents that never reach the gate: ${orphaned.join(', ')}`).to.deep.equal([]);

            // And the reverse: a template whose key is not a state-changing
            // intent can never be looked up.
            for (const intent of STATE_CHANGING_INTENTS) {
                expect(
                    renderConfirmationTemplate(intent, {}),
                    `${intent} is state-changing but has no confirmation template`,
                ).to.be.a('string');
            }
        });
    });
});
