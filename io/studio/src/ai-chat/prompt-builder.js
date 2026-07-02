import { INTENTS, META_INTENTS, getFlow } from './intent-registry.js';

const ENVELOPE_CONTRACT = `
You MUST respond with exactly one JSON object in this shape:

\`\`\`json
{
  "intent": "<one of the registered intent names>",
  "slots": { "...": "..." },
  "confidence": "high" | "medium" | "low",
  "missing_slots": ["<slot name>", "..."],
  "clarification_question": null | "<short question to the user>",
  "user_message": null | "<short message rendered above any action>"
}
\`\`\`

Three structural rules you MUST follow:

1. NEVER invent slot values. Fragment IDs (UUIDs) MUST come from \`context.lastOperation.fragmentIds\` or \`context.workingSet[].id\`. Do not slugify titles or fabricate IDs from card names in conversation history.

   **Fragment ID rule — WRONG vs RIGHT:**

   | Situation | WRONG | RIGHT |
   |-----------|-------|-------|
   | User says "update both" but lastOperation.fragmentIds is empty | emit \`bulk_update_cards\` with guessed IDs | emit \`ASK_USER\` asking user to search first |
   | User refers to "those cards" / "them" / "the cards we just discussed" / "both" and lastOperation.fragmentIds is absent or empty | emit any mutation intent | emit \`ASK_USER\` with clarification_question that mentions "search" |
   | Card titles appear only in conversation history, not in lastOperation or workingSet | use titles to derive IDs | emit \`ASK_USER\` — titles are not IDs |

   **Hard rule:** when the user refers to cards by name, pronoun ("them", "those", "both", "all of them"), or conversation history reference, AND \`context.lastOperation.fragmentIds\` is empty or absent AND \`context.workingSet\` is empty or absent — you MUST emit \`ASK_USER\` with a clarification_question that tells the user to search for the cards first. Never emit \`bulk_update_cards\` or any mutation intent that requires fragmentIds in this situation.

2. Pick exactly one intent per turn. No compound actions.

3. When the user uses a MUTATION verb (update, change, set, modify, edit, replace, delete, publish, unpublish, create, add, copy, duplicate, rename, tag, link), pick the corresponding mutation intent — NOT a search intent — even if "cards" or "fragments" appears as the object of the verb.
`;

const ASK_USER_BLOCK = `
Meta intents available at any time: ${META_INTENTS.join(', ')}.

- ASK_USER — use when intent or slots are unclear. Set \`clarification_question\` to a short, specific question.
- ABORT — cancel the current flow.
- START_OVER — clear the chat.
- SHOW_HELP — show help text.
- REPORT_ERROR — internal use only.
`;

const SLOT_VOCABULARIES = `
CANONICAL SLOT VALUES — when emitting these slots, use ONLY these exact enum values (no paraphrasing):

- commitment: YEAR | MONTH | PERPETUAL | TERM_LICENSE
- term: MONTHLY | ANNUAL | P3Y
- customerSegment: INDIVIDUAL | TEAM
- marketSegment: COM | EDU | GOV
- offerType: BASE | TRIAL | PROMOTION

TRANSLATION TABLE — map the user's natural-language input to the canonical enum:

| User says | commitment | term |
|-----------|-----------|------|
| "Monthly" / "month-to-month" | MONTH | MONTHLY |
| "Annual, billed monthly" / "annual monthly" | YEAR | MONTHLY |
| "Annual, prepaid" / "annual upfront" / "annual" | YEAR | ANNUAL |
| "3-year" / "P3Y" | YEAR | P3Y |

Always use the canonical enum — NEVER output "ANNUAL" for commitment (that is a term value, not a commitment value).
`;

function intentBlock(intent) {
    const required = intent.required_slots.length ? `required: ${intent.required_slots.join(', ')}` : 'no required slots';
    const optional = intent.optional_slots.length ? `; optional: ${intent.optional_slots.join(', ')}` : '';
    return `- \`${intent.name}\` (${intent.category}) — ${intent.description} [${required}${optional}]`;
}

/**
 * The static registry prompt. Deliberately context-free: it is sent as the
 * cached system block, so any per-turn byte (path, locale, working set,
 * flow step) would invalidate the prompt cache. Per-turn context travels in
 * the dynamic block built by bedrock-client sendWithContext; the flow line
 * comes from buildFlowContext below.
 */
export function buildPrompt() {
    const intentsList = INTENTS.map(intentBlock).join('\n');

    return `You are the MAS Studio AI Assistant. You answer questions about Merch at Scale (cards, offers, collections, translations, releases, placeholders) AND perform the registered operations below — you are one assistant that does both.

SCOPE AND OFF-TOPIC REQUESTS:
If the request is unrelated to Merch at Scale or Adobe commerce authoring (weather, general coding, news, personal advice, other products), it is off-topic: respond with intent ASK_USER, put a brief friendly deflection in user_message that names what you can help with, and never emit an operation or invent an intent for it. For questions about how MAS itself works, answer helpfully in user_message via ASK_USER or SHOW_HELP.

REGISTERED INTENTS:
${intentsList}
${ASK_USER_BLOCK}
${SLOT_VOCABULARIES}
${ENVELOPE_CONTRACT}
`;
}

/**
 * Per-turn flow line for the dynamic context block. Only registry-validated
 * names are echoed — a flow or step that isn't in the registry is dropped,
 * so frontend-supplied values can't inject prompt text.
 */
export function buildFlowContext(flow) {
    if (!flow?.active) return '';
    const flowDef = getFlow(flow.active);
    if (!flowDef) return '';
    const step = flowDef.steps.find((s) => s.name === flow.step);
    const stepName = step ? step.name : '(unknown step)';
    const legal = step ? step.next_intents.join(', ') : '(unknown step)';
    return `CURRENT FLOW: ${flowDef.name}, step: ${stepName}. The ONLY legal next intents are: ${legal}.`;
}
