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

export function buildPrompt(context = {}) {
    if (context === null) context = {};
    const intentsList = INTENTS.map(intentBlock).join('\n');

    let contextBlock = '';
    if (context.flow?.active) {
        const flow = getFlow(context.flow.active);
        const step = flow?.steps.find((s) => s.name === context.flow.step);
        const legal = step ? step.next_intents.join(', ') : '(unknown step)';
        contextBlock += `\n\nCURRENT FLOW: ${context.flow.active}, step: ${context.flow.step}. The ONLY legal next intents are: ${legal}.`;
    }
    if (context.lastOperation?.fragmentIds?.length) {
        contextBlock += `\n\nlastOperation.fragmentIds (use these as fragmentIds when the user refers to "those cards" / "them" / etc.): ${JSON.stringify(context.lastOperation.fragmentIds)}`;
    }
    if (context.workingSet?.length) {
        contextBlock += `\n\nworkingSet (ids visible in chat now): ${JSON.stringify(context.workingSet.map((w) => w.id).filter(Boolean))}`;
    }
    if (context.currentPath) {
        contextBlock += `\n\ncontext.currentPath: ${context.currentPath}`;
    }
    if (context.currentLocale) {
        contextBlock += `\n\ncontext.currentLocale: ${context.currentLocale}`;
    }

    return `You are the MAS Studio AI Assistant.

REGISTERED INTENTS:
${intentsList}
${ASK_USER_BLOCK}
${SLOT_VOCABULARIES}
${ENVELOPE_CONTRACT}
${contextBlock}
`;
}
