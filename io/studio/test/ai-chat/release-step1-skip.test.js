const { expect } = require('chai');

let GUIDED_CARD_CREATION_PROMPT;
let GUIDED_CARD_CREATION_TOOL_PROMPT;

/**
 * "create cards for illustrator" used to be answered with "Which product is
 * this release for?" — the flow asking for something the user had just said.
 *
 * Step 1 was unconditional: the prompt told the model to copy the product
 * question verbatim, and Step 2, which knows how to classify a product name,
 * PA code, offer ID or OSI, only ran on the following turn. The product name
 * in the triggering message had nowhere to go.
 *
 * These pin the precedence rule that lets Step 1 be skipped. They assert the
 * contract the prompt states, not model behaviour — the model's compliance is
 * not testable here, but a silently deleted rule is.
 */
describe('ai-chat/guided card creation — Step 1 skip', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/prompt-templates.js');
        GUIDED_CARD_CREATION_PROMPT = mod.GUIDED_CARD_CREATION_PROMPT;
        GUIDED_CARD_CREATION_TOOL_PROMPT = mod.GUIDED_CARD_CREATION_TOOL_PROMPT;
    });

    it('tells the model to skip Step 1 when the trigger already names the product', () => {
        expect(GUIDED_CARD_CREATION_PROMPT).to.include('SKIP THIS STEP');
        expect(GUIDED_CARD_CREATION_PROMPT).to.include('go straight to Step 2');
    });

    it('states the rule inside Step 1, so it takes precedence over the verbatim instruction', () => {
        const step1 = GUIDED_CARD_CREATION_PROMPT.indexOf('## Step 1: Product Selection');
        const step2 = GUIDED_CARD_CREATION_PROMPT.indexOf('## Step 2: Product Lookup');
        const skip = GUIDED_CARD_CREATION_PROMPT.indexOf('SKIP THIS STEP');
        const verbatim = GUIDED_CARD_CREATION_PROMPT.indexOf('copy the message string verbatim');

        expect(step1, 'Step 1 heading').to.be.greaterThan(-1);
        expect(step2, 'Step 2 heading').to.be.greaterThan(-1);
        expect(skip, 'skip rule sits inside Step 1').to.be.within(step1, step2);
        expect(skip, 'skip rule is stated before the verbatim instruction it overrides').to.be.lessThan(verbatim);
    });

    it('still asks when the trigger names no product', () => {
        // The question itself must survive: skipping is conditional, not a deletion.
        expect(GUIDED_CARD_CREATION_PROMPT).to.include('Which product is this release for?');
        expect(GUIDED_CARD_CREATION_PROMPT).to.include('"type": "guided_step"');
    });

    it('names the identifier shapes that carry their own answer', () => {
        // A bare "skip if you can" is too vague to act on; the rule has to say
        // which inputs qualify, matching the Step 2 decision tree.
        for (const shape of ['product name', 'arrangement code', 'offer ID', 'OSI']) {
            expect(GUIDED_CARD_CREATION_PROMPT, shape).to.include(shape);
        }
    });

    it('carries the rule into tool mode, which embeds the same flow', () => {
        expect(GUIDED_CARD_CREATION_TOOL_PROMPT).to.include('SKIP THIS STEP');
        expect(GUIDED_CARD_CREATION_TOOL_PROMPT).to.include('go straight to Step 2');
    });
});

describe('ai-chat/guided card creation — offer lookup carries the product', () => {
    let GUIDED_CARD_CREATION_PROMPT;

    before(async () => {
        ({ GUIDED_CARD_CREATION_PROMPT } = await import('../../src/ai-chat/prompt-templates.js'));
    });

    it('asks for arrangementCode alongside the offer id', () => {
        // AOS does not filter by offer id, so a bare offerId lookup scans an
        // unfiltered page and reports "not found" for offers that exist.
        expect(GUIDED_CARD_CREATION_PROMPT).to.include('"mcpTool": "get_offer_by_id"');
        expect(GUIDED_CARD_CREATION_PROMPT).to.include('arrangementCode');
        expect(GUIDED_CARD_CREATION_PROMPT).to.match(/ALWAYS include .?arrangementCode/);
    });
});

describe('ai-chat/guided card creation — skipping must act, not narrate', () => {
    let GUIDED_CARD_CREATION_PROMPT;

    before(async () => {
        ({ GUIDED_CARD_CREATION_PROMPT } = await import('../../src/ai-chat/prompt-templates.js'));
    });

    it('forbids announcing the lookup instead of performing it', () => {
        // Observed four times: the model answered "I'll help you create cards
        // for X. Let me look up that product first." and emitted no operation,
        // so the flow dead-ended with no spinner and nothing to click.
        expect(GUIDED_CARD_CREATION_PROMPT).to.include('the mcp_operation IS your entire response');
        expect(GUIDED_CARD_CREATION_PROMPT).to.match(/Do NOT acknowledge the request/);
        expect(GUIDED_CARD_CREATION_PROMPT).to.include('Perform the lookup instead of describing it');
    });
});
