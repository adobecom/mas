import assert from 'node:assert/strict';
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

test('cards share helper modules while constants and standalone components stay direct', async () => {
    const shared = [
        'utils',
        'utilities',
        'mas-element',
        'upt-link',
        'image-markup',
        'plan-type-text',
        'mas-context',
        'log',
    ];
    const [commerce, card, icon] = await Promise.all([
        build({ ...options, entryPoints: ['./src/commerce.js'] }),
        build({
            ...options,
            entryPoints: ['./src/merch-card.js'],
            external: [
                'lit',
                ...shared.flatMap((name) =>
                    ['.', '..'].flatMap((prefix) => [
                        `${prefix}/${name}`,
                        `${prefix}/${name}.js`,
                    ]),
                ),
            ],
        }),
        build({
            ...options,
            entryPoints: ['./src/merch-icon.js'],
            external: ['lit'],
        }),
    ]);
    assert.deepEqual(
        Object.keys(card.metafile.inputs).filter(
            (path) =>
                path in commerce.metafile.inputs &&
                !path.endsWith('/constants.js'),
        ),
        [],
    );
    assert('src/constants.js' in card.metafile.inputs);
    assert('src/utils.js' in icon.metafile.inputs);
    assert(!('src/mas-commerce-service.js' in card.metafile.inputs));
    assert(!('src/upt-link.js' in icon.metafile.inputs));
    assert(!('src/plan-type-text.js' in icon.metafile.inputs));
});

test('built cards link against commerce and reject missing exports', async () => {
    const card = {
        ...options,
        entryPoints: ['./dist/merch-card.js'],
        external: ['./lit-all.min.js'],
    };
    await build(card);
    await assert.rejects(
        build({
            ...card,
            plugins: [
                {
                    name: 'missing-commerce-exports',
                    setup(builder) {
                        builder.onLoad({ filter: /\/commerce\.js$/ }, () => ({
                            contents: 'export {};',
                        }));
                    },
                },
            ],
        }),
        /No matching export in "dist\/commerce.js" for import/,
    );
});
