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

1. NEVER invent slot values. Fragment IDs (UUIDs) MUST come from \`context.lastOperation.fragmentIds\` or \`context.workingSet[].id\`. If neither contains them, set \`intent\` to "ASK_USER" and ask the user to search first. Do not slugify titles or fabricate IDs from card names in conversation history.

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
${ENVELOPE_CONTRACT}
${contextBlock}
`;
}
