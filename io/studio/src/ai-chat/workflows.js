/**
 * Available workflows / system prompts the classifier can choose from.
 *
 * Each workflow maps to one of the system-prompt constants in
 * prompt-templates.js or operations-prompt.js. The classifier reads only the
 * one-line "when to use" descriptions; the full prompt is loaded on demand
 * by determineSystemPromptWithMeta() based on the chosen label.
 *
 * Keep entries short. The whole list must fit in the classifier's prompt
 * along with the glossary.
 */

export const WORKFLOWS_LIST = `=== AVAILABLE WORKFLOWS ===

operations    = run MCP tools on existing cards/offers/products. Use for: search, find, list, show, get, publish, unpublish, delete, copy, update, edit cards or offers; lookups by ID/OSI/PA code; tag/variant/locale filtering. Also for "create" requests when MCS data is needed (route to operations so create_release_cards is available).

documentation = explain MAS concepts, troubleshoot, point to wiki/Slack. Use for: "what is X", "how do I Y", "why does Z fail", "explain", "troubleshoot", platform-architecture questions. NOT for action requests.

guided_search = multi-step search wizard launched from "Find Cards" chip OR when the user explicitly asks for guided card search. Stays in this flow across button clicks until the user picks a method and the search runs. Look for flowId: "guided_search" in conversation history.

guided_offer_search = multi-step OFFER search wizard launched from "Search offers" chip. Pivots on offer facets (offer type, customer segment, plan type, market segment, country) — NOT card facets. Terminal tool is search_offers or get_offer_by_id. Stays in this flow across button clicks. Look for flowId: "guided_offer_search" in conversation history.

release       = NPI / release card-creation flow. Multi-step product → offering → variant selection → confirmation. Launched from "Create cards" chip OR when the user provides a product identifier and wants new cards. Look for flowId: "release" in conversation history.

guided_help   = multi-step help wizard launched from "Help" chip. Stays in this flow across button clicks until the user picks a topic. Look for flowId: "guided_help" in conversation history.

collection    = create or modify a card collection (grouped/ordered set of cards). Use when the user mentions "collection" or "multiple cards" as a unit.

unknown       = ambiguous; the downstream prompt should ask a clarifying question instead of guessing.

=== ROUTING RULES ===

1. **HIGHEST PRIORITY — flowId stickiness.** If the most recent assistant message in the user-turn input contains \`"flowId": "<flow>"\`, you MUST emit that flow's label, even if the user's message looks like a different intent on its own. Button-clicked replies inside a guided flow always route to that flow.
   - Example: assistant emitted \`{"flowId":"guided_help",...}\`. User clicks a topic chip whose label happens to look like a docs question ("How merch cards work"). Correct label is \`guided_help\`, NOT \`documentation\`. The flow's prompt knows what to do with the topic.
   - Example: assistant emitted \`{"flowId":"guided_search",...}\`. User clicks "By product name" or types "Firefly Pro Plus". Correct label is \`guided_search\`. The flow's prompt routes the product term to a search.
   - Only break out of the flow when the user clearly changes topic (e.g. pastes a UUID for direct lookup, or asks an unrelated meta-question like "what are surfaces?").

2. If the user's message contains "offer(s)" without "card(s)" or "fragment(s)", the intent is operations (search_offers — see WCS in glossary). Never documentation, never release.

3. If the user's message contains "card(s)" or "fragment(s)" plus a product/PA/arrangement reference, the intent is operations (search_cards by tag — see arrangement code in glossary). Never release unless the user explicitly says "create" or "new".

4. If the user asks "what is X" / "how do I X" / "why does X" with no action verb, the intent is documentation.

5. Default for ambiguous action requests: operations. The operations prompt is a strict superset of capabilities.
`;

/**
 * Estimated tokens. Small intentionally — fits alongside the glossary in
 * the classifier prompt without bloating it.
 */
export const WORKFLOWS_LIST_TOKEN_ESTIMATE = 350;
