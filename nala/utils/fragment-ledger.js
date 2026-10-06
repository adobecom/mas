import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getCurrentRunId } from './fragment-tracker.js';

const activeCreations = new Set();

function ledgerDirectory() {
    const runId = getCurrentRunId();
    if (!runId) throw new Error('Fragment ledger requires NALA_RUN_ID');
    if (!/^nala-run-[a-z0-9-]+$/.test(runId)) throw new Error('Invalid NALA_RUN_ID for fragment ledger');
    return resolve('nala/.runs', runId);
}

function writeEntry(name, entry) {
    writeFileSync(join(ledgerDirectory(), `${name}.json`), JSON.stringify({ runId: getCurrentRunId(), ...entry }));
}

/**
 * Keep run-owned data outside Playwright's automatically cleared output directory.
 */
export function initializeFragmentLedger() {
    mkdirSync(ledgerDirectory(), { recursive: true });
    activeCreations.clear();
    writeEntry('run', { type: 'run' });
}

/**
 * Persist creation intent before the UI writes, including failed/interrupted attempts.
 */
export function beginFragmentCreation(kind) {
    const token = randomUUID();
    writeEntry(token, { type: 'creation', kind, complete: false });
    activeCreations.add(token);
    return token;
}

/**
 * Record only fragments carrying this execution's ownership marker.
 */
export function recordCreatedFragment(fragment) {
    if (!fragment.id || !fragment.title?.includes(getCurrentRunId()) || !fragment.path?.startsWith('/content/dam/mas/')) {
        throw new Error(`Cannot register fragment not owned by this Nala run: ${fragment.id}`);
    }
    writeEntry(`fragment-${fragment.id}`, {
        type: 'fragment',
        id: fragment.id,
        path: fragment.path,
        title: fragment.title,
    });
}

export function finishFragmentCreation(token, fragment) {
    recordCreatedFragment(fragment);
    writeEntry(token, { type: 'creation', complete: true, id: fragment.id });
    activeCreations.delete(token);
    return fragment.id;
}

/**
 * Finish a creation using the editor's authoritative ID, not a broad card selector.
 */
export async function completeFragmentCreation(token, page, selector = 'mas-repository', property = 'fragmentInEdit') {
    await page.waitForFunction(
        ({ selector, property, runId }) => {
            const fragment = document.querySelector(selector)?.[property];
            if (!fragment?.id || !fragment.title?.includes(runId)) return false;
            return (
                selector !== 'mas-repository' || fragment.id === new URLSearchParams(location.hash.slice(1)).get('fragmentId')
            );
        },
        { selector, property, runId: getCurrentRunId() },
    );
    const fragment = await page.evaluate(
        ({ selector, property }) => {
            const { id, path, title } = document.querySelector(selector)[property];
            return { id, path, title };
        },
        { selector, property },
    );
    return finishFragmentCreation(token, fragment);
}

/**
 * Read independent entries written by workers without shared-file write races.
 */
export function readFragmentLedger() {
    const directory = ledgerDirectory();
    if (!existsSync(directory)) return { fragments: [], recover: true };
    const entries = readdirSync(directory)
        .filter((name) => name.endsWith('.json'))
        .map((name) => JSON.parse(readFileSync(join(directory, name), 'utf8')));
    if (entries.some((entry) => entry.runId !== getCurrentRunId())) throw new Error('Fragment ledger belongs to another run');
    return {
        fragments: entries.filter((entry) => entry.type === 'fragment'),
        recover: entries.some((entry) => entry.type === 'creation' && !entry.complete),
    };
}

export function completeFragmentLedger() {
    readFragmentLedger();
    for (const name of readdirSync(ledgerDirectory())) {
        if (name !== 'run.json' && name.endsWith('.json')) unlinkSync(join(ledgerDirectory(), name));
    }
    writeEntry('run', { type: 'run', complete: true });
}

/**
 * Capture run-owned fragments as soon as live author responses expose them,
 * even if later UI assertions fail before a creation helper returns.
 */
export function trackFragmentResponses(page) {
    const pending = [];
    const errors = [];
    const listener = (response) => {
        const request = response.request();
        const url = new URL(request.url());
        if (
            !activeCreations.size ||
            !url.hostname.endsWith('.adobeaemcloud.com') ||
            !/^\/adobe\/sites\/cf\/fragments(?:\/[a-f0-9-]+)?$/.test(url.pathname) ||
            ![200, 201].includes(response.status()) ||
            !response.headers()['content-type']?.includes('json')
        ) {
            return;
        }
        pending.push(
            (async () => {
                const payload = await response.json();
                for (const fragment of payload.items ?? [payload]) {
                    if (fragment.id && fragment.path && fragment.title?.includes(getCurrentRunId()))
                        recordCreatedFragment(fragment);
                }
            })().catch((error) => errors.push(error)),
        );
    };
    page.on('response', listener);
    return async () => {
        page.removeListener('response', listener);
        await Promise.all(pending);
        activeCreations.clear();
        if (errors.length) throw new AggregateError(errors, 'Failed to persist created fragments');
    };
}
