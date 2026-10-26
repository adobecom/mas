const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createContext, runInContext } = require('node:vm');

const POPUP = readFileSync(resolve(__dirname, '../../popup/popup.js'), 'utf8');
const ADOBE_TAB = { id: 1, url: 'https://www.stage.adobe.com/' };

function fakeElement() {
    return {
        value: '',
        textContent: '',
        hidden: false,
        checked: false,
        style: {},
        addEventListener: () => {},
        querySelectorAll: () => [],
    };
}

// Runs popup.js against a fake popup DOM; reply decides what the tab's content script answers.
async function openPopup({ tab = ADOBE_TAB, reply }) {
    const elements = new Map();
    const element = (key) => {
        if (!elements.has(key)) elements.set(key, fakeElement());
        return elements.get(key);
    };
    const chrome = {
        runtime: { lastError: undefined },
        storage: { local: { get: (keys, callback) => callback({}) } },
        tabs: {
            query: async () => [tab],
            sendMessage: (tabId, message, callback) => {
                const { lastError, response } = reply(message);
                chrome.runtime.lastError = lastError;
                callback?.(response);
                chrome.runtime.lastError = undefined;
            },
        },
    };
    const sandbox = {
        chrome,
        console,
        URL,
        setTimeout: (callback) => callback(),
        document: {
            readyState: 'complete',
            getElementById: element,
            querySelector: element,
            querySelectorAll: () => [],
        },
        MASPageTraceView: { bindPageTrace: () => ({ refresh: () => {} }) },
    };
    sandbox.window = sandbox;
    runInContext(POPUP, createContext(sandbox), { filename: 'popup.js' });
    for (let tick = 0; tick < 10; tick++) await new Promise(setImmediate);
    return { hint: element('#noCards .hint').textContent, noCards: element('noCards').style.display };
}

const UNREACHABLE = { lastError: { message: 'Could not establish connection. Receiving end does not exist.' } };

test('a tab whose page script is gone asks for a tab reload', async () => {
    const popup = await openPopup({ reply: () => UNREACHABLE });
    assert.deepEqual(
        [popup.noCards, popup.hint],
        ['block', "Can't reach this page. If you just reloaded the extension, reload this tab and reopen this popup."],
    );
});

test('a non-Adobe tab still asks for an Adobe page', async () => {
    const popup = await openPopup({ tab: { id: 2, url: 'https://example.com/' }, reply: () => UNREACHABLE });
    assert.equal(
        popup.hint,
        'Open an Adobe page with merch cards (e.g. adobe.com/creativecloud/plans.html) and reopen this popup.',
    );
});
