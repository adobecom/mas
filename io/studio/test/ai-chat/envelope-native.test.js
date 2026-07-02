const { expect } = require('chai');

let extractToolEnvelope;
let buildEnvelopeResponseBody;

describe('ai-chat/envelope-native', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/envelope-native.js');
        extractToolEnvelope = mod.extractToolEnvelope;
        buildEnvelopeResponseBody = mod.buildEnvelopeResponseBody;
    });

    describe('extractToolEnvelope', () => {
        it('returns the tool input from a successful emit_envelope call', () => {
            const response = {
                success: true,
                toolUse: { name: 'emit_envelope', input: { intent: 'get_card', slots: { id: 'x' }, confidence: 0.9 } },
            };
            expect(extractToolEnvelope(response)).to.deep.equal({
                intent: 'get_card',
                slots: { id: 'x' },
                confidence: 0.9,
            });
        });

        it('returns null for failed responses, missing toolUse, or foreign tools', () => {
            expect(extractToolEnvelope({ success: false, toolUse: { name: 'emit_envelope', input: {} } })).to.equal(null);
            expect(extractToolEnvelope({ success: true, message: 'plain text', toolUse: null })).to.equal(null);
            expect(extractToolEnvelope({ success: true, toolUse: { name: 'other_tool', input: {} } })).to.equal(null);
            expect(extractToolEnvelope(null)).to.equal(null);
        });
    });

    describe('buildEnvelopeResponseBody', () => {
        it('maps a read-only registry intent to an mcp_operation without confirmation', () => {
            const body = buildEnvelopeResponseBody({
                intent: 'get_card',
                slots: { id: '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf' },
                confidence: 0.95,
            });
            expect(body.type).to.equal('mcp_operation');
            expect(body.mcpTool).to.equal('get_card');
            expect(body.mcpParams).to.deep.equal({ id: '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf' });
            expect(body.confirmationRequired).to.equal(false);
        });

        it('forces confirmation for state-changing intents regardless of the envelope', () => {
            const body = buildEnvelopeResponseBody({
                intent: 'publish_card',
                slots: { id: '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf' },
                confidence: 0.99,
                confirmationRequired: false,
            });
            expect(body.type).to.equal('mcp_operation');
            expect(body.confirmationRequired).to.equal(true);
        });

        it('returns a message body for ASK_USER envelopes', () => {
            const body = buildEnvelopeResponseBody({
                intent: 'ASK_USER',
                slots: {},
                confidence: 1,
                user_message: 'Publishing pushes the card live to its surface.',
            });
            expect(body.type).to.equal('message');
            expect(body.message).to.equal('Publishing pushes the card live to its surface.');
        });

        it('asks the clarification question instead of dispatching when slots are missing', () => {
            const body = buildEnvelopeResponseBody({
                intent: 'get_card',
                slots: {},
                confidence: 0.6,
                missing_slots: ['id'],
                clarification_question: 'Which card should I fetch?',
            });
            expect(body.type).to.equal('message');
            expect(body.message).to.equal('Which card should I fetch?');
        });

        it('falls back to a generic clarification when the envelope has no text', () => {
            const body = buildEnvelopeResponseBody({ intent: 'ASK_USER', slots: {}, confidence: 1 });
            expect(body.type).to.equal('message');
            expect(body.message).to.be.a('string');
            expect(body.message.length).to.be.greaterThan(10);
        });

        it('returns a message body for intents without an MCP tool target', () => {
            const body = buildEnvelopeResponseBody({
                intent: 'open_ost',
                slots: {},
                confidence: 0.9,
                user_message: 'Opening the Offer Selector Tool is done from the card editor.',
            });
            expect(body.type).to.equal('message');
        });
    });
});
