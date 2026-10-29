const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { findMiloUtilsUrl, serializeMepState } = require('../../content/page-bridge.js');

const bridgeSource = readFileSync(resolve(__dirname, '../../content/page-bridge.js'), 'utf8');

// Runs the bridge in a page world at pathname, with whatever extra page globals are given.
function runInPage(pathname, globals = {}) {
    const listeners = [];
    const posted = [];
    const window = {
        addEventListener: (type, listener) => listeners.push(listener),
        postMessage: (message) => posted.push(message),
    };
    runInNewContext(bridgeSource, {
        window,
        document: {},
        location: { origin: 'https://www.adobe.com', pathname },
        performance: { getEntriesByType: () => [] },
        ...globals,
    });
    return { listeners, posted };
}

const AUTHORED = '4e3e071a-1111-4222-8333-444455556666';
const GROUPED = '369630bd-47aa-4eeb-9660-0fa52158d910';

test('finds the loaded Milo utils module among resource entries', () => {
    assert.equal(
        findMiloUtilsUrl([
            'https://www.stage.adobe.com/libs/blocks/merch/merch.js',
            'https://www.stage.adobe.com/libs/utils/utils.js',
        ]),
        'https://www.stage.adobe.com/libs/utils/utils.js',
    );
});

test('finds the Milo utils module when it carries a query string', () => {
    assert.equal(
        findMiloUtilsUrl(['https://www.stage.adobe.com/libs/utils/utils.js?v=1']),
        'https://www.stage.adobe.com/libs/utils/utils.js?v=1',
    );
});

test('no Milo on the page yields no utils url', () => {
    assert.equal(findMiloUtilsUrl(['https://example.com/app.js']), null);
});

test('serializes per-field MEP swaps from the live homepage shape', () => {
    const cfg = {
        mep: {
            preview: true,
            inBlock: {
                mas: {
                    fragments: {
                        [AUTHORED]: {
                            description: {
                                action: 'replace',
                                content: GROUPED,
                                manifestId: 'hp-09-21-26-mas-implementation-pzn.json',
                            },
                            'ctas[2u25ddjvjn]': { action: 'replace', content: GROUPED, manifestId: false },
                        },
                    },
                },
            },
        },
    };
    const state = serializeMepState(cfg);
    assert.equal(state.preview, true);
    assert.deepEqual(state.swaps, [
        {
            authoredId: AUTHORED,
            field: 'description',
            replacementId: GROUPED,
            manifestId: 'hp-09-21-26-mas-implementation-pzn.json',
        },
        { authoredId: AUTHORED, field: 'ctas[2u25ddjvjn]', replacementId: GROUPED, manifestId: null },
    ]);
});

test('keeps only replace actions', () => {
    const cfg = {
        mep: {
            preview: false,
            inBlock: {
                mas: { fragments: { [AUTHORED]: { title: { action: 'remove', content: GROUPED, manifestId: 'a.json' } } } },
            },
        },
    };
    assert.deepEqual(serializeMepState(cfg).swaps, []);
});

test('a config without mep serializes to an empty, non-preview state', () => {
    assert.deepEqual(serializeMepState({}), { preview: false, swaps: [] });
});

test('on a page the bridge listens for requests and posts its state', async () => {
    const { listeners, posted } = runInPage('/creativecloud.html');
    await new Promise(setImmediate);
    assert.equal(listeners.length, 1);
    assert.deepEqual(
        posted.map(({ type, state }) => [type, state]),
        [['MEP_STATE', 'null']],
    );
});

test('on Studio the bridge neither listens nor posts', async () => {
    const { listeners, posted } = runInPage('/studio.html');
    await new Promise(setImmediate);
    assert.deepEqual([listeners.length, posted.length], [0, 0]);
});

test('a page global named module is never written', () => {
    const pageModule = { exports: { page: true } };
    runInPage('/', { module: pageModule });
    assert.deepEqual(pageModule.exports, { page: true });
});
