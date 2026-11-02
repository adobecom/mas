#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { INTENTS, FLOWS, META_INTENTS } from '../src/ai-chat/intent-registry.js';
import { validateEnvelope } from '../src/ai-chat/envelope-validator.js';
import {
    parseOperationRequest,
    validateOperation,
    extractOperationMessage,
    resolveArrangementCodeFromHistory,
    resolveArrangementCodeFromContext,
} from '../src/ai-chat/operations-handler.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const CASES_PATH = join(currentDir, '../src/ai-chat/intent-registry.cases.json');
// NPI "create cards with AI" guided-flow invariants. Mocked model/tool turns,
// asserted against the real exported deterministic functions. See the file's
// "about" note for the contract.
const NPI_CASES_PATH = join(currentDir, '../src/ai-chat/npi-card-creation.cases.json');

const mode = process.argv[2] || '--unit';

function exitWith(code, msg) {
    console.log(msg);
    process.exit(code);
}

// Guided turns (release, card creation, active flows) never emit an envelope:
// index.js routes them to the guided path so their rich payloads survive. Such
// a case asserts the response shape and its visible content instead.
const RESPONSE_TYPES = new Set(['guided_step', 'studio_operation', 'message', 'open_ost']);

const isGuidedCase = (c) => Boolean(c.expect?.response_type);

function runUnit() {
    let cases;
    try {
        const parsed = JSON.parse(readFileSync(CASES_PATH, 'utf8'));
        cases = parsed.cases;
    } catch (err) {
        exitWith(1, `--unit FAIL: ${err.message}`);
        return;
    }
    if (!Array.isArray(cases)) {
        exitWith(1, '--unit FAIL: cases.json missing "cases" array');
        return;
    }

    const failures = [];
    const knownNames = new Set([...INTENTS.map((i) => i.name), ...META_INTENTS]);

    for (const c of cases) {
        if (!knownNames.has(c.intent_under_test))
            failures.push(`case ${c.id}: intent_under_test ${c.intent_under_test} not in registry`);
        if (!c.user_message) failures.push(`case ${c.id}: missing user_message`);
        if (!c.expect) failures.push(`case ${c.id}: missing expect`);
        if (c.expect && !c.expect.intent && !Array.isArray(c.expect.intent_one_of) && !c.expect.response_type)
            failures.push(`case ${c.id}: expect needs intent, intent_one_of or response_type`);
        if (c.expect?.response_type && !RESPONSE_TYPES.has(c.expect.response_type))
            failures.push(`case ${c.id}: unknown response_type ${c.expect.response_type}`);
        for (const name of c.expect?.intent_one_of ?? []) {
            if (!knownNames.has(name)) failures.push(`case ${c.id}: intent_one_of ${name} not in registry`);
        }
    }

    const npiCount = runNpiUnit(failures);

    if (failures.length) {
        exitWith(1, `--unit FAIL\n  ${failures.join('\n  ')}`);
        return;
    }
    exitWith(
        0,
        `--unit PASS (${cases.length} cases, ${INTENTS.length} intents, ${FLOWS.length} flows; NPI: ${npiCount} cases)`,
    );
}

function acceptedIntents(c) {
    return c.expect.intent_one_of ?? [c.expect.intent];
}

function expectedEnvelopeFromCase(c) {
    return {
        intent: acceptedIntents(c)[0],
        slots: c.expect.slots_include ?? {},
        confidence: 'high',
        missing_slots: [],
        clarification_question: c.expect.clarification_question_includes
            ? `… ${c.expect.clarification_question_includes} …`
            : null,
        user_message: null,
    };
}

function deepEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------
// NPI ("create cards with AI") guided-flow invariant harness.
//
// Each NPI case mocks one model turn (mockModelResponse) plus the tool results
// it depends on (conversationHistory / context), and the detector below runs it
// through the real exported deterministic functions (parseOperationRequest,
// validateOperation, resolveArrangementCodeFromHistory/Context) plus one
// per-invariant check. `expect.violates` says whether the mocked turn is clean
// (false) or a freelancing turn the detector MUST flag (true) — so both
// positive and negative examples lock the invariant.
// ---------------------------------------------------------------------------

const NPI_INVARIANTS = new Set([1, 2, 3, 4, 5]);
const OFFER_ID_32HEX = /^[A-Fa-f0-9]{32}$/;
const PA_CODE = /^PA-\d+$/i;
const ARRANGEMENT_SLUG = /^[a-z0-9]+(?:_[a-z0-9]+)+$/;

function loadNpiCases(mode) {
    try {
        const parsed = JSON.parse(readFileSync(NPI_CASES_PATH, 'utf8'));
        if (!Array.isArray(parsed.cases)) {
            exitWith(1, `${mode} FAIL: npi cases.json missing "cases" array`);
            return null;
        }
        return parsed.cases;
    } catch (err) {
        exitWith(1, `${mode} FAIL: ${err.message}`);
        return null;
    }
}

// A money-touching product/arrangement identifier (not a free-text name, not an
// OSI, not a 32-hex offer id — those are handled separately).
function looksLikeArrangementCode(value) {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    return PA_CODE.test(trimmed) || ARRANGEMENT_SLUG.test(trimmed);
}

// The first fenced ```json block, parsed. Mocked turns always fence their JSON;
// a plain-text turn (e.g. product-not-found) returns null here.
function firstJsonBlock(text) {
    const match = (text ?? '').match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) return null;
    try {
        return JSON.parse(match[1]);
    } catch (err) {
        return null;
    }
}

// Every arrangement/PA code the conversation has actually seen from a tool
// result or context — unions the real resolve helpers with a scan of history.
function groundedCodes(conversationHistory, context) {
    const set = new Set();
    const fromHistory = resolveArrangementCodeFromHistory(conversationHistory);
    if (fromHistory) set.add(fromHistory);
    const fromContext = resolveArrangementCodeFromContext(context);
    if (fromContext) set.add(fromContext);
    const joined = (conversationHistory ?? [])
        .map((turn) => (typeof turn?.content === 'string' ? turn.content : ''))
        .join('\n');
    const scan = /arrangement_code["']?\s*[:=]\s*["']?([A-Za-z0-9_-]+)/gi;
    let hit;
    while ((hit = scan.exec(joined)) !== null) set.add(hit[1]);
    return set;
}

// Returns a violation string when the mocked turn breaks its invariant, else null.
function detectNpiViolation(c) {
    const response = c.mockModelResponse ?? '';
    const operation = parseOperationRequest(response);
    const block = firstJsonBlock(response);
    const type = block?.type ?? (operation ? 'studio_operation' : null);
    const history = c.conversationHistory ?? [];
    const context = c.context ?? {};
    const params = operation?.operationParams ?? {};

    switch (c.invariant) {
        case 1: {
            const code = params.searchText ?? params.arrangement_code ?? params.arrangementCode;
            const codeBearing =
                operation &&
                ['list_products', 'create_release_cards', 'get_product_by_arrangement_code'].includes(operation.operationName);
            if (codeBearing && looksLikeArrangementCode(code) && !groundedCodes(history, context).has(code)) {
                return `fabricated arrangement/PA code "${code}" — not present in any tool result or context`;
            }
            return null;
        }
        case 2: {
            if (operation?.operationName === 'list_products') {
                const searchText = (params.searchText ?? '').trim();
                if (OFFER_ID_32HEX.test(searchText)) {
                    return `32-hex offer id "${searchText}" passed as list_products searchText`;
                }
            }
            return null;
        }
        case 3: {
            const resolvedPa = resolveArrangementCodeFromHistory(history);
            if (!resolvedPa) return null;
            if (operation?.operationName !== 'list_products') {
                return `chaining broken: expected list_products after resolve, got ${
                    operation?.operationName ?? type ?? 'no operation'
                }`;
            }
            const searchText = (params.searchText ?? '').trim();
            if (searchText !== resolvedPa) {
                return `list_products searchText "${searchText}" is not the resolved PA code "${resolvedPa}"`;
            }
            return null;
        }
        case 4: {
            if (operation?.operationName === 'list_products') {
                return 're-ran list_products though a product was already selected';
            }
            if (Array.isArray(block?.productCards) && block.productCards.length > 0) {
                return 're-rendered productCards though a product was already selected';
            }
            return null;
        }
        case 5: {
            if (operation?.operationName === 'create_release_cards') {
                return 'emitted create_release_cards on an empty product result';
            }
            if (type === 'release_cards') {
                return 'emitted release_cards on an empty product result';
            }
            const code = params.arrangement_code ?? params.arrangementCode ?? params.searchText;
            if (looksLikeArrangementCode(code) && !groundedCodes(history, context).has(code)) {
                return `fabricated product "${code}" on an empty result`;
            }
            const message = (block?.message ?? extractOperationMessage(response) ?? '').toLowerCase();
            const missing = (c.expect?.message_includes ?? []).filter(
                (needle) => !message.includes(String(needle).toLowerCase()),
            );
            if (missing.length) return `not-found message missing ${JSON.stringify(missing)}`;
            return null;
        }
        default:
            return `unknown invariant ${c.invariant}`;
    }
}

// A clean (violates:false) case must additionally be a VALID operation when it
// emits one — a well-formed turn is part of the invariant.
function npiShapeError(c) {
    if (c.expect?.violates) return null;
    const operation = parseOperationRequest(c.mockModelResponse ?? '');
    if (!operation) return null;
    const validation = validateOperation(operation);
    return validation.valid ? null : `operation shape invalid: ${validation.error}`;
}

function runNpiUnit(failures) {
    const cases = loadNpiCases('--unit');
    if (!cases) return 0;
    const ids = new Set();
    for (const c of cases) {
        if (!c.id) failures.push(`npi case: missing id`);
        if (ids.has(c.id)) failures.push(`npi case ${c.id}: duplicate id`);
        ids.add(c.id);
        if (!NPI_INVARIANTS.has(c.invariant)) failures.push(`npi case ${c.id}: invariant must be 1-5`);
        if (typeof c.mockModelResponse !== 'string' || !c.mockModelResponse)
            failures.push(`npi case ${c.id}: missing mockModelResponse`);
        if (typeof c.expect?.violates !== 'boolean') failures.push(`npi case ${c.id}: expect.violates must be boolean`);
        if (c.expect?.violates && !c.expect.violation_includes)
            failures.push(`npi case ${c.id}: a violating case needs expect.violation_includes`);
    }
    return cases.length;
}

function runNpiMockLlm(failures) {
    const cases = loadNpiCases('--mock-llm');
    if (!cases) return 0;
    for (const c of cases) {
        const shapeError = npiShapeError(c);
        if (shapeError) {
            failures.push(`npi ${c.id}: ${shapeError}`);
            continue;
        }
        const violation = detectNpiViolation(c);
        const want = Boolean(c.expect?.violates);
        if (Boolean(violation) !== want) {
            failures.push(
                want
                    ? `npi ${c.id}: expected a violation but none detected`
                    : `npi ${c.id}: unexpected violation — ${violation}`,
            );
            continue;
        }
        if (want && c.expect.violation_includes && !violation.includes(c.expect.violation_includes)) {
            failures.push(
                `npi ${c.id}: wrong violation — expected to mention "${c.expect.violation_includes}", got "${violation}"`,
            );
        }
    }
    return cases.length;
}

function runMockLlm() {
    let cases;
    try {
        const parsed = JSON.parse(readFileSync(CASES_PATH, 'utf8'));
        cases = parsed.cases;
    } catch (err) {
        exitWith(1, `--mock-llm FAIL: ${err.message}`);
        return;
    }
    if (!Array.isArray(cases)) {
        exitWith(1, '--mock-llm FAIL: cases.json missing "cases" array');
        return;
    }

    const failures = [];
    let skipped = 0;

    for (const c of cases) {
        if (isGuidedCase(c)) {
            skipped += 1;
            continue;
        }
        const mockEnvelope = expectedEnvelopeFromCase(c);
        const result = validateEnvelope(mockEnvelope, c.context || {});

        const expectedIntent = acceptedIntents(c)[0];

        if (expectedIntent === 'ASK_USER') {
            const got = result.ok ? result.envelope?.intent : result.coerced?.intent;
            if (got !== 'ASK_USER') {
                failures.push(
                    `case ${c.id}: expected ASK_USER, got ${got} (ok=${result.ok}, reason=${result.reason ?? 'n/a'})`,
                );
            }
            continue;
        }

        if (!result.ok) {
            failures.push(`case ${c.id}: validator failed unexpectedly (reason=${result.reason})`);
            continue;
        }
        if (result.envelope.intent !== expectedIntent) {
            failures.push(`case ${c.id}: expected intent ${expectedIntent}, got ${result.envelope.intent}`);
            continue;
        }

        if (c.expect.slots_include) {
            for (const [key, want] of Object.entries(c.expect.slots_include)) {
                if (!deepEqual(result.envelope.slots[key], want)) {
                    failures.push(
                        `case ${c.id}: slot ${key}: expected ${JSON.stringify(want)}, got ${JSON.stringify(result.envelope.slots[key])}`,
                    );
                }
            }
        }
    }

    const npiCount = runNpiMockLlm(failures);

    if (failures.length) {
        exitWith(1, `--mock-llm FAIL (${failures.length} findings):\n  ${failures.join('\n  ')}`);
        return;
    }
    exitWith(
        0,
        `--mock-llm PASS (${cases.length - skipped} envelope cases, ${skipped} guided skipped; NPI: ${npiCount} invariant cases)`,
    );
}

async function runLiveLlm() {
    let cases;
    try {
        const parsed = JSON.parse(readFileSync(CASES_PATH, 'utf8'));
        cases = parsed.cases;
    } catch (err) {
        exitWith(1, `--live-llm FAIL: ${err.message}`);
        return;
    }
    if (!Array.isArray(cases)) {
        exitWith(1, '--live-llm FAIL: cases.json missing "cases" array');
        return;
    }

    const token = process.env.MAS_IMS_TOKEN;
    if (!token) {
        exitWith(1, '--live-llm FAIL: MAS_IMS_TOKEN environment variable is required');
        return;
    }

    const url =
        process.env.AI_CHAT_URL ?? 'https://14257-merchatscale-axel.adobeioruntime.net/api/v1/web/MerchAtScaleStudio/ai-chat';

    let pass = 0;
    let fail = 0;
    const failures = [];

    for (const c of cases) {
        const body = {
            message: c.user_message,
            conversationHistory: c.conversationHistory ?? [],
            context: c.context ?? {},
            requestId: `eval-${c.id}`,
            useShadowPrompt: true,
        };
        // The frontend forwards intentHint on every turn of a guided flow;
        // without it the turn re-classifies and drifts out of the flow.
        if (c.intent_hint) body.intentHint = c.intent_hint;

        let data;
        let status;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'x-api-key': 'mas-studio',
                },
                body: JSON.stringify(body),
            });
            status = res.status;
            data = await res.json();
        } catch (err) {
            fail += 1;
            failures.push(`${c.id}: network error — ${err.message}`);
            continue;
        }

        if (isGuidedCase(c)) {
            if (data.type !== c.expect.response_type) {
                fail += 1;
                failures.push(`${c.id}: expected type ${c.expect.response_type}, got ${data.type} (status=${status})`);
                continue;
            }
            const haystack = `${data.message ?? ''} ${JSON.stringify(data.buttonGroup ?? '')}`.toLowerCase();
            const needles = c.expect.response_includes ?? [];
            const missing = needles.filter((n) => !haystack.includes(String(n).toLowerCase()));
            if (missing.length) {
                fail += 1;
                failures.push(`${c.id}: response missing ${JSON.stringify(missing)}`);
                continue;
            }
            pass += 1;
            continue;
        }

        const envelope = data.envelope ?? null;
        if (!envelope) {
            fail += 1;
            failures.push(`${c.id}: no envelope (status=${status})`);
            continue;
        }

        const accepted = acceptedIntents(c);
        if (!accepted.includes(envelope.intent)) {
            fail += 1;
            failures.push(`${c.id}: expected intent ${accepted.join('|')}, got ${envelope.intent}`);
            continue;
        }

        let slotOk = true;
        if (c.expect.slots_include) {
            for (const [key, want] of Object.entries(c.expect.slots_include)) {
                if (JSON.stringify(envelope.slots?.[key]) !== JSON.stringify(want)) {
                    fail += 1;
                    failures.push(
                        `${c.id}: slot ${key}: expected ${JSON.stringify(want)}, got ${JSON.stringify(envelope.slots?.[key])}`,
                    );
                    slotOk = false;
                    break;
                }
            }
        }
        if (!slotOk) continue;

        if (c.expect.clarification_question_includes) {
            const needle = c.expect.clarification_question_includes.toLowerCase();
            const haystack = (envelope.clarification_question ?? '').toLowerCase();
            if (!haystack.includes(needle)) {
                fail += 1;
                failures.push(`${c.id}: clarification_question missing "${c.expect.clarification_question_includes}"`);
                continue;
            }
        }

        pass += 1;
    }

    const total = pass + fail;
    const passRate = total > 0 ? pass / total : 0;
    // Soft gate while iterating; will tighten to 0.95 once stable
    const THRESHOLD = 0.75;

    const pct = Math.round(passRate * 100);
    const failureSummary = failures.length ? `\n  ${failures.join('\n  ')}` : '';

    if (passRate < THRESHOLD) {
        exitWith(1, `--live-llm FAIL (${pass}/${total} = ${pct}% < ${Math.round(THRESHOLD * 100)}%)${failureSummary}`);
    } else {
        exitWith(0, `--live-llm PASS (${pass}/${total} = ${pct}%)${failureSummary}`);
    }
}

switch (mode) {
    case '--unit':
        runUnit();
        break;
    case '--mock-llm':
        runMockLlm();
        break;
    case '--live-llm':
        runLiveLlm();
        break;
    default:
        exitWith(2, `Unknown mode ${mode}. Use --unit, --mock-llm, or --live-llm.`);
}
