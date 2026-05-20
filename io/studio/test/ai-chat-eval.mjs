#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { INTENTS, FLOWS, META_INTENTS } from '../src/ai-chat/intent-registry.js';
import { validateEnvelope } from '../src/ai-chat/envelope-validator.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const CASES_PATH = join(currentDir, '../src/ai-chat/intent-registry.cases.json');

const mode = process.argv[2] || '--unit';

function exitWith(code, msg) {
    console.log(msg);
    process.exit(code);
}

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
    }

    if (failures.length) {
        exitWith(1, `--unit FAIL\n  ${failures.join('\n  ')}`);
        return;
    }
    exitWith(0, `--unit PASS (${cases.length} cases, ${INTENTS.length} intents, ${FLOWS.length} flows)`);
}

function expectedEnvelopeFromCase(c) {
    return {
        intent: c.expect.intent,
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

    for (const c of cases) {
        const mockEnvelope = expectedEnvelopeFromCase(c);
        const result = validateEnvelope(mockEnvelope, c.context || {});

        const expectedIntent = c.expect.intent;

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

    if (failures.length) {
        exitWith(1, `--mock-llm FAIL (${failures.length} of ${cases.length} cases):\n  ${failures.join('\n  ')}`);
        return;
    }
    exitWith(0, `--mock-llm PASS (${cases.length} cases)`);
}

switch (mode) {
    case '--unit':
        runUnit();
        break;
    case '--mock-llm':
        runMockLlm();
        break;
    case '--live-llm':
        exitWith(2, '--live-llm not implemented yet (Stage 3)');
        break;
    default:
        exitWith(2, `Unknown mode ${mode}. Use --unit, --mock-llm, or --live-llm.`);
}
