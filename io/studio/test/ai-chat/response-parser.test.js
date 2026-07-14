const { expect } = require('chai');

let extractJSON;
let extractConversationalText;
let parseAIResponse;
let normalizeEscapedText;

describe('ai-chat/response-parser', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/response-parser.js');
        extractJSON = mod.extractJSON;
        extractConversationalText = mod.extractConversationalText;
        parseAIResponse = mod.parseAIResponse;
        normalizeEscapedText = mod.normalizeEscapedText;
    });

    describe('normalizeEscapedText', () => {
        it('rewrites fully double-escaped text into real newlines, tabs, and quotes', () => {
            expect(normalizeEscapedText('a\\n\\nb with \\"q\\" and\\tc')).to.equal('a\n\nb with "q" and\tc');
        });

        it('converts literal escapes even when real newlines are also present (mixed escaping)', () => {
            expect(normalizeEscapedText('It carries:\\n\\n- item one\nreal break')).to.equal(
                'It carries:\n\n- item one\nreal break',
            );
        });

        it('passes through non-strings and text without escapes', () => {
            expect(normalizeEscapedText(null)).to.equal(null);
            expect(normalizeEscapedText('plain')).to.equal('plain');
        });
    });

    describe('extractJSON', () => {
        it('parses JSON inside a markdown code fence', () => {
            const text = '```json\n{"type":"guided_step","message":"pick one"}\n```';
            const result = extractJSON(text);
            expect(result).to.deep.equal({ type: 'guided_step', message: 'pick one' });
        });

        it('returns the first parseable object when the text contains multiple JSON objects', () => {
            const text = 'Here you go {"type":"guided_step","message":"pick"} and also {"type":"card","variant":"catalog"}';
            const result = extractJSON(text);
            expect(result).to.deep.equal({ type: 'guided_step', message: 'pick' });
        });

        it('parses an object even when later prose contains a stray closing brace', () => {
            const text = 'Result: {"count":2} — remember to close with } in templates.';
            const result = extractJSON(text);
            expect(result).to.deep.equal({ count: 2 });
        });

        it('skips non-JSON brace regions and parses the real object after them', () => {
            const text = 'Use {placeholder} syntax. {"type":"open_ost","searchParams":{"q":"ps"}}';
            const result = extractJSON(text);
            expect(result).to.deep.equal({ type: 'open_ost', searchParams: { q: 'ps' } });
        });

        it('returns null for truncated JSON that never balances', () => {
            const text = '{"type":"card","variant":"catalog","title":"Photosho';
            expect(extractJSON(text)).to.equal(null);
        });

        it('normalizes literal newlines inside string values', () => {
            const text = '{"type":"guided_step","message":"line one\nline two"}';
            const result = extractJSON(text);
            expect(result.message).to.equal('line one\nline two');
        });

        it('escapes unescaped double-quotes inside a string value', () => {
            const text = '{"type":"guided_step","message":"e.g. "Photoshop" or "Creative Cloud""}';
            const result = extractJSON(text);
            expect(result.type).to.equal('guided_step');
            expect(result.message).to.equal('e.g. "Photoshop" or "Creative Cloud"');
        });

        it('parses a guided_step whose message has embedded quotes and literal newlines', () => {
            const text = [
                '{',
                '    "type": "guided_step",',
                '    "message": "Which product? Provide any of:',
                '',
                '- Product name (e.g. "Photoshop", "Creative Cloud Pro")',
                '- Arrangement code (e.g. "PA-1636")",',
                '    "buttonGroup": { "label": "Product" }',
                '}',
            ].join('\n');
            const result = extractJSON(text);
            expect(result.type).to.equal('guided_step');
            expect(result.buttonGroup).to.deep.equal({ label: 'Product' });
            expect(result.message).to.include('Photoshop');
        });
    });

    describe('extractConversationalText', () => {
        it('strips every JSON object while preserving prose between them', () => {
            const text = 'Alpha {"x":1} Beta {"y":2} Gamma';
            const result = extractConversationalText(text);
            expect(result).to.include('Alpha');
            expect(result).to.include('Beta');
            expect(result).to.include('Gamma');
            expect(result).to.not.include('{');
            expect(result).to.not.include('}');
        });

        it('returns plain text untouched', () => {
            expect(extractConversationalText('Just a normal reply.')).to.equal('Just a normal reply.');
        });
    });

    describe('parseAIResponse', () => {
        it('returns a friendly parse error instead of echoing truncated JSON to the user', () => {
            const text = '```json\n{"type":"card","variant":"catalog","title":"Photo';
            const result = parseAIResponse(text);
            expect(result.type).to.equal('message');
            expect(result.parseError).to.equal(true);
            expect(result.message).to.not.include('{');
            expect(result.message).to.not.include('```');
        });

        it('flags a parse error for bare truncated JSON with key/value shape', () => {
            const text =
                '{"type":"release_cards","parentPath":"/content/dam/mas/acom","cardConfigs":[{"variant":"catalog","title":"Unfinished';
            const result = parseAIResponse(text);
            expect(result.type).to.equal('message');
            expect(result.parseError).to.equal(true);
            expect(result.message).to.not.include('parentPath');
        });

        it('passes plain conversational text through unchanged', () => {
            const text = 'Sure — publishing a card pushes it live to the surface it belongs to.';
            const result = parseAIResponse(text);
            expect(result.type).to.equal('message');
            expect(result.message).to.equal(text);
            expect(result.parseError).to.equal(undefined);
        });

        it('does not treat prose containing a small placeholder brace as a parse error', () => {
            const text = 'Wrap the value in {braces} when using templates.';
            const result = parseAIResponse(text);
            expect(result.type).to.equal('message');
            expect(result.message).to.equal(text);
            expect(result.parseError).to.equal(undefined);
        });

        it('does not force-cast unrecognized structured objects to card', () => {
            const text = '{"intent":"SEARCH_CARDS","slots":{"surface":"acom"}}';
            const result = parseAIResponse(text);
            expect(result.type).to.equal('message');
            expect(result.cardConfig).to.equal(undefined);
        });

        it('still returns card for a variant-bearing config without an explicit type', () => {
            const text = '{"variant":"catalog","title":"Photoshop"}';
            const result = parseAIResponse(text);
            expect(result.type).to.equal('card');
            expect(result.cardConfig.variant).to.equal('catalog');
        });

        it('still returns card for a config with card-shaped keys so validation retry can fix it', () => {
            const text = '{"title":"Photoshop","fields":{"description":"x"}}';
            const result = parseAIResponse(text);
            expect(result.type).to.equal('card');
        });

        it('normalizes double-escaped newlines in a JSON message payload', () => {
            const text = '{"type":"message","message":"Line one.\\\\n\\\\nLine two."}';
            const result = parseAIResponse(text);
            expect(result.type).to.equal('message');
            expect(result.message).to.equal('Line one.\n\nLine two.');
        });

        it('renders the user_message when the model emits an intent envelope on the text path', () => {
            const text =
                '{"intent":"ASK_USER","slots":{},"confidence":"medium","user_message":"Here are the matching products I found."}';
            const result = parseAIResponse(text);
            expect(result.type).to.equal('message');
            expect(result.message).to.equal('Here are the matching products I found.');
        });

        it('returns the guided_step (not raw JSON) when the message has embedded quotes and newlines', () => {
            const text = [
                '{',
                '    "type": "guided_step",',
                '    "message": "Which product is this release for? Provide any of:',
                '',
                '- Product name (e.g. "Photoshop", "Creative Cloud Pro")',
                '- Arrangement code (e.g. "PA-1636")",',
                '    "buttonGroup": { "label": "Product", "inputHint": "Type a product name..." }',
                '}',
            ].join('\n');
            const result = parseAIResponse(text);
            expect(result.type).to.equal('guided_step');
            expect(result.message).to.not.include('"type"');
            expect(result.message).to.not.include('buttonGroup');
            expect(result.buttonGroup).to.deep.equal({
                label: 'Product',
                inputHint: 'Type a product name...',
            });
        });

        it('keeps surrounding prose as the message for recognized types with multiple brace regions', () => {
            const text = 'Intro. {"type":"guided_step","message":"pick"} Outro.';
            const result = parseAIResponse(text);
            expect(result.type).to.equal('guided_step');
            expect(result.message).to.include('Intro');
            expect(result.message).to.include('Outro');
            expect(result.message).to.not.include('{');
        });
    });
});
