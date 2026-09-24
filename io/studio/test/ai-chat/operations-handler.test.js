const { expect } = require('chai');

let parseOperationRequest;
let extractOperationMessage;
let validateOperation;
let handleOperation;

describe('ai-chat/operations-handler', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/operations-handler.js');
        parseOperationRequest = mod.parseOperationRequest;
        extractOperationMessage = mod.extractOperationMessage;
        validateOperation = mod.validateOperation;
        handleOperation = mod.handleOperation;
    });

    describe('registry-derived operation allowlist', () => {
        const LEGACY_HARDCODED_TOOLS = [
            'publish_card',
            'get_card',
            'search_cards',
            'copy_card',
            'update_card',
            'get_variations',
            'resolve_offer_selector',
            'get_offer_by_id',
            'search_offers',
            'list_products',
            'get_product_by_arrangement_code',
            'create_release_cards',
            'create_offer_selector',
        ];
        // create_tags was on the hardcoded list and in the registry, but no
        // action ever backed it, so a confirmed request 404'd. It left the
        // registry with the seven translation intents, and the allowlist is
        // derived from the registry, so it is gone from here too.

        function toolNameVerdict(operationName) {
            const result = validateOperation({ type: 'studio_operation', operationName, operationParams: { any: true } });
            return result.error ?? '';
        }

        it('keeps accepting every tool from the previous hardcoded list', () => {
            for (const tool of LEGACY_HARDCODED_TOOLS) {
                expect(toolNameVerdict(tool), tool).to.not.include('Invalid operation');
            }
        });

        it('accepts registry tools the hardcoded list forgot', () => {
            // Derived from the registry, so removing a tool from the registry
            // removes it here too. Emptying this list would make the test pass
            // by asserting nothing, which is how it read for a moment during
            // the bulk/collection removal.
            const REGISTRY_ONLY_TOOLS = [
                'create_grouped_variation',
                'create_locale_variation',
                'link_card_to_offer',
                'list_context_cards',
            ];
            expect(REGISTRY_ONLY_TOOLS.length, 'this test is worthless with an empty list').to.be.above(0);
            for (const tool of REGISTRY_ONLY_TOOLS) {
                expect(toolNameVerdict(tool), tool).to.not.include('Invalid operation');
            }
        });

        it('still rejects tools that exist nowhere', () => {
            expect(toolNameVerdict('totally_fake_tool')).to.include('Invalid operation');
        });
    });

    describe('parseOperationRequest', () => {
        it('returns null for empty input', () => {
            expect(parseOperationRequest('')).to.equal(null);
            expect(parseOperationRequest(null)).to.equal(null);
            expect(parseOperationRequest(undefined)).to.equal(null);
        });

        it('parses a JSON code block containing an operation', () => {
            const text = '```json\n{"type":"studio_operation","operationName":"publish_card","operationParams":{"id":"frag-1"}}\n```';
            const result = parseOperationRequest(text);
            expect(result).to.not.equal(null);
            expect(result.type).to.equal('studio_operation');
            expect(result.operationName).to.equal('publish_card');
            expect(result.operationParams.id).to.equal('frag-1');
        });

        it('parses a raw JSON object containing an operation', () => {
            const text =
                'Here is the operation: {"type":"studio_operation","operationName":"get_card","operationParams":{"id":"frag-2"}} done.';
            const result = parseOperationRequest(text);
            expect(result).to.not.equal(null);
            expect(result.type).to.equal('studio_operation');
            expect(result.operationName).to.equal('get_card');
        });

        it('returns null for legacy {operation: "publish"} format (no longer supported, audit M9)', () => {
            const text = '{"operation":"publish","fragmentId":"frag-3"}';
            expect(parseOperationRequest(text)).to.equal(null);
        });

        it('returns null for non-JSON conversational text', () => {
            const text = 'Sure, I can help you publish that card. Let me know which one.';
            expect(parseOperationRequest(text)).to.equal(null);
        });

        it('rejects oversized input to prevent ReDoS (returns null in <500ms)', () => {
            const adversarial = `${'{'.repeat(70 * 1024)}"type": "studio_operation"`;
            const start = Date.now();
            const result = parseOperationRequest(adversarial);
            const duration = Date.now() - start;
            expect(duration).to.be.lessThan(500);
            expect(result).to.equal(null);
        });

        it('handles a long valid input under the size cap without backtracking explosion', () => {
            const padding = 'x'.repeat(10 * 1024);
            const text = `${padding}\n{"type":"studio_operation","operationName":"search_cards","operationParams":{"query":"test"}}\n${padding}`;
            const start = Date.now();
            const result = parseOperationRequest(text);
            const duration = Date.now() - start;
            expect(duration).to.be.lessThan(500);
            expect(result).to.not.equal(null);
            expect(result.operationName).to.equal('search_cards');
        });
    });

    describe('validateOperation', () => {
        it('rejects null/undefined operations', () => {
            expect(validateOperation(null).valid).to.equal(false);
            expect(validateOperation(undefined).valid).to.equal(false);
        });

        it('accepts a valid operation', () => {
            const result = validateOperation({
                type: 'studio_operation',
                operationName: 'publish_card',
                operationParams: { id: '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf' },
            });
            expect(result.valid).to.equal(true);
        });

        it('rejects operation with invalid tool name', () => {
            const result = validateOperation({
                type: 'studio_operation',
                operationName: 'evil_tool',
                operationParams: { id: '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf' },
            });
            expect(result.valid).to.equal(false);
            expect(result.error).to.include('Invalid operation');
        });

        it('strips studio_ prefix from operation names', () => {
            const op = {
                type: 'studio_operation',
                operationName: 'studio_publish_card',
                operationParams: { id: '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf' },
            };
            const result = validateOperation(op);
            expect(result.valid).to.equal(true);
            expect(op.operationName).to.equal('publish_card');
        });
    });

    describe('handleOperation', () => {
        it('returns null for non-operation text', () => {
            expect(handleOperation('Hello, how can I help?')).to.equal(null);
        });

        it('processes a valid operation', () => {
            const text =
                '```json\n{"type":"studio_operation","operationName":"get_card","operationParams":{"id":"0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf"}}\n```';
            const result = handleOperation(text);
            expect(result).to.not.equal(null);
            expect(result.type).to.equal('studio_operation');
            expect(result.operationName).to.equal('get_card');
        });

        it('returns null for adversarial oversized input', () => {
            const adversarial = `${'{'.repeat(70 * 1024)}"type": "studio_operation"`;
            const start = Date.now();
            const result = handleOperation(adversarial);
            const duration = Date.now() - start;
            expect(duration).to.be.lessThan(500);
            expect(result).to.equal(null);
        });
    });

    describe('extractOperationMessage', () => {
        it('strips JSON code blocks from text', () => {
            const text = 'Here is the result:\n```json\n{"foo":"bar"}\n```\nLet me know!';
            const result = extractOperationMessage(text);
            expect(result).to.not.include('```json');
            expect(result).to.include('Here is the result');
            expect(result).to.include('Let me know');
        });

        it('returns empty string for null input', () => {
            expect(extractOperationMessage(null)).to.equal('');
            expect(extractOperationMessage('')).to.equal('');
        });
    });
});

describe('ai-chat/operations-handler server-authoritative hardening', () => {
    let handleOperationFn;
    let validateOperationFn;

    before(async () => {
        const mod = await import('../../src/ai-chat/operations-handler.js');
        handleOperationFn = mod.handleOperation;
        validateOperationFn = mod.validateOperation;
    });

    const UUID = '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf';
    const opText = (tool, params, extra = '') =>
        `\`\`\`json\n{"type":"studio_operation","operationName":"${tool}","operationParams":${JSON.stringify(params)}${extra}}\n\`\`\``;

    it('forces confirmation for state-changing tools even when the model says false', () => {
        const result = handleOperationFn(
            opText('update_card', { id: UUID, fields: { title: 'x' } }, ',"confirmationRequired":false'),
        );
        expect(result.type).to.equal('studio_operation');
        expect(result.confirmationRequired).to.equal(true);
    });

    it('forces confirmation for publish_card', () => {
        const result = handleOperationFn(opText('publish_card', { id: UUID }));
        expect(result.confirmationRequired).to.equal(true);
    });

    it('forces confirmation for create_release_cards', () => {
        const result = handleOperationFn(
            opText('create_release_cards', {
                arrangement_code: 'phsp_direct_individual',
                variants: ['catalog'],
                parentPath: '/content/dam/mas/sandbox',
            }),
        );
        expect(result.confirmationRequired).to.equal(true);
    });

    it('keeps read-only operations unconfirmed', () => {
        const result = handleOperationFn(opText('get_card', { id: UUID }));
        expect(result.confirmationRequired).to.equal(false);
    });

    it('rejects params whose values fail registry slot validation', () => {
        const validation = validateOperationFn({
            type: 'studio_operation',
            operationName: 'get_card',
            operationParams: { id: 'not-a-uuid' },
        });
        expect(validation.valid).to.equal(false);
        expect(validation.error).to.include('id');
    });

    it('rejects an id-array operation with malformed fragment IDs', () => {
        // Was bulk_publish_cards until the bulk tools were removed.
        // list_context_cards is the surviving intent that takes an id array.
        const validation = validateOperationFn({
            type: 'studio_operation',
            operationName: 'list_context_cards',
            operationParams: { fragmentIds: ['definitely-not-a-uuid'] },
        });
        expect(validation.valid).to.equal(false);
    });

    it('accepts operations with registry-valid param values', () => {
        const validation = validateOperationFn({
            type: 'studio_operation',
            operationName: 'get_card',
            operationParams: { id: UUID },
        });
        expect(validation.valid).to.equal(true);
    });
});
