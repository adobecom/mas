import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import {
    assertNoSharedModules,
    createSharedCommerce,
} from '../../build/shared-commerce.mjs';

async function fixture(t, files) {
    const root = await mkdtemp(join(tmpdir(), 'mas-shared-commerce-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    for (const [name, contents] of Object.entries({
        'package.json': '{"type":"module"}',
        ...files,
    })) {
        const path = join(root, name);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, contents);
    }
    return root;
}

async function bundle(root, modules, options = {}) {
    const shared = createSharedCommerce({
        resolveDir: root,
        entryPoint: './commerce.js',
        modules,
    });
    const defaults = {
        absWorkingDir: root,
        bundle: true,
        format: 'esm',
        metafile: true,
        write: false,
        logLevel: 'silent',
        ...options,
    };
    const commerce = await build({
        ...defaults,
        stdin: shared.entry,
        outfile: './dist/commerce.js',
    });
    const card = await build({
        ...defaults,
        entryPoints: ['./card.js'],
        outfile: './dist/merch-card.js',
        plugins: [shared.plugin],
    });
    assertNoSharedModules(commerce.metafile, card.metafile);
    for (const file of [...commerce.outputFiles, ...card.outputFiles]) {
        await mkdir(dirname(file.path), { recursive: true });
        await writeFile(file.path, file.contents);
    }
    return {
        commerce,
        card,
        loadCommerce: () =>
            import(pathToFileURL(join(root, 'dist/commerce.js'))),
        loadCard: () => import(pathToFileURL(join(root, 'dist/merch-card.js'))),
    };
}

test('preserves source identity for same-named helpers without another chunk', async (t) => {
    const root = await fixture(t, {
        'commerce.js': 'export const publicApi = "unchanged";',
        'utils.js': 'export const getService = () => "utils";',
        'utilities.js': 'export const getService = () => "utilities";',
        'card.js': `
            import { getService as first } from "./utils.js";
            import { getService as second } from "./utilities.js";
            export const services = [first(), second()];
        `,
    });
    const result = await bundle(root, {
        utils: { source: './utils.js', exports: ['getService'] },
        utilities: { source: './utilities.js', exports: ['getService'] },
    });
    const [commerce, card] = await Promise.all([
        result.loadCommerce(),
        result.loadCard(),
    ]);
    assert.equal(commerce.publicApi, 'unchanged');
    assert.deepEqual(card.services, ['utils', 'utilities']);
    assert.deepEqual(Object.keys(result.commerce.metafile.outputs), [
        'dist/commerce.js',
    ]);
    assert.deepEqual(Object.keys(result.card.metafile.outputs), [
        'dist/merch-card.js',
    ]);
    assert.deepEqual(
        [
            ...new Set(
                result.card.metafile.outputs['dist/merch-card.js'].imports.map(
                    ({ path }) => path,
                ),
            ),
        ],
        ['./commerce.js'],
    );
});

test('shares mutable state, live bindings and initialization between both bundles', async (t) => {
    const root = await fixture(t, {
        'commerce.js': `
            export { state, count, increment } from "./state.js";
        `,
        'state.js': `
            globalThis.masSharedInitializations = (globalThis.masSharedInitializations ?? 0) + 1;
            export const state = { appenders: new Set() };
            export let count = 0;
            export function increment() {
                count++;
                for (const append of state.appenders) append(count);
            }
        `,
        'card.js': `
            import { state, count, increment } from "./state.js";
            export { state, count, increment };
        `,
    });
    t.after(() => delete globalThis.masSharedInitializations);
    const result = await bundle(root, {
        state: {
            source: './state.js',
            exports: ['state', 'count', 'increment'],
        },
    });
    const commerce = await result.loadCommerce();
    const card = await result.loadCard();
    const entries = [];
    commerce.state.appenders.add((value) => entries.push(value));
    card.increment();
    assert.equal(card.state, commerce.state);
    assert.equal(card.increment, commerce.increment);
    assert.equal(card.count, 1);
    assert.equal(commerce.count, 1);
    assert.deepEqual(entries, [1]);
    assert.equal(globalThis.masSharedInitializations, 1);
});

for (const [label, statement, missing] of [
    [
        'named import',
        'import { missing } from "./shared.js"; console.log(missing);',
        'missing',
    ],
    [
        'default import',
        'import missing from "./shared.js"; console.log(missing);',
        'default',
    ],
    [
        'namespace member',
        'import * as shared from "./shared.js"; console.log(shared.missing);',
        'missing',
    ],
    ['re-export', 'export { missing } from "./shared.js";', 'missing'],
]) {
    test(`rejects a ${label} outside its source boundary`, async (t) => {
        const root = await fixture(t, {
            'commerce.js': '',
            'shared.js': 'export const allowed = 1; export const missing = 2;',
            'card.js': statement,
        });
        await assert.rejects(
            bundle(root, {
                shared: { source: './shared.js', exports: ['allowed'] },
            }),
            (error) =>
                error.errors.some(
                    ({ text }) =>
                        text.includes(missing) && /export/i.test(text),
                ),
        );
    });
}

test('validates that declared boundary exports exist in their original module', async (t) => {
    const root = await fixture(t, {
        'commerce.js': '',
        'shared.js': 'export const allowed = 1;',
        'card.js': '',
    });
    await assert.rejects(
        bundle(root, {
            shared: { source: './shared.js', exports: ['missing'] },
        }),
        /No matching export in "shared.js" for import "missing"/,
    );
});

test('supports default, namespace and re-export bindings in minified sourcemap builds', async (t) => {
    const root = await fixture(t, {
        'commerce.js': '',
        'shared.js': 'export default "default"; export const named = "named";',
        'card.js': `
            import * as shared from "./shared.js";
            export { default as defaultValue } from "./shared.js";
            export const named = shared.named;
        `,
    });
    const result = await bundle(
        root,
        { shared: { source: './shared.js', exports: ['default', 'named'] } },
        { minify: true, sourcemap: true },
    );
    const card = await result.loadCard();
    assert.equal(card.defaultValue, 'default');
    assert.equal(card.named, 'named');
});

test('retains side-effect-only imports outside the declared boundary', async (t) => {
    const root = await fixture(t, {
        'commerce.js': '',
        'shared.js': 'export const shared = 1;',
        'card-effects.js': 'globalThis.masCardEffects = "ran";',
        'card.js':
            'import "./card-effects.js"; export { shared } from "./shared.js";',
    });
    t.after(() => delete globalThis.masCardEffects);
    const result = await bundle(root, {
        shared: { source: './shared.js', exports: ['shared'] },
    });
    await result.loadCard();
    assert.equal(globalThis.masCardEffects, 'ran');
    assert(
        result.card.metafile.outputs['dist/merch-card.js'].inputs[
            'card-effects.js'
        ].bytesInOutput > 0,
    );
});

test('rejects shared code that bypasses the boundary instead of silently duplicating it', async (t) => {
    const root = await fixture(t, {
        'commerce.js': 'export { state } from "./shared.js";',
        'shared.js': 'export const state = {};',
        'card.js': 'export { state } from "./shared.js";',
    });
    await assert.rejects(
        bundle(root, {}),
        /Modules bundled in both commerce.js and merch-card.js: shared.js/,
    );
});

test('does not mistake a fully tree-shaken input for duplicated code', async (t) => {
    const root = await fixture(t, {
        'commerce.js':
            'import { unused } from "./shared.js"; export const api = true;',
        'shared.js': 'export const unused = {};',
        'card.js': 'export { unused } from "./shared.js";',
    });
    const result = await bundle(root, {});
    assert('shared.js' in result.commerce.metafile.inputs);
    assert.equal((await result.loadCommerce()).api, true);
    assert.deepEqual((await result.loadCard()).unused, {});
});

test('builds current bundles for browser integration tests', () => {
    execFileSync(process.execPath, ['build.mjs'], {
        cwd: new URL('../../', import.meta.url),
        stdio: 'pipe',
    });
});
