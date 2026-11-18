import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const options = {
    absWorkingDir: root,
    bundle: true,
    format: 'esm',
    write: false,
    metafile: true,
    logLevel: 'silent',
    alias: { react: './test/mocks/react.js' },
};

test('explicit commerce imports isolate shared state and standalone components', async () => {
    const [commerce, card, icon] = await Promise.all([
        build({ ...options, entryPoints: ['./src/commerce.js'] }),
        build({
            ...options,
            entryPoints: ['./src/merch-card.js'],
            external: ['lit', './commerce.js', '../commerce.js'],
        }),
        build({
            ...options,
            entryPoints: ['./src/merch-icon.js'],
            external: ['lit'],
        }),
    ]);
    const emittedInputs = ({ metafile }) =>
        Object.values(metafile.outputs).flatMap(({ inputs }) =>
            Object.keys(inputs).filter(
                (path) => inputs[path].bytesInOutput > 0,
            ),
        );
    const cardInputs = emittedInputs(card);
    const commerceInputs = emittedInputs(commerce);
    // utils.js contributes disjoint, tree-shaken functions to these bundles.
    assert.deepEqual(
        cardInputs.filter(
            (path) =>
                commerceInputs.includes(path) &&
                !path.endsWith('/constants.js') &&
                path !== 'src/utils.js',
        ),
        [],
    );
    for (const { exports } of Object.values(commerce.metafile.outputs)) {
        for (const name of exports) {
            assert.doesNotMatch(
                card.outputFiles[0].text,
                new RegExp(`\\bfunction ${name}(?:[0-9]+)?\\(`),
                `${name} must be imported from commerce, not copied into cards`,
            );
        }
    }
    assert.doesNotMatch(commerce.outputFiles[0].text, /\bforegroundTimers\b/);
    assert('src/constants.js' in card.metafile.inputs);
    assert('src/utils.js' in icon.metafile.inputs);
    assert(!('src/mas-commerce-service.js' in card.metafile.inputs));
    assert(!('src/upt-link.js' in icon.metafile.inputs));
    assert(!('src/plan-type-text.js' in icon.metafile.inputs));
});

test('the normal mas build rejects missing explicit commerce exports', async () => {
    const contents = readFileSync(
        new URL('../src/commerce.js', import.meta.url),
        'utf8',
    ).replace("export { hostOsi } from './plan-type-text.js';", '');
    await build({ ...options, entryPoints: ['./src/mas.js'] });
    await assert.rejects(
        build({
            ...options,
            entryPoints: ['./src/mas.js'],
            plugins: [
                {
                    name: 'missing-commerce-export',
                    setup(builder) {
                        builder.onLoad({ filter: /\/commerce\.js$/ }, () => ({
                            contents,
                            resolveDir: fileURLToPath(
                                new URL('../src/', import.meta.url),
                            ),
                        }));
                    },
                },
            ],
        }),
        /No matching export in "src\/commerce.js" for import "hostOsi"/,
    );
});
