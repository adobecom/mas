const { expect } = require('chai');

let extractToolEnvelope;
let buildEnvelopeResponseBody;
let normalizeEnvelopeText;

describe('ai-chat/envelope-native', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/envelope-native.js');
        extractToolEnvelope = mod.extractToolEnvelope;
        buildEnvelopeResponseBody = mod.buildEnvelopeResponseBody;
        normalizeEnvelopeText = mod.normalizeEnvelopeText;
    });

    describe('normalizeEnvelopeText', () => {
        it('normalizes double-escaped user_message and clarification_question in place of the raw envelope', () => {
            const envelope = {
                intent: 'SHOW_HELP',
                slots: { id: 'keep\\nliteral' },
                confidence: 'high',
                user_message: 'I can help with:\\n\\n- Cards\\n- Offers',
                clarification_question: 'Which one?\\n\\nPick a topic.',
            };
            const normalized = normalizeEnvelopeText(envelope);
            expect(normalized.user_message).to.equal('I can help with:\n\n- Cards\n- Offers');
            expect(normalized.clarification_question).to.equal('Which one?\n\nPick a topic.');
            expect(normalized.slots).to.deep.equal({ id: 'keep\\nliteral' });
            expect(envelope.user_message).to.equal('I can help with:\\n\\n- Cards\\n- Offers');
        });

        it('passes through null and envelopes without text fields', () => {
            expect(normalizeEnvelopeText(null)).to.equal(null);
            const bare = { intent: 'get_card', slots: {}, confidence: 'high' };
            expect(normalizeEnvelopeText(bare)).to.deep.equal(bare);
        });
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

        it('normalizes a fully double-escaped model message into real newlines, tabs, and quotes', () => {
            const body = buildEnvelopeResponseBody({
                intent: 'ASK_USER',
                slots: {},
                confidence: 1,
                user_message: 'Line one.\\n\\nKey concepts:\\n- item with \\"quotes\\" and\\ta tab.',
            });
            expect(body.message).to.equal('Line one.\n\nKey concepts:\n- item with "quotes" and\ta tab.');
        });

        it('leaves messages with real newlines untouched even if they mention escape sequences', () => {
            const body = buildEnvelopeResponseBody({
                intent: 'ASK_USER',
                slots: {},
                confidence: 1,
                user_message: 'Use \\n to insert a newline.\nSecond line.',
            });
            expect(body.message).to.equal('Use \\n to insert a newline.\nSecond line.');
        });

        it('normalizes the message on the mcp_operation branch too', () => {
            const body = buildEnvelopeResponseBody({
                intent: 'get_card',
                slots: { id: 'abc' },
                confidence: 0.95,
                user_message: 'Fetching the card.\\n\\nOne moment.',
            });
            expect(body.type).to.equal('mcp_operation');
            expect(body.message).to.equal('Fetching the card.\n\nOne moment.');
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
