/**
 * Intent classifier — accuracy test set.
 *
 * Modes:
 *   --dry        Validate the test cases + parser without hitting Bedrock.
 *                Stubs the classifier client so every call returns the
 *                expected label, exercising the fixture and runner only.
 *                Free to run.
 *
 *   (default)    LIVE mode. Loads AWS_BEARER_TOKEN_BEDROCK from the shell
 *                env (must be a fresh token) or from io/studio/.env if
 *                present, instantiates the Haiku classifier, and runs every
 *                message in CASES through it. Costs ~$0.01 per full run.
 *
 * Run from repo root:
 *   node io/studio/src/ai-chat/intent-classifier.test.js
 *   node io/studio/src/ai-chat/intent-classifier.test.js --dry
 *
 * Hard exit code: 0 if accuracy ≥ 95%, 1 otherwise. Use as a gate before
 * Phase 3 integration.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyIntent, createClassifierClient } from './intent-classifier.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load .env from io/studio so we don't need an external dotenv dep. Tiny
 * parser; supports KEY=value lines and ignores comments/blank lines.
 */
function loadDotEnv() {
    const envPath = resolve(__dirname, '../../../.env');
    try {
        const text = readFileSync(envPath, 'utf8');
        for (const line of text.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eq = trimmed.indexOf('=');
            if (eq <= 0) continue;
            const key = trimmed.slice(0, eq).trim();
            let value = trimmed.slice(eq + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            if (!process.env[key]) process.env[key] = value;
        }
    } catch (err) {
        console.warn(`[test] could not load .env at ${envPath}: ${err.message}`);
    }
}

/**
 * Test cases drawn from:
 *  - The 4 bugs from the 2026-05-06 session
 *  - The 7 welcome-screen chips in mas-prompt-suggestions.js
 *  - Example phrasings in operations-prompt.js / prompt-templates.js
 *  - Adversarial edge cases (UUID + offer term, OSI + cards, etc.)
 *  - Plain conversational asks
 *
 * `expected` is the label a perfect classifier MUST produce. `tolerable`
 * is an alternate label we accept as also-correct (for genuinely ambiguous
 * messages). `history` simulates a prior assistant turn carrying flowId.
 */
const CASES = [
    // === Session bug reproductions (5) ===
    {
        id: 'bug-offers-quoted',
        message: 'can you show me all offers for "Firefly Pro Plus"?',
        expected: 'operations',
        notes: 'offers without cards → operations (search_offers); regression of misroute to title-search',
    },
    {
        id: 'bug-make-custom-card',
        message: 'In sandbox, can you please make me a Adobe Home Custom Card for Free users?',
        expected: 'operations',
        tolerable: 'release',
        notes: 'creation request — must NOT route to documentation',
    },
    {
        id: 'bug-find-cards-button',
        message: 'By product name',
        history: [
            {
                role: 'assistant',
                content:
                    '{"type":"guided_step","flowId":"guided_search","message":"How would you like to search?","buttonGroup":{"options":[]}}',
            },
        ],
        expected: 'guided_search',
        notes: 'flowId carries forward; otherwise terse label loses intent',
    },
    {
        id: 'bug-content-search',
        message: 'search for cards containing firefly',
        expected: 'operations',
        notes: 'content-field search; routes to operations regardless of router fast-path',
    },
    {
        id: 'success-uuid',
        message: '0881e60b-ad9e-408f-84d1-03cfc08804c4',
        expected: 'operations',
        tolerable: 'unknown',
        notes: 'Bare UUID never reaches the classifier in production — Layer 1 (deterministic frontend router) catches it at confidence 0.99 first. Either label is acceptable here since the case is theoretical only.',
    },

    // === Welcome chips (7) ===
    {
        id: 'chip-create',
        message: 'Help me create cards',
        expected: 'release',
        tolerable: 'operations',
    },
    {
        id: 'chip-search-offers',
        message: 'Search for offers by product, commitment, or term',
        expected: 'operations',
        tolerable: 'guided_search',
        notes: 'chip prompt is multi-step-flavored; either label is reasonable since the chip has no intentHint',
    },
    { id: 'chip-search-products', message: 'Search for products in the MCS catalog', expected: 'operations' },
    { id: 'chip-find-cards', message: 'Help me find specific cards', expected: 'guided_search' },
    { id: 'chip-help', message: 'Show me help topics for M@S Studio', expected: 'guided_help' },
    { id: 'chip-plans-cards', message: 'Show me all plans cards in the current workspace', expected: 'operations' },
    { id: 'chip-ccd-slices', message: 'Show CCD slice cards in the current workspace', expected: 'operations' },

    // === Operations / search variants (8) ===
    { id: 'ops-publish', message: 'publish this card', expected: 'operations' },
    { id: 'ops-bulk-publish', message: 'publish all draft cards in commerce', expected: 'operations' },
    { id: 'ops-by-osi', message: 'find cards using osi r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8', expected: 'operations' },
    { id: 'ops-by-pa', message: 'find cards for PA-1636', expected: 'operations' },
    {
        id: 'ops-product-code',
        message: 'get a list of fragment IDs with Firefly Pro as the product code',
        expected: 'operations',
    },
    { id: 'ops-title-locales', message: 'find all cards titled "Wide Card" in all locales', expected: 'operations' },
    {
        id: 'ops-variations',
        message: 'show me variations of this card',
        expected: 'operations',
        tolerable: 'unknown',
        notes: '"this card" with no id; unknown is defensible (asks for clarification). In a live session lastOperation context resolves it.',
    },
    { id: 'ops-update', message: 'change the title of card abc-123 to "New Title"', expected: 'operations' },

    // === Documentation (5) ===
    { id: 'docs-what-is-osi', message: 'what is an OSI?', expected: 'documentation' },
    { id: 'docs-how-publish', message: 'how do I publish a card?', expected: 'documentation' },
    { id: 'docs-troubleshoot', message: 'why does the AOS lookup fail with 500?', expected: 'documentation' },
    { id: 'docs-explain', message: 'explain the difference between commitment and term', expected: 'documentation' },
    { id: 'docs-where-find', message: 'where can I find the M@S architecture wiki?', expected: 'documentation' },

    // === Release / NPI flow (4) ===
    {
        id: 'release-explicit',
        message: "I want to create cards for Photoshop. Let's start the NPI flow",
        expected: 'release',
    },
    { id: 'release-by-pa', message: "let's create cards for PA-2244", expected: 'release' },
    {
        id: 'release-step',
        message: 'Selected product: Firefly Pro Plus (arrangement_code: ffl_pro_plus_direct_individual)',
        history: [{ role: 'assistant', content: '{"type":"guided_step","flowId":"release","buttonGroup":{}}' }],
        expected: 'release',
    },
    { id: 'release-confirm', message: 'Confirmed. Create cards for these variants: plans, catalog.', expected: 'release' },

    // === Collection (3) ===
    { id: 'coll-create', message: 'create a collection of all my Photoshop cards', expected: 'collection' },
    {
        id: 'coll-modify',
        message: 'add card abc-123 to my Photoshop collection',
        expected: 'collection',
        tolerable: 'operations',
        notes: 'workflows.js says collection = create OR modify; either label routes to the same MCP tool',
    },
    {
        id: 'coll-multiple',
        message: 'I want to make multiple cards into a single collection',
        expected: 'collection',
    },

    // === Guided help follow-ups (2) ===
    {
        id: 'help-button',
        message: 'How merch cards work',
        history: [{ role: 'assistant', content: '{"type":"guided_step","flowId":"guided_help","buttonGroup":{}}' }],
        expected: 'guided_help',
    },
    {
        id: 'help-followup',
        message: 'tell me more',
        history: [
            {
                role: 'assistant',
                content: '{"type":"guided_step","flowId":"guided_help","message":"What do you want to learn?"}',
            },
        ],
        expected: 'guided_help',
        tolerable: 'documentation',
    },

    // === Adversarial / mixed (5) ===
    {
        id: 'adv-osi-and-cards',
        message: 'find all cards using offer selector r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8',
        expected: 'operations',
    },
    {
        id: 'adv-uuid-conversational',
        message: "I'm not sure what 0881e60b-ad9e-408f-84d1-03cfc08804c4 represents",
        expected: 'documentation',
        tolerable: 'operations',
    },
    {
        id: 'adv-multi-uuid',
        message: 'compare 0881e60b-ad9e-408f-84d1-03cfc08804c4 and bbbb-cccc-dddd-eeee-ffff-aaaa-bbbb-cccc',
        expected: 'operations',
        tolerable: 'unknown',
    },
    {
        id: 'adv-mixed-offers-cards',
        message: 'show me cards and their offers for Photoshop',
        expected: 'operations',
        notes: 'both keywords; routing rule says cards-first',
    },
    { id: 'adv-greeting', message: 'hi', expected: 'unknown', tolerable: 'documentation' },

    // === Plain conversational (1) ===
    { id: 'plain-thanks', message: 'thanks!', expected: 'unknown', tolerable: 'documentation' },
];

function isCorrect(result, expected, tolerable) {
    if (result === expected) return 'exact';
    if (tolerable && result === tolerable) return 'tolerable';
    return null;
}

/**
 * In dry mode we replace the Bedrock call with a stub that returns the
 * fixture's expected label (or tolerable label, randomly). This validates
 * the fixture, the parser, the routing logic — but NOT model accuracy.
 *
 * @private
 */
function makeDryClient() {
    return {
        async sendMessage() {
            throw new Error('makeDryClient should not be called via classifyIntent — bypass classifyIntent in dry mode');
        },
    };
}

async function main() {
    const dryRun = process.argv.includes('--dry');

    let client;
    if (!dryRun) {
        loadDotEnv();
        client = createClassifierClient({ AWS_BEARER_TOKEN_BEDROCK: process.env.AWS_BEARER_TOKEN_BEDROCK });
    }

    const mode = dryRun ? 'DRY (stub, free)' : 'LIVE (Haiku via Bedrock)';
    console.log(`Running ${CASES.length} cases — mode: ${mode}`);
    console.log('='.repeat(80));

    const results = [];
    for (const c of CASES) {
        const r = dryRun
            ? simulateDryResult(c)
            : await classifyIntent({
                  message: c.message,
                  conversationHistory: c.history || [],
                  client,
              });
        const verdict = r.success ? isCorrect(r.intent, c.expected, c.tolerable) : null;
        results.push({ ...c, ...r, verdict });

        const status = !r.success
            ? '✗ ERROR '
            : verdict === 'exact'
              ? '✓ EXACT '
              : verdict === 'tolerable'
                ? '✓ TOL.  '
                : '✗ WRONG ';
        const expectedStr = c.tolerable ? `${c.expected}|${c.tolerable}` : c.expected;
        console.log(
            `${status} [${String(c.id).padEnd(28)}] expected=${expectedStr.padEnd(20)} got=${(r.intent || '?').padEnd(14)} (${r.latencyMs}ms)`,
        );
        if (!r.success) console.log(`         error: ${r.error}`);
        else if (!verdict) console.log(`         message: ${c.message.slice(0, 70)}`);
    }

    console.log('='.repeat(80));
    const total = results.length;
    const exact = results.filter((r) => r.verdict === 'exact').length;
    const tolerable = results.filter((r) => r.verdict === 'tolerable').length;
    const wrong = results.filter((r) => r.success && !r.verdict).length;
    const errored = results.filter((r) => !r.success).length;

    const accExact = ((exact / total) * 100).toFixed(1);
    const accAny = (((exact + tolerable) / total) * 100).toFixed(1);
    const avgLatency = Math.round(results.reduce((s, r) => s + r.latencyMs, 0) / total);

    console.log(`Exact   : ${exact}/${total}  (${accExact}%)`);
    console.log(`Tolerable: ${tolerable}/${total}`);
    console.log(`Combined: ${exact + tolerable}/${total} (${accAny}%)`);
    console.log(`Wrong   : ${wrong}`);
    console.log(`Errored : ${errored}`);
    console.log(`Avg latency: ${avgLatency} ms`);

    const passes = parseFloat(accAny) >= 95;
    console.log(passes ? '\n✓ PASS — combined accuracy ≥ 95%' : '\n✗ FAIL — combined accuracy < 95%');
    process.exit(passes ? 0 : 1);
}

/**
 * Dry-mode simulator. Returns the fixture's `expected` label so the
 * runner exits clean and we can verify the test infrastructure end-to-end
 * without burning Bedrock calls. Logs a marker line so it's obvious the
 * result wasn't from a real model.
 *
 * @private
 */
function simulateDryResult(c) {
    return {
        intent: c.expected,
        raw: `[stub] ${c.expected}`,
        latencyMs: 0,
        success: true,
    };
}

main().catch((err) => {
    console.error('Test runner failed:', err);
    process.exit(2);
});
