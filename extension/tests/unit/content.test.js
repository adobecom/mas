const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createContext, runInContext } = require('node:vm');

const F = require('./fixtures/homepage-cc-lapsed.js');

const SCRIPTS = ['content/sources.js', 'content/content.js'];
const FRAGMENT = { id: F.AUTHORED_RESOLVED, fields: { cardTitle: 'CC Pro' } };

const flush = () => new Promise(setImmediate);

function badge(overlayId) {
    return {
        fragmentId: overlayId,
        sourceFragmentId: F.AUTHORED_RESOLVED,
        elementType: 'field',
        locale: 'en_US',
        country: 'US',
    };
}

// stored is what chrome.storage.local holds; it is read once the detector callback is registered.
function loadContent({ response = { success: true, data: FRAGMENT }, stored = null } = {}) {
    const messages = [];
    const named = [];
    const outlined = [];
    const detectedCallbacks = [];
    const messageListeners = [];
    const sandbox = {
        location: { origin: F.ORIGIN, pathname: '/' },
        document: { readyState: 'complete' },
        addEventListener: () => {},
        requestAnimationFrame: () => {},
        setTimeout: () => {},
        chrome: {
            runtime: {
                sendMessage(message, callback) {
                    messages.push(message);
                    callback(response);
                },
                onMessage: { addListener: (listener) => messageListeners.push(listener) },
            },
            storage: { local: { get: (keys, callback) => stored && callback(stored) } },
        },
        MASMepState: { request: () => {} },
        MASCardDetector: {
            onCardDetected: (callback) => detectedCallbacks.push(callback),
            initialize: () => {},
            getServiceConfig: () => ({}),
            updateCardName: (overlayId, cardName) => named.push([overlayId, cardName]),
        },
        MASCardOverlay: {
            createBadge: () => ({ style: {} }),
            updateCardNameInPanel: () => {},
            updateBadgeVariant: () => {},
            hide: () => {},
        },
        MASSourceOutlines: {
            enable: () => Promise.resolve(),
            disable: () => {},
            outline: (overlayId) => {
                outlined.push(overlayId);
                return Promise.resolve();
            },
        },
    };
    sandbox.window = sandbox;
    const context = createContext(sandbox);
    for (const file of SCRIPTS) {
        runInContext(readFileSync(resolve(__dirname, '../..', file), 'utf8'), context, { filename: file });
    }
    const detect = (cardData) => detectedCallbacks.forEach((callback) => callback(cardData));
    const send = (message) => messageListeners.forEach((listener) => listener(message, {}, () => {}));
    return { detect, send, messages, named, outlined, sources: sandbox.MASSources };
}

test('two badges for the same source fragment send one FETCH_FRAGMENT_DATA', async () => {
    const { detect, messages } = loadContent();
    detect(badge('field-1'));
    detect(badge('field-2'));
    await flush();
    assert.equal(messages.filter(({ type }) => type === 'FETCH_FRAGMENT_DATA').length, 1);
});

test('two badges for the same source fragment spend one budget unit', async () => {
    const { detect, sources } = loadContent();
    detect(badge('field-1'));
    detect(badge('field-2'));
    await flush();
    assert.deepEqual([sources.consumeBudget(49), sources.consumeBudget()], [true, false]);
});

test('each badge sharing the fetch still gets the card name', async () => {
    const { detect, named } = loadContent();
    detect(badge('field-1'));
    detect(badge('field-2'));
    await flush();
    assert.deepEqual(named, [
        ['field-1', 'CC Pro'],
        ['field-2', 'CC Pro'],
    ]);
});

test('a failed card-name fetch leaves the badge unnamed', async () => {
    const { detect, named } = loadContent({ response: { success: false, error: 'fetch_failed' } });
    detect(badge('field-1'));
    await flush();
    assert.deepEqual(named, []);
});

test('a card detected after Show sources is turned on gets outlined', () => {
    const { detect, send, outlined } = loadContent();
    send({ type: 'SET_SOURCE_OUTLINES', enabled: true });
    detect(badge('field-1'));
    assert.deepEqual(outlined, ['field-1']);
});

test('a persisted Show sources outlines cards detected after page load', () => {
    const { detect, outlined } = loadContent({ stored: { masShowSources: true } });
    detect(badge('field-1'));
    assert.deepEqual(outlined, ['field-1']);
});

test('a card detected while Show sources is off is not outlined', () => {
    const { detect, send, outlined } = loadContent({ stored: { masShowSources: true } });
    send({ type: 'SET_SOURCE_OUTLINES', enabled: false });
    detect(badge('field-1'));
    assert.deepEqual(outlined, []);
});

test('turning the extension off stops outlining newly detected cards', () => {
    const { detect, send, outlined } = loadContent({ stored: { masShowSources: true } });
    send({ type: 'SET_EXTENSION_ENABLED', enabled: false });
    detect(badge('field-1'));
    assert.deepEqual(outlined, []);
});
