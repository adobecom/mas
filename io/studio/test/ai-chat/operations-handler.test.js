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

    describe('parseOperationRequest', () => {
        it('returns null for empty input', () => {
            expect(parseOperationRequest('')).to.equal(null);
            expect(parseOperationRequest(null)).to.equal(null);
            expect(parseOperationRequest(undefined)).to.equal(null);
        });

        it('parses a JSON code block containing an MCP operation', () => {
            const text = '```json\n{"type":"mcp_operation","mcpTool":"publish_card","mcpParams":{"id":"frag-1"}}\n```';
            const result = parseOperationRequest(text);
            expect(result).to.not.equal(null);
            expect(result.type).to.equal('mcp_operation');
            expect(result.mcpTool).to.equal('publish_card');
            expect(result.mcpParams.id).to.equal('frag-1');
        });

        it('parses a raw JSON object containing an MCP operation', () => {
            const text =
                'Here is the operation: {"type":"mcp_operation","mcpTool":"get_card","mcpParams":{"id":"frag-2"}} done.';
            const result = parseOperationRequest(text);
            expect(result).to.not.equal(null);
            expect(result.type).to.equal('mcp_operation');
            expect(result.mcpTool).to.equal('get_card');
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
            const adversarial = `${'{'.repeat(70 * 1024)}"type": "mcp_operation"`;
            const start = Date.now();
            const result = parseOperationRequest(adversarial);
            const duration = Date.now() - start;
            expect(duration).to.be.lessThan(500);
            expect(result).to.equal(null);
        });

        it('handles a long valid input under the size cap without backtracking explosion', () => {
            const padding = 'x'.repeat(10 * 1024);
            const text = `${padding}\n{"type":"mcp_operation","mcpTool":"search_cards","mcpParams":{"query":"test"}}\n${padding}`;
            const start = Date.now();
            const result = parseOperationRequest(text);
            const duration = Date.now() - start;
            expect(duration).to.be.lessThan(500);
            expect(result).to.not.equal(null);
            expect(result.mcpTool).to.equal('search_cards');
        });
    });

    describe('validateOperation', () => {
        it('rejects null/undefined operations', () => {
            expect(validateOperation(null).valid).to.equal(false);
            expect(validateOperation(undefined).valid).to.equal(false);
        });

        it('accepts a valid MCP operation', () => {
            const result = validateOperation({
                type: 'mcp_operation',
                mcpTool: 'publish_card',
                mcpParams: { id: 'frag-1' },
            });
            expect(result.valid).to.equal(true);
        });

        it('rejects MCP operation with invalid tool name', () => {
            const result = validateOperation({
                type: 'mcp_operation',
                mcpTool: 'evil_tool',
                mcpParams: { id: 'frag-1' },
            });
            expect(result.valid).to.equal(false);
            expect(result.error).to.include('Invalid MCP tool');
        });

        it('strips studio_ prefix from MCP tool names', () => {
            const op = {
                type: 'mcp_operation',
                mcpTool: 'studio_publish_card',
                mcpParams: { id: 'frag-1' },
            };
            const result = validateOperation(op);
            expect(result.valid).to.equal(true);
            expect(op.mcpTool).to.equal('publish_card');
        });
    });

    describe('handleOperation', () => {
        it('returns null for non-operation text', () => {
            expect(handleOperation('Hello, how can I help?')).to.equal(null);
        });

        it('processes a valid MCP operation', () => {
            const text = '```json\n{"type":"mcp_operation","mcpTool":"get_card","mcpParams":{"id":"frag-1"}}\n```';
            const result = handleOperation(text);
            expect(result).to.not.equal(null);
            expect(result.type).to.equal('mcp_operation');
            expect(result.mcpTool).to.equal('get_card');
        });

        it('returns null for adversarial oversized input', () => {
            const adversarial = `${'{'.repeat(70 * 1024)}"type": "mcp_operation"`;
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
