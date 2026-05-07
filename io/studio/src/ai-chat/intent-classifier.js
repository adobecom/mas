/**
 * Intent Classifier — Phase 2 of the smarter-routing architecture.
 *
 * Standalone module. NOT wired into index.js yet. Phase 3 will integrate
 * behind a USE_LLM_CLASSIFIER feature flag with the keyword classifier as
 * fallback.
 *
 * Purpose: replace the keyword cascade in determineSystemPromptWithMeta()
 * with one cheap Bedrock call (Claude Haiku) that classifies intent given:
 *   - the user's message (and optional one-back conversation context)
 *   - the MAS glossary (cached)
 *   - the workflows list (cached)
 *
 * Output: a single intent label string, one of:
 *   'operations' | 'documentation' | 'guided_search' | 'release'
 *   | 'guided_help' | 'collection' | 'unknown'
 *
 * Cost: ~800 tokens in (cached after first turn), 5 tokens out, ~$0.0001/turn.
 * Latency: ~150ms warm, ~300ms cold.
 */

import { BedrockClient } from './bedrock-client.js';
import { MAS_GLOSSARY } from './glossary.js';
import { WORKFLOWS_LIST } from './workflows.js';

const VALID_INTENTS = new Set([
    'operations',
    'documentation',
    'guided_search',
    'guided_offer_search',
    'release',
    'guided_help',
    'collection',
    'unknown',
]);

const DEFAULT_HAIKU_MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';

const CLASSIFIER_SYSTEM_PROMPT = `You are an intent classifier for the Adobe Merch at Scale (M@S) AI assistant.

Your only job: read the user's message and the recent conversation context, and emit ONE intent label that tells the downstream system which workflow prompt to load.

${MAS_GLOSSARY}

${WORKFLOWS_LIST}

=== OUTPUT FORMAT ===

Respond with EXACTLY ONE label from this set: operations | documentation | guided_search | guided_offer_search | release | guided_help | collection | unknown

No explanation. No preamble. No JSON. Just the bare label, lowercase, no quotes, no trailing punctuation.

Examples:
  user: "find cards titled photoshop"
  → operations

  user: "what is an OSI?"
  → documentation

  user: "show me all offers for Firefly Pro Plus"
  → operations

  user: "help me find specific cards"
  → guided_search

  user: "make me a custom card"
  → operations

  user: "create cards for PA-2244"
  → release

  user: "explain how publishing works"
  → documentation

  user: "hi"
  → unknown

  recent assistant: '{"type":"guided_step","flowId":"guided_help",...}'
  user: "How merch cards work"
  → guided_help    (flowId in history dominates over the docs-shape phrasing)

  recent assistant: '{"type":"guided_step","flowId":"guided_search",...}'
  user: "Photoshop"
  → guided_search  (terse product reply is part of the search flow; not unknown)

  user: "Search for offers by product, commitment, or term"
  → guided_offer_search

  recent assistant: '{"type":"guided_step","flowId":"guided_offer_search",...}'
  user: "By customer segment (Individual / Team / Enterprise)"
  → guided_offer_search  (button click inside the offer-search flow)
`;

/**
 * Build a Bedrock client configured for Haiku.
 *
 * Uses the same credentials path as the main Sonnet client (bearer token
 * preferred, IAM fallback). Only the model ID differs.
 *
 * @param {Object} params - IO Runtime action params (env vars)
 * @returns {BedrockClient}
 */
export function createClassifierClient(params = {}) {
    const haikuModelId = params.HAIKU_MODEL_ID || process.env.HAIKU_MODEL_ID || DEFAULT_HAIKU_MODEL_ID;
    return new BedrockClient({
        bearerToken: params.AWS_BEARER_TOKEN_BEDROCK,
        accessKeyId: params.AWS_ACCESS_KEY_ID,
        secretAccessKey: params.AWS_SECRET_ACCESS_KEY,
        region: params.AWS_REGION,
        modelId: haikuModelId,
    });
}

const DEFAULT_CLASSIFIER_TIMEOUT_MS = 3000;

/**
 * Classify the user's intent.
 *
 * Returns one of VALID_INTENTS. On any failure (Bedrock 5xx, timeout, etc.)
 * returns 'unknown' so the caller can fall back to its keyword classifier
 * — never throws.
 *
 * Hard-capped at `timeoutMs` (default 3s) so a hanging Bedrock call never
 * eats the action's full 60s budget. If Haiku is missing or unprovisioned,
 * we still get a synchronous fallback to the keyword classifier.
 *
 * @param {Object} args
 * @param {string} args.message - Current user message
 * @param {Array<{role:string, content:string}>} [args.conversationHistory=[]] - Prior turns
 * @param {BedrockClient} args.client - Pre-constructed classifier client (Haiku)
 * @param {number} [args.maxTokens=10] - Token budget for the classifier output
 * @param {number} [args.timeoutMs=3000] - Hard cap on classifier latency
 * @returns {Promise<{intent: string, raw: string, latencyMs: number, success: boolean, error?: string}>}
 */
export async function classifyIntent({
    message,
    conversationHistory = [],
    client,
    maxTokens = 10,
    timeoutMs = DEFAULT_CLASSIFIER_TIMEOUT_MS,
}) {
    if (!message || typeof message !== 'string') {
        return { intent: 'unknown', raw: '', latencyMs: 0, success: false, error: 'empty message' };
    }
    if (!client) {
        return { intent: 'unknown', raw: '', latencyMs: 0, success: false, error: 'no client' };
    }

    const userTurn = buildUserTurn(message, conversationHistory);
    const start = Date.now();

    let timeoutHandle;
    const timeoutPromise = new Promise((resolve) => {
        timeoutHandle = setTimeout(
            () => resolve({ __classifierTimedOut: true }),
            Math.max(100, Number(timeoutMs) || DEFAULT_CLASSIFIER_TIMEOUT_MS),
        );
    });

    try {
        const sendPromise = client.sendMessage([{ role: 'user', content: userTurn }], CLASSIFIER_SYSTEM_PROMPT, maxTokens);
        const result = await Promise.race([sendPromise, timeoutPromise]);
        const latencyMs = Date.now() - start;

        if (result?.__classifierTimedOut) {
            return {
                intent: 'unknown',
                raw: '',
                latencyMs,
                success: false,
                error: `classifier timeout after ${timeoutMs}ms`,
            };
        }

        if (!result.success) {
            return { intent: 'unknown', raw: '', latencyMs, success: false, error: result.error };
        }

        const raw = (result.message || '').trim().toLowerCase();
        const intent = parseIntent(raw);
        return { intent, raw, latencyMs, success: true };
    } catch (error) {
        return {
            intent: 'unknown',
            raw: '',
            latencyMs: Date.now() - start,
            success: false,
            error: error?.message || String(error),
        };
    } finally {
        clearTimeout(timeoutHandle);
    }
}

/**
 * Build the user-turn content the classifier sees. Includes the most recent
 * assistant message verbatim if it carries a flowId (so the classifier can
 * keep guided flows sticky), otherwise just the current message.
 *
 * Keeps the user-turn small — the system prompt is the heavy cached part.
 *
 * @private
 */
function buildUserTurn(message, conversationHistory) {
    const lastAssistant = findLastAssistantWithFlowId(conversationHistory);
    if (!lastAssistant) {
        return `User message: ${message}`;
    }
    return `Recent assistant turn (extract flowId): ${truncate(lastAssistant.content, 400)}\n\nUser message: ${message}`;
}

/**
 * Walk conversation history backwards looking for the most recent assistant
 * message that contains a flowId field. Returns the message object or null.
 *
 * Limits the look-back to the 6 most recent assistant messages — older
 * context is rarely relevant and grows the input unnecessarily.
 *
 * @private
 */
function findLastAssistantWithFlowId(conversationHistory) {
    if (!Array.isArray(conversationHistory)) return null;
    let assistantSeen = 0;
    for (let i = conversationHistory.length - 1; i >= 0 && assistantSeen < 6; i -= 1) {
        const msg = conversationHistory[i];
        if (msg?.role === 'assistant' && typeof msg.content === 'string') {
            assistantSeen += 1;
            if (msg.content.includes('"flowId"')) return msg;
        }
    }
    return null;
}

/**
 * Parse the raw model output into one of VALID_INTENTS.
 *
 * The model is instructed to emit just the bare label, but we defensively
 * scan for any of the valid labels in case it added decoration.
 *
 * @private
 */
function parseIntent(raw) {
    const cleaned = raw.replace(/[^a-z_]/g, ' ').trim();
    if (VALID_INTENTS.has(cleaned)) return cleaned;
    for (const candidate of VALID_INTENTS) {
        if (cleaned.includes(candidate)) return candidate;
    }
    return 'unknown';
}

function truncate(s, max) {
    if (typeof s !== 'string') return '';
    return s.length > max ? `${s.slice(0, max)}…` : s;
}
