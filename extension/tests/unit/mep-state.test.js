const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');

const source = readFileSync(resolve(__dirname, '../../utils/mep-state.js'), 'utf8');
const ORIGIN = 'https://www.stage.adobe.com';
const AUTHORED = '4e3e071a-1111-4222-8333-444455556666';
const GROUPED = '369630bd-47aa-4eeb-9660-0fa52158d910';

function load() {
    const posted = [];
    const listeners = {};
    const window = {
        postMessage: (message, targetOrigin) => posted.push({ message, targetOrigin }),
        addEventListener: (type, handler) => {
            listeners[type] = handler;
        },
    };
    runInNewContext(source, { window, location: { origin: ORIGIN } });
    return { window, posted, listeners, MASMepState: window.MASMepState };
}

function messageFrom(window, state, overrides = {}) {
    return {
        source: window,
        origin: ORIGIN,
        data: { source: 'mas-ext-page-bridge', type: 'MEP_STATE', state: JSON.stringify(state) },
        ...overrides,
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('rejects a message from another window', () => {
    const { MASMepState } = load();
    const event = {
        source: {},
        origin: ORIGIN,
        data: { source: 'mas-ext-page-bridge', type: 'MEP_STATE', state: '{"preview":true,"swaps":[]}' },
    };
    assert.equal(MASMepState.parseMepStateMessage(event), null);
});

test('rejects a message from another origin', () => {
    const { window, MASMepState } = load();
    const event = messageFrom(window, { preview: true, swaps: [] }, { origin: 'https://evil.example' });
    assert.equal(MASMepState.parseMepStateMessage(event), null);
});

test('rejects a message with the wrong type', () => {
    const { window, MASMepState } = load();
    const event = messageFrom(window, { preview: true, swaps: [] });
    event.data.type = 'OTHER';
    assert.equal(MASMepState.parseMepStateMessage(event), null);
});

test('a null state message parses to null', () => {
    const { window, MASMepState } = load();
    const event = messageFrom(window, null);
    assert.equal(MASMepState.parseMepStateMessage(event), null);
});

test('malformed state json parses to null', () => {
    const { window, MASMepState } = load();
    const event = messageFrom(window, {});
    event.data.state = '{not json';
    assert.equal(MASMepState.parseMepStateMessage(event), null);
});

test('drops swaps with non-UUID ids and nulls an unsafe manifest name', () => {
    const { window, MASMepState } = load();
    const event = messageFrom(window, {
        preview: true,
        swaps: [
            { authoredId: 'x', field: 'a', replacementId: GROUPED, manifestId: 'a.json' },
            { authoredId: AUTHORED, field: 'b', replacementId: GROUPED, manifestId: '<img src=x>.json' },
        ],
    });
    const state = MASMepState.parseMepStateMessage(event);
    assert.equal(state.swaps.length, 1);
    assert.equal(state.swaps[0].manifestId, null);
});

test('normalizeField strips a trailing bracket suffix', () => {
    const { MASMepState } = load();
    assert.equal(MASMepState.normalizeField('ctas[2u25ddjvjn]'), 'ctas');
    assert.equal(MASMepState.normalizeField('description'), 'description');
});

function stateWith(field, manifestId = null) {
    return { preview: true, swaps: [{ authoredId: AUTHORED, field, replacementId: GROUPED, manifestId }] };
}

test('a bracketed ctas key matches a ctas field', () => {
    const { MASMepState } = load();
    assert.deepEqual(plain(MASMepState.findSwap(stateWith('ctas[2u25ddjvjn]'), { requestedId: GROUPED, field: 'ctas' })), {
        authoredId: AUTHORED,
        manifestId: null,
    });
});

test('findSwap falls back to resolvedId when there is no requestedId', () => {
    const { MASMepState } = load();
    assert.deepEqual(plain(MASMepState.findSwap(stateWith('ctas', 'm.json'), { field: 'ctas', resolvedId: GROUPED })), {
        authoredId: AUTHORED,
        manifestId: 'm.json',
    });
});

test('findSwap returns null when the field differs', () => {
    const { MASMepState } = load();
    assert.equal(MASMepState.findSwap(stateWith('title'), { requestedId: GROUPED, field: 'description' }), null);
});

test('findSwap returns null without a state', () => {
    const { MASMepState } = load();
    assert.equal(MASMepState.findSwap(null, { requestedId: GROUPED, field: 'title' }), null);
});

function fakeRoot(ids) {
    return {
        querySelectorAll: (selector) => {
            assert.equal(selector, 'div.mas-overrides aem-fragment[fragment]');
            return ids.map((id) => ({ getAttribute: () => id }));
        },
    };
}

test('reads MEP replacement ids from the hidden overrides container', () => {
    const { MASMepState } = load();
    assert.deepEqual([...MASMepState.readOverrideIds(fakeRoot([GROUPED]))], [GROUPED]);
});

test('the registered listener stores the latest parsed state', () => {
    const { window, listeners, MASMepState } = load();
    assert.equal(MASMepState.latest(), null);
    listeners.message(messageFrom(window, stateWith('title')));
    assert.equal(MASMepState.latest().swaps.length, 1);
});

test('request posts GET_MEP_STATE to the page origin', () => {
    const { posted, MASMepState } = load();
    MASMepState.request();
    assert.deepEqual(plain(posted), [{ message: { source: 'mas-ext', type: 'GET_MEP_STATE' }, targetOrigin: ORIGIN }]);
});

test('request resolves with the state of the next bridge reply', async () => {
    const { window, listeners, MASMepState } = load();
    const reply = MASMepState.request();
    listeners.message(messageFrom(window, stateWith('description', 'm.json')));
    assert.deepEqual(plain(await reply), stateWith('description', 'm.json'));
});

test('request resolves with null when the bridge replies null', async () => {
    const { window, listeners, MASMepState } = load();
    const reply = MASMepState.request();
    listeners.message(messageFrom(window, null));
    assert.equal(await reply, null);
});

test('request ignores a message that is not a bridge reply', async () => {
    const { window, listeners, MASMepState } = load();
    const reply = MASMepState.request();
    listeners.message(messageFrom(window, { preview: true, swaps: [] }, { origin: 'https://evil.example' }));
    listeners.message(messageFrom(window, stateWith('title')));
    assert.equal((await reply).swaps[0].field, 'title');
});

test('concurrent requests share one pending reply and post once', () => {
    const { posted, MASMepState } = load();
    assert.equal(MASMepState.request(), MASMepState.request());
    assert.equal(posted.length, 1);
});

test('a request after a reply asks the bridge again', async () => {
    const { window, listeners, posted, MASMepState } = load();
    const first = MASMepState.request();
    listeners.message(messageFrom(window, null));
    await first;
    assert.notEqual(MASMepState.request(), first);
    assert.equal(posted.length, 2);
});

test('the reply that settles a request also updates latest', async () => {
    const { window, listeners, MASMepState } = load();
    const reply = MASMepState.request();
    listeners.message(messageFrom(window, stateWith('title')));
    assert.equal(await reply, MASMepState.latest());
});
