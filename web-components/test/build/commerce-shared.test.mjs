import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../../', import.meta.url));
const options = {
    absWorkingDir: root,
    bundle: true,
    format: 'esm',
    write: false,
    metafile: true,
    logLevel: 'silent',
    alias: { react: './test/mocks/react.js' },
};

test('cards access shared modules only through the commerce entry point', async () => {
    const [commerce, card, icon, shared] = await Promise.all([
        build({ ...options, entryPoints: ['./src/commerce.js'] }),
        build({
            ...options,
            entryPoints: ['./src/merch-card.js'],
            external: ['lit', './commerce-shared.js', '../commerce-shared.js'],
        }),
        build({
            ...options,
            entryPoints: ['./src/merch-icon.js'],
            external: ['lit'],
        }),
        build({ ...options, entryPoints: ['./src/commerce-shared.js'] }),
    ]);
    const exportsOf = ({ metafile }) =>
        Object.values(metafile.outputs).flatMap(({ exports }) => exports);
    assert.deepEqual(
        exportsOf(shared).filter((name) => !exportsOf(commerce).includes(name)),
        [],
        'commerce.js must re-export every shared card helper',
    );
    assert.deepEqual(
        Object.keys(card.metafile.inputs).filter(
            (path) => path in commerce.metafile.inputs,
        ),
        [],
    );
    assert(
        !Object.keys(card.metafile.inputs).includes('src/commerce-shared.js'),
    );
    assert(
        !Object.keys(card.metafile.inputs).includes(
            'src/mas-commerce-service.js',
        ),
    );
    assert(
        !Object.keys(icon.metafile.inputs).includes(
            'src/mas-commerce-service.js',
        ),
    );
});

test('the normal mas build rejects missing shared exports with a source diagnostic', async () => {
    const path = new URL('../../src/commerce-shared.js', import.meta.url);
    const contents = readFileSync(path, 'utf8').replace(
        "export { hostOsi } from './plan-type-text.js';",
        '',
    );
    await assert.rejects(
        build({
            ...options,
            entryPoints: ['./src/mas.js'],
            plugins: [
                {
                    name: 'missing-shared-export',
                    setup(builder) {
                        builder.onLoad(
                            { filter: /\/commerce-shared\.js$/ },
                            () => ({
                                contents,
                                resolveDir: fileURLToPath(
                                    new URL('../../src/', import.meta.url),
                                ),
                            }),
                        );
                    },
                },
            ],
        }),
        /No matching export in "src\/commerce-shared.js" for import "hostOsi"/,
    );
});
