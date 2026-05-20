#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { INTENTS, FLOWS, META_INTENTS } from '../src/ai-chat/intent-registry.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const CASES_PATH = join(currentDir, '../src/ai-chat/intent-registry.cases.json');

const mode = process.argv[2] || '--unit';

function exitWith(code, msg) {
    console.log(msg);
    process.exit(code);
}

function runUnit() {
    const failures = [];
    const knownNames = new Set([...INTENTS.map((i) => i.name), ...META_INTENTS]);
    const cases = JSON.parse(readFileSync(CASES_PATH, 'utf8')).cases;

    for (const c of cases) {
        if (!knownNames.has(c.intent_under_test))
            failures.push(`case ${c.id}: intent_under_test ${c.intent_under_test} not in registry`);
        if (!c.user_message) failures.push(`case ${c.id}: missing user_message`);
        if (!c.expect) failures.push(`case ${c.id}: missing expect`);
    }

    if (failures.length) exitWith(1, `--unit FAIL\n  ${failures.join('\n  ')}`);
    exitWith(0, `--unit PASS (${cases.length} cases, ${INTENTS.length} intents, ${FLOWS.length} flows)`);
}

switch (mode) {
    case '--unit':
        runUnit();
        break;
    case '--mock-llm':
        exitWith(2, '--mock-llm not implemented yet (Stage 2)');
        break;
    case '--live-llm':
        exitWith(2, '--live-llm not implemented yet (Stage 3)');
        break;
    default:
        exitWith(2, `Unknown mode ${mode}. Use --unit, --mock-llm, or --live-llm.`);
}
