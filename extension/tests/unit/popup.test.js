const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createContext, runInContext } = require('node:vm');

const POPUP_HTML = readFileSync(resolve(__dirname, '../../popup/popup.html'), 'utf8');
const PARSER_SCRIPTS = [...POPUP_HTML.matchAll(/<script src="\.\.\/(utils\/(?:locales|fragment-parser)\.js)">/g)].map(
    ([, src]) => src,
);
const POPUP = readFileSync(resolve(__dirname, '../../popup/popup.js'), 'utf8');
const ADOBE_TAB = { id: 1, url: 'https://www.stage.adobe.com/' };

function fakeElement() {
    const listeners = {};
    return {
        value: '',
        textContent: '',
        hidden: false,
        checked: false,
        style: {},
        addEventListener: (type, listener) => {
            listeners[type] = listener;
        },
        dispatch: (type, event) => listeners[type](event),
        querySelectorAll: () => [],
    };
}

// Runs popup.js against a fake popup DOM; reply decides what the tab's content script answers.
async function openPopup({ tab = ADOBE_TAB, tabs = [tab], reply, stored = {}, unreachableTabs = [] }) {
    const elements = new Map();
    const messages = [];
    const element = (key) => {
        if (!elements.has(key)) elements.set(key, fakeElement());
        return elements.get(key);
    };
    const chrome = {
        runtime: { lastError: undefined },
        storage: {
            local: {
                get: (keys, callback) => callback(stored),
                set: async (value) => Object.assign(stored, value),
            },
        },
        tabs: {
            query: async (query) => (query.active ? [tab] : tabs),
            sendMessage: (tabId, message, callback) => {
                messages.push({ tabId, message });
                if (unreachableTabs.includes(tabId)) {
                    return Promise.reject(new Error('Could not establish connection. Receiving end does not exist.'));
                }
                const { lastError, response } = reply(message);
                chrome.runtime.lastError = lastError;
                callback?.(response);
                chrome.runtime.lastError = undefined;
                return Promise.resolve(response);
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
            createElement: () => ({
                set textContent(value) {
                    this.innerHTML = value;
                },
            }),
            querySelector: element,
            querySelectorAll: () => [],
        },
        MASPageTraceView: { bindPageTrace: () => ({ refresh: () => {} }) },
        MASSourceLegend: require('../../utils/source-legend.js'),
    };
    sandbox.window = sandbox;
    const context = createContext(sandbox);
    for (const src of PARSER_SCRIPTS) {
        runInContext(readFileSync(resolve(__dirname, '../..', src), 'utf8'), context, { filename: src });
    }
    runInContext(POPUP, context, { filename: 'popup.js' });
    for (let tick = 0; tick < 10; tick++) await new Promise(setImmediate);
    return {
        sandbox,
        details: element('.card-item-details[data-fragment-id="f1"] .card-details-content'),
        hint: element('#noCards .hint').textContent,
        noCards: element('noCards').style.display,
        legend: element('sourcesLegend'),
        sourcesToggle: element('sourcesToggle'),
        messages,
    };
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

const NO_CARDS = { response: { success: true, cards: [] } };

test('the color key stays hidden while Show sources is off', async () => {
    const { legend } = await openPopup({ reply: () => NO_CARDS });
    assert.equal(legend.hidden, true);
});

test('the color key shows, open, while Show sources is on', async () => {
    const { legend } = await openPopup({ reply: () => NO_CARDS, stored: { masShowSources: true } });
    assert.deepEqual([legend.hidden, legend.innerHTML.startsWith('<details class="mas-ext-legend" open>')], [false, true]);
});

for (const enabled of [false, true]) {
    test(`toggling the global Show sources preference ${enabled ? 'on' : 'off'} updates every open tab`, async () => {
        const stored = { masShowSources: !enabled };
        const popup = await openPopup({ tabs: [ADOBE_TAB, { id: 2 }], reply: () => NO_CARDS, stored });

        popup.sourcesToggle.dispatch('change', { target: { checked: enabled } });
        for (let tick = 0; tick < 10; tick++) await new Promise(setImmediate);

        assert.deepEqual(
            JSON.parse(JSON.stringify(popup.messages.filter(({ message }) => message.type === 'SET_SOURCE_OUTLINES'))),
            [
                { tabId: 1, message: { type: 'SET_SOURCE_OUTLINES', enabled } },
                { tabId: 2, message: { type: 'SET_SOURCE_OUTLINES', enabled } },
            ],
        );
        assert.equal(stored.masShowSources, enabled);
        assert.equal(popup.legend.hidden, !enabled);
    });
}

test('toggling Show sources still updates the other tabs when one tab has no content script', async () => {
    const rejections = [];
    const onRejection = (reason) => rejections.push(reason);
    process.on('unhandledRejection', onRejection);
    try {
        const popup = await openPopup({ tabs: [ADOBE_TAB, { id: 2 }, { id: 3 }], reply: () => NO_CARDS, unreachableTabs: [2] });

        popup.sourcesToggle.dispatch('change', { target: { checked: true } });
        for (let tick = 0; tick < 10; tick++) await new Promise(setImmediate);

        assert.deepEqual(
            popup.messages.filter(({ message }) => message.type === 'SET_SOURCE_OUTLINES').map(({ tabId }) => tabId),
            [1, 2, 3],
        );
        assert.deepEqual(rejections, []);
    } finally {
        process.off('unhandledRejection', onRejection);
    }
});

test('card details render the variation section of a grouped variation', async () => {
    const { sandbox, details } = await openPopup({ reply: () => NO_CARDS });
    sandbox.renderCardDetails('f1', { path: '/content/dam/mas/acom/en_US/ccsn/pzn/cc-lapsed', fields: {} });
    assert.match(details.innerHTML, /<span class="variation-type [^"]*">Grouped/);
});
